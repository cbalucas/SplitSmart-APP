import { Expense, Participant, Split, Payment } from '../types';

export interface Balance {
  participantId: string;
  participantName: string;
  totalPaid: number;
  totalOwed: number;
  balance: number; // positive = owes money, negative = is owed money
}

export interface Settlement {
  fromParticipantId: string;
  fromParticipantName: string;
  toParticipantId: string;
  toParticipantName: string;
  amount: number;
}

export interface SplitCalculation {
  participantId: string;
  participantName: string;
  amount: number;
  percentage?: number;
}

export class CalculationService {
  
  /**
   * Calculate balances for all participants in an event
   */
  static calculateBalances(
    participants: Participant[],
    expenses: Expense[],
    splits: Split[]
  ): Balance[] {
    return this.calculateBalancesWithPayments(participants, expenses, splits, []);
  }

  /**
   * Calculate balances for all participants considering confirmed payments
   */
  static calculateBalancesWithPayments(
    participants: Participant[],
    expenses: Expense[],
    splits: Split[],
    payments: Payment[]
  ): Balance[] {
    const balances: { [participantId: string]: Balance } = {};

    // Initialize balances for all participants
    participants.forEach(participant => {
      balances[participant.id] = {
        participantId: participant.id,
        participantName: participant.name,
        totalPaid: 0,
        totalOwed: 0,
        balance: 0
      };
    });

    // Calculate total paid by each participant (from expenses)
    expenses.forEach(expense => {
      if (balances[expense.payerId]) {
        balances[expense.payerId].totalPaid += expense.amount;
      }
    });

    // Calculate total owed by each participant based on splits
    splits.forEach(split => {
      if (balances[split.participantId]) {
        balances[split.participantId].totalOwed += split.amount;
      }
    });

    // Calculate net balance (positive = owes money, negative = is owed money)
    Object.values(balances).forEach(balance => {
      balance.balance = balance.totalOwed - balance.totalPaid;
    });

    // Apply confirmed payments to adjust balances
    payments.filter(p => p.isConfirmed).forEach(payment => {
      if (balances[payment.fromParticipantId] && balances[payment.toParticipantId]) {
        // The payer's balance decreases (they owe less)
        balances[payment.fromParticipantId].balance -= payment.amount;
        // The receiver's balance increases (they are owed less)
        balances[payment.toParticipantId].balance += payment.amount;
      }
    });

    return Object.values(balances);
  }

  /**
   * Calculate optimal settlements to minimize number of transactions
   * Uses a greedy algorithm to match debtors with creditors
   */
  static calculateOptimalSettlements(balances: Balance[]): Settlement[] {
    const settlements: Settlement[] = [];
    
    // Separate debtors (positive balance) and creditors (negative balance)
    const debtors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);
    const creditors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);
    
    let debtorIndex = 0;
    let creditorIndex = 0;
    
    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const debtor = debtors[debtorIndex];
      const creditor = creditors[creditorIndex];
      
      const settlementAmount = Math.min(debtor.balance, Math.abs(creditor.balance));
      
      if (settlementAmount > 0.01) {
        settlements.push({
          fromParticipantId: debtor.participantId,
          fromParticipantName: debtor.participantName,
          toParticipantId: creditor.participantId,
          toParticipantName: creditor.participantName,
          amount: parseFloat(settlementAmount.toFixed(2))
        });
        
        debtor.balance -= settlementAmount;
        creditor.balance += settlementAmount;
      }
      
      if (debtor.balance <= 0.01) debtorIndex++;
      if (creditor.balance >= -0.01) creditorIndex++;
    }
    
    return settlements;
  }

  /**
   * Calculate equal split for an expense
   * Simple division between N participants
   */
  static calculateEqualSplit(
    expenseAmount: number,
    participants: Participant[]
  ): SplitCalculation[] {
    const amountPerPerson = expenseAmount / participants.length;
    
    return participants.map(participant => {
      return {
        participantId: participant.id,
        participantName: participant.name,
        amount: parseFloat(amountPerPerson.toFixed(2)),
        percentage: parseFloat((100 / participants.length).toFixed(2))
      };
    });
  }

  /**
   * Calculate percentage-based split for an expense
   */
  static calculatePercentageSplit(
    expenseAmount: number,
    participantPercentages: { participantId: string; participantName: string; percentage: number }[]
  ): SplitCalculation[] {
    // Validate percentages sum to 100
    const totalPercentage = participantPercentages.reduce((sum, p) => sum + p.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error(`Percentages must sum to 100%, got ${totalPercentage}%`);
    }

    return participantPercentages.map(p => ({
      participantId: p.participantId,
      participantName: p.participantName,
      amount: parseFloat((expenseAmount * p.percentage / 100).toFixed(2)),
      percentage: p.percentage
    }));
  }

  /**
   * Calculate fixed amount split for an expense
   */
  static calculateFixedSplit(
    expenseAmount: number,
    participantAmounts: { participantId: string; participantName: string; amount: number }[]
  ): SplitCalculation[] {
    // Validate amounts sum to expense total
    const totalAmount = participantAmounts.reduce((sum, p) => sum + p.amount, 0);
    if (Math.abs(totalAmount - expenseAmount) > 0.01) {
      throw new Error(`Fixed amounts must sum to expense total ${expenseAmount}, got ${totalAmount}`);
    }

    return participantAmounts.map(p => ({
      participantId: p.participantId,
      participantName: p.participantName,
      amount: parseFloat(p.amount.toFixed(2)),
      percentage: parseFloat((p.amount / expenseAmount * 100).toFixed(2))
    }));
  }

  /**
   * Calculate custom split with mixed types (some equal, some fixed, some percentage)
   */
  static calculateCustomSplit(
    expenseAmount: number,
    splitConfig: {
      participantId: string;
      participantName: string;
      type: 'equal' | 'fixed' | 'percentage';
      value?: number; // amount for fixed, percentage for percentage
    }[]
  ): SplitCalculation[] {
    let remainingAmount = expenseAmount;
    const results: SplitCalculation[] = [];
    
    // First, process fixed amounts and percentages
    const equalSplitParticipants: typeof splitConfig = [];
    
    splitConfig.forEach(config => {
      if (config.type === 'fixed' && config.value !== undefined) {
        results.push({
          participantId: config.participantId,
          participantName: config.participantName,
          amount: parseFloat(config.value.toFixed(2)),
          percentage: parseFloat((config.value / expenseAmount * 100).toFixed(2))
        });
        remainingAmount -= config.value;
      } else if (config.type === 'percentage' && config.value !== undefined) {
        const amount = expenseAmount * config.value / 100;
        results.push({
          participantId: config.participantId,
          participantName: config.participantName,
          amount: parseFloat(amount.toFixed(2)),
          percentage: config.value
        });
        remainingAmount -= amount;
      } else if (config.type === 'equal') {
        equalSplitParticipants.push(config);
      }
    });
    
    // Then, split remaining amount equally among equal-split participants
    if (equalSplitParticipants.length > 0) {
      const amountPerPerson = remainingAmount / equalSplitParticipants.length;
      const percentagePerPerson = amountPerPerson / expenseAmount * 100;
      
      equalSplitParticipants.forEach(config => {
        results.push({
          participantId: config.participantId,
          participantName: config.participantName,
          amount: parseFloat(amountPerPerson.toFixed(2)),
          percentage: parseFloat(percentagePerPerson.toFixed(2))
        });
      });
    }
    
    return results;
  }

  /**
   * Calculate event statistics
   */
  static calculateEventStats(
    participants: Participant[],
    expenses: Expense[],
    splits: Split[]
  ) {
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;
    const averagePerPerson = participants.length > 0 ? totalExpenses / participants.length : 0;
    
    const balances = this.calculateBalances(participants, expenses, splits);
    const maxDebt = Math.max(...balances.map(b => Math.max(0, b.balance)));
    const maxCredit = Math.max(...balances.map(b => Math.max(0, -b.balance)));
    
    // Calculate expense categories
    const categoryTotals = expenses.reduce((acc, expense) => {
      const category = expense.category || 'general';
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {} as { [category: string]: number });
    
    return {
      totalExpenses: parseFloat(totalExpenses.toFixed(2)),
      averageExpense: parseFloat(averageExpense.toFixed(2)),
      averagePerPerson: parseFloat(averagePerPerson.toFixed(2)),
      maxDebt: parseFloat(maxDebt.toFixed(2)),
      maxCredit: parseFloat(maxCredit.toFixed(2)),
      categoryTotals,
      participantCount: participants.length,
      expenseCount: expenses.length,
      balancesSettled: balances.every(b => Math.abs(b.balance) < 0.01)
    };
  }

  /**
   * Validate split calculations
   */
  static validateSplit(
    expenseAmount: number,
    splitCalculations: SplitCalculation[]
  ): { isValid: boolean; error?: string; totalAmount: number; totalPercentage: number } {
    const totalAmount = splitCalculations.reduce((sum, split) => sum + split.amount, 0);
    const totalPercentage = splitCalculations.reduce((sum, split) => sum + (split.percentage || 0), 0);
    
    const amountDifference = Math.abs(totalAmount - expenseAmount);
    const percentageDifference = Math.abs(totalPercentage - 100);
    
    if (amountDifference > 0.01) {
      return {
        isValid: false,
        error: `Split amounts (${totalAmount.toFixed(2)}) don't match expense total (${expenseAmount.toFixed(2)})`,
        totalAmount,
        totalPercentage
      };
    }
    
    if (percentageDifference > 0.01) {
      return {
        isValid: false,
        error: `Split percentages (${totalPercentage.toFixed(2)}%) don't sum to 100%`,
        totalAmount,
        totalPercentage
      };
    }
    
    return {
      isValid: true,
      totalAmount,
      totalPercentage
    };
  }
}

export default CalculationService;