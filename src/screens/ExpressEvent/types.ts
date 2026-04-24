import { Participant } from '../../types';

export type WizardStep =
  | 'menu'
  | 'help'
  | 'event_name'
  | 'event_date'
  | 'participants'
  | 'bulk_participants'
  | 'ask_expenses'
  | 'expense_title'
  | 'expense_amount'
  | 'expense_date'
  | 'expense_payer'
  | 'expense_more'
  | 'summary'
  | 'done'
  | 'timeout';

export interface ChatMessage {
  id: string;
  type: 'bot' | 'user' | 'warning' | 'summary' | 'lang_change' | 'timeout';
  text: string;
  timestamp: Date;
}

export interface ExpenseEntry {
  title: string;
  amount: number;
  date: string;
  payerId: string;
  payerName: string;
}

export interface ExpressEventState {
  eventName: string;
  eventDate: string;
  selectedParticipants: Participant[];
  expenses: ExpenseEntry[];
  currentExpense: Partial<ExpenseEntry>;
}
