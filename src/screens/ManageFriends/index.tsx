import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ViewStyle,
  TextStyle
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { Theme } from '../../constants/theme';
import { Participant } from '../../types';
import { Card, Button, LanguageSelector, ThemeToggle } from '../../components';

interface FriendItemProps {
  friend: Participant;
  onPress: () => void;
  onDelete: () => void;
}

const FriendItem: React.FC<FriendItemProps> = ({ friend, onPress, onDelete }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <TouchableOpacity style={styles.friendItem} onPress={onPress}>
      <View style={styles.friendInfo}>
        <View style={[styles.avatar, { backgroundColor: getAvatarColor(friend.name) }]}>
          <Text style={styles.avatarText}>{getInitials(friend.name)}</Text>
        </View>
        <View style={styles.friendDetails}>
          <Text style={styles.friendName}>{friend.name}</Text>
          {friend.alias_cbu && (
            <Text style={styles.friendAlias}>{friend.alias_cbu}</Text>
          )}
          {friend.phone && (
            <Text style={styles.friendPhone}>{friend.phone}</Text>
          )}
          {friend.email && (
            <Text style={styles.friendEmail}>{friend.email}</Text>
          )}
        </View>
      </View>
      <View style={styles.friendActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={onDelete}
        >
          <MaterialCommunityIcons
            name="delete-outline"
            size={20}
            color={theme.colors.error}
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const ManageFriendsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { getFriends, addParticipant, updateParticipant, deleteParticipant, refreshData } = useData();
  const styles = createStyles(theme);

  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<Participant[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Participant[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFriend, setEditingFriend] = useState<Participant | null>(null);
  const [newFriend, setNewFriend] = useState({
    name: '',
    email: '',
    phone: '',
    alias_cbu: ''
  });

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const friendsList = await getFriends();
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  useEffect(() => {
    // Filter friends based on search query
    if (!searchQuery.trim()) {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter(participant =>
        participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (participant.email && participant.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (participant.phone && participant.phone.includes(searchQuery))
      );
      setFilteredFriends(filtered);
    }
  }, [friends, searchQuery]);



  const handleDeleteFriend = (friend: Participant) => {
    Alert.alert(
      'Eliminar Amigo',
      `¿Estás seguro de que quieres eliminar a ${friend.name} de tu lista de amigos?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteParticipant(friend.id);
              await loadFriends();
              Alert.alert('✅ Eliminado', `${friend.name} fue eliminado correctamente`);
            } catch (error: any) {
              if (error.message && error.message.includes('still used')) {
                Alert.alert(
                  'No se puede eliminar',
                  `${friend.name} está siendo usado en eventos activos. Para eliminarlo, primero debes quitarlo de todos los eventos.`
                );
              } else {
                Alert.alert('Error', 'No se pudo eliminar el amigo');
              }
            }
          }
        }
      ]
    );
  };

  const handleFriendPress = (friend: Participant) => {
    setEditingFriend(friend);
    setNewFriend({
      name: friend.name,
      email: friend.email || '',
      phone: friend.phone || '',
      alias_cbu: friend.alias_cbu || ''
    });
    setShowAddForm(true);
  };

  const handleSaveFriend = async () => {
    if (!newFriend.name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }

    try {
      if (editingFriend) {
        // Editar amigo existente
        await updateParticipant(editingFriend.id, {
          name: newFriend.name.trim(),
          email: newFriend.email.trim() || undefined,
          phone: newFriend.phone.trim() || undefined,
          alias_cbu: newFriend.alias_cbu.trim() || undefined,
          updatedAt: new Date().toISOString()
        });
        Alert.alert('✅ Actualizado', 'Amigo actualizado correctamente');
      } else {
        // Agregar nuevo amigo
        const friend: Participant = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: newFriend.name.trim(),
          email: newFriend.email.trim() || undefined,
          phone: newFriend.phone.trim() || undefined,
          alias_cbu: newFriend.alias_cbu.trim() || undefined,
          participantType: 'friend',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await addParticipant(friend);
        Alert.alert('✅ Agregado', 'Amigo agregado correctamente');
      }

      await loadFriends();
      
      // Reset form
      setNewFriend({ name: '', email: '', phone: '', alias_cbu: '' });
      setEditingFriend(null);
      setShowAddForm(false);
    } catch (error) {
      Alert.alert('Error', `No se pudo ${editingFriend ? 'actualizar' : 'agregar'} el amigo`);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{t('friends.title')}</Text>
      <View style={styles.headerRight}>
        <LanguageSelector size={26} color={theme.colors.onSurface} />
        <ThemeToggle size={24} color={theme.colors.onSurface} />
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            if (showAddForm) {
              setShowAddForm(false);
              setEditingFriend(null);
              setNewFriend({ name: '', email: '', phone: '', alias_cbu: '' });
            } else {
              setShowAddForm(true);
            }
          }}
        >
          <MaterialCommunityIcons
            name={showAddForm ? "close" : "plus"}
            size={24}
            color={theme.colors.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <MaterialCommunityIcons
        name="magnify"
        size={20}
        color={theme.colors.onSurfaceVariant}
        style={styles.searchIcon}
      />
      <TextInput
        style={styles.searchInput}
        placeholder={`${t('search')} ${t('friends').toLowerCase()}...`}
        placeholderTextColor={theme.colors.onSurfaceVariant}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
    </View>
  );

  const renderAddForm = () => {
    if (!showAddForm) return null;

    return (
      <Card style={styles.addFormCard}>
        <Text style={styles.addFormTitle}>
          {editingFriend ? t('friends.edit') : t('friends.add')}
        </Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('participants.name')} *</Text>
          <TextInput
            style={styles.input}
            placeholder={t('participants.name')}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={newFriend.name}
            onChangeText={(text) => setNewFriend(prev => ({ ...prev, name: text }))}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('profile.cbu')} ({t('optional')})</Text>
          <TextInput
            style={styles.input}
            placeholder={t('profile.cbu')}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={newFriend.alias_cbu}
            onChangeText={(text) => setNewFriend(prev => ({ ...prev, alias_cbu: text }))}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('profile.phone')} ({t('optional')})</Text>
          <TextInput
            style={styles.input}
            placeholder="+54 9 11 1234-5678"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={newFriend.phone}
            onChangeText={(text) => setNewFriend(prev => ({ ...prev, phone: text }))}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t('profile.email')} ({t('optional')})</Text>
          <TextInput
            style={styles.input}
            placeholder="correo@ejemplo.com"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={newFriend.email}
            onChangeText={(text) => setNewFriend(prev => ({ ...prev, email: text }))}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formButtons}>
          <Button
            title="Cancelar"
            variant="outlined"
            size="medium"
            onPress={() => {
              setShowAddForm(false);
              setEditingFriend(null);
              setNewFriend({ name: '', email: '', phone: '', alias_cbu: '' });
            }}
            style={styles.cancelButton}
          />
          <Button
            title={editingFriend ? "Guardar" : "Agregar"}
            variant="filled"
            size="medium"
            onPress={handleSaveFriend}
            style={styles.saveButton}
          />
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name="account-group-outline"
        size={80}
        color={theme.colors.onSurfaceVariant}
      />
      <Text style={styles.emptyTitle}>No tienes amigos agregados</Text>
      <Text style={styles.emptySubtitle}>
        Agrega amigos para poder incluirlos rápidamente en tus eventos
      </Text>
      <Button
        title="Agregar Primer Amigo"
        variant="filled"
        size="medium"
        onPress={() => setShowAddForm(true)}
        style={styles.emptyButton}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {renderHeader()}
      {!showAddForm && renderSearchBar()}
      
      {showAddForm ? (
        renderAddForm()
      ) : filteredFriends.length === 0 && !searchQuery ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FriendItem
              friend={item}
              onPress={() => handleFriendPress(item)}
              onDelete={() => handleDeleteFriend(item)}
            />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    } as ViewStyle,

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    } as ViewStyle,

    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      flex: 1,
    } as TextStyle,

    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    } as ViewStyle,

    addButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      marginHorizontal: 16,
      marginVertical: 12,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    } as ViewStyle,

    searchIcon: {
      marginRight: 8,
    } as ViewStyle,

    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.onSurface,
    } as TextStyle,

    addFormCard: {
      marginHorizontal: 16,
      marginBottom: 16,
      padding: 20,
    } as ViewStyle,

    addFormTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 16,
      textAlign: 'center',
    } as TextStyle,

    inputGroup: {
      marginBottom: 16,
    } as ViewStyle,

    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginBottom: 6,
    } as TextStyle,

    input: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.onSurface,
    } as ViewStyle,

    formButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
    } as ViewStyle,

    cancelButton: {
      flex: 0.48,
    } as ViewStyle,

    saveButton: {
      flex: 0.48,
    } as ViewStyle,

    listContainer: {
      paddingHorizontal: 16,
    } as ViewStyle,

    friendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    } as ViewStyle,

    friendInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    } as ViewStyle,

    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    } as ViewStyle,

    avatarText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FFFFFF',
    } as TextStyle,

    friendDetails: {
      flex: 1,
    } as ViewStyle,

    friendName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    } as TextStyle,

    friendEmail: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    } as TextStyle,

    friendAlias: {
      fontSize: 14,
      color: theme.colors.primary,
      marginTop: 2,
      fontWeight: '500',
    } as TextStyle,

    friendPhone: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    } as TextStyle,

    friendActions: {
      flexDirection: 'row',
      alignItems: 'center',
    } as ViewStyle,

    actionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    } as ViewStyle,

    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginTop: 16,
      textAlign: 'center',
    } as TextStyle,

    emptySubtitle: {
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      marginTop: 8,
      textAlign: 'center',
      lineHeight: 22,
    } as TextStyle,

    emptyButton: {
      marginTop: 24,
    } as ViewStyle,
  });

export default ManageFriendsScreen;