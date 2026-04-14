import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Theme } from '../constants/theme';
import Card from './Card';

export interface MetricData {
  icon: string;
  value: string;
  label: string;
  color: string;
}

export interface MetricsCardProps {
  metric: MetricData;
  style?: ViewStyle;
  onPress?: () => void;
  isSelected?: boolean;
}

const MetricsCard: React.FC<MetricsCardProps> = ({
  metric,
  style,
  onPress,
  isSelected = false
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.touchable, style]}
    >
      <Card
        style={StyleSheet.flatten([
          styles.container,
          isSelected && { borderWidth: 2, borderColor: metric.color }
        ])}
        variant="filled"
        padding={12}
      >
        <View style={styles.content}>
          <MaterialCommunityIcons
            name={metric.icon as any}
            size={24}
            color={metric.color}
            style={styles.icon}
          />
          <Text style={[styles.value, isSelected && { color: metric.color }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {metric.value}
          </Text>
          <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {metric.label}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    touchable: {
      flex: 1,
      marginHorizontal: 2,
      minWidth: 70,
    } as ViewStyle,

    container: {
      flex: 1,
    } as ViewStyle,

    content: {
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    icon: {
      marginBottom: 6,
    } as ViewStyle,

    value: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: 2,
    } as TextStyle,

    label: {
      fontSize: 10,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      lineHeight: 12,
    } as TextStyle,
  });

export default MetricsCard;