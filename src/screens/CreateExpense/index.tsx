import React, { useState, useEffect, useMemo } from 'react';
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
  Image,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { LanguageSelector, ThemeToggle } from '../../components';
import { Theme } from '../../constants/theme';
import { 
  Input,
  Button,
  Card
} from '../../components';
import { Participant, Expense, Split } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { 
  ExpenseFormData, 
  ExpenseSplit, 
  FormErrors, 
  CategoryKey,
  CategoryConfig,
  CATEGORY_CONFIGS,
  CATEGORY_COLORS
} from './types';
import { createStyles } from './styles';
import { createExpenseLanguage } from './language';

const CreateExpenseScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { addExpense, updateExpense, getEventParticipants, getExpensesByEvent, getSplitsByEvent, events, expenses } = useData();
  const styles = createStyles(theme);
  const t = createExpenseLanguage[language] || createExpenseLanguage.es;
  
  const eventId = (route.params as any)?.eventId as string;
  const editingExpenseId = (route.params as any)?.expenseId;
  const isEditing = !!editingExpenseId;

  // Estados del formulario
  const [formData, setFormData] = useState<ExpenseFormData>({
    description: '',
    amount: '',
    date: new Date(),
    category: 'otros',
    payerId: '',
    splitType: 'equal',
    splits: []
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [eventParticipants, setEventParticipants] = useState<Participant[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [participantsPeopleCount, setParticipantsPeopleCount] = useState<Map<string, number>>(new Map());
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [payerSearchQuery, setPayerSearchQuery] = useState<string>('');

  // Cargar datos del evento y participantes cada vez que la pantalla se enfoca
  useFocusEffect(
    React.useCallback(() => {
      const loadEventData = async () => {
        try {
          const foundEvent = events.find(e => e.id === eventId);
          if (foundEvent) {
            setEvent(foundEvent);
            
            // Bloquear entrada si el evento está cerrado o completado
            if (!isEditing && (foundEvent.status === 'closed' || foundEvent.status === 'completed')) {
              Alert.alert(
                'Evento Cerrado',
                'No se pueden agregar gastos en un evento cerrado o completado',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
              return;
            }
          }

          const participants = await getEventParticipants(eventId);
          setEventParticipants(participants);

        // Guardar peopleCount de cada participante
        const peopleCountMap = new Map<string, number>();
        participants.forEach(p => {
          peopleCountMap.set(p.id, (p as any).peopleCount || 1);
        });
        setParticipantsPeopleCount(peopleCountMap);

        // Inicializar con todos los participantes incluidos por defecto SOLO si NO estamos editando
        if (participants.length > 0 && !isEditing) {
          console.log('🔄 Initializing splits for', participants.length, 'participants');
          const initialSplits: ExpenseSplit[] = participants.map(p => ({
            participantId: p.id,
            amount: 0,
            percentage: 100 / participants.length,
            defaultPeopleCount: (p as any).peopleCount || 1
          }));
          setFormData(prev => {
            const newData = { ...prev, splits: initialSplits };
            console.log('✅ Initial splits set:', initialSplits.length);
            return newData;
          });
        } else if (participants.length === 0) {
          console.warn('⚠️ No participants loaded for event:', eventId);
        }
        // Si estamos editando, los splits se cargarán en el useEffect de edición
      } catch (error) {
        console.error('❌ Error loading event data:', error);
        console.error('Error details:', error);
        Alert.alert(t.alerts.errors.general, t.alerts.errors.loadEvent);
      }
    };

      if (eventId) {
        loadEventData();
      }
    }, [eventId, events, getEventParticipants])
  );

  // Cargar datos del gasto si estamos editando
  useEffect(() => {
    const loadExpenseData = async () => {
      if (isEditing && editingExpenseId && eventParticipants.length > 0 && participantsPeopleCount.size > 0) {
        try {
          const allExpenses = await getExpensesByEvent(eventId);
          const expense = allExpenses.find(e => e.id === editingExpenseId);
          
          if (expense) {
            const splits = await getSplitsByEvent(eventId);
            const expenseSplits = splits.filter(s => s.expenseId === editingExpenseId);
            
            // Cargar datos del gasto en el formulario
            const loadedSplits = expenseSplits.map(split => {
              const participant = eventParticipants.find(p => p.id === split.participantId);
              const defaultPeopleCount = (participant as any)?.peopleCount || 1;
              return {
                participantId: split.participantId,
                amount: split.amount,
                percentage: split.percentage,
                peopleCount: (split as any).peopleCountOverride,
                defaultPeopleCount
              };
            });

            const isEqualSplit = expenseSplits.length === eventParticipants.length;

            setFormData({
              description: expense.description,
              amount: expense.amount.toString(),
              date: new Date(expense.date),
              category: expense.category as any,
              payerId: expense.payerId,
              splitType: 'equal',
              splits: loadedSplits
            });

            // IMPORTANTE: Recalcular si es división igual para aplicar peopleCount correctamente
            if (isEqualSplit) {
              // Es división igual, recalcular con peopleCount
              setTimeout(() => {
                recalculateSplits(expense.amount.toString());
              }, 100);
            }
          }
        } catch (error) {
          console.error('Error loading expense data:', error);
          Alert.alert(t.alerts.errors.general, t.alerts.errors.loadExpense);
        }
      }
    };

    loadExpenseData();
  }, [isEditing, editingExpenseId, eventParticipants, eventId, getExpensesByEvent, getSplitsByEvent, participantsPeopleCount]);

  // Manejar botón back de Android
  useEffect(() => {
    const backAction = () => {
      const hasChanges = formData.description.trim().length > 0 || 
                        formData.amount.trim().length > 0;

      if (hasChanges) {
        Alert.alert(
          t.alerts.exitConfirm.title,
          t.alerts.exitConfirm.message,
          [
            { text: t.alerts.exitConfirm.cancel, style: 'cancel' },
            { text: t.alerts.exitConfirm.confirm, onPress: () => navigation.goBack(), style: 'destructive' }
          ]
        );
      } else {
        navigation.goBack();
      }
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [formData, navigation]);

  // Funciones para manejo de imágenes
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(t.alerts.permissions.title, t.alerts.permissions.photos);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('📸 Image selected:', result.assets[0].uri);
        setReceiptImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
      Alert.alert(t.alerts.errors.general, t.alerts.errors.selectImage);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(t.alerts.permissions.title, t.alerts.permissions.camera);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('📸 Photo taken:', result.assets[0].uri);
        setReceiptImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ Error taking photo:', error);
      Alert.alert(t.alerts.errors.general, t.alerts.errors.takePhoto);
    }
  };

  const selectImageSource = () => {
    Alert.alert(
      'Adjuntar Comprobante',
      'Elige una opción',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tomar Foto', onPress: takePhoto },
        { text: 'Elegir de Galería', onPress: pickImage },
      ]
    );
  };

  const removeImage = () => {
    Alert.alert(
      'Eliminar Imagen',
      '¿Deseas eliminar la imagen del comprobante?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => setReceiptImage(null) },
      ]
    );
  };

  // Validación del formulario
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    }

    const amount = parseFloat(formData.amount);
    if (!formData.amount.trim() || isNaN(amount) || amount <= 0) {
      newErrors.amount = 'El monto debe ser mayor a 0';
    }

    if (!formData.payerId) {
      newErrors.payerId = 'Debe seleccionar quién pagó';
    }

    // Validar que hay participantes incluidos
    if (formData.splits.length === 0) {
      newErrors.splits = 'Debes incluir al menos un participante en el gasto';
    }

    // Validar que los splits tengan montos válidos
    const totalSplitAmount = formData.splits.reduce((sum, split) => sum + (split.amount || 0), 0);
    if (totalSplitAmount <= 0) {
      newErrors.splits = 'Los montos de los participantes deben ser mayores a 0';
    }

    // Las validaciones de splits no son necesarias ya que siempre se divide de forma igual automáticamente

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Función para formatear moneda
  const formatCurrency = (value: string): string => {
    // Remover todo excepto números y punto decimal
    const numericValue = value.replace(/[^\d.]/g, '');
    
    // Separar parte entera y decimal
    const parts = numericValue.split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];
    
    // Agregar separadores de miles a la parte entera
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    
    // Construir el resultado final
    if (decimalPart !== undefined) {
      // Limitar decimales a 2 dígitos
      const limitedDecimal = decimalPart.substring(0, 2);
      return formattedInteger + '.' + limitedDecimal;
    }
    
    return formattedInteger;
  };

  // Función para obtener el valor numérico sin formato
  const getNumericValue = (formattedValue: string): string => {
    return formattedValue.replace(/,/g, '');
  };

  // Handlers
  const handleInputChange = (field: keyof ExpenseFormData, value: any) => {
    // Ignorar cambios de splitType ya que siempre será 'equal'
    if (field === 'splitType') return;
    
    let processedValue = value;
    
    // Formatear el monto si es el campo amount
    if (field === 'amount') {
      processedValue = formatCurrency(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    // Limpiar error del campo
    if (errors[field.toString()]) {
      const newErrors = { ...errors };
      delete newErrors[field.toString()];
      setErrors(newErrors);
    }

    // Recalcular splits cuando cambia el monto (siempre usando 'equal')
    if (field === 'amount') {
      // Si hay splits, recalcular usando el valor numérico
      if (formData.splits.length > 0) {
        const numericValue = getNumericValue(processedValue);
        recalculateSplits(numericValue);
      }
    }
  };

  const recalculateSplits = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    // Solo recalcular para participantes ya incluidos (no cambiar la selección)
    const currentSplits = formData.splits;
    if (currentSplits.length === 0) return;

    // Siempre calcular división igual considerando peopleCount
    const totalPeopleUnits = currentSplits.reduce((sum, split) => {
      const peopleCount = split.peopleCount !== undefined ? split.peopleCount : split.defaultPeopleCount || 1;
      return sum + peopleCount;
    }, 0);
    const amountPerUnit = numAmount / totalPeopleUnits;
    
    const newSplits = currentSplits.map(split => {
      const peopleCount = split.peopleCount !== undefined ? split.peopleCount : split.defaultPeopleCount || 1;
      const amount = amountPerUnit * peopleCount;
      return {
        ...split,
        amount,
        percentage: (peopleCount / totalPeopleUnits) * 100
      };
    });

    setFormData(prev => ({ ...prev, splits: newSplits }));
  };

  const handleParticipantToggle = (participantId: string) => {
    const isIncluded = formData.splits.some(split => split.participantId === participantId);
    
    if (isIncluded) {
      // Excluir participante
      const newSplits = formData.splits.filter(split => split.participantId !== participantId);
      
      // Recalcular automáticamente la división para los participantes restantes (siempre igual)
      const updatedSplits = recalculateSplitsForParticipants(newSplits, getAmount());
      setFormData(prev => ({ ...prev, splits: updatedSplits }));
    } else {
      // Incluir participante
      const amount = getAmount();
      
      // Agregar nuevo participante con su defaultPeopleCount
      const defaultPeopleCount = participantsPeopleCount.get(participantId) || 1;
      const newSplit: ExpenseSplit = {
        participantId,
        amount: 0,
        percentage: 0,
        defaultPeopleCount
      };
      
      const allSplits = [...formData.splits, newSplit];
      
      // Recalcular automáticamente la división para todos los participantes (siempre igual)
      const updatedSplits = recalculateSplitsForParticipants(allSplits, amount);
      setFormData(prev => ({ ...prev, splits: updatedSplits }));
    }
  };

  const recalculateSplitsForParticipants = (splits: ExpenseSplit[], amount: number): ExpenseSplit[] => {
    if (splits.length === 0) return [];

    // Siempre calcular división igual considerando peopleCount
    const totalPeopleUnits = splits.reduce((sum, split) => {
      const peopleCount = split.peopleCount !== undefined ? split.peopleCount : split.defaultPeopleCount || 1;
      return sum + peopleCount;
    }, 0);
    const amountPerUnit = amount / totalPeopleUnits;
    
    return splits.map(split => {
      const peopleCount = split.peopleCount !== undefined ? split.peopleCount : split.defaultPeopleCount || 1;
      const splitAmount = amountPerUnit * peopleCount;
      return {
        ...split,
        amount: splitAmount,
        percentage: (peopleCount / totalPeopleUnits) * 100
      };
    });
  };

  // Funciones de manejo de splits eliminadas ya que siempre se usa división igual automática

  const handlePeopleCountOverride = (participantId: string, override: number | undefined) => {
    const newSplits = formData.splits.map(split => {
      if (split.participantId === participantId) {
        return { ...split, peopleCount: override };
      }
      return split;
    });

    setFormData(prev => ({ ...prev, splits: newSplits }));

    // Recalcular montos siempre (división igual automática)
    recalculateSplits(formData.amount);
  };

  const getAmount = (): number => {
    const numericValue = getNumericValue(formData.amount);
    return parseFloat(numericValue) || 0;
  };

  const handleCreateExpense = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing && editingExpenseId) {
        // Actualizar gasto existente
        const numericAmount = getNumericValue(formData.amount);
        const expenseUpdates: Partial<Expense> = {
          description: formData.description.trim(),
          amount: parseFloat(numericAmount),
          currency: event?.currency || 'ARS',
          date: formData.date.toISOString(),
          category: formData.category,
          payerId: formData.payerId,
          updatedAt: new Date().toISOString()
        };

        const splits: Split[] = formData.splits.map(split => ({
          id: `${editingExpenseId}_${split.participantId}`,
          expenseId: editingExpenseId,
          participantId: split.participantId,
          amount: split.amount,
          percentage: split.percentage,
          type: 'equal',
          isPaid: split.participantId === formData.payerId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

        await updateExpense(editingExpenseId, expenseUpdates, splits);
        
        Alert.alert(
          'Gasto actualizado',
          'El gasto se ha actualizado exitosamente',
          [
            { 
              text: 'OK', 
              onPress: () => navigation.goBack()
            }
          ]
        );
      } else {
        // Crear nuevo gasto
        console.log('💾 Creating new expense...');
        console.log('Participants count:', eventParticipants.length);
        console.log('Splits count:', formData.splits.length);
        console.log('Receipt image:', receiptImage ? 'Present' : 'None');
        
        const numericAmount = getNumericValue(formData.amount);
        const expense: Expense = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          eventId,
          description: formData.description.trim(),
          amount: parseFloat(numericAmount),
          currency: event?.currency || 'ARS',
          date: formData.date.toISOString(),
          category: formData.category,
          payerId: formData.payerId,
          receiptImage: receiptImage || undefined,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const splits: Split[] = formData.splits.map(split => ({
          id: `${expense.id}_${split.participantId}`,
          expenseId: expense.id,
          participantId: split.participantId,
          amount: split.amount,
          percentage: split.percentage,
          type: 'equal',
          isPaid: split.participantId === formData.payerId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

        console.log('📝 Expense object:', JSON.stringify(expense, null, 2));
        console.log('📊 Splits:', splits.length, 'splits created');
        
        await addExpense(expense, splits);
        console.log('✅ Expense saved successfully');
        
        Alert.alert(
          'Gasto creado',
          'El gasto se ha registrado exitosamente',
          [
            { 
              text: 'OK', 
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      console.error('Error details:', JSON.stringify(error));
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert(t.alerts.errors.general, `${t.alerts.errors.saveExpense}: ${errorMessage}`);
    }
  };

  const handleBack = () => {
    const hasChanges = formData.description.trim().length > 0 || 
                      formData.amount.trim().length > 0;

    if (hasChanges) {
      Alert.alert(
        t.alerts.exitConfirm.title,
        t.alerts.exitConfirm.message,
        [
          { text: t.alerts.exitConfirm.cancel, style: 'cancel' },
          { text: t.alerts.exitConfirm.confirm, onPress: () => navigation.goBack(), style: 'destructive' }
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCategoryIcon = (category: string): string => {
    const icons = {
      comida: 'food',
      transporte: 'car',
      alojamiento: 'home',
      entretenimiento: 'gamepad-variant',
      compras: 'shopping',
      salud: 'medical-bag',
      educacion: 'school',
      otros: 'dots-horizontal'
    };
    return icons[category as keyof typeof icons] || 'dots-horizontal';
  };

  const getCategoryColor = (category: CategoryKey): string => {
    return CATEGORY_COLORS[category] || '#5F27CD';
  };

  const getParticipantName = (participantId: string): string => {
    const participant = eventParticipants.find(p => p.id === participantId);
    return participant?.name || 'Desconocido';
  };

  const isFormValid = (): boolean => {
    const numericAmount = getNumericValue(formData.amount);
    return formData.description.trim().length > 0 && 
           formData.amount.trim().length > 0 && 
           !isNaN(parseFloat(numericAmount)) && 
           parseFloat(numericAmount) > 0 &&
           formData.payerId.length > 0;
  };

  // Participantes ordenados alfabéticamente para el pagador con filtro
  const sortedParticipantsForPayer = useMemo(() => {
    return eventParticipants
      .filter(p => p.name.toLowerCase().includes(payerSearchQuery.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [eventParticipants, payerSearchQuery]);

  // Participantes ordenados alfabéticamente para la división
  const sortedParticipantsForSplit = useMemo(() => {
    return eventParticipants.sort((a, b) => a.name.localeCompare(b.name));
  }, [eventParticipants]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isEditing ? t.headerTitle.edit : t.headerTitle.create}
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
        {/* Información del Gasto */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{t.expenseInfoCard.title}</Text>
          
          <Input
            label={t.expenseInfoCard.descriptionLabel}
            placeholder={t.expenseInfoCard.descriptionPlaceholder}
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            icon="file-document-outline"
            maxLength={100}
            error={errors.description}
            containerStyle={styles.input}
          />

          <View style={styles.amountInputContainer}>
            <Input
              label={t.expenseInfoCard.amountLabel}
              placeholder={t.expenseInfoCard.amountPlaceholder}
              value={formData.amount}
              onChangeText={(text) => handleInputChange('amount', text)}
              keyboardType="numeric"
              icon="currency-usd"
              error={errors.amount}
              containerStyle={styles.input}
            />
            <Text style={styles.currencySuffix}>{event?.currency || 'ARS'}</Text>
          </View>

          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons
                name="calendar-outline"
                size={20}
                color={theme.colors.onSurfaceVariant}
                style={styles.inputIcon}
              />
              <View style={styles.inputContent}>
                <Text style={styles.inputLabel}>{t.expenseInfoCard.dateLabel}</Text>
                <Text style={styles.inputValue}>
                  {formatDate(formData.date)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Card>

        {/* Pagador */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{t.payerCard.title}</Text>
          
          <View style={styles.searchContainer}>
            <Input
              label={t.payerCard.searchLabel}
              placeholder={t.payerCard.searchPlaceholder}
              value={payerSearchQuery}
              onChangeText={setPayerSearchQuery}
              icon="magnify"
              containerStyle={styles.searchInput}
            />
            {payerSearchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => setPayerSearchQuery('')}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            )}
          </View>
          
          {sortedParticipantsForPayer.map((participant) => (
            <TouchableOpacity
              key={participant.id}
              style={[
                styles.participantOption,
                formData.payerId === participant.id && styles.participantOptionActive
              ]}
              onPress={() => handleInputChange('payerId', participant.id)}
            >
              <MaterialCommunityIcons
                name={formData.payerId === participant.id ? 'radiobox-marked' : 'radiobox-blank'}
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.payerParticipantName}>{participant.name}</Text>
            </TouchableOpacity>
          ))}
          {errors.payerId && (
            <Text style={styles.errorText}>{errors.payerId}</Text>
          )}
        </Card>

        {/* División de Participantes Unificada */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{t.participantsCard.title}</Text>
          <Text style={styles.cardSubtitle}>{t.participantsCard.subtitle}</Text>

          {/* Lista Unificada de Participantes */}
          <View style={styles.participantsList}>
            {sortedParticipantsForSplit.map((participant) => {
              const split = formData.splits.find(s => s.participantId === participant.id);
              const isIncluded = !!split;
              const amount = split?.amount || 0;
              const percentage = split?.percentage || 0;
              
              return (
                <View key={participant.id} style={[
                  styles.unifiedParticipantRow,
                  !isIncluded && styles.unifiedParticipantRowExcluded
                ]}>
                  <TouchableOpacity
                    style={styles.participantToggle}
                    onPress={() => handleParticipantToggle(participant.id)}
                  >
                    <MaterialCommunityIcons
                      name={isIncluded ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={20}
                      color={isIncluded ? theme.colors.primary : theme.colors.onSurfaceVariant}
                    />
                    <Text style={[
                      styles.participantName,
                      isIncluded && styles.participantNameActive,
                      !isIncluded && styles.participantNameExcluded
                    ]}>
                      {participant.name}
                    </Text>
                  </TouchableOpacity>

                  {isIncluded && (
                    <View style={styles.participantAmount}>
                      <Text style={styles.amountText}>
                        ${amount.toFixed(2)}
                      </Text>
                    </View>
                  )}

                  {!isIncluded && (
                    <Text style={styles.excludedLabel}>{t.participantsCard.excludedLabel}</Text>
                  )}
                </View>
              );
            })}
          </View>

          {formData.splits.length === 0 && (
            <Text style={styles.warningText}>
              {t.participantsCard.warningText}
            </Text>
          )}
          
          {/* Resumen de totales */}
          {formData.splits.length > 0 && (
            <View style={styles.totalSummary}>
              <Text style={styles.totalSummaryText}>
                {t.summary.total}: ${formData.splits.reduce((sum, split) => sum + split.amount, 0).toFixed(2)}
                {formData.splits.length > 1 && ` • ${formData.splits.length} ${formData.splits.length === 1 ? t.summary.participant : t.summary.participants}`}
              </Text>
            </View>
          )}

        </Card>

        {/* Comprobante / Imagen */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{t.receiptCard.title}</Text>
          
          {receiptImage ? (
            <View style={{ marginTop: 12 }}>
              <Image
                source={{ uri: receiptImage }}
                style={{ width: '100%', height: 200, borderRadius: 8, marginBottom: 12 }}
                resizeMode="cover"
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', paddingVertical: 12, borderRadius: 8 }}
                  onPress={selectImageSource}
                >
                  <MaterialCommunityIcons name="image-edit" size={20} color="#007AFF" />
                  <Text style={{ marginLeft: 8, fontSize: 14, color: '#007AFF', fontWeight: '500' }}>
                    {t.receiptCard.changeButton}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', paddingVertical: 12, borderRadius: 8 }}
                  onPress={removeImage}
                >
                  <MaterialCommunityIcons name="delete" size={20} color="#ff4444" />
                  <Text style={{ marginLeft: 8, fontSize: 14, color: '#ff4444', fontWeight: '500' }}>
                    {t.receiptCard.deleteButton}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', paddingVertical: 16, borderRadius: 8, borderWidth: 2, borderColor: '#e0e0e0', borderStyle: 'dashed' }}
              onPress={selectImageSource}
            >
              <MaterialCommunityIcons name="camera-plus" size={24} color="#666" />
              <Text style={{ marginLeft: 8, fontSize: 14, color: '#666', fontWeight: '500' }}>
                {t.receiptCard.attachButton}
              </Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Categorización */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{t.categoryCard.title}</Text>
          
          <Text style={styles.sectionLabel}>{t.categoryCard.sectionLabel}</Text>
          <View style={styles.categoryGrid}>
            {CATEGORY_CONFIGS.map((cat) => (
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
                  size={20}
                  color={formData.category === cat.key ? '#FFFFFF' : getCategoryColor(cat.key)}
                />
                <Text style={[
                  styles.categoryButtonText,
                  formData.category === cat.key && styles.categoryButtonTextActive
                ]}>
                  {t.categories[cat.key]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Espacio para los botones footer */}
        <View style={styles.footerSpace} />
      </ScrollView>

      {/* DateTimePicker */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (selectedDate) {
              handleInputChange('date', selectedDate);
            }
          }}
        />
      )}

      {/* Botones Footer Sticky */}
      <View style={styles.footer}>
        <Button
          title={t.buttons.cancel}
          variant="outlined"
          onPress={handleBack}
          style={styles.cancelButton}
        />
        <Button
          title={isEditing ? t.buttons.update : t.buttons.create}
          variant="filled"
          onPress={handleCreateExpense}
          disabled={!isFormValid()}
          style={styles.createButton}
        />
      </View>
    </SafeAreaView>
  );
};

export default CreateExpenseScreen;