export interface InterestResult {
  total: number;
  ganancia: number;
  totalReal: number;
  gananciaReal: number;
}

export function calcInterest(
  capital: number,
  annualRatePercent: number,
  months: number,
  compound: boolean,
  inflacionAnual: number,
): InterestResult | null {
  const P = capital;
  const r = annualRatePercent / 100;
  const t = months / 12;
  if (P <= 0 || r <= 0) return null;
  const total = compound ? P * Math.pow(1 + r, t) : P * (1 + r * t);
  const ganancia = total - P;
  const tasaReal = r - inflacionAnual;
  const totalReal = P * Math.pow(1 + tasaReal, t);
  const gananciaReal = totalReal - P;
  return { total, ganancia, totalReal, gananciaReal };
}
