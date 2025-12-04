import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Share
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { Theme } from '../../constants/theme';
import { Card, Button } from '../../components';
import { Event, Participant, Expense, Split } from '../../types';
import { useCalculations } from '../../hooks/useCalculations';

interface BalanceDisplayItem {
  participantId: string;
  participantName: string;
  balance: number;
  status: 'owes' | 'owed' | 'even';
}

interface SettlementDisplayItem {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

const SummaryScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { events, getEventParticipants, getExpensesByEvent, getSplitsByEvent } = useData();
  const styles = createStyles(theme);
  
  const eventId = (route.params as any)?.eventId as string;
  
  const [event, setEvent] = useState<Event | null>(null);
  const [eventParticipants, setEventParticipants] = useState<Participant[]>([]);
  const [eventExpenses, setEventExpenses] = useState<Expense[]>([]);
  const [eventSplits, setEventSplits] = useState<Split[]>([]);
  const [loading, setLoading] = useState(true);

  // Use calculations hook for balance and settlement calculations
  const { balances, settlements, eventStats } = useCalculations(
    eventParticipants,
    eventExpenses,
    eventSplits
  );

  // Load event data
  const loadEventData = useCallback(async () => {
    if (!eventId) return;
    
    setLoading(true);
    try {
      // Load event
      const foundEvent = events.find(e => e.id === eventId);
      if (foundEvent) {
        setEvent(foundEvent);
      }

      // Load participants, expenses and splits
      const [participants, expenses, splits] = await Promise.all([
        getEventParticipants(eventId),
        getExpensesByEvent(eventId),
        getSplitsByEvent(eventId)
      ]);

      setEventParticipants(participants);
      setEventExpenses(expenses);
      setEventSplits(splits);
      
      console.log(`📊 Summary loaded: ${participants.length} participants, ${expenses.length} expenses`);
    } catch (error) {
      console.error('Error loading event data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del evento');
    }
    setLoading(false);
  }, [eventId, events, getEventParticipants, getExpensesByEvent]);

  useEffect(() => {
    loadEventData();
  }, [loadEventData]);

  // Transform balances for display
  const balanceItems: BalanceDisplayItem[] = balances.map(balance => {
    const participant = eventParticipants.find(p => p.id === balance.participantId);
    return {
      participantId: balance.participantId,
      participantName: participant?.name || 'Desconocido',
      balance: balance.balance,
      status: balance.balance > 0.01 ? 'owed' : balance.balance < -0.01 ? 'owes' : 'even'
    };
  });

  // Transform settlements for display
  const settlementItems: SettlementDisplayItem[] = settlements.map(settlement => {
    const fromParticipant = eventParticipants.find(p => p.id === settlement.fromParticipantId);
    const toParticipant = eventParticipants.find(p => p.id === settlement.toParticipantId);
    return {
      fromId: settlement.fromParticipantId,
      fromName: fromParticipant?.name || 'Desconocido',
      toId: settlement.toParticipantId,
      toName: toParticipant?.name || 'Desconocido',
      amount: settlement.amount
    };
  });

  const handleShare = async () => {
    try {
      const summaryText = generateSummaryText();
      await Share.share({
        message: summaryText,
        title: `Resumen - ${event?.name || 'Evento'}`
      });
    } catch (error) {
      console.error('Error sharing summary:', error);
      Alert.alert('Error', 'No se pudo compartir el resumen');
    }
  };

  const generateSummaryText = (): string => {
    let text = `📊 RESUMEN DEL EVENTO\n`;
    text += `${event?.name || 'Evento'}\n`;
    text += `${new Date(event?.startDate || '').toLocaleDateString()}\n\n`;
    
    text += `💰 RESUMEN FINANCIERO\n`;
    text += `Total gastado: $${eventStats.totalExpenses.toFixed(2)} ${event?.currency || 'ARS'}\n`;
    text += `Promedio por persona: $${eventStats.averagePerPerson.toFixed(2)} ${event?.currency || 'ARS'}\n`;
    text += `Número de gastos: ${eventExpenses.length}\n`;
    text += `Participantes: ${eventParticipants.length}\n\n`;

    if (balanceItems.length > 0) {
      text += `⚖️ BALANCES\n`;
      balanceItems.forEach(balance => {
        const amount = Math.abs(balance.balance);
        if (balance.status === 'owed') {
          text += `${balance.participantName}: Le deben $${amount.toFixed(2)}\n`;
        } else if (balance.status === 'owes') {
          text += `${balance.participantName}: Debe $${amount.toFixed(2)}\n`;
        } else {
          text += `${balance.participantName}: Equilibrado\n`;
        }
      });
      text += `\n`;
    }

    if (settlementItems.length > 0) {
      text += `💸 LIQUIDACIONES SUGERIDAS\n`;
      settlementItems.forEach(settlement => {
        text += `${settlement.fromName} → ${settlement.toName}: $${settlement.amount.toFixed(2)}\n`;
      });
    }

    text += `\n📱 Generado con SplitSmart`;
    return text;
  };

  const getBalanceColor = (status: string): string => {
    switch (status) {
      case 'owed': return '#4CAF50'; // Verde - le deben
      case 'owes': return '#F44336'; // Rojo - debe
      case 'even': return '#9E9E9E'; // Gris - equilibrado
      default: return theme.colors.onSurface;
    }
  };

  const getBalanceIcon = (status: string) => {
    switch (status) {
      case 'owed': return 'arrow-down-circle' as const;
      case 'owes': return 'arrow-up-circle' as const;
      case 'even': return 'equal' as const;
      default: return 'help-circle' as const;
    }
  };

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)} ${event?.currency || 'ARS'}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <MaterialCommunityIcons
            name="loading"
            size={48}
            color={theme.colors.primary}
          />
          <Text style={styles.loadingText}>Calculando resumen...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color="#ff4444" />
          <Text style={styles.errorText}>Evento no encontrado</Text>
          <Button
            title="Volver"
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={theme.colors.onSurface}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Resumen - {event.name}
        </Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <MaterialCommunityIcons
            name="share-outline"
            size={24}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Resumen General */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>💰 Resumen General</Text>
          
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <MaterialCommunityIcons
                name="cash-multiple"
                size={24}
                color="#4CAF50"
              />
              <Text style={styles.metricValue}>
                {formatCurrency(eventStats.totalExpenses)}
              </Text>
              <Text style={styles.metricLabel}>Total Gastado</Text>
            </View>
            
            <View style={styles.metricItem}>
              <MaterialCommunityIcons
                name="account-group"
                size={24}
                color="#2196F3"
              />
              <Text style={styles.metricValue}>
                {formatCurrency(eventStats.averagePerPerson)}
              </Text>
              <Text style={styles.metricLabel}>Por Persona</Text>
            </View>
          </View>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <MaterialCommunityIcons
                name="receipt"
                size={24}
                color="#FF9800"
              />
              <Text style={styles.metricValue}>{eventExpenses.length}</Text>
              <Text style={styles.metricLabel}>Gastos</Text>
            </View>
            
            <View style={styles.metricItem}>
              <MaterialCommunityIcons
                name="calendar"
                size={24}
                color="#9C27B0"
              />
              <Text style={styles.metricValue}>
                {new Date(event.startDate).toLocaleDateString()}
              </Text>
              <Text style={styles.metricLabel}>Fecha</Text>
            </View>
          </View>
        </Card>

        {/* Balances */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>⚖️ Balances de Participantes</Text>
          
          {balanceItems.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="scale-balance"
                size={48}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={styles.emptyText}>No hay balances para mostrar</Text>
            </View>
          ) : (
            balanceItems.map((item) => (
              <View key={item.participantId} style={styles.balanceItem}>
                <View style={styles.balanceInfo}>
                  <MaterialCommunityIcons
                    name={getBalanceIcon(item.status)}
                    size={20}
                    color={getBalanceColor(item.status)}
                  />
                  <Text style={styles.balanceName}>{item.participantName}</Text>
                </View>
                <View style={styles.balanceAmount}>
                  <Text style={[
                    styles.balanceValue,
                    { color: getBalanceColor(item.status) }
                  ]}>
                    {item.status === 'owed' ? '+' : item.status === 'owes' ? '-' : ''}
                    {formatCurrency(Math.abs(item.balance))}
                  </Text>
                  <Text style={[
                    styles.balanceStatus,
                    { color: getBalanceColor(item.status) }
                  ]}>
                    {item.status === 'owed' ? 'Le deben' : 
                     item.status === 'owes' ? 'Debe' : 'Equilibrado'}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Card>

        {/* Liquidaciones Sugeridas */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>💸 Liquidaciones Sugeridas</Text>
          
          {settlementItems.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="check-circle"
                size={48}
                color="#4CAF50"
              />
              <Text style={styles.emptyText}>¡Todas las cuentas están equilibradas!</Text>
              <Text style={styles.emptySubtext}>No hay pagos pendientes</Text>
            </View>
          ) : (
            settlementItems.map((settlement, index) => (
              <View key={index} style={styles.settlementItem}>
                <View style={styles.settlementInfo}>
                  <Text style={styles.settlementFrom}>{settlement.fromName}</Text>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={20}
                    color={theme.colors.onSurfaceVariant}
                    style={styles.settlementArrow}
                  />
                  <Text style={styles.settlementTo}>{settlement.toName}</Text>
                </View>
                <Text style={styles.settlementAmount}>
                  {formatCurrency(settlement.amount)}
                </Text>
              </View>
            ))
          )}

          {settlementItems.length > 0 && (
            <View style={styles.settlementNote}>
              <MaterialCommunityIcons
                name="information-outline"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={styles.settlementNoteText}>
                Estas liquidaciones optimizan el número de transferencias necesarias
              </Text>
            </View>
          )}
        </Card>

        {/* Estadísticas por Categoría */}
        {eventExpenses.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>📊 Gastos por Categoría</Text>
            
            {/* TODO: Implementar estadísticas por categoría */}
            <View style={styles.comingSoon}>
              <MaterialCommunityIcons
                name="chart-pie"
                size={48}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={styles.comingSoonText}>Gráficos próximamente</Text>
            </View>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    } as ViewStyle,

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    } as ViewStyle,

    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 8,
    } as TextStyle,

    shareButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    scrollView: {
      flex: 1,
    } as ViewStyle,

    scrollViewContent: {
      padding: 20,
    } as ViewStyle,

    card: {
      marginBottom: 16,
    } as ViewStyle,

    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 16,
    } as TextStyle,

    metricsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    } as ViewStyle,

    metricItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
    } as ViewStyle,

    metricValue: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginTop: 4,
    } as TextStyle,

    metricLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    } as TextStyle,

    balanceItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    } as ViewStyle,

    balanceInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    } as ViewStyle,

    balanceName: {
      fontSize: 16,
      color: theme.colors.onSurface,
      marginLeft: 12,
    } as TextStyle,

    balanceAmount: {
      alignItems: 'flex-end',
    } as ViewStyle,

    balanceValue: {
      fontSize: 16,
      fontWeight: '600',
    } as TextStyle,

    balanceStatus: {
      fontSize: 12,
      marginTop: 2,
    } as TextStyle,

    settlementItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 8,
      marginBottom: 8,
    } as ViewStyle,

    settlementInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    } as ViewStyle,

    settlementFrom: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
    } as TextStyle,

    settlementArrow: {
      marginHorizontal: 8,
    } as ViewStyle,

    settlementTo: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
    } as TextStyle,

    settlementAmount: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
    } as TextStyle,

    settlementNote: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    } as ViewStyle,

    settlementNoteText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginLeft: 6,
      flex: 1,
      lineHeight: 16,
    } as TextStyle,

    emptyState: {
      alignItems: 'center',
      paddingVertical: 32,
    } as ViewStyle,

    emptyText: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
      marginTop: 12,
      textAlign: 'center',
    } as TextStyle,

    emptySubtext: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
      textAlign: 'center',
    } as TextStyle,

    comingSoon: {
      alignItems: 'center',
      paddingVertical: 24,
    } as ViewStyle,

    comingSoonText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 8,
    } as TextStyle,

    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    loadingText: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      marginTop: 12,
    } as TextStyle,

    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    } as ViewStyle,

    errorText: {
      fontSize: 18,
      fontWeight: '500',
      color: '#ff4444',
      marginTop: 12,
      textAlign: 'center',
    } as TextStyle,

    errorButton: {
      marginTop: 20,
    } as ViewStyle,
  });

export default SummaryScreen;