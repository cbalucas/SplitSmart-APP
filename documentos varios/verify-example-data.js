// Verificación de datos del ejemplo vs datos reales
// Este script ayuda a identificar si el evento tiene las liquidaciones correctas

const EXPECTED_DATA = {
  participants: [
    { name: 'Eva', id: 'eva' },
    { name: 'Bob', id: 'bob' },
    { name: 'Carlos', id: 'carlos' },
    { name: 'María', id: 'maria' },
    { name: 'Diego', id: 'diego' }
  ],
  expenses: [
    { description: 'Restaurante Principal', amount: 30000, payerId: 'maria' }, // María pagó $30,000
    { description: 'Bebidas Adicionales', amount: 15000, payerId: 'diego' }    // Diego pagó $15,000
  ],
  // Distribución esperada: $45,000 ÷ 5 personas = $9,000 cada uno
  splits: {
    'eva': 9000,
    'bob': 9000,
    'carlos': 9000,
    'maria': 9000,
    'diego': 9000
  },
  // Balances esperados:
  balances: {
    'eva': -9000,     // Debe $9,000
    'bob': -9000,     // Debe $9,000
    'carlos': -9000,  // Debe $9,000
    'maria': 21000,   // Le deben $21,000 (pagó $30,000, debe $9,000)
    'diego': 6000     // Le deben $6,000 (pagó $15,000, debe $9,000)
  },
  // Liquidaciones originales esperadas:
  settlements: [
    { from: 'eva', to: 'maria', amount: 3000 },    // Eva debe $3,000 a María
    { from: 'bob', to: 'maria', amount: 15000 },   // Bob debe $15,000 a María
    { from: 'carlos', to: 'maria', amount: 12000 }, // Carlos debe $12,000 a María  
    { from: 'carlos', to: 'diego', amount: 3000 }   // Carlos debe $3,000 a Diego
  ]
};

console.log('🔍 VERIFICACIÓN DE DATOS DEL EJEMPLO');
console.log('=====================================');

console.log('👥 Participantes esperados:');
EXPECTED_DATA.participants.forEach(p => {
  console.log(`   - ${p.name} (${p.id})`);
});

console.log('\n💰 Gastos esperados:');
EXPECTED_DATA.expenses.forEach(e => {
  const payer = EXPECTED_DATA.participants.find(p => p.id === e.payerId);
  console.log(`   - ${e.description}: $${e.amount} (pagado por ${payer.name})`);
});

console.log('\n📊 Distribución esperada ($45,000 ÷ 5 = $9,000 cada uno):');
Object.entries(EXPECTED_DATA.splits).forEach(([id, amount]) => {
  const participant = EXPECTED_DATA.participants.find(p => p.id === id);
  console.log(`   - ${participant.name}: $${amount}`);
});

console.log('\n⚖️ Balances esperados:');
Object.entries(EXPECTED_DATA.balances).forEach(([id, balance]) => {
  const participant = EXPECTED_DATA.participants.find(p => p.id === id);
  const status = balance < 0 ? 'DEBE' : 'LE DEBEN';
  console.log(`   - ${participant.name}: ${status} $${Math.abs(balance)}`);
});

console.log('\n💸 Liquidaciones originales esperadas:');
EXPECTED_DATA.settlements.forEach(s => {
  const from = EXPECTED_DATA.participants.find(p => p.id === s.from);
  const to = EXPECTED_DATA.participants.find(p => p.id === s.to);
  console.log(`   - ${from.name} → ${to.name}: $${s.amount}`);
});

console.log('\n🔄 Después de consolidación (Eva paga por Bob y Carlos):');
console.log('   - Eva → María: $30,000 (3,000 + 15,000 + 12,000)');
console.log('   - Eva → Diego: $3,000');
console.log('   - TOTAL EVA: $33,000 ✅');

console.log('\n⚠️  PROBLEMA REPORTADO:');
console.log('   - Eva aparece pagando $36,000 en lugar de $33,000');
console.log('   - Diferencia: $3,000 extra');
console.log('');
console.log('🔍 POSIBLES CAUSAS:');
console.log('   1. Liquidaciones duplicadas en la base de datos');
console.log('   2. El evento no tiene exactamente estos datos');
console.log('   3. Error en la lógica de agrupación por acreedor');
console.log('   4. Problema con el algoritmo de cálculo óptimo de liquidaciones');
console.log('');
console.log('📋 PRÓXIMO PASO: Verificar que el evento tenga exactamente estos datos.');