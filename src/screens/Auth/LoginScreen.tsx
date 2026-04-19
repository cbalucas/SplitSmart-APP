import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Modal, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { HeaderBar } from '../../components';
import { LoginFormData, LoginFormErrors } from './types';
import { createStyles } from './styles';
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
  
  const styles = createStyles(theme);
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
      {/* Header with theme and language controls only */}
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
      
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
      <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={styles.safeContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Ícono de la aplicación */}
        <View style={styles.iconSection}>
          <Image 
            source={require('../../../assets/splitsmart/adaptive-icon.png')}
            style={styles.appIcon}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.form}>
        <Text style={[styles.label, hasFieldError('credential') && styles.labelError]}>
          {t.form.credentialLabel}<Text style={styles.requiredStar}> *</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={formData.credential}
          onChangeText={(text) => setFormData(prev => ({ ...prev, credential: text }))}
          placeholder={t.form.credentialPlaceholder}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Enlace de datos de prueba */}
        <TouchableOpacity 
          style={styles.demoLinkButton}
          onPress={() => setShowDemoModal(true)}
        >
          <Text style={styles.demoLinkText}>{t.demo.title}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>{t.form.passwordLabel}</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={formData.password}
            onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
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


        <View style={styles.linksContainer}>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.linkText}>{t.links.forgotPassword}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading ? true : false}
        >
          <Text style={styles.buttonText}>
            {loading ? t.form.loginButtonLoading : t.form.loginButton}
          </Text>
        </TouchableOpacity>

        {/* Enlaces de navegación */}
        <View style={styles.linksContainer}>
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.linkText}>{t.links.signUp}</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.linkText}>{t.links.forgotPassword}</Text>
          </TouchableOpacity> */}
        </View>
        </View>
        
        {/* Modal para información demo */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showDemoModal}
          onRequestClose={() => setShowDemoModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t.demo.title}</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowDemoModal(false)}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={theme.colors.onSurface}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.demoText}>{t.demo.username}</Text>
                <Text style={styles.demoText}>{t.demo.email}</Text>
                <Text style={styles.demoText}>{t.demo.passwordNote}</Text>
              </View>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowDemoModal(false)}
              >
                <Text style={styles.modalButtonText}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        </ScrollView>
      </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}