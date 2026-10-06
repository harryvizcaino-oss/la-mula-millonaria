import { beforeEach, describe, expect, it } from 'vitest';
import { useTalentStore, getOverdriveCost, isOverdriveUnlocked } from './talentStore';
import { TALENTS } from './talentStore';

/**
 * Contrato del refactor anti-ciclo ESM:
 * - `buy()` / `buyOverdrive()` NO cobran estrellas (el cobro es del caller).
 * - Devuelven `cost` para que el caller cobre vía clickerStore.spendStars.
 * - Siguen validando prerequisitos (nivel anterior de la rama, overdrive
 *   requiere las 4 ramas al máximo).
 */

function resetStore() {
  useTalentStore.setState({ levels: {}, overdriveLevel: 0 });
}

describe('talentStore (sin cobro de estrellas)', () => {
  beforeEach(resetStore);

  it('compra un talento nivel 1 y devuelve su coste sin tocar estrellas', () => {
    const t = TALENTS.find((x) => x.branch === 'power' && x.level === 1)!;
    const res = useTalentStore.getState().buy(t.id);
    expect(res.success).toBe(true);
    expect(res.cost).toBe(t.cost);
    // El nivel quedó comprado
    expect(useTalentStore.getState().levels[t.id]).toBe(1);
  });

  it('no permite comprar nivel 2 sin el nivel 1 previo', () => {
    const lvl2 = TALENTS.find((x) => x.branch === 'power' && x.level === 2)!;
    const res = useTalentStore.getState().buy(lvl2.id);
    expect(res.success).toBe(false);
    expect(res.reason).toContain('nivel anterior');
  });

  it('no permite recomprar un talento ya comprado', () => {
    const t = TALENTS.find((x) => x.branch === 'power' && x.level === 1)!;
    useTalentStore.getState().buy(t.id);
    const again = useTalentStore.getState().buy(t.id);
    expect(again.success).toBe(false);
    expect(again.reason).toBe('Ya comprado');
  });

  it('buyOverdrive requiere las 4 ramas al máximo', () => {
    const res = useTalentStore.getState().buyOverdrive();
    expect(res.success).toBe(false);
    expect(res.reason).toContain('Maxea las 4 ramas');
  });

  it('buyOverdrive devuelve coste creciente sin cobrar', () => {
    // Desbloquea overdrive comprando los 3 niveles de las 4 ramas
    for (const t of TALENTS) {
      useTalentStore.getState().buy(t.id);
    }
    expect(isOverdriveUnlocked(useTalentStore.getState().levels)).toBe(true);

    const res = useTalentStore.getState().buyOverdrive();
    expect(res.success).toBe(true);
    expect(res.cost).toBe(getOverdriveCost(0));
    expect(res.level).toBe(1);
    expect(useTalentStore.getState().overdriveLevel).toBe(1);
  });

  it('no compra talentos inexistentes', () => {
    const res = useTalentStore.getState().buy('no-existe');
    expect(res.success).toBe(false);
    expect(res.reason).toBe('Talento no existe');
  });
});
