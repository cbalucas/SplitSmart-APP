import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../constants/theme';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
  padding?: number;
  elevation?: number;
  style?: ViewStyle;
  onPress?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  padding = 16,
  elevation,
  style,
  onPress
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme, variant, padding, elevation);

  return (
    <View style={[styles.container, style]}>
      {children}
    </View>
  );
};

const createStyles = (theme: Theme, variant: string, padding: number, elevation?: number) => {
  const getCardStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: 16,
      padding: padding,
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surface,
          elevation: elevation || 4,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        };
      
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.outline,
        };
      
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surfaceVariant,
        };
      
      default:
        return baseStyle;
    }
  };

  return StyleSheet.create({
    container: getCardStyle(),
  });
};

export default Card;