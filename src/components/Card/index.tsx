import React, { ReactNode } from 'react';
import CardComponent from '../Card';

interface LegacyCardProps {
  children: ReactNode;
  padding?: 'none' | 'small' | 'medium' | 'large';
  elevation?: number;
  onPress?: () => void;
  style?: any;
}

// Legacy wrapper to maintain compatibility
export default function Card({ 
  children, 
  padding = 'medium', 
  elevation = 2, 
  onPress,
  style 
}: LegacyCardProps) {
  // Convert legacy padding to numeric values
  const paddingMap = {
    'none': 0,
    'small': 12,
    'medium': 16,
    'large': 24
  };

  return (
    <CardComponent
      padding={paddingMap[padding]}
      elevation={elevation}
      onPress={onPress}
      style={style}
    >
      {children}
    </CardComponent>
  );
}