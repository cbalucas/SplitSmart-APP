import { StyleSheet, Dimensions } from 'react-native';
import { Theme } from '../../constants/theme';

const { width } = Dimensions.get('window');

export const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  safeContent: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerButton: {
    padding: 8
  },
  backButton: {
    padding: 8
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginHorizontal: 16
  },
  menuButton: {
    padding: 8
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8
  },
  activeTabItem: {
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary
  },
  tabText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 4,
    fontWeight: '500'
  },
  activeTabText: {
    color: theme.colors.primary,
    fontWeight: '600'
  },
  tabContent: {
    flex: 1,
    backgroundColor: theme.colors.background
  },
  searchContainer: {
    paddingVertical: 8
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary
  },
  addButtonText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
    marginLeft: 4
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyIcon: {
    marginBottom: 16
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
    marginTop: 12,
    fontWeight: '500'
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
    textAlign: 'center'
  },
  
  // Expense styles
  expenseItem: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.outline
  },
  expenseFirstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  expenseSecondRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  expenseThirdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
    flex: 1,
    marginRight: 8
  },
  expenseDate: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.success
  },
  expensePaidBy: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    flex: 1
  },
  expenseDivisionSummary: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    flex: 1
  },

  expenseRightSection: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 8
  },
  receiptIconButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: theme.colors.primaryContainer,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  expenseActions: {
    flexDirection: 'row',
    gap: 16
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6
  },
  addButtonText: {
    color: theme.colors.onPrimary,
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500'
  },
  receiptOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: theme.colors.surface + 'E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  receiptOverlayText: {
    color: theme.colors.onSurface,
    fontSize: 12,
    fontWeight: '500'
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4
  },
  actionText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 4
  },

  // Participant styles
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  avatarText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: '600'
  },
  participantDetails: {
    flex: 1
  },
  participantNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface
  },
  peopleCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 2
  },
  peopleCountBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onPrimary
  },
  friendBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.success + '20',
    alignItems: 'center',
    justifyContent: 'center'
  },
  temporaryBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center'
  },
  participantRole: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 2
  },
  participantEmail: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant
  },
  participantBreakdown: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2
  },
  participantRightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantStats: {
    alignItems: 'flex-end'
  },
  participantBalance: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2
  },
  participantBalanceLabel: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center'
  },
  participantActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editParticipantButton: {
    padding: 4,
  },
  removeParticipantButton: {
    marginLeft: 4,
    padding: 4,
  },

  // Summary styles
  summaryInfo: {
    gap: 8
  },
  eventName: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 8
  },
  eventDescription: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 20,
    marginBottom: 8
  },
  eventLocation: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4
  },
  eventDate: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4
  },
  eventCurrency: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8
  },
  eventStatus: {
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  statusActive: {
    backgroundColor: theme.colors.successContainer,
    color: theme.colors.onSuccessContainer
  },
  statusCompleted: {
    backgroundColor: theme.colors.infoContainer,
    color: theme.colors.onInfoContainer
  },
  statusArchived: {
    backgroundColor: theme.colors.warningContainer,
    color: theme.colors.onWarningContainer
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16
  },
  statItem: {
    alignItems: 'center',
    flex: 1
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginTop: 8,
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  quickActionButton: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline
  },
  quickActionText: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500'
  },
  
  // Settlement styles
  settlementItem: {
    padding: 12,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    marginBottom: 8
  },
  settlementInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  settlementText: {
    flex: 1,
    fontSize: 14
  },
  settlementFrom: {
    fontWeight: '500',
    color: theme.colors.onSurface
  },
  settlementTo: {
    fontWeight: '500',
    color: theme.colors.onSurface
  },
  settlementAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.success,
    textAlign: 'center',
    marginTop: 4
  },
  settlementsContainer: {
    gap: 12
  },
  settlementFromTo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  settlementParticipant: {
    alignItems: 'center',
    flex: 1
  },
  settlementArrow: {
    alignItems: 'center',
    flex: 0.5
  },
  settlementParticipantName: {
    fontSize: 12,
    color: theme.colors.onSurface,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center'
  },
  settlementDescription: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    fontStyle: 'italic'
  },
  noSettlementsContainer: {
    alignItems: 'center',
    padding: 24
  },
  noSettlementsIcon: {
    marginBottom: 12
  },
  noSettlementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.success,
    marginBottom: 8
  },
  noSettlementsText: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center'
  },
  settlementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4
  },
  settlementButtonText: {
    fontSize: 12,
    color: theme.colors.success,
    marginLeft: 4,
    fontWeight: '500'
  },

  // Balance styles
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline
  },
  balanceInfo: {
    flex: 1
  },
  balanceName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: 4
  },
  balanceDetails: {
    flexDirection: 'row'
  },
  balanceSubtext: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant
  },
  balanceAmount: {
    alignItems: 'flex-end'
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2
  },
  balanceLabel: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center'
  },

  // Category styles
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline
  },
  categoryInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 12
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface
  },
  categoryPercentage: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface
  },

  // Payment styles
  paymentStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    gap: 16
  },
  paymentStatItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 12
  },
  paymentStatValue: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginTop: 8,
    marginBottom: 4
  },
  paymentStatLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center'
  },
  paymentsContainer: {
    gap: 12
  },
  paymentItem: {
    padding: 12,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.outline
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  paymentParticipants: {
    flex: 1
  },
  paymentFromTo: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: 4
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary
  },
  paymentDate: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4
  },
  paymentNotes: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
    marginBottom: 8
  },
  receiptSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
    paddingTop: 8
  },
  receiptThumbnailContainer: {
    alignItems: 'center'
  },
  receiptThumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginBottom: 4
  },
  receiptLabel: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500'
  },
  addReceiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 8
  },
  addReceiptText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500'
  },

  // Error styles
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.error,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center'
  },
  errorButton: {
    paddingHorizontal: 32
  },

  // Search and filter styles
  searchContainer: {
    padding: 16,
    backgroundColor: theme.colors.surface
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    paddingHorizontal: 12
  },
  searchTextInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    fontSize: 16
  },
  filterToggleButton: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 8
  },
  filtersPanel: {
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    borderRadius: 16
  },
  filterOptionActive: {
    backgroundColor: theme.colors.primary
  },
  filterOptionInactive: {
    backgroundColor: theme.colors.surface
  },
  filterOptionText: {
    marginLeft: 4,
    fontSize: 14
  },
  filterOptionTextActive: {
    color: theme.colors.onPrimary
  },
  filterOptionTextInactive: {
    color: theme.colors.onSurfaceVariant
  },
  clearFiltersButton: {
    alignItems: 'center',
    paddingVertical: 8
  },
  clearFiltersText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500'
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10
  },
  modalCloseButtonContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    padding: 8
  },
  modalImage: {
    width: '90%',
    height: '80%'
  },

  // Top actions
  topQuickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginBottom: 16,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 12,
  },
  topQuickActionButton: {
    alignItems: 'center',
    padding: 8,
  },

  // Section subtitle
  sectionSubtitle: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 12
  },
  
  // Filter styles
  filtersContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface
  },
  clearFiltersButton: {
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  clearFiltersText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '500'
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  filterLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    minWidth: 70,
    marginRight: 12
  },
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
    gap: 8
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    backgroundColor: theme.colors.surface
  },
  filterChipActive: {
    backgroundColor: theme.colors.primaryContainer,
    borderColor: theme.colors.primary
  },
  filterChipText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant
  },
  filterChipTextActive: {
    color: theme.colors.onPrimaryContainer,
    fontWeight: '600'
  },
  filterToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    marginHorizontal: 16,
    marginBottom: 8
  },
  filterToggleText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginLeft: 4
  }
});