import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ViewStyle,
  TextStyle
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../constants/theme';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';

export interface HeaderBarProps {
  title: string;
  subtitle?: string;
  leftIcon?: string;
  leftAvatar?: React.ReactNode;
  rightIcon?: string;
  leftText?: string;
  rightText?: string;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  showBackButton?: boolean;
  backgroundColor?: string;
  titleColor?: string;
  style?: ViewStyle;
  elevation?: boolean;
  // Nuevas props para elementos adicionales
  showThemeToggle?: boolean;
  showLanguageSelector?: boolean;
  additionalRightElements?: React.ReactNode;
  titleAlignment?: 'left' | 'center';
  useDynamicColors?: boolean; // Verde en dark, azul en light
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  subtitle,
  leftIcon,
  leftAvatar,
  rightIcon,
  leftText,
  rightText,
  onLeftPress,
  onRightPress,
  showBackButton = false,
  backgroundColor,
  titleColor,
  style,
  elevation = true,
  showThemeToggle = false,
  showLanguageSelector = false,
  additionalRightElements,
  titleAlignment = 'center',
  useDynamicColors = false
}) => {
  const { theme, isDarkMode } = useTheme();
  
  // Determinar colores dinámicos
  const dynamicBackgroundColor = useDynamicColors 
    ? (isDarkMode ? '#00B359' : '#007AFF')
    : backgroundColor || theme.colors.surface;
  
  const dynamicTitleColor = useDynamicColors 
    ? '#FFFFFF'
    : titleColor || theme.colors.onSurface;
    
  const styles = createStyles(theme, titleAlignment, dynamicBackgroundColor);

  const handleLeftPress = () => {
    if (onLeftPress) {
      onLeftPress();
    }
  };

  const handleRightPress = () => {
    if (onRightPress) {
      onRightPress();
    }
  };

  const renderLeftElement = () => {
    if (showBackButton) {
      return (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLeftPress}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={titleColor || theme.colors.onSurface}
          />
        </TouchableOpacity>
      );
    }

    if (leftAvatar) {
      return (
        <View style={styles.avatarButton}>
          {leftAvatar}
        </View>
      );
    }

    if (leftIcon) {
      return (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLeftPress}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={leftIcon as any}
            size={24}
            color={dynamicTitleColor}
          />
        </TouchableOpacity>
      );
    }

    if (leftText) {
      return (
        <TouchableOpacity
          style={styles.textButton}
          onPress={handleLeftPress}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionText, { color: titleColor || theme.colors.primary }]}>
            {leftText}
          </Text>
        </TouchableOpacity>
      );
    }

    return <View style={styles.actionButton} />;
  };

  const renderRightElement = () => {
    const elements = [];
    
    // Elementos adicionales personalizados
    if (additionalRightElements) {
      elements.push(additionalRightElements);
    }
    
    // ThemeToggle
    if (showThemeToggle) {
      elements.push(
        <ThemeToggle 
          key="theme-toggle" 
          size={22} 
          color={dynamicTitleColor} 
        />
      );
    }
    
    // LanguageSelector
    if (showLanguageSelector) {
      elements.push(
        <LanguageSelector 
          key="language-selector" 
          size={24} 
          color={dynamicTitleColor} 
        />
      );
    }
    
    // Icono derecho tradicional
    if (rightIcon) {
      elements.push(
        <TouchableOpacity
          key="right-icon"
          style={styles.actionButton}
          onPress={handleRightPress}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={rightIcon as any}
            size={24}
            color={dynamicTitleColor}
          />
        </TouchableOpacity>
      );
    }
    
    // Texto derecho tradicional
    if (rightText) {
      elements.push(
        <TouchableOpacity
          key="right-text"
          style={styles.textButton}
          onPress={handleRightPress}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionText, { color: dynamicTitleColor }]}>
            {rightText}
          </Text>
        </TouchableOpacity>
      );
    }
    
    if (elements.length > 0) {
      return (
        <View style={styles.rightElementsContainer}>
          {elements.map((element, index) => (
            <View key={index} style={styles.rightElementWrapper}>
              {element}
            </View>
          ))}
        </View>
      );
    }

    return <View style={styles.actionButton} />;
  };

  return (
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundColor || theme.colors.surface}
      />
      <View
        style={[
          styles.container,
          {
            backgroundColor: dynamicBackgroundColor,
            elevation: elevation ? theme.elevation.small : 0,
            shadowOpacity: elevation ? 0.1 : 0
          },
          style
        ]}
      >
        <View style={styles.content}>
          {renderLeftElement()}
          
          <View style={styles.titleContainer}>
            <Text
              style={[
                styles.title,
                { color: dynamicTitleColor }
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
            {subtitle && (
              <Text
                style={[
                  styles.subtitle,
                  { color: dynamicTitleColor + '80' }
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {subtitle}
              </Text>
            )}
          </View>
          
          {renderRightElement()}
        </View>
      </View>
    </>
  );
};

const createStyles = (theme: Theme, titleAlignment: 'left' | 'center' = 'center', backgroundColor?: string) => {
  const isDynamic = backgroundColor && (backgroundColor === '#007AFF' || backgroundColor === '#00B359');
  const borderColor = isDynamic 
    ? (backgroundColor === '#007AFF' ? '#0056CC' : '#008A44')
    : theme.colors.outlineVariant;

  return StyleSheet.create({
    container: {
      paddingTop: 50, // Account for status bar
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
    } as ViewStyle,
    
    content: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 56,
      paddingHorizontal: theme.spacing.md,
    } as ViewStyle,
    
    actionButton: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.full,
    } as ViewStyle,
    
    avatarButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    
    textButton: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.sm,
    } as ViewStyle,
    
    actionText: {
      ...theme.typography.labelLarge,
      fontWeight: '600',
    } as TextStyle,
    
    titleContainer: {
      flex: 1,
      alignItems: titleAlignment === 'left' ? 'flex-start' : 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.sm,
    } as ViewStyle,
    
    title: {
      ...theme.typography.titleLarge,
      fontWeight: '700',
      textAlign: titleAlignment,
      fontSize: 20,
    } as TextStyle,
    
    subtitle: {
      ...theme.typography.bodySmall,
      textAlign: titleAlignment,
      marginTop: 2,
    } as TextStyle,
    
    rightElementsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    } as ViewStyle,
    
    rightElementWrapper: {
      marginLeft: 12,
    } as ViewStyle,
  });
};

export default HeaderBar;