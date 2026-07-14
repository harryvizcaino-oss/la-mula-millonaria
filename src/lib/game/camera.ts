export interface CameraShake {
  x: number;
  y: number;
  intensity: number;
  trauma: number;
  traumaDecay: number;
  directionX: number;
  directionY: number;
  noiseOffset: number;
  traumaMax: number;
}

export function createCameraShake(): CameraShake {
  return {
    x: 0,
    y: 0,
    intensity: 0,
    trauma: 0,
    traumaDecay: 0.85,
    directionX: 0,
    directionY: 0,
    noiseOffset: 0,
    traumaMax: 1,
  };
}

/** Add traumatic impulse. direction should be normalized or zero for random. */
export function addTrauma(
  cam: CameraShake,
  amount: number,
  directionX = 0,
  directionY = 0,
  decay = 0.85
) {
  cam.trauma = Math.min(cam.traumaMax, cam.trauma + amount);
  cam.traumaDecay = decay;
  // Normalize direction if provided
  const len = Math.hypot(directionX, directionY);
  if (len > 0.001) {
    cam.directionX = directionX / len;
    cam.directionY = directionY / len;
  } else {
    cam.directionX = 0;
    cam.directionY = 0;
  }
}

/** Perlin-ish noise using simplex-like interpolation for organic shake. */
function noise(n: number) {
  return Math.sin(n * 12.9898) * 43758.5453 - Math.floor(Math.sin(n * 12.9898) * 43758.5453);
}

function smoothNoise(n: number) {
  const i = Math.floor(n);
  const f = n - i;
  const a = noise(i);
  const b = noise(i + 1);
  return a + (b - a) * f * f * (3 - 2 * f);
}

export function updateCameraShake(cam: CameraShake, dt: number) {
  if (cam.trauma <= 0.001) {
    cam.x = 0;
    cam.y = 0;
    cam.intensity = 0;
    cam.trauma = 0;
    return;
  }

  cam.noiseOffset += dt * 18;
  // Higher trauma = higher frequency and amplitude
  const shake = Math.pow(cam.trauma, 2); // quadratic makes small trauma subtle, big trauma huge
  cam.intensity = shake * 20;

  const nx = smoothNoise(cam.noiseOffset);
  const ny = smoothNoise(cam.noiseOffset + 100);

  // Blend directional shake with random noise
  const dirWeight = Math.hypot(cam.directionX, cam.directionY) > 0.001 ? 0.6 : 0;
  const randomWeight = 1 - dirWeight;

  cam.x =
    shake *
    (cam.directionX * dirWeight * 14 + nx * randomWeight * 10);
  cam.y =
    shake *
    (cam.directionY * dirWeight * 14 + ny * randomWeight * 10);

  cam.trauma *= Math.pow(cam.traumaDecay, dt * 60);
  if (cam.trauma < 0.001) cam.trauma = 0;
}

export interface ScreenFlash {
  color: string;
  intensity: number;
  decay: number;
}

export function createScreenFlash(): ScreenFlash {
  return { color: '#EF4444', intensity: 0, decay: 2.5 };
}

export function triggerFlash(flash: ScreenFlash, color: string, intensity: number, decay = 2.5) {
  flash.color = color;
  flash.intensity = Math.max(flash.intensity, intensity);
  flash.decay = decay;
}

export function updateScreenFlash(flash: ScreenFlash, dt: number) {
  flash.intensity -= flash.decay * dt;
  if (flash.intensity < 0) flash.intensity = 0;
}

/** Draw the current flash over the screen. */
export function renderScreenFlash(
  ctx: CanvasRenderingContext2D,
  flash: ScreenFlash,
  w: number,
  h: number
) {
  if (flash.intensity <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(0.7, flash.intensity);
  ctx.fillStyle = flash.color;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
