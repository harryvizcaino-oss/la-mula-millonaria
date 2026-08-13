import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getIapSku } from '@/data/iapSkus';
import { recordTransaction } from '@/lib/transactions';
import { useClickerStore } from '@/store/clickerStore';
import { useSeasonStore } from '@/store/seasonStore';

const IAP_STORAGE_KEY = 'truckSurfers_iap_v1';

/** Tope anti-abuso en cliente: fulfills mock/live por día local. */
export const IAP_DAILY_FULFILL_CAP = 5;

/** lootBoxStore no expone `addBox`; cada caja del SKU se convierte en tickets. */
export const IAP_LOOTBOX_FALLBACK_TICKETS = 5;

const DAY_MS = 24 * 60 * 60 * 1000;
const SESSION_GRACE_MS = 60_000;

export type IapProvider = 'mock' | 'credibanco';

export interface IapPurchase {
  skuId: string;
  at: number;
  ticketsGranted: number;
  provider: IapProvider;
}

export interface IapFulfillResult {
  ok: boolean;
  reason?: string;
}

export interface IapState {
  adFreeUntil: number | null;
  starterBought: boolean;
  lastInterstitialAt: number;
  purchases: IapPurchase[];
  /** Epoch ms; no se persiste. Se fija al init / hydrate. */
  sessionStartedAt: number;

  isAdFree: () => boolean;
  canBuyStarter: () => boolean;
  canFulfillToday: () => boolean;
  recordInterstitial: () => void;
  canShowInterstitial: (minMs?: number) => boolean;
  fulfillSku: (skuId: string, provider: IapProvider) => IapFulfillResult;
  hydrateFromServer: (row: { adFreeUntil: number | null; starterBought: boolean }) => void;
}

function localDayKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function laterTimestamp(a: number | null, b: number | null): number | null {
  if (a == null) return b;
  if (b == null) return a;
  return Math.max(a, b);
}

export const useIapStore = create<IapState>()(
  persist(
    (set, get) => ({
      adFreeUntil: null,
      starterBought: false,
      lastInterstitialAt: 0,
      purchases: [],
      sessionStartedAt: Date.now(),

      isAdFree: () => {
        const until = get().adFreeUntil;
        return until != null && Date.now() < until;
      },

      canBuyStarter: () => !get().starterBought,

      canFulfillToday: () => {
        const today = localDayKey(Date.now());
        const n = get().purchases.filter((p) => localDayKey(p.at) === today).length;
        return n < IAP_DAILY_FULFILL_CAP;
      },

      recordInterstitial: () => set({ lastInterstitialAt: Date.now() }),

      canShowInterstitial: (minMs = 4 * 60 * 1000) => {
        if (get().isAdFree()) return false;
        const now = Date.now();
        if (now - get().sessionStartedAt < SESSION_GRACE_MS) return false;
        if (now - get().lastInterstitialAt < minMs) return false;
        return true;
      },

      fulfillSku: (skuId, provider) => {
        const sku = getIapSku(skuId);
        if (!sku) return { ok: false, reason: 'unknown_sku' };
        if (!get().canFulfillToday()) return { ok: false, reason: 'daily_cap' };
        if (sku.kind === 'starter' && !get().canBuyStarter()) {
          return { ok: false, reason: 'already_bought' };
        }

        const now = Date.now();
        let ticketsGranted = sku.tickets ?? 0;
        if (sku.lootBox && sku.lootBox > 0) {
          ticketsGranted += IAP_LOOTBOX_FALLBACK_TICKETS * sku.lootBox;
        }

        if (ticketsGranted > 0) {
          useClickerStore.getState().addGoldenTickets(ticketsGranted);
        }

        if (sku.kind === 'season_premium') {
          useSeasonStore.getState().unlockPremium();
        }

        set((state) => {
          let adFreeUntil = state.adFreeUntil;
          if (sku.kind === 'ad_free') {
            if (sku.adFreeDays === 'lifetime') {
              adFreeUntil = Number.MAX_SAFE_INTEGER;
            } else {
              const days = typeof sku.adFreeDays === 'number' ? sku.adFreeDays : 0;
              adFreeUntil = Math.max(state.adFreeUntil ?? 0, now + days * DAY_MS);
            }
          }
          return {
            adFreeUntil,
            starterBought: sku.kind === 'starter' ? true : state.starterBought,
            purchases: [
              ...state.purchases,
              { skuId, at: now, ticketsGranted, provider },
            ],
          };
        });

        void recordTransaction({
          type: 'iap',
          amount: sku.priceCop,
          description: skuId,
        });

        return { ok: true };
      },

      hydrateFromServer: ({ adFreeUntil, starterBought }) => {
        set((state) => ({
          adFreeUntil: laterTimestamp(state.adFreeUntil, adFreeUntil),
          starterBought: state.starterBought || starterBought,
          sessionStartedAt: Date.now(),
        }));
      },
    }),
    {
      name: IAP_STORAGE_KEY,
      partialize: (state) => ({
        adFreeUntil: state.adFreeUntil,
        starterBought: state.starterBought,
        lastInterstitialAt: state.lastInterstitialAt,
        purchases: state.purchases,
      }),
      onRehydrateStorage: () => () => {
        useIapStore.setState({ sessionStartedAt: Date.now() });
      },
    }
  )
);
