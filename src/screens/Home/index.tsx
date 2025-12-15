import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { 
  EventCard, 
  MetricsCard,
  HeaderBar,
  UserAvatar
} from '../../components';
import SearchBar from '../../components/SearchBar';
import { useData } from '../../context/DataContext';
import { HomeEventData, HomeMetricData, HomeScreenState } from './types';
import { createStyles } from './styles';
import { homeLanguage } from './language';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { events: dbEvents, loading: dbLoading, refreshData, getEventParticipants, getExpensesByEvent, updateEvent, deleteEvent } = useData();
  const styles = createStyles(theme);
  
  // Get translations
  const t = homeLanguage[language] || homeLanguage.es;

  // Estados
  const [filteredEvents, setFilteredEvents] = useState<HomeEventData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [metrics, setMetrics] = useState<HomeMetricData[]>([]);
  const [eventParticipants, setEventParticipants] = useState<{[eventId: string]: number}>({});
  const [eventExpenses, setEventExpenses] = useState<{[eventId: string]: number}>({});
  const [eventTotals, setEventTotals] = useState<{[eventId: string]: number}>({});

  // Cargar participantes y gastos para cada evento
  const loadEventCounts = useCallback(async () => {
    const participantCounts: {[eventId: string]: number} = {};
    const expenseCounts: {[eventId: string]: number} = {};
    
    for (const event of dbEvents) {
      try {
        const participants = await getEventParticipants(event.id);
        const expenses = await getExpensesByEvent(event.id);
        participantCounts[event.id] = participants.length;
        expenseCounts[event.id] = expenses.length;
      } catch (error) {
        console.error(`Error loading counts for event ${event.id}:`, error);
        participantCounts[event.id] = 0;
        expenseCounts[event.id] = 0;
      }
    }
    
    setEventParticipants(participantCounts);
    setEventExpenses(expenseCounts);
  }, [dbEvents, getEventParticipants, getExpensesByEvent]);

  // Calcular montos totales basados en gastos
  const calculateEventTotals = useCallback(async () => {
    const totals: {[eventId: string]: number} = {};
    
    for (const event of dbEvents) {
      try {
        const expenses = await getExpensesByEvent(event.id);
        totals[event.id] = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      } catch (error) {
        console.error(`Error calculating total for event ${event.id}:`, error);
        totals[event.id] = event.totalAmount || 0;
      }
    }
    
    setEventTotals(totals);
  }, [dbEvents, getExpensesByEvent]);

  // Filtrar eventos por privacidad: solo públicos + privados del usuario actual
  const visibleEvents = useMemo(() => {
    if (!user) return dbEvents;
    
    return dbEvents.filter(event => {
      // Mostrar eventos públicos
      if (event.type === 'public') return true;
      
      // Mostrar eventos privados solo si el usuario es el creador
      if (event.type === 'private' && event.creatorId === user.id) return true;
      
      // No mostrar eventos privados de otros usuarios
      return false;
    });
  }, [dbEvents, user]);

  // Calcular eventos con montos actualizados
  const eventsWithAmounts = useMemo(() => {
    return visibleEvents.map(event => ({
      id: event.id,
      name: event.name,
      location: event.location,
      startDate: event.startDate,
      totalAmount: eventTotals[event.id] || event.totalAmount || 0,
      currency: event.currency,
      status: event.status as 'active' | 'closed' | 'completed' | 'archived',
      type: event.type as 'public' | 'private',
      participantCount: eventParticipants[event.id] || 0,
      expenseCount: eventExpenses[event.id] || 0,
      description: event.description
    }));
  }, [visibleEvents, eventTotals, eventParticipants, eventExpenses]);

  // Cargar conteos y calcular montos cuando cambian los eventos
  useEffect(() => {
    if (dbEvents.length > 0) {
      loadEventCounts();
      calculateEventTotals();
    }
  }, [dbEvents, loadEventCounts, calculateEventTotals]);

  // Filtrar eventos y actualizar métricas
  useEffect(() => {
    // Filter events based on search query
    if (!searchQuery.trim()) {
      setFilteredEvents(eventsWithAmounts);
    } else {
      const filtered = eventsWithAmounts.filter(event =>
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredEvents(filtered);
    }

    // Update metrics based on current events
    const activeCount = eventsWithAmounts.filter(e => e.status === 'active').length;
    const completedCount = eventsWithAmounts.filter(e => e.status === 'completed').length;
    const archivedCount = eventsWithAmounts.filter(e => e.status === 'archived').length;

    const newMetrics: HomeMetricData[] = [
      {
        icon: 'calendar-check',
        value: activeCount.toString(),
        label: t.metrics.active,
        color: '#4CAF50'  // Verde - igual que active en EventCard
      },
      {
        icon: 'check-circle',
        value: completedCount.toString(),
        label: t.metrics.completed,
        color: '#FF9800'  // Naranja - igual que completed en EventCard
      },
      {
        icon: 'archive',
        value: archivedCount.toString(),
        label: t.metrics.archived,
        color: '#9E9E9E'  // Gris - igual que archived en EventCard
      }
    ];
    setMetrics(newMetrics);
  }, [eventsWithAmounts, searchQuery, t.metrics]);

  // Helper para mostrar alerts con traducciones
  const showAlert = (title: string, message: string, buttons?: any[]) => {
    Alert.alert(title, message, buttons);
  };

  // Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
      await loadEventCounts();
      await calculateEventTotals();
    } catch (error) {
      console.error('Error refreshing events:', error);
      showAlert(t.actions.error, t.alerts.refreshError);
    }
    setRefreshing(false);
  }, [refreshData, loadEventCounts, calculateEventTotals, t.actions.error, t.alerts.refreshError]);

  // Handlers
  const handleEventPress = (event: HomeEventData) => {
    (navigation as any).navigate('EventDetail', { eventId: event.id });
  };

  const handleEventEdit = (event: HomeEventData) => {
    (navigation as any).navigate('CreateEvent', { eventId: event.id, mode: 'edit' });
  };

  const handleEventArchive = async (event: HomeEventData) => {
    const message = t.alerts.archiveMessage.replace('{{eventName}}', event.name);
    
    showAlert(
      t.alerts.archiveTitle,
      message,
      [
        { text: t.actions.cancel, style: 'cancel' },
        {
          text: t.actions.archive,
          style: 'default',
          onPress: async () => {
            try {
              await updateEvent(event.id, { status: 'archived' });
              await onRefresh();
              showAlert(t.actions.success, t.alerts.archiveSuccess);
            } catch (error) {
              console.error('Error archiving event:', error);
              showAlert(t.actions.error, t.alerts.archiveError);
            }
          }
        }
      ]
    );
  };

  const handleEventDelete = async (event: HomeEventData) => {
    const message = t.alerts.deleteMessage.replace('{{eventName}}', event.name);
    
    showAlert(
      t.alerts.deleteTitle,
      message,
      [
        { text: t.actions.cancel, style: 'cancel' },
        {
          text: t.actions.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(event.id);
              await onRefresh();
              showAlert(t.actions.success, t.alerts.deleteSuccess);
            } catch (error) {
              console.error('Error deleting event:', error);
              showAlert(t.actions.error, t.alerts.deleteError);
            }
          }
        }
      ]
    );
  };

  const handleCreateEvent = () => {
    (navigation as any).navigate('CreateEvent');
  };

  const handleProfilePress = () => {
    (navigation as any).navigate('ProfileScreen');
  };

  const handleManageFriends = () => {
    (navigation as any).navigate('ManageFriends');
  };

  // Render functions
  const renderSearchBar = () => (
    <SearchBar
      value={searchQuery}
      onChangeText={setSearchQuery}
      placeholder={t.search.placeholder}
    />
  );

  const renderMetrics = () => (
    <View style={styles.metricsSection}>
      <View style={styles.metricsContainer}>
        {metrics.map((metric, index) => (
          <MetricsCard
            key={index}
            metric={metric}
            style={StyleSheet.flatten([styles.metricCard])}
          />
        ))}
      </View>
    </View>
  );

  const renderEventItem = ({ item }: { item: HomeEventData }) => (
    <EventCard
      event={item as any} // EventCard usa EventData, compatible con HomeEventData
      onPress={handleEventPress}
      onEdit={handleEventEdit}
      onArchive={handleEventArchive}
      onDelete={handleEventDelete}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name="calendar-plus"
        size={64}
        color={theme.colors.onSurfaceVariant}
      />
      <Text style={styles.emptyTitle}>
        {searchQuery ? t.emptyState.noSearchResults : t.emptyState.noEvents}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? t.emptyState.tryOtherSearch
          : t.emptyState.createFirstEvent
        }
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={handleCreateEvent}
        >
          <Text style={styles.emptyButtonText}>{t.emptyState.createEventButton}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HeaderBar con estructura solicitada: Avatar | Título | ManageFriends | Tema | Idioma */}
      <HeaderBar 
        title={t.header.title}
        titleAlignment="left"
        useDynamicColors={true}
        leftAvatar={
          <UserAvatar 
            size={40}
            onPress={handleProfilePress}
          />
        }
        rightIcon="account-group"
        onLeftPress={handleProfilePress}
        onRightPress={handleManageFriends}
        showThemeToggle={true}
        showLanguageSelector={true}
        elevation={true}
      />
      
      <SafeAreaView style={styles.safeContent} edges={['bottom', 'left', 'right']}>
        {renderSearchBar()}
        
        <FlatList
          data={filteredEvents}
          renderItem={renderEventItem}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || dbLoading}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          ListHeaderComponent={renderMetrics}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            filteredEvents.length === 0 ? styles.emptyContainer : styles.eventsList
          }
        />

        {/* Floating Action Button */}
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fab}
            onPress={handleCreateEvent}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="plus"
              size={28}
              color={theme.colors.onPrimary}
            />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default HomeScreen;