export type CardTag =
  | 'viajes' | 'millas' | 'cashback' | 'puntos' | 'sin-membresia'
  | 'principiante' | 'cuotas' | 'super' | 'delivery' | 'premium';

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  annualFee: string;
  minIncome: number;
  /** TCEA oficial (soles), la cifra que de verdad hay que comparar entre tarjetas. Undefined si aún no se verificó contra fuente oficial del banco. */
  tcea?: string;
  /** Red de pago, solo si está confirmada contra fuente oficial. Undefined si no se verificó. */
  network?: 'Visa' | 'Mastercard' | 'Amex' | 'Diners Club' | 'CMR';
  benefits: string[];
  bestFor: string;
  tags: CardTag[];
  websiteUrl?: string;
}

// Tarjetas curadas manualmente a partir de información pública de bancos y
// comparadores (BCP, Interbank, BBVA, Scotiabank, Falabella, Diners Club).
// Membresías, mínimos de ingreso y tasas de acumulación son referenciales:
// confirma las condiciones vigentes directamente con el banco antes de aplicar.
export const CREDIT_CARDS: CreditCard[] = [
  {
    // Nombre oficial en el comparativo de BCP: "Visa Signature BCP Latam Pass".
    id: 'bcp-latampass-signature',
    name: 'LATAM Pass Signature',
    bank: 'BCP',
    annualFee: 'S/ 400/año (gratis con consumo mínimo mensual)',
    minIncome: 12000,
    tcea: '115.26%',
    network: 'Visa',
    benefits: [
      '1.5 millas LATAM Pass por cada sol gastado',
      'Acceso a salas VIP en aeropuertos',
      'Seguro de viaje incluido',
      'Bono de bienvenida de hasta 10,000 millas',
    ],
    bestFor: 'Viajeros frecuentes que quieren acumular millas rápido con LATAM',
    tags: ['viajes', 'millas', 'premium'],
    websiteUrl: 'https://latampass.latam.com/es_pe/acumula-millas/tarjeta-bcp-latam-pass',
  },
  {
    // minIncome sin verificar: la Hoja Resumen oficial de Interbank no publica ingreso
    // mínimo por tarjeta (solo TEA/TCEA/membresía). Confirmar directamente con Interbank.
    id: 'interbank-visa-infinite',
    name: 'Visa Infinite LATAM Pass',
    bank: 'Interbank',
    annualFee: 'S/ 500/año (gratis con consumo mínimo mensual)',
    minIncome: 6000,
    tcea: '191.93% (USD: 169.60%)',
    network: 'Visa',
    benefits: [
      '2 millas LATAM Pass por cada sol gastado (la más alta del mercado)',
      'Comisión de 2.50% en compras en el extranjero, la más baja del mercado',
      'Acceso a salas VIP y seguros de viaje premium',
      'TEA competitiva para una tarjeta de este nivel',
    ],
    bestFor: 'Viajeros de alto consumo que buscan maximizar millas por sol gastado',
    tags: ['viajes', 'millas', 'premium'],
    websiteUrl: 'https://interbank.pe/tarjetas/tarjetas-credito/millas-benefit',
  },
  {
    // Nombre oficial: "Tarjeta Visa Clásica Sin Membresía". Antes en el código figuraba
    // como "Tarjeta Zero" (nombre no usado por Scotiabank); minIncome S/600 coincide con
    // el requisito real publicado (clientes Club Sueldo).
    id: 'scotiabank-sin-membresia',
    name: 'Visa Clásica Sin Membresía',
    bank: 'Scotiabank',
    annualFee: 'S/ 0 — sin membresía, sin condiciones',
    minIncome: 600,
    network: 'Visa',
    benefits: [
      'Cero membresía anual, para siempre',
      'Sin consumo mínimo requerido',
      'Acceso a cuotas sin intereses en comercios afiliados',
    ],
    bestFor: 'Quiere simplicidad total: nunca pagar membresía ni cumplir condiciones',
    tags: ['sin-membresia', 'principiante'],
    websiteUrl: 'https://www.scotiabank.com.pe/Personas/tarjetas/tarjeta-credito-visa/visa-clasica-sin-membresia',
  },
  {
    // Producto real confirmado en bancofalabella.pe, aunque el catálogo oficial de Perú
    // la nombra "CMR Visa" (no "CMR Falabella" a secas). TCEA e ingreso mínimo exacto
    // siguen sin verificar contra fuente oficial (fuera del alcance de la investigación
    // de mercado hecha hasta ahora). Pendiente en la bóveda Finanzas Peru.
    id: 'cmr-falabella',
    name: 'CMR Falabella',
    bank: 'Falabella',
    annualFee: 'S/ 0 — sin membresía',
    minIncome: 850,
    network: 'CMR',
    benefits: [
      'El ingreso mínimo más bajo del mercado peruano',
      'Cuotas sin intereses en Falabella, Sodimac y Tottus',
      'Fácil de conseguir sin historial crediticio previo',
    ],
    bestFor: 'Ingreso bajo o sin historial crediticio, compra seguido en tiendas del grupo Falabella',
    tags: ['sin-membresia', 'principiante', 'cuotas'],
    websiteUrl: 'https://www.bancofalabella.pe/tarjetas-credito-cmr',
  },
  {
    // Producto base real confirmado en dinersclub.pe/tarjetas/diners-club (existen también
    // Diners Club Free y Diners Club Miles). TCEA e ingreso mínimo exacto siguen sin
    // verificar contra fuente oficial. Pendiente en la bóveda Finanzas Peru.
    id: 'diners-club',
    name: 'Diners Club Perú',
    bank: 'Diners Club',
    annualFee: 'S/ 350-450/año según nivel',
    minIncome: 4000,
    network: 'Diners Club',
    benefits: [
      'Cuotas sin intereses en más de 20,000 establecimientos, la red más amplia del país',
      'Plazos de hasta 36 cuotas',
      'Descuentos de hasta 50% en marcas seleccionadas',
    ],
    bestFor: 'Compras grandes (muebles, electrodomésticos, viajes) que quiere fraccionar sin pagar intereses',
    tags: ['cuotas', 'premium'],
    websiteUrl: 'https://www.dinersclub.pe',
  },
];
