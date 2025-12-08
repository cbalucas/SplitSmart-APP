import React, { useState, useEffect, useCallback } from 'react';
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
  Switch
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Event, Expense, Participant, EventParticipant, Split, Payment, Settlement } from '../../types';
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
  const [collapsedExpenses, setCollapsedExpenses] = useState<Record<string, boolean>>({});
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Estados de filtros y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [participantSearchQuery, setParticipantSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('todos');
  const [filterPayer, setFilterPayer] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description'>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Use calculations hook for balance and settlement calculations
  const { balances, settlements, eventStats } = useCalculations(
    eventParticipants,
    eventExpenses,
    eventSplits
  );

  const loadEventData = useCallback(async () => {
    // Buscar el evento en los datos de SQLite
    const foundEvent = events.find(e => e.id === eventId);
    setEvent(foundEvent || null);
    
    if (eventId && foundEvent) {
      try {
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
      } catch (error) {
        console.error('Error loading event data:', error);
        // Set empty arrays if error
        setEventExpenses([]);
        setEventParticipants([]);
        setEventSplits([]);
        setEventPayments([]);
        setDbSettlements([]);
      }
    }
  }, [eventId, events, participants, expenses, getExpensesByEvent, getEventParticipants, getSplitsByEvent, getPaymentsByEvent]);

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  // Efecto para detectar cambios pasivos en datos globales que afecten este evento
  useEffect(() => {
    if (!eventId) return;
    
    // Solo refrescar si hay cambios relevantes que puedan afectar los cálculos
    const shouldRefresh = () => {
      // Verificar si hay cambios en gastos de este evento
      const currentEventExpenses = expenses.filter(e => e.eventId === eventId);
      if (currentEventExpenses.length !== eventExpenses.length) return true;
      
      // Verificar cambios en los montos de gastos
      for (const expense of currentEventExpenses) {
        const localExpense = eventExpenses.find(e => e.id === expense.id);
        if (!localExpense || localExpense.amount !== expense.amount || localExpense.payerId !== expense.payerId) {
          return true;
        }
      }
      
      return false;
    };

    if (shouldRefresh()) {
      console.log('🔄 Detectado cambio pasivo en datos del evento, refrescando...');
      loadEventData();
    }
  }, [expenses, eventId, eventExpenses, loadEventData]);

  // Refrescar datos cuando regresamos a la pantalla (ej: después de crear/editar gastos)
  useFocusEffect(
    useCallback(() => {
      console.log('🎯 EventDetail enfocado, refrescando datos...');
      loadEventData();
    }, [loadEventData])
  );

  const handleAddExpense = () => {
    if (event?.status === 'closed' || event?.status === 'completed') {
      Alert.alert('Evento Cerrado', 'No se pueden agregar gastos en un evento cerrado');
      return;
    }
    (navigation as any).navigate('CreateExpense', { eventId });
  };

  const handleEditExpense = (expense: Expense) => {
    if (event?.status === 'closed' || event?.status === 'completed') {
      Alert.alert('Evento Cerrado', 'No se pueden editar gastos en un evento cerrado');
      return;
    }
    (navigation as any).navigate('CreateExpense', { 
      eventId,
      expenseId: expense.id,
      isEditing: true 
    });
  };

  const handleDeleteExpense = (expense: Expense) => {
    if (event?.status === 'closed' || event?.status === 'completed') {
      Alert.alert('Evento Cerrado', 'No se pueden eliminar gastos en un evento cerrado');
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
              Alert.alert('Éxito', 'Gasto eliminado correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el gasto');
            }
          },
        },
      ]
    );
  };

  const handleEditParticipant = (participant: Participant) => {
    if (event?.status === 'closed' || event?.status === 'completed') {
      Alert.alert('Evento Cerrado', 'No se pueden editar participantes en un evento cerrado');
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
      Alert.alert('Error', 'El nombre es obligatorio');
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
        Alert.alert('✅ Convertido a Amigo', `${name} ahora es un amigo permanente y aparecerá en "Mis Amigos"`);
      } else {
        Alert.alert('✅ Actualizado', 'Participante actualizado correctamente');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el participante');
    }
  };

  const handleRemoveParticipant = (participant: any) => {
    if (event?.status === 'closed' || event?.status === 'completed') {
      Alert.alert('Evento Cerrado', 'No se pueden eliminar participantes en un evento cerrado');
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
              Alert.alert('Éxito', 'Participante eliminado correctamente');
            } catch (error: any) {
              console.error('Error removing participant:', error);
              Alert.alert('Error', error.message || 'No se pudo eliminar el participante');
            }
          },
        },
      ]
    );
  };

  // Settlement handlers
  const handleToggleSettlementPaid = async (settlementId: string, isPaid: boolean) => {
    try {
      await databaseService.updateSettlement(settlementId, {
        isPaid,
        paidAt: isPaid ? new Date().toISOString() : null
      });
      await loadEventData();
      
      // Check if all settlements are paid to auto-complete event
      const updatedSettlements = await databaseService.getSettlementsByEvent(eventId);
      const allPaid = updatedSettlements.every((s: any) => s.isPaid);
      
      if (allPaid && event?.status === 'closed') {
        await updateEvent(eventId, {
          status: 'completed',
          completedAt: new Date().toISOString()
        });
        await loadEventData();
        Alert.alert('🎉 ¡Evento Completado!', 'Todas las liquidaciones han sido pagadas');
      }
    } catch (error) {
      console.error('Error toggling settlement paid:', error);
      Alert.alert('Error', 'No se pudo actualizar el estado del pago');
    }
  };

  const handleUpdateSettlementReceipt = async (settlementId: string, imageUri: string | null) => {
    try {
      await databaseService.updateSettlement(settlementId, {
        receiptImage: imageUri
      });
      await loadEventData();
      Alert.alert('✅', imageUri ? 'Comprobante agregado' : 'Comprobante eliminado');
    } catch (error) {
      console.error('Error updating settlement receipt:', error);
      Alert.alert('Error', 'No se pudo actualizar el comprobante');
    }
  };

  const handleCloseEvent = async () => {
    if (!event) return;

    Alert.alert(
      '🔒 Cerrar Evento',
      'Al cerrar el evento no podrás agregar, editar o eliminar gastos ni participantes. Solo podrás marcar las liquidaciones como pagadas.\n\n¿Deseas continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Evento',
          style: 'destructive',
          onPress: async () => {
            try {
              // Generate settlements from calculated balances
              await databaseService.deleteSettlementsByEvent(eventId);
              
              for (const settlement of settlements) {
                const newSettlement = {
                  id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                  eventId,
                  fromParticipantId: settlement.fromParticipantId,
                  fromParticipantName: settlement.fromParticipantName,
                  toParticipantId: settlement.toParticipantId,
                  toParticipantName: settlement.toParticipantName,
                  amount: settlement.amount,
                  isPaid: false,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                };
                await databaseService.createSettlement(newSettlement);
              }

              await updateEvent(eventId, {
                status: 'closed',
                closedAt: new Date().toISOString()
              });
              await loadEventData();
              Alert.alert('✅ Evento Cerrado', 'El evento ha sido cerrado. Ahora solo puedes marcar pagos.');
            } catch (error) {
              console.error('Error closing event:', error);
              Alert.alert('Error', 'No se pudo cerrar el evento');
            }
          }
        }
      ]
    );
  };

  const handleReopenEvent = async () => {
    if (!event) return;

    Alert.alert(
      '🔓 Reabrir Evento',
      '¿Deseas reabrir el evento? Podrás volver a editar gastos y participantes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reabrir',
          onPress: async () => {
            try {
              await updateEvent(eventId, {
                status: 'active',
                closedAt: undefined
              });
              await loadEventData();
              Alert.alert('✅ Evento Reabierto', 'El evento está activo nuevamente');
            } catch (error) {
              console.error('Error reopening event:', error);
              Alert.alert('Error', 'No se pudo reabrir el evento');
            }
          }
        }
      ]
    );
  };

  const handleShareSummary = () => {
    if (!event) return;

    const totalAmount = calculateTotalExpenses();
    const participantCount = eventParticipants.length;
    
    let message = `📊 *RESUMEN - ${event.name}*\n\n`;
    message += `💰 *Total gastado:* ${event.currency} $${totalAmount.toFixed(2)}\n`;
    message += `👥 *Participantes:* ${participantCount}\n\n`;
    
    message += `💸 *LIQUIDACIÓN DE CUENTAS:*\n`;
    if (settlements.length > 0) {
      // Agrupar liquidaciones por destinatario (quien recibe el dinero)
      const settlementsByRecipient = settlements.reduce((acc, settlement) => {
        const toId = settlement.toParticipantId;
        if (!acc[toId]) {
          acc[toId] = [];
        }
        acc[toId].push(settlement);
        return acc;
      }, {} as Record<string, typeof settlements>);

      // Generar mensaje agrupado por destinatario
      Object.entries(settlementsByRecipient).forEach(([toId, settlementsForRecipient]) => {
        const recipient = eventParticipants.find(p => p.id === toId);
        const recipientName = recipient?.name || '';
        const cbuAlias = recipient?.alias_cbu || 'CBU no disponible';
        
        message += `*${recipientName}* => ${cbuAlias}\n`;
        settlementsForRecipient.forEach((settlement) => {
          const from = eventParticipants.find(p => p.id === settlement.fromParticipantId);
          const fromName = from?.name || '';
          
          // Verificar si existe un pago confirmado para esta liquidación
          const payment = eventPayments.find(p => 
            p.fromParticipantId === settlement.fromParticipantId &&
            p.toParticipantId === settlement.toParticipantId &&
            p.isConfirmed
          );
          
          const paymentStatus = payment ? ' ✅ PAGADO' : '';
          message += `• ${fromName} → ${recipientName}: $${settlement.amount.toFixed(2)}${paymentStatus}\n`;
        });
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
            'WhatsApp no disponible', 
            'El resumen se copió al portapapeles. Puedes pegarlo en cualquier aplicación.',
            [{ text: 'OK' }]
          );
        }
      })
      .catch((err) => {
        console.error('Error opening WhatsApp:', err);
        // Si hay error, copiar al portapapeles como fallback
        Clipboard.setString(message);
        Alert.alert(
          'Error al abrir WhatsApp',
          'El resumen se copió al portapapeles. Puedes pegarlo en cualquier aplicación.',
          [{ text: 'OK' }]
        );
      });
  };

  const handleShareEvent = () => {
    if (!event) return;

    const totalAmount = calculateTotalExpenses();
    
    let message = `🎉 *${event.name}*\n\n`;
    
    if (event.description) {
      message += `📝 ${event.description}\n\n`;
    }
    
    if (event.location) {
      message += `📍 *Ubicación:* ${event.location}\n`;
    }
    
    message += `📅 *Fecha:* ${new Date(event.startDate).toLocaleDateString()}\n`;
    message += `💰 *Moneda:* ${event.currency}\n`;
    message += `📊 *Estado:* ${event.status === 'active' ? 'Activo' : event.status === 'completed' ? 'Completado' : 'Archivado'}\n\n`;
    
    message += `👥 *PARTICIPANTES (${eventParticipants.length}):*\n`;
    eventParticipants.forEach((p) => {
      message += `• ${p.name}\n`;
    });
    
    message += `\n💸 *GASTOS (${eventExpenses.length}):*\n`;
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
        message += `*${payer?.name}*\n`;
        
        expenses.forEach((expense) => {
          // Buscar splits para verificar exclusiones
          const expenseSplits = eventSplits.filter(split => split.expenseId === expense.id);
          const includedParticipantIds = expenseSplits.map(split => split.participantId);
          const excludedParticipants = eventParticipants.filter(p => !includedParticipantIds.includes(p.id));
          
          let expenseLine = `• ${expense.description}: $${expense.amount.toFixed(2)}`;
          
          // Agregar exclusiones si existen
          if (excludedParticipants.length > 0 && excludedParticipants.length < eventParticipants.length) {
            const excludedNames = excludedParticipants.map(p => p.name).join(' - ');
            expenseLine += ` | Excep: ${excludedNames}`;
          }
          
          message += `${expenseLine}\n`;
        });
      });
      
      message += `\n💵 *TOTAL: $${totalAmount.toFixed(2)}*\n`;
    } else {
      message += `Sin gastos registrados\n`;
    }
    
    message += `\n💸 *LIQUIDACIÓN:*\n`;
    if (settlements.length > 0) {
      // Agrupar liquidaciones por destinatario (quien recibe el dinero)
      const settlementsByRecipient = settlements.reduce((acc, settlement) => {
        const toId = settlement.toParticipantId;
        if (!acc[toId]) {
          acc[toId] = [];
        }
        acc[toId].push(settlement);
        return acc;
      }, {} as Record<string, typeof settlements>);

      // Generar mensaje agrupado por destinatario
      Object.entries(settlementsByRecipient).forEach(([toId, settlementsForRecipient]) => {
        const recipient = eventParticipants.find(p => p.id === toId);
        const recipientName = recipient?.name || '';
        const cbuAlias = recipient?.alias_cbu || 'CBU no disponible';
        
        message += `*${recipientName}* => ${cbuAlias}\n`;
        settlementsForRecipient.forEach((settlement) => {
          const from = eventParticipants.find(p => p.id === settlement.fromParticipantId);
          const fromName = from?.name || '';
          
          // Verificar si existe un pago confirmado para esta liquidación
          const payment = eventPayments.find(p => 
            p.fromParticipantId === settlement.fromParticipantId &&
            p.toParticipantId === settlement.toParticipantId &&
            p.isConfirmed
          );
          
          const paymentStatus = payment ? ' ✅ PAGADO' : '';
          message += `• ${fromName} → ${recipientName}: $${settlement.amount.toFixed(2)}${paymentStatus}\n`;
        });
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
            'WhatsApp no disponible',
            'El evento se copió al portapapeles. Puedes pegarlo en cualquier aplicación.',
            [{ text: 'OK' }]
          );
        }
      })
      .catch((err) => {
        console.error('Error opening WhatsApp:', err);
        // Si hay error, copiar al portapapeles como fallback
        Clipboard.setString(message);
        Alert.alert(
          'Error al abrir WhatsApp',
          'El evento se copió al portapapeles. Puedes pegarlo en cualquier aplicación.',
          [{ text: 'OK' }]
        );
      });
  };

  const handleAddExpenseOld = () => {
    Alert.prompt(
      '💸 Agregar Gasto',
      'Ingresa la descripción del gasto:',
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
                        
                        Alert.alert('✅ Gasto agregado', 'El gasto se agregó correctamente');
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
    
    if (existingParticipant) {
      // Participant already exists, just add to event
      addExistingParticipantToEvent(eventId, participant)
        .then(() => {
          loadEventData();
          Alert.alert('✅ Participante agregado', `${participant.name} se agregó al evento`);
        })
        .catch((error) => {
          console.error('Error adding existing participant:', error);
          Alert.alert('Error', 'No se pudo agregar el participante');
        });
    } else {
      // New participant, create and add to event
      addParticipantToEvent(eventId, participant)
        .then(() => {
          loadEventData();
          Alert.alert('✅ Participante agregado', `${participant.name} se agregó al evento`);
        })
        .catch((error) => {
          console.error('Error adding new participant:', error);
          Alert.alert('Error', 'No se pudo agregar el participante');
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
        { key: 'resumen', title: 'Resumen', icon: 'chart-pie' as const },
        { key: 'participantes', title: 'Participantes', icon: 'account-group' as const },
        { key: 'gastos', title: 'Gastos', icon: 'cash' as const }
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

  const renderGastosTab = () => {
    const filteredExpenses = getFilteredAndSortedExpenses();
    
    return (
      <View style={styles.tabContent}>
        {/* Barra de búsqueda simple */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar gastos..."
            showClearButton={true}
            onClear={() => setSearchQuery('')}
          />
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '600' }}>
              💸 Gastos ({filteredExpenses.length}{filteredExpenses.length !== eventExpenses.length ? ` de ${eventExpenses.length}` : ''})
            </Text>
            {event?.status === 'active' && (
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 }}
                onPress={handleAddExpense}
              >
                <MaterialCommunityIcons name="plus" size={16} color={theme.colors.onPrimary} />
                <Text style={{ color: theme.colors.onPrimary, marginLeft: 4, fontSize: 14, fontWeight: '500' }}>Agregar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={{ flex: 1 }}>
          <Card>
            {filteredExpenses.length === 0 && eventExpenses.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="receipt" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No hay gastos registrados</Text>
                <Text style={styles.emptySubtext}>Toca "Agregar" para crear el primer gasto</Text>
              </View>
            ) : filteredExpenses.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="filter-remove" size={48} color="#ccc" />
                <Text style={styles.emptyText}>No se encontraron gastos</Text>
                <Text style={styles.emptySubtext}>Intenta con otros filtros o búsqueda</Text>
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
                <View style={styles.expenseItem}>
                  <View style={styles.expenseHeader}>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseDescription}>{item.description}</Text>
                      <Text style={styles.expenseDate}>
                        {new Date(item.date).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.expenseAmount}>
                      ${item.amount.toFixed(2)} {item.currency}
                    </Text>
                  </View>
                  <Text style={styles.expensePaidBy}>
                    Pagado por: {eventParticipants.find(p => p.id === item.payerId)?.name || 'Usuario Demo'}
                  </Text>
                  
                  {/* Imagen del comprobante */}
                  {item.receiptImage && (
                    <TouchableOpacity
                      style={{ marginTop: 8, marginBottom: 8 }}
                      onPress={() => {
                        setSelectedImage(item.receiptImage!);
                        setShowImageModal(true);
                      }}
                    >
                      <Image
                        source={{ uri: item.receiptImage }}
                        style={{ width: '100%', height: 150, borderRadius: 8 }}
                        resizeMode="cover"
                      />
                      <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 }}>
                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500' }}>📷 Comprobante</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                  
                  {/* División del gasto - Desplegable */}
                  <TouchableOpacity 
                    style={styles.expenseSplitsHeader}
                    onPress={() => setCollapsedExpenses(prev => ({
                      ...prev,
                      [item.id]: !prev[item.id]
                    }))}
                  >
                    <Text style={styles.splitsTitle}>
                      División ({expenseSplits.length} part | {excludedParticipants.length} exc)
                    </Text>
                    <MaterialCommunityIcons 
                      name={collapsedExpenses[item.id] ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#666" 
                    />
                  </TouchableOpacity>
                  
                  {collapsedExpenses[item.id] && (
                    <>
                      <View style={styles.expenseSplits}>
                        {expenseSplits.map(split => {
                          const participant = eventParticipants.find(p => p.id === split.participantId);
                          return (
                            <Text key={split.id} style={styles.splitItem}>
                              • {participant?.name}: ${split.amount.toFixed(2)}
                            </Text>
                          );
                        })}
                      </View>
                      
                      {/* Participantes excluidos */}
                      {excludedParticipants.length > 0 && (
                        <View style={styles.excludedParticipants}>
                          <Text style={styles.excludedTitle}>Excluidos:</Text>
                          <Text style={styles.excludedNames}>
                            {excludedParticipants.map(p => p.name).join(', ')}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                  
                  <View style={styles.expenseActions}>
                    {event?.status === 'active' && (
                      <>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleEditExpense(item)}
                        >
                          <MaterialCommunityIcons name="pencil" size={16} color="#666" />
                          <Text style={styles.actionText}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.actionButton}
                          onPress={() => handleDeleteExpense(item)}
                        >
                          <MaterialCommunityIcons name="delete" size={16} color="#ff4444" />
                          <Text style={[styles.actionText, { color: '#ff4444' }]}>Eliminar</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
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
        {/* Barra de búsqueda de participantes */}
        <SearchBar
          value={participantSearchQuery}
          onChangeText={setParticipantSearchQuery}
          placeholder="Buscar participantes..."
          showClearButton={true}
          onClear={() => setParticipantSearchQuery('')}
        />
        
        <Card>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              👥 Participantes ({visibleParticipants.length}{visibleParticipants.length !== eventParticipants.length ? ` de ${eventParticipants.length}` : ''})
            </Text>
            {event?.status === 'active' && (
              <TouchableOpacity style={styles.addButton} onPress={() => setShowAddParticipantModal(true)}>
                <MaterialCommunityIcons name="plus" size={16} color="#007AFF" />
                <Text style={styles.addButtonText}>Agregar</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {visibleParticipants.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-group" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No hay participantes</Text>
              <Text style={styles.emptySubtext}>Agrega participantes para dividir los gastos</Text>
            </View>
          ) : (
            visibleParticipants.map(participant => {
            const participantBalance = balances.find(b => b.participantId === participant.id);
            const totalPaid = participantBalance?.totalPaid || 0;
            const totalOwed = participantBalance?.totalOwed || 0;
            const balance = totalPaid - totalOwed; // Lo que pagó - lo que debe
            
            return (
              <View key={participant.id} style={styles.participantItem}>
                <View style={styles.participantInfo}>
                  <View style={styles.participantAvatar}>
                    <Text style={styles.avatarText}>
                      {participant.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.participantDetails}>
                    <View style={styles.participantNameContainer}>
                      <Text style={styles.participantName}>{participant.name}</Text>
                    </View>
                    {participant.email && (
                      <Text style={styles.participantEmail}>{participant.email}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.participantRightSection}>
                  <View style={styles.participantStats}>
                    <Text style={[
                      styles.participantBalance,
                      {
                        color: balance > 0.01 ? '#4CAF50' : 
                               balance < -0.01 ? '#FF4444' : '#666'
                      }
                    ]}>
                      {balance > 0.01 ? `+$${balance.toFixed(2)}` :
                       balance < -0.01 ? `-$${Math.abs(balance).toFixed(2)}` :
                       '$0.00'}
                    </Text>
                    <Text style={styles.participantBalanceLabel}>
                      {balance > 0.01 ? 'Se le debe' :
                       balance < -0.01 ? 'Debe pagar' :
                       'Equilibrado'}
                    </Text>
                  </View>
                  {event?.status === 'active' && (
                    <View style={styles.participantActions}>
                      {participant.participantType === 'temporary' && (
                        <TouchableOpacity 
                          style={styles.editParticipantButton}
                          onPress={() => handleEditParticipant(participant)}
                        >
                          <MaterialCommunityIcons name="pencil" size={18} color="#007AFF" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity 
                        style={styles.removeParticipantButton}
                        onPress={() => handleRemoveParticipant(participant)}
                      >
                        <MaterialCommunityIcons name="close" size={20} color="#ff4444" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </Card>
      </View>
    );
  };

  const renderResumenTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Acciones rápidas + Botones de acción */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity 
            style={{ padding: 8, marginRight: 8 }} 
            onPress={handleShareSummary}
          >
            <MaterialCommunityIcons name="file-document-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ padding: 8 }} 
            onPress={handleShareEvent}
          >
            <MaterialCommunityIcons name="share-variant" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        {/* Botón Cerrar/Reabrir Evento */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {event?.status === 'active' ? (
            <TouchableOpacity
              onPress={settlements.length > 0 ? handleCloseEvent : undefined}
              disabled={settlements.length === 0}
              style={{ 
                backgroundColor: settlements.length > 0 ? '#007AFF' : '#CCCCCC', 
                paddingHorizontal: 12, 
                paddingVertical: 8, 
                borderRadius: 8, 
                flexDirection: 'row', 
                alignItems: 'center',
                opacity: settlements.length > 0 ? 1 : 0.6
              }}
            >
              <MaterialCommunityIcons name="lock" size={16} color="#FFF" style={{ marginRight: 6 }} />
              <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 14 }}>Cerrar Evento</Text>
            </TouchableOpacity>
          ) : event?.status === 'closed' ? (
            <TouchableOpacity
              onPress={handleReopenEvent}
              style={{ backgroundColor: '#FFF', borderWidth: 1, borderColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center' }}
            >
              <MaterialCommunityIcons name="lock-open" size={16} color="#007AFF" style={{ marginRight: 6 }} />
              <Text style={{ color: '#007AFF', fontWeight: '600', fontSize: 14 }}>Reabrir</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Información del evento */}
      <Card style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>📋 Información del Evento</Text>
          {event && (
            <View style={{ 
              backgroundColor: event.status === 'active' ? '#E8F5E9' : 
                             event.status === 'closed' ? '#FFF3E0' :
                             event.status === 'completed' ? '#E3F2FD' : '#F5F5F5',
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12
            }}>
              <Text style={{ 
                color: event.status === 'active' ? '#2E7D32' : 
                       event.status === 'closed' ? '#E65100' :
                       event.status === 'completed' ? '#1976D2' : '#616161',
                fontSize: 12,
                fontWeight: '600'
              }}>
                {event.status === 'active' ? '🟢 Activo' : 
                 event.status === 'closed' ? '🔒 Cerrado' :
                 event.status === 'completed' ? '✅ Completado' : '📁 Archivado'}
              </Text>
            </View>
          )}
        </View>
        {event && (
          <View style={styles.summaryInfo}>
            <Text style={styles.eventName}>{event.name}</Text>
            {event.description && (
              <Text style={styles.eventDescription}>{event.description}</Text>
            )}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
              {event.location && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 8 }}>
                  <MaterialCommunityIcons name="map-marker" size={16} color="#E53935" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 14, color: theme.colors.onSurfaceVariant }}>{event.location}</Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16, marginBottom: 8 }}>
                <MaterialCommunityIcons name="calendar" size={16} color="#1E88E5" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 14, color: theme.colors.onSurfaceVariant }}>
                  {new Date(event.startDate).toLocaleDateString()}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialCommunityIcons name="currency-usd" size={16} color="#43A047" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 14, color: theme.colors.onSurfaceVariant }}>Moneda: {event.currency}</Text>
              </View>
            </View>
            
            {/* Estadísticas inline */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E0E0E0' }}>
              <View style={{ alignItems: 'center' }}>
                <MaterialCommunityIcons name="account-group" size={20} color="#2196F3" />
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#333', marginTop: 4 }}>{eventParticipants.length}</Text>
                <Text style={{ fontSize: 11, color: theme.colors.onSurfaceVariant }}>Participantes</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <MaterialCommunityIcons name="receipt" size={20} color="#FF9800" />
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#333', marginTop: 4 }}>{eventExpenses.length}</Text>
                <Text style={{ fontSize: 11, color: '#666' }}>Gastos</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <MaterialCommunityIcons name="cash" size={20} color="#4CAF50" />
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#333', marginTop: 4 }}>
                  ${calculateTotalExpenses().toFixed(2)}
                </Text>
                <Text style={{ fontSize: 11, color: '#666' }}>Total Gastado</Text>
              </View>
            </View>
          </View>
        )}
      </Card>

      {/* Liquidación de cuentas */}
      <Card style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={styles.sectionTitle}>💸 Liquidación de Cuentas</Text>
          {event?.status === 'closed' && dbSettlements.length > 0 && (
            <View style={{ backgroundColor: '#FF9800', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '600' }}>
                {dbSettlements.filter((s: Settlement) => s.isPaid).length}/{dbSettlements.length} Pagadas
              </Text>
            </View>
          )}
        </View>

        {event?.status === 'active' && settlements.length > 0 && (
          <View style={{ backgroundColor: '#FFF3E0', padding: 12, borderRadius: 8, marginBottom: 12 }}>
            <Text style={{ color: '#E65100', fontSize: 13 }}>
              ℹ️ Cierra el evento para poder marcar las liquidaciones como pagadas
            </Text>
          </View>
        )}

        {(event?.status === 'closed' || event?.status === 'completed') && dbSettlements.length > 0 ? (
          <View>
            {dbSettlements.map((settlement: Settlement) => (
              <SettlementItem
                key={settlement.id}
                settlement={settlement}
                currency={event?.currency || 'ARS'}
                onTogglePaid={handleToggleSettlementPaid}
                onUpdateReceipt={handleUpdateSettlementReceipt}
                disabled={event?.status === 'completed'}
              />
            ))}
          </View>
        ) : event?.status === 'active' && settlements.length > 0 ? (
          <View style={styles.settlementsContainer}>
            {settlements.map((settlement, index) => {
              const fromParticipant = eventParticipants.find(p => p.id === settlement.fromParticipantId);
              const toParticipant = eventParticipants.find(p => p.id === settlement.toParticipantId);
              
              return (
                <View key={index} style={styles.settlementItem}>
                  <Text style={styles.settlementDescription}>
                    <Text style={{ fontWeight: '600' }}>{fromParticipant?.name}</Text>
                    {' → '}
                    <Text style={{ fontWeight: '600' }}>{toParticipant?.name}</Text>
                  </Text>
                  <Text style={styles.settlementAmount}>
                    {event.currency} ${settlement.amount.toFixed(2)}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.noSettlementsContainer}>
            <MaterialCommunityIcons 
              name="check-circle" 
              size={48} 
              color="#4CAF50" 
              style={styles.noSettlementsIcon}
            />
            <Text style={styles.noSettlementsTitle}>¡Perfecto!</Text>
            <Text style={styles.noSettlementsText}>
              Todas las cuentas están equilibradas
            </Text>
          </View>
        )}
      </Card>

      {/* Categorías de gastos */}
      {Object.keys(eventStats.categoryTotals).length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>📊 Gastos por Categoría</Text>
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
      Alert.alert('Error', 'No se pudo actualizar el estado del pago');
    }
  };

  const handleAddReceiptToPayment = async (paymentId: string) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await updatePayment(paymentId, { receiptImage: result.assets[0].uri });
        await loadEventData();
        Alert.alert('Éxito', 'Comprobante agregado correctamente');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo agregar el comprobante');
    }
  };

  const handleCreatePaymentsFromSettlements = async () => {
    if (settlements.length === 0) {
      Alert.alert('Sin liquidaciones', 'No hay liquidaciones pendientes para crear pagos');
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
                  notes: 'Pago creado desde liquidación',
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
              Alert.alert('Éxito', `${settlements.length} pago${settlements.length > 1 ? 's' : ''} creado${settlements.length > 1 ? 's' : ''} correctamente`);
            } catch (error) {
              console.error('❌ Error creating payments from settlements:', error);
              Alert.alert('Error', 'No se pudieron crear los pagos');
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
        <Card style={{ marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>💰 Estado de Pagos</Text>
          <View style={styles.paymentStatsContainer}>
            <View style={styles.paymentStatItem}>
              <MaterialCommunityIcons name="clock-outline" size={32} color="#FF9800" />
              <Text style={styles.paymentStatValue}>
                ${totalPending.toFixed(2)}
              </Text>
              <Text style={styles.paymentStatLabel}>Pendiente</Text>
            </View>
            <View style={styles.paymentStatItem}>
              <MaterialCommunityIcons name="check-circle" size={32} color="#4CAF50" />
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
                        trackColor={{ false: '#ccc', true: '#4CAF50' }}
                        thumbColor={payment.isConfirmed ? '#fff' : '#f4f3f4'}
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
                          <MaterialCommunityIcons name="camera-plus" size={24} color="#007AFF" />
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
                color="#ccc" 
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
      'Eliminar Evento',
      `¿Estás seguro de que quieres eliminar "${event.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEvent(event.id);
              Alert.alert('Éxito', 'Evento eliminado correctamente');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el evento');
            }
          }
        }
      ]
    );
  };

  const showEventOptions = () => {
    if (!event) return;
    Alert.alert(
      'Opciones del Evento',
      `Selecciona una acción para "${event.name}"`,
      [
        {
          text: 'Editar Evento',
          onPress: handleEditEvent
        },
        {
          text: 'Eliminar Evento',
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
          <MaterialCommunityIcons name="alert-circle" size={48} color="#ff4444" />
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
        showBackButton={true}
        onLeftPress={() => navigation.goBack()}
        showThemeToggle={true}
        showLanguageSelector={true}
        useDynamicColors={true}
        elevation={true}
      />
      
      <SafeAreaView style={styles.safeContent} edges={['bottom', 'left', 'right']}>
        {/* Tab Bar */}
        {renderTabBar()}

        {/* Tab Content */}
        {renderTabContent()}
      </SafeAreaView>

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
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }} edges={['top', 'bottom', 'left', 'right']}>
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

      {/* Modal de Visualización de Imagen */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: 40, right: 20, zIndex: 10 }}
            onPress={() => setShowImageModal(false)}
          >
            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 8 }}>
              <MaterialCommunityIcons name="close" size={28} color="#fff" />
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
    </View>
  );
}

// Componente interno para el modal de edición
const EditParticipantModalContent: React.FC<{
  participant: Participant | null;
  onSave: (name: string, email?: string, phone?: string, aliasCbu?: string, convertToFriend?: boolean) => void;
  onCancel: () => void;
}> = ({ participant, onSave, onCancel }) => {
  const [name, setName] = useState(participant?.name || '');
  const [email, setEmail] = useState(participant?.email || '');
  const [phone, setPhone] = useState(participant?.phone || '');
  const [aliasCbu, setAliasCbu] = useState(participant?.alias_cbu || '');
  const [convertToFriend, setConvertToFriend] = useState(false);

  if (!participant) return null;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onCancel}>
          <MaterialCommunityIcons name="close" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Editar Participante</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1, padding: 20 }}>
        <Card>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6 }}>Nombre *</Text>
            <TextInput
              style={{
                backgroundColor: '#fff',
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16
              }}
              placeholder="Nombre del participante"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6 }}>CBU/Alias (Opcional)</Text>
            <TextInput
              style={{
                backgroundColor: '#fff',
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16
              }}
              placeholder="Alias o CBU para pagos"
              value={aliasCbu}
              onChangeText={setAliasCbu}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6 }}>Teléfono (Opcional)</Text>
            <TextInput
              style={{
                backgroundColor: '#fff',
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16
              }}
              placeholder="+54 9 11 1234-5678"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 6 }}>Email (Opcional)</Text>
            <TextInput
              style={{
                backgroundColor: '#fff',
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 8,
                paddingHorizontal: 16,
                paddingVertical: 12,
                fontSize: 16
              }}
              placeholder="correo@ejemplo.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#f0f8ff',
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: convertToFriend ? '#007AFF' : '#ddd'
            }}
            onPress={() => setConvertToFriend(!convertToFriend)}
          >
            <MaterialCommunityIcons
              name={convertToFriend ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={24}
              color="#007AFF"
            />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#333' }}>
                ⭐ Convertir en Amigo Permanente
              </Text>
              <Text style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                Aparecerá en "Mis Amigos" y podrás agregarlo fácilmente a otros eventos
              </Text>
            </View>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#f0f0f0',
                paddingVertical: 14,
                borderRadius: 8,
                alignItems: 'center'
              }}
              onPress={onCancel}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#666' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#007AFF',
                paddingVertical: 14,
                borderRadius: 8,
                alignItems: 'center'
              }}
              onPress={() => onSave(name, email, phone, aliasCbu, convertToFriend)}
              disabled={!name.trim()}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#fff' }}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerButton: {
    padding: 8
  },
  backButton: {
    padding: 8
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 16
  },
  menuButton: {
    padding: 8
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8
  },
  activeTabItem: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF'
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500'
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600'
  },
  tabContent: {
    flex: 1,
    padding: 16,
    paddingBottom: 20 // Extra padding for bottom navigation
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f8ff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#007AFF'
  },
  addButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 4
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyIcon: {
    marginBottom: 16
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    fontWeight: '500'
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center'
  },
  expenseItem: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0'
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  expenseInfo: {
    flex: 1
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4
  },
  expenseDate: {
    fontSize: 12,
    color: '#666'
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50'
  },
  expensePaidBy: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8
  },
  expenseSplitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  expenseSplits: {
    marginTop: 8
  },
  splitsTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4
  },
  splitItem: {
    fontSize: 12,
    color: '#333',
    paddingLeft: 8,
    marginBottom: 2
  },
  excludedParticipants: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff3cd',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ffeaa7'
  },
  excludedTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#856404',
    marginBottom: 2
  },
  excludedNames: {
    fontSize: 12,
    color: '#856404',
    fontStyle: 'italic'
  },
  expenseActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  participantDetails: {
    flex: 1
  },
  participantNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333'
  },
  peopleCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2
  },
  peopleCountBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  friendBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF9E6',
    alignItems: 'center',
    justifyContent: 'center'
  },
  temporaryBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center'
  },
  participantRole: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2
  },
  participantEmail: {
    fontSize: 12,
    color: '#999'
  },
  participantBreakdown: {
    fontSize: 11,
    color: '#666',
    marginTop: 2
  },


  summaryInfo: {
    gap: 8
  },
  eventName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  eventCurrency: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  eventStatus: {
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  statusActive: {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32'
  },
  statusCompleted: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2'
  },
  statusArchived: {
    backgroundColor: '#f3e5f5',
    color: '#7b1fa2'
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16
  },
  statItem: {
    alignItems: 'center',
    flex: 1
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666'
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  quickActionButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  quickActionText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500'
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32
  },
  errorText: {
    fontSize: 18,
    color: '#ff4444',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center'
  },
  errorButton: {
    paddingHorizontal: 32
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  balanceInfo: {
    flex: 1
  },
  balanceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4
  },
  balanceDetails: {
    flexDirection: 'row'
  },
  balanceSubtext: {
    fontSize: 12,
    color: '#666'
  },
  balanceAmount: {
    alignItems: 'flex-end'
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2
  },
  balanceLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center'
  },
  settlementItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8
  },
  settlementInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  settlementText: {
    flex: 1,
    fontSize: 14
  },
  settlementFrom: {
    fontWeight: '500',
    color: '#333'
  },
  settlementTo: {
    fontWeight: '500',
    color: '#333'
  },
  settlementAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 4
  },
  settlementsContainer: {
    gap: 12
  },
  settlementFromTo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  settlementParticipant: {
    alignItems: 'center',
    flex: 1
  },
  settlementArrow: {
    alignItems: 'center',
    flex: 0.5
  },
  settlementParticipantName: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center'
  },
  settlementDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic'
  },
  noSettlementsContainer: {
    alignItems: 'center',
    padding: 24
  },
  noSettlementsIcon: {
    marginBottom: 12
  },
  noSettlementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 8
  },
  noSettlementsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  },
  participantStats: {
    alignItems: 'flex-end'
  },
  participantBalance: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2
  },
  participantBalanceLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center'
  },
  settlementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4
  },
  settlementButtonText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500'
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  categoryInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 12
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333'
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  topQuickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  topQuickActionButton: {
    alignItems: 'center',
    padding: 8,
  },
  participantRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editParticipantButton: {
    padding: 4,
  },
  removeParticipantButton: {
    marginLeft: 4,
    padding: 4,
  },
  paymentStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    gap: 16
  },
  paymentStatItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12
  },
  paymentStatValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 4
  },
  paymentStatLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  },
  paymentsContainer: {
    gap: 12
  },
  paymentItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  paymentParticipants: {
    flex: 1
  },
  paymentFromTo: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF'
  },
  paymentDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  paymentNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8
  },
  receiptSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8
  },
  receiptThumbnailContainer: {
    alignItems: 'center'
  },
  receiptThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 4
  },
  receiptLabel: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500'
  },
  addReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 8
  },
  addReceiptText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500'
  }
});