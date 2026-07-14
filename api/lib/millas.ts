// Millas conversion utilities
export const MILLAS_PER_COP = 1; // 1 milla = $1 COP
export const calculateMillasForPrice = (priceCOP: number): number => {
  return Math.ceil(priceCOP * MILLAS_PER_COP);
};
export const calculatePriceForMillas = (millas: number): number => {
  return Math.floor(millas / MILLAS_PER_COP);
};
