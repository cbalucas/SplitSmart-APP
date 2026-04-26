import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { es as dateEs } from 'date-fns/locale';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { HeaderBar } from '../../components';
import TutorialOverlay, { TourStep } from '../../components/TutorialOverlay';
import { createStyles } from './styles';
import { expressLanguage, ExpressLanguage } from './language';
import { ChatMessage, WizardStep, ExpressEventState, ExpenseEntry } from './types';
import { Participant } from '../../types';
// ID generation consistent with the rest of the project
const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const formatDateDisplay = (dateStr: string, lang: string) => {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    return format(d, "d 'de' MMMM yyyy", { locale: lang === 'es' || lang === 'pt' ? dateEs : undefined });
  } catch {
    return dateStr;
  }
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const ExpressEventScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { addEvent, addExistingParticipantToEvent, addParticipantToEvent, addExpense, getFriends } = useData();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  const t = expressLanguage[(language as ExpressLanguage)] || expressLanguage.es;

  const scrollRef = useRef<ScrollView>(null);
  const chatAreaRef = useRef<View>(null);
  const inputAreaRef = useRef<View>(null);

  // ── Tour ────────────────────────────────────────────────────
  const [tourVisible, setTourVisible] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const handleTourNext = () => setTourStep(prev => prev + 1);
  const handleTourPrev = () => setTourStep(prev => prev - 1);
  const handleTourClose = () => { setTourVisible(false); setTourStep(0); };

  // ── Estado del wizard ──────────────────────────────────────
  const [step, setStep] = useState<WizardStep>('menu');
  const [chatMode, setChatMode] = useState<'standard' | 'advanced'>('standard');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [friends, setFriends] = useState<Participant[]>([]);

  const [state, setState] = useState<ExpressEventState>({
    eventName: '',
    eventDate: todayStr(),
    selectedParticipants: [],
    expenses: [],
    currentExpense: {},
  });

  // DatePicker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerTarget, setDatePickerTarget] = useState<'event' | 'expense'>('event');
  const [datePickerValue, setDatePickerValue] = useState(new Date());

  // Split values (modo avanzado)
  const [splitInputValues, setSplitInputValues] = useState<Record<string, string>>({});

  // Ref para detectar cambio real de idioma (ignorar mount)
  const prevLanguageRef = useRef<string>(language);

  // ── Timer de inactividad ───────────────────────────────────
  const INACTIVITY_MS = 5 * 60 * 1000; // 5 minutos
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setStep('timeout');
      setMessages(prev => [...prev, { id: generateId(), type: 'timeout', text: '', timestamp: new Date() }]);
    }, INACTIVITY_MS);
  }, [INACTIVITY_MS]);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => { if (inactivityTimer.current) clearTimeout(inactivityTimer.current); };
  }, []);

  const pushBot = useCallback((text: string) => {
    setMessages(prev => [...prev, { id: generateId(), type: 'bot', text, timestamp: new Date() }]);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  const pushUser = useCallback((text: string) => {
    setMessages(prev => [...prev, { id: generateId(), type: 'user', text, timestamp: new Date() }]);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  const pushWarning = useCallback((text: string) => {
    setMessages(prev => [...prev, { id: generateId(), type: 'warning', text, timestamp: new Date() }]);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  const pushSummary = useCallback((text: string) => {
    setMessages(prev => [...prev, { id: generateId(), type: 'summary', text, timestamp: new Date() }]);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
  }, [messages]);

  // ── Detector de cambio de idioma ──────────────────────────
  useEffect(() => {
    if (prevLanguageRef.current === language) return;
    prevLanguageRef.current = language;
    const newT = expressLanguage[(language as ExpressLanguage)] || expressLanguage.es;
    setMessages(prev => [
      ...prev,
      { id: generateId(), type: 'lang_change', text: newT.langChangeNotice, timestamp: new Date() },
    ]);
  }, [language]);

  // ── Inicio del wizard ──────────────────────────────────────
  useEffect(() => {
    pushBot(t.welcome);
    setTimeout(() => pushBot(t.askMode), 400);
    resetInactivityTimer();

    getFriends().then(f => setFriends(f)).catch(() => setFriends([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Menú inicial ───────────────────────────────────────────
  const goToExpressMode = () => {
    setChatMode('standard');
    pushUser(t.modeExpress);
    setTimeout(() => pushBot(t.askEventName), 300);
    setStep('event_name');
  };

  const goToAdvancedExpressMode = () => {
    setChatMode('advanced');
    pushUser(t.modeAdvanced || 'Evento express avanzado');
    setTimeout(() => pushBot(t.askEventName), 300);
    setStep('event_name');
  };

  const goToHelpMode = () => {
    pushUser(t.modeHelp);
    setTimeout(() => {
      pushBot(t.helpWelcome);
      setTimeout(() => {
        const menu = [
          `1. ${t.helpQ1}`,
          `2. ${t.helpQ2}`,
          `3. ${t.helpQ3}`,
          `4. ${t.helpQ4}`,
          `5. ${t.helpQ5}`,
        ].join('\n');
        pushBot(`${t.helpChooseOption}\n\n${menu}`);
      }, 400);
    }, 300);
    setStep('help');
  };

  const goBackToMenu = () => {
    setTimeout(() => pushBot(t.askMode), 100);
    setStep('menu');
  };

  // ── Volver al paso anterior durante creación de evento ────
  const goBackStep = () => {
    switch (step) {
      case 'event_name':        goBackToMenu(); break;
      case 'event_date':        setStep('event_name'); setTimeout(() => pushBot(t.askEventName), 200); break;
      case 'participants':
      case 'bulk_participants': setStep('event_date'); setTimeout(() => pushBot(t.askEventDate), 200); break;
      case 'ask_expenses':      setStep('participants'); setTimeout(() => pushBot(t.askParticipants), 200); break;
      case 'expense_title':     setStep('ask_expenses'); setTimeout(() => pushBot(t.askHasExpenses), 200); break;
      case 'expense_amount':    setStep('expense_title'); setTimeout(() => pushBot(t.askExpenseTitle), 200); break;
      case 'expense_date':      setStep('expense_amount'); setTimeout(() => pushBot(t.askExpenseAmount), 200); break;
      case 'expense_payer':     setStep('expense_date'); setTimeout(() => pushBot(t.askExpenseDate), 200); break;
      case 'expense_split_type':    setStep('expense_payer'); setTimeout(() => pushBot(t.askExpensePayer), 200); break;
      case 'expense_split_values':   setStep('expense_split_type'); setTimeout(() => pushBot(t.askSplitType), 200); break;
      case 'expense_more':
        setStep('expense_payer'); setTimeout(() => pushBot(t.askExpensePayer), 200);
        break;
      case 'summary':           setStep('expense_more'); setTimeout(() => pushBot(t.askMoreExpenses), 200); break;
      default: break;
    }
  };

  // Pasos que son parte del flujo de creación (tienen botón volver/cancelar)
  const isExpressFlowStep = (s: WizardStep) =>
    ['event_name','event_date','participants','bulk_participants','ask_expenses',
     'expense_title','expense_amount','expense_date','expense_payer','expense_split_type',
     'expense_split_values','expense_more','summary'].includes(s);


  const getHelpResponse = (text: string): string => {
    const lower = text.toLowerCase();
    const has = (words: string[]) => words.some(w => lower.includes(w));
    if (has(['event', 'evento', 'crear', 'create', 'creat', 'nuevo', 'novo']))
      return t.helpAnswerEvent;
    if (has(['gasto', 'expense', 'despesa', 'costo', 'cost', 'precio', 'pago', 'payment']))
      return t.helpAnswerExpense;
    if (has(['participante', 'participant', 'persona', 'people', 'pessoa', 'integrante']))
      return t.helpAnswerParticipant;
    if (has(['amigo', 'friend', 'amig', 'contact', 'contato']))
      return t.helpAnswerFriend;
    if (has(['liquidar', 'settle', 'pagar', 'pay', 'deuda', 'debt', 'dividir', 'split', 'liquidaci']))
      return t.helpAnswerSettlement;
    return t.helpAnswerDefault;
  };

  const handleHelpSubmit = (val: string) => {
    if (!val.trim()) return;
    setTextInput('');
    const num = parseInt(val.trim(), 10);
    const answers = [
      t.helpAnswerFriend,
      t.helpAnswerEvent,
      t.helpAnswerExpense,
      t.helpAnswerParticipant,
      t.helpAnswerSettlement,
    ];
    if (num >= 1 && num <= 5) {
      const questions = [t.helpQ1, t.helpQ2, t.helpQ3, t.helpQ4, t.helpQ5];
      pushUser(questions[num - 1]);
      setTimeout(() => pushBot(answers[num - 1]), 300);
    } else {
      pushUser(val.trim());
      setTimeout(() => pushBot(t.helpAnswerDefault), 300);
    }
  };

  // ── Transiciones de paso ───────────────────────────────────
  const goToEventDate = (name: string) => {
    setState(prev => ({ ...prev, eventName: name }));
    pushUser(name);
    setTimeout(() => pushBot(t.askEventDate), 300);
    setStep('event_date');
  };

  const goToParticipants = (dateStr: string) => {
    setState(prev => ({ ...prev, eventDate: dateStr }));
    pushUser(formatDateDisplay(dateStr, language));
    setTimeout(() => {
      if (friends.length === 0) {
        pushBot(t.noFriends);
        setTimeout(() => {
          pushBot(t.askBulkParticipants);
          setTimeout(() => pushBot(t.bulkParticipantsHint), 400);
          setStep('bulk_participants');
        }, 400);
      } else {
        pushBot(t.askParticipants);
        setTimeout(() => pushBot(t.askParticipantsHint), 500);
        setStep('participants');
      }
    }, 300);
  };

  const goToAskExpenses = (participants: Participant[]) => {
    setState(prev => ({ ...prev, selectedParticipants: participants }));
    if (participants.length > 0) {
      pushUser(participants.map(p => p.name).join(', '));
      setTimeout(() => pushBot(t.askHasExpenses), 300);
      setStep('ask_expenses');
    } else {
      // Sin participantes: no se pueden cargar gastos, ir directo al resumen
      setTimeout(() => {
        pushBot(t.noParticipantsSkipExpenses);
        setState(prev => {
          const s = { ...prev, expenses: [] };
          buildSummary(s);
          return s;
        });
      }, 300);
      setStep('summary');
    }
  };

  // Desde la selección de amigos → carga masiva
  const goToBulkParticipants = (selectedFriends: Participant[]) => {
    setState(prev => ({ ...prev, selectedParticipants: selectedFriends }));
    if (selectedFriends.length > 0) {
      pushUser(selectedFriends.map(p => p.name).join(', '));
    }
    setTimeout(() => {
      // Con amigos ya seleccionados el mensaje dice "agregar más", sin amigos dice "quiénes participan"
      const msg = selectedFriends.length > 0 ? t.askBulkParticipantsExtra : t.askBulkParticipants;
      pushBot(msg);
      setTimeout(() => pushBot(t.bulkParticipantsHint), 400);
      setStep('bulk_participants');
    }, 300);
  };

  // Confirmar carga masiva y avanzar a gastos
  const handleBulkParticipantsSubmit = (raw: string) => {
    const names = raw.split(',').map(n => n.trim()).filter(n => n.length > 0);
    if (names.length === 0) {
      // Saltear sin agregar
      pushUser(t.bulkParticipantsSkip);
      goToAskExpenses(state.selectedParticipants);
      return;
    }

    // Verificar duplicados contra los ya seleccionados (por nombre, case-insensitive)
    const existingNames = new Set(
      state.selectedParticipants.map(p => p.name.trim().toLowerCase())
    );
    const duplicates = names.filter(n => existingNames.has(n.toLowerCase()));
    if (duplicates.length > 0) {
      pushWarning(
        t.duplicateParticipants.replace('{names}', duplicates.join(', '))
      );
      // No avanzar — dejar que el usuario corrija el input
      return;
    }

    // Verificar duplicados dentro del propio input
    const seen = new Set<string>();
    const selfDuplicates: string[] = [];
    for (const n of names) {
      const key = n.toLowerCase();
      if (seen.has(key)) selfDuplicates.push(n);
      seen.add(key);
    }
    if (selfDuplicates.length > 0) {
      pushWarning(
        t.duplicateParticipants.replace('{names}', selfDuplicates.join(', '))
      );
      return;
    }

    const bulkParticipants: Participant[] = names.map(name => ({
      id: generateId(),
      name,
      isActive: true,
      participantType: 'temporary' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    const merged = [...state.selectedParticipants, ...bulkParticipants];
    pushUser(names.join(', '));
    goToAskExpenses(merged);
  };

  // Reiniciar todo el wizard
  const handleRestart = () => {
    setState({
      eventName: '',
      eventDate: todayStr(),
      selectedParticipants: [],
      expenses: [],
      currentExpense: {},
    });
    setMessages([]);
    setTextInput('');
    setChatMode('standard');
    setStep('menu');
    setTimeout(() => {
      pushBot(t.welcome);
      setTimeout(() => pushBot(t.askMode), 400);
    }, 100);
  };

  const goToExpenseTitle = () => {
    pushUser(t.yes);
    setTimeout(() => pushBot(t.askExpenseTitle), 300);
    setStep('expense_title');
  };

  const goToSummaryWithoutExpenses = () => {
    pushUser(t.no);
    setTimeout(() => pushBot(t.noExpensesHint), 200);
    setState(prev => {
      const s = { ...prev, expenses: [] };
      buildSummary(s);
      return s;
    });
    setStep('summary');
  };

  const hasTemp = (participants: Participant[]) =>
    participants.some(p => p.participantType === 'temporary');

  const goToExpenseAmount = (title: string) => {
    setState(prev => ({ ...prev, currentExpense: { ...prev.currentExpense, title } }));
    pushUser(title);
    setTimeout(() => pushBot(t.askExpenseAmount), 300);
    setStep('expense_amount');
  };

  const goToExpenseDate = (amount: number) => {
    setState(prev => ({ ...prev, currentExpense: { ...prev.currentExpense, amount } }));
    pushUser(`$${amount.toFixed(2)}`);
    setTimeout(() => pushBot(t.askExpenseDate), 300);
    setStep('expense_date');
  };

  const goToExpensePayer = (dateStr: string) => {
    setState(prev => ({ ...prev, currentExpense: { ...prev.currentExpense, date: dateStr } }));
    pushUser(formatDateDisplay(dateStr, language));
    setTimeout(() => pushBot(t.askExpensePayer), 300);
    setStep('expense_payer');
  };

  const goToExpenseMore = (payer: Participant) => {
    setState(prev => ({
      ...prev,
      currentExpense: {
        ...prev.currentExpense,
        payerId: payer.id,
        payerName: payer.name,
      },
    }));
    pushUser(payer.name);
    // TODO: activar flujo avanzado cuando CreateExpense soporte splits por % y monto fijo
    setTimeout(() => pushBot(t.askMoreExpenses), 300);
    setStep('expense_more');
  };

  const goToExpenseSplitValues = (splitType: 'percentage' | 'custom') => {
    const count = state.selectedParticipants.length;
    const initVals: Record<string, string> = {};
    if (splitType === 'percentage') {
      const equalPct = count > 0 ? (100 / count).toFixed(1) : '0';
      state.selectedParticipants.forEach(p => { initVals[p.id] = equalPct; });
    } else {
      const equalAmt = count > 0 ? (state.currentExpense.amount! / count).toFixed(2) : '0';
      state.selectedParticipants.forEach(p => { initVals[p.id] = equalAmt; });
    }
    setSplitInputValues(initVals);
    setState(prev => ({ ...prev, currentExpense: { ...prev.currentExpense, splitType } }));
    setTimeout(() => pushBot(t.askSplitValues), 300);
    setStep('expense_split_values');
  };

  const handleConfirmSplitValues = () => {
    const splitType = state.currentExpense.splitType as 'percentage' | 'custom';
    const participants = state.selectedParticipants;
    const values = participants.map(p => ({
      participantId: p.id,
      participantName: p.name,
      raw: parseFloat((splitInputValues[p.id] || '0').replace(',', '.')),
    }));
    if (values.some(v => isNaN(v.raw) || v.raw < 0)) {
      pushWarning(t.splitPercentageError);
      return;
    }
    const total = values.reduce((s, v) => s + v.raw, 0);
    if (splitType === 'percentage') {
      if (Math.abs(total - 100) > 0.5) {
        pushWarning(t.splitPercentageError);
        return;
      }
      const customSplits = values.map(v => ({
        participantId: v.participantId,
        participantName: v.participantName,
        amount: Math.round((state.currentExpense.amount! * v.raw / 100) * 100) / 100,
        percentage: v.raw,
      }));
      setState(prev => ({ ...prev, currentExpense: { ...prev.currentExpense, customSplits, splitType: 'percentage' } }));
      const summary = values.map(v => `${v.participantName}: ${v.raw.toFixed(1)}%`).join(', ');
      pushUser(summary);
    } else {
      const expenseAmt = state.currentExpense.amount!;
      if (Math.abs(total - expenseAmt) > 0.01) {
        pushWarning(t.splitAmountError.replace('{amount}', expenseAmt.toFixed(2)));
        return;
      }
      const customSplits = values.map(v => ({
        participantId: v.participantId,
        participantName: v.participantName,
        amount: v.raw,
        percentage: Math.round((v.raw / expenseAmt * 100) * 100) / 100,
      }));
      setState(prev => ({ ...prev, currentExpense: { ...prev.currentExpense, customSplits, splitType: 'custom' } }));
      const summary = values.map(v => `${v.participantName}: $${v.raw.toFixed(2)}`).join(', ');
      pushUser(summary);
    }
    setSplitInputValues({});
    setTimeout(() => pushBot(t.askMoreExpenses), 300);
    setStep('expense_more');
  };

  const commitExpenseAndLoop = () => {
    setState(prev => {
      const expense = prev.currentExpense as ExpenseEntry;
      return {
        ...prev,
        expenses: [...prev.expenses, expense],
        currentExpense: {},
      };
    });
    pushUser(t.yes);
    setTimeout(() => pushBot(t.askExpenseTitle), 300);
    setStep('expense_title');
  };

  const commitExpenseAndSummary = () => {
    setState(prev => {
      const expense = prev.currentExpense as ExpenseEntry;
      const expenses = [...prev.expenses, expense];
      // Construir y mostrar resumen
      buildSummary({ ...prev, expenses });
      return { ...prev, expenses, currentExpense: {} };
    });
    setStep('summary');
  };

  const buildSummary = (s: ExpressEventState) => {
    const participantsLine = s.selectedParticipants.length > 0
      ? s.selectedParticipants.map(p => p.name).join(', ')
      : t.summaryNoParticipants;
    const expensesLines = s.expenses.length > 0
      ? s.expenses.flatMap(e => {
          const mainLine = `${t.summaryExpenseItem.replace('{title}', e.title).replace('{amount}', e.amount.toFixed(2))} (${t.summaryPaidBy.replace('{name}', e.payerName)})`;
          if (e.splitType && e.splitType !== 'equal' && e.customSplits && e.customSplits.length > 0) {
            const splitLines = e.customSplits.map(cs =>
              e.splitType === 'percentage'
                ? `    • ${cs.participantName}: ${cs.percentage.toFixed(1)}% ($${cs.amount.toFixed(2)})`
                : `    • ${cs.participantName}: $${cs.amount.toFixed(2)}`
            );
            return [mainLine, `  ${t.summaryCustomSplitLabel}:`, ...splitLines];
          }
          return [mainLine];
        })
      : [t.summaryNoExpenses];
    const lines = [
      `${t.summaryEvent} **${s.eventName}**`,
      `${t.summaryDate} ${formatDateDisplay(s.eventDate, language)}`,
      `${t.summaryParticipants} ${participantsLine}`,
      `${t.summaryExpenses}`,
      ...expensesLines,
    ];
    setTimeout(() => {
      pushBot(t.summaryHeader);
      setTimeout(() => pushSummary(lines.join('\n')), 300);
      setTimeout(() => pushBot(t.confirmCreate), 700);
    }, 300);
  };

  // ── Creación final ─────────────────────────────────────────
  const handleCreate = async () => {
    setIsLoading(true);
    setStep('done');
    try {
      const eventId = generateId();
      await addEvent({
        id: eventId,
        name: state.eventName,
        startDate: state.eventDate,
        currency: 'ARS',
        totalAmount: state.expenses.reduce((s, e) => s + e.amount, 0),
        status: 'active',
        type: 'public',
        isExpress: true,
        creatorId: user?.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Agregar participantes
      // - 'friend': ya existe en la BD → solo crear relación evento-participante
      // - 'temporary': creado en el chat → crear el participante primero y luego la relación
      for (const p of state.selectedParticipants) {
        if (p.participantType === 'friend') {
          await addExistingParticipantToEvent(eventId, p);
        } else {
          // temporary: addParticipantToEvent crea el registro en participants y luego la relación
          await addParticipantToEvent(eventId, p);
        }
      }

      // Agregar gastos con splits (iguales o personalizados)
      const splitCount = state.selectedParticipants.length;
      for (const e of state.expenses) {
        const expenseId = generateId();
        let splits;
        if ((e.splitType === 'percentage' || e.splitType === 'custom') && e.customSplits && e.customSplits.length > 0) {
          splits = e.customSplits.map(cs => ({
            id: generateId(),
            expenseId,
            participantId: cs.participantId,
            amount: cs.amount,
            percentage: cs.percentage,
            type: e.splitType === 'percentage' ? 'percentage' as const : 'custom' as const,
            isPaid: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
        } else {
          const splitAmount = splitCount > 0
            ? Math.round((e.amount / splitCount) * 100) / 100
            : e.amount;
          splits = state.selectedParticipants.map(p => ({
            id: generateId(),
            expenseId,
            participantId: p.id,
            amount: splitAmount,
            percentage: splitCount > 0 ? Math.round((100 / splitCount) * 100) / 100 : 100,
            type: 'equal' as const,
            isPaid: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));
        }
        await addExpense({
          id: expenseId,
          eventId,
          description: e.title,
          amount: e.amount,
          currency: 'ARS',
          date: e.date,
          payerId: e.payerId,
          payerName: e.payerName,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }, splits);
      }

      pushBot(t.successMessage);
      setTimeout(() => pushBot(t.detailHint), 500);
      setIsLoading(false);

      // Navegar al detalle tras un breve delay para que el usuario lea el mensaje
      setTimeout(() => {
        (navigation as any).replace('EventDetail', { eventId });
      }, 2200);
    } catch (err) {
      console.error('ExpressEvent: error creating', err);
      pushBot(t.errorCreating);
      setIsLoading(false);
      setStep('summary');
    }
  };

  // ── Submit de input de texto ───────────────────────────────
  const handleTextSubmit = () => {
    const val = textInput.trim();
    if (!val) return;

    if (step === 'help') {
      handleHelpSubmit(val);
      return;
    }

    setTextInput('');

    if (step === 'event_name') {
      goToEventDate(val);
    } else if (step === 'bulk_participants') {
      handleBulkParticipantsSubmit(val);
    } else if (step === 'expense_title') {
      goToExpenseAmount_text(val);
    } else if (step === 'expense_amount') {
      const num = parseFloat(val.replace(',', '.'));
      if (isNaN(num) || num <= 0) {
        pushWarning(t.invalidAmount);
        return;
      }
      goToExpenseDate(num);
    }
  };

  const goToExpenseAmount_text = (title: string) => {
    setState(prev => ({ ...prev, currentExpense: { ...prev.currentExpense, title } }));
    pushUser(title);
    setTimeout(() => pushBot(t.askExpenseAmount), 300);
    setStep('expense_amount');
  };

  // ── DatePicker ─────────────────────────────────────────────
  const openDatePicker = (target: 'event' | 'expense') => {
    setDatePickerTarget(target);
    const current = target === 'event' ? state.eventDate : (state.currentExpense.date || todayStr());
    const [y, m, d] = current.split('-').map(Number);
    setDatePickerValue(new Date(y, m - 1, d));
    setShowDatePicker(true);
  };

  const onDateChange = (_: any, selected?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (!selected) return;
    const ds = `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, '0')}-${String(selected.getDate()).padStart(2, '0')}`;
    if (datePickerTarget === 'event') {
      goToParticipants(ds);
    } else {
      goToExpensePayer(ds);
    }
    if (Platform.OS === 'ios') setShowDatePicker(false);
  };

  // ── Renderizado de mensajes ────────────────────────────────
  const renderMessage = (msg: ChatMessage) => {
    if (msg.type === 'bot') {
      return (
        <View key={msg.id} style={[styles.messageRow, styles.messageRowBot]}>
          <View style={styles.botAvatar}>
            <Image source={require('../../../assets/splitsmart/Splitty.png')} style={{ width: 56, height: 56, resizeMode: 'contain' }} />
          </View>
          <View style={styles.bubbleBot}>
            <Text style={styles.textBot}>{msg.text}</Text>
          </View>
        </View>
      );
    }
    if (msg.type === 'user') {
      return (
        <View key={msg.id} style={[styles.messageRow, styles.messageRowUser]}>
          <View style={styles.bubbleUser}>
            <Text style={styles.textUser}>{msg.text}</Text>
          </View>
        </View>
      );
    }
    if (msg.type === 'warning') {
      return (
        <View key={msg.id} style={[styles.messageRow, styles.messageRowWarning]}>
          <View style={styles.bubbleWarning}>
            <Text style={styles.textWarning}>{msg.text}</Text>
          </View>
        </View>
      );
    }
    if (msg.type === 'summary') {
      return (
        <View key={msg.id} style={[styles.messageRow, styles.messageRowBot]}>
          <View style={styles.botAvatar}>
            <Image source={require('../../../assets/splitsmart/Splitty.png')} style={{ width: 56, height: 56, resizeMode: 'contain' }} />
          </View>
          <View style={styles.bubbleSummary}>
            {msg.text.split('\n').map((line, i) => (
              <Text key={i} style={line.startsWith('**') && line.endsWith('**') ? styles.textSummaryBold : styles.textSummary}>
                {line.replace(/\*\*/g, '')}
              </Text>
            ))}
          </View>
        </View>
      );
    }
    if (msg.type === 'lang_change') {
      const handleContinue = () => {
        setMessages(prev => prev.map(m =>
          m.id === msg.id ? { ...m, type: 'bot' as const } : m
        ));
      };
      return (
        <View key={msg.id} style={[styles.messageRow, styles.messageRowBot]}>
          <View style={styles.botAvatar}>
            <Image source={require('../../../assets/splitsmart/Splitty.png')} style={{ width: 56, height: 56, resizeMode: 'contain' }} />
          </View>
          <View style={styles.bubbleLangChange}>
            <Text style={styles.textBot}>{msg.text}</Text>
            <View style={styles.langChangeActions}>
              <TouchableOpacity style={styles.langChangeContinueBtn} onPress={handleContinue} activeOpacity={0.7}>
                <Text style={styles.langChangeContinueBtnText}>{t.langChangeContinue}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.langChangeRestartBtn} onPress={handleRestart} activeOpacity={0.8}>
                <Text style={styles.langChangeRestartBtnText}>{t.langChangeRestart}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }
    if (msg.type === 'timeout') {
      return (
        <View key={msg.id} style={[styles.messageRow, styles.messageRowBot]}>
          <View style={styles.botAvatar}>
            <Image source={require('../../../assets/splitsmart/Splitty.png')} style={{ width: 56, height: 56, resizeMode: 'contain' }} />
          </View>
          <View style={[styles.bubbleWarning, { borderRadius: 14, maxWidth: '80%' }]}>
            <Text style={styles.textWarning}>{t.timeoutMessage}</Text>
          </View>
        </View>
      );
    }
    return null;
  };

  // ── Renderizado del área de input por step ─────────────────
  const safeBottom = { paddingBottom: insets.bottom > 0 ? insets.bottom : 12 };

  // ── Metadatos de sección por step (igual que EventDetail) ──
  const getSectionMeta = (): { icon: string; label: string } => {
    switch (step) {
      case 'menu':                return { icon: 'hand-wave',            label: '¿Cómo puedo ayudarte?' };
      case 'help':                return { icon: 'help-circle-outline',  label: t.helpSectionLabel };
      case 'event_name':          return { icon: 'calendar-edit',        label: t.sectionLabelEventName };
      case 'event_date':          return { icon: 'calendar',             label: t.sectionLabelEventDate };
      case 'participants':        return { icon: 'account-group',        label: t.sectionLabelParticipants };
      case 'bulk_participants':   return { icon: 'account-multiple-plus', label: t.sectionLabelBulkParticipants };
      case 'ask_expenses':        return { icon: 'currency-usd',         label: t.sectionLabelExpenses };
      case 'expense_title':       return { icon: 'receipt',              label: t.sectionLabelExpenseTitle };
      case 'expense_amount':      return { icon: 'cash',                 label: t.sectionLabelExpenseAmount };
      case 'expense_date':        return { icon: 'calendar-clock',       label: t.sectionLabelExpenseDate };
      case 'expense_payer':       return { icon: 'account-cash',         label: t.sectionLabelExpensePayer };
      case 'expense_split_type':  return { icon: 'chart-pie',            label: t.sectionLabelSplitType };
      case 'expense_split_values':return { icon: 'percent',              label: t.sectionLabelSplitValues };
      case 'expense_more':        return { icon: 'plus-circle-outline',  label: t.sectionLabelMoreExpenses };
      case 'summary':             return { icon: 'check-circle-outline', label: t.sectionLabelSummary };
      default:                    return { icon: 'chat-outline',         label: '' };
    }
  };

  // ── Contenido por step (sin wrapper externo) ──────────────
  const renderInputContent = () => {    // Menú de bienvenida
    if (step === 'menu') {
      return (
        <View style={styles.actionsRow}>
          {!user?.chatModeAdvanced && (
            <TouchableOpacity
              style={[styles.actionChip, { flex: 1, justifyContent: 'center', paddingVertical: 14 }]}
              onPress={goToExpressMode}
              activeOpacity={0.8}
            >
              <Image
                source={require('../../../assets/splitsmart/Splitty.png')}
                style={{ width: 36, height: 36, resizeMode: 'contain', marginRight: 8 }}
              />
              <Text style={styles.actionChipText}>Evento express</Text>
            </TouchableOpacity>
          )}
          {user?.chatModeAdvanced && (
            <TouchableOpacity
              style={[styles.actionChip, { flex: 1, justifyContent: 'center', paddingVertical: 14 }]}
              onPress={goToAdvancedExpressMode}
              activeOpacity={0.8}
            >
              <Image
                source={require('../../../assets/splitsmart/Splitty.png')}
                style={{ width: 36, height: 36, resizeMode: 'contain', marginRight: 8 }}
              />
              <Text style={styles.actionChipText}>{t.modeAdvanced || 'Avanzado'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionChip, { flex: 1, justifyContent: 'center', paddingVertical: 14 }]}
            onPress={goToHelpMode}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="help-circle-outline" size={36} color={styles.actionChipText.color} style={{ marginRight: 8 }} />
            <Text style={styles.actionChipText}>Consulta</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Modo ayuda
    if (step === 'help') {
      return (
        <>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder={t.helpInputPlaceholder}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={textInput}
              onChangeText={setTextInput}
              keyboardType="number-pad"
              returnKeyType="send"
              onSubmitEditing={handleTextSubmit}
              autoFocus
              maxLength={1}
            />
            <TouchableOpacity
              style={[styles.sendBtn, textInput.trim().length === 0 && styles.sendBtnDisabled]}
              onPress={handleTextSubmit}
              disabled={textInput.trim().length === 0}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.restartBtn} onPress={goBackToMenu} activeOpacity={0.8}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={theme.colors.primary} />
            <Text style={[styles.restartBtnText, { color: theme.colors.primary }]}>{t.helpBackToMenu}</Text>
          </TouchableOpacity>
        </>
      );
    }
    // Steps con TextInput (incluye bulk_participants)
    if (step === 'event_name' || step === 'expense_title' || step === 'expense_amount' || step === 'bulk_participants') {
      const placeholder =
        step === 'event_name' ? t.inputPlaceholderName :
        step === 'expense_title' ? t.inputPlaceholderExpenseTitle :
        step === 'bulk_participants' ? 'Ana, Carlos, María...' :
        t.inputPlaceholderAmount;
      const keyboardType = step === 'expense_amount' ? 'decimal-pad' : 'default';
      const disabled = step !== 'bulk_participants' && textInput.trim().length === 0;

      return (
        <>
          {step === 'bulk_participants' && (
            <TouchableOpacity
              onPress={() => { setTextInput(''); handleBulkParticipantsSubmit(''); }}
              activeOpacity={0.7}
            >
              <Text style={styles.skipLink}>⏭️ {t.bulkParticipantsSkip}</Text>
            </TouchableOpacity>
          )}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={textInput}
              onChangeText={setTextInput}
              keyboardType={keyboardType}
              returnKeyType="send"
              onSubmitEditing={handleTextSubmit}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.sendBtn, disabled && styles.sendBtnDisabled]}
              onPress={handleTextSubmit}
              disabled={disabled}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </>
      );
    }

    if (step === 'event_date') {
      return (
        <View style={styles.inputRow}>
          <TouchableOpacity style={[styles.datePickerBtn, { flex: 1 }]} onPress={() => openDatePicker('event')} activeOpacity={0.8}>
            <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.primary} />
            <Text style={styles.datePickerText}>{formatDateDisplay(state.eventDate, language)}</Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={() => goToParticipants(state.eventDate)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 'participants') {
      const selected = new Set(state.selectedParticipants.map(p => p.id));
      const toggleParticipant = (p: Participant) => {
        setState(prev => {
          const already = prev.selectedParticipants.some(x => x.id === p.id);
          return {
            ...prev,
            selectedParticipants: already
              ? prev.selectedParticipants.filter(x => x.id !== p.id)
              : [...prev.selectedParticipants, p],
          };
        });
      };

      return (
        <>
          <View style={styles.participantListContainer}>
            <ScrollView style={{ maxHeight: 180 }} contentContainerStyle={styles.participantScrollContent}>
              {friends.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.participantItem, selected.has(p.id) && styles.participantItemSelected]}
                  onPress={() => toggleParticipant(p)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={selected.has(p.id) ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                    size={20}
                    color={selected.has(p.id) ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  />
                  <Text style={styles.participantName}>{p.name}</Text>
                  <Text style={styles.participantType}>
                    {p.participantType === 'temporary' ? '⚠️ Temporal' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={[styles.actionChip, { flex: 1, justifyContent: 'center' }]}
              onPress={() => goToBulkParticipants(state.selectedParticipants)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionChipText}>
                {state.selectedParticipants.length > 0
                  ? `✅ Confirmar (${state.selectedParticipants.length})`
                  : `⏭️ Saltar`}
              </Text>
            </TouchableOpacity>
            {state.selectedParticipants.length > 0 && (
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={() => goToBulkParticipants(state.selectedParticipants)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        </>
      );
    }

    if (step === 'ask_expenses') {
      return (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionChip, { flex: 1, justifyContent: 'center' }]}
            onPress={goToExpenseTitle}
            activeOpacity={0.8}
          >
            <Text style={styles.actionChipText}>✅ {t.yes}, cargar gastos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionChip, { flex: 1, justifyContent: 'center' }]}
            onPress={goToSummaryWithoutExpenses}
            activeOpacity={0.8}
          >
            <Text style={styles.actionChipText}>⏭️ {t.no}, sin gastos</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 'expense_date') {
      return (
        <View style={styles.inputRow}>
          <TouchableOpacity style={[styles.datePickerBtn, { flex: 1 }]} onPress={() => openDatePicker('expense')} activeOpacity={0.8}>
            <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.primary} />
            <Text style={styles.datePickerText}>
              {state.currentExpense.date ? formatDateDisplay(state.currentExpense.date, language) : formatDateDisplay(todayStr(), language)}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={() => goToExpensePayer(state.currentExpense.date || todayStr())}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 'expense_split_type') {
      return (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionChip, { flex: 1, justifyContent: 'center' }]}
            onPress={() => {
              pushUser(t.splitTypeEqual);
              setState(prev => ({ ...prev, currentExpense: { ...prev.currentExpense, splitType: 'equal', customSplits: undefined } }));
              setTimeout(() => pushBot(t.askMoreExpenses), 300);
              setStep('expense_more');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.actionChipText}>⚖️ {t.splitTypeEqual}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionChip, { flex: 1, justifyContent: 'center' }]}
            onPress={() => { pushUser(t.splitTypePercentage); goToExpenseSplitValues('percentage'); }}
            activeOpacity={0.8}
          >
            <Text style={styles.actionChipText}>📊 {t.splitTypePercentage}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionChip, { flex: 1, justifyContent: 'center' }]}
            onPress={() => { pushUser(t.splitTypeCustom); goToExpenseSplitValues('custom'); }}
            activeOpacity={0.8}
          >
            <Text style={styles.actionChipText}>💲 {t.splitTypeCustom}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 'expense_split_values') {
      const isPercentage = state.currentExpense.splitType === 'percentage';
      const totalTarget = isPercentage ? 100 : (state.currentExpense.amount || 0);
      const currentSum = state.selectedParticipants.reduce(
        (s, p) => s + parseFloat((splitInputValues[p.id] || '0').replace(',', '.')), 0
      );
      const diff = Math.abs(currentSum - totalTarget);
      const isValid = diff < (isPercentage ? 0.5 : 0.02);
      return (
        <View>
          <ScrollView style={{ maxHeight: 190 }} keyboardShouldPersistTaps="handled">
            {state.selectedParticipants.map(p => (
              <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 4, gap: 8 }}>
                <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: theme.colors.onSurface }} numberOfLines={1}>{p.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.outline, borderRadius: 8, paddingHorizontal: 8, minWidth: 100 }}>
                  {!isPercentage && <Text style={{ color: theme.colors.onSurfaceVariant, marginRight: 2 }}>$</Text>}
                  <TextInput
                    style={{ flex: 1, fontSize: 15, color: theme.colors.onSurface, textAlign: 'right', paddingVertical: 6 }}
                    value={splitInputValues[p.id] || ''}
                    onChangeText={v => setSplitInputValues(prev => ({ ...prev, [p.id]: v }))}
                    keyboardType="decimal-pad"
                    placeholder={isPercentage ? '0.0' : '0.00'}
                    placeholderTextColor={theme.colors.onSurfaceVariant}
                  />
                  {isPercentage && <Text style={{ color: theme.colors.onSurfaceVariant, marginLeft: 2 }}>%</Text>}
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingHorizontal: 4, gap: 8 }}>
            <Text style={{ flex: 1, fontSize: 13, color: isValid ? theme.colors.primary : theme.colors.error, fontWeight: '600' }}>
              {isPercentage
                ? `Σ ${currentSum.toFixed(1)}% / 100%`
                : `Σ $${currentSum.toFixed(2)} / $${totalTarget.toFixed(2)}`
              }
            </Text>
            <TouchableOpacity
              style={[styles.sendBtn, !isValid && styles.sendBtnDisabled]}
              onPress={handleConfirmSplitValues}
              disabled={!isValid}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="check" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    if (step === 'expense_payer') {
      const payerOptions = state.selectedParticipants.length > 0
        ? state.selectedParticipants
        : friends;

      return (
        <View style={styles.participantListContainer}>
          <ScrollView style={{ maxHeight: 160 }} contentContainerStyle={styles.participantScrollContent}>
            {payerOptions.map(p => (
              <TouchableOpacity
                key={p.id}
                style={styles.participantItem}
                onPress={() => goToExpenseMore(p)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="account-circle-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.participantName}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      );
    }

    if (step === 'expense_more') {
      return (
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionChip}
            onPress={commitExpenseAndLoop}
            activeOpacity={0.8}
          >
            <Text style={styles.actionChipText}>✅ {t.yes}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionChip}
            onPress={commitExpenseAndSummary}
            activeOpacity={0.8}
          >
            <Text style={styles.actionChipText}>🚀 {t.no}, ver resumen</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 'summary') {
      return (
        <>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleCreate} activeOpacity={0.8}>
            <MaterialCommunityIcons name="check-circle-outline" size={22} color="#FFFFFF" />
            <Text style={styles.confirmBtnText}>✨ Crear evento</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.restartBtn} onPress={handleRestart} activeOpacity={0.8}>
            <MaterialCommunityIcons name="refresh" size={18} color={theme.colors.error} />
            <Text style={styles.restartBtnText}>{t.cancelRestart}</Text>
          </TouchableOpacity>
        </>
      );
    }

    return null;
  };

  // ── Input area: wrapper con section header (patrón EventDetail) ──
  const renderInputArea = () => {
    if (step === 'done') return null;

    // Timeout: no mostrar input, solo botón para volver al inicio
    if (step === 'timeout') {
      return (
        <View style={[styles.inputArea, safeBottom]}>
          <TouchableOpacity style={styles.restartBtn} onPress={handleRestart} activeOpacity={0.8}>
            <MaterialCommunityIcons name="home" size={18} color={theme.colors.primary} />
            <Text style={[styles.restartBtnText, { color: theme.colors.primary }]}>{t.cancelRestart}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const { icon, label } = getSectionMeta();

    return (
      <View style={[styles.inputArea, safeBottom]}>
        <View style={styles.inputSectionHeader}>
          <MaterialCommunityIcons name={icon as any} size={13} color="#4CAF50" />
          <Text style={styles.inputSectionTitle}>{label}</Text>
        </View>
        {renderInputContent()}
        {isExpressFlowStep(step) && (
          <View style={[styles.actionsRow, { marginTop: 6 }]}>
            <TouchableOpacity
              style={[styles.actionChip, { flex: 1, justifyContent: 'center' }]}
              onPress={goBackStep}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="arrow-left" size={16} color={styles.actionChipText.color} style={{ marginRight: 4 }} />
              <Text style={styles.actionChipText}>{t.goBackStep}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionChip, { flex: 1, justifyContent: 'center', borderColor: theme.colors.error }]}
              onPress={handleRestart}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="close-circle-outline" size={16} color={theme.colors.error} style={{ marginRight: 4 }} />
              <Text style={[styles.actionChipText, { color: theme.colors.error }]}>{t.cancelCreate}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <HeaderBar
        title={t.screenTitle}
        titleAlignment="left"
        useDynamicColors={true}
        showThemeToggle={true}
        showLanguageSelector={true}
        elevation={true}
        showHelp={true}
        onHelpPress={() => { setTourStep(0); setTourVisible(true); }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View ref={chatAreaRef} collapsable={false} style={{ flex: 1 }}>
          <ScrollView
            ref={scrollRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map(renderMessage)}
          </ScrollView>
        </View>

        <View ref={inputAreaRef} collapsable={false}>
          {renderInputArea()}
        </View>
      </KeyboardAvoidingView>

      {/* DatePicker */}
      {showDatePicker && (
        <DateTimePicker
          value={datePickerValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date(new Date().setMonth(new Date().getMonth() - 36))}
          maximumDate={new Date(new Date().setFullYear(new Date().getFullYear() + 2))}
          onChange={onDateChange}
        />
      )}

      {/* Loading overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>{t.creating}</Text>
          </View>
        </View>
      )}

      {/* Tour */}
      <TutorialOverlay
        visible={tourVisible}
        steps={[
          { ref: chatAreaRef,  titleKey: 'tour.splitty.chat.title',  descKey: 'tour.splitty.chat.desc',  popupPosition: 'center' },
          { ref: inputAreaRef, titleKey: 'tour.splitty.input.title', descKey: 'tour.splitty.input.desc', popupPosition: 'above'  },
        ]}
        currentStep={tourStep}
        onNext={handleTourNext}
        onPrev={handleTourPrev}
        onClose={handleTourClose}
      />
    </View>
  );
};

export default ExpressEventScreen;
