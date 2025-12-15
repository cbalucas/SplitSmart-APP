import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { HeaderBar } from '../../components';
import { databaseService } from '../../services/database';
import { useAuth } from '../../context/AuthContext';
import { createStyles } from './styles';
import { signUpLanguage } from './language';
import { RootStackParamList } from '../../types/navigation';

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
  const [usernameValidation, setUsernameValidation] = useState<UsernameValidation>({
    isValid: false,
    isChecking: false,
    message: ''
  });

  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { login } = useAuth();
  
  const styles = createStyles(theme);
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
        validateUsername(formData.username.trim());
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
    if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
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
    const validation = validateForm();
    if (!validation.isValid) {
      const isDarkMode = theme.colors.surface !== '#FFFFFF';
      Alert.alert(t.errors.title, validation.error, [
        { text: 'OK', style: 'default' }
      ], {
        userInterfaceStyle: isDarkMode ? 'dark' : 'light'
      });
      return;
    }

    setLoading(true);
    try {
      // Verificar si el username ya existe
      const existingUser = await databaseService.getUserByCredential(formData.username);
      if (existingUser) {
        const isDarkMode = theme.colors.surface !== '#FFFFFF';
        Alert.alert(t.errors.title, t.errors.usernameExists, [
          { text: 'OK', style: 'default' }
        ], {
          userInterfaceStyle: isDarkMode ? 'dark' : 'light'
        });
        return;
      }

      // Verificar si el email ya existe (solo si se proporcionó)
      if (formData.email.trim()) {
        const existingEmail = await databaseService.getUserByCredential(formData.email);
        if (existingEmail) {
          const isDarkMode = theme.colors.surface !== '#FFFFFF';
          Alert.alert(t.errors.title, t.errors.emailExists, [
            { text: 'OK', style: 'default' }
          ], {
            userInterfaceStyle: isDarkMode ? 'dark' : 'light'
          });
          return;
        }
      }

      // Crear el usuario
      const userId = `user_${Date.now()}`;
      await databaseService.createUser({
        id: userId,
        username: formData.username.trim(),
        email: formData.email.trim() ? formData.email.trim().toLowerCase() : `${formData.username}@temp.local`,
        password: formData.skipPassword ? '' : formData.password,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        skipPassword: formData.skipPassword
      });

      // Auto-login después del registro
      const success = await login(formData.username, formData.skipPassword ? '' : formData.password);
      
      if (success) {
        const isDarkMode = theme.colors.surface !== '#FFFFFF';
        Alert.alert(
          t.success.title, 
          t.success.message.replace('{name}', formData.name.split(' ')[0]),
          [{ text: t.success.button, onPress: () => {} }],
          { userInterfaceStyle: isDarkMode ? 'dark' : 'light' }
        );
      } else {
        // Si el auto-login falla, mostrar mensaje de éxito manual
        const isDarkMode = theme.colors.surface !== '#FFFFFF';
        Alert.alert(
          t.success.title, 
          t.success.messageLoginManual,
          [{ text: t.success.button, onPress: () => navigation.navigate('Login') }],
          { userInterfaceStyle: isDarkMode ? 'dark' : 'light' }
        );
      }

    } catch (error) {
      console.error('Error creating user:', error);
      const isDarkMode = theme.colors.surface !== '#FFFFFF';
      Alert.alert(t.errors.title, t.errors.general, [
        { text: 'OK', style: 'default' }
      ], {
        userInterfaceStyle: isDarkMode ? 'dark' : 'light'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof SignUpFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        title={t.title}
        titleAlignment="left"
        useDynamicColors={true}
        showThemeToggle={true}
        showLanguageSelector={true}
        showBackButton={false}
        elevation={true}
      />
      
      <SafeAreaView style={styles.safeContent} edges={['bottom', 'left', 'right']}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <Text style={styles.mainTitle}>{t.subtitle}</Text>

            {/* Nombre completo */}
            <Text style={styles.label}>{t.form.nameLabel}</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => updateFormData('name', text)}
              placeholder={t.form.namePlaceholder}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              autoCapitalize="words"
              autoCorrect={false}
            />

            {/* Username */}
            <Text style={styles.label}>{t.form.usernameLabel}</Text>
            <View style={styles.inputWithIndicator}>
              <TextInput
                style={[
                  styles.inputWithIcon,
                  usernameValidation.isValid && styles.inputValid,
                  (!usernameValidation.isValid && usernameValidation.message && !usernameValidation.isChecking) && styles.inputInvalid
                ]}
                value={formData.username}
                onChangeText={(text) => updateFormData('username', text.toLowerCase())}
                placeholder={t.form.usernamePlaceholder}
                placeholderTextColor={theme.colors.onSurfaceVariant}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.validationIndicator}>
                {usernameValidation.isChecking ? (
                  <MaterialCommunityIcons name="loading" size={20} color={theme.colors.primary} />
                ) : usernameValidation.isValid ? (
                  <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
                ) : usernameValidation.message ? (
                  <MaterialCommunityIcons name="close-circle" size={20} color="#FF5252" />
                ) : null}
              </View>
            </View>
            {usernameValidation.message && (
              <Text style={[
                styles.validationText,
                usernameValidation.isValid ? styles.validationTextSuccess : styles.validationTextError
              ]}>
                {usernameValidation.message}
              </Text>
            )}

            {/* Teléfono (obligatorio) */}
            <Text style={styles.label}>{t.form.phoneLabel}</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => updateFormData('phone', text)}
              placeholder={t.form.phonePlaceholder}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              keyboardType="phone-pad"
            />

            {/* Email (opcional) */}
            <Text style={styles.label}>{t.form.emailLabel}</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => updateFormData('email', text)}
              placeholder={t.form.emailPlaceholder}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Checkbox para usuario sin contraseña */}
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => updateFormData('skipPassword', !formData.skipPassword)}
            >
              <MaterialCommunityIcons
                name={formData.skipPassword ? "checkbox-marked" : "checkbox-blank-outline"}
                size={24}
                color={theme.colors.primary}
              />
              <Text style={styles.checkboxText}>{t.form.skipPasswordLabel}</Text>
            </TouchableOpacity>

            {!formData.skipPassword && (
              <>
                {/* Contraseña */}
                <Text style={styles.label}>{t.form.passwordLabel}</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={formData.password}
                    onChangeText={(text) => updateFormData('password', text)}
                    placeholder={t.form.passwordPlaceholder}
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? "eye-off" : "eye"}
                      size={24}
                      color={theme.colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                </View>

                {/* Indicador de fortaleza de contraseña */}
                {formData.password && (
                  <View style={styles.passwordStrengthContainer}>
                    <View style={styles.passwordStrengthBar}>
                      <View 
                        style={[
                          styles.passwordStrengthFill,
                          { 
                            width: `${(passwordStrength.score / 5) * 100}%`,
                            backgroundColor: passwordStrength.color
                          }
                        ]}
                      />
                    </View>
                    <Text style={[styles.passwordStrengthText, { color: passwordStrength.color }]}>
                      {passwordStrength.label}
                    </Text>
                  </View>
                )}

                {/* Confirmar contraseña */}
                <Text style={styles.label}>{t.form.confirmPasswordLabel}</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={formData.confirmPassword}
                    onChangeText={(text) => updateFormData('confirmPassword', text)}
                    placeholder={t.form.confirmPasswordPlaceholder}
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <MaterialCommunityIcons
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={24}
                      color={theme.colors.onSurfaceVariant}
                    />
                  </TouchableOpacity>
                </View>
                {passwordsMatch === false && formData.confirmPassword && (
                  <Text style={styles.validationTextError}>
                    {t.errors.passwordMismatch}
                  </Text>
                )}
              </>
            )}

            {/* Botón de registro */}
            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? t.form.signUpButtonLoading : t.form.signUpButton}
              </Text>
            </TouchableOpacity>

            {/* Enlace para volver al login */}
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.linkText}>{t.links.backToLogin}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}