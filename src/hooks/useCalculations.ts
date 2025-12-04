import { useMemo } from 'react';
import { Expense, Participant, Split } from '../types';
import { CalculationService, Balance, Settlement, SplitCalculation } from '../services/calculations';

export const useCalculations = (
  participants: Participant[],
  expenses: Expense[],
  splits: Split[]
) => {
  // Calculate balances
  const balances = useMemo(() => {
    return CalculationService.calculateBalances(participants, expenses, splits);
  }, [participants, expenses, splits]);

  // Calculate optimal settlements
  const settlements = useMemo(() => {
    return CalculationService.calculateOptimalSettlements(balances);
  }, [balances]);

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