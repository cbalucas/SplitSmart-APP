import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';

interface SettlementItemProps {
  settlement: {
    id: string;
    fromParticipantName: string;
    toParticipantName: string;
    amount: number;
    isPaid: boolean;
    receiptImage?: string;
  };
  currency: string;
  onTogglePaid: (settlementId: string, isPaid: boolean) => void;
  onUpdateReceipt: (settlementId: string, imageUri: string | null) => void;
  disabled?: boolean;
}

export const SettlementItem: React.FC<SettlementItemProps> = ({
  settlement,
  currency,
  onTogglePaid,
  onUpdateReceipt,
  disabled = false
}) => {
  const { theme } = useTheme();
  const [showReceiptOptions, setShowReceiptOptions] = useState(false);

  const handleTogglePaid = () => {
    if (disabled) return;
    onTogglePaid(settlement.id, !settlement.isPaid);
  };

  const handleAddReceipt = async () => {
    if (disabled) return;

    Alert.alert(
      'Agregar Comprobante',
      'Elige una opción',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Tomar Foto',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permiso denegado', 'Necesitamos acceso a la cámara');
              return;
            }

            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              quality: 0.7,
            });

            if (!result.canceled) {
              onUpdateReceipt(settlement.id, result.assets[0].uri);
            }
          }
        },
        {
          text: 'Elegir de Galería',
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permiso denegado', 'Necesitamos acceso a la galería');
              return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.7,
            });

            if (!result.canceled) {
              onUpdateReceipt(settlement.id, result.assets[0].uri);
            }
          }
        },
        ...(settlement.receiptImage ? [{
          text: 'Eliminar Comprobante',
          style: 'destructive' as const,
          onPress: () => onUpdateReceipt(settlement.id, null)
        }] : [])
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginBottom: 12,
      opacity: disabled ? 0.6 : 1,
    },
    checkboxContainer: {
      marginRight: 12,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: settlement.isPaid ? '#4CAF50' : theme.colors.outline,
      backgroundColor: settlement.isPaid ? '#4CAF50' : 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
    },
    description: {
      fontSize: 14,
      color: theme.colors.onSurface,
      marginBottom: 4,
    },
    amount: {
      fontSize: 18,
      fontWeight: 'bold',
      color: settlement.isPaid ? '#4CAF50' : '#FF9800',
    },
    arrow: {
      color: theme.colors.onSurfaceVariant,
      marginHorizontal: 4,
    },
    receiptButton: {
      marginLeft: 8,
      padding: 8,
    },
    receiptThumbnail: {
      width: 40,
      height: 40,
      borderRadius: 8,
      marginLeft: 8,
    },
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.checkboxContainer}
        onPress={handleTogglePaid}
        disabled={disabled}
      >
        <View style={styles.checkbox}>
          {settlement.isPaid && (
            <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.description}>
          <Text style={{ fontWeight: '600' }}>{settlement.fromParticipantName}</Text>
          <Text style={styles.arrow}> → </Text>
          <Text style={{ fontWeight: '600' }}>{settlement.toParticipantName}</Text>
        </Text>
        <Text style={styles.amount}>
          {currency} ${settlement.amount.toFixed(2)}
        </Text>
      </View>

      {settlement.receiptImage ? (
        <TouchableOpacity onPress={handleAddReceipt} disabled={disabled}>
          <Image 
            source={{ uri: settlement.receiptImage }} 
            style={styles.receiptThumbnail}
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={styles.receiptButton}
          onPress={handleAddReceipt}
          disabled={disabled}
        >
          <MaterialCommunityIcons 
            name="camera-plus" 
            size={24} 
            color={disabled ? theme.colors.onSurfaceVariant : theme.colors.primary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};
