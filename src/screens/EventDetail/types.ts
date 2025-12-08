import { Event, Expense, Participant, EventParticipant, Split, Payment, Settlement } from '../../types';

export interface EventDetailScreenProps {
  eventId: string;
}

export interface EventDetailRouteParams {
  eventId: string;
}

export interface EventParticipantWithBalance extends Participant {
  role: EventParticipant['role'];
  balance: number;
  joinedAt: string;
}

export interface TabType {
  key: string;
  title: string;
  icon: string;
}

export interface FilterOptions {
  searchQuery: string;
  filterCategory: string;
  filterPayer: string;
  sortBy: 'date' | 'amount' | 'description';
}

export interface ExpenseWithSplits extends Expense {
  splits: Split[];
  includedParticipants: string[];
  excludedParticipants: string[];
}

export interface PaymentStats {
  totalPending: number;
  totalPaid: number;
  pendingCount: number;
  paidCount: number;
}

export interface SettlementData {
  fromParticipantId: string;
  fromParticipantName: string;
  toParticipantId: string;
  toParticipantName: string;
  amount: number;
}

export interface ParticipantBalance {
  participantId: string;
  participantName: string;
  totalPaid: number;
  totalOwed: number;
  balance: number;
  isOwing: boolean;
  isOwed: boolean;
}

export interface EventStats {
  totalExpenses: number;
  averagePerPerson: number;
  categoryTotals: Record<string, number>;
  participantTotals: Record<string, number>;
}

export interface EditParticipantForm {
  name: string;
  email?: string;
  phone?: string;
  aliasCbu?: string;
  convertToFriend?: boolean;
}

export interface ShareData {
  title: string;
  message: string;
  type: 'summary' | 'event' | 'settlements';
}

export interface FilterAndSortOptions {
  searchQuery: string;
  categoryFilter: string;
  payerFilter: string;
  sortBy: 'date' | 'amount' | 'description';
  sortOrder: 'asc' | 'desc';
}

export interface ExpenseItemProps {
  expense: Expense;
  splits: Split[];
  participants: EventParticipantWithBalance[];
  currency: string;
  isEventActive: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onToggleCollapsed: (expenseId: string) => void;
  isCollapsed: boolean;
}

export interface ParticipantItemProps {
  participant: EventParticipantWithBalance;
  balance: ParticipantBalance;
  currency: string;
  isEventActive: boolean;
  onEdit: (participant: Participant) => void;
  onRemove: (participant: Participant) => void;
}

export interface SettlementItemProps {
  settlement: Settlement | SettlementData;
  currency: string;
  onTogglePaid?: (settlementId: string, isPaid: boolean) => void;
  onUpdateReceipt?: (settlementId: string, imageUri: string | null) => void;
  disabled?: boolean;
}

export interface PaymentItemProps {
  payment: Payment;
  currency: string;
  participants: EventParticipantWithBalance[];
  onTogglePaid: (paymentId: string, isPaid: boolean) => void;
  onAddReceipt: (paymentId: string) => void;
  onViewReceipt: (imageUri: string) => void;
}

export interface EventInfoCardProps {
  event: Event;
  stats: EventStats;
  participantCount: number;
  expenseCount: number;
}

export interface QuickActionsProps {
  onShareSummary: () => void;
  onShareEvent: () => void;
  onCloseEvent?: () => void;
  onReopenEvent?: () => void;
  canCloseEvent: boolean;
  eventStatus: Event['status'];
}

export interface TabContentProps {
  activeTab: string;
  event: Event;
  expenses: Expense[];
  participants: EventParticipantWithBalance[];
  splits: Split[];
  payments: Payment[];
  settlements: (Settlement | SettlementData)[];
  balances: ParticipantBalance[];
  stats: EventStats;
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expense: Expense) => void;
  onAddParticipant: () => void;
  onEditParticipant: (participant: Participant) => void;
  onRemoveParticipant: (participant: Participant) => void;
}

export interface ImageModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
}

export interface EventActionResult {
  success: boolean;
  message?: string;
  error?: string;
}

export type EventStatus = 'active' | 'closed' | 'completed' | 'archived';
export type TabKeys = 'resumen' | 'participantes' | 'gastos';
export type SortOptions = 'date' | 'amount' | 'description';
export type FilterCategories = 'todos' | 'general' | 'food' | 'transport' | 'entertainment' | 'accommodation' | 'other';