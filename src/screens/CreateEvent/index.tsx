import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ViewStyle,
  TextStyle,
  BackHandler,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Input,
  Button,
  Card,
  HeaderBar
} from '../../components';
import { useData } from '../../context/DataContext';
import { EventFormData, EventFormErrors, RouteParams } from './types';
import { createEventLanguage } from './language';
import { createStyles } from './styles';

const CreateEventScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { addEvent, updateEvent, events, getUserProfile } = useData();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);
  
  // Get translations
  const t = createEventLanguage[language] || createEventLanguage.es;
  
  // Detectar si estamos editando o creando
  const routeParams = route.params as RouteParams;
  const isEditing = routeParams?.mode === 'edit';
  const editingEventId = routeParams?.eventId;

  // Estados del formulario
  const [formData, setFormData] = useState<EventFormData>({
    name: '',
    description: '',
    startDate: null,
    location: '',
    currency: 'ARS',
    eventType: 'public',
    category: 'evento'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Cargar datos del evento si estamos editando - cada vez que la pantalla se enfoca
  // Cargar moneda preferida del usuario para eventos nuevos
  const loadUserPreferredCurrency = async () => {
    if (!user?.id) {
      console.log('No user ID available for loading preferred currency');
      return;
    }
    
    try {
      console.log('Loading user preferred currency...');
      const userProfile = await getUserProfile(user.id);
      if (userProfile?.preferred_currency) {
        console.log('User preferred currency found:', userProfile.preferred_currency);
        setFormData(prev => ({
          ...prev,
          currency: userProfile.preferred_currency as 'ARS' | 'USD' | 'EUR' | 'BRL'
        }));
      } else {
        console.log('No preferred currency found in profile, using ARS default');
      }
    } catch (error) {
      console.log('Could not load user preferred currency:', error);
      // Mantener ARS como fallback
    }
  };

  const resetFormToDefaults = async () => {
    try {
      const userProfile = user?.id ? await getUserProfile(user.id) : null;
      const preferredCurrency = userProfile?.preferred_currency || 'ARS';
      
      setFormData({
        name: '',
        description: '',
        startDate: null,
        location: '',
        currency: preferredCurrency as 'ARS' | 'USD' | 'EUR' | 'BRL',
        eventType: 'public',
        category: 'evento'
      });
      console.log('Form reset with preferred currency:', preferredCurrency);
    } catch (error) {
      console.log('Error resetting form:', error);
    }
  };

  // Cargar moneda preferida al inicio si es evento nuevo
  useEffect(() => {
    if (!isEditing && user?.id) {
      console.log('Initial load: Loading user preferred currency for new event...');
      loadUserPreferredCurrency();
    }
  }, [user?.id, isEditing]);

  useFocusEffect(
    React.useCallback(() => {
      console.log('CreateEvent focused. isEditing:', isEditing, 'eventId:', editingEventId);
      if (isEditing && editingEventId && events.length > 0) {
        console.log('Loading event data for editing...');
        loadEventData();
      } else if (isEditing && editingEventId && events.length === 0) {
        console.warn('No events loaded yet');
      }
    }, [isEditing, editingEventId, events])
  );

  const loadEventData = async () => {
    if (!editingEventId) return;
    
    setLoading(true);
    try {
      // Buscar el evento en la lista de eventos (ya disponible desde useData)
      console.log('Searching for event:', editingEventId);
      console.log('Available events:', events.length);
      const eventToEdit = events.find(e => e.id === editingEventId);
      
      if (eventToEdit) {
        console.log('Event found:', eventToEdit.name);
        setFormData({
          name: eventToEdit.name,
          description: eventToEdit.description || '',
          startDate: eventToEdit.startDate ? new Date(eventToEdit.startDate) : null,
          location: eventToEdit.location || '',
          currency: eventToEdit.currency as 'ARS' | 'USD' | 'EUR' | 'BRL',
          eventType: eventToEdit.type as 'public' | 'private',
          category: eventToEdit.category as 'viaje' | 'casa' | 'cena' | 'trabajo' | 'evento' | 'otro'
        });
        console.log('Form data loaded successfully');
      } else {
        console.error('Event not found in events list');
        Alert.alert(t.actions.error, t.validation.eventNotFound);
      }
    } catch (error) {
      console.error('Error loading event data:', error);
      Alert.alert(t.actions.error, t.validation.loadEventDataError);
    }
    setLoading(false);
  };

  // Manejar botÃ³n back de Android
  useEffect(() => {
    const backAction = () => {
      // Acceder a formData directamente en el momento del evento
      const hasChanges = formData.name.trim().length > 0 || 
                        formData.description.trim().length > 0 || 
                        formData.location.trim().length > 0 ||
                        formData.startDate !== null;

      if (hasChanges) {
        Alert.alert(
          t.actions.discardChanges,
          t.actions.discardMessage,
          [
            { text: t.actions.cancel, style: 'cancel' },
            { text: t.actions.exit, onPress: () => (navigation as any).goBack(), style: 'destructive' }
          ]
        );
      } else {
        (navigation as any).goBack();
      }
      return true; // Prevent default behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []); // Sin dependencias para que solo se registre una vez

  // ValidaciÃ³n del formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t.validation.nameRequired;
    } else if (formData.name.length > 50) {
      newErrors.name = t.validation.nameMaxLength;
    }

    if (!formData.startDate) {
      newErrors.startDate = t.validation.dateRequired;
    }

    if (formData.description.length > 200) {
      newErrors.description = t.validation.descriptionMaxLength;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isFormValid = (): boolean => {
    return formData.name.trim().length > 0 && formData.startDate !== null;
  };

  // Handlers
  const handleInputChange = (field: keyof EventFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field.toString()]) {
      const newErrors = { ...errors };
      delete newErrors[field.toString()];
      setErrors(newErrors);
    }
  };

  const handleBack = () => {
    const hasChanges = formData.name.trim().length > 0 || 
                      formData.description.trim().length > 0 || 
                      formData.location.trim().length > 0 ||
                      formData.startDate !== null;

    if (hasChanges) {
      Alert.alert(
        t.actions.discardChanges,
        t.actions.discardMessage,
        [
          { text: t.actions.cancel, style: 'cancel' },
          { text: t.actions.exit, onPress: () => (navigation as any).goBack(), style: 'destructive' }
        ]
      );
    } else {
      (navigation as any).goBack();
    }
  };

  const handleCreateEvent = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing && editingEventId) {
        // Actualizar evento existente
        const eventUpdates = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          startDate: formData.startDate!.toISOString(),
          location: formData.location.trim() || undefined,
          currency: formData.currency,
          category: formData.category,
          type: formData.eventType,
          updatedAt: new Date().toISOString()
        };

        console.log('Updating event in SQLite:', eventUpdates);
        await updateEvent(editingEventId, eventUpdates);
      } else {
        // Crear evento nuevo
        const eventData = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          startDate: formData.startDate!.toISOString(),
          location: formData.location.trim() || undefined,
          currency: formData.currency,
          category: formData.category,
          type: formData.eventType,
          status: 'active' as const,
          creatorId: 'demo-user', // TODO: Get from AuthContext
        };

        console.log('Creating event in SQLite:', eventData);
        await addEvent(eventData);
      }
      
      Alert.alert(
        isEditing ? t.actions.eventUpdated : t.actions.eventCreated,
        isEditing ? t.actions.eventUpdatedSuccess : t.actions.eventCreatedSuccess,
        [
          { 
            text: t.actions.ok, 
            onPress: () => {
              if (isEditing && editingEventId) {
                // Si estamos editando, volver a EventDetail
                (navigation as any).navigate('EventDetail', { eventId: editingEventId });
              } else {
                // Si estamos creando, resetear formulario y volver a Home
                resetFormToDefaults();
                (navigation as any).navigate('Home');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert(t.actions.error, t.validation.createEventError);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCurrencySymbol = (currency: string): string => {
    const symbols = { ARS: '$', USD: '$', EUR: '€', BRL: 'R$' };
    return symbols[currency as keyof typeof symbols] || '$';
  };

  const getCurrencyFlag = (currency: string): string => {
    const flags = { 
      ARS: '🇦🇷', 
      USD: '🇺🇸', 
      EUR: '🇪🇺', 
      BRL: '🇧🇷' 
    };
    return flags[currency as keyof typeof flags] || '💰';
  };

  const getCategoryIcon = (category: string): string => {
    const icons = {
      viaje: 'airplane',
      casa: 'home',
      cena: 'food',
      trabajo: 'briefcase',
      evento: 'calendar',
      otro: 'dots-horizontal'
    };
    return icons[category as keyof typeof icons] || 'calendar';
  };

  const getCategoryColor = (category: string, isActive: boolean = false): string => {
    const colors = {
      viaje: '#2196F3', // Azul para viajes
      casa: '#4CAF50',  // Verde para casa
      cena: '#FF9800',  // Naranja para cena
      trabajo: '#9C27B0', // Morado para trabajo
      evento: '#F44336',  // Rojo para eventos
      otro: '#607D8B'     // Gris azulado para otros
    };
    const baseColor = colors[category as keyof typeof colors] || '#607D8B';
    return isActive ? theme.colors.primary : baseColor;
  };

  const handleDatePress = () => {
    setShowDatePicker(true);
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      handleInputChange('startDate', selectedDate);
    }
  };





  return (
    <View style={styles.container}>
      {/* HeaderBar genérico con controles de tema e idioma */}
      <HeaderBar 
        title={isEditing ? t.header.editEvent : t.header.createEvent}
        showThemeToggle={true}
        showLanguageSelector={true}
        useDynamicColors={true}
        titleAlignment="left"
      />

      <SafeAreaView style={styles.safeContent} edges={['bottom', 'left', 'right']}>
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollViewContent}
        >
        {/* InformaciÃ³n BÃ¡sica */}
        <Card style={StyleSheet.flatten([styles.card])}>
          <Text style={styles.cardTitle}>{t.form.basicInformation}</Text>
          
          <Input
            label={t.form.eventName}
            placeholder={t.form.eventNamePlaceholder}
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            icon="pencil"
            maxLength={50}
            error={errors.name}
            containerStyle={styles.input}
          />

          <Input
            label={t.form.description}
            placeholder={t.form.descriptionPlaceholder}
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            multiline
            numberOfLines={3}
            maxLength={200}
            error={errors.description}
            containerStyle={styles.input}
          />
        </Card>

        {/* Fechas y UbicaciÃ³n */}
        <Card style={StyleSheet.flatten([styles.card])}>
          <Text style={styles.cardTitle}>{t.form.datesAndLocation}</Text>
          
          <TouchableOpacity
            style={styles.dateInput}
            onPress={handleDatePress}
          >
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="calendar-outline"
                size={20}
                color={theme.colors.onSurfaceVariant}
                style={styles.inputIcon}
              />
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>{t.form.startDate}</Text>
                <Text style={[
                  styles.inputValue,
                  !formData.startDate && styles.placeholder
                ]}>
                  {formData.startDate ? formatDate(formData.startDate) : t.form.selectDate}
                </Text>
              </View>
            </View>
            {errors.startDate && (
              <Text style={styles.errorText}>{errors.startDate}</Text>
            )}
          </TouchableOpacity>

          <Input
            label={t.form.location}
            placeholder={t.form.locationPlaceholder}
            value={formData.location}
            onChangeText={(text) => handleInputChange('location', text)}
            icon="map-marker-outline"
            containerStyle={styles.input}
          />
        </Card>

        {/* ConfiguraciÃ³n Financiera */}
        <Card style={StyleSheet.flatten([styles.card])}>
          <Text style={styles.cardTitle}>{t.form.financialConfiguration}</Text>
          
          <View style={styles.currencyRow}>
            <Text style={styles.inputLabel}>{t.form.currency}</Text>
            <View style={styles.currencyButtons}>
              {(['ARS', 'USD', 'EUR', 'BRL'] as const).map((curr) => (
                <TouchableOpacity
                  key={curr}
                  style={[
                    styles.currencyButton,
                    formData.currency === curr && styles.currencyButtonActive
                  ]}
                  onPress={() => handleInputChange('currency', curr)}
                >
                  <View style={styles.currencyContent}>
                    <Text style={styles.currencyFlag}>
                      {getCurrencyFlag(curr)}
                    </Text>
                    <Text style={[
                      styles.currencyText,
                      formData.currency === curr && styles.currencyTextActive
                    ]}>
                      {curr}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>


        </Card>

        {/* ConfiguraciÃ³n de Privacidad */}
        <Card style={StyleSheet.flatten([styles.card])}>
          <Text style={styles.cardTitle}>{t.form.privacyConfiguration}</Text>
          
          <View style={styles.radioRow}>
            <Text style={styles.inputLabel}>{t.form.eventType}</Text>
            
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => handleInputChange('eventType', 'public')}
            >
              <MaterialCommunityIcons
                name={formData.eventType === 'public' ? 'radiobox-marked' : 'radiobox-blank'}
                size={20}
                color={theme.colors.primary}
              />
              <View style={styles.radioContent}>
                <Text style={styles.radioTitle}>{t.form.publicEvent}</Text>
                <Text style={styles.radioDescription}>{t.form.publicEventDescription}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => handleInputChange('eventType', 'private')}
            >
              <MaterialCommunityIcons
                name={formData.eventType === 'private' ? 'radiobox-marked' : 'radiobox-blank'}
                size={20}
                color={theme.colors.primary}
              />
              <View style={styles.radioContent}>
                <Text style={styles.radioTitle}>{t.form.privateEvent}</Text>
                <Text style={styles.radioDescription}>{t.form.privateEventDescription}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.categoryRow}>
            <Text style={styles.inputLabel}>{t.form.category}</Text>
            <View style={styles.categoryButtons}>
              {([
                { key: 'viaje', label: t.form.categories.travel, icon: 'airplane' },
                { key: 'casa', label: t.form.categories.home, icon: 'home' },
                { key: 'cena', label: t.form.categories.dinner, icon: 'food' },
                { key: 'trabajo', label: t.form.categories.work, icon: 'briefcase' },
                { key: 'evento', label: t.form.categories.event, icon: 'calendar' },
                { key: 'otro', label: t.form.categories.other, icon: 'dots-horizontal' }
              ] as const).map((cat) => (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.categoryButton,
                    formData.category === cat.key && styles.categoryButtonActive
                  ]}
                  onPress={() => handleInputChange('category', cat.key)}
                >
                  <MaterialCommunityIcons
                    name={cat.icon as any}
                    size={16}
                    color={getCategoryColor(cat.key, formData.category === cat.key)}
                  />
                  <Text style={[
                    styles.categoryButtonText,
                    formData.category === cat.key && styles.categoryButtonTextActive
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>



        {/* Espacio para los botones footer */}
        <View style={styles.footerSpace} />
        </ScrollView>

        {/* DateTimePicker */}
        {showDatePicker && (
          <DateTimePicker
            value={formData.startDate || new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
          />
        )}

        {/* Botones Footer Sticky */}
      <View style={styles.footer}>
        <Button
          title={t.actions.cancel}
          variant="outlined"
          onPress={handleBack}
          style={StyleSheet.flatten([styles.cancelButton])}
        />
        <Button
          title={isEditing ? t.actions.updateEvent : t.actions.createEvent}
          variant="filled"
          onPress={handleCreateEvent}
          disabled={!isFormValid()}
          style={StyleSheet.flatten([styles.createButton])}
        />
        </View>

      </SafeAreaView>
    </View>
  );
};

export default CreateEventScreen;
