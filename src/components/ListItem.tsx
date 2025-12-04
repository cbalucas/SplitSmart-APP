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
import Avatar from './Avatar';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  description?: string;
  leftIcon?: string;
  rightIcon?: string;
  avatar?: {
    name?: string;
    image?: string;
    size?: 'small' | 'medium';
  };
  badge?: number | boolean;
  badgeColor?: string;
  onPress?: () => void;
  onLongPress?: () => void;
  onRightIconPress?: () => void;
  disabled?: boolean;
  selected?: boolean;
  divider?: boolean;
  dense?: boolean;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  descriptionStyle?: TextStyle;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  description,
  leftIcon,
  rightIcon,
  avatar,
  badge,
  badgeColor,
  onPress,
  onLongPress,
  onRightIconPress,
  disabled = false,
  selected = false,
  divider = false,
  dense = false,
  style,
  titleStyle,
  subtitleStyle,
  descriptionStyle,
  leftContent,
  rightContent
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme, selected, disabled, dense);

  const renderLeftContent = () => {
    if (leftContent) {
      return <View style={styles.leftContent}>{leftContent}</View>;
    }

    if (avatar) {
      return (
        <View style={styles.leftContent}>
          <Avatar
            name={avatar.name}
            image={avatar.image}
            size={avatar.size || 'medium'}
            badge={badge}
            badgeColor={badgeColor}
          />
        </View>
      );
    }

    if (leftIcon) {
      return (
        <View style={styles.leftContent}>
          <MaterialCommunityIcons
            name={leftIcon as any}
            size={24}
            color={selected ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
        </View>
      );
    }

    return null;
  };

  const renderRightContent = () => {
    if (rightContent) {
      return <View style={styles.rightContent}>{rightContent}</View>;
    }

    if (rightIcon) {
      return (
        <TouchableOpacity
          style={styles.rightContent}
          onPress={onRightIconPress}
          disabled={disabled}
          activeOpacity={0.6}
        >
          <MaterialCommunityIcons
            name={rightIcon as any}
            size={24}
            color={theme.colors.onSurfaceVariant}
          />
        </TouchableOpacity>
      );
    }

    if (badge && !avatar) {
      const badgeValue = typeof badge === 'number' ? 
        (badge > 99 ? '99+' : badge.toString()) : '';

      return (
        <View style={styles.rightContent}>
          <View style={[
            styles.badge,
            { backgroundColor: badgeColor || theme.colors.error }
          ]}>
            {typeof badge === 'number' && (
              <Text style={styles.badgeText}>{badgeValue}</Text>
            )}
          </View>
        </View>
      );
    }

    return null;
  };

  const renderTextContent = () => {
    return (
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.title,
            selected && styles.selectedTitle,
            disabled && styles.disabledText,
            titleStyle
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
              disabled && styles.disabledText,
              subtitleStyle
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {subtitle}
          </Text>
        )}
        
        {description && (
          <Text
            style={[
              styles.description,
              disabled && styles.disabledText,
              descriptionStyle
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {description}
          </Text>
        )}
      </View>
    );
  };

  const itemContent = (
    <View style={[
      styles.container,
      selected && styles.selectedContainer,
      style
    ]}>
      {renderLeftContent()}
      {renderTextContent()}
      {renderRightContent()}
      
      {divider && <View style={styles.divider} />}
    </View>
  );

  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        {itemContent}
      </TouchableOpacity>
    );
  }

  return itemContent;
};

const createStyles = (theme: Theme, selected: boolean, disabled: boolean, dense: boolean) =>
  StyleSheet.create({
    touchable: {
      width: '100%',
    } as ViewStyle,
    
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: dense ? 8 : 12,
      backgroundColor: theme.colors.surface,
      position: 'relative',
    } as ViewStyle,
    
    selectedContainer: {
      backgroundColor: `${theme.colors.primary}08`,
    } as ViewStyle,
    
    leftContent: {
      marginRight: 16,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    
    textContainer: {
      flex: 1,
      justifyContent: 'center',
    } as ViewStyle,
    
    rightContent: {
      marginLeft: 16,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,
    
    title: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurface,
      lineHeight: 20,
    } as TextStyle,
    
    selectedTitle: {
      color: theme.colors.primary,
    } as TextStyle,
    
    subtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
      lineHeight: 18,
    } as TextStyle,
    
    description: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
      lineHeight: 16,
    } as TextStyle,
    
    disabledText: {
      opacity: 0.6,
    } as TextStyle,
    
    badge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
    } as ViewStyle,
    
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.onError,
      textAlign: 'center',
    } as TextStyle,
    
    divider: {
      position: 'absolute',
      bottom: 0,
      left: 16,
      right: 0,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.outline,
    } as ViewStyle,
  });

export default ListItem;