export const DISCIPLINA_ICON_COLOR = {
  matematica: '#1E3A8A',
  portugues: '#7C3AED',
  historia: '#B45309',
  geografia: '#0F766E',
  ciencias: '#166534',
} as const;

export type Disciplina = keyof typeof DISCIPLINA_ICON_COLOR;

export const DISCIPLINA_OPTIONS: Array<{ label: string; value: Disciplina }> = [
  { label: 'Matematica', value: 'matematica' },
  { label: 'Portugues', value: 'portugues' },
  { label: 'Historia', value: 'historia' },
  { label: 'Geografia', value: 'geografia' },
  { label: 'Ciencias', value: 'ciencias' },
];

const DEFAULT_DISCIPLINA_COLOR = '#1E3A8A';

export function getDisciplinaIconColor(disciplina: Disciplina): string {
  return DISCIPLINA_ICON_COLOR[disciplina] ?? DEFAULT_DISCIPLINA_COLOR;
}
