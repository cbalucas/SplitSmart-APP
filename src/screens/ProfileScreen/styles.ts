import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
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
      marginBottom: 16,
      borderTopWidth: 4,
      borderTopColor: theme.colors.primary,
      overflow: 'hidden',
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

    avatarRing: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 2.5,
      borderColor: theme.colors.primary,
      padding: 2,
      justifyContent: 'center',
      alignItems: 'center',
    } as ViewStyle,

    avatar: {
      width: 63,
      height: 63,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    avatarImage: {
      width: 63,
      height: 63,
      borderRadius: 32,
    } as ImageStyle,

    avatarEditOverlay: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: theme.colors.surface,
    } as ViewStyle,

    avatarText: {
      fontSize: 22,
      fontWeight: '700',
      color: '#FFFFFF',
    } as TextStyle,

    profileInfo: {
      flex: 1,
      gap: 4,
    } as ViewStyle,

    profileName: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.onSurface,
      lineHeight: 22,
    } as TextStyle,

    profileDetailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    } as ViewStyle,

    profileEmail: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      flexShrink: 1,
    } as TextStyle,

    profileUsername: {
      fontSize: 12,
      color: theme.colors.primary,
      fontWeight: '600',
    } as TextStyle,

    profileCardFooter: {
      flexDirection: 'row',
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
      gap: 8,
      flexWrap: 'wrap',
    } as ViewStyle,

    profileCurrencyChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: theme.colors.primaryContainer,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    } as ViewStyle,

    profileCurrencyChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary,
    } as TextStyle,

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    } as ViewStyle,

    sectionHeaderCollapsed: {
      marginBottom: 0,
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
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: 4,
      marginTop: 4,
      letterSpacing: 0.2,
    } as TextStyle,

    statsContainer: {
      paddingVertical: 8,
      gap: 10,
    } as ViewStyle,

    statsTopRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    } as ViewStyle,

    statCardWide: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderLeftWidth: 4,
    } as ViewStyle,

    statsGrid: {
      flexDirection: 'row',
      gap: 12,
    } as ViewStyle,

    statCard: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 8,
      borderTopWidth: 3,
      gap: 6,
    } as ViewStyle,

    statCardNumber: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.onSurface,
    } as TextStyle,

    statCardLabel: {
      fontSize: 11,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
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
      borderTopWidth: 4,
      borderTopColor: theme.colors.primary,
      overflow: 'hidden',
    } as ViewStyle,

    modalTitle: {
      ...theme.typography.titleLarge,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 8,
    } as TextStyle,

    modalSubtitle: {
      ...theme.typography.bodyMedium,
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
      textAlign: 'center',
    } as TextStyle,

    modalButtonTextConfirm: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onPrimary,
      textAlign: 'center',
    } as TextStyle,

    modalButtonConfirmDisabled: {
      backgroundColor: theme.colors.outline,
    } as ViewStyle,

    modalPasswordMismatch: {
      fontSize: 12,
      color: '#FF5252',
      marginTop: -8,
      marginBottom: 12,
      marginLeft: 4,
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
      borderRadius: 20,
      padding: 20,
      width: '95%',
      maxHeight: '85%',
      minHeight: 400,
      overflow: 'hidden',
      borderTopWidth: 4,
      borderTopColor: theme.colors.primary,
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
      borderWidth: 1,
      borderColor: theme.colors.outline,
    } as ViewStyle,

    changelogContent: {
      paddingHorizontal: 4,
      paddingBottom: 8,
      maxHeight: undefined, // Permitir que se expanda según el contenido
    } as ViewStyle,

    versionBlock: {
      marginBottom: 8,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      padding: 14,
      marginHorizontal: 4,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.outline,
      overflow: 'hidden',
    } as ViewStyle,

    versionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    } as ViewStyle,

    versionContent: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
      gap: 6,
    } as ViewStyle,

    versionNumber: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.onSurface,
      flex: 1,
    } as TextStyle,

    versionDate: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
    } as TextStyle,

    versionSummary: {
      fontSize: 13,
      color: theme.colors.primary,
      fontWeight: '500',
      opacity: 0.8,
    } as TextStyle,

    currentVersionBlock: {
      backgroundColor: theme.colors.surface,
      borderLeftColor: theme.colors.primary,
      borderLeftWidth: 4,
    } as ViewStyle,

    currentVersionNumber: {
      color: theme.colors.primary,
      fontWeight: '700',
      fontSize: 15,
    } as TextStyle,

    currentVersionDate: {
      color: theme.colors.onSurface,
      fontWeight: '500',
      fontStyle: 'normal',
    } as TextStyle,

    changelogSection: {
      marginBottom: 4,
    } as ViewStyle,

    changelogItem: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 19,
      marginBottom: 2,
      paddingLeft: 4,
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

    infoNavCard: {
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

    infoNavCardTitle: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.onSurface,
      textAlign: 'center',
    } as TextStyle,

    // Estilos para Modal Acerca de
    aboutSection: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: theme.colors.primary,
      padding: 14,
      marginBottom: 10,
      overflow: 'hidden',
    } as ViewStyle,

    aboutTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 0,
    } as TextStyle,

    aboutSectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.onSurface,
      marginBottom: 8,
      letterSpacing: 0.3,
    } as TextStyle,

    aboutDescription: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 19,
      textAlign: 'justify',
    } as TextStyle,

    aboutItem: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 19,
      paddingVertical: 3,
    } as TextStyle,

    featureItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 6,
    } as ViewStyle,

    // Estilos para Modal Términos de Servicio
    termsSection: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#2196F3',
      padding: 14,
      marginBottom: 10,
      overflow: 'hidden',
    } as ViewStyle,

    termsTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: '#2196F3',
      marginBottom: 6,
      letterSpacing: 0.3,
    } as TextStyle,

    termsText: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 19,
      textAlign: 'justify',
    } as TextStyle,

    // Estilos para Modal Política de Privacidad
    privacySection: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#4CAF50',
      padding: 14,
      marginBottom: 10,
      overflow: 'hidden',
    } as ViewStyle,

    privacyTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: '#4CAF50',
      marginBottom: 6,
      letterSpacing: 0.3,
    } as TextStyle,

    privacyText: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 19,
      textAlign: 'justify',
    } as TextStyle,

    // Estilos para Modal Contactar Soporte
    supportSection: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#FF9800',
      padding: 14,
      marginBottom: 10,
      overflow: 'hidden',
    } as ViewStyle,

    supportSectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: '#FF9800',
      marginBottom: 8,
      letterSpacing: 0.3,
    } as TextStyle,

    supportText: {
      fontSize: 13,
      color: theme.colors.onSurfaceVariant,
      lineHeight: 19,
      marginBottom: 4,
      textAlign: 'justify',
    } as TextStyle,

    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      marginBottom: 8,
      gap: 12,
    } as ViewStyle,

    contactText: {
      fontSize: 13,
      color: theme.colors.onSurface,
      fontWeight: '500',
      flex: 1,
    } as TextStyle,

    // Modal contraseña — campos con ojo
    modalPasswordRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 12,
    } as ViewStyle,

    modalPasswordInput: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.onSurface,
    } as TextStyle,

    modalEyeButton: {
      paddingHorizontal: 12,
      paddingVertical: 12,
    } as ViewStyle,

    // Indicador de fortaleza de contraseña
    passwordStrengthContainer: {
      marginBottom: 12,
    } as ViewStyle,

    passwordStrengthBar: {
      height: 4,
      backgroundColor: theme.colors.outline,
      borderRadius: 2,
      overflow: 'hidden',
      marginBottom: 4,
    } as ViewStyle,

    passwordStrengthFill: {
      height: '100%',
      borderRadius: 2,
    } as ViewStyle,

    passwordStrengthText: {
      fontSize: 12,
      fontWeight: '500',
      textAlign: 'right',
    } as TextStyle,

    // Modal con header icon
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    } as ViewStyle,

    modalHeaderIconWrap: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.colors.primaryContainer,
      justifyContent: 'center',
      alignItems: 'center',
    } as ViewStyle,

    modalDivider: {
      height: 1,
      backgroundColor: theme.colors.outline,
      marginBottom: 16,
    } as ViewStyle,

    modalFieldGroup: {
      marginBottom: 12,
    } as ViewStyle,

    modalFieldLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      marginBottom: 6,
      marginLeft: 2,
      letterSpacing: 0.4,
    } as TextStyle,

    // Info modal header (About, Terms, Privacy, Support)
    infoModalHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    } as ViewStyle,

    infoModalHeaderIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    } as ViewStyle,
  });