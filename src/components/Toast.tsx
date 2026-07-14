import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  visible: boolean;
  onClose: () => void;
  duration?: number;
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    borderColor: '#10B981',
    bgColor: 'bg-[#10B981]/10',
  },
  error: {
    icon: AlertCircle,
    borderColor: '#EF4444',
    bgColor: 'bg-[#EF4444]/10',
  },
  info: {
    icon: Info,
    borderColor: '#3B82F6',
    bgColor: 'bg-[#3B82F6]/10',
  },
  warning: {
    icon: AlertTriangle,
    borderColor: '#F59E0B',
    bgColor: 'bg-[#F59E0B]/10',
  },
};

export default function Toast({ message, type, visible, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (visible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  const config = toastConfig[type];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
          className={cn(
            'fixed top-4 left-1/2 z-[100]',
            'flex items-center gap-3',
            'px-4 py-3 rounded-2xl',
            'bg-slate-100 min-w-[280px] max-w-[90vw]',
            'shadow-lg'
          )}
          style={{ borderLeft: `4px solid ${config.borderColor}` }}
        >
          <Icon size={20} color={config.borderColor} className="flex-shrink-0" />
          <p className="text-slate-900 text-sm font-medium flex-1">{message}</p>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
