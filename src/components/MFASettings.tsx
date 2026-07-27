import { useState } from 'react';
import { Shield, QrCode, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

/**
 * Componente de configuración de MFA (Multi-Factor Authentication).
 * Permite al usuario habilitar/deshabilitar MFA con TOTP (Google Authenticator, etc.).
 *
 * ISO 27001 A.9.4 — Autenticación de dos factores
 */
export function MFASettings() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  // Verificar si el usuario ya tiene MFA habilitado
  const checkMFAStatus = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user?.factors && data.user.factors.length > 0) {
      setMfaEnabled(true);
      setFactorId(data.user.factors[0].id);
    }
  };

  // Enroll MFA
  const handleEnroll = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (error) {
        setError(error.message);
        return;
      }

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
    } catch (err) {
      setError('Error al habilitar MFA');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Verify MFA
  const handleVerify = async () => {
    if (!factorId || !code) return;

    setLoading(true);
    setError(null);
    try {
      // Crear challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) {
        setError(challengeError.message);
        return;
      }

      // Verificar código
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setSuccess(true);
      setMfaEnabled(true);
      setQrCode(null);
      setSecret(null);
      setCode('');
    } catch (err) {
      setError('Error al verificar MFA');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Unenroll MFA
  const handleUnenroll = async () => {
    if (!factorId) return;

    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setMfaEnabled(false);
      setFactorId(null);
      setSuccess(false);
    } catch (err) {
      setError('Error al deshabilitar MFA');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar estado de MFA al montar
  useState(() => {
    void checkMFAStatus();
  });

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
          <Shield size={20} className="text-[#F59E0B]" />
        </div>
        <div>
          <h3 className="font-fredoka font-bold text-lg text-slate-900">
            Autenticación de Dos Factores (MFA)
          </h3>
          <p className="text-xs text-slate-500">
            Agrega una capa extra de seguridad a tu cuenta
          </p>
        </div>
      </div>

      {/* Estado de MFA */}
      {mfaEnabled && !qrCode && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <Check size={20} className="text-green-600" />
            <div>
              <p className="text-sm font-bold text-green-900">MFA Habilitado</p>
              <p className="text-xs text-green-700">
                Tu cuenta está protegida con autenticación de dos factores
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <X size={20} className="text-red-600" />
            <p className="text-sm text-red-900">{error}</p>
          </div>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-3">
            <Check size={20} className="text-green-600" />
            <p className="text-sm text-green-900">MFA habilitado exitosamente</p>
          </div>
        </div>
      )}

      {/* Enroll MFA */}
      {!mfaEnabled && !qrCode && (
        <button
          onClick={handleEnroll}
          disabled={loading}
          className={cn(
            'w-full py-3 rounded-xl font-bold text-sm transition-colors',
            loading
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-white hover:shadow-lg'
          )}
        >
          {loading ? 'Cargando...' : 'Habilitar MFA'}
        </button>
      )}

      {/* QR Code */}
      {qrCode && (
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <QrCode size={32} className="mx-auto text-slate-400 mb-2" />
            <img src={qrCode} alt="QR Code" className="mx-auto max-w-[200px]" />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs text-blue-900 mb-2">
              <strong>¿No puedes escanear el código?</strong>
            </p>
            <p className="text-xs text-blue-700 font-mono break-all">
              {secret}
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-2">
              Ingresa el código de 6 dígitos
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-center text-2xl font-mono tracking-widest focus:border-[#F59E0B] focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setQrCode(null);
                setSecret(null);
                setCode('');
                setError(null);
              }}
              className="flex-1 py-3 rounded-xl font-bold text-sm bg-slate-200 text-slate-600 hover:bg-slate-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleVerify}
              disabled={loading || code.length !== 6}
              className={cn(
                'flex-1 py-3 rounded-xl font-bold text-sm transition-colors',
                loading || code.length !== 6
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-white hover:shadow-lg'
              )}
            >
              {loading ? 'Verificando...' : 'Verificar'}
            </button>
          </div>
        </div>
      )}

      {/* Unenroll MFA */}
      {mfaEnabled && (
        <button
          onClick={handleUnenroll}
          disabled={loading}
          className={cn(
            'w-full py-3 rounded-xl font-bold text-sm transition-colors',
            loading
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-red-500 text-white hover:bg-red-600'
          )}
        >
          {loading ? 'Deshabilitando...' : 'Deshabilitar MFA'}
        </button>
      )}

      {/* Info */}
      <div className="mt-4 bg-slate-50 rounded-xl p-4">
        <p className="text-xs text-slate-600">
          <strong>Apps compatibles:</strong> Google Authenticator, Microsoft Authenticator, Authy, 1Password
        </p>
      </div>
    </div>
  );
}
