import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  currency
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [assignments, setAssignments] = useState<ConsolidationAssignment[]>([]);
  const [debtSummaries, setDebtSummaries] = useState<DebtSummary[]>([]);
  const [showInstructions, setShowInstructions] = useState(false);
  const [expandedDebtors, setExpandedDebtors] = useState<Set<string>>(new Set());

  // Calcular resumen de deudas por participante
  useEffect(() => {
    const debtMap: { [key: string]: DebtSummary } = {};
    
    settlements.forEach(settlement => {
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
  }, [settlements]);

  const handleAssignPayment = (payerId: string, debtorId: string) => {
    const payer = participants.find(p => p.id === payerId);
    const debtor = participants.find(p => p.id === debtorId);
    
    if (!payer || !debtor) return;

    const newAssignment: ConsolidationAssignment = {
      payerId,
      payerName: payer.name,
      debtorId,
      debtorName: debtor.name,
      eventId: settlements[0]?.eventId || ''
    };

    // Evitar duplicados y auto-asignaciones
    if (payerId === debtorId) return;
    
    const existingIndex = assignments.findIndex(
      a => a.payerId === payerId && a.debtorId === debtorId
    );

    let newAssignments;
    if (existingIndex >= 0) {
      // Remover si ya existe (toggle)
      newAssignments = assignments.filter((_, index) => index !== existingIndex);
    } else {
      newAssignments = [...assignments, newAssignment];
    }

    setAssignments(newAssignments);
  };

  const getAssignedPayer = (debtorId: string): string | null => {
    const assignment = assignments.find(a => a.debtorId === debtorId);
    return assignment ? assignment.payerId : null;
  };

  const toggleDebtorExpansion = (debtorId: string) => {
    const newExpanded = new Set(expandedDebtors);
    if (newExpanded.has(debtorId)) {
      newExpanded.delete(debtorId);
    } else {
      newExpanded.add(debtorId);
    }
    setExpandedDebtors(newExpanded);
  };

  const isDebtorExpanded = (debtorId: string) => expandedDebtors.has(debtorId);

  const handleApplyConsolidation = () => {
    if (assignments.length === 0) {
      Alert.alert(
        '⚠️ Sin Consolidaciones',
        'No has seleccionado ninguna consolidación. Selecciona quién pagará por otros participantes antes de continuar.',
        [{ text: 'Entendido', style: 'default' }]
      );
      return;
    }

    // Calcular estadísticas previas
    const affectedDebts = assignments.length;
    const totalDebtorsConsolidated = new Set(assignments.map(a => a.debtorId)).size;
    const totalPayers = new Set(assignments.map(a => a.payerId)).size;
    
    Alert.alert(
      '🔄 Confirmar Consolidación',
      `📋 Resumen de la consolidación:\n\n• ${affectedDebts} asignación(es) configurada(s)\n• ${totalDebtorsConsolidated} deudor(es) será(n) pagado(s) por otros\n• ${totalPayers} pagador(es) asumirá(n) deudas adicionales\n\n💡 Los pagos donde una persona se pagaría a sí misma se condonarán automáticamente.\n\n¿Confirmas aplicar esta consolidación?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aplicar',
          style: 'default',
          onPress: () => {
            onConsolidationChange(assignments);
            onClose();
          }
        }
      ]
    );
  };

  const renderDebtorItem = ({ item, index }: { item: DebtSummary; index: number }) => {
    const assignedPayerId = getAssignedPayer(item.participantId);
    const assignedPayer = participants.find(p => p.id === assignedPayerId);
    const isExpanded = isDebtorExpanded(item.participantId);

    return (
      <React.Fragment key={`debtor_fragment_${item.participantId}_${index}`}>
        <View style={[styles.debtorCard, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity 
          style={styles.debtorHeader}
          onPress={() => toggleDebtorExpansion(item.participantId)}
          activeOpacity={0.7}
        >
          <View style={styles.debtorInfo}>
            <Text style={[styles.debtorName, { color: theme.colors.onSurface }]}>
              {item.participantName}
            </Text>
            <Text style={[styles.debtorAmount, { color: theme.colors.error }]}>
              Debe: ${item.totalDebt.toFixed(2)} {currency}
            </Text>
            {assignedPayer && (
              <Text style={[styles.assignedIndicator, { color: theme.colors.primary }]}>
                📝 {assignedPayer.name} pagará por {item.participantName}
              </Text>
            )}
          </View>
          
          <View style={styles.expandIcon}>
            <MaterialCommunityIcons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={24} 
              color={theme.colors.onSurfaceVariant} 
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <>
            <View style={styles.payerSelector}>
              <Text style={[styles.selectorLabel, { color: theme.colors.onSurfaceVariant }]}>
                ¿Quién pagará por {item.participantName}?
              </Text>
              
              <View style={styles.payerButtons}>
                {participants
                  .filter(p => p.id !== item.participantId) // No puede pagarse a sí mismo
                  .map(participant => (
                    <TouchableOpacity
                      key={participant.id}
                      style={[
                        styles.payerButton,
                        {
                          backgroundColor: assignedPayerId === participant.id
                            ? theme.colors.primary
                            : theme.colors.surfaceVariant
                        }
                      ]}
                      onPress={() => handleAssignPayment(participant.id, item.participantId)}
                    >
                      <Text
                        style={[
                          styles.payerButtonText,
                          {
                            color: assignedPayerId === participant.id
                              ? theme.colors.onPrimary
                              : theme.colors.onSurfaceVariant
                          }
                        ]}
                      >
                        {participant.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>

            {/* Mostrar detalles de las liquidaciones */}
            <View style={styles.settlementDetails}>
              <Text style={[styles.detailsTitle, { color: theme.colors.onSurfaceVariant }]}>
                Liquidaciones:
              </Text>
              {item.settlements.map((settlement, index) => (
                <Text
                  key={`settlement_${settlement.id}_${index}_${item.participantId}`}
                  style={[styles.settlementDetail, { color: theme.colors.onSurfaceVariant }]}
                >
                  • ${settlement.amount.toFixed(2)} → {settlement.toParticipantName}
                </Text>
              ))}
            </View>
          </>
        )}
        </View>
        {index < debtSummaries.length - 1 && <View style={styles.separator} />}
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
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialCommunityIcons 
              name="close" 
              size={24} 
              color={theme.colors.onSurface} 
            />
          </TouchableOpacity>
          
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>
            Consolidar Pagos
          </Text>
          
          <TouchableOpacity 
            onPress={handleApplyConsolidation}
            style={[styles.applyButton, { backgroundColor: theme.colors.primary }]}
          >
            <Text style={[styles.applyButtonText, { color: theme.colors.onPrimary }]}>
              Aplicar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={styles.content}>
          <TouchableOpacity 
            style={styles.instructions}
            onPress={() => setShowInstructions(!showInstructions)}
            activeOpacity={0.7}
          >
            <View style={styles.instructionsHeader}>
              <MaterialCommunityIcons 
                name="lightbulb-on" 
                size={20} 
                color={theme.colors.primary} 
              />
              <Text style={[styles.instructionsTitle, { color: theme.colors.onSurfaceVariant }]}>
                💡 ¿Cómo funciona?
              </Text>
              <MaterialCommunityIcons 
                name={showInstructions ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={theme.colors.onSurfaceVariant} 
              />
            </View>
            {showInstructions && (
              <Text style={[styles.instructionsText, { color: theme.colors.onSurfaceVariant }]}>
                Selecciona quién pagará las deudas de otros participantes. Los pagos donde una persona se pagaría a sí misma se <Text style={{ fontWeight: 'bold', color: theme.colors.error }}>condonan automáticamente</Text>.{'\n\n'}
                <Text style={{ fontStyle: 'italic' }}>Ejemplo: Si Ana paga por Bob, pero Bob le debía a Ana, esa deuda se cancela.</Text>
              </Text>
            )}
          </TouchableOpacity>

          <FlatList
            data={debtSummaries}
            renderItem={renderDebtorItem}
            keyExtractor={(item, index) => `debtor_${item.participantId}_${index}`}
            scrollEnabled={false}

            removeClippedSubviews={false}
          />
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  applyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  instructions: {
    padding: 12,
    marginBottom: 16,
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
    fontWeight: '500',
    marginTop: 4,
  },
  expandIcon: {
    padding: 4,
  },
  debtorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  debtorAmount: {
    fontSize: 14,
    fontWeight: '500',
  },
  assignedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  assignedText: {
    fontSize: 12,
    fontWeight: '500',
  },
  payerSelector: {
    marginTop: 12,
    marginBottom: 12,
  },
  selectorLabel: {
    fontSize: 14,
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
    marginRight: 8,
    marginBottom: 8,
  },
  payerButtonText: {
    fontSize: 12,
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
    fontWeight: '600',
    marginBottom: 4,
  },
  settlementDetail: {
    fontSize: 11,
    marginLeft: 8,
  },
  separator: {
    height: 8,
  },
});