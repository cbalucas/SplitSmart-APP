import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Switch,
  Modal,
  TextInput,
  Image,
  Pressable
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { Card, Button, Input, LanguageSelector, CurrencySelector, ThemeToggle, HeaderBar } from '../../components';
import { 
  UserProfileData, 
  ProfileSectionProps, 
  SettingItemProps, 
  ProfileStats,
  NotificationKey,
  PrivacyKey
} from './types';
import { createStyles } from './styles';
import { PROFILE_KEYS, NOTIFICATION_KEYS, getLanguageDisplayName, getUserInitials } from './language';

const ProfileSection: React.FC<ProfileSectionProps> = ({ title, icon, children, onPress }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);
  
  // Special handling for logout section
  const isLogout = title === t('logout');
  const iconColor = isLogout ? '#F44336' : theme.colors.primary;

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons
          name={icon as any}
          size={20}
          color={iconColor}
        />
        <Text style={[styles.sectionTitle, isLogout && { color: '#F44336' }]}>{title}</Text>
      </View>
      {children}
    </Card>
  );
};

const SettingItem: React.FC<SettingItemProps> = ({ 
  title, 
  subtitle, 
  icon, 
  value, 
  type, 
  onPress, 
  onValueChange 
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity 
      style={styles.settingItem}
      onPress={onPress}
      disabled={type === 'switch'}
    >
      <View style={styles.settingIcon}>
        <MaterialCommunityIcons
          name={icon as any}
          size={20}
          color={theme.colors.onSurfaceVariant}
        />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.settingSubtitle}>{subtitle}</Text>
        )}
      </View>
      <View style={styles.settingAction}>
        {type === 'switch' && (
          <Switch
            value={value as boolean}
            onValueChange={onValueChange}
            trackColor={{ false: theme.colors.outline, true: theme.colors.primary }}
            thumbColor={theme.colors.surface}
          />
        )}
        {type === 'value' && (
          <Text style={styles.settingValue}>{value as string}</Text>
        )}
        {type === 'navigation' && (
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={theme.colors.onSurfaceVariant}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, toggleTheme, isDarkMode } = useTheme();
  const { user, logout, refreshUser, initializeAuth } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // Helper function to get auto-logout options
  const getAutoLogoutOptions = () => [
    { value: 'never' as const, label: t('profile.autoLogoutNever') },
    { value: '5min' as const, label: t('profile.autoLogout5min') },
    { value: '15min' as const, label: t('profile.autoLogout15min') },
    { value: '30min' as const, label: t('profile.autoLogout30min') },
  ];
  const { 
    events, 
    participants, 
    expenses, 
    clearAllData, 
    resetDatabase, 
    exportData,
    importData,
    getUserProfile,
    updateUserProfile,
    updateUserPassword,
    updateUserNotifications,
    updateUserPrivacy
  } = useData();
  const styles = createStyles(theme);

  const [profileData, setProfileData] = useState<UserProfileData>({
    name: user?.name || 'Usuario Demo',
    username: '', // NUEVO CAMPO
    email: user?.email || 'demo@splitsmart.com',
    phone: '',
    // alias_cbu: '', // ELIMINADO
    preferredCurrency: 'ARS',
    autoLogout: 'never',
    notifications: {
      paymentReceived: false, // Por defecto desactivado
    },
    privacy: {
      // shareEmail: false, // ELIMINADO
      // sharePhone: false, // ELIMINADO
      shareEvent: true, // NUEVO CAMPO
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [skipPassword, setSkipPassword] = useState(false);
  const [showAutoLogoutOptions, setShowAutoLogoutOptions] = useState(false);
  const [stats, setStats] = useState<ProfileStats>({
    totalEvents: 0,
    activeEvents: 0,
    completedEvents: 0,
    archivedEvents: 0,
    friendsCount: 0
  });
  const autoLogoutDropdownRef = useRef<View>(null);

  useEffect(() => {
    calculateStats();
    loadUserProfile();
  }, [events, expenses, participants]);

  // Función para cerrar dropdown cuando se toca fuera
  const closeAutoLogoutDropdown = () => {
    if (showAutoLogoutOptions) {
      setShowAutoLogoutOptions(false);
    }
  };

  const loadUserProfile = async () => {
    if (!user?.id) {
      console.log('⚠️ No user ID available for profile loading');
      return;
    }

    try {
      console.log('👤 Loading profile for user ID:', user.id);
      const profile = await getUserProfile(user.id);
      if (profile) {
        console.log('👤 Loading profile for user:', user.id);
        console.log('🔔 Profile notifications_payment_received:', profile.notifications_payment_received);
        
        setProfileData({
          name: profile.name || user.name || 'Usuario Demo',
          username: profile.username || '', // NUEVO CAMPO
          email: profile.email || user.email || 'demo@splitsmart.com',
          phone: profile.phone || '',
          // alias_cbu: profile.alias_cbu || '', // ELIMINADO
          preferredCurrency: profile.preferred_currency || 'ARS',
          autoLogout: (profile.auto_logout as 'never' | '5min' | '15min' | '30min') || 'never',
          notifications: {
            paymentReceived: profile.notifications_payment_received === 1,
          },
          privacy: {
            // shareEmail: profile.privacy_share_email === 1, // ELIMINADO
            // sharePhone: profile.privacy_share_phone === 1, // ELIMINADO
            shareEvent: profile.privacy_share_event === 1 || true, // NUEVO CAMPO (default true)
          }
        });
        setSkipPassword(profile.skip_password === 1);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const calculateStats = () => {
    const totalEvents = events.length;
    const activeEvents = events.filter(e => e.status === 'active').length;
    const completedEvents = events.filter(e => e.status === 'completed').length;
    const archivedEvents = events.filter(e => e.status === 'archived').length;
    const friendsCount = participants.filter(p => p.participantType === 'friend').length; // Solo amigos permanentes

    setStats({
      totalEvents,
      activeEvents,
      completedEvents,
      archivedEvents,
      friendsCount
    });
  };

  const handleSaveProfile = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'No se pudo identificar el usuario');
      return;
    }

    try {
      await updateUserProfile(user.id, {
        name: profileData.name,
        username: profileData.username || undefined, // NUEVO CAMPO
        email: profileData.email,
        phone: profileData.phone || undefined,
        // alias_cbu: profileData.alias_cbu || undefined, // ELIMINADO
        preferred_currency: profileData.preferredCurrency
      });

      // Guardar notificaciones
      await updateUserNotifications(user.id, {
        expenseAdded: profileData.notifications.expenseAdded,
        paymentReceived: profileData.notifications.paymentReceived,
        eventUpdated: profileData.notifications.eventUpdated,
        // weeklyReport: profileData.notifications.weeklyReport // ELIMINADO
      });

      // Guardar privacidad
      await updateUserPrivacy(user.id, {
        // shareEmail: profileData.privacy.shareEmail, // ELIMINADO
        // sharePhone: profileData.privacy.sharePhone, // ELIMINADO
        shareEvent: profileData.privacy.shareEvent, // NUEVO CAMPO
      });

      Alert.alert(`✅ ${t('success')}`, t('profile.message.profileSaved'));
      setIsEditing(false);
      await refreshUser();
    } catch (error) {
      Alert.alert(t('error'), t('profile.message.profileSaveError'));
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(t('profile.message.permissionRequired'), t('profile.message.galleryPermission'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        await updateAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
      Alert.alert(t('error'), t('profile.message.pickImageError'));
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(t('profile.message.permissionRequired'), t('profile.message.cameraPermission'));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        await updateAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ Error taking photo:', error);
      Alert.alert(t('error'), t('profile.message.takePhotoError'));
    }
  };

  const updateAvatar = async (uri: string) => {
    if (!user?.id) return;
    
    try {
      console.log('📸 Updating avatar with URI:', uri);
      await updateUserProfile(user.id, {
        avatar: uri
      });
      console.log('✅ Avatar updated in database, refreshing user...');
      await refreshUser();
      console.log('✅ User refreshed, new avatar:', user?.avatar);
      Alert.alert(`✅ ${t('success')}`, t('profile.message.updateAvatarSuccess'));
    } catch (error) {
      console.error('❌ Error updating avatar:', error);
      Alert.alert(t('error'), t('profile.message.updateAvatarError'));
    }
  };

  const handleChangeAvatar = () => {
    Alert.alert(
      t('profile.message.changeAvatarTitle'),
      t('profile.message.chooseOption'),
      [
        { text: t('cancel'), style: 'cancel' },
        { text: t('profile.message.takePhoto'), onPress: takePhoto },
        { text: t('profile.message.chooseFromGallery'), onPress: pickImageFromGallery },
        ...(user?.avatar ? [{ 
          text: t('profile.message.removePhoto'), 
          style: 'destructive' as const, 
          onPress: async () => {
            if (user?.id) {
              await updateUserProfile(user.id, { avatar: undefined });
              await refreshUser();
            }
          }
        }] : [])
      ]
    );
  };

  const saveExportFile = async (jsonData: string) => {
    try {
      const now = new Date();
      const timestamp = now.toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
      const fileName = `SplitSmart_Export_${timestamp}.json`;
      
      // Create temporary file
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, jsonData, {
        encoding: 'utf8',
      });

      console.log('📁 File created at:', fileUri);

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Share file (user can choose where to save)
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Guardar exportación de SplitSmart',
          UTI: 'public.json'
        });
        
        console.log('✅ File shared successfully');
        
        // Clean up temporary file after sharing
        try {
          await FileSystem.deleteAsync(fileUri);
          console.log('🗑️ Temporary file cleaned up');
        } catch (cleanupError) {
          console.warn('⚠️ Could not clean up temporary file:', cleanupError);
        }
        
        return true;
      } else {
        // Fallback: show file location (keep file since user needs to access it)
        Alert.alert(
          `✅ ${t('success')}`,
          `Archivo guardado en:\n${fileUri}\n\nPuedes encontrarlo en la carpeta de documentos de la aplicación.`
        );
        return true;
      }
    } catch (error) {
      console.error('❌ Error saving file:', error);
      throw error;
    }
  };

  const handleExportData = async () => {
    try {
      Alert.alert(
        t('profile.message.exportDataTitle'),
        `Se exportarán todas las tablas y tablas relacionadas:\n\n• Usuarios y perfiles\n• Eventos y participantes\n• Gastos y divisiones\n• Pagos y liquidaciones\n• Todas las relaciones\n\n⚠️ Nota: Las imágenes (avatares, comprobantes de gastos y pagos) no se incluyen en la exportación por razones de privacidad y tamaño del archivo.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Exportar Ahora', 
            onPress: async () => {
              try {
                console.log('🚀 Starting complete data export...');
                
                // Generate export data
                const data = await exportData();
                console.log('✅ Export data generated, size:', data.length, 'characters');
                
                // Parse the exported data to get record counts
                const exportedData = JSON.parse(data);
                const recordCounts = {
                  users: exportedData.data?.users?.length || 0,
                  events: exportedData.data?.events?.length || 0,
                  participants: exportedData.data?.participants?.length || 0,
                  expenses: exportedData.data?.expenses?.length || 0,
                  payments: exportedData.data?.payments?.length || 0,
                  eventParticipants: exportedData.data?.event_participants?.length || 0,
                  splits: exportedData.data?.splits?.length || 0,
                  settlements: exportedData.data?.settlements?.length || 0
                };
                
                const totalRecords = Object.values(recordCounts).reduce((sum, count) => sum + count, 0);
                
                // Save file and let user choose location
                const success = await saveExportFile(data);
                
                if (success) {
                  Alert.alert(
                    `✅ ${t('success')}`, 
                    `${t('profile.message.exportSuccess')}\n\n📊 Registros exportados (${totalRecords} total):\n• ${recordCounts.users} Usuarios\n• ${recordCounts.events} Eventos\n• ${recordCounts.participants} Participantes\n• ${recordCounts.expenses} Gastos\n• ${recordCounts.payments} Pagos\n• ${recordCounts.eventParticipants} Relaciones evento-participante\n• ${recordCounts.splits} Divisiones\n• ${recordCounts.settlements} Liquidaciones\n\n📁 El archivo se ha guardado correctamente.`
                  );
                }
              } catch (error) {
                console.error('❌ Export error:', error);
                Alert.alert(
                  t('error'), 
                  `${t('profile.message.exportError')}\n\nDetalle: ${error instanceof Error ? error.message : 'Error desconocido'}`
                );
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert(t('error'), t('profile.message.exportError'));
    }
  };

  const handleImportData = async () => {
    try {
      console.log('📥 Starting data import process...');
      
      // Open file picker
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('📥 Import cancelled by user');
        return;
      }

      console.log('📁 File selected:', result.assets[0].name);

      // Read the selected file
      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'utf8',
      });

      console.log('📄 File content read, size:', fileContent.length, 'characters');

      // Parse and validate the import data
      let importData;
      try {
        importData = JSON.parse(fileContent);
        console.log('📄 File parsed successfully');
        console.log('📄 Import data keys:', Object.keys(importData));
        console.log('📄 Metadata:', importData.metadata);
      } catch (parseError) {
        console.error('❌ Parse error:', parseError);
        Alert.alert(
          t('error'),
          'El archivo seleccionado no es un JSON válido o está corrupto.'
        );
        return;
      }

      // Validate SplitSmart export format - check multiple possible locations
      const isValidSplitSmart = 
        (importData.metadata?.exportedBy === 'SplitSmart') ||
        (importData.exportedBy === 'SplitSmart') ||
        (importData.version && importData.data) || // Has version and data structure
        (importData.appVersion && importData.data); // Has appVersion and data structure

      if (!isValidSplitSmart) {
        console.log('❌ Validation failed');
        console.log('❌ Metadata:', importData.metadata);
        console.log('❌ Version:', importData.version);
        console.log('❌ Data keys:', importData.data ? Object.keys(importData.data) : 'No data');
        Alert.alert(
          t('error'),
          `El archivo seleccionado no es una exportación válida de SplitSmart.\n\nDetalles técnicos:\n• Metadata: ${JSON.stringify(importData.metadata)}\n• Version: ${importData.version}\n• Estructura: ${importData.data ? 'OK' : 'Missing data'}`
        );
        return;
      }

      // Analyze import data
      const data = importData.data || {};
      const importCounts = {
        users: data.users?.length || 0,
        events: data.events?.length || 0,
        participants: data.participants?.length || 0,
        expenses: data.expenses?.length || 0,
        payments: data.payments?.length || 0,
        eventParticipants: data.event_participants?.length || 0,
        splits: data.splits?.length || 0,
        settlements: data.settlements?.length || 0
      };

      const totalRecords = Object.values(importCounts).reduce((sum, count) => sum + count, 0);
      
      // Get current data counts for comparison
      const currentCounts = {
        users: 1, // Always at least the demo user
        events: events.length,
        participants: participants.length,
        expenses: expenses.length,
        payments: 0, // We'll need to get this from context if available
        eventParticipants: 0, // We'll need to calculate this
        splits: 0, // We'll need to get this from context if available
        settlements: 0 // We'll need to get this from context if available
      };
      
      const currentTotal = Object.values(currentCounts).reduce((sum, count) => sum + count, 0);
      
      // Show confirmation dialog with current vs import comparison
      Alert.alert(
        'Confirmar Importación',
        `COMPARACIÓN DE DATOS:\n\n📊 DATOS ACTUALES (${currentTotal} total):\n• ${currentCounts.users} Usuario${currentCounts.users !== 1 ? 's' : ''} → ${importCounts.users} Usuario${importCounts.users !== 1 ? 's' : ''}\n• ${currentCounts.events} Evento${currentCounts.events !== 1 ? 's' : ''} → ${importCounts.events} Evento${importCounts.events !== 1 ? 's' : ''}\n• ${currentCounts.participants} Participante${currentCounts.participants !== 1 ? 's' : ''} → ${importCounts.participants} Participante${importCounts.participants !== 1 ? 's' : ''}\n• ${currentCounts.expenses} Gasto${currentCounts.expenses !== 1 ? 's' : ''} → ${importCounts.expenses} Gasto${importCounts.expenses !== 1 ? 's' : ''}\n• ${currentCounts.payments} Pago${currentCounts.payments !== 1 ? 's' : ''} → ${importCounts.payments} Pago${importCounts.payments !== 1 ? 's' : ''}\n• ${currentCounts.eventParticipants} Relación${currentCounts.eventParticipants !== 1 ? 'es' : ''} → ${importCounts.eventParticipants} Relación${importCounts.eventParticipants !== 1 ? 'es' : ''}\n• ${currentCounts.splits} División${currentCounts.splits !== 1 ? 'es' : ''} → ${importCounts.splits} División${importCounts.splits !== 1 ? 'es' : ''}\n• ${currentCounts.settlements} Liquidación${currentCounts.settlements !== 1 ? 'es' : ''} → ${importCounts.settlements} Liquidación${importCounts.settlements !== 1 ? 'es' : ''}\n\n📥 TOTAL A IMPORTAR: ${totalRecords} registros\n\n⚠️ IMPORTANTE:\n• Se ELIMINARÁ toda la información (${currentTotal} registros)\n• Las contraseñas NO se importan (acceso directo sin contraseña)\n• Las imágenes NO se importan (avatares y comprobantes)\n\n¿Deseas REEMPLAZAR los datos actuales?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Importar Datos',
            style: 'destructive',
            onPress: () => performImport(importData, importCounts, totalRecords)
          }
        ]
      );

    } catch (error) {
      console.error('❌ Import error:', error);
      Alert.alert(
        t('error'),
        `Error al importar datos:\n\n${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  };

  const performImport = async (importData: any, importCounts: any, totalRecords: number) => {
    try {
      console.log('🚀 Starting database import...');
      
      // Reset database first
      await resetDatabase();
      console.log('🔄 Database reset complete');
      
      // Import data using DataContext method (we'll need to add this)
      const success = await importDataToDatabase(importData);
      
      if (success) {
        // Reinitialize auth to set up current user
        await initializeAuth();
        
        // Wait and refresh
        setTimeout(async () => {
          await refreshUser();
          await loadUserProfile();
        }, 2000);
        
        Alert.alert(
          `✅ ${t('success')}`,
          `Importación completada exitosamente.\n\n📊 ${totalRecords} registros importados:\n• ${importCounts.users} Usuarios\n• ${importCounts.events} Eventos\n• ${importCounts.participants} Participantes\n• ${importCounts.expenses} Gastos\n• ${importCounts.payments} Pagos\n• ${importCounts.eventParticipants} Relaciones\n• ${importCounts.splits} Divisiones\n• ${importCounts.settlements} Liquidaciones\n\n📱 La aplicación se reiniciará con los datos importados.`
        );
      } else {
        throw new Error('Error durante el proceso de importación');
      }
      
    } catch (error) {
      console.error('❌ Import execution error:', error);
      Alert.alert(
        t('error'),
        `Error durante la importación:\n\n${error instanceof Error ? error.message : 'Error desconocido'}\n\nSe recomienda reiniciar la aplicación.`
      );
    }
  };

  // Function to import data to database using DataContext
  const importDataToDatabase = async (importDataPayload: any): Promise<boolean> => {
    try {
      console.log('📥 Importing data to database...', Object.keys(importDataPayload.data || {}));
      
      // Use DataContext import function
      const success = await importData(importDataPayload);
      return success;
    } catch (error) {
      console.error('❌ Import to database failed:', error);
      throw error;
    }
  };

  const handleClearData = () => {
    Alert.alert(
      t('profile.message.deleteAllDataTitle'),
      t('profile.message.deleteAllDataMessage'),
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: t('profile.message.deleteAll'),
          style: 'destructive',
          onPress: async () => {
            try {
              await resetDatabase();
              console.log('🔄 Database reset complete, reinitializing auth...');
              
              // Reinicializar autenticación para recrear usuario demo
              await initializeAuth();
              
              // Esperar un momento y recargar el perfil
              setTimeout(async () => {
                await refreshUser();
                await loadUserProfile();
              }, 1500);
              
              Alert.alert(t('success'), t('profile.message.deleteCompleted'));
            } catch (error) {
              console.error('❌ Error during reset:', error);
              Alert.alert(t('error'), t('profile.message.deleteError'));
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.message.logoutTitle'),
      t('profile.message.logoutMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: () => {
            logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Home' as never }],
            });
          }
        }
      ]
    );
  };

  const updateNotificationSetting = async (key: keyof UserProfileData['notifications'], value: boolean) => {
    closeAutoLogoutDropdown();
    console.log('🔔 Updating notification:', key, 'to', value, 'for user:', user?.id);
    
    setProfileData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }));

    if (user?.id) {
      try {
        await updateUserNotifications(user.id, {
          [key]: value
        });
        console.log('✅ Notification setting updated successfully in DB');
      } catch (error) {
        console.error('❌ Error updating notification setting:', error);
      }
    } else {
      console.error('⚠️ No user ID found for notification update');
    }
  };

  const updatePrivacySetting = async (key: keyof UserProfileData['privacy'], value: boolean) => {
    closeAutoLogoutDropdown();
    setProfileData(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }));

    if (user?.id) {
      try {
        await updateUserPrivacy(user.id, {
          [key]: value
        });
      } catch (error) {
        console.error('Error updating privacy setting:', error);
      }
    }
  };



  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <HeaderBar
        title={t('profile.title')}
        showLanguageSelector={true}
        showThemeToggle={true}
        backgroundColor="#00B359"
      />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Perfil del Usuario */}
        <Card style={styles.profileCard} onPress={closeAutoLogoutDropdown}>
          <TouchableOpacity
            style={styles.editIconButton}
            onPress={() => {
              closeAutoLogoutDropdown();
              setIsEditing(!isEditing);
            }}
          >
            <MaterialCommunityIcons
              name={isEditing ? "check" : "pencil"}
              size={20}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
          <View style={styles.profileHeader}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={isEditing ? handleChangeAvatar : undefined}
              disabled={!isEditing}
            >
              {user?.avatar ? (
                <Image 
                  source={{ uri: user.avatar }} 
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: '#4ECDC4' }]}>
                  <Text style={styles.avatarText}>
                    {getUserInitials(profileData.name)}
                  </Text>
                </View>
              )}
              {isEditing && (
                <View style={styles.avatarEditOverlay}>
                  <MaterialCommunityIcons name="camera" size={24} color="#FFFFFF" />
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profileData.username}</Text>
              <Text style={styles.profileEmail}>{profileData.email}</Text>
            </View>
          </View>
        </Card>

        {/* Estadísticas */}
        <ProfileSection title={t('profile.stats')} icon="chart-line" onPress={closeAutoLogoutDropdown}>
          <View style={styles.statsContainer}>
            <View style={styles.statRow}>
              <MaterialCommunityIcons name="account-group" size={20} color="#9C27B0" />
              <Text style={styles.statNumber}>{stats.friendsCount}</Text>
              <Text style={styles.statDescription}>{t('profile.friendsCount')}</Text>
            </View>
            <View style={styles.statRow}>
              <MaterialCommunityIcons name="calendar-check" size={20} color="#4CAF50" />
              <Text style={styles.statNumber}>{stats.activeEvents}</Text>
              <Text style={styles.statDescription}>{t('profile.activeEvents')}</Text>
            </View>
            <View style={styles.statRow}>
              <MaterialCommunityIcons name="calendar-check-outline" size={20} color="#2196F3" />
              <Text style={styles.statNumber}>{stats.completedEvents}</Text>
              <Text style={styles.statDescription}>{t('profile.completedEvents')}</Text>
            </View>
            <View style={styles.statRow}>
              <MaterialCommunityIcons name="archive" size={20} color="#FF9800" />
              <Text style={styles.statNumber}>{stats.archivedEvents}</Text>
              <Text style={styles.statDescription}>{t('profile.archivedEvents')}</Text>
            </View>
          </View>
        </ProfileSection>

        {/* Información Personal */}
        {isEditing ? (
          <>
            <ProfileSection title={t('profile.personalInfo')} icon="account-edit" onPress={closeAutoLogoutDropdown}>
              <Input
                label={t('profile.name')}
                value={profileData.name}
                onChangeText={(value) => setProfileData(prev => ({ ...prev, name: value }))}
                containerStyle={styles.editInput}
              />
              <Input
                label={t('profile.username')}
                value={profileData.username}
                onChangeText={(value) => setProfileData(prev => ({ ...prev, username: value }))}
                containerStyle={styles.editInput}
              />
              <Input
                label={t('profile.email')}
                value={profileData.email}
                onChangeText={(value) => setProfileData(prev => ({ ...prev, email: value }))}
                keyboardType="email-address"
                containerStyle={styles.editInput}
              />
              <Input
                label={`${t('profile.phone')} (${t('optional')})`}
                value={profileData.phone}
                onChangeText={(value) => setProfileData(prev => ({ ...prev, phone: value }))}
                keyboardType="phone-pad"
                containerStyle={styles.editInput}
              />
              <Button
                title={t('profile.saveChanges')}
                onPress={handleSaveProfile}
                style={styles.saveButton}
              />
            </ProfileSection>
            
            <ProfileSection title={t('profile.security')} icon="lock" onPress={closeAutoLogoutDropdown}>
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => {
                  closeAutoLogoutDropdown();
                  setNewPassword('');
                  setShowPasswordModal(true);
                }}
              >
                <View style={styles.settingIcon}>
                  <MaterialCommunityIcons name="lock-reset" size={20} color={theme.colors.onSurfaceVariant} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{t('profile.changePassword')}</Text>
                  <Text style={styles.settingSubtitle}>{t('profile.changePassword')}</Text>
                </View>
                <View style={styles.settingAction}>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
                </View>
              </TouchableOpacity>

              <View style={styles.settingItem}>
                <View style={styles.settingIcon}>
                  <MaterialCommunityIcons name="login-variant" size={20} color={theme.colors.onSurfaceVariant} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{t('profile.skipPassword')}</Text>
                  <Text style={styles.settingSubtitle}>
                    {skipPassword ? t('profile.skipPasswordOn') : t('profile.skipPasswordOff')}
                  </Text>
                </View>
                <View style={styles.settingAction}>
                  <Switch
                    value={skipPassword}
                    onValueChange={async (value) => {
                      try {
                        if (!user?.id) {
                          Alert.alert('Error', 'No se pudo identificar el usuario');
                          return;
                        }
                        await updateUserProfile(user.id, { skipPassword: value });
                        setSkipPassword(value);
                        await refreshUser(); // Recargar usuario con nueva configuración
                        Alert.alert(
                          `✅ ${t('profile.skipPasswordUpdated')}`, 
                          value 
                            ? t('profile.skipPasswordEnabled') 
                            : t('profile.skipPasswordDisabled')
                        );
                      } catch (error) {
                        Alert.alert(t('error'), t('profile.message.settingUpdateError'));
                      }
                    }}
                    trackColor={{ false: theme.colors.outline, true: theme.colors.primary }}
                    thumbColor={theme.colors.surface}
                  />
                </View>
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingIcon}>
                  <MaterialCommunityIcons name="fingerprint" size={20} color={theme.colors.onSurfaceVariant} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{t('profile.biometricLogin')}</Text>
                  <Text style={styles.settingSubtitle}>{t('profile.biometricLoginDesc')}</Text>
                </View>
                <View style={styles.settingAction}>
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>{t('profile.comingSoon')}</Text>
                  </View>
                </View>
              </View>
            </ProfileSection>
          </>
        ) : (
          <ProfileSection title={t('profile.personalInfo')} icon="account" onPress={closeAutoLogoutDropdown}>
            <SettingItem
              title={t('profile.name')}
              subtitle={profileData.name}
              icon="account"
              type="value"
              value=""
            />
            {profileData.phone && (
              <SettingItem
                title={t('profile.phone')}
                subtitle={profileData.phone}
                icon="phone"
                type="value"
                value=""
              />
            )}
          </ProfileSection>
        )}

        {/* Preferencias */}
        <ProfileSection title={t('profile.preferences')} icon="cog">
          <SettingItem
            title={t('profile.theme')}
            subtitle={isDarkMode ? t('profile.themeDark') : t('profile.themeLight')}
            icon="palette"
            type="navigation"
            onPress={toggleTheme}
          />
          <CurrencySelector
            selectedCurrency={profileData.preferredCurrency}
            onCurrencyChange={async (currency) => {
              closeAutoLogoutDropdown();
              setProfileData(prev => ({ ...prev, preferredCurrency: currency }));
              try {
                await updateUserProfile(user.id, { preferred_currency: currency });
                console.log('Currency preference updated successfully:', currency);
              } catch (error) {
                console.error('Error updating currency preference:', error);
              }
            }}
            renderTrigger={(onPress) => (
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => {
                  closeAutoLogoutDropdown();
                  onPress();
                }}
              >
                <View style={styles.settingIcon}>
                  <MaterialCommunityIcons name="currency-usd" size={20} color={theme.colors.onSurfaceVariant} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{t('profile.currency')}</Text>
                  <Text style={styles.settingSubtitle}>{profileData.preferredCurrency}</Text>
                </View>
                <View style={styles.settingAction}>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
                </View>
              </TouchableOpacity>
            )}
          />
          <LanguageSelector 
            size={20} 
            color={theme.colors.onSurfaceVariant}
            renderTrigger={(onPress) => (
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => {
                  closeAutoLogoutDropdown();
                  onPress();
                }}
              >
                <View style={styles.settingIcon}>
                  <MaterialCommunityIcons name="translate" size={20} color={theme.colors.onSurfaceVariant} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{t('profile.language')}</Text>
                  <Text style={styles.settingSubtitle}>{getLanguageDisplayName(language)}</Text>
                </View>
                <View style={styles.settingAction}>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
                </View>
              </TouchableOpacity>
            )}
          />
          {/* Auto Logout Section */}
          <View ref={autoLogoutDropdownRef}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                setShowAutoLogoutOptions(!showAutoLogoutOptions);
              }}
            >
              <View style={styles.settingItem}>
              <View style={styles.settingIcon}>
                <MaterialCommunityIcons name="timer-outline" size={20} color={theme.colors.onSurfaceVariant} />
              </View>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{t('profile.autoLogout')}</Text>
                <Text style={styles.settingSubtitle}>
                  {getAutoLogoutOptions().find(option => option.value === profileData.autoLogout)?.label}
                </Text>
              </View>
              <View style={styles.settingAction}>
                <MaterialCommunityIcons 
                  name={showAutoLogoutOptions ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={theme.colors.onSurfaceVariant} 
                />
              </View>
              </View>
            </Pressable>
            
            {/* Desplegable con opciones en dos columnas */}
            {showAutoLogoutOptions && (
              <Pressable 
                style={styles.dropdownContainer}
                onPress={(e) => {
                  e.stopPropagation();
                }}
              >
                <View style={styles.dropdownGrid}>
                  {getAutoLogoutOptions().map((option, index) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.dropdownOption,
                        index % 2 === 1 && styles.dropdownOptionRight,
                        profileData.autoLogout === option.value && styles.dropdownOptionSelected
                      ]}
                      onPress={async () => {
                        setProfileData(prev => ({ ...prev, autoLogout: option.value }));
                        setShowAutoLogoutOptions(false);
                        try {
                          await updateUserProfile(user.id, { auto_logout: option.value });
                          console.log('Auto-logout preference updated:', option.value);
                        } catch (error) {
                          console.error('Error updating auto-logout preference:', error);
                        }
                      }}
                    >
                      <Text style={[
                        styles.dropdownOptionText,
                        profileData.autoLogout === option.value && styles.dropdownOptionTextSelected
                      ]}>
                        {option.label}
                      </Text>
                      {profileData.autoLogout === option.value && (
                        <MaterialCommunityIcons 
                          name="check" 
                          size={16} 
                          color={theme.colors.primary} 
                        />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </Pressable>
            )}
          </View>
        </ProfileSection>

        {/* Notificaciones */}
        <ProfileSection title={t('profile.notifications')} icon="bell" onPress={closeAutoLogoutDropdown}>
          <SettingItem
            title={t('notifications.paymentReceived')}
            subtitle={t('notifications.paymentReceivedDesc')}
            icon="cash-check"
            type="switch"
            value={profileData.notifications.paymentReceived}
            onValueChange={(value) => updateNotificationSetting('paymentReceived', value)}
          />
        </ProfileSection>

        {/* Privacidad */}
        <ProfileSection title={t('profile.privacy')} icon="shield-account" onPress={closeAutoLogoutDropdown}>
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MaterialCommunityIcons name="share" size={20} color={theme.colors.onSurfaceVariant} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>{t('profile.shareEvent')}</Text>
              <Text style={styles.settingSubtitle}>{t('profile.shareEventDesc')}</Text>
            </View>
            <View style={styles.settingAction}>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>{t('profile.comingSoon')}</Text>
              </View>
            </View>
          </View>
        </ProfileSection>

        {/* Datos y Respaldo */}
        <ProfileSection title={t('profile.dataBackup')} icon="database" onPress={closeAutoLogoutDropdown}>
          <SettingItem
            title={t('profile.exportData')}
            subtitle={t('profile.exportDataDesc')}
            icon="database-export"
            type="navigation"
            onPress={handleExportData}
          />
          <SettingItem
            title={t('profile.importData')}
            subtitle={t('profile.importDataDesc')}
            icon="database-import"
            type="navigation"
            onPress={handleImportData}
          />
          <SettingItem
            title={t('profile.deleteAllData')}
            subtitle={t('profile.deleteAllDataDesc')}
            icon="delete-alert"
            type="navigation"
            onPress={handleClearData}
          />
        </ProfileSection>

        {/* Información de la App */}
        <ProfileSection title={t('profile.information')} icon="information" onPress={closeAutoLogoutDropdown}>
          <SettingItem
            title={t('profile.appVersion')}
            subtitle="1.4.1"
            icon="information-outline"
            type="value"
            value=""
          />
          <SettingItem
            title={t('profile.termsOfService')}
            icon="file-document"
            type="navigation"
            onPress={() => Alert.alert('Info', t('profile.message.termsComingSoon'))}
          />
          <SettingItem
            title={t('profile.privacyPolicy')}
            icon="shield-check"
            type="navigation"
            onPress={() => Alert.alert('Info', t('profile.message.privacyComingSoon'))}
          />
          <SettingItem
            title={t('profile.contactSupport')}
            icon="help-circle"
            type="navigation"
            onPress={() => Alert.alert('Info', t('profile.message.supportComingSoon'))}
          />
        </ProfileSection>

        {/* Cerrar Sesión */}
        <ProfileSection title={t('logout')} icon="logout" onPress={handleLogout}>
          {/* El onPress se maneja en la ProfileSection, no necesita TouchableOpacity interno */}
        </ProfileSection>
      </ScrollView>

      {/* Modal de Cambio de Contraseña */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('profile.changePassword')}</Text>
            <Text style={styles.modalSubtitle}>{t('profile.changePassword')}</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder={t('profile.newPassword')}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>{t('cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={async () => {
                  if (newPassword.length >= 6) {
                    if (!user?.id) {
                      Alert.alert(t('error'), t('profile.message.userNotFound'));
                      return;
                    }
                    try {
                      await updateUserPassword(user.id, newPassword);
                      await refreshUser(); // Recargar usuario con nueva contraseña
                      setShowPasswordModal(false);
                      setNewPassword('');
                      Alert.alert(`✅ ${t('profile.passwordUpdated')}`, t('profile.passwordUpdateSuccess'));
                    } catch (error) {
                      Alert.alert(t('error'), t('profile.message.passwordChangeError'));
                    }
                  } else {
                    Alert.alert(t('error'), t('profile.message.passwordTooShort'));
                  }
                }}
              >
                <Text style={styles.modalButtonTextConfirm}>{t('profile.updatePassword')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;