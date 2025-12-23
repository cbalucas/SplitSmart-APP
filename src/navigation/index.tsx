import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignUpScreen from '../screens/Auth/SignUpScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import HomeScreen from '../screens/Home';
import CreateEventScreen from '../screens/CreateEvent';
import EventDetailScreen from '../screens/EventDetail';
import ManageFriendsScreen from '../screens/ManageFriends';
import CreateExpenseScreen from '../screens/CreateExpense';

import ProfileScreen from '../screens/ProfileScreen';
import { RootStackParamList } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { user, autoLoginIfEnabled, isInitializing } = useAuth();
  const { theme } = useTheme();
  const [autoLoginChecked, setAutoLoginChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkAutoLogin = async () => {
      // Esperar a que termine la inicialización del AuthContext
      if (isInitializing) {
        return;
      }

      // Solo verificar auto-login una vez y si no hay usuario
      if (autoLoginChecked || user) {
        return;
      }

      try {
        console.log('🔍 RootNavigator: Checking for auto-login...');
        const autoLoginUser = await autoLoginIfEnabled();
        
        if (autoLoginUser) {
          console.log('✅ RootNavigator: Auto-login successful for:', autoLoginUser.username);
        } else {
          console.log('ℹ️ RootNavigator: No auto-login user found, showing login screen');
        }
      } catch (error) {
        console.error('❌ RootNavigator: Error during auto-login check:', error);
      } finally {
        if (isMounted) {
          setAutoLoginChecked(true);
        }
      }
    };

    checkAutoLogin();

    return () => {
      isMounted = false;
    };
  }, [isInitializing, user, autoLoginChecked]); // Agregar dependencias necesarias

  // Mostrar loading mientras se inicializa o se verifica auto-login
  if (isInitializing || (!autoLoginChecked && !user)) {
    console.log('🔄 RootNavigator: Showing loading screen. isInitializing:', isInitializing, 'autoLoginChecked:', autoLoginChecked, 'user:', !!user);
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: theme.colors.background,
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  console.log('🏠 RootNavigator: Rendering navigation. User authenticated:', !!user);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
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
