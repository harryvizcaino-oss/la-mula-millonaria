import { motion } from 'framer-motion';

interface SmilingTruckProps {
  bump?: boolean;
  happy?: boolean;
  size?: number;
}

export function SmilingTruck({ bump = false, happy = false, size = 180 }: SmilingTruckProps) {
  const scale = size / 180;
  return (
    <motion.svg
      width={size}
      height={size * 0.68}
      viewBox="0 0 180 122"
      animate={bump ? { scale: [1, 0.92, 1.05, 1], y: [0, 4, 0] } : { scale: 1, y: [0, -3, 0] }}
      transition={bump ? { duration: 0.22 } : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      style={{ filter: 'drop-shadow(0 14px 28px rgba(0,0,0,0.45))', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="cargoDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#DC2626" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
        <linearGradient id="cabDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1F2937" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="windowDark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="grilleGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="50%" stopColor="#6B7280" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
        <radialGradient id="wheelDark" cx="0.5" cy="0.5" r="0.5">
          <stop offset="60%" stopColor="#111827" />
          <stop offset="100%" stopColor="#000000" />
        </radialGradient>
      </defs>

      {/* Exhaust pipe */}
      <rect x="6" y="68" width="10" height="18" rx="2" fill="#4B5563" stroke="#1F2937" strokeWidth="2" />

      {/* Cargo trailer */}
      <rect x="14" y="24" width="108" height="68" rx="10" fill="url(#cargoDark)" stroke="#7F1D1D" strokeWidth="3" />
      {/* Trailer stripes */}
      <rect x="32" y="24" width="8" height="68" fill="#FCA5A5" opacity="0.5" />
      <rect x="62" y="24" width="8" height="68" fill="#FCA5A5" opacity="0.5" />
      <rect x="92" y="24" width="8" height="68" fill="#FCA5A5" opacity="0.5" />
      {/* Trailer rivets */}
      <circle cx="24" cy="34" r="2" fill="#FCA5A5" opacity="0.4" />
      <circle cx="24" cy="82" r="2" fill="#FCA5A5" opacity="0.4" />
      <circle cx="112" cy="34" r="2" fill="#FCA5A5" opacity="0.4" />
      <circle cx="112" cy="82" r="2" fill="#FCA5A5" opacity="0.4" />

      {/* Cab */}
      <path d="M122 92 L122 28 L164 28 C174 28 178 38 178 52 L178 92 Z" fill="url(#cabDark)" stroke="#1F2937" strokeWidth="3" />
      {/* Roof light */}
      <rect x="140" y="22" width="20" height="6" rx="2" fill="#FACC15" stroke="#B45309" strokeWidth="1.5" />

      {/* Window */}
      <path d="M126 34 L160 34 C166 34 170 40 172 48 L172 64 L126 64 Z" fill="url(#windowDark)" stroke="#0EA5E9" strokeWidth="2" />

      {/* Sunglasses / eyes */}
      <g transform="translate(0, 1)">
        {/* Sunglasses frame */}
        <path d="M134 46 L150 46 L150 54 L134 54 Z" fill="#111827" stroke="#F59E0B" strokeWidth="1.5" rx="2" />
        <path d="M154 46 L170 46 L170 54 L154 54 Z" fill="#111827" stroke="#F59E0B" strokeWidth="1.5" rx="2" />
        <line x1="150" y1="50" x2="154" y2="50" stroke="#111827" strokeWidth="2" />
        {/* Reflection */}
        <motion.path
          d="M136 48 L142 48"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={happy ? 0.6 : 0.3}
        />
        <motion.path
          d="M156 48 L162 48"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={happy ? 0.6 : 0.3}
        />
        {/* Smile */}
        <motion.path
          d="M142 62 Q152 68 162 62"
          fill="none"
          stroke="#FACC15"
          strokeWidth="3"
          strokeLinecap="round"
          animate={happy ? { d: 'M142 62 Q152 72 162 62' } : { d: 'M142 62 Q152 68 162 62' }}
          transition={{ duration: 0.15 }}
        />
      </g>

      {/* Grille */}
      <rect x="172" y="58" width="8" height="26" rx="1" fill="url(#grilleGrad)" stroke="#1F2937" strokeWidth="1.5" />
      <line x1="174" y1="62" x2="178" y2="62" stroke="#1F2937" strokeWidth="1" />
      <line x1="174" y1="68" x2="178" y2="68" stroke="#1F2937" strokeWidth="1" />
      <line x1="174" y1="74" x2="178" y2="74" stroke="#1F2937" strokeWidth="1" />
      <line x1="174" y1="80" x2="178" y2="80" stroke="#1F2937" strokeWidth="1" />

      {/* Bumper */}
      <rect x="120" y="90" width="62" height="10" rx="3" fill="#4B5563" stroke="#1F2937" strokeWidth="2" />

      {/* Headlight */}
      <circle cx="176" cy="72" r="5" fill="#FEF08A" stroke="#F59E0B" strokeWidth="2" />

      {/* Wheels - rugged */}
      <circle cx="42" cy="98" r="17" fill="url(#wheelDark)" stroke="#111827" strokeWidth="3" />
      <circle cx="42" cy="98" r="7" fill="#9CA3AF" />
      <circle cx="96" cy="98" r="17" fill="url(#wheelDark)" stroke="#111827" strokeWidth="3" />
      <circle cx="96" cy="98" r="7" fill="#9CA3AF" />
      <circle cx="158" cy="98" r="17" fill="url(#wheelDark)" stroke="#111827" strokeWidth="3" />
      <circle cx="158" cy="98" r="7" fill="#9CA3AF" />

      {/* Wheel treads */}
      <circle cx="42" cy="98" r="13" fill="none" stroke="#374151" strokeWidth="2" strokeDasharray="4 3" />
      <circle cx="96" cy="98" r="13" fill="none" stroke="#374151" strokeWidth="2" strokeDasharray="4 3" />
      <circle cx="158" cy="98" r="13" fill="none" stroke="#374151" strokeWidth="2" strokeDasharray="4 3" />
    </motion.svg>
  );
}
