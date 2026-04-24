import { ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../constants/theme';

export const createStyles = (theme: Theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  } as ViewStyle,

  // ── Chat area ──────────────────────────────────────────────
  messagesContainer: {
    flex: 1,
  } as ViewStyle,

  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  } as ViewStyle,

  // ── Burbujas ──────────────────────────────────────────────
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
    gap: 8,
  } as ViewStyle,

  messageRowBot: {
    justifyContent: 'flex-start',
  } as ViewStyle,

  messageRowUser: {
    justifyContent: 'flex-end',
  } as ViewStyle,

  messageRowWarning: {
    justifyContent: 'center',
  } as ViewStyle,

  botAvatar: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  } as ViewStyle,

  bubbleBot: {
    maxWidth: '78%',
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  } as ViewStyle,

  bubbleUser: {
    maxWidth: '78%',
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
  } as ViewStyle,

  bubbleWarning: {
    maxWidth: '90%',
    backgroundColor: '#FF980018',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
    paddingHorizontal: 14,
    paddingVertical: 10,
  } as ViewStyle,

  bubbleLangChange: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderTopWidth: 3,
    borderTopColor: theme.colors.info ?? '#2196F3',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  } as ViewStyle,

  langChangeActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  } as ViewStyle,

  langChangeContinueBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: 'center',
  } as ViewStyle,

  langChangeContinueBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  } as TextStyle,

  langChangeRestartBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.info ?? '#2196F3',
    alignItems: 'center',
  } as ViewStyle,

  langChangeRestartBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  } as TextStyle,

  bubbleSummary: {
    flex: 1,
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: 12,
    borderTopWidth: 4,
    borderTopColor: '#4CAF50',
    paddingHorizontal: 14,
    paddingVertical: 12,
    overflow: 'hidden',
  } as ViewStyle,

  textBot: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurface,
    lineHeight: 20,
  } as TextStyle,

  textUser: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onPrimary,
    lineHeight: 20,
  } as TextStyle,

  textWarning: {
    ...theme.typography.bodySmall,
    color: '#E65100',
    lineHeight: 18,
  } as TextStyle,

  textSummary: {
    ...theme.typography.bodySmall,
    color: theme.colors.onPrimaryContainer,
    lineHeight: 20,
  } as TextStyle,

  textSummaryBold: {
    ...theme.typography.labelLarge,
    color: theme.colors.onPrimaryContainer,
  } as TextStyle,

  // ── Input area ────────────────────────────────────────────
  inputArea: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 4,
    borderTopColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  } as ViewStyle,

  inputSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 2,
  } as ViewStyle,

  inputSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4CAF50',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  } as TextStyle,

  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2,
  } as TextStyle,

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  } as ViewStyle,

  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.colors.background,
    color: theme.colors.onSurface,
    fontSize: 15,
  } as TextStyle,

  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  sendBtnDisabled: {
    backgroundColor: theme.colors.outline,
  } as ViewStyle,

  // ── Action buttons (chips) ────────────────────────────────
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  } as ViewStyle,

  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.background,
  } as ViewStyle,

  actionChipActive: {
    backgroundColor: theme.colors.primaryContainer,
    borderColor: theme.colors.primary,
  } as ViewStyle,

  actionChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  } as TextStyle,

  // ── Participant selector ──────────────────────────────────
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    gap: 10,
    borderRadius: 8,
  } as ViewStyle,

  participantItemSelected: {
    backgroundColor: theme.colors.primaryContainer,
  } as ViewStyle,

  participantName: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.onSurface,
    fontWeight: '500',
  } as TextStyle,

  participantType: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
  } as TextStyle,

  participantListContainer: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  } as ViewStyle,

  participantScrollContent: {
    padding: 4,
  } as ViewStyle,

  // ── Date picker trigger ───────────────────────────────────
  datePickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    gap: 8,
  } as ViewStyle,

  datePickerText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.onSurface,
  } as TextStyle,

  // ── Confirm button ────────────────────────────────────────
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    gap: 8,
  } as ViewStyle,

  confirmBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  } as TextStyle,

  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.error,
    backgroundColor: 'transparent',
    gap: 6,
    marginTop: 2,
  } as ViewStyle,

  restartBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.error,
  } as TextStyle,

  skipLink: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'right',
    paddingBottom: 4,
  } as TextStyle,

  // ── Loading overlay ───────────────────────────────────────
  loadingOverlay: {
    ...({} as ViewStyle),
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  loadingBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    elevation: 8,
  } as ViewStyle,

  loadingText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurface,
  } as TextStyle,
});
