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
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
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

    profileUsername: {
      fontSize: 12,
      color: theme.colors.primary,
      marginTop: 1,
      fontStyle: 'italic',
    } as TextStyle,

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    } as ViewStyle,

    sectionHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      flex: 1,
      gap: 8,
    } as ViewStyle,

    sectionHeaderRight: {
      marginLeft: 8,
    } as ViewStyle,

    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      lineHeight: 20,
      marginTop: 0,
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
      flex: 1,
      backgroundColor: theme.colors.primary,
      height: 48,
    } as ViewStyle,

    logoutCard: {
      marginBottom: 20,
      marginTop: 10,
    } as ViewStyle,

    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 24,
      width: '100%',
      borderRadius: 12,
      backgroundColor: 'rgba(244, 67, 54, 0.05)',
      borderWidth: 1,
      borderColor: 'rgba(244, 67, 54, 0.2)',
    } as ViewStyle,

    logoutText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#F44336',
      marginLeft: 10,
      textAlign: 'center',
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

    editButtonsContainer: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 12,
      marginTop: 16,
      height: 48,
    } as ViewStyle,

    cancelButton: {
      flex: 1,
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: theme.colors.outline,
      height: 48,
      borderRadius: 12,
    } as ViewStyle,



    cancelButtonText: {
      color: theme.colors.onSurface,
      fontWeight: '600',
    } as TextStyle,

    saveButtonText: {
      color: theme.colors.onPrimary,
      fontWeight: '600',
    } as TextStyle,

    // Estilos del Changelog Modal
    changelogModalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 20,
      width: '95%',
      maxHeight: '85%',
      minHeight: 400,
    } as ViewStyle,

    // Modal adaptativo para estadísticas de base de datos
    databaseStatsModalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
      padding: 0,
      width: '90%',
      maxHeight: '85%',
      flexShrink: 1, // Permite que se reduzca si es necesario
      // Removemos minHeight y height fijo para que sea adaptativo
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    } as ViewStyle,

    changelogHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
      marginBottom: 16,
    } as ViewStyle,

    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.colors.surfaceVariant,
      justifyContent: 'center',
      alignItems: 'center',
    } as ViewStyle,

    changelogContent: {
      paddingHorizontal: 4,
      paddingBottom: 8,
      maxHeight: undefined, // Permitir que se expanda según el contenido
    } as ViewStyle,

    versionBlock: {
      marginBottom: 8,
      backgroundColor: theme.colors.background,
      borderRadius: 10,
      padding: 12,
      marginHorizontal: 8,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 1,
    } as ViewStyle,

    versionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: 8,
    } as ViewStyle,

    versionContent: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    } as ViewStyle,

    versionNumber: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.primary,
    } as TextStyle,

    versionDate: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
      marginLeft: 12,
    } as TextStyle,

    versionSummary: {
      fontSize: 13,
      color: theme.colors.primary,
      fontWeight: '500',
      opacity: 0.8,
    } as TextStyle,

    currentVersionBlock: {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.primary,
      borderWidth: 2,
      elevation: 3,
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    } as ViewStyle,

    currentVersionNumber: {
      color: theme.colors.primary,
      fontWeight: '700',
    } as TextStyle,

    currentVersionDate: {
      color: theme.colors.onSurface,
      fontWeight: '500',
    } as TextStyle,

    changelogSection: {
      marginBottom: 8,
    } as ViewStyle,



    changelogItem: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
      marginBottom: 4,
    } as TextStyle,

    versionBadge: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    } as ViewStyle,

    versionBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary,
    } as TextStyle,

    // Estilos para Modal Acerca de
    aboutSection: {
      marginBottom: 20,
    } as ViewStyle,

    aboutTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 12,
      textAlign: 'center',
    } as TextStyle,

    aboutSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 8,
    } as TextStyle,

    aboutDescription: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
      textAlign: 'justify',
    } as TextStyle,

    aboutItem: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
      marginBottom: 4,
      flex: 1,
      marginLeft: 8,
    } as TextStyle,

    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      paddingLeft: 8,
    } as ViewStyle,

    // Estilos para Modal Términos de Servicio
    termsSection: {
      marginBottom: 20,
    } as ViewStyle,

    termsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
      marginBottom: 8,
    } as TextStyle,

    termsText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
      marginBottom: 8,
      textAlign: 'justify',
    } as TextStyle,

    // Estilos para Modal Política de Privacidad
    privacySection: {
      marginBottom: 20,
    } as ViewStyle,

    privacyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.primary,
      marginBottom: 8,
    } as TextStyle,

    privacyText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
      marginBottom: 4,
      textAlign: 'justify',
    } as TextStyle,

    // Estilos para Modal Contactar Soporte
    supportSection: {
      marginBottom: 20,
    } as ViewStyle,

    supportTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 12,
      textAlign: 'center',
    } as TextStyle,

    supportSectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 8,
    } as TextStyle,

    supportText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 20,
      marginBottom: 4,
      textAlign: 'justify',
    } as TextStyle,

    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 8,
      marginBottom: 8,
      gap: 12,
    } as ViewStyle,

    contactText: {
      fontSize: 14,
      color: theme.colors.onSurface,
      fontWeight: '500',
    } as TextStyle,
  });