import React, { useState, useEffect } from 'react';
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
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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

const ProfileSection: React.FC<ProfileSectionProps> = ({ title, icon, children }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <Card style={styles.card}>
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons
          name={icon as any}
          size={20}
          color={theme.colors.primary}
        />
        <Text style={styles.sectionTitle}>{title}</Text>
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
  const { user, logout, refreshUser } = useAuth();
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
      expenseAdded: true,
      paymentReceived: true,
      eventUpdated: false,
      // weeklyReport: false, // ELIMINADO
    },
    privacy: {
      // shareEmail: false, // ELIMINADO
      // sharePhone: false, // ELIMINADO
      shareEvent: true, // NUEVO CAMPO
      allowInvitations: true,
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

  useEffect(() => {
    calculateStats();
    loadUserProfile();
  }, [events, expenses, participants]);

  const loadUserProfile = async () => {
    if (!user?.id) return;

    try {
      const profile = await getUserProfile(user.id);
      if (profile) {
        setProfileData({
          name: profile.name || user.name || 'Usuario Demo',
          username: profile.username || '', // NUEVO CAMPO
          email: profile.email || user.email || 'demo@splitsmart.com',
          phone: profile.phone || '',
          // alias_cbu: profile.alias_cbu || '', // ELIMINADO
          preferredCurrency: profile.preferred_currency || 'ARS',
          autoLogout: (profile.auto_logout as 'never' | '5min' | '15min' | '30min') || 'never',
          notifications: {
            expenseAdded: profile.notifications_expense_added === 1,
            paymentReceived: profile.notifications_payment_received === 1,
            eventUpdated: profile.notifications_event_updated === 1,
            // weeklyReport: profile.notifications_weekly_report === 1, // ELIMINADO
          },
          privacy: {
            // shareEmail: profile.privacy_share_email === 1, // ELIMINADO
            // sharePhone: profile.privacy_share_phone === 1, // ELIMINADO
            shareEvent: profile.privacy_share_event === 1 || true, // NUEVO CAMPO (default true)
            allowInvitations: profile.privacy_allow_invitations === 1,
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
        allowInvitations: profileData.privacy.allowInvitations
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

  const handleExportData = async () => {
    try {
      Alert.alert(
        t('profile.message.exportDataTitle'),
        t('profile.message.exportDataMessage'),
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: t('profile.message.allData'), 
            onPress: async () => {
              try {
                const data = await exportData();
                Alert.alert(t('success'), t('profile.message.exportSuccess'));
                // TODO: Implementar guardado del archivo
              } catch (error) {
                Alert.alert(t('error'), t('profile.message.exportError'));
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert(t('error'), t('profile.message.exportError'));
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
              Alert.alert(t('success'), t('profile.message.deleteCompleted'));
            } catch (error) {
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
      } catch (error) {
        console.error('Error updating notification setting:', error);
      }
    }
  };

  const updatePrivacySetting = async (key: keyof UserProfileData['privacy'], value: boolean) => {
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
        <Card style={styles.profileCard}>
          <TouchableOpacity
            style={styles.editIconButton}
            onPress={() => setIsEditing(!isEditing)}
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
        <ProfileSection title={t('profile.stats')} icon="chart-line">
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
            <ProfileSection title={t('profile.personalInfo')} icon="account-edit">
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
            
            <ProfileSection title={t('profile.security')} icon="lock">
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => {
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
          <ProfileSection title={t('profile.personalInfo')} icon="account">
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
                onPress={onPress}
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
                onPress={onPress}
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
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowAutoLogoutOptions(!showAutoLogoutOptions)}
          >
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
          </TouchableOpacity>
          
          {/* Desplegable con opciones en dos columnas */}
          {showAutoLogoutOptions && (
            <View style={styles.dropdownContainer}>
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
            </View>
          )}
        </ProfileSection>

        {/* Notificaciones */}
        <ProfileSection title={t('profile.notifications')} icon="bell">
          <SettingItem
            title={t('notifications.expenseAdded')}
            subtitle={t('notifications.expenseAddedDesc')}
            icon="receipt-text"
            type="switch"
            value={profileData.notifications.expenseAdded}
            onValueChange={(value) => updateNotificationSetting('expenseAdded', value)}
          />
          <SettingItem
            title={t('notifications.paymentReceived')}
            subtitle={t('notifications.paymentReceivedDesc')}
            icon="cash-check"
            type="switch"
            value={profileData.notifications.paymentReceived}
            onValueChange={(value) => updateNotificationSetting('paymentReceived', value)}
          />
          <SettingItem
            title={t('notifications.eventUpdated')}
            subtitle={t('notifications.eventUpdatedDesc')}
            icon="calendar-edit"
            type="switch"
            value={profileData.notifications.eventUpdated}
            onValueChange={(value) => updateNotificationSetting('eventUpdated', value)}
          />
        </ProfileSection>

        {/* Privacidad */}
        <ProfileSection title={t('profile.privacy')} icon="shield-account">
          <SettingItem
            title={t('profile.shareEvent')}
            subtitle={t('profile.shareEventDesc')}
            icon="share"
            type="switch"
            value={profileData.privacy.shareEvent}
            onValueChange={(value) => updatePrivacySetting('shareEvent', value)}
          />
          <SettingItem
            title={t('profile.allowInvitations')}
            subtitle={t('profile.allowInvitationsDesc')}
            icon="account-plus"
            type="switch"
            value={profileData.privacy.allowInvitations}
            onValueChange={(value) => updatePrivacySetting('allowInvitations', value)}
          />
        </ProfileSection>

        {/* Datos y Respaldo */}
        <ProfileSection title={t('profile.dataBackup')} icon="database">
          <SettingItem
            title={t('profile.exportData')}
            subtitle={t('profile.exportDataDesc')}
            icon="download"
            type="navigation"
            onPress={handleExportData}
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
        <ProfileSection title={t('profile.information')} icon="information">
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
        <Card style={StyleSheet.flatten([styles.card, styles.logoutCard])}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialCommunityIcons
              name="logout"
              size={20}
              color="#F44336"
            />
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </TouchableOpacity>
        </Card>
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