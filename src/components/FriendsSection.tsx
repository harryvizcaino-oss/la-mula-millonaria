import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Send, Trash2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFriendsStore } from '@/store/friendsStore';

const formatNumber = (num: number): string => Math.floor(num).toLocaleString('es-CO');

/**
 * Wave 3 (F10) — Sección "Amigos y Caravanas" del perfil.
 * Modelo 100% local (friendsStore): agregar por código, convites de caravana
 * y bonus de click por amigos activos (+1% c/u, tope +5%).
 */
export function FriendsSection() {
  const myCode = useFriendsStore((s) => s.myCode);
  const friends = useFriendsStore((s) => s.friends);
  const addFriend = useFriendsStore((s) => s.addFriend);
  const removeFriend = useFriendsStore((s) => s.removeFriend);
  const sendConvite = useFriendsStore((s) => s.sendConvite);
  const refreshActivity = useFriendsStore((s) => s.refreshActivity);
  const getActiveFriends = useFriendsStore((s) => s.getActiveFriends);
  const getCaravanBonus = useFriendsStore((s) => s.getCaravanBonus);

  const [addCode, setAddCode] = useState('');
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [, setTick] = useState(0); // re-render para estados "En caravana"

  // Simulación de presencia: al montar y cada 60s
  useEffect(() => {
    refreshActivity();
    const iv = setInterval(() => {
      refreshActivity();
      setTick((t) => t + 1);
    }, 60_000);
    return () => clearInterval(iv);
  }, [refreshActivity]);

  const activeFriends = getActiveFriends();
  const activeIds = new Set(activeFriends.map((f) => f.id));
  const bonusPct = Math.round(getCaravanBonus() * 100);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(myCode);
    } catch {
      // clipboard no disponible: igual mostramos feedback
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAdd = () => {
    const result = addFriend(addCode);
    if (result.success) {
      setFeedback({ ok: true, text: `${result.friend.name} se unió a tu caravana` });
      setAddCode('');
    } else {
      const text =
        result.reason === 'self'
          ? 'Ese es tu propio código'
          : result.reason === 'duplicate'
            ? 'Ese amigo ya está en tu lista'
            : 'Ingresa un código válido';
      setFeedback({ ok: false, text });
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
      {/* Bonus de caravana activo */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
        <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
          <Users size={18} className="text-[#F59E0B]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-slate-900 text-sm font-semibold">
            {activeFriends.length > 0
              ? `Caravana activa: +${bonusPct}% por click`
              : 'Sin caravana activa'}
          </p>
          <p className="text-slate-500 text-xs">
            {activeFriends.length} de {friends.length} amigos activos · +1% c/u (tope +5%)
          </p>
        </div>
        {activeFriends.length > 0 && (
          <span className="px-2 py-1 rounded-full bg-[#10B981]/15 text-[#10B981] text-xs font-bold">
            +{bonusPct}%
          </span>
        )}
      </div>

      {/* Tu código + invitar */}
      <div className="flex items-center gap-2 py-3 border-b border-slate-200">
        <span className="flex-1 text-center py-2 rounded-xl bg-slate-100 font-mono text-sm font-bold text-[#F59E0B] tracking-widest">
          {myCode}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#F59E0B] text-[#F59E0B] text-xs font-bold hover:bg-[#F59E0B]/10 transition-colors"
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copiado' : 'Invitar'}
        </button>
      </div>

      {/* Agregar con código */}
      <div className="flex items-center gap-2 pt-3">
        <input
          value={addCode}
          onChange={(e) => setAddCode(e.target.value)}
          placeholder="Código de amigo (ej. friend_pedro)"
          className="flex-1 min-w-0 px-3 py-2 rounded-xl bg-slate-100 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#F59E0B]/50"
        />
        <button
          onClick={handleAdd}
          disabled={!addCode.trim()}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] text-white text-xs font-bold hover:shadow-lg hover:shadow-[#F59E0B]/20 transition-shadow disabled:opacity-50"
        >
          Agregar
        </button>
      </div>
      {feedback && (
        <p className={cn('mt-2 text-xs font-medium', feedback.ok ? 'text-[#10B981]' : 'text-[#EF4444]')}>
          {feedback.text}
        </p>
      )}

      {/* Lista de amigos */}
      {friends.length === 0 ? (
        <p className="text-slate-500 text-xs text-center py-4">
          Aún no tienes amigos. Comparte tu código para armar una caravana.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {friends.map((f) => {
            const isActive = activeIds.has(f.id);
            return (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-2.5 bg-slate-100 rounded-xl"
              >
                <div className="relative flex-shrink-0">
                  <img src={f.avatar} alt={f.name} className="w-10 h-10 rounded-full bg-white" />
                  <span
                    className={cn(
                      'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
                      isActive ? 'bg-[#10B981]' : 'bg-slate-400'
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{f.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {isActive ? '🚛 En caravana' : 'Desconectado'} · {formatNumber(f.cpsTotal)} CPS
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (sendConvite(f.id)) setFeedback({ ok: true, text: `Convite enviado a ${f.name}` });
                  }}
                  title="Enviar convite de caravana"
                  className="p-2 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] hover:bg-[#F59E0B]/25 transition-colors"
                >
                  <Send size={14} />
                </button>
                <button
                  onClick={() => removeFriend(f.id)}
                  title="Eliminar amigo"
                  className="p-2 rounded-full bg-slate-200 text-slate-500 hover:text-[#EF4444] transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
