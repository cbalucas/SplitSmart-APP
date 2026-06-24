import React, { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Linking,
  Clipboard,
  Modal,
  TextInput,
  Image,
  Switch,
  BackHandler,
  ActivityIndicator,
  Platform
} from 'react-native';
import QRCodeView from '../../components/QRCodeView';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Event, Expense, Participant, EventParticipant, Split, Payment, Settlement } from '../../types';
import { AppColors } from '../../constants/colors';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Avatar from '../../components/Avatar';
import AddParticipantModal from '../../components/AddParticipantModal';
import HeaderBar from '../../components/HeaderBar';
import SearchBar from '../../components/SearchBar';
import { LanguageSelector, ThemeToggle, SettlementItem, ConsolidationModal } from '../../components';
import { useCalculations } from '../../hooks/useCalculations';
import { databaseService } from '../../services/DatabaseFactory';
import { ConsolidationService } from '../../services/ConsolidationService';
import { showAlert, dismissAlert } from '../../services/alertService';
import * as ImagePicker from 'expo-image-picker';
import { createStyles } from './styles';
import TutorialOverlay from '../../components/TutorialOverlay';

export default function EventDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);
  
    const { 
    events, 
    expenses,
    getExpensesByEvent, 
    getEventParticipants, 
    getSplitsByEvent,
    addExpense,
    deleteExpense,
    deleteEvent,
    updateEvent,
    addParticipantToEvent, 
    addExistingParticipantToEvent,
    removeParticipantFromEvent,
    addSecondaryParticipant,
    removeSecondaryParticipant,
    updateParticipant,
    participants,
    getPaymentsByEvent,
    createPayment,
    updatePayment
  } = useData();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const eventId = (route.params as any)?.eventId as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [eventExpenses, setEventExpenses] = useState<Expense[]>([]);
  const [eventParticipants, setEventParticipants] = useState<(Participant & { role: EventParticipant['role']; balance: number; joinedAt: string })[]>([]);
  const [eventSplits, setEventSplits] = useState<Split[]>([]);
  const [eventPayments, setEventPayments] = useState<Payment[]>([]);
  const [dbSettlements, setDbSettlements] = useState<Settlement[]>([]);
  const [activeTab, setActiveTab] = useState('resumen');
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);

  // Tour guiado
  const [edTourVisible, setEdTourVisible] = useState(false);
  const [edTourStep, setEdTourStep] = useState(0);
  const edHeaderRef = useRef<View>(null);
  const edInfoRef = useRef<View>(null);
  const edSettlementsRef = useRef<View>(null);
  const edParticipantsRef = useRef<View>(null);
  const edExpenseFiltersRef = useRef<View>(null);
  const edExpensesRef = useRef<View>(null);
  const edParticipantActionsRef = useRef<View>(null);
  const edEventActionsRef = useRef<View>(null);

  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [settlementsSearchQuery, setSettlementsSearchQuery] = useState('');
  const [participantInfoModalVisible, setParticipantInfoModalVisible] = useState(false);
  const [selectedParticipantForInfo, setSelectedParticipantForInfo] = useState<Participant | null>(null);
  // Estados para selección múltiple de participantes
  const [isParticipantSelectMode, setIsParticipantSelectMode] = useState(false);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<Set<string>>(new Set());

  // Estados para agregar participante secundario
  const [addSecondaryForPrimary, setAddSecondaryForPrimary] = useState<Participant | null>(null);
  const [secondaryNameInput, setSecondaryNameInput] = useState('');
  const [isAddingSecondary, setIsAddingSecondary] = useState(false);

  // Estado para colapsar/expandir lista de secundarios por primario
  const [expandedSecondaries, setExpandedSecondaries] = useState<Set<string>>(new Set());

  // Estados para editar nombre de participante secundario
  const [editingSecondaryId, setEditingSecondaryId] = useState<string | null>(null);
  const [editingSecondaryName, setEditingSecondaryName] = useState('');

  // Estados para selección múltiple de gastos
  const [isExpenseSelectMode, setIsExpenseSelectMode] = useState(false);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<Set<string>>(new Set());
  
  // Estados de filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [participantSearchQuery, setParticipantSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('todos');
  const [filterPayer, setFilterPayer] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description'>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [allowUndoPayments, setAllowUndoPayments] = useState(false);
  const [selectedUndoIds, setSelectedUndoIds] = useState<Set<string>>(new Set());
  const [isOptimizationExpanded, setIsOptimizationExpanded] = useState(false);
  const [isConsolidationSectionExpanded, setIsConsolidationSectionExpanded] = useState(false);
  const [isParticipantStatsExpanded, setIsParticipantStatsExpanded] = useState(false);
  const [isCategoryStatsExpanded, setIsCategoryStatsExpanded] = useState(false);
  const [showExpenseDetailModal, setShowExpenseDetailModal] = useState(false);
  const [selectedExpenseForDetail, setSelectedExpenseForDetail] = useState<any>(null);
  // Estado para manejar qué listas de pagadores están expandidas (inicia contraído por defecto)
  const [expandedPayerLists, setExpandedPayerLists] = useState<Set<string>>(new Set());

  // Orden congelado de liquidaciones: se recalcula solo cuando cambia la composición de la lista
  // (no cuando cambia isPaid), así los ítems no saltan al marcarse como pagados
  const [frozenSettlementOrder, setFrozenSettlementOrder] = useState<string[]>([]);

  // Estados para consolidación
  const [showConsolidationModal, setShowConsolidationModal] = useState(false);
  const [consolidationAssignments, setConsolidationAssignments] = useState<any[]>([]);
  const [showOriginalView, setShowOriginalView] = useState(false);
  const [consolidatedSettlements, setConsolidatedSettlements] = useState<any[]>([]);

  // ── Modal: cerrar evento con liquidaciones pendientes ──────
  const [showCloseWithPendingModal, setShowCloseWithPendingModal] = useState(false);
  const [closeComment, setCloseComment] = useState('');

  // ── Modal: QR de invitación ────────────────────────────────
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrPermission, setQrPermission] = useState<'editor' | 'viewer'>('viewer');

  // Use calculations hook for balance and settlement calculations  
  const { balances, settlements, eventStats } = useCalculations(
    eventParticipants,
    eventExpenses,
    eventSplits,
    eventPayments, // Payments (para compatibilidad legacy)
    dbSettlements,
    (event?.status || 'active') as 'active' | 'archived'
  );

  // --- Variables de permisos de estado ---
  const isLocked = event?.isLocked === true;
  const isClosed = event?.status === 'archived';
  const isSharedEvent = event?.isShared === true;
  const sharedRole = event?.sharedRole;
  // Los eventos compartidos con rol viewer son solo lectura
  const isEditable = event?.status === 'active' && !isLocked && !(isSharedEvent && sharedRole === 'viewer');

  // Crear un objeto indexable para balances
  const balancesById = balances.reduce((acc: Record<string, number>, balance) => {
    acc[balance.participantId] = balance.balance;
    return acc;
  }, {});

  // Debug log para ver por qué no se generan settlements
  console.log('🔍 Calculation inputs:', {
    participants: eventParticipants.length,
    expenses: eventExpenses.length,
    splits: eventSplits.length,
    payments: eventPayments.length,
    dbSettlements: dbSettlements.length,
    settlementsCalculated: settlements.length
  });

  // Tour handlers
  const handleEdTourNext = () => setEdTourStep(p => p + 1);
  const handleEdTourPrev = () => {
    const prev = edTourStep - 1;
    // Al retroceder del paso 3 (participantActions) al 2 (settlements) → volver a resumen
    if (edTourStep === 3) setActiveTab('resumen');
    // Al retroceder del paso 5 (expenseFilters) al 4 (participants) → volver a participantes
    if (edTourStep === 5) setActiveTab('participantes');
    setEdTourStep(prev);
  };
  const handleEdTourClose = async () => {
    await AsyncStorage.setItem('splitsmart_eventdetail_tour_seen', 'true');
    setEdTourVisible(false);
    setEdTourStep(0);
    setActiveTab('resumen');
  };

  useEffect(() => {
    AsyncStorage.getItem('splitsmart_eventdetail_tour_seen').then(seen => {
      if (!seen) { setEdTourStep(0); setEdTourVisible(true); }
    }).catch(() => {});
  }, []);

  const loadEventData = useCallback(async () => {
    if (!eventId) return;
    
    try {
      // Consultar el evento directamente desde la base de datos para obtener el estado más reciente
      const foundEvent = await databaseService.getEventById(eventId);
      setEvent(foundEvent);
      
      if (foundEvent) {
        // Load expenses, participants, splits, payments, settlements and consolidations from SQLite
        // NOTE: Sequential (not Promise.all) to avoid concurrent SQLite statement handle collisions
        const expensesData = await getExpensesByEvent(eventId).catch(() => []);
        const participantsData = await getEventParticipants(eventId).catch(() => []);
        const splitsData = await getSplitsByEvent(eventId).catch(() => []);
        const paymentsData = await getPaymentsByEvent(eventId).catch(() => []);
        const settlementsData = await databaseService.getSettlementsByEvent(eventId).catch(() => []);
        const consolidationData = await databaseService.getConsolidationAssignments(eventId).catch(() => []);
        
        setEventExpenses(expensesData);
        setEventParticipants(participantsData);
        setEventSplits(splitsData);
        setEventPayments(paymentsData);
        
        // Debug: Log settlements cargados de DB
        console.log('📊 Settlements cargados de DB:', settlementsData.map(s => ({
          from: s.fromParticipantName,
          to: s.toParticipantName,
          isPaid: s.isPaid,
          amount: s.amount,
          id: s.id
        })));
        
        setDbSettlements(settlementsData);
        
        // Cargar y aplicar consolidaciones si existen
        console.log('🔄 Consolidaciones cargadas desde BD:', consolidationData);
        if (consolidationData.length > 0) {
          setConsolidationAssignments(consolidationData);
          
          // Aplicar las consolidaciones a los settlements
          const consolidated = ConsolidationService.applyConsolidations(settlementsData, consolidationData);
          setConsolidatedSettlements(consolidated);
          
          console.log('✅ Consolidaciones aplicadas:', consolidated.length, 'settlements consolidados');
        } else {
          // No hay consolidaciones, limpiar estado
          setConsolidationAssignments([]);
          setConsolidatedSettlements([]);
        }
      } else {
        // If event not found, set empty arrays
        setEventExpenses([]);
        setEventParticipants([]);
        setEventSplits([]);
        setEventPayments([]);
        setDbSettlements([]);
        setConsolidationAssignments([]);
        setConsolidatedSettlements([]);
      }
    } catch (error) {
      console.error('Error in loadEventData:', error);
      setEvent(null);
      setEventExpenses([]);
      setEventParticipants([]);
      setEventSplits([]);
      setEventPayments([]);
      setDbSettlements([]);
      setConsolidationAssignments([]);
      setConsolidatedSettlements([]);
    } finally {
      setIsInitialLoading(false);
    }
  }, [eventId, getExpensesByEvent, getEventParticipants, getSplitsByEvent, getPaymentsByEvent]);

  // Sincronizar liquidaciones calculadas con la BD
  const syncSettlementsToDb = useCallback(async () => {
    if (!eventId || !event) {
      console.log('❌ Sync cancelled: missing eventId or event', { eventId, event: !!event });
      return;
    }
    if (isClosed) {
      console.log('❌ Sync cancelled: event is closed/archived');
      return;
    }

    try {
      console.log('💾 Starting settlement sync for event:', eventId);
      console.log('  📊 Calculated settlements:', settlements.length);
      
      // Obtener liquidaciones actuales de la BD para limpiar si es necesario
      const currentDbSettlements = await databaseService.getSettlementsByEvent(eventId);
      const unpaidSettlements = currentDbSettlements.filter((s: Settlement) => !s.isPaid);
      
      // Si no hay settlements calculados pero hay settlements no pagados en DB, limpiarlos
      if (settlements.length === 0 && unpaidSettlements.length > 0) {
        console.log('🧹 Cleaning obsolete unpaid settlements from DB:', unpaidSettlements.length);
        for (const settlement of unpaidSettlements) {
          await databaseService.deleteSettlement(settlement.id);
        }
        console.log('✅ Settlement cleanup completed');
        return;
      }
      
      if (settlements.length === 0) {
        console.log('✅ No settlements needed - balances are settled');
        return;
      }
      // Crear un mapa de las liquidaciones existentes por clave compuesta
      // Solo considerar settlements NO pagados para actualización, los pagados no deben modificarse
      const existingSettlementsMap = new Map(
        currentDbSettlements
          .filter((s: Settlement) => !s.isPaid) // Solo settlements no pagados son actualizables
          .map((s: Settlement) => [`${s.fromParticipantId}_${s.toParticipantId}`, s])
      );

      // Settlements pagados se mantienen sin cambios
      const paidSettlements = currentDbSettlements.filter((s: Settlement) => s.isPaid);
      console.log(`  ✅ Paid settlements (untouchable): ${paidSettlements.length}`);

      console.log('  💾 Existing settlements in DB:', currentDbSettlements.length);
      
      let created = 0, updated = 0, deleted = 0;
      
      // Procesar cada liquidación calculada
      for (const calculatedSettlement of settlements) {
        const key = `${calculatedSettlement.fromParticipantId}_${calculatedSettlement.toParticipantId}`;
        
        const existingSettlement = existingSettlementsMap.get(key);
        
        if (existingSettlement) {
          const amountDiff = Math.abs(existingSettlement.amount - calculatedSettlement.amount);
          
          // Actualizar monto si cambió (solo settlements no pagados)
          if (amountDiff > 0.01) {
            await databaseService.updateSettlement(existingSettlement.id, {
              amount: calculatedSettlement.amount,
              updatedAt: new Date().toISOString()
            });
            updated++;
          }
          existingSettlementsMap.delete(key); // Marcar como procesada
        } else {
          // Crear nueva liquidación
          const newSettlement = {
            id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            eventId,
            fromParticipantId: calculatedSettlement.fromParticipantId,
            fromParticipantName: calculatedSettlement.fromParticipantName,
            toParticipantId: calculatedSettlement.toParticipantId,
            toParticipantName: calculatedSettlement.toParticipantName,
            amount: calculatedSettlement.amount,
            isPaid: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await databaseService.createSettlement(newSettlement);
          created++;
        }
      }

      // Eliminar liquidaciones NO PAGADAS que ya no existen en los cálculos
      // NUNCA eliminar settlements pagados
      for (const [key, settlement] of existingSettlementsMap.entries()) {
        if (!settlement.isPaid) {
          await databaseService.deleteSettlement(settlement.id);
          deleted++;
          console.log(`  ➖ Deleted obsolete unpaid settlement: ${settlement.fromParticipantName} → ${settlement.toParticipantName} $${settlement.amount}`);
        }
      }
      
      console.log(`✅ Settlement sync completed - Created: ${created}, Updated: ${updated}, Deleted: ${deleted}`);

      // Solo recargar liquidaciones si realmente hubo cambios
      if (created > 0 || updated > 0 || deleted > 0) {
        const updatedSettlements = await databaseService.getSettlementsByEvent(eventId);
        setDbSettlements(updatedSettlements);
      }
    } catch (error) {
      console.error('Error syncing settlements:', error);
    }
  }, [eventId, event, settlements]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  // Refrescar datos al cambiar al tab de participantes o gastos (garantiza balances frescos)
  useEffect(() => {
    if (activeTab === 'participantes' || activeTab === 'gastos') {
      loadEventData();
    }
    // Al salir del tab participantes, resetear modo selección múltiple
    if (activeTab !== 'participantes') {
      setIsParticipantSelectMode(false);
      setSelectedParticipantIds(new Set());
      setParticipantSearchQuery('');
    }
    // Al salir del tab gastos, resetear modo selección múltiple
    if (activeTab !== 'gastos') {
      setIsExpenseSelectMode(false);
      setSelectedExpenseIds(new Set());
    }
  }, [activeTab]);

  // Sincronizar liquidaciones cuando cambien los cálculos
  // Usar referencia para evitar bucles infinitos
  const previousSettlementsRef = useRef<string>('');
  useEffect(() => {
    if (!eventId || !event || isClosed) return;
    
    // Crear una "huella" de las settlements calculadas para comparar cambios reales
    const settlementsSignature = JSON.stringify(
      settlements
        .sort((a, b) => `${a.fromParticipantId}_${a.toParticipantId}`.localeCompare(`${b.fromParticipantId}_${b.toParticipantId}`))
        .map(s => ({
          from: s.fromParticipantId,
          to: s.toParticipantId,
          amount: Math.round(s.amount * 100) // Redondear centavos para evitar diferencias mínimas
        }))
    );
    
    // Solo sincronizar si realmente cambió la estructura de settlements O si tenemos datos válidos
    // Y SOLO si el evento está en estado ACTIVO
    const shouldSync = settlementsSignature !== previousSettlementsRef.current && 
                      (eventExpenses.length > 0 && eventParticipants.length > 1) &&
                      event?.status === 'active' && !isLocked;
    
    // 🔍 DEBUG: Ver por qué la sincronización puede no ejecutarse
    console.log('🔍 Sync conditions check:', {
      signatureChanged: settlementsSignature !== previousSettlementsRef.current,
      previousSignature: previousSettlementsRef.current,
      currentSignature: settlementsSignature,
      hasExpenses: eventExpenses.length > 0,
      expenseCount: eventExpenses.length,
      hasMultipleParticipants: eventParticipants.length > 1,
      participantCount: eventParticipants.length,
      isActive: event?.status === 'active',
      eventStatus: event?.status,
      shouldSync,
      settlementsCalculated: settlements.length,
      dbSettlements: dbSettlements.length
    });
    
    // 🔍 DEBUG: Log detailed settlements info
    console.log('🔍 Current calculated settlements:', settlements.map(s => ({
      from: s.fromParticipantName,
      to: s.toParticipantName,
      amount: s.amount
    })));
    
    if (shouldSync) {
      console.log('🔄 Syncing settlements to DB after calculations change');
      console.log('  📊 Settlements to sync:', settlements.length);
      console.log('  🆔 Event ID:', eventId);
      console.log('  📝 Event status:', event?.status);
      previousSettlementsRef.current = settlementsSignature;
      
      const syncTimeout = setTimeout(() => {
        console.log('⏰ Executing delayed settlement sync...');
        syncSettlementsToDb();
      }, 300); // Delay reducido para mejor responsividad
      
      return () => clearTimeout(syncTimeout);
    } else {
      console.log('❌ Sync skipped due to conditions not met');
    }
  }, [eventId, event, settlements, eventExpenses, eventParticipants, syncSettlementsToDb]);

  // Efecto para auto-generar settlements cuando hay datos iniciales
  useEffect(() => {
    if (!eventId || !event || !isEditable) return;
    
    // Auto-generar settlements si hay participantes y gastos pero no hay settlements
    const hasParticipants = eventParticipants.length > 0;
    const hasExpenses = eventExpenses.length > 0;
    const hasCalculatedSettlements = settlements.length > 0;
    const hasDbSettlements = dbSettlements.length > 0;
    
    if (hasParticipants && hasExpenses && hasCalculatedSettlements && !hasDbSettlements) {
      console.log('🔄 Auto-generating settlements for loaded data');
      console.log('  👥 Participants:', eventParticipants.length);
      console.log('  💰 Expenses:', eventExpenses.length);
      console.log('  ⚖️ Calculated settlements:', settlements.length);
      
      // Delay para asegurar que todos los datos estén listos
      const autoSyncTimeout = setTimeout(() => {
        syncSettlementsToDb();
      }, 500);
      
      return () => clearTimeout(autoSyncTimeout);
    }
  }, [eventId, event, eventParticipants.length, eventExpenses.length, settlements.length, dbSettlements.length, syncSettlementsToDb]);

  // Efecto para detectar cambios pasivos en datos globales que afecten este evento
  const lastGlobalDataRef = useRef<string>('');
  useEffect(() => {
    if (!eventId) return;
    
    // Crear signature de datos globales para este evento
    const currentEventExpenses = expenses.filter(e => e.eventId === eventId);
    const currentEventParticipants = participants.filter(p => 
      p.eventIds && p.eventIds.includes(eventId)
    );
    
    const globalDataSignature = JSON.stringify({
      expenses: currentEventExpenses.length,
      participants: currentEventParticipants.length,
      expenseAmounts: currentEventExpenses.map(e => `${e.id}:${e.amount}:${e.payerId}`)
    });

    // Solo refrescar si realmente cambió la data global
    if (globalDataSignature !== lastGlobalDataRef.current && lastGlobalDataRef.current !== '') {
      console.log('🔄 Detectado cambio pasivo en datos del evento, refrescando...');
      lastGlobalDataRef.current = globalDataSignature;
      loadEventData();
    } else {
      lastGlobalDataRef.current = globalDataSignature;
    }
  }, [expenses, participants, eventId, loadEventData]);

  // Congela el orden de las liquidaciones en pantalla.
  // Recalcular consolidaciones en tiempo real cuando cambian los settlements calculados
  // (útil en eventos activos: cada nuevo gasto actualiza la vista consolidada sin esperar reload)
  useEffect(() => {
    if (consolidationAssignments.length > 0 && settlements.length > 0 && isEditable) {
      const recalculated = ConsolidationService.applyConsolidations(settlements, consolidationAssignments);
      setConsolidatedSettlements(recalculated);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settlements, consolidationAssignments]);

  // Congela el orden de las liquidaciones en pantalla.
  // Se recalcula SOLO cuando cambia la cantidad/composición (o la vista activa),
  // pero NO cuando cambia isPaid → el ítem no salta al marcarse como pagado.
  useEffect(() => {
    const base = (consolidationAssignments.length > 0 && !showOriginalView)
      ? consolidatedSettlements
      : dbSettlements.map(s => ({
          ...s,
          fromParticipantName: s.fromParticipantName || 'Unknown',
          toParticipantName:   s.toParticipantName   || 'Unknown',
        }));
    if (base.length === 0) return;
    const sorted = [...base].sort((a: any, b: any) => {
      const aIsPaid = a.isPaid || false;
      const bIsPaid = b.isPaid || false;
      if (aIsPaid !== bIsPaid) return aIsPaid ? 1 : -1;
      const d = (a.fromParticipantName || '').localeCompare(b.fromParticipantName || '');
      if (d !== 0) return d;
      const m = (b.amount || 0) - (a.amount || 0);
      if (m !== 0) return m;
      return (a.toParticipantName || '').localeCompare(b.toParticipantName || '');
    });
    setFrozenSettlementOrder(sorted.map((s: any) => s.id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbSettlements.length, consolidatedSettlements.length, showOriginalView, consolidationAssignments.length]);

  // Refrescar datos cuando regresamos a la pantalla (ej: después de crear/editar gastos)
  useFocusEffect(
    useCallback(() => {
      console.log('🎯 EventDetail enfocado, refrescando datos...');
      loadEventData();
    }, [loadEventData])
  );

  const handleAddExpense = () => {
    if (!isEditable) {
      showAlert({ type: 'warning', title: t('message.eventNotEditable'), message: t('message.canOnlyAddExpensesActive') });
      return;
    }
    (navigation as any).navigate('CreateExpense', { eventId });
  };

  const handleEditExpense = (expense: Expense) => {
    if (!isEditable) {
      showAlert({ type: 'warning', title: t('message.eventNotEditable'), message: t('message.canOnlyEditExpensesActive') });
      return;
    }
    (navigation as any).navigate('CreateExpense', { 
      eventId,
      expenseId: expense.id,
      isEditing: true 
    });
  };

  const handleDeleteExpense = (expense: Expense) => {
    if (!isEditable) {
      showAlert({ type: 'warning', title: t('message.eventNotEditable'), message: t('message.canOnlyDeleteExpensesActive') });
      return;
    }
    showAlert({ type: 'destructive', title: t('message.deleteExpenseTitle'), message: t('message.deleteExpenseMessage', { name: expense.description }), buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(expense.id);
              showAlert({ type: 'success', title: t('common.success'), message: t('message.expenseDeletedSuccess') });
            } catch (error) {
              showAlert({ type: 'error', title: t('common.error'), message: t('message.expenseDeletedError') });
            }
          },
        },
      ] });
  };

  const handleEditParticipant = (participant: Participant) => {
    if (!isEditable) {
      showAlert({ type: 'warning', title: t('message.eventNotEditable'), message: t('message.canOnlyEditParticipantsActive') });
      return;
    }
    if (participant.participantType === 'temporary') {
      setEditingParticipant(participant);
      setShowEditModal(true);
    } else if (participant.participantType === 'friend') {
      showAlert({ type: 'confirm', title: t('message.editFriendTitle'), message: `"${participant.name}" ${t('message.editFriendMessage')}`, buttons: [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('message.goToFriends'), onPress: () => (navigation as any).navigate('ManageFriends') }
        ] });
    }
  };

  const handleSaveEditedParticipant = async (name: string, email?: string, phone?: string, aliasCbu?: string, convertToFriend?: boolean) => {
    if (!editingParticipant || !name.trim()) {
      showAlert({ type: 'error', title: t('common.error'), message: t('message.nameRequired') });
      return;
    }

    // Verificar si hay un amigo existente con el mismo nombre al convertir
    if (convertToFriend) {
      const existingFriend = participants.find(
        p => p.participantType === 'friend' &&
          p.id !== editingParticipant.id &&
          p.name.trim().toLowerCase() === name.trim().toLowerCase()
      );

      if (existingFriend) {
        showAlert({ type: 'confirm', title: t('eventDetail.convertDuplicateTitle'), message: t('eventDetail.convertDuplicateMessage', { name: existingFriend.name }), buttons: [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('eventDetail.replaceWithExisting'),
              onPress: async () => {
                try {
                  await removeParticipantFromEvent(event!.id, editingParticipant.id);
                  await addExistingParticipantToEvent(event!.id, existingFriend);
                  await loadEventData();
                  setShowEditModal(false);
                  setEditingParticipant(null);
                  showAlert({ type: 'success', title: '✅', message: t('eventDetail.replacedSuccess', { name: existingFriend.name }) });
                } catch {
                  showAlert({ type: 'error', title: t('common.error'), message: t('message.participantUpdatedError') });
                }
              }
            }
          ] });
        return;
      }
    }

    try {
      const updates: any = {
        name: name.trim(),
        email: email?.trim() || undefined,
        phone: phone?.trim() || undefined,
        alias_cbu: aliasCbu?.trim() || undefined,
        updatedAt: new Date().toISOString()
      };

      // Si se debe convertir a amigo
      if (convertToFriend) {
        updates.participantType = 'friend';
      }

      await updateParticipant(editingParticipant.id, updates);

      await loadEventData();
      setShowEditModal(false);
      setEditingParticipant(null);
      
      if (convertToFriend) {
        showAlert({ type: 'success', title: `✅ ${t('message.convertedToFriend')}`, message: `${name} ${t('message.nowPermanentFriend')}` });
      } else {
        showAlert({ type: 'success', title: `✅ ${t('message.updated')}`, message: t('message.participantUpdatedSuccess') });
      }
    } catch (error) {
      showAlert({ type: 'error', title: t('common.error'), message: t('message.participantUpdatedError') });
    }
  };

  const handleRemoveParticipant = (participant: any) => {
    if (!isEditable) {
      showAlert({ type: 'warning', title: t('message.eventNotEditable'), message: t('message.canOnlyDeleteParticipantsActive') });
      return;
    }
    showAlert({ type: 'destructive', title: t('message.removeParticipantTitle'), message: t('message.removeParticipantMessage', { name: participant.name }), buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await removeParticipantFromEvent(event?.id || '', participant.id);
              await loadEventData();
              showAlert({ type: 'success', title: t('common.success'), message: t('message.participantDeletedSuccess') });
            } catch (error: any) {
              console.error('Error removing participant:', error);
              showAlert({ type: 'error', title: t('common.error'), message: error.message || t('message.participantDeletedError') });
            }
          },
        },
      ] });
  };

  const handleRemoveSelectedParticipants = () => {
    if (selectedParticipantIds.size === 0) return;
    const count = selectedParticipantIds.size;
    showAlert({ type: 'destructive', title: t('message.removeParticipantTitle'), message: t('participants.confirmDeleteSelected', { count, plural: count !== 1 ? 's' : '' }), buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            showAlert({ type: 'warning', isLoading: true, title: t('common.processing') });
            try {
              for (const participantId of selectedParticipantIds) {
                await removeParticipantFromEvent(event?.id || '', participantId);
              }
              await loadEventData();
              setIsParticipantSelectMode(false);
              setSelectedParticipantIds(new Set());
              setParticipantSearchQuery('');
              dismissAlert();
              showAlert({ type: 'success', title: t('common.success'), message: t('participants.deletedSelected', { count, plural: count !== 1 ? 's' : '' }) });
            } catch (error: any) {
              console.error('Error removing participants:', error);
              dismissAlert();
              showAlert({ type: 'error', title: t('common.error'), message: error.message || t('message.participantDeletedError') });
            }
          },
        },
      ] });
  };

  const handleAddSecondaryParticipant = async (primaryParticipant: Participant, name: string) => {
    if (!eventId) return;
    try {
      await addSecondaryParticipant(eventId, primaryParticipant.id, name);
      await loadEventData();
    } catch (error: any) {
      showAlert({ type: 'error', title: t('common.error'), message: error.message || t('message.participantDeletedError') });
    }
  };

  const handleSaveSecondaryName = async (secondary: Participant) => {
    const newName = editingSecondaryName.trim();
    if (!newName || newName === secondary.name) {
      setEditingSecondaryId(null);
      return;
    }
    try {
      await updateParticipant(secondary.id, { name: newName });
      await loadEventData();
    } catch (error: any) {
      showAlert({ type: 'error', title: t('common.error'), message: error.message || t('message.participantDeletedError') });
    } finally {
      setEditingSecondaryId(null);
    }
  };

  const handleRemoveSecondaryParticipant = (secondary: Participant) => {
    showAlert({ type: 'destructive', title: t('participants.removeSecondary'), message: t('participants.confirmRemoveSecondary', { name: secondary.name }), buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await removeSecondaryParticipant(eventId, secondary.id);
              await loadEventData();
            } catch (error: any) {
              showAlert({ type: 'error', title: t('common.error'), message: error.message || t('message.participantDeletedError') });
            }
          }
        }
      ] });
  };

  const handleRemoveSelectedExpenses = () => {
    const count = selectedExpenseIds.size;
    showAlert({ type: 'destructive', title: t('message.deleteExpenseTitle'), message: t('expenses.confirmDeleteSelected', { count, plural: count !== 1 ? 's' : '' }), buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            showAlert({ type: 'warning', isLoading: true, title: t('common.processing') });
            try {
              for (const expenseId of selectedExpenseIds) {
                await deleteExpense(expenseId);
              }
              await loadEventData();
              setIsExpenseSelectMode(false);
              setSelectedExpenseIds(new Set());
              setSearchQuery('');
              dismissAlert();
              showAlert({ type: 'success', title: t('common.success'), message: t('expenses.deletedSelected', { count, plural: count !== 1 ? 's' : '' }) });
            } catch (error: any) {
              console.error('Error removing expenses:', error);
              dismissAlert();
              showAlert({ type: 'error', title: t('common.error'), message: error.message || t('message.expenseDeletedError') });
            }
          },
        },
      ] });
  };

  // Settlement handlers - SIMPLIFICADO
  const handleToggleSettlementPaid = async (settlementId: string, isPaid: boolean, skipConfirmation = false) => {
    // Solo permitir marcar pagos si el evento no está cerrado (tanto activo como bloqueado)
    if (isClosed) {
      showAlert({ type: 'error', title: t('message.actionNotAllowed'), message: t('message.onlyMarkPaymentsCompleted') });
      return;
    }

    try {
      console.log(`💰 ${isPaid ? 'Marcando' : 'Desmarcando'} settlement como pagado:`, settlementId);
      console.log('🔍 SettlementId type check:', {
        id: settlementId,
        startsWithCalc: settlementId.startsWith('calc_'),
        startsWithConsolidated: settlementId.startsWith('consolidated_'),
        isConsolidation: settlementId.startsWith('calc_') || settlementId.startsWith('consolidated_')
      });

      // CASO ESPECIAL: Consolidaciones (ID calculado o consolidado)
      if (settlementId.startsWith('calc_') || settlementId.startsWith('consolidated_')) {
      // CASO ESPECIAL: Consolidaciones (ID calculado o consolidado)
      if (settlementId.startsWith('calc_') || settlementId.startsWith('consolidated_')) {
        console.log('🔀 Procesando pago de consolidación:', settlementId);
        
        // Encontrar la consolidación en la lista de displaySettlements
        const displaySettlements = getDisplaySettlements();
        const consolidationSettlement = displaySettlements.find(s => s.id === settlementId);
        
        if (!consolidationSettlement) {
          showAlert({ type: 'error', title: t('common.error'), message: t('message.consolidationNotFound') });
          return;
        }
        
        console.log('🔍 Consolidation settlement encontrada:', {
          id: consolidationSettlement.id,
          from: consolidationSettlement.fromParticipantName,
          to: consolidationSettlement.toParticipantName,
          amount: consolidationSettlement.amount,
          hasOriginalSettlements: consolidationSettlement.originalSettlements?.length || 0
        });
        
        // Verificar si tiene originalSettlements
        if (consolidationSettlement.originalSettlements && consolidationSettlement.originalSettlements.length > 0) {
          console.log(`🎯 Usando originalSettlements: ${consolidationSettlement.originalSettlements.length} settlements`);
          
          // Usar los settlements originales de la consolidación
          for (const originalSettlement of consolidationSettlement.originalSettlements) {
            // Buscar el settlement correspondiente en dbSettlements
            const dbSettlement = dbSettlements.find(db => 
              db.fromParticipantId === originalSettlement.fromParticipantId && 
              db.toParticipantId === originalSettlement.toParticipantId &&
              Math.abs(db.amount - originalSettlement.amount) < 0.01 // Comparación de números flotantes
            );
            
            if (dbSettlement) {
              console.log(`✅ Actualizando settlement original: ${dbSettlement.fromParticipantName} → ${dbSettlement.toParticipantName} ${dbSettlement.amount}`);
              await databaseService.updateSettlement(dbSettlement.id, {
                isPaid,
                paidAt: isPaid ? new Date().toISOString() : null
              });
            } else {
              console.warn(`⚠️ No se encontró en DB el settlement original: ${originalSettlement.fromParticipantName} → ${originalSettlement.toParticipantName} ${originalSettlement.amount}`);
            }
          }
        } else {
          console.log('🔍 No originalSettlements, buscando por participantes...');
          // Fallback: buscar por participantes (método anterior)
          const matchingDbSettlements = dbSettlements.filter(db => 
            db.fromParticipantId === consolidationSettlement.fromParticipantId && 
            db.toParticipantId === consolidationSettlement.toParticipantId
          );
          
          if (matchingDbSettlements.length === 0) {
            showAlert({ type: 'error', title: t('common.error'), message: t('message.consolidationOriginalNotFound') });
            return;
          }
          
          console.log(`🎯 Actualizando ${matchingDbSettlements.length} settlements originales para consolidación (fallback)`);
          
          // Actualizar todos los settlements originales que representa esta consolidación
          for (const dbSettlement of matchingDbSettlements) {
            await databaseService.updateSettlement(dbSettlement.id, {
              isPaid,
              paidAt: isPaid ? new Date().toISOString() : null
            });
          }
        }
        }
        
        await loadEventData();
        return;
      }

      // CASO NORMAL: Settlement regular con ID de DB válido
      // Si se desmarca un pago, mostrar advertencia (salvo que se omita la confirmación para bulk undo)
      if (!isPaid && !skipConfirmation) {
        showAlert({ type: 'confirm', title: t('message.unmarkPaymentTitle'), message: t('message.unmarkPaymentMessage'), buttons: [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('message.continue'),
              onPress: async () => {
                await databaseService.updateSettlement(settlementId, {
                  isPaid: false,
                  paidAt: null
                });
                await loadEventData();
              }
            }
          ] });
        return;
      }

      // Actualizar liquidación directamente
      await databaseService.updateSettlement(settlementId, {
        isPaid,
        paidAt: isPaid ? new Date().toISOString() : null
      });
      
      await loadEventData();
    } catch (error) {
      console.error('Error toggling settlement paid:', error);
      showAlert({ type: 'error', title: t('common.error'), message: t('message.paymentStateError') });
    }
  };

  const handleUpdateSettlementReceipt = async (settlementId: string, imageUri: string | null) => {
    // Solo permitir agregar comprobantes si el evento no está cerrado
    if (isClosed) {
      showAlert({ type: 'error', title: t('message.actionNotAllowed'), message: t('message.onlyReceiptsCompleted') });
      return;
    }

    try {
      await databaseService.updateSettlement(settlementId, {
        receiptImage: imageUri
      });
      await loadEventData();
      showAlert({ type: 'success', title: '✅', message: imageUri ? t('message.receiptAdded') : t('message.receiptRemoved') });
    } catch (error) {
      console.error('Error updating settlement receipt:', error);
      showAlert({ type: 'error', title: t('common.error'), message: t('message.receiptError') });
    }
  };

  const handleToggleLock = useCallback(async () => {
    if (!event) return;

    const willLock = !isLocked;
    if (willLock) {
      showAlert({ type: 'warning', title: `🔒 ${t('message.lockEvent')}`, message: t('message.lockEventDesc'), buttons: [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('events.lock'),
            onPress: async () => {
              try {
                await syncSettlementsToDb();
                await updateEvent(eventId, { isLocked: true });
                await loadEventData();
                showAlert({ type: 'success', title: `🔒 ${t('message.eventLocked')}`, message: t('message.eventLockedDesc') });
              } catch (error) {
                console.error('Error locking event:', error);
                showAlert({ type: 'error', title: t('common.error'), message: t('message.eventStateChangeError') });
              }
            }
          }
        ] });
    } else {
      showAlert({ type: 'confirm', title: `🔓 ${t('message.unlockEvent')}`, message: t('message.unlockEventDesc'), buttons: [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('events.unlock'),
            onPress: async () => {
              try {
                await updateEvent(eventId, { isLocked: false });
                await loadEventData();
                showAlert({ type: 'success', title: `🔓 ${t('message.eventUnlocked')}`, message: t('message.eventUnlockedDesc') });
              } catch (error) {
                console.error('Error unlocking event:', error);
                showAlert({ type: 'error', title: t('common.error'), message: t('message.eventStateChangeError') });
              }
            }
          }
        ] });
    }
  }, [event, isLocked, eventId, t, updateEvent, loadEventData, syncSettlementsToDb]);

  const handleReactivateEvent = useCallback(async () => {
    if (!event) return;

    showAlert({ type: 'warning', title: `⚠️ ${t('message.reactivateEvent')}`, message: t('message.reactivateWarningMessage'), buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('events.reactivate'),
          onPress: async () => {
            try {
              await databaseService.resetSettlementsPayments(eventId);
              await updateEvent(eventId, { status: 'active', isLocked: false });
              await databaseService.updateSettlementsEventStatus(eventId, 'active');
              await loadEventData();
              showAlert({ type: 'success', title: `✅ ${t('message.eventReactivated')}`, message: t('message.reactivatedClearedPayments') });
            } catch (error) {
              console.error('Error reactivating event:', error);
              showAlert({ type: 'error', title: t('common.error'), message: t('message.eventStateChangeError') });
            }
          }
        }
      ] });
  }, [event, eventId, t, updateEvent, loadEventData]);

  const handleCloseEvent = useCallback(async () => {
    if (!event) return;

    const pendingCount = dbSettlements.filter((s: any) => !s.isPaid).length;

    if (pendingCount > 0) {
      // Hay liquidaciones pendientes: pedir comentario antes de cerrar
      setCloseComment(event.closingComment || '');
      setShowCloseWithPendingModal(true);
    } else {
      // Sin pendientes: flujo normal
      showAlert({ type: 'confirm', title: `📁 ${t('message.archiveEvent')}`, message: t('message.archiveEventDesc'), buttons: [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('events.close'),
            onPress: async () => {
              try {
                await updateEvent(eventId, { status: 'archived', isLocked: false });
                await databaseService.updateSettlementsEventStatus(eventId, 'archived');
                showAlert({ type: 'success', title: `✅ ${t('message.eventArchived')}`, message: t('message.eventArchivedDesc'), buttons: [{ text: 'OK', onPress: () => navigation.goBack() }] });
              } catch (error) {
                console.error('Error closing event:', error);
                showAlert({ type: 'error', title: t('common.error'), message: t('message.eventArchivedError') });
              }
            }
          }
        ] });
    }
  }, [event, eventId, dbSettlements, updateEvent, navigation, t]);

  const confirmCloseWithPending = async () => {
    try {
      await updateEvent(eventId, {
        status: 'archived',
        isLocked: false,
        closingComment: closeComment.trim() || undefined
      });
      await databaseService.updateSettlementsEventStatus(eventId, 'archived');
      setShowCloseWithPendingModal(false);
      showAlert({
        type: 'success',
        title: `✅ ${t('message.eventArchived')}`,
        message: t('message.eventArchivedDesc'),
        buttons: [{ text: 'OK', onPress: () => navigation.goBack() }]
      });
    } catch (error) {
      console.error('Error closing event with pending:', error);
      showAlert({ type: 'error', title: t('common.error'), message: t('message.eventArchivedError') });
    }
  };

  const handleShareSummary = () => {
    if (!event) return;

    const totalAmount = calculateTotalExpenses();
    const primaryParticipants = eventParticipants.filter((p: any) => !p.parentParticipantId);
    const participantCount = primaryParticipants.length;
    
    // Usar los settlements que se están mostrando actualmente (originales o consolidados)
    const currentSettlements = getDisplaySettlements();
    
    let message = `📊 *${t('eventDetail.shareSummaryLabel')} - ${event.name}*\n`;
    message += `━━━━━━━\n`;
    
    // Agregar advertencia si el evento está editable (activo+no bloqueado)
    if (isEditable) {
      message += `${t('eventDetail.shareWarning')}\n`;
      message += `━━━━━━━\n`;
    }
    
    message += `💰 *Total gastado:* ${event.currency} $${totalAmount.toFixed(2)}\n`;
    message += `👥 *${t('eventDetail.shareParticipantsLabel')}:* ${participantCount}\n`;
    message += `━━━━━━━\n`;

    // Representados: antes de las liquidaciones, formato resumido (nombre => cantidad)
    const secondaries = eventParticipants.filter((p: any) => p.parentParticipantId);
    if (secondaries.length > 0) {
      message += `👨‍👦 *Representados*\n`;
      primaryParticipants.forEach(primary => {
        const mySecondaries = secondaries.filter((s: any) => s.parentParticipantId === primary.id);
        if (mySecondaries.length > 0) {
          message += `  _${primary.name}_ => ${mySecondaries.length}\n`;
        }
      });
      message += `━━━━━━━\n`;
    }

    // Mostrar información de consolidación antes de las liquidaciones
    if (consolidationAssignments.length > 0 && !showOriginalView) {
      message += `👤 *${t('eventDetail.shareAssignments')}*\n`;
      consolidationAssignments.forEach(assignment => {
        message += `• ${assignment.payerName} ${t('eventDetail.sharePaysWith')} ${assignment.debtorName}\n`;
      });
      message += `━━━━━━━\n`;
    }

    message += `💸 ${t('eventDetail.shareSettlementsLabel')}\n\n`;
    if (currentSettlements.length > 0) {
      // Agrupar liquidaciones por destinatario (quien recibe el dinero)
      const settlementsByRecipient = currentSettlements.reduce((acc, settlement) => {
        const toParticipantName = settlement.toParticipantName;
        if (!acc[toParticipantName]) {
          acc[toParticipantName] = [];
        }
        acc[toParticipantName].push(settlement);
        return acc;
      }, {} as Record<string, Settlement[]>);

      // Generar mensaje agrupado por destinatario
      const recipientEntries = Object.entries(settlementsByRecipient);
      recipientEntries.forEach(([recipientName, settlementsForRecipient], index) => {
        const recipient = eventParticipants.find(p => p.name === recipientName);
        const cbuAlias = recipient?.alias_cbu || t('eventDetail.shareNoCbu');
        
        message += `_${recipientName}_\n`;
        message += `💳 Alias => *${cbuAlias}*\n`;
        (settlementsForRecipient as Settlement[]).forEach((settlement: Settlement) => {
          const paymentStatus = settlement.isPaid ? ' ✅' : ' ⏳';
          const receiptIcon = settlement.receiptImage ? ' 📎' : '';
          message += `  • ${settlement.fromParticipantName}: $${formatCurrency(settlement.amount)}${paymentStatus}${receiptIcon}\n`;
        });
        if (index < recipientEntries.length - 1) {
          message += `\n`;
        }
      });
      message += `━━━━━━━\n`;
    } else {
      message += `${t('eventDetail.shareSettled')}\n`;
      message += `━━━━━━━\n`;
    }

    message += `\n*Realizado con SplitSmart.*\n_Descarga tu app_`;

    // Enviar directamente a WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = Platform.OS === 'web'
      ? `https://web.whatsapp.com/send?text=${encodedMessage}`
      : `whatsapp://send?text=${encodedMessage}`;

    if (Platform.OS === 'web') {
      Linking.openURL(whatsappUrl);
      return;
    }

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          // Si WhatsApp no está disponible, copiar al portapapeles como fallback
          Clipboard.setString(message);
          showAlert({ type: 'warning', title: t('message.whatsappNotAvailable'), message: `${t('summary.title')} ${t('message.copiedToClipboard')}`, buttons: [{ text: t('ok') }] });
        }
      })
      .catch((err) => {
        console.error('Error opening WhatsApp:', err);
        // Si hay error, copiar al portapapeles como fallback
        Clipboard.setString(message);
        showAlert({ type: 'warning', title: t('message.whatsappError'), message: `${t('summary.title')} ${t('message.copiedToClipboard')}`, buttons: [{ text: t('ok') }] });
      });
  };

  const handleShareEvent = () => {
    if (!event) return;

    const totalAmount = calculateTotalExpenses();
    
    // Usar los settlements que se están mostrando actualmente (originales o consolidados)
    const currentSettlements = getDisplaySettlements();
    
    let message = `🎉 ${t('eventDetail.shareSummaryLabel')} - ${event.name.toUpperCase()}\n`;
    message += `━━━━━━━\n`;
    
    // Agregar advertencia si el evento está editable
    if (isEditable) {
      message += `${t('eventDetail.shareWarning')}\n`;
      message += `━━━━━━━\n`;
    }
    
    message += `📅 ${new Date(event.startDate).toLocaleDateString('es-AR')}\n`;
    message += `💵 $${formatCurrency(totalAmount)} ${event.currency}\n`;
    message += `📊 ${t('eventDetail.shareStatusLabel')} ${isClosed ? t('events.archived') : isLocked ? t('events.locked') : t('events.active')}\n`;
    message += `━━━━━━━\n`;
    const primaryParticipantsFull = eventParticipants.filter((p: any) => !p.parentParticipantId);
    message += `👥 ${t('eventDetail.shareParticipantsLabel')} (${primaryParticipantsFull.length}):\n`;
    primaryParticipantsFull.forEach((p) => {
      message += `* ${p.name}\n`;
    });
    message += `━━━━━━━\n`;

    // Representados: después de participantes, formato lista con viñetas
    const secondariesFull = eventParticipants.filter((p: any) => p.parentParticipantId);
    if (secondariesFull.length > 0) {
      message += `👨‍👦 *Representados*\n`;
      primaryParticipantsFull.forEach(primary => {
        const mySecondariesFull = secondariesFull.filter((s: any) => s.parentParticipantId === primary.id);
        if (mySecondariesFull.length > 0) {
          message += `  _${primary.name}_:\n`;
          mySecondariesFull.forEach((s: any) => {
            message += `    * ${s.name}\n`;
          });
        }
      });
      message += `━━━━━━━\n`;
    }

    // Mostrar información de consolidación antes de las liquidaciones
    if (consolidationAssignments.length > 0 && !showOriginalView) {
      message += `👤 ${t('eventDetail.shareAssignments')}\n`;
      consolidationAssignments.forEach(assignment => {
        message += `• ${assignment.payerName} ${t('eventDetail.sharePaysWith')} ${assignment.debtorName}\n`;
      });
      message += `━━━━━━━\n`;
    }

    message += `💸 ${t('eventDetail.shareSettlementLabel')}\n\n`;
    
    if (currentSettlements.length > 0) {
      // Agrupar liquidaciones por destinatario (quien recibe el dinero)
      const settlementsByRecipient = currentSettlements.reduce((acc, settlement) => {
        const toParticipantName = settlement.toParticipantName;
        if (!acc[toParticipantName]) {
          acc[toParticipantName] = [];
        }
        acc[toParticipantName].push(settlement);
        return acc;
      }, {} as Record<string, Settlement[]>);

      // Generar mensaje agrupado por destinatario
      const recipientEntries2 = Object.entries(settlementsByRecipient);
      recipientEntries2.forEach(([recipientName, settlementsForRecipient], index) => {
        const recipient = eventParticipants.find(p => p.name === recipientName);
        const cbuAlias = recipient?.alias_cbu || t('eventDetail.shareNoCbu');
        
        message += `_${recipientName}_\n`;
        message += `💳 Alias => *${cbuAlias}*\n`;
        (settlementsForRecipient as Settlement[]).forEach((settlement: Settlement) => {
          const paymentStatus = settlement.isPaid ? ' ✅' : ' ⏳';
          const receiptIcon = settlement.receiptImage ? ' 📎' : '';
          message += `  • ${settlement.fromParticipantName}: $${formatCurrency(settlement.amount)}${paymentStatus}${receiptIcon}\n`;
        });
        if (index < recipientEntries2.length - 1) {
          message += `\n`;
        }
      });
      message += `━━━━━━━\n`;
    } else {
      message += `${t('eventDetail.shareSettled')}\n`;
      message += `━━━━━━━\n`;
    }

    message += `📝 ${t('eventDetail.shareExpensesLabel')} (${eventExpenses.length}):\n\n`;
    
    if (eventExpenses.length > 0) {
      // Agrupar gastos por pagador
      const expensesByPayer = eventExpenses.reduce((acc, expense) => {
        const payerId = expense.payerId;
        if (!acc[payerId]) {
          acc[payerId] = [];
        }
        acc[payerId].push(expense);
        return acc;
      }, {} as Record<string, typeof eventExpenses>);

      // Generar mensaje agrupado por pagador
      Object.entries(expensesByPayer).forEach(([payerId, expenses]) => {
        const payer = eventParticipants.find(p => p.id === payerId);
        message += `${payer?.name}\n`;
        
        expenses.forEach((expense) => {
          // Buscar splits para verificar exclusiones
          const expenseSplits = eventSplits.filter(split => split.expenseId === expense.id);
          const includedParticipantIds = expenseSplits.map(split => split.participantId);
          const excludedParticipants = eventParticipants.filter(p => !includedParticipantIds.includes(p.id));
          
          let expenseLine = `* ${expense.description}: $${formatCurrency(expense.amount)}`;
          
          // Agregar exclusiones si existen
          if (excludedParticipants.length > 0 && excludedParticipants.length < eventParticipants.length) {
            const excludedNames = excludedParticipants.map(p => p.name).join(' - ');
            expenseLine += ` | ${t('eventDetail.shareException')} ${excludedNames}`;
          }
          
          // Agregar icono de comprobante si existe
          if (expense.receiptImage) {
            expenseLine += ' 📎';
          }
          
          message += `${expenseLine}\n`;
        });
        message += `\n`;
      });
      
      message += `💵 ${t('eventDetail.shareTotal')} $${formatCurrency(totalAmount)}\n`;
      message += `━━━━━━━\n`;
    } else {
      message += `${t('eventDetail.shareNoExpenses')}\n`;
    }

    message += `\n*Realizado con SplitSmart.*\n_Descarga tu app_`;

    // Enviar directamente a WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = Platform.OS === 'web'
      ? `https://web.whatsapp.com/send?text=${encodedMessage}`
      : `whatsapp://send?text=${encodedMessage}`;

    if (Platform.OS === 'web') {
      Linking.openURL(whatsappUrl);
      return;
    }

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          // Si WhatsApp no está disponible, copiar al portapapeles como fallback
          Clipboard.setString(message);
          showAlert({ type: 'warning', title: t('message.whatsappNotAvailable'), message: `${t('events.title')} ${t('message.copiedToClipboard')}`, buttons: [{ text: t('ok') }] });
        }
      })
      .catch((err) => {
        console.error('Error opening WhatsApp:', err);
        // Si hay error, copiar al portapapeles como fallback
        Clipboard.setString(message);
        showAlert({ type: 'warning', title: t('message.whatsappError'), message: `${t('events.title')} ${t('message.copiedToClipboard')}`, buttons: [{ text: t('ok') }] });
      });
  };

  // =====================================================
  // FUNCIONES DE CONSOLIDACIÓN
  // =====================================================

  const handleConsolidationChange = async (assignments: any[]) => {
    console.log('🔄 Nueva configuración de consolidación:', assignments);
    
    try {
      // Guardar asignaciones en la base de datos
      await databaseService.saveConsolidationAssignments(eventId, assignments);
      
      // Actualizar estado local
      setConsolidationAssignments(assignments);
      
      // Aplicar consolidaciones usando el servicio - usar dbSettlements que tienen todas las propiedades
      const settlementsToConsolidate = dbSettlements.length > 0 ? dbSettlements : settlements.map(s => ({
        ...s,
        id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        eventId: eventId || '',
        isPaid: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      const consolidated = ConsolidationService.applyConsolidations(settlementsToConsolidate, assignments);
      setConsolidatedSettlements(consolidated);
      
      // Contar cuántos pagos fueron condonados (para mostrar al usuario)
      const totalOriginalDebts = settlements.length;
      const totalConsolidatedPayments = consolidated.length;
      const forgivenPayments = totalOriginalDebts - totalConsolidatedPayments;
      
      if (forgivenPayments > 0) {
        const totalOriginal = settlements.reduce((sum, s) => sum + s.amount, 0);
        const totalConsolidated = consolidated.reduce((sum, s) => sum + s.amount, 0);
        const forgivenAmount = totalOriginal - totalConsolidated;
        
        showAlert({ type: 'success', title: t('eventDetail.consolidationForgivenTitle'), message: t('eventDetail.consolidationForgivenMsg', {
            original: settlements.length,
            consolidated: consolidated.length,
            forgiven: forgivenPayments,
            totalOriginal: totalOriginal.toLocaleString(),
            totalFinal: totalConsolidated.toLocaleString(),
            forgivenAmount: forgivenAmount.toLocaleString()
          }), buttons: [{ text: t('eventDetail.consolidationOk') }] });
      } else {
        showAlert({ type: 'success', title: t('eventDetail.consolidationAppliedTitle'), message: t('eventDetail.consolidationAppliedMsg', {
            assignments: assignments.length,
            results: consolidated.length
          }), buttons: [{ text: t('eventDetail.consolidationOk') }] });
      }
      
      console.log('✅ Consolidación guardada exitosamente en la base de datos');
    } catch (error) {
      console.error('❌ Error guardando consolidación:', error);
      showAlert({ type: 'error', title: t('common.error'), message: t('eventDetail.consolidationError'), buttons: [{ text: t('ok') }] });
    }
    
    // Cerrar modal
    setShowConsolidationModal(false);
  };

  const getDisplaySettlements = () => {
    let baseSettlements;
    if (consolidationAssignments.length > 0 && !showOriginalView) {
      baseSettlements = consolidatedSettlements;
    } else {
      baseSettlements = settlements;
    }

    console.log('🔍 getDisplaySettlements debug:', {
      baseSettlements: baseSettlements.length,
      dbSettlements: dbSettlements.length,
      showingConsolidated: consolidationAssignments.length > 0 && !showOriginalView,
      eventStatus: event?.status,
      hasConsolidations: consolidationAssignments.length > 0
    });

    // Si el evento está completado Y NO hay consolidaciones, mostrar todos los settlements de la DB
    if (event?.status === 'completed' && consolidationAssignments.length === 0) {
      console.log('🏁 Evento completado sin consolidaciones - mostrando todos los settlements de DB');
      return dbSettlements.map(dbSettlement => ({
        ...dbSettlement,
        fromParticipantName: dbSettlement.fromParticipantName || 'Unknown',
        toParticipantName: dbSettlement.toParticipantName || 'Unknown'
      }));
    }

    // Si el evento está completado Y HAY consolidaciones, mostrar según la vista activa
    if (event?.status === 'completed' && consolidationAssignments.length > 0) {
      if (showOriginalView) {
        // Vista original: mostrar todos los settlements originales de DB
        console.log('🏁 Evento completado con consolidaciones - mostrando vista original de DB');
        return dbSettlements.map(dbSettlement => ({
          ...dbSettlement,
          fromParticipantName: dbSettlement.fromParticipantName || 'Unknown',
          toParticipantName: dbSettlement.toParticipantName || 'Unknown'
        }));
      } else {
        // Vista consolidada: usar baseSettlements (consolidadas) con estado de pago de DB
        console.log('🏁 Evento completado con consolidaciones - mostrando vista consolidada');
      }
    }

    // Para todos los demás casos (evento activo o completado con consolidaciones en vista consolidada)
    const result = baseSettlements.map(settlement => {
      // Para consolidaciones, verificar el estado de pago basado en originalSettlements
      if (settlement.isConsolidated && settlement.originalSettlements) {
        console.log(`🔀 Procesando consolidación: ${settlement.fromParticipantName} → ${settlement.toParticipantName}`);
        
        // Verificar si TODOS los settlements originales están pagados
        let allOriginalsPaid = true;
        let anyOriginalPaid = false;
        
        for (const originalSettlement of settlement.originalSettlements) {
          const dbSettlement = dbSettlements.find(db => 
            db.fromParticipantId === originalSettlement.fromParticipantId && 
            db.toParticipantId === originalSettlement.toParticipantId &&
            Math.abs(db.amount - originalSettlement.amount) < 0.01
          );
          
          if (dbSettlement) {
            if (dbSettlement.isPaid) {
              anyOriginalPaid = true;
            } else {
              allOriginalsPaid = false;
            }
          } else {
            allOriginalsPaid = false;
          }
        }
        
        console.log(`💾 Consolidación ${settlement.fromParticipantName} → ${settlement.toParticipantName}: allPaid=${allOriginalsPaid}, anyPaid=${anyOriginalPaid}`);
        
        return {
          ...settlement,
          isPaid: allOriginalsPaid, // Solo marcada como pagada si TODOS los originales están pagados
          id: settlement.id // Usar el ID original de la consolidación (consolidated_xxx)
        };
      }
      
      // Para settlements normales, buscar en DB
      const dbSettlement = dbSettlements.find(db => 
        db.fromParticipantId === settlement.fromParticipantId && 
        db.toParticipantId === settlement.toParticipantId
      );
      
      // Si existe en DB, usar la información de pago de DB pero mantener datos del settlement
      if (dbSettlement) {
        console.log(`💾 Settlement encontrado en DB: ${settlement.fromParticipantName} → ${settlement.toParticipantName}, isPaid: ${dbSettlement.isPaid}`);
        return {
          ...settlement,
          isPaid: dbSettlement.isPaid,
          receiptImage: dbSettlement.receiptImage,
          paidAt: dbSettlement.paidAt,
          id: dbSettlement.id
        };
      }
      
      // Si no existe en DB, es un settlement sin estado de pago
      console.log(`⚠️ Settlement NO encontrado en DB: ${settlement.fromParticipantName} → ${settlement.toParticipantName}`);
      return {
        ...settlement,
        isPaid: false,
        id: settlement.id || `calc_${settlement.fromParticipantId}_${settlement.toParticipantId}`
      };
    });

    console.log('🔍 getDisplaySettlements resultado:', result.map(s => `${s.fromParticipantName} → ${s.toParticipantName}: isPaid=${s.isPaid}, id=${s.id}`));
    
    return result;
  };

  const handleToggleView = () => {
    setShowOriginalView(!showOriginalView);
  };

  const handleClearConsolidations = () => {
    showAlert({ type: 'destructive', title: t('message.clearConsolidationsTitle'), message: t('message.clearConsolidationsMessage'), buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('message.clear'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Limpiar de la base de datos
              await databaseService.clearConsolidationAssignments(eventId);
              
              // Limpiar estado local
              setConsolidationAssignments([]);
              setConsolidatedSettlements([]);
              setShowOriginalView(false);
              
              showAlert({ type: 'success', title: t('message.consolidationsClearedTitle'), message: t('message.consolidationsClearedMessage') });
              
              console.log('✅ Consolidaciones eliminadas de la base de datos');
            } catch (error) {
              console.error('❌ Error limpiando consolidaciones:', error);
              showAlert({ type: 'error', title: t('common.error'), message: t('message.consolidationsClearError') });
            }
          }
        }
      ] });
  };

  // =====================================================

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAddExpenseOld = () => {
    // Deprecated: usar handleAddExpense() en su lugar
  };

  const handleAddParticipant = async (input: Participant | Participant[]) => {
    const list = Array.isArray(input) ? input : [input];
    if (list.length > 1) showAlert({ type: 'warning', isLoading: true, title: t('common.processing') });

    try {
      for (const participant of list) {
        const existingParticipant = participants.find(p => p.id === participant.id);
        if (existingParticipant || participant.participantType === 'friend') {
          await addExistingParticipantToEvent(eventId, participant);
        } else {
          await addParticipantToEvent(eventId, participant);
        }
      }

      await loadEventData();

      if (list.length === 1) {
        showAlert({ type: 'success', title: `✅ ${t('message.participantAdded')}`, message: `${list[0].name} ${t('message.participantAddedDesc')}` });
      } else {
        dismissAlert();
        showAlert({ type: 'success', title: `✅ ${t('message.participantAdded')}`, message: t('addParticipant.alert.participantsAddedMessage', {
            count: list.length,
            plural: list.length !== 1 ? 's' : ''
          }) });
      }
    } catch (error: any) {
      console.error('Error adding participant(s):', error);
      if (list.length > 1) dismissAlert();
      showAlert({ type: 'error', title: t('error'), message: error.message || t('message.participantAddedError') });
    }
  };

  const calculateTotalExpenses = () => {
    return eventStats.totalExpenses || 0;
  };

  const calculatePerPersonAmount = () => {
    return eventStats.averagePerPerson || 0;
  };

  const renderTabBar = () => {
    const TABS = [
      { key: 'resumen',       title: t('summary.title'),      icon: 'chart-pie'     as const, color: '#4CAF50' },
      { key: 'participantes', title: t('participants.title'), icon: 'account-group' as const, color: '#2196F3' },
      { key: 'gastos',        title: t('expenses.title'),     icon: 'cash'          as const, color: '#FF9800' },
    ];
    return (
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabItem, isActive && { borderBottomWidth: 3, borderBottomColor: tab.color }]}
              onPress={() => setActiveTab(tab.key)}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={20}
                color={isActive ? tab.color : theme.colors.onSurfaceVariant}
              />
              <Text style={[styles.tabText, isActive && { color: tab.color, fontWeight: '600' }]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Filtrar y ordenar gastos
  const getFilteredAndSortedExpenses = () => {
    let filtered = [...eventExpenses];

    // Búsqueda por descripción
    if (searchQuery.trim()) {
      filtered = filtered.filter(expense =>
        expense.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro por categoría
    if (filterCategory !== 'todos') {
      filtered = filtered.filter(expense => expense.category === filterCategory);
    }

    // Filtro por pagador
    if (filterPayer !== 'todos') {
      filtered = filtered.filter(expense => expense.payerId === filterPayer);
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.amount - a.amount;
        case 'description':
          return a.description.localeCompare(b.description);
        case 'date':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    return filtered;
  };

  const getFilteredAndSortedSettlements = () => {
    let filtered = [...dbSettlements];

    // Filtrar por búsqueda
    if (settlementsSearchQuery.trim()) {
      const query = settlementsSearchQuery.toLowerCase();
      filtered = filtered.filter(settlement =>
        settlement.fromParticipantName.toLowerCase().includes(query) ||
        settlement.toParticipantName.toLowerCase().includes(query)
      );
    }

    // Ordenamiento: Estado > Deudor > Monto > Acreedor
    // Los pagados van al final
    filtered.sort((a, b) => {
      // 1. Por estado: no pagados primero, pagados al final
      const aIsPaid = a.isPaid || false;
      const bIsPaid = b.isPaid || false;
      if (aIsPaid !== bIsPaid) {
        return aIsPaid ? 1 : -1; // no pagados primero
      }

      // 2. Por deudor (fromParticipantName)
      const deudorComparison = a.fromParticipantName.localeCompare(b.fromParticipantName);
      if (deudorComparison !== 0) {
        return deudorComparison;
      }

      // 3. Por monto (descendente - mayor a menor)
      const montoComparison = b.amount - a.amount;
      if (montoComparison !== 0) {
        return montoComparison;
      }

      // 4. Por acreedor (toParticipantName)
      return a.toParticipantName.localeCompare(b.toParticipantName);
    });

    return filtered;
  };

  const renderGastosTab = () => {
    const filteredExpenses = getFilteredAndSortedExpenses();
    const allExpensesSelected = filteredExpenses.length > 0 && filteredExpenses.every(e => selectedExpenseIds.has(e.id));
    
    return (
      <View style={styles.tabContent}>
        {/* ══ Sección 1: Buscador + Encabezado ══ */}
        <View ref={edExpenseFiltersRef} collapsable={false} style={{ marginHorizontal: 16, marginTop: 12 }}>
          <Card style={{ borderTopWidth: 4, borderTopColor: '#FF9800', overflow: 'hidden', marginBottom: 8 }}>
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t('expenses.search')}
              showClearButton={true}
              onClear={() => setSearchQuery('')}
            />
            <View style={{ height: 1, backgroundColor: theme.colors.outline + '25', marginTop: 8, marginBottom: 10 }} />
            {/* Fila título + botones */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              {isExpenseSelectMode ? (
                <>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                    onPress={() => {
                      if (allExpensesSelected) {
                        setSelectedExpenseIds(new Set());
                      } else {
                        setSelectedExpenseIds(new Set(filteredExpenses.map(e => e.id)));
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={allExpensesSelected ? 'checkbox-marked-circle' : selectedExpenseIds.size > 0 ? 'minus-circle-outline' : 'checkbox-blank-circle-outline'}
                      size={22}
                      color={theme.colors.primary}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                      {selectedExpenseIds.size > 0
                        ? t('expenses.selectedCount', { count: selectedExpenseIds.size, plural: selectedExpenseIds.size !== 1 ? 's' : '' })
                        : t('expenses.selectAll')}
                    </Text>
                  </TouchableOpacity>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {selectedExpenseIds.size > 0 && (
                      <TouchableOpacity
                        style={{ backgroundColor: theme.colors.error, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
                        onPress={handleRemoveSelectedExpenses}
                      >
                        <MaterialCommunityIcons name="delete-outline" size={20} color="#fff" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.outline + '25' }}
                      onPress={() => { setIsExpenseSelectMode(false); setSelectedExpenseIds(new Set()); }}
                    >
                      <MaterialCommunityIcons name="close" size={20} color={theme.colors.onSurface} />
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <MaterialCommunityIcons name="cash" size={18} color="#FF9800" />
                    <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                      {t('expenses.title')} ({filteredExpenses.length}{filteredExpenses.length !== eventExpenses.length ? ` de ${eventExpenses.length}` : ''})
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {isEditable && (
                      <TouchableOpacity
                        style={[
                          { backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' },
                          eventParticipants.length === 0 && { opacity: 0.4 }
                        ]}
                        onPress={eventParticipants.length === 0 ? undefined : handleAddExpense}
                        activeOpacity={eventParticipants.length === 0 ? 1 : 0.7}
                      >
                        <MaterialCommunityIcons name="plus" size={16} color={theme.colors.onPrimary} style={{ marginRight: 6 }} />
                        <Text style={{ color: theme.colors.onPrimary, fontWeight: '600', fontSize: 14 }}>{t('add')}</Text>
                      </TouchableOpacity>
                    )}
                    {isEditable && eventExpenses.length > 0 && (
                      <TouchableOpacity
                        style={{ backgroundColor: theme.colors.error + '15', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 }}
                        onPress={() => { setIsExpenseSelectMode(true); setSelectedExpenseIds(new Set()); }}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </View>
          </Card>
        </View>

        {/* ══ Sección 2: Lista de Gastos ══ */}
        <View ref={edExpensesRef} collapsable={false} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }}>
          <Card style={{ marginHorizontal: 16, marginTop: 0, marginBottom: 16, borderTopWidth: 4, borderTopColor: '#FF9800', overflow: 'hidden' }}>
            {filteredExpenses.length === 0 && eventExpenses.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="receipt" size={48} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.emptyText}>{t('expenses.noExpenses')}</Text>
                {eventParticipants.length === 0 ? (
                  <TouchableOpacity onPress={() => setActiveTab('participantes')} activeOpacity={0.7}>
                    <Text style={[styles.emptySubtext, { color: theme.colors.primary, textDecorationLine: 'underline', marginTop: 4 }]}>
                      {t('expenses.noParticipantsForExpenses')}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.emptySubtext}>{t('expenses.noExpensesDesc')}</Text>
                )}
              </View>
            ) : filteredExpenses.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="filter-remove" size={48} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.emptyText}>{t('expenses.noResults')}</Text>
                <Text style={styles.emptySubtext}>{t('expenses.noResultsDesc')}</Text>
              </View>
            ) : (
          <FlatList
            data={filteredExpenses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const expenseSplits = eventSplits.filter(split => split.expenseId === item.id);
              const includedParticipantIds = expenseSplits.map(split => split.participantId);
              const excludedParticipants = eventParticipants.filter(p => !includedParticipantIds.includes(p.id));
              const isSelected = selectedExpenseIds.has(item.id);
              
              return (
                <TouchableOpacity
                  style={[
                    styles.expenseItem,
                    isExpenseSelectMode && isSelected && { backgroundColor: theme.colors.primary + '18' }
                  ]}
                  onPress={() => {
                    if (isExpenseSelectMode) {
                      const next = new Set(selectedExpenseIds);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      setSelectedExpenseIds(next);
                    } else {
                      setSelectedExpenseForDetail({ 
                        expense: item, 
                        splits: expenseSplits, 
                        excludedParticipants 
                      });
                      setShowExpenseDetailModal(true);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  {/* Checkbox en modo selección */}
                  {isExpenseSelectMode && (
                    <View style={{ marginRight: 10, justifyContent: 'center' }}>
                      <MaterialCommunityIcons
                        name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                        size={24}
                        color={isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant}
                      />
                    </View>
                  )}

                  {/* Primera fila: Descripción | Monto + Icono */}
                  <View style={[styles.expenseFirstRow, { flex: 1 }]}>
                    <Text style={styles.expenseDescription}>{item.description}</Text>
                    <View style={styles.expenseRightSection}>
                      <Text style={styles.expenseAmount}>
                        ${item.amount.toFixed(2)} {event?.currency || 'ARS'}
                      </Text>
                      {/* Icono de comprobante — oculto en modo selección */}
                      {item.receiptImage && !isExpenseSelectMode && (
                        <TouchableOpacity
                          style={styles.receiptIconButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            setSelectedImage(item.receiptImage!);
                            setShowImageModal(true);
                          }}
                        >
                          <MaterialCommunityIcons 
                            name="camera" 
                            size={20} 
                            color={theme.colors.primary} 
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  
                  {/* Segunda fila: Pagador | Fecha */}
                  {item.payers && item.payers.length > 1 ? (
                    <View>
                      {/* Fila resumen: "👥 X pagadores" + chevron + fecha */}
                      <View style={styles.expenseSecondRow}>
                        <TouchableOpacity
                          style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                          onPress={(e) => {
                            e.stopPropagation();
                            const next = new Set(expandedPayerLists);
                            if (next.has(item.id)) next.delete(item.id);
                            else next.add(item.id);
                            setExpandedPayerLists(next);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.expensePaidBy}>
                            {t('expenses.paidBy')}: {item.payers.length} {item.payers.length === 1 ? t('expenses.paidByPerson') : t('expenses.paidByPersons')}
                          </Text>
                          <MaterialCommunityIcons
                            name={expandedPayerLists.has(item.id) ? 'chevron-up' : 'chevron-down'}
                            size={16}
                            color={theme.colors.onSurfaceVariant}
                            style={{ marginLeft: 2 }}
                          />
                        </TouchableOpacity>
                        <Text style={styles.expenseDate}>
                          {new Date(item.date).toLocaleDateString()}
                        </Text>
                      </View>
                      {/* Lista expandida de pagadores con montos */}
                      {expandedPayerLists.has(item.id) && (
                        <View style={{ marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: theme.colors.outline + '40' }}>
                          {item.payers.map((payer) => (
                            <View
                              key={payer.participantId}
                              style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 }}
                            >
                              <Text style={[styles.expensePaidBy, { fontSize: 12, color: theme.colors.onSurfaceVariant }]}>
                                • {eventParticipants.find(p => p.id === payer.participantId)?.name || payer.participantName || '?'}
                              </Text>
                              <Text style={[styles.expensePaidBy, { fontSize: 12, fontWeight: '600', color: theme.colors.onSurface }]}>
                                ${payer.amount.toFixed(2)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.expenseSecondRow}>
                      <Text style={styles.expensePaidBy}>
                        {t('expenses.paidBy')}: {eventParticipants.find(p => p.id === item.payerId)?.name || 'Usuario Demo'}
                      </Text>
                      <Text style={styles.expenseDate}>
                        {new Date(item.date).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                  
                  {/* Tercera fila: División | Acciones (ocultas en modo selección) */}
                  <View style={styles.expenseThirdRow}>
                    <Text style={styles.expenseDivisionSummary}>
                      {t('expenses.division')} ({expenseSplits.length} part | {excludedParticipants.length} exc)
                    </Text>
                    
                    {/* Acciones a la derecha — solo en modo normal */}
                    {isEditable && !isExpenseSelectMode && (
                      <View style={styles.expenseActions}>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleEditExpense(item);
                          }}
                        >
                          <MaterialCommunityIcons name="pencil" size={16} color={theme.colors.onSurfaceVariant} />
                          <Text style={styles.actionText}>{t('expenses.edit')}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            scrollEnabled={false}
          />
            )}
          </Card>
        </ScrollView>
        </View>
      </View>
    );
  };

  const renderParticipantesTab = () => {
    // Separar primarios y secundarios
    const primaryParticipants = eventParticipants.filter(p =>
      !p.parentParticipantId &&
      (p.participantType === 'friend' || (p.participantType === 'temporary' && p.isActive))
    );
    const secondaryParticipants = eventParticipants.filter(p => !!p.parentParticipantId);

    // Filtrar primarios por búsqueda
    let visiblePrimaries = primaryParticipants;
    if (participantSearchQuery.trim()) {
      const q = participantSearchQuery.toLowerCase();
      visiblePrimaries = primaryParticipants.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.alias_cbu && p.alias_cbu.toLowerCase().includes(q))
      );
    }

    // Mapa de condonaciones para ajustar balances de participantes
    const assignmentMap: { [debtorId: string]: string } = {};
    consolidationAssignments.forEach((a: any) => {
      assignmentMap[a.debtorId] = a.payerId;
    });

    // Función que calcula el balance de un participante (primario o secundario)
    const calcBalance = (participant: Participant) => {
      const totalPaid = eventExpenses.reduce((sum, e) => {
        if (e.payers && e.payers.length > 0) {
          const mp = e.payers.find((p: any) => p.participantId === participant.id);
          return sum + (mp ? mp.amount : 0);
        }
        return e.payerId === participant.id ? sum + e.amount : sum;
      }, 0);
      const totalOwed = eventSplits
        .filter(s => s.participantId === participant.id)
        .reduce((sum, s) => sum + s.amount, 0);
      const paidByParticipant = dbSettlements
        .filter((s: any) => s.fromParticipantId === participant.id && s.isPaid)
        .reduce((sum: number, s: any) => sum + s.amount, 0);
      const receivedByParticipant = dbSettlements
        .filter((s: any) => s.toParticipantId === participant.id && s.isPaid)
        .reduce((sum: number, s: any) => sum + s.amount, 0);
      const forgivenAmount = dbSettlements
        .filter((s: any) => {
          if (s.isPaid) return false;
          const actualPayer = assignmentMap[s.fromParticipantId] || s.fromParticipantId;
          return s.fromParticipantId === participant.id && actualPayer === s.toParticipantId;
        })
        .reduce((sum: number, s: any) => sum + s.amount, 0);
      const absorbedByThirdParty = dbSettlements
        .filter((s: any) => {
          if (s.isPaid) return false;
          if (s.fromParticipantId !== participant.id) return false;
          const actualPayer = assignmentMap[s.fromParticipantId];
          return actualPayer !== undefined && actualPayer !== s.toParticipantId;
        })
        .reduce((sum: number, s: any) => sum + s.amount, 0);
      const forgivenToOthers = dbSettlements
        .filter((s: any) => {
          if (s.isPaid) return false;
          const actualPayer = assignmentMap[s.fromParticipantId];
          return s.toParticipantId === participant.id &&
                 actualPayer === participant.id &&
                 s.fromParticipantId !== participant.id;
        })
        .reduce((sum: number, s: any) => sum + s.amount, 0);
      const absorbedFromOthers = dbSettlements
        .filter((s: any) => {
          if (s.isPaid) return false;
          const actualPayer = assignmentMap[s.fromParticipantId];
          return actualPayer === participant.id &&
                 s.fromParticipantId !== participant.id &&
                 s.toParticipantId !== participant.id;
        })
        .reduce((sum: number, s: any) => sum + s.amount, 0);
      return (totalPaid - totalOwed)
        + paidByParticipant
        - receivedByParticipant
        + forgivenAmount
        + absorbedByThirdParty
        - forgivenToOthers
        - absorbedFromOthers;
    };

    // Participantes que pueden ser eliminados (sin gastos pagados)
    const selectableParticipantIds = visiblePrimaries
      .filter(p => !eventExpenses.some(e => {
        if (e.payers && e.payers.length > 0) {
          return e.payers.some((pp: any) => pp.participantId === p.id && pp.amount > 0);
        }
        return e.payerId === p.id;
      }))
      .map(p => p.id);
    const allParticipantsSelected = selectableParticipantIds.length > 0
      && selectableParticipantIds.every(id => selectedParticipantIds.has(id));

    return (
      <View style={styles.tabContent}>
        {/* ══ Sección 1: Buscador + Encabezado ══ */}
        <View ref={edParticipantActionsRef} collapsable={false} style={{ marginHorizontal: 16, marginTop: 12 }}>
          <Card style={{ borderTopWidth: 4, borderTopColor: '#2196F3', overflow: 'hidden', marginBottom: 8 }}>
            <SearchBar
              value={participantSearchQuery}
              onChangeText={setParticipantSearchQuery}
              placeholder={t('participants.search')}
              showClearButton={true}
              onClear={() => setParticipantSearchQuery('')}
            />
            <View style={{ height: 1, backgroundColor: theme.colors.outline + '25', marginTop: 8, marginBottom: 10 }} />
            {/* Fila título + botones */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              {isParticipantSelectMode ? (
                <>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                    onPress={() => {
                      if (allParticipantsSelected) {
                        setSelectedParticipantIds(new Set());
                      } else {
                        setSelectedParticipantIds(new Set(selectableParticipantIds));
                      }
                    }}
                    activeOpacity={selectableParticipantIds.length > 0 ? 0.7 : 1}
                  >
                    <MaterialCommunityIcons
                      name={allParticipantsSelected ? 'checkbox-marked-circle' : selectedParticipantIds.size > 0 ? 'minus-circle-outline' : 'checkbox-blank-circle-outline'}
                      size={22}
                      color={selectableParticipantIds.length > 0 ? theme.colors.primary : theme.colors.onSurfaceVariant}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                      {selectedParticipantIds.size > 0
                        ? t('participants.selectedCount', { count: selectedParticipantIds.size, plural: selectedParticipantIds.size !== 1 ? 's' : '' })
                        : t('participants.selectAll')}
                    </Text>
                  </TouchableOpacity>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {selectedParticipantIds.size > 0 && (
                      <TouchableOpacity
                        style={{ backgroundColor: theme.colors.error, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
                        onPress={handleRemoveSelectedParticipants}
                      >
                        <MaterialCommunityIcons name="delete-outline" size={20} color="#fff" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.outline + '25' }}
                      onPress={() => { setIsParticipantSelectMode(false); setSelectedParticipantIds(new Set()); }}
                    >
                      <MaterialCommunityIcons name="close" size={20} color={theme.colors.onSurface} />
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                    <MaterialCommunityIcons name="account-group" size={18} color="#2196F3" />
                    <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
                      {t('participants.title')} ({visiblePrimaries.length}{visiblePrimaries.length !== primaryParticipants.length ? ` de ${primaryParticipants.length}` : ''})
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {isEditable && (
                      <TouchableOpacity
                        style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
                        onPress={() => setShowAddParticipantModal(true)}
                      >
                        <MaterialCommunityIcons name="plus" size={16} color={theme.colors.onPrimary} style={{ marginRight: 6 }} />
                        <Text style={{ color: theme.colors.onPrimary, fontWeight: '600', fontSize: 14 }}>{t('common.add')}</Text>
                      </TouchableOpacity>
                    )}
                    {isEditable && visiblePrimaries.length > 0 && (
                      <TouchableOpacity
                        style={{ backgroundColor: theme.colors.error + '15', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 }}
                        onPress={() => { setIsParticipantSelectMode(true); setSelectedParticipantIds(new Set()); }}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </View>
          </Card>
        </View>

        {/* ══ Sección 2: Lista de Participantes ══ */}
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View ref={edParticipantsRef} collapsable={false}>
          <Card style={{ marginHorizontal: 16, marginTop: 0, marginBottom: 16, borderTopWidth: 4, borderTopColor: '#2196F3', overflow: 'hidden' }}>

          {visiblePrimaries.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-group" size={48} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.emptyText}>{t('participants.noParticipants')}</Text>
              <Text style={styles.emptySubtext}>{t('participants.noParticipantsDesc')}</Text>
            </View>
          ) : (
            visiblePrimaries.map(participant => {
              // Secundarios de este primario
              const mySecondaries = secondaryParticipants.filter(s => s.parentParticipantId === participant.id);

              // Balance del primario + suma de balances de sus secundarios (consolidado)
              const balance = calcBalance(participant)
                + mySecondaries.reduce((sum, sec) => sum + calcBalance(sec), 0);

              const totalOwed = eventSplits
                .filter(s => s.participantId === participant.id)
                .reduce((sum, s) => sum + s.amount, 0);
              const totalPaid = eventExpenses.reduce((sum, e) => {
                if (e.payers && e.payers.length > 0) {
                  const mp = e.payers.find((p: any) => p.participantId === participant.id);
                  return sum + (mp ? mp.amount : 0);
                }
                return e.payerId === participant.id ? sum + e.amount : sum;
              }, 0);
              const forgivenAmount = dbSettlements
                .filter((s: any) => {
                  if (s.isPaid) return false;
                  const actualPayer = assignmentMap[s.fromParticipantId] || s.fromParticipantId;
                  return s.fromParticipantId === participant.id && actualPayer === s.toParticipantId;
                })
                .reduce((sum: number, s: any) => sum + s.amount, 0);
              const absorbedByThirdParty = dbSettlements
                .filter((s: any) => {
                  if (s.isPaid) return false;
                  if (s.fromParticipantId !== participant.id) return false;
                  const actualPayer = assignmentMap[s.fromParticipantId];
                  return actualPayer !== undefined && actualPayer !== s.toParticipantId;
                })
                .reduce((sum: number, s: any) => sum + s.amount, 0);
              const effectiveOwed = Math.max(0, totalOwed - forgivenAmount - absorbedByThirdParty);

              const isSelected = selectedParticipantIds.has(participant.id);
              const hasExpenses = totalPaid > 0;

              return (
                <View key={participant.id}>
                  {/* ── FILA PARTICIPANTE PRIMARIO ── */}
                  <TouchableOpacity
                    style={[
                      styles.participantItem,
                      isParticipantSelectMode && isSelected && { backgroundColor: theme.colors.primary + '18' },
                      isParticipantSelectMode && hasExpenses && { opacity: 0.45 }
                    ]}
                    onPress={() => {
                      if (isParticipantSelectMode) {
                        if (hasExpenses) {
                          showAlert({ type: 'error', title: t('common.error'), message: t('participants.cannotDeleteHasExpenses', { name: participant.name }) });
                          return;
                        }
                        const next = new Set(selectedParticipantIds);
                        if (next.has(participant.id)) next.delete(participant.id);
                        else next.add(participant.id);
                        setSelectedParticipantIds(next);
                      } else {
                        setSelectedParticipantForInfo(participant);
                        setParticipantInfoModalVisible(true);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    {isParticipantSelectMode && (
                      <View style={{ marginRight: 10, justifyContent: 'center' }}>
                        <MaterialCommunityIcons
                          name={hasExpenses ? 'lock-outline' : isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                          size={24}
                          color={hasExpenses ? theme.colors.onSurfaceVariant : isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant}
                        />
                      </View>
                    )}
                    <View style={styles.participantInfo}>
                      {participant.avatar ? (
                        <Avatar
                          name={participant.name}
                          image={participant.avatar}
                          size="medium"
                          style={{ marginRight: 12 } as any}
                        />
                      ) : (
                        <View style={[
                          styles.participantAvatar,
                          { backgroundColor: participant.participantType === 'friend' ? theme.colors.success : theme.colors.warning }
                        ]}>
                          <MaterialCommunityIcons
                            name={participant.participantType === 'friend' ? 'heart' : 'clock'}
                            size={24}
                            color={participant.participantType === 'friend' ? theme.colors.onSuccess : theme.colors.onWarning}
                          />
                        </View>
                      )}
                      <View style={styles.participantDetails}>
                        <View style={styles.participantNameContainer}>
                          <Text style={styles.participantName}>{participant.name}</Text>
                        </View>
                        {consolidationAssignments.some((a: any) => a.debtorId === participant.id) && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, marginBottom: 1 }}>
                            <MaterialCommunityIcons
                              name={forgivenAmount > 0 ? 'cancel' : 'account-arrow-right'}
                              size={11}
                              color="#FF9800"
                            />
                            <Text style={{ fontSize: 10, color: '#FF9800', marginLeft: 3, fontWeight: '600' }}>
                              {forgivenAmount > 0
                                ? `Deuda condonada ($${forgivenAmount.toFixed(2)})`
                                : 'Pagado por otro'}
                            </Text>
                          </View>
                        )}
                        {participant.alias_cbu && (
                          <Text style={styles.participantEmail}>💳 {participant.alias_cbu}</Text>
                        )}
                        {participant.phone && (
                          <Text style={styles.participantEmail}>📞 {participant.phone}</Text>
                        )}
                        <View style={{ flexDirection: 'column', gap: 2, marginTop: 3 }}>
                          {totalPaid > 0 && (
                            <Text style={{ fontSize: 13, color: '#388E3C', fontWeight: '500' }}>💰 ${totalPaid.toFixed(2)}</Text>
                          )}
                          {effectiveOwed < totalOwed && totalOwed > 0 ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Text style={{ fontSize: 13, color: theme.colors.onSurfaceVariant, textDecorationLine: 'line-through' }}>
                                💵 ${totalOwed.toFixed(2)}
                              </Text>
                              {effectiveOwed > 0 && (
                                <Text style={{ fontSize: 13, color: theme.colors.error, fontWeight: '500' }}>
                                  → ${effectiveOwed.toFixed(2)}
                                </Text>
                              )}
                            </View>
                          ) : (
                            <Text style={{ fontSize: 13, color: theme.colors.error, fontWeight: '500' }}>💵 ${effectiveOwed.toFixed(2)}</Text>
                          )}
                        </View>
                      </View>
                    </View>
                    <View style={styles.participantRightSection}>
                      {isEditable && !isParticipantSelectMode && (
                        <View style={styles.participantActions}>
                          {participant.participantType === 'temporary' && (
                            <TouchableOpacity
                              style={styles.editParticipantButton}
                              onPress={() => handleEditParticipant(participant)}
                            >
                              <MaterialCommunityIcons name="pencil" size={18} color={theme.colors.primary} />
                            </TouchableOpacity>
                          )}
                          {/* Botón + para agregar representado */}
                          <TouchableOpacity
                            style={[styles.editParticipantButton, { marginLeft: 4 }]}
                            onPress={() => {
                              // Buscar el próximo número libre (evita colisiones si se borró uno intermedio)
                              const existingNames = new Set(
                                eventParticipants
                                  .filter(p => p.parentParticipantId === participant.id)
                                  .map(p => p.name.toLowerCase())
                              );
                              let n = 1;
                              while (existingNames.has(`${participant.name.toLowerCase()} - nro ${n}`)) {
                                n++;
                              }
                              const defaultName = `${participant.name} - Nro ${n}`;
                              handleAddSecondaryParticipant(participant, defaultName);
                            }}
                          >
                            <MaterialCommunityIcons name="account-plus-outline" size={18} color={theme.colors.primary} />
                          </TouchableOpacity>
                        </View>
                      )}
                      <View style={styles.participantStats}>
                        <Text style={[
                          styles.participantBalance,
                          {
                            color: balance > 0.01 ? theme.colors.success :
                                   balance < -0.01 ? theme.colors.error : theme.colors.onSurfaceVariant
                          }
                        ]}>
                          {balance > 0.01 ? `+$${balance.toFixed(2)}` :
                           balance < -0.01 ? `-$${Math.abs(balance).toFixed(2)}` :
                           '$0.00'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* ── FILAS DE PARTICIPANTES SECUNDARIOS ── */}
                  {mySecondaries.length > 0 && (() => {
                    const isExpanded = mySecondaries.length === 1 || expandedSecondaries.has(participant.id) || isParticipantSelectMode;
                    const toggleExpanded = () => {
                      if (mySecondaries.length <= 1) return;
                      const next = new Set(expandedSecondaries);
                      if (next.has(participant.id)) next.delete(participant.id);
                      else next.add(participant.id);
                      setExpandedSecondaries(next);
                    };
                    return (
                      <>
                        {/* Header colapsable solo si hay más de 1 secundario */}
                        {mySecondaries.length > 1 && (
                          <TouchableOpacity
                            onPress={toggleExpanded}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingVertical: 6,
                              paddingLeft: 36,
                              paddingRight: 12,
                              backgroundColor: theme.colors.surfaceVariant + '60',
                              borderBottomWidth: 1,
                              borderBottomColor: theme.colors.outline + '20',
                            }}
                          >
                            <MaterialCommunityIcons
                              name={isExpanded ? 'chevron-down' : 'chevron-right'}
                              size={16}
                              color={theme.colors.onSurfaceVariant}
                              style={{ marginRight: 4 }}
                            />
                            <Text style={{ flex: 1, fontSize: 12, color: theme.colors.onSurfaceVariant, fontWeight: '600' }}>
                              Part. Secundarios ({mySecondaries.length})
                            </Text>
                          </TouchableOpacity>
                        )}

                        {/* Filas de secundarios */}
                        {isExpanded && mySecondaries.map(secondary => {
                          const secBalance = calcBalance(secondary);
                          const isEditingThis = editingSecondaryId === secondary.id;
                          const isSecSelected = selectedParticipantIds.has(secondary.id);
                          return (
                            <TouchableOpacity
                              key={secondary.id}
                              activeOpacity={isParticipantSelectMode ? 0.6 : 1}
                              onPress={() => {
                                if (isParticipantSelectMode) {
                                  const next = new Set(selectedParticipantIds);
                                  if (next.has(secondary.id)) next.delete(secondary.id);
                                  else next.add(secondary.id);
                                  setSelectedParticipantIds(next);
                                }
                              }}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 8,
                                paddingLeft: 36,
                                paddingRight: 12,
                                borderBottomWidth: 1,
                                borderBottomColor: theme.colors.outline + '20',
                                backgroundColor: isParticipantSelectMode && isSecSelected
                                  ? theme.colors.primary + '18'
                                  : theme.colors.surfaceVariant + '40',
                                gap: 6,
                              }}
                            >
                              {/* Checkbox en modo selección */}
                              {isParticipantSelectMode && (
                                <MaterialCommunityIcons
                                  name={isSecSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                                  size={20}
                                  color={isSecSelected ? theme.colors.primary : theme.colors.onSurfaceVariant}
                                  style={{ marginRight: 2 }}
                                />
                              )}

                              {/* Icono */}
                              {!isParticipantSelectMode && (
                                <MaterialCommunityIcons name="account-child-outline" size={18} color={theme.colors.onSurfaceVariant} />
                              )}

                              {/* Nombre (editable o texto) */}
                              {isEditingThis && !isParticipantSelectMode ? (
                                <TextInput
                                  style={{
                                    flex: 1,
                                    fontSize: 13,
                                    color: theme.colors.onSurface,
                                    borderBottomWidth: 1,
                                    borderBottomColor: theme.colors.primary,
                                    paddingVertical: 2,
                                  }}
                                  value={editingSecondaryName}
                                  onChangeText={setEditingSecondaryName}
                                  autoFocus
                                  returnKeyType="done"
                                  onSubmitEditing={() => handleSaveSecondaryName(secondary)}
                                  onBlur={() => handleSaveSecondaryName(secondary)}
                                />
                              ) : (
                                <Text style={{ flex: 1, fontSize: 13, color: theme.colors.onSurface, fontWeight: '500' }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                                  {secondary.name}
                                </Text>
                              )}

                              {/* Lápiz editar */}
                              {isEditable && !isParticipantSelectMode && (
                                isEditingThis ? (
                                  <TouchableOpacity
                                    onPress={() => handleSaveSecondaryName(secondary)}
                                    style={{ padding: 4 }}
                                  >
                                    <MaterialCommunityIcons name="check" size={16} color={theme.colors.primary} />
                                  </TouchableOpacity>
                                ) : (
                                  <TouchableOpacity
                                    style={{ padding: 4 }}
                                    onPress={() => {
                                      setEditingSecondaryId(secondary.id);
                                      setEditingSecondaryName(secondary.name);
                                    }}
                                  >
                                    <MaterialCommunityIcons name="pencil-outline" size={16} color={theme.colors.primary} />
                                  </TouchableOpacity>
                                )
                              )}

                              {/* Monto */}
                              <Text style={{
                                fontSize: 13,
                                fontWeight: '600',
                                color: secBalance > 0.01 ? theme.colors.success :
                                       secBalance < -0.01 ? theme.colors.error : theme.colors.onSurfaceVariant,
                                minWidth: 56,
                                textAlign: 'right',
                              }}>
                                {secBalance > 0.01 ? `+$${secBalance.toFixed(2)}` :
                                 secBalance < -0.01 ? `-$${Math.abs(secBalance).toFixed(2)}` :
                                 '$0.00'}
                              </Text>

                              {/* Eliminar */}
                              {isEditable && !isParticipantSelectMode && (
                                <TouchableOpacity onPress={() => handleRemoveSecondaryParticipant(secondary)} style={{ padding: 4 }}>
                                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.colors.error} />
                                </TouchableOpacity>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </>
                    );
                  })()}

                </View>
              );
            })
          )}
          </Card>
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderResumenTab = () => {
    return (
    <View style={styles.tabContent}>
      <ScrollView style={{ flex: 1 }}>
      {/* Información del evento */}
      <View ref={edInfoRef} collapsable={false} style={{ marginHorizontal: 16, marginTop: 12 }}>
      <Card style={{ marginBottom: 16, borderTopWidth: 4, borderTopColor: '#4CAF50', overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
          <MaterialCommunityIcons name="information-outline" size={20} color="#4CAF50" />
          <Text style={[styles.sectionTitle, { marginBottom: 0, flex: 1 }]}>{t('events.information')}</Text>
          {event && (
            <View style={{ 
              backgroundColor: isClosed ? theme.colors.surfaceVariant :
                             isLocked ? theme.colors.warningContainer :
                             theme.colors.successContainer,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isClosed ? theme.colors.outline :
                          isLocked ? theme.colors.warning :
                          theme.colors.success
            }}>
              <Text style={{ 
                color: isClosed ? theme.colors.onSurfaceVariant :
                       isLocked ? theme.colors.warning :
                       theme.colors.success,
                fontSize: 12,
                fontWeight: '600'
              }}>
                {isClosed ? t('events.archived') :
                 isLocked ? t('events.locked') :
                 t('events.active')}
              </Text>
            </View>
          )}
        </View>
        {event && (
          <View style={styles.summaryInfo}>
            {/* Banner: Evento Compartido */}
            {isSharedEvent && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 8,
                backgroundColor: sharedRole === 'editor' ? '#9C27B012' : '#2196F312',
                borderWidth: 1, borderColor: sharedRole === 'editor' ? '#9C27B040' : '#2196F340',
                borderRadius: 10, padding: 10, marginBottom: 12,
              }}>
                <MaterialCommunityIcons
                  name={sharedRole === 'editor' ? 'account-edit' : 'eye'}
                  size={18}
                  color={sharedRole === 'editor' ? '#9C27B0' : '#2196F3'}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: sharedRole === 'editor' ? '#9C27B0' : '#2196F3' }}>
                    {t('eventDetail.sharedEventBanner')}
                  </Text>
                  <Text style={{ fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 1 }}>
                    {sharedRole === 'editor' ? t('eventDetail.qrPermissionEditDesc') : t('eventDetail.qrPermissionViewDesc')}
                  </Text>
                </View>
              </View>
            )}
            <Text style={[styles.eventName, { color: theme.colors.onSurfaceVariant }]}>{event.name}</Text>
            {event.description && (
              <Text style={[styles.eventDescription, { color: theme.colors.onSurfaceVariant }]}>{event.description}</Text>
            )}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
              {event.location && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 8 }}>
                  <MaterialCommunityIcons name="map-marker" size={16} color={theme.colors.error} style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 14, color: theme.colors.onSurfaceVariant }}>{event.location}</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 8 }}>
                <MaterialCommunityIcons name="calendar" size={16} color={theme.colors.info} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 14, color: theme.colors.onSurfaceVariant }}>
                  {new Date(event.startDate).toLocaleDateString()}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialCommunityIcons name="currency-usd" size={16} color={theme.colors.success} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 14, color: theme.colors.onSurfaceVariant }}>{t('eventDetail.currency')} {event.currency}</Text>
              </View>
            </View>
            
            {/* Estadísticas inline */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.outline }}>
              <View style={{ alignItems: 'center' }}>
                <MaterialCommunityIcons name="account-group" size={20} color={theme.colors.info} />
                <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.onSurface, marginTop: 4 }}>{eventParticipants.length}</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <MaterialCommunityIcons name="wallet" size={20} color={theme.colors.warning} />
                <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.onSurface, marginTop: 4 }}>{eventExpenses.length}</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <MaterialCommunityIcons name="cash" size={20} color={theme.colors.success} />
                <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.onSurface, marginTop: 4 }}>
                  ${calculateTotalExpenses().toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Comentario de cierre */}
            {event.closingComment ? (
              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.outline }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <MaterialCommunityIcons name="comment-text-outline" size={14} color={theme.colors.onSurfaceVariant} />
                  <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.onSurfaceVariant }}>
                    {t('events.closingComment')}
                  </Text>
                </View>
                <Text style={{ fontSize: 13, color: theme.colors.onSurface, fontStyle: 'italic', lineHeight: 18 }}>
                  {event.closingComment}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </Card>
      </View>

      {/* Acciones del evento */}
      <View ref={edEventActionsRef} collapsable={false} style={{ marginHorizontal: 16, marginBottom: 16 }}>
      <Card style={{ borderTopWidth: 4, borderTopColor: '#4CAF50', overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
          <MaterialCommunityIcons name="cog-outline" size={20} color="#4CAF50" />
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{t('events.actions')}</Text>
        </View>
        {/* 4 botones en una fila: ícono arriba + texto abajo */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#25D36618', paddingVertical: 12, borderRadius: 10, gap: 4 }}
            onPress={handleShareSummary}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="whatsapp" size={22} color="#25D366" />
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#25D366', textAlign: 'center' }}>{t('eventDetail.shareSummaryLabel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#25D36618', paddingVertical: 12, borderRadius: 10, gap: 4 }}
            onPress={handleShareEvent}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="whatsapp" size={22} color="#25D366" />
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#25D366', textAlign: 'center' }}>{t('eventDetail.shareEventLabel')}</Text>
          </TouchableOpacity>
          {isEditable && (
            <TouchableOpacity
              onPress={handleToggleLock}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary, paddingVertical: 12, borderRadius: 10, gap: 4 }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="lock" size={22} color={theme.colors.onPrimary} />
              <Text style={{ color: theme.colors.onPrimary, fontWeight: '600', fontSize: 11, textAlign: 'center' }}>{t('events.lock')}</Text>
            </TouchableOpacity>
          )}
          {isLocked && (
            <TouchableOpacity
              onPress={handleToggleLock}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.primary, paddingVertical: 12, borderRadius: 10, gap: 4 }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="lock-open" size={22} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 11, textAlign: 'center' }}>{t('events.unlock')}</Text>
            </TouchableOpacity>
          )}
          {isClosed && (
            <TouchableOpacity
              onPress={handleReactivateEvent}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.primary, paddingVertical: 12, borderRadius: 10, gap: 4 }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="lock-open" size={22} color={theme.colors.onPrimary} />
              <Text style={{ color: theme.colors.onPrimary, fontWeight: '600', fontSize: 11, textAlign: 'center' }}>{t('events.reactivate')}</Text>
            </TouchableOpacity>
          )}
          {!isClosed && (
            <TouchableOpacity
              onPress={handleCloseEvent}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.outline, paddingVertical: 12, borderRadius: 10, gap: 4 }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="archive" size={22} color={theme.colors.onSurfaceVariant} />
              <Text style={{ color: theme.colors.onSurfaceVariant, fontWeight: '600', fontSize: 11, textAlign: 'center' }}>{t('events.close')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Segunda fila: botón QR */}
        <View style={{ marginTop: 8 }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              backgroundColor: '#9C27B018', paddingVertical: 12, borderRadius: 10,
              borderWidth: 1.5, borderColor: '#9C27B040',
            }}
            onPress={() => setShowQRModal(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="qrcode" size={22} color="#9C27B0" />
            <View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#9C27B0' }}>{t('eventDetail.qrInviteButton')}</Text>
              <Text style={{ fontSize: 10, color: '#9C27B0', opacity: 0.8 }}>{t('eventDetail.qrPermissionEdit')} / {t('eventDetail.qrPermissionView')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Card>
      </View>

      {/* Liquidaciones (Pendientes + Pagadas unificadas) */}
      <View ref={edSettlementsRef} collapsable={false}>
      <Card style={{ marginBottom: 16, marginHorizontal: 16, borderTopWidth: 4, borderTopColor: '#4CAF50', overflow: 'hidden' }}>

        {/* ── Header principal ── */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            <MaterialCommunityIcons name="swap-horizontal" size={20} color="#4CAF50" />
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{t('summary.settlements')}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {settlements.length > 1 && !isClosed && (
              <TouchableOpacity
                style={{ backgroundColor: theme.colors.primaryContainer, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}
                onPress={() => setShowConsolidationModal(true)}
              >
                <MaterialCommunityIcons name="group" size={14} color={theme.colors.onPrimaryContainer} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.onPrimaryContainer }}>Consolidar</Text>
              </TouchableOpacity>
            )}

          </View>
        </View>

        {/* ── Controles de Consolidación ── */}
        {consolidationAssignments.length > 0 && settlements.length > 1 && !isClosed && (
          <View style={styles.consolidationControls}>
            <View style={styles.consolidationButtons}>
              <TouchableOpacity
                style={[styles.consolidationButton, {
                  backgroundColor: showOriginalView ? theme.colors.primary : theme.colors.surface,
                  borderWidth: 1,
                  borderColor: theme.colors.outline
                }]}
                onPress={handleToggleView}
              >
                <MaterialCommunityIcons
                  name={showOriginalView ? "eye-off" : "eye"}
                  size={16}
                  color={showOriginalView ? theme.colors.onPrimary : theme.colors.onSurface}
                />
                <Text style={[styles.consolidationButtonText, {
                  color: showOriginalView ? theme.colors.onPrimary : theme.colors.onSurface
                }]}>
                  {showOriginalView ? t('eventDetail.viewConsolidated') : t('eventDetail.viewOriginal')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.consolidationButton, { backgroundColor: theme.colors.errorContainer }]}
                onPress={handleClearConsolidations}
              >
                <MaterialCommunityIcons name="close" size={16} color={theme.colors.onErrorContainer} />
                <Text style={[styles.consolidationButtonText, { color: theme.colors.onErrorContainer }]}>
                  {t('eventDetail.clear')}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.consolidationSummary}>
              <Text style={[styles.consolidationSummaryText, { color: theme.colors.onSurfaceVariant }]}>
                {t('eventDetail.consolidationSummary', { count: consolidationAssignments.length })} •{' '}
                {showOriginalView ? t('eventDetail.viewOriginalLabel') : t('eventDetail.viewConsolidatedLabel')}
                {(() => {
                  const forgivenCount = settlements.length - consolidatedSettlements.length;
                  const totalOriginal = settlements.reduce((sum, s) => sum + s.amount, 0);
                  const totalConsolidated = consolidatedSettlements.reduce((sum, s) => sum + s.amount, 0);
                  const savings = totalOriginal - totalConsolidated;
                  return forgivenCount > 0 ? `\n${t('eventDetail.forgivenPayments', { count: forgivenCount, plural: forgivenCount > 1 ? 's' : '', amount: savings.toLocaleString() })}` : '';
                })()}
              </Text>
            </View>
          </View>
        )}

        {/* ══ Sub-sección PENDIENTES ══ */}
        {(() => {
          const pendingSettlements = getDisplaySettlements()
            .filter((s: Settlement) => !s.isPaid)
            .sort((a, b) => {
              if (frozenSettlementOrder.length > 0) {
                const ai = frozenSettlementOrder.indexOf(a.id);
                const bi = frozenSettlementOrder.indexOf(b.id);
                return (ai === -1 ? 9999 : ai) - (bi === -1 ? 9999 : bi);
              }
              const dc = a.fromParticipantName.localeCompare(b.fromParticipantName);
              if (dc !== 0) return dc;
              return b.amount - a.amount;
            });
          return (
            <>
              {/* Separador + pill Pendientes */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: theme.colors.warning + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <MaterialCommunityIcons name="clock-outline" size={13} color={theme.colors.warning} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.warning, letterSpacing: 0.3 }}>
                    PENDIENTES{pendingSettlements.length > 0 ? ` · ${pendingSettlements.length}` : ''}
                  </Text>
                </View>
                <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.outline + '30' }} />
              </View>

              {pendingSettlements.length > 0 ? (
                <View>
                  {pendingSettlements.map((settlement: Settlement, index: number) => (
                    <SettlementItem
                      key={`${settlement.id}_${index}_${settlement.fromParticipantId}_${settlement.toParticipantId}`}
                      settlement={settlement}
                      currency={event?.currency || 'ARS'}
                      onTogglePaid={handleToggleSettlementPaid}
                      onUpdateReceipt={handleUpdateSettlementReceipt}
                      disabled={event?.status === 'archived'}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.noSettlementsContainer}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={48}
                    color={theme.colors.primary}
                    style={styles.noSettlementsIcon}
                  />
                  <Text style={styles.noSettlementsTitle}>{t('eventDetail.settledTitle')}</Text>
                  <Text style={styles.noSettlementsText}>{t('eventDetail.settledText')}</Text>
                </View>
              )}

              {/* Liquidaciones condonadas — auto-resueltas por consolidación */}
              {consolidationAssignments.length > 0 && !showOriginalView && (() => {
                const assignMap: { [debtorId: string]: string } = {};
                consolidationAssignments.forEach((a: any) => { assignMap[a.debtorId] = a.payerId; });
                const forgivenSettlements = dbSettlements.filter((s: any) => {
                  const actualPayer = assignMap[s.fromParticipantId] || s.fromParticipantId;
                  return actualPayer === s.toParticipantId && s.fromParticipantId !== s.toParticipantId;
                });
                if (forgivenSettlements.length === 0) return null;
                return (
                  <View style={{ marginTop: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
                      <MaterialCommunityIcons name="cancel" size={16} color={theme.colors.onSurfaceVariant} />
                      <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.onSurfaceVariant }}>
                        Condonadas automáticamente
                      </Text>
                    </View>
                    {forgivenSettlements.map((s: any, idx: number) => (
                      <View
                        key={`forgiven_${s.id}_${idx}`}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          marginBottom: 6,
                          backgroundColor: theme.colors.surfaceVariant + '60',
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: theme.colors.outline + '40',
                          opacity: 0.75
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, color: theme.colors.onSurfaceVariant, textDecorationLine: 'line-through' }}>
                            {s.fromParticipantName} → {s.toParticipantName}
                          </Text>
                          <Text style={{ fontSize: 11, color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                            🚫 Deuda condonada por consolidación
                          </Text>
                        </View>
                        <Text style={{ fontSize: 13, color: theme.colors.onSurfaceVariant, textDecorationLine: 'line-through', marginLeft: 8 }}>
                          ${s.amount.toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                );
              })()}
            </>
          );
        })()}

        {/* ══ Sub-sección PAGADAS ══ */}
        {!isClosed && (() => {
          const paidSettlements = dbSettlements
            .filter((s: any) => s.isPaid)
            .sort((a: any, b: any) => {
              if (a.paidAt && b.paidAt) return new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime();
              return 0;
            });
          if (paidSettlements.length === 0) return null;
          const allPaidSelected = paidSettlements.every((s: any) => selectedUndoIds.has(s.id));
          return (
            <>
              {/* Separador + pill Todos + botón undo */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#4CAF50' + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <MaterialCommunityIcons name="check-circle-outline" size={13} color="#4CAF50" />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#4CAF50', letterSpacing: 0.3 }}>
                    TODOS · {paidSettlements.length}
                  </Text>
                </View>
                <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.outline + '30' }} />
                {!allowUndoPayments && (
                  <TouchableOpacity
                    style={{ backgroundColor: theme.colors.surfaceVariant, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => { setAllowUndoPayments(true); setSelectedUndoIds(new Set()); }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="undo-variant" size={14} color={theme.colors.onSurfaceVariant} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Controles de selección (modo undo) */}
              {allowUndoPayments && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                    onPress={() => {
                      if (allPaidSelected) {
                        setSelectedUndoIds(new Set());
                      } else {
                        setSelectedUndoIds(new Set(paidSettlements.map((s: any) => s.id)));
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={allPaidSelected ? 'checkbox-marked-circle' : selectedUndoIds.size > 0 ? 'minus-circle-outline' : 'checkbox-blank-circle-outline'}
                      size={22}
                      color={theme.colors.primary}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.onSurface, marginBottom: 0 }}>
                      {selectedUndoIds.size > 0
                        ? `${selectedUndoIds.size} seleccionado${selectedUndoIds.size !== 1 ? 's' : ''}`
                        : 'Todo'}
                    </Text>
                  </TouchableOpacity>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    {selectedUndoIds.size > 0 && (
                      <TouchableOpacity
                        style={{ backgroundColor: theme.colors.error, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' }}
                        onPress={async () => {
                          for (const id of selectedUndoIds) {
                            await handleToggleSettlementPaid(id, false, true);
                          }
                          setSelectedUndoIds(new Set());
                          setAllowUndoPayments(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="undo-variant" size={20} color="#fff" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.outline + '25' }}
                      onPress={() => { setAllowUndoPayments(false); setSelectedUndoIds(new Set()); }}
                    >
                      <MaterialCommunityIcons name="close" size={20} color={theme.colors.onSurface} />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Ítems pagados */}
              {paidSettlements.map((s: any, idx: number) => {
                const isSelected = selectedUndoIds.has(s.id);
                return (
                  <TouchableOpacity
                    key={`paid_${s.id}_${idx}`}
                    activeOpacity={allowUndoPayments ? 0.7 : 1}
                    onPress={() => {
                      if (!allowUndoPayments) return;
                      setSelectedUndoIds(prev => {
                        const next = new Set(prev);
                        if (next.has(s.id)) next.delete(s.id); else next.add(s.id);
                        return next;
                      });
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      marginBottom: 6,
                      backgroundColor: isSelected ? theme.colors.primary + '18' : theme.colors.successContainer + '25',
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: isSelected ? theme.colors.primary + '60' : theme.colors.success + '30',
                    }}
                  >
                    {allowUndoPayments && (
                      <MaterialCommunityIcons
                        name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                        size={22}
                        color={theme.colors.primary}
                        style={{ marginRight: 10 }}
                      />
                    )}
                    {!allowUndoPayments && (
                      <TouchableOpacity
                        onPress={() => {
                          if (s.receiptImage) {
                            setSelectedImage(s.receiptImage);
                            setShowImageModal(true);
                          }
                        }}
                        disabled={!s.receiptImage}
                        style={{ marginRight: 10 }}
                      >
                        <MaterialCommunityIcons
                          name="file-image-outline"
                          size={22}
                          color={s.receiptImage ? theme.colors.primary : theme.colors.onSurfaceVariant + '50'}
                        />
                      </TouchableOpacity>
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.onSurface }}>
                          {s.fromParticipantName}
                        </Text>
                        <MaterialCommunityIcons name="arrow-right" size={14} color={theme.colors.onSurfaceVariant} />
                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.onSurface }}>
                          {s.toParticipantName}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.success }}>
                          ${s.amount.toFixed(2)}
                        </Text>
                        {s.paidAt && (
                          <Text style={{ fontSize: 11, color: theme.colors.onSurfaceVariant }}>
                            {t('summary.paidOn')} {new Date(s.paidAt).toLocaleDateString()}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          );
        })()}

      </Card>
      </View>

      {/* Consolidaciones Aplicadas - Solo mostrar cuando hay consolidaciones */}
      {consolidationAssignments.length > 0 && (
        <Card style={{ marginBottom: 16, marginHorizontal: 16, borderTopWidth: 4, borderTopColor: '#4CAF50', overflow: 'hidden' }}>
          <TouchableOpacity
            onPress={() => setIsConsolidationSectionExpanded(v => !v)}
            activeOpacity={0.7}
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: isConsolidationSectionExpanded ? 12 : 0, gap: 8 }}
          >
            <MaterialCommunityIcons name="link-variant" size={20} color="#4CAF50" />
            <Text style={[styles.sectionTitle, { marginBottom: 0, flex: 1 }]}>{t('consolidation.title')}</Text>
            <MaterialCommunityIcons
              name={isConsolidationSectionExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#2196F3"
            />
          </TouchableOpacity>

          {isConsolidationSectionExpanded && (
          <View style={{ paddingBottom: 8 }}>
            <Text style={{ 
              fontSize: 14, 
              color: theme.colors.onSurfaceVariant, 
              marginBottom: 12,
              lineHeight: 20,
              fontStyle: 'italic'
            }}>
              {t('consolidation.description')}
            </Text>
            
            {(() => {
              try {
                console.log('🔍 Debug consolidación - dbSettlements:', dbSettlements?.length, 'assignments:', consolidationAssignments?.length);
              
              // Agrupar consolidaciones por pagador
              const groupedByPayer = consolidationAssignments.reduce((acc, assignment) => {
                const payerId = assignment.payerId;
                if (!acc[payerId]) {
                  acc[payerId] = {
                    payerId: assignment.payerId,
                    payerName: assignment.payerName,
                    debtors: []
                  };
                }
                
                // Buscar el monto que el pagador paga por este deudor en los settlements de DB
                // Usar una búsqueda más segura con validación
                let totalDebtorAmount = 0;
                if (dbSettlements && Array.isArray(dbSettlements)) {
                  const debtorSettlements = dbSettlements.filter(s => 
                    s && s.fromParticipantId === assignment.debtorId && typeof s.amount === 'number'
                  );
                  totalDebtorAmount = debtorSettlements.reduce((sum, s) => sum + (s.amount || 0), 0);
                }
                
                acc[payerId].debtors.push({
                  debtorId: assignment.debtorId,
                  debtorName: assignment.debtorName,
                  amount: totalDebtorAmount
                });
                return acc;
              }, {} as Record<string, { payerId: string; payerName: string; debtors: { debtorId: string; debtorName: string; amount: number }[] }>);

              const togglePayerList = (payerId: string) => {
                const newExpanded = new Set(expandedPayerLists);
                if (newExpanded.has(payerId)) {
                  newExpanded.delete(payerId);
                } else {
                  newExpanded.add(payerId);
                }
                setExpandedPayerLists(newExpanded);
              };

              return Object.values(groupedByPayer).map((group) => {
                const typedGroup = group as {payerId: string, payerName: string, debtors: {debtorId: string, debtorName: string, amount: number}[]};
                const isExpanded = expandedPayerLists.has(typedGroup.payerId);
                const debtorCount = typedGroup.debtors.length;

                return (
                  <View
                    key={typedGroup.payerId}
                    style={{
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      backgroundColor: theme.colors.primaryContainer + '15',
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: theme.colors.primary + '20',
                      marginBottom: 10
                    }}
                  >
                    {/* Fila principal: nombre pagador + badge cantidad + chevron */}
                    <TouchableOpacity
                      onPress={() => togglePayerList(typedGroup.payerId)}
                      activeOpacity={0.7}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                    >
                      <Text style={{
                        fontSize: 16,
                        fontWeight: '700',
                        color: theme.colors.onSurface,
                        flex: 1,
                      }}>
                        {typedGroup.payerName}
                      </Text>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {/* Badge con cantidad de deudores */}
                        <View style={{
                          backgroundColor: theme.colors.primary + '20',
                          borderRadius: 12,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                        }}>
                          <Text style={{
                            fontSize: 12,
                            fontWeight: '700',
                            color: theme.colors.primary,
                          }}>
                            {debtorCount} {debtorCount === 1 ? t('consolidation.debtor') : t('consolidation.debtors')}
                          </Text>
                        </View>
                        <MaterialCommunityIcons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={18}
                          color={theme.colors.onSurfaceVariant}
                        />
                      </View>
                    </TouchableOpacity>

                    {/* Lista desplegable de deudores */}
                    {isExpanded && (
                      <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.primary + '20' }}>
                        {typedGroup.debtors.map((debtor: {debtorId: string, debtorName: string, amount: number}, index: number) => (
                          <View
                            key={debtor.debtorId}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              marginBottom: index < debtorCount - 1 ? 6 : 0,
                            }}
                          >
                            <Text style={{
                              fontSize: 14,
                              color: theme.colors.primary,
                              fontWeight: '700',
                              flex: 1,
                            }}>
                              • {debtor.debtorName}
                            </Text>
                            {debtor.amount > 0 && (
                              <Text style={{
                                fontSize: 14,
                                color: theme.colors.onSurfaceVariant,
                              }}>
                                ${formatCurrency(debtor.amount)}
                              </Text>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              });
              } catch (error) {
                console.error('❌ Error en consolidación UI:', error);
                return (
                  <View style={{ padding: 16 }}>
                    <Text style={{ color: theme.colors.error, textAlign: 'center' }}>
                      {t('eventDetail.errorConsolidationUI')}
                    </Text>
                  </View>
                );
              }
            })()}
            
            {/* Información adicional sobre el impacto - Desplegable */}
            {(() => {
              const originalCount = settlements.length;
              const consolidatedCount = consolidatedSettlements.length;
              const reductionCount = originalCount - consolidatedCount;
              
              if (reductionCount > 0) {
                return (
                  <View style={{ 
                    backgroundColor: theme.colors.successContainer + '25',
                    borderRadius: 12,
                    marginTop: 8,
                    borderWidth: 1,
                    borderColor: theme.colors.success + '40'
                  }}>
                    {/* Header clickeable */}
                    <TouchableOpacity 
                      onPress={() => setIsOptimizationExpanded(!isOptimizationExpanded)}
                      style={{
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: 14
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <MaterialCommunityIcons 
                          name="chart-line" 
                          size={18} 
                          color={theme.colors.success} 
                          style={{ marginRight: 8 }}
                        />
                        <Text style={{ 
                          fontSize: 14, 
                          fontWeight: '700', 
                          color: theme.colors.success 
                        }}>
                          {t('consolidation.optimization.title')}
                        </Text>
                      </View>
                      <MaterialCommunityIcons 
                        name={isOptimizationExpanded ? "chevron-up" : "chevron-down"} 
                        size={20} 
                        color={theme.colors.success}
                      />
                    </TouchableOpacity>
                    
                    {/* Contenido expandible */}
                    {isOptimizationExpanded && (
                      <View style={{ paddingHorizontal: 14, paddingBottom: 14 }}>
                        <Text style={{ 
                          fontSize: 13, 
                          color: theme.colors.onSuccessContainer,
                          lineHeight: 18,
                          marginBottom: 4
                        }}>
                          • <Text style={{ fontWeight: '600' }}>{t('consolidation.optimization.settlements')}</Text> {originalCount} → {consolidatedCount} 
                        </Text>
                        <Text style={{ 
                          fontSize: 12, 
                          color: theme.colors.onSuccessContainer,
                          lineHeight: 16,
                          fontStyle: 'italic'
                        }}>
                          {t('consolidation.optimization.eliminated', { 
                            count: reductionCount, 
                            plural: reductionCount !== 1 ? 's' : '' 
                          })}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              }
              return null;
            })()}
          </View>
          )}
        </Card>
      )}

      {/* Gastos por Participante */}
      {(() => {
        // Calcular gastos por participante (solo los que han pagado)
        const participantExpenses = eventParticipants.reduce((acc, participant) => {
          const participantExpenseTotal = eventExpenses
            .filter(expense => expense.payerId === participant.id)
            .reduce((sum, expense) => sum + expense.amount, 0);
          
          if (participantExpenseTotal > 0) {
            acc[participant.id] = {
              name: participant.name,
              total: participantExpenseTotal,
              percentage: (participantExpenseTotal / calculateTotalExpenses()) * 100
            };
          }
          return acc;
        }, {} as Record<string, {name: string, total: number, percentage: number}>);

        return Object.keys(participantExpenses).length > 0 && (
          <Card style={{ marginBottom: 16, marginHorizontal: 16, borderTopWidth: 4, borderTopColor: '#4CAF50', overflow: 'hidden' }}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              onPress={() => setIsParticipantStatsExpanded(v => !v)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="account-group" size={18} color="#4CAF50" />
              <Text style={[styles.sectionTitle, { marginBottom: 0, flex: 1 }]}>{t('expenses.byParticipant')}</Text>
              <MaterialCommunityIcons
                name={isParticipantStatsExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
            {isParticipantStatsExpanded && (
              <View style={{ marginTop: 12 }}>
            {Object.entries(participantExpenses)
              .sort(([,a], [,b]) => b.total - a.total)
              .map(([participantId, data]) => (
                <React.Fragment key={participantId}>
                  <View style={styles.categoryItem}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>
                      {data.name}
                    </Text>
                    <Text style={styles.categoryPercentage}>
                      {data.percentage.toFixed(1)}%
                    </Text>
                  </View>
                    <Text style={styles.categoryAmount}>
                      ${data.total.toFixed(2)} {event?.currency || 'USD'}
                    </Text>
                  </View>
                </React.Fragment>
              ))}
              </View>
            )}
          </Card>
        );
      })()}

      {/* Categorías de gastos */}
      {Object.keys(eventStats.categoryTotals).length > 0 && (
        <Card style={{ marginBottom: 16, marginHorizontal: 16, borderTopWidth: 4, borderTopColor: '#4CAF50', overflow: 'hidden' }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
            onPress={() => setIsCategoryStatsExpanded(v => !v)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="tag-outline" size={18} color="#4CAF50" />
            <Text style={[styles.sectionTitle, { marginBottom: 0, flex: 1 }]}>{t('expenses.byCategory')}</Text>
            <MaterialCommunityIcons
              name={isCategoryStatsExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
          {isCategoryStatsExpanded && (
            <View style={{ marginTop: 12 }}>
          {Object.entries(eventStats.categoryTotals).map(([category, total]) => (
            <React.Fragment key={category}>
              <View style={styles.categoryItem}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
                <Text style={styles.categoryPercentage}>
                  {((total / eventStats.totalExpenses) * 100).toFixed(1)}%
                </Text>
              </View>
                <Text style={styles.categoryAmount}>
                  ${total.toFixed(2)} {event?.currency || 'USD'}
                </Text>
              </View>
            </React.Fragment>
          ))}
            </View>
          )}
        </Card>
      )}


      </ScrollView>
    </View>
    );
  };

  const handleTogglePayment = async (paymentId: string, currentStatus: boolean) => {
    try {
      await updatePayment(paymentId, { isConfirmed: !currentStatus });
      await loadEventData();
    } catch (error) {
      showAlert({ type: 'error', title: t('common.error'), message: t('message.paymentStateError') });
    }
  };

  const handleAddReceiptToPayment = async (paymentId: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await updatePayment(paymentId, { receiptImage: result.assets[0].uri });
        await loadEventData();
        showAlert({ type: 'success', title: t('success'), message: t('message.receiptAddedSuccess') });
      }
    } catch (error) {
      showAlert({ type: 'error', title: t('error'), message: t('message.receiptAddedError') });
    }
  };

  const handleCreatePaymentsFromSettlements = async () => {
    if (settlements.length === 0) {
      showAlert({ type: 'error', title: t('message.noSettlements'), message: t('message.noSettlementsDesc') });
      return;
    }

    console.log(`💳 Creating ${settlements.length} payments from settlements...`);
    
    showAlert({ type: 'confirm', title: t('message.createPaymentsTitle'), message: t('eventDetail.createPaymentsDesc', { count: settlements.length, plural: settlements.length > 1 ? 's' : '' }), buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('message.create'),
          onPress: async () => {
            try {
              let createdCount = 0;
              for (const settlement of settlements) {
                const newPayment: Payment = {
                  id: `payment_${Date.now()}_${Math.random()}`,
                  eventId,
                  fromParticipantId: settlement.fromParticipantId,
                  toParticipantId: settlement.toParticipantId,
                  amount: settlement.amount,
                  date: new Date().toISOString(),
                  notes: t('message.paymentFromSettlement'),
                  isConfirmed: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                console.log(`💳 Creating payment ${createdCount + 1}/${settlements.length}:`, newPayment);
                await createPayment(newPayment);
                createdCount++;
              }
              console.log(`✅ Created ${createdCount} payments, reloading event data...`);
              await loadEventData();
              console.log(`✅ Event data reloaded`);
              showAlert({ type: 'success', title: t('common.success'), message: `${settlements.length} ${settlements.length > 1 ? t('message.paymentsCreatedPlural') : t('message.paymentsCreated')}` });
            } catch (error) {
              console.error('❌ Error creating payments from settlements:', error);
              showAlert({ type: 'error', title: t('common.error'), message: t('message.couldNotCreatePayments') });
            }
          }
        }
      ] });
  };

  const renderPagosTab = () => {
    const totalPending = eventPayments
      .filter(p => !p.isConfirmed)
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalPaid = eventPayments
      .filter(p => p.isConfirmed)
      .reduce((sum, p) => sum + p.amount, 0);

    return (
      <ScrollView style={styles.tabContent}>
        {/* Estadísticas de pagos */}
        <Card style={{ marginBottom: 16, marginHorizontal: 16 }}>
          <Text style={styles.sectionTitle}>{t('eventDetail.paymentsTitle')}</Text>
          <View style={styles.paymentStatsContainer}>
            <View style={styles.paymentStatItem}>
              <MaterialCommunityIcons name="clock-outline" size={32} color={theme.colors.warning} />
              <Text style={styles.paymentStatValue}>
                ${totalPending.toFixed(2)}
              </Text>
              <Text style={styles.paymentStatLabel}>{t('eventDetail.paymentsPending')}</Text>
            </View>
            <View style={styles.paymentStatItem}>
              <MaterialCommunityIcons name="check-circle" size={32} color={theme.colors.success} />
              <Text style={styles.paymentStatValue}>
                ${totalPaid.toFixed(2)}
              </Text>
              <Text style={styles.paymentStatLabel}>{t('eventDetail.paymentsPaid')}</Text>
            </View>
          </View>
        </Card>

        {/* Botón para crear pagos desde liquidaciones */}
        {settlements.length > 0 && (
          <Button
            title={t('eventDetail.createPaymentsButton', { count: settlements.length, plural: settlements.length > 1 ? 's' : '' })}
            onPress={handleCreatePaymentsFromSettlements}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Lista de pagos */}
        <Card>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              💸 {t('eventDetail.paymentsListTitle')} ({eventPayments.length})
            </Text>
          </View>

          {eventPayments.length > 0 ? (
            <View style={styles.paymentsContainer}>
              {eventPayments.map((payment) => {
                const fromParticipant = eventParticipants.find(p => p.id === payment.fromParticipantId);
                const toParticipant = eventParticipants.find(p => p.id === payment.toParticipantId);

                return (
                  <React.Fragment key={payment.id}>
                    <View style={styles.paymentItem}>
                    <View style={styles.paymentHeader}>
                      <View style={styles.paymentParticipants}>
                        <Text style={styles.paymentFromTo}>
                          {fromParticipant?.name} → {toParticipant?.name}
                        </Text>
                        <Text style={styles.paymentAmount}>
                          ${payment.amount.toFixed(2)} {event?.currency || 'USD'}
                        </Text>
                      </View>
                      <Switch
                        value={payment.isConfirmed || false}
                        onValueChange={() => handleTogglePayment(payment.id, payment.isConfirmed || false)}
                        trackColor={{ false: theme.colors.outline, true: theme.colors.success }}
                        thumbColor={payment.isConfirmed ? theme.colors.onPrimary : theme.colors.surfaceVariant}
                      />
                    </View>

                    <Text style={styles.paymentDate}>
                      📅 {new Date(payment.date).toLocaleDateString('es-ES')}
                    </Text>

                    {payment.notes && (
                      <Text style={styles.paymentNotes}>
                        📝 {payment.notes}
                      </Text>
                    )}

                    {/* Comprobante */}
                    <View style={styles.receiptSection}>
                      {payment.receiptImage ? (
                        <TouchableOpacity
                          style={styles.receiptThumbnailContainer}
                          onPress={() => {
                            setSelectedImage(payment.receiptImage!);
                            setShowImageModal(true);
                          }}
                        >
                          <Image
                            source={{ uri: payment.receiptImage }}
                            style={styles.receiptThumbnail}
                          />
                          <Text style={styles.receiptLabel}>{t('eventDetail.viewReceipt')}</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.addReceiptButton}
                          onPress={() => handleAddReceiptToPayment(payment.id)}
                        >
                          <MaterialCommunityIcons name="camera-plus" size={24} color={theme.colors.primary} />
                          <Text style={styles.addReceiptText}>{t('eventDetail.addReceipt')}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                  </React.Fragment>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="cash-multiple" 
                size={64} 
                color={theme.colors.outline} 
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyText}>{t('eventDetail.noPaymentsTitle')}</Text>
              <Text style={styles.emptySubtext}>
                {settlements.length > 0 
                  ? t('eventDetail.noPaymentsSubtitle1') 
                  : t('eventDetail.noPaymentsSubtitle2')}
              </Text>
            </View>
          )}
        </Card>
      </ScrollView>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'gastos':
        return renderGastosTab();
      case 'participantes':
        return renderParticipantesTab();
      case 'resumen':
        return renderResumenTab();
      default:
        return renderGastosTab();
    }
  };

  const handleEditEvent = () => {
    if (!event) return;
    (navigation as any).navigate('CreateEvent', { eventId: event.id, mode: 'edit' });
  };

  const handleDeleteEvent = () => {
    if (!event) return;
    showAlert({ type: 'destructive', title: t('events.deleteTitle'), message: t('events.deleteMessage', { name: event.name }), buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(event.id);
              showAlert({ type: 'success', title: t('common.success'), message: t('message.eventDeleted'), buttons: [{ text: 'OK', onPress: () => navigation.goBack() }] });
            } catch (error) {
              showAlert({ type: 'error', title: t('common.error'), message: t('message.eventDeletedError') });
            }
          }
        }
      ] });
  };

  const showEventOptions = () => {
    if (!event) return;
    showAlert({ type: 'destructive', title: t('events.optionsTitle'), message: t('events.optionsMessage', { name: event.name }), buttons: [
        {
          text: t('events.editEvent'),
          onPress: handleEditEvent
        },
        {
          text: t('events.deleteEvent'),
          onPress: handleDeleteEvent,
          style: 'destructive'
        },
        {
          text: t('common.cancel'),
          style: 'cancel'
        }
      ] });
  };

  if (!event && isInitialLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={theme.colors.error} />
          <Text style={styles.errorText}>{t('message.eventNotFound')}</Text>
          <Button
            title={t('common.back')}
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View ref={edHeaderRef} collapsable={false}>
        <HeaderBar
          title={event.name}
          titleAlignment="left"
          showBackButton={Platform.OS === 'web'}
          onLeftPress={Platform.OS === 'web' ? () => navigation.goBack() : undefined}
          showThemeToggle={true}
          showLanguageSelector={true}
          showHelp={true}
          showLogout={true}
          useDynamicColors={true}
          elevation={true}
          onHelpPress={() => { setActiveTab('resumen'); setEdTourStep(0); setEdTourVisible(true); }}
        />
      </View>
      
      <View style={[styles.safeContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {/* Tab Bar */}
        {renderTabBar()}

        {/* Tab Content */}
        {renderTabContent()}
      </View>

      {/* Tour guiado */}
      <TutorialOverlay
        visible={edTourVisible}
        steps={[
          { ref: edInfoRef,               titleKey: 'tour.eventdetail.info.title',           descKey: 'tour.eventdetail.info.desc',           popupPosition: 'below' },
          { ref: edEventActionsRef,       titleKey: 'tour.eventdetail.eventActions.title',   descKey: 'tour.eventdetail.eventActions.desc',   popupPosition: 'above' },
          { ref: edSettlementsRef,        titleKey: 'tour.eventdetail.settlements.title',    descKey: 'tour.eventdetail.settlements.desc',    popupPosition: 'center' },
          { ref: edParticipantActionsRef, titleKey: 'tour.eventdetail.participantActions.title', descKey: 'tour.eventdetail.participantActions.desc', popupPosition: 'below', onBeforeShow: () => setActiveTab('participantes'), delay: 350 },
          { ref: edParticipantsRef,       titleKey: 'tour.eventdetail.participants.title',   descKey: 'tour.eventdetail.participants.desc',   popupPosition: 'center' },
          { ref: edExpenseFiltersRef,     titleKey: 'tour.eventdetail.expenseFilters.title', descKey: 'tour.eventdetail.expenseFilters.desc', popupPosition: 'below', onBeforeShow: () => setActiveTab('gastos'), delay: 350 },
          { ref: edExpensesRef,           titleKey: 'tour.eventdetail.expensesList.title',   descKey: 'tour.eventdetail.expensesList.desc',   popupPosition: 'center' },
        ]}
        currentStep={edTourStep}
        onNext={handleEdTourNext}
        onPrev={handleEdTourPrev}
        onClose={handleEdTourClose}
      />

      {/* Add Participant Modal */}
      <AddParticipantModal
        visible={showAddParticipantModal}
        onClose={() => setShowAddParticipantModal(false)}
        onAddParticipant={handleAddParticipant}
        currentParticipants={eventParticipants}
        hasExpenses={eventExpenses.length > 0}
      />

      {/* Modal de Edición de Participante */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowEditModal(false);
          setEditingParticipant(null);
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom', 'left', 'right']}>
          <EditParticipantModalContent
            participant={editingParticipant}
            onSave={handleSaveEditedParticipant}
            onCancel={() => {
              setShowEditModal(false);
              setEditingParticipant(null);
            }}
          />
        </SafeAreaView>
      </Modal>

      {/* Modal de Detalle del Gasto */}
      <Modal
        visible={showExpenseDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowExpenseDetailModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom', 'left', 'right']}>
          <View style={{ flex: 1 }}>
            {/* Header genérico */}
            <HeaderBar 
              title={t('expenses.detailTitle')}
              titleAlignment="left"
              showBackButton={false}
              useDynamicColors={true}
              showLogo={true}
              isModal={true}
            />

            {selectedExpenseForDetail && (
              <ScrollView style={{ flex: 1 }}>
                <Card style={{ margin: 16 }}>
                  {/* 📝 Información General */}
                  <View style={styles.expenseDetailSection}>
                    <Text style={styles.expenseDetailTitle}>📝 {t('expenses.generalInfo')}</Text>
                    <View style={styles.expenseDetailRow}>
                      <Text style={styles.expenseDetailLabel}>{t('expenses.description')}:</Text>
                      <Text style={styles.expenseDetailValue}>{selectedExpenseForDetail.expense.description}</Text>
                    </View>
                    <View style={styles.expenseDetailRow}>
                      <Text style={styles.expenseDetailLabel}>{t('expenses.amount')}:</Text>
                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <Text style={[styles.expenseDetailValue, { color: theme.colors.success, fontWeight: '600' }]}>
                          ${selectedExpenseForDetail.expense.amount.toFixed(2)} {event?.currency || 'ARS'}
                        </Text>
                        {selectedExpenseForDetail.expense.originalAmount != null &&
                          selectedExpenseForDetail.expense.currency !== (event?.currency || 'ARS') && (
                          <View style={styles.conversionBadge}>
                            <MaterialCommunityIcons name="swap-horizontal" size={11} color={theme.colors.onSecondaryContainer} />
                            <Text style={styles.conversionBadgeText}>
                              {selectedExpenseForDetail.expense.currency} {selectedExpenseForDetail.expense.originalAmount.toFixed(2)} × {selectedExpenseForDetail.expense.conversionRate?.toFixed(4) ?? 1}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.expenseDetailRow}>
                      <Text style={styles.expenseDetailLabel}>{t('expenses.date')}:</Text>
                      <Text style={styles.expenseDetailValue}>
                        {new Date(selectedExpenseForDetail.expense.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.expenseDetailRow}>
                      <Text style={styles.expenseDetailLabel}>{t('expenses.category')}:</Text>
                      <Text style={styles.expenseDetailValue}>{selectedExpenseForDetail.expense.category || t('expenses.noCategory')}</Text>
                    </View>
                    {selectedExpenseForDetail.expense.payers && selectedExpenseForDetail.expense.payers.length > 1 ? (
                      <View style={styles.expenseDetailRow}>
                        <Text style={styles.expenseDetailLabel}>{t('expenses.paidBy')}:</Text>
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                          {selectedExpenseForDetail.expense.payers.map((payer: any) => (
                            <View key={payer.participantId} style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginBottom: 2 }}>
                              <Text style={[styles.expenseDetailValue, { marginBottom: 0 }]}>
                                {eventParticipants.find(p => p.id === payer.participantId)?.name || payer.participantName || '?'}
                              </Text>
                              <Text style={[styles.expenseDetailValue, { fontWeight: '700', marginBottom: 0 }]}>
                                ${payer.amount.toFixed(2)}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    ) : (
                      <View style={styles.expenseDetailRow}>
                        <Text style={styles.expenseDetailLabel}>{t('expenses.paidBy')}:</Text>
                        <Text style={styles.expenseDetailValue}>
                          {eventParticipants.find(p => p.id === selectedExpenseForDetail.expense.payerId)?.name || 'Usuario Demo'}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* ⛔ Participantes Excluidos */}
                  {selectedExpenseForDetail.excludedParticipants.length > 0 && (
                    <View style={styles.expenseDetailSection}>
                      <Text style={styles.expenseDetailTitle}>⛔ {t('expenses.excludedParticipants')}</Text>
                      <Text style={styles.expenseDetailValue}>
                        {selectedExpenseForDetail.excludedParticipants.map((p: any) => p.name).join(', ')}
                      </Text>
                    </View>
                  )}

                  {/* 📊 División del Gasto */}
                  <View style={styles.expenseDetailSection}>
                    <Text style={styles.expenseDetailTitle}>
                      📊 {t('expenses.expenseDivision')} ({selectedExpenseForDetail.splits.filter((s: any) => !eventParticipants.find(p => p.id === s.participantId && (p as any).parentParticipantId)).length} {t('expenses.participants')})
                    </Text>
                    {(() => {
                      const primaries = eventParticipants
                        .filter(p => !((p as any).parentParticipantId))
                        .sort((a, b) => a.name.localeCompare(b.name));
                      const sortedSplits: any[] = [];
                      primaries.forEach(primary => {
                        const ps = selectedExpenseForDetail.splits.find((s: any) => s.participantId === primary.id);
                        if (ps) sortedSplits.push(ps);
                        const secSplits = selectedExpenseForDetail.splits
                          .filter((s: any) => {
                            const p = eventParticipants.find(ep => ep.id === s.participantId);
                            return (p as any)?.parentParticipantId === primary.id;
                          })
                          .sort((a: any, b: any) => {
                            const pa = eventParticipants.find(ep => ep.id === a.participantId);
                            const pb = eventParticipants.find(ep => ep.id === b.participantId);
                            return (pa?.name || '').localeCompare(pb?.name || '');
                          });
                        sortedSplits.push(...secSplits);
                      });
                      return sortedSplits.map((split: any) => {
                      const participant = eventParticipants.find(p => p.id === split.participantId);
                      const isSecondary = !!(participant as any)?.parentParticipantId;
                      return (
                        <React.Fragment key={split.id}>
                          <View style={[styles.expenseDetailRow, isSecondary && { paddingLeft: 28 }]}>
                            <Text style={[styles.expenseDetailLabel, isSecondary && { color: theme.colors.secondary, fontSize: 13 }]}>
                              {isSecondary ? '↳' : '•'} {participant?.name}:
                            </Text>
                            <Text style={[styles.expenseDetailValue, isSecondary && { color: theme.colors.secondary, fontSize: 13 }]}>
                              ${split.amount.toFixed(2)}
                            </Text>
                          </View>
                        </React.Fragment>
                      );
                    });
                    })()
                    }
                  </View>

                  {/* 📷 Comprobante */}
                  {selectedExpenseForDetail.expense.receiptImage && (
                    <View style={styles.expenseDetailSection}>
                      <Text style={styles.expenseDetailTitle}>📷 {t('expenses.receipt')}</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedImage(selectedExpenseForDetail.expense.receiptImage);
                          setShowImageModal(true);
                        }}
                      >
                        <Image
                          source={{ uri: selectedExpenseForDetail.expense.receiptImage }}
                          style={styles.receiptPreview}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </Card>
              </ScrollView>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Modal de Visualización de Imagen */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.isDark ? 'rgba(0,0,0,0.95)' : 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: 40, right: 20, zIndex: 10 }}
            onPress={() => setShowImageModal(false)}
          >
            <View style={{ backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 8 }}>
              <MaterialCommunityIcons name="close" size={28} color={theme.colors.onPrimary} />
            </View>
          </TouchableOpacity>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={{ width: '90%', height: '80%' }}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* Modal de información del participante */}
      <Modal
        visible={participantInfoModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setParticipantInfoModalVisible(false);
          setSelectedParticipantForInfo(null);
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['bottom', 'left', 'right']}>
          <ParticipantInfoModalContent
            participant={selectedParticipantForInfo}
            onClose={() => {
              setParticipantInfoModalVisible(false);
              setSelectedParticipantForInfo(null);
            }}
            eventStats={eventStats}
            balance={selectedParticipantForInfo ? balancesById[selectedParticipantForInfo.id] || 0 : 0}
          />
        </SafeAreaView>
      </Modal>

      {/* Modal de Consolidación */}
      <ConsolidationModal
        visible={showConsolidationModal}
        onClose={() => setShowConsolidationModal(false)}
        settlements={consolidatedSettlements.length > 0 ? consolidatedSettlements : settlements}
        participants={eventParticipants}
        onConsolidationChange={handleConsolidationChange}
        currency={event?.currency || 'ARS'}
        existingAssignments={consolidationAssignments}
      />

      {/* ── Modal: cerrar evento con liquidaciones pendientes ── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showCloseWithPendingModal}
        onRequestClose={() => setShowCloseWithPendingModal(false)}
      >
        <View style={styles.closeWithPendingOverlay}>
          <View style={styles.closeWithPendingCard}>
            {/* Header */}
            <View style={styles.closeWithPendingHeader}>
              <MaterialCommunityIcons name="alert-circle-outline" size={26} color="#FF9800" />
              <Text style={styles.closeWithPendingTitle}>{t('message.closeWithPendingTitle')}</Text>
            </View>

            {/* Descripción */}
            <Text style={styles.closeWithPendingDesc}>
              {t('message.closeWithPendingDesc').replace('{count}', String(dbSettlements.filter((s: any) => !s.isPaid).length))}
            </Text>

            {/* Campo de comentario */}
            <Text style={styles.closeCommentLabel}>{t('message.closeCommentLabel')}</Text>
            <TextInput
              style={styles.closeCommentInput}
              value={closeComment}
              onChangeText={setCloseComment}
              placeholder={t('message.closeCommentPlaceholder')}
              placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
              multiline={true}
              numberOfLines={3}
            />

            {/* Botones */}
            <View style={styles.closeWithPendingFooter}>
              <TouchableOpacity
                style={styles.closeWithPendingCancelBtn}
                onPress={() => setShowCloseWithPendingModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.closeWithPendingCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeWithPendingConfirmBtn}
                onPress={confirmCloseWithPending}
                activeOpacity={0.7}
              >
                <Text style={styles.closeWithPendingConfirmText}>{t('message.closeConfirmButton')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal QR de Invitación ─────────────────────────────── */}
      <Modal
        visible={showQRModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: theme.colors.surface, borderRadius: 20, padding: 24, width: '100%', maxWidth: 360 }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 }}>
              <MaterialCommunityIcons name="qrcode" size={26} color="#4CAF50" />
              <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.onSurface, flex: 1 }}>
                {t('eventDetail.qrModalTitle')}
              </Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="close" size={22} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {/* Selector de permiso */}
            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.onSurfaceVariant, marginBottom: 10 }}>
              {t('eventDetail.qrPermissionLabel')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              <TouchableOpacity
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                  backgroundColor: qrPermission === 'editor' ? '#4CAF5020' : theme.colors.surfaceVariant,
                  borderWidth: 2, borderColor: qrPermission === 'editor' ? '#4CAF50' : 'transparent',
                }}
                onPress={() => setQrPermission('editor')}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="pencil" size={20} color={qrPermission === 'editor' ? '#4CAF50' : theme.colors.onSurfaceVariant} />
                <Text style={{ fontSize: 12, fontWeight: '700', marginTop: 4, color: qrPermission === 'editor' ? '#4CAF50' : theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                  {t('eventDetail.qrPermissionEdit')}
                </Text>
                <Text style={{ fontSize: 10, color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 2 }}>
                  {t('eventDetail.qrPermissionEditDesc')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                  backgroundColor: qrPermission === 'viewer' ? '#2196F320' : theme.colors.surfaceVariant,
                  borderWidth: 2, borderColor: qrPermission === 'viewer' ? '#2196F3' : 'transparent',
                }}
                onPress={() => setQrPermission('viewer')}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="eye" size={20} color={qrPermission === 'viewer' ? '#2196F3' : theme.colors.onSurfaceVariant} />
                <Text style={{ fontSize: 12, fontWeight: '700', marginTop: 4, color: qrPermission === 'viewer' ? '#2196F3' : theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                  {t('eventDetail.qrPermissionView')}
                </Text>
                <Text style={{ fontSize: 10, color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 2 }}>
                  {t('eventDetail.qrPermissionViewDesc')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* QR Code */}
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={{ padding: 16, backgroundColor: '#FFFFFF', borderRadius: 12 }}>
                <QRCodeView
                  value={(() => {
                    try {
                      const payload = {
                        v: 1,
                        role: qrPermission,
                        e: {
                          id: event?.id,
                          n: event?.name || '',
                          d: event?.description || '',
                          s: event?.startDate || '',
                          l: event?.location || '',
                          c: event?.currency || 'ARS',
                          cat: event?.category || 'evento',
                        },
                        p: eventParticipants.map(p => ({ id: p.id, n: p.name })),
                        ex: eventExpenses.map(e => ({
                          id: e.id, d: e.description, a: e.amount,
                          dt: e.date, c: e.currency, cat: e.category,
                          pid: e.payerId, pn: e.payerName,
                        })),
                        sp: eventSplits.map(s => ({
                          id: s.id, eid: s.expenseId,
                          pid: s.participantId, a: s.amount, t: s.type,
                        })),
                      };
                      const json = JSON.stringify(payload);
                      return 'splitsmart://join?data=' + btoa(unescape(encodeURIComponent(json)));
                    } catch {
                      return `splitsmart://join?eventId=${eventId}&role=${qrPermission}`;
                    }
                  })()}
                  size={180}
                  color="#1A1A1A"
                  backgroundColor="#FFFFFF"
                />
              </View>
              <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 12, lineHeight: 18 }}>
                {t('eventDetail.qrInstructions')}
              </Text>
            </View>

            {/* Compartir datos del evento */}
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.outline }}
              onPress={() => {
                try {
                  const payload = {
                    v: 1, role: qrPermission,
                    e: { id: event?.id, n: event?.name, d: event?.description, s: event?.startDate, l: event?.location, c: event?.currency, cat: event?.category },
                    p: eventParticipants.map(p => ({ id: p.id, n: p.name })),
                    ex: eventExpenses.map(e => ({ id: e.id, d: e.description, a: e.amount, dt: e.date, c: e.currency, cat: e.category, pid: e.payerId, pn: e.payerName })),
                    sp: eventSplits.map(s => ({ id: s.id, eid: s.expenseId, pid: s.participantId, a: s.amount, t: s.type })),
                  };
                  const encoded = 'splitsmart://join?data=' + btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
                  Clipboard.setString(encoded);
                  showAlert({ type: 'success', title: '✅', message: t('eventDetail.qrLinkCopied'), buttons: [{ text: 'OK' }] });
                } catch {
                  showAlert({ type: 'error', title: t('common.error'), message: 'No se pudo generar el enlace', buttons: [{ text: 'OK' }] });
                }
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="content-copy" size={18} color={theme.colors.onSurfaceVariant} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.onSurfaceVariant }}>
                {t('eventDetail.qrCopyLink')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// Componente interno para mostrar información completa del participante
const ParticipantInfoModalContent: React.FC<{
  participant: Participant | null;
  onClose: () => void;
  eventStats: any;
  balance: number;
}> = ({ participant, onClose, eventStats, balance }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  if (!participant) return null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <HeaderBar 
        title={t('participant.info')}
        titleAlignment="left"
        showBackButton={false}
        showLogo={true}
        useDynamicColors={true}
        isModal={true}
      />

      <ScrollView style={{ flex: 1, padding: 20, backgroundColor: theme.colors.background }}>
        <Card>
          {/* Avatar y nombre */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            {participant.avatar ? (
              <Avatar
                name={participant.name}
                image={participant.avatar}
                size="xlarge"
                style={{ marginBottom: 12 } as any}
              />
            ) : (
              <View style={[
                { 
                  width: 80, 
                  height: 80, 
                  borderRadius: 40, 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  marginBottom: 12 
                },
                { backgroundColor: participant.participantType === 'friend' ? theme.colors.success : theme.colors.warning }
              ]}>
                <MaterialCommunityIcons 
                  name={participant.participantType === 'friend' ? 'heart' : 'clock'} 
                  size={40} 
                  color={theme.colors.onSuccess} 
                />
              </View>
            )}
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.onSurface, textAlign: 'center' }}>
              {participant.name}
            </Text>
            <Text style={{ fontSize: 14, color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
              {participant.participantType === 'friend' ? `👤 ${t('participants.friendPermanent')}` : `⏰ ${t('participants.temporaryParticipant')}`}
            </Text>
          </View>

          {/* Balance */}
          <View style={{ 
            backgroundColor: theme.colors.surfaceVariant, 
            padding: 16, 
            borderRadius: 12, 
            marginBottom: 20,
            alignItems: 'center'
          }}>
            <Text style={{ fontSize: 16, color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>{t('participants.balance')}</Text>
            <Text style={[
              { fontSize: 28, fontWeight: 'bold' },
              {
                color: balance > 0.01 ? theme.colors.success : 
                       balance < -0.01 ? theme.colors.error : theme.colors.onSurfaceVariant
              }
            ]}>
              {balance > 0.01 ? `+$${balance.toFixed(2)}` :
               balance < -0.01 ? `-$${Math.abs(balance).toFixed(2)}` :
               '$0.00'}
            </Text>
            <Text style={{ fontSize: 14, color: theme.colors.onSurfaceVariant }}>
              {balance > 0.01 ? t('participants.owes') :
               balance < -0.01 ? t('participants.shouldPay') :
               t('participants.balanced')}
            </Text>
          </View>

          {/* Información de contacto */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.onSurface, marginBottom: 12 }}>{t('participants.contactInfo')}</Text>
            
            {participant.email && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialCommunityIcons name="email" size={20} color={theme.colors.primary} style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 16, color: theme.colors.onSurface }}>{participant.email}</Text>
              </View>
            )}
            
            {participant.phone && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialCommunityIcons name="phone" size={20} color={theme.colors.primary} style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 16, color: theme.colors.onSurface }}>{participant.phone}</Text>
              </View>
            )}
            
            {participant.alias_cbu && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialCommunityIcons name="credit-card" size={20} color={theme.colors.primary} style={{ marginRight: 12 }} />
                <Text style={{ fontSize: 16, color: theme.colors.onSurface }}>{participant.alias_cbu}</Text>
              </View>
            )}
            
            {!participant.email && !participant.phone && !participant.alias_cbu && (
              <Text style={{ fontSize: 14, color: theme.colors.onSurfaceVariant, fontStyle: 'italic' }}>
                {t('participants.noContactInfo')}
              </Text>
            )}
          </View>

          {/* Fechas */}
          <View>
            <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.onSurface, marginBottom: 12 }}>{t('participants.additionalInfo')}</Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <MaterialCommunityIcons name="calendar-plus" size={20} color={theme.colors.primary} style={{ marginRight: 12 }} />
              <View>
                <Text style={{ fontSize: 14, color: theme.colors.onSurfaceVariant }}>{t('participants.addedToEvent')}</Text>
                <Text style={{ fontSize: 16, color: theme.colors.onSurface }}>
                  {participant.createdAt ? new Date(participant.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Fecha no disponible'}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

// Componente interno para el modal de edición
const EditParticipantModalContent: React.FC<{
  participant: Participant | null;
  onSave: (name: string, email?: string, phone?: string, aliasCbu?: string, convertToFriend?: boolean) => void;
  onCancel: () => void;
}> = ({ participant, onSave, onCancel }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { participants } = useData();
  const [name, setName] = useState(participant?.name || '');
  const [email, setEmail] = useState(participant?.email || '');
  const [phone, setPhone] = useState(participant?.phone || '');
  const [aliasCbu, setAliasCbu] = useState(participant?.alias_cbu || '');
  const [convertToFriend, setConvertToFriend] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const duplicateFriend = convertToFriend
    ? participants.find(
        p => p.participantType === 'friend' &&
        p.name.trim().toLowerCase() === name.trim().toLowerCase()
      ) || null
    : null;

  useEffect(() => {
    if (participant) {
      setName(participant.name || '');
      setEmail(participant.email || '');
      setPhone(participant.phone || '');
      setAliasCbu(participant.alias_cbu || '');
      setConvertToFriend(false);
    }
  }, [participant]);

  if (!participant) return null;

  return (
    <View style={{ flex: 1 }}>
      <HeaderBar 
        title={t('eventDetail.editParticipantTitle')}
        titleAlignment="left"
        showBackButton={false}
        useDynamicColors={true}
      />

      <ScrollView style={{ flex: 1, padding: 20 }}>
        <Card>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6, color: submittedOnce && !name.trim() ? '#FF5252' : theme.colors.onSurface }}>
              {t('eventDetail.labelName')}<Text style={{ color: '#FF5252', fontWeight: '700' }}> *</Text>
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.outline,
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: theme.colors.onSurface
              }}
              placeholder={t('eventDetail.placeholderName')}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6, color: theme.colors.onSurface }}>{t('eventDetail.labelCbu')}</Text>
            <TextInput
              style={{
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.outline,
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: theme.colors.onSurface
              }}
              placeholder={t('eventDetail.placeholderCbu')}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={aliasCbu}
              onChangeText={setAliasCbu}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6, color: theme.colors.onSurface }}>{t('eventDetail.labelPhone')}</Text>
            <TextInput
              style={{
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.outline,
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16,
                color: theme.colors.onSurface
              }}
              placeholder={t('eventDetail.placeholderPhone')}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={phone}
              onChangeText={(text) => {
                const startsWithPlus = text.startsWith('+');
                let digits = text.replace(/\D/g, '');
                if (digits.length > 16) digits = digits.slice(0, 16);
                const filtered = startsWithPlus ? '+' + digits : digits;
                setPhone(filtered);
              }}
              keyboardType="phone-pad"
            />
          </View>

          {convertToFriend && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6, color: theme.colors.onSurface }}>{t('eventDetail.labelEmail')}</Text>
              <TextInput
                style={{
                  backgroundColor: theme.colors.surface,
                  borderWidth: 1,
                  borderColor: theme.colors.outline,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  fontSize: 16,
                  color: theme.colors.onSurface
                }}
                placeholder={t('eventDetail.placeholderEmail')}
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={email}
                onChangeText={(text) => setEmail(text.toLowerCase().replace(/\s/g, ''))}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          )}

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.colors.surfaceVariant,
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: convertToFriend ? theme.colors.primary : theme.colors.outline
            }}
            onPress={() => setConvertToFriend(!convertToFriend)}
          >
            <MaterialCommunityIcons
              name={convertToFriend ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={24}
              color={theme.colors.primary}
            />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.onSurface }}>
                {t('eventDetail.convertToFriendTitle')}
              </Text>
              <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                {t('eventDetail.convertToFriendSubtitle')}
              </Text>
            </View>
          </TouchableOpacity>

          {duplicateFriend && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              backgroundColor: '#FFF3E0',
              borderRadius: 8,
              padding: 12,
              marginBottom: 8,
              borderWidth: 1,
              borderColor: '#FF9800',
              gap: 8
            }}>
              <MaterialCommunityIcons name="alert-circle" size={20} color="#FF9800" style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontSize: 13, color: '#E65100', lineHeight: 18 }}>
                {t('eventDetail.duplicateFriendWarning', { name: duplicateFriend.name })}
              </Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: theme.colors.surfaceVariant,
                paddingVertical: 14,
                borderRadius: 8,
                alignItems: 'center'
              }}
              onPress={onCancel}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.onSurfaceVariant }}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: theme.colors.primary,
                paddingVertical: 14,
                borderRadius: 8,
                alignItems: 'center'
              }}
              onPress={() => {
                setSubmittedOnce(true);
                if (!name.trim()) return;
                if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
                  showAlert({ type: 'error', title: t('common.error'), message: t('eventDetail.error.emailInvalid') });
                  return;
                }
                onSave(name, email, phone, aliasCbu, convertToFriend);
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.onPrimary }}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

