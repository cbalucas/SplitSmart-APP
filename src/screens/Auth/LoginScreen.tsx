import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { HeaderBar, Card, Button, Input } from '../../components';
import { LoginFormData } from './types';
import { createLoginStyles } from './LoginScreen.styles';
import { loginLanguage } from './language';
import { RootStackParamList } from '../../types/navigation';
import { showAlert } from '../../services/alertService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const [formData, setFormData] = useState<LoginFormData>({
    credential: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const { login, loading } = useAuth();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const navigation = useNavigation<NavigationProp>();
  
  const styles = createLoginStyles(theme);
  const t = loginLanguage[language as keyof typeof loginLanguage] || loginLanguage.es;

  const hasFieldError = (field: 'credential'): boolean => {
    if (!submittedOnce) return false;
    return !formData[field];
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
                <Text style={styles.cardHeaderTitle}>{t.form.credentialLabel}</Text>
                {/* Chip de datos demo */}
                <TouchableOpacity style={styles.demoChip} onPress={() => setShowDemoModal(true)} activeOpacity={0.7}>
                  <MaterialCommunityIcons name="flask-outline" size={13} color={theme.colors.onSurfaceVariant} />
                  <Text style={styles.demoChipText}>{t.demo.title}</Text>
                </TouchableOpacity>
              </View>

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
            </Card>

            {/* ── Botón inicio de sesión ───────────────────── */}
            <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
              <Button
                title={loading ? t.form.loginButtonLoading : t.form.loginButton}
                variant="filled"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                fullWidth
              />
            </View>
          </ScrollView>

          {/* ── Footer fijo (vacío, solo SafeArea) ─────────── */}
          <View style={{ height: 8 }} />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}