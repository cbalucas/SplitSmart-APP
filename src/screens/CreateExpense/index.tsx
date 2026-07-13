import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  BackHandler,
  Image,
  Platform,
  KeyboardAvoidingView,
  Switch,
  TextInput,
  Modal
} from 'react-native';
import TutorialOverlay from '../../components/TutorialOverlay';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { Theme } from '../../constants/theme';
import { 
  Input,
  Button,
  Card,
  HeaderBar
} from '../../components';
import SearchBar from '../../components/SearchBar';
import { CurrencySelector } from '../../components/CurrencySelector';
import { Participant, Expense, Split } from '../../types';
import { showAlert } from '../../services/alertService';
import { generateId, deterministicId } from '../../utils/uuid';
import { 
  ExpenseFormData, 
  ExpenseSplit, 
  FormErrors, 
  CategoryKey,
  CategoryConfig,
  CATEGORY_CONFIGS,
  CATEGORY_COLORS,
  MultiPayer
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

  // Helper para mostrar alerts (mantenido por compatibilidad con usos existentes)
  const showThemedAlert = (title: string, message: string, buttons?: { text: string; style?: 'cancel' | 'destructive' | 'default'; onPress?: () => void }[]) => {
    showAlert({ type: 'confirm', title, message, buttons });
  };
  
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
    splits: [],
    isMultiplePayers: false,
    multiPayers: []
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [eventParticipants, setEventParticipants] = useState<Participant[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [participantsPeopleCount, setParticipantsPeopleCount] = useState<Map<string, number>>(new Map());
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [payerSearchQuery, setPayerSearchQuery] = useState<string>('');
  const [submittedOnce, setSubmittedOnce] = useState(false);

  // ── Toggle multipagadores ─────────────────────────────────────
  const [isMultiplePayers, setIsMultiplePayers] = useState(false);
  const [multiPayers, setMultiPayers] = useState<MultiPayer[]>([]);

  // ── Moneda y tasa de conversión ───────────────────────────────
  const [selectedCurrency, setSelectedCurrency] = useState<string>('ARS');
  const [conversionRate, setConversionRate] = useState<string>('1');
  const [originalAmountInput, setOriginalAmountInput] = useState<string>('');

  // Estados para inputs de división personalizada (% y monto fijo)
  const [splitPercentageInputs, setSplitPercentageInputs] = useState<Record<string, string>>({});
  const [splitAmountInputs, setSplitAmountInputs] = useState<Record<string, string>>({});

  // ── Secciones colapsables ──────────────────────────────────
  const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);

  // ── Tour guiado ───────────────────────────────────────────
  const [ceTourVisible, setCeTourVisible] = useState(false);
  const [ceTourStep, setCeTourStep] = useState(0);
  const ceScrollRef   = useRef<ScrollView>(null);
  const ceInfoRef     = useRef<View>(null);
  const cePayerRef    = useRef<View>(null);
  const ceSplitRef    = useRef<View>(null);
  const ceReceiptRef  = useRef<View>(null);
  const ceCategoryRef = useRef<View>(null);

  const scrollToCard = (ref: React.RefObject<View | null>) => {
    if (ref.current && ceScrollRef.current) {
      ref.current.measureLayout(
        ceScrollRef.current as any,
        (_x: number, y: number) => {
          ceScrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
        },
        () => {}
      );
    }
  };

  // ── Calculadora ───────────────────────────────────────────────
  const [showCalculator, setShowCalculator] = useState(false);
  // calcCurrentInput: número que se está escribiendo (mostrado abajo, grande)
  const [calcCurrentInput, setCalcCurrentInput] = useState('');
  // calcExpression: expresión acumulada (mostrada arriba, pequeño)
  const [calcExpression, setCalcExpression] = useState('');
  const [calcJustEquals, setCalcJustEquals] = useState(false);
  const [calcHasError, setCalcHasError] = useState(false);

  const OPERATORS = ['+', '-', '×', '÷'];

  const evalExpr = (expr: string): number | null => {
    if (!expr) return null;
    try {
      const safe = expr.replace(/×/g, '*').replace(/÷/g, '/');
      if (!/^[\d+\-*/().\s]+$/.test(safe)) return null;
      // eslint-disable-next-line no-new-func
      const result = Function('"use strict"; return (' + safe + ')')() as number;
      if (!isFinite(result) || isNaN(result)) return null;
      return parseFloat(result.toFixed(10));
    } catch {
      return null;
    }
  };

  const formatCalcNumber = (n: number): string => {
    const str = parseFloat(n.toFixed(8)).toString();
    return str;
  };

  const calcInput = (key: string) => {
    if (calcHasError && key !== 'C') return;

    // ── C: reset total ──
    if (key === 'C') {
      setCalcCurrentInput('');
      setCalcExpression('');
      setCalcJustEquals(false);
      setCalcHasError(false);
      return;
    }

    // ── ⌫: borrar último dígito del input actual ──
    if (key === '⌫') {
      if (calcJustEquals) return; // no borrar resultado
      setCalcCurrentInput(prev => prev.slice(0, -1));
      return;
    }

    // ── Dígito o punto ──
    if (/^[\d.]$/.test(key)) {
      if (calcJustEquals) {
        // Después de = se empieza número nuevo
        setCalcExpression('');
        setCalcCurrentInput(key);
        setCalcJustEquals(false);
      } else {
        if (key === '.' && calcCurrentInput.includes('.')) return;
        setCalcCurrentInput(prev => prev + key);
      }
      return;
    }

    // ── Operador (+, -, ×, ÷) ──
    if (OPERATORS.includes(key)) {
      if (calcJustEquals) {
        // Usar el resultado actual como primer operando
        setCalcExpression(calcCurrentInput + ' ' + key + ' ');
        setCalcCurrentInput('');
        setCalcJustEquals(false);
      } else if (calcCurrentInput === '') {
        // Reemplazar el último operador si no hay input nuevo
        setCalcExpression(prev => {
          const trimmed = prev.trimEnd();
          const withoutLastOp = trimmed.slice(0, -1).trimEnd();
          return withoutLastOp + ' ' + key + ' ';
        });
      } else {
        // Agregar input a la expresión y continuar
        setCalcExpression(prev => prev + calcCurrentInput + ' ' + key + ' ');
        setCalcCurrentInput('');
      }
      return;
    }

    // ── = ──
    if (key === '=') {
      const fullExpr = calcExpression + calcCurrentInput;
      const result = evalExpr(fullExpr);
      if (result === null) {
        setCalcCurrentInput('Error');
        setCalcExpression(fullExpr + ' =');
        setCalcHasError(true);
        return;
      }
      setCalcExpression(fullExpr + ' =');
      setCalcCurrentInput(formatCalcNumber(result));
      setCalcJustEquals(true);
      return;
    }
  };

  const handleCalcUse = () => {
    if (calcHasError || !calcCurrentInput || calcCurrentInput === 'Error') return;

    const applyValue = (value: string) => {
      const isDiff = selectedCurrency !== (event?.currency || 'ARS');
      if (isDiff) {
        // Moneda diferente: pegar en el input de monto extranjero y recalcular
        setOriginalAmountInput(value);
        const oa = parseFloat(value);
        const rate = parseFloat(conversionRate);
        if (!isNaN(oa) && !isNaN(rate) && rate > 0) {
          handleInputChange('amount', (oa * rate).toFixed(2));
        } else {
          handleInputChange('amount', '');
        }
      } else {
        // Misma moneda: pegar directamente en el monto
        handleInputChange('amount', value);
      }
    };

    const resetCalc = () => {
      setShowCalculator(false);
      setCalcCurrentInput('');
      setCalcExpression('');
      setCalcJustEquals(false);
      setCalcHasError(false);
    };

    // Si hay expresión pendiente (no se presionó =) → confirmar y evaluar
    if (!calcJustEquals && calcExpression !== '') {
      const fullExpr = calcExpression + calcCurrentInput;
      const result = evalExpr(fullExpr);
      if (result === null) {
        showThemedAlert('Error', 'La expresión no es válida');
        return;
      }
      const resultStr = formatCalcNumber(result);
      showThemedAlert(
        'Confirmar operación',
        `Se evaluará:\n${fullExpr} = ${resultStr}\n\n¿Usar este valor como monto?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Usar', onPress: () => { applyValue(resultStr); resetCalc(); } }
        ]
      );
      return;
    }

    applyValue(calcCurrentInput);
    resetCalc();
  };

  const handleCalcClose = () => {
    setShowCalculator(false);
    setCalcCurrentInput('');
    setCalcExpression('');
    setCalcJustEquals(false);
    setCalcHasError(false);
  };
  // ─────────────────────────────────────────────────────────────

  // Cargar datos del evento y participantes cada vez que la pantalla se enfoca
  useFocusEffect(
    React.useCallback(() => {
      const loadEventData = async () => {
        try {
          const foundEvent = events.find(e => e.id === eventId);
          if (foundEvent) {
            setEvent(foundEvent);
            // Inicializar moneda del gasto con la del evento (por defecto)
            if (!isEditing) setSelectedCurrency(foundEvent.currency || 'ARS');
            
            // Bloquear entrada si el evento está cerrado o completado
            if (!isEditing && (foundEvent.status === 'closed' || foundEvent.status === 'completed')) {
              showAlert({ type: 'warning', title: 'Evento Cerrado', message: 'No se pueden agregar gastos en un evento cerrado o completado', buttons: [{ text: 'OK', onPress: () => navigation.goBack() }] });
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

        // Inicializar multiPayers solo con participantes primarios (sin secundarios)
        setMultiPayers(participants.filter(p => !p.parentParticipantId).map(p => ({
          participantId: p.id,
          amount: '',
          isSelected: false
        })));

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
        showThemedAlert(t.alerts.errors.general, t.alerts.errors.loadEvent);
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

            // Cargar datos de múltiples pagadores si existen
            if (expense.payers && expense.payers.length > 1) {
              setIsMultiplePayers(true);
              setMultiPayers(eventParticipants.filter(p => !p.parentParticipantId).map(p => {
                const payer = expense.payers!.find(mp => mp.participantId === p.id);
                return {
                  participantId: p.id,
                  amount: payer ? payer.amount.toString() : '',
                  isSelected: !!payer
                };
              }));
            }

            const isEqualSplit = expenseSplits.length === eventParticipants.length;

            // Detectar tipo de división desde los splits cargados
            const loadedSplitType = ((expenseSplits[0]?.type as 'equal' | 'percentage' | 'fixed') || 'equal');

            setFormData({
              description: expense.description,
              amount: expense.amount.toString(),
              date: new Date(expense.date),
              category: expense.category as any,
              payerId: expense.payerId,
              splitType: loadedSplitType,
              splits: loadedSplits,
              isMultiplePayers: false,
              multiPayers: []
            });

            // Inicializar moneda y tasa de conversión del gasto
            setSelectedCurrency(expense.currency || event?.currency || 'ARS');
            setConversionRate(expense.conversionRate ? expense.conversionRate.toString() : '1');
            setOriginalAmountInput(expense.originalAmount ? expense.originalAmount.toString() : '');

            // Inicializar inputs según el tipo cargado
            if (loadedSplitType === 'percentage') {
              const pctInputs: Record<string, string> = {};
              expenseSplits.forEach(s => { pctInputs[s.participantId] = (s.percentage || 0).toFixed(2); });
              setSplitPercentageInputs(pctInputs);
            } else if (loadedSplitType === 'fixed') {
              const amtInputs: Record<string, string> = {};
              expenseSplits.forEach(s => { amtInputs[s.participantId] = s.amount.toFixed(2); });
              setSplitAmountInputs(amtInputs);
            }

            // Cargar imagen del comprobante si existe
            if (expense.receiptImage) {
              console.log('📸 Loading receipt image:', expense.receiptImage);
              setReceiptImage(expense.receiptImage);
            }

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
          showThemedAlert(t.alerts.errors.general, t.alerts.errors.loadExpense);
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
        showThemedAlert(
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
      console.log('📱 Requesting media library permissions...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('📱 Media library permission status:', status);
      
      if (status !== 'granted') {
        showThemedAlert(t.alerts.permissions.title, t.alerts.permissions.photos);
        return;
      }

      console.log('📱 Launching image library...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        allowsMultipleSelection: false,
      });

      console.log('📱 Image picker result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('📸 Image selected:', result.assets[0].uri);
        setReceiptImage(result.assets[0].uri);
      } else {
        console.log('📱 Image selection canceled or no assets');
      }
    } catch (error) {
      console.error('❌ Error picking image:', error);
      showAlert({ type: 'error', title: 'Error al seleccionar imagen', message: `No se pudo acceder a la galería. Error: ${error instanceof Error ? error.message : 'Desconocido'}` });
    }
  };

  const takePhoto = async () => {
    try {
      console.log('📱 Requesting camera permissions...');
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('📱 Camera permission status:', status);
      
      if (status !== 'granted') {
        showThemedAlert(t.alerts.permissions.title, t.alerts.permissions.camera);
        return;
      }

      console.log('📱 Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        mediaTypes: ['images'],
      });

      console.log('📱 Camera result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        console.log('📸 Photo taken:', result.assets[0].uri);
        setReceiptImage(result.assets[0].uri);
      } else {
        console.log('📱 Photo taking canceled or no assets');
      }
    } catch (error) {
      console.error('❌ Error taking photo:', error);
      showAlert({ type: 'error', title: 'Error al tomar foto', message: `No se pudo acceder a la cámara. Error: ${error instanceof Error ? error.message : 'Desconocido'}` });
    }
  };

  const selectImageSource = () => {
    showAlert({
      type: 'info',
      title: 'Adjuntar Comprobante',
      message: 'Elige una opción',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Tomar Foto', onPress: takePhoto },
        { text: 'Elegir de Galería', onPress: pickImage },
      ]
    });
  };

  const removeImage = () => {
    showAlert({
      type: 'destructive',
      title: 'Eliminar Imagen',
      message: '¿Deseas eliminar la imagen del comprobante?',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => setReceiptImage(null) },
      ]
    });
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

    if (!formData.payerId && !isMultiplePayers) {
      newErrors.payerId = 'Debe seleccionar quién pagó';
    }

    if (isMultiplePayers) {
      const selectedPayers = multiPayers.filter(mp => mp.isSelected);
      if (selectedPayers.length < 2) {
        newErrors.payerId = t.multiplePayersCard.minPayersWarning;
      } else if (!isMultiPayerSumValid()) {
        const sum = getMultiPayersSum().toFixed(2);
        const remaining = Math.abs(getAmount() - getMultiPayersSum()).toFixed(2);
        newErrors.payerId = t.multiplePayersCard.sumMismatch
          .replace('{sum}', sum)
          .replace('{remaining}', remaining);
      }
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

    // Validaciones específicas por tipo de división
    if (formData.splits.length > 0) {
      if (formData.splitType === 'percentage') {
        const totalPct = formData.splits.reduce((sum, s) => sum + (s.percentage || 0), 0);
        if (Math.abs(totalPct - 100) > 0.1) {
          newErrors.splits = `Los porcentajes deben sumar 100%. Suma actual: ${totalPct.toFixed(2)}%`;
        }
      } else if (formData.splitType === 'fixed') {
        const totalFixed = formData.splits.reduce((sum, s) => sum + (s.amount || 0), 0);
        const expenseTotal = getAmount();
        if (Math.abs(totalFixed - expenseTotal) > 0.02) {
          newErrors.splits = `La suma de montos (${totalFixed.toFixed(2)}) debe ser igual al total del gasto (${expenseTotal.toFixed(2)})`;
        }
      }
    }

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

    // Recalcular splits cuando cambia el monto (respetando el modo activo)
    if (field === 'amount') {
      if (formData.splits.length > 0) {
        const numericValue = getNumericValue(processedValue);
        recalculateSplits(numericValue);
      }
    }
  };

  const recalculateSplits = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const currentSplits = formData.splits;
    if (currentSplits.length === 0) return;

    if (formData.splitType === 'equal') {
      // Calcular división igual considerando peopleCount
      const totalPeopleUnits = currentSplits.reduce((sum, split) => {
        const peopleCount = split.peopleCount !== undefined ? split.peopleCount : split.defaultPeopleCount || 1;
        return sum + peopleCount;
      }, 0);
      const amountPerUnit = numAmount / totalPeopleUnits;
      const newSplits = currentSplits.map(split => {
        const peopleCount = split.peopleCount !== undefined ? split.peopleCount : split.defaultPeopleCount || 1;
        return {
          ...split,
          amount: amountPerUnit * peopleCount,
          percentage: (peopleCount / totalPeopleUnits) * 100
        };
      });
      setFormData(prev => ({ ...prev, splits: newSplits }));
    } else if (formData.splitType === 'percentage') {
      // Mantener porcentajes, recalcular amounts
      const newSplits = currentSplits.map(split => ({
        ...split,
        amount: parseFloat(((split.percentage || 0) * numAmount / 100).toFixed(2))
      }));
      setFormData(prev => ({ ...prev, splits: newSplits }));
    } else if (formData.splitType === 'fixed') {
      // Mantener amounts, recalcular porcentajes
      const newSplits = currentSplits.map(split => ({
        ...split,
        percentage: numAmount > 0 ? parseFloat(((split.amount / numAmount) * 100).toFixed(4)) : 0
      }));
      setFormData(prev => ({ ...prev, splits: newSplits }));
    }
  };

  const handleParticipantToggle = (participantId: string) => {
    const isIncluded = formData.splits.some(split => split.participantId === participantId);
    const splitType = formData.splitType;
    const totalAmount = getAmount();

    if (splitType === 'equal') {
      if (isIncluded) {
        const newSplits = formData.splits.filter(s => s.participantId !== participantId);
        setFormData(prev => ({ ...prev, splits: recalculateSplitsForParticipants(newSplits, totalAmount) }));
      } else {
        const defaultPeopleCount = participantsPeopleCount.get(participantId) || 1;
        const allSplits = [...formData.splits, { participantId, amount: 0, percentage: 0, defaultPeopleCount }];
        setFormData(prev => ({ ...prev, splits: recalculateSplitsForParticipants(allSplits, totalAmount) }));
      }
    } else if (splitType === 'percentage') {
      let newSplits: ExpenseSplit[] = isIncluded
        ? formData.splits.filter(s => s.participantId !== participantId)
        : [...formData.splits, { participantId, amount: 0, percentage: 0, defaultPeopleCount: participantsPeopleCount.get(participantId) || 1 }];
      // Rebalancear porcentajes uniformemente
      const count = newSplits.length;
      const equalPct = count > 0 ? parseFloat((100 / count).toFixed(4)) : 0;
      newSplits = newSplits.map(s => ({
        ...s,
        percentage: equalPct,
        amount: parseFloat((totalAmount * equalPct / 100).toFixed(2))
      }));
      const newPctInputs: Record<string, string> = {};
      newSplits.forEach(s => { newPctInputs[s.participantId] = s.percentage?.toFixed(2) || '0.00'; });
      setSplitPercentageInputs(newPctInputs);
      setFormData(prev => ({ ...prev, splits: newSplits }));
    } else if (splitType === 'fixed') {
      let newSplits: ExpenseSplit[];
      if (isIncluded) {
        newSplits = formData.splits.filter(s => s.participantId !== participantId);
        setSplitAmountInputs(prev => { const n = { ...prev }; delete n[participantId]; return n; });
      } else {
        newSplits = [...formData.splits, { participantId, amount: 0, percentage: 0, defaultPeopleCount: participantsPeopleCount.get(participantId) || 1 }];
        setSplitAmountInputs(prev => ({ ...prev, [participantId]: '0.00' }));
      }
      // Recalcular porcentajes (amounts los maneja el usuario)
      newSplits = newSplits.map(s => ({
        ...s,
        percentage: totalAmount > 0 ? parseFloat(((s.amount / totalAmount) * 100).toFixed(4)) : 0
      }));
      setFormData(prev => ({ ...prev, splits: newSplits }));
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

  // Funciones de manejo de splits por tipo

  const handleSplitTypeChange = (newType: 'equal' | 'percentage' | 'fixed') => {
    const totalAmount = getAmount();
    const currentSplits = formData.splits;

    if (newType === 'equal') {
      const newSplits = recalculateSplitsForParticipants(currentSplits, totalAmount);
      setSplitPercentageInputs({});
      setSplitAmountInputs({});
      setFormData(prev => ({ ...prev, splitType: 'equal', splits: newSplits }));
    } else if (newType === 'percentage') {
      const count = currentSplits.length;
      const equalPct = count > 0 ? parseFloat((100 / count).toFixed(4)) : 0;
      const newSplits = currentSplits.map(s => ({
        ...s,
        percentage: equalPct,
        amount: parseFloat((totalAmount * equalPct / 100).toFixed(2))
      }));
      const newPctInputs: Record<string, string> = {};
      newSplits.forEach(s => { newPctInputs[s.participantId] = s.percentage?.toFixed(2) || '0.00'; });
      setSplitPercentageInputs(newPctInputs);
      setSplitAmountInputs({});
      setFormData(prev => ({ ...prev, splitType: 'percentage', splits: newSplits }));
    } else if (newType === 'fixed') {
      const count = currentSplits.length;
      const equalAmount = count > 0 ? parseFloat((totalAmount / count).toFixed(2)) : 0;
      const newSplits = currentSplits.map(s => ({
        ...s,
        amount: equalAmount,
        percentage: totalAmount > 0 ? parseFloat(((equalAmount / totalAmount) * 100).toFixed(4)) : 0
      }));
      const newAmtInputs: Record<string, string> = {};
      newSplits.forEach(s => { newAmtInputs[s.participantId] = s.amount.toFixed(2); });
      setSplitAmountInputs(newAmtInputs);
      setSplitPercentageInputs({});
      setFormData(prev => ({ ...prev, splitType: 'fixed', splits: newSplits }));
    }
  };

  const handleSplitPercentageInput = (participantId: string, value: string) => {
    setSplitPercentageInputs(prev => ({ ...prev, [participantId]: value }));
    const pct = parseFloat(value);
    if (isNaN(pct)) return;
    const totalAmount = getAmount();
    const amount = parseFloat((totalAmount * pct / 100).toFixed(2));
    setFormData(prev => ({
      ...prev,
      splits: prev.splits.map(s =>
        s.participantId === participantId ? { ...s, percentage: pct, amount } : s
      )
    }));
  };

  const handleSplitAmountInput = (participantId: string, value: string) => {
    setSplitAmountInputs(prev => ({ ...prev, [participantId]: value }));
    const amt = parseFloat(value);
    if (isNaN(amt)) return;
    const totalAmount = getAmount();
    const pct = totalAmount > 0 ? parseFloat(((amt / totalAmount) * 100).toFixed(4)) : 0;
    setFormData(prev => ({
      ...prev,
      splits: prev.splits.map(s =>
        s.participantId === participantId ? { ...s, amount: amt, percentage: pct } : s
      )
    }));
  };

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

  // ===== MULTI-PAYER HELPERS =====

  const redistributeAmongSelectedPayers = (payers: MultiPayer[]) => {
    const selected = payers.filter(mp => mp.isSelected);
    const totalAmount = getAmount();

    if (selected.length === 0 || totalAmount <= 0) {
      setMultiPayers(payers.map(mp => ({ ...mp, amount: mp.isSelected ? '' : '' })));
      return;
    }

    const amountPerPayer = totalAmount / selected.length;
    setMultiPayers(payers.map(mp => ({
      ...mp,
      amount: mp.isSelected ? amountPerPayer.toFixed(2) : ''
    })));
  };

  const handleMultiPayerToggle = (participantId: string) => {
    const updated = multiPayers.map(mp =>
      mp.participantId === participantId ? { ...mp, isSelected: !mp.isSelected } : mp
    );
    redistributeAmongSelectedPayers(updated);
  };

  const handleMultiPayerAmountChange = (participantId: string, value: string) => {
    setMultiPayers(prev => prev.map(mp =>
      mp.participantId === participantId ? { ...mp, amount: value } : mp
    ));
  };

  const getMultiPayersSum = (): number =>
    multiPayers.filter(mp => mp.isSelected).reduce((sum, mp) => sum + (parseFloat(mp.amount) || 0), 0);

  const isMultiPayerSumValid = (): boolean => {
    const selectedCount = multiPayers.filter(mp => mp.isSelected).length;
    if (!isMultiplePayers || selectedCount === 0) return true;
    return Math.abs(getMultiPayersSum() - getAmount()) < 0.02;
  };

  const handleToggleMultiplePayers = (value: boolean) => {
    setIsMultiplePayers(value);
    if (!value) {
      // Reset multi-payer state
      setMultiPayers(prev => prev.map(mp => ({ ...mp, isSelected: false, amount: '' })));
    }
  };

  const handleCreateExpense = async () => {
    setSubmittedOnce(true);
    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing && editingExpenseId) {
        // Actualizar gasto existente
        const numericAmount = getNumericValue(formData.amount);
        const isDifferentCurrency = selectedCurrency !== (event?.currency || 'ARS');

        // Build payers for multi-payer mode
        const selectedMultiPayers = multiPayers.filter(mp => mp.isSelected);
        const payersForUpdate = isMultiplePayers && selectedMultiPayers.length > 1
          ? selectedMultiPayers.map(mp => ({
              participantId: mp.participantId,
              participantName: eventParticipants.find(p => p.id === mp.participantId)?.name,
              amount: parseFloat(mp.amount) || 0
            }))
          : [];

        const primaryPayerId = isMultiplePayers && selectedMultiPayers.length > 0
          ? selectedMultiPayers[0].participantId
          : formData.payerId;

        const expenseUpdates: Partial<Expense> = {
          description: formData.description.trim(),
          amount: parseFloat(numericAmount),
          currency: selectedCurrency,
          originalAmount: isDifferentCurrency ? (parseFloat(originalAmountInput) || undefined) : undefined,
          conversionRate: isDifferentCurrency ? (parseFloat(conversionRate) || 1) : 1,
          date: formData.date.toISOString(),
          category: formData.category,
          payerId: primaryPayerId,
          payers: payersForUpdate,
          receiptImage: receiptImage || undefined,
          updatedAt: new Date().toISOString()
        };

        const uniqueSplits = formData.splits.filter(
          (split, index, arr) => arr.findIndex(s => s.participantId === split.participantId) === index
        );
        const splits: Split[] = uniqueSplits.map(split => ({
          id: deterministicId(`${editingExpenseId}_${split.participantId}`),
          expenseId: editingExpenseId,
          participantId: split.participantId,
          amount: split.amount,
          percentage: split.percentage,
          type: formData.splitType as 'equal' | 'percentage' | 'fixed',
          isPaid: split.participantId === formData.payerId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

        console.log('🔄 Updating expense with receipt image:', receiptImage ? 'Present' : 'None');
        console.log('📝 Expense updates:', JSON.stringify(expenseUpdates, null, 2));
        
        await updateExpense(editingExpenseId, expenseUpdates, splits);
        console.log('✅ Expense updated successfully with receipt image');
        
        showAlert({
          type: 'success',
          title: 'Gasto actualizado',
          message: 'El gasto se ha actualizado exitosamente',
          buttons: [{ text: 'OK', onPress: () => navigation.goBack() }]
        });
      } else {
        // Crear nuevo gasto
        console.log('💾 Creating new expense...');
        console.log('Participants count:', eventParticipants.length);
        console.log('Splits count:', formData.splits.length);
        console.log('Receipt image:', receiptImage ? 'Present' : 'None');
        console.log('Receipt image URI:', receiptImage);
        
        const numericAmount = getNumericValue(formData.amount);
        const isDifferentCurrency = selectedCurrency !== (event?.currency || 'ARS');
        const rate = parseFloat(conversionRate) || 1;

        // Build payers for multi-payer mode
        const selectedMultiPayers = multiPayers.filter(mp => mp.isSelected);
        const payersForCreate = isMultiplePayers && selectedMultiPayers.length > 1
          ? selectedMultiPayers.map(mp => ({
              participantId: mp.participantId,
              participantName: eventParticipants.find(p => p.id === mp.participantId)?.name,
              amount: parseFloat(mp.amount) || 0
            }))
          : undefined;

        const primaryPayerId = isMultiplePayers && selectedMultiPayers.length > 0
          ? selectedMultiPayers[0].participantId
          : formData.payerId;

        const expense: Expense = {
          id: generateId(),
          eventId,
          description: formData.description.trim(),
          amount: parseFloat(numericAmount),
          currency: selectedCurrency,
          originalAmount: isDifferentCurrency ? (parseFloat(originalAmountInput) || undefined) : undefined,
          conversionRate: isDifferentCurrency ? rate : 1,
          date: formData.date.toISOString(),
          category: formData.category,
          payerId: primaryPayerId,
          payers: payersForCreate,
          receiptImage: receiptImage || undefined,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const uniqueSplits = formData.splits.filter(
          (split, index, arr) => arr.findIndex(s => s.participantId === split.participantId) === index
        );
        const splits: Split[] = uniqueSplits.map(split => ({
          id: deterministicId(`${expense.id}_${split.participantId}`),
          expenseId: expense.id,
          participantId: split.participantId,
          amount: split.amount,
          percentage: split.percentage,
          type: formData.splitType as 'equal' | 'percentage' | 'fixed',
          isPaid: split.participantId === formData.payerId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

        console.log('📝 Expense object:', JSON.stringify(expense, null, 2));
        console.log('📊 Splits:', splits.length, 'splits created');
        
        await addExpense(expense, splits);
        console.log('✅ Expense saved successfully');
        
        showAlert({
          type: 'success',
          title: 'Gasto creado',
          message: 'El gasto se ha registrado exitosamente',
          buttons: [{ text: 'OK', onPress: () => navigation.goBack() }]
        });
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      console.error('Error details:', JSON.stringify(error));
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      showThemedAlert(t.alerts.errors.general, `${t.alerts.errors.saveExpense}: ${errorMessage}`);
    }
  };

  const handleBack = () => {
    const hasChanges = formData.description.trim().length > 0 || 
                      formData.amount.trim().length > 0;

    if (hasChanges) {
      showThemedAlert(
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
    const baseValid = formData.description.trim().length > 0 && 
           formData.amount.trim().length > 0 && 
           !isNaN(parseFloat(numericAmount)) && 
           parseFloat(numericAmount) > 0;

    if (isMultiplePayers) {
      const selectedPayers = multiPayers.filter(mp => mp.isSelected);
      return baseValid && selectedPayers.length >= 2 && isMultiPayerSumValid();
    }
    return baseValid && formData.payerId.length > 0;
  };

  // Participantes ordenados alfabéticamente para el pagador con filtro
  // Los participantes secundarios (parentParticipantId definido) no pueden ser pagadores
  const sortedParticipantsForPayer = useMemo(() => {
    return eventParticipants
      .filter(p => !p.parentParticipantId && p.name.toLowerCase().includes(payerSearchQuery.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [eventParticipants, payerSearchQuery]);

  // Participantes ordenados para la división: primarios alfabéticamente, secundarios debajo de su primario
  const sortedParticipantsForSplit = useMemo(() => {
    const primaries = eventParticipants
      .filter(p => !p.parentParticipantId)
      .sort((a, b) => a.name.localeCompare(b.name));
    const result: typeof eventParticipants = [];
    primaries.forEach(primary => {
      result.push(primary);
      const secondaries = eventParticipants
        .filter(p => p.parentParticipantId === primary.id)
        .sort((a, b) => a.name.localeCompare(b.name));
      result.push(...secondaries);
    });
    return result;
  }, [eventParticipants]);

  return (
    <View style={styles.container}>
      {/* Header with dynamic colors and integrated controls */}
      <HeaderBar
        title={isEditing ? t.headerTitle.edit : t.headerTitle.create}
        titleAlignment="left"
        useDynamicColors={true}
        showThemeToggle={true}
        showLanguageSelector={true}
        showHelp={true}
        showLogout={true}
        showBackButton={Platform.OS === 'web'}
        onLeftPress={Platform.OS === 'web' ? () => navigation.goBack() : undefined}
        elevation={true}
        onHelpPress={() => { ceScrollRef.current?.scrollTo({ y: 0, animated: false }); setCeTourStep(0); setCeTourVisible(true); }}
      />
      
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.safeContent} edges={['bottom', 'left', 'right']}>

      <ScrollView 
        ref={ceScrollRef}
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Información del Gasto */}
        <View ref={ceInfoRef} collapsable={false}>
        <Card style={[styles.card, styles.cardInfo]}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="information-outline" size={20} color="#FF9800" />
            <Text style={styles.cardHeaderTitle}>{t.expenseInfoCard.title}</Text>
          </View>
          
          <Input
            label={t.expenseInfoCard.descriptionLabel}
            placeholder={t.expenseInfoCard.descriptionPlaceholder}
            value={formData.description}
            onChangeText={(text) => handleInputChange('description', text)}
            icon="file-document-outline"
            maxLength={100}
            required={true}
            error={errors.description}
            containerStyle={styles.input}
          />

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
                <Text style={styles.inputLabel}>{t.expenseInfoCard.dateLabel}<Text style={{ color: '#FF5252', fontWeight: '700' }}> *</Text></Text>
                <Text style={styles.inputValue}>
                  {formatDate(formData.date)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* ── Monto Total + chip de moneda + calculadora en la misma fila ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 12, paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.onSurface }}>
              {t.expenseInfoCard.amountLabel}
              <Text style={{ color: '#FF5252', fontWeight: '700' }}> *</Text>
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <CurrencySelector
                selectedCurrency={selectedCurrency}
                onCurrencyChange={(code) => {
                  setSelectedCurrency(code);
                  setOriginalAmountInput('');
                  setConversionRate('1');
                  handleInputChange('amount', '');
                }}
                renderTrigger={(onPress) => (
                  <TouchableOpacity style={styles.currencyChip} onPress={onPress} activeOpacity={0.7}>
                    <Text style={styles.currencyChipText}>{selectedCurrency}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={14} color={theme.colors.onPrimaryContainer} />
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity
                style={{ padding: 6, borderRadius: 8, backgroundColor: theme.colors.primaryContainer }}
                onPress={() => setShowCalculator(true)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="calculator" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {selectedCurrency !== (event?.currency || 'ARS') ? (
            /* ── Moneda diferente: par de inputs lado a lado + campo calculado ── */
            <>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Input
                  label={selectedCurrency}
                  placeholder={t.expenseInfoCard.amountPlaceholder}
                  value={originalAmountInput}
                  onChangeText={(text) => {
                    const clean = text.replace(',', '.');
                    setOriginalAmountInput(clean);
                    const oa = parseFloat(clean);
                    const rate = parseFloat(conversionRate);
                    if (!isNaN(oa) && !isNaN(rate) && rate > 0) {
                      handleInputChange('amount', (oa * rate).toFixed(2));
                    } else {
                      handleInputChange('amount', '');
                    }
                  }}
                  keyboardType="numeric"
                  icon="currency-usd"
                  required={true}
                  error={errors.amount}
                  containerStyle={{ flex: 1, marginBottom: 0 }}
                />

                <Input
                  label={t.expenseInfoCard.conversionRateShortLabel}
                  placeholder={t.expenseInfoCard.conversionRatePlaceholder}
                  value={conversionRate}
                  onChangeText={(text) => {
                    const clean = text.replace(',', '.');
                    setConversionRate(clean);
                    const oa = parseFloat(originalAmountInput);
                    const rate = parseFloat(clean);
                    if (!isNaN(oa) && !isNaN(rate) && rate > 0) {
                      handleInputChange('amount', (oa * rate).toFixed(2));
                    } else {
                      handleInputChange('amount', '');
                    }
                  }}
                  keyboardType="numeric"
                  icon="swap-horizontal"
                  containerStyle={{ flex: 1, marginBottom: 0 }}
                />
              </View>

              <View style={[styles.amountInputContainer, { marginTop: 12 }]}>
                <Input
                  label={t.expenseInfoCard.amountCalculatedLabel.replace('{eventCurrency}', event?.currency || 'ARS')}
                  value={formData.amount}
                  onChangeText={() => {}}
                  keyboardType="numeric"
                  icon="lock-outline"
                  disabled={true}
                  containerStyle={styles.input}
                />
                <Text style={styles.currencySuffix}>{event?.currency || 'ARS'}</Text>
              </View>
            </>
          ) : (
            /* ── Misma moneda: campo normal ── */
            <View style={styles.amountInputContainer}>
              <Input
                placeholder={t.expenseInfoCard.amountPlaceholder}
                value={formData.amount}
                onChangeText={(text) => handleInputChange('amount', text)}
                keyboardType="numeric"
                icon="currency-usd"
                required={true}
                error={errors.amount}
                containerStyle={styles.input}
              />
              <Text style={styles.currencySuffixNoLabel}>{selectedCurrency}</Text>
            </View>
          )}
        </Card>
        </View>

        {/* Pagador */}
        <View ref={cePayerRef} collapsable={false}>
        <Card style={[styles.card, styles.cardPayer]}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="account-cash-outline" size={20} color="#FF9800" />
            <Text style={styles.cardHeaderTitle}>{t.payerCard.title}</Text>
          </View>

          {/* Toggle múltiples pagadores */}
          <View style={styles.multiPayerToggleRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.multiPayerToggleLabel}>
                {t.multiplePayersCard.toggleLabel}
              </Text>
              <Text style={styles.multiPayerToggleSubtitle}>
                {t.multiplePayersCard.toggleSubtitle}
              </Text>
            </View>
            <Switch
              value={isMultiplePayers}
              onValueChange={handleToggleMultiplePayers}
              trackColor={{ false: theme.colors.surfaceVariant, true: theme.colors.primary + '66' }}
              thumbColor={isMultiplePayers ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
          </View>

          {!isMultiplePayers ? (
            <>
              <SearchBar
                value={payerSearchQuery}
                onChangeText={setPayerSearchQuery}
                placeholder={t.payerCard.searchPlaceholder}
              />
              
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
            </>
          ) : (
            <>
              {/* Indicador de suma */}
              {multiPayers.some(mp => mp.isSelected) && (() => {
                const isOk = isMultiPayerSumValid();
                const remaining = Math.abs(getAmount() - getMultiPayersSum());
                return (
                  <View style={[styles.multiPayerSumBanner, { backgroundColor: isOk ? theme.colors.primary + '18' : theme.colors.error + '18', flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                    <MaterialCommunityIcons
                      name={isOk ? 'check-circle-outline' : 'alert-outline'}
                      size={16}
                      color={isOk ? theme.colors.primary : theme.colors.error}
                    />
                    <Text style={[styles.multiPayerSumText, { color: isOk ? theme.colors.primary : theme.colors.error, flex: 1 }]}>
                      {isOk
                        ? t.multiplePayersCard.sumOk
                        : t.multiplePayersCard.sumMismatch
                            .replace('{sum}', getMultiPayersSum().toFixed(2))
                            .replace('{remaining}', remaining.toFixed(2))
                      }
                    </Text>
                  </View>
                );
              })()}

              {/* Lista de participantes con checkbox + monto */}
              {eventParticipants.map((participant) => {
                const mp = multiPayers.find(x => x.participantId === participant.id);
                if (!mp) return null;
                return (
                  <View key={participant.id} style={styles.multiPayerRow}>
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                      onPress={() => handleMultiPayerToggle(participant.id)}
                    >
                      <MaterialCommunityIcons
                        name={mp.isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                        size={22}
                        color={mp.isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant}
                      />
                      <Text style={{ marginLeft: 10, ...theme.typography.bodyMedium, color: mp.isSelected ? theme.colors.onSurface : theme.colors.onSurfaceVariant, fontWeight: mp.isSelected ? '600' : '400' }}>
                        {participant.name}
                      </Text>
                    </TouchableOpacity>
                    {mp.isSelected && (
                      <View style={styles.multiPayerAmountBox}>
                        <Text style={styles.multiPayerAmountPrefix}>$</Text>
                        <TextInput
                          value={mp.amount}
                          onChangeText={(val) => handleMultiPayerAmountChange(participant.id, val)}
                          keyboardType="numeric"
                          style={styles.multiPayerAmountInput}
                          placeholder="0.00"
                          placeholderTextColor={theme.colors.onSurfaceVariant}
                        />
                      </View>
                    )}
                  </View>
                );
              })}
            </>
          )}

          {errors.payerId && (
            <Text style={styles.errorText}>{errors.payerId}</Text>
          )}
        </Card>
        </View>

        {/* División de Participantes Unificada */}
        <View ref={ceSplitRef} collapsable={false}>
        <Card style={[styles.card, styles.cardSplit]}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="account-group-outline" size={20} color="#FF9800" />
            <Text style={styles.cardHeaderTitle}>{t.participantsCard.title}</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            {formData.splitType === 'equal'
              ? t.participantsCard.subtitle
              : formData.splitType === 'percentage'
              ? t.participantsCard.subtitlePercentage
              : t.participantsCard.subtitleFixed}
          </Text>

          {/* Selector de tipo de división (tabs) */}
          <View style={styles.splitTypeSelector}>
            <View style={styles.splitTypeChipsRow}>
              {(['equal', 'percentage', 'fixed'] as const).map((type) => {
                const isActive = formData.splitType === type;
                const label = type === 'equal'
                  ? t.participantsCard.splitTypeEqual
                  : type === 'percentage'
                  ? t.participantsCard.splitTypePercentage
                  : t.participantsCard.splitTypeFixed;
                const icon = type === 'equal' ? 'equal' : type === 'percentage' ? 'percent' : 'cash';
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.splitTypeChip, isActive && styles.splitTypeChipActive]}
                    onPress={() => handleSplitTypeChange(type)}
                  >
                    <MaterialCommunityIcons
                      name={icon}
                      size={13}
                      color={isActive ? theme.colors.primary : theme.colors.onSurfaceVariant}
                    />
                    <Text style={[styles.splitTypeChipText, isActive && styles.splitTypeChipTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Banner de validación para modo porcentaje */}
          {formData.splits.length > 0 && formData.splitType === 'percentage' && (() => {
            const totalPct = formData.splits.reduce((sum, s) => sum + (s.percentage || 0), 0);
            const isOk = Math.abs(totalPct - 100) <= 0.1;
            return (
              <View style={[styles.splitBanner, { backgroundColor: isOk ? theme.colors.primary + '18' : theme.colors.error + '18' }]}>
                <MaterialCommunityIcons
                  name={isOk ? 'check-circle-outline' : 'alert-outline'}
                  size={16}
                  color={isOk ? theme.colors.primary : theme.colors.error}
                />
                <Text style={[styles.splitBannerText, { color: isOk ? theme.colors.primary : theme.colors.error }]}>
                  {isOk
                    ? t.participantsCard.splitSumOk
                    : `${t.participantsCard.percentageSum.replace('{sum}', totalPct.toFixed(1))} — ${t.participantsCard.splitSumError}`}
                </Text>
              </View>
            );
          })()}

          {/* Banner de validación para modo monto fijo */}
          {formData.splits.length > 0 && formData.splitType === 'fixed' && (() => {
            const totalFixed = formData.splits.reduce((sum, s) => sum + (s.amount || 0), 0);
            const expenseTotal = getAmount();
            const isOk = Math.abs(totalFixed - expenseTotal) <= 0.02;
            const remaining = expenseTotal - totalFixed;
            return (
              <View style={[styles.splitBanner, { backgroundColor: isOk ? theme.colors.primary + '18' : theme.colors.error + '18' }]}>
                <MaterialCommunityIcons
                  name={isOk ? 'check-circle-outline' : 'alert-outline'}
                  size={16}
                  color={isOk ? theme.colors.primary : theme.colors.error}
                />
                <Text style={[styles.splitBannerText, { color: isOk ? theme.colors.primary : theme.colors.error }]}>
                  {isOk
                    ? t.participantsCard.splitSumOk
                    : `${t.participantsCard.fixedSum.replace('{sum}', totalFixed.toFixed(2))} — ${t.participantsCard.remainingAmount.replace('{remaining}', Math.abs(remaining).toFixed(2))}`}
                </Text>
              </View>
            );
          })()}

          {/* Lista Unificada de Participantes */}
          <View style={styles.participantsList}>
            {sortedParticipantsForSplit.map((participant) => {
              const split = formData.splits.find(s => s.participantId === participant.id);
              const isIncluded = !!split;
              const amount = split?.amount || 0;
              const percentage = split?.percentage || 0;
              const isSecondary = !!(participant as any).parentParticipantId;
              
              return (
                <View key={participant.id} style={[
                  styles.unifiedParticipantRow,
                  !isIncluded && styles.unifiedParticipantRowExcluded,
                  isSecondary && { paddingLeft: 28 }
                ]}>
                  <TouchableOpacity
                    style={styles.participantToggle}
                    onPress={() => handleParticipantToggle(participant.id)}
                  >
                    <MaterialCommunityIcons
                      name={isIncluded ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={20}
                      color={isIncluded ? (isSecondary ? theme.colors.secondary : theme.colors.primary) : theme.colors.onSurfaceVariant}
                    />
                    <Text style={[
                      styles.participantName,
                      isIncluded && styles.participantNameActive,
                      !isIncluded && styles.participantNameExcluded,
                      isSecondary && isIncluded && { color: theme.colors.secondary, fontSize: 13 },
                      isSecondary && !isIncluded && { fontSize: 13 },
                    ]}>
                      {participant.name}
                    </Text>
                  </TouchableOpacity>

                  {/* Modo partes iguales: mostrar monto calculado */}
                  {isIncluded && formData.splitType === 'equal' && (
                    <View style={styles.participantAmount}>
                      <Text style={[styles.amountText, isSecondary && { color: theme.colors.secondary }]}>
                        ${amount.toFixed(2)}
                      </Text>
                    </View>
                  )}

                  {/* Modo porcentaje: input de % + monto calculado */}
                  {isIncluded && formData.splitType === 'percentage' && (
                    <View style={styles.splitInputRow}>
                      <View style={styles.splitInputBox}>
                        <TextInput
                          value={splitPercentageInputs[participant.id] ?? percentage.toFixed(2)}
                          onChangeText={(val) => handleSplitPercentageInput(participant.id, val)}
                          keyboardType="numeric"
                          style={styles.splitInputText}
                          placeholder="0.00"
                          placeholderTextColor={theme.colors.onSurfaceVariant}
                        />
                        <Text style={styles.splitInputSuffix}>%</Text>
                      </View>
                      <Text style={styles.splitCalcAmount}>= ${amount.toFixed(2)}</Text>
                    </View>
                  )}

                  {/* Modo monto fijo: input de monto directo */}
                  {isIncluded && formData.splitType === 'fixed' && (
                    <View style={styles.splitInputRow}>
                      <Text style={styles.splitInputPrefix}>$</Text>
                      <View style={styles.splitInputBox}>
                        <TextInput
                          value={splitAmountInputs[participant.id] ?? amount.toFixed(2)}
                          onChangeText={(val) => handleSplitAmountInput(participant.id, val)}
                          keyboardType="numeric"
                          style={styles.splitInputText}
                          placeholder="0.00"
                          placeholderTextColor={theme.colors.onSurfaceVariant}
                        />
                      </View>
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

          {errors.splits && (
            <Text style={styles.errorText}>{errors.splits}</Text>
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
        </View>

        {/* Comprobante / Imagen */}
        <View ref={ceReceiptRef} collapsable={false}>
        <Card style={[styles.card, styles.cardReceipt]}>
          <View style={styles.cardHeaderRow}>
            <MaterialCommunityIcons name="receipt-outline" size={20} color="#FF9800" />
            <Text style={styles.cardHeaderTitle}>{t.receiptCard.title}</Text>
          </View>
          
          {receiptImage ? (
            <View>
              <Image
                source={{ uri: receiptImage }}
                style={{ width: '100%', height: 200, borderRadius: 8, marginBottom: 12 }}
                resizeMode="cover"
              />
              <View style={styles.receiptActionRow}>
                <TouchableOpacity
                  style={styles.receiptActionBtn}
                  onPress={selectImageSource}
                >
                  <MaterialCommunityIcons name="image-edit" size={20} color={theme.colors.primary} />
                  <Text style={[styles.receiptBtnText, { color: theme.colors.primary }]}>
                    {t.receiptCard.changeButton}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.receiptActionBtn}
                  onPress={removeImage}
                >
                  <MaterialCommunityIcons name="delete" size={20} color={theme.colors.error} />
                  <Text style={[styles.receiptBtnText, { color: theme.colors.error }]}>
                    {t.receiptCard.deleteButton}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.receiptAttachBtn}
              onPress={selectImageSource}
            >
              <MaterialCommunityIcons name="camera-plus" size={24} color={theme.colors.onSurfaceVariant} />
              <Text style={[styles.receiptBtnText, { color: theme.colors.onSurfaceVariant }]}>
                {t.receiptCard.attachButton}
              </Text>
            </TouchableOpacity>
          )}
        </Card>
        </View>

        {/* Categorización */}
        <View ref={ceCategoryRef} collapsable={false}>
        <Card style={[styles.card, styles.cardCategory]}>
          <TouchableOpacity
            style={[styles.cardHeaderRow, !isCategoryExpanded && { marginBottom: 0 }]}
            onPress={() => setIsCategoryExpanded(v => !v)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="tag-outline" size={20} color="#FF9800" />
            <Text style={styles.cardHeaderTitle}>{t.categoryCard.title}</Text>
            {formData.category ? (
              <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, marginRight: 4 }}>
                {t.categories[formData.category]}
              </Text>
            ) : null}
            <MaterialCommunityIcons
              name={isCategoryExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>

          {isCategoryExpanded && (
            <>
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
                      color={formData.category === cat.key ? theme.colors.onPrimaryContainer : getCategoryColor(cat.key)}
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
            </>
          )}
        </Card>
        </View>

        {/* Espacio para los botones footer */}
        <View style={styles.footerSpace} />
      </ScrollView>

      {/* DateTimePicker */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date(new Date().setMonth(new Date().getMonth() - 3))}
          maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() + 2))}
          accentColor={theme.colors.surface === '#FFFFFF' ? '#007AFF' : theme.colors.primaryContainer}
          themeVariant={theme.colors.surface === '#FFFFFF' ? 'light' : 'dark'}
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
      
      {/* Modal Calculadora */}
      <Modal
        visible={showCalculator}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCalcClose}
      >
        <View style={styles.calcOverlay}>
          <View style={styles.calcModal}>
            {/* Display */}
            <View style={styles.calcDisplay}>
              <Text style={styles.calcExpressionText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                {calcExpression || ' '}
              </Text>
              <Text style={[styles.calcResultText, calcHasError && styles.calcResultError]}>
                {calcCurrentInput || '0'}
              </Text>
            </View>

            {/* Teclado */}
            {[
              ['C', '⌫', '', '÷'],
              ['7', '8', '9', '×'],
              ['4', '5', '6', '-'],
              ['1', '2', '3', '+'],
              ['0', '.', '='],
            ].map((row, rowIdx) => (
              <View key={rowIdx} style={styles.calcRow}>
                {row.map((key, colIdx) => {
                  const isWide = rowIdx === 4 && key === '0';
                  const isOperator = ['÷', '×', '-', '+', '='].includes(key);
                  const isClear = key === 'C';
                  const isBackspace = key === '⌫';
                  const isEmpty = key === '';
                  if (isEmpty) return <View key={colIdx} style={styles.calcKeyEmpty} />;
                  return (
                    <TouchableOpacity
                      key={colIdx}
                      style={[
                        styles.calcKey,
                        isWide && styles.calcKeyWide,
                        isOperator && styles.calcKeyOperator,
                        isClear && styles.calcKeyClear,
                        isBackspace && styles.calcKeyBackspace,
                      ]}
                      onPress={() => calcInput(key)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.calcKeyText,
                        isOperator && styles.calcKeyTextOperator,
                        isClear && styles.calcKeyTextClear,
                      ]}>
                        {key}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            {/* Footer: Volver (1/3) + Usar (2/3) */}
            <View style={styles.calcFooter}>
              <TouchableOpacity
                style={[styles.calcFooterBtn, styles.calcFooterBtnBack]}
                onPress={handleCalcClose}
                activeOpacity={0.8}
              >
                <Text style={styles.calcFooterBtnBackText}>Volver</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.calcFooterBtn,
                  styles.calcFooterBtnUse,
                  (calcHasError || !calcCurrentInput || calcCurrentInput === 'Error') && styles.calcFooterBtnDisabled
                ]}
                onPress={handleCalcUse}
                disabled={calcHasError || !calcCurrentInput || calcCurrentInput === 'Error'}
                activeOpacity={0.8}
              >
                <Text style={styles.calcFooterBtnUseText}>Usar  {calcCurrentInput && !calcHasError && calcCurrentInput !== 'Error' ? `(${calcCurrentInput})` : ''}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      </SafeAreaView>
      </KeyboardAvoidingView>

      {/* Tour guiado */}
      <TutorialOverlay
        visible={ceTourVisible}
        steps={[
          { ref: ceInfoRef,     titleKey: 'tour.createExpense.info.title',     descKey: 'tour.createExpense.info.desc',     popupPosition: 'below' },
          { ref: cePayerRef,    titleKey: 'tour.createExpense.payer.title',    descKey: 'tour.createExpense.payer.desc',    popupPosition: 'below',  onBeforeShow: () => scrollToCard(cePayerRef),    delay: 500 },
          { ref: ceSplitRef,    titleKey: 'tour.createExpense.split.title',    descKey: 'tour.createExpense.split.desc',    popupPosition: 'center', onBeforeShow: () => scrollToCard(ceSplitRef),    delay: 500 },
          { ref: ceReceiptRef,  titleKey: 'tour.createExpense.receipt.title',  descKey: 'tour.createExpense.receipt.desc',  popupPosition: 'center', onBeforeShow: () => scrollToCard(ceReceiptRef),  delay: 500 },
          { ref: ceCategoryRef, titleKey: 'tour.createExpense.category.title', descKey: 'tour.createExpense.category.desc', popupPosition: 'above',  onBeforeShow: () => scrollToCard(ceCategoryRef), delay: 500 },
        ]}
        currentStep={ceTourStep}
        onNext={() => setCeTourStep(p => p + 1)}
        onPrev={() => setCeTourStep(p => p - 1)}
        onClose={() => { setCeTourVisible(false); setCeTourStep(0); }}
      />
    </View>
  );
};

export default CreateExpenseScreen;