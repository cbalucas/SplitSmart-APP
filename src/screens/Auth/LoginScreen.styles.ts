import { StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';

export const createLoginStyles = (theme: Theme) => StyleSheet.create({

  // ── Contenedor raíz ──────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // ── Keyboard + SafeArea wrapper ─────────────────────────
  keyboardWrapper: {
    flex: 1,
  },
  safeContent: {
    flex: 1,
  },

  // ── ScrollView ───────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 32,
  },

  // ── Logo ─────────────────────────────────────────────────
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  appIcon: {
    width: 180,
    height: 180,
  },

  // ── Card: credencial ─────────────────────────────────────
  cardCredential: {
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderTopWidth: 4,
    borderTopColor: '#2196F3',
  },

  // ── Card: contraseña ─────────────────────────────────────
  cardPassword: {
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderTopWidth: 4,
    borderTopColor: '#FF9800',
  },

  // ── Header de card ────────────────────────────────────────
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.onSurface,
    flex: 1,
  },

  // ── Chip "Datos demo" ─────────────────────────────────────
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  demoChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },

  // ── Link "¿Olvidaste tu contraseña?" ─────────────────────
  forgotPasswordRow: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: theme.colors.primary,
  },

  // ── Footer fijo ───────────────────────────────────────────
  footer: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    gap: 10,
  },

  // ── Fila superior: Login + Biométrico ────────────────────
  authRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  loginButtonWrap: {
    flex: 2,
  },

  // ── Separador "o" ─────────────────────────────────────────
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.outline,
  },
  dividerText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },

  // ── Botón Google ──────────────────────────────────────────
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
  },
  googleButtonText: {
    color: theme.colors.onSurface,
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Botón biométrico (1/3 del ancho de la fila) ────────────────
  biometricButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
  },

  // ── Link "¿No tienes cuenta?" ─────────────────────────────
  linkRow: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  linkText: {
    fontSize: 13,
    color: theme.colors.primary,
  },

  // ── Último usuario recordado ──────────────────────────────
  lastUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
    marginBottom: 4,
  },
  lastUserAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lastUserAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
  lastUserInfo: {
    flex: 1,
  },
  lastUserName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  lastUserUsername: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  changeUserLink: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
  },

  // ── Picker de usuarios (modal cambiar cuenta) ─────────────
  userPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  userPickerItemActive: {
    backgroundColor: theme.colors.primary + '18',
  },
  userPickerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  userPickerAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
  userPickerInfo: {
    flex: 1,
  },
  userPickerName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  userPickerUsername: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 1,
  },
  userPickerSeparator: {
    height: 1,
    backgroundColor: theme.colors.outline + '30',
    marginVertical: 2,
  },

  // ── Modal datos demo ─────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderTopWidth: 4,
    borderTopColor: theme.colors.primary,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onSurface,
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline + '40',
    gap: 10,
  },
  modalDataLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
    width: 80,
  },
  modalDataValue: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: theme.colors.onSurface,
    flex: 1,
  },
  modalButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
});
