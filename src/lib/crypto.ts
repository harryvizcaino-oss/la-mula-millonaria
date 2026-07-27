/**
 * Cifrado de datos sensibles en localStorage (ISO 27001 A.10).
 * Usa Web Crypto API (AES-GCM) con una clave derivada del dispositivo.
 *
 * NOTA: Esto no es cifrado de extremo a extremo. La clave se deriva del
 * dispositivo, así que solo protege contra acceso físico al dispositivo o
 * XSS que intente leer localStorage directamente. Para cifrado real de
 * extremo a extremo, se necesitaría una clave del usuario (contraseña).
 */

const ENCRYPTION_KEY_NAME = 'lmm_encryption_key';

/**
 * Genera o recupera la clave de cifrado del dispositivo.
 * La clave se almacena en IndexedDB (más seguro que localStorage).
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  // Intentar recuperar la clave existente
  const stored = await getFromIndexedDB(ENCRYPTION_KEY_NAME);
  if (stored) {
    return await crypto.subtle.importKey(
      'jwk',
      stored,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  // Generar nueva clave
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // Guardar en IndexedDB
  const exported = await crypto.subtle.exportKey('jwk', key);
  await saveToIndexedDB(ENCRYPTION_KEY_NAME, exported);

  return key;
}

/**
 * Cifra un string con AES-GCM.
 */
export async function encryptData(data: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(data);

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    // Combinar IV + datos cifrados y codificar en base64
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('[crypto] Encryption failed:', error);
    // Fallback: devolver sin cifrar (mejor que perder datos)
    return data;
  }
}

/**
 * Descifra un string cifrado con AES-GCM.
 */
export async function decryptData(encryptedData: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));

    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('[crypto] Decryption failed:', error);
    // Fallback: devolver sin descifrar (puede ser datos antiguos sin cifrar)
    return encryptedData;
  }
}

/**
 * Helpers para IndexedDB (más seguro que localStorage para la clave).
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('lmm_crypto', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys');
      }
    };
  });
}

async function getFromIndexedDB(key: string): Promise<JsonWebKey | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['keys'], 'readonly');
      const store = transaction.objectStore('keys');
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result ?? null);
    });
  } catch {
    return null;
  }
}

async function saveToIndexedDB(key: string, value: JsonWebKey): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['keys'], 'readwrite');
      const store = transaction.objectStore('keys');
      const request = store.put(value, key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('[crypto] Failed to save key to IndexedDB:', error);
  }
}

/**
 * Wrapper para localStorage que cifra/descifra automáticamente.
 * Uso:
 *   await secureStorage.setItem('key', 'value');
 *   const value = await secureStorage.getItem('key');
 */
export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    const encrypted = await encryptData(value);
    localStorage.setItem(key, encrypted);
  },

  async getItem(key: string): Promise<string | null> {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;
    return await decryptData(encrypted);
  },

  removeItem(key: string): void {
    localStorage.removeItem(key);
  },

  clear(): void {
    localStorage.clear();
  },
};
