import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useData, SyncStatus } from '../context/DataContext';
import { showAlert } from '../services/alertService';

export interface SyncStatusIndicatorProps {
  /** 'icon' = solo ícono (para headers); 'full' = ícono + texto (para perfil/ajustes) */
  variant?: 'icon' | 'full';
  /** Tamaño del ícono */
  size?: number;
  /** Color base (por defecto usa el color de estado). Solo aplica al ícono sincronizado. */
  color?: string;
  style?: ViewStyle;
}

type StatusVisual = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  label: string;
  spin: boolean;
};

const LABELS: Record<'es' | 'en' | 'pt', Record<Exclude<SyncStatus, 'disabled'>, string>> = {
  es: {
    synced: 'Sincronizado',
    syncing: 'Sincronizando…',
    offline: 'Sin conexión',
    error: 'Error de sincronización',
  },
  en: {
    synced: 'Synced',
    syncing: 'Syncing…',
    offline: 'Offline',
    error: 'Sync error',
  },
  pt: {
    synced: 'Sincronizado',
    syncing: 'Sincronizando…',
    offline: 'Sem conexão',
    error: 'Erro de sincronização',
  },
};

const EXTRA: Record<'es' | 'en' | 'pt', { retryIn: string; retryNow: string; close: string; willRetry: string }> = {
  es: { retryIn: 'reintento en {s}s', retryNow: 'Reintentar ahora', close: 'Cerrar', willRetry: 'Se reintentará automáticamente en {s} s.' },
  en: { retryIn: 'retry in {s}s', retryNow: 'Retry now', close: 'Close', willRetry: 'It will retry automatically in {s} s.' },
  pt: { retryIn: 'nova tentativa em {s}s', retryNow: 'Tentar agora', close: 'Fechar', willRetry: 'Tentará novamente automaticamente em {s} s.' },
};

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  variant = 'icon',
  size = 22,
  color,
  style,
}) => {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { syncStatus, syncNow, isSyncing, lastSyncError, syncRetryAt } = useData();
  const spinValue = useRef(new Animated.Value(0)).current;
  const spinAnimation = useRef<Animated.CompositeAnimation | null>(null);

  const lang = (['es', 'en', 'pt'].includes(language) ? language : 'es') as 'es' | 'en' | 'pt';
  const labels = LABELS[lang];
  const extra = EXTRA[lang];

  // Segundos que faltan para el próximo reintento automático (cuenta regresiva en vivo)
  const [retrySeconds, setRetrySeconds] = React.useState(0);
  useEffect(() => {
    if (!syncRetryAt) {
      setRetrySeconds(0);
      return;
    }
    const tick = () => setRetrySeconds(Math.max(0, Math.ceil((syncRetryAt - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [syncRetryAt]);

  // No mostrar nada para usuarios locales / sync deshabilitado
  const visible = syncStatus !== 'disabled';

  const getVisual = (): StatusVisual => {
    switch (syncStatus) {
      case 'syncing':
        return { icon: 'cloud-sync-outline', color: theme.colors.primary, label: labels.syncing, spin: true };
      case 'offline':
        return { icon: 'cloud-off-outline', color: theme.colors.onSurfaceVariant, label: labels.offline, spin: false };
      case 'error':
        return { icon: 'cloud-alert-outline', color: theme.colors.error, label: labels.error, spin: false };
      case 'synced':
      default:
        return { icon: 'cloud-check-outline', color: color || theme.colors.success, label: labels.synced, spin: false };
    }
  };

  const baseVisual = getVisual();
  const visual =
    (syncStatus === 'error' || syncStatus === 'offline') && retrySeconds > 0
      ? { ...baseVisual, label: `${baseVisual.label} · ${extra.retryIn.replace('{s}', String(retrySeconds))}` }
      : baseVisual;

  // Animación de giro cuando está sincronizando
  useEffect(() => {
    if (visual.spin) {
      spinValue.setValue(0);
      spinAnimation.current = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinAnimation.current.start();
    } else {
      spinAnimation.current?.stop();
      spinValue.setValue(0);
    }
    return () => spinAnimation.current?.stop();
  }, [visual.spin, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!visible) return null;

  const handlePress = () => {
    if (isSyncing) return;
    // En error / sin conexión, mostrar el MOTIVO y ofrecer reintento inmediato.
    // Se usa el alert propio de la app: Alert.alert de React Native no hace nada en web.
    if ((syncStatus === 'error' || syncStatus === 'offline') && lastSyncError) {
      const retryLine = retrySeconds > 0 ? `\n\n${extra.willRetry.replace('{s}', String(retrySeconds))}` : '';
      showAlert({
        type: syncStatus === 'offline' ? 'warning' : 'error',
        title: syncStatus === 'offline' ? labels.offline : labels.error,
        message: `${lastSyncError}${retryLine}`,
        buttons: [
          { text: extra.close, style: 'cancel' },
          { text: extra.retryNow, onPress: () => { syncNow(); } },
        ],
      });
      return;
    }
    syncNow();
  };

  const iconNode = (
    <Animated.View style={visual.spin ? { transform: [{ rotate: spin }] } : undefined}>
      <MaterialCommunityIcons name={visual.icon} size={size} color={visual.color} />
    </Animated.View>
  );

  if (variant === 'full') {
    return (
      <TouchableOpacity
        style={[styles.fullContainer, { borderColor: visual.color + '33', backgroundColor: visual.color + '14' }, style]}
        onPress={handlePress}
        activeOpacity={0.7}
        disabled={isSyncing}
        accessibilityRole="button"
        accessibilityLabel={visual.label}
      >
        {iconNode}
        <Text style={[styles.fullLabel, { color: visual.color }]} numberOfLines={1}>
          {visual.label}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.iconContainer, style]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={isSyncing}
      accessibilityRole="button"
      accessibilityLabel={visual.label}
    >
      {iconNode}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  fullLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
});

export default SyncStatusIndicator;
