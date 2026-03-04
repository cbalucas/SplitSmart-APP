// Test debug para ConsolidationService
import { ConsolidationService } from '../src/services/ConsolidationService';

// Simular las liquidaciones del ejemplo
const originalSettlements = [
  {
    id: '1',
    fromParticipantId: 'eva',
    fromParticipantName: 'Eva',
    toParticipantId: 'maria',
    toParticipantName: 'María',
    amount: 3000,
    eventId: 'test'
  },
  {
    id: '2', 
    fromParticipantId: 'bob',
    fromParticipantName: 'Bob',
    toParticipantId: 'maria',
    toParticipantName: 'María',
    amount: 15000,
    eventId: 'test'
  },
  {
    id: '3',
    fromParticipantId: 'carlos',
    fromParticipantName: 'Carlos', 
    toParticipantId: 'maria',
    toParticipantName: 'María',
    amount: 12000,
    eventId: 'test'
  },
  {
    id: '4',
    fromParticipantId: 'carlos',
    fromParticipantName: 'Carlos',
    toParticipantId: 'diego', 
    toParticipantName: 'Diego',
    amount: 3000,
    eventId: 'test'
  }
];

// Eva paga por Bob y Carlos
const assignments = [
  {
    payerId: 'eva',
    payerName: 'Eva',
    debtorId: 'bob', 
    debtorName: 'Bob'
  },
  {
    payerId: 'eva',
    payerName: 'Eva', 
    debtorId: 'carlos',
    debtorName: 'Carlos'
  }
];

console.log('🧪 TESTING CONSOLIDATION SERVICE');
console.log('Original settlements:', originalSettlements);
console.log('Assignments:', assignments);

const result = ConsolidationService.applyConsolidations(originalSettlements, assignments);

console.log('\n✅ RESULT:');
result.forEach(settlement => {
  console.log(`${settlement.fromParticipantName} → ${settlement.toParticipantName}: $${settlement.amount}`);
});

console.log('\n📊 EXPECTED:');
console.log('Eva → María: $30,000 (3,000 + 15,000 + 12,000)');
console.log('Eva → Diego: $3,000');
console.log('Total: $33,000');

const totalCalculated = result.reduce((sum, s) => sum + s.amount, 0);
console.log(`\nTotal calculated: $${totalCalculated}`);