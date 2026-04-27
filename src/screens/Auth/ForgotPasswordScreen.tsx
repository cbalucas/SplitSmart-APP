import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Image, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { HeaderBar, Card, Button, Input } from '../../components';
import { databaseService } from '../../services/DatabaseFactory';
import { createForgotPasswordStyles } from './ForgotPasswordScreen.styles';
import { forgotPasswordLanguage } from './language';
import { RootStackParamList } from '../../types/navigation';
import { showAlert } from '../../services/alertService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ForgotPasswordScreen() {
  const [credential, setCredential] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [submittedOnce, setSubmittedOnce] = useState(false);

  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { language } = useLanguage();
  
  const styles = createForgotPasswordStyles(theme);
  const t = forgotPasswordLanguage[language as keyof typeof forgotPasswordLanguage] || forgotPasswordLanguage.es;

  const generateTempPassword = (): string => {
    const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const digits = '23456789';
    const all = upper + lower + digits;
    // Garantizar al menos 1 mayúscula, 1 minúscula, 1 dígito
    let pwd =
      upper.charAt(Math.floor(Math.random() * upper.length)) +
      lower.charAt(Math.floor(Math.random() * lower.length)) +
      digits.charAt(Math.floor(Math.random() * digits.length));
    for (let i = 0; i < 7; i++) {
      pwd += all.charAt(Math.floor(Math.random() * all.length));
    }
    // Mezclar
    return pwd.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleResetPassword = async () => {
    setSubmittedOnce(true);
    if (!credential.trim()) {
      showAlert({ type: 'error', title: t.errors.title, message: t.errors.credentialRequired, buttons: [{ text: t.errors.okButton }] });
      return;
    }

    setLoading(true);
    try {
      // Buscar usuario por username o email
      const user = await databaseService.getUserByCredential(credential.trim());
      
      if (!user) {
        showAlert({ type: 'error', title: t.errors.title, message: t.errors.userNotFound, buttons: [{ text: t.errors.okButton }] });
        return;
      }

      // Generar contraseña temporal
      const tempPassword = generateTempPassword();
      
      // Actualizar contraseña en la base de datos
      await databaseService.updateUserPassword(user.id, tempPassword);

      // Mostrar modal con la nueva contraseña
      setGeneratedPassword(tempPassword);

    } catch (error) {
      console.error('Error resetting password:', error);
      showAlert({ type: 'error', title: t.errors.title, message: t.errors.general, buttons: [{ text: t.errors.okButton }] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* ── Modal: contraseña generada ─────────────────────── */}
      <Modal
        visible={generatedPassword !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.success.title}</Text>
            <Text style={styles.modalSubtitle}>{t.success.message}</Text>

            {/* Caja con la contraseña */}
            <View style={styles.passwordBox}>
              <Text style={styles.passwordBoxLabel}>{t.success.tempPassword}</Text>
              <Text style={styles.passwordBoxText} selectable>{generatedPassword}</Text>
            </View>

            {/* Aviso importante */}
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>{t.success.noteHint}</Text>
            </View>

            <Text style={styles.modalHint}>{t.success.changePassword}</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setGeneratedPassword(null);
                navigation.navigate('Login');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>{t.success.goToLogin}</Text>
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
      />

      {/* ── Contenido principal ───────────────────────────── */}
      <KeyboardAvoidingView style={styles.keyboardWrapper} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={styles.safeContent} edges={['bottom', 'left', 'right']}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Card: Recuperar contraseña ───────────────── */}
            <Card style={styles.card}>
              {/* Header de card */}
              <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="lock-reset" size={20} color="#FF9800" />
                <Text style={styles.cardHeaderTitle}>{t.form.sectionTitle || 'Recuperar Contraseña'}</Text>
              </View>

              {/* Info box */}
              <View style={styles.infoBox}>
                <MaterialCommunityIcons name="information-outline" size={18} color="#FF9800" />
                <Text style={styles.infoText}>{t.form.infoText}</Text>
              </View>

              {/* Input de credencial */}
              <Input
                label={t.form.credentialLabel}
                required
                value={credential}
                onChangeText={setCredential}
                placeholder={t.form.credentialPlaceholder}
                autoCapitalize="none"
                autoCorrect={false}
                error={submittedOnce && !credential.trim() ? t.errors.credentialRequired : undefined}
                icon="account-search-outline"
              />
            </Card>

            {/* Link secundario */}
            <TouchableOpacity
              style={styles.linkRow}
              onPress={() => navigation.navigate('SignUp')}
            >
              <Text style={styles.linkText}>{t.links.createAccount}</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* ── Footer fijo ─────────────────────────────────── */}
          <View style={styles.footer}>
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
                title={loading ? t.form.resetButtonLoading : t.form.resetButton}
                variant="filled"
                onPress={handleResetPassword}
                loading={loading}
                disabled={loading}
                fullWidth
              />
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}