import { useState, useEffect, useCallback } from 'react';
import {
  VEHICLES,
  type VehicleConfig,
  getSelectedVehicleId,
  setSelectedVehicleId,
  getUnlockedVehicleIds,
  unlockVehicleId,
  isVehicleUnlocked,
} from '@/data/vehicles';

interface UseVehiclesReturn {
  selectedVehicle: VehicleConfig;
  unlockedIds: string[];
  selectVehicle: (id: string) => void;
  unlockVehicle: (id: string) => void;
  canAfford: (price: number) => boolean;
}

export function useVehicles(currentMillas: number): UseVehiclesReturn {
  const [selectedId, setSelectedId] = useState<string>(() => getSelectedVehicleId());
  const [unlockedIds, setUnlockedIds] = useState<string[]>(() => getUnlockedVehicleIds());

  useEffect(() => {
    setSelectedId(getSelectedVehicleId());
    setUnlockedIds(getUnlockedVehicleIds());
  }, []);

  const selectVehicle = useCallback((id: string) => {
    if (!isVehicleUnlocked(id)) return;
    setSelectedVehicleId(id);
    setSelectedId(id);
  }, []);

  const unlockVehicle = useCallback((id: string) => {
    unlockVehicleId(id);
    setUnlockedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const canAfford = useCallback(
    (price: number) => currentMillas >= price,
    [currentMillas]
  );

  const selectedVehicle = VEHICLES.find((v) => v.id === selectedId) ?? VEHICLES[0];

  return {
    selectedVehicle,
    unlockedIds,
    selectVehicle,
    unlockVehicle,
    canAfford,
  };
}
