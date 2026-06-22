import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Modal,
  TextInput,
  Image,
  Pressable,
  Linking,
  KeyboardAvoidingView,
  Platform,
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
import { getSplittyImage } from '../../constants/splitty';
import { databaseService } from '../../services/DatabaseFactory';
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
import { showAlert } from '../../services/alertService';
import { fetchVersionInfo, isNewerVersion, RemoteVersionInfo } from '../../services/UpdateService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TutorialOverlay from '../../components/TutorialOverlay';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const appVersion: string = require('../../../app.json').expo?.version ?? require('../../../app.json').version ?? '0.0.0';

const ProfileSection: React.FC<ProfileSectionProps> = ({ title, icon, children, onPress, rightAction, collapsible, isOpen, onToggle }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);

  // Si recibe control externo (isOpen/onToggle), úsalo; si no, maneja estado interno
  const [internalCollapsed, setInternalCollapsed] = useState(collapsible === true);
  const isControlled = isOpen !== undefined && onToggle !== undefined;
  const collapsed = isControlled ? !isOpen : internalCollapsed;

  // Special handling for logout section
  const isLogout = title === t('logout');
  const iconColor = isLogout ? '#F44336' : theme.colors.primary;

  const handleHeaderPress = () => {
    if (collapsible) {
      if (isControlled) {
        onToggle!();
      } else {
        setInternalCollapsed(prev => !prev);
      }
    }
    onPress?.();
  };

  return (
    <Card style={styles.card} onPress={collapsible ? undefined : onPress}>
      <TouchableOpacity
        style={[styles.sectionHeader, collapsed && { marginBottom: 0 }]}
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
  const { user, logout, refreshUser, initializeAuth, toggleAutoLogin, toggleChatMode, toggleBiometric } = useAuth();
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
    updateUserPrivacy,
    getParticipantByUserId
  } = useData();
  const styles = createStyles(theme);

  const [profileData, setProfileData] = useState<UserProfileData>({
    name: user?.name || 'Usuario Demo',
    username: '', // NUEVO CAMPO
    email: user?.email || 'demo@splitsmart.com',
    phone: '',
    alias_cbu: '',
    preferredCurrency: 'ARS',
    autoLogout: 'never',
    notifications: {
      paymentReceived: false, // Por defecto desactivado
    },
    privacy: {
      shareEvent: true, // NUEVO CAMPO
      allowInvitations: true, // NUEVO CAMPO
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setOpenSection(prev => (prev === id ? null : id));
  };
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPasswordVis, setShowConfirmPasswordVis] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [skipPassword, setSkipPassword] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);
  const [chatModeAdvanced, setChatModeAdvanced] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [showAutoLogoutOptions, setShowAutoLogoutOptions] = useState(false);
  const [showChangelogModal, setShowChangelogModal] = useState(false);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());
  const changelogScrollRef = useRef<ScrollView>(null);
  const versionYOffsets = useRef<Record<string, number>>({});
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showDatabaseStatsModal, setShowDatabaseStatsModal] = useState(false);
  const [showErrorGuideModal, setShowErrorGuideModal] = useState(false);
  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false);
  const [deleteIncludeUsers, setDeleteIncludeUsers] = useState(false);
  const [selectedErrorScreen, setSelectedErrorScreen] = useState<{ title: string; icon: string; color: string; errors: { title: string; desc: string }[] } | null>(null);
  const [versionInfo, setVersionInfo] = useState<RemoteVersionInfo | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [databaseStats, setDatabaseStats] = useState<{
    tables: { [tableName: string]: number };
    totalRecords: number;
    databaseSize: string;
  } | null>(null);
  const [deviceStorage, setDeviceStorage] = useState<{
    free: string;
    total: string;
    freePercent: number;
  } | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    totalEvents: 0,
    activeEvents: 0,
    lockedEvents: 0,
    closedEvents: 0,
    friendsCount: 0
  });
  const autoLogoutDropdownRef = useRef<View>(null);
  const [pfTourVisible, setPfTourVisible] = useState(false);
  const [pfTourStep, setPfTourStep] = useState(0);
  const pfHeaderRef = useRef<View>(null);
  const pfCardRef = useRef<View>(null);
  const pfStatsRef = useRef<View>(null);
  const pfSettingsRef = useRef<View>(null);
  const pfInfoRef = useRef<View>(null);
  const pfBannerRef = useRef<View>(null);
  const pfScrollRef = useRef<ScrollView>(null);
  const pfPersonalInfoRef = useRef<View>(null);
  const pfPreferencesRef = useRef<View>(null);
  const pfDataBackupRef = useRef<View>(null);
  const pfErrorGuideRef = useRef<View>(null);
  const pfComingSoonRef = useRef<View>(null);
  const [pfSectionY, setPfSectionY] = useState({ banner: 0, card: 0, stats: 0, personalInfo: 0, settings: 0, preferences: 0, dataBackup: 0, info: 0, errorGuide: 0, comingSoon: 0 });

  /** Devuelve un callback onBeforeShow que scrollea al Y precalculado de cada sección */
  const scrollToSection = (key: keyof typeof pfSectionY) => () => {
    pfScrollRef.current?.scrollTo({ y: Math.max(0, pfSectionY[key] - 90), animated: false });
  };

  useEffect(() => {
    calculateStats();
    loadUserProfile();
  }, [events, expenses, participants]);

  // Al entrar al perfil, verificar si existe un amigo vinculado
  useEffect(() => {
    if (!user?.id) return;
    const checkLinkedFriend = async () => {
      try {
        const linked = await getParticipantByUserId(user.id);
        if (!linked) {
          showAlert({
            type: 'info',
            title: 'Amigo vinculado',
            message: 'No tenés un amigo vinculado a tu perfil. ¿Querés crear uno con tus datos para que otros puedan agregarte a eventos?',
            buttons: [
              {
                text: 'Crear amigo',
                icon: 'account-plus',
                onPress: async () => {
                  if (!user?.id) return;
                  try {
                    await databaseService.createParticipant({
                      id: `friend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                      name: user.name || profileData.name,
                      email: user.email || profileData.email || undefined,
                      phone: profileData.phone || undefined,
                      alias_cbu: profileData.alias_cbu || undefined,
                      avatar: user.avatar || undefined,
                      isActive: true,
                      participantType: 'friend',
                      userId: user.id,
                      createdByUserId: user.id,
                      isPublic: false,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    });
                    showAlert({ type: 'success', title: 'Amigo creado', message: 'Ahora aparecerás como amigo al agregar participantes.' });
                  } catch {
                    showAlert({ type: 'error', title: 'Error', message: 'No se pudo crear el amigo vinculado.' });
                  }
                }
              },
              { text: 'Ahora no', style: 'cancel' as const }
            ]
          });
        }
      } catch {}
    };
    checkLinkedFriend();
  }, [user?.id]);

  // Chequeo de versión disponible en Play Store
  useEffect(() => {
    fetchVersionInfo().then(info => {
      if (info) {
        setVersionInfo(info);
        setUpdateAvailable(isNewerVersion(appVersion, info.version));
      }
    });
  }, []);

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

  const handlePfTourNext = () => setPfTourStep(s => s + 1);
  const handlePfTourPrev = () => { if (pfTourStep > 0) setPfTourStep(s => s - 1); };
  const handlePfTourClose = () => { setPfTourVisible(false); setPfTourStep(0); };

  useEffect(() => {
    const checkPfTour = async () => {
      try {
        const seen = await AsyncStorage.getItem('splitsmart_profile_tour_seen');
        if (!seen) {
          setPfTourVisible(true);
          await AsyncStorage.setItem('splitsmart_profile_tour_seen', 'true');
        }
      } catch {}
    };
    checkPfTour();
  }, []);

  const toggleVersionExpanded = (version: string) => {
    setExpandedVersions(prev => {
      if (prev.has(version)) {
        return new Set<string>();
      }
      setTimeout(() => {
        const y = versionYOffsets.current[version];
        if (y !== undefined) {
          changelogScrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
        }
      }, 300);
      return new Set<string>([version]);
    });
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
          alias_cbu: profile.alias_cbu || '',
          preferredCurrency: profile.preferred_currency || 'ARS',
          autoLogout: (profile.auto_logout as 'never' | '5min' | '15min' | '30min') || 'never',
          notifications: {
            paymentReceived: profile.notifications_payment_received === 1,
          },
          privacy: {
            shareEvent: profile.privacy_share_event === 1 || true,
            allowInvitations: profile.privacy_allow_invitations === 1 || true,
          }
        });
        setSkipPassword(profile.skip_password === 1);
        setAutoLogin(profile.auto_login === 1);
        setChatModeAdvanced(profile.chat_mode_advanced === 1);
        setBiometricEnabled(profile.biometric_enabled === 1);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const calculateStats = () => {
    const totalEvents = events.length;
    const activeEvents = events.filter(e => e.status === 'active' && !e.isLocked).length;
    const lockedEvents = events.filter(e => e.status === 'active' && e.isLocked).length;
    const closedEvents = events.filter(e => e.status === 'archived' || e.status === 'closed').length;
    const friendsCount = participants.filter(p => p.participantType === 'friend').length;

    setStats({
      totalEvents,
      activeEvents,
      lockedEvents,
      closedEvents,
      friendsCount
    });
  };

  const handleSaveProfile = async () => {
    setSubmittedOnce(true);
    if (!user?.id) {
      showAlert({ type: 'error', title: 'Error', message: 'No se pudo identificar el usuario' });
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
      showAlert({ type: 'error', title: 'Campos Requeridos', message: `Los siguientes campos son obligatorios:\n\n${emptyFields.map(f => `• ${f.name}`).join('\n')}`, buttons: [{ text: 'Entendido' }] });
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      showAlert({ type: 'error', title: t('error'), message: t('profile.message.emailInvalid') });
      return;
    }

    // Validar formato de teléfono (si fue ingresado)
    if (profileData.phone?.trim() && !/^\+?\d{1,16}$/.test(profileData.phone.trim())) {
      showAlert({ type: 'error', title: t('error'), message: t('profile.message.phoneInvalid') });
      return;
    }

    try {
      await updateUserProfile(user.id, {
        name: profileData.name,
        username: profileData.username || undefined,
        email: profileData.email,
        phone: profileData.phone || undefined,
        alias_cbu: profileData.alias_cbu || undefined,
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

      showAlert({ type: 'success', title: `✅ ${t('success')}`, message: t('profile.message.profileSaved') });
      setIsEditing(false);
      await refreshUser();
    } catch (error) {
      showAlert({ type: 'error', title: t('error'), message: t('profile.message.profileSaveError') });
    }
  };

  const pickImageFromGallery = async () => {
    try {
      // Android Photo Picker (API 33+) no requiere permisos READ_MEDIA_IMAGES
      // expo-image-picker v17 lo usa automáticamente sin necesidad de solicitarlos
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
      showAlert({ type: 'error', title: t('error'), message: t('profile.message.pickImageError') });
    }
  };

  // Abre la cámara real en web usando input[capture]
  const takePhotoWeb = (): Promise<string | null> =>
    new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = 'environment';
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) resolve(URL.createObjectURL(file));
        else resolve(null);
      };
      input.click();
    });

  const takePhoto = async () => {
    try {
      if (Platform.OS === 'web') {
        const uri = await takePhotoWeb();
        if (uri) await updateAvatar(uri);
        return;
      }
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert({ type: 'error', title: t('profile.message.permissionRequired'), message: t('profile.message.cameraPermission') });
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
      showAlert({ type: 'error', title: t('error'), message: t('profile.message.takePhotoError') });
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
      showAlert({ type: 'success', title: `✅ ${t('success')}`, message: t('profile.message.updateAvatarSuccess') });
    } catch (error) {
      console.error('? Error updating avatar:', error);
      showAlert({ type: 'error', title: t('error'), message: t('profile.message.updateAvatarError') });
    }
  };

  const handleChangeAvatar = () => {
    showAlert({
      type: 'info',
      title: t('profile.message.changeAvatarTitle'),
      message: t('profile.message.chooseOption'),
      buttons: [
        ...(Platform.OS !== 'web' ? [{ text: 'Foto', icon: 'camera', onPress: takePhoto }] : []),
        { text: 'Galería', icon: 'image-multiple', onPress: pickImageFromGallery },
        ...(user?.avatar ? [{
          text: 'Eliminar',
          icon: 'trash-can-outline',
          style: 'destructive' as const,
          onPress: async () => {
            if (user?.id) {
              await updateUserProfile(user.id, { avatar: null });
              await refreshUser();
            }
          }
        }] : []),
        { text: t('cancel'), style: 'cancel' as const },
      ],
    });
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
        showAlert({ type: 'success', title: `✅ ${t('success')}`, message: t('profile.message.exportFileSaved', { uri: fileUri }) });
        return true;
      }
    } catch (error) {
      console.error('? Error saving file:', error);
      throw error;
    }
  };

  const handleShowDatabaseStats = async () => {
    try {
      console.log('📊 Loading database statistics...');
      await databaseService.diagnoseTables();
      const dbStats = await databaseService.getDatabaseStats();
      setDatabaseStats(dbStats);

      // Espacio en el dispositivo
      try {
        const [freeBytes, totalBytes] = await Promise.all([
          FileSystem.getFreeDiskStorageAsync(),
          FileSystem.getTotalDiskCapacityAsync()
        ]);
        const fmtBytes = (bytes: number): string => {
          if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
          return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
        };
        setDeviceStorage({
          free: fmtBytes(freeBytes),
          total: fmtBytes(totalBytes),
          freePercent: Math.round((freeBytes / totalBytes) * 100)
        });
      } catch (storageErr) {
        console.warn('⚠️ No se pudo leer espacio del dispositivo:', storageErr);
        setDeviceStorage(null);
      }

      setShowDatabaseStatsModal(true);
    } catch (error) {
      console.error('❌ Error loading database stats:', error);
      showAlert({ type: 'error', title: t('error'), message: 'No se pudieron cargar las estadísticas de la base de datos' });
    }
  };

  const handleExportData = async () => {
    try {
      showAlert({ type: 'confirm', title: t('profile.message.exportDataTitle'), message: t('profile.message.exportConfirmMessage'), buttons: [
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
                  showAlert({ type: 'success', title: `✅ ${t('success')}`, message: `${t('profile.message.exportSuccess')}\n\n${t('profile.message.exportFileSaved', { uri: '' })}` });
                }
              } catch (error) {
                console.error('❌ Export error:', error);
                showAlert({ type: 'error', title: t('error'), message: `${t('profile.message.exportError')}\n\nDetalle: ${error instanceof Error ? error.message : 'Error desconocido'}` });
              }
            }
          }
        ] });
    } catch (error) {
      showAlert({ type: 'error', title: t('error'), message: t('profile.message.exportError') });
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
        showAlert({ type: 'error', title: t('error'), message: t('profile.message.importInvalidJson') });
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
        showAlert({ type: 'error', title: t('error'), message: `${t('profile.message.importInvalidFormat')}\n\nDetalles técnicos:\n• Metadata: ${JSON.stringify(importData.metadata)}\n• Version: ${importData.version}\n• Estructura: ${importData.data ? 'OK' : 'Missing data'}` });
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
      showAlert({ type: 'destructive', title: t('profile.message.importConfirmTitle'), message: `COMPARACIÓN DE DATOS:\n\n📊 DATOS ACTUALES (${currentTotal} total):\n• ${currentCounts.users} Usuario${currentCounts.users !== 1 ? 's' : ''} ? ${importCounts.users} Usuario${importCounts.users !== 1 ? 's' : ''}\n• ${currentCounts.events} Evento${currentCounts.events !== 1 ? 's' : ''} ? ${importCounts.events} Evento${importCounts.events !== 1 ? 's' : ''}\n• ${currentCounts.participants} Participante${currentCounts.participants !== 1 ? 's' : ''} ? ${importCounts.participants} Participante${importCounts.participants !== 1 ? 's' : ''}\n• ${currentCounts.expenses} Gasto${currentCounts.expenses !== 1 ? 's' : ''} ? ${importCounts.expenses} Gasto${importCounts.expenses !== 1 ? 's' : ''}\n• ${currentCounts.payments} Pago${currentCounts.payments !== 1 ? 's' : ''} ? ${importCounts.payments} Pago${importCounts.payments !== 1 ? 's' : ''}\n• ${currentCounts.eventParticipants} Relación${currentCounts.eventParticipants !== 1 ? 'es' : ''} ? ${importCounts.eventParticipants} Relación${importCounts.eventParticipants !== 1 ? 'es' : ''}\n• ${currentCounts.splits} División${currentCounts.splits !== 1 ? 'es' : ''} ? ${importCounts.splits} División${importCounts.splits !== 1 ? 'es' : ''}\n• ${currentCounts.settlements} Liquidación${currentCounts.settlements !== 1 ? 'es' : ''} ? ${importCounts.settlements} Liquidación${importCounts.settlements !== 1 ? 'es' : ''}\n\n📊 TOTAL A IMPORTAR: ${totalRecords} registros\n\n⚠️ IMPORTANTE:\n• Se ELIMINARÁ toda la información (${currentTotal} registros)\n• Las contraseñas NO se importan (acceso directo sin contraseña)\n• Las imágenes NO se importan (avatares y comprobantes)\n\n¿Deseas REEMPLAZAR los datos actuales?`, buttons: [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('profile.message.importAction'),
            style: 'destructive',
            onPress: () => performImport(importData, importCounts, totalRecords)
          }
        ] });

    } catch (error) {
      console.error('? Import error:', error);
      showAlert({ type: 'error', title: t('error'), message: `${t('profile.message.importError')}:\n\n${error instanceof Error ? error.message : 'Error desconocido'}` });
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

      showAlert({ type: 'success', title: `✅ ${t('success')}`, message: `${t('profile.message.importCompleted')}\n\n✅ ${totalRecords} registros importados:\n• ${importCounts.events} Eventos\n• ${importCounts.participants} Participantes\n• ${importCounts.expenses} Gastos\n• ${importCounts.settlements} Liquidaciones\n• ${importCounts.splits} Divisiones` });
    } catch (error) {
      console.error('? Import execution error:', error);
      showAlert({ type: 'error', title: t('error'), message: `${t('profile.message.importError')}:\n\n${error instanceof Error ? error.message : 'Error desconocido'}` });
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
    setDeleteIncludeUsers(false);
    setShowDeleteDataModal(true);
  };

  const handleConfirmDeleteData = async () => {
    setShowDeleteDataModal(false);
    try {
      if (deleteIncludeUsers) {
        await nukeDatabase();
        logout();
      } else {
        await clearAllData(false);
        await refreshUser();
        await loadUserProfile();
        showAlert({ type: 'success', title: t('success'), message: t('profile.message.deleteDataOnlyCompleted') });
      }
    } catch (error) {
      console.error('❌ Error during delete:', error);
      showAlert({ type: 'error', title: t('error'), message: t('profile.message.deleteError') });
    }
  };

  const handleLogout = () => {
    showAlert({ type: 'destructive', title: t('profile.message.logoutTitle'), message: t('profile.message.logoutMessage'), buttons: [
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
      ] });
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



  const ERROR_SCREENS: { key: string; title: string; icon: string; color: string; errors: { title: string; desc: string }[] }[] = [
    { key: 'login', title: 'Inicio de Sesión', icon: 'login', color: '#E91E63', errors: [
      { title: 'Credencial requerida', desc: 'No ingresaste usuario o email antes de tocar Ingresar.' },
      { title: 'Credenciales inválidas', desc: 'El usuario/email o contraseña no coinciden con ninguna cuenta.' },
    ]},
    { key: 'register', title: 'Registro', icon: 'account-plus', color: '#4CAF50', errors: [
      { title: 'Campos requeridos', desc: 'Hay campos obligatorios vacíos en el formulario de registro.' },
      { title: 'Usuario ya existe', desc: 'El nombre de usuario ingresado ya está en uso por otra cuenta.' },
      { title: 'Email ya existe', desc: 'El email ingresado ya está registrado en otra cuenta.' },
      { title: 'Error al crear cuenta', desc: 'Fallo interno al guardar el nuevo usuario en la base de datos.' },
    ]},
    { key: 'recover', title: 'Recuperar Contraseña', icon: 'lock-reset', color: '#FF9800', errors: [
      { title: 'Credencial requerida', desc: 'No ingresaste usuario o email antes de buscar la cuenta.' },
      { title: 'Usuario no encontrado', desc: 'No existe ninguna cuenta con ese usuario o email.' },
    ]},
    { key: 'profile', title: 'Mi Perfil', icon: 'account-circle', color: '#2196F3', errors: [
      { title: 'Campos requeridos', desc: 'Falta completar campos obligatorios del perfil (nombre, etc.).' },
      { title: 'Email inválido', desc: 'El formato del email ingresado no es válido (ej: sin @).' },
      { title: 'Teléfono inválido', desc: 'El teléfono debe tener hasta 16 dígitos con + opcional al inicio.' },
      { title: 'Permiso de cámara requerido', desc: 'Se denegó el permiso de acceso a la cámara del dispositivo.' },
      { title: 'Error al guardar perfil', desc: 'No se pudo escribir el perfil actualizado en la base de datos.' },
      { title: 'Error al exportar datos', desc: 'Fallo al generar o guardar el archivo de copia de seguridad.' },
      { title: 'Formato de importación inválido', desc: 'El archivo seleccionado no es una exportación válida de SplitSmart.' },
      { title: 'Error al eliminar datos', desc: 'Fallo al limpiar la base de datos local del dispositivo.' },
      { title: 'Contraseña incorrecta', desc: 'La contraseña actual ingresada no coincide con la guardada.' },
      { title: 'Contraseña muy corta', desc: 'La nueva contraseña debe tener al menos 6 caracteres.' },
    ]},
    { key: 'eventDetail', title: 'Detalle de Evento', icon: 'calendar-check', color: '#9C27B0', errors: [
      { title: 'Evento no editable', desc: 'Solo se pueden agregar/editar/eliminar gastos y participantes en eventos activos.' },
      { title: 'Nombre requerido', desc: 'Se intentó guardar un participante sin ingresar nombre.' },
      { title: 'Error al eliminar gasto', desc: 'No se pudo eliminar el gasto seleccionado de la base de datos.' },
      { title: 'Error al actualizar participante', desc: 'No se pudo guardar el nombre editado del participante.' },
      { title: 'Error al eliminar participante', desc: 'No se pudo quitar el participante del evento.' },
      { title: 'Consolidación no encontrada', desc: 'Se intentó aplicar una consolidación que ya no existe.' },
      { title: 'Error al cambiar estado de pago', desc: 'No se pudo registrar el pago/deuda del participante.' },
      { title: 'Compartir no disponible', desc: 'WhatsApp no está instalado; el resumen se copió al portapapeles.' },
    ]},
    { key: 'addParticipants', title: 'Agregar Participantes', icon: 'account-group', color: '#607D8B', errors: [
      { title: 'Seleccionar al menos uno', desc: 'En la pestaña Amigos, debés seleccionar al menos un amigo antes de agregar.' },
      { title: 'Nombre duplicado en evento', desc: 'Ya existe un participante con ese nombre en este evento.' },
      { title: 'Nombre duplicado en amigos', desc: 'Ya existe un amigo guardado con ese nombre exacto.' },
      { title: 'Teléfono inválido', desc: 'El teléfono ingresado no tiene el formato correcto (hasta 16 dígitos).' },
      { title: 'Email inválido', desc: 'El email ingresado no tiene el formato correcto.' },
      { title: 'Rango numérico inválido', desc: 'La cantidad de participantes genéricos debe ser entre 1 y 50.' },
      { title: 'Modo masivo restringido', desc: 'El evento tiene gastos registrados; no se pueden agregar participantes en forma masiva.' },
    ]},
    { key: 'createExpense', title: 'Crear Gasto', icon: 'receipt', color: '#F44336', errors: [
      { title: 'Evento cerrado', desc: 'No se pueden agregar gastos en eventos con estado cerrado o completado.' },
      { title: 'Permiso de cámara denegado', desc: 'Se denegó el permiso para usar la cámara al querer adjuntar un comprobante.' },
      { title: 'Error al seleccionar imagen', desc: 'No se pudo acceder a la galería del dispositivo.' },
      { title: 'Error al tomar foto', desc: 'Falló la captura de imagen desde la cámara.' },
    ]},
    { key: 'consolidation', title: 'Consolidación', icon: 'bank-transfer', color: '#00BCD4', errors: [
      { title: 'Sin consolidaciones seleccionadas', desc: 'Debés asignar al menos un pagador antes de aplicar la consolidación.' },
    ]},
  ];

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <View ref={pfHeaderRef} collapsable={false}>
      <HeaderBar
        title={t('profile.title')}
        titleAlignment="left"
        showThemeToggle={true}
        showLanguageSelector={true}
        showHelp={true}
        showLogout={true}
        useDynamicColors={true}
        showBackButton={Platform.OS === 'web'}
        onLeftPress={Platform.OS === 'web' ? () => navigation.goBack() : undefined}
        onHelpPress={() => { setPfTourStep(0); setPfTourVisible(true); }}
      />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView 
        ref={pfScrollRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Banner de versión */}
        <View ref={pfBannerRef} collapsable={false}
          onLayout={(e) => { const y = e.nativeEvent.layout.y; setPfSectionY(p => ({ ...p, banner: y })); }}>
        <TouchableOpacity
          activeOpacity={updateAvailable ? 0.7 : 1}
          onPress={updateAvailable && versionInfo ? () => Linking.openURL(versionInfo.playStoreUrl) : undefined}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginHorizontal: 16,
            marginBottom: 8,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: updateAvailable
              ? theme.colors.errorContainer ?? '#FDECEA'
              : theme.colors.primaryContainer ?? theme.colors.surface,
            borderWidth: 1,
            borderColor: updateAvailable ? theme.colors.error : theme.colors.primary + '40',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons
              name={updateAvailable ? 'update' : 'check-circle-outline'}
              size={18}
              color={updateAvailable ? theme.colors.error : theme.colors.primary}
            />
            <Text style={{ ...theme.typography.bodySmall, color: updateAvailable ? theme.colors.error : theme.colors.primary, fontWeight: '600' }}>
              {updateAvailable
                ? `Actualización disponible (v${versionInfo?.version})`
                : `Última versión (v${appVersion})`}
            </Text>
          </View>
          {updateAvailable && (
            <MaterialCommunityIcons name="download-circle-outline" size={22} color={theme.colors.error} />
          )}
        </TouchableOpacity>
        </View>

        {/* Perfil del Usuario */}
        <View ref={pfCardRef} collapsable={false}
          onLayout={(e) => { const y = e.nativeEvent.layout.y; setPfSectionY(p => ({ ...p, card: y })); }}>
        <Card style={styles.profileCard} onPress={closeAutoLogoutDropdown}>
          <View style={styles.profileHeader}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={handleChangeAvatar}
            >
              <View style={styles.avatarRing}>
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
              </View>
              <View style={styles.avatarEditOverlay}>
                <MaterialCommunityIcons name="camera" size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profileData.name || 'Usuario Sin Nombre'}</Text>
              {profileData.username ? (
                <View style={styles.profileDetailRow}>
                  <MaterialCommunityIcons name="at" size={13} color={theme.colors.primary} />
                  <Text style={styles.profileUsername}>{profileData.username}</Text>
                </View>
              ) : null}
              <View style={styles.profileDetailRow}>
                <MaterialCommunityIcons name="email-outline" size={13} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.profileEmail}>{profileData.email || 'Sin email configurado'}</Text>
              </View>
              {profileData.phone ? (
                <View style={styles.profileDetailRow}>
                  <MaterialCommunityIcons name="phone-outline" size={13} color={theme.colors.onSurfaceVariant} />
                  <Text style={styles.profileEmail}>{profileData.phone}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </Card>
        </View>

        {/* Estadísticas */}
        {!isEditing && (
        <View ref={pfStatsRef} collapsable={false}
          onLayout={(e) => { const y = e.nativeEvent.layout.y; setPfSectionY(p => ({ ...p, stats: y })); }}>
        <ProfileSection title={t('profile.stats')} icon="chart-line" onPress={closeAutoLogoutDropdown}>
          {/* Fila superior: Amigos + Total */}
          <View style={styles.statsTopRow}>
            <View style={[styles.statCardWide, { borderLeftColor: '#E91E63' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="account-group-outline" size={22} color="#E91E63" />
                <Text style={[styles.statCardNumber, { color: '#E91E63' }]}>{stats.friendsCount}</Text>
              </View>
              <Text style={[styles.statCardLabel, { color: theme.colors.onSurfaceVariant }]}>{t('profile.friendsCount')}</Text>
            </View>
            <View style={[styles.statCardWide, { borderLeftColor: theme.colors.primary }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="calendar-multiple" size={22} color={theme.colors.primary} />
                <Text style={[styles.statCardNumber, { color: theme.colors.primary }]}>{stats.totalEvents}</Text>
              </View>
              <Text style={[styles.statCardLabel, { color: theme.colors.onSurfaceVariant }]}>{t('profile.totalEvents')}</Text>
            </View>
          </View>
          {/* Fila inferior: Activos / Bloqueados / Cerrados */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { borderTopColor: '#4CAF50' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialCommunityIcons name="play-circle-outline" size={18} color="#4CAF50" />
                <Text style={[styles.statCardNumber, { color: '#4CAF50' }]}>{stats.activeEvents}</Text>
              </View>
              <Text style={[styles.statCardLabel, { color: theme.colors.onSurfaceVariant }]}>{t('profile.activeEvents')}</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: '#FF9800' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialCommunityIcons name="lock-outline" size={18} color="#FF9800" />
                <Text style={[styles.statCardNumber, { color: '#FF9800' }]}>{stats.lockedEvents}</Text>
              </View>
              <Text style={[styles.statCardLabel, { color: theme.colors.onSurfaceVariant }]}>{t('profile.lockedEvents')}</Text>
            </View>
            <View style={[styles.statCard, { borderTopColor: '#607D8B' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MaterialCommunityIcons name="archive-outline" size={18} color="#607D8B" />
                <Text style={[styles.statCardNumber, { color: '#607D8B' }]}>{stats.closedEvents}</Text>
              </View>
              <Text style={[styles.statCardLabel, { color: theme.colors.onSurfaceVariant }]}>{t('profile.closedEvents')}</Text>
            </View>
          </View>
        </ProfileSection>
        </View>
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
                  let digits = value.replace(/\D/g, '');
                  if (digits.length > 16) digits = digits.slice(0, 16);
                  const filtered = startsWithPlus ? '+' + digits : digits;
                  setProfileData(prev => ({ ...prev, phone: filtered }));
                }}
                keyboardType="phone-pad"
                containerStyle={styles.editInput}
              />
              <Input
                label={`${t('profile.cbu')} (${t('optional')})`}
                value={profileData.alias_cbu}
                onChangeText={(value) => setProfileData(prev => ({ ...prev, alias_cbu: value }))}
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
          <View ref={pfPersonalInfoRef} collapsable={false}
            onLayout={(e) => { const y = e.nativeEvent.layout.y; setPfSectionY(p => ({ ...p, personalInfo: y })); }}>
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
            {/* Fila: Nombre + Usuario */}
            <View style={[styles.statsGrid, { marginBottom: 10 }]}>
              <View style={[styles.infoNavCard, { borderTopColor: '#4CAF50' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <MaterialCommunityIcons name="account" size={20} color="#4CAF50" />
                  <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '700', color: '#4CAF50' }}>
                    {profileData.name || '—'}
                  </Text>
                </View>
                <Text style={styles.infoNavCardTitle}>{t('profile.name')}</Text>
              </View>
              <View style={[styles.infoNavCard, { borderTopColor: '#2196F3' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <MaterialCommunityIcons name="at" size={20} color="#2196F3" />
                  <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '700', color: '#2196F3' }}>
                    {profileData.username ? `@${profileData.username}` : '—'}
                  </Text>
                </View>
                <Text style={styles.infoNavCardTitle}>{t('profile.username')}</Text>
              </View>
            </View>
            {/* Email - ancho completo */}
            <View style={[styles.statCardWide, { borderLeftColor: '#FF9800', marginBottom: 10 }]}>
              <MaterialCommunityIcons name="email-outline" size={24} color="#FF9800" />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={[styles.statCardNumber, { color: theme.colors.onSurface, fontSize: 13 }]}>{profileData.email || '—'}</Text>
                <Text style={[styles.statCardLabel, { color: theme.colors.onSurfaceVariant, textAlign: 'left' }]}>{t('profile.email')}</Text>
              </View>
            </View>
            {/* Teléfono - condicional */}
            {profileData.phone && (
              <View style={[styles.statCardWide, { borderLeftColor: '#9C27B0' }]}>
                <MaterialCommunityIcons name="phone-outline" size={24} color="#9C27B0" />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={[styles.statCardNumber, { color: theme.colors.onSurface, fontSize: 13 }]}>{profileData.phone}</Text>
                  <Text style={[styles.statCardLabel, { color: theme.colors.onSurfaceVariant, textAlign: 'left' }]}>{t('profile.phone')}</Text>
                </View>
              </View>
            )}
          </ProfileSection>
          </View>
        )}
        {!isEditing && (
        <View ref={pfSettingsRef} collapsable={false}
          onLayout={(e) => { const y = e.nativeEvent.layout.y; setPfSectionY(p => ({ ...p, settings: y })); }}>
        <ProfileSection title={t('profile.security')} icon="lock" onPress={closeAutoLogoutDropdown} collapsible isOpen={openSection === 'security'} onToggle={() => toggleSection('security')}>
          {/* Fila: Cambiar Contraseña + Omitir Contraseña */}
          <View style={styles.statsGrid}>
            {/* Cambiar Contraseña */}
            <TouchableOpacity
              style={[styles.infoNavCard, { borderTopColor: '#E91E63' }]}
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
              <MaterialCommunityIcons name="lock-reset" size={22} color="#E91E63" />
              <Text numberOfLines={1} style={styles.infoNavCardTitle}>{t('profile.changePassword')}</Text>
            </TouchableOpacity>
            {/* Omitir Contraseña */}
            <TouchableOpacity
              style={[styles.infoNavCard, { borderTopColor: skipPassword ? theme.colors.primary : theme.colors.outline }]}
              onPress={async () => {
                try {
                  if (!user?.id) {
                    showAlert({ type: 'error', title: 'Error', message: 'No se pudo identificar el usuario' });
                    return;
                  }
                  const newValue = !skipPassword;
                  await updateUserProfile(user.id, { skipPassword: newValue });
                  setSkipPassword(newValue);
                  await refreshUser();
                  showAlert({ type: 'success', title: `✅ ${t('profile.skipPasswordUpdated')}`, message: newValue
                      ? t('profile.skipPasswordEnabled')
                      : t('profile.skipPasswordDisabled') });
                } catch (error) {
                  showAlert({ type: 'error', title: t('error'), message: t('profile.message.settingUpdateError') });
                }
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <MaterialCommunityIcons name="login-variant" size={20} color={skipPassword ? theme.colors.primary : theme.colors.onSurfaceVariant} />
                <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '700', color: skipPassword ? theme.colors.primary : theme.colors.onSurfaceVariant }}>
                  {skipPassword ? 'ACTIVO' : 'DESACTIVADO'}
                </Text>
              </View>
              <Text numberOfLines={1} style={styles.infoNavCardTitle}>{t('profile.skipPassword')}</Text>
            </TouchableOpacity>
          </View>
          {/* Fila: Huella / Face ID (solo nativo) */}
          {Platform.OS !== 'web' && (
            <View style={[styles.statsGrid, { marginTop: 10 }]}>
              <TouchableOpacity
                style={[styles.infoNavCard, { borderTopColor: biometricEnabled ? '#9C27B0' : theme.colors.outline }]}
                onPress={async () => {
                  try {
                    if (!user?.id) {
                      showAlert({ type: 'error', title: 'Error', message: 'No se pudo identificar el usuario' });
                      return;
                    }
                    const newValue = !biometricEnabled;
                    await toggleBiometric(newValue);
                    setBiometricEnabled(newValue);
                    showAlert({
                      type: 'success',
                      title: `✅ ${t('profile.biometricLogin')}`,
                      message: newValue
                        ? t('profile.biometricEnabled')
                        : t('profile.biometricDisabled'),
                    });
                  } catch (error) {
                    showAlert({ type: 'error', title: t('error'), message: t('profile.message.settingUpdateError') });
                  }
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <MaterialCommunityIcons name="fingerprint" size={20} color={biometricEnabled ? '#9C27B0' : theme.colors.onSurfaceVariant} />
                  <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: '700', color: biometricEnabled ? '#9C27B0' : theme.colors.onSurfaceVariant }}>
                    {biometricEnabled ? t('profile.biometricActive') : t('profile.biometricInactive')}
                  </Text>
                </View>
                <Text numberOfLines={1} style={styles.infoNavCardTitle}>{t('profile.biometricLogin')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ProfileSection>

        {/* Preferencias */}
        <View ref={pfPreferencesRef} collapsable={false}
          onLayout={(e) => { const y = e.nativeEvent.layout.y; setPfSectionY(p => ({ ...p, preferences: y })); }}>
        <ProfileSection title={t('profile.preferences')} icon="cog" collapsible isOpen={openSection === 'preferences'} onToggle={() => toggleSection('preferences')}>
          {/* Fila 1: Tema + Idioma */}
          <View style={[styles.statsGrid, { marginBottom: 10 }]}>
            <View style={{ flex: 1, height: 82 }}>
              <TouchableOpacity
                style={[styles.infoNavCard, { borderTopColor: '#E91E63' }]}
                onPress={toggleTheme}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <MaterialCommunityIcons name={isDarkMode ? 'weather-night' : 'weather-sunny'} size={20} color="#E91E63" />
                  <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '700', color: '#E91E63' }}>
                    {isDarkMode ? t('profile.themeDark') : t('profile.themeLight')}
                  </Text>
                </View>
                <Text style={styles.infoNavCardTitle}>{t('profile.theme')}</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, height: 82 }}>
              <LanguageSelector
                size={20}
                color={theme.colors.onSurfaceVariant}
                renderTrigger={(onPress) => (
                  <TouchableOpacity
                    style={[styles.infoNavCard, { borderTopColor: '#2196F3' }]}
                    onPress={() => { closeAutoLogoutDropdown(); onPress(); }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <MaterialCommunityIcons name="translate" size={20} color="#2196F3" />
                      <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '700', color: '#2196F3' }}>
                        {getLanguageDisplayName(language)}
                      </Text>
                    </View>
                    <Text style={styles.infoNavCardTitle}>{t('profile.language')}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
          {/* Fila 2: Moneda + Auto Cierre */}
          <View style={[styles.statsGrid, { marginBottom: 10 }]}>
            <View style={{ flex: 1, height: 82 }}>
              <CurrencySelector
                selectedCurrency={profileData.preferredCurrency}
                onCurrencyChange={(currency: string) => {
                  const validCurrency = currency as 'ARS' | 'USD' | 'EUR' | 'BRL';
                  setProfileData(prev => ({ ...prev, preferredCurrency: validCurrency }));
                  (async () => {
                    try {
                      await updateUserProfile(user!.id, { preferred_currency: validCurrency });
                    } catch (error) {
                      console.error('Error updating currency preference:', error);
                    }
                  })();
                }}
                renderTrigger={(onPress) => (
                  <TouchableOpacity
                    style={[styles.infoNavCard, { borderTopColor: '#FF9800' }]}
                    onPress={onPress}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <MaterialCommunityIcons name="currency-usd" size={20} color="#FF9800" />
                      <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '700', color: '#FF9800' }}>
                        {profileData.preferredCurrency}
                      </Text>
                    </View>
                    <Text style={styles.infoNavCardTitle}>{t('profile.currency')}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
            <View style={{ flex: 1, height: 82 }}>
            <TouchableOpacity
              style={[styles.infoNavCard, { borderTopColor: '#607D8B' }]}
              onPress={async () => {
                const options = getAutoLogoutOptions();
                const currentIndex = options.findIndex(o => o.value === profileData.autoLogout);
                const nextOption = options[(currentIndex + 1) % options.length];
                setProfileData(prev => ({ ...prev, autoLogout: nextOption.value }));
                try {
                  await updateUserProfile(user!.id, { auto_logout: nextOption.value });
                } catch (error) {
                  console.error('Error updating auto-logout preference:', error);
                }
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <MaterialCommunityIcons name="timer-outline" size={20} color="#607D8B" />
                <Text numberOfLines={1} style={{ fontSize: 12, fontWeight: '700', color: '#607D8B' }}>
                  {getAutoLogoutOptions().find(o => o.value === profileData.autoLogout)?.label}
                </Text>
              </View>
              <Text style={styles.infoNavCardTitle}>{t('profile.autoLogout')}</Text>
            </TouchableOpacity>
            </View>
          </View>
          {/* Auto Login - ancho completo */}
          <TouchableOpacity
            style={[styles.statCardWide, { borderLeftColor: autoLogin ? theme.colors.primary : theme.colors.outline }]}
            onPress={async () => {
              try {
                if (!user?.id) {
                  showAlert({ type: 'error', title: 'Error', message: 'No se pudo identificar el usuario' });
                  return;
                }
                const newValue = !autoLogin;
                await toggleAutoLogin(newValue);
                setAutoLogin(newValue);
                await refreshUser();
                await loadUserProfile();
                showAlert({ type: 'error', title: `✅ ${t('profile.autoLoginUpdated')}`, message: newValue ? t('profile.autoLoginEnabled') : t('profile.autoLoginDisabled') });
              } catch (error) {
                showAlert({ type: 'error', title: t('error'), message: t('profile.message.settingUpdateError') });
              }
            }}
          >
            <MaterialCommunityIcons name="account-key" size={24} color={autoLogin ? theme.colors.primary : theme.colors.onSurfaceVariant} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statCardNumber, { color: autoLogin ? theme.colors.primary : theme.colors.onSurface, fontSize: 15 }]}>{t('profile.autoLogin')}</Text>
              <Text style={[styles.statCardLabel, { color: theme.colors.onSurfaceVariant, textAlign: 'left' }]}>
                {autoLogin ? t('profile.autoLoginOn') : t('profile.autoLoginOff')}
              </Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: autoLogin ? theme.colors.primary : theme.colors.onSurfaceVariant }}>
              {autoLogin ? 'ACTIVADO' : 'DESACTIVADO'}
            </Text>
          </TouchableOpacity>
          {/* Modo Chat Avanzado (Splitty) - ancho completo */}
          <TouchableOpacity
            style={[styles.statCardWide, { borderLeftColor: chatModeAdvanced ? theme.colors.primary : theme.colors.outline, marginTop: 8 }]}
            onPress={async () => {
              try {
                if (!user?.id) return;
                const newValue = !chatModeAdvanced;
                await toggleChatMode(newValue);
                setChatModeAdvanced(newValue);
                showAlert({ type: 'success', title: `✅ ${t('profile.chatModeAdvancedUpdated')}`, message: newValue ? t('profile.chatModeAdvancedOn') : t('profile.chatModeAdvancedOff') });
              } catch (error) {
                showAlert({ type: 'error', title: t('error'), message: t('profile.message.settingUpdateError') });
              }
            }}
          >
            <Image
              source={getSplittyImage(language)}
              style={{ width: 36, height: 36, resizeMode: 'contain', opacity: chatModeAdvanced ? 1 : 0.4 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statCardNumber, { color: chatModeAdvanced ? theme.colors.primary : theme.colors.onSurface, fontSize: 15 }]}>{t('profile.chatModeAdvanced')}</Text>
              <Text style={[styles.statCardLabel, { color: theme.colors.onSurfaceVariant, textAlign: 'left' }]}>
                {chatModeAdvanced ? t('profile.chatModeAdvancedOn') : t('profile.chatModeAdvancedOff')}
              </Text>
            </View>
            <Text style={{ fontSize: 12, fontWeight: '700', color: chatModeAdvanced ? theme.colors.primary : theme.colors.onSurfaceVariant }}>
              {chatModeAdvanced ? 'ACTIVADO' : 'DESACTIVADO'}
            </Text>
          </TouchableOpacity>
        </ProfileSection>
        </View>
        </View>
        )}





        {/* Datos y Respaldo */}
        {!isEditing && (
        <View ref={pfDataBackupRef} collapsable={false}
          onLayout={(e) => { const y = e.nativeEvent.layout.y; setPfSectionY(p => ({ ...p, dataBackup: y })); }}>
        <ProfileSection title={t('profile.dataBackup')} icon="database" onPress={closeAutoLogoutDropdown} collapsible isOpen={openSection === 'dataBackup'} onToggle={() => toggleSection('dataBackup')}>
          {/* Fila 1: Estadísticas + Eliminar */}
          <View style={[styles.statsGrid, { marginBottom: 10 }]}>
            <TouchableOpacity style={[styles.infoNavCard, { borderTopColor: '#607D8B' }]} onPress={handleShowDatabaseStats}>
              <MaterialCommunityIcons name="chart-bar" size={22} color="#607D8B" />
              <Text style={styles.infoNavCardTitle}>{t('profile.dataStats')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.infoNavCard, { borderTopColor: '#F44336' }]} onPress={handleClearData}>
              <MaterialCommunityIcons name="delete-alert" size={22} color="#F44336" />
              <Text style={styles.infoNavCardTitle}>{t('profile.deleteAllData')}</Text>
            </TouchableOpacity>
          </View>
          {/* Fila 2: Exportar + Importar */}
          <View style={[styles.statsGrid]}>
            <TouchableOpacity style={[styles.infoNavCard, { borderTopColor: theme.colors.primary }]} onPress={handleExportData}>
              <MaterialCommunityIcons name="database-export" size={22} color={theme.colors.primary} />
              <Text style={styles.infoNavCardTitle}>{t('profile.exportData')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.infoNavCard, { borderTopColor: '#4CAF50' }]} onPress={handleImportData}>
              <MaterialCommunityIcons name="database-import" size={22} color="#4CAF50" />
              <Text style={styles.infoNavCardTitle}>{t('profile.importData')}</Text>
            </TouchableOpacity>
          </View>
        </ProfileSection>
        </View>
        )}
        {!isEditing && (
        <View ref={pfInfoRef} collapsable={false}
          onLayout={(e) => { const y = e.nativeEvent.layout.y; setPfSectionY(p => ({ ...p, info: y })); }}>
        <ProfileSection title={t('profile.information')} icon="information" onPress={closeAutoLogoutDropdown} collapsible isOpen={openSection === 'information'} onToggle={() => toggleSection('information')}>
          {/* Fila 1: Versión + Acerca de */}
          <View style={[styles.statsGrid, { marginBottom: 10 }]}>
            <TouchableOpacity style={[styles.infoNavCard, { borderTopColor: theme.colors.primary }]} onPress={() => setShowChangelogModal(true)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <MaterialCommunityIcons name="tag-outline" size={22} color={theme.colors.primary} />
                <Text style={[styles.versionBadgeText, { fontSize: 13 }]}>v{appVersion}</Text>
              </View>
              <Text style={styles.infoNavCardTitle}>{t('profile.appVersion')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.infoNavCard, { borderTopColor: theme.colors.primary }]} onPress={() => setShowAboutModal(true)}>
              <MaterialCommunityIcons name="information" size={22} color={theme.colors.primary} />
              <Text style={styles.infoNavCardTitle}>{t('profile.aboutApp')}</Text>
            </TouchableOpacity>
          </View>
          {/* Fila 2: Términos + Privacidad */}
          <View style={[styles.statsGrid, { marginBottom: 10 }]}>
            <TouchableOpacity style={[styles.infoNavCard, { borderTopColor: '#2196F3' }]} onPress={() => setShowTermsModal(true)}>
              <MaterialCommunityIcons name="file-document" size={22} color="#2196F3" />
              <Text style={styles.infoNavCardTitle}>{t('profile.termsOfService')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.infoNavCard, { borderTopColor: '#4CAF50' }]} onPress={() => setShowPrivacyModal(true)}>
              <MaterialCommunityIcons name="shield-check" size={22} color="#4CAF50" />
              <Text style={styles.infoNavCardTitle}>{t('profile.privacyPolicy')}</Text>
            </TouchableOpacity>
          </View>
          {/* Fila 3: Soporte (ancho completo) */}
          <TouchableOpacity style={[styles.statCardWide, { borderLeftColor: '#FF9800' }]} onPress={() => setShowSupportModal(true)}>
            <MaterialCommunityIcons name="headset" size={24} color="#FF9800" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statCardNumber, { color: '#FF9800', fontSize: 15 }]}>{t('profile.contactSupport')}</Text>
              <Text style={[styles.statCardLabel, { color: theme.colors.onSurfaceVariant, textAlign: 'left' }]}>Email · WhatsApp</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </ProfileSection>
        </View>
        )}

        {/* Guía de Errores */}
        {!isEditing && (
        <View ref={pfErrorGuideRef} collapsable={false}
          onLayout={(e) => { const y = e.nativeEvent.layout.y; setPfSectionY(p => ({ ...p, errorGuide: y })); }}>
        <ProfileSection title="Guía de Errores" icon="alert-circle-outline" onPress={closeAutoLogoutDropdown} collapsible isOpen={openSection === 'errorGuide'} onToggle={() => toggleSection('errorGuide')}>
          {/* Fila 1 */}
          <View style={[styles.statsGrid, { marginBottom: 10 }]}>
            {ERROR_SCREENS.slice(0, 2).map(screen => (
              <View key={screen.key} style={{ flex: 1, height: 82 }}>
                <TouchableOpacity
                  style={[styles.infoNavCard, { borderTopColor: screen.color }]}
                  onPress={() => { setSelectedErrorScreen(screen); setShowErrorGuideModal(true); }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <MaterialCommunityIcons name={screen.icon as any} size={20} color={screen.color} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: screen.color }}>{screen.errors.length} errores</Text>
                  </View>
                  <Text numberOfLines={1} style={styles.infoNavCardTitle}>{screen.title}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          {/* Fila 2 */}
          <View style={[styles.statsGrid, { marginBottom: 10 }]}>
            {ERROR_SCREENS.slice(2, 4).map(screen => (
              <View key={screen.key} style={{ flex: 1, height: 82 }}>
                <TouchableOpacity
                  style={[styles.infoNavCard, { borderTopColor: screen.color }]}
                  onPress={() => { setSelectedErrorScreen(screen); setShowErrorGuideModal(true); }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <MaterialCommunityIcons name={screen.icon as any} size={20} color={screen.color} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: screen.color }}>{screen.errors.length} errores</Text>
                  </View>
                  <Text numberOfLines={1} style={styles.infoNavCardTitle}>{screen.title}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          {/* Fila 3 */}
          <View style={[styles.statsGrid, { marginBottom: 10 }]}>
            {ERROR_SCREENS.slice(4, 6).map(screen => (
              <View key={screen.key} style={{ flex: 1, height: 82 }}>
                <TouchableOpacity
                  style={[styles.infoNavCard, { borderTopColor: screen.color }]}
                  onPress={() => { setSelectedErrorScreen(screen); setShowErrorGuideModal(true); }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <MaterialCommunityIcons name={screen.icon as any} size={20} color={screen.color} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: screen.color }}>{screen.errors.length} errores</Text>
                  </View>
                  <Text numberOfLines={1} style={styles.infoNavCardTitle}>{screen.title}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          {/* Fila 4 */}
          <View style={styles.statsGrid}>
            {ERROR_SCREENS.slice(6, 8).map(screen => (
              <View key={screen.key} style={{ flex: 1, height: 82 }}>
                <TouchableOpacity
                  style={[styles.infoNavCard, { borderTopColor: screen.color }]}
                  onPress={() => { setSelectedErrorScreen(screen); setShowErrorGuideModal(true); }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <MaterialCommunityIcons name={screen.icon as any} size={20} color={screen.color} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: screen.color }}>{screen.errors.length} errores</Text>
                  </View>
                  <Text numberOfLines={1} style={styles.infoNavCardTitle}>{screen.title}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ProfileSection>
        </View>
        )}

        {/* Próximamente */}
        {!isEditing && (
        <View ref={pfComingSoonRef} collapsable={false}
          onLayout={(e) => { const y = e.nativeEvent.layout.y; setPfSectionY(p => ({ ...p, comingSoon: y })); }}>
        <ProfileSection title={t('profile.comingSoon')} icon="rocket-launch" onPress={closeAutoLogoutDropdown} collapsible isOpen={openSection === 'comingSoon'} onToggle={() => toggleSection('comingSoon')}>
          {/* Notificaciones de Pago */}
          <View style={[styles.statCardWide, { borderLeftColor: '#4CAF50', marginBottom: 10 }]}>
            <MaterialCommunityIcons name="cash-check" size={24} color="#4CAF50" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statCardNumber, { color: theme.colors.onSurface, fontSize: 14 }]}>{t('notifications.paymentReceived')}</Text>
              <Text style={[styles.statCardLabel, { color: theme.colors.onSurfaceVariant, textAlign: 'left' }]}>{t('notifications.paymentReceivedDesc')}</Text>
            </View>
            <MaterialCommunityIcons name="rocket-launch" size={18} color={theme.colors.onSurfaceVariant} />
          </View>
          {/* Compartir Evento */}
          <View style={[styles.statCardWide, { borderLeftColor: '#2196F3' }]}>
            <MaterialCommunityIcons name="share" size={24} color="#2196F3" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statCardNumber, { color: theme.colors.onSurface, fontSize: 14 }]}>{t('profile.shareEvent')}</Text>
              <Text style={[styles.statCardLabel, { color: theme.colors.onSurfaceVariant, textAlign: 'left' }]}>{t('profile.shareEventDesc')}</Text>
            </View>
            <MaterialCommunityIcons name="rocket-launch" size={18} color={theme.colors.onSurfaceVariant} />
          </View>
        </ProfileSection>
        </View>
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
            {/* Header con ícono */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIconWrap}>
                <MaterialCommunityIcons name="lock-reset" size={22} color={theme.colors.primary} />
              </View>
              <Text style={styles.modalTitle}>{t('profile.changePassword')}</Text>
            </View>
            <View style={styles.modalDivider} />

            {/* Contraseña actual */}
            <View style={styles.modalFieldGroup}>
              <Text style={styles.modalFieldLabel}>{t('profile.currentPassword')}</Text>
              <View style={styles.modalPasswordRow}>
                <TextInput
                  style={styles.modalPasswordInput}
                  placeholder=""
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
            </View>

            {/* Nueva contraseña */}
            <View style={styles.modalFieldGroup}>
              <Text style={styles.modalFieldLabel}>{t('profile.newPassword')}</Text>
              <View style={styles.modalPasswordRow}>
                <TextInput
                  style={styles.modalPasswordInput}
                  placeholder=""
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
            </View>

            {/* Confirmar nueva contraseña */}
            <View style={styles.modalFieldGroup}>
              <Text style={styles.modalFieldLabel}>{t('profile.confirmPassword')}</Text>
              <View style={styles.modalPasswordRow}>
                <TextInput
                  style={styles.modalPasswordInput}
                  placeholder=""
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
            </View>
            
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
                    showAlert({ type: 'error', title: t('error'), message: t('profile.message.userNotFound') });
                    return;
                  }
                  if (newPassword.length < 6) {
                    showAlert({ type: 'error', title: t('error'), message: t('profile.message.passwordTooShort') });
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    showAlert({ type: 'error', title: t('error'), message: t('profile.message.passwordMismatch') });
                    return;
                  }
                  const isValid = await verifyUserPassword(user.id, currentPassword);
                  if (!isValid) {
                    showAlert({ type: 'error', title: t('error'), message: t('profile.message.passwordIncorrect') });
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
                    showAlert({ type: 'success', title: `✅ ${t('profile.passwordUpdated')}`, message: t('profile.passwordUpdateSuccess') });
                  } catch (error) {
                    showAlert({ type: 'error', title: t('error'), message: t('profile.message.passwordChangeError') });
                  }
                }}
              >
                <Text style={styles.modalButtonTextConfirm}>{t('profile.update')}</Text>
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
              <View style={styles.infoModalHeaderLeft}>
                <View style={[styles.infoModalHeaderIcon, { backgroundColor: theme.colors.primary }]}>
                  <MaterialCommunityIcons name="tag-multiple" size={18} color="#FFF" />
                </View>
                <Text style={styles.modalTitle}>{t('profile.changelogTitle')}</Text>
              </View>
            </View>
            
            <ScrollView
              ref={changelogScrollRef}
              style={styles.changelogContent}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ flexGrow: 1 }}
              nestedScrollEnabled={true}
            >
                                                                                                                                            {/* Versión 1.10.2 - Versión Actual */}
              <TouchableOpacity 
                style={[styles.versionBlock, styles.currentVersionBlock]} 
                onPress={() => toggleVersionExpanded('1.10.2')}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={[styles.versionNumber, styles.currentVersionNumber]}>v1.10.2 (Actual)</Text>
                  <Text style={[styles.versionDate, styles.currentVersionDate]}>18 Jun 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.10.2') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                {expandedVersions.has('1.10.2') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.changelogItem}>• Mejoras internas y correcciones</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

{/* Versión 1.10.1 - Versión Actual */}
              <TouchableOpacity 
                style={[styles.versionBlock]} 
                onPress={() => toggleVersionExpanded('1.10.1')}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={[styles.versionNumber]}>v1.10.1</Text>
                  <Text style={[styles.versionDate]}>18 Jun 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.10.1') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                {expandedVersions.has('1.10.1') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🚀 Novedades</Text>
                      <Text style={styles.changelogItem}>• Selector de moneda integrado en la misma fila que "Monto Total *" (chip + botón calcula...</Text>
                      <Text style={styles.changelogItem}>• Moneda diferente al evento</Text>
                      <Text style={styles.changelogItem}>• Moneda igual al evento</Text>
                      <Text style={styles.changelogItem}>• Calculadora inteligente</Text>
                      <Text style={styles.changelogItem}>• Al cambiar de moneda se limpian todos los campos de importe para evitar inconsistencias</Text>
                      <Text style={styles.changelogItem}>• Al editar un gasto con moneda diferente, los tres campos (monto extranjero, tasa, equiv...</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• /</Text>
                      <Text style={styles.changelogItem}>• Card de gastos</Text>
                      <Text style={styles.changelogItem}>• Modal de cierre</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>✨ Mejoras</Text>
                      <Text style={styles.changelogItem}>• Orden visual en</Text>
                      <Text style={styles.changelogItem}>• Input del campo de monto con label corto "Monto" (mismo-moneda) y labels contextuales p...</Text>
                      <Text style={styles.changelogItem}>• reposicionado ( en lugar de ) al eliminarse el botón calculadora del interior del input...</Text>
                      <Text style={styles.changelogItem}>• Traducciones nuevas agregadas en ES / EN / PT</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

{/* Versión 1.10.0 - Versión Actual */}
              <TouchableOpacity 
                style={[styles.versionBlock]} 
                onPress={() => toggleVersionExpanded('1.10.0')}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={[styles.versionNumber]}>v1.10.0</Text>
                  <Text style={[styles.versionDate]}>18 Jun 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.10.0') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                {expandedVersions.has('1.10.0') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🚀 Novedades</Text>
                      <Text style={styles.changelogItem}>• Recordar último usuario en Login</Text>
                      <Text style={styles.changelogItem}>• Modal "Seleccionar cuenta"</Text>
                      <Text style={styles.changelogItem}>• Biometría contextual por usuario</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• Biometría autenticaba usuario incorrecto</Text>
                      <Text style={styles.changelogItem}>• Botón biométrico visible sin usuario habilitado</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>✨ Mejoras</Text>
                      <Text style={styles.changelogItem}>• i18n Login: textos biométricos</Text>
                      <Text style={styles.changelogItem}>• i18n ProfileScreen: estado biométrico</Text>
                      <Text style={styles.changelogItem}>• Rediseño footer de Login</Text>
                      <Text style={styles.changelogItem}>• Nuevas claves i18n en</Text>
                      <Text style={styles.changelogItem}>• Nuevas claves i18n en</Text>
                      <Text style={styles.changelogItem}>• Nuevos estilos en</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

{/* Versión 1.9.2 - Versión Actual */}
              <TouchableOpacity 
                style={[styles.versionBlock]} 
                onPress={() => toggleVersionExpanded('1.9.2')}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={[styles.versionNumber]}>v1.9.2</Text>
                  <Text style={[styles.versionDate]}>27 Abr 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.9.2') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                {expandedVersions.has('1.9.2') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🚀 Novedades</Text>
                      <Text style={styles.changelogItem}>• Soporte Web (PWA): Capa de abstracción de base de datos</Text>
                      <Text style={styles.changelogItem}>• : Interfaz TypeScript con todas las firmas públicas de la BD (~40 métodos)</Text>
                      <Text style={styles.changelogItem}>• : Factory que selecciona automáticamente la implementación según</Text>
                      <Text style={styles.changelogItem}>• : Implementación completa para web usando IndexedDB (via )</Text>
                      <Text style={styles.changelogItem}>• En móvil (iOS/Android) sigue usando sin ningún cambio</Text>
                      <Text style={styles.changelogItem}>• En browser usa IndexedDB</Text>
                      <Text style={styles.changelogItem}>• Botón Atrás en versión web: Todas las pantallas de la app web muestran un botón "‹" par...</Text>
                      <Text style={styles.changelogItem}>• Compartir por WhatsApp Web: Al tocar "Compartir" en el resumen de un evento, en la vers...</Text>
                      <Text style={styles.changelogItem}>• PWA instalable: La versión web puede instalarse en el escritorio o en el celular como s...</Text>
                      <Text style={styles.changelogItem}>• Amigo vinculado al perfil: Al entrar al perfil, si no tenés un amigo creado con tus dat...</Text>
                      <Text style={styles.changelogItem}>• Notificación automática de actualización: La app ahora consulta directamente el Play St...</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• Notificación de nueva versión no aparecía: El aviso de "hay una versión nueva" se mostr...</Text>
                      <Text style={styles.changelogItem}>• Cámara en web abría selector de archivos: En la versión web, tomar foto abría el explor...</Text>
                      <Text style={styles.changelogItem}>• Fotos y galería en Perfil y Amigos (web): Corregido el flujo de selección de imagen en ...</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>✨ Mejoras</Text>
                      <Text style={styles.changelogItem}>• Nombres de participantes con mayúscula: Los participantes generados por Splitty (el asi...</Text>
                      <Text style={styles.changelogItem}>• Sincronización de datos Perfil ↔ Amigo vinculado: Si editás tus datos en el Perfil (nom...</Text>
                      <Text style={styles.changelogItem}>• latest-version.json se actualiza automáticamente: Al ejecutar para incrementar la versi...</Text>
                      <Text style={styles.changelogItem}>• Detección de versión directamente desde Play Store: En lugar de depender solo del archi...</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

{/* Versión 1.9.1 - Versión Actual */}
              <TouchableOpacity 
                style={[styles.versionBlock]} 
                onPress={() => toggleVersionExpanded('1.9.1')}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={[styles.versionNumber]}>v1.9.1</Text>
                  <Text style={[styles.versionDate]}>27 Abr 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.9.1') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                {expandedVersions.has('1.9.1') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🚀 Novedades</Text>
                      <Text style={styles.changelogItem}>• Layout de 2 cards en lugar de las 4 anteriores, usando el mismo design language que Pro...</Text>
                      <Text style={styles.changelogItem}>• Card 1: Información</Text>
                      <Text style={styles.changelogItem}>• Campo Ubicación</Text>
                      <Text style={styles.changelogItem}>• Card 2: Opciones</Text>
                      <Text style={styles.changelogItem}>• Contraída</Text>
                      <Text style={styles.changelogItem}>• Expandida: fila superior</Text>
                      <Text style={styles.changelogItem}>• Expandida: fila inferior</Text>
                      <Text style={styles.changelogItem}>• Card Compartir</Text>
                      <Text style={styles.changelogItem}>• TutorialOverlay actualizado</Text>
                      <Text style={styles.changelogItem}>• Helper</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• Íconos / no existen en MaterialCommunityIcons</Text>
                      <Text style={styles.changelogItem}>• Color del candado inconsistente</Text>
                      <Text style={styles.changelogItem}>• Cards de altura desigual</Text>
                      <Text style={styles.changelogItem}>• Card Tema sin wrapper</Text>
                      <Text style={styles.changelogItem}>• inline en Cierre Aut.</Text>
                      <Text style={styles.changelogItem}>• Traducciones no actualizadas en runtime</Text>
                      <Text style={styles.changelogItem}>• Emojis corruptos () en títulos de alertas de éxito</Text>
                      <Text style={styles.changelogItem}>• Tipo de alert incorrecto en mensajes de éxito</Text>
                      <Text style={styles.changelogItem}>• Botón Eliminar foto no funcionaba</Text>
                      <Text style={styles.changelogItem}>• Botón fuera del recuadro en con 3+ botones</Text>
                      <Text style={styles.changelogItem}>• en JSX de</Text>
                      <Text style={styles.changelogItem}>• en</Text>
                      <Text style={styles.changelogItem}>• íconos desalineados</Text>
                      <Text style={styles.changelogItem}>• Flecha de back en Splitty chat</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>✨ Mejoras</Text>
                      <Text style={styles.changelogItem}>• Chips contraídos de Opciones más grandes y con texto</Text>
                      <Text style={styles.changelogItem}>• Reorden del contenido expandido</Text>
                      <Text style={styles.changelogItem}>• Título de Card 2</Text>
                      <Text style={styles.changelogItem}>• Chip de Compartir en chips contraídos</Text>
                      <Text style={styles.changelogItem}>• Separación visual entre HeaderBar y primera card</Text>
                      <Text style={styles.changelogItem}>• Textos del TutorialOverlay actualizados</Text>
                      <Text style={styles.changelogItem}>• Paso 1</Text>
                      <Text style={styles.changelogItem}>• Paso 2</Text>
                      <Text style={styles.changelogItem}>• Etiquetas de Preferencias abreviadas</Text>
                      <Text style={styles.changelogItem}>• → / →</Text>
                      <Text style={styles.changelogItem}>• → / →</Text>
                      <Text style={styles.changelogItem}>• → / → / →</Text>
                      <Text style={styles.changelogItem}>• en todos los labels de valor de cards para evitar desbordamiento</Text>
                      <Text style={styles.changelogItem}>• importado en para soporte nativo de íconos en botones</Text>
                      <Text style={styles.changelogItem}>• Textos de ayuda de Splitty () revisados y corregidos por el usuario para amigos, crear ...</Text>
                      <Text style={styles.changelogItem}>• e</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

{/* Versión 1.9.0 - Versión Actual */}
              <TouchableOpacity 
                style={[styles.versionBlock]} 
                onPress={() => toggleVersionExpanded('1.9.0')}
                onLayout={(e) => { versionYOffsets.current['1.9.0'] = e.nativeEvent.layout.y; }}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={[styles.versionNumber]}>v1.9.0</Text>
                  <Text style={[styles.versionDate]}>19 Abr 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.9.0') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                {expandedVersions.has('1.9.0') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🚀 Novedades</Text>
                      <Text style={styles.changelogItem}>• Tour guiado (TutorialOverlay): componente nuevo creado desde cero</Text>
                      <Text style={styles.changelogItem}>• Overlay oscuro con recorte highlight sobre el elemento destacado</Text>
                      <Text style={styles.changelogItem}>• Borde del highlight con 4 Views independientes (evita clipping en bordes de pantalla)</Text>
                      <Text style={styles.changelogItem}>• Estado que oculta el popup durante la transición entre pasos (sin flash)</Text>
                      <Text style={styles.changelogItem}>• Soporte para (callback antes de mostrar el paso) y configurable por paso</Text>
                      <Text style={styles.changelogItem}>• Corrección de offset de StatusBar en Android</Text>
                      <Text style={styles.changelogItem}>• Guard contra</Text>
                      <Text style={styles.changelogItem}>• Tour en Home: 4 pasos</Text>
                      <Text style={styles.changelogItem}>• Tour en EventDetail: 7 pasos con cambio automático de tab (resumen → participantes → ga...</Text>
                      <Text style={styles.changelogItem}>• Tour en CreateExpense: 5 pasos con scroll automático a cada card; para desplazamiento p...</Text>
                      <Text style={styles.changelogItem}>• Tour en CreateEvent: 4 pasos con scroll automático; nuevo</Text>
                      <Text style={styles.changelogItem}>• Tour en ManageFriends: 4 pasos con cambio de tab al paso "Crear amigo"</Text>
                      <Text style={styles.changelogItem}>• Tour en ProfileScreen: 9 pasos con scroll automático por sección</Text>
                      <Text style={styles.changelogItem}>• Tour en AddParticipantModal: 4 pasos con cambio de tab (amigos → nuevo → en masa); cubr...</Text>
                      <Text style={styles.changelogItem}>• Tour en SignUpScreen: 4 pasos con scroll automático</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• TutorialOverlay: borde inferior invisible</Text>
                      <Text style={styles.changelogItem}>• TutorialOverlay: flash de popup durante transición</Text>
                      <Text style={styles.changelogItem}>• CreateExpense: popup fuera de pantalla en pasos 2-5</Text>
                      <Text style={styles.changelogItem}>• AddParticipantModal: paso 2 highlight incorrecto</Text>
                      <Text style={styles.changelogItem}>• AddParticipantModal: error en paso 3</Text>
                      <Text style={styles.changelogItem}>• AddParticipantModal: error</Text>
                      <Text style={styles.changelogItem}>• LanguageContext: doble coma en línea PT</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>✨ Mejoras</Text>
                      <Text style={styles.changelogItem}>• Paso 1 eliminado (header) de los tours de</Text>
                      <Text style={styles.changelogItem}>• AddParticipantModal: eliminado botón X (cerrar) del HeaderBar; la pantalla ya se cierra...</Text>
                      <Text style={styles.changelogItem}>• ForgotPasswordScreen: eliminado icono (ayuda) del HeaderBar (sin tour implementado)</Text>
                      <Text style={styles.changelogItem}>• LoginScreen: eliminado icono (ayuda) del HeaderBar (sin tour implementado)</Text>
                      <Text style={styles.changelogItem}>• CreateExpense / CreateEvent: al abrir el tour, scroll automático al tope () para garant...</Text>
                      <Text style={styles.changelogItem}>• Traducciones: claves tour agregadas en ES, EN y PT para</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

{/* Versión 1.8.0 - Versión Actual */}
              <TouchableOpacity 
                style={[styles.versionBlock]} 
                onPress={() => toggleVersionExpanded('1.8.0')}
                onLayout={(e) => { versionYOffsets.current['1.8.0'] = e.nativeEvent.layout.y; }}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={[styles.versionNumber]}>v1.8.0</Text>
                  <Text style={[styles.versionDate]}>15 Abr 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.8.0') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                {expandedVersions.has('1.8.0') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🚀 Novedades</Text>
                      <Text style={styles.changelogItem}>• Cerrar sesión en todos los menús de HeaderBar</Text>
                      <Text style={styles.changelogItem}>• Selección múltiple con "Todos"</Text>
                      <Text style={styles.changelogItem}>• Sistema de 3 estados de eventos</Text>
                      <Text style={styles.changelogItem}>• : todo editable (gastos, participantes, pagos)</Text>
                      <Text style={styles.changelogItem}>• : solo se pueden registrar/deshacer pagos; gastos y participantes de solo lectura</Text>
                      <Text style={styles.changelogItem}>• : lectura total, sin ninguna modificación posible</Text>
                      <Text style={styles.changelogItem}>• Migración automática de DB</Text>
                      <Text style={styles.changelogItem}>• Nueva columna en tabla</Text>
                      <Text style={styles.changelogItem}>• Botones en EventDetail</Text>
                      <Text style={styles.changelogItem}>• Badge de estado con colores</Text>
                      <Text style={styles.changelogItem}>• Barra naranja en EventCard para eventos bloqueados</Text>
                      <Text style={styles.changelogItem}>• Métricas y filtros en Home actualizados para los 3 estados</Text>
                      <Text style={styles.changelogItem}>• Deshacer pagos con selección múltiple</Text>
                      <Text style={styles.changelogItem}>• Alertas personalizadas en CreateEvent</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• Estado vacío de gastos</Text>
                      <Text style={styles.changelogItem}>• Deshacer pagos en bulk no funcionaba</Text>
                      <Text style={styles.changelogItem}>• Bloquear evento seguía permitiendo agregar gastos/participantes</Text>
                      <Text style={styles.changelogItem}>• Badge de estado mostraba clave cruda</Text>
                      <Text style={styles.changelogItem}>• Status "Archivado" en badge y share</Text>
                      <Text style={styles.changelogItem}>• Filtro "Bloqueados" en Home no traía eventos</Text>
                      <Text style={styles.changelogItem}>• Alertas en Home sin borde de color</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>✨ Mejoras</Text>
                      <Text style={styles.changelogItem}>• UX barra de selección</Text>
                      <Text style={styles.changelogItem}>• Texto uniforme</Text>
                      <Text style={styles.changelogItem}>• Ícono de deshacer pagos reducido</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

{/* Versión 1.7.0 - Versión Actual */}
              <TouchableOpacity 
                style={[styles.versionBlock]} 
                onPress={() => toggleVersionExpanded('1.7.0')}
                onLayout={(e) => { versionYOffsets.current['1.7.0'] = e.nativeEvent.layout.y; }}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={[styles.versionNumber]}>v1.7.0</Text>
                  <Text style={[styles.versionDate]}>13 Abr 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.7.0') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                {expandedVersions.has('1.7.0') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🚀 Novedades</Text>
                      <Text style={styles.changelogItem}>• Participantes Secundarios</Text>
                      <Text style={styles.changelogItem}>• Lista de secundarios colapsable</Text>
                      <Text style={styles.changelogItem}>• EventDetail: Tab Gastos</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• Liquidaciones no consolidaban secundarios</Text>
                      <Text style={styles.changelogItem}>• Balance del primario no reflejaba secundarios</Text>
                      <Text style={styles.changelogItem}>• Nombres duplicados en creación de secundarios</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>✨ Mejoras</Text>
                      <Text style={styles.changelogItem}>• Diferenciación visual de secundarios en CreateExpense</Text>
                      <Text style={styles.changelogItem}>• Diferenciación visual de secundarios en detalle del gasto</Text>
                      <Text style={styles.changelogItem}>• Orden de secundarios debajo de su primario</Text>
                      <Text style={styles.changelogItem}>• Mensajes WhatsApp: sección Representados</Text>
                      <Text style={styles.changelogItem}>• EventDetail: Mensajes de compartir</Text>
                      <Text style={styles.changelogItem}>• NotificationService: Notificación de pago recibido vía WhatsApp</Text>
                      <Text style={styles.changelogItem}>• LanguageContext: i18n completo para participantes secundarios</Text>
                      <Text style={styles.changelogItem}>• LanguageContext: i18n modo selección de participantes en EN y PT</Text>
                      <Text style={styles.changelogItem}>• LanguageContext: Nuevas claves i18n / en ES, EN y PT.</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

{/* Versión 1.6.0 - Versión Actual */}
              <TouchableOpacity 
                style={[styles.versionBlock]} 
                onPress={() => toggleVersionExpanded('1.6.0')}
                onLayout={(e) => { versionYOffsets.current['1.6.0'] = e.nativeEvent.layout.y; }}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={[styles.versionNumber]}>v1.6.0</Text>
                  <Text style={[styles.versionDate]}>10 Abr 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.6.0') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                {expandedVersions.has('1.6.0') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🚀 Novedades</Text>
                      <Text style={styles.changelogItem}>• Calculadora integrada al crear gastos: sumá, restá, multiplicá y dividí antes de ingresar el monto</Text>
                      <Text style={styles.changelogItem}>• Al usar la calculadora con una operación pendiente, la app te muestra el resultado antes de aplicarlo</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• Correcciones visuales en el perfil: texto con caracteres especiales que no se mostraban bien</Text>
                      <Text style={styles.changelogItem}>• Secciones del modal "Acerca de" que mostraban texto interno en lugar del contenido real</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

{/* Versión 1.5.0 - Versión Actual */}
              <TouchableOpacity 
                style={[styles.versionBlock]} 
                onPress={() => toggleVersionExpanded('1.5.0')}
                onLayout={(e) => { versionYOffsets.current['1.5.0'] = e.nativeEvent.layout.y; }}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={[styles.versionNumber]}>v1.5.0</Text>
                  <Text style={[styles.versionDate]}>8 Abr 2026</Text>
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
                      <Text style={styles.changelogItem}>• Un gasto puede ser pagado entre varias personas, con montos personalizados para cada una</Text>
                      <Text style={styles.changelogItem}>• La app avisa en tiempo real si ya existe un amigo o participante con el nombre que estás escribiendo</Text>
                      <Text style={styles.changelogItem}>• Podés seleccionar y eliminar varios participantes o gastos a la vez</Text>
                      <Text style={styles.changelogItem}>• La barra de acciones queda fija al hacer scroll en todas las secciones del evento</Text>
                      <Text style={styles.changelogItem}>• Nueva sección en el resumen del evento que muestra las liquidaciones ya pagadas</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• Los balances ahora se calculan correctamente cuando un gasto tiene múltiples pagadores</Text>
                      <Text style={styles.changelogItem}>• Quitar un amigo de un evento ya no lo borra de tus contactos permanentes</Text>
                      <Text style={styles.changelogItem}>• Corrección de comportamiento errático al escribir nombres de participantes</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.4.10 */}
              <TouchableOpacity 
                style={[styles.versionBlock]} 
                onPress={() => toggleVersionExpanded('1.4.10')}
                onLayout={(e) => { versionYOffsets.current['1.4.10'] = e.nativeEvent.layout.y; }}
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
                      <Text style={styles.changelogItem}>• El selector de idioma desde el menú superior ya funciona correctamente</Text>
                      <Text style={styles.changelogItem}>• Textos sin traducir en la pantalla de Perfil corregidos</Text>
                      <Text style={styles.changelogItem}>• El historial de versiones mostraba una entrada faltante</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.4.9 */}
              <TouchableOpacity 
                style={[styles.versionBlock]} 
                onPress={() => toggleVersionExpanded('1.4.9')}
                onLayout={(e) => { versionYOffsets.current['1.4.9'] = e.nativeEvent.layout.y; }}
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
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• Los balances se calculan correctamente cuando hay deudas condonadas</Text>
                      <Text style={styles.changelogItem}>• Corregido el doble conteo de montos en liquidaciones condonadas y pagadas</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>✨ Mejoras</Text>
                      <Text style={styles.changelogItem}>• El monto adeudado muestra el valor real con el monto original tachado</Text>
                      <Text style={styles.changelogItem}>• Nueva sección que agrupa las deudas condonadas automáticamente</Text>
                      <Text style={styles.changelogItem}>• Las secciones del evento se actualizan automáticamente al cambiar de pestaña</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.4.8 - Condonaciones y mejoras cards de participantes */}
              <TouchableOpacity 
                style={[styles.versionBlock]} 
                onPress={() => toggleVersionExpanded('1.4.8')}
                onLayout={(e) => { versionYOffsets.current['1.4.8'] = e.nativeEvent.layout.y; }}
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
                      <Text style={styles.changelogItem}>• El contador de liquidaciones pendientes en la pantalla principal ya es correcto</Text>
                      <Text style={styles.changelogItem}>• El balance de cada participante se actualiza al confirmar el pago de una liquidación</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>✨ Mejoras</Text>
                      <Text style={styles.changelogItem}>• Las tarjetas de participantes ahora muestran cuánto pagó cada uno y cuánto le corresponde</Text>
                      <Text style={styles.changelogItem}>• Indicador naranja cuando una deuda fue pagada por otro integrante o condonada</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.4.7 - Validación inputs y secciones colapsables */}
              <TouchableOpacity 
                style={styles.versionBlock} 
                onPress={() => toggleVersionExpanded('1.4.7')}
                onLayout={(e) => { versionYOffsets.current['1.4.7'] = e.nativeEvent.layout.y; }}
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
                      <Text style={styles.changelogItem}>• La app ahora avisa si intentás ingresar un nombre de amigo o participante que ya existe</Text>
                      <Text style={styles.changelogItem}>• El modal de cambio de contraseña ahora incluye indicador de fortaleza y verificación de la actual</Text>
                      <Text style={styles.changelogItem}>• Validación mejorada de campos de teléfono y email en toda la app</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>✨ Mejoras</Text>
                      <Text style={styles.changelogItem}>• Las secciones del Perfil se pueden colapsar para mantener la vista ordenada</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.4.6 - Validación campos y unificación modales */}
              <TouchableOpacity 
                style={styles.versionBlock} 
                onPress={() => toggleVersionExpanded('1.4.6')}
                onLayout={(e) => { versionYOffsets.current['1.4.6'] = e.nativeEvent.layout.y; }}
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
                      <Text style={styles.sectionTitle}>🚀 Novedades</Text>
                      <Text style={styles.changelogItem}>• El ícono de SplitSmart aparece en todas las pantallas de la app</Text>
                      <Text style={styles.changelogItem}>• Los campos obligatorios están claramente marcados con un asterisco rojo</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• Texto duplicado en la pantalla de registro corregido</Text>
                      <Text style={styles.changelogItem}>• Diseño de los modales (consolidación, detalle de gasto) unificado y mejorado</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>✨ Mejoras</Text>
                      <Text style={styles.changelogItem}>• El botón de crear cuenta siempre visible al registrarse, sin necesidad de hacer scroll</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.4.5 - Mejoras mensajes WhatsApp */}
              <TouchableOpacity 
                style={styles.versionBlock} 
                onPress={() => toggleVersionExpanded('1.4.5')}
                onLayout={(e) => { versionYOffsets.current['1.4.5'] = e.nativeEvent.layout.y; }}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={styles.versionNumber}>v1.4.5</Text>
                  <Text style={styles.versionDate}>24 Mar 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.4.5') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                {expandedVersions.has('1.4.5') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>✨ Mejoras</Text>
                      <Text style={styles.changelogItem}>• Los mensajes de WhatsApp ahora tienen mejor formato, con separadores y saltos de línea correctos</Text>
                      <Text style={styles.changelogItem}>• Se agrega automáticamente la firma "Realizado con SplitSmart" al final de cada mensaje</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.4.4 - Fix teclado en todas las pantallas */}
              <TouchableOpacity 
                style={styles.versionBlock} 
                onPress={() => toggleVersionExpanded('1.4.4')}
                onLayout={(e) => { versionYOffsets.current['1.4.4'] = e.nativeEvent.layout.y; }}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={styles.versionNumber}>v1.4.4</Text>
                  <Text style={styles.versionDate}>18 Mar 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.4.4') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                {expandedVersions.has('1.4.4') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• El teclado ya no tapa el contenido al escribir en ninguna pantalla</Text>
                      <Text style={styles.changelogItem}>• Compatibilidad mejorada con dispositivos Android 15</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.4.3 - Correcciones importación y traducciones */}
              <TouchableOpacity 
                style={styles.versionBlock} 
                onPress={() => toggleVersionExpanded('1.4.3')}
                onLayout={(e) => { versionYOffsets.current['1.4.3'] = e.nativeEvent.layout.y; }}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={styles.versionNumber}>v1.4.3</Text>
                  <Text style={styles.versionDate}>9 Mar 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.4.3') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                {expandedVersions.has('1.4.3') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• La importación de respaldo de datos ya funciona correctamente</Text>
                      <Text style={styles.changelogItem}>• Traducciones faltantes completadas (sección Privacidad y botón Archivar)</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.4.2 - Eliminación permisos obsoletos Android */}
              <TouchableOpacity 
                style={styles.versionBlock} 
                onPress={() => toggleVersionExpanded('1.4.2')}
                onLayout={(e) => { versionYOffsets.current['1.4.2'] = e.nativeEvent.layout.y; }}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={styles.versionNumber}>v1.4.2</Text>
                  <Text style={styles.versionDate}>8 Mar 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.4.2') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                {expandedVersions.has('1.4.2') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• La app ya no solicita permisos de almacenamiento innecesarios</Text>
                      <Text style={styles.changelogItem}>• La galería de fotos usa el selector nativo de Android: más privado, sin permisos extra</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.4.1 - Corrección bug edición participante */}
              <TouchableOpacity 
                style={styles.versionBlock} 
                onPress={() => toggleVersionExpanded('1.4.1')}
                onLayout={(e) => { versionYOffsets.current['1.4.1'] = e.nativeEvent.layout.y; }}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={styles.versionNumber}>v1.4.1</Text>
                  <Text style={styles.versionDate}>8 Mar 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.4.1') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                {expandedVersions.has('1.4.1') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• Corregido un cierre inesperado al intentar editar un participante</Text>
                      <Text style={styles.changelogItem}>• Los campos del formulario de edición ahora se cargan correctamente al abrirlo</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.4.0 - i18n completo + documentación legal */}
              <TouchableOpacity 
                style={styles.versionBlock} 
                onPress={() => toggleVersionExpanded('1.4.0')}
                onLayout={(e) => { versionYOffsets.current['1.4.0'] = e.nativeEvent.layout.y; }}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={styles.versionNumber}>v1.4.0</Text>
                  <Text style={styles.versionDate}>4 Mar 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.4.0') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                {expandedVersions.has('1.4.0') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🌍 Multiidioma</Text>
                      <Text style={styles.changelogItem}>• La app está disponible en Español, Inglés y Portugués</Text>
                      <Text style={styles.changelogItem}>• Todos los textos de la app traducidos a los tres idiomas</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>📄 Legal</Text>
                      <Text style={styles.changelogItem}>• Se incorporaron los Términos de servicio y la Política de privacidad</Text>
                      <Text style={styles.changelogItem}>• Cumplimiento con la legislación de protección de datos de Argentina</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.3.0 - Mejoras de Home y EventCard */}
              <TouchableOpacity 
                style={styles.versionBlock} 
                onPress={() => toggleVersionExpanded('1.3.0')}
                onLayout={(e) => { versionYOffsets.current['1.3.0'] = e.nativeEvent.layout.y; }}
                activeOpacity={0.7}
              >
                <View style={styles.versionHeader}>
                  <Text style={styles.versionNumber}>v1.3.0</Text>
                  <Text style={styles.versionDate}>4 Mar 2026</Text>
                  <MaterialCommunityIcons 
                    name={expandedVersions.has('1.3.0') ? 'chevron-up' : 'chevron-down'} 
                    size={24} 
                    color={theme.colors.primary} 
                  />
                </View>
                {expandedVersions.has('1.3.0') && (
                  <View style={styles.versionContent}>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🚀 Novedades</Text>
                      <Text style={styles.changelogItem}>• Podés eliminar un evento vacío directamente desde la pantalla principal</Text>
                      <Text style={styles.changelogItem}>• Cada evento muestra cuántas liquidaciones están pagas del total (ej: 2/3)</Text>
                      <Text style={styles.changelogItem}>• Filtros por estado y orden inteligente (activos primero, luego por fecha)</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• La pantalla principal se actualiza correctamente al volver de un evento</Text>
                      <Text style={styles.changelogItem}>• El conteo de liquidaciones pagadas ya es preciso</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.2.0 - Auto-Login Avanzado */}
              <TouchableOpacity 
                style={styles.versionBlock} 
                onPress={() => toggleVersionExpanded('1.2.0')}
                onLayout={(e) => { versionYOffsets.current['1.2.0'] = e.nativeEvent.layout.y; }}
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
                      <Text style={styles.sectionTitle}>🚀 Novedades</Text>
                      <Text style={styles.changelogItem}>• La app recuerda quién ingresó y entra automáticamente sin pedir contraseña</Text>
                      <Text style={styles.changelogItem}>• Usuario DEMO con datos de ejemplo listos para explorar todas las funciones</Text>
                      <Text style={styles.changelogItem}>• Estadísticas de uso disponibles en el Perfil</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>✨ Mejoras</Text>
                      <Text style={styles.changelogItem}>• Mayor estabilidad general de la app</Text>
                      <Text style={styles.changelogItem}>• Mensajes de confirmación más claros al realizar acciones importantes</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.1.0 - Funcionalidades Base Mejoradas */}
              <TouchableOpacity 
                style={styles.versionBlock} 
                onPress={() => toggleVersionExpanded('1.1.0')}
                onLayout={(e) => { versionYOffsets.current['1.1.0'] = e.nativeEvent.layout.y; }}
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
                      <Text style={styles.sectionTitle}>🚀 Novedades</Text>
                      <Text style={styles.changelogItem}>• Exportá e importá un respaldo completo de tus datos</Text>
                      <Text style={styles.changelogItem}>• Compartí resúmenes del evento por WhatsApp</Text>
                      <Text style={styles.changelogItem}>• Temas claro y oscuro</Text>
                      <Text style={styles.changelogItem}>• Soporte para múltiples monedas (ARS, USD, EUR, BRL)</Text>
                      <Text style={styles.changelogItem}>• Cierre de sesión automático configurable</Text>
                      <Text style={styles.changelogItem}>• Foto de perfil editable con cámara o galería</Text>
                    </View>
                    <View style={styles.changelogSection}>
                      <Text style={styles.sectionTitle}>🔧 Correcciones</Text>
                      <Text style={styles.changelogItem}>• Liquidaciones duplicadas corregidas</Text>
                      <Text style={styles.changelogItem}>• Mejoras de estabilidad y rendimiento general</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>

              {/* Versión 1.0.0 - Origen */}
              <TouchableOpacity 
                style={styles.versionBlock} 
                onPress={() => toggleVersionExpanded('1.0.0')}
                onLayout={(e) => { versionYOffsets.current['1.0.0'] = e.nativeEvent.layout.y; }}
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
              <View style={styles.infoModalHeaderLeft}>
                <View style={[styles.infoModalHeaderIcon, { backgroundColor: theme.colors.primary }]}>
                  <MaterialCommunityIcons name="information-outline" size={18} color="#FFF" />
                </View>
                <Text style={styles.modalTitle}>{t('profile.about.title')}</Text>
              </View>
            </View>

            <ScrollView
              style={styles.changelogContent}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ flexGrow: 1 }}
              nestedScrollEnabled={true}
            >
              {/* Banner: icono + nombre + descripción */}
              <View style={[styles.aboutSection, { flexDirection: 'row', alignItems: 'flex-start', gap: 14 }]}>
                <View style={[styles.infoModalHeaderIcon, { width: 52, height: 52, borderRadius: 16, backgroundColor: theme.colors.primaryContainer }]}>
                  <MaterialCommunityIcons name="account-group" size={28} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Text style={styles.aboutTitle}>SplitSmart</Text>
                    <View style={styles.versionBadge}><Text style={styles.versionBadgeText}>v1.10.2</Text></View>
                  </View>
                  <Text style={styles.aboutDescription}>{t('profile.about.appDescription')}</Text>
                </View>
              </View>

              {/* Características */}
              <View style={styles.aboutSection}>
                <Text style={styles.aboutSectionTitle}>{t('profile.about.keyFeatures')}</Text>
                {[
                  t('profile.about.feature1'),
                  t('profile.about.feature2'),
                  t('profile.about.feature3'),
                  t('profile.about.feature4'),
                  t('profile.about.feature5'),
                  t('profile.about.feature6'),
                ].map((feat, i, arr) => (
                  <View key={i}>
                    <Text style={styles.aboutItem}>{feat}</Text>
                    {i < arr.length - 1 && (
                      <View style={{ height: 1, backgroundColor: theme.colors.outline, opacity: 0.25, marginVertical: 2 }} />
                    )}
                  </View>
                ))}
              </View>

              {/* Especificaciones Técnicas */}
              <View style={[styles.aboutSection, { borderLeftColor: '#607D8B' }]}>
                <Text style={styles.aboutSectionTitle}>{t('profile.about.techSpecs')}</Text>
                {[
                  t('profile.about.platform'),
                  t('profile.about.database'),
                  t('profile.about.languages'),
                ].map((spec, i, arr) => (
                  <View key={i}>
                    <Text style={styles.aboutItem}>{spec}</Text>
                    {i < arr.length - 1 && (
                      <View style={{ height: 1, backgroundColor: theme.colors.outline, opacity: 0.25, marginVertical: 2 }} />
                    )}
                  </View>
                ))}
              </View>

              {/* Contacto */}
              <View style={[styles.aboutSection, { borderLeftColor: '#FF9800' }]}>
                <Text style={styles.aboutSectionTitle}>{t('profile.about.contact')}</Text>
                <View style={styles.contactItem}>
                  <MaterialCommunityIcons name="email-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.contactText}>cbalucas@gmail.com</Text>
                </View>
                <View style={styles.contactItem}>
                  <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
                  <Text style={styles.contactText}>+54 351 617-5809 {t('profile.about.whatsappNote')}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 2 }}>
                  <MaterialCommunityIcons name="clock-outline" size={13} color={theme.colors.onSurfaceVariant} />
                  <Text style={[styles.aboutDescription, { fontSize: 12 }]}>{t('profile.about.hours')} {t('profile.about.hoursValue')}</Text>
                </View>
              </View>

              {/* Copyright */}
              <View style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Text style={{ fontSize: 11, color: theme.colors.onSurfaceVariant, textAlign: 'center', lineHeight: 18 }}>
                  {t('profile.about.copyright')}{`\n`}{t('profile.about.madeWith')}
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
          <View style={styles.changelogModalContent}>
            <View style={styles.changelogHeader}>
              <View style={styles.infoModalHeaderLeft}>
                <View style={[styles.infoModalHeaderIcon, { backgroundColor: '#607D8B' }]}>
                  <MaterialCommunityIcons name="chart-bar" size={18} color="#FFF" />
                </View>
                <Text style={styles.modalTitle}>{t('profile.dataStats')}</Text>
              </View>
            </View>

            <ScrollView
              style={styles.changelogContent}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 8, flexGrow: 1 }}
              nestedScrollEnabled={true}
            >
              {databaseStats ? (
                <>
                  {/* Grid: Registros / Usuarios / Promedio */}
                  {(() => {
                    let avg = '—';
                    if (events.length > 0) {
                      const dates = events
                        .map(e => new Date((e as any).createdAt || (e as any).created_at || Date.now()).getTime())
                        .filter(ms => !isNaN(ms));
                      if (dates.length > 0) {
                        const oldest = new Date(Math.min(...dates));
                        const now = new Date();
                        const months = Math.max(1, (now.getFullYear() - oldest.getFullYear()) * 12 + (now.getMonth() - oldest.getMonth()) + 1);
                        avg = (events.length / months).toFixed(1);
                      }
                    }
                    return (
                      <View style={[styles.statsGrid, { marginBottom: 12 }]}>
                        <View style={[styles.statCard, { borderTopColor: '#FF9800' }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <MaterialCommunityIcons name="format-list-numbered" size={18} color="#FF9800" />
                            <Text style={[styles.statCardNumber, { color: '#FF9800' }]}>{databaseStats.totalRecords.toLocaleString()}</Text>
                          </View>
                          <Text style={[styles.statCardLabel, { color: theme.colors.onSurfaceVariant }]}>Registros</Text>
                        </View>
                        <View style={[styles.statCard, { borderTopColor: '#9C27B0' }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <MaterialCommunityIcons name="account-multiple" size={18} color="#9C27B0" />
                            <Text style={[styles.statCardNumber, { color: '#9C27B0' }]}>{databaseStats.tables['users'] || 0}</Text>
                          </View>
                          <Text style={[styles.statCardLabel, { color: theme.colors.onSurfaceVariant }]}>Usuarios</Text>
                        </View>
                        <View style={[styles.statCard, { borderTopColor: '#4CAF50' }]}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            <MaterialCommunityIcons name="chart-timeline-variant" size={18} color="#4CAF50" />
                            <Text style={[styles.statCardNumber, { color: '#4CAF50' }]}>{avg}</Text>
                          </View>
                          <Text style={[styles.statCardLabel, { color: theme.colors.onSurfaceVariant }]}>Ev/mes</Text>
                        </View>
                      </View>
                    );
                  })()}

                  {/* Tamaño de la BD */}
                  <View style={[styles.statCardWide, { borderLeftColor: '#607D8B', marginBottom: 10 }]}>
                    <MaterialCommunityIcons name="database" size={24} color="#607D8B" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.statCardNumber, { color: '#607D8B', fontSize: 18 }]}>{databaseStats.databaseSize}</Text>
                      <Text style={[styles.statCardLabel, { color: theme.colors.onSurfaceVariant }]}>Tamaño de la base de datos</Text>
                    </View>
                  </View>

                  {/* Espacio en dispositivo */}
                  <View style={[styles.statCardWide, { borderLeftColor: '#2196F3' }]}>
                    <MaterialCommunityIcons name="harddisk" size={24} color="#2196F3" />
                    <View style={{ flex: 1 }}>
                      {deviceStorage ? (
                        <>
                          <Text style={[styles.statCardNumber, { color: '#2196F3', fontSize: 18 }]}>{deviceStorage.free} libres</Text>
                          <Text style={[styles.statCardLabel, { color: theme.colors.onSurfaceVariant }]}>de {deviceStorage.total} — {deviceStorage.freePercent}% disponible</Text>
                        </>
                      ) : (
                        <>
                          <Text style={[styles.statCardNumber, { color: '#2196F3', fontSize: 16 }]}>No disponible</Text>
                          <Text style={[styles.statCardLabel, { color: theme.colors.onSurfaceVariant }]}>Espacio en dispositivo</Text>
                        </>
                      )}
                    </View>
                  </View>
                </>
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <MaterialCommunityIcons name="database-clock" size={48} color={theme.colors.primary} />
                  <Text style={[styles.profileEmail, { marginTop: 16, textAlign: 'center' }]}>Cargando estadísticas...</Text>
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
              <View style={styles.infoModalHeaderLeft}>
                <View style={[styles.infoModalHeaderIcon, { backgroundColor: '#2196F3' }]}>
                  <MaterialCommunityIcons name="file-document-outline" size={18} color="#FFF" />
                </View>
                <Text style={styles.modalTitle}>{t('profile.terms.title')}</Text>
              </View>
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
              <View style={styles.infoModalHeaderLeft}>
                <View style={[styles.infoModalHeaderIcon, { backgroundColor: '#4CAF50' }]}>
                  <MaterialCommunityIcons name="shield-lock-outline" size={18} color="#FFF" />
                </View>
                <Text style={styles.modalTitle}>{t('profile.privacy.title')}</Text>
              </View>
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
              <View style={styles.infoModalHeaderLeft}>
                <View style={[styles.infoModalHeaderIcon, { backgroundColor: '#FF9800' }]}>
                  <MaterialCommunityIcons name="headset" size={18} color="#FFF" />
                </View>
                <Text style={styles.modalTitle}>{t('profile.support.title')}</Text>
              </View>
            </View>
            
            <ScrollView
              style={styles.changelogContent} 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              {/* Métodos de contacto */}
              <View style={styles.supportSection}>
                <Text style={styles.supportSectionTitle}>{t('profile.support.contactMethods')}</Text>
                <TouchableOpacity
                  style={styles.contactItem}
                  onPress={() => showAlert({ type: 'error', title: 'Email', message: 'cbalucas@gmail.com' })}
                >
                  <MaterialCommunityIcons name="email" size={20} color={theme.colors.primary} />
                  <Text style={styles.contactText}>cbalucas@gmail.com</Text>
                </TouchableOpacity>
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

              {/* Cómo reportar */}
              <View style={styles.supportSection}>
                <Text style={styles.supportSectionTitle}>{t('profile.support.reportIssue')}</Text>
                <Text style={styles.supportText}>{t('profile.support.reportIssueText')}</Text>
                <Text style={styles.supportText}>{t('profile.support.reportItem1')}</Text>
                <Text style={styles.supportText}>{t('profile.support.reportItem2')}</Text>
                <Text style={styles.supportText}>{t('profile.support.reportItem3')}</Text>
                <Text style={styles.supportText}>{t('profile.support.reportItem4')}</Text>
              </View>

              {/* Tiempo de respuesta */}
              <View style={styles.supportSection}>
                <Text style={styles.supportSectionTitle}>{t('profile.support.responseTime')}</Text>
                <Text style={styles.supportText}>{t('profile.support.responseTimeText')}</Text>
              </View>

              {/* Antes de contactar */}
              <View style={styles.supportSection}>
                <Text style={styles.supportSectionTitle}>{t('profile.support.beforeContact')}</Text>
                <Text style={styles.supportText}>{t('profile.support.beforeContactText')}</Text>
                <Text style={styles.supportText}>{t('profile.support.beforeItem1')}</Text>
                <Text style={styles.supportText}>{t('profile.support.beforeItem2')}</Text>
                <Text style={styles.supportText}>{t('profile.support.beforeItem3')}</Text>
                <Text style={styles.supportText}>{t('profile.support.beforeItem4')}</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Modal Guía de Errores */}
      <Modal
        visible={showErrorGuideModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowErrorGuideModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.changelogModalContent}>
            <View style={styles.changelogHeader}>
              <View style={styles.infoModalHeaderLeft}>
                <View style={[styles.infoModalHeaderIcon, { backgroundColor: selectedErrorScreen?.color ?? theme.colors.primary }]}>
                  <MaterialCommunityIcons name={(selectedErrorScreen?.icon ?? 'alert-circle') as any} size={18} color="#FFF" />
                </View>
                <Text style={styles.modalTitle}>{selectedErrorScreen?.title ?? ''}</Text>
              </View>
            </View>
            <ScrollView
              style={styles.changelogContent}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {selectedErrorScreen?.errors.map(({ title, desc }, idx) => (
                <View key={idx} style={{ flexDirection: 'row', paddingHorizontal: 8, marginBottom: 14, gap: 10 }}>
                  <MaterialCommunityIcons
                    name="alert-circle"
                    size={18}
                    color={selectedErrorScreen.color}
                    style={{ marginTop: 1, flexShrink: 0 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.onSurface, marginBottom: 2 }}>{title}</Text>
                    <Text style={{ fontSize: 13, color: theme.colors.onSurfaceVariant, lineHeight: 19 }}>{desc}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Eliminar Datos */}
      <Modal
        visible={showDeleteDataModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteDataModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={[styles.modalHeaderIconWrap, { backgroundColor: '#F4433620' }]}>
                <MaterialCommunityIcons name="delete-alert" size={22} color="#F44336" />
              </View>
              <Text style={styles.modalTitle}>{t('profile.message.deleteAllDataTitle')}</Text>
            </View>
            <View style={styles.modalDivider} />

            {/* Descripción */}
            <Text style={[styles.modalFieldLabel, { marginBottom: 16, lineHeight: 20 }]}>
              {deleteIncludeUsers
                ? t('profile.message.deleteWithUsersDesc')
                : t('profile.message.deleteDataOnlyDesc')}
            </Text>

            {/* Toggle: incluir usuarios */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setDeleteIncludeUsers(v => !v)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: deleteIncludeUsers ? '#F4433615' : theme.colors.surfaceVariant,
                borderRadius: 12,
                padding: 14,
                marginBottom: 8,
                borderWidth: 1.5,
                borderColor: deleteIncludeUsers ? '#F44336' : theme.colors.outline,
              }}
            >
              <MaterialCommunityIcons
                name={deleteIncludeUsers ? 'account-remove' : 'account-check'}
                size={22}
                color={deleteIncludeUsers ? '#F44336' : theme.colors.onSurfaceVariant}
                style={{ marginRight: 12 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: deleteIncludeUsers ? '#F44336' : theme.colors.onSurface }}>
                  {t('profile.message.deleteIncludeUsers')}
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                  {t('profile.message.deleteIncludeUsersDesc')}
                </Text>
              </View>
              <Switch
                value={deleteIncludeUsers}
                onValueChange={setDeleteIncludeUsers}
                trackColor={{ false: theme.colors.outline, true: '#F44336' }}
                thumbColor={deleteIncludeUsers ? '#fff' : theme.colors.surface}
              />
            </TouchableOpacity>

            {/* Botones */}
            <View style={[styles.modalDivider, { marginTop: 16 }]} />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                onPress={() => setShowDeleteDataModal(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: theme.colors.surfaceVariant,
                  borderWidth: 1,
                  borderColor: theme.colors.outline,
                }}
              >
                <Text style={{ fontWeight: '600', color: theme.colors.onSurface }}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDeleteData}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  alignItems: 'center',
                  backgroundColor: '#F44336',
                }}
              >
                <Text style={{ fontWeight: '700', color: '#fff' }}>{t('profile.message.deleteConfirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TutorialOverlay
        visible={pfTourVisible}
        steps={[
          { ref: pfBannerRef,       titleKey: 'tour.profile.banner.title',       descKey: 'tour.profile.banner.desc',       popupPosition: 'below', onBeforeShow: scrollToSection('banner') },
          { ref: pfCardRef,         titleKey: 'tour.profile.card.title',         descKey: 'tour.profile.card.desc',         popupPosition: 'below', onBeforeShow: scrollToSection('card') },
          { ref: pfStatsRef,        titleKey: 'tour.profile.stats.title',        descKey: 'tour.profile.stats.desc',        popupPosition: 'below', onBeforeShow: scrollToSection('stats') },
          { ref: pfPersonalInfoRef, titleKey: 'tour.profile.personalInfo.title', descKey: 'tour.profile.personalInfo.desc', popupPosition: 'below', onBeforeShow: scrollToSection('personalInfo') },
          { ref: pfSettingsRef,     titleKey: 'tour.profile.settings.title',     descKey: 'tour.profile.settings.desc',     popupPosition: 'below', onBeforeShow: scrollToSection('settings') },
          { ref: pfDataBackupRef,   titleKey: 'tour.profile.dataBackup.title',   descKey: 'tour.profile.dataBackup.desc',   popupPosition: 'above', onBeforeShow: scrollToSection('dataBackup') },
          { ref: pfInfoRef,         titleKey: 'tour.profile.info.title',         descKey: 'tour.profile.info.desc',         popupPosition: 'above', onBeforeShow: scrollToSection('info') },
          { ref: pfErrorGuideRef,   titleKey: 'tour.profile.errorGuide.title',   descKey: 'tour.profile.errorGuide.desc',   popupPosition: 'above', onBeforeShow: scrollToSection('errorGuide') },
          { ref: pfComingSoonRef,   titleKey: 'tour.profile.comingSoon.title',   descKey: 'tour.profile.comingSoon.desc',   popupPosition: 'above', onBeforeShow: scrollToSection('comingSoon') },
        ]}
        currentStep={pfTourStep}
        onNext={handlePfTourNext}
        onPrev={handlePfTourPrev}
        onClose={handlePfTourClose}
      />
    </SafeAreaView>
  );
};

export default ProfileScreen;