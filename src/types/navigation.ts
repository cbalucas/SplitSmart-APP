export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  CreateEvent: { eventId?: string; mode?: 'edit' } | undefined;
  EventDetail: { eventId: string };
  ManageFriends: undefined;
  CreateExpense: { eventId: string; expenseId?: string };
  SummaryScreen: { eventId: string };
  ProfileScreen: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}