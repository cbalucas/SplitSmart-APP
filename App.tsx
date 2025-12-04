import React, { useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';
import RootNavigator from './src/navigation';
import { version } from './package.json';

const SplashScreen = () => (
  <SafeAreaView style={styles.splashContainer} edges={['top', 'bottom', 'left', 'right']}>
    <View style={styles.splashContent}>
      <Image
        source={require('./assets/splitsmart/icon.png')}
        style={styles.splashLogo}
        resizeMode="contain"
      />
      <Text style={styles.splashSlogan}>
        "Nunca hacer números{'\n'}fue tan fácil y claro..."
      </Text>
      <Text style={styles.splashVersion}>v{version}</Text>
    </View>
  </SafeAreaView>
);

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <DataProvider>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
            </DataProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  splashContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 150,
    height: 150,
  },
  splashSlogan: {
    marginTop: 24,
    fontSize: 18,
    color: '#FFFFFF',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 26,
  },
  splashVersion: {
    marginTop: 40,
    fontSize: 14,
    color: '#888888',
    fontWeight: '500',
  },
});
