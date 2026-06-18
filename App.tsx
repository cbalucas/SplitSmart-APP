import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import RootNavigator from './src/navigation';
import SplashScreen from './src/screens/SplashScreen';
import CustomAlertContainer from './src/components/CustomAlert';
import { checkForUpdate } from './src/services/UpdateService';
import { version as appVersion } from './app.json';

// Si estamos volviendo de un redirect OAuth (web), saltamos el splash
// para que el usuario entre directo al home sin esperar 6 segundos.
const isOAuthRedirect =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  (window.location.hash.includes('access_token') ||
    window.location.search.includes('code=') ||
    window.location.hash.includes('error='));

export default function App() {
  const [showSplash, setShowSplash] = useState(!isOAuthRedirect);

  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  // Chequeo de actualización: se lanza DESPUÉS de que el splash termine,
  // garantizando que CustomAlertContainer ya esté montado y registrado.
  useEffect(() => {
    if (showSplash) return;
    const timer = setTimeout(() => {
      checkForUpdate(appVersion);
    }, 800);
    return () => clearTimeout(timer);
  }, [showSplash]);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          {showSplash ? (
            <SplashScreen onFinish={handleSplashFinish} />
          ) : (
            <AuthProvider>
              <DataProvider>
                <NavigationContainer>
                  <RootNavigator />
                </NavigationContainer>
                <CustomAlertContainer />
              </DataProvider>
            </AuthProvider>
          )}
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}


