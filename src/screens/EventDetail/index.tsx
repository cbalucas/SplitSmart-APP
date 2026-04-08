import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  Dimensions,
  Linking,
  Clipboard,
  Modal,
  TextInput,
  Image,
  Switch,
  BackHandler
} from 'react-native';
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
import AddParticipantModal from '../../components/AddParticipantModal';
import HeaderBar from '../../components/HeaderBar';
import SearchBar from '../../components/SearchBar';
import { LanguageSelector, ThemeToggle, SettlementItem, ConsolidationModal } from '../../components';
import { useCalculations } from '../../hooks/useCalculations';
import { databaseService } from '../../services/database';
import { ConsolidationService } from '../../services/ConsolidationService';
import * as ImagePicker from 'expo-image-picker';
import { createStyles } from './styles';

const { width } = Dimensions.get('window');

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
  const [eventExpenses, setEventExpenses] = useState<Expense[]>([]);
  const [eventParticipants, setEventParticipants] = useState<(Participant & { role: EventParticipant['role']; balance: number; joinedAt: string })[]>([]);
  const [eventSplits, setEventSplits] = useState<Split[]>([]);
  const [eventPayments, setEventPayments] = useState<Payment[]>([]);
  const [dbSettlements, setDbSettlements] = useState<Settlement[]>([]);
  const [activeTab, setActiveTab] = useState('resumen');
  const [showAddParticipantModal, setShowAddParticipantModal] = useState(false);

  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [settlementsSearchQuery, setSettlementsSearchQuery] = useState('');
  const [participantInfoModalVisible, setParticipantInfoModalVisible] = useState(false);
  const [selectedParticipantForInfo, setSelectedParticipantForInfo] = useState<Participant | null>(null);
  // Estados para selección múltiple de participantes
  const [isParticipantSelectMode, setIsParticipantSelectMode] = useState(false);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<Set<string>>(new Set());
  
  // Estados de filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [participantSearchQuery, setParticipantSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('todos');
  const [filterPayer, setFilterPayer] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description'>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isOptimizationExpanded, setIsOptimizationExpanded] = useState(false);
  const [showExpenseDetailModal, setShowExpenseDetailModal] = useState(false);
  const [selectedExpenseForDetail, setSelectedExpenseForDetail] = useState<any>(null);
  // Estado para manejar qué listas de pagadores están expandidas (inicia contraído por defecto)
  const [expandedPayerLists, setExpandedPayerLists] = useState<Set<string>>(new Set());

  // Estados para consolidación
  const [showConsolidationModal, setShowConsolidationModal] = useState(false);
  const [consolidationAssignments, setConsolidationAssignments] = useState<any[]>([]);
  const [showOriginalView, setShowOriginalView] = useState(false);
  const [consolidatedSettlements, setConsolidatedSettlements] = useState<any[]>([]);

  // Use calculations hook for balance and settlement calculations  
  const { balances, settlements, eventStats } = useCalculations(
    eventParticipants,
    eventExpenses,
    eventSplits,
    eventPayments, // Payments (para compatibilidad legacy)
    dbSettlements,
    (event?.status || 'active') as 'active' | 'completed' | 'archived'
  );

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

  const loadEventData = useCallback(async () => {
    if (!eventId) return;
    
    try {
      // Consultar el evento directamente desde la base de datos para obtener el estado más reciente
      const foundEvent = await databaseService.getEventById(eventId);
      setEvent(foundEvent);
      
      if (foundEvent) {
        // Load expenses, participants, splits, payments, settlements and consolidations from SQLite
        const [expensesData, participantsData, splitsData, paymentsData, settlementsData, consolidationData] = await Promise.all([
          getExpensesByEvent(eventId).catch(() => []), // Return empty array if fails
          getEventParticipants(eventId).catch(() => []), // Return empty array if fails
          getSplitsByEvent(eventId).catch(() => []), // Return empty array if fails
          getPaymentsByEvent(eventId).catch(() => []), // Return empty array if fails
          databaseService.getSettlementsByEvent(eventId).catch(() => []), // Return empty array if fails
          databaseService.getConsolidationAssignments(eventId).catch(() => []) // Return empty array if fails
        ]);
        
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
    }
  }, [eventId, getExpensesByEvent, getEventParticipants, getSplitsByEvent, getPaymentsByEvent]);

  // Sincronizar liquidaciones calculadas con la BD
  const syncSettlementsToDb = useCallback(async () => {
    if (!eventId || !event) {
      console.log('❌ Sync cancelled: missing eventId or event', { eventId, event: !!event });
      return;
    }
    if (event.status === 'archived') {
      console.log('❌ Sync cancelled: event is archived');
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
  }, [activeTab]);

  // Sincronizar liquidaciones cuando cambien los cálculos
  // Usar referencia para evitar bucles infinitos
  const previousSettlementsRef = useRef<string>('');
  useEffect(() => {
    if (!eventId || !event || event.status === 'archived' || event.status === 'completed') return;
    
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
                      event?.status === 'active';
    
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
    if (!eventId || !event || event.status !== 'active') return;
    
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

  // Refrescar datos cuando regresamos a la pantalla (ej: después de crear/editar gastos)
  useFocusEffect(
    useCallback(() => {
      console.log('🎯 EventDetail enfocado, refrescando datos...');
      loadEventData();
    }, [loadEventData])
  );

  const handleAddExpense = () => {
    if (event?.status !== 'active') {
      Alert.alert(t('message.eventNotEditable'), t('message.canOnlyAddExpensesActive'));
      return;
    }
    (navigation as any).navigate('CreateExpense', { eventId });
  };

  const handleEditExpense = (expense: Expense) => {
    if (event?.status !== 'active') {
      Alert.alert(t('message.eventNotEditable'), t('message.canOnlyEditExpensesActive'));
      return;
    }
    (navigation as any).navigate('CreateExpense', { 
      eventId,
      expenseId: expense.id,
      isEditing: true 
    });
  };

  const handleDeleteExpense = (expense: Expense) => {
    if (event?.status !== 'active') {
      Alert.alert(t('message.eventNotEditable'), t('message.canOnlyDeleteExpensesActive'));
      return;
    }
    Alert.alert(
      t('message.deleteExpenseTitle'),
      t('message.deleteExpenseMessage', { name: expense.description }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(expense.id);
              Alert.alert(t('common.success'), t('message.expenseDeletedSuccess'));
            } catch (error) {
              Alert.alert(t('common.error'), t('message.expenseDeletedError'));
            }
          },
        },
      ]
    );
  };

  const handleEditParticipant = (participant: Participant) => {
    if (event?.status !== 'active') {
      Alert.alert(t('message.eventNotEditable'), t('message.canOnlyEditParticipantsActive'));
      return;
    }
    if (participant.participantType === 'temporary') {
      setEditingParticipant(participant);
      setShowEditModal(true);
    } else if (participant.participantType === 'friend') {
      Alert.alert(
        t('message.editFriendTitle'),
        `"${participant.name}" ${t('message.editFriendMessage')}`,
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('message.goToFriends'), onPress: () => (navigation as any).navigate('ManageFriends') }
        ]
      );
    }
  };

  const handleSaveEditedParticipant = async (name: string, email?: string, phone?: string, aliasCbu?: string, convertToFriend?: boolean) => {
    if (!editingParticipant || !name.trim()) {
      Alert.alert(t('common.error'), t('message.nameRequired'));
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
        Alert.alert(
          t('eventDetail.convertDuplicateTitle'),
          t('eventDetail.convertDuplicateMessage', { name: existingFriend.name }),
          [
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
                  Alert.alert('✅', t('eventDetail.replacedSuccess', { name: existingFriend.name }));
                } catch {
                  Alert.alert(t('common.error'), t('message.participantUpdatedError'));
                }
              }
            }
          ]
        );
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
        Alert.alert(`✅ ${t('message.convertedToFriend')}`, `${name} ${t('message.nowPermanentFriend')}`);
      } else {
        Alert.alert(`✅ ${t('message.updated')}`, t('message.participantUpdatedSuccess'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('message.participantUpdatedError'));
    }
  };

  const handleRemoveParticipant = (participant: any) => {
    if (event?.status !== 'active') {
      Alert.alert(t('message.eventNotEditable'), t('message.canOnlyDeleteParticipantsActive'));
      return;
    }
    Alert.alert(
      t('message.removeParticipantTitle'),
      t('message.removeParticipantMessage', { name: participant.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await removeParticipantFromEvent(event?.id || '', participant.id);
              await loadEventData();
              Alert.alert(t('common.success'), t('message.participantDeletedSuccess'));
            } catch (error: any) {
              console.error('Error removing participant:', error);
              Alert.alert(t('common.error'), error.message || t('message.participantDeletedError'));
            }
          },
        },
      ]
    );
  };

  const handleRemoveSelectedParticipants = () => {
    if (selectedParticipantIds.size === 0) return;
    const count = selectedParticipantIds.size;
    Alert.alert(
      t('message.removeParticipantTitle'),
      t('participants.confirmDeleteSelected', { count, plural: count !== 1 ? 's' : '' }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              for (const participantId of selectedParticipantIds) {
                await removeParticipantFromEvent(event?.id || '', participantId);
              }
              await loadEventData();
              setIsParticipantSelectMode(false);
              setSelectedParticipantIds(new Set());
              setParticipantSearchQuery('');
              Alert.alert(
                t('common.success'),
                t('participants.deletedSelected', { count, plural: count !== 1 ? 's' : '' })
              );
            } catch (error: any) {
              console.error('Error removing participants:', error);
              Alert.alert(t('common.error'), error.message || t('message.participantDeletedError'));
            }
          },
        },
      ]
    );
  };

  // Settlement handlers - SIMPLIFICADO
  const handleToggleSettlementPaid = async (settlementId: string, isPaid: boolean) => {
    // Solo permitir marcar pagos en estado COMPLETADO
    if (event?.status !== 'completed') {
      Alert.alert(t('message.actionNotAllowed'), t('message.onlyMarkPaymentsCompleted'));
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
          Alert.alert(t('common.error'), t('message.consolidationNotFound'));
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
            Alert.alert(t('common.error'), t('message.consolidationOriginalNotFound'));
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
      // Si se desmarca un pago, mostrar advertencia
      if (!isPaid) {
        Alert.alert(
          t('message.unmarkPaymentTitle'),
          t('message.unmarkPaymentMessage'),
          [
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
          ]
        );
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
      Alert.alert(t('common.error'), t('message.paymentStateError'));
    }
  };

  const handleUpdateSettlementReceipt = async (settlementId: string, imageUri: string | null) => {
    // Solo permitir agregar comprobantes en estado COMPLETADO
    if (event?.status !== 'completed') {
      Alert.alert(t('message.actionNotAllowed'), t('message.onlyReceiptsCompleted'));
      return;
    }

    try {
      await databaseService.updateSettlement(settlementId, {
        receiptImage: imageUri
      });
      await loadEventData();
      Alert.alert('✅', imageUri ? t('message.receiptAdded') : t('message.receiptRemoved'));
    } catch (error) {
      console.error('Error updating settlement receipt:', error);
      Alert.alert(t('common.error'), t('message.receiptError'));
    }
  };

  const handleCompleteEvent = useCallback(async () => {
    if (!event) return;

    Alert.alert(
      `✅ ${t('message.markAsComplete')}`,
      t('message.markAsCompleteDesc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('message.markComplete'),
          onPress: async () => {
            try {
              // 1. Forzar sincronización de liquidaciones antes de completar
              console.log('🔄 Sincronizando liquidaciones antes de completar evento...');
              await syncSettlementsToDb();
              
              // 2. Actualizar estado del evento a completado
              await updateEvent(eventId, {
                status: 'completed',
                completedAt: new Date().toISOString()
              });
              
              // 3. Actualizar estado de todas las liquidaciones a completado
              await databaseService.updateSettlementsEventStatus(eventId, 'completed');
              
              // 4. Recargar datos para reflejar el cambio
              await loadEventData();
              
              Alert.alert(`✅ ${t('message.eventCompleted')}`, t('message.eventCompletedDesc'));
            } catch (error) {
              console.error('Error completing event:', error);
              Alert.alert(t('common.error'), t('message.eventCompletedError'));
            }
          }
        }
      ]
    );
  }, [event, eventId, t, updateEvent, loadEventData, syncSettlementsToDb]);

  const handleReactivateEvent = useCallback(async (targetStatus: 'active' | 'completed' = 'active') => {
    if (!event) return;

    const isGoingToActive = targetStatus === 'active';
    const isFromArchived = event?.status === 'archived';
    
    let title, message, buttonText, successTitle, successMessage;
    
    if (isGoingToActive && isFromArchived) {
      // ARCHIVADO → ACTIVO: Advertencia sobre eliminación de pagos
      title = `⚠️ ${t('message.reactivateEvent')}`;
      message = t('message.reactivateWarningMessage');
      buttonText = t('events.reactivate');
      successTitle = `✅ ${t('message.eventReactivated')}`;
      successMessage = t('message.reactivatedClearedPayments');
    } else if (isGoingToActive) {
      // COMPLETADO → ACTIVO: Reactivación normal
      title = `🔓 ${t('message.reactivateEvent')}`;
      message = t('message.reactivateEventDesc');
      buttonText = t('events.reactivate');
      successTitle = `✅ ${t('message.eventReactivated')}`;
      successMessage = t('message.eventActiveAgain');
    } else {
      // Otros casos (completar)
      title = `✅ ${t('message.markAsComplete')}`;
      message = t('message.markAsCompleteShort');
      buttonText = t('events.complete');
      successTitle = `✅ ${t('message.eventCompleted')}`;
      successMessage = t('message.eventCompletedShort');
    }

    Alert.alert(
      title,
      message,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: buttonText,
          onPress: async () => {
            try {
              // Si va de ARCHIVADO → ACTIVO, resetear pagos
              if (isGoingToActive && isFromArchived) {
                await databaseService.resetSettlementsPayments(eventId);
              }
              
              // Actualizar estado del evento
              await updateEvent(eventId, {
                status: targetStatus,
                completedAt: targetStatus === 'completed' ? new Date().toISOString() : undefined
              });
              
              // Actualizar estado de liquidaciones
              await databaseService.updateSettlementsEventStatus(eventId, targetStatus);
              
              await loadEventData();
              Alert.alert(successTitle, successMessage);
            } catch (error) {
              console.error(`Error changing event to ${targetStatus}:`, error);
              Alert.alert(t('common.error'), t('message.eventStateChangeError'));
            }
          }
        }
      ]
    );
  }, [event, eventId, t, updateEvent, loadEventData]);

  const handleArchiveEvent = useCallback(async () => {
    if (!event) return;

    Alert.alert(
      `📁 ${t('message.archiveEvent')}`,
      t('message.archiveEventDesc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.archive'),
          onPress: async () => {
            try {
              await updateEvent(eventId, {
                status: 'archived'
              });
              
              // Actualizar estado de liquidaciones a archivado
              await databaseService.updateSettlementsEventStatus(eventId, 'archived');
              
              Alert.alert(`✅ ${t('message.eventArchived')}`, t('message.eventArchivedDesc'));
              navigation.goBack();
            } catch (error) {
              console.error('Error archiving event:', error);
              Alert.alert(t('common.error'), t('message.eventArchivedError'));
            }
          }
        }
      ]
    );
  }, [event, eventId, updateEvent, navigation, t]);

  const handleShareSummary = () => {
    if (!event) return;

    const totalAmount = calculateTotalExpenses();
    const participantCount = eventParticipants.length;
    
    // Usar los settlements que se están mostrando actualmente (originales o consolidados)
    const currentSettlements = getDisplaySettlements();
    
    let message = `📊 *${t('eventDetail.shareSummaryLabel')} - ${event.name}*\n`;
    message += `━━━━━━━━━━━━━━━━━━\n`;
    
    // Agregar advertencia si el evento está activo
    if (event.status === 'active') {
      message += `${t('eventDetail.shareWarning')}\n`;
      message += `━━━━━━━━━━━━━━━━━━\n`;
    }
    
    message += `💰 *Total gastado:* ${event.currency} $${totalAmount.toFixed(2)}\n`;
    message += `👥 *${t('eventDetail.shareParticipantsLabel')}:* ${participantCount}\n`;
    message += `━━━━━━━━━━━━━━━━━━\n`;
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
        message += `💳 *${cbuAlias}*\n`;
        (settlementsForRecipient as Settlement[]).forEach((settlement: Settlement) => {
          const paymentStatus = settlement.isPaid ? ' ✅' : ' ⏳';
          const receiptIcon = settlement.receiptImage ? ' 📎' : '';
          message += `  • ${settlement.fromParticipantName}: $${formatCurrency(settlement.amount)}${paymentStatus}${receiptIcon}\n`;
        });
        if (index < recipientEntries.length - 1) {
          message += `\n`; // línea en blanco solo entre grupos, no después del último
        }
      });
      message += `━━━━━━━━━━━━━━━━━━\n`;
    } else {
      message += `${t('eventDetail.shareSettled')}\n`;
      message += `━━━━━━━━━━━━━━━━━━\n`;
    }

    // Mostrar información de consolidación después de las liquidaciones
    if (consolidationAssignments.length > 0 && !showOriginalView) {
      message += `🔄 *${t('eventDetail.shareConsolidatedView')}*\n\n`;
      
      // Mostrar quién paga por quién
      message += `👤 *${t('eventDetail.shareAssignments')}*\n`;
      consolidationAssignments.forEach(assignment => {
        message += `• ${assignment.payerName} ${t('eventDetail.sharePaysWith')} ${assignment.debtorName}\n`;
      });
      message += `━━━━━━━━━━━━━━━━━━\n`;
    }

    message += `\n*Realizado con SplitSmart.*\n_Descarga tu app_`;

    // Enviar directamente a WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `whatsapp://send?text=${encodedMessage}`;

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          // Si WhatsApp no está disponible, copiar al portapapeles como fallback
          Clipboard.setString(message);
          Alert.alert(
            t('message.whatsappNotAvailable'), 
            `${t('summary.title')} ${t('message.copiedToClipboard')}`,
            [{ text: t('ok') }]
          );
        }
      })
      .catch((err) => {
        console.error('Error opening WhatsApp:', err);
        // Si hay error, copiar al portapapeles como fallback
        Clipboard.setString(message);
        Alert.alert(
          t('message.whatsappError'),
          `${t('summary.title')} ${t('message.copiedToClipboard')}`,
          [{ text: t('ok') }]
        );
      });
  };

  const handleShareEvent = () => {
    if (!event) return;

    const totalAmount = calculateTotalExpenses();
    
    // Usar los settlements que se están mostrando actualmente (originales o consolidados)
    const currentSettlements = getDisplaySettlements();
    
    let message = `🎉 ${t('eventDetail.shareSummaryLabel')} - ${event.name.toUpperCase()}\n`;
    message += `━━━━━━━━━━━━━━━━━━\n`;
    
    // Agregar advertencia si el evento está activo
    if (event.status === 'active') {
      message += `${t('eventDetail.shareWarning')}\n\n`;
    }
    
    message += `📅 ${new Date(event.startDate).toLocaleDateString('es-AR')}\n`;
    message += `💵 $${formatCurrency(totalAmount)} ${event.currency}\n`;
    message += `📊 ${t('eventDetail.shareStatusLabel')} ${event.status === 'active' ? t('events.active') : event.status === 'completed' ? t('events.completed') : t('events.archived')}\n`;
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `👥 ${t('eventDetail.shareParticipantsLabel')} (${eventParticipants.length}):\n`;
    eventParticipants.forEach((p) => {
      message += `* ${p.name}\n`;
    });
    message += `━━━━━━━━━━━━━━━━━━\n`;
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
        message += `💳 *${cbuAlias}*\n`;
        (settlementsForRecipient as Settlement[]).forEach((settlement: Settlement) => {
          const paymentStatus = settlement.isPaid ? ' ✅' : ' ⏳';
          const receiptIcon = settlement.receiptImage ? ' 📎' : '';
          message += `  • ${settlement.fromParticipantName}: $${formatCurrency(settlement.amount)}${paymentStatus}${receiptIcon}\n`;
        });
        if (index < recipientEntries2.length - 1) {
          message += `\n`; // línea en blanco solo entre grupos
        }
      });
      message += `━━━━━━━━━━━━━━━━━━\n`;
    } else {
      message += `${t('eventDetail.shareSettled')}\n`;
      message += `━━━━━━━━━━━━━━━━━━\n`;
    }
    
    // Mostrar información de consolidación después de las liquidaciones
    if (consolidationAssignments.length > 0 && !showOriginalView) {
      message += `🔄 ${t('eventDetail.shareConsolidatedView')}\n\n`;
      
      // Mostrar quién paga por quién
      message += `👤 ${t('eventDetail.shareAssignments')}\n`;
      consolidationAssignments.forEach(assignment => {
        message += `• ${assignment.payerName} ${t('eventDetail.sharePaysWith')} ${assignment.debtorName}\n`;
      });
      message += `━━━━━━━━━━━━━━━━━━\n`;
    }
    
    message += `📝 ${t('eventDetail.shareExpensesLabel')} (${eventExpenses.length}):\n`;
    
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
      });
      
      message += `💵 ${t('eventDetail.shareTotal')} $${formatCurrency(totalAmount)}\n`;
      message += `━━━━━━━━━━━━━━━━━━\n`;
    } else {
      message += `${t('eventDetail.shareNoExpenses')}\n`;
    }

    message += `\n*Realizado con SplitSmart.*\n_Descarga tu app_`;

    // Enviar directamente a WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `whatsapp://send?text=${encodedMessage}`;

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          // Si WhatsApp no está disponible, copiar al portapapeles como fallback
          Clipboard.setString(message);
          Alert.alert(
            t('message.whatsappNotAvailable'),
            `${t('events.title')} ${t('message.copiedToClipboard')}`,
            [{ text: t('ok') }]
          );
        }
      })
      .catch((err) => {
        console.error('Error opening WhatsApp:', err);
        // Si hay error, copiar al portapapeles como fallback
        Clipboard.setString(message);
        Alert.alert(
          t('message.whatsappError'),
          `${t('events.title')} ${t('message.copiedToClipboard')}`,
          [{ text: t('ok') }]
        );
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
        
        Alert.alert(
          t('eventDetail.consolidationForgivenTitle'),
          t('eventDetail.consolidationForgivenMsg', {
            original: settlements.length,
            consolidated: consolidated.length,
            forgiven: forgivenPayments,
            totalOriginal: totalOriginal.toLocaleString(),
            totalFinal: totalConsolidated.toLocaleString(),
            forgivenAmount: forgivenAmount.toLocaleString()
          }),
          [{ text: t('eventDetail.consolidationOk'), style: 'default' }]
        );
      } else {
        Alert.alert(
          t('eventDetail.consolidationAppliedTitle'),
          t('eventDetail.consolidationAppliedMsg', {
            assignments: assignments.length,
            results: consolidated.length
          }),
          [{ text: t('eventDetail.consolidationOk'), style: 'default' }]
        );
      }
      
      console.log('✅ Consolidación guardada exitosamente en la base de datos');
    } catch (error) {
      console.error('❌ Error guardando consolidación:', error);
      Alert.alert(
        t('common.error'),
        t('eventDetail.consolidationError'),
        [{ text: t('ok'), style: 'default' }]
      );
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
    Alert.alert(
      t('message.clearConsolidationsTitle'),
      t('message.clearConsolidationsMessage'),
      [
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
              
              Alert.alert(
                t('message.consolidationsClearedTitle'),
                t('message.consolidationsClearedMessage'),
                [{ text: 'OK', style: 'default' }]
              );
              
              console.log('✅ Consolidaciones eliminadas de la base de datos');
            } catch (error) {
              console.error('❌ Error limpiando consolidaciones:', error);
              Alert.alert(
                t('common.error'),
                t('message.consolidationsClearError'),
                [{ text: 'OK', style: 'default' }]
              );
            }
          }
        }
      ]
    );
  };

  // =====================================================

  const handleAddExpenseOld = () => {
    Alert.prompt(
      '💸 Agregar Gasto',
      t('message.enterExpenseDescription'),
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Siguiente',
          onPress: (description?: string) => {
            if (description && description.trim()) {
              Alert.prompt(
                '💰 Monto',
                'Ingresa el monto gastado:',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Agregar',
                    onPress: async (amount?: string) => {
                      if (amount && !isNaN(parseFloat(amount))) {
                        const newExpense: Expense = {
                          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                          eventId,
                          description: description.trim(),
                          amount: parseFloat(amount),
                          date: new Date().toISOString(),
                          currency: event?.currency || 'USD',
                          category: 'general',
                          payerId: user?.id || 'demo'
                        };
                        
                        await addExpense(newExpense);
                        loadEventData();
                        
                        Alert.alert(`✅ ${t('message.expenseAdded')}`, t('message.expenseAddedDesc'));
                      }
                    }
                  }
                ]
              );
            }
          }
        }
      ]
    );
  };

  const handleAddParticipant = async (input: Participant | Participant[]) => {
    const list = Array.isArray(input) ? input : [input];

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
        Alert.alert(
          `✅ ${t('message.participantAdded')}`,
          `${list[0].name} ${t('message.participantAddedDesc')}`
        );
      } else {
        Alert.alert(
          `✅ ${t('message.participantAdded')}`,
          t('addParticipant.alert.participantsAddedMessage', {
            count: list.length,
            plural: list.length !== 1 ? 's' : ''
          })
        );
      }
    } catch (error: any) {
      console.error('Error adding participant(s):', error);
      Alert.alert(t('error'), error.message || t('message.participantAddedError'));
    }
  };

  const calculateTotalExpenses = () => {
    return eventStats.totalExpenses || 0;
  };

  const calculatePerPersonAmount = () => {
    return eventStats.averagePerPerson || 0;
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {[
        { key: 'resumen', title: t('summary.title'), icon: 'chart-pie' as const },
        { key: 'participantes', title: t('participants.title'), icon: 'account-group' as const },
        { key: 'gastos', title: t('expenses.title'), icon: 'cash' as const }
      ].map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tabItem,
            activeTab === tab.key && styles.activeTabItem
          ]}
          onPress={() => setActiveTab(tab.key)}
        >
          <MaterialCommunityIcons
            name={tab.icon}
            size={20}
            color={activeTab === tab.key ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
          <Text style={[
            styles.tabText,
            activeTab === tab.key && styles.activeTabText
          ]}>
            {tab.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

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
    
    return (
      <View style={styles.tabContent}>
        {/* Barra de búsqueda simple */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('expenses.search')}
            showClearButton={true}
            onClear={() => setSearchQuery('')}
          />
          

          
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              💸 {t('expenses.title')} ({filteredExpenses.length}{filteredExpenses.length !== eventExpenses.length ? ` de ${eventExpenses.length}` : ''})
            </Text>
            {event?.status === 'active' && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddExpense}
              >
                <MaterialCommunityIcons name="plus" size={16} color={theme.colors.onPrimary} />
                <Text style={styles.addButtonText}>{t('add')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>


        <ScrollView style={{ flex: 1 }}>
          <Card>
            {filteredExpenses.length === 0 && eventExpenses.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="receipt" size={48} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.emptyText}>{t('expenses.noExpenses')}</Text>
                <Text style={styles.emptySubtext}>{t('expenses.noExpensesDesc')}</Text>
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
              
              return (
                <TouchableOpacity
                  style={styles.expenseItem}
                  onPress={() => {
                    setSelectedExpenseForDetail({ 
                      expense: item, 
                      splits: expenseSplits, 
                      excludedParticipants 
                    });
                    setShowExpenseDetailModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  {/* Primera fila: Descripción | Monto + Icono */}
                  <View style={styles.expenseFirstRow}>
                    <Text style={styles.expenseDescription}>{item.description}</Text>
                    <View style={styles.expenseRightSection}>
                      <Text style={styles.expenseAmount}>
                        ${item.amount.toFixed(2)} {item.currency}
                      </Text>
                      {/* Icono de comprobante */}
                      {item.receiptImage && (
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
                  <View style={styles.expenseSecondRow}>
                    <Text style={styles.expensePaidBy}>
                      {t('expenses.paidBy')}: {eventParticipants.find(p => p.id === item.payerId)?.name || 'Usuario Demo'}
                    </Text>
                    <Text style={styles.expenseDate}>
                      {new Date(item.date).toLocaleDateString()}
                    </Text>
                  </View>
                  
                  {/* Tercera fila: División | Acciones */}
                  <View style={styles.expenseThirdRow}>
                    <Text style={styles.expenseDivisionSummary}>
                      {t('expenses.division')} ({expenseSplits.length} part | {excludedParticipants.length} exc)
                    </Text>
                    
                    {/* Acciones a la derecha */}
                    {event?.status === 'active' && (
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
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDeleteExpense(item);
                          }}
                        >
                          <MaterialCommunityIcons name="delete" size={16} color={theme.colors.error} />
                          <Text style={[styles.actionText, { color: theme.colors.error }]}>{t('expenses.delete')}</Text>
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
    );
  };

  const renderParticipantesTab = () => {
    // Filtrar solo participantes amigos o temporarios de este evento
    let visibleParticipants = eventParticipants.filter(p => 
      p.participantType === 'friend' || 
      (p.participantType === 'temporary' && p.isActive)
    );

    // Filtrar por búsqueda de participantes
    if (participantSearchQuery.trim()) {
      visibleParticipants = visibleParticipants.filter(participant =>
        participant.name.toLowerCase().includes(participantSearchQuery.toLowerCase()) ||
        (participant.email && participant.email.toLowerCase().includes(participantSearchQuery.toLowerCase())) ||
        (participant.alias_cbu && participant.alias_cbu.toLowerCase().includes(participantSearchQuery.toLowerCase()))
      );
    }

    // Mapa de condonaciones para ajustar balances de participantes
    const assignmentMap: { [debtorId: string]: string } = {};
    consolidationAssignments.forEach((a: any) => {
      assignmentMap[a.debtorId] = a.payerId;
    });

    return (
      <View style={styles.tabContent}>
        <View style={{ paddingHorizontal: 16 }}>
          {/* Barra de búsqueda de participantes */}
          <SearchBar
            value={participantSearchQuery}
            onChangeText={setParticipantSearchQuery}
            placeholder={t('participants.search')}
            showClearButton={true}
            onClear={() => setParticipantSearchQuery('')}
          />
        </View>

        {/* Barra de acciones fija */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 8,
          backgroundColor: theme.colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.outline + '30',
        }}>
          {isParticipantSelectMode ? (
            <>
              <Text style={styles.sectionTitle}>
                {t('participants.selectedCount', {
                  count: selectedParticipantIds.size,
                  plural: selectedParticipantIds.size !== 1 ? 's' : ''
                })}
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {selectedParticipantIds.size > 0 && (
                  <TouchableOpacity
                    style={{ backgroundColor: theme.colors.error, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
                    onPress={handleRemoveSelectedParticipants}
                  >
                    <MaterialCommunityIcons name="delete" size={16} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{t('common.delete')}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={{ backgroundColor: theme.colors.outline + '30', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
                  onPress={() => { setIsParticipantSelectMode(false); setSelectedParticipantIds(new Set()); }}
                >
                  <Text style={{ color: theme.colors.onSurface, fontWeight: '600', fontSize: 14 }}>{t('participants.cancelSelect')}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>
                👥 {t('participants.title')} ({visibleParticipants.length}{visibleParticipants.length !== eventParticipants.length ? ` de ${eventParticipants.length}` : ''})
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {event?.status === 'active' && (
                  <TouchableOpacity
                    style={{ backgroundColor: theme.colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
                    onPress={() => setShowAddParticipantModal(true)}
                  >
                    <MaterialCommunityIcons name="plus" size={16} color={theme.colors.onPrimary} style={{ marginRight: 6 }} />
                    <Text style={{ color: theme.colors.onPrimary, fontWeight: '600', fontSize: 14 }}>{t('common.add')}</Text>
                  </TouchableOpacity>
                )}
                {event?.status === 'active' && visibleParticipants.length > 1 && (
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

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <Card style={{ marginHorizontal: 16, marginTop: 8, marginBottom: 16 }}>

          {visibleParticipants.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-group" size={48} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.emptyText}>{t('participants.noParticipants')}</Text>
              <Text style={styles.emptySubtext}>{t('participants.noParticipantsDesc')}</Text>
            </View>
          ) : (
            visibleParticipants.map(participant => {
            // Calcular directamente desde eventExpenses y eventSplits para garantizar datos frescos
            const totalPaid = eventExpenses
              .filter(e => e.payerId === participant.id)
              .reduce((sum, e) => sum + e.amount, 0);
            const totalOwed = eventSplits
              .filter(s => s.participantId === participant.id)
              .reduce((sum, s) => sum + s.amount, 0);
            // Ajustar por settlements pagados
            const paidByParticipant = dbSettlements
              .filter((s: any) => s.fromParticipantId === participant.id && s.isPaid)
              .reduce((sum: number, s: any) => sum + s.amount, 0);
            const receivedByParticipant = dbSettlements
              .filter((s: any) => s.toParticipantId === participant.id && s.isPaid)
              .reduce((sum: number, s: any) => sum + s.amount, 0);
            // Monto condonado (auto-cancelación, solo no pagados para evitar doble conteo con paidByParticipant)
            const forgivenAmount = dbSettlements
              .filter((s: any) => {
                if (s.isPaid) return false; // evitar doble conteo con paidByParticipant
                const actualPayer = assignmentMap[s.fromParticipantId] || s.fromParticipantId;
                return s.fromParticipantId === participant.id && actualPayer === s.toParticipantId;
              })
              .reduce((sum: number, s: any) => sum + s.amount, 0);
            // Monto absorbido por tercero C: "Pagado por otro" — también reduce el balance del deudor A
            const absorbedByThirdParty = dbSettlements
              .filter((s: any) => {
                if (s.isPaid) return false; // evitar doble conteo con paidByParticipant
                if (s.fromParticipantId !== participant.id) return false;
                const actualPayer = assignmentMap[s.fromParticipantId];
                return actualPayer !== undefined && actualPayer !== s.toParticipantId;
              })
              .reduce((sum: number, s: any) => sum + s.amount, 0);
            // Monto que este participante perdonó siendo acreedor (solo no pagados)
            const forgivenToOthers = dbSettlements
              .filter((s: any) => {
                if (s.isPaid) return false; // evitar doble conteo con receivedByParticipant
                const actualPayer = assignmentMap[s.fromParticipantId];
                return s.toParticipantId === participant.id &&
                       actualPayer === participant.id &&
                       s.fromParticipantId !== participant.id;
              })
              .reduce((sum: number, s: any) => sum + s.amount, 0);
            // Monto que este participante absorbió de otros (solo no pagados)
            const absorbedFromOthers = dbSettlements
              .filter((s: any) => {
                if (s.isPaid) return false; // evitar doble conteo con paidByParticipant
                const actualPayer = assignmentMap[s.fromParticipantId];
                return actualPayer === participant.id &&
                       s.fromParticipantId !== participant.id &&
                       s.toParticipantId !== participant.id;
              })
              .reduce((sum: number, s: any) => sum + s.amount, 0);

            // Monto efectivamente adeudado (visible al usuario, descuenta lo condonado/absorbido)
            const effectiveOwed = Math.max(0, totalOwed - forgivenAmount - absorbedByThirdParty);

            // balance positivo = le deben (verde), negativo = debe (rojo)
            const balance = (totalPaid - totalOwed)
              + paidByParticipant       // settlements que ya pagó → reduce deuda
              - receivedByParticipant   // settlements que ya recibió → reduce crédito
              + forgivenAmount          // deuda perdonada por el acreedor → reduce deuda del deudor
              + absorbedByThirdParty    // deuda asumida por un tercero → reduce deuda del deudor
              - forgivenToOthers        // crédito que perdonó siendo acreedor → reduce su crédito
              - absorbedFromOthers;     // deuda extra asumida de otros → aumenta su deuda

            // Debug log para diagnosticar problemas de balance
            if (consolidationAssignments.length > 0) {
              console.log(`👤 Balance [${participant.name}]:`, {
                totalPaid, totalOwed, effectiveOwed,
                paidByParticipant, receivedByParticipant,
                forgivenAmount, absorbedByThirdParty,
                forgivenToOthers, absorbedFromOthers,
                balance
              });
            }
            
            const isSelected = selectedParticipantIds.has(participant.id);
            const hasExpenses = totalPaid > 0;

            return (
              <TouchableOpacity
                key={participant.id}
                style={[
                  styles.participantItem,
                  isParticipantSelectMode && isSelected && { backgroundColor: theme.colors.primary + '18' },
                  isParticipantSelectMode && hasExpenses && { opacity: 0.45 }
                ]}
                onPress={() => {
                  if (isParticipantSelectMode) {
                    if (hasExpenses) {
                      Alert.alert(
                        t('common.error'),
                        t('participants.cannotDeleteHasExpenses', { name: participant.name })
                      );
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
                  <View style={[
                    styles.participantAvatar,
                    { backgroundColor: participant.participantType === 'friend' ? theme.colors.success : theme.colors.warning }
                  ]}>
                    <MaterialCommunityIcons
                      name={participant.participantType === 'friend' ? 'heart' : 'clock'}
                      size={20}
                      color={participant.participantType === 'friend' ? theme.colors.onSuccess : theme.colors.onWarning}
                    />
                  </View>
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
                      {/* Mostrar monto efectivo adeudado (descuenta condonación y absorción) */}
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
                  {event?.status === 'active' && !isParticipantSelectMode && (
                    <View style={styles.participantActions}>
                      {participant.participantType === 'temporary' && (
                        <TouchableOpacity 
                          style={styles.editParticipantButton}
                          onPress={() => handleEditParticipant(participant)}
                        >
                          <MaterialCommunityIcons name="pencil" size={18} color={theme.colors.primary} />
                        </TouchableOpacity>
                      )}
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
            );
          })
        )}
          </Card>
        </ScrollView>
      </View>
    );
  };

  const renderResumenTab = () => {
    return (
    <View style={styles.tabContent}>
      {/* Header de Acciones */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: 8,
        paddingHorizontal: 16, 
        paddingVertical: 12,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outline + '20'
      }}>
        <TouchableOpacity 
          style={{ 
            backgroundColor: theme.colors.primary + '15',
            paddingHorizontal: 10,
            paddingVertical: 10,
            borderRadius: 8
          }} 
          onPress={handleShareSummary}
        >
          <MaterialCommunityIcons name="clipboard-check" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ 
            backgroundColor: theme.colors.primary + '15',
            paddingHorizontal: 10,
            paddingVertical: 10,
            borderRadius: 8
          }} 
          onPress={handleShareEvent}
        >
          <MaterialCommunityIcons name="file-document" size={20} color={theme.colors.primary} />
        </TouchableOpacity>

        {/* Separador */}
        <View style={{ width: 1, height: 28, backgroundColor: theme.colors.outline + '40', marginHorizontal: 4 }} />

        {/* Botones de Estado del Evento */}
        <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
        {event?.status === 'active' ? (
          <>
            <TouchableOpacity
              onPress={handleCompleteEvent}
              style={{ 
                backgroundColor: theme.colors.primary, 
                paddingHorizontal: 8, 
                paddingVertical: 6, 
                borderRadius: 6, 
                flexDirection: 'row', 
                alignItems: 'center'
              }}
            >
              <MaterialCommunityIcons name="check-circle" size={14} color={theme.colors.onPrimary} style={{ marginRight: 4 }} />
              <Text style={{ color: theme.colors.onPrimary, fontWeight: '600', fontSize: 12 }}>{t('events.complete')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleArchiveEvent}
              style={{ 
                backgroundColor: theme.colors.surface, 
                borderWidth: 1, 
                borderColor: theme.colors.outline, 
                paddingHorizontal: 8, 
                paddingVertical: 6, 
                borderRadius: 6, 
                flexDirection: 'row', 
                alignItems: 'center' 
              }}
            >
              <MaterialCommunityIcons name="archive" size={14} color={theme.colors.onSurfaceVariant} style={{ marginRight: 4 }} />
              <Text style={{ color: theme.colors.onSurfaceVariant, fontWeight: '600', fontSize: 12 }}>{t('events.archive')}</Text>
            </TouchableOpacity>
          </>
        ) : event?.status === 'completed' ? (
          <>
            <TouchableOpacity
              onPress={() => handleReactivateEvent('active')}
              style={{ 
                backgroundColor: theme.colors.surface, 
                borderWidth: 1, 
                borderColor: theme.colors.primary, 
                paddingHorizontal: 8, 
                paddingVertical: 6, 
                borderRadius: 6, 
                flexDirection: 'row', 
                alignItems: 'center' 
              }}
            >
              <MaterialCommunityIcons name="lock-open" size={14} color={theme.colors.primary} style={{ marginRight: 4 }} />
              <Text style={{ color: theme.colors.primary, fontWeight: '600', fontSize: 12 }}>{t('events.reactivate')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleArchiveEvent}
              style={{ 
                backgroundColor: theme.colors.surface, 
                borderWidth: 1, 
                borderColor: theme.colors.outline, 
                paddingHorizontal: 8, 
                paddingVertical: 6, 
                borderRadius: 6, 
                flexDirection: 'row', 
                alignItems: 'center' 
              }}
            >
              <MaterialCommunityIcons name="archive" size={14} color={theme.colors.onSurfaceVariant} style={{ marginRight: 4 }} />
              <Text style={{ color: theme.colors.onSurfaceVariant, fontWeight: '600', fontSize: 12 }}>{t('events.archive')}</Text>
            </TouchableOpacity>
          </>
        ) : event?.status === 'archived' ? (
          <>
            <TouchableOpacity
              onPress={() => handleReactivateEvent('active')}
              style={{ 
                backgroundColor: theme.colors.primary, 
                paddingHorizontal: 8, 
                paddingVertical: 6, 
                borderRadius: 6, 
                flexDirection: 'row', 
                alignItems: 'center' 
              }}
            >
              <MaterialCommunityIcons name="lock-open" size={14} color={theme.colors.onPrimary} style={{ marginRight: 4 }} />
              <Text style={{ color: theme.colors.onPrimary, fontWeight: '600', fontSize: 12 }}>{t('events.reactivate')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleReactivateEvent('completed')}
              style={{ 
                backgroundColor: theme.colors.surface, 
                borderWidth: 1, 
                borderColor: theme.colors.warning, 
                paddingHorizontal: 8, 
                paddingVertical: 6, 
                borderRadius: 6, 
                flexDirection: 'row', 
                alignItems: 'center' 
              }}
            >
              <MaterialCommunityIcons name="check-circle" size={14} color={theme.colors.warning} style={{ marginRight: 4 }} />
              <Text style={{ color: theme.colors.warning, fontWeight: '600', fontSize: 12 }}>{t('events.complete')}</Text>
            </TouchableOpacity>
          </>
        ) : null}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }}>
      {/* Información del evento */}
      <Card style={{ marginBottom: 16, marginHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>📋 {t('events.information')}</Text>
          {event && (
            <View style={{ 
              backgroundColor: event.status === 'active' ? theme.colors.successContainer : 
                             event.status === 'completed' ? theme.colors.warningContainer :
                             event.status === 'archived' ? theme.colors.surfaceVariant : theme.colors.successContainer,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: event.status === 'active' ? theme.colors.success : 
                          event.status === 'completed' ? theme.colors.warning : 
                          theme.colors.outline
            }}>
              <Text style={{ 
                color: event.status === 'active' ? theme.colors.success : 
                       event.status === 'completed' ? theme.colors.warning : 
                       theme.colors.onSurfaceVariant,
                fontSize: 12,
                fontWeight: '600'
              }}>
                {event.status === 'active' ? `🟢 ${t('events.active')}` : 
                 event.status === 'completed' ? `✅ ${t('events.completed')}` : `📁 ${t('events.archived')}`}
              </Text>
            </View>
          )}
        </View>
        {event && (
          <View style={styles.summaryInfo}>
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
          </View>
        )}
      </Card>

      {/* Liquidación de cuentas */}
      <Card style={{ marginBottom: 16, marginHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>💸 {t('summary.settlements')}</Text>
          {(event?.status === 'active' || event?.status === 'completed') && getDisplaySettlements().length > 0 && (() => {
            const displaySettlements = getDisplaySettlements();
            const paidCount = displaySettlements.filter((s: Settlement) => s.isPaid).length;
            const isAnyPaid = paidCount > 0;
            return (
              <View style={{ 
                backgroundColor: isAnyPaid ? theme.colors.primary : theme.colors.warning, 
                paddingHorizontal: 12, 
                paddingVertical: 4, 
                borderRadius: 12 
              }}>
                <Text style={{ 
                  color: isAnyPaid ? theme.colors.onPrimary : theme.colors.onWarning, 
                  fontSize: 12, 
                  fontWeight: '600' 
                }}>
                  {paidCount}/{displaySettlements.length} {t('payments.paid')}
                </Text>
              </View>
            );
          })()}
        </View>
        
        {/* Controles de Consolidación - Solo en eventos completados */}
        {settlements.length > 1 && event?.status === 'completed' && (
          <View style={styles.consolidationControls}>
            <View style={styles.consolidationButtons}>
              <TouchableOpacity
                style={[styles.consolidationButton, { backgroundColor: theme.colors.primaryContainer }]}
                onPress={() => setShowConsolidationModal(true)}
              >
                <MaterialCommunityIcons 
                  name="group" 
                  size={16} 
                  color={theme.colors.onPrimaryContainer} 
                />
                <Text style={[styles.consolidationButtonText, { color: theme.colors.onPrimaryContainer }]}>
                  Consolidar
                </Text>
              </TouchableOpacity>

              {consolidationAssignments.length > 0 && (
                <>
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
                    <MaterialCommunityIcons 
                      name="close" 
                      size={16} 
                      color={theme.colors.onErrorContainer} 
                    />
                    <Text style={[styles.consolidationButtonText, { color: theme.colors.onErrorContainer }]}>
                      {t('eventDetail.clear')}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {consolidationAssignments.length > 0 && (
              <View style={styles.consolidationSummary}>
                <Text style={[styles.consolidationSummaryText, { color: theme.colors.onSurfaceVariant }]}>
                  {t('eventDetail.consolidationSummary', { count: consolidationAssignments.length })} • 
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
            )}
          </View>
        )}
        
        {getDisplaySettlements().length > 0 ? (
          <View>
            {getDisplaySettlements()
              .sort((a, b) => {
                // Ordenamiento: Estado > Deudor > Monto > Acreedor
                // Los pagados van al final
                const aIsPaid = a.isPaid || false;
                const bIsPaid = b.isPaid || false;
                if (aIsPaid !== bIsPaid) {
                  return aIsPaid ? 1 : -1; // no pagados primero
                }

                // Por deudor (fromParticipantName)
                const deudorComparison = a.fromParticipantName.localeCompare(b.fromParticipantName);
                if (deudorComparison !== 0) {
                  return deudorComparison;
                }

                // Por monto (descendente - mayor a menor)
                const montoComparison = b.amount - a.amount;
                if (montoComparison !== 0) {
                  return montoComparison;
                }

                // Por acreedor (toParticipantName)
                return a.toParticipantName.localeCompare(b.toParticipantName);
              })
              .map((settlement: Settlement, index: number) => {
                // Log específico para cada settlement que se va a renderizar
                console.log(`🎯 Rendering settlement ${index}:`, {
                  from: settlement.fromParticipantName,
                  to: settlement.toParticipantName,
                  amount: settlement.amount,
                  isPaid: settlement.isPaid,
                  id: settlement.id
                });
                
                return (
              <SettlementItem
                key={`${settlement.id}_${index}_${settlement.fromParticipantId}_${settlement.toParticipantId}`}
                settlement={settlement}
                currency={event?.currency || 'ARS'}
                onTogglePaid={handleToggleSettlementPaid}
                onUpdateReceipt={handleUpdateSettlementReceipt}
                disabled={event?.status === 'archived'}
              />
                );
              })}
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
            <Text style={styles.noSettlementsText}>
              {t('eventDetail.settledText')}
            </Text>
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
      </Card>

      {/* Liquidaciones Pagadas */}
      {(() => {
        if (event?.status === 'completed') return null;
        const paidSettlements = dbSettlements.filter((s: any) => s.isPaid);
        if (paidSettlements.length === 0) return null;
        return (
          <Card style={{ marginBottom: 16, marginHorizontal: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.sectionTitle}>✅ {t('summary.paidSettlements')}</Text>
              <View style={{ backgroundColor: theme.colors.successContainer, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ color: theme.colors.onSuccessContainer, fontSize: 12, fontWeight: '600' }}>
                  {paidSettlements.length} {t('payments.paid')}
                </Text>
              </View>
            </View>
            {paidSettlements
              .sort((a: any, b: any) => {
                if (a.paidAt && b.paidAt) return new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime();
                return 0;
              })
              .map((s: any, idx: number) => (
                <View
                  key={`paid_${s.id}_${idx}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    marginBottom: 6,
                    backgroundColor: theme.colors.successContainer + '25',
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: theme.colors.success + '30',
                  }}
                >
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
                </View>
              ))}
          </Card>
        );
      })()}

      {/* Consolidaciones Aplicadas - Solo mostrar cuando hay consolidaciones */}
      {consolidationAssignments.length > 0 && (
        <Card style={{ marginBottom: 16, marginHorizontal: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={styles.sectionTitle}>{t('consolidation.title')}</Text>
          </View>
          
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
                const hasMultipleDebtors = typedGroup.debtors.length > 0; //Se modifica el 1 por 0 para que considere toda la lista contraible, sin importar la cantidad de personas que pague.

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
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        {/* Nombre del Pagador */}
                        <View style={{ marginBottom: 8 }}>
                          <Text style={{ 
                            fontSize: 16, 
                            fontWeight: '700', 
                            color: theme.colors.onSurface
                          }}>
                            {typedGroup.payerName}
                          </Text>
                        </View>
                        
                        {/* Lista de personas a las que paga */}
                        <View>
                          {hasMultipleDebtors ? (
                            // Lista colapsible para múltiples deudores
                            <>
                              <TouchableOpacity 
                                onPress={() => togglePayerList(typedGroup.payerId)}
                                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}
                              >
                                <MaterialCommunityIcons 
                                  name="arrow-right" 
                                  size={14} 
                                  color={theme.colors.onSurfaceVariant}
                                  style={{ marginRight: 4 }}
                                />
                                <Text style={{ 
                                  fontSize: 14, 
                                  color: theme.colors.onSurfaceVariant 
                                }}>
                                  {t('consolidation.paysToMultiple', { count: typedGroup.debtors.length })}
                                </Text>
                                <MaterialCommunityIcons 
                                  name={isExpanded ? "chevron-up" : "chevron-down"} 
                                  size={16} 
                                  color={theme.colors.onSurfaceVariant}
                                  style={{ marginLeft: 4 }}
                                />
                              </TouchableOpacity>
                              
                              {isExpanded && (
                                <View style={{ paddingLeft: 18 }}>
                                  {typedGroup.debtors.map((debtor: {debtorId: string, debtorName: string, amount: number}, index: number) => (
                                    <View key={debtor.debtorId} style={{ 
                                      flexDirection: 'row', 
                                      alignItems: 'center', 
                                      marginBottom: index < typedGroup.debtors.length - 1 ? 4 : 0
                                    }}>
                                      <Text style={{ 
                                        fontSize: 14,
                                        color: theme.colors.primary,
                                        fontWeight: '600'
                                      }}>
                                        • {debtor.debtorName} 
                                      </Text>
                                      {debtor.amount > 0 && (
                                        <Text style={{ 
                                          fontSize: 14,
                                          color: theme.colors.onSurfaceVariant,
                                          marginLeft: 8
                                        }}>
                                          =&gt; ${formatCurrency(debtor.amount)}
                                        </Text>
                                      )}
                                    </View>
                                  ))}
                                </View>
                              )}
                            </>
                          ) : (
                            // Vista simple para un solo deudor
                            <>
                              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                <MaterialCommunityIcons 
                                  name="arrow-right" 
                                  size={14} 
                                  color={theme.colors.onSurfaceVariant}
                                  style={{ marginRight: 4 }}
                                />
                                <Text style={{ 
                                  fontSize: 14, 
                                  color: theme.colors.onSurfaceVariant 
                                }}>
                                  {t('consolidation.paysTo')}
                                </Text>
                              </View>
                              
                              <View style={{ paddingLeft: 18 }}>
                                <Text style={{ 
                                  fontSize: 14,
                                  color: theme.colors.primary,
                                  fontWeight: '600'
                                }}>
                                  • {typedGroup.debtors[0].debtorName}
                                </Text>
                              </View>
                            </>
                          )}
                        </View>
                      </View>
                      
                      <View style={{ alignItems: 'center' }}>
                        <View style={{ 
                          backgroundColor: theme.colors.successContainer,
                          borderRadius: 14,
                          paddingHorizontal: 10,
                          paddingVertical: 6
                        }}>
                          <Text style={{ 
                            fontSize: 11, 
                            color: theme.colors.onSuccessContainer,
                            fontWeight: '700'
                          }}>
                            ✓ ACTIVA
                          </Text>
                        </View>
                      </View>
                    </View>
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
          <Card style={{ marginBottom: 16, marginHorizontal: 16 }}>
            <Text style={styles.sectionTitle}>👥 {t('expenses.byParticipant')}</Text>
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
          </Card>
        );
      })()}

      {/* Categorías de gastos */}
      {Object.keys(eventStats.categoryTotals).length > 0 && (
        <Card style={{ marginBottom: 16, marginHorizontal: 16 }}>
          <Text style={styles.sectionTitle}>📊 {t('expenses.byCategory')}</Text>
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
      Alert.alert(t('common.error'), t('message.paymentStateError'));
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
        Alert.alert(t('success'), t('message.receiptAddedSuccess'));
      }
    } catch (error) {
      Alert.alert(t('error'), t('message.receiptAddedError'));
    }
  };

  const handleCreatePaymentsFromSettlements = async () => {
    if (settlements.length === 0) {
      Alert.alert(t('message.noSettlements'), t('message.noSettlementsDesc'));
      return;
    }

    console.log(`💳 Creating ${settlements.length} payments from settlements...`);
    
    Alert.alert(
      t('message.createPaymentsTitle'),
      t('eventDetail.createPaymentsDesc', { count: settlements.length, plural: settlements.length > 1 ? 's' : '' }),
      [
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
              Alert.alert(t('common.success'), `${settlements.length} ${settlements.length > 1 ? t('message.paymentsCreatedPlural') : t('message.paymentsCreated')}`);
            } catch (error) {
              console.error('❌ Error creating payments from settlements:', error);
              Alert.alert(t('common.error'), t('message.couldNotCreatePayments'));
            }
          }
        }
      ]
    );
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
    Alert.alert(
      t('events.deleteTitle'),
      t('events.deleteMessage', { name: event.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(event.id);
              Alert.alert(t('common.success'), t('message.eventDeleted'));
              navigation.goBack();
            } catch (error) {
              Alert.alert(t('common.error'), t('message.eventDeletedError'));
            }
          }
        }
      ]
    );
  };

  const showEventOptions = () => {
    if (!event) return;
    Alert.alert(
      t('events.optionsTitle'),
      t('events.optionsMessage', { name: event.name }),
      [
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
      ]
    );
  };

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
      <HeaderBar
        title={event.name}
        titleAlignment="left"
        showBackButton={false}
        showThemeToggle={true}
        showLanguageSelector={true}
        showHelp={true}
        useDynamicColors={true}
        elevation={true}
      />
      
      <View style={[styles.safeContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        {/* Tab Bar */}
        {renderTabBar()}

        {/* Tab Content */}
        {renderTabContent()}
      </View>

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
                      <Text style={[styles.expenseDetailValue, { color: theme.colors.success, fontWeight: '600' }]}>
                        ${selectedExpenseForDetail.expense.amount.toFixed(2)} {selectedExpenseForDetail.expense.currency}
                      </Text>
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
                    <View style={styles.expenseDetailRow}>
                      <Text style={styles.expenseDetailLabel}>{t('expenses.paidBy')}:</Text>
                      <Text style={styles.expenseDetailValue}>
                        {eventParticipants.find(p => p.id === selectedExpenseForDetail.expense.payerId)?.name || 'Usuario Demo'}
                      </Text>
                    </View>
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
                      📊 {t('expenses.expenseDivision')} ({selectedExpenseForDetail.splits.length} {t('expenses.participants')})
                    </Text>
                    {selectedExpenseForDetail.splits.map((split: any) => {
                      const participant = eventParticipants.find(p => p.id === split.participantId);
                      return (
                        <React.Fragment key={split.id}>
                          <View style={styles.expenseDetailRow}>
                            <Text style={styles.expenseDetailLabel}>• {participant?.name}:</Text>
                            <Text style={styles.expenseDetailValue}>${split.amount.toFixed(2)}</Text>
                          </View>
                        </React.Fragment>
                      );
                    })}
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
                let filtered = text.replace(/[^\d\s\-()+]/g, '').replace(/\+/g, '');
                if (startsWithPlus) filtered = '+' + filtered;
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
                  Alert.alert(t('common.error'), t('eventDetail.error.emailInvalid'));
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

