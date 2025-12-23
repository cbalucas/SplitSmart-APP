import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Event, Participant, Expense, EventParticipant, Split, Payment } from '../types';
import { databaseService } from '../services/database';
import { notificationService } from '../services/NotificationService';
import { useAuth } from './AuthContext';

interface DataContextValue {
  events: Event[];
  participants: Participant[];
  expenses: Expense[];
  splits: Split[];
  loading: boolean;
  // Event methods
  addEvent: (event: Partial<Event>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  // Participant methods
  addParticipant: (participant: Participant) => Promise<void>;
  addParticipantToEvent: (eventId: string, participant: Participant) => Promise<void>;
  addExistingParticipantToEvent: (eventId: string, participant: Participant) => Promise<void>;
  getEventParticipants: (eventId: string) => Promise<(Participant & { role: EventParticipant['role']; balance: number; joinedAt: string })[]>;
  getFriends: () => Promise<Participant[]>;
  updateParticipantType: (id: string, type: 'friend' | 'temporary') => Promise<void>;
  updateParticipant: (id: string, updates: Partial<Participant>) => Promise<void>;
  deleteParticipant: (id: string) => Promise<void>;
  // Expense methods
  addExpense: (expense: Expense, splits?: Split[]) => Promise<void>;
  updateExpense: (expenseId: string, expense: Partial<Expense>, splits?: Split[]) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  getExpensesByEvent: (eventId: string) => Promise<Expense[]>;
  getSplitsByEvent: (eventId: string) => Promise<Split[]>;
  // Payment methods
  createPayment: (payment: Payment) => Promise<void>;
  updatePayment: (paymentId: string, updates: Partial<Payment>) => Promise<void>;
  getPaymentsByEvent: (eventId: string) => Promise<Payment[]>;
  // Participant management
  removeParticipantFromEvent: (eventId: string, participantId: string) => Promise<void>;
  // User Profile methods
  getUserProfile: (userId: string) => Promise<any | null>;
  getUserByCredential: (credential: string) => Promise<any | null>;
  createUser: (user: any) => Promise<void>;
  updateUserProfile: (userId: string, updates: any) => Promise<void>;
  updateUserPassword: (userId: string, newPassword: string) => Promise<void>;
  updateUserNotifications: (userId: string, notifications: any) => Promise<void>;
  updateUserPrivacy: (userId: string, privacy: any) => Promise<void>;
  // Utility methods
  refreshData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  resetDatabase: () => Promise<void>;
  nukeDatabase: () => Promise<void>;
  exportData: () => Promise<string>;
  importData: (importData: any) => Promise<boolean>;
  diagnoseTables: () => Promise<{
    existingTables: Array<{name: string, count: number}>;
    totalRecords: number;
    sizeInfo: string;
    totalTables: number;
    tablesWithData: number;
    problematicTables: Array<any>;
  }>;
}

const DataContext = createContext<DataContextValue>({
  events: [],
  participants: [],
  expenses: [],
  splits: [],
  loading: false,
  addEvent: async () => {},
  updateEvent: async () => {},
  deleteEvent: async () => {},
  addParticipant: async () => {},
  addParticipantToEvent: async () => {},
  addExistingParticipantToEvent: async () => {},
  getEventParticipants: async () => [],
  getFriends: async () => [],
  updateParticipantType: async () => {},
  updateParticipant: async () => {},
  deleteParticipant: async () => {},
  getUserProfile: async () => null,
  getUserByCredential: async () => null,
  createUser: async () => {},
  updateUserProfile: async () => {},
  updateUserPassword: async () => {},
  updateUserNotifications: async () => {},
  updateUserPrivacy: async () => {},
  addExpense: async () => {},
  updateExpense: async () => {},
  deleteExpense: async () => {},
  getExpensesByEvent: async () => [],
  getSplitsByEvent: async () => [],
  createPayment: async () => {},
  updatePayment: async () => {},
  getPaymentsByEvent: async () => [],
  removeParticipantFromEvent: async () => {},
  refreshData: async () => {},
  clearAllData: async () => {},
  resetDatabase: async () => {},
  nukeDatabase: async () => {},
  exportData: async () => '',
  importData: async () => false,
  diagnoseTables: async () => ({
    existingTables: [],
    totalRecords: 0,
    sizeInfo: '',
    totalTables: 0,
    tablesWithData: 0,
    problematicTables: []
  })
});

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth(); // Obtener usuario logueado
  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [splits, setSplits] = useState<Split[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔄 DataContext: Initializing database service...');
      await databaseService.init();
      console.log('✅ DataContext: Database service initialized');
      
      // Load initial data
      console.log('📥 DataContext: Loading initial data...');
      const [eventsData, participantsData, expensesData, splitsData] = await Promise.all([
        databaseService.getEvents(),
        databaseService.getParticipants(),
        databaseService.getExpenses(),
        databaseService.getSplits().catch((error) => {
          console.error('❌ Error loading initial splits, using empty array:', error);
          return [];
        })
      ]);
      
      console.log(`✅ DataContext: Loaded ${eventsData.length} events, ${participantsData.length} participants, ${expensesData.length} expenses, ${splitsData.length} splits`);
      
      setEvents(eventsData);
      setParticipants(participantsData);
      setExpenses(expensesData);
      setSplits(splitsData);
      console.log('✅ DataContext initialized with SQLite');
    } catch (error) {
      console.error('❌ Error initializing DataContext:', error);
      // Set empty data on error to prevent crashes
      setEvents([]);
      setParticipants([]);
      setExpenses([]);
    }
    setLoading(false);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const [eventsData, participantsData, expensesData, splitsData] = await Promise.all([
        databaseService.getEvents(),
        databaseService.getParticipants(),
        databaseService.getExpenses(),
        databaseService.getSplits().catch((error) => {
          console.error('❌ Error loading splits, using empty array:', error);
          return [];
        })
      ]);
      
      setEvents(eventsData);
      setParticipants(participantsData);
      setExpenses(expensesData);
      setSplits(splitsData);
      
      console.log(`📊 Data refreshed: ${eventsData.length} events, ${participantsData.length} participants, ${expensesData.length} expenses, ${splitsData.length} splits`);
    } catch (error) {
      console.error('❌ Error refreshing data:', error);
    }
  }, []);

  // Event methods
  const addEvent = useCallback(async (eventData: Partial<Event>) => {
    try {
      const newEvent: Omit<Event, 'totalAmount'> = {
        id: eventData.id || Date.now().toString(),
        name: eventData.name || '',
        description: eventData.description,
        startDate: eventData.startDate || new Date().toISOString(),
        location: eventData.location,
        currency: eventData.currency || 'USD',
        status: eventData.status || 'active',
        type: eventData.type || 'private',
        category: eventData.category,
        creatorId: eventData.creatorId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await databaseService.createEvent(newEvent);
      await refreshData();
      console.log('✅ Event added successfully:', newEvent.name);
    } catch (error) {
      console.error('❌ Error adding event:', error);
      throw error;
    }
  }, [refreshData]);

  const updateEvent = useCallback(async (id: string, updates: Partial<Event>) => {
    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      await databaseService.updateEvent(id, updatedData);
      await refreshData();
      console.log('✅ Event updated successfully:', id);
    } catch (error) {
      console.error('❌ Error updating event:', error);
      throw error;
    }
  }, [refreshData]);

  const deleteEvent = useCallback(async (id: string) => {
    try {
      await databaseService.deleteEvent(id);
      await refreshData();
      console.log('✅ Event deleted successfully:', id);
    } catch (error) {
      console.error('❌ Error deleting event:', error);
      throw error;
    }
  }, [refreshData]);

  // Participant methods
  const addParticipant = useCallback(async (participant: Participant) => {
    try {
      await databaseService.createParticipant(participant);
      await refreshData();
      console.log('✅ Participant added successfully:', participant.name);
    } catch (error: any) {
      // If it's a UNIQUE constraint error, the participant already exists
      if (error.message?.includes('UNIQUE constraint failed: participants.id')) {
        console.log('⚠️ Participant already exists:', participant.name);
        await refreshData(); // Still refresh to ensure data is up to date
        return;
      }
      console.error('❌ Error adding participant:', error);
      throw error;
    }
  }, [refreshData]);

  const addParticipantToEvent = useCallback(async (eventId: string, participant: Participant) => {
    try {
      // First create the participant if it doesn't exist (ignore error if already exists)
      try {
        await databaseService.createParticipant(participant);
      } catch (participantError: any) {
        // If it's a UNIQUE constraint error, the participant already exists, which is fine
        if (!participantError.message?.includes('UNIQUE constraint failed: participants.id')) {
          throw participantError;
        }
        console.log('⚠️ Participant already exists, continuing with event association');
      }
      
      // Then create the event-participant relationship
      const eventParticipant: EventParticipant = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventId,
        participantId: participant.id,
        role: 'member',
        balance: 0,
        joinedAt: new Date().toISOString()
      };
      
      try {
        await databaseService.addParticipantToEvent(eventParticipant);
      } catch (relationError: any) {
        // If it's a UNIQUE constraint error for event-participant relationship, ignore it
        if (!relationError.message?.includes('UNIQUE constraint failed: event_participants')) {
          throw relationError;
        }
        console.log('⚠️ Participant already associated with event, skipping');
      }

      // Add participant to all existing expenses and recalculate splits
      await databaseService.addParticipantToAllExpenses(eventId, participant.id);
      
      // Clear existing settlements for this event to avoid duplicates
      // Solo eliminar si realmente hay gastos y settlements existentes
      const expenses = await databaseService.getExpensesByEvent(eventId);
      if (expenses.length > 0) {
        const existingSettlements = await databaseService.getSettlementsByEvent(eventId);
        if (existingSettlements.length > 0) {
          console.log('🔄 Clearing', existingSettlements.length, 'settlements due to new participant with existing expenses');
          await databaseService.deleteSettlementsByEvent(eventId);
        }
        
        // 🔄 RECALCULAR LIQUIDACIONES CON EL NUEVO PARTICIPANTE
        await databaseService.recalculateSettlementsForEvent(eventId);
        console.log('✅ Settlements recalculated after adding participant');
      }
      
      await refreshData();
      console.log('✅ Participant added to event successfully:', participant.name);
    } catch (error) {
      console.error('❌ Error adding participant to event:', error);
      throw error;
    }
  }, [refreshData]);

  // Function to add existing participant to event (without creating participant)
  const addExistingParticipantToEvent = useCallback(async (eventId: string, participant: Participant) => {
    try {
      // Only create the event-participant relationship (participant already exists)
      const eventParticipant: EventParticipant = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventId,
        participantId: participant.id,
        role: 'member',
        balance: 0,
        joinedAt: new Date().toISOString()
      };
      
      try {
        await databaseService.addParticipantToEvent(eventParticipant);
      } catch (relationError: any) {
        // If it's a UNIQUE constraint error for event-participant relationship, ignore it
        if (!relationError.message?.includes('UNIQUE constraint failed: event_participants')) {
          throw relationError;
        }
        console.log('⚠️ Participant already associated with event');
        return; // Don't throw error, just return
      }

      // Add participant to all existing expenses and recalculate splits
      await databaseService.addParticipantToAllExpenses(eventId, participant.id);
      
      // Clear existing settlements for this event to avoid duplicates
      // Solo eliminar si realmente hay gastos y settlements existentes
      const expenses = await databaseService.getExpensesByEvent(eventId);
      if (expenses.length > 0) {
        const existingSettlements = await databaseService.getSettlementsByEvent(eventId);
        if (existingSettlements.length > 0) {
          console.log('🔄 Clearing', existingSettlements.length, 'existing settlements due to existing participant');
          await databaseService.deleteSettlementsByEvent(eventId);
        }
        
        // 🔄 RECALCULAR LIQUIDACIONES CON EL PARTICIPANTE AGREGADO
        await databaseService.recalculateSettlementsForEvent(eventId);
        console.log('✅ Settlements recalculated after adding existing participant');
      }
      
      await refreshData();
      console.log('✅ Existing participant added to event successfully:', participant.name);
    } catch (error) {
      console.error('❌ Error adding existing participant to event:', error);
      throw error;
    }
  }, [refreshData]);

  const getEventParticipants = useCallback(async (eventId: string) => {
    try {
      return await databaseService.getEventParticipants(eventId);
    } catch (error) {
      console.error('❌ Error getting event participants:', error);
      return [];
    }
  }, []);

  const getFriends = useCallback(async () => {
    try {
      return await databaseService.getFriends();
    } catch (error) {
      console.error('❌ Error getting friends:', error);
      return [];
    }
  }, []);

  const updateParticipantType = useCallback(async (id: string, type: 'friend' | 'temporary') => {
    try {
      await databaseService.updateParticipantType(id, type);
      await refreshData();
      console.log(`✅ Participant type updated: ${type}`);
    } catch (error) {
      console.error('❌ Error updating participant type:', error);
      throw error;
    }
  }, [refreshData]);

  const updateParticipant = useCallback(async (id: string, updates: Partial<Participant>) => {
    try {
      await databaseService.updateParticipant(id, updates);
      
      // If name was updated, also update settlement names
      if (updates.name) {
        await databaseService.updateSettlementParticipantNames(id, updates.name);
      }
      
      await refreshData();
      console.log(`✅ Participant updated successfully`);
    } catch (error) {
      console.error('❌ Error updating participant:', error);
      throw error;
    }
  }, [refreshData]);

  const deleteParticipant = useCallback(async (id: string) => {
    try {
      await databaseService.deleteParticipant(id);
      await refreshData();
      console.log(`✅ Participant deleted successfully`);
    } catch (error) {
      console.error('❌ Error deleting participant:', error);
      throw error;
    }
  }, [refreshData]);

  // User Profile methods
  const getUserProfile = useCallback(async (userId: string) => {
    try {
      return await databaseService.getUserProfile(userId);
    } catch (error) {
      console.error('❌ Error getting user profile:', error);
      return null;
    }
  }, []);

  const getUserByCredential = useCallback(async (credential: string) => {
    try {
      return await databaseService.getUserByCredential(credential);
    } catch (error) {
      console.error('❌ Error getting user by credential:', error);
      return null;
    }
  }, []);

  const createUser = useCallback(async (user: any) => {
    try {
      await databaseService.createUser(user);
      console.log('✅ User created successfully');
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }, []);

  const updateUserProfile = useCallback(async (userId: string, updates: any) => {
    try {
      await databaseService.updateUserProfile(userId, updates);
      console.log('✅ User profile updated successfully');
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      throw error;
    }
  }, []);

  const updateUserPassword = useCallback(async (userId: string, newPassword: string) => {
    try {
      await databaseService.updateUserPassword(userId, newPassword);
      console.log('✅ User password updated successfully');
    } catch (error) {
      console.error('❌ Error updating user password:', error);
      throw error;
    }
  }, []);

  const updateUserNotifications = useCallback(async (userId: string, notifications: any) => {
    try {
      await databaseService.updateUserNotifications(userId, notifications);
      console.log('✅ User notifications updated successfully');
    } catch (error) {
      console.error('❌ Error updating user notifications:', error);
      throw error;
    }
  }, []);

  const updateUserPrivacy = useCallback(async (userId: string, privacy: any) => {
    try {
      await databaseService.updateUserPrivacy(userId, privacy);
      console.log('✅ User privacy settings updated successfully');
    } catch (error) {
      console.error('❌ Error updating user privacy:', error);
      throw error;
    }
  }, []);

  // Expense methods
  const addExpense = useCallback(async (expense: Expense, splits?: Split[]) => {
    try {
      // Crear expense SIN recalculación automática (la haremos manualmente después)
      await databaseService.createExpenseWithoutRecalculation(expense);
      console.log('✅ Expense added successfully:', expense.description);
      
      // Add splits if provided
      if (splits && splits.length > 0) {
        for (const split of splits) {
          await databaseService.createSplit(split);
        }
        console.log(`✅ ${splits.length} splits added for expense ${expense.id}`);
        
        // 🔄 RECALCULAR LIQUIDACIONES DESPUÉS DE CREAR TODOS LOS SPLITS
        await databaseService.recalculateSettlementsForEvent(expense.eventId);
        console.log('✅ Settlements recalculated after creating splits');
      }
      
      // Refresh data to update UI
      await refreshData();
    } catch (error) {
      console.error('❌ Error adding expense:', error);
      throw error;
    }
  }, [refreshData]);

  const getExpensesByEvent = useCallback(async (eventId: string) => {
    try {
      return await databaseService.getExpensesByEvent(eventId);
    } catch (error) {
      console.error('❌ Error getting expenses by event:', error);
      return [];
    }
  }, []);

  const getSplitsByEvent = useCallback(async (eventId: string) => {
    try {
      // Filter splits by eventId from global state
      const eventExpenses = expenses.filter(e => e.eventId === eventId);
      const eventExpenseIds = new Set(eventExpenses.map(e => e.id));
      const eventSplits = splits.filter(s => eventExpenseIds.has(s.expenseId));
      return eventSplits;
    } catch (error) {
      console.error('❌ Error getting splits by event:', error);
      return [];
    }
  }, [expenses, splits]);

  // Payment methods
  const createPayment = useCallback(async (payment: Payment) => {
    try {
      await databaseService.createPayment(payment);
      console.log('✅ Payment created successfully');
      
      // Enviar notificación WhatsApp al acreedor (quien recibe el pago)
      try {
        console.log('🔔 Checking payment notification for recipient:', payment.toParticipantId);
        
        const recipient = await databaseService.getParticipantById(payment.toParticipantId);
        const payer = await databaseService.getParticipantById(payment.fromParticipantId);
        const event = await databaseService.getEventById(payment.eventId);
        
        console.log('👤 Recipient:', recipient?.name, 'Phone:', recipient?.phone);
        console.log('👤 Payer:', payer?.name);
        console.log('📅 Event:', event?.name);
        
        if (recipient && payer && event) {
          // Verificar si el usuario ACTUAL (no el recipient) tiene notificaciones activadas
          // La notificación se envía si el usuario actual quiere recibir notificaciones de pagos
          let shouldNotify = false;
          
          try {
            // Obtener el perfil del usuario que está logueado actualmente
            const currentUserId = user?.id || 'demo-user';
            const currentUserProfile = await databaseService.getUserProfile(currentUserId);
            console.log('🔔 Current user profile notification setting:', currentUserProfile?.notifications_payment_received);
            console.log('👤 Logged user ID:', currentUserId);
            shouldNotify = currentUserProfile?.notifications_payment_received === 1;
          } catch (profileError) {
            console.log('⚠️ Could not get logged user profile, assuming no notifications');
            shouldNotify = false;
          }
          
          if (shouldNotify) {
            if (recipient.phone) {
              console.log('📲 Sending WhatsApp notification...');
              await notificationService.notifyPaymentReceived({
                payerName: payer.name,
                amount: payment.amount,
                eventName: event.name,
                recipientPhone: recipient.phone,
                receiptImage: payment.receiptImage
              });
              console.log('✅ WhatsApp notification sent successfully');
            } else {
              console.log('⚠️ Recipient has no phone number for WhatsApp notification');
            }
          } else {
            console.log('🔕 Recipient notifications disabled or not applicable');
          }
        } else {
          console.log('❌ Missing data for notification - Recipient:', !!recipient, 'Payer:', !!payer, 'Event:', !!event);
        }
      } catch (notificationError) {
        console.log('⚠️ Payment notification failed:', notificationError);
        // No fallar si la notificación falla
      }
    } catch (error) {
      console.error('❌ Error creating payment:', error);
      throw error;
    }
  }, []);

  const updatePayment = useCallback(async (paymentId: string, updates: Partial<Payment>) => {
    try {
      await databaseService.updatePayment(paymentId, updates);
      console.log('✅ Payment updated successfully');
    } catch (error) {
      console.error('❌ Error updating payment:', error);
      throw error;
    }
  }, []);

  const getPaymentsByEvent = useCallback(async (eventId: string) => {
    try {
      return await databaseService.getPaymentsByEvent(eventId);
    } catch (error) {
      console.error('❌ Error getting payments by event:', error);
      return [];
    }
  }, []);

  // Utility methods
  const clearAllData = useCallback(async () => {
    try {
      await databaseService.clearAllData();
      setEvents([]);
      setParticipants([]);
      setExpenses([]);
      console.log('✅ All data cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      throw error;
    }
  }, []);

  const resetDatabase = useCallback(async () => {
    try {
      await databaseService.resetDatabase();
      setEvents([]);
      setParticipants([]);
      setExpenses([]);
      console.log('✅ Database reset successfully');
    } catch (error) {
      console.error('❌ Error resetting database:', error);
      throw error;
    }
  }, []);

  const nukeDatabase = useCallback(async () => {
    try {
      await databaseService.nukeDatabase();
      setEvents([]);
      setParticipants([]);
      setExpenses([]);
      console.log('✅ Database nuked successfully');
    } catch (error) {
      console.error('❌ Error nuking database:', error);
      throw error;
    }
  }, []);

  const exportData = useCallback(async () => {
    try {
      const exportedData = await databaseService.exportData();
      console.log('✅ Data exported successfully');
      return exportedData;
    } catch (error) {
      console.error('❌ Export error:', error);
      throw error;
    }
  }, []);

  const importData = useCallback(async (importDataPayload: any): Promise<boolean> => {
    try {
      console.log('📥 Starting data import to database...');
      
      const data = importDataPayload.data || {};
      
      // Import in the correct order due to foreign key constraints
      // 1. Users first (set skip_password = 1 for imported users)
      if (data.users && data.users.length > 0) {
        console.log(`📥 Importing ${data.users.length} users...`);
        for (const user of data.users) {
          try {
            // Prepare required fields with safe defaults
            const userData = {
              id: user.id,
              name: user.name || 'Usuario Importado',
              email: user.email,
              username: user.username || user.email || `user_${user.id}`, // Username is required and unique
              password: '', // Empty password for imported users (they use skip_password=1)
              phone: user.phone || null,
              alias_cbu: user.alias_cbu || null,
              avatar: null, // avatar set to null for import
              preferred_currency: user.preferred_currency || 'ARS',
              auto_logout: user.auto_logout || 'never',
              skip_password: 1, // Always set to 1 for imported users
              notifications_expense_added: user.notifications_expense_added !== undefined ? (user.notifications_expense_added ? 1 : 0) : 1,
              notifications_payment_received: user.notifications_payment_received !== undefined ? (user.notifications_payment_received ? 1 : 0) : 0,
              notifications_event_updated: user.notifications_event_updated !== undefined ? (user.notifications_event_updated ? 1 : 0) : 0,
              notifications_weekly_report: user.notifications_weekly_report !== undefined ? (user.notifications_weekly_report ? 1 : 0) : 0,
              privacy_share_email: user.privacy_share_email !== undefined ? (user.privacy_share_email ? 1 : 0) : 0,
              privacy_share_phone: user.privacy_share_phone !== undefined ? (user.privacy_share_phone ? 1 : 0) : 0,
              privacy_allow_invitations: user.privacy_allow_invitations !== undefined ? (user.privacy_allow_invitations ? 1 : 0) : 1,
              privacy_share_event: user.privacy_share_event !== undefined ? (user.privacy_share_event ? 1 : 0) : 1,
              created_at: user.created_at || new Date().toISOString(),
              updated_at: user.updated_at || new Date().toISOString()
            };
            
            console.log(`📥 Importing user: ${userData.username} (${userData.email})`);
            
            // First, check if username already exists and make it unique if needed
            let finalUsername = userData.username;
            let counter = 1;
            while (true) {
              try {
                const existingUser = await databaseService.db.getFirstAsync(
                  'SELECT id FROM users WHERE username = ? AND id != ?',
                  [finalUsername, userData.id]
                );
                if (!existingUser) break;
                finalUsername = `${userData.username}_${counter}`;
                counter++;
              } catch (checkError) {
                break; // If check fails, proceed with original username
              }
            }
            userData.username = finalUsername;
            
            // Insert user with all required and optional fields
            await databaseService.db.runAsync(
              `INSERT OR REPLACE INTO users (
                id, name, email, username, password, phone, alias_cbu, avatar,
                preferred_currency, auto_logout, skip_password,
                notifications_expense_added, notifications_payment_received, 
                notifications_event_updated, notifications_weekly_report,
                privacy_share_email, privacy_share_phone, privacy_allow_invitations, privacy_share_event,
                created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                userData.id, userData.name, userData.email, userData.username, userData.password,
                userData.phone, userData.alias_cbu, userData.avatar,
                userData.preferred_currency, userData.auto_logout, userData.skip_password,
                userData.notifications_expense_added, userData.notifications_payment_received,
                userData.notifications_event_updated, userData.notifications_weekly_report,
                userData.privacy_share_email, userData.privacy_share_phone, userData.privacy_allow_invitations, userData.privacy_share_event,
                userData.created_at, userData.updated_at
              ]
            );
            
            console.log(`✅ User imported: ${userData.username}`);
            
            // Import user notifications and privacy settings with separate updates
            const updates = [];
            if (user.notifications_payment_received !== undefined) {
              updates.push({
                field: 'notifications_payment_received',
                value: user.notifications_payment_received
              });
            }
            if (user.privacy_share_event !== undefined) {
              updates.push({
                field: 'privacy_share_event', 
                value: user.privacy_share_event
              });
            }
            
            // Execute updates
            for (const update of updates) {
              try {
                await databaseService.db.runAsync(
                  `UPDATE users SET ${update.field} = ? WHERE id = ?`,
                  [update.value, user.id]
                );
              } catch (updateError) {
                console.warn(`⚠️ Could not update ${update.field} for user ${user.id}:`, updateError);
              }
            }
            
          } catch (userError) {
            console.error(`❌ Error importing user ${user.id} (${user.email}):`, userError);
            console.error('❌ User data:', user);
            throw new Error(`Failed to import user ${user.email}: ${userError.message}`);
          }
        }
      }
      
      // 2. Events
      if (data.events && data.events.length > 0) {
        console.log(`📥 Importing ${data.events.length} events...`);
        for (const event of data.events) {
          try {
            const eventData = {
              id: event.id,
              name: event.name || 'Evento Importado',
              description: event.description || '',
              start_date: event.startDate || event.start_date || new Date().toISOString(),
              location: event.location || '',
              currency: event.currency || 'ARS',
              total_amount: event.totalAmount || event.total_amount || 0,
              status: event.status || 'active',
              type: event.type || 'public',
              category: event.category || 'evento',
              creator_id: event.creatorId || event.creator_id || event.created_by || '',
              closed_at: event.closedAt || event.closed_at || null,
              completed_at: event.completedAt || event.completed_at || null,
              created_at: event.createdAt || event.created_at || new Date().toISOString(),
              updated_at: event.updatedAt || event.updated_at || new Date().toISOString()
            };
            
            await databaseService.db.runAsync(
              `INSERT OR REPLACE INTO events (
                id, name, description, start_date, location, currency, 
                total_amount, status, type, category, creator_id, 
                closed_at, completed_at, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                eventData.id, eventData.name, eventData.description, eventData.start_date,
                eventData.location, eventData.currency, eventData.total_amount, eventData.status,
                eventData.type, eventData.category, eventData.creator_id, eventData.closed_at,
                eventData.completed_at, eventData.created_at, eventData.updated_at
              ]
            );
          } catch (eventError) {
            console.error(`❌ Error importing event ${event.id}:`, eventError);
            throw new Error(`Failed to import event ${event.name || event.id}: ${eventError.message}`);
          }
        }
      }
      
      // 3. Participants
      if (data.participants && data.participants.length > 0) {
        console.log(`📥 Importing ${data.participants.length} participants...`);
        for (const participant of data.participants) {
          try {
            const participantData = {
              id: participant.id,
              name: participant.name || 'Participante Importado',
              email: participant.email || '',
              phone: participant.phone || null,
              alias_cbu: participant.alias_cbu || null,
              avatar: null, // avatar set to null
              is_active: participant.isActive !== undefined ? (participant.isActive ? 1 : 0) : 1,
              participant_type: participant.participantType || participant.participant_type || 'temporary',
              created_at: participant.createdAt || participant.created_at || new Date().toISOString(),
              updated_at: participant.updatedAt || participant.updated_at || new Date().toISOString()
            };
            
            await databaseService.db.runAsync(
              `INSERT OR REPLACE INTO participants (
                id, name, email, phone, alias_cbu, avatar, is_active, participant_type, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                participantData.id, participantData.name, participantData.email, participantData.phone,
                participantData.alias_cbu, participantData.avatar, participantData.is_active, participantData.participant_type, 
                participantData.created_at, participantData.updated_at
              ]
            );
          } catch (participantError) {
            console.error(`❌ Error importing participant ${participant.id}:`, participantError);
            throw new Error(`Failed to import participant ${participant.name || participant.id}: ${participantError.message}`);
          }
        }
      }
      
      // 4. Event Participants
      if (data.event_participants && data.event_participants.length > 0) {
        console.log(`📥 Importing ${data.event_participants.length} event participants...`);
        for (const ep of data.event_participants) {
          try {
            const epData = {
              id: ep.id,
              event_id: ep.eventId || ep.event_id,
              participant_id: ep.participantId || ep.participant_id,
              role: ep.role || 'member',
              balance: ep.balance || 0,
              joined_at: ep.joinedAt || ep.joined_at || new Date().toISOString()
            };

            await databaseService.db.runAsync(
              `INSERT OR REPLACE INTO event_participants (
                id, event_id, participant_id, role, balance, joined_at
              ) VALUES (?, ?, ?, ?, ?, ?)`,
              [epData.id, epData.event_id, epData.participant_id, epData.role, epData.balance, epData.joined_at]
            );
          } catch (epError) {
            console.error(`❌ Error importing event participant ${ep.id}:`, epError);
            throw new Error(`Failed to import event participant ${ep.id}: ${epError.message}`);
          }
        }
      }
      
      // 5. Expenses
      if (data.expenses && data.expenses.length > 0) {
        console.log(`📥 Importing ${data.expenses.length} expenses...`);
        for (const expense of data.expenses) {
          try {
            const expenseData = {
              id: expense.id,
              event_id: expense.eventId || expense.event_id,
              description: expense.description || 'Gasto Importado',
              amount: expense.amount || 0,
              currency: expense.currency || 'ARS',
              date: expense.date || new Date().toISOString(),
              category: expense.category || null,
              payer_id: expense.payerId || expense.payer_id || expense.paid_by,
              receipt_image: null, // receipt_image set to null
              is_active: expense.isActive !== undefined ? (expense.isActive ? 1 : 0) : (expense.is_active !== undefined ? expense.is_active : 1),
              created_at: expense.createdAt || expense.created_at || new Date().toISOString(),
              updated_at: expense.updatedAt || expense.updated_at || new Date().toISOString()
            };
            
            await databaseService.db.runAsync(
              `INSERT OR REPLACE INTO expenses (
                id, event_id, description, amount, currency, date, category, payer_id, 
                receipt_image, is_active, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                expenseData.id, expenseData.event_id, expenseData.description, expenseData.amount,
                expenseData.currency, expenseData.date, expenseData.category, expenseData.payer_id, 
                expenseData.receipt_image, expenseData.is_active, expenseData.created_at, expenseData.updated_at
              ]
            );
          } catch (expenseError) {
            console.error(`❌ Error importing expense ${expense.id}:`, expenseError);
            throw new Error(`Failed to import expense ${expense.description || expense.id}: ${expenseError.message}`);
          }
        }
      }
      
      // 6. Splits
      if (data.splits && data.splits.length > 0) {
        console.log(`📥 Importing ${data.splits.length} splits...`);
        for (const split of data.splits) {
          try {
            const splitData = {
              id: split.id,
              expense_id: split.expenseId || split.expense_id,
              participant_id: split.participantId || split.participant_id,
              amount: split.amount || 0,
              percentage: split.percentage || null,
              type: split.type || 'equal',
              is_paid: split.is_paid !== undefined ? split.is_paid : 0,
              created_at: split.createdAt || split.created_at || new Date().toISOString(),
              updated_at: split.updatedAt || split.updated_at || new Date().toISOString()
            };
            
            await databaseService.db.runAsync(
              `INSERT OR REPLACE INTO splits (
                id, expense_id, participant_id, amount, percentage, type, is_paid, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                splitData.id, splitData.expense_id, splitData.participant_id, 
                splitData.amount, splitData.percentage, splitData.type, splitData.is_paid,
                splitData.created_at, splitData.updated_at
              ]
            );
          } catch (splitError) {
            console.error(`❌ Error importing split ${split.id}:`, splitError);
            throw new Error(`Failed to import split ${split.id}: ${splitError.message}`);
          }
        }
      }
      
      // 7. Settlements (nueva tabla unificada)
      if (data.settlements && data.settlements.length > 0) {
        console.log(`📥 Importing ${data.settlements.length} settlements...`);
        for (const settlement of data.settlements) {
          try {
            const settlementData = {
              id: settlement.id,
              event_id: settlement.event_id,
              from_participant_id: settlement.from_id || settlement.from_participant_id,
              from_participant_name: settlement.from_name || settlement.from_participant_name || 'Participante',
              to_participant_id: settlement.to_id || settlement.to_participant_id,
              to_participant_name: settlement.to_name || settlement.to_participant_name || 'Participante',
              amount: settlement.amount || 0,
              settlement_type: settlement.settlement_type || 'original_amount',
              is_paid: settlement.isPaid || settlement.is_paid || 0,
              receipt_image: null, // receipt_image set to null
              paid_at: settlement.paidAt || settlement.paid_at || null,
              event_status: settlement.event_status || 'active',
              created_at: settlement.created_at || new Date().toISOString(),
              updated_at: settlement.updated_at || new Date().toISOString()
            };
            
            await databaseService.db!.runAsync(
              `INSERT OR REPLACE INTO settlements (
                id, event_id, from_participant_id, from_participant_name, to_participant_id, to_participant_name,
                amount, settlement_type, is_paid, receipt_image, paid_at,
                event_status, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                settlementData.id, settlementData.event_id, settlementData.from_participant_id, 
                settlementData.from_participant_name, settlementData.to_participant_id, settlementData.to_participant_name,
                settlementData.amount, settlementData.settlement_type, settlementData.is_paid,
                settlementData.receipt_image, settlementData.paid_at,
                settlementData.event_status, settlementData.created_at, settlementData.updated_at
              ]
            );
          } catch (settlementError) {
            console.error(`❌ Error importing settlement ${settlement.id}:`, settlementError);
            throw new Error(`Failed to import settlement ${settlement.id}: ${settlementError.message}`);
          }
        }
      }
      
      // 8. Handle legacy payments format by converting to settlements
      if (data.payments && data.payments.length > 0 && (!data.settlements || data.settlements.length === 0)) {
        console.log(`📥 Converting ${data.payments.length} legacy payments to settlements...`);
        for (const payment of data.payments) {
          try {
            const settlementData = {
              id: payment.id,
              event_id: payment.eventId || payment.event_id,
              from_participant_id: payment.fromParticipantId || payment.from_participant_id,
              from_participant_name: 'Manual Payment',
              to_participant_id: payment.toParticipantId || payment.to_participant_id,
              to_participant_name: 'Manual Payment',
              amount: payment.amount || 0,
              settlement_type: 'manual_payment',
              is_paid: payment.isConfirmed ? 1 : 0,
              receipt_image: null,
              paid_at: payment.isConfirmed ? (payment.date || new Date().toISOString()) : null,
              event_status: 'active',
              created_at: payment.createdAt || payment.created_at || new Date().toISOString(),
              updated_at: payment.updatedAt || payment.updated_at || new Date().toISOString()
            };
            
            await databaseService.db!.runAsync(
              `INSERT OR REPLACE INTO settlements (
                id, event_id, from_participant_id, from_participant_name, to_participant_id, to_participant_name,
                amount, settlement_type, is_paid, receipt_image, paid_at,
                event_status, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                settlementData.id, settlementData.event_id, settlementData.from_participant_id, 
                settlementData.from_participant_name, settlementData.to_participant_id, settlementData.to_participant_name,
                settlementData.amount, settlementData.settlement_type, settlementData.is_paid,
                settlementData.receipt_image, settlementData.paid_at,
                settlementData.event_status, settlementData.created_at, settlementData.updated_at
              ]
            );
          } catch (paymentError) {
            console.error(`❌ Error converting payment ${payment.id}:`, paymentError);
            throw new Error(`Failed to convert payment ${payment.id}: ${paymentError.message}`);
          }
        }
      }
      
      // 9. Import consolidations (consolidation_assignments)
      if (data.consolidations && data.consolidations.length > 0) {
        console.log(`📥 Importing ${data.consolidations.length} consolidations...`);
        for (const consolidation of data.consolidations) {
          try {
            const consolidationData = {
              id: consolidation.id,
              event_id: consolidation.eventId || consolidation.event_id,
              payer_id: consolidation.payerId || consolidation.payer_id,
              payer_name: consolidation.payerName || consolidation.payer_name || 'Unknown Payer',
              debtor_id: consolidation.debtorId || consolidation.debtor_id,
              debtor_name: consolidation.debtorName || consolidation.debtor_name || 'Unknown Debtor',
              created_at: consolidation.createdAt || consolidation.created_at || new Date().toISOString(),
              updated_at: consolidation.updatedAt || consolidation.updated_at || new Date().toISOString()
            };

            console.log(`📥 Importing consolidation: ${consolidationData.payer_name} -> ${consolidationData.debtor_name}`);

            await databaseService.db!.runAsync(
              `INSERT OR REPLACE INTO consolidation_assignments (
                event_id, payer_id, payer_name, debtor_id, debtor_name,
                created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                consolidationData.event_id, consolidationData.payer_id, consolidationData.payer_name,
                consolidationData.debtor_id, consolidationData.debtor_name,
                consolidationData.created_at, consolidationData.updated_at
              ]
            );

            console.log(`✅ Consolidation imported: ${consolidationData.payer_name} -> ${consolidationData.debtor_name}`);
          } catch (consolidationError) {
            console.error(`❌ Error importing consolidation ${consolidation.id}:`, consolidationError);
            throw new Error(`Failed to import consolidation ${consolidation.id}: ${consolidationError.message}`);
          }
        }
      }
      
      console.log('✅ All data imported successfully');
      
      // Refresh data after import
      await refreshData();
      
      return true;
    } catch (error) {
      console.error('❌ Import error:', error);
      throw error;
    }
  }, [refreshData]);

  const updateExpense = useCallback(async (expenseId: string, expense: Partial<Expense>, splits?: Split[]) => {
    try {
      await databaseService.updateExpense(expenseId, expense, splits);
      await refreshData();
      console.log('✅ Expense updated successfully');
    } catch (error) {
      console.error('❌ Error updating expense:', error);
      throw error;
    }
  }, [refreshData]);

  const deleteExpense = useCallback(async (expenseId: string) => {
    try {
      await databaseService.deleteExpense(expenseId);
      await refreshData();
      console.log('✅ Expense deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting expense:', error);
      throw error;
    }
  }, [refreshData]);

  const removeParticipantFromEvent = useCallback(async (eventId: string, participantId: string) => {
    try {
      await databaseService.removeParticipantFromEvent(eventId, participantId);
      
      // Clear existing settlements for this event to avoid orphaned settlements
      // Solo si hay gastos y settlements existentes
      const expenses = await databaseService.getExpensesByEvent(eventId);
      if (expenses.length > 0) {
        const existingSettlements = await databaseService.getSettlementsByEvent(eventId);
        if (existingSettlements.length > 0) {
          console.log('🔄 Clearing', existingSettlements.length, 'existing settlements due to participant removal');
          await databaseService.deleteSettlementsByEvent(eventId);
        }
        
        // 🔄 RECALCULAR LIQUIDACIONES DESPUÉS DE REMOVER PARTICIPANTE
        await databaseService.recalculateSettlementsForEvent(eventId);
        console.log('✅ Settlements recalculated after removing participant');
      }
      
      await refreshData();
      console.log('✅ Participant removed successfully');
    } catch (error) {
      console.error('❌ Error removing participant:', error);
      throw error;
    }
  }, [refreshData]);

  const diagnoseTables = useCallback(async () => {
    try {
      const diagnosticResults = await databaseService.diagnoseTables();
      console.log('✅ Tables diagnosis completed');
      return diagnosticResults;
    } catch (error) {
      console.error('❌ Error during diagnosis:', error);
      throw error;
    }
  }, []);

  return (
    <DataContext.Provider value={{
      events,
      participants,
      expenses,
      splits,
      loading,
      addEvent,
      updateEvent,
      deleteEvent,
      addParticipant,
      addParticipantToEvent,
      addExistingParticipantToEvent,
      getEventParticipants,
      getFriends,
      updateParticipantType,
      updateParticipant,
      deleteParticipant,
      getUserProfile,
      getUserByCredential,
      createUser,
      updateUserProfile,
      updateUserPassword,
      updateUserNotifications,
      updateUserPrivacy,
      addExpense,
      updateExpense,
      deleteExpense,
      getExpensesByEvent,
      getSplitsByEvent,
      createPayment,
      updatePayment,
      getPaymentsByEvent,
      removeParticipantFromEvent,
      refreshData,
      clearAllData,
      resetDatabase,
      nukeDatabase,
      exportData,
      importData,
      diagnoseTables
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);