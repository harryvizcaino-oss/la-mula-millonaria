/**
 * Logs de seguridad (ISO 27001 A.12).
 * Registra eventos de seguridad importantes para auditoría y detección de anomalías.
 *
 * NOTA: En producción, estos logs deberían enviarse a un servicio externo
 * (Supabase Logs, LogRocket, Sentry, etc.) para análisis y alertas.
 */

export type SecurityEventType =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'account_created'
  | 'account_deleted'
  | 'password_changed'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'unauthorized_access'
  | 'data_export'
  | 'data_deletion';

export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

const SECURITY_LOG_KEY = 'lmm_security_log';
const MAX_LOG_ENTRIES = 100;

/**
 * Registra un evento de seguridad.
 */
export function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
  const fullEvent: SecurityEvent = {
    ...event,
    timestamp: Date.now(),
    ip: getClientIP(),
    userAgent: navigator.userAgent,
  };

  // Guardar en localStorage (limitado a MAX_LOG_ENTRIES)
  const logs = getSecurityLogs();
  logs.unshift(fullEvent);
  const trimmed = logs.slice(0, MAX_LOG_ENTRIES);
  localStorage.setItem(SECURITY_LOG_KEY, JSON.stringify(trimmed));

  // En producción, enviar a servicio externo
  if (import.meta.env.PROD) {
    void sendToExternalService(fullEvent);
  }

  // Log a consola en desarrollo
  if (import.meta.env.DEV) {
    console.log('[Security]', fullEvent);
  }
}

/**
 * Obtiene los logs de seguridad almacenados.
 */
export function getSecurityLogs(): SecurityEvent[] {
  try {
    const raw = localStorage.getItem(SECURITY_LOG_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SecurityEvent[];
  } catch {
    return [];
  }
}

/**
 * Limpia los logs de seguridad (solo para testing o derechos ARCO).
 */
export function clearSecurityLogs(): void {
  localStorage.removeItem(SECURITY_LOG_KEY);
}

/**
 * Obtiene la IP del cliente (aproximada, del navegador).
 */
function getClientIP(): string {
  // En el navegador no podemos obtener la IP real del cliente.
  // En producción, esto debería venir del servidor (Vercel, Supabase Edge Functions).
  return 'client-side';
}

/**
 * Envía el evento a un servicio externo (Supabase Logs, Sentry, etc.).
 */
async function sendToExternalService(event: SecurityEvent): Promise<void> {
  try {
    // TODO: Implementar envío a Supabase Logs o servicio externo
    // Ejemplo con Supabase Edge Function:
    // await supabase.functions.invoke('log-security-event', { body: event });
    console.log('[Security] Would send to external service:', event);
  } catch (error) {
    console.error('[Security] Failed to send to external service:', error);
  }
}

/**
 * Helpers para eventos comunes.
 */
export const security = {
  loginSuccess: (userId: string, email: string) =>
    logSecurityEvent({ type: 'login_success', userId, email }),

  loginFailed: (email: string, reason?: string) =>
    logSecurityEvent({ type: 'login_failed', email, metadata: { reason } }),

  logout: (userId: string) =>
    logSecurityEvent({ type: 'logout', userId }),

  accountCreated: (userId: string, email: string) =>
    logSecurityEvent({ type: 'account_created', userId, email }),

  accountDeleted: (userId: string) =>
    logSecurityEvent({ type: 'account_deleted', userId }),

  suspiciousActivity: (userId: string, activity: string) =>
    logSecurityEvent({ type: 'suspicious_activity', userId, metadata: { activity } }),

  rateLimitExceeded: (key: string) =>
    logSecurityEvent({ type: 'rate_limit_exceeded', metadata: { key } }),

  unauthorizedAccess: (userId: string, resource: string) =>
    logSecurityEvent({ type: 'unauthorized_access', userId, metadata: { resource } }),

  dataExport: (userId: string) =>
    logSecurityEvent({ type: 'data_export', userId }),

  dataDeletion: (userId: string) =>
    logSecurityEvent({ type: 'data_deletion', userId }),
};
