import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  FileText,
  Activity,
  Lock,
  Eye,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSecurityLogs, clearSecurityLogs, type SecurityEvent } from '@/lib/securityLog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

/**
 * Módulo de Administración de Seguridad (ISO 27001).
 * Solo accesible para admins/owners (validado en el backend con `is_admin()`).
 *
 * Contiene:
 * - Dashboard de seguridad (métricas, alertas)
 * - Logs de seguridad (eventos, anomalías)
 * - Tickets de seguridad (incidentes, vulnerabilidades)
 * - Reportes (auditorías, cumplimiento)
 * - Configuración (MFA, rate limiting, cifrado)
 */

type Tab = 'dashboard' | 'logs' | 'tickets' | 'reports' | 'settings';

export default function SecurityAdmin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [logs, setLogs] = useState<SecurityEvent[]>([]);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Verificar que el usuario es admin/owner (validación en el backend)
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    // Llamar a la función RPC `is_admin()` de Supabase
    void supabase.rpc('is_admin').then(({ data, error }) => {
      if (error) {
        console.error('[SecurityAdmin] Failed to check admin status:', error);
        setIsAdmin(false);
        return;
      }
      setIsAdmin(data === true);
    });
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      setLogs(getSecurityLogs());
    }
  }, [isAdmin]);

  if (isAdmin === null) {
    return (
      <div className="min-h-[100dvh] bg-white pt-14 pb-4 flex items-center justify-center">
        <div className="text-center">
          <Shield size={48} className="mx-auto text-slate-400 mb-4 animate-pulse" />
          <p className="text-slate-500">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[100dvh] bg-white pt-14 pb-4 flex items-center justify-center">
        <div className="text-center">
          <Shield size={48} className="mx-auto text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Acceso Denegado</h1>
          <p className="text-slate-500">Solo administradores pueden acceder a este módulo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white pt-14 pb-4">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <Shield size={24} className="text-[#F59E0B]" />
          <h1 className="font-fredoka font-bold text-xl text-slate-900">Administración de Seguridad</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-slate-200">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Activity },
          { id: 'logs', label: 'Logs', icon: FileText },
          { id: 'tickets', label: 'Tickets', icon: AlertTriangle },
          { id: 'reports', label: 'Reportes', icon: Download },
          { id: 'settings', label: 'Configuración', icon: Lock },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-[#F59E0B] text-white'
                : 'bg-white text-slate-500 hover:text-slate-900'
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {activeTab === 'dashboard' && <DashboardTab logs={logs} />}
        {activeTab === 'logs' && <LogsTab logs={logs} onClear={() => { clearSecurityLogs(); setLogs([]); }} />}
        {activeTab === 'tickets' && <TicketsTab />}
        {activeTab === 'reports' && <ReportsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dashboard Tab                                                      */
/* ------------------------------------------------------------------ */
function DashboardTab({ logs }: { logs: SecurityEvent[] }) {
  const stats = {
    totalEvents: logs.length,
    loginSuccess: logs.filter((l) => l.type === 'login_success').length,
    loginFailed: logs.filter((l) => l.type === 'login_failed').length,
    suspiciousActivity: logs.filter((l) => l.type === 'suspicious_activity').length,
    rateLimitExceeded: logs.filter((l) => l.type === 'rate_limit_exceeded').length,
  };

  return (
    <div className="space-y-4">
      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={Activity}
          label="Eventos Totales"
          value={stats.totalEvents}
          color="blue"
        />
        <MetricCard
          icon={CheckCircle}
          label="Logins Exitosos"
          value={stats.loginSuccess}
          color="green"
        />
        <MetricCard
          icon={XCircle}
          label="Logins Fallidos"
          value={stats.loginFailed}
          color="red"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Actividad Sospechosa"
          value={stats.suspiciousActivity}
          color="orange"
        />
      </div>

      {/* Alertas recientes */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-4">
        <h3 className="font-fredoka font-bold text-lg text-slate-900 mb-3">Alertas Recientes</h3>
        {logs.length === 0 ? (
          <p className="text-slate-500 text-sm">No hay alertas recientes.</p>
        ) : (
          <div className="space-y-2">
            {logs.slice(0, 5).map((log, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  log.type === 'login_failed' ? 'bg-red-500' :
                  log.type === 'suspicious_activity' ? 'bg-orange-500' :
                  'bg-green-500'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">{log.type}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(log.timestamp).toLocaleString('es-CO')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Logs Tab                                                           */
/* ------------------------------------------------------------------ */
function LogsTab({ logs, onClear }: { logs: SecurityEvent[]; onClear: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-fredoka font-bold text-lg text-slate-900">Logs de Seguridad</h3>
        <button
          onClick={onClear}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600"
        >
          <Trash2 size={14} />
          Limpiar
        </button>
      </div>

      {logs.length === 0 ? (
        <p className="text-slate-500 text-sm">No hay logs de seguridad.</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center',
                  log.type === 'login_failed' ? 'bg-red-100 text-red-600' :
                  log.type === 'suspicious_activity' ? 'bg-orange-100 text-orange-600' :
                  'bg-green-100 text-green-600'
                )}>
                  {log.type === 'login_failed' ? <XCircle size={16} /> :
                   log.type === 'suspicious_activity' ? <AlertTriangle size={16} /> :
                   <CheckCircle size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900">{log.type}</p>
                  <p className="text-xs text-slate-500">
                    {log.userId && `Usuario: ${log.userId} · `}
                    {log.email && `Email: ${log.email} · `}
                    {new Date(log.timestamp).toLocaleString('es-CO')}
                  </p>
                  {log.metadata && (
                    <p className="text-xs text-slate-400 mt-1">
                      {JSON.stringify(log.metadata)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tickets Tab                                                        */
/* ------------------------------------------------------------------ */
function TicketsTab() {
  const tickets = [
    {
      id: 'SEC-001',
      title: 'Vulnerabilidad en react-router',
      severity: 'medium',
      status: 'open',
      createdAt: Date.now() - 86400000,
    },
    {
      id: 'SEC-002',
      title: 'Implementar MFA para administradores',
      severity: 'high',
      status: 'in_progress',
      createdAt: Date.now() - 172800000,
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-fredoka font-bold text-lg text-slate-900">Tickets de Seguridad</h3>

      {tickets.length === 0 ? (
        <p className="text-slate-500 text-sm">No hay tickets de seguridad.</p>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-slate-500">{ticket.id}</span>
                <span className={cn(
                  'px-2 py-1 rounded-full text-xs font-bold',
                  ticket.severity === 'high' ? 'bg-red-100 text-red-600' :
                  ticket.severity === 'medium' ? 'bg-orange-100 text-orange-600' :
                  'bg-green-100 text-green-600'
                )}>
                  {ticket.severity}
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-2">{ticket.title}</h4>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(ticket.createdAt).toLocaleDateString('es-CO')}
                </span>
                <span className={cn(
                  'px-2 py-1 rounded-full font-bold',
                  ticket.status === 'open' ? 'bg-blue-100 text-blue-600' :
                  ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-green-100 text-green-600'
                )}>
                  {ticket.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reports Tab                                                        */
/* ------------------------------------------------------------------ */
function ReportsTab() {
  const reports = [
    {
      id: 'AUD-2026-07',
      title: 'Auditoría ISO 27001 — Julio 2026',
      type: 'audit',
      date: Date.now(),
      url: '/reports/iso27001-jul-2026.pdf',
    },
    {
      id: 'PEN-2026-07',
      title: 'Prueba de Penetración — Julio 2026',
      type: 'pentest',
      date: Date.now() - 604800000,
      url: '/reports/pentest-jul-2026.pdf',
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-fredoka font-bold text-lg text-slate-900">Reportes de Seguridad</h3>

      {reports.length === 0 ? (
        <p className="text-slate-500 text-sm">No hay reportes de seguridad.</p>
      ) : (
        <div className="space-y-2">
          {reports.map((report) => (
            <div key={report.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <FileText size={20} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900">{report.title}</h4>
                  <p className="text-xs text-slate-500">
                    {new Date(report.date).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F59E0B] text-white text-xs font-bold hover:bg-[#D97706]">
                  <Download size={14} />
                  Descargar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Settings Tab                                                       */
/* ------------------------------------------------------------------ */
function SettingsTab() {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [rateLimitEnabled, setRateLimitEnabled] = useState(true);
  const [encryptionEnabled, setEncryptionEnabled] = useState(true);

  return (
    <div className="space-y-4">
      <h3 className="font-fredoka font-bold text-lg text-slate-900">Configuración de Seguridad</h3>

      <div className="space-y-3">
        <SettingRow
          icon={Lock}
          label="MFA (Multi-Factor Authentication)"
          description="Requiere código de app de autenticación para login"
          enabled={mfaEnabled}
          onToggle={setMfaEnabled}
        />
        <SettingRow
          icon={Shield}
          label="Rate Limiting"
          description="Limita intentos de login para prevenir fuerza bruta"
          enabled={rateLimitEnabled}
          onToggle={setRateLimitEnabled}
        />
        <SettingRow
          icon={Eye}
          label="Cifrado de Datos Sensibles"
          description="Cifra datos en localStorage con AES-GCM"
          enabled={encryptionEnabled}
          onToggle={setEncryptionEnabled}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
        <p className="text-sm text-blue-900">
          <strong>Nota:</strong> Algunos cambios de configuración requieren reiniciar la aplicación o actualizar el servidor.
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper Components                                                  */
/* ------------------------------------------------------------------ */
function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'red' | 'orange';
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center mb-2', colors[color])}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function SettingRow({
  icon: Icon,
  label,
  description,
  enabled,
  onToggle,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
          <Icon size={20} className="text-slate-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-slate-900">{label}</h4>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        <button
          onClick={() => onToggle(!enabled)}
          className={cn(
            'w-12 h-6 rounded-full transition-colors',
            enabled ? 'bg-green-500' : 'bg-slate-300'
          )}
        >
          <motion.div
            animate={{ x: enabled ? 24 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="w-6 h-6 rounded-full bg-white shadow-md"
          />
        </button>
      </div>
    </div>
  );
}
