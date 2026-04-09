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
  Pressable,
  Linking,
  KeyboardAvoidingView,
  Platform
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
import { databaseService } from '../../services/database';
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

const ProfileSection: React.FC<ProfileSectionProps> = ({ title, icon, children, onPress, rightAction, collapsible }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);
  const [collapsed, setCollapsed] = useState(collapsible === true);

  // Special handling for logout section
  const isLogout = title === t('logout');
  const iconColor = isLogout ? '#F44336' : theme.colors.primary;

  const handleHeaderPress = () => {
    if (collapsible) {
      setCollapsed(prev => !prev);
    }
    onPress?.();
  };

  return (
    <Card style={styles.card} onPress={collapsible ? undefined : onPress}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={handleHeaderPress}
        activeOpacity={collapsible ? 0.6 : 1}
        disabled={!collapsible && !onPress}
      >
        <View style={styles.sectionHeaderLeft}>
          <MaterialCommunityIcons
            name={icon as any}
            size={20}
            color={iconColor}
          />
          <Text style={[styles.sectionTitle, isLogout && { color: '#F44336' }]}>{title}</Text>
        </View>
        <View style={styles.sectionHeaderRight}>
          {rightAction}
          {collapsible && (
            <MaterialCommunityIcons
              name={collapsed ? 'chevron-down' : 'chevron-up'}
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          )}
        </View>
      </TouchableOpacity>
      {!collapsed && children}
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
  const { user, logout, refreshUser, initializeAuth, toggleAutoLogin } = useAuth();
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
    nukeDatabase, 
    exportData,
    importData,
    getUserProfile,
    updateUserProfile,
    updateUserPassword,
    verifyUserPassword,
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
      allowInvitations: true, // NUEVO CAMPO
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPasswordVis, setShowConfirmPasswordVis] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [skipPassword, setSkipPassword] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);
  const [showAutoLogoutOptions, setShowAutoLogoutOptions] = useState(false);
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showDatabaseStatsModal, setShowDatabaseStatsModal] = useState(false);
  const [showTechInfo, setShowTechInfo] = useState(false);
  const [showMainTables, setShowMainTables] = useState(false);
  const [showRelationTables, setShowRelationTables] = useState(false);
  const [databaseStats, setDatabaseStats] = useState<{
    tables: { [tableName: string]: number };
    totalRecords: number;
    databaseSize: string;
  } | null>(null);
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

  // Efecto para sincronizar el estado del auto-login con el AuthContext
  useEffect(() => {
    if (user?.autoLogin !== undefined) {
      setAutoLogin(user.autoLogin);
    }
  }, [user?.autoLogin]);

  // Función para cerrar dropdown cuando se toca fuera
  const closeAutoLogoutDropdown = () => {
    if (showAutoLogoutOptions) {
      setShowAutoLogoutOptions(false);
    }
  };

  const toggleVersionExpanded = (version: string) => {
    const newExpandedVersions = new Set(expandedVersions);
    if (newExpandedVersions.has(version)) {
      newExpandedVersions.delete(version);
    } else {
      newExpandedVersions.add(version);
    }
    setExpandedVersions(newExpandedVersions);
  };

  const calculatePasswordStrength = (password: string): { score: number; label: string; color: string } => {
    if (!password) return { score: 0, label: '', color: theme.colors.onSurfaceVariant };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    const levels: Record<number, { label: string; color: string }> = {
      0: { label: t('profile.passwordStrength.veryWeak'),  color: '#FF5252' },
      1: { label: t('profile.passwordStrength.weak'),      color: '#FF9800' },
      2: { label: t('profile.passwordStrength.fair'),      color: '#FFC107' },
      3: { label: t('profile.passwordStrength.good'),      color: '#4CAF50' },
      4: { label: t('profile.passwordStrength.strong'),    color: '#2E7D32' },
      5: { label: t('profile.passwordStrength.veryStrong'),color: '#1B5E20' },
    };
    return { score, ...(levels[score] ?? levels[0]) };
  };

  const loadUserProfile = async () => {
    if (!user?.id) {
      console.log('?? No user ID available for profile loading');
      return;
    }

    try {
      console.log('?? Loading profile for user ID:', user.id);
      const profile = await getUserProfile(user.id);
      if (profile) {
        console.log('?? Loading profile for user:', user.id);
        console.log('?? Profile notifications_payment_received:', profile.notifications_payment_received);
        
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
            allowInvitations: profile.privacy_allow_invitations === 1 || true, // NUEVO CAMPO (default true)
          }
        });
        setSkipPassword(profile.skip_password === 1);
        setAutoLogin(profile.auto_login === 1);
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
    setSubmittedOnce(true);
    if (!user?.id) {
      Alert.alert('Error', 'No se pudo identificar el usuario');
      return;
    }

    // Validar campos requeridos
    const requiredFields = [
      { field: profileData.name?.trim(), name: 'Nombre' },
      { field: profileData.username?.trim(), name: 'Usuario' },
      { field: profileData.email?.trim(), name: 'Email' },
    ];

    const emptyFields = requiredFields.filter(item => !item.field);
    
    if (emptyFields.length > 0) {
      Alert.alert(
        'Campos Requeridos', 
        `Los siguientes campos son obligatorios:\n\n${emptyFields.map(f => `• ${f.name}`).join('\n')}`,
        [{ text: 'Entendido', style: 'default' }]
      );
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      Alert.alert(t('error'), t('profile.message.emailInvalid'));
      return;
    }

    // Validar formato de teléfono (si fue ingresado)
    if (profileData.phone?.trim() && !/^\+?[\d\s\-()]+$/.test(profileData.phone.trim())) {
      Alert.alert(t('error'), t('profile.message.phoneInvalid'));
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
        paymentReceived: profileData.notifications.paymentReceived,
      });

      // Guardar privacidad
      await updateUserPrivacy(user.id, {
        // shareEmail: profileData.privacy.shareEmail, // ELIMINADO
        // sharePhone: profileData.privacy.sharePhone, // ELIMINADO
        shareEvent: profileData.privacy.shareEvent, // NUEVO CAMPO
      });

      Alert.alert(`? ${t('success')}`, t('profile.message.profileSaved'));
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
      console.error('? Error picking image:', error);
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
      console.error('? Error taking photo:', error);
      Alert.alert(t('error'), t('profile.message.takePhotoError'));
    }
  };

  const updateAvatar = async (uri: string) => {
    if (!user?.id) return;
    
    try {
      console.log('?? Updating avatar with URI:', uri);
      await updateUserProfile(user.id, {
        avatar: uri
      });
      console.log('? Avatar updated in database, refreshing user...');
      await refreshUser();
      console.log('? User refreshed, new avatar:', user?.avatar);
      Alert.alert(`? ${t('success')}`, t('profile.message.updateAvatarSuccess'));
    } catch (error) {
      console.error('? Error updating avatar:', error);
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

      console.log('?? File created at:', fileUri);

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Share file (user can choose where to save)
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: t('profile.message.exportSaveDialog'),
          UTI: 'public.json'
        });
        
        console.log('? File shared successfully');
        
        // Clean up temporary file after sharing
        try {
          await FileSystem.deleteAsync(fileUri);
          console.log('??? Temporary file cleaned up');
        } catch (cleanupError) {
          console.warn('?? Could not clean up temporary file:', cleanupError);
        }
        
        return true;
      } else {
        // Fallback: show file location (keep file since user needs to access it)
        Alert.alert(
          `? ${t('success')}`,
          t('profile.message.exportFileSaved', { uri: fileUri })
        );
        return true;
      }
    } catch (error) {
      console.error('? Error saving file:', error);
      throw error;
    }
  };

  const handleShowDatabaseStats = async () => {
    try {
      console.log('?? Loading database statistics...');
      
      // Ejecutar diagnóstico para identificar problemas
      await databaseService.diagnoseTables();
      
      const stats = await databaseService.getDatabaseStats();
      setDatabaseStats(stats);
      setShowDatabaseStatsModal(true);
    } catch (error) {
      console.error('? Error loading database stats:', error);
      Alert.alert(
        t('error'),
        'No se pudieron cargar las estadísticas de la base de datos'
      );
    }
  };

  const handleExportData = async () => {
    try {
      Alert.alert(
        t('profile.message.exportDataTitle'),
        t('profile.message.exportConfirmMessage'),
        [
          { text: t('cancel'), style: 'cancel' },
          { 
            text: t('profile.message.exportNow'), 
            onPress: async () => {
              try {
                console.log('?? Starting complete data export...');
                
                // Generate export data
                const data = await exportData();
                console.log('? Export data generated, size:', data.length, 'characters');
                
                // Parse the exported data to get record counts
                const exportedData = JSON.parse(data);
                const recordCounts = {
                  users: exportedData.data?.users?.length || 0,
                  events: exportedData.data?.events?.length || 0,
                  participants: exportedData.data?.participants?.length || 0,
                  expenses: exportedData.data?.expenses?.length || 0,
                  settlements: exportedData.data?.settlements?.length || 0,
                  consolidations: exportedData.data?.consolidations?.length || 0,
                  payments: exportedData.data?.payments?.length || 0,
                  eventParticipants: exportedData.data?.event_participants?.length || 0,
                  splits: exportedData.data?.splits?.length || 0
                };
                
                const totalRecords = Object.values(recordCounts).reduce((sum, count) => sum + count, 0);
                
                // Save file and let user choose location
                const success = await saveExportFile(data);
                
                if (success) {
                  Alert.alert(
                    `? ${t('success')}`, 
                    `${t('profile.message.exportSuccess')}\n\n📋 Registros exportados (${totalRecords} total):\n• ${recordCounts.users} Usuarios\n• ${recordCounts.events} Eventos\n• ${recordCounts.participants} Participantes\n• ${recordCounts.expenses} Gastos\n• ${recordCounts.settlements} Liquidaciones\n• ${recordCounts.consolidations} Consolidaciones\n• ${recordCounts.payments} Pagos (legacy)\n• ${recordCounts.eventParticipants} Relaciones evento-participante\n• ${recordCounts.splits} Divisiones\n\n✅ El archivo se ha guardado correctamente.`
                  );
                }
              } catch (error) {
                console.error('? Export error:', error);
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
      console.log('?? Starting data import process...');
      
      // Open file picker
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('?? Import cancelled by user');
        return;
      }

      console.log('?? File selected:', result.assets[0].name);

      // Read the selected file
      const fileUri = result.assets[0].uri;
      const fileContent = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'utf8',
      });

      console.log('?? File content read, size:', fileContent.length, 'characters');

      // Parse and validate the import data
      let importData;
      try {
        importData = JSON.parse(fileContent);
        console.log('?? File parsed successfully');
        console.log('?? Import data keys:', Object.keys(importData));
        console.log('?? Metadata:', importData.metadata);
      } catch (parseError) {
        console.error('? Parse error:', parseError);
        Alert.alert(
          t('error'),
          t('profile.message.importInvalidJson')
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
        console.log('? Validation failed');
        console.log('? Metadata:', importData.metadata);
        console.log('? Version:', importData.version);
        console.log('? Data keys:', importData.data ? Object.keys(importData.data) : 'No data');
        Alert.alert(
          t('error'),
          `${t('profile.message.importInvalidFormat')}\n\nDetalles técnicos:\n• Metadata: ${JSON.stringify(importData.metadata)}\n• Version: ${importData.version}\n• Estructura: ${importData.data ? 'OK' : 'Missing data'}`
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
        settlements: data.settlements?.length || 0,
        consolidations: data.consolidations?.length || 0,
        payments: data.payments?.length || 0, // Legacy format
        eventParticipants: data.event_participants?.length || 0,
        splits: data.splits?.length || 0
      };

      const totalRecords = Object.values(importCounts).reduce((sum, count) => sum + count, 0);
      
      // Get current data counts for comparison
      const currentCounts = {
        users: 1, // Always at least the demo user
        events: events.length,
        participants: participants.length,
        expenses: expenses.length,
        settlements: 0, // We'll get this from database
        consolidations: 0, // We'll get this from database
        payments: 0, // Legacy format - calculated from settlements
        eventParticipants: 0, // We'll calculate this
        splits: 0 // We'll get this from context if available
      };
      
      const currentTotal = Object.values(currentCounts).reduce((sum, count) => sum + count, 0);
      
      // Show confirmation dialog with current vs import comparison
      Alert.alert(
        t('profile.message.importConfirmTitle'),
        `COMPARACIÓN DE DATOS:\n\n📊 DATOS ACTUALES (${currentTotal} total):\n• ${currentCounts.users} Usuario${currentCounts.users !== 1 ? 's' : ''} ? ${importCounts.users} Usuario${importCounts.users !== 1 ? 's' : ''}\n• ${currentCounts.events} Evento${currentCounts.events !== 1 ? 's' : ''} ? ${importCounts.events} Evento${importCounts.events !== 1 ? 's' : ''}\n• ${currentCounts.participants} Participante${currentCounts.participants !== 1 ? 's' : ''} ? ${importCounts.participants} Participante${importCounts.participants !== 1 ? 's' : ''}\n• ${currentCounts.expenses} Gasto${currentCounts.expenses !== 1 ? 's' : ''} ? ${importCounts.expenses} Gasto${importCounts.expenses !== 1 ? 's' : ''}\n• ${currentCounts.payments} Pago${currentCounts.payments !== 1 ? 's' : ''} ? ${importCounts.payments} Pago${importCounts.payments !== 1 ? 's' : ''}\n• ${currentCounts.eventParticipants} Relación${currentCounts.eventParticipants !== 1 ? 'es' : ''} ? ${importCounts.eventParticipants} Relación${importCounts.eventParticipants !== 1 ? 'es' : ''}\n• ${currentCounts.splits} División${currentCounts.splits !== 1 ? 'es' : ''} ? ${importCounts.splits} División${importCounts.splits !== 1 ? 'es' : ''}\n• ${currentCounts.settlements} Liquidación${currentCounts.settlements !== 1 ? 'es' : ''} ? ${importCounts.settlements} Liquidación${importCounts.settlements !== 1 ? 'es' : ''}\n\n📊 TOTAL A IMPORTAR: ${totalRecords} registros\n\n⚠️ IMPORTANTE:\n• Se ELIMINARÁ toda la información (${currentTotal} registros)\n• Las contraseñas NO se importan (acceso directo sin contraseña)\n• Las imágenes NO se importan (avatares y comprobantes)\n\n¿Deseas REEMPLAZAR los datos actuales?`,
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('profile.message.importAction'),
            style: 'destructive',
            onPress: () => performImport(importData, importCounts, totalRecords)
          }
        ]
      );

    } catch (error) {
      console.error('? Import error:', error);
      Alert.alert(
        t('error'),
        `${t('profile.message.importError')}:\n\n${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  };

  const performImport = async (importDataPayload: any, importCounts: any, totalRecords: number) => {
    try {
      console.log('?? Starting database import...');

      // 1. Destruir y recrear la base de datos limpia
      await nukeDatabase();
      console.log('?? Database nuked and recreated');

      // 2. Importar todos los datos
      const success = await importData(importDataPayload);
      if (!success) throw new Error(t('profile.message.importErrorProcess'));

      // 3. Reinicializar sesión y UI de forma secuencial (sin setTimeout)
      await initializeAuth();
      await refreshUser();
      await loadUserProfile();

      Alert.alert(
        `? ${t('success')}`,
        `${t('profile.message.importCompleted')}\n\n✅ ${totalRecords} registros importados:\n• ${importCounts.events} Eventos\n• ${importCounts.participants} Participantes\n• ${importCounts.expenses} Gastos\n• ${importCounts.settlements} Liquidaciones\n• ${importCounts.splits} Divisiones`
      );
    } catch (error) {
      console.error('? Import execution error:', error);
      Alert.alert(
        t('error'),
        `${t('profile.message.importError')}:\n\n${error instanceof Error ? error.message : 'Error desconocido'}`
      );
    }
  };

  // Function to import data to database using DataContext
  const importDataToDatabase = async (importDataPayload: any): Promise<boolean> => {
    try {
      console.log('?? Importing data to database...', Object.keys(importDataPayload.data || {}));
      
      // Use DataContext import function
      const success = await importData(importDataPayload);
      return success;
    } catch (error) {
      console.error('? Import to database failed:', error);
      throw error;
    }
  };

  const handleClearData = () => {
    Alert.alert(
      t('profile.message.deleteAllDataTitle'),
      t('profile.message.deleteAllDataMessage'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('profile.message.deleteAll'),
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('??? Starting complete data deletion...');
              await nukeDatabase();
              await initializeAuth();
              await refreshUser();
              await loadUserProfile();
              Alert.alert(t('success'), t('profile.message.deleteCompleted'));
            } catch (error) {
              console.error('? Error during reset:', error);
              Alert.alert(
                t('error'),
                `${t('profile.message.deleteError')}\n\nDetalle: ${error instanceof Error ? error.message : 'Error desconocido'}`
              );
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
    console.log('?? Updating notification:', key, 'to', value, 'for user:', user?.id);
    
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
        console.log('? Notification setting updated successfully in DB');
      } catch (error) {
        console.error('? Error updating notification setting:', error);
      }
    } else {
      console.error('?? No user ID found for notification update');
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
        titleAlignment="left"
        showThemeToggle={true}
        showLanguageSelector={true}
        showHelp={true}
        useDynamicColors={true}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Perfil del Usuario */}
        <Card style={styles.profileCard} onPress={closeAutoLogoutDropdown}>
          <View style={styles.profileHeader}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={handleChangeAvatar}
            >
              {user?.avatar ? (
                <Image 
                  source={{ uri: user.avatar }} 
                  style={styles.avatarImage}
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: '#4ECDC4' }]}>
                  <Text style={styles.avatarText}>
                    {getUserInitials(profileData.name)}
                  </Text>
                </View>
              )}
              <View style={styles.avatarEditOverlay}>
                <MaterialCommunityIcons name="camera" size={20} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profileData.name || 'Usuario Sin Nombre'}</Text>
              <Text style={styles.profileEmail}>{profileData.email || 'Sin email configurado'}</Text>
              {profileData.username && (
                <Text style={styles.profileUsername}>@{profileData.username}</Text>
              )}
            </View>
          </View>
        </Card>

        {/* Estadísticas */}
        {!isEditing && (
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
        )}

        {/* Información Personal */}
        {isEditing ? (
            <ProfileSection 
              title={t('profile.personalInfo')} 
              icon="account-edit" 
              onPress={closeAutoLogoutDropdown}
            >
              <Input
                label={`${t('profile.name')}`}
                value={profileData.name}
                onChangeText={(value) => setProfileData(prev => ({ ...prev, name: value }))}
                containerStyle={styles.editInput}
                required={true}
                error={submittedOnce && !profileData.name?.trim() ? t('profile.name') : ''}
              />
              <Input
                label={`${t('profile.username')}`}
                value={profileData.username}
                onChangeText={(value) => setProfileData(prev => ({ ...prev, username: value }))}
                containerStyle={styles.editInput}
                required={true}
                error={submittedOnce && !profileData.username?.trim() ? t('profile.username') : ''}
              />
              <Input
                label={`${t('profile.email')}`}
                value={profileData.email}
                onChangeText={(value) => setProfileData(prev => ({ ...prev, email: value.toLowerCase().replace(/\s/g, '') }))}
                keyboardType="email-address"
                containerStyle={styles.editInput}
                required={true}
                error={submittedOnce && !profileData.email?.trim() ? t('profile.email') : ''}
              />
              <Input
                label={`${t('profile.phone')} (${t('optional')})`}
                value={profileData.phone}
                onChangeText={(value) => {
                  const startsWithPlus = value.startsWith('+');
                  let filtered = value.replace(/[^\d\s\-()+]/g, '').replace(/\+/g, '');
                  if (startsWithPlus) filtered = '+' + filtered;
                  setProfileData(prev => ({ ...prev, phone: filtered }));
                }}
                keyboardType="phone-pad"
                containerStyle={styles.editInput}
              />
              
              {/* Botones de acción en el pie */}
              <View style={styles.editButtonsContainer}>
                <Button
                  title={t('cancel')}
                  variant="outlined"
                  size="medium"
                  onPress={() => {
                    closeAutoLogoutDropdown();
                    setIsEditing(false);
                    setSubmittedOnce(false);
                    // Recargar datos originales
                    loadUserProfile();
                  }}
                  style={styles.cancelButton}
                  textStyle={styles.cancelButtonText}
                />
                <Button
                  title={t('profile.saveChanges')}
                  variant="filled"
                  size="medium"
                  onPress={handleSaveProfile}
                  style={styles.saveButton}
                  textStyle={styles.saveButtonText}
                />
              </View>
            </ProfileSection>
        ) : (
          <ProfileSection 
            title={t('profile.personalInfo')} 
            icon="account" 
            onPress={closeAutoLogoutDropdown}
            rightAction={
              <TouchableOpacity
                style={styles.editIconButton}
                onPress={() => {
                  closeAutoLogoutDropdown();
                  setIsEditing(true);
                }}
              >
                <MaterialCommunityIcons
                  name="pencil"
                  size={20}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
            }
          >
            <SettingItem
              title={t('profile.name')}
              subtitle={profileData.name || 'No especificado'}
              icon="account"
              type="value"
              value=""
            />
            <SettingItem
              title={t('profile.username')}
              subtitle={profileData.username || 'No especificado'}
              icon="account-circle"
              type="value"
              value=""
            />
            <SettingItem
              title={t('profile.email')}
              subtitle={profileData.email || 'No especificado'}
              icon="email"
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

        {/* Seguridad */}
        {!isEditing && (
        <ProfileSection title={t('profile.security')} icon="lock" onPress={closeAutoLogoutDropdown} collapsible>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => {
              closeAutoLogoutDropdown();
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
              setShowCurrentPassword(false);
              setShowNewPassword(false);
              setShowConfirmPasswordVis(false);
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
                    await refreshUser();
                    Alert.alert(
                      `? ${t('profile.skipPasswordUpdated')}`, 
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
        )}

        {/* Preferencias */}
        {!isEditing && (
        <ProfileSection title={t('profile.preferences')} icon="cog" collapsible>
             {/* Auto Login Section */}
          <View style={styles.settingItem}>
            <View style={styles.settingIcon}>
              <MaterialCommunityIcons name="account-key" size={20} color={theme.colors.onSurfaceVariant} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>{t('profile.autoLogin')}</Text>
              <Text style={styles.settingSubtitle}>
                {autoLogin ? t('profile.autoLoginOn') : t('profile.autoLoginOff')}
              </Text>
            </View>
            <View style={styles.settingAction}>
              <Switch
                value={autoLogin}
                onValueChange={async (value) => {
                  try {
                    if (!user?.id) {
                      Alert.alert('Error', 'No se pudo identificar el usuario');
                      return;
                    }
                    
                    console.log(`?? ProfileScreen: Toggling auto-login for user ${user.id} to ${value}`);
                    console.log(`?? Current user in ProfileScreen:`, { id: user.id, username: user.username });
                    
                    await toggleAutoLogin(value);
                    
                    // Actualizar estado local inmediatamente
                    setAutoLogin(value);
                    
                    // Refrescar datos del usuario para asegurar sincronización
                    await refreshUser();
                    
                    // Recargar el perfil para obtener el estado actualizado
                    await loadUserProfile();
                    
                    Alert.alert(
                      `? ${t('profile.autoLoginUpdated')}`, 
                      value 
                        ? t('profile.autoLoginEnabled') 
                        : t('profile.autoLoginDisabled')
                    );
                  } catch (error) {
                    console.error('Error updating auto-login:', error);
                    Alert.alert(t('error'), t('profile.message.settingUpdateError'));
                  }
                }}
                trackColor={{ false: theme.colors.outline, true: theme.colors.primary }}
                thumbColor={theme.colors.surface}
              />
            </View>
          </View>
         
          <SettingItem
            title={t('profile.theme')}
            subtitle={isDarkMode ? t('profile.themeDark') : t('profile.themeLight')}
            icon="palette"
            type="navigation"
            onPress={toggleTheme}
          />
          <CurrencySelector
            selectedCurrency={profileData.preferredCurrency}
            onCurrencyChange={(currency: string) => {
              closeAutoLogoutDropdown();
              const validCurrency = currency as 'ARS' | 'USD' | 'EUR' | 'BRL';
              setProfileData(prev => ({ ...prev, preferredCurrency: validCurrency }));
              (async () => {
                try {
                  await updateUserProfile(user!.id, { preferred_currency: validCurrency });
                  console.log('Currency preference updated successfully:', validCurrency);
                } catch (error) {
                  console.error('Error updating currency preference:', error);
                }
              })();
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
                          await updateUserProfile(user!.id, { auto_logout: option.value });
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
        )}

        {/* Notificaciones */}
        {!isEditing && (
        <ProfileSection title={t('profile.notifications')} icon="bell" onPress={closeAutoLogoutDropdown} collapsible>
          <SettingItem
            title={t('notifications.paymentReceived')}
            subtitle={t('notifications.paymentReceivedDesc')}
            icon="cash-check"
            type="switch"
            value={profileData.notifications.paymentReceived}
            onValueChange={(value) => updateNotificationSetting('paymentReceived', value)}
          />
        </ProfileSection>
        )}

        {/* Privacidad */}
        {!isEditing && (
        <ProfileSection title={t('profile.privacySection')} icon="shield-account" onPress={closeAutoLogoutDropdown} collapsible>
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
        )}

        {/* Datos y Respaldo */}
        {!isEditing && (
        <ProfileSection title={t('profile.dataBackup')} icon="database" onPress={closeAutoLogoutDropdown} collapsible>
          <SettingItem
            title={t('profile.dataStats')}
            subtitle={t('profile.dataStatsDesc')}
            icon="chart-bar"
            type="navigation"
            onPress={handleShowDatabaseStats}
          />
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
        )}

        {/* Información de la App */}
        {!isEditing && (
        <ProfileSection title={t('profile.information')} icon="information" onPress={closeAutoLogoutDropdown} collapsible>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowChangelogModal(true)}
          >
            <View style={styles.settingIcon}>
              <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.onSurfaceVariant} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>{t('profile.appVersion')}</Text>
            </View>
            <View style={styles.settingAction}>
              <View style={styles.versionBadge}>
                <Text style={styles.versionBadgeText}>v1.5.0</Text>
              </View>
            </View>
          </TouchableOpacity>
          <SettingItem
            title={t('profile.aboutApp')}
            icon="information"
            type="navigation"
            onPress={() => setShowAboutModal(true)}
          />
          <SettingItem
            title={t('profile.termsOfService')}
            icon="file-document"
            type="navigation"
            onPress={() => setShowTermsModal(true)}
          />
          <SettingItem
            title={t('profile.privacyPolicy')}
            icon="shield-check"
            type="navigation"
            onPress={() => setShowPrivacyModal(true)}
          />
          <SettingItem
            title={t('profile.contactSupport')}
            icon="help-circle"
            type="navigation"
            onPress={() => setShowSupportModal(true)}
          />
        </ProfileSection>
        )}

        {/* Cerrar Sesión */}
        {!isEditing && (
          <Card style={StyleSheet.flatten([styles.card, styles.logoutCard])}>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name="logout" 
                size={22} 
                color="#F44336" 
              />
              <Text style={styles.logoutText}>{t('logout')}</Text>
            </TouchableOpacity>
          </Card>
        )}
      </ScrollView>
      </KeyboardAvoidingView>

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

            {/* Contraseña actual */}
            <View style={styles.modalPasswordRow}>
              <TextInput
                style={styles.modalPasswordInput}
                placeholder={t('profile.currentPassword')}
                placeholderTextColor={theme.colors.onSurfaceVariant}
                secureTextEntry={!showCurrentPassword}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                autoFocus
              />
              <TouchableOpacity style={styles.modalEyeButton} onPress={() => setShowCurrentPassword(v => !v)}>
                <MaterialCommunityIcons name={showCurrentPassword ? 'eye-off' : 'eye'} size={22} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {/* Nueva contraseña */}
            <View style={styles.modalPasswordRow}>
              <TextInput
                style={styles.modalPasswordInput}
                placeholder={t('profile.newPassword')}
                placeholderTextColor={theme.colors.onSurfaceVariant}
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity style={styles.modalEyeButton} onPress={() => setShowNewPassword(v => !v)}>
                <MaterialCommunityIcons name={showNewPassword ? 'eye-off' : 'eye'} size={22} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {/* Indicador de fortaleza */}
            {newPassword.length > 0 && (() => {
              const ps = calculatePasswordStrength(newPassword);
              return (
                <View style={styles.passwordStrengthContainer}>
                  <View style={styles.passwordStrengthBar}>
                    <View style={[styles.passwordStrengthFill, { width: `${(ps.score / 5) * 100}%` as any, backgroundColor: ps.color }]} />
                  </View>
                  <Text style={[styles.passwordStrengthText, { color: ps.color }]}>{ps.label}</Text>
                </View>
              );
            })()}

            {/* Confirmar nueva contraseña */}
            <View style={styles.modalPasswordRow}>
              <TextInput
                style={styles.modalPasswordInput}
                placeholder={t('profile.confirmPassword')}
                placeholderTextColor={theme.colors.onSurfaceVariant}
                secureTextEntry={!showConfirmPasswordVis}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity style={styles.modalEyeButton} onPress={() => setShowConfirmPasswordVis(v => !v)}>
                <MaterialCommunityIcons name={showConfirmPasswordVis ? 'eye-off' : 'eye'} size={22} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <Text style={styles.modalPasswordMismatch}>{t('profile.message.passwordMismatch')}</Text>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setShowCurrentPassword(false);
                  setShowNewPassword(false);
                  setShowConfirmPasswordVis(false);
                }}
              >
                <Text style={styles.modalButtonTextCancel}>{t('cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalButtonConfirm,
                  (confirmPassword.length > 0 && newPassword !== confirmPassword) && styles.modalButtonConfirmDisabled,
                ]}
                disabled={confirmPassword.length > 0 && newPassword !== confirmPassword}
                onPress={async () => {
                  if (!user?.id) {
                    Alert.alert(t('error'), t('profile.message.userNotFound'));
                    return;
                  }
                  if (newPassword.length < 6) {
                    Alert.alert(t('error'), t('profile.message.passwordTooShort'));
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    Alert.alert(t('error'), t('profile.message.passwordMismatch'));
                    return;
                  }
                  const isValid = await verifyUserPassword(user.id, currentPassword);
                  if (!isValid) {
                    Alert.alert(t('error'), t('profile.message.passwordIncorrect'));
                    return;
                  }
                  try {
                    await updateUserPassword(user.id, newPassword);
                    await refreshUser();
                    setShowPasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setShowCurrentPassword(false);
                    setShowNewPassword(false);
                    setShowConfirmPasswordVis(false);
                    Alert.alert(`? ${t('profile.passwordUpdated')}`, t('profile.passwordUpdateSuccess'));
                  } catch (error) {
                    Alert.alert(t('error'), t('profile.message.passwordChangeError'));
                  }
                }}
              >
                <Text style={styles.modalButtonTextConfirm}>{t('profile.updatePassword')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Changelog */}
      <Modal
        visible={showChangelogModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowChangelogModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.changelogModalContent}>
            <View style={styles.changelogHeader}>
              <Text style={styles.modalTitle}>{t('profile.changelogTitle')}</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowChangelogModal(false)}
              >
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.changelogContent} 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ flexGrow: 1 }}
              nestedScrollEnabled={true}
            >
              {/* Versión 1.5.0 - Versión Actual */}
              <TouchableOpacity 
                style={[styles.versionBlock, styles.currentVersionBlock]} 
                onPress={() => toggleVersionExpanded('1.5.0')}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={[styles.versionNumber, styles.currentVersionNumber]}>v1.5.0 (Actual)</Text>
                  <Text style={[styles.versionDate, styles.currentVersionDate]}>8 Abr 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.5.0') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                {expandedVersions.has('1.5.0') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🚀 Novedades</Text>
                      <Text style={styles.changelogItem}>• ManageFriends: Validación de nombre en tiempo real</Text>
                      <Text style={styles.changelogItem}>• AddParticipantModal: Validación de nombre en tiempo real</Text>
                      <Text style={styles.changelogItem}>• EventDetail: Detección y resolución de amigo duplicado al convertir participante</Text>
                      <Text style={styles.changelogItem}>• EventDetail: Eliminación múltiple de participantes</Text>
                      <Text style={styles.changelogItem}>• AddParticipantModal: Mensaje de éxito consolidado al agregar participantes</Text>
                      <Text style={styles.changelogItem}>• EventDetail: Tab Resumen — card Liquidaciones Pagadas</Text>
                      <Text style={styles.changelogItem}>• EventDetail: Tab Resumen — barra de acciones fija</Text>
                      <Text style={styles.changelogItem}>• EventDetail: Tab Participantes — barra de acciones fija</Text>
                      <Text style={styles.changelogItem}>• EventDetail: Tab Gastos — eliminación múltiple</Text>
                      <Text style={styles.changelogItem}>• EventDetail: Tab Gastos — buscador y barra fijos</Text>
                      <Text style={styles.changelogItem}>• CreateExpense: Soporte para múltiples pagadores</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• database.ts: getExpenses() no hidrataba el campo payers</Text>
                      <Text style={styles.changelogItem}>• EventDetail: totalPaid incorrecto en gastos multi-pagador</Text>
                      <Text style={styles.changelogItem}>• database.ts: eliminaba amigos permanentes de la app</Text>
                      <Text style={styles.changelogItem}>• AddParticipantModal: Re-renders errático al tipear nombre</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>✨ Mejoras</Text>
                      <Text style={styles.changelogItem}>• ManageFriends: Nuevas traducciones de validación de nombre</Text>
                      <Text style={styles.changelogItem}>• AddParticipantModal: Nuevas claves de traducción</Text>
                      <Text style={styles.changelogItem}>• LanguageContext: Claves para flujo de amigo duplicado en EventDetail</Text>
                      <Text style={styles.changelogItem}>• LanguageContext: Claves para eliminación múltiple de participantes</Text>
                      <Text style={styles.changelogItem}>• EventDetail: Modo selección se resetea al cambiar de tab</Text>
                      <Text style={styles.changelogItem}>• EventDetail: Botón eliminar individual de participante removido</Text>
                      <Text style={styles.changelogItem}>• EventDetail: Layout del panel derecho de cards invertido</Text>
                      <Text style={styles.changelogItem}>• EventDetail: Montos de pagado/división más grandes (fontSize 11→13)</Text>
                      <Text style={styles.changelogItem}>• LanguageContext: Claves para liquidaciones pagadas</Text>
                      <Text style={styles.changelogItem}>• EventDetail: Card Liquidaciones Pagadas oculta en eventos completados</Text>
                      <Text style={styles.changelogItem}>• LanguageContext: Claves para eliminación múltiple de gastos</Text>
                      <Text style={styles.changelogItem}>• EventDetail: Tab Gastos — modo selección reset al cambiar tab</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.4.10 */}
              <TouchableOpacity 
                style={[styles.versionBlock]} 
                onPress={() => toggleVersionExpanded('1.4.10')}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={[styles.versionNumber]}>v1.4.10</Text>
                  <Text style={[styles.versionDate]}>6 Abr 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.4.10') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                {expandedVersions.has('1.4.10') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• LanguageSelector: Modal no aparecía al abrirlo desde el overflow del HeaderBar</Text>
                      <Text style={styles.changelogItem}>• ProfileScreen: Labels profile.dataStats y profile.changelogTitle sin traducir</Text>
                      <Text style={styles.changelogItem}>• ProfileScreen: Bloque v1.4.9 ausente en el historial modal</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>✨ Mejoras</Text>
                      <Text style={styles.changelogItem}>• versiones.ps1: Búsqueda del marcador de versión con regex</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.4.9 */}
              <TouchableOpacity 
                style={[styles.versionBlock]} 
                onPress={() => toggleVersionExpanded('1.4.9')}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={[styles.versionNumber]}>v1.4.9</Text>
                  <Text style={[styles.versionDate]}>6 Abr 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.4.9') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                {expandedVersions.has('1.4.9') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🚀 Novedades</Text>
                      <Text style={styles.changelogItem}>• Script build-all.ps1: genera APK/AAB en un solo comando</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• getSplitsByEvent consulta BD directamente</Text>
                      <Text style={styles.changelogItem}>• Balance de participantes recalculado con consolidaciones</Text>
                      <Text style={styles.changelogItem}>• Doble conteo en balance con settlement condonado pagado</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>✨ Mejoras</Text>
                      <Text style={styles.changelogItem}>• Refresco automático al cambiar de tab</Text>
                      <Text style={styles.changelogItem}>• Monto adeudado muestra valor real con original tachado</Text>
                      <Text style={styles.changelogItem}>• Sección "Condonadas automáticamente" en liquidaciones</Text>
                      <Text style={styles.changelogItem}>• versiones.ps1: nuevo flujo Copilot integrado</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.4.8 - Condonaciones y mejoras cards de participantes */}
              <TouchableOpacity 
                style={[styles.versionBlock]} 
                onPress={() => toggleVersionExpanded('1.4.8')}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={[styles.versionNumber]}>v1.4.8</Text>
                  <Text style={[styles.versionDate]}>6 Abr 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.4.8') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                {expandedVersions.has('1.4.8') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• Home: contador liquidaciones ahora excluye condonaciones</Text>
                      <Text style={styles.changelogItem}>• Balance de participante se actualiza al confirmar liquidaciones</Text>
                      <Text style={styles.changelogItem}>• Balance corregido para participantes con deuda condonada</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>✨ Mejoras</Text>
                      <Text style={styles.changelogItem}>• Cards de participantes: desglose pagó/corresponde</Text>
                      <Text style={styles.changelogItem}>• Badge naranja cuando la deuda fue pagada por otro o condonada</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.4.7 - Validación inputs y secciones colapsables */}
              <TouchableOpacity 
                style={styles.versionBlock} 
                onPress={() => toggleVersionExpanded('1.4.7')}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={styles.versionNumber}>v1.4.7</Text>
                  <Text style={styles.versionDate}>2 Abr 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.4.7') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                {expandedVersions.has('1.4.7') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• Validación nombres duplicados en amigos y participantes</Text>
                      <Text style={styles.changelogItem}>• Modal contraseña: campo actual, fortaleza, ojos, disable</Text>
                      <Text style={styles.changelogItem}>• Filtrado y validación de teléfono en toda la app</Text>
                      <Text style={styles.changelogItem}>• Filtrado y validación de email en toda la app</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>✨ Mejoras</Text>
                      <Text style={styles.changelogItem}>• Secciones colapsables en Perfil</Text>
                      <Text style={styles.changelogItem}>• Sección Seguridad oculta en modo edición</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.4.6 - Validación campos y unificación modales */}
              <TouchableOpacity 
                style={styles.versionBlock} 
                onPress={() => toggleVersionExpanded('1.4.6')}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={styles.versionNumber}>v1.4.6</Text>
                  <Text style={styles.versionDate}>31 Mar 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.4.6') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                {expandedVersions.has('1.4.6') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🚀 Nuevas Funcionalidades</Text>
                      <Text style={styles.changelogItem}>• Icono SplitSmart en HeaderBar en todas las pantallas</Text>
                      <Text style={styles.changelogItem}>• Validación visual unificada en campos obligatorios (asterisco rojo)</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• Doble asterisco eliminado en modales y pantallas</Text>
                      <Text style={styles.changelogItem}>• Bug duplicación de texto en SignUpScreen corregido</Text>
                      <Text style={styles.changelogItem}>• Safe Area top en modales pageSheet corregida</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>✨ Mejoras</Text>
                      <Text style={styles.changelogItem}>• Botón "Crear cuenta" fijo al pie en SignUpScreen</Text>
                      <Text style={styles.changelogItem}>• Unificación estética de ConsolidationModal, ExpenseDetail y ParticipantInfo</Text>
                      <Text style={styles.changelogItem}>• Botón "Aplicar" en ConsolidationModal siempre visible</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.4.5 - Mejoras mensajes WhatsApp */}
              <TouchableOpacity 
                style={styles.versionBlock} 
                onPress={() => toggleVersionExpanded('1.4.5')}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={styles.versionNumber}>v1.4.5</Text>
                  <Text style={styles.versionDate}>24 Mar 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.4.5') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.onSurfaceVariant} 
                  />
                </View>
                {expandedVersions.has('1.4.5') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>✨ Mejoras</Text>
                      <Text style={styles.changelogItem}>• Mensajes de WhatsApp con divisoras y mejor formato</Text>
                      <Text style={styles.changelogItem}>• Saltos de línea corregidos en Compartir Resumen y Evento</Text>
                      <Text style={styles.changelogItem}>• Leyenda "Realizado con SplitSmart" al final de cada envío</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• Ruta del ícono de la app corregida en app.json</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.4.4 - Fix teclado en todas las pantallas */}
              <TouchableOpacity 
                style={styles.versionBlock} 
                onPress={() => toggleVersionExpanded('1.4.4')}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={styles.versionNumber}>v1.4.4</Text>
                  <Text style={styles.versionDate}>18 Mar 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.4.4') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.onSurfaceVariant} 
                  />
                </View>
                {expandedVersions.has('1.4.4') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• Teclado virtual tapaba el contenido en todas las pantallas</Text>
                      <Text style={styles.changelogItem}>• Formulario de nuevo amigo ahora desplazable con teclado activo</Text>
                      <Text style={styles.changelogItem}>• Fix para Android 15+: deshabilitado edge-to-edge forzado</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.4.3 - Correcciones importación y traducciones */}
              <TouchableOpacity 
                style={styles.versionBlock} 
                onPress={() => toggleVersionExpanded('1.4.3')}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={styles.versionNumber}>v1.4.3</Text>
                  <Text style={styles.versionDate}>9 Mar 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.4.3') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.onSurfaceVariant} 
                  />
                </View>
                {expandedVersions.has('1.4.3') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• Importación de backup corregida (error en settlements)</Text>
                      <Text style={styles.changelogItem}>• Traducciones faltantes: sección Privacidad y botón Archivar</Text>
                      <Text style={styles.changelogItem}>• Script APK ya no borra versiones anteriores generadas</Text>
                      <Text style={styles.changelogItem}>• Builds copian APK/AAB a carpeta centralizada automáticamente</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.4.2 - Eliminación permisos obsoletos Android */}
              <TouchableOpacity 
                style={styles.versionBlock} 
                onPress={() => toggleVersionExpanded('1.4.2')}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={styles.versionNumber}>v1.4.2</Text>
                  <Text style={styles.versionDate}>8 Mar 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.4.2') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.onSurfaceVariant} 
                  />
                </View>
                {expandedVersions.has('1.4.2') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• Eliminados permisos obsoletos: READ_MEDIA_IMAGES, WRITE_EXTERNAL_STORAGE, READ_EXTERNAL_STORAGE</Text>
                      <Text style={styles.changelogItem}>• Galería ahora usa Android Photo Picker nativo (sin solicitar permisos extra)</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.4.1 - Corrección bug edición participante */}
              <TouchableOpacity 
                style={styles.versionBlock} 
                onPress={() => toggleVersionExpanded('1.4.1')}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={styles.versionNumber}>v1.4.1</Text>
                  <Text style={styles.versionDate}>8 Mar 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.4.1') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.onSurfaceVariant} 
                  />
                </View>
                {expandedVersions.has('1.4.1') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• Crash al editar participante temporal (faltaba useLanguage)</Text>
                      <Text style={styles.changelogItem}>• Campos vacíos al abrir modal de edición (sync con useEffect)</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.4.0 - i18n completo + documentación legal */}
              <TouchableOpacity 
                style={styles.versionBlock} 
                onPress={() => toggleVersionExpanded('1.4.0')}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={styles.versionNumber}>v1.4.0</Text>
                  <Text style={styles.versionDate}>4 Mar 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.4.0') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.onSurfaceVariant} 
                  />
                </View>
                {expandedVersions.has('1.4.0') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🌍 Internacionalización</Text>
                      <Text style={styles.changelogItem}>• 30+ strings hardcodeados reemplazados en EventDetail</Text>
                      <Text style={styles.changelogItem}>• Logout traducido en Home (ES/EN/PT)</Text>
                      <Text style={styles.changelogItem}>• Errores de ManageFriends traducidos (ES/EN/PT)</Text>
                      <Text style={styles.changelogItem}>• 38 nuevas claves × 3 idiomas en LanguageContext</Text>
                      <Text style={styles.changelogItem}>• EventDetail/language.ts eliminado (código muerto)</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>📄 Documentación Legal</Text>
                      <Text style={styles.changelogItem}>• Cumplimiento Ley N° 25.326 (Habeas Data Argentina)</Text>
                      <Text style={styles.changelogItem}>• Disclaimer financiero explícito en Términos</Text>
                      <Text style={styles.changelogItem}>• Jurisdicción: Córdoba, Argentina</Text>
                      <Text style={styles.changelogItem}>• Privacidad: descripción honesta de datos procesados</Text>
                      <Text style={styles.changelogItem}>• APK con nombre descriptivo: versión + fecha + hora</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.3.0 - Mejoras de Home y EventCard */}
              <TouchableOpacity 
                style={styles.versionBlock} 
                onPress={() => toggleVersionExpanded('1.3.0')}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={styles.versionNumber}>v1.3.0</Text>
                  <Text style={styles.versionDate}>4 Mar 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.3.0') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.onSurfaceVariant} 
                  />
                </View>
                {expandedVersions.has('1.3.0') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🚀 Nuevas Funcionalidades</Text>
                      <Text style={styles.changelogItem}>• Botón eliminar evento en card (solo si no tiene datos)</Text>
                      <Text style={styles.changelogItem}>• Contador de liquidaciones ⚖️ (pagadas/total) en card</Text>
                      <Text style={styles.changelogItem}>• Ícono de liquidaciones en verde/naranja según estado</Text>
                      <Text style={styles.changelogItem}>• Filtro por estado en MetricsCard (toggle)</Text>
                      <Text style={styles.changelogItem}>• Ordenamiento de eventos: estado → fecha → título</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• Editar evento navega a Home (antes iba a EventDetail)</Text>
                      <Text style={styles.changelogItem}>• Crear evento reemplaza stack (back va a Home)</Text>
                      <Text style={styles.changelogItem}>• Cards del Home se actualizan al volver de EventDetail</Text>
                      <Text style={styles.changelogItem}>• Corrección campo isPaid en conteo de liquidaciones pagadas</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.2.0 - Auto-Login Avanzado */}
              <TouchableOpacity 
                style={styles.versionBlock} 
                onPress={() => toggleVersionExpanded('1.2.0')}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={styles.versionNumber}>v1.2.0</Text>
                  <Text style={styles.versionDate}>23 Dic 2025</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.2.0') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                {expandedVersions.has('1.2.0') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🚀 Funcionalidades Principales Nuevas</Text>
                      <Text style={styles.changelogItem}>• Sistema de Auto-Login Inteligente y Robusto</Text>
                      <Text style={styles.changelogItem}>• Identificación por ID único para usuarios</Text>
                      <Text style={styles.changelogItem}>• Seguimiento de último login por usuario</Text>
                      <Text style={styles.changelogItem}>• Lógica de fallback al usuario DEMO</Text>
                      <Text style={styles.changelogItem}>• Configuración independiente skip-password y auto-login</Text>
                      <Text style={styles.changelogItem}>• Preservación de configuraciones entre sesiones</Text>
                      <Text style={styles.changelogItem}>• Validaciones de configuración en inicialización</Text>
                      <Text style={styles.changelogItem}>• Sistema completo de datos de ejemplo para DEMO</Text>
                      <Text style={styles.changelogItem}>• Opción de regenerar datos de ejemplo</Text>
                      <Text style={styles.changelogItem}>• Protección de datos DEMO en resets</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>💎 Mejoras de Base de Datos</Text>
                      <Text style={styles.changelogItem}>• Migraciones automáticas de esquema</Text>
                      <Text style={styles.changelogItem}>• Campo last_login para tracking de sesiones</Text>
                      <Text style={styles.changelogItem}>• Validaciones de integridad referencial</Text>
                      <Text style={styles.changelogItem}>• Verificación de esquema en inicialización</Text>
                      <Text style={styles.changelogItem}>• Sistema robusto de creación de tablas</Text>
                      <Text style={styles.changelogItem}>• Manejo mejorado de errores de BD</Text>
                      <Text style={styles.changelogItem}>• Diagnósticos de tablas implementados</Text>
                      <Text style={styles.changelogItem}>• Estadísticas detalladas de datos</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🎨 Mejoras de Interfaz y UX</Text>
                      <Text style={styles.changelogItem}>• Modal de estadísticas de base de datos</Text>
                      <Text style={styles.changelogItem}>• Información técnica expandible</Text>
                      <Text style={styles.changelogItem}>• Historial de versiones más detallado</Text>
                      <Text style={styles.changelogItem}>• Validaciones mejoradas en formularios</Text>
                      <Text style={styles.changelogItem}>• Feedback visual de configuraciones</Text>
                      <Text style={styles.changelogItem}>• Logging detallado para debugging</Text>
                      <Text style={styles.changelogItem}>• Mensajes de confirmación mejorados</Text>
                      <Text style={styles.changelogItem}>• Interfaz de configuración más intuitiva</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Mejoras Técnicas y Estabilidad</Text>
                      <Text style={styles.changelogItem}>• Corrección completa de errores de TypeScript</Text>
                      <Text style={styles.changelogItem}>• Tipos mejorados para todas las funciones</Text>
                      <Text style={styles.changelogItem}>• Sistema de build optimizado</Text>
                      <Text style={styles.changelogItem}>• Configuración EAS Build mejorada</Text>
                      <Text style={styles.changelogItem}>• Manejo robusto de errores de red</Text>
                      <Text style={styles.changelogItem}>• Validaciones de entrada mejoradas</Text>
                      <Text style={styles.changelogItem}>• Arquitectura más limpia y modular</Text>
                      <Text style={styles.changelogItem}>• Performance optimizada en consultas BD</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>📊 Nuevas Funcionalidades de Datos</Text>
                      <Text style={styles.changelogItem}>• 3 eventos de ejemplo completos (activo, completado, archivado)</Text>
                      <Text style={styles.changelogItem}>• 4 participantes diversos (amigos y temporales)</Text>
                      <Text style={styles.changelogItem}>• 10 gastos realistas con diferentes divisiones</Text>
                      <Text style={styles.changelogItem}>• 5 liquidaciones en estados variados</Text>
                      <Text style={styles.changelogItem}>• Datos coherentes con fechas realistas</Text>
                      <Text style={styles.changelogItem}>• Montos en pesos argentinos contextualizados</Text>
                      <Text style={styles.changelogItem}>• Relaciones completas entre todas las tablas</Text>
                      <Text style={styles.changelogItem}>• IDs únicos con sistema de prefijos</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.1.0 - Funcionalidades Base Mejoradas */}
              <TouchableOpacity 
                style={styles.versionBlock} 
                onPress={() => toggleVersionExpanded('1.1.0')}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={styles.versionNumber}>v1.1.0</Text>
                  <Text style={styles.versionDate}>11 Dic 2025</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.1.0') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                {expandedVersions.has('1.1.0') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>✨ Nuevas Funcionalidades Avanzadas</Text>
                      <Text style={styles.changelogItem}>• Gestión avanzada de eventos y participantes</Text>
                      <Text style={styles.changelogItem}>• Sistema completo de exportación/importación</Text>
                      <Text style={styles.changelogItem}>• Notificaciones WhatsApp integradas</Text>
                      <Text style={styles.changelogItem}>• Temas claro/oscuro</Text>
                      <Text style={styles.changelogItem}>• Soporte para múltiples monedas</Text>
                      <Text style={styles.changelogItem}>• Auto-logout configurable</Text>
                      <Text style={styles.changelogItem}>• Sistema de privacidad y notificaciones</Text>
                      <Text style={styles.changelogItem}>• Gestión completa de liquidaciones</Text>
                      <Text style={styles.changelogItem}>• Avatar editable con cámara/galería</Text>
                      <Text style={styles.changelogItem}>• Modal de historial de versiones</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🎨 Mejoras de Interfaz</Text>
                      <Text style={styles.changelogItem}>• Perfil de usuario completamente renovado</Text>
                      <Text style={styles.changelogItem}>• Validaciones mejoradas en formularios</Text>
                      <Text style={styles.changelogItem}>• Botones de edición más intuitivos</Text>
                      <Text style={styles.changelogItem}>• Avatar editable directamente</Text>
                      <Text style={styles.changelogItem}>• Interfaz de liquidaciones mejorada</Text>
                      <Text style={styles.changelogItem}>• Cálculos de gastos optimizados</Text>
                      <Text style={styles.changelogItem}>• Rendimiento general mejorado</Text>
                      <Text style={styles.changelogItem}>• Interfaz de usuario refinada</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones y Estabilidad</Text>
                      <Text style={styles.changelogItem}>• Alineación de botones en modo edición</Text>
                      <Text style={styles.changelogItem}>• Visibilidad mejorada en modo oscuro</Text>
                      <Text style={styles.changelogItem}>• Errores de validación de campos corregidos</Text>
                      <Text style={styles.changelogItem}>• Problemas de base de datos solucionados</Text>
                      <Text style={styles.changelogItem}>• Migraciones de esquema implementadas</Text>
                      <Text style={styles.changelogItem}>• Duplicaciones de liquidaciones solucionadas</Text>
                      <Text style={styles.changelogItem}>• Persistencia de notificaciones corregida</Text>
                      <Text style={styles.changelogItem}>• Iconos alineados correctamente</Text>
                      <Text style={styles.changelogItem}>• Estabilidad general mejorada</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.0.0 - Origen */}
              <TouchableOpacity 
                style={styles.versionBlock} 
                onPress={() => toggleVersionExpanded('1.0.0')}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={styles.versionNumber}>v1.0.0</Text>
                  <Text style={styles.versionDate}>1 Oct 2025</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.0.0') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                {expandedVersions.has('1.0.0') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🚀 Lanzamiento Inicial - La Base de Todo</Text>
                      <Text style={styles.changelogItem}>• Gestión de gastos compartidos</Text>
                      <Text style={styles.changelogItem}>• Creación y administración de eventos</Text>
                      <Text style={styles.changelogItem}>• Cálculos automáticos de liquidaciones</Text>
                      <Text style={styles.changelogItem}>• Sistema de usuarios y perfiles básico</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>💡 El Origen</Text>
                      <Text style={styles.changelogItem}>• Primera versión funcional de SplitSmart</Text>
                      <Text style={styles.changelogItem}>• Base arquitectónica de la aplicación</Text>
                      <Text style={styles.changelogItem}>• Fundamentos del sistema de gastos compartidos</Text>
                      <Text style={styles.changelogItem}>• Punto de partida para la evolución hacia v1.1.0</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Acerca de */}
      <Modal
        visible={showAboutModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAboutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.changelogModalContent}>
            <View style={styles.changelogHeader}>
              <Text style={styles.modalTitle}>{t('profile.about.title')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAboutModal(false)}
              >
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>
            
            <ScrollView
              style={styles.changelogContent} 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ padding: 16 }}
            >
              {/* Introducción Principal */}
              <View style={styles.aboutSection}>
                <MaterialCommunityIcons 
                  name="account-group" 
                  size={64} 
                  color={theme.colors.primary} 
                  style={{ alignSelf: 'center', marginBottom: 16 }}
                />
                <Text style={styles.aboutTitle}>SplitSmart v1.5.0</Text>
                <Text style={styles.aboutDescription}>
                  {t('profile.about.appDescription')}
                </Text>
              </View>
              
              {/* Características Principales */}
              <View style={styles.aboutSection}>
                <Text style={styles.aboutSectionTitle}>{t('profile.about.keyFeatures')}</Text>
                
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.primary} />
                  <Text style={styles.aboutItem}>{t('profile.about.feature1')}</Text>
                </View>
                
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons name="account-group" size={20} color={theme.colors.primary} />
                  <Text style={styles.aboutItem}>{t('profile.about.feature2')}</Text>
                </View>
                
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons name="calculator" size={20} color={theme.colors.primary} />
                  <Text style={styles.aboutItem}>{t('profile.about.feature3')}</Text>
                </View>
                
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons name="chart-line" size={20} color={theme.colors.primary} />
                  <Text style={styles.aboutItem}>{t('profile.about.feature4')}</Text>
                </View>
                
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons name="cellphone" size={20} color={theme.colors.primary} />
                  <Text style={styles.aboutItem}>{t('profile.about.feature5')}</Text>
                </View>
                
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons name="shield-check" size={20} color="#4CAF50" />
                  <Text style={styles.aboutItem}>{t('profile.about.feature6')}</Text>
                </View>
              </View>

              {/* Información Técnica */}
              <View style={[styles.aboutSection, { backgroundColor: theme.colors.surfaceVariant, padding: 16, borderRadius: 12 }]}>
                <Text style={styles.aboutSectionTitle}>{t('profile.about.techSpecs')}</Text>
                <Text style={styles.aboutDescription}>
                  <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>{t('profile.about.version')}:</Text> 1.5.0{'\n'}
                  <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>{t('profile.about.platform')}</Text>{'\n'}
                  <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>{t('profile.about.database')}</Text>{'\n'}
                  <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>{t('profile.about.languages')}</Text>
                </Text>
              </View>

              {/* Seguridad y Privacidad */}
              <View style={styles.aboutSection}>
                <Text style={styles.aboutSectionTitle}>{t('profile.about.privacyCommitment')}</Text>
                <Text style={styles.aboutDescription}>
                  • <Text style={{ fontWeight: 'bold' }}>{t('profile.about.privacyItem1Title')}</Text> {t('profile.about.privacyItem1Desc')}{'\n'}
                  • <Text style={{ fontWeight: 'bold' }}>{t('profile.about.privacyItem2Title')}</Text> {t('profile.about.privacyItem2Desc')}{'\n'}
                  • <Text style={{ fontWeight: 'bold' }}>{t('profile.about.privacyItem3Title')}</Text> {t('profile.about.privacyItem3Desc')}{'\n'}
                  • <Text style={{ fontWeight: 'bold' }}>{t('profile.about.privacyItem4Title')}</Text> {t('profile.about.privacyItem4Desc')}
                </Text>
              </View>

              {/* Estadísticas */}
              <View style={styles.aboutSection}>
                <Text style={styles.aboutSectionTitle}>{t('profile.about.statistics')}</Text>
                <Text style={styles.aboutDescription}>
                  {t('profile.about.users')}{'\n'}
                  {t('profile.about.events')}{'\n'}
                  {t('profile.about.calculations')}
                </Text>
              </View>

              {/* Desarrollo */}
              <View style={styles.aboutSection}>
                <Text style={styles.aboutSectionTitle}>{t('profile.about.devTeam')}</Text>
                <Text style={styles.aboutDescription}>
                  {t('profile.about.devTeamDesc')}
                </Text>
              </View>

              {/* Contacto */}
              <View style={styles.aboutSection}>
                <Text style={styles.aboutSectionTitle}>{t('profile.about.contact')}</Text>
                <Text style={styles.aboutDescription}>
                  <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>{t('profile.about.email')}</Text> cbalucas@gmail.com{'\n'}
                  <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>{t('profile.about.whatsapp')}</Text> +54 351 617-5809 {t('profile.about.whatsappNote')}{'\n'}
                  <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>{t('profile.about.hours')}</Text> {t('profile.about.hoursValue')}
                </Text>
              </View>

              {/* Copyright */}
              <View style={[styles.aboutSection, { alignItems: 'center', borderTopWidth: 1, borderTopColor: theme.colors.outline, paddingTop: 20 }]}>
                <Text style={[styles.aboutDescription, { textAlign: 'center', fontSize: 12, color: theme.colors.onSurfaceVariant }]}>
                  {t('profile.about.copyright')}{'\n'}
                  {t('profile.about.madeWith')}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Estadísticas de la Base de Datos */}
      <Modal
        visible={showDatabaseStatsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDatabaseStatsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.databaseStatsModalContent}>
            <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.onSurface }}>📊 Estadísticas Datos</Text>
              <TouchableOpacity
                onPress={() => setShowDatabaseStatsModal(false)}
              >
                <MaterialCommunityIcons name="close" size={26} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>
            
            <ScrollView
              style={[styles.changelogContent]} 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ padding: 20, paddingTop: 10, flexGrow: 1 }}
              nestedScrollEnabled={true}
            >
              {databaseStats ? (
                <>
                  {/* Resumen */}
                  <View style={{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 12, marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
                      <Text style={{ color: theme.colors.onSurface, fontSize: 14 }}>Total de registros:</Text>
                      <Text style={{ color: theme.colors.primary, fontSize: 16, fontWeight: 'bold' }}>{databaseStats.totalRecords.toLocaleString()}</Text>
                    </View>
                    <View style={{ height: 1, backgroundColor: theme.colors.outline, marginVertical: 8, opacity: 0.3 }} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 }}>
                      <Text style={{ color: theme.colors.onSurface, fontSize: 14 }}>Tamaño de base de datos:</Text>
                      <Text style={{ color: theme.colors.primary, fontSize: 16, fontWeight: 'bold' }}>{databaseStats.databaseSize}</Text>
                    </View>
                  </View>

                  {/* Tablas Principales */}
                  <TouchableOpacity 
                    onPress={() => setShowMainTables(!showMainTables)}
                    style={{ 
                      backgroundColor: theme.colors.surfaceVariant, 
                      borderRadius: 8, 
                      padding: 12,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8
                    }}
                  >
                    <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 14, fontWeight: '500' }}>📋 Tablas Principales</Text>
                    <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 16 }}>{showMainTables ? '?' : '?'}</Text>
                  </TouchableOpacity>
                  
                  {showMainTables && (
                    <View style={{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 12, marginBottom: 16 }}>
                      {Object.entries(databaseStats.tables)
                        .filter(([tableName]) => {
                          const mainTables = ['users', 'events', 'participants', 'expenses', 'settlements', 'splits', 'event_participants', 'app_versions', 'sqlite_sequence'];
                          return mainTables.includes(tableName);
                        })
                        .sort((a, b) => b[1] - a[1])
                        .map(([tableName, count], index, array) => {
                          const friendlyNames: { [key: string]: string } = {
                            'users': 'Usuarios',
                            'events': 'Eventos', 
                            'participants': 'Participantes',
                            'expenses': 'Gastos',
                            'settlements': 'Liquidaciones',
                            'splits': 'Divisiones',
                            'event_participants': 'Evento-Participantes',
                            'app_versions': 'Versiones de App',
                            'sqlite_sequence': 'Secuencias SQLite'
                          };
                          
                          const displayName = friendlyNames[tableName] || `🗂️ ${tableName} (Desconocida)`;
                          const percentage = databaseStats.totalRecords > 0 
                            ? ((count / databaseStats.totalRecords) * 100).toFixed(1)
                            : '0.0';
                          
                          return (
                            <View key={tableName}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
                                <Text style={{ color: theme.colors.onSurface, fontSize: 14, flex: 1 }}>{displayName}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                  <Text style={{ color: theme.colors.primary, fontSize: 14, fontWeight: 'bold' }}>{count.toLocaleString()}</Text>
                                  <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12, minWidth: 40, textAlign: 'right' }}>({percentage}%)</Text>
                                </View>
                              </View>
                              {index < array.length - 1 && (
                                <View style={{ height: 1, backgroundColor: theme.colors.outline, marginVertical: 4, opacity: 0.3 }} />
                              )}
                            </View>
                          );
                        })
                      }
                    </View>
                  )}

                  {/* Tablas de Relación */}
                  <TouchableOpacity 
                    onPress={() => setShowRelationTables(!showRelationTables)}
                    style={{ 
                      backgroundColor: theme.colors.surfaceVariant, 
                      borderRadius: 8, 
                      padding: 12,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8
                    }}
                  >
                    <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 14, fontWeight: '500' }}>🔗 Tablas de Relación</Text>
                    <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 16 }}>{showRelationTables ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  
                  {showRelationTables && (
                    <View style={{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 12, marginBottom: 16 }}>
                      {Object.entries(databaseStats.tables)
                        .filter(([tableName]) => {
                          const relationTables = ['user_settings', 'user_preferences'];
                          const mainTables = ['users', 'events', 'participants', 'expenses', 'settlements', 'splits', 'event_participants', 'app_versions', 'sqlite_sequence'];
                          return relationTables.includes(tableName) || (!mainTables.includes(tableName));
                        })
                        .sort((a, b) => b[1] - a[1])
                        .map(([tableName, count], index, array) => {
                          const friendlyNames: { [key: string]: string } = {
                            'user_settings': 'Configuración de Usuario',
                            'user_preferences': 'Preferencias de Usuario'
                          };
                          
                          const displayName = friendlyNames[tableName] || `🔗 ${tableName} (Relacional)`;
                          const percentage = databaseStats.totalRecords > 0 
                            ? ((count / databaseStats.totalRecords) * 100).toFixed(1)
                            : '0.0';
                          
                          return (
                            <View key={tableName}>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 }}>
                                <Text style={{ color: theme.colors.onSurface, fontSize: 14, flex: 1 }}>{displayName}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                  <Text style={{ color: theme.colors.primary, fontSize: 14, fontWeight: 'bold' }}>{count.toLocaleString()}</Text>
                                  <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12, minWidth: 40, textAlign: 'right' }}>({percentage}%)</Text>
                                </View>
                              </View>
                              {index < array.length - 1 && (
                                <View style={{ height: 1, backgroundColor: theme.colors.outline, marginVertical: 4, opacity: 0.3 }} />
                              )}
                            </View>
                          );
                        })
                      }
                    </View>
                  )}

                  {/* Información Técnica */}
                  <TouchableOpacity 
                    onPress={() => setShowTechInfo(!showTechInfo)}
                    style={{ 
                      backgroundColor: theme.colors.surfaceVariant, 
                      borderRadius: 8, 
                      padding: 12,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 14 }}>ℹ️ Información técnica</Text>
                    <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 16 }}>{showTechInfo ? '▲' : '▼'}</Text>
                  </TouchableOpacity>
                  
                  {showTechInfo && (
                    <View style={{ backgroundColor: theme.colors.surface, borderRadius: 8, padding: 12, marginTop: 8 }}>
                      <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12, lineHeight: 16 }}>
                        • Datos del estado actual local{"\n"}
                        • Tablas "Legacy" del sistema anterior{"\n"}
                        • "Transacciones" unifica el nuevo sistema{"\n"}
                        • Porcentajes calculados sobre el total
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={[styles.aboutSection, { alignItems: 'center', paddingVertical: 40 }]}>
                  <MaterialCommunityIcons name="loading" size={48} color={theme.colors.primary} />
                  <Text style={[styles.aboutDescription, { marginTop: 16, textAlign: 'center' }]}>
                    Cargando estadísticas...
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Términos de Servicio */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.changelogModalContent}>
            <View style={styles.changelogHeader}>
              <Text style={styles.modalTitle}>{t('profile.terms.title')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowTermsModal(false)}
              >
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>
            
            <ScrollView
              style={styles.changelogContent} 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <View style={styles.termsSection}>
                <Text style={styles.termsTitle}>{t('profile.terms.acceptance')}</Text>
                <Text style={styles.termsText}>
                  {t('profile.terms.acceptanceText')}
                </Text>
              </View>

              <View style={styles.termsSection}>
                <Text style={styles.termsTitle}>{t('profile.terms.appDescription')}</Text>
                <Text style={styles.termsText}>
                  {t('profile.terms.appDescriptionText')}
                </Text>
              </View>

              <View style={styles.termsSection}>
                <Text style={styles.termsTitle}>{t('profile.terms.userResponsibilities')}</Text>
                <Text style={styles.termsText}>
                  {t('profile.terms.userResponsibilitiesText')}
                </Text>
              </View>

              <View style={styles.termsSection}>
                <Text style={styles.termsTitle}>{t('profile.terms.dataPrivacy')}</Text>
                <Text style={styles.termsText}>
                  {t('profile.terms.dataPrivacyText')}
                </Text>
              </View>

              <View style={styles.termsSection}>
                <Text style={styles.termsTitle}>{t('profile.terms.limitations')}</Text>
                <Text style={styles.termsText}>
                  {t('profile.terms.limitationsText')}
                </Text>
              </View>

              <View style={styles.termsSection}>
                <Text style={styles.termsTitle}>{t('profile.terms.modifications')}</Text>
                <Text style={styles.termsText}>
                  {t('profile.terms.modificationsText')}
                </Text>
              </View>

              <View style={styles.termsSection}>
                <Text style={styles.termsTitle}>{t('profile.terms.contact')}</Text>
                <Text style={styles.termsText}>
                  {t('profile.terms.contactText')}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Política de Privacidad */}
      <Modal
        visible={showPrivacyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPrivacyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.changelogModalContent}>
            <View style={styles.changelogHeader}>
              <Text style={styles.modalTitle}>{t('profile.privacy.title')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowPrivacyModal(false)}
              >
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>
            
            <ScrollView
              style={styles.changelogContent} 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <View style={styles.privacySection}>
                <Text style={styles.privacyTitle}>{t('profile.privacy.introduction')}</Text>
                <Text style={styles.privacyText}>
                  {t('profile.privacy.introductionText')}
                </Text>
              </View>

              <View style={styles.privacySection}>
                <Text style={styles.privacyTitle}>{t('profile.privacy.dataStorage')}</Text>
                <Text style={styles.privacyText}>
                  {t('profile.privacy.dataStorageText')}
                </Text>
              </View>

              <View style={styles.privacySection}>
                <Text style={styles.privacyTitle}>{t('profile.privacy.dataCollection')}</Text>
                <Text style={styles.privacyText}>
                  {t('profile.privacy.dataCollectionText')}
                </Text>
              </View>

              <View style={styles.privacySection}>
                <Text style={styles.privacyTitle}>{t('profile.privacy.dataUse')}</Text>
                <Text style={styles.privacyText}>
                  {t('profile.privacy.dataUseText')}
                </Text>
              </View>

              <View style={styles.privacySection}>
                <Text style={styles.privacyTitle}>{t('profile.privacy.dataSharing')}</Text>
                <Text style={styles.privacyText}>
                  {t('profile.privacy.dataSharingText')}
                </Text>
              </View>

              <View style={styles.privacySection}>
                <Text style={styles.privacyTitle}>{t('profile.privacy.dataSecurity')}</Text>
                <Text style={styles.privacyText}>
                  {t('profile.privacy.dataSecurityText')}
                </Text>
              </View>

              <View style={styles.privacySection}>
                <Text style={styles.privacyTitle}>{t('profile.privacy.userRights')}</Text>
                <Text style={styles.privacyText}>
                  {t('profile.privacy.userRightsText')}
                </Text>
              </View>

              <View style={styles.privacySection}>
                <Text style={styles.privacyTitle}>{t('profile.privacy.contact')}</Text>
                <Text style={styles.privacyText}>
                  {t('profile.privacy.contactText')}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Contactar Soporte */}
      <Modal
        visible={showSupportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSupportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.changelogModalContent}>
            <View style={styles.changelogHeader}>
              <Text style={styles.modalTitle}>{t('profile.support.title')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSupportModal(false)}
              >
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurface} />
              </TouchableOpacity>
            </View>
            
            <ScrollView
              style={styles.changelogContent} 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <View style={styles.supportSection}>
                <Text style={styles.supportTitle}>{t('profile.support.description')}</Text>
                <Text style={styles.supportText}>
                  {t('profile.support.description')}
                </Text>
              </View>

              <View style={styles.supportSection}>
                <Text style={styles.supportSectionTitle}>{t('profile.support.contactMethods')}</Text>
                <TouchableOpacity 
                  style={styles.contactItem}
                  onPress={() => Alert.alert('Email', 'cbalucas@gmail.com')}
                >
                  <MaterialCommunityIcons name="email" size={20} color={theme.colors.primary} />
                  <Text style={styles.contactText}>cbalucas@gmail.com</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.supportSection}>
                <TouchableOpacity 
                  style={styles.contactItem}
                  onPress={() => {
                    const message = encodeURIComponent("Hola! Necesito ayuda con SplitSmart");
                    Linking.openURL(`whatsapp://send?phone=5493516175809&text=${message}`);
                  }}
                >
                  <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
                  <Text style={styles.contactText}>+54 351 617-5809 {t('profile.support.whatsappNote')}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.supportSection}>
                <Text style={styles.supportSectionTitle}>{t('profile.support.reportIssue')}</Text>
                <Text style={styles.supportText}>
                  {t('profile.support.reportIssueText')}
                </Text>
                <Text style={styles.supportText}>{t('profile.support.reportItem1')}</Text>
                <Text style={styles.supportText}>{t('profile.support.reportItem2')}</Text>
                <Text style={styles.supportText}>{t('profile.support.reportItem3')}</Text>
                <Text style={styles.supportText}>{t('profile.support.reportItem4')}</Text>
              </View>

              <View style={styles.supportSection}>
                <Text style={styles.supportSectionTitle}>{t('profile.support.responseTime')}</Text>
                <Text style={styles.supportText}>
                  {t('profile.support.responseTimeText')}
                </Text>
              </View>

              <View style={styles.supportSection}>
                <Text style={styles.supportSectionTitle}>{t('profile.support.beforeContact')}</Text>
                <Text style={styles.supportText}>
                  {t('profile.support.beforeContactText')}
                </Text>
                <Text style={styles.supportText}>{t('profile.support.beforeItem1')}</Text>
                <Text style={styles.supportText}>{t('profile.support.beforeItem2')}</Text>
                <Text style={styles.supportText}>{t('profile.support.beforeItem3')}</Text>
                <Text style={styles.supportText}>{t('profile.support.beforeItem4')}</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;