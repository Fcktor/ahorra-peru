// API pública del Banco Central de Reserva del Perú
// Docs: https://estadisticas.bcrp.gob.pe/estadisticas/series/ayuda/api
const BASE_URL = 'https://estadisticas.bcrp.gob.pe/estadisticas/series/api';

// Códigos de series del BCRP
const SERIES = {
  tasaReferencia: 'PD04649PD',   // Tasa de referencia diaria
  tipmn: 'PD04638PM',            // Tasa Interés Pasiva Moneda Nacional (mensual)
  inflacion: 'PD39469PM',        // Inflación mensual
};

interface BCRPPeriod {
  name: string;
  values: (string | null)[];
}

interface BCRPResponse {
  config: { series: { name: string }[] };
  periods: BCRPPeriod[];
}

async function fetchSeries(series: string, months = 2): Promise<number | null> {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - months, 1);
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
    const startStr = `${monthNames[start.getMonth()]}.${start.getFullYear()}`;
    const endStr = `${monthNames[now.getMonth()]}.${now.getFullYear()}`;

    const url = `${BASE_URL}/${series}/json/${startStr}/${endStr}/esp`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: BCRPResponse = await res.json();

    // Toma el último valor no nulo
    const periods = data.periods ?? [];
    for (let i = periods.length - 1; i >= 0; i--) {
      const val = periods[i]?.values?.[0];
      if (val !== null && val !== 'n.d.' && val !== undefined) {
        return parseFloat(val);
      }
    }
    return null;
  } catch {
    return null;
  }
}

export interface BCRPData {
  tasaReferencia: number | null;
  tipmn: number | null;
  inflacion: number | null;
}

export async function fetchBCRPData(): Promise<BCRPData> {
  const [tasaReferencia, tipmn, inflacion] = await Promise.all([
    fetchSeries(SERIES.tasaReferencia, 1),
    fetchSeries(SERIES.tipmn, 2),
    fetchSeries(SERIES.inflacion, 2),
  ]);
  return { tasaReferencia, tipmn, inflacion };
}
