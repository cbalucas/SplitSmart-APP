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

    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: appColors.surface,
      marginHorizontal: 0,
      marginTop: 0,
      marginBottom: 8,
      borderRadius: 0,
      borderBottomWidth: 1,
      borderColor: appColors.borderPrimary,
      overflow: 'hidden',
    } as ViewStyle,

    tab: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    activeTab: {
      backgroundColor: 'transparent',
      borderBottomWidth: 3,
      borderBottomColor: isDarkMode ? appColors.primary : appColors.primary,
    } as ViewStyle,

    inactiveTab: {
      backgroundColor: 'transparent',
      borderBottomWidth: 3,
      borderBottomColor: 'transparent',
    } as ViewStyle,

    tabText: {
      ...theme.typography.labelLarge,
      fontWeight: '600',
    } as TextStyle,

    activeTabText: {
      ...theme.typography.labelLarge,
      color: appColors.primary,
      fontWeight: '600',
    } as TextStyle,

    inactiveTabText: {
      ...theme.typography.labelLarge,
      color: appColors.textSecondary,
      fontWeight: '600',
    } as TextStyle,

    tabContent: {
      flex: 1,
    } as ViewStyle,





    newFriendContainer: {
      flex: 1,
      padding: 16,
    } as ViewStyle,

    addFormCard: {
      backgroundColor: appColors.surface,
      borderRadius: 12,
      padding: 20,
      shadowColor: appColors.special.shadow,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: appColors.borderPrimary,
    } as ViewStyle,

    addFormTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: appColors.textPrimary,
      marginBottom: 16,
      textAlign: 'center',
    } as TextStyle,

    inputGroup: {
      marginBottom: 16,
    } as ViewStyle,

    inputLabel: {
      ...theme.typography.labelLarge,
      color: appColors.textPrimary,
      marginBottom: 6,
    } as TextStyle,

    inputLabelError: {
      color: '#FF5252',
    } as TextStyle,

    errorText: {
      color: '#FF5252',
      ...theme.typography.bodySmall,
      marginTop: 4,
    } as TextStyle,

    inputWithIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'relative',
    } as ViewStyle,

    inputValid: {
      borderColor: '#4CAF50',
    } as ViewStyle,

    inputInvalid: {
      borderColor: '#FF5252',
    } as ViewStyle,

    validationIndicator: {
      position: 'absolute',
      right: 12,
      height: '100%',
      justifyContent: 'center',
    } as ViewStyle,

    validationText: {
      ...theme.typography.bodySmall,
      marginTop: 4,
      marginLeft: 2,
    } as TextStyle,

    validationTextSuccess: {
      color: '#4CAF50',
    } as TextStyle,

    validationTextError: {
      color: '#FF5252',
    } as TextStyle,

    requiredStar: {
      color: '#FF5252',
      fontWeight: '700',
    } as TextStyle,

    input: {
      backgroundColor: appColors.surfaceSecondary,
      borderWidth: 1,
      borderColor: appColors.borderPrimary,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: appColors.textPrimary,
    } as ViewStyle,

    formButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    } as ViewStyle,

    cancelButton: {
      flex: 0.48,
    } as ViewStyle,

    saveButton: {
      flex: 0.48,
    } as ViewStyle,

    listContainer: {
      paddingHorizontal: 16,
    } as ViewStyle,

    friendItem: {
      backgroundColor: appColors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: appColors.borderPrimary,
      shadowColor: appColors.special.shadow,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    } as ViewStyle,

    friendHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    } as ViewStyle,

    friendMainInfo: {
      flex: 1,
    } as ViewStyle,

    aliasRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      marginLeft: 0,
    } as ViewStyle,

    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
    } as ViewStyle,

    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    } as ViewStyle,

    contactSeparator: {
      fontSize: 14,
      color: appColors.textSecondary,
      marginHorizontal: 12,
      fontWeight: 'bold',
    } as TextStyle,

    contactIcon: {
      marginRight: 6,
    } as ViewStyle,

    friendName: {
      ...theme.typography.titleMedium,
      fontWeight: '600',
      color: appColors.textPrimary,
    } as TextStyle,

    friendEmail: {
      fontSize: 13,
      color: appColors.textSecondary,
      flex: 1,
    } as TextStyle,

    friendAlias: {
      ...theme.typography.labelLarge,
      color: appColors.primary,
      marginTop: 2,
      fontWeight: '500',
    } as TextStyle,

    friendPhone: {
      fontSize: 13,
      color: appColors.textSecondary,
      flex: 1,
    } as TextStyle,

    actionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: appColors.surfaceSecondary,
    } as ViewStyle,

    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    } as ViewStyle,

    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: appColors.textPrimary,
      marginTop: 16,
      textAlign: 'center',
    } as TextStyle,

    emptySubtitle: {
      ...theme.typography.bodyLarge,
      color: appColors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    } as TextStyle,

    emptyButton: {
      marginTop: 24,
    } as ViewStyle,
  });
};