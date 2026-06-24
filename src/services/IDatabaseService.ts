import { Event, Participant, Expense, EventParticipant, Split, Payment } from '../types';

/**
 * Interfaz común para las implementaciones de base de datos.
 * - Mobile (iOS/Android): DatabaseService — usa expo-sqlite
 * - Web (browser):        IndexedDBDatabaseService — usa IndexedDB (via idb)
 *
 * El factory DatabaseFactory selecciona la implementación correcta
 * según Platform.OS en tiempo de ejecución.
 */
export interface IDatabaseService {

  // ─── Lifecycle ───────────────────────────────────────────────────────────
  init(): Promise<void>;

  // ─── Versioning ──────────────────────────────────────────────────────────
  getCurrentVersion(): Promise<{ version: string; versionName: string } | null>;
  getVersionHistory(): Promise<any[]>;

  // ─── Events ──────────────────────────────────────────────────────────────
  createEvent(event: Omit<Event, 'totalAmount'>): Promise<void>;
  updateEvent(id: string, updates: Partial<Event>): Promise<void>;
  deleteEvent(id: string): Promise<void>;
  getEvents(): Promise<Event[]>;
  getEventById(eventId: string): Promise<Event | null>;
  importSharedEvent(payload: any, role: 'editor' | 'viewer', shareId?: string, ownerName?: string): Promise<Event>;
  saveEventShare(shareId: string, eventId: string, direction: 'sent' | 'received', role: 'editor' | 'viewer', ownerName?: string): Promise<void>;
  getEventShares(eventId?: string): Promise<any[]>;

  // ─── Participants ─────────────────────────────────────────────────────────
  createParticipant(participant: Participant): Promise<void>;
  getParticipants(): Promise<Participant[]>;
  getParticipantById(participantId: string): Promise<Participant | null>;
  getFriends(): Promise<Participant[]>;
  getFriendsByUser(userId: string): Promise<Participant[]>;
  getParticipantByUserId(userId: string): Promise<Participant | null>;
  incrementParticipantUsage(participantId: string): Promise<void>;
  updateParticipantType(id: string, type: 'friend' | 'temporary'): Promise<void>;
  updateParticipant(id: string, updates: Partial<Participant>): Promise<void>;
  deleteParticipant(id: string): Promise<void>;

  // ─── Event ↔ Participants ─────────────────────────────────────────────────
  addParticipantToEvent(eventParticipant: EventParticipant): Promise<void>;
  getEventParticipants(
    eventId: string
  ): Promise<(Participant & { role: EventParticipant['role']; balance: number; joinedAt: string })[]>;
  removeParticipantFromEvent(eventId: string, participantId: string): Promise<void>;
  addParticipantToAllExpenses(eventId: string, participantId: string): Promise<void>;
  addSecondaryParticipant(eventId: string, primaryParticipantId: string, name: string): Promise<string>;
  removeSecondaryParticipant(eventId: string, secondaryParticipantId: string): Promise<void>;

  // ─── Expenses ────────────────────────────────────────────────────────────
  createExpense(expense: Expense): Promise<void>;
  createExpenseWithoutRecalculation(expense: Expense): Promise<void>;
  getExpenses(): Promise<Expense[]>;
  getExpensesByEvent(eventId: string): Promise<Expense[]>;
  updateExpense(expenseId: string, expense: Partial<Expense>, splits?: Split[]): Promise<void>;
  deleteExpense(expenseId: string): Promise<void>;

  // ─── Splits ──────────────────────────────────────────────────────────────
  createSplit(split: Split): Promise<void>;
  getSplits(): Promise<Split[]>;
  getSplitsByExpense(expenseId: string): Promise<Split[]>;
  getSplitsByEvent(eventId: string): Promise<Split[]>;

  // ─── Settlements ─────────────────────────────────────────────────────────
  createSettlement(settlement: any): Promise<void>;
  getSettlementsByEvent(eventId: string): Promise<any[]>;
  getSettlementById(settlementId: string): Promise<any | null>;
  updateSettlement(settlementId: string, updates: any): Promise<void>;
  deleteSettlement(settlementId: string): Promise<void>;
  deleteSettlementsByEvent(eventId: string): Promise<void>;
  recalculateSettlementsForEvent(eventId: string): Promise<void>;
  updateSettlementsEventStatus(eventId: string, newEventStatus: string): Promise<void>;
  resetSettlementsPayments(eventId: string): Promise<void>;
  updateSettlementParticipantNames(participantId: string, newName: string): Promise<void>;

  // ─── Legacy: Payments / Transactions (deprecated) ────────────────────────
  createPayment(payment: Payment): Promise<void>;
  createTransaction(transaction: any): Promise<void>;
  getPaymentsByEvent(eventId: string): Promise<Payment[]>;
  getTransactionsByEvent(eventId: string, type?: 'calculated' | 'manual' | 'payment'): Promise<any[]>;
  updatePayment(paymentId: string, updates: Partial<Payment>): Promise<void>;
  updateTransaction(transactionId: string, updates: any): Promise<void>;

  // ─── Users ───────────────────────────────────────────────────────────────
  createUser(user: {
    id: string;
    username: string;
    email: string;
    password: string;
    name: string;
    phone?: string;
    alias_cbu?: string;
    skipPassword?: boolean;
    autoLogin?: boolean;
  }): Promise<void>;
  getUserProfile(userId: string): Promise<any | null>;
  getUserById(userId: string): Promise<any | null>;
  getUserByCredential(credential: string): Promise<any | null>;
  getAllUsersWithLoginInfo(): Promise<any[]>;
  updateUserProfile(userId: string, updates: {
    name?: string;
    email?: string;
    phone?: string;
    alias_cbu?: string;
    preferred_currency?: string;
    skipPassword?: boolean;
    autoLogin?: boolean;
    chatModeAdvanced?: boolean;
    biometricEnabled?: boolean;
    avatar?: string | null;
    auto_logout?: string;
    username?: string;
  }): Promise<void>;
  updateUserPassword(userId: string, newPassword: string): Promise<void>;
  verifyUserPassword(userId: string, password: string): Promise<boolean>;
  toggleAutoLogin(userId: string, autoLogin: boolean): Promise<void>;
  updateLastLogin(userId: string): Promise<void>;
  forceUpdateDemoUser(userId: string): Promise<void>;
  updateUserNotifications(userId: string, notifications: {
    expenseAdded?: boolean;
    paymentReceived?: boolean;
    eventUpdated?: boolean;
    weeklyReport?: boolean;
  }): Promise<void>;
  updateUserPrivacy(userId: string, privacy: {
    shareEmail?: boolean;
    sharePhone?: boolean;
    allowInvitations?: boolean;
  }): Promise<void>;

  // ─── User Preferences ────────────────────────────────────────────────────
  getUserPreference(userId: string, key: string): Promise<string | null>;
  setUserPreference(userId: string, key: string, value: string): Promise<void>;

  // ─── Migrations ──────────────────────────────────────────────────────────
  migrateTransactionsToSettlements(): Promise<void>;

  // ─── Utility ─────────────────────────────────────────────────────────────
  clearAllData(includeVersions?: boolean): Promise<void>;
  resetDatabase(): Promise<void>;
  nukeDatabase(): Promise<void>;
  exportData(): Promise<string>;
  getDatabaseStats(): Promise<{
    tables: { [tableName: string]: number };
    totalRecords: number;
    databaseSize: string;
  }>;
  diagnoseTables(): Promise<void>;
}
