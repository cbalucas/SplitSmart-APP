import React, { useState, useEffect } from 'react';
import { View, Image, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { version } from '../../../package.json';
import { splashLanguage } from './language';
import { createStyles } from './styles';

type Language = 'es' | 'en' | 'pt';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('es');
  const styles = createStyles();

  useEffect(() => {
    // Secuencia de idiomas cada 2 segundos
    const timer1 = setTimeout(() => setCurrentLanguage('en'), 2000);
    const timer2 = setTimeout(() => setCurrentLanguage('pt'), 4000);
    
    // Finalizar splash después de 6 segundos
    const finishTimer = setTimeout(() => {
      onFinish();
    }, 6000);

    // Cleanup
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  const currentText = splashLanguage[currentLanguage];

  return (
    <SafeAreaView 
      style={styles.splashContainer} 
      edges={['top', 'bottom', 'left', 'right']}
    >
      <View style={styles.splashContent}>
        <Image
          source={require('../../../assets/splitsmart/splash-icon-light.png')}
          style={styles.splashLogo}
          resizeMode="contain"
        />
        <Text style={styles.splashVersion}>v{version}</Text>
        <Text style={styles.splashSlogan}>
          {currentText.slogan}
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default SplashScreen;
