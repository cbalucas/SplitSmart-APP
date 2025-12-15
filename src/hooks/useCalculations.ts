import { useMemo } from 'react';
import { Expense, Participant, Split, Payment } from '../types';
import { CalculationService, Balance, Settlement, SplitCalculation } from '../services/calculations';

export const useCalculations = (
  participants: Participant[],
  expenses: Expense[],
  splits: Split[],
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
      balances: balances.length,
      dbSettlements: dbSettlements.length,
      eventStatus
    });

    switch (eventStatus) {
      case 'active':
        // En estado activo: calcular settlements dinámicamente
        const calculated = CalculationService.calculateOptimalSettlements(balances);
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