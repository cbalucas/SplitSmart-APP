import { useMemo } from 'react';
import { Expense, Participant, Split, Payment } from '../types';
import { CalculationService, Balance, Settlement, SplitCalculation } from '../services/calculations';

export const useCalculations = (
  participants: Participant[],
  expenses: Expense[],
  splits: Split[],
  payments: Payment[] = [], // Payments legacy para compatibilidad
  dbSettlements: any[] = [], // Settlements con pagos incluidos desde la DB
  eventStatus: 'active' | 'completed' | 'archived' = 'active' // Estado del evento
) => {
  // Convert paid settlements to Payment objects and combine with legacy payments
  const allPayments = useMemo(() => {
    const settlementPayments: Payment[] = dbSettlements
      .filter(settlement => settlement.isPaid)
      .map(settlement => ({
        id: settlement.id,
        eventId: settlement.eventId,
        fromParticipantId: settlement.fromParticipantId,
        fromParticipantName: settlement.fromParticipantName,
        toParticipantId: settlement.toParticipantId,
        toParticipantName: settlement.toParticipantName,
        amount: settlement.amount,
        date: settlement.createdAt || new Date().toISOString(),
        isConfirmed: true,
        createdAt: settlement.createdAt || new Date().toISOString(),
        updatedAt: settlement.updatedAt || new Date().toISOString()
      }));
    
    return [...payments, ...settlementPayments];
  }, [payments, dbSettlements]);

  // Calculate balances considering both legacy payments AND paid settlements
  const balances = useMemo(() => {
    return CalculationService.calculateBalancesWithPayments(participants, expenses, splits, allPayments);
  }, [participants, expenses, splits, allPayments]);

  // Calculate settlements based on event status
  const settlements = useMemo(() => {
    switch (eventStatus) {
      case 'active':
        // En estado activo: calcular settlements dinámicamente
        return CalculationService.calculateOptimalSettlements(balances);
      
      case 'completed':
      case 'archived':
        // En estado completado/archivado: usar settlements fijos de la BD
        return dbSettlements
          .filter(s => !s.isPaid) // Solo mostrar no pagados como settlements pendientes
          .map(s => ({
            fromParticipantId: s.fromParticipantId,
            fromParticipantName: s.fromParticipantName,
            toParticipantId: s.toParticipantId,
            toParticipantName: s.toParticipantName,
            amount: s.amount
          }));
      
      default:
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