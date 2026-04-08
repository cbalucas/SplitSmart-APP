import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ViewStyle,
  TextStyle,
  KeyboardAvoidingView,
  ScrollView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { Theme } from '../../constants/theme';
import { Participant } from '../../types';
import Button from '../Button';
import HeaderBar from '../HeaderBar';
import SearchBar from '../SearchBar';

interface AddParticipantModalProps {
  visible: boolean;
  onClose: () => void;
  onAddParticipant: (participant: Participant) => void;
  currentParticipants: Participant[];
  hasExpenses?: boolean; // Nueva prop para saber si el evento tiene gastos
}

interface NameValidation {
  isValid: boolean;
  isChecking: boolean;
  message: string;
}

interface FriendSelectItemProps {
  friend: Participant;
  isSelected: boolean;
  onSelect: () => void;
}

const FriendSelectItem: React.FC<FriendSelectItemProps> = ({ friend, isSelected, onSelect }) => {
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
    <TouchableOpacity
      style={[
        styles.friendSelectItem,
        isSelected && styles.friendSelectItemSelected
      ]}
      onPress={onSelect}
    >
      <View style={styles.friendSelectInfo}>
        <View style={[styles.avatar, { backgroundColor: getAvatarColor(friend.name) }]}>
          <Text style={styles.avatarText}>{getInitials(friend.name)}</Text>
        </View>
        <View style={styles.friendSelectDetails}>
          <Text style={styles.friendSelectName}>{friend.name}</Text>
          {friend.alias_cbu && (
            <Text style={styles.friendSelectEmail}>{friend.alias_cbu}</Text>
          )}
        </View>
      </View>
      <View style={styles.selectIndicator}>
        {isSelected && (
          <MaterialCommunityIcons
            name="check-circle"
            size={24}
            color={theme.colors.primary}
          />
        )}
        {!isSelected && (
          <View style={styles.unselectedCircle} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const AddParticipantModal: React.FC<AddParticipantModalProps> = ({
  visible,
  onClose,
  onAddParticipant,
  currentParticipants,
  hasExpenses = false
}) => {
  const { theme } = useTheme();
  const { participants, addParticipant } = useData();
  const { t } = useLanguage();
  const styles = createStyles(theme);

  const [activeTab, setActiveTab] = useState<'friends' | 'new' | 'bulk'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFriends, setFilteredFriends] = useState<Participant[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    email: '',
    phone: '',
    alias_cbu: ''
  });
  const [saveAsFriend, setSaveAsFriend] = useState(false);
  const [nameValidation, setNameValidation] = useState<NameValidation>({
    isValid: false,
    isChecking: false,
    message: ''
  });

  // Refs para evitar que cambios de referencia de arrays del contexto disparen el effect de validación
  const currentParticipantsRef = useRef(currentParticipants);
  currentParticipantsRef.current = currentParticipants;
  const participantsRef = useRef(participants);
  participantsRef.current = participants;
  const saveAsFriendRef = useRef(saveAsFriend);
  saveAsFriendRef.current = saveAsFriend;

  // Estados para creación masiva
  const [bulkType, setBulkType] = useState<'custom' | 'generic'>('custom');
  const [bulkNames, setBulkNames] = useState('');
  const [genericCount, setGenericCount] = useState(5);
  const [submittedOnce, setSubmittedOnce] = useState(false);
  const [bulkSubmittedOnce, setBulkSubmittedOnce] = useState(false);

  // Get current participant IDs to filter them out
  const currentParticipantIds = new Set(currentParticipants.map(p => p.id));

  useEffect(() => {
    // Filter ONLY friends (not temporary) that are not already participants
    const availableFriends = participants.filter(p => 
      p.participantType === 'friend' && !currentParticipantIds.has(p.id)
    );
    
    if (!searchQuery.trim()) {
      setFilteredFriends(availableFriends);
    } else {
      const filtered = availableFriends.filter(participant =>
        participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (participant.email && participant.email.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredFriends(filtered);
    }
  }, [participants, currentParticipants, searchQuery]);

  useEffect(() => {
    const name = newParticipant.name.trim();
    if (!name) {
      setNameValidation({ isValid: false, isChecking: false, message: '' });
      return;
    }

    const timeoutId = setTimeout(() => {
      if (name.length < 2) {
        setNameValidation({ isValid: false, isChecking: false, message: t('addParticipant.nameValidation.tooShort') });
        return;
      }

      const trimmedName = name.toLowerCase();

      const isDuplicateInEvent = currentParticipantsRef.current.some(
        p => p.name.trim().toLowerCase() === trimmedName
      );
      if (isDuplicateInEvent) {
        setNameValidation({ isValid: false, isChecking: false, message: t('addParticipant.nameValidation.duplicateInEvent') });
        return;
      }

      if (saveAsFriendRef.current) {
        const allFriends = participantsRef.current.filter(p => p.participantType === 'friend');
        const isDuplicateFriend = allFriends.some(f => f.name.trim().toLowerCase() === trimmedName);
        if (isDuplicateFriend) {
          setNameValidation({ isValid: false, isChecking: false, message: t('addParticipant.nameValidation.duplicateInFriends') });
          return;
        }
      }

      setNameValidation({ isValid: true, isChecking: false, message: t('addParticipant.nameValidation.availableInEvent') });
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [newParticipant.name, saveAsFriend]);

  const handleSelectFriend = (friendId: string) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedFriends(newSelected);
  };

  const handleAddSelectedFriends = () => {
    if (selectedFriends.size === 0) {
      Alert.alert(t('common.error'), t('addParticipant.error.selectFriends'));
      return;
    }

    // Verificar duplicados de nombre con participantes actuales del evento
    const currentNames = currentParticipants.map(p => p.name.trim().toLowerCase());
    for (const friendId of selectedFriends) {
      const friend = participants.find(p => p.id === friendId);
      if (friend && currentNames.includes(friend.name.trim().toLowerCase())) {
        Alert.alert(
          t('addParticipant.alert.duplicateEventTitle'),
          t('addParticipant.error.friendDuplicateInEvent', { name: friend.name })
        );
        return;
      }
    }

    selectedFriends.forEach(friendId => {
      const friend = participants.find(p => p.id === friendId);
      if (friend) {
        onAddParticipant(friend);
      }
    });

    // Reset and close
    setSelectedFriends(new Set());
    setSearchQuery('');
    onClose();
  };

  const handleCreateNewParticipant = async () => {
    setSubmittedOnce(true);
    if (!newParticipant.name.trim()) {
      return;
    }

    const trimmedName = newParticipant.name.trim().toLowerCase();

    // Verificar nombre duplicado en participantes del evento
    const isDuplicateInEvent = currentParticipants.some(
      p => p.name.trim().toLowerCase() === trimmedName
    );
    if (isDuplicateInEvent) {
      Alert.alert(
        t('addParticipant.alert.duplicateEventTitle'),
        t('addParticipant.error.duplicateEventName')
      );
      return;
    }

    // Si se guarda como amigo, verificar duplicado en la lista global de amigos
    if (saveAsFriend) {
      const allFriends = participants.filter(p => p.participantType === 'friend');
      const isDuplicateFriend = allFriends.some(
        f => f.name.trim().toLowerCase() === trimmedName
      );
      if (isDuplicateFriend) {
        Alert.alert(
          t('addParticipant.alert.duplicateFriendTitle'),
          t('addParticipant.error.duplicateFriendName')
        );
        return;
      }
    }

    // Validar formato de teléfono (si fue ingresado)
    if (newParticipant.phone.trim() && !/^\+?[\d\s\-()]+$/.test(newParticipant.phone.trim())) {
      Alert.alert(t('common.error'), t('addParticipant.error.phoneInvalid'));
      return;
    }

    // Validar formato de email (si fue ingresado)
    if (newParticipant.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newParticipant.email.trim())) {
      Alert.alert(t('common.error'), t('addParticipant.error.emailInvalid'));
      return;
    }

    try {
      const participant: Participant = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: newParticipant.name.trim(),
        email: newParticipant.email.trim() || undefined,
        phone: newParticipant.phone.trim() || undefined,
        alias_cbu: newParticipant.alias_cbu.trim() || undefined,
        participantType: saveAsFriend ? 'friend' : 'temporary',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // If saving as friend, add to global participants list first
      if (saveAsFriend) {
        await addParticipant(participant);
      }

      // Add to event (will be saved when event is created)
      onAddParticipant(participant);
      
      // Reset form and close
      setNewParticipant({ name: '', email: '', phone: '', alias_cbu: '' });
      setSaveAsFriend(false);
      setSubmittedOnce(false);
      setNameValidation({ isValid: false, isChecking: false, message: '' });
      setActiveTab('friends');
      onClose();
      
    } catch (error) {
      Alert.alert(t('common.error'), t('addParticipant.error.createParticipant'));
    }
  };

  const handleCreateBulkParticipants = async () => {
    try {
      let participantsToAdd: Participant[] = [];
      const baseTimestamp = Date.now();

      if (bulkType === 'custom') {
        setBulkSubmittedOnce(true);
        // Crear participantes con nombres personalizados
        const names = bulkNames
          .split('\n')
          .map(name => name.trim())
          .filter(name => name.length > 0);

        if (names.length === 0) {
          return;
        }

        // Verificar duplicados con participantes actuales del evento
        const currentNames = currentParticipants.map(p => p.name.trim().toLowerCase());
        const duplicateName = names.find(name => currentNames.includes(name.toLowerCase()));
        if (duplicateName) {
          Alert.alert(
            t('addParticipant.alert.duplicateEventTitle'),
            t('addParticipant.error.friendDuplicateInEvent', { name: duplicateName })
          );
          return;
        }

        participantsToAdd = names.map((name, index) => ({
          id: `${baseTimestamp}_${index}_${Math.random().toString(36).substr(2, 9)}`,
          name: name,
          participantType: 'temporary' as const,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

      } else {
        // Crear participantes genéricos
        if (genericCount < 1 || genericCount > 50) {
          Alert.alert(t('common.error'), t('addParticipant.error.numberRange'));
          return;
        }

        // Encontrar el número máximo existente en participantes genéricos
        const existingGenericNumbers = currentParticipants
          .map(p => {
            const match = p.name.match(/^Participante (\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
          })
          .filter(n => n > 0);
        
        const maxNumber = existingGenericNumbers.length > 0 ? Math.max(...existingGenericNumbers) : 0;
        
        participantsToAdd = Array.from({ length: genericCount }, (_, index) => ({
          id: `${baseTimestamp}_${index}_${Math.random().toString(36).substr(2, 9)}`,
          name: `Participante ${maxNumber + index + 1}`,
          participantType: 'temporary' as const,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
      }

      // Agregar todos los participantes
      participantsToAdd.forEach(participant => {
        onAddParticipant(participant);
      });

      Alert.alert(
        t('addParticipant.alert.participantsAdded'),
        t('addParticipant.alert.participantsAddedMessage', {
          count: participantsToAdd.length,
          plural: participantsToAdd.length !== 1 ? 's' : ''
        })
      );

      // Reset y cerrar
      setBulkNames('');
      setGenericCount(5);
      setBulkType('custom');
      setBulkSubmittedOnce(false);
      setActiveTab('friends');
      onClose();

    } catch (error) {
      Alert.alert(t('common.error'), t('addParticipant.error.createBulk'));
    }
  };



  const handleClose = () => {
    setSelectedFriends(new Set());
    setSearchQuery('');
    setNewParticipant({ name: '', email: '', phone: '', alias_cbu: '' });
    setSaveAsFriend(false);
    setBulkNames('');
    setGenericCount(5);
    setBulkType('custom');
    setSubmittedOnce(false);
    setBulkSubmittedOnce(false);
    setNameValidation({ isValid: false, isChecking: false, message: '' });
    setActiveTab('friends');
    onClose();
  };

  const renderHeader = () => (
    <HeaderBar
      title={t('addParticipant.title')}
      titleAlignment="left"
      showThemeToggle={true}
      showLanguageSelector={true}
      showHelp={true}
      rightIcon="close"
      rightIconLabel="Cerrar"
      onRightPress={handleClose}
      useDynamicColors={true}
      elevation={true}
    />
  );

  const handleSelectAllFriends = () => {
    if (selectedFriends.size === filteredFriends.length) {
      // Si todos están seleccionados, deseleccionar todos
      setSelectedFriends(new Set());
    } else {
      // Seleccionar todos
      const allIds = new Set(filteredFriends.map(f => f.id));
      setSelectedFriends(allIds);
    }
  };

  const handleBulkTabPress = () => {
    if (hasExpenses) {
      Alert.alert(
        t('addParticipant.alert.bulkRestricted'),
        t('addParticipant.alert.bulkRestrictedMessage'),
        [{ text: t('addParticipant.alert.understood'), style: 'default' }]
      );
      return;
    }
    setActiveTab('bulk');
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
        onPress={() => setActiveTab('friends')}
      >
        <View style={styles.tabContent}>
          <MaterialCommunityIcons
            name="account-heart"
            size={20}
            color={activeTab === 'friends' ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            {t('addParticipant.tabFriends')}
          </Text>
          {filteredFriends.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{filteredFriends.length}</Text>
            </View>
          )}
        </View>
        {activeTab === 'friends' && <View style={styles.tabIndicator} />}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'new' && styles.activeTab]}
        onPress={() => setActiveTab('new')}
      >
        <View style={styles.tabContent}>
          <MaterialCommunityIcons
            name="account-plus"
            size={20}
            color={activeTab === 'new' ? theme.colors.primary : theme.colors.onSurfaceVariant}
          />
          <Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>
            {t('addParticipant.tabNew')}
          </Text>
        </View>
        {activeTab === 'new' && <View style={styles.tabIndicator} />}
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.tab, 
          activeTab === 'bulk' && styles.activeTab,
          hasExpenses && styles.restrictedTab
        ]}
        onPress={handleBulkTabPress}
      >
        <View style={styles.tabContent}>
          <MaterialCommunityIcons
            name="account-multiple-plus"
            size={20}
            color={hasExpenses ? theme.colors.onSurfaceVariant : (activeTab === 'bulk' ? theme.colors.primary : theme.colors.onSurfaceVariant)}
          />
          <Text style={[
            styles.tabText, 
            activeTab === 'bulk' && styles.activeTabText,
            hasExpenses && styles.restrictedTabText
          ]}>
            {t('addParticipant.tabBulk')}
          </Text>
          {hasExpenses && (
            <MaterialCommunityIcons
              name="information-outline"
              size={16}
              color={theme.colors.primary}
              style={styles.infoIcon}
            />
          )}
        </View>
        {activeTab === 'bulk' && <View style={styles.tabIndicator} />}
      </TouchableOpacity>
    </View>
  );

  const renderSearchBar = () => {
    if (activeTab !== 'friends') return null;

    return (
      <>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('addParticipant.searchPlaceholder')}
          showClearButton={true}
          onClear={() => setSearchQuery('')}
        />
        
        {filteredFriends.length > 0 && (
          <View style={styles.bulkActionsBar}>
            <TouchableOpacity
              style={styles.bulkActionButton}
              onPress={handleSelectAllFriends}
            >
              <MaterialCommunityIcons
                name={selectedFriends.size === filteredFriends.length ? "checkbox-marked" : "checkbox-blank-outline"}
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.bulkActionText}>
                {selectedFriends.size === filteredFriends.length ? t('addParticipant.deselectAll') : t('addParticipant.selectAll')}
              </Text>
            </TouchableOpacity>
            
            {selectedFriends.size > 0 && (
              <Text style={styles.selectionCounter}>
                {t('addParticipant.selectionCounter', {
                  selected: selectedFriends.size,
                  total: filteredFriends.length
                })}
              </Text>
            )}
          </View>
        )}
      </>
    );
  };

  const renderFriendsTab = () => {
    if (activeTab !== 'friends') return null;

    if (filteredFriends.length === 0 && !searchQuery) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="account-group-outline"
            size={60}
            color={theme.colors.onSurfaceVariant}
          />
          <Text style={styles.emptyTitle}>{t('addParticipant.noFriends')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('addParticipant.noFriendsDesc')}
          </Text>
          <Button
            title={t('addParticipant.createNewParticipant')}
            variant="outlined"
            size="medium"
            onPress={() => setActiveTab('new')}
            style={styles.emptyButton}
          />
        </View>
      );
    }

    if (filteredFriends.length > 0 && selectedFriends.size === 0) {
      return (
        <>
          <View style={styles.hintBanner}>
            <MaterialCommunityIcons
              name="information"
              size={20}
              color={theme.colors.primary}
            />
            <Text style={styles.hintText}>
              {t('addParticipant.selectHint')}
            </Text>
          </View>
          <FlatList
            data={filteredFriends}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <FriendSelectItem
                friend={item}
                isSelected={selectedFriends.has(item.id)}
                onSelect={() => handleSelectFriend(item.id)}
              />
            )}
            style={styles.friendsList}
            showsVerticalScrollIndicator={false}
          />
        </>
      );
    }

    if (filteredFriends.length === 0 && searchQuery) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="account-search-outline"
            size={60}
            color={theme.colors.onSurfaceVariant}
          />
          <Text style={styles.emptyTitle}>{t('addParticipant.noSearchResults')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('addParticipant.noSearchResultsDesc')}
          </Text>
        </View>
      );
    }

    return (
      <>
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FriendSelectItem
              friend={item}
              isSelected={selectedFriends.has(item.id)}
              onSelect={() => handleSelectFriend(item.id)}
            />
          )}
          style={styles.friendsList}
          showsVerticalScrollIndicator={false}
        />
        
        {selectedFriends.size > 0 && (
          <View style={styles.bottomActions}>
            <View style={styles.bottomActionsHeader}>
              <View style={styles.selectionSummary}>
                <MaterialCommunityIcons
                  name="account-multiple-check"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text style={styles.selectedCount}>
                  {t('addParticipant.selectedCount', {
                    count: selectedFriends.size,
                    plural: selectedFriends.size !== 1 ? 's' : '',
                    pluralSelected: selectedFriends.size !== 1 ? 's' : ''
                  })}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.clearSelectionButton}
                onPress={() => setSelectedFriends(new Set())}
              >
                <Text style={styles.clearSelectionText}>{t('addParticipant.clear')}</Text>
              </TouchableOpacity>
            </View>
            <Button
              title={selectedFriends.size > 1 ? 
                t('addParticipant.addFriends', { count: selectedFriends.size }) : 
                t('addParticipant.addFriend')
              }
              variant="filled"
              size="large"
              onPress={handleAddSelectedFriends}
            />
          </View>
        )}
      </>
    );
  };

  const renderBulkTab = () => {
    if (activeTab !== 'bulk') return null;

    return (
      <KeyboardAvoidingView
        style={styles.newParticipantContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.formTitle}>{t('addParticipant.bulkTitle')}</Text>
          
          {hasExpenses ? (
            <View style={styles.restrictionContainer}>
              <MaterialCommunityIcons
                name="information-outline"
                size={48}
                color={theme.colors.onSurfaceVariant}
                style={styles.restrictionIcon}
              />
              <Text style={styles.restrictionTitle}>{t('addParticipant.bulkRestricted')}</Text>
              <Text style={styles.restrictionMessage}>
                {t('addParticipant.bulkRestrictedMessage')}
              </Text>
              <Text style={styles.restrictionSuggestion}>
                {t('addParticipant.bulkRestrictedSuggestion')}
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.formSubtitle}>
                {t('addParticipant.bulkSubtitle')}
              </Text>

          <View style={styles.bulkTypeSelector}>
            <TouchableOpacity
              style={[
                styles.bulkTypeButton,
                bulkType === 'custom' && styles.bulkTypeButtonActive
              ]}
              onPress={() => setBulkType('custom')}
            >
              <MaterialCommunityIcons
                name="text-box-multiple"
                size={20}
                color={bulkType === 'custom' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
              />
              <Text style={[
                styles.bulkTypeButtonText,
                bulkType === 'custom' && styles.bulkTypeButtonTextActive
              ]}>
                {t('addParticipant.customNames')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.bulkTypeButton,
                bulkType === 'generic' && styles.bulkTypeButtonActive
              ]}
              onPress={() => setBulkType('generic')}
            >
              <MaterialCommunityIcons
                name="account-multiple"
                size={20}
                color={bulkType === 'generic' ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
              />
              <Text style={[
                styles.bulkTypeButtonText,
                bulkType === 'generic' && styles.bulkTypeButtonTextActive
              ]}>
                {t('addParticipant.generic')}
              </Text>
            </TouchableOpacity>
          </View>

          {bulkType === 'custom' ? (
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, bulkSubmittedOnce && !bulkNames.trim() && styles.inputLabelError]}>
                {t('addParticipant.namesLabel')}<Text style={styles.requiredStar}> *</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('addParticipant.namesPlaceholder')}
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={bulkNames}
                onChangeText={setBulkNames}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
              <Text style={styles.inputHint}>
                {t('addParticipant.namesHint')}
              </Text>
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{t('addParticipant.quantityLabel')}</Text>
              <View style={styles.peopleCountContainer}>
                <TouchableOpacity
                  style={styles.peopleCountButton}
                  onPress={() => setGenericCount(Math.max(1, genericCount - 1))}
                  disabled={genericCount <= 1}
                >
                  <MaterialCommunityIcons
                    name="minus"
                    size={24}
                    color={genericCount <= 1 ? theme.colors.onSurfaceVariant : theme.colors.primary}
                  />
                </TouchableOpacity>
                
                <Text style={styles.peopleCountText}>{genericCount}</Text>
                
                <TouchableOpacity
                  style={styles.peopleCountButton}
                  onPress={() => setGenericCount(Math.min(50, genericCount + 1))}
                  disabled={genericCount >= 50}
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={24}
                    color={genericCount >= 50 ? theme.colors.onSurfaceVariant : theme.colors.primary}
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.peopleCountHint}>
                {t('addParticipant.genericPreview', { count: genericCount })}
              </Text>
              <Text style={styles.inputHint}>
                {t('addParticipant.genericHint')}
              </Text>
            </View>
          )}
              <View style={styles.bottomActions}>
                <Button
                  title={bulkType === 'custom' ? 
                    t('addParticipant.createParticipants') : 
                    t('addParticipant.createGeneric', { count: genericCount })
                  }
                  variant="filled"
                  size="large"
                  onPress={handleCreateBulkParticipants}
                />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  const renderNewParticipantTab = () => {
    if (activeTab !== 'new') return null;

    return (
      <KeyboardAvoidingView
        style={styles.newParticipantContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.formTitle}>{t('addParticipant.newTitle')}</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[
              styles.inputLabel,
              (submittedOnce && !newParticipant.name.trim()) || (!nameValidation.isValid && !!nameValidation.message && !nameValidation.isChecking) ? styles.inputLabelError : undefined
            ]}>
              {t('addParticipant.fullNameLabel')}<Text style={styles.requiredStar}> *</Text>
            </Text>
            <View style={styles.inputWithIndicator}>
              <TextInput
                style={[
                  styles.input,
                  { flex: 1 },
                  nameValidation.isValid && styles.inputValid,
                  (!nameValidation.isValid && nameValidation.message && !nameValidation.isChecking) && styles.inputInvalid
                ]}
                placeholder={t('addParticipant.fullNamePlaceholder')}
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={newParticipant.name}
                onChangeText={(text) => setNewParticipant(prev => ({ ...prev, name: text }))}
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
            <Text style={styles.inputLabel}>{t('addParticipant.cbuLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('addParticipant.cbuPlaceholder')}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={newParticipant.alias_cbu}
              onChangeText={(text) => setNewParticipant(prev => ({ ...prev, alias_cbu: text }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('addParticipant.phoneLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('addParticipant.phonePlaceholder')}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={newParticipant.phone}
              onChangeText={(text) => {
                const startsWithPlus = text.startsWith('+');
                let filtered = text.replace(/[^\d\s\-()+]/g, '').replace(/\+/g, '');
                if (startsWithPlus) filtered = '+' + filtered;
                setNewParticipant(prev => ({ ...prev, phone: filtered }));
              }}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{t('addParticipant.emailLabel')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('addParticipant.emailPlaceholder')}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={newParticipant.email}
              onChangeText={(text) => setNewParticipant(prev => ({ ...prev, email: text.toLowerCase().replace(/\s/g, '') }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={styles.toggleContainer}
            onPress={() => setSaveAsFriend(!saveAsFriend)}
            activeOpacity={0.7}
          >
            <View style={styles.toggleInfo}>
              <MaterialCommunityIcons
                name="account-heart"
                size={24}
                color={saveAsFriend ? theme.colors.primary : theme.colors.onSurfaceVariant}
              />
              <View style={styles.toggleTextContainer}>
                <Text style={[styles.toggleTitle, saveAsFriend && styles.toggleTitleActive]}>
                  {t('addParticipant.saveAsFriend')}
                </Text>
                <Text style={styles.toggleSubtitle}>
                  {t('addParticipant.saveAsFriendDesc')}
                </Text>
              </View>
            </View>
            <View style={[styles.switchTrack, saveAsFriend && styles.switchTrackActive]}>
              <View style={[styles.switchThumb, saveAsFriend && styles.switchThumbActive]} />
            </View>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.bottomActions}>
          <Button
            title={saveAsFriend ? t('addParticipant.saveAndAdd') : t('addParticipant.createAndAdd')}
            variant="filled"
            size="large"
            onPress={handleCreateNewParticipant}
          />
        </View>
      </KeyboardAvoidingView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom', 'left', 'right']}>
        {renderHeader()}
        {renderTabs()}
        {renderSearchBar()}
        
        <View style={styles.content}>
          {renderFriendsTab()}
          {renderNewParticipantTab()}
          {renderBulkTab()}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: theme.colors.background,
    } as ViewStyle,

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    } as ViewStyle,

    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      flex: 1,
      textAlign: 'center',
    } as TextStyle,

    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    } as ViewStyle,

    tabContainer: {
      flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    } as ViewStyle,

    tab: {
      flex: 1,
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      paddingHorizontal: 8,
    } as ViewStyle,

    activeTab: {
      // No background for active tab, indicator will show instead
    } as ViewStyle,

    tabContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    } as ViewStyle,

    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    } as TextStyle,

    activeTabText: {
      color: theme.colors.primary,
      fontWeight: '600',
    } as TextStyle,

    tabIndicator: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: theme.colors.primary,
      borderRadius: 1.5,
    } as ViewStyle,

    tabBadge: {
      backgroundColor: theme.colors.secondary,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginLeft: 6,
    } as ViewStyle,

    tabBadgeText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.colors.onSecondary,
    } as TextStyle,



    bulkActionsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 8,
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 8,
      marginHorizontal: 20,
      marginBottom: 8,
    } as ViewStyle,

    bulkActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
    } as ViewStyle,

    bulkActionText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.primary,
      marginLeft: 8,
    } as TextStyle,

    selectionCounter: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 12,
    } as TextStyle,

    hintBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primaryContainer,
      paddingHorizontal: 16,
      paddingVertical: 12,
      marginHorizontal: 20,
      marginBottom: 12,
      borderRadius: 8,
      gap: 8,
    } as ViewStyle,

    hintText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.onPrimaryContainer,
      lineHeight: 20,
    } as TextStyle,

    content: {
      flex: 1,
    } as ViewStyle,

    friendsList: {
      flex: 1,
      paddingHorizontal: 20,
    } as ViewStyle,

    friendSelectItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    } as ViewStyle,

    friendSelectItemSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primaryContainer,
    } as ViewStyle,

    friendSelectInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    } as ViewStyle,

    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    } as ViewStyle,

    avatarText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#FFFFFF',
    } as TextStyle,

    friendSelectDetails: {
      flex: 1,
    } as ViewStyle,

    friendSelectName: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurface,
    } as TextStyle,

    friendSelectEmail: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    } as TextStyle,

    selectIndicator: {
      marginLeft: 8,
    } as ViewStyle,

    unselectedCircle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.outline,
    } as ViewStyle,

    bottomActions: {
      padding: 20,
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
    } as ViewStyle,

    bottomActionsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    } as ViewStyle,

    selectionSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    } as ViewStyle,

    selectedCount: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.onSurface,
    } as TextStyle,

    clearSelectionButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      backgroundColor: theme.colors.surfaceVariant,
    } as ViewStyle,

    clearSelectionText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.primary,
    } as TextStyle,

    newParticipantContainer: {
      flex: 1,
    } as ViewStyle,

    formContainer: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    } as ViewStyle,

    formTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 8,
      textAlign: 'center',
    } as TextStyle,

    formSubtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 20,
      textAlign: 'center',
    } as TextStyle,

    bulkTypeSelector: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 20,
    } as ViewStyle,

    bulkTypeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 2,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
    } as ViewStyle,

    bulkTypeButtonActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    } as ViewStyle,

    bulkTypeButtonText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    } as TextStyle,

    bulkTypeButtonTextActive: {
      color: theme.colors.onPrimary,
    } as TextStyle,

    textArea: {
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: theme.colors.onSurface,
      minHeight: 150,
    } as ViewStyle,

    inputHint: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
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

    inputLabelError: {
      color: '#FF5252',
    } as TextStyle,

    requiredStar: {
      color: '#FF5252',
      fontWeight: '700',
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

    peopleCountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 8,
      paddingVertical: 8,
      gap: 20,
    } as ViewStyle,

    peopleCountButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.primaryContainer,
    } as ViewStyle,

    peopleCountText: {
      fontSize: 24,
      fontWeight: '600',
      color: theme.colors.primary,
      minWidth: 40,
      textAlign: 'center',
    } as TextStyle,

    peopleCountHint: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 4,
      textAlign: 'center',
    } as TextStyle,

    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 32,
    } as ViewStyle,

    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginTop: 16,
      textAlign: 'center',
    } as TextStyle,

    emptySubtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginTop: 8,
      textAlign: 'center',
      lineHeight: 20,
    } as TextStyle,

    emptyButton: {
      marginTop: 20,
    } as ViewStyle,

    toggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    } as ViewStyle,

    toggleInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    } as ViewStyle,

    toggleTextContainer: {
      flex: 1,
      marginLeft: 12,
    } as ViewStyle,

    toggleTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    } as TextStyle,

    toggleTitleActive: {
      color: theme.colors.primary,
    } as TextStyle,

    toggleSubtitle: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginTop: 2,
    } as TextStyle,

    switchTrack: {
      width: 51,
      height: 31,
      borderRadius: 15.5,
      backgroundColor: theme.colors.surfaceVariant,
      padding: 2,
      justifyContent: 'center',
    } as ViewStyle,

    switchTrackActive: {
      backgroundColor: theme.colors.primary,
    } as ViewStyle,

    switchThumb: {
      width: 27,
      height: 27,
      borderRadius: 13.5,
      backgroundColor: theme.colors.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 2.5,
      elevation: 4,
    } as ViewStyle,

    switchThumbActive: {
      transform: [{ translateX: 20 }],
    } as ViewStyle,

    // Estilos para tab restringida (seleccionable pero con restricciones)
    restrictedTab: {
      opacity: 0.6,
      backgroundColor: theme.colors.surfaceVariant,
    } as ViewStyle,

    restrictedTabText: {
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
    } as TextStyle,

    infoIcon: {
      marginLeft: 4,
    } as ViewStyle,

    // Estilos para mensaje de restricción
    restrictionContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      paddingHorizontal: 30,
    } as ViewStyle,

    restrictionIcon: {
      marginBottom: 16,
    } as ViewStyle,

    restrictionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      textAlign: 'center',
      marginBottom: 12,
    } as TextStyle,

    restrictionMessage: {
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: 16,
    } as TextStyle,

    restrictionSuggestion: {
      fontSize: 13,
      fontStyle: 'italic',
      color: theme.colors.primary,
      textAlign: 'center',
    } as TextStyle,

    inputWithIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'relative',
    } as ViewStyle,

    inputValid: {
      borderColor: '#4CAF50',
    } as ViewStyle,

    inputInvalid: {
      borderColor: '#FF5252',
    } as ViewStyle,

    validationIndicator: {
      position: 'absolute',
      right: 12,
      height: '100%',
      justifyContent: 'center',
    } as ViewStyle,

    validationText: {
      fontSize: 12,
      marginTop: 4,
      marginLeft: 2,
    } as TextStyle,

    validationTextSuccess: {
      color: '#4CAF50',
    } as TextStyle,

    validationTextError: {
      color: '#FF5252',
    } as TextStyle,
  });

export default AddParticipantModal;