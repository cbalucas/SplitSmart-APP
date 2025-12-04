import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: any;
}

export default function Button({ 
  title, 
  onPress, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  loading = false,
  style
}: ButtonProps) {
  const buttonStyle = [
    styles.button,
    styles[size],
    styles[variant],
    (disabled || loading) && styles.disabled,
    style
  ];

  const textStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`]
  ];

  return (
    <TouchableOpacity 
      style={buttonStyle} 
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? 'white' : '#4B89DC'} 
        />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  
  // Sizes
  small: {
    height: 36,
    paddingHorizontal: 16
  },
  medium: {
    height: 44,
    paddingHorizontal: 20
  },
  large: {
    height: 52,
    paddingHorizontal: 24
  },
  
  // Variants
  primary: {
    backgroundColor: '#4B89DC'
  },
  secondary: {
    backgroundColor: '#8E44AD'
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4B89DC'
  },
  
  // Text styles
  text: {
    fontWeight: '600'
  },
  primaryText: {
    color: 'white'
  },
  secondaryText: {
    color: 'white'
  },
  outlineText: {
    color: '#4B89DC'
  },
  
  // Text sizes
  smallText: {
    fontSize: 14
  },
  mediumText: {
    fontSize: 16
  },
  largeText: {
    fontSize: 18
  },
  
  // States
  disabled: {
    opacity: 0.5
  }
});