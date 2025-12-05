import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../constants/theme';

export const createStyles = (theme: Theme) => {
  return StyleSheet.create({
    // Container principal
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    } as ViewStyle,

    safeContent: {
      flex: 1,
    } as ViewStyle,

    // Search Bar
    searchContainer: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    } as ViewStyle,



    // Metrics Section
    metricsSection: {
      paddingVertical: 12,
      paddingHorizontal: 16,
    } as ViewStyle,

    metricsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'stretch',
    } as ViewStyle,

    metricCard: {
      flex: 1,
      marginHorizontal: 2,
    } as ViewStyle,

    // Empty State
    emptyContainer: {
      flexGrow: 1,
    } as ViewStyle,

    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    } as ViewStyle,

    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginTop: 16,
      marginBottom: 8,
    } as TextStyle,

    emptySubtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    } as TextStyle,

    emptyButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    } as ViewStyle,

    emptyButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onPrimary,
    } as TextStyle,

    // Floating Action Button
    fabContainer: {
      position: 'absolute',
      bottom: 60, // Más separación de los controles Android
      right: 20,
      zIndex: 1000,
    } as ViewStyle,

    fab: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4.65,
    } as ViewStyle,

    fabIcon: {
      color: theme.colors.onPrimary,
    } as TextStyle,

    // Lista de eventos
    eventsList: {
      paddingBottom: 140, // Más espacio para el FAB reposicionado
    } as ViewStyle,

    // Refresh control
    refreshControl: {
      tintColor: theme.colors.primary,
    } as ViewStyle,
  });
};