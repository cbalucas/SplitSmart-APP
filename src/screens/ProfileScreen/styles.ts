import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../constants/theme';

export const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    } as ViewStyle,

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    } as ViewStyle,

    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      flex: 1,
    } as TextStyle,

    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    } as ViewStyle,

    editButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    scrollView: {
      flex: 1,
    } as ViewStyle,

    scrollViewContent: {
      padding: 20,
    } as ViewStyle,

    card: {
      marginBottom: 16,
    } as ViewStyle,

    profileCard: {
      marginBottom: 20,
    } as ViewStyle,

    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    } as ViewStyle,

    avatarContainer: {
      marginRight: 16,
      position: 'relative',
    } as ViewStyle,

    editIconButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 35,
      height: 35,
      borderRadius: 17.5,
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.outline,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3,
      elevation: 5,
      zIndex: 1,
    } as ViewStyle,

    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    avatarEditOverlay: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: 15,
      width: 30,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
    } as ViewStyle,

    avatarText: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
    } as TextStyle,

    profileInfo: {
      flex: 1,
    } as ViewStyle,

    profileName: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.onSurface,
    } as TextStyle,

    profileEmail: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    } as TextStyle,



    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    } as ViewStyle,

    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginLeft: 8,
    } as TextStyle,

    statsContainer: {
      paddingVertical: 8,
    } as ViewStyle,

    statRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 4,
    } as ViewStyle,

    statNumber: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginLeft: 12,
      marginRight: 8,
      minWidth: 24,
      textAlign: 'center',
    } as TextStyle,

    statDescription: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      flex: 1,
    } as TextStyle,

    comingSoonBadge: {
      backgroundColor: theme.colors.surfaceVariant,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    } as ViewStyle,

    comingSoonText: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
    } as TextStyle,

    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 4,
    } as ViewStyle,

    settingIcon: {
      width: 32,
      alignItems: 'center',
      marginRight: 12,
    } as ViewStyle,

    settingContent: {
      flex: 1,
    } as ViewStyle,

    settingTitle: {
      fontSize: 16,
      color: theme.colors.onSurface,
    } as TextStyle,

    settingSubtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    } as TextStyle,

    settingAction: {
      alignItems: 'flex-end',
    } as ViewStyle,

    settingValue: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    } as TextStyle,

    editInput: {
      marginBottom: 12,
    } as ViewStyle,

    saveButton: {
      marginTop: 8,
    } as ViewStyle,

    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      width: '100%',
    } as ViewStyle,

    logoutText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#F44336',
      marginLeft: 8,
    } as TextStyle,

    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    } as ViewStyle,

    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 24,
      width: '100%',
      maxWidth: 400,
    } as ViewStyle,

    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 8,
    } as TextStyle,

    modalSubtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 20,
    } as TextStyle,

    modalInput: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.onSurface,
      marginBottom: 20,
    } as ViewStyle,

    modalButtons: {
      flexDirection: 'row',
      gap: 12,
    } as ViewStyle,

    modalButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    } as ViewStyle,

    modalButtonCancel: {
      backgroundColor: theme.colors.surfaceVariant,
    } as ViewStyle,

    modalButtonConfirm: {
      backgroundColor: theme.colors.primary,
    } as ViewStyle,

    modalButtonTextCancel: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    } as TextStyle,

    modalButtonTextConfirm: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onPrimary,
    } as TextStyle,

    // Auto Logout Dropdown Styles
    dropdownContainer: {
      paddingHorizontal: 16,
      paddingBottom: 12,
    } as ViewStyle,

    dropdownGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    } as ViewStyle,

    dropdownOption: {
      flex: 1,
      minWidth: '47%',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    } as ViewStyle,

    dropdownOptionRight: {
      marginLeft: 4,
    } as ViewStyle,

    dropdownOptionSelected: {
      backgroundColor: theme.colors.primaryContainer,
      borderColor: theme.colors.primary,
    } as ViewStyle,

    dropdownOptionText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
    } as TextStyle,

    dropdownOptionTextSelected: {
      color: theme.colors.primary,
      fontWeight: '600',
    } as TextStyle,
  });