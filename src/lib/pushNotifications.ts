/**
 * Wave 3 (F11) — Notificaciones push locales (Notification API).
 *
 * No hay service worker de push ni backend: se usan notificaciones locales
 * con `new Notification()` cuando el permiso es 'granted'. La configuración
 * (master switch + tipos) persiste en localStorage. Si el navegador no
 * soporta notificaciones o el permiso no está concedido, `notifyPush`
 * devuelve false y la UI cae a sus toasts internos (comportamiento actual).
 */

const PUSH_SETTINGS_KEY = 'truckSurfers_push_v1';

export type PushType = 'daily' | 'combo' | 'events' | 'league';

export interface PushSettings {
  enabled: boolean;
  daily: boolean; // racha diaria lista
  combo: boolean; // combo perdido
  events: boolean; // evento global activo
  league: boolean; // recompensa de liga lista
}

const DEFAULT_SETTINGS: PushSettings = {
  enabled: false,
  daily: true,
  combo: true,
  events: true,
  league: true,
};

export function getPushSettings(): PushSettings {
  try {
    const raw = localStorage.getItem(PUSH_SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<PushSettings>) };
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS };
}

export function savePushSettings(settings: PushSettings): void {
  try {
    localStorage.setItem(PUSH_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getPushPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestPushPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPushSupported()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

/**
 * Envía una notificación local si el master switch y el tipo están activos y
 * el permiso es 'granted'. Devuelve true si se mostró; false si la UI debe
 * usar su fallback (toast interno).
 */
export function notifyPush(type: PushType, title: string, body: string): boolean {
  if (!isPushSupported()) return false;
  const settings = getPushSettings();
  if (!settings.enabled || !settings[type]) return false;
  if (Notification.permission !== 'granted') return false;
  try {
    new Notification(title, {
      body,
      tag: `mula-${type}`,
      icon: '/badge-gold.png',
    });
    return true;
  } catch {
    return false;
  }
}

export function notifyDailyReady(): boolean {
  return notifyPush('daily', '🔥 Racha diaria lista', 'Reclama tu recompensa de hoy en La Mula Millonaria');
}

export function notifyComboLost(comboCount: number): boolean {
  return notifyPush('combo', '💔 Combo perdido', `Perdiste tu combo de ${comboCount} clicks. ¡Vuelve a la carretera!`);
}

export function notifyGlobalEvent(eventName: string): boolean {
  return notifyPush('events', '🚛 Evento global activo', `${eventName}: ¡clickea para sumar al progreso comunitario!`);
}

export function notifyLeagueReward(): boolean {
  return notifyPush('league', '🏆 Recompensa de liga lista', 'La semana terminó: reclama tu premio en el Ranking');
}
