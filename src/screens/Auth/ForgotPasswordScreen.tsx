import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Image, Platform, Modal, StyleSheet } from 'react-native';
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
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { language } = useLanguage();
  
  const styles = createStyles(theme);
  const t = forgotPasswordLanguage[language as keyof typeof forgotPasswordLanguage] || forgotPasswordLanguage.es;

  const fp = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    successModal: {
      backgroundColor: theme.colors.surface,
      borderRadius: 20,
      padding: 28,
      width: '100%',
      elevation: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      textAlign: 'center',
      color: theme.colors.onSurface,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      textAlign: 'center',
      color: theme.colors.onSurfaceVariant,
      marginBottom: 20,
      lineHeight: 20,
    },
    passwordBox: {
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surfaceVariant,
      padding: 20,
      alignItems: 'center',
      marginBottom: 16,
    },
    passwordLabel: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 10,
    },
    passwordText: {
      fontSize: 26,
      fontWeight: '800',
      fontFamily: 'monospace',
      letterSpacing: 4,
      textAlign: 'center',
      color: theme.colors.primary,
    },
    warningBox: {
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#FF6D00',
      backgroundColor: '#FFF3E0',
      padding: 12,
      marginBottom: 14,
    },
    warningText: {
      fontSize: 13,
      fontWeight: '600',
      textAlign: 'center',
      lineHeight: 19,
      color: '#E65100',
    },
    hint: {
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 22,
      fontStyle: 'italic',
      color: theme.colors.onSurfaceVariant,
    },
    confirmButton: {
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
    },
    confirmButtonText: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.onPrimary,
    },
  });

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

      // Mostrar modal con la nueva contraseña
      setGeneratedPassword(tempPassword);

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

  const isDarkMode = theme.colors.surface !== '#FFFFFF';

  return (
    <View style={styles.container}>

      {/* Modal de contraseña generada */}
      <Modal
        visible={generatedPassword !== null}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={fp.modalOverlay}>
          <View style={fp.successModal}>
            <Text style={fp.title}>{t.success.title}</Text>

            <Text style={fp.subtitle}>{t.success.message}</Text>

            {/* Caja de la contraseña */}
            <View style={fp.passwordBox}>
              <Text style={fp.passwordLabel}>{t.success.tempPassword}</Text>
              <Text style={fp.passwordText} selectable>{generatedPassword}</Text>
            </View>

            {/* Aviso importante */}
            <View style={fp.warningBox}>
              <Text style={fp.warningText}>{t.success.noteHint}</Text>
            </View>

            <Text style={fp.hint}>{t.success.changePassword}</Text>

            <TouchableOpacity
              style={fp.confirmButton}
              onPress={() => {
                setGeneratedPassword(null);
                navigation.navigate('Login');
              }}
            >
              <Text style={fp.confirmButtonText}>{t.success.goToLogin}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <HeaderBar
        title={t.title}
        titleAlignment="left"
        useDynamicColors={true}
        showThemeToggle={true}
        showLanguageSelector={true}
        showHelp={true}
        showBackButton={false}
        elevation={true}
      />
      
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.safeContent} edges={['bottom', 'left', 'right']}>
        <View style={styles.iconSection}>
          <Image
            source={require('../../../assets/splitsmart/splash-icon-app_google.png')}
            style={styles.appIcon}
            resizeMode="contain"
          />
        </View>
        <View style={styles.form}>
          
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
      </KeyboardAvoidingView>
    </View>
  );
}