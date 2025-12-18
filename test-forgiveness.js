// Test de condonación automática de pagos a sí mismo

console.log('🧪 TEST: CONDONACIÓN AUTOMÁTICA DE PAGOS');
console.log('==========================================');

// ESCENARIO REALISTA:
// En una cena, Ana pagó más y le deben dinero
// Bob y Carlos deben dinero a Ana
// Pero Ana decide pagar por Bob (por ejemplo, Bob es su hermano)
const settlements = [
  { fromParticipantId: 'bob', fromParticipantName: 'Bob', toParticipantId: 'ana', toParticipantName: 'Ana', amount: 2500 },
  { fromParticipantId: 'carlos', fromParticipantName: 'Carlos', toParticipantId: 'ana', toParticipantName: 'Ana', amount: 1800 },
  { fromParticipantId: 'diego', fromParticipantName: 'Diego', toParticipantId: 'ana', toParticipantName: 'Ana', amount: 900 }
];

// Configuración: Ana paga por Bob (condonación) y por Carlos
const assignments = [
  { debtorId: 'bob', debtorName: 'Bob', payerId: 'ana', payerName: 'Ana', eventId: '' },
  { debtorId: 'carlos', debtorName: 'Carlos', payerId: 'ana', payerName: 'Ana', eventId: '' }
];

console.log('📋 Liquidaciones originales:');
settlements.forEach(s => {
  console.log(`   ${s.fromParticipantName} → ${s.toParticipantName}: $${s.amount}`);
});

console.log('\n🔄 Configuración de consolidación:');
assignments.forEach(a => {
  console.log(`   ${a.payerName} paga por ${a.debtorName}`);
});

console.log('\n⚡ APLICANDO LÓGICA DE CONSOLIDACIÓN CON CONDONACIÓN:');

// Simular el algoritmo manualmente
const assignmentMap = {};
assignments.forEach(a => {
  assignmentMap[a.debtorId] = a.payerId;
});

const groups = {};
settlements.forEach(s => {
  const actualPayerId = assignmentMap[s.fromParticipantId] || s.fromParticipantId;
  const actualPayerName = assignments.find(a => a.payerId === actualPayerId)?.payerName || s.fromParticipantName;
  
  console.log(`📊 ${s.fromParticipantName} → ${s.toParticipantName} $${s.amount}`);
  console.log(`   Pagador final: ${actualPayerName} (${actualPayerId})`);
  
  if (!groups[actualPayerId]) {
    groups[actualPayerId] = { payerName: actualPayerName, totalsByCreditor: {} };
  }
  
  if (!groups[actualPayerId].totalsByCreditor[s.toParticipantId]) {
    groups[actualPayerId].totalsByCreditor[s.toParticipantId] = 0;
  }
  groups[actualPayerId].totalsByCreditor[s.toParticipantId] += s.amount;
  
  console.log(`   Acumulado a ${s.toParticipantName}: $${groups[actualPayerId].totalsByCreditor[s.toParticipantId]}`);
  console.log('');
});

console.log('💰 LIQUIDACIONES CONSOLIDADAS FINALES:');
let consolidatedCount = 0;
let forgivenCount = 0;

Object.entries(groups).forEach(([payerId, group]) => {
  Object.entries(group.totalsByCreditor).forEach(([creditorId, amount]) => {
    if (payerId === creditorId) {
      const creditorName = settlements.find(s => s.toParticipantId === creditorId)?.toParticipantName || creditorId;
      console.log(`🚫 CONDONADO: ${group.payerName} → ${creditorName}: $${amount} (pago a sí mismo)`);
      forgivenCount++;
    } else {
      const creditorName = settlements.find(s => s.toParticipantId === creditorId)?.toParticipantName || creditorId;
      console.log(`✅ ${group.payerName} → ${creditorName}: $${amount}`);
      consolidatedCount++;
    }
  });
});

console.log('\n📊 RESUMEN:');
console.log(`   ✅ Liquidaciones válidas: ${consolidatedCount}`);
console.log(`   🚫 Pagos condonados: ${forgivenCount}`);
console.log(`   📈 Total procesado: ${consolidatedCount + forgivenCount}`);

console.log('\n🎯 RESULTADO ESPERADO:');
console.log('   ✅ Diego → Ana: $900 (Diego sigue pagando normalmente)');
console.log('   🚫 Ana → Ana: $2,500 CONDONADO (Bob le debía a Ana, pero Ana paga por Bob - se cancela)');
console.log('   🚫 Ana → Ana: $1,800 CONDONADO (Carlos le debía a Ana, pero Ana paga por Carlos - se cancela)');
console.log('');
console.log('💡 LÓGICA: Cuando alguien paga por una deuda que le deben a sí mismo, se condona automáticamente');
console.log('   porque no tiene sentido que una persona se transfiera dinero a sí misma.');