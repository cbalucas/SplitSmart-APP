import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { HeaderBar } from '../../components';
import { LoginFormData, LoginFormErrors } from './types';
import { createStyles } from './styles';
import { loginLanguage } from './language';

export default function LoginScreen() {
  const [formData, setFormData] = useState<LoginFormData>({
    credential: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoInfo, setShowDemoInfo] = useState(false);
  const [showFutureInfo, setShowFutureInfo] = useState(false);
  const { login, loading } = useAuth();
  const { theme } = useTheme();
  const { language } = useLanguage();
  
  const styles = createStyles(theme);
  const t = loginLanguage[language as keyof typeof loginLanguage] || loginLanguage.es;

  const handleLogin = async () => {
    if (!formData.credential) {
      const isDarkMode = theme.colors.surface !== '#FFFFFF';
      Alert.alert(t.errors.general, t.errors.credentialRequired, [], {
        userInterfaceStyle: isDarkMode ? 'dark' : 'light'
      });
      return;
    }

    // Si no hay contraseña ingresada, intentar login sin contraseña (skipPassword)
    const success = await login(formData.credential, formData.password || '');
    if (!success) {
      const isDarkMode = theme.colors.surface !== '#FFFFFF';
      Alert.alert(t.errors.general, t.errors.invalidCredentials, [], {
        userInterfaceStyle: isDarkMode ? 'dark' : 'light'
      });
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
        showBackButton={false}
        elevation={true}
      />
      
      <SafeAreaView style={styles.safeContent} edges={['bottom', 'left', 'right']}>
        {/* Ícono de la aplicación */}
        <View style={styles.iconSection}>
          <Image 
            source={require('../../../assets/splitsmart/adaptive-icon.png')}
            style={styles.appIcon}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.form}>
        <Text style={styles.label}>{t.form.credentialLabel}</Text>
        <TextInput
          style={styles.input}
          value={formData.credential}
          onChangeText={(text) => setFormData(prev => ({ ...prev, credential: text }))}
          placeholder={t.form.credentialPlaceholder}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          autoCapitalize="none"
          autoCorrect={false}
        />

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

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading ? true : false}
        >
          <Text style={styles.buttonText}>
            {loading ? t.form.loginButtonLoading : t.form.loginButton}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.demoInfoButton}
          onPress={() => setShowDemoInfo(!showDemoInfo)}
        >
          <View style={styles.demoInfoHeader}>
            <Text style={styles.demoTitle}>{t.demo.title}</Text>
            <MaterialCommunityIcons
              name={showDemoInfo ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.colors.primary}
            />
          </View>
          {showDemoInfo && (
            <View style={styles.demoInfoContent}>
              <Text style={styles.demoText}>{t.demo.username}</Text>
              <Text style={styles.demoText}>{t.demo.email}</Text>
              <Text style={styles.demoText}>{t.demo.passwordNote}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Leyenda de desarrollo futuro */}
        <TouchableOpacity 
          style={styles.futureFeaturesButton}
          onPress={() => setShowFutureInfo(!showFutureInfo)}
        >
          <View style={styles.futureFeaturesHeader}>
            <Text style={styles.futureFeaturesTitle}>{t.futureFeatures.title}</Text>
            <MaterialCommunityIcons
              name={showFutureInfo ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.colors.primary}
            />
          </View>
          {showFutureInfo && (
            <View style={styles.futureFeaturesContent}>
              <Text style={styles.futureFeaturesText}>{t.futureFeatures.description}</Text>
            </View>
          )}
        </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}



