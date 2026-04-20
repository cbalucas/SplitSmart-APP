import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';
import { Theme } from '../../constants/theme';

export const createStyles = (theme: Theme, insets: EdgeInsets) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  } as ViewStyle,

  safeContent: {
    flex: 1,
    paddingTop: 0,
  } as ViewStyle,

  scrollView: {
    flex: 1,
  } as ViewStyle,

  scrollViewContent: {
    paddingTop: 16,
    paddingBottom: 32,
  } as ViewStyle,

  // Cards
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  } as ViewStyle,

  cardInfo: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderTopWidth: 4,
    borderTopColor: '#2196F3',
    overflow: 'hidden',
  } as ViewStyle,

  cardConfig: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderTopWidth: 4,
    borderTopColor: '#FF9800',
    overflow: 'hidden',
  } as ViewStyle,

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

  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 16,
  } as TextStyle,

  // Inputs
  input: {
    marginBottom: 16,
  } as ViewStyle,

  dateInput: {
    marginBottom: 16,
  } as ViewStyle,

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  } as ViewStyle,

  inputIcon: {
    marginRight: 12,
  } as ViewStyle,

  inputContent: {
    flex: 1,
  } as ViewStyle,

  inputLabel: {
    ...theme.typography.labelLarge,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  } as TextStyle,

  inputLabelError: {
    color: '#FF5252',
  } as TextStyle,

  requiredStar: {
    color: '#FF5252',
    fontWeight: '700',
  } as TextStyle,

  inputValue: {
    ...theme.typography.bodyLarge,
    color: theme.colors.onSurface,
  } as TextStyle,

  placeholder: {
    color: theme.colors.onSurfaceVariant,
  } as TextStyle,

  errorText: {
    ...theme.typography.bodySmall,
    color: theme.colors.error,
    marginTop: 4,
  } as TextStyle,

  // Currency
  currencyRow: {
    marginBottom: 16,
  } as ViewStyle,

  currencyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  } as ViewStyle,

  currencyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: 'center',
  } as ViewStyle,

  currencyButtonActive: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  } as ViewStyle,

  currencyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  } as ViewStyle,

  currencyFlag: {
    fontSize: 20,
  } as TextStyle,

  currencyText: {
    ...theme.typography.labelLarge,
    color: theme.colors.onSurfaceVariant,
  } as TextStyle,

  currencyTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  } as TextStyle,

  // Radio buttons for event type
  radioRow: {
    marginBottom: 16,
  } as ViewStyle,

  radioTileRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    marginBottom: 16,
  } as ViewStyle,

  radioTile: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
    gap: 4,
  } as ViewStyle,

  radioTileActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryContainer,
  } as ViewStyle,

  radioTileText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    textAlign: 'center',
  } as TextStyle,

  radioTileDesc: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 14,
  } as TextStyle,

  // Config card — collapsed summary
  configSummaryRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  } as ViewStyle,

  configSummaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  } as ViewStyle,

  configSummaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  } as TextStyle,

  configSummaryFlag: {
    fontSize: 16,
  } as TextStyle,

  // Config card — cards cíclicas al estilo ProfileScreen infoNavCard
  prefGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 4,
  } as ViewStyle,

  prefCard: {
    flex: 1,
    height: 82,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 12,
    paddingHorizontal: 8,
    borderTopWidth: 3,
    gap: 5,
    overflow: 'hidden',
  } as ViewStyle,

  prefCardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.onSurface,
    textAlign: 'center',
  } as TextStyle,

  radioButtons: {
    marginTop: 8,
  } as ViewStyle,

  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  } as ViewStyle,

  radioButtonActive: {
    backgroundColor: theme.colors.primaryContainer,
    borderColor: theme.colors.primary,
  } as ViewStyle,

  radioText: {
    ...theme.typography.bodyLarge,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginLeft: 12,
  } as TextStyle,

  radioDescription: {
    ...theme.typography.bodyMedium,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 28,
    marginTop: 4,
  } as TextStyle,

  // Category buttons
  categoryRow: {
    marginBottom: 16,
  } as ViewStyle,

  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  } as ViewStyle,

  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface,
  } as ViewStyle,

  categoryButtonActive: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
  } as ViewStyle,

  categoryButtonText: {
    ...theme.typography.bodySmall,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 4,
  } as TextStyle,

  categoryButtonTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  } as TextStyle,

  // Footer
  footerSpace: {
    height: 10,
  } as ViewStyle,

  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
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

  // Radio options for detailed event types
  radioOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 4,
  } as ViewStyle,

  radioContent: {
    flex: 1,
    marginLeft: 12,
  } as ViewStyle,

  radioTitle: {
    ...theme.typography.bodyLarge,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: 4,
  } as TextStyle,
});
