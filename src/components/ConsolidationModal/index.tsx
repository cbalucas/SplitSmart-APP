import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showAlert } from '../../services/alertService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HeaderBar from '../HeaderBar';
import SearchBar from '../SearchBar';
import Card from '../Card';
import TutorialOverlay from '../TutorialOverlay';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Settlement, ConsolidationAssignment, Participant } from '../../types';

const ACCENT = '#2196F3';
const UNDO_COLOR = '#FF5722';

interface ConsolidationModalProps {
  visible: boolean;
  onClose: () => void;
  settlements: Settlement[];
  participants: Participant[];
  onConsolidationChange: (assignments: ConsolidationAssignment[]) => void;
  currency: string;
  existingAssignments?: ConsolidationAssignment[];
}

interface DebtSummary {
  participantId: string;
  participantName: string;
  totalDebt: number;
  settlements: Settlement[];
}

export const ConsolidationModal: React.FC<ConsolidationModalProps> = ({
  visible,
  onClose,
  settlements,
  participants,
  onConsolidationChange,
  currency,
  existingAssignments = []
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Nuevas asignaciones a crear en esta sesion
  const [pendingAssignments, setPendingAssignments] = useState<ConsolidationAssignment[]>([]);
  // Asignaciones ya confirmadas (existentes)
  const [confirmedAssignments, setConfirmedAssignments] = useState<ConsolidationAssignment[]>([]);
  // IDs de debtorId seleccionados para deshacer
  const [selectedToUndo, setSelectedToUndo] = useState<Set<string>>(new Set());

  const [debtSummaries, setDebtSummaries] = useState<DebtSummary[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showConfirmed, setShowConfirmed] = useState(false);
  const [expandedDebtor, setExpandedDebtor] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Tour
  const [cmTourVisible, setCmTourVisible] = useState(false);
  const [cmTourStep, setCmTourStep] = useState(0);
  const cmCard1Ref = useRef<View>(null);
  const cmCard2Ref = useRef<View>(null);
  const cmCard3Ref = useRef<View>(null);
  const cmFooterRef = useRef<View>(null);

  useEffect(() => {
    if (visible) {
      setConfirmedAssignments(existingAssignments);
      setPendingAssignments([]);
      setSelectedToUndo(new Set());
      setShowConfirmed(false);
    }
    setExpandedDebtor(null);
    setSearchQuery('');
  }, [visible, existingAssignments]);

  useEffect(() => {
    const debtMap: { [key: string]: DebtSummary } = {};
    // Solo excluir deudores ya confirmados (los pending siguen visibles hasta Aplicar)
    const coveredDebtorIds = new Set(confirmedAssignments.map(a => a.debtorId));
    settlements.forEach(settlement => {
      if (coveredDebtorIds.has(settlement.fromParticipantId)) return;
      if (!debtMap[settlement.fromParticipantId]) {
        debtMap[settlement.fromParticipantId] = {
          participantId: settlement.fromParticipantId,
          participantName: settlement.fromParticipantName,
          totalDebt: 0,
          settlements: []
        };
      }
      debtMap[settlement.fromParticipantId].totalDebt += settlement.amount;
      debtMap[settlement.fromParticipantId].settlements.push(settlement);
    });
    setDebtSummaries(Object.values(debtMap));
  }, [settlements, confirmedAssignments]);

  const handleAssignPayment = (payerId: string, debtorId: string) => {
    const payer = participants.find(p => p.id === payerId);
    const debtor = participants.find(p => p.id === debtorId);
    if (!payer || !debtor || payerId === debtorId) return;

    const newAssignment: ConsolidationAssignment = {
      payerId,
      payerName: payer.name,
      debtorId,
      debtorName: debtor.name,
      eventId: settlements[0]?.eventId || ''
    };

    const existingExactIndex = pendingAssignments.findIndex(
      a => a.payerId === payerId && a.debtorId === debtorId
    );
    let updated;
    if (existingExactIndex >= 0) {
      updated = pendingAssignments.filter((_, i) => i !== existingExactIndex);
    } else {
      const existingDebtorIndex = pendingAssignments.findIndex(a => a.debtorId === debtorId);
      if (existingDebtorIndex >= 0) {
        updated = pendingAssignments.map((a, i) => i === existingDebtorIndex ? newAssignment : a);
      } else {
        updated = [...pendingAssignments, newAssignment];
      }
    }
    setPendingAssignments(updated);
  };

  const getPendingPayer = (debtorId: string): string | null => {
    const a = pendingAssignments.find(a => a.debtorId === debtorId);
    return a ? a.payerId : null;
  };

  // Devuelve true si el participante ya actúa como pagador de alguien más
  const isPayerOfSomeone = (participantId: string): boolean => {
    return (
      pendingAssignments.some(a => a.payerId === participantId) ||
      confirmedAssignments.some(a => a.payerId === participantId)
    );
  };

  // Devuelve el nombre del deudor al que este participante ya está asignado como pagador
  const getDebtorNameForPayer = (payerId: string): string => {
    const pending = pendingAssignments.find(a => a.payerId === payerId);
    if (pending) {
      const debtor = participants.find(p => p.id === pending.debtorId);
      return debtor?.name ?? pending.debtorName ?? '?';
    }
    const confirmed = confirmedAssignments.find(a => a.payerId === payerId);
    if (confirmed) {
      const debtor = participants.find(p => p.id === confirmed.debtorId);
      return debtor?.name ?? confirmed.debtorName ?? '?';
    }
    return '?';
  };

  const toggleDebtorExpansion = (debtorId: string) => {
    setExpandedDebtor(prev => prev === debtorId ? null : debtorId);
  };

  const toggleUndo = (debtorId: string) => {
    setSelectedToUndo(prev => {
      const next = new Set(prev);
      if (next.has(debtorId)) {
        next.delete(debtorId);
      } else {
        next.add(debtorId);
      }
      return next;
    });
  };

  const toggleSelectAllUndo = () => {
    if (selectedToUndo.size === confirmedAssignments.length) {
      setSelectedToUndo(new Set());
    } else {
      setSelectedToUndo(new Set(confirmedAssignments.map(a => a.debtorId)));
    }
  };

  const handleApplyConsolidation = () => {
    const hasPending = pendingAssignments.length > 0;
    const hasUndo = selectedToUndo.size > 0;

    if (!hasPending && !hasUndo) {
      showAlert({
        type: 'warning',
        title: 'Sin cambios',
        message: 'No hay nuevas consolidaciones ni deshacimientos seleccionados.',
        buttons: [{ text: 'Entendido' }]
      });
      return;
    }

    const remaining = confirmedAssignments.filter(a => !selectedToUndo.has(a.debtorId));
    const finalAssignments = [...remaining, ...pendingAssignments];

    const addedCount = pendingAssignments.length;
    const removedCount = selectedToUndo.size;

    let msg = '';
    if (addedCount > 0 && removedCount > 0) {
      msg = `Se agregar\u00e1n ${addedCount} consolidaci\u00f3n${addedCount !== 1 ? 'es' : ''} y se deshacen ${removedCount}.`;
    } else if (addedCount > 0) {
      msg = `Se confirmar\u00e1n ${addedCount} consolidaci\u00f3n${addedCount !== 1 ? 'es' : ''}.`;
    } else {
      msg = `Se deshacen ${removedCount} consolidaci\u00f3n${removedCount !== 1 ? 'es' : ''} confirmada${removedCount !== 1 ? 's' : ''}.`;
    }

    showAlert({
      type: 'confirm',
      title: 'Confirmar cambios',
      message: msg,
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Aplicar', onPress: () => { onConsolidationChange(finalAssignments); onClose(); } }
      ]
    });
  };

  const renderAvatar = (name: string, colored: boolean, color: string) => {
    const initial = name.charAt(0).toUpperCase();
    return (
      <View style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colored ? color + '20' : theme.colors.surfaceVariant,
        borderWidth: 2,
        borderColor: colored ? color : theme.colors.outline,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
      }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: colored ? color : theme.colors.onSurfaceVariant }}>
          {initial}
        </Text>
      </View>
    );
  };

  const renderDebtorItem = (item: DebtSummary, index: number) => {
    const assignedPayerId = getPendingPayer(item.participantId);
    const assignedPayer = participants.find(p => p.id === assignedPayerId);
    const isExpanded = expandedDebtor === item.participantId;
    const blocked = isPayerOfSomeone(item.participantId);

    const handleDebtorCardPress = () => {
      if (blocked) {
        const blockedTitle = t('consolidationModal.blockedPayer.title');
        const blockedMsg = (t('consolidationModal.blockedPayer.message') as string).replace('{name}', item.participantName);
        const blockedOk = t('consolidationModal.blockedPayer.ok');
        showAlert({
          type: 'warning',
          title: blockedTitle,
          message: blockedMsg,
          buttons: [{ text: blockedOk, style: 'cancel' }],
        });
        return;
      }
      toggleDebtorExpansion(item.participantId);
    };

    return (
      <Card
        key={`debtor_${item.participantId}_${index}`}
        style={{
          marginBottom: 6,
          borderTopWidth: 4,
          borderTopColor: blocked ? theme.colors.outline : assignedPayerId ? ACCENT : theme.colors.outline,
          overflow: 'hidden',
          opacity: blocked ? 0.55 : 1,
        }}
      >
        <TouchableOpacity
          style={{ flexDirection: 'row', alignItems: 'center' }}
          onPress={handleDebtorCardPress}
          activeOpacity={blocked ? 0.9 : 0.7}
        >
          {renderAvatar(item.participantName, !!assignedPayerId && !blocked, blocked ? theme.colors.outline : ACCENT)}

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.onSurface }}>
                {item.participantName}
              </Text>
              {blocked && (
                <View style={{ backgroundColor: theme.colors.surfaceVariant, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: theme.colors.outline }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: theme.colors.onSurfaceVariant, letterSpacing: 0.4 }}>ES PAGADOR</Text>
                </View>
              )}
            </View>
            {blocked ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <MaterialCommunityIcons name="lock-outline" size={13} color={theme.colors.onSurfaceVariant} />
                <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>
                  {'Paga por '}{getDebtorNameForPayer(item.participantId)}
                </Text>
              </View>
            ) : assignedPayer ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <MaterialCommunityIcons name="check-circle" size={13} color={ACCENT} />
                <Text style={{ fontSize: 12, color: ACCENT, fontWeight: '600' }}>
                  {assignedPayer.name}{' pagará'}
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                <MaterialCommunityIcons name="clock-outline" size={13} color={theme.colors.onSurfaceVariant} />
                <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>
                  Sin asignar
                </Text>
              </View>
            )}
          </View>

          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <View style={{ backgroundColor: theme.colors.errorContainer, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: theme.colors.error }}>
                {currency}{item.totalDebt.toFixed(2)}
              </Text>
            </View>
            <MaterialCommunityIcons
              name={blocked ? 'lock-outline' : isExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={blocked ? theme.colors.onSurfaceVariant : theme.colors.onSurfaceVariant}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <>
            <View style={{ height: 1, backgroundColor: theme.colors.outlineVariant, marginTop: 14, marginBottom: 12 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <MaterialCommunityIcons name="account-arrow-right" size={16} color={ACCENT} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: theme.colors.onSurface }}>
                {'\u00bfQui\u00e9n pagar\u00e1 por '}{item.participantName}{'?'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {participants
                .filter(p =>
                  p.id !== item.participantId &&
                  !pendingAssignments.some(a => a.debtorId === p.id) &&
                  !confirmedAssignments.some(a => a.debtorId === p.id)
                )
                .map(participant => {
                  const isSelected = assignedPayerId === participant.id;
                  return (
                    <TouchableOpacity
                      key={participant.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: isSelected ? ACCENT : theme.colors.surfaceVariant,
                        borderWidth: 1.5,
                        borderColor: isSelected ? ACCENT : theme.colors.outline,
                      }}
                      onPress={() => handleAssignPayment(participant.id, item.participantId)}
                      activeOpacity={0.7}
                    >
                      {isSelected && (
                        <MaterialCommunityIcons name="check" size={14} color="#fff" />
                      )}
                      <Text style={{ fontSize: 13, fontWeight: isSelected ? '700' : '500', color: isSelected ? '#fff' : theme.colors.onSurfaceVariant }}>
                        {participant.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>

            <View style={{ backgroundColor: theme.colors.surfaceVariant + '50', borderRadius: 8, padding: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                <MaterialCommunityIcons name="format-list-bulleted" size={14} color={theme.colors.onSurfaceVariant} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: theme.colors.onSurfaceVariant, letterSpacing: 0.3 }}>
                  DEUDAS DETALLADAS
                </Text>
              </View>
              {item.settlements.map((settlement, sIdx) => (
                <View
                  key={`s_${settlement.id}_${sIdx}`}
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, borderBottomWidth: sIdx < item.settlements.length - 1 ? 1 : 0, borderBottomColor: theme.colors.outline + '30' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <MaterialCommunityIcons name="arrow-right" size={12} color={theme.colors.onSurfaceVariant} />
                    <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>
                      {settlement.toParticipantName}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, color: theme.colors.error, fontWeight: '700' }}>
                    {currency}{settlement.amount.toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </Card>
    );
  };

  const renderConfirmedItem = (item: ConsolidationAssignment, index: number) => {
    const isSelected = selectedToUndo.has(item.debtorId);
    return (
      <TouchableOpacity
        key={`confirmed_${item.debtorId}_${index}`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 10,
          paddingHorizontal: 4,
          borderBottomWidth: index < confirmedAssignments.length - 1 ? 1 : 0,
          borderBottomColor: theme.colors.outlineVariant,
          backgroundColor: isSelected ? ACCENT + '10' : 'transparent',
          borderRadius: 8,
          marginBottom: 2,
        }}
        onPress={() => toggleUndo(item.debtorId)}
        activeOpacity={0.7}
      >
        {/* Checkbox */}
        <View style={{
          width: 22,
          height: 22,
          borderRadius: 4,
          borderWidth: 2,
          borderColor: isSelected ? ACCENT : theme.colors.outline,
          backgroundColor: isSelected ? ACCENT : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}>
          {isSelected && <MaterialCommunityIcons name="check" size={13} color="#fff" />}
        </View>

        {/* Avatar deudor */}
        {renderAvatar(item.debtorName, !isSelected, ACCENT)}

        {/* Info */}
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '700',
            color: isSelected ? theme.colors.onSurfaceVariant : theme.colors.onSurface,
            textDecorationLine: isSelected ? 'line-through' : 'none',
          }}>
            {item.debtorName}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <MaterialCommunityIcons name="account-arrow-left" size={12} color={ACCENT} />
            <Text style={{ fontSize: 12, color: ACCENT, fontWeight: '600' }}>
              {item.payerName}{' pag\u00f3'}
            </Text>
          </View>
        </View>

        {isSelected ? (
          <View style={{ backgroundColor: ACCENT + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: ACCENT }}>DESHACER</Text>
          </View>
        ) : (
          <MaterialCommunityIcons name="check-circle" size={18} color={ACCENT} />
        )}
      </TouchableOpacity>
    );
  };

  const pendingCount = pendingAssignments.length;
  const totalDebtorsCount = new Set(settlements.map(s => s.fromParticipantId)).size;
  const filteredDebtors = debtSummaries.filter(d =>
    d.participantName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const undoCount = selectedToUndo.size;
  const hasChanges = pendingCount > 0 || undoCount > 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom', 'left', 'right']}>

        <HeaderBar
          title={t('consolidationModal.title')}
          titleAlignment="left"
          useDynamicColors={true}
          showLogo={true}
          showBackButton={false}
          isModal={true}
          showThemeToggle={true}
          showLanguageSelector={true}
          showHelp={true}
          showLogout={true}
          onHelpPress={() => { setCmTourStep(0); setCmTourVisible(true); }}
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Sección principal: instrucciones + buscador */}
          <View ref={cmCard1Ref} collapsable={false}>
          <Card style={{ borderTopWidth: 4, borderTopColor: ACCENT, overflow: 'hidden', marginBottom: 12 }}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}
              onPress={() => setShowInstructions(v => !v)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={ACCENT} />
              <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: theme.colors.onSurface }}>
                {t('consolidationModal.instructionsTitle')}
              </Text>
              {pendingCount > 0 && (
                <View style={{ backgroundColor: ACCENT, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>
                    {pendingCount}/{totalDebtorsCount}
                  </Text>
                </View>
              )}
              <MaterialCommunityIcons name={showInstructions ? 'chevron-up' : 'chevron-down'} size={20} color={theme.colors.onSurfaceVariant} />
            </TouchableOpacity>

            {showInstructions && (
              <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant }}>
                <Text style={{ fontSize: 13, lineHeight: 19, color: theme.colors.onSurfaceVariant }}>
                  {t('consolidationModal.description').replace('<1>', '').replace('</1>', '')}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 8, backgroundColor: ACCENT + '12', borderRadius: 8, padding: 8 }}>
                  <MaterialCommunityIcons name="information-outline" size={14} color={ACCENT} style={{ marginTop: 1 }} />
                  <Text style={{ fontSize: 12, lineHeight: 17, color: ACCENT, fontStyle: 'italic', flex: 1 }}>
                    {t('consolidationModal.example')}
                  </Text>
                </View>
              </View>
            )}

            <View style={{ height: 1, backgroundColor: theme.colors.outlineVariant, marginTop: 12, marginBottom: 10 }} />
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={'Buscar deudor...'}
            />
          </Card>
          </View>

          {/* Sección deudores */}
          <View ref={cmCard2Ref} collapsable={false}>
          <Card style={{ borderTopWidth: 4, borderTopColor: ACCENT, overflow: 'hidden', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <MaterialCommunityIcons name="account-group-outline" size={18} color={ACCENT} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.onSurface, flex: 1, letterSpacing: 0.3 }}>
                DEUDORES
              </Text>
              <View style={{ backgroundColor: ACCENT + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: ACCENT }}>
                  {filteredDebtors.length}
                </Text>
              </View>
            </View>

            {filteredDebtors.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <MaterialCommunityIcons name="check-all" size={40} color={theme.colors.onSurfaceVariant} />
                <Text style={{ fontSize: 13, color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
                  No hay deudores pendientes
                </Text>
              </View>
            ) : (
              filteredDebtors.map((item, index) => renderDebtorItem(item, index))
            )}
          </Card>
          </View>

          <View ref={cmCard3Ref} collapsable={false}>
          {confirmedAssignments.length > 0 && (
            <Card style={{ borderTopWidth: 4, borderTopColor: ACCENT, overflow: 'hidden', marginBottom: 12 }}>
              {/* Encabezado: parte izquierda colapsa, parte derecha es checkbox Todas o contador */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {/* Toque izquierdo: colapsar/expandir */}
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}
                  onPress={() => setShowConfirmed(v => !v)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="check-decagram-outline" size={18} color={ACCENT} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.onSurface, flex: 1, letterSpacing: 0.3 }}>
                    CONSOLIDADAS
                  </Text>
                  {undoCount > 0 && (
                    <View style={{ backgroundColor: ACCENT, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>
                        {undoCount} a deshacer
                      </Text>
                    </View>
                  )}
                  <MaterialCommunityIcons name={showConfirmed ? 'chevron-up' : 'chevron-down'} size={20} color={theme.colors.onSurfaceVariant} />
                </TouchableOpacity>

                {/* Derecha: contador N cuando contraído / checkbox Todas cuando expandido */}
                {!showConfirmed ? (
                  <View style={{ backgroundColor: ACCENT + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: ACCENT }}>
                      {confirmedAssignments.length}
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    onPress={toggleSelectAllUndo}
                    activeOpacity={0.7}
                  >
                    {/* Triestado: vacío / guión / check */}
                    <View style={{
                      width: 20,
                      height: 20,
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: selectedToUndo.size > 0 ? ACCENT : theme.colors.outline,
                      backgroundColor: selectedToUndo.size === confirmedAssignments.length ? ACCENT : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {selectedToUndo.size === confirmedAssignments.length && (
                        <MaterialCommunityIcons name="check" size={12} color="#fff" />
                      )}
                      {selectedToUndo.size > 0 && selectedToUndo.size < confirmedAssignments.length && (
                        <View style={{ width: 9, height: 2, backgroundColor: ACCENT, borderRadius: 1 }} />
                      )}
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: ACCENT }}>Todas</Text>
                  </TouchableOpacity>
                )}
              </View>

              {showConfirmed && (
                <>
                  <View style={{ height: 1, backgroundColor: theme.colors.outlineVariant, marginTop: 12, marginBottom: 8 }} />
                  {confirmedAssignments.map((item, index) => renderConfirmedItem(item, index))}
                </>
              )}
            </Card>
          )}
          </View>
        </ScrollView>
        <View ref={cmFooterRef} collapsable={false} style={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant }}>
          <TouchableOpacity
            style={{
              backgroundColor: hasChanges ? theme.colors.success : theme.colors.surfaceVariant,
              borderRadius: 12,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onPress={handleApplyConsolidation}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={20}
              color={hasChanges ? theme.colors.onSuccess : theme.colors.onSurfaceVariant}
            />
            <Text style={{
              fontSize: 16,
              fontWeight: '700',
              color: hasChanges ? theme.colors.onSuccess : theme.colors.onSurfaceVariant
            }}>
              {t('consolidationModal.applyButton') || 'Aplicar'}
            </Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>

      <TutorialOverlay
        visible={cmTourVisible}
        steps={[
          { ref: cmCard1Ref, titleKey: 'tour.consolidation.instructions.title', descKey: 'tour.consolidation.instructions.desc', popupPosition: 'below' },
          { ref: cmCard2Ref, titleKey: 'tour.consolidation.debtors.title',       descKey: 'tour.consolidation.debtors.desc',       popupPosition: 'below' },
          { ref: cmCard3Ref, titleKey: 'tour.consolidation.consolidated.title',  descKey: 'tour.consolidation.consolidated.desc',  popupPosition: 'below' },
          { ref: cmFooterRef, titleKey: 'tour.consolidation.apply.title',        descKey: 'tour.consolidation.apply.desc',         popupPosition: 'above' },
        ]}
        currentStep={cmTourStep}
        onNext={() => setCmTourStep(p => p + 1)}
        onPrev={() => setCmTourStep(p => p - 1)}
        onClose={() => { setCmTourVisible(false); setCmTourStep(0); }}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});