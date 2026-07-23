// ─────────────────────────────────────────────────────────────────────────────
// PERSONALIZACIÓN DEL CAMIÓN (F8) — "El Taller"
// Categorías: skin (color), bocina, luces, remolque y sticker.
// Los bonuses son muy pequeños (+1-2% por pieza) y se aplican al CPS por click.
// ─────────────────────────────────────────────────────────────────────────────

export type CustomCategory =
  | 'skin'
  | 'horn'
  | 'lights'
  | 'trailer'
  | 'sticker'
  | 'trailEffect'
  | 'avatarFrame';

export type PartCurrency = 'millas' | 'tickets' | 'cps';

export interface TruckPart {
  id: string;
  category: CustomCategory;
  name: string;
  emoji: string;
  description: string;
  cost: number;
  currency: PartCurrency;
  /** Bonus al CPS por click (porcentaje, muy pequeño). */
  bonusPct?: number;
  /** skins: rotación de tono sobre el PNG del camión (grados). */
  hueRotate?: number;
  /** skins: filtro CSS adicional (brightness, saturate...). */
  filterExtra?: string;
  /** luces: color del glow alrededor del camión. */
  glowColor?: string;
  /** trailEffect: color de la estela bajo el camión. */
  trailColor?: string;
  /** avatarFrame: color del marco del avatar en el perfil. */
  frameColor?: string;
  /** true = solo se obtiene con el pase cosmético (F16); no se vende en El Taller. */
  passExclusive?: boolean;
}

export const CUSTOM_CATEGORIES: { id: CustomCategory; label: string; emoji: string }[] = [
  { id: 'skin', label: 'Skin', emoji: '🎨' },
  { id: 'horn', label: 'Bocina', emoji: '📢' },
  { id: 'lights', label: 'Luces', emoji: '💡' },
  { id: 'trailer', label: 'Remolque', emoji: '🚚' },
  { id: 'sticker', label: 'Sticker', emoji: '⭐' },
  { id: 'trailEffect', label: 'Estela', emoji: '💨' },
  { id: 'avatarFrame', label: 'Marco', emoji: '🖼️' },
];

export const TRUCK_PARTS: TruckPart[] = [
  // ── Skins ──
  {
    id: 'skin-roja',
    category: 'skin',
    name: 'Roja Furiosa',
    emoji: '🔴',
    description: 'Rojo carmesí que impone respeto en la autopista.',
    cost: 50_000,
    currency: 'millas',
    hueRotate: -30,
  },
  {
    id: 'skin-azul',
    category: 'skin',
    name: 'Azul Pacífico',
    emoji: '🔵',
    description: 'Azul profundo como la costa del Pacífico.',
    cost: 75_000,
    currency: 'millas',
    hueRotate: 170,
  },
  {
    id: 'skin-verde',
    category: 'skin',
    name: 'Verde Selva',
    emoji: '🟢',
    description: 'Verde esmeralda, orgullo del eje cafetero.',
    cost: 100_000,
    currency: 'millas',
    hueRotate: 80,
  },
  {
    id: 'skin-negra',
    category: 'skin',
    name: 'Negra Fantasma',
    emoji: '⚫',
    description: 'Negra mate: la mula que nunca pasa desapercibida.',
    cost: 250_000,
    currency: 'millas',
    hueRotate: 0,
    filterExtra: 'brightness(0.55) saturate(0.6)',
  },
  {
    id: 'skin-dorada',
    category: 'skin',
    name: 'Dorada Legendaria',
    emoji: '🟡',
    description: 'Dorada de pies a cabeza. Solo para magnates.',
    cost: 150,
    currency: 'tickets',
    hueRotate: 15,
    filterExtra: 'saturate(2) brightness(1.2)',
    bonusPct: 2,
  },

  // ── Bocinas ──
  {
    id: 'horn-claxon',
    category: 'horn',
    name: 'Claxón Clásico',
    emoji: '📢',
    description: 'El pito de toda la vida, infaltable en el trancón.',
    cost: 5_000,
    currency: 'millas',
  },
  {
    id: 'horn-tren',
    category: 'horn',
    name: 'Bocina de Tren',
    emoji: '🚂',
    description: 'Suena como ferrocarril: todos se quitan del paso.',
    cost: 20_000,
    currency: 'millas',
  },
  {
    id: 'horn-melodia',
    category: 'horn',
    name: 'Melodía Cumbiera',
    emoji: '🎺',
    description: 'Toca cumbia al pitarse. Alegra cualquier carretera.',
    cost: 50_000,
    currency: 'millas',
    bonusPct: 1,
  },

  // ── Luces ──
  {
    id: 'lights-neon',
    category: 'lights',
    name: 'Neón Andino',
    emoji: '💡',
    description: 'Glow cian bajo el chasis, estilo nocturno.',
    cost: 30_000,
    currency: 'millas',
    glowColor: '#22D3EE',
  },
  {
    id: 'lights-xenon',
    category: 'lights',
    name: 'Xenón Blanco',
    emoji: '🔦',
    description: 'Luces blancas de largo alcance para la trocha.',
    cost: 60_000,
    currency: 'millas',
    glowColor: '#F8FAFC',
  },
  {
    id: 'lights-demon',
    category: 'lights',
    name: 'Ojos de Demonio',
    emoji: '😈',
    description: 'Glow rojo intimidante para las curvas de la Línea.',
    cost: 100,
    currency: 'tickets',
    glowColor: '#EF4444',
    bonusPct: 1,
  },

  // ── Remolques ──
  {
    id: 'trailer-plataforma',
    category: 'trailer',
    name: 'Plataforma',
    emoji: '🛻',
    description: 'Plataforma abierta para carga de todo tipo.',
    cost: 20_000,
    currency: 'millas',
  },
  {
    id: 'trailer-cisterna',
    category: 'trailer',
    name: 'Cisterna',
    emoji: '🛢️',
    description: 'Cisterna cromada para líquidos de alto valor.',
    cost: 40_000,
    currency: 'millas',
  },
  {
    id: 'trailer-refrigerado',
    category: 'trailer',
    name: 'Refrigerado',
    emoji: '🧊',
    description: 'Cuarto frío móvil: carga perecedera premium.',
    cost: 80_000,
    currency: 'millas',
    bonusPct: 1,
  },

  // ── Stickers ──
  {
    id: 'sticker-flama',
    category: 'sticker',
    name: 'Flamas',
    emoji: '🔥',
    description: 'Flamas en el capó: pura velocidad.',
    cost: 5_000,
    currency: 'millas',
  },
  {
    id: 'sticker-calavera',
    category: 'sticker',
    name: 'Calavera',
    emoji: '💀',
    description: 'La calavera de los camioneros de la vieja guardia.',
    cost: 15_000,
    currency: 'millas',
  },
  {
    id: 'sticker-corona',
    category: 'sticker',
    name: 'Corona del Rey',
    emoji: '👑',
    description: 'La corona del rey de la carretera.',
    cost: 30,
    currency: 'tickets',
    bonusPct: 1,
  },

  // ── Exclusivos del pase cosmético (F16): SIN bonus de CPS ──
  {
    id: 'trail-gold',
    category: 'trailEffect',
    name: 'Estela Dorada',
    emoji: '✨',
    description: 'Una estela dorada que anuncia tu paso por la autopista.',
    cost: 0,
    currency: 'tickets',
    passExclusive: true,
    trailColor: '#FFD700',
  },
  {
    id: 'trail-neon',
    category: 'trailEffect',
    name: 'Estela Neón',
    emoji: '💠',
    description: 'Estela cian eléctrica, pura noche de ciudad.',
    cost: 0,
    currency: 'tickets',
    passExclusive: true,
    trailColor: '#22D3EE',
  },
  {
    id: 'trail-fire',
    category: 'trailEffect',
    name: 'Estela Ígnea',
    emoji: '🔥',
    description: 'Fuego puro saliendo del escape.',
    cost: 0,
    currency: 'tickets',
    passExclusive: true,
    trailColor: '#EF4444',
  },
  {
    id: 'frame-gold',
    category: 'avatarFrame',
    name: 'Marco Dorado',
    emoji: '🏆',
    description: 'Marco dorado para tu avatar de camionero elite.',
    cost: 0,
    currency: 'tickets',
    passExclusive: true,
    frameColor: '#F59E0B',
  },
  {
    id: 'frame-diamond',
    category: 'avatarFrame',
    name: 'Marco Diamante',
    emoji: '💎',
    description: 'Marco diamante: brillo frío de leyenda.',
    cost: 0,
    currency: 'tickets',
    passExclusive: true,
    frameColor: '#67E8F9',
  },
  {
    id: 'lights-galactic',
    category: 'lights',
    name: 'Luces Galácticas',
    emoji: '🌌',
    description: 'Glow violeta interestelar bajo el chasis.',
    cost: 0,
    currency: 'tickets',
    passExclusive: true,
    glowColor: '#A855F7',
  },
  {
    id: 'skin-camaleon',
    category: 'skin',
    name: 'Skin Camaleón',
    emoji: '🦎',
    description: 'Colores vivos que cambian con la luz de la carretera.',
    cost: 0,
    currency: 'tickets',
    passExclusive: true,
    hueRotate: 120,
    filterExtra: 'saturate(1.8) brightness(1.1)',
  },
  {
    id: 'horn-sinfonica',
    category: 'horn',
    name: 'Bocina Sinfónica',
    emoji: '🎼',
    description: 'Una orquesta completa en cada pitazo.',
    cost: 0,
    currency: 'tickets',
    passExclusive: true,
  },
  {
    id: 'sticker-rayo',
    category: 'sticker',
    name: 'Sticker Rayo',
    emoji: '⚡',
    description: 'El rayo de los más rápidos de la vía.',
    cost: 0,
    currency: 'tickets',
    passExclusive: true,
  },
  {
    id: 'trailer-luxury',
    category: 'trailer',
    name: 'Remolque Luxury',
    emoji: '🚛',
    description: 'Remolque cromado con acabados de lujo.',
    cost: 0,
    currency: 'tickets',
    passExclusive: true,
  },
];

export function getTruckPart(id: string): TruckPart | undefined {
  return TRUCK_PARTS.find((p) => p.id === id);
}

export function partsByCategory(category: CustomCategory): TruckPart[] {
  return TRUCK_PARTS.filter((p) => p.category === category);
}

export type EquippedParts = Record<CustomCategory, string | null>;

export const DEFAULT_EQUIPPED: EquippedParts = {
  skin: null,
  horn: null,
  lights: null,
  trailer: null,
  sticker: null,
  trailEffect: null,
  avatarFrame: null,
};

/** Bonus multiplicador total de las piezas equipadas (1 + Σ bonusPct/100). */
export function computeCustomizationBonus(equipped: EquippedParts): number {
  let bonus = 0;
  for (const id of Object.values(equipped)) {
    if (!id) continue;
    const part = getTruckPart(id);
    if (part?.bonusPct) bonus += part.bonusPct;
  }
  return 1 + bonus / 100;
}

export interface TruckVisual {
  /** Filtro CSS completo (skin + glow de luces). */
  filter?: string;
  stickerEmoji?: string;
  trailerEmoji?: string;
  /** Color de la estela equipada (F16). */
  trailColor?: string;
  /** Color del marco de avatar equipado (F16). */
  frameColor?: string;
}

/** Apariencia del camión según las piezas equipadas. */
export function getTruckVisual(equipped: EquippedParts): TruckVisual {
  const filters: string[] = [];
  const visual: TruckVisual = {};

  const skin = equipped.skin ? getTruckPart(equipped.skin) : undefined;
  if (skin?.hueRotate !== undefined) filters.push(`hue-rotate(${skin.hueRotate}deg)`);
  if (skin?.filterExtra) filters.push(skin.filterExtra);

  const lights = equipped.lights ? getTruckPart(equipped.lights) : undefined;
  if (lights?.glowColor) {
    filters.push(`drop-shadow(0 6px 18px ${lights.glowColor})`);
  }

  if (filters.length > 0) visual.filter = filters.join(' ');
  if (equipped.sticker) visual.stickerEmoji = getTruckPart(equipped.sticker)?.emoji;
  if (equipped.trailer) visual.trailerEmoji = getTruckPart(equipped.trailer)?.emoji;
  const trail = equipped.trailEffect ? getTruckPart(equipped.trailEffect) : undefined;
  if (trail?.trailColor) visual.trailColor = trail.trailColor;
  const frame = equipped.avatarFrame ? getTruckPart(equipped.avatarFrame) : undefined;
  if (frame?.frameColor) visual.frameColor = frame.frameColor;
  return visual;
}
