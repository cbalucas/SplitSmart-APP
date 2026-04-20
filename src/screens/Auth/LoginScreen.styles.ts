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
    width: 90,
    height: 90,
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
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    gap: 12,
  },
  footerButtonFlex: {
    flex: 1,
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
