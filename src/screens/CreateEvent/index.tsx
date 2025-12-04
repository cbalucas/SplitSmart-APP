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
import { Theme } from '../../constants/theme';
import { 
  Input,
  LanguageSelector,
  ThemeToggle,
  Button,
  Card
} from '../../components';
import { useData } from '../../context/DataContext';


interface EventFormData {
  name: string;
  description: string;
  startDate: Date | null;
  location: string;
  currency: 'ARS' | 'USD' | 'EUR' | 'BRL';
  eventType: 'public' | 'private';
  category: 'viaje' | 'casa' | 'cena' | 'trabajo' | 'evento' | 'otro';
}

const CreateEventScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { addEvent, updateEvent, events } = useData();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme, insets);
  
  // Detectar si estamos editando o creando
  const routeParams = route.params as any;
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
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔍 CreateEvent focused. isEditing:', isEditing, 'eventId:', editingEventId);
      if (isEditing && editingEventId && events.length > 0) {
        console.log('📥 Loading event data for editing...');
        loadEventData();
      } else if (isEditing && editingEventId && events.length === 0) {
        console.warn('⚠️ No events loaded yet');
      }
    }, [isEditing, editingEventId, events])
  );

  const loadEventData = async () => {
    if (!editingEventId) return;
    
    setLoading(true);
    try {
      // Buscar el evento en la lista de eventos (ya disponible desde useData)
      console.log('🔎 Searching for event:', editingEventId);
      console.log('📋 Available events:', events.length);
      const eventToEdit = events.find(e => e.id === editingEventId);
      
      if (eventToEdit) {
        console.log('✅ Event found:', eventToEdit.name);
        setFormData({
          name: eventToEdit.name,
          description: eventToEdit.description || '',
          startDate: eventToEdit.startDate ? new Date(eventToEdit.startDate) : null,
          location: eventToEdit.location || '',
          currency: eventToEdit.currency as 'ARS' | 'USD' | 'EUR' | 'BRL',
          eventType: eventToEdit.type as 'public' | 'private',
          category: eventToEdit.category as 'viaje' | 'casa' | 'cena' | 'trabajo' | 'evento' | 'otro'
        });
        console.log('📝 Form data loaded successfully');
      } else {
        console.error('❌ Event not found in events list');
        Alert.alert('Error', 'No se encontró el evento');
      }
    } catch (error) {
      console.error('Error loading event data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos del evento');
    }
    setLoading(false);
  };

  // Manejar botón back de Android
  useEffect(() => {
    const backAction = () => {
      // Acceder a formData directamente en el momento del evento
      const hasChanges = formData.name.trim().length > 0 || 
                        formData.description.trim().length > 0 || 
                        formData.location.trim().length > 0 ||
                        formData.startDate !== null;

      if (hasChanges) {
        Alert.alert(
          'Descartar cambios',
          '¿Estás seguro de que quieres salir? Los cambios no guardados se perderán.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Salir', onPress: () => (navigation as any).goBack(), style: 'destructive' }
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

  // Validación del formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del evento es requerido';
    } else if (formData.name.length > 50) {
      newErrors.name = 'El nombre no puede exceder 50 caracteres';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'La fecha de inicio es requerida';
    }

    if (formData.description.length > 200) {
      newErrors.description = 'La descripción no puede exceder 200 caracteres';
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
        'Descartar cambios',
        '¿Estás seguro de que quieres salir? Los cambios no guardados se perderán.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', onPress: () => (navigation as any).goBack(), style: 'destructive' }
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
        isEditing ? 'Evento actualizado' : 'Evento creado',
        isEditing ? 'El evento se ha actualizado exitosamente' : 'El evento se ha creado exitosamente',
        [
          { 
            text: 'OK', 
            onPress: () => {
              if (isEditing && editingEventId) {
                // Si estamos editando, volver a EventDetail
                (navigation as any).navigate('EventDetail', { eventId: editingEventId });
              } else {
                // Si estamos creando, volver a Home
                (navigation as any).navigate('Home');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'No se pudo crear el evento. Intenta nuevamente.');
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Header simple sin botón back customizado */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Editar Evento' : 'Crear Evento'}
        </Text>
        <View style={styles.headerRight}>
          <LanguageSelector size={26} color={theme.colors.onSurface} />
          <ThemeToggle size={24} color={theme.colors.onSurface} />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Información Básica */}
        <Card style={StyleSheet.flatten([styles.card])}>
          <Text style={styles.cardTitle}>Información Básica</Text>
          
          <Input
            label="Nombre del Evento *"
            placeholder="Ej: Viaje a Bariloche"
            value={formData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            icon="pencil"
            maxLength={50}
            error={errors.name}
            containerStyle={styles.input}
          />

          <Input
            label="Descripción (Opcional)"
            placeholder="Describe de qué trata el evento..."
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            multiline
            numberOfLines={3}
            maxLength={200}
            error={errors.description}
            containerStyle={styles.input}
          />
        </Card>

        {/* Fechas y Ubicación */}
        <Card style={StyleSheet.flatten([styles.card])}>
          <Text style={styles.cardTitle}>Fechas y Ubicación</Text>
          
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
                <Text style={styles.inputLabel}>Fecha de Inicio *</Text>
                <Text style={[
                  styles.inputValue,
                  !formData.startDate && styles.placeholder
                ]}>
                  {formData.startDate ? formatDate(formData.startDate) : 'Seleccionar fecha'}
                </Text>
              </View>
            </View>
            {errors.startDate && (
              <Text style={styles.errorText}>{errors.startDate}</Text>
            )}
          </TouchableOpacity>

          <Input
            label="Ubicación (Opcional)"
            placeholder="Ej: Bariloche, Argentina"
            value={formData.location}
            onChangeText={(text) => handleInputChange('location', text)}
            icon="map-marker-outline"
            containerStyle={styles.input}
          />
        </Card>

        {/* Configuración Financiera */}
        <Card style={StyleSheet.flatten([styles.card])}>
          <Text style={styles.cardTitle}>Configuración Financiera</Text>
          
          <View style={styles.currencyRow}>
            <Text style={styles.inputLabel}>Moneda *</Text>
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
                  <Text style={[
                    styles.currencyText,
                    formData.currency === curr && styles.currencyTextActive
                  ]}>
                    {curr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>


        </Card>

        {/* Configuración de Privacidad */}
        <Card style={StyleSheet.flatten([styles.card])}>
          <Text style={styles.cardTitle}>Configuración de Privacidad</Text>
          
          <View style={styles.radioGroup}>
            <Text style={styles.radioLabel}>Tipo de Evento</Text>
            
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
                <Text style={styles.radioTitle}>🌐 Público</Text>
                <Text style={styles.radioDescription}>Visible para todos los usuarios</Text>
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
                <Text style={styles.radioTitle}>🔒 Privado</Text>
                <Text style={styles.radioDescription}>Solo visible para participantes invitados</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.categoryRow}>
            <Text style={styles.inputLabel}>Categoría</Text>
            <View style={styles.categoryButtons}>
              {([
                { key: 'viaje', label: 'Viaje', icon: 'airplane' },
                { key: 'casa', label: 'Casa', icon: 'home' },
                { key: 'cena', label: 'Cena', icon: 'food' },
                { key: 'trabajo', label: 'Trabajo', icon: 'briefcase' },
                { key: 'evento', label: 'Evento', icon: 'calendar' },
                { key: 'otro', label: 'Otro', icon: 'dots-horizontal' }
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
                    color={formData.category === cat.key ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
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
          title="Cancelar"
          variant="outlined"
          onPress={handleBack}
          style={StyleSheet.flatten([styles.cancelButton])}
        />
        <Button
          title="Crear Evento"
          variant="filled"
          onPress={handleCreateEvent}
          disabled={!isFormValid()}
          style={StyleSheet.flatten([styles.createButton])}
        />
      </View>

    </SafeAreaView>
  );
};

export default CreateEventScreen;

const createStyles = (theme: Theme, insets: any) =>
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
      paddingTop: 12, // SafeAreaView handles top inset
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
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

    scrollView: {
      flex: 1,
      paddingHorizontal: 20,
    } as ViewStyle,

    scrollViewContent: {
      paddingBottom: 40, // SafeAreaView handles bottom inset
    } as ViewStyle,

    card: {
      marginVertical: 8,
    } as ViewStyle,

    cardTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      marginBottom: 16,
    } as TextStyle,

    input: {
      marginBottom: 16,
    } as ViewStyle,

    dateInput: {
      marginBottom: 16,
    } as ViewStyle,

    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.outline,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.colors.surface,
    } as ViewStyle,

    inputIcon: {
      marginRight: 12,
    } as ViewStyle,

    inputContent: {
      flex: 1,
    } as ViewStyle,

    inputLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
    } as TextStyle,

    inputValue: {
      fontSize: 16,
      color: theme.colors.onSurface,
    } as TextStyle,

    placeholder: {
      color: theme.colors.onSurfaceVariant,
    } as TextStyle,

    errorText: {
      fontSize: 12,
      color: theme.colors.error,
      marginTop: 4,
    } as TextStyle,

    currencyRow: {
      marginBottom: 16,
    } as ViewStyle,

    currencyButtons: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    } as ViewStyle,

    currencyButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
    } as ViewStyle,

    currencyButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    } as ViewStyle,

    currencyText: {
      fontWeight: '600',
      color: theme.colors.onSurfaceVariant,
    } as TextStyle,

    currencyTextActive: {
      color: theme.colors.onPrimary,
    } as TextStyle,

    radioGroup: {
      marginBottom: 16,
    } as ViewStyle,

    radioLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginBottom: 12,
    } as TextStyle,

    radioOption: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    } as ViewStyle,

    radioContent: {
      marginLeft: 12,
      flex: 1,
    } as ViewStyle,

    radioTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginBottom: 2,
    } as TextStyle,

    radioDescription: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    } as TextStyle,

    categoryRow: {
      marginBottom: 16,
    } as ViewStyle,

    categoryButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    } as ViewStyle,

    categoryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
    } as ViewStyle,

    categoryButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    } as ViewStyle,

    categoryButtonText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginLeft: 4,
    } as TextStyle,

    categoryButtonTextActive: {
      color: theme.colors.onPrimary,
    } as TextStyle,



    footerSpace: {
      height: 100,
    } as ViewStyle,

    footer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      paddingBottom: 16, // SafeAreaView handles bottom inset
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline,
      gap: 12,
    } as ViewStyle,

    cancelButton: {
      flex: 1,
    } as ViewStyle,

    createButton: {
      flex: 1,
    } as ViewStyle,


  });