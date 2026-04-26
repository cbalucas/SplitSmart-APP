import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../constants/theme';

export const createStyles = (theme: Theme) => StyleSheet.create({

  // ── Contenedor raíz ──────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  } as ViewStyle,

  safeContent: {
    flex: 1,
  } as ViewStyle,

  scrollView: {
    flex: 1,
  } as ViewStyle,

  scrollViewContent: {
    paddingTop: 16,
    paddingBottom: 16,
  } as ViewStyle,

  // ── Cards con acento de color ─────────────────────────────
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderTopWidth: 4,
    overflow: 'hidden',
  } as ViewStyle,

  cardInfo: {
    borderTopColor: '#FF9800',
  } as ViewStyle,

  cardPayer: {
    borderTopColor: '#FF9800',
  } as ViewStyle,

  cardSplit: {
    borderTopColor: '#FF9800',
  } as ViewStyle,

  cardReceipt: {
    borderTopColor: '#FF9800',
  } as ViewStyle,

  cardCategory: {
    borderTopColor: '#FF9800',
  } as ViewStyle,

  // ── Card header ───────────────────────────────────────────
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  } as ViewStyle,

  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.onSurface,
    flex: 1,
  } as TextStyle,

  cardSubtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 12,
    marginTop: -8,
  } as TextStyle,

  // ── Inputs ────────────────────────────────────────────────
  input: {
    marginBottom: 16,
  } as ViewStyle,

  dateInput: {
    marginBottom: 16,
  } as ViewStyle,

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
  } as ViewStyle,

  inputIcon: {
    marginRight: 12,
  } as ViewStyle,

  inputContent: {
    flex: 1,
  } as ViewStyle,

  inputLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2,
  } as TextStyle,

  inputValue: {
    ...theme.typography.bodyLarge,
    color: theme.colors.onSurface,
  } as TextStyle,

  // ── Calculadora inline ────────────────────────────────────
  amountInputContainer: {
    position: 'relative',
  } as ViewStyle,

  currencySuffix: {
    position: 'absolute',
    right: 68,
    top: 40,
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  } as TextStyle,

  calcButton: {
    position: 'absolute',
    right: 12,
    top: 32,
    padding: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.primaryContainer,
  } as ViewStyle,

  // ── Toggle multipagadores ─────────────────────────────────
  multiPayerToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
    marginBottom: 12,
  } as ViewStyle,

  multiPayerToggleLabel: {
    ...theme.typography.labelLarge,
    fontWeight: '600',
    color: theme.colors.onSurface,
  } as TextStyle,

  multiPayerToggleSubtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  } as TextStyle,

  multiPayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
  } as ViewStyle,

  multiPayerAmountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 90,
  } as ViewStyle,

  multiPayerAmountPrefix: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 13,
    marginRight: 4,
  } as TextStyle,

  multiPayerAmountInput: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurface,
    minWidth: 60,
    padding: 0,
  } as TextStyle,

  multiPayerSumBanner: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  } as ViewStyle,

  multiPayerSumText: {
    fontSize: 13,
    fontWeight: '500',
  } as TextStyle,

  // ── Pagador único ─────────────────────────────────────────
  participantOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  } as ViewStyle,

  participantOptionActive: {
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: 8,
    paddingHorizontal: 8,
  } as ViewStyle,

  payerParticipantName: {
    ...theme.typography.bodyLarge,
    color: theme.colors.onSurface,
    marginLeft: 12,
  } as TextStyle,

  // ── Participantes / split ─────────────────────────────────
  sectionLabel: {
    ...theme.typography.labelLarge,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: 12,
  } as TextStyle,

  participantsList: {
    marginTop: 4,
  } as ViewStyle,

  unifiedParticipantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
  } as ViewStyle,

  unifiedParticipantRowExcluded: {
    opacity: 0.6,
  } as ViewStyle,

  participantToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,

  participantName: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 10,
    flex: 1,
  } as TextStyle,

  participantNameActive: {
    color: theme.colors.onSurface,
    fontWeight: '500',
  } as TextStyle,

  participantNameExcluded: {
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  } as TextStyle,

  participantAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 80,
  } as ViewStyle,

  amountText: {
    ...theme.typography.bodyMedium,
    fontWeight: '600',
    color: theme.colors.primary,
  } as TextStyle,

  excludedLabel: {
    fontSize: 12,
    color: theme.colors.onErrorContainer,
    backgroundColor: theme.colors.errorContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    fontWeight: '500',
  } as TextStyle,

  warningText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.error,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 8,
  } as TextStyle,

  totalSummary: {
    marginTop: 12,
    padding: 12,
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: 10,
  } as ViewStyle,

  totalSummaryText: {
    ...theme.typography.bodyLarge,
    fontWeight: '700',
    color: theme.colors.onPrimaryContainer,
    textAlign: 'center',
  } as TextStyle,

  // ── Categorías ────────────────────────────────────────────
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  } as ViewStyle,

  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.outline,
    minWidth: '45%',
    flex: 1,
  } as ViewStyle,

  categoryButtonActive: {
    backgroundColor: theme.colors.primaryContainer,
  } as ViewStyle,

  categoryButtonText: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 8,
    flex: 1,
  } as TextStyle,

  categoryButtonTextActive: {
    color: theme.colors.onPrimaryContainer,
    fontWeight: '600',
  } as TextStyle,

  // ── Comprobante ───────────────────────────────────────────
  receiptActionRow: {
    flexDirection: 'row',
    gap: 8,
  } as ViewStyle,

  receiptActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  } as ViewStyle,

  receiptAttachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.outline,
    borderStyle: 'dashed',
    gap: 8,
  } as ViewStyle,

  receiptBtnText: {
    ...theme.typography.labelLarge,
    fontWeight: '500',
  } as TextStyle,

  // ── Selector tipo de división (tabs) ──────────────────────
  splitTypeSelector: {
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceVariant,
  } as ViewStyle,

  splitTypeSelectorLabel: {
    ...theme.typography.labelMedium,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
    fontWeight: '500',
  } as TextStyle,

  splitTypeChipsRow: {
    flexDirection: 'row',
  } as ViewStyle,

  splitTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  } as ViewStyle,

  splitTypeChipActive: {
    borderBottomColor: theme.colors.primary,
  } as ViewStyle,

  splitTypeChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
  } as TextStyle,

  splitTypeChipTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  } as TextStyle,

  // ── Inputs por participante (modos % y fijo) ──────────────
  splitInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 110,
    justifyContent: 'flex-end',
  } as ViewStyle,

  splitInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 72,
  } as ViewStyle,

  splitInputText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurface,
    minWidth: 48,
    padding: 0,
    textAlign: 'right',
  } as TextStyle,

  splitInputSuffix: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 2,
    fontWeight: '500',
  } as TextStyle,

  splitInputPrefix: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  } as TextStyle,

  splitCalcAmount: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    minWidth: 52,
    textAlign: 'right',
  } as TextStyle,

  // ── Banner de validación de splits ────────────────────────
  splitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  } as ViewStyle,

  splitBannerText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  } as TextStyle,

  // ── Errores ───────────────────────────────────────────────
  errorText: {
    ...theme.typography.bodySmall,
    color: theme.colors.error,
    marginTop: 4,
  } as TextStyle,

  footerSpace: {
    height: 16,
  } as ViewStyle,

  // ── Footer sticky ─────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    gap: 12,
  } as ViewStyle,

  cancelButton: {
    flex: 1,
  } as ViewStyle,

  createButton: {
    flex: 1,
  } as ViewStyle,

  // ── Calculadora Modal ─────────────────────────────────────
  calcOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  } as ViewStyle,

  calcModal: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    backgroundColor: theme.colors.surface,
  } as ViewStyle,

  calcDisplay: {
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    alignItems: 'flex-end',
  } as ViewStyle,

  calcExpressionText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
    minHeight: 22,
  } as TextStyle,

  calcResultText: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.onSurface,
    letterSpacing: 1,
  } as TextStyle,

  calcResultError: {
    color: theme.colors.error,
    fontSize: 28,
  } as TextStyle,

  calcRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 8,
  } as ViewStyle,

  calcKey: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  } as ViewStyle,

  calcKeyWide: {
    flex: 2,
    aspectRatio: undefined,
    paddingVertical: 14,
  } as ViewStyle,

  calcKeyEmpty: {
    flex: 1,
  } as ViewStyle,

  calcKeyOperator: {
    backgroundColor: theme.colors.primaryContainer,
  } as ViewStyle,

  calcKeyClear: {
    backgroundColor: theme.colors.errorContainer,
  } as ViewStyle,

  calcKeyBackspace: {
    backgroundColor: theme.colors.secondaryContainer,
  } as ViewStyle,

  calcKeyText: {
    fontSize: 22,
    fontWeight: '500',
    color: theme.colors.onSurface,
  } as TextStyle,

  calcKeyTextOperator: {
    color: theme.colors.primary,
    fontWeight: '700',
  } as TextStyle,

  calcKeyTextClear: {
    color: theme.colors.error,
    fontWeight: '700',
  } as TextStyle,

  calcFooter: {
    flexDirection: 'row',
    margin: 12,
    marginTop: 8,
    gap: 8,
    paddingBottom: 4,
  } as ViewStyle,

  calcFooterBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  calcFooterBtnBack: {
    flex: 1,
    backgroundColor: theme.colors.surfaceVariant,
  } as ViewStyle,

  calcFooterBtnUse: {
    flex: 2,
    backgroundColor: theme.colors.primary,
  } as ViewStyle,

  calcFooterBtnDisabled: {
    opacity: 0.45,
  } as ViewStyle,

  calcFooterBtnBackText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  } as TextStyle,

  calcFooterBtnUseText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  } as TextStyle,
});
