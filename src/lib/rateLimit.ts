/**
 * Rate limiting simple para prevenir fuerza bruta (ISO 27001 A.9).
 * Almacena intentos en memoria (se resetea al recargar la página).
 * Para rate limiting persistente, usar Supabase Edge Functions o middleware.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const attempts = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutos

/**
 * Verifica si una acción está permitida (rate limiting).
 * @param key - Identificador único (ej. email, IP, userId)
 * @returns true si está permitido, false si excede el límite
 */
export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now > entry.resetAt) {
    // Primera vez o ventana expirada
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_ATTEMPTS) {
    // Límite excedido
    return false;
  }

  // Incrementar contador
  entry.count += 1;
  return true;
}

/**
 * Obtiene el tiempo restante hasta que se resetee el límite.
 * @param key - Identificador único
 * @returns Milisegundos restantes, o 0 si no hay límite activo
 */
export function getRateLimitResetTime(key: string): number {
  const entry = attempts.get(key);
  if (!entry) return 0;
  const remaining = entry.resetAt - Date.now();
  return Math.max(0, remaining);
}

/**
 * Resetea el contador de intentos para una clave.
 * Útil después de un login exitoso.
 */
export function resetRateLimit(key: string): void {
  attempts.delete(key);
}

/**
 * Wrapper para funciones async que aplica rate limiting.
 * @param key - Identificador único
 * @param fn - Función a ejecutar
 * @returns Resultado de la función, o null si excede el límite
 */
export async function withRateLimit<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T | null> {
  if (!checkRateLimit(key)) {
    const resetTime = getRateLimitResetTime(key);
    const minutes = Math.ceil(resetTime / 60000);
    throw new Error(`Demasiados intentos. Intenta de nuevo en ${minutes} minutos.`);
  }

  try {
    const result = await fn();
    resetRateLimit(key); // Resetear después de éxito
    return result;
  } catch (error) {
    // No resetear en caso de error (permite reintentos)
    throw error;
  }
}
