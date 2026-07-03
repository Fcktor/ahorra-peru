export type CardTag =
  | 'viajes' | 'millas' | 'cashback' | 'puntos' | 'sin-membresia'
  | 'principiante' | 'cuotas' | 'super' | 'delivery' | 'premium';

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  annualFee: string;
  minIncome: number;
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
    id: 'bcp-latampass-signature',
    name: 'LATAM Pass Signature',
    bank: 'BCP',
    annualFee: 'S/ 420/año (gratis con consumo mínimo mensual)',
    minIncome: 3000,
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
    id: 'interbank-visa-infinite',
    name: 'Visa Infinite LATAM Pass',
    bank: 'Interbank',
    annualFee: 'S/ 500/año (gratis con consumo mínimo mensual)',
    minIncome: 6000,
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
    id: 'interbank-cashback',
    name: 'Tarjeta Cashback',
    bank: 'Interbank',
    annualFee: 'S/ 150-250/año según categoría',
    minIncome: 1800,
    benefits: [
      'Hasta 5% de devolución en categorías seleccionadas',
      'Cashback en supermercados, grifos y restaurantes',
      'Sin necesidad de canjear puntos, el dinero vuelve directo',
    ],
    bestFor: 'Gasto recurrente en súper, delivery o gasolina y quiere ahorro directo, no millas',
    tags: ['cashback', 'super', 'delivery'],
    websiteUrl: 'https://interbank.pe',
  },
  {
    id: 'bbva-aqua',
    name: 'BBVA Aqua',
    bank: 'BBVA',
    annualFee: 'Gratis el primer año',
    minIncome: 1500,
    benefits: [
      '1 punto BBVA por cada sol gastado desde la primera compra',
      'Canje en descuentos, productos y experiencias del ecosistema BBVA',
      'Buena puerta de entrada si nunca tuviste tarjeta',
    ],
    bestFor: 'Primera tarjeta de crédito, quiere empezar a construir historial sin pagar de más',
    tags: ['puntos', 'principiante'],
    websiteUrl: 'https://www.bbva.pe',
  },
  {
    id: 'scotiabank-zero',
    name: 'Tarjeta Zero',
    bank: 'Scotiabank',
    annualFee: 'S/ 0 — sin membresía, sin condiciones',
    minIncome: 1500,
    benefits: [
      'Cero membresía anual, para siempre',
      'Sin consumo mínimo requerido',
      'Acceso a cuotas sin intereses en comercios afiliados',
    ],
    bestFor: 'Quiere simplicidad total: nunca pagar membresía ni cumplir condiciones',
    tags: ['sin-membresia', 'principiante'],
    websiteUrl: 'https://www.scotiabank.com.pe',
  },
  {
    id: 'cmr-falabella',
    name: 'CMR Falabella',
    bank: 'Falabella',
    annualFee: 'S/ 0 — sin membresía',
    minIncome: 850,
    benefits: [
      'El ingreso mínimo más bajo del mercado peruano',
      'Cuotas sin intereses en Falabella, Sodimac y Tottus',
      'Fácil de conseguir sin historial crediticio previo',
    ],
    bestFor: 'Ingreso bajo o sin historial crediticio, compra seguido en tiendas del grupo Falabella',
    tags: ['sin-membresia', 'principiante', 'cuotas'],
    websiteUrl: 'https://tarjetas.pe/tarjeta-de-credito-falabella',
  },
  {
    id: 'diners-club',
    name: 'Diners Club Perú',
    bank: 'Diners Club',
    annualFee: 'S/ 350-450/año según nivel',
    minIncome: 4000,
    benefits: [
      'Cuotas sin intereses en más de 20,000 establecimientos, la red más amplia del país',
      'Plazos de hasta 36 cuotas',
      'Descuentos de hasta 50% en marcas seleccionadas',
    ],
    bestFor: 'Compras grandes (muebles, electrodomésticos, viajes) que quiere fraccionar sin pagar intereses',
    tags: ['cuotas', 'premium'],
    websiteUrl: 'https://www.dinersclub.com.pe',
  },
];
