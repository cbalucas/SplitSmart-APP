import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function LoginScreen() {
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();
  // Removiendo LanguageContext temporalmente para debugging
  // const { t } = useLanguage();

  const handleLogin = async () => {
    if (!credential) {
      Alert.alert('Error', 'Por favor ingresa tu usuario o email');
      return;
    }

    // Si no hay contraseña ingresada, intentar login sin contraseña (skipPassword)
    const success = await login(credential, password || '');
    if (!success) {
      Alert.alert('Error', 'Credenciales incorrectas. Intenta con:\nUsuario: Demo (sin contraseña)');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>SplitSmart</Text>
        <Text style={styles.subtitle}>Divide gastos inteligentemente</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Usuario o Email</Text>
        <TextInput
          style={styles.input}
          value={credential}
          onChangeText={setCredential}
          placeholder="Demo o demo@splitsmart.com"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Contraseña (Demo no requiere)</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
            placeholder="No requerida para Demo"
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <MaterialCommunityIcons
              name={showPassword ? "eye-off" : "eye"}
              size={24}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading ? true : false}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </Text>
        </TouchableOpacity>

        <View style={styles.demoInfo}>
          <Text style={styles.demoTitle}>🎯 Datos de prueba:</Text>
          <Text style={styles.demoText}>Usuario: Demo</Text>
          <Text style={styles.demoText}>Email: demo@splitsmart.com</Text>
          <Text style={styles.demoText}>✨ Sin contraseña requerida</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4B89DC',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa'
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f8f9fa'
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16
  },
  eyeButton: {
    padding: 12
  },
  button: {
    backgroundColor: '#4B89DC',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  demoInfo: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4B89DC'
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4B89DC',
    marginBottom: 8
  },
  demoText: {
    fontSize: 13,
    color: '#666',
    fontFamily: 'monospace'
  }
});