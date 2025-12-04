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

interface ExpenseFormData {
  description: string;
  amount: string;
  date: Date;
  category: 'comida' | 'transporte' | 'alojamiento' | 'entretenimiento' | 'compras' | 'salud' | 'educacion' | 'otros';
  payerId: string;
  splitType: 'equal';
  splits: ExpenseSplit[];
}

interface ExpenseSplit {
  participantId: string;
  amount: number;
  percentage?: number;
  peopleCount?: number; // Override del peopleCount para este gasto específico
  defaultPeopleCount?: number; // peopleCount por defecto del evento
}

const CreateExpenseScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme } = useTheme();
  const { addExpense, updateExpense, getEventParticipants, getExpensesByEvent, getSplitsByEvent, events, expenses } = useData();
  const styles = createStyles(theme);
  
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

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [eventParticipants, setEventParticipants] = useState<Participant[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [participantsPeopleCount, setParticipantsPeopleCount] = useState<Map<string, number>>(new Map());
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

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
        Alert.alert('Error', 'No se pudieron cargar los datos del evento');
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
              splitType: isEqualSplit ? 'equal' : 'custom',
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
          Alert.alert('Error', 'No se pudieron cargar los datos del gasto');
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
          'Descartar cambios',
          '¿Estás seguro de que quieres salir? Los cambios no guardados se perderán.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Salir', onPress: () => navigation.goBack(), style: 'destructive' }
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
        Alert.alert('Permiso requerido', 'Necesitamos permiso para acceder a tus fotos');
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
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos permiso para acceder a tu cámara');
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
      Alert.alert('Error', 'No se pudo tomar la foto');
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

  // Handlers
  const handleInputChange = (field: keyof ExpenseFormData, value: any) => {
    // Ignorar cambios de splitType ya que siempre será 'equal'
    if (field === 'splitType') return;
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo
    if (errors[field.toString()]) {
      const newErrors = { ...errors };
      delete newErrors[field.toString()];
      setErrors(newErrors);
    }

    // Recalcular splits cuando cambia el monto (siempre usando 'equal')
    if (field === 'amount') {
      // Si hay splits, recalcular
      if (formData.splits.length > 0) {
        recalculateSplits(value);
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
    return parseFloat(formData.amount) || 0;
  };

  const handleCreateExpense = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing && editingExpenseId) {
        // Actualizar gasto existente
        const expenseUpdates: Partial<Expense> = {
          description: formData.description.trim(),
          amount: parseFloat(formData.amount),
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
        
        const expense: Expense = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          eventId,
          description: formData.description.trim(),
          amount: parseFloat(formData.amount),
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
      Alert.alert('Error', `No se pudo guardar el gasto: ${errorMessage}`);
    }
  };

  const handleBack = () => {
    const hasChanges = formData.description.trim().length > 0 || 
                      formData.amount.trim().length > 0;

    if (hasChanges) {
      Alert.alert(
        'Descartar cambios',
        '¿Estás seguro de que quieres salir? Los cambios no guardados se perderán.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Salir', onPress: () => navigation.goBack(), style: 'destructive' }
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

  const getCategoryColor = (category: string): string => {
    const colors = {
      comida: '#FF6B6B',
      transporte: '#4ECDC4',
      alojamiento: '#45B7D1',
      entretenimiento: '#96CEB4',
      compras: '#FECA57',
      salud: '#FF9FF3',
      educacion: '#54A0FF',
      otros: '#5F27CD'
    };
    return colors[category as keyof typeof colors] || '#5F27CD';
  };

  const getParticipantName = (participantId: string): string => {
    const participant = eventParticipants.find(p => p.id === participantId);
    return participant?.name || 'Desconocido';
  };

  const isFormValid = (): boolean => {
    return formData.description.trim().length > 0 && 
           formData.amount.trim().length > 0 && 
           !isNaN(parseFloat(formData.amount)) && 
           parseFloat(formData.amount) > 0 &&
           formData.payerId.length > 0;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Editar Gasto' : 'Agregar Gasto'}
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
          <Text style={styles.cardTitle}>📝 Información del Gasto</Text>
          
          <Input
            label="¿En qué se gastó? *"
            placeholder="Ej: Cena en restaurante"
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            icon="receipt-outline"
            maxLength={100}
            error={errors.description}
            containerStyle={styles.input}
          />

          <View style={styles.amountInputContainer}>
            <Input
              label="Monto Total *"
              placeholder="0.00"
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
                <Text style={styles.inputLabel}>Fecha del Gasto *</Text>
                <Text style={styles.inputValue}>
                  {formatDate(formData.date)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Card>

        {/* Categorización */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>🏷️ Categorización</Text>
          
          <Text style={styles.sectionLabel}>Categoría</Text>
          <View style={styles.categoryGrid}>
            {([
              { key: 'comida', label: 'Comida', icon: 'food-fork-drink' },
              { key: 'transporte', label: 'Transporte', icon: 'car' },
              { key: 'alojamiento', label: 'Alojamiento', icon: 'home' },
              { key: 'entretenimiento', label: 'Entretenimiento', icon: 'gamepad-variant' },
              { key: 'compras', label: 'Compras', icon: 'shopping' },
              { key: 'salud', label: 'Salud', icon: 'medical-bag' },
              { key: 'educacion', label: 'Educación', icon: 'school' },
              { key: 'otros', label: 'Otros', icon: 'dots-horizontal' }
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
                  size={20}
                  color={formData.category === cat.key ? '#FFFFFF' : getCategoryColor(cat.key)}
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
        </Card>

        {/* Comprobante / Imagen */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>📷 Comprobante (Opcional)</Text>
          
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
                    Cambiar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5', paddingVertical: 12, borderRadius: 8 }}
                  onPress={removeImage}
                >
                  <MaterialCommunityIcons name="delete" size={20} color="#ff4444" />
                  <Text style={{ marginLeft: 8, fontSize: 14, color: '#ff4444', fontWeight: '500' }}>
                    Eliminar
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
                Adjuntar comprobante o recibo
              </Text>
            </TouchableOpacity>
          )}
        </Card>

        {/* Pagador */}
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>👤 ¿Quién pagó?</Text>
          
          {eventParticipants.map((participant) => (
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
          <Text style={styles.cardTitle}>👥 Participantes y División</Text>
          <Text style={styles.cardSubtitle}>Selecciona participantes - la división se hará automáticamente de forma igual</Text>

          {/* Lista Unificada de Participantes */}
          <View style={styles.participantsList}>
            {eventParticipants.map((participant) => {
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
                    <Text style={styles.excludedLabel}>Excluido</Text>
                  )}
                </View>
              );
            })}
          </View>

          {formData.splits.length === 0 && (
            <Text style={styles.warningText}>
              ⚠️ Debes incluir al menos un participante
            </Text>
          )}
          
          {/* Resumen de totales */}
          {formData.splits.length > 0 && (
            <View style={styles.totalSummary}>
              <Text style={styles.totalSummaryText}>
                Total: ${formData.splits.reduce((sum, split) => sum + split.amount, 0).toFixed(2)}
                {formData.splits.length > 1 && ` • ${formData.splits.length} participantes`}
              </Text>
            </View>
          )}

        </Card>

        {/* Preview Card - Solo resumen visual, sin edición */}
        {formData.splits.length > 0 && (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>📊 Vista Previa</Text>
            <View style={styles.splitPreview}>
              {formData.splits.map((split) => {
                const defaultPeopleCount = split.defaultPeopleCount || 1;
                const currentPeopleCount = split.peopleCount !== undefined ? split.peopleCount : defaultPeopleCount;
                const hasOverride = split.peopleCount !== undefined && split.peopleCount !== defaultPeopleCount;
                
                return (
                  <View key={split.participantId} style={styles.splitItem}>
                    <View style={styles.splitParticipantInfo}>
                      <MaterialCommunityIcons
                        name="account"
                        size={16}
                        color={theme.colors.primary}
                      />
                      <Text style={styles.splitParticipant}>
                        {getParticipantName(split.participantId)}
                      </Text>
                      {currentPeopleCount > 1 && (
                        <View style={styles.peopleCountBadge}>
                          <MaterialCommunityIcons
                            name="account-multiple"
                            size={12}
                            color={hasOverride ? theme.colors.error : theme.colors.primary}
                          />
                          <Text style={[
                            styles.peopleCountBadgeText,
                            hasOverride && styles.peopleCountBadgeTextOverride
                          ]}>
                            ×{currentPeopleCount}{hasOverride ? '*' : ''}
                          </Text>
                        </View>
                      )}
                      {(
                        <TouchableOpacity
                          onPress={() => {
                            Alert.prompt(
                              'Modificar personas',
                              `Por defecto: ${defaultPeopleCount} persona(s)\n\nIngresa el número de personas para este gasto específico (1-20), o deja vacío para usar el valor por defecto:`,
                              [
                                { text: 'Cancelar', style: 'cancel' },
                                { text: 'Restablecer', onPress: () => handlePeopleCountOverride(split.participantId, undefined), style: 'destructive' },
                                {
                                  text: 'OK',
                                  onPress: (value?: string) => {
                                    if (value && value.trim()) {
                                      const num = parseInt(value.trim());
                                      if (!isNaN(num) && num >= 1 && num <= 20) {
                                        handlePeopleCountOverride(split.participantId, num);
                                      } else {
                                        Alert.alert('Error', 'Ingresa un número entre 1 y 20');
                                      }
                                    } else {
                                      handlePeopleCountOverride(split.participantId, undefined);
                                    }
                                  }
                                }
                              ],
                              'plain-text',
                              currentPeopleCount.toString()
                            );
                          }}
                          style={styles.overrideButton}
                        >
                          <MaterialCommunityIcons
                            name="pencil"
                            size={14}
                            color={theme.colors.primary}
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={styles.splitAmountInfo}>
                      <Text style={styles.splitAmount}>
                        ${split.amount.toFixed(2)}
                      </Text>

                    </View>
                  </View>
                );
              })}
            </View>
            
            {formData.splits.length > 0 && (
              <View style={styles.splitSummary}>
                <Text style={styles.splitSummaryText}>
                  {formData.splits.length} participantes • ${getAmount()} {event?.currency || 'ARS'}
                </Text>
              </View>
            )}
            
            {errors.splits && (
              <Text style={styles.errorText}>{errors.splits}</Text>
            )}
          </Card>
        )}

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
          title="Cancelar"
          variant="outlined"
          onPress={handleBack}
          style={styles.cancelButton}
        />
        <Button
          title={isEditing ? 'Actualizar' : 'Crear Gasto'}
          variant="filled"
          onPress={handleCreateExpense}
          disabled={!isFormValid()}
          style={styles.createButton}
        />
      </View>
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

    headerSpacer: {
      width: 40,
    } as ViewStyle,

    scrollView: {
      flex: 1,
      paddingHorizontal: 20,
    } as ViewStyle,

    scrollViewContent: {
      paddingVertical: 20,
    } as ViewStyle,

    card: {
      marginBottom: 16,
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

    sectionLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginBottom: 12,
    } as TextStyle,

    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    } as ViewStyle,

    categoryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.outline,
      backgroundColor: theme.colors.surface,
      minWidth: '45%',
    } as ViewStyle,

    categoryButtonActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    } as ViewStyle,

    categoryButtonText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginLeft: 6,
    } as TextStyle,

    categoryButtonTextActive: {
      color: theme.colors.onPrimary,
    } as TextStyle,

    participantOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 4,
    } as ViewStyle,

    participantOptionActive: {
      backgroundColor: theme.colors.primaryContainer,
      borderRadius: 8,
      paddingHorizontal: 8,
    } as ViewStyle,

    payerParticipantName: {
      fontSize: 16,
      color: theme.colors.onSurface,
      marginLeft: 12,
    } as TextStyle,



    splitPreview: {
      backgroundColor: theme.colors.surfaceVariant,
      borderRadius: 8,
      padding: 12,
    } as ViewStyle,

    splitPreviewTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurfaceVariant,
      marginBottom: 8,
    } as TextStyle,

    splitItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    } as ViewStyle,

    splitParticipant: {
      fontSize: 14,
      color: theme.colors.onSurface,
    } as TextStyle,

    peopleCountBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.primaryContainer,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      gap: 2,
    } as ViewStyle,

    peopleCountBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.colors.primary,
    } as TextStyle,

    peopleCountBadgeTextOverride: {
      color: theme.colors.error,
    } as TextStyle,

    overrideButton: {
      padding: 4,
      borderRadius: 4,
      backgroundColor: theme.colors.surfaceVariant,
    } as ViewStyle,

    splitAmount: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.onSurface,
    } as TextStyle,

    splitPercentage: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    } as TextStyle,

    // Nuevos estilos para selección de participantes
    cardSubtitle: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 16,
      fontStyle: 'italic',
    } as TextStyle,

    participantCheckbox: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderRadius: 8,
    } as ViewStyle,

    participantCheckboxActive: {
      backgroundColor: theme.colors.primaryContainer,
      paddingHorizontal: 8,
    } as ViewStyle,

    participantCheckboxText: {
      fontSize: 16,
      color: theme.colors.onSurface,
      marginLeft: 12,
      flex: 1,
    } as TextStyle,

    participantCheckboxTextActive: {
      color: theme.colors.primary,
      fontWeight: '500',
    } as TextStyle,

    excludedLabel: {
      fontSize: 12,
      color: theme.colors.error,
      backgroundColor: theme.colors.errorContainer,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    } as TextStyle,

    warningText: {
      fontSize: 14,
      color: theme.colors.error,
      textAlign: 'center',
      fontStyle: 'italic',
      paddingVertical: 8,
    } as TextStyle,

    // Nuevos estilos para configuración de splits
    splitConfiguration: {
      marginBottom: 16,
    } as ViewStyle,

    splitConfigTitle: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.colors.onSurface,
      marginBottom: 12,
    } as TextStyle,

    splitConfigItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline + '30',
    } as ViewStyle,

    splitConfigParticipant: {
      fontSize: 14,
      color: theme.colors.onSurface,
      flex: 1,
    } as TextStyle,

    splitConfigInput: {
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 80,
    } as ViewStyle,

    percentageInput: {
      width: 60,
    } as ViewStyle,

    amountInput: {
      width: 80,
    } as ViewStyle,

    percentageSymbol: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginLeft: 4,
    } as TextStyle,

    currencySymbol: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginRight: 4,
    } as TextStyle,

    splitTotal: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
      textAlign: 'center',
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline + '50',
    } as TextStyle,

    // Nuevos estilos para el preview mejorado
    splitParticipantInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    } as ViewStyle,

    splitAmountInfo: {
      alignItems: 'flex-end',
    } as ViewStyle,

    noParticipantsText: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      fontStyle: 'italic',
      paddingVertical: 16,
    } as TextStyle,

    splitSummary: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outline + '50',
    } as ViewStyle,

    splitSummaryText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
    } as TextStyle,

    errorText: {
      fontSize: 12,
      color: theme.colors.error,
      marginTop: 4,
    } as TextStyle,

    footerSpace: {
      height: 100,
    } as ViewStyle,

    footer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
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

    amountInputContainer: {
      position: 'relative',
    } as ViewStyle,

    currencySuffix: {
      position: 'absolute',
      right: 16,
      top: 40,
      fontSize: 16,
      color: theme.colors.onSurfaceVariant,
      fontWeight: '500',
    } as TextStyle,

    // Nuevos estilos para la interfaz unificada
    participantsList: {
      marginTop: 16,
    } as ViewStyle,

    unifiedParticipantRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline + '20',
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      marginBottom: 4,
    } as ViewStyle,

    unifiedParticipantRowExcluded: {
      opacity: 0.6,
      backgroundColor: theme.colors.surfaceVariant + '50',
    } as ViewStyle,

    participantToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    } as ViewStyle,

    participantName: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      marginLeft: 12,
      flex: 1,
    } as TextStyle,

    participantNameActive: {
      color: theme.colors.onSurface,
      fontWeight: '500',
    } as TextStyle,

    participantNameExcluded: {
      color: theme.colors.onSurfaceVariant,
      fontStyle: 'italic',
    } as TextStyle,

    participantAmount: {
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 80,
    } as ViewStyle,

    amountText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
    } as TextStyle,

    inlineInput: {
      width: 60,
      height: 35,
      fontSize: 13,
    } as ViewStyle,

    customAmountInput: {
      flexDirection: 'row',
      alignItems: 'center',
    } as ViewStyle,

    totalSummary: {
      marginTop: 12,
      padding: 12,
      backgroundColor: theme.colors.primaryContainer + '30',
      borderRadius: 8,
    } as ViewStyle,

    totalSummaryText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.primary,
      textAlign: 'center',
    } as TextStyle,
  });

export default CreateExpenseScreen;