export type CategoryKey = 'comida' | 'transporte' | 'alojamiento' | 'entretenimiento' | 'compras' | 'salud' | 'educacion' | 'otros';

export interface ExpenseFormData {
  description: string;
  amount: string;
  date: Date;
  category: CategoryKey;
  payerId: string;
  splitType: 'equal';
  splits: ExpenseSplit[];
}

export interface ExpenseSplit {
  participantId: string;
  amount: number;
  percentage?: number;
  peopleCount?: number; // Override del peopleCount para este gasto específico
  defaultPeopleCount?: number; // peopleCount por defecto del evento
}

export interface FormErrors {
  [key: string]: string;
}

export interface CategoryConfig {
  key: CategoryKey;
  label: string;
  icon: string;
}

export interface CreateExpenseScreenProps {
  route: {
    params: {
      eventId: string;
      expenseId?: string;
    };
  };
  navigation: any;
}

export const CATEGORY_CONFIGS: CategoryConfig[] = [
  { key: 'comida', label: 'Comida', icon: 'food-fork-drink' },
  { key: 'transporte', label: 'Transporte', icon: 'car' },
  { key: 'alojamiento', label: 'Alojamiento', icon: 'home' },
  { key: 'entretenimiento', label: 'Entretenimiento', icon: 'gamepad-variant' },
  { key: 'compras', label: 'Compras', icon: 'shopping' },
  { key: 'salud', label: 'Salud', icon: 'medical-bag' },
  { key: 'educacion', label: 'Educación', icon: 'school' },
  { key: 'otros', label: 'Otros', icon: 'dots-horizontal' }
];

export const CATEGORY_COLORS: Record<CategoryKey, string> = {
  comida: '#FF6B6B',
  transporte: '#4ECDC4',
  alojamiento: '#45B7D1',
  entretenimiento: '#96CEB4',
  compras: '#FFEAA7',
  salud: '#DDA0DD',
  educacion: '#98D8C8',
  otros: '#A29BFE'
};