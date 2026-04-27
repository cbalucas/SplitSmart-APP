import React, { useState, useEffect } from 'react';
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



export default function App() {
  const [showSplash, setShowSplash] = useState(true);

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


