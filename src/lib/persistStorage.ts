/**
 * Storage seguro para `zustand/persist`.
 *
 * `createJSONStorage(() => localStorage)` falla silenciosamente cuando
 * `localStorage` no es accesible como variable global libre (Node ESM,
 * algunos entornos de test). Este helper resuelve el storage de forma
 * explícita y cae a un storage en memoria cuando no hay persistencia real,
 * de modo que `persist` nunca recibe `undefined`.
 */

interface SafeStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

class MemoryStorage implements SafeStorage {
  private map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }
}

let memory: MemoryStorage | null = null;

function resolveStorage(): SafeStorage {
  try {
    // Resolución explícita: window (browser/jsdom) → globalThis → memoria.
    const w = (globalThis as { window?: { localStorage?: SafeStorage } }).window;
    if (w?.localStorage) return w.localStorage;
    const g = (globalThis as { localStorage?: SafeStorage }).localStorage;
    if (g) return g;
  } catch {
    /* cae a memoria */
  }
  if (!memory) memory = new MemoryStorage();
  return memory;
}

export const safeStorage = (): SafeStorage => resolveStorage();
