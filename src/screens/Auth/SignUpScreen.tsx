import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Image, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { HeaderBar, Card, Button, Input } from '../../components';
import TutorialOverlay from '../../components/TutorialOverlay';
import { databaseService } from '../../services/DatabaseFactory';
import { useAuth } from '../../context/AuthContext';
import { createSignUpStyles } from './SignUpScreen.styles';
import { signUpLanguage } from './language';
import { RootStackParamList } from '../../types/navigation';
import { showAlert } from '../../services/alertService';
import { generateId } from '../../utils/uuid';

interface SignUpFormData {
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  skipPassword: boolean;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

interface UsernameValidation {
  isValid: boolean;
  isChecking: boolean;
  message: string;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SignUpScreen() {
  const [formData, setFormData] = useState<SignUpFormData>({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    skipPassword: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [usernameValidation, setUsernameValidation] = useState<UsernameValidation>({
    isValid: false,
    isChecking: false,
    message: ''
  });

  // ── Tour guiado ───────────────────────────────────────────
  const [suTourVisible, setSuTourVisible] = useState(false);
  const [suTourStep, setSuTourStep] = useState(0);
  const suScrollRef   = useRef<ScrollView>(null);
  const suBasicRef    = useRef<View>(null);
  const suContactRef  = useRef<View>(null);
  const suPasswordRef = useRef<View>(null);
  const suButtonRef   = useRef<View>(null);

  const suScrollTo = (ref: React.RefObject<View>) => {
    if (ref.current && suScrollRef.current) {
      ref.current.measureLayout(
        suScrollRef.current as any,
        (_x: number, y: number) => {
          suScrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
        },
        () => {}
      );
    }
  };

  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { login, registerWithSupabase } = useAuth();
  
  const styles = createSignUpStyles(theme);
  const t = signUpLanguage[language as keyof typeof signUpLanguage] || signUpLanguage.es;

  // Función para calcular fortaleza de contraseña
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    if (!password) return { score: 0, label: '', color: theme.colors.onSurfaceVariant };
    
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const strength = {
      0: { label: t.passwordStrength.veryWeak, color: '#FF5252' },
      1: { label: t.passwordStrength.weak, color: '#FF9800' },
      2: { label: t.passwordStrength.fair, color: '#FFC107' },
      3: { label: t.passwordStrength.good, color: '#4CAF50' },
      4: { label: t.passwordStrength.strong, color: '#2E7D32' },
      5: { label: t.passwordStrength.veryStrong, color: '#1B5E20' }
    }[score] || { label: t.passwordStrength.veryWeak, color: '#FF5252' };

    return { score, ...strength };
  };

  // Función para validar username en tiempo real
  const validateUsername = async (username: string) => {
    if (username.length < 3) {
      setUsernameValidation({ isValid: false, isChecking: false, message: t.usernameValidation.tooShort });
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameValidation({ isValid: false, isChecking: false, message: t.usernameValidation.invalid });
      return;
    }

    setUsernameValidation({ isValid: false, isChecking: true, message: t.usernameValidation.checking });
    
    try {
      const existingUser = await databaseService.getUserByCredential(username);
      if (existingUser) {
        setUsernameValidation({ isValid: false, isChecking: false, message: t.usernameValidation.taken });
      } else {
        setUsernameValidation({ isValid: true, isChecking: false, message: t.usernameValidation.available });
      }
    } catch (error) {
      setUsernameValidation({ isValid: false, isChecking: false, message: t.usernameValidation.error });
    }
  };

  // Debounce para validación de username
  React.useEffect(() => {
    if (formData.username.trim()) {
      const timeoutId = setTimeout(() => {
        validateUsername(formData.username.trim().toLowerCase());
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setUsernameValidation({ isValid: false, isChecking: false, message: '' });
    }
  }, [formData.username]);

  const passwordStrength = calculatePasswordStrength(formData.password);

  // Función para validar coincidencia de contraseñas
  const getPasswordMatchStatus = () => {
    if (!formData.confirmPassword || !formData.password) return null;
    return formData.password === formData.confirmPassword;
  };

  const passwordsMatch = getPasswordMatchStatus();

  const validateForm = (): { isValid: boolean; error?: string } => {
    // Validar nombre
    if (!formData.name.trim()) {
      return { isValid: false, error: t.errors.nameRequired };
    }

    // Validar username
    if (!formData.username.trim()) {
      return { isValid: false, error: t.errors.usernameRequired };
    }
    if (formData.username.length < 3) {
      return { isValid: false, error: t.errors.usernameMinLength };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      return { isValid: false, error: t.errors.usernameInvalid };
    }

    // Validar teléfono (obligatorio)
    if (!formData.phone.trim()) {
      return { isValid: false, error: t.errors.phoneRequired };
    }
    if (!/^\+?\d{1,16}$/.test(formData.phone)) {
      return { isValid: false, error: t.errors.phoneInvalid };
    }

    // Validar email (opcional)
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return { isValid: false, error: t.errors.emailInvalid };
    }

    // Validar username disponible
    if (!usernameValidation.isValid && !usernameValidation.isChecking) {
      return { isValid: false, error: usernameValidation.message || t.errors.usernameRequired };
    }

    // Validar contraseña (solo si no se marcó skipPassword)
    if (!formData.skipPassword) {
      if (!formData.password) {
        return { isValid: false, error: t.errors.passwordRequired };
      }
      if (formData.password.length < 6) {
        return { isValid: false, error: t.errors.passwordMinLength };
      }

      // Validar confirmación de contraseña
      if (formData.password !== formData.confirmPassword) {
        return { isValid: false, error: t.errors.passwordMismatch };
      }
    }

    return { isValid: true };
  };

  const handleSignUp = async () => {
    setSubmittedOnce(true);
    const validation = validateForm();
    if (!validation.isValid) {
      showAlert({ type: 'error', title: t.errors.title, message: validation.error, buttons: [{ text: 'OK' }] });
      return;
    }

    setLoading(true);
    try {
      // Verificar si el username ya existe
      const existingUser = await databaseService.getUserByCredential(formData.username);
      if (existingUser) {
        showAlert({ type: 'error', title: t.errors.title, message: t.errors.usernameExists, buttons: [{ text: 'OK' }] });
        return;
      }

      // Verificar si el email ya existe (solo si se proporcionó)
      if (formData.email.trim()) {
        const existingEmail = await databaseService.getUserByCredential(formData.email);
        if (existingEmail) {
          showAlert({ type: 'error', title: t.errors.title, message: t.errors.emailExists, buttons: [{ text: 'OK' }] });
          return;
        }
      }

      // Crear el usuario en la BD local
      const userId = `user_${Date.now()}`;
      await databaseService.createUser({
        id: userId,
        username: formData.username.trim().toLowerCase(),
        email: formData.email.trim() ? formData.email.trim().toLowerCase() : `${formData.username.toLowerCase()}@temp.local`,
        password: formData.skipPassword ? '' : formData.password,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        skipPassword: formData.skipPassword
      });

      // Si tiene email y contraseña, también registrar en Supabase (en segundo plano)
      if (formData.email.trim() && formData.password) {
        const sbResult = await registerWithSupabase(
          formData.email.trim().toLowerCase(),
          formData.password,
          formData.name.trim(),
          formData.username.trim().toLowerCase(),
        );
        if (sbResult.success) {
          console.log('✅ User also registered in Supabase');
        } else {
          // No bloquear el registro local por fallos de Supabase (puede ser email ya existente, etc.)
          console.warn('⚠️ Supabase registration skipped:', sbResult.error);
        }
      }

      // Crear automáticamente el amigo vinculado con los datos del usuario
      // (antes se preguntaba; ahora se crea por defecto para que otros puedan agregarte a eventos)
      try {
        await databaseService.createParticipant({
          id: generateId(),
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          isActive: true,
          participantType: 'friend',
          userId: userId,
          createdByUserId: userId,
          isPublic: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any);
      } catch (e) {
        console.error('Error creating self as friend:', e);
      }

      // Auto-login inmediato
      const success = await login(
        formData.username.toLowerCase(),
        formData.skipPassword ? '' : formData.password,
      );
      if (!success) {
        showAlert({ type: 'info', title: t.success.title, message: t.success.messageLoginManual, buttons: [{ text: t.success.button, onPress: () => navigation.navigate('Login') }] });
      }

    } catch (error) {
      console.error('Error creating user:', error);
      showAlert({ type: 'error', title: t.errors.title, message: t.errors.general, buttons: [{ text: 'OK' }] });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof SignUpFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const hasFieldError = (field: keyof SignUpFormData): boolean => {
    if (!submittedOnce) return false;
    switch (field) {
      case 'name': return !formData.name.trim();
      case 'username': return !formData.username.trim() || (!usernameValidation.isValid && !usernameValidation.isChecking);
      case 'phone': return !formData.phone.trim();
      case 'password': return !formData.skipPassword && !formData.password;
      case 'confirmPassword': return !formData.skipPassword && formData.password !== formData.confirmPassword;
      default: return false;
    }
  };

  return (
    <View style={styles.container}>

      {/* ── Header ────────────────────────────────────────── */}
      <HeaderBar
        title={t.title}
        titleAlignment="left"
        useDynamicColors={true}
        showThemeToggle={true}
        showLanguageSelector={true}
        showHelp={true}
        showBackButton={false}
        elevation={true}
        onHelpPress={() => {
          suScrollRef.current?.scrollTo({ y: 0, animated: false });
          setSuTourStep(0);
          setSuTourVisible(true);
        }}
      />

      {/* ── Contenido principal ───────────────────────────── */}
      <KeyboardAvoidingView style={styles.keyboardWrapper} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={styles.safeContent} edges={['bottom', 'left', 'right']}>
          <ScrollView
            ref={suScrollRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Card: Información Básica ─────────────────── */}
            <View ref={suBasicRef} collapsable={false}>
              <Card style={[styles.card, styles.cardBasic]}>
                <View style={styles.cardHeaderRow}>
                  <MaterialCommunityIcons name="account-outline" size={20} color="#4CAF50" />
                  <Text style={styles.cardHeaderTitle}>{t.form.basicSectionTitle || 'Información Básica'}</Text>
                </View>

                <Input
                  label={t.form.nameLabel}
                  required
                  value={formData.name}
                  onChangeText={(text) => updateFormData('name', text)}
                  placeholder={t.form.namePlaceholder}
                  autoCapitalize="words"
                  autoCorrect={false}
                  error={hasFieldError('name') ? t.errors.nameRequired : undefined}
                  icon="account-outline"
                />

                <View style={styles.inputSpacer} />

                <View style={styles.usernameWrapper}>
                  <Input
                    label={t.form.usernameLabel}
                    required
                    value={formData.username}
                    onChangeText={(text) => updateFormData('username', text)}
                    placeholder={t.form.usernamePlaceholder}
                    autoCapitalize="none"
                    autoCorrect={false}
                    error={hasFieldError('username') ? (usernameValidation.message || t.errors.usernameRequired) : undefined}
                    success={usernameValidation.isValid}
                    icon="at"
                  />
                  <View style={styles.usernameIndicator}>
                    {usernameValidation.isChecking ? (
                      <MaterialCommunityIcons name="loading" size={20} color={theme.colors.primary} />
                    ) : usernameValidation.isValid ? (
                      <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                    ) : usernameValidation.message ? (
                      <MaterialCommunityIcons name="close-circle" size={20} color="#FF5252" />
                    ) : null}
                  </View>
                </View>
                {usernameValidation.message && !hasFieldError('username') && (
                  <Text style={[
                    styles.validationText,
                    usernameValidation.isValid ? styles.validationTextSuccess : styles.validationTextError,
                  ]}>
                    {usernameValidation.message}
                  </Text>
                )}

                <View style={styles.inputSpacer} />

                <Input
                  label={t.form.phoneLabel}
                  required
                  value={formData.phone}
                  onChangeText={(text) => {
                    const startsWithPlus = text.startsWith('+');
                    let digits = text.replace(/\D/g, '');
                    if (digits.length > 16) digits = digits.slice(0, 16);
                    const filtered = startsWithPlus ? '+' + digits : digits;
                    updateFormData('phone', filtered);
                  }}
                  placeholder={t.form.phonePlaceholder}
                  keyboardType="phone-pad"
                  error={hasFieldError('phone') ? t.errors.phoneRequired : undefined}
                  icon="phone-outline"
                />

                <View style={styles.inputSpacer} />

                <Input
                  label={t.form.emailLabel}
                  value={formData.email}
                  onChangeText={(text) => updateFormData('email', text.toLowerCase().replace(/\s/g, ''))}
                  placeholder={t.form.emailPlaceholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  icon="email-outline"
                />
              </Card>
            </View>

            {/* ── Card: Seguridad ──────────────────────────── */}
            <View ref={suPasswordRef} collapsable={false}>
              <Card style={[styles.card, styles.cardSecurity]}>
                <TouchableOpacity
                  style={[styles.cardHeaderRow, { marginBottom: formData.skipPassword ? 0 : 16 }]}
                  onPress={() => updateFormData('skipPassword', !formData.skipPassword)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="shield-lock-outline" size={20} color="#4CAF50" />
                  <Text style={[styles.cardHeaderTitle, { flex: 1 }]}>{t.form.securitySectionTitle || 'Seguridad'}</Text>
                  <MaterialCommunityIcons
                    name={formData.skipPassword ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={22}
                    color={formData.skipPassword ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                  <Text style={[styles.noPasswordTileText, formData.skipPassword && styles.noPasswordTileTextActive]}>
                    {t.form.skipPasswordLabel}
                  </Text>
                </TouchableOpacity>

                {!formData.skipPassword && (
                  <>
                    <Input
                      label={t.form.passwordLabel}
                      required
                      type="password"
                      value={formData.password}
                      onChangeText={(text) => updateFormData('password', text)}
                      placeholder={t.form.passwordPlaceholder}
                      error={hasFieldError('password') ? t.errors.passwordRequired : undefined}
                      icon="lock-outline"
                    />

                    {formData.password ? (
                      <View style={styles.strengthContainer}>
                        <View style={styles.strengthBarBg}>
                          <View
                            style={[
                              styles.strengthBarFill,
                              { width: `${(passwordStrength.score / 5) * 100}%`, backgroundColor: passwordStrength.color },
                            ]}
                          />
                        </View>
                        <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                          {passwordStrength.label}
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.inputSpacer} />

                    <Input
                      label={t.form.confirmPasswordLabel}
                      required
                      type="password"
                      value={formData.confirmPassword}
                      onChangeText={(text) => updateFormData('confirmPassword', text)}
                      placeholder={t.form.confirmPasswordPlaceholder}
                      error={
                        hasFieldError('confirmPassword')
                          ? t.errors.passwordMismatch
                          : passwordsMatch === false && formData.confirmPassword
                          ? t.errors.passwordMismatch
                          : undefined
                      }
                      success={passwordsMatch === true}
                      icon="lock-check-outline"
                    />
                  </>
                )}
              </Card>
            </View>
          </ScrollView>

          {/* ── Footer fijo ─────────────────────────────────── */}
          <View ref={suButtonRef} collapsable={false} style={styles.footer}>
            <View style={styles.footerButtonFlex}>
              <Button
                title={t.links.backToLogin}
                variant="outlined"
                onPress={() => navigation.navigate('Login')}
                fullWidth
              />
            </View>
            <View style={styles.footerButtonFlex}>
              <Button
                title={t.form.signUpButton}
                variant="filled"
                onPress={handleSignUp}
                loading={loading}
                disabled={loading}
                fullWidth
              />
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>

      {/* ── Tour guiado ─────────────────────────────────────── */}
      <TutorialOverlay
        visible={suTourVisible}
        steps={[
          { ref: suBasicRef,    titleKey: 'tour.signUp.basic.title',    descKey: 'tour.signUp.basic.desc',    popupPosition: 'below' },
          { ref: suPasswordRef, titleKey: 'tour.signUp.password.title', descKey: 'tour.signUp.password.desc', popupPosition: 'center', onBeforeShow: () => suScrollTo(suPasswordRef), delay: 400 },
          { ref: suButtonRef,   titleKey: 'tour.signUp.button.title',   descKey: 'tour.signUp.button.desc',   popupPosition: 'above' },
        ]}
        currentStep={suTourStep}
        onNext={() => setSuTourStep(p => p + 1)}
        onPrev={() => setSuTourStep(p => p - 1)}
        onClose={() => { setSuTourVisible(false); setSuTourStep(0); }}
      />
    </View>
  );
}
