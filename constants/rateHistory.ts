export interface RateHistoryPoint {
  quarter: string;
  ahorro: number;
  plazoFijo: number;
}

// Datos reales trimestrales — Banco Central de Reserva del Perú (BCRP)
// Series: PN07811NM "Pasivas - Ahorro" y PN07815NM "Pasivas - Plazos 360 a más"
// Promedio del sistema bancario en soles, términos efectivos anuales.
// Fuente: https://estadisticas.bcrp.gob.pe/estadisticas/series/api/PN07811NM-PN07815NM
export const RATE_HISTORY: RateHistoryPoint[] = [
  { quarter: "T3'23", ahorro: 0.84, plazoFijo: 7.42 },
  { quarter: "T4'23", ahorro: 0.83, plazoFijo: 7.32 },
  { quarter: "T1'24", ahorro: 0.92, plazoFijo: 6.90 },
  { quarter: "T2'24", ahorro: 0.88, plazoFijo: 6.49 },
  { quarter: "T3'24", ahorro: 0.84, plazoFijo: 6.02 },
  { quarter: "T4'24", ahorro: 0.76, plazoFijo: 5.62 },
  { quarter: "T1'25", ahorro: 0.80, plazoFijo: 5.39 },
  { quarter: "T2'25", ahorro: 0.81, plazoFijo: 5.14 },
  { quarter: "T3'25", ahorro: 0.83, plazoFijo: 4.83 },
  { quarter: "T4'25", ahorro: 0.79, plazoFijo: 4.70 },
  { quarter: "T1'26", ahorro: 0.81, plazoFijo: 4.64 },
  { quarter: "T2'26", ahorro: 0.84, plazoFijo: 4.58 },
];

export const RATE_HISTORY_SOURCE = 'BCRP — promedio del sistema bancario en soles';
