import { getIapSku } from '@/data/iapSkus';
import { useIapStore } from '@/store/iapStore';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface IapCheckoutResult {
  ok: boolean;
  mocked?: boolean;
  checkoutUrl?: string;
  reason?: string;
}

function checkoutEndpoint(): string | undefined {
  const raw = import.meta.env.VITE_IAP_CHECKOUT_URL as string | undefined;
  const url = raw?.trim();
  return url || undefined;
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!isSupabaseConfigured) return headers;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }
  } catch {
    // Offline / anónimo: el POST sigue sin bearer.
  }
  return headers;
}

function preflight(skuId: string): IapCheckoutResult | null {
  if (!getIapSku(skuId)) return { ok: false, reason: 'unknown_sku' };
  const iap = useIapStore.getState();
  if (!iap.canFulfillToday()) return { ok: false, reason: 'daily_cap' };
  const sku = getIapSku(skuId);
  if (sku?.kind === 'starter' && !iap.canBuyStarter()) {
    return { ok: false, reason: 'already_bought' };
  }
  return null;
}

/** Checkout simulado cuando no hay `VITE_IAP_CHECKOUT_URL`. */
export async function mockCheckout(skuId: string): Promise<IapCheckoutResult> {
  const blocked = preflight(skuId);
  if (blocked) return blocked;
  await new Promise((resolve) => setTimeout(resolve, 800));
  const result = useIapStore.getState().fulfillSku(skuId, 'mock');
  if (!result.ok) return { ok: false, reason: result.reason };
  return { ok: true, mocked: true };
}

/**
 * Inicia el cobro de un SKU.
 * Con `VITE_IAP_CHECKOUT_URL`: POST `{ skuId }` (bearer de sesión si hay) y
 * redirige a `checkoutUrl`. Sin URL: mock 800ms + fulfill local.
 * Los secretos de Credibanco viven solo en el backend, nunca en Vite.
 */
export async function startIapCheckout(skuId: string): Promise<IapCheckoutResult> {
  const blocked = preflight(skuId);
  if (blocked) return blocked;

  const endpoint = checkoutEndpoint();
  if (!endpoint) return mockCheckout(skuId);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({ skuId }),
    });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    const data = (await res.json()) as { checkoutUrl?: string };
    const checkoutUrl = data.checkoutUrl?.trim();
    if (!checkoutUrl) return { ok: false, reason: 'no_checkout_url' };
    if (typeof window !== 'undefined') window.location.assign(checkoutUrl);
    return { ok: true, checkoutUrl };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
