export type RiskLevel = 'muy bajo' | 'bajo' | 'medio' | 'alto';
export type Liquidity = 'inmediata' | '1-3 días' | 'al vencimiento' | 'restringida' | 'largo plazo';

export interface SavingsOption {
  id: string;
  name: string;
  institution: string;
  category: string;
  rateMin: number;
  rateMax: number;
  rateLabel?: string;
  risk: RiskLevel;
  liquidity: Liquidity;
  minAmount: number;
  currency: 'PEN' | 'USD';
  description: string;
  pros: string[];
  cons: string[];
  howToStart: string;
  isFromBCRP?: boolean;
}

// Tasas curadas y actualizadas manualmente (fuente: SBS, bancos, BCRP)
// Las tasas TREA son anuales
export const SAVINGS_OPTIONS: SavingsOption[] = [
  {
    id: 'deposito-bcp',
    name: 'Depósito a Plazo Fijo',
    institution: 'BCP',
    category: 'Depósito a plazo',
    rateMin: 6.0,
    rateMax: 8.5,
    risk: 'muy bajo',
    liquidity: 'al vencimiento',
    minAmount: 500,
    currency: 'PEN',
    description: 'Dejas tu dinero un tiempo fijo (30, 60, 90, 180 o 360 días) y recibes una tasa de interés mayor que una cuenta de ahorros.',
    pros: ['Respaldado por el FSD hasta S/ 124,000', 'Tasa garantizada', 'Sin riesgo de mercado'],
    cons: ['No puedes retirar antes del vencimiento sin penalidad', 'Tasa menor que fondos mutuos'],
    howToStart: 'Descarga la app BCP, ve a "Inversiones" → "Depósito a plazo"',
  },
  {
    id: 'deposito-interbank',
    name: 'Depósito a Plazo Fijo',
    institution: 'Interbank',
    category: 'Depósito a plazo',
    rateMin: 6.5,
    rateMax: 9.0,
    risk: 'muy bajo',
    liquidity: 'al vencimiento',
    minAmount: 500,
    currency: 'PEN',
    description: 'Similar al BCP pero Interbank suele ofrecer tasas ligeramente más competitivas para captar clientes.',
    pros: ['Tasas competitivas', 'App sencilla', 'FSD hasta S/ 124,000'],
    cons: ['Sin retiro anticipado', 'Requiere cuenta Interbank'],
    howToStart: 'App Interbank → "Ahorro e Inversión" → "Depósito a plazo"',
  },
  {
    id: 'deposito-financiera',
    name: 'Depósito a Plazo (Financieras)',
    institution: 'Oh!, CMAC, Caja Piura',
    category: 'Depósito a plazo',
    rateMin: 8.0,
    rateMax: 12.0,
    risk: 'muy bajo',
    liquidity: 'al vencimiento',
    minAmount: 250,
    currency: 'PEN',
    description: 'Las financieras y cajas municipales ofrecen tasas más altas que los bancos grandes para competir. Igual están bajo la SBS y el FSD.',
    pros: ['Tasas más altas', 'FSD los cubre igual', 'Montos mínimos bajos'],
    cons: ['Menos canales de atención', 'Apps menos pulidas'],
    howToStart: 'Comparar en el portal de la SBS o ir a una agencia de CMAC Arequipa, Piura, etc.',
  },
  {
    id: 'cuenta-ahorros',
    name: 'Cuenta de Ahorros',
    institution: 'BCP, BBVA, Interbank, Scotiabank',
    category: 'Cuenta de ahorros',
    rateMin: 0.5,
    rateMax: 2.5,
    risk: 'muy bajo',
    liquidity: 'inmediata',
    minAmount: 0,
    currency: 'PEN',
    description: 'Tu dinero está disponible en cualquier momento. La desventaja: las tasas son muy bajas, a veces menores a la inflación.',
    pros: ['Dinero disponible siempre', 'Sin riesgo', 'FSD te protege'],
    cons: ['Tasa casi insignificante', 'Puede perder valor real ante la inflación'],
    howToStart: 'Cualquier banco grande. Abre una cuenta de forma digital en minutos.',
  },
  {
    id: 'fondo-mutuo-conservador',
    name: 'Fondo Mutuo Conservador',
    institution: 'Credifondos, Interfondos, BBVA AM',
    category: 'Fondo mutuo',
    rateMin: 5.0,
    rateMax: 8.0,
    rateLabel: 'rendimiento estimado',
    risk: 'bajo',
    liquidity: '1-3 días',
    minAmount: 100,
    currency: 'PEN',
    description: 'Juntas tu dinero con el de otros inversores. Un gestor profesional lo invierte en instrumentos seguros (bonos, depósitos). No es depósito, así que no aplica FSD, pero el riesgo es bajo.',
    pros: ['Mejor tasa que cuentas de ahorro', 'Profesionales gestionan tu dinero', 'Puedes entrar con poco'],
    cons: ['No garantizado', 'Retiros en 1-3 días hábiles', 'Cobra comisión de gestión'],
    howToStart: 'App Credifondos (BCP) o abrir cuenta en Interfondos online',
  },
  {
    id: 'fondo-mutuo-moderado',
    name: 'Fondo Mutuo Moderado',
    institution: 'Credifondos, Interfondos, SURA',
    category: 'Fondo mutuo',
    rateMin: 6.0,
    rateMax: 12.0,
    rateLabel: 'rendimiento estimado',
    risk: 'medio',
    liquidity: '1-3 días',
    minAmount: 100,
    currency: 'PEN',
    description: 'Invierte en una mezcla de bonos y algo de acciones. Mayor potencial de ganancia pero también puede haber meses con rendimiento negativo.',
    pros: ['Mayor potencial de rentabilidad', 'Diversificación automática'],
    cons: ['Puede bajar temporalmente', 'No garantizado'],
    howToStart: 'SURA inversiones, Interfondos o directamente con tu banco',
  },
  {
    id: 'cts',
    name: 'CTS (Compensación por Tiempo de Servicios)',
    institution: 'Tu banco CTS',
    category: 'Beneficio laboral',
    rateMin: 3.5,
    rateMax: 7.0,
    risk: 'muy bajo',
    liquidity: 'restringida',
    minAmount: 0,
    currency: 'PEN',
    description: 'Si trabajas en planilla, tu empleador deposita CTS dos veces al año (mayo y noviembre). Es tuyo pero solo puedes retirarlo cuando dejes de trabajar o en casos especiales. Genera intereses.',
    pros: ['Dinero que acumulas sin esfuerzo', 'Genera intereses', 'Protegido por ley'],
    cons: ['No puedes usarlo libremente', 'Solo para trabajadores en planilla'],
    howToStart: 'Tu empleador lo deposita automáticamente. Solo elige en qué banco quieres tenerlo.',
  },
  {
    id: 'afp',
    name: 'AFP (Fondo de Pensiones)',
    institution: 'Prima, Integra, Habitat, Profuturo',
    category: 'Pensiones',
    rateMin: 5.0,
    rateMax: 10.0,
    rateLabel: 'rendimiento histórico anual',
    risk: 'medio',
    liquidity: 'largo plazo',
    minAmount: 0,
    currency: 'PEN',
    description: 'El 10% de tu sueldo va aquí automáticamente si trabajas en planilla. Fondos 0, 1, 2 y 3 según tu tolerancia al riesgo. Pensado para la jubilación.',
    pros: ['Inversión automática', 'Rentabilidad histórica buena a largo plazo', 'Para tu futuro'],
    cons: ['No puedes retirarlo fácilmente', 'Comisión de la AFP'],
    howToStart: 'Si trabajas en planilla, ya estás afiliado. Puedes cambiar de fondo o AFP.',
  },
];
