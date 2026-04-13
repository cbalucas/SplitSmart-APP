import { useMemo } from 'react';
import { Expense, Participant, Split, Payment } from '../types';
import { CalculationService, Balance, Settlement, SplitCalculation } from '../services/calculations';

export const useCalculations = (
  participants: Participant[],
  expenses: Expense[],
  splits: Split[],
  payments: Payment[] = [], // Payments (legacy, para compatibilidad)
  dbSettlements: any[] = [], // Settlements desde la DB (incluyendo pagados y no pagados)
  eventStatus: 'active' | 'completed' | 'archived' = 'active' // Estado del evento
) => {
  // Extraer pagos realizados desde settlements pagados
  const paidSettlements = useMemo(() => {
    return dbSettlements.filter(settlement => settlement.isPaid);
  }, [dbSettlements]);

  // Calculate balances considering paid settlements
  const balances = useMemo(() => {
    return CalculationService.calculateBalancesWithSettlements(participants, expenses, splits, paidSettlements);
  }, [participants, expenses, splits, paidSettlements]);

  // Calculate settlements based on event status
  const settlements = useMemo(() => {
    // 🔍 DEBUG: Log calculation inputs
    console.log('🔍 useCalculations - inputs:', {
      participants: participants.length,
      expenses: expenses.length,
      splits: splits.length,
      payments: payments.length,
      balances: balances.length,
      dbSettlements: dbSettlements.length,
      eventStatus,
      eventStatusType: typeof eventStatus
    });

    // 🔍 DEBUG: Log detailed expenses info
    console.log('🔍 useCalculations - expenses detail:', expenses.map(e => ({
      id: e.id,
      amount: e.amount,
      payerId: e.payerId,
      payerName: e.payerName
    })));

    // 🔍 DEBUG: Log balances
    console.log('🔍 useCalculations - balances:', balances.map(b => ({
      participantId: b.participantId,
      balance: b.balance,
      totalPaid: b.totalPaid,
      totalOwed: b.totalOwed
    })));

    switch (eventStatus) {
      case 'active':
        // Consolidar balances de participantes secundarios en su primario
        // antes de calcular las liquidaciones (los secundarios no aparecen como from/to)
        const secondaryMap: Record<string, string> = {};
        participants.forEach(p => {
          if ((p as any).parentParticipantId) {
            secondaryMap[p.id] = (p as any).parentParticipantId;
          }
        });

        let consolidatedBalances: typeof balances;
        if (Object.keys(secondaryMap).length > 0) {
          // Copia mutable de los balances de primarios
          consolidatedBalances = balances
            .filter(b => !secondaryMap[b.participantId])
            .map(b => ({ ...b }));
          // Acumular balances de secundarios en su primario
          balances.forEach(b => {
            const primaryId = secondaryMap[b.participantId];
            if (primaryId) {
              const primary = consolidatedBalances.find(cb => cb.participantId === primaryId);
              if (primary) {
                (primary as any).totalPaid  = ((primary as any).totalPaid  || 0) + ((b as any).totalPaid  || 0);
                (primary as any).totalOwed  = ((primary as any).totalOwed  || 0) + ((b as any).totalOwed  || 0);
                primary.balance             = (primary.balance             || 0) + (b.balance             || 0);
              }
            }
          });
        } else {
          consolidatedBalances = balances;
        }

        // En estado activo: calcular settlements dinámicamente
        const calculated = CalculationService.calculateOptimalSettlements(consolidatedBalances);
        console.log('🔍 useCalculations - calculated settlements:', calculated.length);
        return calculated;
      
      case 'completed':
      case 'archived':
        // En estado completado/archivado: usar settlements fijos de la BD
        const fromDb = dbSettlements
          .filter(s => !s.isPaid) // Solo mostrar no pagados como settlements pendientes
          .map(s => ({
            fromParticipantId: s.fromParticipantId,
            fromParticipantName: s.fromParticipantName,
            toParticipantId: s.toParticipantId,
            toParticipantName: s.toParticipantName,
            amount: s.amount
          }));
        console.log('🔍 useCalculations - settlements from DB:', fromDb.length);
        return fromDb;
      
      default:
        console.log('🔍 useCalculations - no settlements (invalid status)');
        return [];
    }
  }, [balances, dbSettlements, eventStatus]);

  // Calculate event statistics
  const eventStats = useMemo(() => {
    return CalculationService.calculateEventStats(participants, expenses, splits);
  }, [participants, expenses, splits]);

  // Helper functions for split calculations
  const calculateEqualSplit = (expenseAmount: number, selectedParticipants: Participant[]) => {
    return CalculationService.calculateEqualSplit(expenseAmount, selectedParticipants);
  };

  const calculatePercentageSplit = (
    expenseAmount: number,
    participantPercentages: { participantId: string; participantName: string; percentage: number }[]
  ) => {
    return CalculationService.calculatePercentageSplit(expenseAmount, participantPercentages);
  };

  const calculateFixedSplit = (
    expenseAmount: number,
    participantAmounts: { participantId: string; participantName: string; amount: number }[]
  ) => {
    return CalculationService.calculateFixedSplit(expenseAmount, participantAmounts);
  };

  const calculateCustomSplit = (
    expenseAmount: number,
    splitConfig: {
      participantId: string;
      participantName: string;
      type: 'equal' | 'fixed' | 'percentage';
      value?: number;
    }[]
  ) => {
    return CalculationService.calculateCustomSplit(expenseAmount, splitConfig);
  };

  const validateSplit = (expenseAmount: number, splitCalculations: SplitCalculation[]) => {
    return CalculationService.validateSplit(expenseAmount, splitCalculations);
  };

  return {
    balances,
    settlements,
    eventStats,
    calculateEqualSplit,
    calculatePercentageSplit,
    calculateFixedSplit,
    calculateCustomSplit,
    validateSplit
  };
};

export default useCalculations;