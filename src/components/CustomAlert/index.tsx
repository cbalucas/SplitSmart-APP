import React, { useState, useCallback, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { registerAlertHandler, registerDismissHandler, AlertOptions, AlertButton, AlertType } from '../../services/alertService';

const ACCENT: Record<AlertType, string> = {
  error:       '#D32F2F',
  destructive: '#B71C1C',
  warning:     '#E65100',
  success:     '#388E3C',
  confirm:     '#1565C0',
  info:        '#0277BD',
};

interface State extends AlertOptions {
  visible: boolean;
}

const DEFAULT_STATE: State = {
  visible: false,
  title: '',
  message: undefined,
  buttons: undefined,
  type: 'info',
};

export default function CustomAlertContainer() {
  const { theme } = useTheme();
  const [state, setState] = useState<State>(DEFAULT_STATE);

  const show = useCallback((options: AlertOptions) => {
    setState({ ...options, visible: true, type: options.type ?? 'info' });
  }, []);

  const dismiss = () => setState(DEFAULT_STATE);

  useEffect(() => {
    registerAlertHandler(show);
    registerDismissHandler(dismiss);
  }, [show]);

  const handleButton = (btn: AlertButton) => {
    dismiss();
    btn.onPress?.();
  };

  const accentColor = ACCENT[state.type ?? 'info'];
  const { width } = Dimensions.get('window');
  const buttons: AlertButton[] = state.buttons?.length
    ? state.buttons
    : [{ text: 'OK', style: 'default' }];

  const cancelBtn = buttons.find(b => b.style === 'cancel');
  const actionBtns = buttons.filter(b => b.style !== 'cancel');

  return (
    <Modal
      visible={state.visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={state.isLoading ? undefined : dismiss}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={state.isLoading ? undefined : (cancelBtn ? () => handleButton(cancelBtn) : dismiss)}
      >
        <TouchableOpacity activeOpacity={1}>
          <View
            style={[
              styles.container,
              {
                backgroundColor: theme.colors.surface,
                borderColor: accentColor,
                maxWidth: Math.min(320, width * 0.85),
              },
            ]}
          >
            {/* Spinner (modo loading) */}
            {state.isLoading && (
              <View style={styles.loadingContent}>
                <ActivityIndicator size="large" color={accentColor} />
                <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>
                  {state.title}
                </Text>
              </View>
            )}

            {/* Contenido normal (modo alerta) */}
            {!state.isLoading && (
              <>
                {/* Título */}
                <Text style={[styles.title, { color: theme.colors.onSurface }]}>
                  {state.title}
                </Text>

                {/* Mensaje */}
                {!!state.message && (
                  <Text style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
                    {state.message}
                  </Text>
                )}

                {/* Separador */}
                <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

                {/* Botones */}
                <View style={[styles.buttonsRow, buttons.length > 2 && styles.buttonsColumn]}>
                  {cancelBtn && (
                    <TouchableOpacity
                      style={[styles.btn, styles.btnCancel, { borderColor: theme.colors.outline }]}
                      onPress={() => handleButton(cancelBtn)}
                    >
                      <Text style={[styles.btnText, { color: theme.colors.onSurfaceVariant }]}>
                        {cancelBtn.text}
                      </Text>
                    </TouchableOpacity>
                  )}
                  {actionBtns.map((btn, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.btn,
                        styles.btnAction,
                        { borderColor: accentColor },
                      ]}
                  onPress={() => handleButton(btn)}
                >
                  <Text style={[styles.btnText, styles.btnActionText, { color: accentColor }]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    borderWidth: 2,
    borderRadius: 14,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    width: '100%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 4,
  },
  divider: {
    height: 1,
    marginVertical: 14,
    opacity: 0.4,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  buttonsColumn: {
    flexDirection: 'column',
  },
  btn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnCancel: {
    backgroundColor: 'transparent',
  },
  btnAction: {
    backgroundColor: 'transparent',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  btnActionText: {
    fontWeight: '700',
  },
  loadingContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 14,
    textAlign: 'center',
  },
});
