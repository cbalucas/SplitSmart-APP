import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  size?: number;
  color?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  size = 24, 
  color 
}) => {
  const { theme, toggleTheme, isDarkMode } = useTheme();

  return (
    <TouchableOpacity 
      onPress={toggleTheme} 
      style={styles.container}
    >
      <MaterialCommunityIcons 
        name={isDarkMode ? 'white-balance-sunny' : 'moon-waning-crescent'} 
        size={size} 
        color={color || (isDarkMode ? '#FDB813' : '#4B89DC')} 
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
