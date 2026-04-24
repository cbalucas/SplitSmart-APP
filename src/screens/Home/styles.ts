import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Theme } from '../../constants/theme';

export const createStyles = (theme: Theme, bottomInset: number = 0) => {
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
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: 24,
    } as TextStyle,

    emptyButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    } as ViewStyle,

    emptyButtonText: {
      ...theme.typography.bodyLarge,
      fontWeight: '600',
      color: theme.colors.onPrimary,
    } as TextStyle,

    // Floating Action Button
    fabContainer: {
      position: 'absolute',
      bottom: bottomInset + 16,
      right: 20,
      zIndex: 1000,
      alignItems: 'center',
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
      marginBottom: 8, // Espacio entre los FABs
    } as ViewStyle,

    profileFab: {
      backgroundColor: '#FFFFFF', // Fondo blanco siempre
      borderWidth: 1,
      borderColor: theme.colors.primary,
      marginBottom: 0, // El último FAB no necesita margen inferior
      padding: 4, // Reducir padding interno para que el avatar sea más prominente
    } as ViewStyle,

    expressEventFab: {
      width: 88,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#FFFFFF',
      overflow: 'hidden',
    } as ViewStyle,

    fabToggle: {
      height: 36,
      paddingHorizontal: 20,
      borderRadius: 18,
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      marginTop: 6,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    } as ViewStyle,

    fabIcon: {
      color: theme.colors.onPrimary,
    } as TextStyle,

    // Lista de eventos
    eventsList: {
      paddingBottom: 16,
    } as ViewStyle,

    // Refresh control
    refreshControl: {
      tintColor: theme.colors.primary,
    } as ViewStyle,

    // ── Secciones verdes ─────────────────────────────────────
    sectionCard: {
      marginHorizontal: 12,
      marginTop: 8,
      borderRadius: 14,
      borderTopWidth: 3,
      borderTopColor: '#4CAF50',
      backgroundColor: theme.colors.surface,
      overflow: 'hidden',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
    } as ViewStyle,

    // Fila de botones de filtro
    filterRow: {
      flexDirection: 'row',
      paddingHorizontal: 8,
      paddingTop: 4,
      paddingBottom: 12,
      gap: 4,
    } as ViewStyle,

    filterBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 10,
      borderRadius: 10,
    } as ViewStyle,

    filterIconWrap: {
      position: 'relative',
      marginBottom: 5,
    } as ViewStyle,

    filterBadge: {
      position: 'absolute',
      top: -5,
      right: -10,
      borderRadius: 8,
      paddingHorizontal: 5,
      paddingVertical: 1,
      minWidth: 18,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    filterBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#fff',
    } as TextStyle,

    filterLabel: {
      fontSize: 12,
      fontWeight: '600',
      textAlign: 'center',
    } as TextStyle,
  });
};