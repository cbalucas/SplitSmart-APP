// Ejemplo de verificación de cálculos
// Supongamos 3 participantes: Ana, Bob, Carlos

const participants = [
  { id: '1', name: 'Ana' },
  { id: '2', name: 'Bob' }, 
  { id: '3', name: 'Carlos' }
];

const expenses = [
  { id: 'e1', payerId: '1', amount: 150, description: 'Cena' }, // Ana pagó 150
  { id: 'e2', payerId: '2', amount: 90, description: 'Taxi' },   // Bob pagó 90
];

const splits = [
  // Cena (150) dividida entre los 3: 50 cada uno
  { id: 's1', expenseId: 'e1', participantId: '1', amount: 50 }, // Ana debe 50
  { id: 's2', expenseId: 'e1', participantId: '2', amount: 50 }, // Bob debe 50  
  { id: 's3', expenseId: 'e1', participantId: '3', amount: 50 }, // Carlos debe 50
  
  // Taxi (90) dividido entre los 3: 30 cada uno
  { id: 's4', expenseId: 'e2', participantId: '1', amount: 30 }, // Ana debe 30
  { id: 's5', expenseId: 'e2', participantId: '2', amount: 30 }, // Bob debe 30
  { id: 's6', expenseId: 'e2', participantId: '3', amount: 30 }, // Carlos debe 30
];

console.log('=== EJEMPLO CÁLCULO ===');
console.log('Ana pagó: 150, debe: 50+30=80, balance: 80-150 = -70 (le deben)');
console.log('Bob pagó: 90, debe: 50+30=80, balance: 80-90 = -10 (le deben)');
console.log('Carlos pagó: 0, debe: 50+30=80, balance: 80-0 = +80 (debe)');
console.log('');
console.log('Liquidación óptima:');
console.log('Carlos → Ana: 70');
console.log('Carlos → Bob: 10');
console.log('Total: 80 (cuadra con lo que debe Carlos)');