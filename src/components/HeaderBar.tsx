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

export interface HeaderBarProps {
  title: string;
  subtitle?: string;
  leftIcon?: string;
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
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  leftText,
  rightText,
  onLeftPress,
  onRightPress,
  showBackButton = false,
  backgroundColor,
  titleColor,
  style,
  elevation = true
}) => {
  const { theme, isDarkMode } = useTheme();
  const styles = createStyles(theme);

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
            color={titleColor || theme.colors.onSurface}
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
    if (rightIcon) {
      return (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleRightPress}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={rightIcon as any}
            size={24}
            color={titleColor || theme.colors.onSurface}
          />
        </TouchableOpacity>
      );
    }

    if (rightText) {
      return (
        <TouchableOpacity
          style={styles.textButton}
          onPress={handleRightPress}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionText, { color: titleColor || theme.colors.primary }]}>
            {rightText}
          </Text>
        </TouchableOpacity>
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
            backgroundColor: backgroundColor || theme.colors.surface,
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
                { color: titleColor || theme.colors.onSurface }
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
                  { color: titleColor ? titleColor + '80' : theme.colors.onSurfaceVariant }
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

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      paddingTop: StatusBar.currentHeight || 44, // iOS safe area
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
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
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.sm,
    } as ViewStyle,
    
    title: {
      ...theme.typography.titleLarge,
      fontWeight: '600',
      textAlign: 'center',
    } as TextStyle,
    
    subtitle: {
      ...theme.typography.bodySmall,
      textAlign: 'center',
      marginTop: 2,
    } as TextStyle,
  });

export default HeaderBar;