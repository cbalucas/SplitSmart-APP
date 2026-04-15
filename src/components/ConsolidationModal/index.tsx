import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showAlert } from '../../services/alertService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import HeaderBar from '../HeaderBar';
import SearchBar from '../SearchBar';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Settlement, ConsolidationAssignment, Participant } from '../../types';

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
  const [assignments, setAssignments] = useState<ConsolidationAssignment[]>([]);
  const [debtSummaries, setDebtSummaries] = useState<DebtSummary[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [expandedDebtors, setExpandedDebtors] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Cargar consolidaciones existentes cuando el modal se abre
  useEffect(() => {
    if (visible && existingAssignments.length > 0) {
      console.log('🔄 Cargando consolidaciones existentes:', existingAssignments);
      setAssignments(existingAssignments);
    } else if (visible) {
      // Reset si no hay consolidaciones existentes
      setAssignments([]);
    }
    // Contraer todo y limpiar búsqueda al abrir
    setExpandedDebtors(null);
    setSearchQuery('');
  }, [visible, existingAssignments]);

  // Calcular resumen de deudas por participante
  useEffect(() => {
    const debtMap: { [key: string]: DebtSummary } = {};
    
    // Obtener IDs de participantes que ya son pagadores (para excluirlos como deudores)
    const existingPayerIds = new Set(assignments.map(a => a.payerId));
    
    settlements.forEach(settlement => {
      // Excluir a los participantes que ya son pagadores activos de otras personas
      if (existingPayerIds.has(settlement.fromParticipantId)) {
        console.log(`🚫 Excluyendo ${settlement.fromParticipantName} como deudor porque ya es pagador de otra persona`);
        return;
      }
      
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

    console.log('📋 Assignments:', assignments);
    console.log('👥 ExistingPayerIds:', Array.from(existingPayerIds));
    console.log('💰 DebtSummaries resultado:', Object.values(debtMap));
    setDebtSummaries(Object.values(debtMap));
  }, [settlements, assignments]);

  const handleAssignPayment = (payerId: string, debtorId: string) => {
    const payer = participants.find(p => p.id === payerId);
    const debtor = participants.find(p => p.id === debtorId);
    
    if (!payer || !debtor) return;

    // Evitar auto-asignaciones
    if (payerId === debtorId) return;

    const newAssignment: ConsolidationAssignment = {
      payerId,
      payerName: payer.name,
      debtorId,
      debtorName: debtor.name,
      eventId: settlements[0]?.eventId || ''
    };

    // Verificar si ya existe exactamente la misma asignación
    const existingExactIndex = assignments.findIndex(
      a => a.payerId === payerId && a.debtorId === debtorId
    );

    let newAssignments;
    if (existingExactIndex >= 0) {
      // Si es exactamente la misma asignación, remover (toggle)
      newAssignments = assignments.filter((_, index) => index !== existingExactIndex);
    } else {
      // Si el deudor ya tiene un pagador diferente, remover la asignación anterior
      const existingDebtorIndex = assignments.findIndex(a => a.debtorId === debtorId);
      
      if (existingDebtorIndex >= 0) {
        // Reemplazar la asignación existente del deudor
        newAssignments = assignments.map((assignment, index) => 
          index === existingDebtorIndex ? newAssignment : assignment
        );
      } else {
        // Agregar nueva asignación
        newAssignments = [...assignments, newAssignment];
      }
    }

    setAssignments(newAssignments);
  };

  const getAssignedPayer = (debtorId: string): string | null => {
    const assignment = assignments.find(a => a.debtorId === debtorId);
    return assignment ? assignment.payerId : null;
  };

  const toggleDebtorExpansion = (debtorId: string) => {
    setExpandedDebtors(prev => prev === debtorId ? null : debtorId);
  };

  const isDebtorExpanded = (debtorId: string) => expandedDebtors === debtorId;

  const handleApplyConsolidation = () => {
    if (assignments.length === 0) {
      showAlert({ type: 'warning', title: '⚠️ Sin Consolidaciones', message: 'No has seleccionado ninguna consolidación. Selecciona quién pagará por otros participantes antes de continuar.', buttons: [{ text: 'Entendido' }] });
      return;
    }

    // Calcular estadísticas previas
    const affectedDebts = assignments.length;
    const totalDebtorsConsolidated = new Set(assignments.map(a => a.debtorId)).size;
    const totalPayers = new Set(assignments.map(a => a.payerId)).size;
    
    showAlert({
      type: 'confirm',
      title: t('consolidationModal.confirmation.title'),
      message: t('consolidationModal.confirmation.summary', {
        assignments: affectedDebts,
        debtors: totalDebtorsConsolidated,
        payers: totalPayers
      }),
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aplicar',
          onPress: () => {
            onConsolidationChange(assignments);
            onClose();
          }
        }
      ]
    });
  };

  const renderDebtorItem = ({ item, index }: { item: DebtSummary; index: number }) => {
    const assignedPayerId = getAssignedPayer(item.participantId);
    const assignedPayer = participants.find(p => p.id === assignedPayerId);
    const isExpanded = isDebtorExpanded(item.participantId);

    return (
      <React.Fragment key={`debtor_fragment_${item.participantId}_${index}`}>
        <View style={[styles.debtorCard, {
          backgroundColor: theme.colors.surface,
          borderLeftWidth: 3,
          borderLeftColor: assignedPayerId ? theme.colors.success : theme.colors.outline,
        }]}>
          {/* Header fila */}
          <TouchableOpacity
            style={styles.debtorHeader}
            onPress={() => toggleDebtorExpansion(item.participantId)}
            activeOpacity={0.7}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
              <MaterialCommunityIcons
                name={assignedPayerId ? 'check-circle' : 'account-clock'}
                size={22}
                color={assignedPayerId ? theme.colors.success : theme.colors.onSurfaceVariant}
              />
              <View style={{ flex: 1 }}>
                <Text style={[styles.debtorName, { color: theme.colors.onSurface }]}>
                  {item.participantName}
                </Text>
                {assignedPayer ? (
                  <Text style={{ fontSize: 12, color: theme.colors.success, fontWeight: '600', marginTop: 2 }}>
                    ✓ {assignedPayer.name} pagará
                  </Text>
                ) : (
                  <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                    Sin asignar
                  </Text>
                )}
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ backgroundColor: theme.colors.errorContainer, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.colors.onErrorContainer }}>
                  ${item.totalDebt.toFixed(2)}
                </Text>
              </View>
              <MaterialCommunityIcons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </View>
          </TouchableOpacity>

          {/* Contenido expandible */}
          {isExpanded && (
            <>
              <View style={{ height: 1, backgroundColor: theme.colors.outlineVariant, marginVertical: 12 }} />

              {/* Selector de pagador */}
              <Text style={{ fontSize: 13, color: theme.colors.onSurfaceVariant, fontWeight: '500', marginBottom: 8 }}>
                ¿Quién pagará por {item.participantName}?
              </Text>
              <View style={styles.payerButtons}>
                {participants
                  .filter(p => {
                    if (p.id === item.participantId) return false;
                    const hasDebtorAssigned = assignments.some(a => a.debtorId === p.id);
                    if (hasDebtorAssigned) return false;
                    return true;
                  })
                  .map(participant => (
                    <TouchableOpacity
                      key={participant.id}
                      style={[styles.payerButton, {
                        backgroundColor: assignedPayerId === participant.id
                          ? theme.colors.primary
                          : theme.colors.surfaceVariant,
                        borderWidth: 1,
                        borderColor: assignedPayerId === participant.id
                          ? theme.colors.primary
                          : theme.colors.outline,
                      }]}
                      onPress={() => handleAssignPayment(participant.id, item.participantId)}
                    >
                      {assignedPayerId === participant.id && (
                        <MaterialCommunityIcons name="check" size={12} color={theme.colors.onPrimary} />
                      )}
                      <Text style={[styles.payerButtonText, {
                        color: assignedPayerId === participant.id
                          ? theme.colors.onPrimary
                          : theme.colors.onSurfaceVariant
                      }]}>
                        {participant.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>

              {/* Detalles de liquidaciones */}
              <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.colors.outlineVariant }}>
                <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant, fontWeight: '600', marginBottom: 6 }}>
                  Deudas detalladas:
                </Text>
                {item.settlements.map((settlement, sIdx) => (
                  <View
                    key={`settlement_${settlement.id}_${sIdx}_${item.participantId}`}
                    style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 }}
                  >
                    <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>
                      → {settlement.toParticipantName}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.colors.error, fontWeight: '600' }}>
                      ${settlement.amount.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
        {index < debtSummaries.length - 1 && <View style={{ height: 8 }} />}
      </React.Fragment>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom', 'left', 'right']}>
        {/* Header */}
        <HeaderBar
          title={t('consolidationModal.title')}
          titleAlignment="left"
          useDynamicColors={true}
          showLogo={true}
          showBackButton={false}
          isModal={true}
        />

        {/* Cabecera fija: instrucciones + buscador */}
        <View style={[styles.fixedHeader, { borderBottomColor: theme.colors.outlineVariant }]}>
          <TouchableOpacity 
            style={[styles.instructions, { backgroundColor: theme.colors.primaryContainer + '40', borderWidth: 1, borderColor: theme.colors.primary + '30' }]}
            onPress={() => setShowInstructions(!showInstructions)}
            activeOpacity={0.7}
          >
            <View style={styles.instructionsHeader}>
              <MaterialCommunityIcons 
                name="lightbulb-on" 
                size={20} 
                color={theme.colors.primary} 
              />
              <Text style={[styles.instructionsTitle, { color: theme.colors.onSurface }]}>
                {t('consolidationModal.instructionsTitle')}
              </Text>
              <MaterialCommunityIcons 
                name={showInstructions ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.colors.onSurfaceVariant} 
              />
            </View>
            {showInstructions && (
              <View style={{ marginTop: 10 }}>
                <Text style={[styles.instructionsText, { color: theme.colors.onSurfaceVariant }]}>
                  {t('consolidationModal.description').replace('<1>', '').replace('</1>', '')}
                </Text>
                <Text style={[styles.instructionsText, { color: theme.colors.onSurfaceVariant, fontStyle: 'italic', marginTop: 6 }]}>
                  {t('consolidationModal.example')}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Buscador de deudores — solo visible si hay más de 2 */}
          {debtSummaries.length > 2 && (
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar deudor..."
              style={{ marginTop: 8 }}
            />
          )}
        </View>

        {/* Lista scrolleable */}
        <ScrollView style={styles.content}>
          <FlatList
            data={debtSummaries.filter(d => d.participantName.toLowerCase().includes(searchQuery.toLowerCase()))}
            renderItem={renderDebtorItem}
            keyExtractor={(item, index) => `debtor_${item.participantId}_${index}`}
            scrollEnabled={false}
            removeClippedSubviews={false}
          />
        </ScrollView>

        {/* Botón Aplicar fijo en la parte inferior */}
        <TouchableOpacity
          style={[styles.applyButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleApplyConsolidation}
          activeOpacity={0.8}
        >
          <Text style={[styles.applyButtonText, { color: theme.colors.onPrimary }]}>
            {t('consolidationModal.applyButton') || 'Aplicar'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  applyButton: {
    marginTop: 8,
    marginBottom: 16,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  fixedHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  instructions: {
    padding: 12,
    marginBottom: 0,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  instructionsTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
  instructionsText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
  },
  debtorCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  debtorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  debtorInfo: {
    flex: 1,
  },
  assignedIndicator: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  expandIcon: {
    padding: 4,
  },
  debtorName: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  debtorAmount: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  assignedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  assignedText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  payerSelector: {
    marginTop: 12,
    marginBottom: 12,
  },
  selectorLabel: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  payerButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  payerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  payerButtonText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  settlementDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  detailsTitle: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settlementDetail: {
    fontSize: 11,
    lineHeight: 16,
    marginLeft: 8,
  },
  separator: {
    height: 8,
  },
});