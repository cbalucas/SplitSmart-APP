import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
// import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { Theme } from '../../constants/theme';
import { 
  EventCard, 
  MetricsCard,
  EventData, 
  MetricData,
  LanguageSelector,
  ThemeToggle,
  UserAvatar
} from '../../components';
import { useData } from '../../context/DataContext';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const { events: dbEvents, loading: dbLoading, refreshData, getEventParticipants, getExpensesByEvent, updateEvent, deleteEvent } = useData();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);

  // Estados
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [eventParticipants, setEventParticipants] = useState<{[eventId: string]: number}>({});
  const [eventExpenses, setEventExpenses] = useState<{[eventId: string]: number}>({});

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





  // Estado para almacenar los montos calculados
  const [eventTotals, setEventTotals] = useState<{[eventId: string]: number}>({});

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

  // Calcular eventos con montos actualizados (sincrono usando los totales calculados)
  const eventsWithAmounts = useMemo(() => {
    return dbEvents.map(event => ({
      id: event.id,
      name: event.name,
      location: event.location,
      startDate: event.startDate,
      totalAmount: eventTotals[event.id] || event.totalAmount || 0,
      currency: event.currency,
      status: event.status as 'active' | 'closed' | 'completed' | 'archived',
      participantCount: eventParticipants[event.id] || 0,
      expenseCount: eventExpenses[event.id] || 0
    }));
  }, [dbEvents, eventTotals, eventParticipants, eventExpenses]);

  // Cargar conteos y calcular montos cuando cambian los eventos
  useEffect(() => {
    if (dbEvents.length > 0) {
      loadEventCounts();
      calculateEventTotals();
    }
  }, [dbEvents, loadEventCounts, calculateEventTotals]);

  // Efectos
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
    const closedCount = eventsWithAmounts.filter(e => e.status === 'closed').length;
    const completedCount = eventsWithAmounts.filter(e => e.status === 'completed').length;
    const archivedCount = eventsWithAmounts.filter(e => e.status === 'archived').length;

    const newMetrics: MetricData[] = [
      {
        icon: 'calendar-check',
        value: activeCount.toString(),
        label: 'Eventos Activos',
        color: '#4CAF50'
      },
      {
        icon: 'lock',
        value: closedCount.toString(),
        label: 'Eventos Cerrados',
        color: '#FF9800'
      },
      {
        icon: 'check-circle',
        value: completedCount.toString(),
        label: 'Completados',
        color: '#2196F3'
      },
      {
        icon: 'archive',
        value: archivedCount.toString(),
        label: 'Archivados',
        color: '#9E9E9E'
      }
    ];
    setMetrics(newMetrics);
  }, [eventsWithAmounts, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
      await loadEventCounts();
      await calculateEventTotals();
    } catch (error) {
      console.error('Error refreshing events:', error);
      Alert.alert('Error', 'No se pudieron cargar los eventos');
    }
    setRefreshing(false);
  }, [refreshData, loadEventCounts, calculateEventTotals]);



  const handleEventPress = (event: EventData) => {
    (navigation as any).navigate('EventDetail', { eventId: event.id });
  };

  const handleEventEdit = (event: EventData) => {
    (navigation as any).navigate('CreateEvent', { eventId: event.id, mode: 'edit' });
  };

  const handleEventArchive = async (event: EventData) => {
    Alert.alert(
      'Archivar Evento',
      `¿Deseas archivar el evento "${event.name}"? Podrás restaurarlo después.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Archivar',
          style: 'default',
          onPress: async () => {
            try {
              await updateEvent(event.id, { status: 'archived' });
              await onRefresh();
              Alert.alert('Éxito', 'Evento archivado correctamente');
            } catch (error) {
              console.error('Error archiving event:', error);
              Alert.alert('Error', 'No se pudo archivar el evento');
            }
          }
        }
      ]
    );
  };

  const handleEventDelete = async (event: EventData) => {
    Alert.alert(
      '⚠️ Eliminar Evento',
      `¿Estás seguro de que quieres eliminar "${event.name}"?\n\nEsta acción eliminará:\n• Todos los gastos\n• Todas las divisiones\n• Historial de pagos\n\nEsta acción NO se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(event.id);
              await onRefresh();
              Alert.alert('Éxito', 'Evento eliminado correctamente');
            } catch (error) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', 'No se pudo eliminar el evento');
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

  const renderHeader = () => (
    <View style={styles.headerGradient}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Mis Eventos</Text>
        </View>
        
        <View style={styles.headerRight}>
          <LanguageSelector size={26} color="#FFFFFF" />
          
          <ThemeToggle size={24} color="#FFFFFF" />
          
          <TouchableOpacity
            onPress={() => (navigation as any).navigate('ManageFriends')}
            style={styles.headerButton}
          >
            <MaterialCommunityIcons
              name="account-group"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          
          <UserAvatar
            size={32}
            onPress={handleProfilePress}
          />
        </View>
      </View>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={styles.searchBar}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color={theme.colors.onSurfaceVariant}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar eventos..."
          placeholderTextColor={theme.colors.onSurfaceVariant}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <MaterialCommunityIcons
              name="close"
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
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

  const renderEventItem = ({ item }: { item: EventData }) => (
    <EventCard
      event={item}
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
        {searchQuery ? 'No se encontraron eventos' : 'No tienes eventos aún'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? 'Intenta con otros términos de búsqueda'
          : 'Crea tu primer evento y comienza a dividir gastos'
        }
      </Text>
      {!searchQuery && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={handleCreateEvent}
        >
          <Text style={styles.emptyButtonText}>Crear Evento</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {renderHeader()}
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
          filteredEvents.length === 0 ? styles.emptyContainer : { paddingBottom: 100 }
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
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default HomeScreen;

const createStyles = (theme: Theme, insets: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    } as ViewStyle,

    headerGradient: {
      paddingTop: 16, // SafeAreaView handles top inset
      paddingBottom: 16,
      backgroundColor: '#4B89DC',
    } as ViewStyle,

    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      marginTop: 8,
    } as ViewStyle,

    headerLeft: {
      flex: 1,
    } as ViewStyle,

    headerTitle: {
      fontSize: 24,
      fontWeight: '600',
      color: '#FFFFFF',
    } as TextStyle,

    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    } as ViewStyle,

    headerButton: {
      padding: 8,
      marginLeft: 8,
    } as ViewStyle,

    avatarButton: {
      marginLeft: 8,
    } as ViewStyle,

    avatarPlaceholder: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    } as ViewStyle,

    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 40,
    } as ViewStyle,

    searchIcon: {
      marginRight: 8,
    } as ViewStyle,

    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.onSurface,
      paddingVertical: 0,
    } as TextStyle,

    clearButton: {
      padding: 4,
    } as ViewStyle,

    metricsSection: {
      paddingVertical: 12,
      paddingHorizontal: 16,
    } as ViewStyle,

    metricsScrollView: {
      flexGrow: 0,
    } as ViewStyle,

    metricsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'stretch',
    } as ViewStyle,

    metricCard: {
      flex: 1,
      marginHorizontal: 2,
    } as ViewStyle,

    emptyContainer: {
      flexGrow: 1,
    } as ViewStyle,

    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    } as ViewStyle,

    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginTop: 16,
      marginBottom: 8,
    } as TextStyle,

    emptySubtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    } as TextStyle,

    emptyButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    } as ViewStyle,

    emptyButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onPrimary,
    } as TextStyle,

    fabContainer: {
      position: 'absolute',
      bottom: insets.bottom + 20, // Respeta el safe area
      right: 20,
      zIndex: 1000,
    } as ViewStyle,

    fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#4B89DC',
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
    } as ViewStyle,
  });
