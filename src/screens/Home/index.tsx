import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Animated,
  Platform,
  Linking,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { showAlert } from '../../services/alertService';
import { checkForUpdate } from '../../services/UpdateService';
import { version as appVersion } from '../../../app.json';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { 
  EventCard, 
  MetricsCard,
  HeaderBar,
  UserAvatar,
  SyncStatusIndicator
} from '../../components';
import SearchBar from '../../components/SearchBar';
import { useData } from '../../context/DataContext';
import { databaseService } from '../../services/DatabaseFactory';
import { HomeEventData, HomeMetricData, HomeScreenState } from './types';
import { createStyles } from './styles';
import { homeLanguage } from './language';
import { getSplittyImage } from '../../constants/splitty';
import TutorialOverlay, { TourStep } from '../../components/TutorialOverlay';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { events: dbEvents, loading: dbLoading, refreshData, getEventParticipants, getExpensesByEvent, updateEvent, deleteEvent, importSharedEvent } = useData();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets.bottom);
  
  // Get translations
  const t = homeLanguage[language] || homeLanguage.es;

  // Estados
  const [filteredEvents, setFilteredEvents] = useState<HomeEventData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [metrics, setMetrics] = useState<HomeMetricData[]>([]);
  const [statusFilter, setStatusFilter] = useState<'active' | 'locked' | 'archived' | null>(null);
  const [eventParticipants, setEventParticipants] = useState<{[eventId: string]: number}>({});
  const [eventExpenses, setEventExpenses] = useState<{[eventId: string]: number}>({});
  const [eventTotals, setEventTotals] = useState<{[eventId: string]: number}>({});
  const [eventSettlements, setEventSettlements] = useState<{[eventId: string]: { total: number; paid: number; pendingAmount: number }}>({});

  // QR Scanner
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const qrScannedRef = useRef(false);
  // Ingreso manual de código (alternativa a escanear el QR)
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);

  // Tour
  const [tourVisible, setTourVisible] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const headerRef = useRef<View>(null);
  const searchRef = useRef<View>(null);
  const metricsRef = useRef<View>(null);
  const eventsRef = useRef<View>(null);
  const fabRef = useRef<View>(null);
  const [fabsExpanded, setFabsExpanded] = useState(true);
  const [fabsVisible, setFabsVisible] = useState(true);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const fabsAnim = useRef(new Animated.Value(1)).current;
  // Flag para verificar actualizaciones solo una vez por sesión
  const updateChecked = useRef(false);

  const toggleFabs = () => {
    const expanding = !fabsExpanded;
    if (expanding) setFabsVisible(true);
    Animated.timing(fabsAnim, {
      toValue: expanding ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !expanding) setFabsVisible(false);
    });
    setFabsExpanded(expanding);
  };

  // Cargar participantes, gastos y liquidaciones para cada evento
  const loadEventCounts = useCallback(async () => {
    const participantCounts: {[eventId: string]: number} = {};
    const expenseCounts: {[eventId: string]: number} = {};
    const settlementCounts: {[eventId: string]: { total: number; paid: number; pendingAmount: number }} = {};
    
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
      try {
        const settlements = await databaseService.getSettlementsByEvent(event.id);
        const consolidationAssignments = await databaseService.getConsolidationAssignments(event.id);

        // Construir mapa de asignaciones para detectar liquidaciones condonadas (auto-pagos)
        const assignmentMap: { [debtorId: string]: string } = {};
        consolidationAssignments.forEach((a: any) => {
          assignmentMap[a.debtorId] = a.payerId;
        });

        // Una liquidación es condonada si, después de aplicar la consolidación, el pagador real
        // y el acreedor son la misma persona (pago a sí mismo → no requiere acción real)
        const isForgiven = (s: any) => {
          const actualPayer = assignmentMap[s.fromParticipantId] || s.fromParticipantId;
          return actualPayer === s.toParticipantId;
        };

        const activeSettlements = settlements.filter((s: any) => !isForgiven(s));

        // Solo contar pendiente si el evento tiene gastos activos.
        // Sin gastos, las liquidaciones en DB son huérfanas (no se muestran en EventDetail)
        // y no deben reflejarse como pendiente en la card.
        const eventHasExpenses = (expenseCounts[event.id] ?? 0) > 0;
        const pendingAmount = eventHasExpenses
          ? activeSettlements
              .filter((s: any) => s.isPaid !== true)
              .reduce((sum: number, s: any) => sum + (s.amount || 0), 0)
          : 0;

        settlementCounts[event.id] = {
          total: activeSettlements.length,
          paid: settlements.filter((s: any) => s.isPaid === true).length,
          pendingAmount
        };
      } catch (error) {
        console.error(`Error loading settlements for event ${event.id}:`, error);
        settlementCounts[event.id] = { total: 0, paid: 0, pendingAmount: 0 };
      }
    }
    
    setEventParticipants(participantCounts);
    setEventExpenses(expenseCounts);
    setEventSettlements(settlementCounts);
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
      isLocked: event.isLocked === true,
      isExpress: event.isExpress === true,
      isShared: event.isShared === true,
      sharedRole: event.sharedRole,
      type: event.type as 'public' | 'private',
      participantCount: eventParticipants[event.id] || 0,
      expenseCount: eventExpenses[event.id] || 0,
      description: event.description,
      settlementCount: eventSettlements[event.id]?.total ?? 0,
      paidSettlementCount: eventSettlements[event.id]?.paid ?? 0,
      pendingSettlementAmount: eventSettlements[event.id]?.pendingAmount ?? 0
    }));
  }, [visibleEvents, eventTotals, eventParticipants, eventExpenses, eventSettlements]);

  // Verificar actualizaciones disponibles — solo una vez por sesión, al primer foco
  useFocusEffect(
    useCallback(() => {
      if (!updateChecked.current) {
        updateChecked.current = true;
        checkForUpdate(appVersion);
      }
    }, [])
  );

  // Recargar conteos al volver al foco (ej: pagos de liquidaciones desde EventDetail)
  useFocusEffect(
    useCallback(() => {
      loadEventCounts();
      calculateEventTotals();
    }, [loadEventCounts, calculateEventTotals])
  );

  // Cargar conteos y calcular montos cuando cambian los eventos
  useEffect(() => {
    if (dbEvents.length > 0) {
      loadEventCounts();
      calculateEventTotals();
    }
  }, [dbEvents, loadEventCounts, calculateEventTotals]);

  // Orden de estados para el sorting
  const STATUS_ORDER: Record<string, number> = { active: 0, locked: 1, archived: 2, closed: 3, completed: 4 };

  // Filtrar eventos y actualizar métricas
  useEffect(() => {
    // Aplicar filtro de búsqueda y de estado
    let result = eventsWithAmounts;

    if (statusFilter) {
      if (statusFilter === 'locked') {
        result = result.filter(event => event.status === 'active' && event.isLocked);
      } else if (statusFilter === 'active') {
        result = result.filter(event => event.status === 'active' && !event.isLocked);
      } else {
        result = result.filter(event => event.status === statusFilter);
      }
    }

    if (searchQuery.trim()) {
      result = result.filter(event =>
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Ordenar: estado → fecha → título
    result = [...result].sort((a, b) => {
      const aOrder = a.status === 'active' && a.isLocked ? 1 : STATUS_ORDER[a.status] ?? 99;
      const bOrder = b.status === 'active' && b.isLocked ? 1 : STATUS_ORDER[b.status] ?? 99;
      const statusDiff = aOrder - bOrder;
      if (statusDiff !== 0) return statusDiff;
      const dateDiff = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.name.localeCompare(b.name, 'es');
    });

    setFilteredEvents(result);

    // Update metrics based on current events
    const activeCount = eventsWithAmounts.filter(e => e.status === 'active' && !e.isLocked).length;
    const lockedCount = eventsWithAmounts.filter(e => e.status === 'active' && e.isLocked).length;
    const archivedCount = eventsWithAmounts.filter(e => e.status === 'archived').length;

    const newMetrics: HomeMetricData[] = [
      {
        icon: 'calendar-check',
        value: activeCount.toString(),
        label: t.metrics.active,
        color: '#4CAF50',
        status: 'active'
      },
      {
        icon: 'lock',
        value: lockedCount.toString(),
        label: t.metrics.locked,
        color: '#FF9800',
        status: 'locked'
      },
      {
        icon: 'archive',
        value: archivedCount.toString(),
        label: t.metrics.archived,
        color: '#9E9E9E',
        status: 'archived'
      }
    ];
    setMetrics(newMetrics);
  }, [eventsWithAmounts, searchQuery, statusFilter, t.metrics]);

  // Tour handlers
  const handleTourNext = () => setTourStep(prev => prev + 1);
  const handleTourPrev = () => setTourStep(prev => prev - 1);
  const handleTourClose = async () => {
    await AsyncStorage.setItem('splitsmart_home_tour_seen', 'true');
    setTourVisible(false);
    setTourStep(0);
  };

  // Primer uso: mostrar tour automáticamente
  useEffect(() => {
    const checkFirstTimeTour = async () => {
      try {
        const seen = await AsyncStorage.getItem('splitsmart_home_tour_seen');
        if (!seen) {
          setTourStep(0);
          setTourVisible(true);
        }
      } catch (_) {}
    };
    checkFirstTimeTour();
  }, []);

  // Refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
      await loadEventCounts();
      await calculateEventTotals();
    } catch (error) {
      console.error('Error refreshing events:', error);
      showAlert({ type: 'error', title: t.actions.error, message: t.alerts.refreshError });
    }
    setRefreshing(false);
  }, [refreshData, loadEventCounts, calculateEventTotals, t.actions.error, t.alerts.refreshError]);

  // Handlers
  const handleEventPress = (event: HomeEventData) => {
    (navigation as any).navigate('EventDetail', { eventId: event.id });
  };

  // ── QR / Deep Link handlers ──────────────────────────────────────────────
  const processQRData = useCallback(async (raw: string) => {
    try {
      if (!raw.startsWith('splitsmart://join?')) {
        showAlert({ type: 'error', title: t.actions.error, message: t.qr.invalidQR, buttons: [{ text: 'OK' }] });
        return;
      }
      const url = new URL(raw);
      const shareId = url.searchParams.get('share');
      const legacyDataB64 = url.searchParams.get('data'); // compatibilidad con QRs viejos

      if (shareId) {
        // ── Nuevo flujo: obtener snapshot desde Supabase ──
        showAlert({
          type: 'confirm',
          title: t.qr.importConfirmTitle,
          message: t.qr.fetchingShare,
          buttons: [
            { text: t.actions.cancel, style: 'cancel' },
            {
              text: t.actions.ok,
              onPress: async () => {
                try {
                  const SharedEventService = (await import('../../services/SharedEventService')).default;
                  const record = await SharedEventService.fetchShare(shareId);
                  const roleLabel = record.role === 'editor' ? t.qr.importRoleEditor : t.qr.importRoleViewer;
                  const confirmMsg = t.qr.importConfirmMessage
                    .replace('{name}', record.snapshot?.e?.n || '?')
                    .replace('{role}', roleLabel);
                  showAlert({
                    type: 'confirm',
                    title: t.qr.importConfirmTitle,
                    message: confirmMsg,
                    buttons: [
                      { text: t.actions.cancel, style: 'cancel' },
                      {
                        text: t.actions.ok,
                        onPress: async () => {
                          try {
                            const newEvent = await importSharedEvent(record.snapshot, record.role, shareId, record.ownerName);
                            showAlert({
                              type: 'success',
                              title: t.qr.importSuccess,
                              message: t.qr.importSuccessMessage.replace('{name}', newEvent.name),
                              buttons: [{ text: t.actions.ok, onPress: () => {
                                (navigation as any).navigate('EventDetail', { eventId: newEvent.id });
                              }}],
                            });
                          } catch {
                            showAlert({ type: 'error', title: t.actions.error, message: t.qr.importError, buttons: [{ text: 'OK' }] });
                          }
                        }
                      },
                    ],
                  });
                } catch (err: any) {
                  const msg = err?.message === 'QR_NOT_FOUND' ? t.qr.shareNotFound : t.qr.importError;
                  showAlert({ type: 'error', title: t.actions.error, message: msg, buttons: [{ text: 'OK' }] });
                }
              }
            },
          ],
        });
      } else if (legacyDataB64) {
        // ── Flujo legacy: datos incrustados en QR ──
        const json = decodeURIComponent(escape(atob(legacyDataB64)));
        const payload = JSON.parse(json);
        if (!payload?.e?.n) {
          showAlert({ type: 'error', title: t.actions.error, message: t.qr.invalidQR, buttons: [{ text: 'OK' }] });
          return;
        }
        const roleLabel = payload.role === 'editor' ? t.qr.importRoleEditor : t.qr.importRoleViewer;
        const message = t.qr.importConfirmMessage
          .replace('{name}', payload.e.n)
          .replace('{role}', roleLabel);
        showAlert({
          type: 'confirm',
          title: t.qr.importConfirmTitle,
          message,
          buttons: [
            { text: t.actions.cancel, style: 'cancel' },
            {
              text: t.actions.ok,
              onPress: async () => {
                try {
                  const newEvent = await importSharedEvent(payload, payload.role || 'viewer');
                  showAlert({
                    type: 'success',
                    title: t.qr.importSuccess,
                    message: t.qr.importSuccessMessage.replace('{name}', newEvent.name),
                    buttons: [{ text: t.actions.ok, onPress: () => {
                      (navigation as any).navigate('EventDetail', { eventId: newEvent.id });
                    }}],
                  });
                } catch {
                  showAlert({ type: 'error', title: t.actions.error, message: t.qr.importError, buttons: [{ text: 'OK' }] });
                }
              }
            },
          ],
        });
      } else {
        showAlert({ type: 'error', title: t.actions.error, message: t.qr.invalidQR, buttons: [{ text: 'OK' }] });
      }
    } catch {
      showAlert({ type: 'error', title: t.actions.error, message: t.qr.invalidQR, buttons: [{ text: 'OK' }] });
    }
  }, [importSharedEvent, navigation, t]);

  // Confirma e importa un evento a partir de un record de share (usado por el ingreso manual de código).
  const confirmImportRecord = useCallback((record: any) => {
    const roleLabel = record.role === 'editor' ? t.qr.importRoleEditor : t.qr.importRoleViewer;
    const confirmMsg = t.qr.importConfirmMessage
      .replace('{name}', record.snapshot?.e?.n || '?')
      .replace('{role}', roleLabel);
    showAlert({
      type: 'confirm',
      title: t.qr.importConfirmTitle,
      message: confirmMsg,
      buttons: [
        { text: t.actions.cancel, style: 'cancel' },
        {
          text: t.actions.ok,
          onPress: async () => {
            try {
              const newEvent = await importSharedEvent(record.snapshot, record.role, record.shareId, record.ownerName);
              showAlert({
                type: 'success',
                title: t.qr.importSuccess,
                message: t.qr.importSuccessMessage.replace('{name}', newEvent.name),
                buttons: [{ text: t.actions.ok, onPress: () => {
                  (navigation as any).navigate('EventDetail', { eventId: newEvent.id });
                }}],
              });
            } catch {
              showAlert({ type: 'error', title: t.actions.error, message: t.qr.importError, buttons: [{ text: 'OK' }] });
            }
          }
        },
      ],
    });
  }, [importSharedEvent, navigation, t]);

  // Vincula un evento ingresando el código corto manualmente (sin escanear el QR).
  const handleCodeSubmit = useCallback(async () => {
    const raw = codeInput.trim();
    if (!raw) return;
    setCodeLoading(true);
    try {
      const mod = await import('../../services/SharedEventService');
      const record = await mod.default.fetchShareByCode(raw);
      setCodeLoading(false);
      setShowCodeInput(false);
      setShowQRScanner(false);
      setCodeInput('');
      confirmImportRecord(record);
    } catch (err: any) {
      setCodeLoading(false);
      const msg = err?.message === 'QR_NOT_FOUND' ? t.qr.codeNotFound : t.qr.importError;
      showAlert({ type: 'error', title: t.actions.error, message: msg, buttons: [{ text: 'OK' }] });
    }
  }, [codeInput, confirmImportRecord, t]);


  const handleOpenQRScanner = useCallback(async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        showAlert({ type: 'error', title: t.qr.permissionRequired, message: t.qr.permissionMessage, buttons: [{ text: t.qr.grantPermission, onPress: () => Linking.openSettings() }, { text: t.actions.cancel }] });
        return;
      }
    }
    qrScannedRef.current = false;
    setShowQRScanner(true);
  }, [cameraPermission, requestCameraPermission, t]);

  // Handle deep links (cold start + while running)
  useEffect(() => {
    const handleURL = (url: string) => {
      if (url.includes('splitsmart://join')) {
        processQRData(url);
      }
    };
    Linking.getInitialURL().then(url => { if (url) handleURL(url); });
    const sub = Linking.addEventListener('url', ({ url }) => handleURL(url));
    return () => sub.remove();
  }, [processQRData]);

  const handleEventEdit = (event: HomeEventData) => {
    (navigation as any).navigate('CreateEvent', { eventId: event.id, mode: 'edit' });
  };

  const handleEventArchive = async (event: HomeEventData) => {
    const message = t.alerts.archiveMessage.replace('{{eventName}}', event.name);
    
    showAlert({
      type: 'warning',
      title: t.alerts.archiveTitle,
      message,
      buttons: [
        { text: t.actions.cancel, style: 'cancel' },
        {
          text: t.actions.archive,
          style: 'default',
          onPress: async () => {
            try {
              await updateEvent(event.id, { status: 'archived' });
              await onRefresh();
              showAlert({ type: 'success', title: t.actions.success, message: t.alerts.archiveSuccess });
            } catch (error) {
              console.error('Error archiving event:', error);
              showAlert({ type: 'error', title: t.actions.error, message: t.alerts.archiveError });
            }
          }
        }
      ]
    });
  };

  const handleEventDelete = async (event: HomeEventData) => {
    const message = t.alerts.deleteMessage.replace('{{eventName}}', event.name);
    
    showAlert({
      type: 'destructive',
      title: t.alerts.deleteTitle,
      message,
      buttons: [
        { text: t.actions.cancel, style: 'cancel' },
        {
          text: t.actions.delete,
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(event.id);
              await onRefresh();
              showAlert({ type: 'success', title: t.actions.success, message: t.alerts.deleteSuccess });
            } catch (error) {
              console.error('Error deleting event:', error);
              showAlert({ type: 'error', title: t.actions.error, message: t.alerts.deleteError });
            }
          }
        }
      ]
    });
  };

  const handleCreateEvent = () => {
    (navigation as any).navigate('CreateEvent');
  };

  const handleExpressEvent = () => {
    (navigation as any).navigate('ExpressEvent');
  };

  const handleProfilePress = () => {
    (navigation as any).navigate('ProfileScreen');
  };

  const handleManageFriends = () => {
    (navigation as any).navigate('ManageFriends');
  };

  // Render functions
  const renderTopSection = () => (
    <View style={styles.sectionCard}>
      {/* Buscador */}
      <View ref={searchRef} collapsable={false}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t.search.placeholder}
        />
      </View>

      {/* Botones de filtro: Activos | Bloqueados | Cerrados */}
      <View ref={metricsRef} collapsable={false} style={styles.filterRow}>
        {metrics.map((metric, index) => {
          const isSelected = statusFilter === metric.status;
          return (
            <TouchableOpacity
              key={index}
              style={[styles.filterBtn, isSelected && { backgroundColor: metric.color + '20' }]}
              onPress={() => setStatusFilter(prev => prev === metric.status ? null : metric.status)}
              activeOpacity={0.7}
            >
              <View style={styles.filterIconWrap}>
                <MaterialCommunityIcons
                  name={metric.icon as any}
                  size={28}
                  color={isSelected ? metric.color : theme.colors.onSurfaceVariant}
                />
                <View style={[styles.filterBadge, { backgroundColor: metric.color }]}>
                  <Text style={styles.filterBadgeText}>{metric.value}</Text>
                </View>
              </View>
              <Text style={[styles.filterLabel, { color: isSelected ? metric.color : theme.colors.onSurfaceVariant }]}>
                {metric.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderEventItem = ({ item }: { item: HomeEventData }) => (
    <EventCard
      event={item as any}
      onPress={handleEventPress}
      onEdit={handleEventEdit}
      onArchive={handleEventArchive}
      onDelete={handleEventDelete}
      isExpanded={expandedEventId === item.id}
      onToggleExpand={() => {
        const isCurrentlyExpanded = expandedEventId === item.id;
        setExpandedEventId(isCurrentlyExpanded ? null : item.id);
        // Colapsar FABs al expandir una card
        if (!isCurrentlyExpanded && fabsExpanded) {
          toggleFabs();
        }
      }}
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
      {/* HeaderBar */}
      <View ref={headerRef} collapsable={false}>
        <HeaderBar 
          title={t.header.title}
          titleAlignment="left"
          useDynamicColors={true}
          showThemeToggle={true}
          showLanguageSelector={true}
          showHelp={true}
          showLogout={true}
          additionalRightElements={<SyncStatusIndicator variant="icon" size={22} color="#FFFFFF" />}
          overflowBeforeItems={[
            { icon: 'account-group', label: t.header.friends, onPress: handleManageFriends },
            { icon: 'qrcode-scan', label: t.qr.scanButton, onPress: handleOpenQRScanner },
            { icon: 'keyboard-outline', label: t.qr.enterCodeButton, onPress: () => { setCodeInput(''); setShowCodeInput(true); } },
          ]}
          elevation={true}
          onHelpPress={() => { setTourStep(0); setTourVisible(true); }}
        />
      </View>
      
      <SafeAreaView style={styles.safeContent} edges={['bottom', 'left', 'right']}>

        {/* Sección 1: Buscador + Filtros */}
        {renderTopSection()}

        {/* Sección 2: Lista de eventos */}
        <View ref={eventsRef} collapsable={false} style={[styles.sectionCard, { flex: 1, marginBottom: 8 }]}>
          <FlatList
            data={filteredEvents}
            renderItem={renderEventItem}
            keyExtractor={item => item.id}
            extraData={eventSettlements}
            refreshControl={
              <RefreshControl
                refreshing={refreshing || dbLoading}
                onRefresh={onRefresh}
                colors={['#4CAF50']}
                tintColor={'#4CAF50'}
              />
            }
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={
              filteredEvents.length === 0 ? styles.emptyContainer : styles.eventsList
            }
          />
        </View>

        {/* Floating Action Buttons */}
        <View ref={fabRef} collapsable={false} style={styles.fabContainer}>
          {/* FABs secundarios (animados, se eliminan del layout al colapsar) */}
          {fabsVisible && (
            <Animated.View style={{ alignItems: 'center', gap: 6, opacity: fabsAnim, transform: [{ scaleY: fabsAnim }, { translateY: fabsAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] }}>
              {/* Botón SplitExpress */}
              <TouchableOpacity
                style={[styles.fab, styles.expressEventFab]}
                onPress={handleExpressEvent}
                activeOpacity={0.8}
              >
                <Image
                  source={require('../../../assets/splitsmart/Splitty_Name.png')}
                  style={{ width: 78, height: 78, resizeMode: 'contain' }}
                />
              </TouchableOpacity>

              {/* Botón Crear Evento */}
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

              {/* Botón Perfil */}
              <TouchableOpacity
                style={[styles.fab, styles.profileFab]}
                onPress={handleProfilePress}
                activeOpacity={0.8}
              >
                <UserAvatar
                  size={48}
                  onPress={handleProfilePress}
                />
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Botón Toggle — siempre abajo, forma de píldora */}
          <TouchableOpacity style={styles.fabToggle} onPress={toggleFabs} activeOpacity={0.8}>
            <MaterialCommunityIcons
              name={fabsExpanded ? 'chevron-down' : 'chevron-up'}
              size={18}
              color={theme.colors.onPrimary}
            />
            <Text style={{ color: theme.colors.onPrimary, fontSize: 13, fontWeight: '600' }}>
              {fabsExpanded ? 'Contraer' : 'Desplegar'}
            </Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>

      {/* ── Modal QR Scanner ───────────────────────────────────────────── */}
      <Modal
        visible={showQRScanner}
        animationType="slide"
        onRequestClose={() => setShowQRScanner(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          {/* Header */}
          <View style={{ paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => setShowQRScanner(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', flex: 1 }}>{t.qr.scanTitle}</Text>
          </View>

          {cameraPermission?.granted ? (
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              onBarcodeScanned={({ data }) => {
                if (qrScannedRef.current) return;
                qrScannedRef.current = true;
                setShowQRScanner(false);
                processQRData(data);
              }}
            >
              {/* Marco de escaneo */}
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: 240, height: 240, borderWidth: 3, borderColor: '#9C27B0', borderRadius: 16 }} />
                <Text style={{ color: '#FFFFFF', marginTop: 24, fontSize: 14, textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 }}>
                  {t.qr.scanInstructions}
                </Text>
              </View>
            </CameraView>
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 }}>
              <MaterialCommunityIcons name="camera-off" size={64} color="#888" />
              <Text style={{ color: '#FFFFFF', fontSize: 16, textAlign: 'center' }}>{t.qr.permissionMessage}</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#9C27B0', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
                onPress={() => Linking.openSettings()}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>{t.qr.grantPermission}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Footer: ingresar código manualmente (sin escanear) */}
          <View style={{ paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12 }}>
            <TouchableOpacity
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#9C27B0',
              }}
              onPress={() => { setCodeInput(''); setShowCodeInput(true); }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="keyboard-outline" size={20} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '700' }}>{t.qr.enterCodeButton}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal Ingresar Código ──────────────────────────────────────── */}
      <Modal
        visible={showCodeInput}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCodeInput(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: theme.colors.surface, borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 }}>
              <MaterialCommunityIcons name="ticket-confirmation-outline" size={24} color="#9C27B0" />
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.onSurface, flex: 1 }}>
                {t.qr.enterCodeTitle}
              </Text>
              <TouchableOpacity onPress={() => setShowCodeInput(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="close" size={22} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: theme.colors.onSurfaceVariant, marginBottom: 16, lineHeight: 18 }}>
              {t.qr.enterCodeDesc}
            </Text>
            <TextInput
              value={codeInput}
              onChangeText={(txt) => setCodeInput(txt.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
              placeholder={t.qr.enterCodePlaceholder}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
              style={{
                borderWidth: 1.5, borderColor: theme.colors.outline, borderRadius: 12,
                paddingVertical: 14, paddingHorizontal: 16, fontSize: 22, fontWeight: '800',
                letterSpacing: 4, textAlign: 'center', color: theme.colors.onSurface,
                backgroundColor: theme.colors.surfaceVariant, marginBottom: 20,
              }}
            />
            <TouchableOpacity
              style={{
                backgroundColor: codeInput.trim() ? '#9C27B0' : theme.colors.surfaceVariant,
                paddingVertical: 14, borderRadius: 12, alignItems: 'center',
                flexDirection: 'row', justifyContent: 'center', gap: 8,
              }}
              disabled={!codeInput.trim() || codeLoading}
              onPress={handleCodeSubmit}
              activeOpacity={0.8}
            >
              {codeLoading
                ? <MaterialCommunityIcons name="loading" size={20} color="#FFFFFF" />
                : <MaterialCommunityIcons name="link-variant" size={20} color={codeInput.trim() ? '#FFFFFF' : theme.colors.onSurfaceVariant} />}
              <Text style={{ fontSize: 14, fontWeight: '700', color: codeInput.trim() ? '#FFFFFF' : theme.colors.onSurfaceVariant }}>
                {t.qr.enterCodeSubmit}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Tour guiado */}
      <TutorialOverlay
        visible={tourVisible}
        steps={[
          { ref: headerRef,  titleKey: 'tour.home.header.title',  descKey: 'tour.home.header.desc',  popupPosition: 'below'  },
          { ref: searchRef,  titleKey: 'tour.home.search.title',  descKey: 'tour.home.search.desc',  popupPosition: 'below'  },
          { ref: metricsRef, titleKey: 'tour.home.metrics.title', descKey: 'tour.home.metrics.desc', popupPosition: 'below'  },
          { ref: eventsRef,  titleKey: 'tour.home.events.title',  descKey: 'tour.home.events.desc',  popupPosition: 'center' },
          {
            ref: fabRef,
            titleKey: 'tour.home.fabs.title',
            descKey: 'tour.home.fabs.desc',
            popupPosition: 'above',
            descContent: (
              <View style={{ gap: 10, marginTop: 4 }}>
                {/* Splitty */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Image
                    source={getSplittyImage(language)}
                    style={{ width: 28, height: 28, resizeMode: 'contain' }}
                  />
                  <Text style={{ flex: 1, fontSize: 13, color: theme.colors.onSurfaceVariant ?? theme.colors.onSurface }}>
                    {t.tourFabs.splitty}
                  </Text>
                </View>
                {/* Agregar evento */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name="plus" size={18} color={theme.colors.onPrimary} />
                  </View>
                  <Text style={{ flex: 1, fontSize: 13, color: theme.colors.onSurfaceVariant ?? theme.colors.onSurface }}>
                    {t.tourFabs.add}
                  </Text>
                </View>
                {/* Avatar / perfil */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  {user?.avatar ? (
                    <Image source={{ uri: user.avatar }} style={{ width: 28, height: 28, borderRadius: 14 }} />
                  ) : (
                    <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#4B89DC', alignItems: 'center', justifyContent: 'center' }}>
                      {user?.name ? (
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{user.name.charAt(0).toUpperCase()}</Text>
                      ) : (
                        <MaterialCommunityIcons name="account" size={18} color="#fff" />
                      )}
                    </View>
                  )}
                  <Text style={{ flex: 1, fontSize: 13, color: theme.colors.onSurfaceVariant ?? theme.colors.onSurface }}>
                    {t.tourFabs.profile}
                  </Text>
                </View>
              </View>
            ),
          },
        ]}
        currentStep={tourStep}
        onNext={handleTourNext}
        onPrev={handleTourPrev}
        onClose={handleTourClose}
      />
    </View>
  );
};

export default HomeScreen;