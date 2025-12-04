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



  const handleMenuPress = () => {
    Alert.alert(
      'Opciones del Evento',
      `¿Qué deseas hacer con "${event.name}"?`,
      [
        { text: 'Editar', onPress: () => onEdit?.(event) },
        { 
          text: event.status === 'archived' ? 'Desarchivar' : 'Archivar', 
          onPress: () => onArchive?.(event) 
        },
        { text: 'Eliminar', onPress: () => handleDelete(), style: 'destructive' },
        { text: 'Cancelar', style: 'cancel' }
      ],
      { cancelable: true }
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Evento',
      '¿Estás seguro de que quieres eliminar este evento? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', onPress: () => onDelete?.(event), style: 'destructive' }
      ]
    );
  };

  return (
    <Card style={StyleSheet.flatten([styles.container, style])}>
      <TouchableOpacity
        onPress={() => onPress?.(event)}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: getStatusColor(event.status) }
            ]} />
            <Text style={styles.eventName} numberOfLines={1}>
              {event.name}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.totalAmount}>
              {formatCurrency(event.totalAmount, event.currency)}
            </Text>
            <TouchableOpacity
              onPress={handleMenuPress}
              style={styles.menuButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons
                name="dots-vertical"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Body */}
        <View style={styles.body}>
          {event.location && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
              <Text style={styles.infoText} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="calendar-outline"
              size={16}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={styles.infoText}>
              {formatDate(event.startDate)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={16}
              color={theme.colors.onSurfaceVariant}
            />
            <Text style={styles.infoText}>
              {event.participantCount} participante{event.participantCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.expenseCount}>
            {event.expenseCount} gasto{event.expenseCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </TouchableOpacity>
    </Card>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginHorizontal: 16,
      marginVertical: 8,
    } as ViewStyle,

    touchable: {
      padding: 16,
    } as ViewStyle,

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    } as ViewStyle,

    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    } as ViewStyle,

    statusIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 12,
    } as ViewStyle,

    eventName: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      flex: 1,
    } as TextStyle,

    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    } as ViewStyle,

    totalAmount: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#2ECC71',
      marginRight: 8,
    } as TextStyle,

    menuButton: {
      padding: 4,
    } as ViewStyle,

    body: {
      marginBottom: 12,
    } as ViewStyle,

    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    } as ViewStyle,

    infoText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginLeft: 8,
      flex: 1,
    } as TextStyle,

    footer: {
      alignItems: 'flex-start',
    } as ViewStyle,

    expenseCount: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    } as TextStyle,
  });

export default EventCard;