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
    paddingBottom: 32,
  } as ViewStyle,

  // Cards
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  } as ViewStyle,

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
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  } as TextStyle,

  inputValue: {
    fontSize: 16,
    color: theme.colors.onSurface,
  } as TextStyle,

  placeholder: {
    color: theme.colors.onSurfaceVariant,
  } as TextStyle,

  errorText: {
    fontSize: 12,
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
    fontSize: 14,
    fontWeight: '500',
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
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginLeft: 12,
  } as TextStyle,

  radioDescription: {
    fontSize: 14,
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
    fontSize: 12,
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
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: 4,
  } as TextStyle,
});
