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
    backgroundColor: '#f0f8ff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#007AFF'
  },
  addButtonText: {
    fontSize: 12,
    color: '#007AFF',
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
    color: '#666',
    marginTop: 12,
    fontWeight: '500'
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center'
  },
  
  // Expense styles
  expenseItem: {
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0'
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  expenseInfo: {
    flex: 1
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.onSurface,
    marginBottom: 4
  },
  expenseDate: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50'
  },
  expensePaidBy: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8
  },
  expenseSplitsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline
  },
  expenseSplits: {
    marginTop: 8
  },
  splitsTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4
  },
  splitItem: {
    fontSize: 12,
    color: theme.colors.onSurface,
    paddingLeft: 8,
    marginBottom: 2
  },
  excludedParticipants: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff3cd',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ffeaa7'
  },
  excludedTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#856404',
    marginBottom: 2
  },
  excludedNames: {
    fontSize: 12,
    color: '#856404',
    fontStyle: 'italic'
  },
  expenseActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4
  },
  actionText: {
    fontSize: 12,
    color: '#666',
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
    backgroundColor: '#e8f5e8',
    color: '#2e7d32'
  },
  statusCompleted: {
    backgroundColor: '#e3f2fd',
    color: '#1976d2'
  },
  statusArchived: {
    backgroundColor: '#f3e5f5',
    color: '#7b1fa2'
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
    color: '#333',
    marginTop: 8,
    marginBottom: 4
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666'
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
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
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  quickActionText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500'
  },
  
  // Settlement styles
  settlementItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
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
    color: '#333'
  },
  settlementTo: {
    fontWeight: '500',
    color: '#333'
  },
  settlementAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
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
    color: '#333',
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center'
  },
  settlementDescription: {
    fontSize: 12,
    color: '#666',
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
    color: '#4CAF50',
    marginBottom: 8
  },
  noSettlementsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center'
  },
  settlementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4
  },
  settlementButtonText: {
    fontSize: 12,
    color: '#4CAF50',
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
    borderBottomColor: '#f0f0f0'
  },
  balanceInfo: {
    flex: 1
  },
  balanceName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4
  },
  balanceDetails: {
    flexDirection: 'row'
  },
  balanceSubtext: {
    fontSize: 12,
    color: '#666'
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
    color: '#666',
    textAlign: 'center'
  },

  // Category styles
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
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
    backgroundColor: '#f8f9fa',
    borderRadius: 12
  },
  paymentStatValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 4
  },
  paymentStatLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  },
  paymentsContainer: {
    gap: 12
  },
  paymentItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0'
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
    color: '#333',
    marginBottom: 4
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF'
  },
  paymentDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  paymentNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8
  },
  receiptSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
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
    color: '#007AFF',
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
    color: '#007AFF',
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
    color: '#ff4444',
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
    backgroundColor: '#fff'
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
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#007AFF'
  },
  filterOptionInactive: {
    backgroundColor: '#fff'
  },
  filterOptionText: {
    marginLeft: 4,
    fontSize: 14
  },
  filterOptionTextActive: {
    color: '#fff'
  },
  filterOptionTextInactive: {
    color: '#666'
  },
  clearFiltersButton: {
    alignItems: 'center',
    paddingVertical: 8
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#007AFF',
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
    backgroundColor: '#f8f9fa',
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
  }
});