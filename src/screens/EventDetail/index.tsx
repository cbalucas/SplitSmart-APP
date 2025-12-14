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
import { LanguageSelector, ThemeToggle, SettlementItem } from '../../components';
import { useCalculations } from '../../hooks/useCalculations';
import { databaseService } from '../../services/database';
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
  
  // Estados de filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [participantSearchQuery, setParticipantSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('todos');
  const [filterPayer, setFilterPayer] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description'>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showExpenseDetailModal, setShowExpenseDetailModal] = useState(false);
  const [selectedExpenseForDetail, setSelectedExpenseForDetail] = useState<any>(null);

  // Use calculations hook for balance and settlement calculations
  const { balances, settlements, eventStats } = useCalculations(
    eventParticipants,
    eventExpenses,
    eventSplits,
    eventPayments,
    dbSettlements,
    event?.status as 'active' | 'completed' | 'archived'
  );

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
        // Load expenses, participants, splits, payments and settlements from SQLite
        const [expensesData, participantsData, splitsData, paymentsData, settlementsData] = await Promise.all([
          getExpensesByEvent(eventId).catch(() => []), // Return empty array if fails
          getEventParticipants(eventId).catch(() => []), // Return empty array if fails
          getSplitsByEvent(eventId).catch(() => []), // Return empty array if fails
          getPaymentsByEvent(eventId).catch(() => []), // Return empty array if fails
          databaseService.getSettlementsByEvent(eventId).catch(() => []) // Return empty array if fails
        ]);
        
        setEventExpenses(expensesData);
        setEventParticipants(participantsData);
        setEventSplits(splitsData);
        setEventPayments(paymentsData);
        setDbSettlements(settlementsData);
      } else {
        // If event not found, set empty arrays
        setEventExpenses([]);
        setEventParticipants([]);
        setEventSplits([]);
        setEventPayments([]);
        setDbSettlements([]);
      }
    } catch (error) {
      console.error('Error in loadEventData:', error);
      setEvent(null);
      setEventExpenses([]);
      setEventParticipants([]);
      setEventSplits([]);
      setEventPayments([]);
      setDbSettlements([]);
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

  // Sincronizar liquidaciones cuando cambien los cálculos
  // Usar referencia para evitar bucles infinitos
  const previousSettlementsRef = useRef<string>('');
  useEffect(() => {
    if (!eventId || !event || event.status === 'archived') return;
    
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
    
    if (shouldSync) {
      console.log('🔄 Syncing settlements to DB after calculations change');
      console.log('  📊 Settlements to sync:', settlements.length);
      previousSettlementsRef.current = settlementsSignature;
      
      const syncTimeout = setTimeout(() => {
        syncSettlementsToDb();
      }, 300); // Delay reducido para mejor responsividad
      
      return () => clearTimeout(syncTimeout);
    }
  }, [eventId, event, settlements, syncSettlementsToDb]);

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
      'Eliminar Gasto',
      `¿Estás seguro de que quieres eliminar el gasto "${expense.description}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
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
        'ℹ️ Editar Amigo',
        `"${participant.name}" es un amigo permanente. Para editarlo, ve a la sección "Mis Amigos" desde el menú principal.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Ir a Mis Amigos', onPress: () => (navigation as any).navigate('ManageFriends') }
        ]
      );
    }
  };

  const handleSaveEditedParticipant = async (name: string, email?: string, phone?: string, aliasCbu?: string, convertToFriend?: boolean) => {
    if (!editingParticipant || !name.trim()) {
      Alert.alert(t('common.error'), t('message.nameRequired'));
      return;
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
      'Eliminar Participante',
      `¿Estás seguro de que quieres eliminar a "${participant.name}" del evento?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
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

  // Settlement handlers - SIMPLIFICADO
  const handleToggleSettlementPaid = async (settlementId: string, isPaid: boolean) => {
    // Solo permitir marcar pagos en estado COMPLETADO
    if (event?.status !== 'completed') {
      Alert.alert('⚠️ Acción no permitida', 'Solo puedes marcar pagos cuando el evento está completado.');
      return;
    }

    try {
      console.log(`💰 ${isPaid ? 'Marcando' : 'Desmarcando'} settlement como pagado:`, settlementId);

      // Si se desmarca un pago, mostrar advertencia
      if (!isPaid) {
        Alert.alert(
          '⚠️ Desmarcar pago',
          'Desmarcar este pago puede cambiar a quién deben transferir dinero otros participantes. ¿Deseas continuar?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Continuar',
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
      Alert.alert('⚠️ Acción no permitida', 'Solo puedes agregar comprobantes cuando el evento está completado.');
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
              // 1. Actualizar estado del evento a completado
              await updateEvent(eventId, {
                status: 'completed',
                completedAt: new Date().toISOString()
              });
              
              // 2. Actualizar estado de todas las liquidaciones a completado
              await databaseService.updateSettlementsEventStatus(eventId, 'completed');
              
              // 3. Recargar datos para reflejar el cambio
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
  }, [event, eventId, t, updateEvent, loadEventData]);

  const handleReactivateEvent = useCallback(async (targetStatus: 'active' | 'completed' = 'active') => {
    if (!event) return;

    const isGoingToActive = targetStatus === 'active';
    const isFromArchived = event?.status === 'archived';
    
    let title, message, buttonText, successTitle, successMessage;
    
    if (isGoingToActive && isFromArchived) {
      // ARCHIVADO → ACTIVO: Advertencia sobre eliminación de pagos
      title = `⚠️ ${t('message.reactivateEvent')}`;
      message = "⚠️ Al reactivar el evento se borrarán TODOS los pagos y comprobantes registrados para permitir nuevos cálculos. ¿Deseas continuar?";
      buttonText = t('events.reactivate');
      successTitle = `✅ ${t('message.eventReactivated')}`;
      successMessage = "Evento reactivado. Se han eliminado todos los pagos previos.";
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
    
    let message = `📊 *RESUMEN - ${event.name}*\n\n`;
    
    // Agregar advertencia si el evento está activo
    if (event.status === 'active') {
      message += `⚠️ _Los importes mencionados pueden sufrir modificaciones, debido que el evento no está COMPLETADO_\n\n`;
    }
    
    message += `💰 *Total gastado:* ${event.currency} $${totalAmount.toFixed(2)}\n`;
    message += `👥 *Participantes:* ${participantCount}\n\n`;
    
    message += `💸 LIQUIDACIONES:\n\n`;
    if (dbSettlements.length > 0) {
      // Agrupar liquidaciones por destinatario (quien recibe el dinero)
      const settlementsByRecipient = dbSettlements.reduce((acc, settlement) => {
        const toParticipantName = settlement.toParticipantName;
        if (!acc[toParticipantName]) {
          acc[toParticipantName] = [];
        }
        acc[toParticipantName].push(settlement);
        return acc;
      }, {} as Record<string, typeof dbSettlements>);

      // Generar mensaje agrupado por destinatario
      Object.entries(settlementsByRecipient).forEach(([recipientName, settlementsForRecipient]) => {
        const recipient = eventParticipants.find(p => p.name === recipientName);
        const cbuAlias = recipient?.alias_cbu || 'Sin datos';
        
        message += `_${recipientName}_\n`;
        message += `💳 *${cbuAlias}*\n`;
        settlementsForRecipient.forEach((settlement) => {
          const paymentStatus = settlement.isPaid ? ' ✅' : ' ⏳';
          const receiptIcon = settlement.receiptImage ? ' 📎' : '';
          message += `  • ${settlement.fromParticipantName}: $${formatCurrency(settlement.amount)}${paymentStatus}${receiptIcon}\n`;
        });
        message += `\n`;
      });
    } else {
      message += `✅ ¡Todas las cuentas están equilibradas!\n`;
    }

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
          `El resumen ${t('message.copiedToClipboard')}`,
          [{ text: t('ok') }]
        );
      });
  };

  const handleShareEvent = () => {
    if (!event) return;

    const totalAmount = calculateTotalExpenses();
    
    let message = `🎉 EVENTO - ${event.name.toUpperCase()}\n`;
    message += `━━━━━━━━━━━━━━━━━━\n`;
    
    // Agregar advertencia si el evento está activo
    if (event.status === 'active') {
      message += `⚠️ _Los importes mencionados pueden sufrir modificaciones, debido que el evento no está COMPLETADO_\n\n`;
    }
    
    message += `📅 ${new Date(event.startDate).toLocaleDateString('es-AR')}\n`;
    message += `💵 $${formatCurrency(totalAmount)} ${event.currency}\n`;
    message += `📊 Estado: ${event.status === 'active' ? t('events.active') : event.status === 'completed' ? t('events.completed') : t('events.archived')}\n`;
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `👥 PARTICIPANTES (${eventParticipants.length}):\n`;
    eventParticipants.forEach((p) => {
      message += `* ${p.name}\n`;
    });
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `💸 LIQUIDACIÓN:\n`;
    
    if (dbSettlements.length > 0) {
      // Agrupar liquidaciones por destinatario (quien recibe el dinero)
      const settlementsByRecipient = dbSettlements.reduce((acc, settlement) => {
        const toParticipantName = settlement.toParticipantName;
        if (!acc[toParticipantName]) {
          acc[toParticipantName] = [];
        }
        acc[toParticipantName].push(settlement);
        return acc;
      }, {} as Record<string, typeof dbSettlements>);

      // Generar mensaje agrupado por destinatario
      Object.entries(settlementsByRecipient).forEach(([recipientName, settlementsForRecipient]) => {
        const recipient = eventParticipants.find(p => p.name === recipientName);
        const cbuAlias = recipient?.alias_cbu || 'Sin datos';
        
        message += `${recipientName}\n`;
        message += `💳 ${cbuAlias}\n`;
        settlementsForRecipient.forEach((settlement) => {
          const paymentStatus = settlement.isPaid ? ' ✅' : ' ⏳';
          const receiptIcon = settlement.receiptImage ? ' 📎' : '';
          message += `  • ${settlement.fromParticipantName}: $${formatCurrency(settlement.amount)}${paymentStatus}${receiptIcon}\n`;
        });
      });
    } else {
      message += `✅ ¡Todas las cuentas están equilibradas!\n`;
    }
    
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `📝 GASTOS (${eventExpenses.length}):\n`;
    
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
            expenseLine += ` | Excep: ${excludedNames}`;
          }
          
          // Agregar icono de comprobante si existe
          if (expense.receiptImage) {
            expenseLine += ' 📎';
          }
          
          message += `${expenseLine}\n`;
        });
      });
      
      message += `\n💵 TOTAL: $${formatCurrency(totalAmount)}\n`;
    } else {
      message += `Sin gastos registrados\n`;
    }

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
          `El evento ${t('message.copiedToClipboard')}`,
          [{ text: t('ok') }]
        );
      });
  };

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

  const handleAddParticipant = (participant: Participant) => {
    // Check if participant already exists in global participants list
    const existingParticipant = participants.find(p => p.id === participant.id);
    
    if (existingParticipant || participant.participantType === 'friend') {
      // Participant already exists globally or is marked as friend, just add to event
      addExistingParticipantToEvent(eventId, participant)
        .then(() => {
          loadEventData();
          Alert.alert(`✅ ${t('message.participantAdded')}`, `${participant.name} ${t('message.participantAddedDesc')}`);
        })
        .catch((error) => {
          console.error('Error adding existing participant:', error);
          Alert.alert(t('error'), t('message.participantAddedError'));
        });
    } else {
      // New temporary participant, create and add to event
      addParticipantToEvent(eventId, participant)
        .then(() => {
          loadEventData();
          Alert.alert(`✅ ${t('message.participantAdded')}`, `${participant.name} ${t('message.participantAddedDesc')}`);
        })
        .catch((error) => {
          console.error('Error adding new participant:', error);
          Alert.alert(t('error'), t('message.participantAddedError'));
        });
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
        
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <Card style={{ marginHorizontal: 16, marginBottom: 16 }}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              👥 {t('participants.title')} ({visibleParticipants.length}{visibleParticipants.length !== eventParticipants.length ? ` de ${eventParticipants.length}` : ''})
            </Text>
            {event?.status === 'active' && (
              <TouchableOpacity 
                style={{ 
                  backgroundColor: theme.colors.primary, 
                  paddingHorizontal: 12, 
                  paddingVertical: 8, 
                  borderRadius: 8, 
                  flexDirection: 'row', 
                  alignItems: 'center'
                }}
                onPress={() => setShowAddParticipantModal(true)}
              >
                <MaterialCommunityIcons name="plus" size={16} color={theme.colors.onPrimary} style={{ marginRight: 6 }} />
                <Text style={{ color: theme.colors.onPrimary, fontWeight: '600', fontSize: 14 }}>{t('common.add')}</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {visibleParticipants.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-group" size={48} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.emptyText}>{t('participants.noParticipants')}</Text>
              <Text style={styles.emptySubtext}>{t('participants.noParticipantsDesc')}</Text>
            </View>
          ) : (
            visibleParticipants.map(participant => {
            const participantBalance = balances.find(b => b.participantId === participant.id);
            const totalPaid = participantBalance?.totalPaid || 0;
            const totalOwed = participantBalance?.totalOwed || 0;
            const balance = totalPaid - totalOwed; // Lo que pagó - lo que debe
            
            return (
              <TouchableOpacity 
                key={participant.id} 
                style={styles.participantItem}
                onPress={() => {
                  setSelectedParticipantForInfo(participant);
                  setParticipantInfoModalVisible(true);
                }}
                activeOpacity={0.7}
              >
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
                    {participant.alias_cbu && (
                      <Text style={styles.participantEmail}>💳 {participant.alias_cbu}</Text>
                    )}
                    {participant.phone && (
                      <Text style={styles.participantEmail}>📞 {participant.phone}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.participantRightSection}>
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
                    <Text style={styles.participantBalanceLabel}>
                      {balance > 0.01 ? t('participants.owes') :
                       balance < -0.01 ? t('participants.shouldPay') :
                       t('participants.balanced')}
                    </Text>
                  </View>
                  {event?.status === 'active' && (
                    <View style={styles.participantActions}>
                      {participant.participantType === 'temporary' && (
                        <TouchableOpacity 
                          style={styles.editParticipantButton}
                          onPress={() => handleEditParticipant(participant)}
                        >
                          <MaterialCommunityIcons name="pencil" size={18} color={theme.colors.primary} />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity 
                        style={styles.removeParticipantButton}
                        onPress={() => handleRemoveParticipant(participant)}
                      >
                        <MaterialCommunityIcons name="close" size={20} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  )}
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

  const renderResumenTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Header de Acciones Mejorado */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 16, 
        paddingVertical: 16,
        backgroundColor: theme.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.outline + '20'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
        </View>
        
        {/* Botones de Estado del Evento */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '60%' }}>
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
                <Text style={{ fontSize: 14, color: theme.colors.onSurfaceVariant }}>Moneda: {event.currency}</Text>
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
          {(event?.status === 'active' || event?.status === 'completed') && dbSettlements.length > 0 && (() => {
            const paidCount = dbSettlements.filter((s: Settlement) => s.isPaid).length;
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
                  {paidCount}/{dbSettlements.length} {t('payments.paid')}
                </Text>
              </View>
            );
          })()}
        </View>
        
        {dbSettlements.length > 0 ? (
          <View>
            {dbSettlements
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
              .map((settlement: Settlement) => (
              <SettlementItem
                key={settlement.id}
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
            <Text style={styles.noSettlementsTitle}>¡Perfecto!</Text>
            <Text style={styles.noSettlementsText}>
              Todas las cuentas están equilibradas
            </Text>
          </View>
        )}
      </Card>

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
                <View key={participantId} style={styles.categoryItem}>
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
              ))}
          </Card>
        );
      })()}

      {/* Categorías de gastos */}
      {Object.keys(eventStats.categoryTotals).length > 0 && (
        <Card style={{ marginBottom: 16, marginHorizontal: 16 }}>
          <Text style={styles.sectionTitle}>📊 {t('expenses.byCategory')}</Text>
          {Object.entries(eventStats.categoryTotals).map(([category, total]) => (
            <View key={category} style={styles.categoryItem}>
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
          ))}
        </Card>
      )}


    </ScrollView>
  );

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
      'Crear Pagos',
      `¿Deseas crear ${settlements.length} pago${settlements.length > 1 ? 's' : ''} basado${settlements.length > 1 ? 's' : ''} en las liquidaciones pendientes?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Crear',
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
          <Text style={styles.sectionTitle}>💰 Estado de Pagos</Text>
          <View style={styles.paymentStatsContainer}>
            <View style={styles.paymentStatItem}>
              <MaterialCommunityIcons name="clock-outline" size={32} color={theme.colors.warning} />
              <Text style={styles.paymentStatValue}>
                ${totalPending.toFixed(2)}
              </Text>
              <Text style={styles.paymentStatLabel}>Pendiente</Text>
            </View>
            <View style={styles.paymentStatItem}>
              <MaterialCommunityIcons name="check-circle" size={32} color={theme.colors.success} />
              <Text style={styles.paymentStatValue}>
                ${totalPaid.toFixed(2)}
              </Text>
              <Text style={styles.paymentStatLabel}>Pagado</Text>
            </View>
          </View>
        </Card>

        {/* Botón para crear pagos desde liquidaciones */}
        {settlements.length > 0 && (
          <Button
            title={`Crear ${settlements.length} pago${settlements.length > 1 ? 's' : ''} desde liquidaciones`}
            onPress={handleCreatePaymentsFromSettlements}
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Lista de pagos */}
        <Card>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              💸 Pagos ({eventPayments.length})
            </Text>
          </View>

          {eventPayments.length > 0 ? (
            <View style={styles.paymentsContainer}>
              {eventPayments.map((payment) => {
                const fromParticipant = eventParticipants.find(p => p.id === payment.fromParticipantId);
                const toParticipant = eventParticipants.find(p => p.id === payment.toParticipantId);

                return (
                  <View key={payment.id} style={styles.paymentItem}>
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
                          <Text style={styles.receiptLabel}>Ver comprobante</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.addReceiptButton}
                          onPress={() => handleAddReceiptToPayment(payment.id)}
                        >
                          <MaterialCommunityIcons name="camera-plus" size={24} color={theme.colors.primary} />
                          <Text style={styles.addReceiptText}>Agregar comprobante</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
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
              <Text style={styles.emptyText}>No hay pagos registrados</Text>
              <Text style={styles.emptySubtext}>
                {settlements.length > 0 
                  ? 'Crea pagos desde las liquidaciones pendientes' 
                  : 'Agrega gastos para generar liquidaciones'}
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
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
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
          text: 'Cancelar',
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
          <Text style={styles.errorText}>Evento no encontrado</Text>
          <Button
            title="Volver"
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
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom', 'left', 'right']}>
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
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top', 'bottom', 'left', 'right']}>
          <View style={{ flex: 1 }}>
            {/* Header genérico */}
            <HeaderBar 
              title={t('expenses.detailTitle')}
              titleAlignment="left"
              showBackButton={false}
              useDynamicColors={true}
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
                        <View key={split.id} style={styles.expenseDetailRow}>
                          <Text style={styles.expenseDetailLabel}>• {participant?.name}:</Text>
                          <Text style={styles.expenseDetailValue}>${split.amount.toFixed(2)}</Text>
                        </View>
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
        transparent={false}
        statusBarTranslucent={true}
        onRequestClose={() => {
          setParticipantInfoModalVisible(false);
          setSelectedParticipantForInfo(null);
        }}
      >
        <ParticipantInfoModalContent
          participant={selectedParticipantForInfo}
          onClose={() => {
            setParticipantInfoModalVisible(false);
            setSelectedParticipantForInfo(null);
          }}
          eventStats={eventStats}
          balance={selectedParticipantForInfo ? balances[selectedParticipantForInfo.id] || 0 : 0}
        />
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
        useDynamicColors={true}
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
                  {new Date(participant.createdAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
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
  const [name, setName] = useState(participant?.name || '');
  const [email, setEmail] = useState(participant?.email || '');
  const [phone, setPhone] = useState(participant?.phone || '');
  const [aliasCbu, setAliasCbu] = useState(participant?.alias_cbu || '');
  const [convertToFriend, setConvertToFriend] = useState(false);

  if (!participant) return null;

  return (
    <View style={{ flex: 1 }}>
      <HeaderBar 
        title="Editar Participante"
        titleAlignment="left"
        showBackButton={false}
        useDynamicColors={true}
      />

      <ScrollView style={{ flex: 1, padding: 20 }}>
        <Card>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6, color: theme.colors.onSurface }}>Nombre *</Text>
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
              placeholder="Nombre del participante"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6, color: theme.colors.onSurface }}>CBU/Alias (Opcional)</Text>
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
              placeholder="Alias o CBU para pagos"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={aliasCbu}
              onChangeText={setAliasCbu}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6, color: theme.colors.onSurface }}>Teléfono (Opcional)</Text>
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
              placeholder="+54 9 11 1234-5678"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          {convertToFriend && (
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6, color: theme.colors.onSurface }}>Email (Opcional)</Text>
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
                placeholder="correo@ejemplo.com"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={email}
                onChangeText={setEmail}
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
                ⭐ Convertir en Amigo Permanente
              </Text>
              <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                Aparecerá en "Mis Amigos" y podrás agregarlo fácilmente a otros eventos
              </Text>
            </View>
          </TouchableOpacity>

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
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.onSurfaceVariant }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: theme.colors.primary,
                paddingVertical: 14,
                borderRadius: 8,
                alignItems: 'center'
              }}
              onPress={() => onSave(name, email, phone, aliasCbu, convertToFriend)}
              disabled={!name.trim()}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.onPrimary }}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

