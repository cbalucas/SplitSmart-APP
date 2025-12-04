import React, { useState, useEffect } from 'react';
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
import { Theme } from '../../constants/theme';
import { Participant } from '../../types';
import Button from '../Button';

interface AddParticipantModalProps {
  visible: boolean;
  onClose: () => void;
  onAddParticipant: (participant: Participant) => void;
  currentParticipants: Participant[];
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
          {friend.email && (
            <Text style={styles.friendSelectEmail}>{friend.email}</Text>
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
  currentParticipants
}) => {
  const { theme } = useTheme();
  const { participants, addParticipant } = useData();
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
  
  // Estados para creación masiva
  const [bulkType, setBulkType] = useState<'custom' | 'generic'>('custom');
  const [bulkNames, setBulkNames] = useState('');
  const [genericCount, setGenericCount] = useState(5);

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
      Alert.alert('Error', 'Selecciona al menos un amigo para agregar');
      return;
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
    if (!newParticipant.name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
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

      // If saving as friend, add to global participants list
      if (saveAsFriend) {
        await addParticipant(participant);
      }

      // Add to event (will be saved when event is created)
      onAddParticipant(participant);
      
      // Reset form and close
      setNewParticipant({ name: '', email: '', phone: '', alias_cbu: '' });
      setSaveAsFriend(false);
      setActiveTab('friends');
      onClose();
      
    } catch (error) {
      Alert.alert('Error', 'No se pudo crear el participante');
    }
  };

  const handleCreateBulkParticipants = async () => {
    try {
      let participantsToAdd: Participant[] = [];
      const baseTimestamp = Date.now();

      if (bulkType === 'custom') {
        // Crear participantes con nombres personalizados
        const names = bulkNames
          .split('\n')
          .map(name => name.trim())
          .filter(name => name.length > 0);

        if (names.length === 0) {
          Alert.alert('Error', 'Ingresa al menos un nombre');
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
          Alert.alert('Error', 'El número debe estar entre 1 y 50');
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
        '✅ Participantes Agregados',
        `Se agregaron ${participantsToAdd.length} participante${participantsToAdd.length !== 1 ? 's' : ''} correctamente`
      );

      // Reset y cerrar
      setBulkNames('');
      setGenericCount(5);
      setBulkType('custom');
      setActiveTab('friends');
      onClose();

    } catch (error) {
      Alert.alert('Error', 'No se pudieron crear los participantes');
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
    setActiveTab('friends');
    onClose();
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.modalTitle}>Agregar Participantes</Text>
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <MaterialCommunityIcons
          name="close"
          size={24}
          color={theme.colors.onSurface}
        />
      </TouchableOpacity>
    </View>
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

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
        onPress={() => setActiveTab('friends')}
      >
        <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
          Mis Amigos
        </Text>
        {filteredFriends.length > 0 && (
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{filteredFriends.length}</Text>
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'new' && styles.activeTab]}
        onPress={() => setActiveTab('new')}
      >
        <Text style={[styles.tabText, activeTab === 'new' && styles.activeTabText]}>
          Nuevo
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'bulk' && styles.activeTab]}
        onPress={() => setActiveTab('bulk')}
      >
        <Text style={[styles.tabText, activeTab === 'bulk' && styles.activeTabText]}>
          Masivo
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSearchBar = () => {
    if (activeTab !== 'friends') return null;

    return (
      <>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={theme.colors.onSurfaceVariant}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar en mis amigos..."
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        
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
                {selectedFriends.size === filteredFriends.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
              </Text>
            </TouchableOpacity>
            
            {selectedFriends.size > 0 && (
              <Text style={styles.selectionCounter}>
                {selectedFriends.size} de {filteredFriends.length}
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
          <Text style={styles.emptyTitle}>No tienes amigos disponibles</Text>
          <Text style={styles.emptySubtitle}>
            Agrega amigos en la sección "Mis Amigos" para seleccionarlos rápidamente
          </Text>
          <Button
            title="Crear Nuevo Participante"
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
              Toca para seleccionar amigos. Puedes elegir varios a la vez.
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
          <Text style={styles.emptyTitle}>No se encontraron amigos</Text>
          <Text style={styles.emptySubtitle}>
            Intenta con otro término de búsqueda
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
                  {selectedFriends.size} amigo{selectedFriends.size !== 1 ? 's' : ''} seleccionado{selectedFriends.size !== 1 ? 's' : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.clearSelectionButton}
                onPress={() => setSelectedFriends(new Set())}
              >
                <Text style={styles.clearSelectionText}>Limpiar</Text>
              </TouchableOpacity>
            </View>
            <Button
              title={`Agregar ${selectedFriends.size > 1 ? `${selectedFriends.size} Amigos` : 'Amigo'}`}
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
          <Text style={styles.formTitle}>Agregar Participantes Masivos</Text>
          <Text style={styles.formSubtitle}>
            Crea múltiples participantes temporales a la vez
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
                Nombres Propios
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
                Genéricos
              </Text>
            </TouchableOpacity>
          </View>

          {bulkType === 'custom' ? (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombres de Participantes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Ingresa un nombre por línea:\n\nJuan Pérez\nMaría García\nCarlos López\n..."
                placeholderTextColor={theme.colors.onSurfaceVariant}
                value={bulkNames}
                onChangeText={setBulkNames}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
              <Text style={styles.inputHint}>
                💡 Escribe un nombre por línea. Sin límite de participantes.
              </Text>
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cantidad de Participantes</Text>
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
                Se crearán: Participante 1, Participante 2, ... Participante {genericCount}
              </Text>
              <Text style={styles.inputHint}>
                💡 Rango: 1 a 50 participantes genéricos
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomActions}>
          <Button
            title={bulkType === 'custom' ? 'Crear Participantes' : `Crear ${genericCount} Participantes`}
            variant="filled"
            size="large"
            onPress={handleCreateBulkParticipants}
            disabled={bulkType === 'custom' ? !bulkNames.trim() : genericCount < 1}
          />
        </View>
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
          <Text style={styles.formTitle}>Crear Nuevo Participante</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre Completo *</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del participante"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={newParticipant.name}
              onChangeText={(text) => setNewParticipant(prev => ({ ...prev, name: text }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="correo@ejemplo.com"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={newParticipant.email}
              onChangeText={(text) => setNewParticipant(prev => ({ ...prev, email: text }))}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Teléfono (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="+54 9 11 1234-5678"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={newParticipant.phone}
              onChangeText={(text) => setNewParticipant(prev => ({ ...prev, phone: text }))}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>CBU/Alias (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Alias o CBU para pagos"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={newParticipant.alias_cbu}
              onChangeText={(text) => setNewParticipant(prev => ({ ...prev, alias_cbu: text }))}
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
                  Guardar como amigo permanente
                </Text>
                <Text style={styles.toggleSubtitle}>
                  Podrás reutilizar este contacto en futuros eventos
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
            title={saveAsFriend ? "Guardar Amigo y Agregar" : "Crear y Agregar"}
            variant="filled"
            size="large"
            onPress={handleCreateNewParticipant}
            disabled={!newParticipant.name.trim()}
          />
        </View>
      </KeyboardAvoidingView>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
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
      paddingHorizontal: 20,
      paddingBottom: 16,
    } as ViewStyle,

    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      marginHorizontal: 4,
      borderRadius: 8,
      backgroundColor: theme.colors.surfaceVariant,
    } as ViewStyle,

    activeTab: {
      backgroundColor: theme.colors.primary,
    } as ViewStyle,

    tabText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
    } as TextStyle,

    activeTabText: {
      color: theme.colors.onPrimary,
    } as TextStyle,

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

    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      marginHorizontal: 20,
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
      width: 44,
      height: 44,
      borderRadius: 22,
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
  });

export default AddParticipantModal;