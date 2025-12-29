import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

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
  onViewReceipt?: (imageUri: string) => void;
  disabled?: boolean;
}

export const SettlementItem: React.FC<SettlementItemProps> = ({
  settlement,
  currency,
  onTogglePaid,
  onUpdateReceipt,
  onViewReceipt,
  disabled = false
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [showReceiptOptions, setShowReceiptOptions] = useState(false);

  const handleTogglePaid = () => {
    if (disabled) return;
    onTogglePaid(settlement.id, !settlement.isPaid);
  };

  const handleViewReceipt = () => {
    if (disabled || !settlement.receiptImage) return;
    if (onViewReceipt) {
      onViewReceipt(settlement.receiptImage);
    }
  };

  const handleAddReceipt = async () => {
    if (disabled) return;

    Alert.alert(
      t('settlement.addReceipt'),
      t('settlement.chooseOption'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settlement.takePhoto'),
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(t('settlement.permissionDenied'), t('settlement.cameraPermissionDesc'));
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
          text: t('settlement.chooseFromGallery'),
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert(
                  t('settlement.permissionRequired'), 
                  t('settlement.galleryPermissionDesc'),
                  [
                    { text: t('common.cancel'), style: 'cancel' },
                    { text: t('settlement.openSettings'), onPress: () => ImagePicker.requestMediaLibraryPermissionsAsync() }
                  ]
                );
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.7,
                allowsMultipleSelection: false,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                onUpdateReceipt(settlement.id, result.assets[0].uri);
              }
            } catch (error) {
              console.error('Error selecting image:', error);
              Alert.alert(t('common.error'), t('settlement.galleryError'));
            }
          }
        },
        ...(settlement.receiptImage ? [{
          text: t('settlement.deleteReceipt'),
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
      marginBottom: 2,
      opacity: disabled ? 0.6 : 1,
    },
    checkboxContainer: {
      marginRight: 12,
    },
    checkbox: {
      width: 24,
      height: 24,
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
          {settlement.isPaid ? (
            <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
          ) : (
            <MaterialCommunityIcons name="circle-outline" size={24} color={theme.colors.outline} />
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

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {settlement.receiptImage ? (
          <>
            <TouchableOpacity onPress={handleViewReceipt} disabled={disabled}>
              <Image 
                source={{ uri: settlement.receiptImage }} 
                style={styles.receiptThumbnail}
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={{ marginLeft: 4, padding: 4 }}
              onPress={() => onUpdateReceipt(settlement.id, null)}
              disabled={disabled}
            >
              <MaterialCommunityIcons 
                name="close-circle" 
                size={20} 
                color={disabled ? theme.colors.onSurfaceVariant : theme.colors.error}
              />
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity 
            style={styles.receiptButton}
            onPress={handleAddReceipt}
            disabled={disabled}
          >
            <MaterialCommunityIcons 
              name="camera" 
              size={24} 
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
