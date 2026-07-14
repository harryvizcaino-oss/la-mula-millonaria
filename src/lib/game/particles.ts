export type ParticleType = 'spark' | 'smoke' | 'dust' | 'speedline' | 'debris';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: ParticleType;
  rotation: number;
  rotationSpeed: number;
  drag: number;
  gravity: number;
  trail: { x: number; y: number }[];
}

export function createParticle(
  x: number,
  y: number,
  vx: number,
  vy: number,
  life: number,
  color: string,
  size: number,
  type: ParticleType
): Particle {
  return {
    x,
    y,
    vx,
    vy,
    life,
    maxLife: life,
    color,
    size,
    type,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 8,
    drag: type === 'smoke' ? 0.96 : type === 'dust' ? 0.92 : 0.86,
    gravity: type === 'smoke' ? -15 : type === 'speedline' ? 0 : 220,
    trail: [],
  };
}

export function spawnParticles(
  particles: Particle[],
  x: number,
  y: number,
  color: string,
  count: number,
  type: ParticleType = 'spark',
  speedMin = 60,
  speedMax = 140
) {
  const maxSpawn = Math.max(0, 180 - particles.length);
  const actualCount = Math.min(count, maxSpawn);
  for (let i = 0; i < actualCount; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.8;
    const speed = speedMin + Math.random() * (speedMax - speedMin);
    const size = 2 + Math.random() * 4;
    const life = 0.35 + Math.random() * 0.45;
    particles.push(
      createParticle(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 30,
        life,
        color,
        size,
        type
      )
    );
  }
}

export function spawnDust(
  particles: Particle[],
  x: number,
  y: number,
  count: number,
  color = 'rgba(160,160,160,0.35)',
  intensity = 1
) {
  for (let i = 0; i < count; i++) {
    const offset = (Math.random() - 0.5) * 30 * intensity;
    particles.push(
      createParticle(
        x + offset,
        y,
        (Math.random() - 0.5) * 40 * intensity,
        -20 - Math.random() * 40 * intensity,
        0.25 + Math.random() * 0.35,
        color,
        (2 + Math.random() * 5) * intensity,
        'dust'
      )
    );
  }
}

export function spawnSmoke(
  particles: Particle[],
  x: number,
  y: number,
  count: number,
  color = 'rgba(120,120,120,0.45)'
) {
  for (let i = 0; i < count; i++) {
    particles.push(
      createParticle(
        x + (Math.random() - 0.5) * 20,
        y,
        (Math.random() - 0.5) * 30,
        -30 - Math.random() * 50,
        0.5 + Math.random() * 0.5,
        color,
        4 + Math.random() * 8,
        'smoke'
      )
    );
  }
}

export function spawnSpeedLines(
  particles: Particle[],
  yMin: number,
  yMax: number,
  xStart: number,
  count: number,
  speedBase: number,
  color = 'rgba(255,255,255,0.35)'
) {
  for (let i = 0; i < count; i++) {
    const y = yMin + Math.random() * (yMax - yMin);
    particles.push(
      createParticle(
        xStart + Math.random() * 40,
        y,
        -speedBase - Math.random() * speedBase,
        0,
        0.15 + Math.random() * 0.2,
        color,
        1.5 + Math.random() * 2,
        'speedline'
      )
    );
  }
}

export function updateParticles(particles: Particle[], dt: number) {
  for (const p of particles) {
    if (p.type === 'spark' || p.type === 'smoke') {
      p.trail.unshift({ x: p.x, y: p.y });
      if (p.trail.length > 4) p.trail.pop();
    }

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= p.drag;
    p.vy *= p.drag;
    p.vy += p.gravity * dt;
    p.rotation += p.rotationSpeed * dt;
    p.life -= dt;

    if (p.type === 'spark' && p.y > 0 && p.vy > 0 && Math.random() < 0.15) {
      p.vy *= -0.45;
      p.vx *= 0.7;
    }
  }
  return particles.filter((p) => p.life > 0);
}

export function renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha * (p.type === 'smoke' ? 0.5 : 0.9);

    if (p.type === 'speedline') {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + Math.abs(p.vx) * 0.06, p.y);
      ctx.stroke();
    } else if (p.type === 'spark') {
      if (p.trail.length > 1) {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.size * 0.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.trail[0].x, p.trail[0].y);
        for (let i = 1; i < p.trail.length; i++) {
          ctx.globalAlpha = alpha * (1 - i / p.trail.length) * 0.8;
          ctx.lineTo(p.trail[i].x, p.trail[i].y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'smoke') {
      const r = p.size * (1 + (1 - alpha) * 1.5);
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      grad.addColorStop(0, p.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const r = p.size * alpha;
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      grad.addColorStop(0, p.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
  ctx.globalAlpha = 1;
}
