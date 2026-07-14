import { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Gamepad2,
  Trophy,
  Coins,
  Route,
  User,
  Lock,
  Link2,
  ChevronRight,
  ShoppingBag,
  Award,
  Users,
  TrendingUp,
  Tag,
  Target,
  Volume2,
  Music,
  Vibrate,
  Gauge,
  BarChart3,
  MessageCircle,
  FileText,
  Shield,
  Info,
  LogOut,
  Trash2,
  Star,
  Camera,
  X,
  Mail,
  Phone,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useMillas } from '@/providers/MillasProvider';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Transaction {
  id: string;
  type: 'game' | 'redemption' | 'daily' | 'achievement' | 'referral';
  title: string;
  date: string;
  amount: number;
  balanceAfter: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}



/* ------------------------------------------------------------------ */
/*  Mock Data                                                          */
/* ------------------------------------------------------------------ */
const TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'game', title: 'Partida Clasica', date: '18 Ene 2026, 14:30', amount: 245, balanceAfter: 15420, icon: Gamepad2, iconColor: 'text-[#F59E0B]', iconBg: 'bg-[#F59E0B]/10' },
  { id: '2', type: 'game', title: 'Partida Contrarreloj', date: '18 Ene 2026, 12:15', amount: 180, balanceAfter: 15175, icon: Gamepad2, iconColor: 'text-[#F59E0B]', iconBg: 'bg-[#F59E0B]/10' },
  { id: '3', type: 'redemption', title: 'Redencion: Audifonos BT', date: '18 Ene 2026, 09:00', amount: -8500, balanceAfter: 14995, icon: ShoppingBag, iconColor: 'text-[#EF4444]', iconBg: 'bg-[#EF4444]/10' },
  { id: '4', type: 'game', title: 'Partida Clasica', date: '17 Ene 2026, 20:45', amount: 520, balanceAfter: 23495, icon: Gamepad2, iconColor: 'text-[#F59E0B]', iconBg: 'bg-[#F59E0B]/10' },
  { id: '5', type: 'achievement', title: 'Logro: Esquivador', date: '17 Ene 2026, 18:20', amount: 500, balanceAfter: 22975, icon: Award, iconColor: 'text-[#F59E0B]', iconBg: 'bg-[#F59E0B]/10' },
  { id: '6', type: 'daily', title: 'Bonus Diario', date: '17 Ene 2026, 08:00', amount: 100, balanceAfter: 22475, icon: Target, iconColor: 'text-[#10B981]', iconBg: 'bg-[#10B981]/10' },
  { id: '7', type: 'game', title: 'Partida Clasica', date: '16 Ene 2026, 22:10', amount: 315, balanceAfter: 22375, icon: Gamepad2, iconColor: 'text-[#F59E0B]', iconBg: 'bg-[#F59E0B]/10' },
  { id: '8', type: 'referral', title: 'Referido: Juan Perez', date: '15 Ene 2026, 16:30', amount: 1000, balanceAfter: 22060, icon: Users, iconColor: 'text-[#3B82F6]', iconBg: 'bg-[#3B82F6]/10' },
  { id: '9', type: 'game', title: 'Partida Clasica', date: '14 Ene 2026, 19:00', amount: 420, balanceAfter: 21060, icon: Gamepad2, iconColor: 'text-[#F59E0B]', iconBg: 'bg-[#F59E0B]/10' },
  { id: '10', type: 'redemption', title: 'Redencion: Cargador USB', date: '12 Ene 2026, 11:00', amount: -3200, balanceAfter: 20640, icon: ShoppingBag, iconColor: 'text-[#EF4444]', iconBg: 'bg-[#EF4444]/10' },
];

const FAQ_ITEMS = [
  { q: 'Como gano TicaMillas?', a: 'Toca la tractomula en La Mula Millonaria, compra vehiculos para tu flota y cada kilometro recorrido suma TicaMillas.' },
  { q: 'Como redimo mis TicaMillas?', a: 'Ve a la tienda, selecciona un producto y presiona "Redimir". Se descontaran tus TicaMillas y recibiras un codigo de gift card de VTEX.' },
  { q: 'Cuanto valen las TicaMillas?', a: '1 TicaMilla = $1 COP. Si un producto cuesta $50,000 COP, necesitas 50,000 TicaMillas para redimirlo.' },
  { q: 'Puedo vincular mi cuenta de VTEX?', a: 'Si. En configuracion de cuenta selecciona "Cuenta VTEX" y sigue el proceso de vinculacion.' },
  { q: 'Que pasa si pierdo mi progreso?', a: 'Tu progreso se guarda automaticamente en la nube al vincular tu cuenta. Nunca pierdas tus TicaMillas.' },
];

/* ------------------------------------------------------------------ */
/*  CountUp hook                                                       */
/* ------------------------------------------------------------------ */
function useCountUp(end: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView || started) return;
    setStarted(true);
    const startTime = Date.now();
    const isFloat = end % 1 !== 0;
    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * end;
      setCount(isFloat ? parseFloat(current.toFixed(1)) : Math.floor(current));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [isInView, end, duration, started]);

  return { count, ref };
}

function AnimatedCounter({ value, duration = 1500, className }: { value: number; duration?: number; className?: string }) {
  const { count, ref } = useCountUp(value, duration);
  return <span ref={ref} className={className}>{count.toLocaleString()}</span>;
}

/* ------------------------------------------------------------------ */
/*  Section wrapper                                                    */
/* ------------------------------------------------------------------ */
function Section({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/*  Settings list item                                                 */
/* ------------------------------------------------------------------ */
function SettingsItem({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  right,
  onClick,
  last = false,
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onClick?: () => void;
  last?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 py-3.5 text-left transition-colors',
        !last && 'border-b border-slate-200'
      )}
    >
      <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0', 'bg-white/5')}>
        <Icon size={18} className={iconColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-slate-900 text-sm font-semibold">{title}</p>
        {subtitle && <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Profile Component                                             */
/* ------------------------------------------------------------------ */
export default function Profile() {
  const { user, isLoading, logout } = useAuth();
  const { millas } = useMillas();

  /* Local state */
  const [displayName, setDisplayName] = useState(user?.name || 'Camionero');
  const [email, setEmail] = useState(user?.email || 'camionero@trucksurfers.co');
  const [phone, setPhone] = useState('+57 300 123 4567');
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [txFilter, setTxFilter] = useState<'all' | 'earned' | 'spent'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [sensitivity, setSensitivity] = useState([50]);
  const [difficulty, setDifficulty] = useState<'Facil' | 'Normal' | 'Dificil'>('Normal');
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    games: true,
    redemptions: true,
    offers: false,
    leaderboard: true,
    challenges: true,
  });
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  /* Computed */
  const initials = (displayName || 'C').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const level = 12;
  const xpCurrent = 650;
  const xpTotal = 1000;
  const xpPercent = (xpCurrent / xpTotal) * 100;
  const isSocialAuth = !!user?.email;
  const vtexLinked = true;

  const filteredTransactions = TRANSACTIONS.filter((tx) => {
    if (txFilter === 'earned') return tx.amount >= 0;
    if (txFilter === 'spent') return tx.amount < 0;
    return true;
  });

  const toggleNotification = (id: string) => {
    setNotifications((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
  };

  /* Loading */
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-white flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-[#F59E0B] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white pb-10">
      {/* ============ Section 1: Profile Header ============ */}
      <Section className="relative overflow-hidden rounded-b-3xl px-4 pt-6 pb-6" delay={0}>
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D0E14] via-[#1A1B26] to-[#0D0E14] rounded-b-3xl" />
        <div className="relative flex flex-col items-center text-center">
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
            className="relative mb-3"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#F97316] flex items-center justify-center text-slate-900 font-fredoka font-bold text-3xl border-[3px] border-[#F59E0B] shadow-lg">
              {initials}
            </div>
            <button
              onClick={() => setEditSheetOpen(true)}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-slate-100 border-2 border-[#0D0E14] flex items-center justify-center hover:bg-[#2D2E3D] transition-colors"
            >
              <Camera size={14} className="text-slate-500" />
            </button>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-fredoka font-bold text-2xl text-slate-900"
          >
            {displayName}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="text-slate-500 text-sm mt-0.5"
          >
            @{displayName.toLowerCase().replace(/\s/g, '')}
          </motion.p>

          {/* Level Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]"
          >
            <Star size={12} className="text-slate-900" />
            <span className="text-slate-900 text-xs font-bold">Nivel {level}</span>
          </motion.div>

          {/* Mini XP Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="w-[120px] mt-2"
          >
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
              />
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-500 text-xs mt-2"
          >
            Miembro desde Enero 2026
          </motion.p>
        </div>
      </Section>

      {/* ============ Section 2: Stats Summary ============ */}
      <Section className="mx-4 mt-4 py-4 border-y border-white/[0.06]" delay={0.2}>
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: Gamepad2, label: 'Juegos', value: 142 },
            { icon: Trophy, label: 'Rank', value: 42, prefix: '#' },
            { icon: Coins, label: 'TicaMillas', value: millas },
            { icon: Route, label: 'Total', value: 87.4, suffix: 'km' },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + i * 0.05, duration: 0.4 }}
                className="flex flex-col items-center text-center"
              >
                <Icon size={18} className="text-[#F59E0B] mb-1" />
                <span className="font-fredoka font-bold text-base text-slate-900">
                  {stat.prefix}{stat.prefix && <AnimatedCounter value={stat.value} duration={800} className="" />}
                  {!stat.prefix && <AnimatedCounter value={stat.value} duration={800} className="" />}
                  {stat.suffix}
                </span>
                <span className="text-slate-500 text-[10px]">{stat.label}</span>
              </motion.div>
            );
          })}
        </div>
      </Section>

      {/* ============ Section 3: Account Settings ============ */}
      <Section className="px-4 mt-6" delay={0.3}>
        <h2 className="font-fredoka font-bold text-xl text-slate-900 mb-2">Cuenta</h2>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
          <SettingsItem
            icon={User}
            iconColor="text-[#F59E0B]"
            title="Editar Perfil"
            subtitle="Nombre, foto, correo"
            right={<ChevronRight size={18} className="text-slate-500" />}
            onClick={() => setEditSheetOpen(true)}
          />
          <SettingsItem
            icon={Lock}
            iconColor="text-[#3B82F6]"
            title="Cambiar Contrasena"
            subtitle="Actualiza tu seguridad"
            right={<ChevronRight size={18} className="text-slate-500" />}
            onClick={() => { }}
          />
          <SettingsItem
            icon={Link2}
            iconColor={vtexLinked ? 'text-[#10B981]' : 'text-[#F59E0B]'}
            title="Cuenta VTEX"
            subtitle={vtexLinked ? 'Vinculada: user@email.com' : 'No vinculada'}
            right={
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full', vtexLinked ? 'bg-[#10B981]' : 'bg-[#F59E0B]')} />
                <ChevronRight size={18} className="text-slate-500" />
              </div>
            }
            onClick={() => { }}
            last
          />
        </div>
      </Section>

      {/* ============ Section 4: Transaction History ============ */}
      <Section className="px-4 mt-6" delay={0.4}>
        <h2 className="font-fredoka font-bold text-xl text-slate-900 mb-3">Historial de Transacciones</h2>
        {/* Filter tabs */}
        <div className="flex gap-2 mb-3">
          {([
            { key: 'all', label: 'Todas' },
            { key: 'earned', label: 'Ganadas' },
            { key: 'spent', label: 'Gastadas' },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTxFilter(tab.key)}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200',
                txFilter === tab.key
                  ? 'bg-[#F59E0B] text-[#0D0E14]'
                  : 'bg-white text-slate-500 border border-slate-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Transaction list */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.2)] overflow-hidden">
          <AnimatePresence mode="wait">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map((tx, i) => {
                const Icon = tx.icon;
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: i * 0.03, duration: 0.3 }}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3',
                      i < filteredTransactions.length - 1 && 'border-b border-slate-200'
                    )}
                  >
                    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0', tx.iconBg)}>
                      <Icon size={18} className={tx.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 text-sm font-semibold truncate">{tx.title}</p>
                      <p className="text-slate-500 text-xs">{tx.date}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={cn('text-sm font-semibold', tx.amount >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]')}>
                        {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}
                      </p>
                      <p className="text-slate-500 text-[10px]">{tx.balanceAfter.toLocaleString()}</p>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-slate-500 text-sm">No hay transacciones</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </Section>

      {/* ============ Section 5: Notification Preferences ============ */}
      <Section className="px-4 mt-6" delay={0.5}>
        <h2 className="font-fredoka font-bold text-xl text-slate-900 mb-3">Notificaciones</h2>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
          {[
            { id: 'games', icon: Trophy, iconColor: 'text-[#F59E0B]', title: 'Resumen de partidas', subtitle: 'Recibe un resumen despues de cada juego' },
            { id: 'redemptions', icon: ShoppingBag, iconColor: 'text-[#10B981]', title: 'Estado de redenciones', subtitle: 'Notificaciones cuando tu producto se envia' },
            { id: 'offers', icon: Tag, iconColor: 'text-[#F59E0B]', title: 'Ofertas y promociones', subtitle: 'Descuentos exclusivos y eventos especiales' },
            { id: 'leaderboard', icon: TrendingUp, iconColor: 'text-[#3B82F6]', title: 'Cambios en tu ranking', subtitle: 'Cuando alguien te supera en el ranking' },
            { id: 'challenges', icon: Target, iconColor: 'text-[#EF4444]', title: 'Recordatorios de desafios', subtitle: 'No olvides completar tus desafios diarios' },
          ].map((item, i) => (
            <div
              key={item.id}
              className={cn('flex items-center gap-3 py-3.5', i < 4 && 'border-b border-slate-200')}
            >
              <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                <item.icon size={18} className={item.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-900 text-sm font-semibold">{item.title}</p>
                <p className="text-slate-500 text-xs">{item.subtitle}</p>
              </div>
              <Switch
                checked={notifications[item.id]}
                onCheckedChange={() => toggleNotification(item.id)}
                className="data-[state=checked]:bg-[#F59E0B]"
              />
            </div>
          ))}
        </div>
      </Section>

      {/* ============ Section 6: Game Settings ============ */}
      <Section className="px-4 mt-6" delay={0.55}>
        <h2 className="font-fredoka font-bold text-xl text-slate-900 mb-3">Juego</h2>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
          {/* Sound toggle */}
          <div className="flex items-center gap-3 py-3.5 border-b border-slate-200">
            <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
              <Volume2 size={18} className="text-[#F59E0B]" />
            </div>
            <div className="flex-1">
              <p className="text-slate-900 text-sm font-semibold">Efectos de sonido</p>
            </div>
            <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} className="data-[state=checked]:bg-[#F59E0B]" />
          </div>

          {/* Music toggle */}
          <div className="flex items-center gap-3 py-3.5 border-b border-slate-200">
            <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
              <Music size={18} className="text-[#3B82F6]" />
            </div>
            <div className="flex-1">
              <p className="text-slate-900 text-sm font-semibold">Musica de fondo</p>
            </div>
            <Switch checked={musicEnabled} onCheckedChange={setMusicEnabled} className="data-[state=checked]:bg-[#F59E0B]" />
          </div>

          {/* Vibration toggle */}
          <div className="flex items-center gap-3 py-3.5 border-b border-slate-200">
            <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
              <Vibrate size={18} className="text-[#10B981]" />
            </div>
            <div className="flex-1">
              <p className="text-slate-900 text-sm font-semibold">Vibracion</p>
              <p className="text-slate-500 text-xs">Haptic feedback en controles</p>
            </div>
            <Switch checked={vibrationEnabled} onCheckedChange={setVibrationEnabled} className="data-[state=checked]:bg-[#F59E0B]" />
          </div>

          {/* Sensitivity slider */}
          <div className="py-3.5 border-b border-slate-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                <Gauge size={18} className="text-[#F59E0B]" />
              </div>
              <div className="flex-1">
                <p className="text-slate-900 text-sm font-semibold">Sensibilidad de swipe</p>
              </div>
              <span className="text-[#F59E0B] text-xs font-bold">{sensitivity[0]}%</span>
            </div>
            <div className="pl-12 pr-2">
              <Slider
                value={sensitivity}
                onValueChange={setSensitivity}
                max={100}
                step={1}
                className="[&_[role=slider]]:bg-[#F59E0B] [&_[role=slider]]:border-[#F59E0B] [&_.bg-primary]:bg-[#F59E0B]"
              />
            </div>
          </div>

          {/* Difficulty selector */}
          <div className="py-3.5">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
                <BarChart3 size={18} className="text-[#EF4444]" />
              </div>
              <div className="flex-1">
                <p className="text-slate-900 text-sm font-semibold">Dificultad inicial</p>
              </div>
            </div>
            <div className="pl-12 flex gap-2">
              {(['Facil', 'Normal', 'Dificil'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200',
                    difficulty === d
                      ? 'bg-[#F59E0B] text-[#0D0E14]'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* ============ Section 7: Support & Info ============ */}
      <Section className="px-4 mt-6" delay={0.6}>
        <h2 className="font-fredoka font-bold text-xl text-slate-900 mb-3">Ayuda e Informacion</h2>

        {/* FAQ Accordion */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_2px_12px_rgba(0,0,0,0.2)] overflow-hidden mb-4">
          <Accordion type="single" collapsible className="px-4">
            {FAQ_ITEMS.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-b border-slate-200 last:border-b-0">
                <AccordionTrigger className="text-slate-900 text-sm font-semibold py-3.5 hover:no-underline">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-500 text-sm pb-3">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Support links */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-[0_2px_12px_rgba(0,0,0,0.2)]">
          <SettingsItem
            icon={MessageCircle}
            iconColor="text-[#10B981]"
            title="Contactar Soporte"
            subtitle="Envianos un mensaje"
            right={<ChevronRight size={18} className="text-slate-500" />}
            onClick={() => { }}
          />
          <SettingsItem
            icon={FileText}
            iconColor="text-slate-500"
            title="Terminos y Condiciones"
            right={<ChevronRight size={18} className="text-slate-500" />}
            onClick={() => { }}
          />
          <SettingsItem
            icon={Shield}
            iconColor="text-slate-500"
            title="Politica de Privacidad"
            right={<ChevronRight size={18} className="text-slate-500" />}
            onClick={() => { }}
          />
          <SettingsItem
            icon={Info}
            iconColor="text-slate-500"
            title="Acerca de La Mula Millonaria"
            subtitle="Version 1.0.0"
            right={<ChevronRight size={18} className="text-slate-500" />}
            onClick={() => { }}
            last
          />
        </div>
      </Section>

      {/* ============ Section 8: Danger Zone ============ */}
      <Section className="px-4 mt-6 pb-12" delay={0.65}>
        <div className="border-t border-[#EF4444]/20 pt-6">
          {/* Log out */}
          <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
            <AlertDialogTrigger asChild>
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 h-12 bg-white rounded-xl border border-[#EF4444]/30 text-[#EF4444] font-semibold text-sm transition-all duration-200 hover:bg-[#EF4444]/10"
              >
                <LogOut size={18} />
                Cerrar Sesion
              </motion.button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white border border-slate-200 text-slate-900 max-w-[90vw] rounded-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-fredoka text-lg text-slate-900">Cerrar Sesion</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-500">
                  Seguro que quieres cerrar sesion? Tu progreso esta guardado.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2 mt-4">
                <AlertDialogCancel className="bg-transparent border border-white/[0.1] text-slate-900 hover:bg-slate-100 rounded-xl">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogout}
                  className="bg-[#EF4444] text-slate-900 hover:bg-[#EF4444]/90 rounded-xl"
                >
                  Cerrar Sesion
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete account */}
          <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <AlertDialogTrigger asChild>
              <button className="w-full mt-3 text-slate-500 text-xs font-medium hover:text-[#EF4444] transition-colors">
                Eliminar mi cuenta
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white border border-[#EF4444]/20 text-slate-900 max-w-[90vw] rounded-2xl">
              <AlertDialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Trash2 size={20} className="text-[#EF4444]" />
                  <AlertDialogTitle className="font-fredoka text-lg text-[#EF4444]">Eliminar Cuenta</AlertDialogTitle>
                </div>
                <AlertDialogDescription className="text-slate-500">
                  Esta accion no se puede deshacer. Se eliminaran todos tus datos, TicaMillas y progreso.
                </AlertDialogDescription>
                <p className="text-[#EF4444] text-xs mt-2">
                  Escribe ELIMINAR para confirmar
                </p>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="ELIMINAR"
                  className="mt-2 w-full h-10 bg-white border border-white/[0.08] rounded-xl px-3 text-slate-900 text-sm placeholder:text-slate-500/50 focus:outline-none focus:border-[#EF4444]/50"
                />
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2 mt-4">
                <AlertDialogCancel className="bg-transparent border border-white/[0.1] text-slate-900 hover:bg-slate-100 rounded-xl">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleteConfirmText !== 'ELIMINAR'}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="bg-[#EF4444] text-slate-900 hover:bg-[#EF4444]/90 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Eliminar Permanentemente
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Section>

      {/* ============ Edit Profile Bottom Sheet ============ */}
      <AnimatePresence>
        {editSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setEditSheetOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'tween', duration: 0.35, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-slate-100 rounded-t-3xl max-h-[70vh] overflow-y-auto pb-safe"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <div className="flex items-center justify-between px-5 py-3">
                <h3 className="font-fredoka font-bold text-lg text-slate-900">Editar Perfil</h3>
                <button onClick={() => setEditSheetOpen(false)} className="p-1 rounded-full hover:bg-slate-100 transition-colors">
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
              <div className="px-5 pb-8 space-y-4">
                {/* Avatar preview */}
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#F97316] flex items-center justify-center text-slate-900 font-fredoka font-bold text-2xl border-[3px] border-[#F59E0B]">
                    {initials}
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="text-slate-500 text-xs font-medium mb-1.5 block">Nombre de usuario</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full h-11 bg-white border border-white/[0.08] rounded-xl pl-10 pr-4 text-slate-900 text-sm focus:outline-none focus:border-[#F59E0B]/50"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-slate-500 text-xs font-medium mb-1.5 block">Correo electronico</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      readOnly={isSocialAuth}
                      onChange={(e) => setEmail(e.target.value)}
                      className={cn(
                        'w-full h-11 bg-white border border-white/[0.08] rounded-xl pl-10 pr-4 text-slate-900 text-sm focus:outline-none focus:border-[#F59E0B]/50',
                        isSocialAuth && 'opacity-60 cursor-not-allowed'
                      )}
                    />
                  </div>
                  {isSocialAuth && <p className="text-slate-500 text-[10px] mt-1">Vinculado a cuenta social - no editable</p>}
                </div>

                {/* Phone */}
                <div>
                  <label className="text-slate-500 text-xs font-medium mb-1.5 block">Telefono</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-11 bg-white border border-white/[0.08] rounded-xl pl-10 pr-4 text-slate-900 text-sm focus:outline-none focus:border-[#F59E0B]/50"
                    />
                  </div>
                </div>

                {/* Save button */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setEditSheetOpen(false)}
                  className="w-full h-12 bg-gradient-to-r from-[#F59E0B] to-[#FBBF24] rounded-xl text-[#0D0E14] font-bold text-sm mt-2"
                >
                  Guardar Cambios
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
