// constants/achievements.ts

export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    key: 'primeros_pasos',
    title: 'Primeros pasos',
    description: 'Completa tu primer quiz del glosario',
    icon: '🌱',
  },
  {
    key: 'erudito',
    title: 'Erudito',
    description: 'Domina 10 términos del glosario',
    icon: '📚',
  },
  {
    key: 'comparador_experto',
    title: 'Comparador experto',
    description: 'Compara 10 pares de productos',
    icon: '⚖️',
  },
  {
    key: 'constructor_de_planes',
    title: 'Constructor de planes',
    description: 'Guarda tu primer plan de ahorro',
    icon: '🏗️',
  },
  {
    key: 'ojo_de_aguila',
    title: 'Ojo de águila',
    description: 'Sube tu estado de cuenta 3 meses consecutivos',
    icon: '🦅',
  },
  {
    key: 'manos_a_la_obra',
    title: 'Manos a la obra',
    description: 'Marca 5 recomendaciones como aplicadas',
    icon: '🛠️',
  },
];
