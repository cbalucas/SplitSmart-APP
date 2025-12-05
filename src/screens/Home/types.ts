// Types para Home Screen
export interface HomeEventData {
  id: string;
  name: string;
  location?: string;
  startDate: string;
  totalAmount: number;
  currency: string;
  status: 'active' | 'closed' | 'completed' | 'archived';
  participantCount: number;
  expenseCount: number;
  description?: string;
}

export interface HomeMetricData {
  icon: string;
  value: string;
  label: string;
  color: string;
}

export interface HomeScreenState {
  filteredEvents: HomeEventData[];
  refreshing: boolean;
  searchQuery: string;
  metrics: HomeMetricData[];
  eventParticipants: { [eventId: string]: number };
  eventExpenses: { [eventId: string]: number };
  eventTotals: { [eventId: string]: number };
}

export interface HomeScreenProps {
  // Props si las necesitamos más adelante
}

export type HomeEventStatus = 'active' | 'closed' | 'completed' | 'archived';

export interface HomeEventCounts {
  participants: { [eventId: string]: number };
  expenses: { [eventId: string]: number };
  totals: { [eventId: string]: number };
}