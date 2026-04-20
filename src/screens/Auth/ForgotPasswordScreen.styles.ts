import { StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';

export const createForgotPasswordStyles = (theme: Theme) => StyleSheet.create({

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

  // ── Card ─────────────────────────────────────────────────
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderTopWidth: 4,
    borderTopColor: '#9C27B0',
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

  // ── Info box ─────────────────────────────────────────────
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
    padding: 14,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.onSurfaceVariant,
    flex: 1,
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

  // ── Link de "¿No tienes cuenta?" ─────────────────────────
  linkRow: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  linkText: {
    fontSize: 13,
    color: theme.colors.primary,
  },

  // ── Modal: contraseña generada ────────────────────────────
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
    borderTopColor: '#4CAF50',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    color: theme.colors.onSurface,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 20,
  },

  // ── Caja de la contraseña generada ───────────────────────
  passwordBox: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceVariant,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  passwordBoxLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 10,
  },
  passwordBoxText: {
    fontSize: 26,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 4,
    textAlign: 'center',
    color: theme.colors.primary,
  },

  // ── Warning box (naranja) ─────────────────────────────────
  warningBox: {
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6D00',
    backgroundColor: theme.colors.surfaceVariant,
    padding: 12,
    marginBottom: 14,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    color: '#E65100',
  },

  // ── Hint del modal ────────────────────────────────────────
  modalHint: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    fontStyle: 'italic',
    color: theme.colors.onSurfaceVariant,
  },

  // ── Botón primario del modal ──────────────────────────────
  modalButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
});
