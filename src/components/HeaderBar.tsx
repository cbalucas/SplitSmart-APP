import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Modal,
  Pressable,
  ViewStyle,
  TextStyle,
  ImageStyle
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
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
  showHelp?: boolean;
  rightIconLabel?: string; // Label para el overflow menu
  overflowBeforeItems?: Array<{ icon: string; label: string; onPress: () => void }>;
  overflowAfterItems?: Array<{ icon: string; label: string; onPress: () => void }>;
  showLogo?: boolean;
  isModal?: boolean;
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
  useDynamicColors = false,
  showHelp = false,
  rightIconLabel,
  overflowBeforeItems,
  overflowAfterItems,
  showLogo = true,
  isModal = false
}) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { language } = useLanguage();
  const [overflowVisible, setOverflowVisible] = useState(false);

  // Determinar colores dinámicos
  const dynamicBackgroundColor = useDynamicColors 
    ? (isDarkMode ? '#00B359' : '#007AFF')
    : backgroundColor || theme.colors.surface;
  
  const dynamicTitleColor = useDynamicColors 
    ? '#FFFFFF'
    : titleColor || theme.colors.onSurface;
    
  const styles = createStyles(theme, titleAlignment, dynamicBackgroundColor, isModal);

  // Contar cuántos elementos van a la derecha
  const rightCount = [
    showThemeToggle,
    showLanguageSelector,
    showHelp,
    !!rightIcon,
    !!rightText,
  ].filter(Boolean).length
    + (overflowBeforeItems?.length || 0)
    + (overflowAfterItems?.length || 0);

  const useOverflow = rightCount > 2;

  const getLanguageFlag = () => {
    const flags: Record<string, string> = { es: '🇦🇷', en: '🇺🇸', pt: '🇧🇷' };
    return flags[language] || '🌐';
  };

  const menuLabels: Record<string, Record<string, string>> = {
    es: { themeLight: 'Modo claro', themeDark: 'Modo oscuro', language: 'Idioma', help: 'Ayuda' },
    en: { themeLight: 'Light mode', themeDark: 'Dark mode', language: 'Language', help: 'Help' },
    pt: { themeLight: 'Modo claro', themeDark: 'Modo escuro', language: 'Idioma', help: 'Ajuda' },
  };
  const ml = menuLabels[language] || menuLabels.es;

  const getThemeLabel = () => isDarkMode ? ml.themeLight : ml.themeDark;
  const getThemeIcon = () => isDarkMode ? 'white-balance-sunny' : 'moon-waning-crescent';

  const handleLeftPress = () => { if (onLeftPress) onLeftPress(); };
  const handleRightPress = () => { if (onRightPress) onRightPress(); };

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

    // Si hay logo visible y no hay ningún elemento izquierdo real, no renderizar placeholder
    if (showLogo) return null;

    return <View style={styles.actionButton} />;
  };

  const renderRightElement = () => {
    // Modo overflow: más de 2 íconos → mostrar botón "..."
    if (useOverflow) {
      return (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setOverflowVisible(true)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="dots-vertical"
            size={24}
            color={dynamicTitleColor}
          />
        </TouchableOpacity>
      );
    }

    // Modo normal: mostrar íconos directamente
    const elements: React.ReactNode[] = [];

    if (additionalRightElements) elements.push(additionalRightElements);
    // overflowBeforeItems en modo normal
    (overflowBeforeItems || []).forEach((item, i) => {
      elements.push(
        <TouchableOpacity key={`before-${i}`} style={styles.actionButton} onPress={item.onPress} activeOpacity={0.7}>
          <MaterialCommunityIcons name={item.icon as any} size={24} color={dynamicTitleColor} />
        </TouchableOpacity>
      );
    });
    if (showThemeToggle) {
      elements.push(
        <ThemeToggle key="theme-toggle" size={22} color={dynamicTitleColor} />
      );
    }

    if (showLanguageSelector) {
      elements.push(
        <LanguageSelector key="language-selector" size={24} color={dynamicTitleColor} />
      );
    }

    if (showHelp) {
      elements.push(
        <TouchableOpacity
          key="help-button"
          style={styles.actionButton}
          onPress={() => Alert.alert('Próximamente', 'Esta función estará disponible en una próxima versión.')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="help-circle-outline" size={24} color={dynamicTitleColor} />
        </TouchableOpacity>
      );
    }

    if (rightIcon) {
      elements.push(
        <TouchableOpacity
          key="right-icon"
          style={styles.actionButton}
          onPress={handleRightPress}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name={rightIcon as any} size={24} color={dynamicTitleColor} />
        </TouchableOpacity>
      );
    }

    if (rightText) {
      elements.push(
        <TouchableOpacity
          key="right-text"
          style={styles.textButton}
          onPress={handleRightPress}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionText, { color: dynamicTitleColor }]}>{rightText}</Text>
        </TouchableOpacity>
      );
    }

    // overflowAfterItems en modo normal
    (overflowAfterItems || []).forEach((item, i) => {
      elements.push(
        <TouchableOpacity key={`after-${i}`} style={styles.actionButton} onPress={item.onPress} activeOpacity={0.7}>
          <MaterialCommunityIcons name={item.icon as any} size={24} color={dynamicTitleColor} />
        </TouchableOpacity>
      );
    });

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

  const renderOverflowMenu = () => (
    <Modal
      visible={overflowVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setOverflowVisible(false)}
    >
      <Pressable style={styles.overflowOverlay} onPress={() => setOverflowVisible(false)}>
        <View style={[styles.overflowMenu, { backgroundColor: theme.colors.surfaceContainer }]}>
          {/* Items antes del bloque estándar */}
          {(overflowBeforeItems || []).map((item, i) => (
            <TouchableOpacity
              key={`before-${i}`}
              style={styles.overflowItem}
              onPress={() => { setOverflowVisible(false); item.onPress(); }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name={item.icon as any} size={22} color={theme.colors.onSurface} />
              <Text style={[styles.overflowItemLabel, { color: theme.colors.onSurface }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {showThemeToggle && (
            <TouchableOpacity
              style={styles.overflowItem}
              onPress={() => { toggleTheme(); setOverflowVisible(false); }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={getThemeIcon() as any}
                size={22}
                color={theme.colors.onSurface}
              />
              <Text style={[styles.overflowItemLabel, { color: theme.colors.onSurface }]}>
                {getThemeLabel()}
              </Text>
            </TouchableOpacity>
          )}

          {showLanguageSelector && (
            <LanguageSelector
              renderTrigger={(onPress) => (
                <TouchableOpacity
                  style={styles.overflowItem}
                  onPress={() => { setOverflowVisible(false); onPress(); }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 20 }}>{getLanguageFlag()}</Text>
                  <Text style={[styles.overflowItemLabel, { color: theme.colors.onSurface }]}>
                    {ml.language}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}

          {showHelp && (
            <TouchableOpacity
              style={styles.overflowItem}
              onPress={() => {
                setOverflowVisible(false);
                Alert.alert('Próximamente', 'Esta función estará disponible en una próxima versión.');
              }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="help-circle-outline" size={22} color={theme.colors.onSurface} />
              <Text style={[styles.overflowItemLabel, { color: theme.colors.onSurface }]}>{ml.help}</Text>
            </TouchableOpacity>
          )}

          {rightIcon && (
            <TouchableOpacity
              style={styles.overflowItem}
              onPress={() => { setOverflowVisible(false); handleRightPress(); }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name={rightIcon as any} size={22} color={theme.colors.onSurface} />
              <Text style={[styles.overflowItemLabel, { color: theme.colors.onSurface }]}>
                {rightIconLabel || rightIcon}
              </Text>
            </TouchableOpacity>
          )}

          {rightText && (
            <TouchableOpacity
              style={styles.overflowItem}
              onPress={() => { setOverflowVisible(false); handleRightPress(); }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="text" size={22} color={theme.colors.onSurface} />
              <Text style={[styles.overflowItemLabel, { color: theme.colors.onSurface }]}>{rightText}</Text>
            </TouchableOpacity>
          )}

          {/* Items después del bloque estándar */}
          {(overflowAfterItems || []).map((item, i) => (
            <TouchableOpacity
              key={`after-${i}`}
              style={styles.overflowItem}
              onPress={() => { setOverflowVisible(false); item.onPress(); }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name={item.icon as any} size={22} color={theme.colors.onSurface} />
              <Text style={[styles.overflowItemLabel, { color: theme.colors.onSurface }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );

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
            {showLogo && (
              <Image
                source={require('../../assets/splitsmart/icon.png')}
                style={styles.headerLogo}
                resizeMode="contain"
              />
            )}
            <View style={styles.titleTextContainer}>
              <Text
                style={[styles.title, { color: dynamicTitleColor }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {title}
              </Text>
              {subtitle && (
                <Text
                  style={[styles.subtitle, { color: dynamicTitleColor + '80' }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {subtitle}
                </Text>
              )}
            </View>
          </View>
          
          {renderRightElement()}
        </View>
      </View>
      {useOverflow && renderOverflowMenu()}
    </>
  );
};

const createStyles = (theme: Theme, titleAlignment: 'left' | 'center' = 'center', backgroundColor?: string, isModal: boolean = false) => {
  const isDynamic = backgroundColor && (backgroundColor === '#007AFF' || backgroundColor === '#00B359');
  const borderColor = isDynamic 
    ? (backgroundColor === '#007AFF' ? '#0056CC' : '#008A44')
    : theme.colors.outlineVariant;

  return StyleSheet.create({
    container: {
      paddingTop: isModal ? 0 : 30, // Account for status bar - 0 in modals (pageSheet)
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
      paddingLeft: 8,
      paddingRight: theme.spacing.md,
    } as ViewStyle,
    
    actionButton: {
      width: 40,
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
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 2,
    } as ViewStyle,

    titleTextContainer: {
      flex: 1,
      justifyContent: 'center',
    } as ViewStyle,

    headerLogo: {
      width: 34,
      height: 34,
      marginRight: 10,
      borderRadius: 8,
    } as ImageStyle,
    
    title: {
      ...theme.typography.titleLarge,
      fontWeight: '700',
      textAlign: 'left',
      fontSize: 20,
      textTransform: 'uppercase',
      letterSpacing: 1,
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

    overflowOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.2)',
    } as ViewStyle,

    overflowMenu: {
      position: 'absolute',
      top: 88,
      right: 12,
      borderRadius: 12,
      paddingVertical: 8,
      minWidth: 200,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    } as ViewStyle,

    overflowItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 18,
      gap: 14,
    } as ViewStyle,

    overflowItemLabel: {
      fontSize: 15,
      fontWeight: '500',
    } as TextStyle,
  });
};

export default HeaderBar;