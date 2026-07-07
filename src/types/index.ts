export interface User {
  id: string;
  name: string;
  username?: string;
  email?: string;
  avatar?: string;
  skipPassword?: boolean;
  autoLogin?: boolean;
  chatModeAdvanced?: boolean;
  biometricEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
  /** UUID de Supabase Auth vinculado a este usuario local. undefined = solo local. */
  supabaseUserId?: string;
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
  isLocked?: boolean;
  isExpress?: boolean;
  type: 'public' | 'private';
  category?: string;
  creatorId?: string;
  closedAt?: string;
  completedAt?: string;
  closingComment?: string;
  createdAt: string;
  updatedAt: string;
  /** true cuando el evento fue importado via QR/link desde otro dispositivo */
  isShared?: boolean;
  /** Rol del usuario actual en eventos compartidos */
  sharedRole?: 'editor' | 'viewer';
  /** share_id de Supabase si este evento fue compartido/recibido via QR online */
  shareId?: string;
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
  userId?: string;            // FK a users.id — identifica qué usuario registrado ES este participante
  createdByUserId?: string;   // FK a users.id — quién cargó este amigo
  isPublic?: boolean;         // false = privado (default), true = visible para todos
  timesUsed?: number;         // contador de uso para sugerencias
  lastUsedAt?: string;        // última vez que fue seleccionado en un evento
  eventIds?: string[];
  createdAt?: string;
  updatedAt?: string;
  parentParticipantId?: string; // sólo presente cuando se carga como parte de un evento
}

export interface EventParticipant {
  id: string;
  eventId: string;
  participantId: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  balance?: number;
  joinedAt?: string;
  parentParticipantId?: string; // si está definido, es un participante secundario
}

export interface ExpensePayer {
  participantId: string;
  participantName?: string;
  amount: number;
}

export interface Expense {
  id: string;
  eventId: string;
  description: string;
  amount: number;          // Monto en la moneda del evento (usado en liquidaciones)
  currency: string;        // Moneda elegida para el gasto
  originalAmount?: number; // Monto ingresado en la moneda del gasto (si difiere del evento)
  conversionRate?: number; // 1 {currency} = conversionRate {event.currency}
  date: string;
  category?: string;
  payerId: string;
  payerName?: string;
  receiptImage?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  payers?: ExpensePayer[];
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
  eventStatus?: string;
  receiptImage?: string;
  notes?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsolidationAssignment {
  payerId: string; // Quien va a pagar
  payerName: string;
  debtorId: string; // Por quien va a pagar
  debtorName: string;
  eventId: string;
}

export interface ConsolidatedSettlement extends Settlement {
  isConsolidated: boolean;
  originalSettlements?: Settlement[];
  consolidationAssignments?: ConsolidationAssignment[];
}

/** Actividad/tarea de organización dentro de un evento. */
export interface Activity {
  id: string;
  eventId: string;
  title: string;
  description?: string;              // detalle opcional de la tarea
  position?: number;                 // orden dentro del evento
  createdByUserId?: string;
  createdAt?: string;
  updatedAt?: string;
  /** Participantes asignados (poblado al leer desde la DB). */
  assignedParticipantIds?: string[];
}

/** Relación actividad ↔ participante asignado (tabla join). */
export interface ActivityParticipant {
  id: string;
  activityId: string;
  participantId: string;
  createdAt?: string;
}

/** Plantilla de organización reutilizable (guardada por el usuario). */
export interface ActivityTemplate {
  id: string;
  userId: string;
  name: string;
  tasks: string[];                   // títulos de tareas
  createdAt?: string;
  updatedAt?: string;
}

/** Registro local de un evento compartido (enviado o recibido). */
export interface EventShare {
  id: string;           // = share_id de Supabase
  eventId: string;      // ID del evento local
  direction: 'sent' | 'received';
  role: 'editor' | 'viewer';
  ownerName?: string;   // nombre del dueño (solo para 'received')
  syncedAt?: string;    // última vez que se descargó el snapshot
  createdAt: string;
}
