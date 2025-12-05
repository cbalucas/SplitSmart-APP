import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Alert
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../constants/theme';
import Card from './Card';

export interface EventData {
  id: string;
  name: string;
  location?: string;
  startDate: string;
  totalAmount: number;
  currency: string;
  status: 'active' | 'completed' | 'archived';
  participantCount: number;
  expenseCount: number;
  description?: string;
}

export interface EventCardProps {
  event: EventData;
  onPress?: (event: EventData) => void;
  onEdit?: (event: EventData) => void;
  onArchive?: (event: EventData) => void;
  onDelete?: (event: EventData) => void;
  style?: ViewStyle;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  onPress,
  onEdit,
  onArchive,
  onDelete,
  style
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#4CAF50'; // Verde
      case 'completed':
        return '#FF9800'; // Amarillo
      case 'archived':
        return '#9E9E9E'; // Gris
      default:
        return '#9E9E9E';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };



  const handleEditPress = (e: any) => {
    e.stopPropagation();
    onEdit?.(event);
  };

  return (
    <Card style={StyleSheet.flatten([styles.container, style])}>
      <TouchableOpacity
        onPress={() => onPress?.(event)}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        {/* Barra de estado vertical */}
        <View style={[
          styles.statusIndicator,
          { backgroundColor: getStatusColor(event.status) }
        ]} />
        
        <View style={styles.content}>
          {/* Primera fila: Título y Lápiz */}
          <View style={styles.titleRow}>
            <Text style={styles.eventName} numberOfLines={1}>
              {event.name}
            </Text>
            <TouchableOpacity
              onPress={handleEditPress}
              style={styles.editButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons
                name="pencil"
                size={18}
                color={theme.colors.background === '#0F0F0F' ? '#FF5252' : theme.colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Segunda fila: Fecha y Monto */}
          <View style={styles.dateAmountRow}>
            <View style={styles.dateContainer}>
              <MaterialCommunityIcons
                name="calendar"
                size={16}
                color="#2196F3"
              />
              <Text style={styles.dateText}>
                {formatDate(event.startDate)}
              </Text>
            </View>
            <Text style={styles.totalAmount}>
              {formatCurrency(event.totalAmount, event.currency)}
            </Text>
          </View>

          {/* Tercera fila: Participantes y Gastos */}
          <View style={styles.statsMainRow}>
            <View style={styles.participantsContainer}>
              <MaterialCommunityIcons
                name="account-group"
                size={16}
                color={theme.colors.background === '#0F0F0F' ? '#FFFFFF' : '#757575'}
              />
              <Text style={styles.statText}>
                {event.participantCount} participante{event.participantCount !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.expensesContainer}>
              <MaterialCommunityIcons
                name="cash-multiple"
                size={16}
                color="#388E3C"
              />
              <Text style={styles.statText}>
                {event.expenseCount} gasto{event.expenseCount !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          {/* Ubicación */}
          {event.location && (
            <View style={styles.singleInfoRow}>
              <MaterialCommunityIcons
                name="map-marker"
                size={16}
                color="#F44336"
              />
              <Text style={styles.infoText} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          )}

          {/* Descripción */}
          {event.description && (
            <View style={styles.singleInfoRow}>
              <MaterialCommunityIcons
                name="text-box"
                size={16}
                color="#9E9E9E"
              />
              <Text style={styles.infoText} numberOfLines={2}>
                {event.description}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Card>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginHorizontal: 16,
      marginVertical: 6,
    } as ViewStyle,

    touchable: {
      flexDirection: 'row',
      position: 'relative',
    } as ViewStyle,

    content: {
      flex: 1,
      padding: 12,
      paddingLeft: 16, // Espacio para la barra vertical
    } as ViewStyle,

    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    } as ViewStyle,

    statusIndicator: {
      width: 4,
      height: '100%',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      borderTopLeftRadius: 12,
      borderBottomLeftRadius: 12,
    } as ViewStyle,

    eventName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      flex: 1,
    } as TextStyle,

    dateAmountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    } as ViewStyle,

    dateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    } as ViewStyle,

    dateText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginLeft: 6,
    } as TextStyle,

    totalAmount: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#2ECC71',
    } as TextStyle,

    editButton: {
      padding: 4,
    } as ViewStyle,

    statsMainRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 3,
    } as ViewStyle,

    participantsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    } as ViewStyle,

    expensesContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      flex: 1,
    } as ViewStyle,

    statText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginLeft: 6,
    } as TextStyle,

    singleInfoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    } as ViewStyle,

    infoText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginLeft: 6,
      flex: 1,
    } as TextStyle,
  });

export default EventCard;