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
  }
});