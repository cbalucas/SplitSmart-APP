import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { HeaderBar } from '../../components';
import { databaseService } from '../../services/database';
import { createStyles } from './styles';
import { forgotPasswordLanguage } from './language';
import { RootStackParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ForgotPasswordScreen() {
  const [credential, setCredential] = useState('');
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { language } = useLanguage();
  
  const styles = createStyles(theme);
  const t = forgotPasswordLanguage[language as keyof typeof forgotPasswordLanguage] || forgotPasswordLanguage.es;

  const generateTempPassword = (): string => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let tempPassword = '';
    for (let i = 0; i < 8; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return tempPassword;
  };

  const handleResetPassword = async () => {
    if (!credential.trim()) {
      const isDarkMode = theme.colors.surface !== '#FFFFFF';
      Alert.alert(t.errors.title, t.errors.credentialRequired, [
        { text: t.errors.okButton }
      ], {
        userInterfaceStyle: isDarkMode ? 'dark' : 'light'
      });
      return;
    }

    setLoading(true);
    try {
      // Buscar usuario por username o email
      const user = await databaseService.getUserByCredential(credential.trim());
      
      if (!user) {
        const isDarkMode = theme.colors.surface !== '#FFFFFF';
        Alert.alert(t.errors.title, t.errors.userNotFound, [
          { text: t.errors.okButton }
        ], {
          userInterfaceStyle: isDarkMode ? 'dark' : 'light'
        });
        return;
      }

      // Generar contraseña temporal
      const tempPassword = generateTempPassword();
      
      // Actualizar contraseña en la base de datos
      await databaseService.updateUserPassword(user.id, tempPassword);

      // Mostrar la contraseña temporal al usuario
      const isDarkMode = theme.colors.surface !== '#FFFFFF';
      Alert.alert(
        t.success.title,
        `${t.success.message}\n\n${t.success.tempPassword}: ${tempPassword}\n\n${t.success.changePassword}`,
        [
          {
            text: t.success.goToLogin,
            onPress: () => navigation.navigate('Login')
          }
        ],
        { userInterfaceStyle: isDarkMode ? 'dark' : 'light' }
      );

    } catch (error) {
      console.error('Error resetting password:', error);
      const isDarkMode = theme.colors.surface !== '#FFFFFF';
      Alert.alert(t.errors.title, t.errors.general, [
        { text: t.errors.okButton }
      ], {
        userInterfaceStyle: isDarkMode ? 'dark' : 'light'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        title={t.title}
        titleAlignment="left"
        useDynamicColors={true}
        showThemeToggle={true}
        showLanguageSelector={true}
        showBackButton={true}
        onBackPress={() => navigation.goBack()}
        elevation={true}
      />
      
      <SafeAreaView style={styles.safeContent} edges={['bottom', 'left', 'right']}>
        <View style={styles.form}>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
          
          <Text style={styles.infoText}>{t.form.infoText}</Text>

          <Text style={styles.label}>{t.form.credentialLabel}</Text>
          <TextInput
            style={styles.input}
            value={credential}
            onChangeText={setCredential}
            placeholder={t.form.credentialPlaceholder}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleResetPassword}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? t.form.resetButtonLoading : t.form.resetButton}
            </Text>
          </TouchableOpacity>

          {/* Enlaces de navegación */}
          <View style={styles.linksContainer}>
            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.linkText}>{t.links.backToLogin}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.linkButton}
              onPress={() => navigation.navigate('SignUp')}
            >
              <Text style={styles.linkText}>{t.links.createAccount}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}