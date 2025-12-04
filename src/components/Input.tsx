import React, { useState, forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  KeyboardTypeOptions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../constants/theme';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  icon?: string;
  rightIcon?: string;
  type?: 'text' | 'email' | 'phone' | 'number' | 'password';
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  onRightIconPress?: () => void;
  required?: boolean;
  success?: boolean;
  disabled?: boolean;
  variant?: 'outlined' | 'filled';
}

const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  icon,
  rightIcon,
  type = 'text',
  containerStyle,
  inputStyle,
  labelStyle,
  onRightIconPress,
  required = false,
  success = false,
  disabled = false,
  variant = 'outlined',
  value,
  onChangeText,
  placeholder,
  ...rest
}, ref) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getKeyboardType = (): KeyboardTypeOptions => {
    switch (type) {
      case 'email':
        return 'email-address';
      case 'phone':
        return 'phone-pad';
      case 'number':
        return 'numeric';
      default:
        return 'default';
    }
  };

  const getSecureTextEntry = (): boolean => {
    return type === 'password' && !showPassword;
  };

  const handleFocus = (e: any) => {
    setIsFocused(true);
    rest.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    rest.onBlur?.(e);
  };

  const handlePasswordToggle = () => {
    setShowPassword(!showPassword);
  };

  const getBorderColor = () => {
    if (error) return theme.colors.error;
    if (success) return theme.colors.success;
    if (isFocused) return theme.colors.primary;
    return theme.colors.outline;
  };

  const getBackgroundColor = () => {
    if (variant === 'filled') {
      return disabled ? theme.colors.surfaceVariant + '40' : theme.colors.surfaceVariant;
    }
    return disabled ? theme.colors.surface + '40' : theme.colors.surface;
  };

  const renderIcon = (iconName: string, onPress?: () => void, position: 'left' | 'right' = 'left') => {
    const iconColor = error ? theme.colors.error : 
                     success ? theme.colors.success : 
                     isFocused ? theme.colors.primary : 
                     theme.colors.onSurfaceVariant;

    if (onPress) {
      return (
        <TouchableOpacity
          style={[
            styles.icon,
            position === 'left' ? styles.leftIcon : styles.rightIcon
          ]}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={iconName as any}
            size={20}
            color={iconColor}
          />
        </TouchableOpacity>
      );
    }

    return (
      <View style={[
        styles.icon,
        position === 'left' ? styles.leftIcon : styles.rightIcon
      ]}>
        <MaterialCommunityIcons
          name={iconName as any}
          size={20}
          color={iconColor}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[
          styles.label,
          { color: error ? theme.colors.error : theme.colors.onSurface },
          labelStyle
        ]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={[
        styles.inputContainer,
        variant === 'filled' ? styles.filledContainer : styles.outlinedContainer,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: variant === 'outlined' ? getBorderColor() : 'transparent',
          borderWidth: variant === 'outlined' ? (isFocused ? 2 : 1) : 0,
        },
        disabled && styles.disabled
      ]}>
        {icon && renderIcon(icon, undefined, 'left')}
        
        <TextInput
          ref={ref}
          style={[
            styles.input,
            {
              color: disabled ? theme.colors.disabled : theme.colors.onSurface,
              paddingLeft: icon ? 44 : theme.spacing.md,
              paddingRight: (rightIcon || type === 'password') ? 44 : theme.spacing.md,
            },
            inputStyle
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.placeholder}
          keyboardType={getKeyboardType()}
          secureTextEntry={getSecureTextEntry()}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...rest}
        />
        
        {type === 'password' && renderIcon(
          showPassword ? 'eye-off' : 'eye',
          handlePasswordToggle,
          'right'
        )}
        
        {rightIcon && type !== 'password' && renderIcon(
          rightIcon,
          onRightIconPress,
          'right'
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
      
      {success && !error && (
        <View style={styles.successContainer}>
          <MaterialCommunityIcons
            name="check-circle"
            size={16}
            color={theme.colors.success}
          />
          <Text style={styles.successText}>
            Válido
          </Text>
        </View>
      )}
    </View>
  );
});

Input.displayName = 'Input';

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginBottom: theme.spacing.md,
    } as ViewStyle,
    
    label: {
      ...theme.typography.labelLarge,
      fontWeight: '500',
      marginBottom: theme.spacing.sm,
    } as TextStyle,
    
    required: {
      color: theme.colors.error,
    } as TextStyle,
    
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 48,
      borderRadius: theme.borderRadius.sm,
    } as ViewStyle,
    
    outlinedContainer: {
      borderWidth: 1,
    } as ViewStyle,
    
    filledContainer: {
      borderBottomWidth: 2,
      borderBottomColor: theme.colors.outline,
    } as ViewStyle,
    
    input: {
      flex: 1,
      ...theme.typography.bodyLarge,
      paddingVertical: theme.spacing.sm,
      textAlignVertical: 'center',
    } as TextStyle,
    
    icon: {
      position: 'absolute',
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    } as ViewStyle,
    
    leftIcon: {
      left: 4,
    } as ViewStyle,
    
    rightIcon: {
      right: 4,
    } as ViewStyle,
    
    disabled: {
      opacity: 0.6,
    } as ViewStyle,
    
    errorText: {
      ...theme.typography.bodySmall,
      color: theme.colors.error,
      marginTop: theme.spacing.xs,
      marginLeft: theme.spacing.xs,
    } as TextStyle,
    
    successContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.xs,
      marginLeft: theme.spacing.xs,
    } as ViewStyle,
    
    successText: {
      ...theme.typography.bodySmall,
      color: theme.colors.success,
      marginLeft: theme.spacing.xs,
    } as TextStyle,
  });

export default Input;