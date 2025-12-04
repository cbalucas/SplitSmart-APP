import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../constants/theme';

export interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string;
  variant?: 'filled' | 'outlined' | 'text' | 'elevated' | 'tonal';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'error' | 'success' | 'warning';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  onPress?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'filled',
  size = 'medium',
  color = 'primary',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  onPress,
  ...rest
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme, variant, size, color, fullWidth, disabled);

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          height: 32,
          paddingHorizontal: 12,
          fontSize: 12,
          iconSize: 16,
          borderRadius: 8
        };
      case 'medium':
        return {
          height: 40,
          paddingHorizontal: 16,
          fontSize: 14,
          iconSize: 18,
          borderRadius: 12
        };
      case 'large':
        return {
          height: 48,
          paddingHorizontal: 20,
          fontSize: 16,
          iconSize: 20,
          borderRadius: 16
        };
      default:
        return {
          height: 40,
          paddingHorizontal: 16,
          fontSize: 14,
          iconSize: 18,
          borderRadius: 12
        };
    }
  };

  const sizeConfig = getSizeConfig();

  const getColors = () => {
    const colorMap = {
      primary: theme.colors.primary,
      secondary: theme.colors.secondary,
      error: theme.colors.error,
      success: '#4CAF50',
      warning: '#FF9800'
    };

    const onColorMap = {
      primary: theme.colors.onPrimary,
      secondary: theme.colors.onSecondary,
      error: theme.colors.onError,
      success: '#FFFFFF',
      warning: '#FFFFFF'
    };

    return {
      main: colorMap[color],
      onMain: onColorMap[color]
    };
  };

  const colors = getColors();

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      height: sizeConfig.height,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      borderRadius: sizeConfig.borderRadius,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: fullWidth ? undefined : sizeConfig.height * 2,
      opacity: disabled ? 0.6 : 1,
    };

    switch (variant) {
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: colors.main,
          elevation: 2,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.22,
          shadowRadius: 2.22,
        };
      
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.main,
        };
      
      case 'text':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          paddingHorizontal: sizeConfig.paddingHorizontal / 2,
        };
      
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: theme.colors.surface,
          elevation: 6,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.27,
          shadowRadius: 4.65,
        };
      
      case 'tonal':
        return {
          ...baseStyle,
          backgroundColor: `${colors.main}20`,
        };
      
      default:
        return baseStyle;
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case 'filled':
        return colors.onMain;
      case 'outlined':
      case 'text':
      case 'tonal':
        return colors.main;
      case 'elevated':
        return colors.main;
      default:
        return colors.onMain;
    }
  };

  const renderIcon = () => {
    if (!icon || loading) return null;

    return (
      <MaterialCommunityIcons
        name={icon as any}
        size={sizeConfig.iconSize}
        color={getTextColor()}
        style={[
          iconPosition === 'left' ? styles.iconLeft : styles.iconRight
        ]}
      />
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="small"
            color={getTextColor()}
            style={styles.loadingIndicator}
          />
          <Text style={[
            styles.text,
            {
              fontSize: sizeConfig.fontSize,
              color: getTextColor()
            },
            textStyle
          ]}>
            {title}
          </Text>
        </View>
      );
    }

    return (
      <>
        {iconPosition === 'left' && renderIcon()}
        <Text style={[
          styles.text,
          {
            fontSize: sizeConfig.fontSize,
            color: getTextColor()
          },
          textStyle
        ]}>
          {title}
        </Text>
        {iconPosition === 'right' && renderIcon()}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={[
        getButtonStyle(),
        fullWidth && styles.fullWidth,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...rest}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const createStyles = (
  theme: Theme,
  variant: string,
  size: string,
  color: string,
  fullWidth: boolean,
  disabled: boolean
) =>
  StyleSheet.create({
    fullWidth: {
      width: '100%',
    } as ViewStyle,
    
    text: {
      fontWeight: '600',
      textAlign: 'center',
    } as TextStyle,
    
    iconLeft: {
      marginRight: 8,
    } as ViewStyle,
    
    iconRight: {
      marginLeft: 8,
    } as ViewStyle,
    
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    
    loadingIndicator: {
      marginRight: 8,
    } as ViewStyle,
  });

export default Button;