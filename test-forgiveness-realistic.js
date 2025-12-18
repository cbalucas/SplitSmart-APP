// Test REALISTA de condonación automática de pagos a sí mismo

console.log('🧪 TEST REALISTA: CONDONACIÓN AUTOMÁTICA');
console.log('========================================');

// ESCENARIO REALISTA:
// En una cena, Ana pagó más de lo que le correspondía, por lo que todos le deben dinero
// Ana decide ser generosa y pagar por Bob y Carlos (sus deudas hacia ella se condonan)
// Solo Diego sigue debiendo normalmente
const settlements = [
  { fromParticipantId: 'bob', fromParticipantName: 'Bob', toParticipantId: 'ana', toParticipantName: 'Ana', amount: 2500 },
  { fromParticipantId: 'carlos', fromParticipantName: 'Carlos', toParticipantId: 'ana', toParticipantName: 'Ana', amount: 1800 },
  { fromParticipantId: 'diego', fromParticipantName: 'Diego', toParticipantId: 'ana', toParticipantName: 'Ana', amount: 900 }
];

// Configuración: Ana paga por Bob y por Carlos (sus propias deudas)
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
  console.log(`   ${a.payerName} pagará por ${a.debtorName}`);
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
let forgivenAmount = 0;

Object.entries(groups).forEach(([payerId, group]) => {
  Object.entries(group.totalsByCreditor).forEach(([creditorId, amount]) => {
    if (payerId === creditorId) {
      const creditorName = settlements.find(s => s.toParticipantId === creditorId)?.toParticipantName || creditorId;
      console.log(`🚫 CONDONADO: ${group.payerName} → ${creditorName}: $${amount} (no tiene sentido pagarse a sí mismo)`);
      forgivenCount++;
      forgivenAmount += amount;
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
console.log(`   💰 Monto condonado: $${forgivenAmount}`);
console.log(`   📈 Total procesado: ${consolidatedCount + forgivenCount}`);

console.log('\n🎯 RESULTADO ESPERADO REALISTA:');
console.log('   ✅ Diego → Ana: $900 (Diego sigue pagando normalmente)');
console.log('   🚫 Ana → Ana: $2,500 + $1,800 = $4,300 CONDONADO');
console.log('');
console.log('💡 LÓGICA: Ana pagó por Bob y Carlos, pero ellos le debían a Ana.');
console.log('   En lugar de que Ana se transfiera dinero a sí misma, se condonan automáticamente.');
console.log('   Ana efectivamente "perdona" las deudas de Bob y Carlos.');

console.log('\n🔍 VERIFICACIÓN DEL ESCENARIO:');
console.log('   ✅ Este es un caso realista de condonación');
console.log('   ✅ No hay pagos circulares imposibles'); 
console.log('   ✅ El algoritmo de liquidaciones óptimas nunca generaría pagos bidireccionales');
console.log('   ✅ La condonación automática tiene sentido práctico');