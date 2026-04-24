export type RootStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  Home: undefined;
  CreateEvent: { eventId?: string; mode?: 'edit' } | undefined;
  EventDetail: { eventId: string };
  ManageFriends: undefined;
  CreateExpense: { eventId: string; expenseId?: string };

  ProfileScreen: undefined;
  ExpressEvent: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}