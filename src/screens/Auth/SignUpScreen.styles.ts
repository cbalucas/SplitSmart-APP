import { StyleSheet } from 'react-native';
import { Theme } from '../../constants/theme';

export const createSignUpStyles = (theme: Theme) => StyleSheet.create({

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

  // ── Card genérica ─────────────────────────────────────────
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },

  // ── Acento superior por sección ───────────────────────────
  cardBasic: {
    borderTopWidth: 4,
    borderTopColor: '#4CAF50',
  },
  cardContact: {
    borderTopWidth: 4,
    borderTopColor: '#4CAF50',
  },
  cardSecurity: {
    borderTopWidth: 4,
    borderTopColor: '#4CAF50',
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

  // ── Separador entre inputs dentro de card ─────────────────
  inputSpacer: {
    height: 12,
  },

  // ── Input con indicador de validación (username) ──────────
  usernameWrapper: {
    position: 'relative',
  },
  usernameIndicator: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 2,
  },
  validationText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    marginLeft: 4,
  },
  validationTextSuccess: {
    color: '#4CAF50',
  },
  validationTextError: {
    color: '#FF5252',
  },

  // ── Tile "Sin contraseña" ──────────────────────────────────
  noPasswordTile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    marginBottom: 16,
    gap: 12,
  },
  noPasswordTileActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryContainer,
  },
  noPasswordTileText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    flex: 1,
  },
  noPasswordTileDesc: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 16,
    flex: 1,
  },
  noPasswordTileTextActive: {
    color: theme.colors.primary,
  },

  // ── Barra de fortaleza de contraseña ─────────────────────
  strengthContainer: {
    marginTop: 6,
    marginBottom: 4,
  },
  strengthBarBg: {
    height: 4,
    backgroundColor: theme.colors.outline,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
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

  // ── Modal "¿Unirte como amigo?" ───────────────────────────
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
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onSurface,
    textAlign: 'center',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
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
    width: 70,
  },
  modalDataValue: {
    fontSize: 14,
    color: theme.colors.onSurface,
    flex: 1,
  },
  modalNoteBox: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    padding: 12,
    marginTop: 16,
    marginBottom: 20,
  },
  modalNoteText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
  modalConfirmButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  modalConfirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
  modalSkipButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalSkipText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
});
