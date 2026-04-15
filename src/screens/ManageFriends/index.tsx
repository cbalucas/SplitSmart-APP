import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { Participant } from '../../types';
import { Card, Button, HeaderBar } from '../../components';
import SearchBar from '../../components/SearchBar';
import { FriendItemProps, NewFriendData, TabType, AVATAR_COLORS } from './types';
import { createStyles } from './styles';
import { manageFriendsLanguage } from './language';

interface NameValidation {
  isValid: boolean;
  isChecking: boolean;
  message: string;
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
    const index = name.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
  };

  return (
    <TouchableOpacity style={styles.friendItem} onPress={onPress}>
      <View style={styles.friendHeader}>
        <View style={styles.friendMainInfo}>
          <Text style={styles.friendName}>{friend.name}</Text>
        </View>
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
      {friend.alias_cbu && (
        <View style={styles.aliasRow}>
          <MaterialCommunityIcons
            name="cash"
            size={14}
            color={theme.colors.primary}
            style={styles.contactIcon}
          />
          <Text style={styles.friendAlias}>{friend.alias_cbu}</Text>
        </View>
      )}
      {(friend.phone || friend.email) && (
        <View style={styles.contactRow}>
          {friend.phone && (
            <View style={styles.contactItem}>
              <MaterialCommunityIcons
                name="phone"
                size={14}
                color={theme.colors.onSurfaceVariant}
                style={styles.contactIcon}
              />
              <Text style={styles.friendPhone}>{friend.phone}</Text>
            </View>
          )}
          {friend.phone && friend.email && (
            <Text style={styles.contactSeparator}>|</Text>
          )}
          {friend.email && (
            <View style={styles.contactItem}>
              <MaterialCommunityIcons
                name="email"
                size={14}
                color={theme.colors.onSurfaceVariant}
                style={styles.contactIcon}
              />
              <Text style={styles.friendEmail}>{friend.email}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const ManageFriendsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { getFriends, addParticipant, updateParticipant, deleteParticipant, refreshData } = useData();
  const styles = createStyles(theme);
  const t = manageFriendsLanguage[language] || manageFriendsLanguage.es;

  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<Participant[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Participant[]>([]);
  const [editingFriend, setEditingFriend] = useState<Participant | null>(null);
  const [newFriend, setNewFriend] = useState<NewFriendData>({
    name: '',
    email: '',
    phone: '',
    alias_cbu: ''
  });
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [nameValidation, setNameValidation] = useState<NameValidation>({
    isValid: false,
    isChecking: false,
    message: ''
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

  const validateFriendName = (name: string) => {
    if (name.length < 2) {
      setNameValidation({ isValid: false, isChecking: false, message: t.nameValidation.tooShort });
      return;
    }

    setNameValidation({ isValid: false, isChecking: true, message: t.nameValidation.checking });

    const trimmedName = name.trim().toLowerCase();
    const isDuplicate = friends.some(f => {
      if (editingFriend && f.id === editingFriend.id) return false;
      return f.name.trim().toLowerCase() === trimmedName;
    });

    if (isDuplicate) {
      setNameValidation({ isValid: false, isChecking: false, message: t.nameValidation.duplicate });
    } else {
      setNameValidation({ isValid: true, isChecking: false, message: t.nameValidation.available });
    }
  };

  useEffect(() => {
    if (newFriend.name.trim()) {
      const timeoutId = setTimeout(() => {
        validateFriendName(newFriend.name.trim());
      }, 400);
      return () => clearTimeout(timeoutId);
    } else {
      setNameValidation({ isValid: false, isChecking: false, message: '' });
    }
  }, [newFriend.name, friends, editingFriend]);



  const handleDeleteFriend = (friend: Participant) => {
    Alert.alert(
      t.alerts.delete.title,
      t.alerts.delete.message.replace('{name}', friend.name),
      [
        { text: t.alerts.delete.cancel, style: 'cancel' },
        {
          text: t.alerts.delete.confirm,
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteParticipant(friend.id);
              await loadFriends();
              Alert.alert('', t.alerts.success.deleted.replace('{name}', friend.name));
            } catch (error: any) {
              if (error.message && error.message.includes('still used')) {
                Alert.alert(
                  t.alerts.error.cantDelete,
                  t.alerts.error.inUse.replace('{name}', friend.name)
                );
              } else {
                Alert.alert(t.alerts.error.general, t.alerts.error.deleteFailed);
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
    setActiveTab('new');
  };

  const handleSaveFriend = async () => {
    setSubmittedOnce(true);
    if (!newFriend.name.trim()) {
      Alert.alert(t.alerts.error.general, t.alerts.error.nameRequired);
      return;
    }

    // Verificación sincrónica de seguridad (cubre el caso de presionar guardar antes del debounce)
    const trimmedName = newFriend.name.trim().toLowerCase();
    const isDuplicate = friends.some(f => {
      if (editingFriend && f.id === editingFriend.id) return false;
      return f.name.trim().toLowerCase() === trimmedName;
    });

    if (isDuplicate) {
      setNameValidation({ isValid: false, isChecking: false, message: t.nameValidation.duplicate });
      return;
    }

    // Validar formato de teléfono (si fue ingresado)
    if (newFriend.phone.trim() && !/^\+?\d{1,16}$/.test(newFriend.phone.trim())) {
      Alert.alert(t.alerts.error.general, t.alerts.error.phoneInvalid);
      return;
    }

    // Validar formato de email (si fue ingresado)
    if (newFriend.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newFriend.email.trim())) {
      Alert.alert(t.alerts.error.general, t.alerts.error.emailInvalid);
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
        Alert.alert('', t.alerts.success.updated);
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
        Alert.alert('', t.alerts.success.added);
      }

      await loadFriends();
      
      // Reset form and return to list
      setNewFriend({ name: '', email: '', phone: '', alias_cbu: '' });
      setEditingFriend(null);
      setSubmittedOnce(false);
      setNameValidation({ isValid: false, isChecking: false, message: '' });
      setActiveTab('list');
    } catch (error) {
      Alert.alert(t.alerts.error.general, t.alerts.error.saveFailed);
    }
  };

  const renderHeader = () => (
    <HeaderBar
      title={t.screen.title}
      titleAlignment="left"
      useDynamicColors={true}
      showThemeToggle={true}
      showLanguageSelector={true}
      showHelp={true}
      showLogout={true}
      showBackButton={false}
      elevation={true}
    />
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'list' ? styles.activeTab : styles.inactiveTab
        ]}
        onPress={() => {
          setActiveTab('list');
          // Reset form when switching away from new tab
          if (activeTab === 'new') {
            setEditingFriend(null);
            setNewFriend({ name: '', email: '', phone: '', alias_cbu: '' });
            setNameValidation({ isValid: false, isChecking: false, message: '' });
          }
        }}
      >
        <Text style={[
          styles.tabText,
          activeTab === 'list' ? styles.activeTabText : styles.inactiveTabText
        ]}>
          {t.tabs.list}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'new' ? styles.activeTab : styles.inactiveTab
        ]}
        onPress={() => setActiveTab('new')}
      >
        <Text style={[
          styles.tabText,
          activeTab === 'new' ? styles.activeTabText : styles.inactiveTabText
        ]}>
          {t.tabs.new}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearchBar = () => (
    <SearchBar
      value={searchQuery}
      onChangeText={setSearchQuery}
      placeholder={t.screen.searchPlaceholder}
    />
  );

  const renderNewFriendTab = () => (
    <ScrollView style={styles.newFriendContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <Card style={styles.addFormCard}>
        <Text style={styles.addFormTitle}>
          {editingFriend ? t.form.editTitle : t.form.addTitle}
        </Text>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, (submittedOnce && !newFriend.name.trim()) || (!nameValidation.isValid && !!nameValidation.message && !nameValidation.isChecking) ? styles.inputLabelError : undefined]}>
            {t.form.nameLabel}<Text style={styles.requiredStar}> *</Text>
          </Text>
          <View style={styles.inputWithIndicator}>
            <TextInput
              style={[
                styles.input,
                { flex: 1 },
                nameValidation.isValid && styles.inputValid,
                (!nameValidation.isValid && nameValidation.message && !nameValidation.isChecking) && styles.inputInvalid
              ]}
              placeholder={t.form.namePlaceholder}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={newFriend.name}
              onChangeText={(text) => setNewFriend(prev => ({ ...prev, name: text }))}
            />
            <View style={styles.validationIndicator}>
              {nameValidation.isChecking ? (
                <MaterialCommunityIcons name="loading" size={20} color={theme.colors.primary} />
              ) : nameValidation.isValid ? (
                <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
              ) : nameValidation.message ? (
                <MaterialCommunityIcons name="close-circle" size={20} color="#FF5252" />
              ) : null}
            </View>
          </View>
          {nameValidation.message ? (
            <Text style={[
              styles.validationText,
              nameValidation.isValid ? styles.validationTextSuccess : styles.validationTextError
            ]}>
              {nameValidation.message}
            </Text>
          ) : null}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t.form.cbuLabel} {t.form.optional}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.form.cbuPlaceholder}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={newFriend.alias_cbu}
            onChangeText={(text) => setNewFriend(prev => ({ ...prev, alias_cbu: text }))}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t.form.phoneLabel} {t.form.optional}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.form.phonePlaceholder}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={newFriend.phone}
            onChangeText={(text) => {
              const startsWithPlus = text.startsWith('+');
              let digits = text.replace(/\D/g, '');
              if (digits.length > 16) digits = digits.slice(0, 16);
              const filtered = startsWithPlus ? '+' + digits : digits;
              setNewFriend(prev => ({ ...prev, phone: filtered }));
            }}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{t.form.emailLabel} {t.form.optional}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.form.emailPlaceholder}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={newFriend.email}
            onChangeText={(text) => setNewFriend(prev => ({ ...prev, email: text.toLowerCase().replace(/\s/g, '') }))}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formButtons}>
          <Button
            title={t.buttons.cancel}
            variant="outlined"
            size="medium"
            onPress={() => {
              setActiveTab('list');
              setEditingFriend(null);
              setNewFriend({ name: '', email: '', phone: '', alias_cbu: '' });
              setSubmittedOnce(false);
              setNameValidation({ isValid: false, isChecking: false, message: '' });
            }}
            style={styles.cancelButton}
          />
          <Button
            title={editingFriend ? t.buttons.save : t.buttons.add}
            variant="filled"
            size="medium"
            onPress={handleSaveFriend}
            style={styles.saveButton}
          />
        </View>
      </Card>
    </ScrollView>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons
        name="account-group-outline"
        size={80}
        color={theme.colors.onSurfaceVariant}
      />
      <Text style={styles.emptyTitle}>{t.empty.title}</Text>
      <Text style={styles.emptySubtitle}>
        {t.empty.subtitle}
      </Text>
      <Button
        title={t.empty.button}
        variant="filled"
        size="medium"
        onPress={() => setActiveTab('new')}
        style={styles.emptyButton}
      />
    </View>
  );

  const renderListTab = () => (
    <View style={styles.tabContent}>
      {renderSearchBar()}
      {filteredFriends.length === 0 && !searchQuery ? (
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
    </View>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.safeContent} edges={['bottom', 'left', 'right']}>
        {renderTabs()}
        {activeTab === 'list' ? renderListTab() : renderNewFriendTab()}
      </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
};



export default ManageFriendsScreen;