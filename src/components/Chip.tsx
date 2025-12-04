import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../constants/theme';

export interface ChipProps {
  label: string;
  variant?: 'filled' | 'outlined' | 'elevated';
  color?: 'default' | 'primary' | 'secondary' | 'error' | 'success' | 'warning';
  size?: 'small' | 'medium';
  selected?: boolean;
  disabled?: boolean;
  icon?: string;
  avatar?: React.ReactNode;
  onPress?: () => void;
  onDelete?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Chip: React.FC<ChipProps> = ({
  label,
  variant = 'filled',
  color = 'default',
  size = 'medium',
  selected = false,
  disabled = false,
  icon,
  avatar,
  onPress,
  onDelete,
  style,
  textStyle
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme, variant, color, size, selected, disabled);

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          height: 24,
          paddingHorizontal: 8,
          fontSize: 12,
          iconSize: 14,
          borderRadius: 12
        };
      case 'medium':
        return {
          height: 32,
          paddingHorizontal: 12,
          fontSize: 14,
          iconSize: 16,
          borderRadius: 16
        };
      default:
        return {
          height: 32,
          paddingHorizontal: 12,
          fontSize: 14,
          iconSize: 16,
          borderRadius: 16
        };
    }
  };

  const sizeConfig = getSizeConfig();

  const getColors = () => {
    const colorMap = {
      default: theme.colors.surfaceVariant,
      primary: theme.colors.primary,
      secondary: theme.colors.secondary,
      error: theme.colors.error,
      success: '#4CAF50',
      warning: '#FF9800'
    };

    const onColorMap = {
      default: theme.colors.onSurfaceVariant,
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

  const getChipStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      height: sizeConfig.height,
      borderRadius: sizeConfig.borderRadius,
      paddingHorizontal: sizeConfig.paddingHorizontal,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'flex-start',
      opacity: disabled ? 0.6 : 1,
    };

    switch (variant) {
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: selected ? colors.main : 
            (color === 'default' ? theme.colors.surfaceVariant : `${colors.main}20`),
        };
      
      case 'outlined':
        return {
          ...baseStyle,
          backgroundColor: selected ? `${colors.main}20` : 'transparent',
          borderWidth: 1,
          borderColor: selected ? colors.main : theme.colors.outline,
        };
      
      case 'elevated':
        return {
          ...baseStyle,
          backgroundColor: selected ? colors.main : theme.colors.surface,
          elevation: 4,
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        };
      
      default:
        return baseStyle;
    }
  };

  const getTextColor = (): string => {
    if (selected) {
      return variant === 'filled' ? colors.onMain : colors.main;
    }
    
    switch (variant) {
      case 'filled':
        return color === 'default' ? theme.colors.onSurfaceVariant : colors.onMain;
      case 'outlined':
      case 'elevated':
        return colors.main === theme.colors.surfaceVariant ? 
          theme.colors.onSurfaceVariant : colors.main;
      default:
        return theme.colors.onSurfaceVariant;
    }
  };

  const renderLeftContent = () => {
    if (avatar) {
      return <View style={styles.avatar}>{avatar}</View>;
    }

    if (icon) {
      return (
        <MaterialCommunityIcons
          name={icon as any}
          size={sizeConfig.iconSize}
          color={getTextColor()}
          style={styles.leftIcon}
        />
      );
    }

    return null;
  };

  const renderDeleteButton = () => {
    if (!onDelete) return null;

    return (
      <TouchableOpacity
        onPress={onDelete}
        disabled={disabled}
        style={styles.deleteButton}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons
          name="close"
          size={sizeConfig.iconSize}
          color={getTextColor()}
        />
      </TouchableOpacity>
    );
  };

  const chipContent = (
    <View style={[getChipStyle(), style]}>
      {renderLeftContent()}
      <Text
        style={[
          styles.text,
          {
            fontSize: sizeConfig.fontSize,
            color: getTextColor()
          },
          textStyle
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {label}
      </Text>
      {renderDeleteButton()}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.8}
      >
        {chipContent}
      </TouchableOpacity>
    );
  }

  return chipContent;
};

const createStyles = (
  theme: Theme,
  variant: string,
  color: string,
  size: string,
  selected: boolean,
  disabled: boolean
) =>
  StyleSheet.create({
    text: {
      fontWeight: '500',
      textAlign: 'center',
      includeFontPadding: false,
    } as TextStyle,
    
    leftIcon: {
      marginRight: 4,
    } as ViewStyle,
    
    avatar: {
      marginRight: 4,
      marginLeft: -4,
    } as ViewStyle,
    
    deleteButton: {
      marginLeft: 4,
      marginRight: -4,
      padding: 2,
    } as ViewStyle,
  });

export default Chip;