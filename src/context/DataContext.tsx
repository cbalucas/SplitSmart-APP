import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Event, Participant, Expense, EventParticipant, Split, Payment } from '../types';
import { databaseService } from '../services/database';

interface DataContextValue {
  events: Event[];
  participants: Participant[];
  expenses: Expense[];
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
  exportData: () => Promise<string>;
}

const DataContext = createContext<DataContextValue>({
  events: [],
  participants: [],
  expenses: [],
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
  exportData: async () => ''
});

export function DataProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
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
      const [eventsData, participantsData] = await Promise.all([
        databaseService.getEvents(),
        databaseService.getParticipants()
      ]);
      
      console.log(`✅ DataContext: Loaded ${eventsData.length} events and ${participantsData.length} participants`);
      
      setEvents(eventsData);
      setParticipants(participantsData);
      setExpenses([]); // Initialize empty expenses array
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
      const [eventsData, participantsData] = await Promise.all([
        databaseService.getEvents(),
        databaseService.getParticipants()
      ]);
      
      setEvents(eventsData);
      setParticipants(participantsData);
      
      console.log(`📊 Data refreshed: ${eventsData.length} events, ${participantsData.length} participants`);
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
      await databaseService.createExpense(expense);
      console.log('✅ Expense added successfully:', expense.description);
      
      // Add splits if provided
      if (splits && splits.length > 0) {
        for (const split of splits) {
          await databaseService.createSplit(split);
        }
        console.log(`✅ ${splits.length} splits added for expense ${expense.id}`);
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
      return await databaseService.getSplitsByEvent(eventId);
    } catch (error) {
      console.error('❌ Error getting splits by event:', error);
      return [];
    }
  }, []);

  // Payment methods
  const createPayment = useCallback(async (payment: Payment) => {
    try {
      await databaseService.createPayment(payment);
      console.log('✅ Payment created successfully');
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

  const exportData = useCallback(async () => {
    try {
      const exportedData = await databaseService.exportData();
      console.log('✅ Data exported successfully');
      return exportedData;
    } catch (error) {
      console.error('❌ Error exporting data:', error);
      throw error;
    }
  }, []);

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
      await refreshData();
      console.log('✅ Participant removed successfully');
    } catch (error) {
      console.error('❌ Error removing participant:', error);
      throw error;
    }
  }, [refreshData]);

  return (
    <DataContext.Provider value={{
      events,
      participants,
      expenses,
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
      exportData
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);