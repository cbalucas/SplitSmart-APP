import React, { ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';

interface CardProps {
  children: ReactNode;
  padding?: 'none' | 'small' | 'medium' | 'large';
  elevation?: number;
  onPress?: () => void;
  style?: any;
}

export default function Card({ 
  children, 
  padding = 'medium', 
  elevation = 2, 
  onPress,
  style 
}: CardProps) {
  const cardStyle = [
    styles.card,
    styles[padding],
    { elevation },
    style
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    margin: 8
  },
  
  // Padding variants
  none: {
    padding: 0
  },
  small: {
    padding: 12
  },
  medium: {
    padding: 16
  },
  large: {
    padding: 24
  }
});