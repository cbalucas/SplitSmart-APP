import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface State {
  hasError: boolean;
}

/**
 * Captura errores de render para que un fallo no cierre la app sin aviso.
 * Está por fuera de los providers de tema/idioma, por eso no depende de ellos
 * y muestra el mensaje en ambos idiomas.
 */
export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Solo en desarrollo; en producción los logs se eliminan en el build.
    if (__DEV__) console.error('ErrorBoundary:', error, info.componentStack);
  }

  private reset = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Algo salió mal / Something went wrong</Text>
        <Text style={styles.text}>
          Ocurrió un error inesperado. Tus datos están a salvo.{'\n'}
          An unexpected error occurred. Your data is safe.
        </Text>
        <TouchableOpacity style={styles.button} onPress={this.reset} accessibilityRole="button">
          <Text style={styles.buttonText}>Reintentar / Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#4B89DC' },
  title: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 12, textAlign: 'center' },
  text: { fontSize: 15, color: '#fff', textAlign: 'center', marginBottom: 24 },
  button: { backgroundColor: '#fff', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#4B89DC', fontWeight: '700', fontSize: 16 },
});
