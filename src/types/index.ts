export interface User {
  id: string;
  name: string;
  username?: string;
  email?: string;
  avatar?: string;
  skipPassword?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  location?: string;
  currency: string;
  totalAmount: number;
  status: 'active' | 'closed' | 'completed' | 'archived';
  type: 'public' | 'private';
  category?: string;
  creatorId?: string;
  closedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Participant {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  alias_cbu?: string;
  avatar?: string;
  isActive: boolean;
  participantType: 'friend' | 'temporary';
  createdAt?: string;
  updatedAt?: string;
}

export interface EventParticipant {
  id: string;
  eventId: string;
  participantId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  balance?: number;
  joinedAt?: string;
}

export interface Expense {
  id: string;
  eventId: string;
  description: string;
  amount: number;
  currency: string;
  date: string;
  category?: string;
  payerId: string;
  receiptImage?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Split {
  id: string;
  expenseId: string;
  participantId: string;
  amount: number;
  percentage?: number;
  type?: 'equal' | 'fixed' | 'percentage';
  isPaid?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id: string;
  eventId: string;
  fromParticipantId: string;
  toParticipantId: string;
  amount: number;
  date: string;
  notes?: string;
  receiptImage?: string;
  isConfirmed?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Settlement {
  id: string;
  eventId: string;
  fromParticipantId: string;
  fromParticipantName: string;
  toParticipantId: string;
  toParticipantName: string;
  amount: number;
  isPaid: boolean;
  receiptImage?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}
