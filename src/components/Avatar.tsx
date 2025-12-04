import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ImageStyle
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../constants/theme';

export interface AvatarProps {
  name?: string;
  image?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  badge?: number | boolean;
  badgeColor?: string;
  backgroundColor?: string;
  textColor?: string;
  onPress?: () => void;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  showEditIcon?: boolean;
  onEditPress?: () => void;
}

const Avatar: React.FC<AvatarProps> = ({
  name = '',
  image,
  size = 'medium',
  badge,
  badgeColor,
  backgroundColor,
  textColor,
  onPress,
  style,
  imageStyle,
  showEditIcon = false,
  onEditPress
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { width: 32, height: 32, fontSize: 12, badgeSize: 12 };
      case 'medium':
        return { width: 48, height: 48, fontSize: 16, badgeSize: 16 };
      case 'large':
        return { width: 64, height: 64, fontSize: 20, badgeSize: 18 };
      case 'xlarge':
        return { width: 80, height: 80, fontSize: 24, badgeSize: 20 };
      default:
        return { width: 48, height: 48, fontSize: 16, badgeSize: 16 };
    }
  };

  const sizeConfig = getSizeConfig();

  const getInitials = (fullName: string): string => {
    if (!fullName) return '?';
    
    const words = fullName.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const getBackgroundColor = (): string => {
    if (backgroundColor) return backgroundColor;
    
    // Generate color from name hash
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85929E'
    ];
    
    if (!name) return colors[0];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const renderBadge = () => {
    if (!badge) return null;

    const badgeValue = typeof badge === 'number' ? 
      (badge > 99 ? '99+' : badge.toString()) : '';

    return (
      <View style={[
        styles.badge,
        {
          width: sizeConfig.badgeSize,
          height: sizeConfig.badgeSize,
          borderRadius: sizeConfig.badgeSize / 2,
          backgroundColor: badgeColor || theme.colors.error,
          top: -sizeConfig.badgeSize / 4,
          right: -sizeConfig.badgeSize / 4
        }
      ]}>
        {typeof badge === 'number' && (
          <Text style={[
            styles.badgeText,
            { fontSize: sizeConfig.badgeSize * 0.6 }
          ]}>
            {badgeValue}
          </Text>
        )}
      </View>
    );
  };

  const renderEditIcon = () => {
    if (!showEditIcon) return null;

    return (
      <TouchableOpacity
        style={[
          styles.editIcon,
          {
            width: sizeConfig.width * 0.3,
            height: sizeConfig.width * 0.3,
            borderRadius: (sizeConfig.width * 0.3) / 2,
            bottom: 0,
            right: 0
          }
        ]}
        onPress={onEditPress}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="pencil"
          size={sizeConfig.width * 0.15}
          color={theme.colors.onPrimary}
        />
      </TouchableOpacity>
    );
  };

  const avatarContent = (
    <View style={[
      styles.container,
      {
        width: sizeConfig.width,
        height: sizeConfig.height,
        borderRadius: sizeConfig.width / 2,
        backgroundColor: image ? 'transparent' : getBackgroundColor()
      },
      style
    ]}>
      {image ? (
        <Image
          source={{ uri: image }}
          style={[
            styles.image,
            {
              width: sizeConfig.width,
              height: sizeConfig.height,
              borderRadius: sizeConfig.width / 2
            },
            imageStyle
          ]}
          resizeMode="cover"
        />
      ) : (
        <Text style={[
          styles.initials,
          {
            fontSize: sizeConfig.fontSize,
            color: textColor || theme.colors.onPrimary
          }
        ]}>
          {getInitials(name)}
        </Text>
      )}
      
      {renderBadge()}
      {renderEditIcon()}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        {avatarContent}
      </TouchableOpacity>
    );
  }

  return avatarContent;
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    } as ViewStyle,
    
    touchable: {
      alignSelf: 'flex-start',
    } as ViewStyle,
    
    image: {
      backgroundColor: theme.colors.surfaceVariant,
    } as ImageStyle,
    
    initials: {
      fontWeight: '600',
      textAlign: 'center',
    } as TextStyle,
    
    badge: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.colors.surface,
    } as ViewStyle,
    
    badgeText: {
      color: theme.colors.onError,
      fontWeight: '600',
      textAlign: 'center',
    } as TextStyle,
    
    editIcon: {
      position: 'absolute',
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: theme.colors.surface,
    } as ViewStyle,
  });

export default Avatar;