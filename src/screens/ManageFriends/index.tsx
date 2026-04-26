import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Participant } from '../../types';
import { Card, Button, HeaderBar, Input } from '../../components';
import Avatar from '../../components/Avatar';
import SearchBar from '../../components/SearchBar';
import { showAlert } from '../../services/alertService';
import { FriendItemProps, NewFriendData, TabType, AVATAR_COLORS } from './types';
import { createStyles } from './styles';
import { manageFriendsLanguage } from './language';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TutorialOverlay from '../../components/TutorialOverlay';

interface NameValidation {
  isValid: boolean;
  isChecking: boolean;
  message: string;
}



const FriendItem: React.FC<FriendItemProps> = ({ friend, onPress, onDelete, canEdit }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const borderColor = canEdit ? '#4CAF50' : '#2196F3';

  return (
    <TouchableOpacity style={[styles.friendItem, { borderLeftColor: borderColor }]} onPress={onPress} activeOpacity={0.7}>
      {/* Avatar: foto si tiene, iniciales si no */}
      <Avatar
        name={friend.name}
        image={friend.avatar}
        size="medium"
      />

      {/* Info */}
      <View style={styles.friendBody}>
        <View style={styles.friendHeader}>
          <View style={styles.friendMainInfo}>
            <Text style={styles.friendName}>{friend.name}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialCommunityIcons
              name={friend.isPublic ? 'earth' : 'lock-outline'}
              size={16}
              color={friend.isPublic ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
            {canEdit && (
              <TouchableOpacity style={styles.actionButton} onPress={onDelete} activeOpacity={0.7}>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {friend.alias_cbu && (
          <View style={styles.aliasRow}>
            <MaterialCommunityIcons name="bank-outline" size={13} color={theme.colors.primary} />
            <Text style={styles.friendAlias}>{friend.alias_cbu}</Text>
          </View>
        )}

        {(friend.phone || friend.email) && (
          <View style={styles.contactRow}>
            {friend.phone && (
              <View style={styles.contactItem}>
                <MaterialCommunityIcons name="phone-outline" size={13} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.friendPhone}>{friend.phone}</Text>
              </View>
            )}
            {friend.email && (
              <View style={styles.contactItem}>
                <MaterialCommunityIcons name="email-outline" size={13} color={theme.colors.onSurfaceVariant} />
                <Text style={styles.friendEmail}>{friend.email}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const ManageFriendsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { getFriends, getFriendsByUser, addParticipant, updateParticipant, deleteParticipant, refreshData } = useData();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);
  const t = manageFriendsLanguage[language] || manageFriendsLanguage.es;

  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [mfTourVisible, setMfTourVisible] = useState(false);
  const [mfTourStep, setMfTourStep] = useState(0);
  const mfHeaderRef = useRef<View>(null);
  const mfTabsRef = useRef<View>(null);
  const mfSearchRef = useRef<View>(null);
  const mfFilterRef = useRef<View>(null);
  const mfListRef = useRef<View>(null);
  const mfListAnchorRef = useRef<View>(null);
  const mfFormRef = useRef<View>(null);
  const mfFormInputsRef = useRef<View>(null);
  const mfFormButtonsRef = useRef<View>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [friendFilter, setFriendFilter] = useState<'all' | 'own' | 'public' | 'private'>('all');
  const [friends, setFriends] = useState<Participant[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Participant[]>([]);
  const [editingFriend, setEditingFriend] = useState<Participant | null>(null);
  const [newFriend, setNewFriend] = useState<NewFriendData>({
    name: '',
    email: '',
    phone: '',
    alias_cbu: '',
    avatar: undefined,
    is_public: false
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
      const friendsList = user?.id
        ? await getFriendsByUser(user.id)
        : await getFriends();
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  useEffect(() => {
    // Filter friends based on search query and visibility filter
    let result = friends;

    if (friendFilter === 'own') {
      result = result.filter(p => !p.createdByUserId || p.createdByUserId === user?.id);
    } else if (friendFilter === 'public') {
      result = result.filter(p => p.isPublic);
    } else if (friendFilter === 'private') {
      result = result.filter(p => !p.isPublic);
    }

    if (searchQuery.trim()) {
      result = result.filter(participant =>
        participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (participant.email && participant.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (participant.phone && participant.phone.includes(searchQuery))
      );
    }

    setFilteredFriends(result);
  }, [friends, searchQuery, friendFilter, user?.id]);

  const handleMfTourNext = () => {
    if (mfTourStep < 3) setMfTourStep(s => s + 1);
    else handleMfTourClose();
  };
  const handleMfTourPrev = () => {
    if (mfTourStep === 3) setActiveTab('list');
    if (mfTourStep > 0) setMfTourStep(s => s - 1);
  };
  const handleMfTourClose = () => { setMfTourVisible(false); setMfTourStep(0); setActiveTab('list'); };

  useEffect(() => {
    const checkMfTour = async () => {
      try {
        const seen = await AsyncStorage.getItem('splitsmart_friends_tour_seen');
        if (!seen) {
          setMfTourVisible(true);
          await AsyncStorage.setItem('splitsmart_friends_tour_seen', 'true');
        }
      } catch {}
    };
    checkMfTour();
  }, []);

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

  const pickFriendImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'] as any,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setNewFriend(prev => ({ ...prev, avatar: result.assets[0].uri }));
      }
    } catch (error) {
      showAlert({ type: 'error', title: 'Error', message: 'No se pudo seleccionar la imagen.' });
    }
  };

  const takeFriendPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert({ type: 'error', title: 'Permiso requerido', message: 'Se necesita acceso a la cámara para tomar una foto.' });
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setNewFriend(prev => ({ ...prev, avatar: result.assets[0].uri }));
      }
    } catch (error) {
      showAlert({ type: 'error', title: 'Error', message: 'No se pudo tomar la foto.' });
    }
  };

  const handlePickAvatarMenu = () => {
    showAlert({
      type: 'info',
      title: 'Foto del amigo',
      message: 'Elige una opción',
      buttons: [
        { text: 'Foto', icon: 'camera', onPress: takeFriendPhoto },
        { text: 'Galería', icon: 'image-multiple', onPress: pickFriendImageFromGallery },
        ...(newFriend.avatar ? [{
          text: 'Eliminar',
          icon: 'trash-can-outline',
          style: 'destructive' as const,
          onPress: () => setNewFriend(prev => ({ ...prev, avatar: undefined })),
        }] : []),
        { text: 'Cancelar', style: 'cancel' as const },
      ],
    });
  };

  const handleDeleteFriend = (friend: Participant) => {
    showAlert({
      type: 'destructive',
      title: t.alerts.delete.title,
      message: t.alerts.delete.message.replace('{name}', friend.name),
      buttons: [
        { text: t.alerts.delete.cancel, style: 'cancel' },
        {
          text: t.alerts.delete.confirm,
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteParticipant(friend.id);
              await loadFriends();
              showAlert({ type: 'success', title: t.alerts.success.deleted.replace('{name}', friend.name) });
            } catch (error: any) {
              if (error.message && error.message.includes('still used')) {
                showAlert({ type: 'error', title: t.alerts.error.cantDelete, message: t.alerts.error.inUse.replace('{name}', friend.name) });
              } else {
                showAlert({ type: 'error', title: t.alerts.error.general, message: t.alerts.error.deleteFailed });
              }
            }
          }
        }
      ]
    });
  };

  const handleFriendPress = (friend: Participant) => {
    // Amigos públicos de otros usuarios: solo lectura
    if (friend.createdByUserId && friend.createdByUserId !== user?.id) return;
    setEditingFriend(friend);
    setNewFriend({
      name: friend.name,
      email: friend.email || '',
      phone: friend.phone || '',
      alias_cbu: friend.alias_cbu || '',
      avatar: friend.avatar || undefined,
      is_public: friend.isPublic || false
    });
    setActiveTab('new');
  };

  const handleSaveFriend = async () => {
    setSubmittedOnce(true);
    if (!newFriend.name.trim()) {
      showAlert({ type: 'error', title: t.alerts.error.general, message: t.alerts.error.nameRequired });
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
      showAlert({ type: 'error', title: t.alerts.error.general, message: t.alerts.error.phoneInvalid });
      return;
    }

    // Validar formato de email (si fue ingresado)
    if (newFriend.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newFriend.email.trim())) {
      showAlert({ type: 'error', title: t.alerts.error.general, message: t.alerts.error.emailInvalid });
      return;
    }

    try {
      const capitalizeName = (name: string) => {
        const trimmed = name.trim();
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      };
      if (editingFriend) {
        // Editar amigo existente
        await updateParticipant(editingFriend.id, {
          name: capitalizeName(newFriend.name),
          email: newFriend.email.trim() || undefined,
          phone: newFriend.phone.trim() || undefined,
          alias_cbu: newFriend.alias_cbu.trim() || undefined,
          avatar: newFriend.avatar || undefined,
          isPublic: newFriend.is_public,
          updatedAt: new Date().toISOString()
        });
        showAlert({ type: 'success', title: t.alerts.success.updated });
      } else {
        // Agregar nuevo amigo
        const friend: Participant = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: capitalizeName(newFriend.name),
          email: newFriend.email.trim() || undefined,
          phone: newFriend.phone.trim() || undefined,
          alias_cbu: newFriend.alias_cbu.trim() || undefined,
          avatar: newFriend.avatar || undefined,
          participantType: 'friend',
          isActive: true,
          createdByUserId: user?.id,
          isPublic: newFriend.is_public,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await addParticipant(friend);
        showAlert({ type: 'success', title: t.alerts.success.added });
      }

      await loadFriends();
      
      // Reset form and return to list
      setNewFriend({ name: '', email: '', phone: '', alias_cbu: '', avatar: undefined, is_public: false });
      setEditingFriend(null);
      setSubmittedOnce(false);
      setNameValidation({ isValid: false, isChecking: false, message: '' });
      setActiveTab('list');
    } catch (error) {
      showAlert({ type: 'error', title: t.alerts.error.general, message: t.alerts.error.saveFailed });
    }
  };

  const renderHeader = () => (
    <View ref={mfHeaderRef} collapsable={false}>
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
      onHelpPress={() => { setActiveTab('list'); setMfTourStep(0); setMfTourVisible(true); }}
    />
    </View>
  );

  const renderTabs = () => (
    <View ref={mfTabsRef} collapsable={false} style={styles.tabsContainer}>
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
            setNewFriend({ name: '', email: '', phone: '', alias_cbu: '', avatar: undefined, is_public: false });
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
          activeTab === 'new'
            ? [styles.tab, { borderBottomWidth: 3, borderBottomColor: '#2196F3' }]
            : styles.inactiveTab
        ]}
        onPress={() => setActiveTab('new')}
      >
        <Text style={[
          styles.tabText,
          activeTab === 'new' ? { color: '#2196F3', fontWeight: '600' } : styles.inactiveTabText
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

  const renderFilterRow = () => {
    const ownCount = friends.filter(p => !p.createdByUserId || p.createdByUserId === user?.id).length;
    const publicCount = friends.filter(p => p.isPublic).length;
    const privateCount = friends.filter(p => !p.isPublic).length;

    const filters: { key: 'all' | 'own' | 'public' | 'private'; label: string; count: number; icon: string; color: string }[] = [
      { key: 'own',     label: t.filter.own,     count: ownCount,       icon: 'account-outline',       color: '#2196F3' },
      { key: 'public',  label: t.filter.public,  count: publicCount,    icon: 'earth',                 color: '#4CAF50' },
      { key: 'private', label: t.filter.private, count: privateCount,   icon: 'lock-outline',          color: '#FF9800' },
    ];

    return (
      <View ref={mfFilterRef} collapsable={false} style={styles.filterRow}>
        {filters.map(f => {
          const isSelected = friendFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterBtn, isSelected && { backgroundColor: f.color + '20' }]}
              onPress={() => setFriendFilter(prev => prev === f.key ? 'all' : f.key)}
              activeOpacity={0.7}
            >
              <View style={styles.filterIconWrap}>
                <MaterialCommunityIcons
                  name={f.icon as any}
                  size={26}
                  color={isSelected ? f.color : theme.colors.onSurfaceVariant}
                />
                <View style={[styles.filterBadge, { backgroundColor: f.color }]}>
                  <Text style={styles.filterBadgeText}>{f.count}</Text>
                </View>
              </View>
              <Text style={[styles.filterLabel, { color: isSelected ? f.color : theme.colors.onSurfaceVariant }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderNewFriendTab = () => (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.newFriendScroll}
        contentContainerStyle={styles.newFriendScrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View ref={mfFormRef} collapsable={false}>
          <Card style={styles.formCard}>
            {/* Header de card */}
            <View style={styles.cardHeaderRow}>
              <MaterialCommunityIcons
                name={editingFriend ? 'account-edit-outline' : 'account-plus-outline'}
                size={20}
                color="#2196F3"
              />
              <Text style={styles.cardHeaderTitle}>
                {editingFriend ? t.form.editTitle : t.form.addTitle}
              </Text>
            </View>

            <View ref={mfFormInputsRef} collapsable={false}>
              {/* Avatar + Nombre en la misma fila */}
              <View style={styles.avatarPickerRow}>
                <Avatar
                  name={newFriend.name || ' '}
                  image={newFriend.avatar}
                  size="large"
                  onPress={handlePickAvatarMenu}
                />
                <View style={{ flex: 1 }}>
                  <Input
                    label={t.form.nameLabel}
                    required
                    value={newFriend.name}
                    onChangeText={(text) => setNewFriend(prev => ({ ...prev, name: text }))}
                    placeholder={t.form.namePlaceholder}
                    icon="account-outline"
                    success={nameValidation.isValid && !nameValidation.isChecking}
                    error={
                      (submittedOnce && !newFriend.name.trim())
                        ? t.alerts.error.nameRequired
                        : (!nameValidation.isValid && !!nameValidation.message && !nameValidation.isChecking)
                        ? nameValidation.message
                        : undefined
                    }
                  />
                  {nameValidation.isChecking && (
                    <Text style={[styles.validationText, { color: theme.colors.primary }]}>
                      {nameValidation.message}
                    </Text>
                  )}
                </View>
              </View>

              {/* CBU / Alias */}
              <Input
                label={`${t.form.cbuLabel} ${t.form.optional}`}
                value={newFriend.alias_cbu}
                onChangeText={(text) => setNewFriend(prev => ({ ...prev, alias_cbu: text }))}
                placeholder={t.form.cbuPlaceholder}
                icon="bank-outline"
                containerStyle={styles.inputGroup}
              />

              {/* Visibilidad pública */}
              <View style={[styles.inputGroup, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialCommunityIcons name={newFriend.is_public ? 'earth' : 'lock-outline'} size={20} color={newFriend.is_public ? theme.colors.primary : theme.colors.onSurfaceVariant} />
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.onSurface }}>{newFriend.is_public ? t.form.visibilityPublic || 'Público' : t.form.visibilityPrivate || 'Privado'}</Text>
                    <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>{newFriend.is_public ? t.form.visibilityPublicDesc || 'Visible para todos los usuarios' : t.form.visibilityPrivateDesc || 'Solo visible para vos'}</Text>
                  </View>
                </View>
                <Switch
                  value={newFriend.is_public}
                  onValueChange={(val) => setNewFriend(prev => ({ ...prev, is_public: val }))}
                  trackColor={{ false: theme.colors.outline, true: theme.colors.primary }}
                  thumbColor={newFriend.is_public ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
                />
              </View>

              {/* Teléfono */}
              <Input
                label={`${t.form.phoneLabel} ${t.form.optional}`}
                value={newFriend.phone}
                onChangeText={(text) => {
                  const startsWithPlus = text.startsWith('+');
                  let digits = text.replace(/\D/g, '');
                  if (digits.length > 16) digits = digits.slice(0, 16);
                  const filtered = startsWithPlus ? '+' + digits : digits;
                  setNewFriend(prev => ({ ...prev, phone: filtered }));
                }}
                placeholder={t.form.phonePlaceholder}
                icon="phone-outline"
                type="phone"
                containerStyle={styles.inputGroup}
              />

              {/* Email */}
              <Input
                label={`${t.form.emailLabel} ${t.form.optional}`}
                value={newFriend.email}
                onChangeText={(text) => setNewFriend(prev => ({ ...prev, email: text.toLowerCase().replace(/\s/g, '') }))}
                placeholder={t.form.emailPlaceholder}
                icon="email-outline"
                type="email"
              />
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Footer sticky */}
      <View ref={mfFormButtonsRef} collapsable={false} style={styles.footer}>
        <Button
          title={t.buttons.cancel}
          variant="outlined"
          onPress={() => {
            setActiveTab('list');
            setEditingFriend(null);
            setNewFriend({ name: '', email: '', phone: '', alias_cbu: '', avatar: undefined, is_public: false });
            setSubmittedOnce(false);
            setNameValidation({ isValid: false, isChecking: false, message: '' });
          }}
          style={styles.cancelButton}
        />
        <Button
          title={editingFriend ? t.buttons.save : t.buttons.add}
          variant="filled"
          onPress={handleSaveFriend}
          style={styles.saveButton}
        />
      </View>
    </View>
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
      <View ref={mfSearchRef} collapsable={false} style={styles.sectionCard}>
        {renderSearchBar()}
        {renderFilterRow()}
      </View>
      <View ref={mfListRef} collapsable={false} style={[styles.sectionCard, { flex: 1, marginBottom: 8 }]}>
      {filteredFriends.length === 0 && !searchQuery ? (
        <View>
          <View ref={mfListAnchorRef} collapsable={false} />
          {renderEmptyState()}
        </View>
      ) : (
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FriendItem
              friend={item}
              onPress={() => handleFriendPress(item)}
              onDelete={() => handleDeleteFriend(item)}
              canEdit={!item.createdByUserId || item.createdByUserId === user?.id}
            />
          )}
          ListHeaderComponent={<View ref={mfListAnchorRef} collapsable={false} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
      </View>
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
      <TutorialOverlay
        visible={mfTourVisible}
        steps={[
          { ref: mfTabsRef,     titleKey: 'tour.friends.tabs.title',    descKey: 'tour.friends.tabs.desc',    popupPosition: 'below' },
          { ref: mfSearchRef,   titleKey: 'tour.friends.search.title',  descKey: 'tour.friends.search.desc',  popupPosition: 'below' },
          { ref: mfListRef,     titleKey: 'tour.friends.list.title',    descKey: 'tour.friends.list.desc',    popupPosition: 'center' },
          { ref: mfFormInputsRef, titleKey: 'tour.friends.form.title',  descKey: 'tour.friends.form.desc',    popupPosition: 'below', onBeforeShow: () => setActiveTab('new'), delay: 350 },
        ]}
        currentStep={mfTourStep}
        onNext={handleMfTourNext}
        onPrev={handleMfTourPrev}
        onClose={handleMfTourClose}
      />
    </View>
  );
};



export default ManageFriendsScreen;
