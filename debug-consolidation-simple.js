// Debug específico para el problema de consolidación que reportó el usuario

// Liquidaciones originales según el ejemplo:
const originalSettlements = [
  { fromParticipantId: 'eva', fromParticipantName: 'Eva', toParticipantId: 'maria', toParticipantName: 'María', amount: 3000 },
  { fromParticipantId: 'bob', fromParticipantName: 'Bob', toParticipantId: 'maria', toParticipantName: 'María', amount: 15000 },
  { fromParticipantId: 'carlos', fromParticipantName: 'Carlos', toParticipantId: 'maria', toParticipantName: 'María', amount: 12000 },
  { fromParticipantId: 'carlos', fromParticipantName: 'Carlos', toParticipantId: 'diego', toParticipantName: 'Diego', amount: 3000 }
];

// Configuración de consolidación: Eva paga por Bob y Carlos
const consolidationAssignments = [
  { debtorId: 'bob', debtorName: 'Bob', payerId: 'eva', payerName: 'Eva', eventId: '' },
  { debtorId: 'carlos', debtorName: 'Carlos', payerId: 'eva', payerName: 'Eva', eventId: '' }
];

console.log('🧪 DEBUG CONSOLIDACIÓN');
console.log('========================');
console.log('📋 Liquidaciones originales:');
originalSettlements.forEach(s => {
  console.log(`   ${s.fromParticipantName} → ${s.toParticipantName}: $${s.amount}`);
});
console.log('');

console.log('🔄 Configuración de consolidación:');
consolidationAssignments.forEach(c => {
  console.log(`   ${c.payerName} paga por ${c.debtorName}`);
});
console.log('');

// Aplicar consolidación manualmente paso a paso
console.log('⚡ APLICANDO CONSOLIDACIÓN PASO A PASO:');

// Paso 1: Agrupar por pagador (Eva)
const settlementsByPayer = {};

originalSettlements.forEach(settlement => {
  console.log(`📊 Procesando: ${settlement.fromParticipantName} → ${settlement.toParticipantName}: $${settlement.amount}`);
  
  // ¿Alguien más va a pagar por este deudor?
  const assignment = consolidationAssignments.find(a => a.debtorId === settlement.fromParticipantId);
  const finalPayerId = assignment ? assignment.payerId : settlement.fromParticipantId;
  const finalPayerName = assignment ? assignment.payerName : settlement.fromParticipantName;
  
  console.log(`   💡 Final payer: ${finalPayerName} (${finalPayerId})`);
  
  if (!settlementsByPayer[finalPayerId]) {
    settlementsByPayer[finalPayerId] = {
      payerName: finalPayerName,
      settlements: [],
      totalsByCreditor: {}
    };
  }
  
  settlementsByPayer[finalPayerId].settlements.push(settlement);
  
  // Sumar por acreedor
  if (!settlementsByPayer[finalPayerId].totalsByCreditor[settlement.toParticipantId]) {
    settlementsByPayer[finalPayerId].totalsByCreditor[settlement.toParticipantId] = 0;
  }
  settlementsByPayer[finalPayerId].totalsByCreditor[settlement.toParticipantId] += settlement.amount;
  
  console.log(`   🧮 Acumulado para ${settlement.toParticipantName}: $${settlementsByPayer[finalPayerId].totalsByCreditor[settlement.toParticipantId]}`);
  console.log('');
});

console.log('📊 GRUPOS CONSOLIDADOS:');
Object.entries(settlementsByPayer).forEach(([payerId, group]) => {
  console.log(`👤 ${group.payerName} (${payerId}):`);
  console.log(`   📝 Liquidaciones originales: ${group.settlements.length}`);
  group.settlements.forEach(s => {
    console.log(`      - ${s.fromParticipantName} → ${s.toParticipantName}: $${s.amount}`);
  });
  console.log(`   💰 Totales por acreedor:`);
  Object.entries(group.totalsByCreditor).forEach(([creditorId, total]) => {
    const creditorName = originalSettlements.find(s => s.toParticipantId === creditorId)?.toParticipantName || creditorId;
    console.log(`      - A ${creditorName}: $${total}`);
  });
  console.log('');
});

// Calcular el total que Eva debería pagar
const evaGroup = settlementsByPayer['eva'];
if (evaGroup) {
  let totalEva = 0;
  Object.values(evaGroup.totalsByCreditor).forEach(amount => {
    totalEva += amount;
  });
  console.log(`🔍 TOTAL QUE EVA DEBERÍA PAGAR: $${totalEva}`);
  
  console.log('');
  console.log('✅ LIQUIDACIONES CONSOLIDADAS ESPERADAS:');
  Object.entries(evaGroup.totalsByCreditor).forEach(([creditorId, total]) => {
    const creditorName = originalSettlements.find(s => s.toParticipantId === creditorId)?.toParticipantName || creditorId;
    console.log(`   Eva → ${creditorName}: $${total}`);
  });
  
  console.log('');
  console.log('🎯 VERIFICACIÓN:');
  console.log(`   Eva → María: $${evaGroup.totalsByCreditor['maria']} (esperado: $30,000)`);
  console.log(`   Eva → Diego: $${evaGroup.totalsByCreditor['diego']} (esperado: $3,000)`);
  console.log(`   Total: $${totalEva} (esperado: $33,000)`);
}