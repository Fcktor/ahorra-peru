import { CardTag, CREDIT_CARDS, CreditCard } from '@/constants/creditCards';

export interface CardQuestionOption {
  label: string;
  tags: CardTag[];
  incomeEstimate?: number;
}

export interface CardQuestion {
  id: string;
  question: string;
  options: CardQuestionOption[];
}

// Un tag repetido en `tags` le da más peso a esa señal en matchCards (se suma una vez por ocurrencia).
export const CARD_QUESTIONS: CardQuestion[] = [
  {
    id: 'travel',
    question: '¿Qué tan seguido viajas en avión?',
    options: [
      { label: 'Muy seguido', tags: ['viajes', 'millas', 'viajes'] },
      { label: 'A veces', tags: ['viajes'] },
      { label: 'Casi nunca', tags: [] },
    ],
  },
  {
    id: 'spend',
    question: '¿En qué gastas más normalmente?',
    options: [
      { label: 'Súper y delivery', tags: ['cashback', 'super', 'delivery'] },
      { label: 'Tiendas por departamento', tags: ['sin-membresia', 'cuotas'] },
      { label: 'Compras grandes (muebles, viajes)', tags: ['cuotas', 'premium'] },
      { label: 'De todo un poco', tags: [] },
    ],
  },
  {
    id: 'goal',
    question: '¿Qué buscas principalmente en una tarjeta?',
    options: [
      { label: 'Acumular millas para viajar', tags: ['millas', 'viajes', 'millas'] },
      { label: 'Cashback, dinero de vuelta', tags: ['cashback', 'cashback'] },
      { label: 'Simplicidad, sin pagar membresía', tags: ['sin-membresia', 'sin-membresia'] },
      { label: 'Comprar en cuotas sin intereses', tags: ['cuotas', 'cuotas'] },
    ],
  },
  {
    id: 'income',
    question: '¿Cuál es tu ingreso mensual aproximado?',
    options: [
      { label: 'Menos de S/ 1,500', tags: [], incomeEstimate: 1200 },
      { label: 'S/ 1,500 - S/ 3,000', tags: [], incomeEstimate: 2200 },
      { label: 'S/ 3,000 - S/ 6,000', tags: [], incomeEstimate: 4500 },
      { label: 'Más de S/ 6,000', tags: [], incomeEstimate: 7500 },
    ],
  },
  {
    id: 'experience',
    question: '¿Ya tienes una tarjeta de crédito?',
    options: [
      { label: 'Sí, ya tengo una', tags: [] },
      { label: 'Es mi primera tarjeta', tags: ['principiante', 'principiante'] },
    ],
  },
];

export interface CardMatchResult {
  card: CreditCard;
  score: number;
}

export function matchCards(answers: CardQuestionOption[]): CardMatchResult[] {
  const incomeEstimate = answers.find((a) => a.incomeEstimate !== undefined)?.incomeEstimate ?? 0;
  const tagCounts: Partial<Record<CardTag, number>> = {};
  for (const a of answers) {
    for (const t of a.tags) tagCounts[t] = (tagCounts[t] ?? 0) + 1;
  }

  const eligible = CREDIT_CARDS.filter((c) => c.minIncome <= incomeEstimate);
  const pool = eligible.length > 0 ? eligible : CREDIT_CARDS;

  const scored = pool.map((card) => {
    const score = card.tags.reduce((sum, tag) => sum + (tagCounts[tag] ?? 0), 0);
    return { card, score };
  });

  return scored.sort((a, b) => b.score - a.score);
}
