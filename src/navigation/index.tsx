import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Auth/LoginScreen';
import HomeScreen from '../screens/Home';
import CreateEventScreen from '../screens/CreateEvent';
import EventDetailScreen from '../screens/EventDetail';
import ManageFriendsScreen from '../screens/ManageFriends';
import CreateExpenseScreen from '../screens/CreateExpense';

import ProfileScreen from '../screens/ProfileScreen';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
          <Stack.Screen name="EventDetail" component={EventDetailScreen} />
          <Stack.Screen name="ManageFriends" component={ManageFriendsScreen} />
          <Stack.Screen name="CreateExpense" component={CreateExpenseScreen} />

          <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
