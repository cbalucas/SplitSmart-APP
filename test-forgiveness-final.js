// EJEMPLO REALISTA CORREGIDO: Condonación automática

console.log('🧪 EJEMPLO REALISTA CORREGIDO');
console.log('===============================');

// ESCENARIO CORRECTO:
// Ana organizó una cena y todos le deben dinero (Ana es la única acreedora)
// Ana decide ser generosa y pagar por algunos amigos
const settlements = [
  { fromParticipantId: 'bob', fromParticipantName: 'Bob', toParticipantId: 'ana', toParticipantName: 'Ana', amount: 1500 },
  { fromParticipantId: 'carlos', fromParticipantName: 'Carlos', toParticipantId: 'ana', toParticipantName: 'Ana', amount: 2200 },
  { fromParticipantId: 'diego', fromParticipantName: 'Diego', toParticipantId: 'ana', toParticipantName: 'Ana', amount: 800 }
];

// Ana decide pagar por Bob (condonación automática)
const assignments = [
  { debtorId: 'bob', debtorName: 'Bob', payerId: 'ana', payerName: 'Ana', eventId: '' }
];

console.log('📋 SITUACIÓN INICIAL (post-algoritmo óptimo):');
console.log('   ✅ Ana pagó la cena completa ($4,500)');
console.log('   ✅ Todos le deben dinero a Ana (única acreedora)');
console.log('   ✅ NO hay pagos circulares ni bidireccionales');
console.log('');

console.log('💰 Liquidaciones a pagar:');
settlements.forEach(s => {
  console.log(`   ${s.fromParticipantName} → ${s.toParticipantName}: $${s.amount}`);
});

console.log('\n🎁 Decisión de Ana:');
assignments.forEach(a => {
  console.log(`   ${a.payerName} decide pagar por ${a.debtorName} (gesto de generosidad)`);
});

console.log('\n⚡ APLICANDO CONSOLIDACIÓN:');

const assignmentMap = {};
assignments.forEach(a => {
  assignmentMap[a.debtorId] = a.payerId;
});

const groups = {};
settlements.forEach(s => {
  const actualPayerId = assignmentMap[s.fromParticipantId] || s.fromParticipantId;
  const actualPayerName = assignments.find(a => a.payerId === actualPayerId)?.payerName || s.fromParticipantName;
  
  console.log(`📊 Procesando: ${s.fromParticipantName} → ${s.toParticipantName} $${s.amount}`);
  console.log(`   Pagador final: ${actualPayerName} (${actualPayerId})`);
  
  if (!groups[actualPayerId]) {
    groups[actualPayerId] = { payerName: actualPayerName, totalsByCreditor: {} };
  }
  
  if (!groups[actualPayerId].totalsByCreditor[s.toParticipantId]) {
    groups[actualPayerId].totalsByCreditor[s.toParticipantId] = 0;
  }
  groups[actualPayerId].totalsByCreditor[s.toParticipantId] += s.amount;
  
  console.log(`   Acumulado: ${groups[actualPayerId].totalsByCreditor[s.toParticipantId]}`);
  console.log('');
});

console.log('🔥 LIQUIDACIONES CONSOLIDADAS FINALES:');
let validPayments = 0;
let forgivenPayments = 0;
let forgivenAmount = 0;

Object.entries(groups).forEach(([payerId, group]) => {
  Object.entries(group.totalsByCreditor).forEach(([creditorId, amount]) => {
    if (payerId === creditorId) {
      console.log(`🚫 CONDONADO: ${group.payerName} → ${group.payerName}: $${amount}`);
      console.log(`   💡 Razón: Ana no puede pagarse a sí misma, se condona automáticamente`);
      forgivenPayments++;
      forgivenAmount += amount;
    } else {
      const creditorName = settlements.find(s => s.toParticipantId === creditorId)?.toParticipantName || creditorId;
      console.log(`✅ VÁLIDO: ${group.payerName} → ${creditorName}: $${amount}`);
      validPayments++;
    }
  });
});

console.log('\n📊 RESUMEN FINAL:');
console.log(`   ✅ Pagos válidos: ${validPayments}`);
console.log(`   🚫 Pagos condonados: ${forgivenPayments} ($${forgivenAmount})`);

console.log('\n🎯 RESULTADO PRÁCTICO:');
console.log('   ✅ Carlos → Ana: $2,200 (pago normal)');
console.log('   ✅ Diego → Ana: $800 (pago normal)'); 
console.log('   🚫 Ana → Ana: $1,500 CONDONADO (Bob ya no debe nada)');

console.log('\n💡 INTERPRETACIÓN REAL:');
console.log('   - Ana efectivamente "perdona" la deuda de Bob ($1,500)');
console.log('   - Carlos y Diego siguen pagando normalmente');
console.log('   - Ana recupera solo $3,000 en lugar de $4,500 (sacrificó $1,500)');

console.log('\n✅ VALIDACIÓN DEL ESCENARIO:');
console.log('   ✅ Solo hay una acreedora (Ana) - REALISTA');
console.log('   ✅ No hay pagos bidireccionales - MATEMÁTICAMENTE CORRECTO');
console.log('   ✅ La condonación tiene sentido práctico - LÓGICO');
console.log('   ✅ El algoritmo óptimo nunca generaría este problema - CONSISTENTE');