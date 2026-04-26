import { StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { EdgeInsets } from 'react-native-safe-area-context';
import { Theme } from '../../constants/theme';

export const createStyles = (theme: Theme, insets: EdgeInsets) => StyleSheet.create({

  // ── Contenedor raíz ──────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  } as ViewStyle,

  safeContent: {
    flex: 1,
  } as ViewStyle,

  // ── Tabs ─────────────────────────────────────────────────
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  } as ViewStyle,

  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  } as ViewStyle,

  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.primary,
  } as ViewStyle,

  inactiveTab: {
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  } as ViewStyle,

  tabText: {
    ...theme.typography.labelLarge,
    fontWeight: '600',
  } as TextStyle,

  activeTabText: {
    ...theme.typography.labelLarge,
    fontWeight: '600',
    color: theme.colors.primary,
  } as TextStyle,

  inactiveTabText: {
    ...theme.typography.labelLarge,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  } as TextStyle,

  tabContent: {
    flex: 1,
  } as ViewStyle,

  // ── Secciones verdes (igual que Home) ──────────────────────
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

  // ── Lista de amigos ───────────────────────────────────────
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  } as ViewStyle,

  // ── FriendItem ────────────────────────────────────────────
  friendItem: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  } as ViewStyle,

  friendBody: {
    flex: 1,
  } as ViewStyle,

  friendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,

  friendMainInfo: {
    flex: 1,
  } as ViewStyle,

  friendName: {
    ...theme.typography.titleMedium,
    fontWeight: '600',
    color: theme.colors.onSurface,
    lineHeight: 20,
  } as TextStyle,

  aliasRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
    gap: 4,
  } as ViewStyle,

  contactRow: {
    flexDirection: 'column',
    marginTop: 2,
    gap: 2,
  } as ViewStyle,

  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as ViewStyle,

  contactSeparator: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    fontWeight: 'bold',
  } as TextStyle,

  contactIcon: {
    marginRight: 2,
  } as ViewStyle,

  friendEmail: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
  } as TextStyle,

  friendAlias: {
    ...theme.typography.labelLarge,
    color: theme.colors.primary,
    fontWeight: '500',
  } as TextStyle,

  friendPhone: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
  } as TextStyle,

  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.errorContainer,
  } as ViewStyle,

  // ── Formulario ────────────────────────────────────────────
  newFriendScroll: {
    flex: 1,
  } as ViewStyle,

  newFriendScrollContent: {
    paddingTop: 16,
    paddingBottom: 16,
  } as ViewStyle,

  formCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderTopWidth: 4,
    borderTopColor: '#2196F3',
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

  inputGroup: {
    marginBottom: 16,
  } as ViewStyle,

  // ── Avatar picker ─────────────────────────────────────────
  avatarPickerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  } as ViewStyle,

  validationText: {
    ...theme.typography.bodySmall,
    marginTop: 4,
    marginLeft: 2,
  } as TextStyle,

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

  saveButton: {
    flex: 1,
  } as ViewStyle,

  // ── Estado vacío ──────────────────────────────────────────
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 48,
  } as ViewStyle,

  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginTop: 16,
    textAlign: 'center',
  } as TextStyle,

  emptySubtitle: {
    ...theme.typography.bodyLarge,
    color: theme.colors.onSurfaceVariant,
    marginTop: 8,
    textAlign: 'center',
  } as TextStyle,

  emptyButton: {
    marginTop: 24,
  } as ViewStyle,

  // ── Filtros de visibilidad ────────────────────────────────
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
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
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  } as TextStyle,
});
