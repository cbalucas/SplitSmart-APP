import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { HeaderBar, Card, Button, Input } from '../../components';
import { LoginFormData } from './types';
import { createLoginStyles } from './LoginScreen.styles';
import { loginLanguage } from './language';
import { RootStackParamList } from '../../types/navigation';
import { showAlert } from '../../services/alertService';
import { databaseService } from '../../services/DatabaseFactory';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface LastUser {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string | null;
  skipPassword: boolean;
  biometricEnabled: boolean;
}

export default function LoginScreen() {
  const [formData, setFormData] = useState<LoginFormData>({
    credential: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [showBiometricButton, setShowBiometricButton] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [lastLoggedUser, setLastLoggedUser] = useState<LastUser | null>(null);
  const [showLastUserCard, setShowLastUserCard] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [knownUsers, setKnownUsers] = useState<LastUser[]>([]);
  const { login, loading, loginWithBiometric, loginWithGoogle } = useAuth();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const navigation = useNavigation<NavigationProp>();

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const allUsers = await databaseService.getAllUsersWithLoginInfo();

          // ── Último usuario recordado (excluir Demo) ────────────────
          const lastUserBasic = allUsers
            .filter((u: any) => u.last_login && u.id !== 'demo-user')
            .sort((a: any, b: any) => new Date(b.last_login).getTime() - new Date(a.last_login).getTime())[0];

          if (lastUserBasic) {
            const fullUser = await databaseService.getUserById(lastUserBasic.id);
            if (fullUser) {
              const remembered: LastUser = {
                id: fullUser.id,
                name: fullUser.name,
                username: fullUser.username,
                email: fullUser.email,
                avatar: fullUser.avatar || null,
                skipPassword: fullUser.skip_password === 1,
                biometricEnabled: lastUserBasic.biometric_enabled === 1,
              };
              setLastLoggedUser(remembered);
              setShowLastUserCard(true);
              setFormData(prev => ({ ...prev, credential: fullUser.username }));

              // ── Biométrico: solo si ESE usuario lo tiene habilitado ──
              if (Platform.OS !== 'web' && remembered.biometricEnabled) {
                const hasHardware = await LocalAuthentication.hasHardwareAsync();
                const isEnrolled = await LocalAuthentication.isEnrolledAsync();
                setShowBiometricButton(hasHardware && isEnrolled);
              } else {
                setShowBiometricButton(false);
              }
              return;
            }
          }

          // Sin último usuario: formulario normal, sin biométrico
          setLastLoggedUser(null);
          setShowLastUserCard(false);
          setShowBiometricButton(false);
        } catch (_) {}
      })();
    }, [])
  );
  
  const styles = createLoginStyles(theme);
  const t = loginLanguage[language as keyof typeof loginLanguage] || loginLanguage.es;

  const hasFieldError = (field: 'credential'): boolean => {
    if (!submittedOnce) return false;
    return !formData[field];
  };

  // ── Verificar si el hardware biométrico está disponible ──────
  const checkBiometricHardware = async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (_) {
      return false;
    }
  };

  // ── Seleccionar un usuario del picker ─────────────────────────
  const selectUser = async (user: LastUser) => {
    setLastLoggedUser(user);
    setShowLastUserCard(true);
    setFormData(prev => ({ ...prev, credential: user.username, password: '' }));
    setShowSwitchModal(false);
    if (user.biometricEnabled) {
      setShowBiometricButton(await checkBiometricHardware());
    } else {
      setShowBiometricButton(false);
    }
  };

  // ── Abrir modal de cambiar cuenta ─────────────────────────────
  const openSwitchModal = async () => {
    try {
      const allUsers = await databaseService.getAllUsersWithLoginInfo();
      const sorted = allUsers
        .filter((u: any) => u.last_login && u.id !== 'demo-user')
        .sort((a: any, b: any) => new Date(b.last_login).getTime() - new Date(a.last_login).getTime());

      const users: LastUser[] = await Promise.all(
        sorted.map(async (u: any) => {
          const full = await databaseService.getUserById(u.id);
          return {
            id: u.id,
            name: full?.name ?? u.id,
            username: full?.username ?? u.id,
            email: full?.email ?? '',
            avatar: full?.avatar || null,
            skipPassword: full?.skip_password === 1,
            biometricEnabled: u.biometric_enabled === 1,
          } as LastUser;
        })
      );

      if (users.length <= 1) {
        // Un solo usuario conocido: limpiar directo sin picker
        setShowLastUserCard(false);
        setLastLoggedUser(null);
        setShowBiometricButton(false);
        setFormData({ credential: '', password: '' });
        return;
      }

      setKnownUsers(users);
      setShowSwitchModal(true);
    } catch (_) {}
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (_) {
      showAlert({ type: 'error', title: t.errors.general, message: t.errors.googleFailed, buttons: [{ text: 'OK' }] });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogin = async () => {
    setSubmittedOnce(true);
    if (!formData.credential) {
      showAlert({ type: 'error', title: t.errors.general, message: t.errors.credentialRequired, buttons: [{ text: 'OK' }] });
      return;
    }

    // Si no hay contraseña ingresada, intentar login sin contraseña (skipPassword)
    const success = await login(formData.credential, formData.password || '');
    if (!success) {
      showAlert({ type: 'error', title: t.errors.general, message: t.errors.invalidCredentials, buttons: [{ text: 'OK' }] });
    }
  };

  return (
    <View style={styles.container}>

      {/* ── Modal: selector de cuenta ───────────────────── */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSwitchModal}
        onRequestClose={() => setShowSwitchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <MaterialCommunityIcons name="account-switch-outline" size={22} color={theme.colors.primary} />
              <Text style={styles.modalTitle}>{t.form.switchAccountTitle}</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowSwitchModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {knownUsers.map((user, index) => (
              <React.Fragment key={user.id}>
                {index > 0 && <View style={styles.userPickerSeparator} />}
                <TouchableOpacity
                  style={[
                    styles.userPickerItem,
                    lastLoggedUser?.id === user.id && styles.userPickerItemActive,
                  ]}
                  onPress={() => selectUser(user)}
                  activeOpacity={0.7}
                >
                  {/* Avatar */}
                  {user.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.userPickerAvatar as any} />
                  ) : (
                    <View style={styles.userPickerAvatar}>
                      <Text style={styles.userPickerAvatarText}>
                        {user.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  {/* Info */}
                  <View style={styles.userPickerInfo}>
                    <Text style={styles.userPickerName}>{user.name}</Text>
                    <Text style={styles.userPickerUsername}>@{user.username}</Text>
                  </View>
                  {/* Indicadores de estado */}
                  {user.biometricEnabled && (
                    <MaterialCommunityIcons name="fingerprint" size={20} color={theme.colors.primary} />
                  )}
                  {lastLoggedUser?.id === user.id && (
                    <MaterialCommunityIcons name="check-circle" size={20} color={theme.colors.primary} />
                  )}
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        </View>
      </Modal>

      {/* ── Modal: datos demo ────────────────────────────── */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showDemoModal}
        onRequestClose={() => setShowDemoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <MaterialCommunityIcons name="information-outline" size={22} color={theme.colors.primary} />
              <Text style={styles.modalTitle}>{t.demo.title}</Text>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowDemoModal(false)}>
                <MaterialCommunityIcons name="close" size={22} color={theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalDataRow}>
              <Text style={styles.modalDataLabel}>Usuario</Text>
              <Text style={styles.modalDataValue}>Demo</Text>
            </View>
            <View style={styles.modalDataRow}>
              <Text style={styles.modalDataLabel}>Email</Text>
              <Text style={styles.modalDataValue}>demo@splitsmart.com</Text>
            </View>
            <View style={styles.modalDataRow}>
              <Text style={styles.modalDataLabel}>Contraseña</Text>
              <Text style={styles.modalDataValue}>{t.demo.passwordNote}</Text>
            </View>

            <TouchableOpacity style={styles.modalButton} onPress={() => setShowDemoModal(false)} activeOpacity={0.8}>
              <Text style={styles.modalButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Header ────────────────────────────────────────── */}
      <HeaderBar
        title={t.title}
        titleAlignment="left"
        useDynamicColors={true}
        showThemeToggle={true}
        showLanguageSelector={true}
        showHelp={false}
        showBackButton={false}
        elevation={true}
        showLogo={false}
      />

      {/* ── Contenido principal ───────────────────────────── */}
      <KeyboardAvoidingView style={styles.keyboardWrapper} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={styles.safeContent} edges={['bottom', 'left', 'right']}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <View style={styles.logoSection}>
              <Image
                source={require('../../../assets/splitsmart/adaptive-icon.png')}
                style={styles.appIcon}
                resizeMode="contain"
              />
            </View>

            {/* ── Card: Credencial ─────────────────────────── */}
            <Card style={styles.cardCredential}>
              {/* Header de card */}
              <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="account-outline" size={20} color="#2196F3" />
                <Text style={styles.cardHeaderTitle}>
                  {showLastUserCard && lastLoggedUser ? t.form.welcomeBack : t.form.credentialLabel}
                </Text>
                {/* Chip de datos demo — solo en formulario normal */}
                {!showLastUserCard && (
                  <TouchableOpacity style={styles.demoChip} onPress={() => setShowDemoModal(true)} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="flask-outline" size={13} color={theme.colors.onSurfaceVariant} />
                    <Text style={styles.demoChipText}>{t.demo.title}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* ── Modo: último usuario recordado ─────────── */}
              {showLastUserCard && lastLoggedUser ? (
                <View style={styles.lastUserRow}>
                  {/* Avatar (foto o inicial) */}
                  {lastLoggedUser.avatar ? (
                    <Image
                      source={{ uri: lastLoggedUser.avatar }}
                      style={styles.lastUserAvatar as any}
                    />
                  ) : (
                    <View style={styles.lastUserAvatar}>
                      <Text style={styles.lastUserAvatarText}>
                        {lastLoggedUser.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  {/* Info */}
                  <View style={styles.lastUserInfo}>
                    <Text style={styles.lastUserName}>{lastLoggedUser.name}</Text>
                    <Text style={styles.lastUserUsername}>@{lastLoggedUser.username}</Text>
                  </View>
                  {/* Cambiar cuenta */}
                  <TouchableOpacity
                    onPress={openSwitchModal}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.changeUserLink}>{t.links.changeUser}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                /* ── Modo: formulario normal ──────────────── */
                <>
                  <Input
                    label={t.form.credentialLabel}
                    required
                    value={formData.credential}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, credential: text }))}
                    placeholder={t.form.credentialPlaceholder}
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={hasFieldError('credential') ? t.errors.credentialRequired : undefined}
                    icon="account-circle-outline"
                  />
                  {/* Link ¿No tienes cuenta? */}
                  <TouchableOpacity
                    style={{ alignItems: 'flex-end', marginTop: 6 }}
                    onPress={() => navigation.navigate('SignUp')}
                  >
                    <Text style={styles.linkText}>{t.links.signUp}</Text>
                  </TouchableOpacity>
                  <View style={{ height: 16 }} />
                </>
              )}

              {/* ── Contraseña: ocultar solo si último usuario tiene skipPassword ── */}
              {!(showLastUserCard && lastLoggedUser?.skipPassword) && (
                <>
                  {showLastUserCard && <View style={{ height: 16 }} />}
                  <Input
                    label={t.form.passwordLabel}
                    type="password"
                    value={formData.password}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                    placeholder={t.form.passwordPlaceholder}
                    icon="lock-outline"
                  />
                  {/* Link ¿Olvidaste tu contraseña? */}
                  <TouchableOpacity
                    style={styles.forgotPasswordRow}
                    onPress={() => navigation.navigate('ForgotPassword')}
                  >
                    <Text style={styles.forgotPasswordText}>{t.links.forgotPassword}</Text>
                  </TouchableOpacity>
                </>
              )}
            </Card>
          </ScrollView>

          {/* ── Footer fijo ─────────────────────────────────── */}
          <View style={styles.footer}>

            {/* Fila 1: Login + Biométrico (si disponible) */}
            <View style={styles.authRow}>
              <View style={styles.loginButtonWrap}>
                <Button
                  title={loading ? t.form.loginButtonLoading : t.form.loginButton}
                  variant="filled"
                  onPress={handleLogin}
                  loading={loading}
                  disabled={loading}
                  fullWidth
                />
              </View>

              {showBiometricButton && Platform.OS !== 'web' && (
                <TouchableOpacity
                  style={[styles.biometricButton, loading && { opacity: 0.5 }]}
                  accessibilityLabel={t.form.biometricButton}
                  onPress={async () => {
                    const success = await loginWithBiometric(lastLoggedUser?.id);
                    if (!success) {
                      showAlert({ type: 'error', title: t.errors.general, message: t.errors.biometricFailed, buttons: [{ text: 'OK' }] });
                    }
                  }}
                  disabled={loading}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="fingerprint" size={24} color={theme.colors.primary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Separador */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>o</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Continuar con Google */}
            <TouchableOpacity
              style={[styles.googleButton, (loading || googleLoading) && { opacity: 0.6 }]}
              onPress={handleGoogleLogin}
              disabled={loading || googleLoading}
              activeOpacity={0.75}
            >
              <MaterialCommunityIcons name="google" size={20} color="#EA4335" />
              <Text style={styles.googleButtonText}>
                {googleLoading ? t.form.googleLoginLoading : t.form.googleLogin}
              </Text>
            </TouchableOpacity>

          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}