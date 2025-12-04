import React from 'react';
import { TouchableOpacity, StyleSheet, View, Text, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

interface UserAvatarProps {
  size?: number;
  onPress?: () => void;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  size = 36,
  onPress
}) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <TouchableOpacity onPress={onPress} style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
        <MaterialCommunityIcons name="account" size={size * 0.6} color="#FFFFFF" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} style={[styles.container, { width: size, height: size, borderRadius: size / 2 }]}>
      {user.avatar ? (
        <Image 
          source={{ uri: user.avatar }} 
          style={{ width: size, height: size, borderRadius: size / 2 }} 
        />
      ) : (
        <View style={[styles.placeholderContainer, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
            {user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4B89DC',
    overflow: 'hidden',
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4B89DC',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
