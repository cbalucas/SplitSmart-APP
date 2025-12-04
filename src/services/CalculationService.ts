import { Expense, Split, Payment } from '../types';

export interface ParticipantBalance {
  participantId: string;
  totalPaid: number;
  totalOwed: number;
  balance: number;
}

export interface Settlement {
  fromParticipantId: string;
  toParticipantId: string;
  amount: number;
}

export function calculateParticipantBalances(
  expenses: Expense[],
  splits: Split[],
  payments: Payment[]
): ParticipantBalance[] {
  const balances: { [id: string]: ParticipantBalance } = {};

  // PASO 1: créditos (lo que pagó cada uno)
  expenses.forEach(exp => {
    if (!balances[exp.payerId]) balances[exp.payerId] = { participantId: exp.payerId, totalPaid: 0, totalOwed: 0, balance: 0 };
    balances[exp.payerId].totalPaid += exp.amount;
  });

  // PASO 2: débitos (lo que debe cada uno)
  splits.forEach(s => {
    if (!balances[s.participantId]) balances[s.participantId] = { participantId: s.participantId, totalPaid: 0, totalOwed: 0, balance: 0 };
    balances[s.participantId].totalOwed += s.amount;
  });

  // PASO 3: balance neto
  Object.values(balances).forEach(b => {
    b.balance = b.totalPaid - b.totalOwed;
  });

  // PASO 4: aplicar pagos confirmados
  payments.filter(p => p.isConfirmed).forEach(p => {
    if (balances[p.fromParticipantId]) balances[p.fromParticipantId].balance -= p.amount;
    if (balances[p.toParticipantId]) balances[p.toParticipantId].balance += p.amount;
  });

  return Object.values(balances);
}

export function calculateOptimalSettlement(balances: ParticipantBalance[]): Settlement[] {
  const TOLERANCE = 0.01;
  const debtors = balances
    .filter(b => b.balance < -TOLERANCE)
    .map(b => ({ id: b.participantId, amount: Math.abs(b.balance) }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = balances
    .filter(b => b.balance > TOLERANCE)
    .map(b => ({ id: b.participantId, amount: b.balance }))
    .sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const transferAmount = Math.min(debtor.amount, creditor.amount);
    if (transferAmount > TOLERANCE) {
      settlements.push({ fromParticipantId: debtor.id, toParticipantId: creditor.id, amount: Math.round(transferAmount * 100) / 100 });
    }
    debtor.amount -= transferAmount;
    creditor.amount -= transferAmount;
    if (debtor.amount < TOLERANCE) i++;
    if (creditor.amount < TOLERANCE) j++;
  }

  return settlements;
}
