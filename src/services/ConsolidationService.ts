import { Settlement, ConsolidationAssignment, ConsolidatedSettlement } from '../types';

export class ConsolidationService {
  
  /**
   * Aplica consolidaciones a una lista de liquidaciones originales
   */
  static applyConsolidations(
    originalSettlements: Settlement[],
    assignments: ConsolidationAssignment[]
  ): ConsolidatedSettlement[] {
    
    if (assignments.length === 0) {
      // Si no hay asignaciones, retornar settlements originales
      return originalSettlements.map(s => ({
        ...s,
        isConsolidated: false
      }));
    }

    console.log('🔄 Applying consolidations:', assignments);
    console.log('📋 Original settlements:', originalSettlements);

    // VALIDACIÓN ANTI-DUPLICADOS
    const uniqueSettlements = new Map();
    const dedupedSettlements: Settlement[] = [];
    
    originalSettlements.forEach(settlement => {
      const key = `${settlement.fromParticipantId}_${settlement.toParticipantId}_${settlement.amount}`;
      if (!uniqueSettlements.has(key)) {
        uniqueSettlements.set(key, settlement);
        dedupedSettlements.push(settlement);
      } else {
        console.warn(`⚠️ DUPLICATE SETTLEMENT REMOVED: ${settlement.fromParticipantName} → ${settlement.toParticipantName} $${settlement.amount}`);
      }
    });

    if (dedupedSettlements.length !== originalSettlements.length) {
      console.warn(`🧹 DEDUPLICATION: ${originalSettlements.length} → ${dedupedSettlements.length} settlements`);
      console.log('📋 Deduplicated settlements:', dedupedSettlements);
    }

    // Usar settlements sin duplicados para el resto del procesamiento
    const settlementsToProcess = dedupedSettlements;

    // Crear mapa de asignaciones: deudorId -> payerId
    const assignmentMap: { [debtorId: string]: string } = {};
    assignments.forEach(assignment => {
      assignmentMap[assignment.debtorId] = assignment.payerId;
    });

    // Agrupar settlements por nuevo pagador
    const consolidatedGroups: { [payerId: string]: {
      settlements: Settlement[],
      totalsByCreditor: { [creditorId: string]: number }
    }} = {};

    settlementsToProcess.forEach(settlement => {
      // Determinar quién va a pagar realmente
      const actualPayerId = assignmentMap[settlement.fromParticipantId] || settlement.fromParticipantId;
      
      console.log(`🔍 Processing settlement: ${settlement.fromParticipantName} → ${settlement.toParticipantName} $${settlement.amount}`);
      console.log(`   Original payer: ${settlement.fromParticipantId}, Actual payer: ${actualPayerId}`);
      
      // Inicializar grupo si no existe
      if (!consolidatedGroups[actualPayerId]) {
        consolidatedGroups[actualPayerId] = {
          settlements: [],
          totalsByCreditor: {}
        };
      }

      // Agregar al grupo
      consolidatedGroups[actualPayerId].settlements.push(settlement);
      
      // Sumar montos por acreedor
      const creditorId = settlement.toParticipantId;
      if (!consolidatedGroups[actualPayerId].totalsByCreditor[creditorId]) {
        consolidatedGroups[actualPayerId].totalsByCreditor[creditorId] = 0;
      }
      consolidatedGroups[actualPayerId].totalsByCreditor[creditorId] += settlement.amount;
      
      console.log(`   Added to group ${actualPayerId}, creditor ${creditorId}, total now: ${consolidatedGroups[actualPayerId].totalsByCreditor[creditorId]}`);
    });

    console.log('📊 Consolidated groups:', consolidatedGroups);

    // Generar nuevas liquidaciones consolidadas
    const consolidatedSettlements: ConsolidatedSettlement[] = [];

    Object.keys(consolidatedGroups).forEach(payerId => {
      const group = consolidatedGroups[payerId];
      const payerName = this.getParticipantName(payerId, settlementsToProcess, assignments);

      // Crear una liquidación consolidada por cada acreedor
      Object.keys(group.totalsByCreditor).forEach(creditorId => {
        // 🚫 CONDONACIÓN AUTOMÁTICA: Si el pagador y acreedor son la misma persona, anular el pago
        if (payerId === creditorId) {
          const totalAmount = group.totalsByCreditor[creditorId];
          const contributingSettlements = group.settlements.filter(s => s.toParticipantId === creditorId);
          
          console.log(`🚫 PAGO CONDONADO: ${payerName} → ${payerName} $${totalAmount} (no tiene sentido pagarse a sí mismo)`);
          console.log(`   Liquidaciones anuladas (${contributingSettlements.length}):`, 
            contributingSettlements.map(s => `${s.fromParticipantName} $${s.amount}`).join(', '));
          return; // Saltar esta liquidación
        }

        const totalAmount = group.totalsByCreditor[creditorId];
        const creditorName = this.getCreditorName(creditorId, settlementsToProcess);
        
        console.log(`💰 Creating consolidated settlement: ${payerName} → ${creditorName} $${totalAmount}`);
        
        // Obtener settlements originales que contribuyen a esta consolidación
        const contributingSettlements = group.settlements.filter(
          s => s.toParticipantId === creditorId
        );
        
        console.log(`   Contributing settlements (${contributingSettlements.length}):`, 
          contributingSettlements.map(s => `${s.fromParticipantName} $${s.amount}`).join(', '));

        const consolidatedSettlement: ConsolidatedSettlement = {
          id: `consolidated_${payerId}_to_${creditorId}_${Math.random().toString(36).substr(2, 9)}`,
          eventId: settlementsToProcess[0]?.eventId || '',
          fromParticipantId: payerId,
          fromParticipantName: payerName,
          toParticipantId: creditorId,
          toParticipantName: creditorName,
          amount: Math.round(totalAmount * 100) / 100, // Redondear a 2 decimales
          isPaid: false, // Las consolidadas inician como no pagadas
          isConsolidated: true,
          originalSettlements: contributingSettlements,
          consolidationAssignments: assignments.filter(a => 
            contributingSettlements.some(cs => cs.fromParticipantId === a.debtorId)
          ),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        consolidatedSettlements.push(consolidatedSettlement);
      });
    });

    // Contar liquidaciones condonadas (pagador = acreedor)
    const totalPossibleSettlements = Object.values(consolidatedGroups).reduce(
      (total, group) => total + Object.keys(group.totalsByCreditor).length, 0
    );
    const forgivenCount = totalPossibleSettlements - consolidatedSettlements.length;
    
    // Calcular estadísticas detalladas
    const originalAmount = settlementsToProcess.reduce((sum, s) => sum + s.amount, 0);
    const consolidatedAmount = consolidatedSettlements.reduce((sum, s) => sum + s.amount, 0);
    const forgivenAmount = originalAmount - consolidatedAmount;
    const efficiencyGain = settlementsToProcess.length - consolidatedSettlements.length;
    
    console.log('✅ Final consolidated settlements:', consolidatedSettlements);
    console.log(`📊 RESUMEN DETALLADO:`);
    console.log(`   💰 Monto original: $${originalAmount}`);
    console.log(`   💰 Monto consolidado: $${consolidatedAmount}`);
    console.log(`   🚫 Monto condonado: $${forgivenAmount}`);
    console.log(`   📋 Liquidaciones: ${settlementsToProcess.length} → ${consolidatedSettlements.length}`);
    console.log(`   ⚡ Eficiencia: ${efficiencyGain} ${efficiencyGain === 1 ? 'pago simplificado' : 'pagos simplificados'}`);
    console.log(`   🎯 ${forgivenCount} condonación(es) automática(s) (pagos a sí mismo)`);
    
    return consolidatedSettlements;
  }

  /**
   * Obtiene el nombre del participante pagador
   */
  private static getParticipantName(
    payerId: string, 
    originalSettlements: Settlement[], 
    assignments: ConsolidationAssignment[]
  ): string {
    // Buscar en asignaciones primero
    const assignment = assignments.find(a => a.payerId === payerId);
    if (assignment) return assignment.payerName;

    // Buscar en settlements originales
    const settlement = originalSettlements.find(s => s.fromParticipantId === payerId);
    return settlement?.fromParticipantName || 'Unknown';
  }

  /**
   * Obtiene el nombre del acreedor
   */
  private static getCreditorName(creditorId: string, originalSettlements: Settlement[]): string {
    const settlement = originalSettlements.find(s => s.toParticipantId === creditorId);
    return settlement?.toParticipantName || 'Unknown';
  }

  /**
   * Genera resumen de la consolidación para mostrar al usuario
   */
  static generateConsolidationSummary(
    originalSettlements: Settlement[],
    consolidatedSettlements: ConsolidatedSettlement[]
  ): {
    originalCount: number;
    consolidatedCount: number;
    totalAmount: number;
    changes: Array<{
      type: 'consolidated' | 'unchanged';
      description: string;
      amount: number;
    }>;
  } {
    const originalCount = originalSettlements.length;
    const consolidatedCount = consolidatedSettlements.length;
    const totalAmount = originalSettlements.reduce((sum, s) => sum + s.amount, 0);

    const changes: Array<{
      type: 'consolidated' | 'unchanged';
      description: string;
      amount: number;
    }> = [];

    consolidatedSettlements.forEach(cs => {
      if (cs.isConsolidated && cs.originalSettlements) {
        if (cs.originalSettlements.length > 1) {
          changes.push({
            type: 'consolidated',
            description: `${cs.fromParticipantName} → ${cs.toParticipantName} (${cs.originalSettlements.length} pagos consolidados)`,
            amount: cs.amount
          });
        } else {
          changes.push({
            type: 'unchanged',
            description: `${cs.fromParticipantName} → ${cs.toParticipantName}`,
            amount: cs.amount
          });
        }
      }
    });

    return {
      originalCount,
      consolidatedCount,
      totalAmount,
      changes
    };
  }

  /**
   * Valida si las asignaciones son coherentes
   */
  static validateConsolidations(
    assignments: ConsolidationAssignment[],
    originalSettlements: Settlement[]
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Verificar loops (A paga por B, B paga por A)
    assignments.forEach(assignment => {
      const reverseAssignment = assignments.find(a => 
        a.payerId === assignment.debtorId && a.debtorId === assignment.payerId
      );
      
      if (reverseAssignment) {
        errors.push(`Loop detectado: ${assignment.payerName} y ${assignment.debtorName} se pagan mutuamente`);
      }
    });

    // Verificar que los participantes existan en las liquidaciones
    const participantIds = new Set([
      ...originalSettlements.map(s => s.fromParticipantId),
      ...originalSettlements.map(s => s.toParticipantId)
    ]);

    assignments.forEach(assignment => {
      if (!participantIds.has(assignment.payerId)) {
        errors.push(`Pagador ${assignment.payerName} no encontrado en liquidaciones`);
      }
      if (!participantIds.has(assignment.debtorId)) {
        errors.push(`Deudor ${assignment.debtorName} no encontrado en liquidaciones`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}