import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle
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
}

const MetricsCard: React.FC<MetricsCardProps> = ({
  metric,
  style
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <Card style={StyleSheet.flatten([styles.container, style])} variant="filled" padding={12}>
      <View style={styles.content}>
        <MaterialCommunityIcons
          name={metric.icon as any}
          size={24}
          color={metric.color}
          style={styles.icon}
        />
        <Text style={styles.value} numberOfLines={1}>
          {metric.value}
        </Text>
        <Text style={styles.label} numberOfLines={1}>
          {metric.label}
        </Text>
      </View>
    </Card>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      marginHorizontal: 2,
      minWidth: 70,
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