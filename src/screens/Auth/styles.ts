import { StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';

export const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface
  },
  safeContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'center'
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: 4
  },
  appIcon: {
    width: 150,
    height: 150,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#FFFFFF'
  },
  form: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: 16,
    padding: 24,
    elevation: 4,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
    marginTop: 16
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.colors.surfaceVariant,
    color: theme.colors.onSurface
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: theme.colors.onSurface
  },
  eyeButton: {
    padding: 12
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: '600'
  },
  demoInfoButton: {
    marginTop: 24,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    overflow: 'hidden'
  },
  demoInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16
  },
  demoInfoContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary
  },
  demoText: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    fontFamily: 'monospace',
    marginBottom: 4
  },
  futureFeaturesButton: {
    marginTop: 12,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    overflow: 'hidden'
  },
  futureFeaturesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16
  },
  futureFeaturesContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0
  },
  futureFeaturesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary
  },
  futureFeaturesText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
    fontStyle: 'italic'
  },
  // Estilos adicionales para SignUp y ForgotPassword
  scrollView: {
    flex: 1
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: 0.5
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface
  },
  modalCloseButton: {
    padding: 4
  },
  modalBody: {
    marginBottom: 24
  },
  modalButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center'
  },
  modalButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: '600'
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    paddingHorizontal: 8
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 16
  },
  linkText: {
    fontSize: 14,
    color: theme.colors.primary,
    textDecorationLine: 'underline'
  },
  demoLinkButton: {
    alignItems: 'flex-start',
    marginTop: 16
  },
  demoLinkText: {
    fontSize: 14,
    color: theme.colors.primary,
    textDecorationLine: 'none'
  },
  linksContainer: {
    gap: 8,
    marginTop: 8
  },
  // Estilos para validación de username
  inputWithIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative'
  },
  inputWithIcon: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.colors.surfaceVariant,
    color: theme.colors.onSurface
  },
  inputValid: {
    borderColor: '#4CAF50'
  },
  inputInvalid: {
    borderColor: '#FF5252'
  },
  validationIndicator: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center'
  },
  validationText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4
  },
  validationTextSuccess: {
    color: '#4CAF50'
  },
  validationTextError: {
    color: '#FF5252'
  },
  // Estilos para checkbox
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8
  },
  checkboxText: {
    fontSize: 14,
    color: theme.colors.onSurface,
    marginLeft: 8,
    flex: 1
  },
  // Estilos para indicador de fortaleza de contraseña
  passwordStrengthContainer: {
    marginTop: 8,
    marginBottom: 8
  },
  passwordStrengthBar: {
    height: 4,
    backgroundColor: theme.colors.outline,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4
  },
  passwordStrengthFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.3s ease'
  },
  passwordStrengthText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right'
  }
});