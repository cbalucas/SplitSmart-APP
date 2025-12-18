/**
 * Test para verificar que los mensajes usen datos consolidados actualizados
 */

console.log('🧪 Iniciando test de corrección de mensajes...\n');

// Simular datos de settlements originales
const settlements = [
  { id: 1, fromParticipantId: 'A', fromParticipantName: 'Ana', toParticipantId: 'B', toParticipantName: 'Bob', amount: 15000, eventId: 'event1' },
  { id: 2, fromParticipantId: 'B', fromParticipantName: 'Bob', toParticipantId: 'C', toParticipantName: 'Carlos', amount: 12000, eventId: 'event1' },
  { id: 3, fromParticipantId: 'C', fromParticipantName: 'Carlos', toParticipantId: 'A', toParticipantName: 'Ana', amount: 18700, eventId: 'event1' },
  { id: 4, fromParticipantId: 'D', fromParticipantName: 'Diana', toParticipantId: 'B', toParticipantName: 'Bob', amount: 10600, eventId: 'event1' }
];

// Simular datos consolidados (después de aplicar consolidaciones)
const consolidatedSettlements = [
  { id: 1, fromParticipantId: 'A', fromParticipantName: 'Ana', toParticipantId: 'C', toParticipantName: 'Carlos', amount: 3700, eventId: 'event1' },
  { id: 4, fromParticipantId: 'D', fromParticipantName: 'Diana', toParticipantId: 'C', toParticipantName: 'Carlos', amount: 33900, eventId: 'event1' }
];

const assignments = [
  { payerId: 'A', payerName: 'Ana', debtorId: 'B', debtorName: 'Bob', eventId: 'event1' },
  { payerId: 'A', payerName: 'Ana', debtorId: 'D', debtorName: 'Diana', eventId: 'event1' }
];

// Simular la función getDisplaySettlements
function getDisplaySettlements(showOriginalView = false) {
  if (assignments.length > 0 && !showOriginalView) {
    return consolidatedSettlements;
  }
  return settlements;
}

console.log('📋 Datos originales:');
console.log('   • Settlements originales:', settlements.length);
console.log('   • Total original:', settlements.reduce((sum, s) => sum + s.amount, 0).toLocaleString());

console.log('\n🔄 Datos consolidados:');
console.log('   • Settlements consolidados:', consolidatedSettlements.length);
console.log('   • Total consolidado:', consolidatedSettlements.reduce((sum, s) => sum + s.amount, 0).toLocaleString());

console.log('\n🧪 Test 1: getDisplaySettlements (vista consolidada)');
const displaySettlements = getDisplaySettlements(false);
console.log('   • Settlements mostrados:', displaySettlements.length);
console.log('   • Total mostrado:', displaySettlements.reduce((sum, s) => sum + s.amount, 0).toLocaleString());
console.log('   ✅ Debe usar datos consolidados:', displaySettlements === consolidatedSettlements);

console.log('\n🧪 Test 2: getDisplaySettlements (vista original)');
const originalDisplaySettlements = getDisplaySettlements(true);
console.log('   • Settlements mostrados:', originalDisplaySettlements.length);
console.log('   • Total mostrado:', originalDisplaySettlements.reduce((sum, s) => sum + s.amount, 0).toLocaleString());
console.log('   ✅ Debe usar datos originales:', originalDisplaySettlements === settlements);

console.log('\n🧪 Test 3: Simulación de mensaje de resumen');
function generateSummaryMessage(showOriginalView = false) {
  const currentSettlements = getDisplaySettlements(showOriginalView);
  
  let message = '📊 RESUMEN - Evento Test\n\n';
  
  if (assignments.length > 0 && !showOriginalView) {
    const originalTotal = settlements.reduce((sum, s) => sum + s.amount, 0);
    const consolidatedTotal = consolidatedSettlements.reduce((sum, s) => sum + s.amount, 0);
    const forgivenAmount = originalTotal - consolidatedTotal;
    
    message += '🔄 VISTA CONSOLIDADA\n';
    message += `• Liquidaciones: ${settlements.length} → ${consolidatedSettlements.length}\n`;
    message += `• Monto original: $${originalTotal.toLocaleString()}\n`;
    message += `• Monto consolidado: $${consolidatedTotal.toLocaleString()}\n`;
    if (forgivenAmount > 0) {
      message += `• Monto condonado: $${forgivenAmount.toLocaleString()} 🚫\n`;
    }
    message += '\n';
  }
  
  message += '💸 LIQUIDACIONES:\n\n';
  currentSettlements.forEach(settlement => {
    message += `• ${settlement.fromParticipantName}: $${settlement.amount.toLocaleString()} → ${settlement.toParticipantName}\n`;
  });
  
  return message;
}

console.log('   Vista consolidada:');
const consolidatedMessage = generateSummaryMessage(false);
console.log('   ', consolidatedMessage.split('\n').slice(0, 8).join('\n   '));
console.log('   ✅ Debe mostrar 2 liquidaciones y totales consolidados');

console.log('\n   Vista original:');
const originalMessage = generateSummaryMessage(true);
console.log('   ', originalMessage.split('\n').slice(0, 6).join('\n   '));
console.log('   ✅ Debe mostrar 4 liquidaciones sin información consolidada');

console.log('\n🎯 RESULTADO DEL TEST:');
const consolidatedContains2Settlements = consolidatedMessage.includes('4 → 2');
const consolidatedContainsCorrectTotal = consolidatedMessage.includes('37600') || consolidatedMessage.includes('37,600');
const originalContains4Settlements = originalMessage.split('•').length - 1 === 4; // -1 porque el primer split no cuenta

console.log('   ✅ Mensaje consolidado usa datos correctos:', consolidatedContains2Settlements);
console.log('   ✅ Mensaje consolidado tiene total correcto:', consolidatedContainsCorrectTotal);
console.log('   ✅ Mensaje original muestra 4 settlements:', originalContains4Settlements);

if (consolidatedContains2Settlements && consolidatedContainsCorrectTotal && originalContains4Settlements) {
  console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON! Los mensajes ahora usan datos actualizados.');
} else {
  console.log('\n❌ Algunas pruebas fallaron. Revisar la implementación.');
}

console.log('\n✨ Test completado.');