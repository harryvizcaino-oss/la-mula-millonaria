/**
 * Session click multiplier composer.
 *
 * Caps the product of frenzy × combo × powerup × event × crit so a single
 * click cannot explode into tens of thousands of × (e.g. nitro50 × combo10 ×
 * convoy10 × crit10 = 50_000 without this).
 *
 * Stacking rules:
 * - Nitro and Convoy do NOT stack: only `Math.max(nitro, convoy)` is used.
 * - Critical: contributes at most ×2 to the session product (not the display
 *   ×10). Boolean `true` → 2; a raw number is clamped with `Math.min(2, n)`.
 * - Final product is `min(SESSION_MULT_CAP, frenzy * combo * powerup * event * critFactor)`.
 *
 * Mental test: nitro50 + combo10 + crit + convoy10
 *   → powerup=50, critFactor=2 → 1×10×50×1×2 = 1000 → capped to 500 (not 50_000).
 */

/** Hard cap on the composed session multiplier applied to click earnings. */
export const SESSION_MULT_CAP = 500;

export interface SessionMultInput {
  /** CPS Frenzy level multiplier (default 1). */
  frenzy?: number;
  /** Combo tier multiplier (default 1). */
  combo?: number;
  /** Nitro power-up multiplier while active (e.g. 50), else 1 / omit. */
  nitro?: number;
  /** Convoy power-up multiplier while active (e.g. 10), else 1 / omit. */
  convoy?: number;
  /** Global event multiplier (e.g. caravana ×3), default 1. */
  event?: number;
  /**
   * Critical hit flag or raw display mult.
   * - `true` → critFactor 2
   * - `false` / omit / ≤1 → critFactor 1
   * - number > 1 → `Math.min(2, critical)` (display ×10 becomes ×2 in the product)
   */
  critical?: boolean | number;
}

function positiveOrOne(n: number | undefined): number {
  if (n == null || !Number.isFinite(n) || n <= 0) return 1;
  return n;
}

/** True when `critical` should boost the session product. */
export function isCriticalBoosted(critical?: boolean | number): boolean {
  if (critical === true) return true;
  if (typeof critical === 'number' && Number.isFinite(critical) && critical > 1) return true;
  return false;
}

/**
 * Critical factor for the session product (max ×2, never the display ×10).
 */
export function criticalFactor(critical?: boolean | number): number {
  if (!isCriticalBoosted(critical)) return 1;
  if (typeof critical === 'number') return Math.min(2, critical);
  return 2;
}

/**
 * Power-up leg: nitro and convoy do not stack — take the larger multiplier.
 */
export function powerupMultiplier(nitro?: number, convoy?: number): number {
  return Math.max(positiveOrOne(nitro), positiveOrOne(convoy));
}

/**
 * Compose the session multiplier applied on top of base clickPower.
 * All inputs default to 1 when omitted / invalid.
 */
export function composeSessionMultiplier(input: SessionMultInput = {}): number {
  const frenzy = positiveOrOne(input.frenzy);
  const combo = positiveOrOne(input.combo);
  const powerup = powerupMultiplier(input.nitro, input.convoy);
  const event = positiveOrOne(input.event);
  const crit = criticalFactor(input.critical);

  const product = frenzy * combo * powerup * event * crit;
  if (!Number.isFinite(product) || product <= 0) return 1;
  return Math.min(SESSION_MULT_CAP, product);
}
