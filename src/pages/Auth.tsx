import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowLeft,
  ArrowRight,
  Truck,
  Gamepad2,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LOGIN_PATH } from '@/const';

/* ─── Types ─── */
type Screen = 'splash' | 'onboarding' | 'auth' | 'forgot';
type AuthTab = 'login' | 'register';
type OnboardingStep = 0 | 1 | 2;
type ForgotStep = 'email' | 'code' | 'password';

/* ─── Easing Constants ─── */
const EASE_EXPO_OUT = [0.16, 1, 0.3, 1] as [number, number, number, number];
const EASE_BOUNCE = [0.34, 1.56, 0.64, 1] as [number, number, number, number];

/* ─── Onboarding Data ─── */
const ONBOARDING_STEPS = [
  {
    title: 'Corre por la carretera',
    description:
      'Conduce tu camion esquivando obstaculos en una carretera sin fin. Cuantos mas camiones esquives, mas lejos llegaras.',
    swipeText: 'Desliza para cambiar de carril',
  },
  {
    title: 'Acumula TicaMillas',
    description:
      'Recoge monedas doradas mientras corres. Cada moneda es una milla que podras redimir por productos reales en nuestra tienda.',
    swipeText: 'Salta y desliza para esquivar',
  },
  {
    title: 'Gana Recompensas Reales',
    description:
      'Tus TicaMillas son dinero real. Canjealas por productos de nuestro marketplace conectado a VTEX. Audifonos, mochilas, gift cards y mas.',
    swipeText: 'Acumula TicaMillas y redime premios',
  },
];

/* ─── Splash Screen ─── */
function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Cargando motor...');

  useEffect(() => {
    const duration = 2000;
    const interval = 16;
    const steps = duration / interval;
    let current = 0;

    const timer = setInterval(() => {
      current++;
      const pct = Math.min((current / steps) * 100, 100);
      setProgress(pct);

      if (pct >= 33 && pct < 66) setStatusText('Preparando camiones...');
      else if (pct >= 66) setStatusText('Listo!');

      if (current >= steps) {
        clearInterval(timer);
        setTimeout(onComplete, 300);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[100dvh] bg-white relative overflow-hidden"
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0D0E14] via-[#1A1B26] to-[#0D0E14] opacity-50" />

      {/* Animated Logo */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE_EXPO_OUT }}
      >
        <motion.div
          animate={{ y: [-6, 6, -6] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-8"
        >
          <div className="relative">
            <motion.div
              animate={{
                filter: [
                  'drop-shadow(0 0 20px rgba(245, 158, 11, 0.3))',
                  'drop-shadow(0 0 40px rgba(245, 158, 11, 0.6))',
                  'drop-shadow(0 0 20px rgba(245, 158, 11, 0.3))',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="w-[120px] h-[120px] rounded-3xl bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] flex items-center justify-center shadow-[0_4px_20px_rgba(245,158,11,0.4)]">
                <Truck size={64} className="text-slate-900" strokeWidth={2} />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Game Title */}
        <motion.h1
          className="font-fredoka font-bold text-4xl text-slate-900 mb-2 tracking-tight"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: EASE_EXPO_OUT }}
        >
          La Mula Millonaria
        </motion.h1>

        <motion.p
          className="text-slate-500 text-sm mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          Esquiva. Acumula. Redime.
        </motion.p>

        {/* Loading Bar */}
        <div className="w-[200px] h-1 rounded-full bg-slate-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Status Text */}
        <motion.p
          className="text-slate-500 text-xs mt-4 font-medium tracking-wide"
          key={statusText}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {statusText}
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

/* ─── Swipe Demo Animation ─── */
function SwipeDemo({ step }: { step: number }) {
  if (step === 0) {
    // Lane switching - horizontal arrows
    return (
      <div className="relative w-full h-16 flex items-center justify-center gap-4">
        <motion.div
          animate={{ x: [-20, 20, -20] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex items-center gap-2"
        >
          <ChevronLeft size={20} className="text-[#F59E0B]" />
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] flex items-center justify-center shadow-lg">
            <Gamepad2 size={18} className="text-slate-900" />
          </div>
          <ChevronRight size={20} className="text-[#F59E0B]" />
        </motion.div>
      </div>
    );
  }

  if (step === 1) {
    // Jump animation
    return (
      <div className="relative w-full h-16 flex items-center justify-center">
        <motion.div
          animate={{ y: [0, -24, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex items-center gap-2"
        >
          <motion.div
            animate={{ rotate: [0, -10, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Truck size={32} className="text-[#F59E0B]" />
          </motion.div>
        </motion.div>
        {/* Road line */}
        <div className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-[#2D3748] rounded-full" />
      </div>
    );
  }

  // Step 2 - Millas to shopping
  return (
    <div className="relative w-full h-16 flex items-center justify-center">
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="flex items-center gap-2"
      >
        <motion.div
          className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#F97316] flex items-center justify-center shadow-lg"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <span className="text-slate-900 font-bold text-sm">M</span>
        </motion.div>
        <motion.div
          animate={{ x: [0, 10, 0], opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowRight size={16} className="text-[#F59E0B]" />
        </motion.div>
        <motion.div
          animate={{ scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3B82F6] to-[#60A5FA] flex items-center justify-center shadow-lg"
        >
          <Gamepad2 size={18} className="text-slate-900" />
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ─── Onboarding Screen ─── */
function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState<OnboardingStep>(0);
  const [direction, setDirection] = useState(0);

  const goNext = useCallback(() => {
    if (step < 2) {
      setDirection(1);
      setStep((prev) => (prev + 1) as OnboardingStep);
    } else {
      onComplete();
    }
  }, [step, onComplete]);

  const goBack = useCallback(() => {
    if (step > 0) {
      setDirection(-1);
      setStep((prev) => (prev - 1) as OnboardingStep);
    }
  }, [step]);

  const skip = useCallback(() => onComplete(), [onComplete]);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.95,
    }),
  };

  const current = ONBOARDING_STEPS[step];

  return (
    <motion.div
      className="flex flex-col min-h-[100dvh] bg-white relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0D0E14] via-[#1A1B26]/30 to-[#0D0E14]" />

      {/* Skip Button */}
      <motion.button
        className="absolute top-4 right-4 z-20 text-slate-500 text-sm font-medium px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm"
        onClick={skip}
        whileTap={{ scale: 0.95 }}
      >
        Saltar
      </motion.button>

      {/* Carousel Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
        <div className="w-full max-w-sm">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: EASE_EXPO_OUT }}
              className="flex flex-col items-center"
            >
              {/* Illustration Area */}
              <div className="w-full aspect-[4/3] max-h-[280px] mb-6 flex items-center justify-center">
                <div className="w-full h-full rounded-2xl bg-white border border-slate-200 flex items-center justify-center relative overflow-hidden">
                  {/* Decorative background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#F59E0B]/5 to-[#3B82F6]/5" />
                  {/* Step illustration */}
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] flex items-center justify-center shadow-[0_4px_20px_rgba(245,158,11,0.3)]">
                      {step === 0 && <Truck size={48} className="text-slate-900" />}
                      {step === 1 && (
                        <motion.div
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        >
                          <Truck size={48} className="text-slate-900" />
                        </motion.div>
                      )}
                      {step === 2 && (
                        <motion.div
                          animate={{ rotate: [0, 360] }}
                          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                        >
                          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                            <span className="text-slate-900 font-bold text-xl">M</span>
                          </div>
                        </motion.div>
                      )}
                    </div>
                    <SwipeDemo step={step} />
                  </div>
                </div>
              </div>

              {/* Swipe Instruction Text */}
              <p className="text-[#F59E0B] text-sm font-medium mb-4 text-center">
                {current.swipeText}
              </p>

              {/* Title */}
              <h2 className="font-fredoka font-bold text-2xl text-slate-900 text-center mb-3 leading-tight">
                {current.title}
              </h2>

              {/* Description */}
              <p className="text-slate-500 text-sm text-center leading-relaxed max-w-[300px]">
                {current.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="relative z-10 pb-8 pt-4 px-6">
        {/* Dot Indicators */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={cn(
                'rounded-full transition-colors duration-200',
                i === step
                  ? 'w-6 h-2 bg-[#F59E0B]'
                  : 'w-2 h-2 bg-slate-100'
              )}
              animate={i === step ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.3, ease: EASE_BOUNCE }}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3">
          {step > 0 && (
            <motion.button
              className="w-12 h-12 rounded-full bg-white border border-white/[0.08] flex items-center justify-center text-slate-900"
              onClick={goBack}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <ArrowLeft size={20} />
            </motion.button>
          )}

          <motion.button
            className={cn(
              'flex-1 h-[52px] rounded-2xl font-semibold text-sm uppercase tracking-wider text-slate-900',
              'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]',
              'shadow-[0_4px_16px_rgba(245,158,11,0.35)]',
              'flex items-center justify-center gap-2'
            )}
            onClick={goNext}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            {step === 2 ? (
              <>
                Comenzar
                <Check size={18} />
              </>
            ) : (
              <>
                Siguiente
                <ArrowRight size={18} />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Password Strength Meter ─── */
function PasswordStrength({ password }: { password: string }) {
  const getStrength = useCallback((): { level: number; label: string; color: string } => {
    if (!password) return { level: 0, label: '', color: '' };

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const levels = [
      { level: 1, label: 'Debil', color: 'bg-[#EF4444]' },
      { level: 2, label: 'Regular', color: 'bg-[#F59E0B]' },
      { level: 3, label: 'Buena', color: 'bg-[#3B82F6]' },
      { level: 4, label: 'Fuerte', color: 'bg-[#10B981]' },
    ];

    return levels[Math.min(score, 4) - 1] || levels[0];
  }, []);

  const strength = getStrength();

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              i <= strength.level ? strength.color : 'bg-slate-100'
            )}
          />
        ))}
      </div>
      <p className={cn('text-xs font-medium', strength.color.replace('bg-', 'text-'))}>
        {strength.label}
      </p>
    </div>
  );
}

/* ─── Social Login Buttons ─── */
function SocialLoginButtons() {
  const navigate = useNavigate();

  const handleSocialLogin = useCallback(
    (provider: string) => {
      console.log(`Social login: ${provider}`);
      navigate(LOGIN_PATH);
    },
    [navigate]
  );

  return (
    <div className="space-y-4">
      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-slate-500 text-xs font-medium tracking-wide">
          o continua con
        </span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      {/* Social Buttons Row */}
      <div className="flex items-center justify-center gap-3">
        {/* Google */}
        <motion.button
          className={cn(
            'w-[52px] h-[52px] rounded-full bg-white border border-white/[0.08]',
            'flex items-center justify-center relative overflow-hidden'
          )}
          onClick={() => handleSocialLogin('google')}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <div className="w-6 h-6 relative">
            <svg viewBox="0 0 24 24" className="w-full h-full">
              <path
                fill="#EA4335"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#4285F4"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#34A853"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </div>
        </motion.button>

        {/* Apple */}
        <motion.button
          className={cn(
            'w-[52px] h-[52px] rounded-full bg-white border border-white/[0.08]',
            'flex items-center justify-center'
          )}
          onClick={() => handleSocialLogin('apple')}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.22 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
        </motion.button>

        {/* Phone */}
        <motion.button
          className={cn(
            'w-[52px] h-[52px] rounded-full bg-white border border-white/[0.08]',
            'flex items-center justify-center text-[#10B981]'
          )}
          onClick={() => handleSocialLogin('phone')}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
            <path d="M16.36 1.67c.19 0 .37.07.52.2l.01.01 3.04 3.04c.4.4.4 1.05 0 1.45l-.01.01-1.45 1.45c-.2.19-.46.3-.74.3-.27 0-.54-.11-.73-.3l-1.22-1.22c-.74-.74-1.94-.74-2.68 0l-.85.85c-.74.74-.74 1.94 0 2.68l.01.01 4.56 4.56.01.01c.74.74 1.94.74 2.68 0l.85-.85c.74-.74.74-1.94 0-2.68l-1.22-1.22c-.4-.4-.4-1.05 0-1.45l1.45-1.45c.19-.2.46-.31.73-.31.28 0 .54.11.74.31l3.04 3.04.01.01c.4.4.4 1.05 0 1.45l-.01.01-1.45 1.45c-.2.19-.46.3-.74.3-.27 0-.54-.11-.73-.3l-.37-.37c1.38 2.14 1.1 5.01-.85 6.96l-1.22 1.22c-1.95 1.95-4.82 2.23-6.96.85l-.37.37c.19.19.3.46.3.73 0 .28-.11.54-.3.74l-1.45 1.45-.01.01c-.4.4-1.05.4-1.45 0l-3.04-3.04-.01-.01c-.4-.4-.4-1.05 0-1.45l1.45-1.45c.19-.2.46-.31.73-.31.28 0 .54.11.74.31l1.22 1.22c.74.74 1.94.74 2.68 0l.85-.85c.74-.74.74-1.94 0-2.68l-4.56-4.56c-.74-.74-1.94-.74-2.68 0l-.85.85c-.74.74-.74 1.94 0 2.68l1.22 1.22c.4.4.4 1.05 0 1.45l-1.45 1.45c-.19.19-.46.3-.73.3-.28 0-.54-.11-.74-.3l-3.04-3.04c-.4-.4-.4-1.05 0-1.45l3.04-3.04c.19-.2.46-.31.73-.31.28 0 .54.11.74.31l.37.37c-1.38-2.14-1.1-5.01.85-6.96l1.22-1.22c1.95-1.95 4.82-2.23 6.96-.85l.37-.37c-.4-.4-.4-1.05 0-1.45l1.45-1.45.01-.01c.15-.13.33-.2.52-.2z" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}

/* ─── Login Form ─── */
function LoginForm({
  onSwitchTab,
  onForgot,
  onGuest,
}: {
  onSwitchTab: () => void;
  onForgot: () => void;
  onGuest: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = 'Ingresa tu correo';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = 'Correo invalido';
    if (!password) errs.password = 'Ingresa tu contrasena';
    return errs;
  }, [email, password]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const errs = validate();
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }
      setErrors({});
      // For auth apps, redirect to the actual login flow
      navigate(LOGIN_PATH);
    },
    [validate, navigate]
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.25, ease: EASE_EXPO_OUT }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Input */}
        <motion.div
          animate={shake && errors.email ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <div className="relative">
            <Mail
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: '' }));
              }}
              placeholder="Correo electronico"
              className={cn(
                'w-full h-[52px] rounded-2xl bg-white border text-slate-900 text-sm pl-12 pr-4',
                'placeholder:text-slate-500 outline-none transition-all duration-200',
                'focus:border-[#F59E0B] focus:shadow-[0_0_0_3px_rgba(245,158,11,0.15)]',
                errors.email ? 'border-[#EF4444]' : 'border-white/[0.08]'
              )}
            />
          </div>
          {errors.email && (
            <motion.p
              className="text-[#EF4444] text-xs mt-1 ml-1"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {errors.email}
            </motion.p>
          )}
        </motion.div>

        {/* Password Input */}
        <motion.div
          animate={shake && errors.password ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <div className="relative">
            <Lock
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((p) => ({ ...p, password: '' }));
              }}
              placeholder="Contrasena"
              className={cn(
                'w-full h-[52px] rounded-2xl bg-white border text-slate-900 text-sm pl-12 pr-12',
                'placeholder:text-slate-500 outline-none transition-all duration-200',
                'focus:border-[#F59E0B] focus:shadow-[0_0_0_3px_rgba(245,158,11,0.15)]',
                errors.password ? 'border-[#EF4444]' : 'border-white/[0.08]'
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <motion.p
              className="text-[#EF4444] text-xs mt-1 ml-1"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {errors.password}
            </motion.p>
          )}
        </motion.div>

        {/* Forgot Password Link */}
        <div className="flex justify-end">
          <motion.button
            type="button"
            className="text-[#F59E0B] text-sm font-medium"
            onClick={onForgot}
            whileTap={{ scale: 0.97 }}
          >
            Olvidaste tu contrasena?
          </motion.button>
        </div>

        {/* Login Button */}
        <motion.button
          type="submit"
          className={cn(
            'w-full h-[52px] rounded-2xl font-semibold text-sm uppercase tracking-wider text-slate-900',
            'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]',
            'shadow-[0_4px_16px_rgba(245,158,11,0.35)]',
            'flex items-center justify-center'
          )}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          Iniciar Sesion
        </motion.button>
      </form>

      {/* Social Login */}
      <div className="mt-6">
        <SocialLoginButtons />
      </div>

      {/* Guest Play */}
      <div className="mt-6 text-center">
        <motion.button
          className="text-slate-500 text-sm font-medium underline underline-offset-2 hover:text-slate-900 transition-colors"
          onClick={onGuest}
          whileTap={{ scale: 0.97 }}
        >
          Jugar como invitado
        </motion.button>
        <p className="text-slate-500/60 text-[10px] mt-1">
          Tus TicaMillas no se guardaran
        </p>
      </div>

      {/* Register Link */}
      <div className="mt-6 text-center">
        <p className="text-slate-500 text-sm">
          No tienes cuenta?{' '}
          <motion.button
            className="text-[#F59E0B] font-semibold"
            onClick={onSwitchTab}
            whileTap={{ scale: 0.97 }}
          >
            Crear Cuenta
          </motion.button>
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Register Form ─── */
function RegisterForm({ onSwitchTab }: { onSwitchTab: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Ingresa tu nombre';
    if (!email.trim()) errs.email = 'Ingresa tu correo';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = 'Correo invalido';
    if (!password) errs.password = 'Ingresa una contrasena';
    else if (password.length < 8)
      errs.password = 'Minimo 8 caracteres';
    if (password !== confirmPassword)
      errs.confirmPassword = 'Las contrasenas no coinciden';
    if (!acceptTerms) errs.terms = 'Debes aceptar los terminos';
    return errs;
  }, [name, email, password, confirmPassword, acceptTerms]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const errs = validate();
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }
      setErrors({});
      navigate(LOGIN_PATH);
    },
    [validate, navigate]
  );

  const inputClass = (hasError: boolean) =>
    cn(
      'w-full h-[52px] rounded-2xl bg-white border text-slate-900 text-sm',
      'placeholder:text-slate-500 outline-none transition-all duration-200',
      'focus:border-[#F59E0B] focus:shadow-[0_0_0_3px_rgba(245,158,11,0.15)]',
      hasError ? 'border-[#EF4444]' : 'border-white/[0.08]'
    );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25, ease: EASE_EXPO_OUT }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Input */}
        <motion.div
          animate={shake && errors.name ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <div className="relative">
            <User
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((p) => ({ ...p, name: '' }));
              }}
              placeholder="Nombre completo"
              className={cn(inputClass(!!errors.name), 'pl-12 pr-4')}
            />
          </div>
          {errors.name && (
            <motion.p
              className="text-[#EF4444] text-xs mt-1 ml-1"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {errors.name}
            </motion.p>
          )}
        </motion.div>

        {/* Email Input */}
        <motion.div
          animate={shake && errors.email ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <div className="relative">
            <Mail
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((p) => ({ ...p, email: '' }));
              }}
              placeholder="Correo electronico"
              className={cn(inputClass(!!errors.email), 'pl-12 pr-4')}
            />
          </div>
          {errors.email && (
            <motion.p
              className="text-[#EF4444] text-xs mt-1 ml-1"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {errors.email}
            </motion.p>
          )}
        </motion.div>

        {/* Password Input */}
        <motion.div
          animate={
            shake && errors.password ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}
          }
          transition={{ duration: 0.4 }}
        >
          <div className="relative">
            <Lock
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((p) => ({ ...p, password: '' }));
              }}
              placeholder="Contrasena"
              className={cn(inputClass(!!errors.password), 'pl-12 pr-12')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <PasswordStrength password={password} />
          {errors.password && (
            <motion.p
              className="text-[#EF4444] text-xs mt-1 ml-1"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {errors.password}
            </motion.p>
          )}
        </motion.div>

        {/* Confirm Password */}
        <motion.div
          animate={
            shake && errors.confirmPassword
              ? { x: [-8, 8, -6, 6, -4, 4, 0] }
              : {}
          }
          transition={{ duration: 0.4 }}
        >
          <div className="relative">
            <Lock
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword)
                  setErrors((p) => ({ ...p, confirmPassword: '' }));
              }}
              placeholder="Confirmar contrasena"
              className={cn(inputClass(!!errors.confirmPassword), 'pl-12 pr-12')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors"
            >
              {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <motion.p
              className="text-[#EF4444] text-xs mt-1 ml-1"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {errors.confirmPassword}
            </motion.p>
          )}
        </motion.div>

        {/* Terms Checkbox */}
        <motion.div
          className="flex items-start gap-3"
          animate={
            shake && errors.terms ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}
          }
          transition={{ duration: 0.4 }}
        >
          <button
            type="button"
            onClick={() => {
              setAcceptTerms(!acceptTerms);
              if (errors.terms) setErrors((p) => ({ ...p, terms: '' }));
            }}
            className={cn(
              'mt-0.5 w-5 h-5 rounded-[4px] border flex items-center justify-center shrink-0 transition-all duration-150',
              acceptTerms
                ? 'bg-[#F59E0B] border-[#F59E0B]'
                : 'border-white/[0.08] bg-transparent'
            )}
          >
            {acceptTerms && <Check size={14} className="text-slate-900" />}
          </button>
          <p className="text-slate-500 text-sm leading-relaxed">
            Acepto los{' '}
            <span className="text-[#F59E0B] font-medium">Terminos</span> y{' '}
            <span className="text-[#F59E0B] font-medium">condiciones</span>
          </p>
        </motion.div>
        {errors.terms && (
          <motion.p
            className="text-[#EF4444] text-xs -mt-2 ml-1"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {errors.terms}
          </motion.p>
        )}

        {/* Register Button */}
        <motion.button
          type="submit"
          className={cn(
            'w-full h-[52px] rounded-2xl font-semibold text-sm uppercase tracking-wider text-slate-900',
            'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]',
            'shadow-[0_4px_16px_rgba(245,158,11,0.35)]',
            'flex items-center justify-center'
          )}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          Crear Cuenta
        </motion.button>
      </form>

      {/* Login Link */}
      <div className="mt-6 text-center">
        <p className="text-slate-500 text-sm">
          Ya tienes cuenta?{' '}
          <motion.button
            className="text-[#F59E0B] font-semibold"
            onClick={onSwitchTab}
            whileTap={{ scale: 0.97 }}
          >
            Iniciar Sesion
          </motion.button>
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Forgot Password Flow ─── */
function ForgotPasswordFlow({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<ForgotStep>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shake, setShake] = useState(false);

  const handleSendCode = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setErrors({ email: 'Correo invalido' });
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }
      setErrors({});
      setStep('code');
    },
    [email]
  );

  const handleVerifyCode = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (code.length !== 6) {
        setErrors({ code: 'Ingresa el codigo de 6 digitos' });
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }
      setErrors({});
      setStep('password');
    },
    [code]
  );

  const handleResetPassword = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newPassword || newPassword.length < 8) {
        setErrors({ newPassword: 'Minimo 8 caracteres' });
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }
      setErrors({});
      onBack();
    },
    [newPassword, onBack]
  );

  const inputClass = (hasError: boolean) =>
    cn(
      'w-full h-[52px] rounded-2xl bg-white border text-slate-900 text-sm px-4',
      'placeholder:text-slate-500 outline-none transition-all duration-200',
      'focus:border-[#F59E0B] focus:shadow-[0_0_0_3px_rgba(245,158,11,0.15)]',
      hasError ? 'border-[#EF4444]' : 'border-white/[0.08]'
    );

  return (
    <motion.div
      className="min-h-[100dvh] bg-white flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0D0E14] via-[#1A1B26]/20 to-[#0D0E14] pointer-events-none" />

      <div className="relative z-10 flex-1 flex flex-col px-6 py-4 max-w-sm mx-auto w-full">
        {/* Back Button */}
        <motion.button
          className="w-10 h-10 rounded-full bg-white border border-white/[0.08] flex items-center justify-center text-slate-900 mb-6 self-start"
          onClick={onBack}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowLeft size={20} />
        </motion.button>

        {/* Handle bar */}
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-6" />

        <AnimatePresence mode="wait">
          {step === 'email' && (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: EASE_EXPO_OUT }}
            >
              <h2 className="font-fredoka font-bold text-2xl text-slate-900 mb-2">
                Recuperar Contrasena
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                Ingresa tu correo y te enviaremos un codigo para restablecer tu
                contrasena.
              </p>

              <form onSubmit={handleSendCode}>
                <motion.div
                  animate={
                    shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}
                  }
                  transition={{ duration: 0.4 }}
                  className="mb-4"
                >
                  <div className="relative">
                    <Mail
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email)
                          setErrors((p) => ({ ...p, email: '' }));
                      }}
                      placeholder="Correo electronico"
                      className={cn(inputClass(!!errors.email), 'pl-12')}
                    />
                  </div>
                  {errors.email && (
                    <motion.p
                      className="text-[#EF4444] text-xs mt-1 ml-1"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {errors.email}
                    </motion.p>
                  )}
                </motion.div>

                <motion.button
                  type="submit"
                  className={cn(
                    'w-full h-[52px] rounded-2xl font-semibold text-sm uppercase tracking-wider text-slate-900',
                    'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]',
                    'shadow-[0_4px_16px_rgba(245,158,11,0.35)]',
                    'flex items-center justify-center'
                  )}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  Enviar Codigo
                </motion.button>
              </form>
            </motion.div>
          )}

          {step === 'code' && (
            <motion.div
              key="code"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: EASE_EXPO_OUT }}
            >
              <h2 className="font-fredoka font-bold text-2xl text-slate-900 mb-2">
                Verificar Codigo
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                Ingresa el codigo de 6 digitos que enviamos a{' '}
                <span className="text-slate-900 font-medium">{email}</span>
              </p>

              <form onSubmit={handleVerifyCode}>
                <motion.div
                  animate={
                    shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}
                  }
                  transition={{ duration: 0.4 }}
                  className="mb-4"
                >
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setCode(val);
                      if (errors.code) setErrors((p) => ({ ...p, code: '' }));
                    }}
                    placeholder="000000"
                    className={cn(
                      inputClass(!!errors.code),
                      'text-center text-2xl font-mono font-bold tracking-[0.3em]'
                    )}
                  />
                  {errors.code && (
                    <motion.p
                      className="text-[#EF4444] text-xs mt-1 ml-1"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {errors.code}
                    </motion.p>
                  )}
                </motion.div>

                <motion.button
                  type="submit"
                  className={cn(
                    'w-full h-[52px] rounded-2xl font-semibold text-sm uppercase tracking-wider text-slate-900',
                    'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]',
                    'shadow-[0_4px_16px_rgba(245,158,11,0.35)]',
                    'flex items-center justify-center'
                  )}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  Verificar
                </motion.button>

                <button
                  type="button"
                  className="w-full mt-4 text-center text-slate-500 text-sm hover:text-[#F59E0B] transition-colors"
                  onClick={() => setStep('email')}
                >
                  Reenviar codigo
                </button>
              </form>
            </motion.div>
          )}

          {step === 'password' && (
            <motion.div
              key="password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: EASE_EXPO_OUT }}
            >
              <h2 className="font-fredoka font-bold text-2xl text-slate-900 mb-2">
                Nueva Contrasena
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                Crea una nueva contrasena segura para tu cuenta.
              </p>

              <form onSubmit={handleResetPassword}>
                <motion.div
                  animate={
                    shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : {}
                  }
                  transition={{ duration: 0.4 }}
                  className="mb-4"
                >
                  <div className="relative">
                    <Lock
                      size={20}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (errors.newPassword)
                          setErrors((p) => ({ ...p, newPassword: '' }));
                      }}
                      placeholder="Nueva contrasena"
                      className={cn(inputClass(!!errors.newPassword), 'pl-12 pr-12')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <PasswordStrength password={newPassword} />
                  {errors.newPassword && (
                    <motion.p
                      className="text-[#EF4444] text-xs mt-1 ml-1"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {errors.newPassword}
                    </motion.p>
                  )}
                </motion.div>

                <motion.button
                  type="submit"
                  className={cn(
                    'w-full h-[52px] rounded-2xl font-semibold text-sm uppercase tracking-wider text-slate-900',
                    'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]',
                    'shadow-[0_4px_16px_rgba(245,158,11,0.35)]',
                    'flex items-center justify-center'
                  )}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  Restablecer Contrasena
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── Auth Screen (Login / Register) ─── */
function AuthScreen({
  initialTab = 'login',
  onForgot,
}: {
  initialTab?: AuthTab;
  onForgot: () => void;
}) {
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const navigate = useNavigate();

  const handleGuest = useCallback(() => {
    navigate('/game');
  }, [navigate]);

  return (
    <motion.div
      className="min-h-[100dvh] bg-white flex flex-col relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0D0E14] via-[#1A1B26]/10 to-[#0D0E14] pointer-events-none" />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-8 max-w-sm mx-auto w-full">
        {/* Logo */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_EXPO_OUT }}
        >
          <motion.div
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#FBBF24] flex items-center justify-center shadow-[0_4px_20px_rgba(245,158,11,0.3)]"
          >
            <Truck size={32} className="text-slate-900" />
          </motion.div>
        </motion.div>

        {/* Welcome Title */}
        <motion.h1
          className="font-fredoka font-bold text-[28px] text-slate-900 text-center mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3, ease: EASE_EXPO_OUT }}
        >
          Bienvenido!
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-slate-500 text-sm text-center mb-6 max-w-[280px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          Inicia sesion para guardar tus TicaMillas y redimir premios.
        </motion.p>

        {/* Auth Tabs */}
        <motion.div
          className="w-full mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.3, ease: EASE_EXPO_OUT }}
        >
          <div className="flex items-center bg-white rounded-full p-1 h-[44px]">
            {(['login', 'register'] as AuthTab[]).map((tab) => (
              <motion.button
                key={tab}
                className={cn(
                  'flex-1 h-full rounded-full text-sm font-semibold transition-colors relative',
                  activeTab === tab
                    ? 'text-slate-900'
                    : 'text-slate-500 hover:text-slate-500'
                )}
                onClick={() => setActiveTab(tab)}
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="auth-tab-pill"
                    className="absolute inset-0 bg-slate-100 rounded-full shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">
                  {tab === 'login' ? 'Iniciar Sesion' : 'Crear Cuenta'}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Form Area */}
        <div className="w-full">
          <AnimatePresence mode="wait">
            {activeTab === 'login' ? (
              <LoginForm
                key="login"
                onSwitchTab={() => setActiveTab('register')}
                onForgot={onForgot}
                onGuest={handleGuest}
              />
            ) : (
              <RegisterForm
                key="register"
                onSwitchTab={() => setActiveTab('login')}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main Auth Page ─── */
export default function Auth() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  // Check if user has seen onboarding before
  useEffect(() => {
    const seen = localStorage.getItem('truck-surfers-onboarding');
    if (seen) {
      setHasSeenOnboarding(true);
    }
  }, []);

  const handleSplashComplete = useCallback(() => {
    if (hasSeenOnboarding) {
      setScreen('auth');
    } else {
      setScreen('onboarding');
    }
  }, [hasSeenOnboarding]);

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem('truck-surfers-onboarding', 'true');
    setScreen('auth');
  }, []);

  const handleForgot = useCallback(() => {
    setScreen('forgot');
  }, []);

  const handleBackFromForgot = useCallback(() => {
    setScreen('auth');
  }, []);

  return (
    <div className="min-h-[100dvh] bg-white">
      <AnimatePresence mode="wait">
        {screen === 'splash' && (
          <SplashScreen key="splash" onComplete={handleSplashComplete} />
        )}

        {screen === 'onboarding' && (
          <OnboardingScreen
            key="onboarding"
            onComplete={handleOnboardingComplete}
          />
        )}

        {screen === 'auth' && (
          <AuthScreen key="auth" onForgot={handleForgot} />
        )}

        {screen === 'forgot' && (
          <ForgotPasswordFlow key="forgot" onBack={handleBackFromForgot} />
        )}
      </AnimatePresence>
    </div>
  );
}
