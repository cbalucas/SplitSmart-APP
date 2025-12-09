import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ViewStyle,
  TextStyle,
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
import { useLanguage, Language } from '../../context/LanguageContext';
import { Theme } from '../../constants/theme';
import { Card, Button, Input, LanguageSelector, ThemeToggle } from '../../components';

interface UserProfileData {
  name: string;
  email: string;
  phone: string;
  alias_cbu: string;
  preferredCurrency: 'ARS' | 'USD' | 'EUR' | 'BRL';
  notifications: {
    expenseAdded: boolean;
    paymentReceived: boolean;
    eventUpdated: boolean;
    weeklyReport: boolean;
  };
  privacy: {
    shareEmail: boolean;
    sharePhone: boolean;
    allowInvitations: boolean;
  };
}

interface ProfileSectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
}

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

interface SettingItemProps {
  title: string;
  subtitle?: string;
  icon: string;
  value?: string | boolean;
  type: 'navigation' | 'switch' | 'value';
  onPress?: () => void;
  onValueChange?: (value: boolean) => void;
}

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
    email: user?.email || 'demo@splitsmart.com',
    phone: '',
    alias_cbu: '',
    preferredCurrency: 'ARS',
    notifications: {
      expenseAdded: true,
      paymentReceived: true,
      eventUpdated: false,
      weeklyReport: false,
    },
    privacy: {
      shareEmail: false,
      sharePhone: false,
      allowInvitations: true,
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [skipPassword, setSkipPassword] = useState(false);
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalExpenses: 0,
    totalAmountSpent: 0,
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
          email: profile.email || user.email || 'demo@splitsmart.com',
          phone: profile.phone || '',
          alias_cbu: profile.alias_cbu || '',
          preferredCurrency: profile.preferred_currency || 'ARS',
          notifications: {
            expenseAdded: profile.notifications_expense_added === 1,
            paymentReceived: profile.notifications_payment_received === 1,
            eventUpdated: profile.notifications_event_updated === 1,
            weeklyReport: profile.notifications_weekly_report === 1,
          },
          privacy: {
            shareEmail: profile.privacy_share_email === 1,
            sharePhone: profile.privacy_share_phone === 1,
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
    const totalExpenses = expenses.length;
    const totalAmountSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const friendsCount = participants.length;

    setStats({
      totalEvents,
      activeEvents,
      totalExpenses,
      totalAmountSpent,
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
        email: profileData.email,
        phone: profileData.phone || undefined,
        alias_cbu: profileData.alias_cbu || undefined,
        preferred_currency: profileData.preferredCurrency
      });

      // Guardar notificaciones
      await updateUserNotifications(user.id, {
        expenseAdded: profileData.notifications.expenseAdded,
        paymentReceived: profileData.notifications.paymentReceived,
        eventUpdated: profileData.notifications.eventUpdated,
        weeklyReport: profileData.notifications.weeklyReport
      });

      // Guardar privacidad
      await updateUserPrivacy(user.id, {
        shareEmail: profileData.privacy.shareEmail,
        sharePhone: profileData.privacy.sharePhone,
        allowInvitations: profileData.privacy.allowInvitations
      });

      Alert.alert('✅ Guardado', 'Perfil actualizado correctamente');
      setIsEditing(false);
      await refreshUser();
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar el perfil');
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos permiso para acceder a tus fotos');
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
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos permiso para acceder a tu cámara');
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
      Alert.alert('Error', 'No se pudo tomar la foto');
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
      Alert.alert('✅ Éxito', 'Foto de perfil actualizada');
    } catch (error) {
      console.error('❌ Error updating avatar:', error);
      Alert.alert('Error', 'No se pudo actualizar la foto de perfil');
    }
  };

  const handleChangeAvatar = () => {
    Alert.alert(
      'Cambiar foto de perfil',
      'Elige una opción',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tomar Foto', onPress: takePhoto },
        { text: 'Elegir de Galería', onPress: pickImageFromGallery },
        ...(user?.avatar ? [{ 
          text: 'Eliminar Foto', 
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
        'Exportar Datos',
        '¿Qué datos deseas exportar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Todos los datos', 
            onPress: async () => {
              try {
                const data = await exportData();
                Alert.alert('Éxito', 'Datos exportados correctamente');
                // TODO: Implementar guardado del archivo
              } catch (error) {
                Alert.alert('Error', 'No se pudieron exportar los datos');
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudieron exportar los datos');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      '⚠️ Eliminar Todos los Datos',
      'Esta acción eliminará permanentemente todos tus eventos, gastos y participantes. ¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar Todo',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetDatabase();
              Alert.alert('Completado', 'Todos los datos han sido eliminados');
            } catch (error) {
              Alert.alert('Error', 'No se pudieron eliminar los datos');
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
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

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        <View style={styles.headerRight}>
          <LanguageSelector size={26} color={theme.colors.onSurface} />
          <ThemeToggle size={24} color={theme.colors.onSurface} />
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <MaterialCommunityIcons
              name={isEditing ? "check" : "pencil"}
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Perfil del Usuario */}
        <Card style={styles.profileCard}>
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
                    {getInitials(profileData.name)}
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
              <Text style={styles.profileName}>{profileData.name}</Text>
              <Text style={styles.profileEmail}>{profileData.email}</Text>
              <View style={styles.profileStats}>
                <Text style={styles.profileStat}>
                  {stats.totalEvents} eventos • {stats.friendsCount} amigos
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Estadísticas */}
        <ProfileSection title={t('profile.stats')} icon="chart-line">
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="calendar-check" size={24} color="#4CAF50" />
              <Text style={styles.statValue}>{stats.activeEvents}</Text>
              <Text style={styles.statLabel}>{t('profile.activeEvents')}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="receipt" size={24} color="#FF9800" />
              <Text style={styles.statValue}>{stats.totalExpenses}</Text>
              <Text style={styles.statLabel}>{t('profile.totalExpenses')}</Text>
            </View>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="cash-multiple" size={24} color="#2196F3" />
              <Text style={styles.statValue}>
                ${stats.totalAmountSpent.toFixed(0)}
              </Text>
              <Text style={styles.statLabel}>{t('profile.totalSpent')}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="account-group" size={24} color="#9C27B0" />
              <Text style={styles.statValue}>{stats.friendsCount}</Text>
              <Text style={styles.statLabel}>{t('profile.friendsCount')}</Text>
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
              <Input
                label={`${t('profile.cbu')} (${t('optional')})`}
                value={profileData.alias_cbu}
                onChangeText={(value) => setProfileData(prev => ({ ...prev, alias_cbu: value }))}
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
                        Alert.alert('Error', 'No se pudo actualizar la configuración');
                      }
                    }}
                    trackColor={{ false: theme.colors.outline, true: theme.colors.primary }}
                    thumbColor={theme.colors.surface}
                  />
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
            <SettingItem
              title={t('profile.email')}
              subtitle={profileData.email}
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
            {profileData.alias_cbu && (
              <SettingItem
                title={t('profile.cbu')}
                subtitle={profileData.alias_cbu}
                icon="bank"
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
          <SettingItem
            title={t('profile.currency')}
            subtitle={profileData.preferredCurrency}
            icon="currency-usd"
            type="navigation"
            onPress={() => {
              Alert.alert('Info', 'Selector de moneda próximamente');
            }}
          />
          <SettingItem
            title={t('profile.language')}
            subtitle={language === 'es' ? 'Español' : language === 'en' ? 'English' : 'Português'}
            icon="translate"
            type="navigation"
            onPress={() => {
              Alert.alert(
                t('message.selectLanguage'),
                t('message.chooseLanguage'),
                [
                  {
                    text: 'Español',
                    onPress: () => setLanguage('es'),
                    style: language === 'es' ? 'default' : 'cancel',
                  },
                  {
                    text: 'English',
                    onPress: () => setLanguage('en'),
                    style: language === 'en' ? 'default' : 'cancel',
                  },
                  {
                    text: 'Português',
                    onPress: () => setLanguage('pt'),
                    style: language === 'pt' ? 'default' : 'cancel',
                  },
                  {
                    text: t('cancel'),
                    style: 'cancel',
                  },
                ]
              );
            }}
          />
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
          <SettingItem
            title={t('notifications.weeklyReport')}
            subtitle={t('notifications.weeklyReportDesc')}
            icon="calendar-week"
            type="switch"
            value={profileData.notifications.weeklyReport}
            onValueChange={(value) => updateNotificationSetting('weeklyReport', value)}
          />
        </ProfileSection>

        {/* Privacidad */}
        <ProfileSection title="Privacidad" icon="shield-account">
          <SettingItem
            title="Compartir email"
            subtitle="Permitir que otros usuarios vean tu email"
            icon="email-open"
            type="switch"
            value={profileData.privacy.shareEmail}
            onValueChange={(value) => updatePrivacySetting('shareEmail', value)}
          />
          <SettingItem
            title="Compartir teléfono"
            subtitle="Permitir que otros usuarios vean tu teléfono"
            icon="phone-forward"
            type="switch"
            value={profileData.privacy.sharePhone}
            onValueChange={(value) => updatePrivacySetting('sharePhone', value)}
          />
          <SettingItem
            title="Permitir invitaciones"
            subtitle="Recibir invitaciones a eventos de otros usuarios"
            icon="account-plus"
            type="switch"
            value={profileData.privacy.allowInvitations}
            onValueChange={(value) => updatePrivacySetting('allowInvitations', value)}
          />
        </ProfileSection>

        {/* Datos y Respaldo */}
        <ProfileSection title="Datos y Respaldo" icon="database">
          <SettingItem
            title="Exportar datos"
            subtitle="Descargar una copia de tus datos"
            icon="download"
            type="navigation"
            onPress={handleExportData}
          />
          <SettingItem
            title="Eliminar todos los datos"
            subtitle="Borrar permanentemente toda la información"
            icon="delete-alert"
            type="navigation"
            onPress={handleClearData}
          />
        </ProfileSection>

        {/* Información de la App */}
        <ProfileSection title="Información" icon="information">
          <SettingItem
            title="Versión de la app"
            subtitle="1.4.1"
            icon="information-outline"
            type="value"
            value=""
          />
          <SettingItem
            title="Términos de servicio"
            icon="file-document"
            type="navigation"
            onPress={() => Alert.alert('Info', 'Términos de servicio próximamente')}
          />
          <SettingItem
            title="Política de privacidad"
            icon="shield-check"
            type="navigation"
            onPress={() => Alert.alert('Info', 'Política de privacidad próximamente')}
          />
          <SettingItem
            title="Contactar soporte"
            icon="help-circle"
            type="navigation"
            onPress={() => Alert.alert('Info', 'Soporte próximamente')}
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
                      Alert.alert(t('error'), 'No se pudo identificar el usuario');
                      return;
                    }
                    try {
                      await updateUserPassword(user.id, newPassword);
                      await refreshUser(); // Recargar usuario con nueva contraseña
                      setShowPasswordModal(false);
                      setNewPassword('');
                      Alert.alert(`✅ ${t('profile.passwordUpdated')}`, t('profile.passwordUpdateSuccess'));
                    } catch (error) {
                      Alert.alert(t('error'), 'No se pudo cambiar la contraseña');
                    }
                  } else {
                    Alert.alert(t('error'), 'La contraseña debe tener al menos 6 caracteres');
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
    } as TextStyle,

    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    } as ViewStyle,

    editButton: {
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

    profileCard: {
      marginBottom: 20,
    } as ViewStyle,

    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    } as ViewStyle,

    avatarContainer: {
      marginRight: 16,
      position: 'relative',
    } as ViewStyle,

    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    avatarEditOverlay: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: 15,
      width: 30,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
    } as ViewStyle,

    avatarText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
    } as TextStyle,

    profileInfo: {
      flex: 1,
    } as ViewStyle,

    profileName: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.onSurface,
    } as TextStyle,

    profileEmail: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    } as TextStyle,

    profileStats: {
      marginTop: 4,
    } as ViewStyle,

    profileStat: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    } as TextStyle,

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    } as ViewStyle,

    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginLeft: 8,
    } as TextStyle,

    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    } as ViewStyle,

    statItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 12,
    } as ViewStyle,

    statValue: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginTop: 4,
    } as TextStyle,

    statLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
      textAlign: 'center',
    } as TextStyle,

    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 4,
    } as ViewStyle,

    settingIcon: {
      width: 32,
      alignItems: 'center',
      marginRight: 12,
    } as ViewStyle,

    settingContent: {
      flex: 1,
    } as ViewStyle,

    settingTitle: {
      fontSize: 16,
      color: theme.colors.onSurface,
    } as TextStyle,

    settingSubtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    } as TextStyle,

    settingAction: {
      alignItems: 'flex-end',
    } as ViewStyle,

    settingValue: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    } as TextStyle,

    editInput: {
      marginBottom: 12,
    } as ViewStyle,

    saveButton: {
      marginTop: 8,
    } as ViewStyle,

    logoutCard: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: '#F44336',
    } as ViewStyle,

    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
    } as ViewStyle,

    logoutText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#F44336',
      marginLeft: 8,
    } as TextStyle,

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    } as ViewStyle,

    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 400,
    } as ViewStyle,

    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 8,
    } as TextStyle,

    modalSubtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 20,
    } as TextStyle,

    modalInput: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.onSurface,
      marginBottom: 20,
    } as ViewStyle,

    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    } as ViewStyle,

    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    } as ViewStyle,

    modalButtonCancel: {
      backgroundColor: theme.colors.surfaceVariant,
    } as ViewStyle,

    modalButtonConfirm: {
      backgroundColor: theme.colors.primary,
    } as ViewStyle,

    modalButtonTextCancel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    } as TextStyle,

    modalButtonTextConfirm: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onPrimary,
    } as TextStyle,
  });

export default ProfileScreen;