import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../constants/theme';
import { getAppColors } from '../../constants/colors';

export const createStyles = (theme: Theme) => {
  const isDarkMode = theme.colors.surface !== '#FFFFFF';
  const appColors = getAppColors(isDarkMode);

  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  } as ViewStyle,

  safeContent: {
    flex: 1,
  } as ViewStyle,



  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  } as ViewStyle,

  scrollViewContent: {
    paddingVertical: 20,
  } as ViewStyle,

  card: {
    backgroundColor: appColors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: appColors.borderPrimary,
    shadowColor: appColors.special.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  } as ViewStyle,

  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 16,
  } as TextStyle,

  cardSubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 16,
    fontStyle: 'italic',
  } as TextStyle,

  input: {
    marginBottom: 16,
  } as ViewStyle,

  searchContainer: {
    position: 'relative',
    marginBottom: 4,
  } as ViewStyle,

  searchInput: {
    flex: 1,
  } as ViewStyle,

  clearButton: {
    position: 'absolute',
    right: 12,
    top: 42,
    padding: 4,
    zIndex: 1,
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
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2,
  } as TextStyle,

  inputValue: {
    fontSize: 16,
    color: theme.colors.onSurface,
  } as TextStyle,

  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: 12,
  } as TextStyle,

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  } as ViewStyle,

  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    minWidth: '45%',
  } as ViewStyle,

  categoryButtonActive: {
    backgroundColor: theme.colors.primaryContainer,
    borderColor: theme.colors.primaryContainer,
  } as ViewStyle,

  categoryButtonText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 6,
  } as TextStyle,

  categoryButtonTextActive: {
    color: theme.colors.onPrimaryContainer,
  } as TextStyle,

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
    fontSize: 16,
    color: theme.colors.onSurface,
    marginLeft: 12,
  } as TextStyle,

  // Estilos para la vista previa de división
  splitPreview: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    padding: 12,
  } as ViewStyle,

  splitPreviewTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  } as TextStyle,

  splitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  } as ViewStyle,

  splitParticipant: {
    fontSize: 14,
    color: theme.colors.onSurface,
  } as TextStyle,

  splitParticipantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,

  splitAmountInfo: {
    alignItems: 'flex-end',
  } as ViewStyle,

  peopleCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  } as ViewStyle,

  peopleCountBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  } as TextStyle,

  peopleCountBadgeTextOverride: {
    color: theme.colors.error,
  } as TextStyle,

  overrideButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: theme.colors.surfaceVariant,
  } as ViewStyle,

  splitAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
  } as TextStyle,

  splitPercentage: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  } as TextStyle,

  // Estilos para la selección unificada de participantes
  participantsList: {
    marginTop: 16,
  } as ViewStyle,

  unifiedParticipantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline + '60',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginBottom: 2,
  } as ViewStyle,

  unifiedParticipantRowExcluded: {
    opacity: 0.7,
    backgroundColor: theme.colors.surfaceVariant + '30',
  } as ViewStyle,

  participantToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  } as ViewStyle,

  participantName: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 12,
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
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  } as TextStyle,

  excludedLabel: {
    fontSize: 12,
    color: theme.colors.onErrorContainer,
    backgroundColor: theme.colors.errorContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.error,
    fontWeight: '500',
  } as TextStyle,

  warningText: {
    fontSize: 14,
    color: theme.colors.error,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 8,
  } as TextStyle,

  totalSummary: {
    marginTop: 16,
    padding: 14,
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.primary + '40',
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,

  totalSummaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onPrimaryContainer,
    textAlign: 'center',
  } as TextStyle,

  splitSummary: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline + '60',
  } as ViewStyle,

  splitSummaryText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  } as TextStyle,

  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 4,
  } as TextStyle,

  footerSpace: {
    height: 16,
  } as ViewStyle,

  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
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

  amountInputContainer: {
    position: 'relative',
  } as ViewStyle,

  currencySuffix: {
    position: 'absolute',
    right: 16,
    top: 40,
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  } as TextStyle,
});
};