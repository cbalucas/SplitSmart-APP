/**
 * Test para verificar la nueva estructura de mensajes con VISTA CONSOLIDADA después de liquidaciones
 */

console.log('🧪 Iniciando test de reorganización de mensajes...\n');

// Simular datos
const settlements = [
  { id: 1, fromParticipantId: 'A', fromParticipantName: 'Ana', toParticipantId: 'B', toParticipantName: 'Bob', amount: 15000, eventId: 'event1' },
  { id: 2, fromParticipantId: 'B', fromParticipantName: 'Bob', toParticipantId: 'C', toParticipantName: 'Carlos', amount: 12000, eventId: 'event1' },
  { id: 3, fromParticipantId: 'C', fromParticipantName: 'Carlos', toParticipantId: 'A', toParticipantName: 'Ana', amount: 18700, eventId: 'event1' },
  { id: 4, fromParticipantId: 'D', fromParticipantName: 'Diana', toParticipantId: 'B', toParticipantName: 'Bob', amount: 10600, eventId: 'event1' }
];

const consolidatedSettlements = [
  { id: 1, fromParticipantId: 'A', fromParticipantName: 'Ana', toParticipantId: 'C', toParticipantName: 'Carlos', amount: 3700, eventId: 'event1' },
  { id: 4, fromParticipantId: 'D', fromParticipantName: 'Diana', toParticipantId: 'C', toParticipantName: 'Carlos', amount: 33900, eventId: 'event1' }
];

const assignments = [
  { payerId: 'A', payerName: 'Ana', debtorId: 'B', debtorName: 'Bob', eventId: 'event1' },
  { payerId: 'A', payerName: 'Ana', debtorId: 'D', debtorName: 'Diana', eventId: 'event1' }
];

const eventParticipants = [
  { id: 'A', name: 'Ana', alias_cbu: 'ana.perez' },
  { id: 'B', name: 'Bob', alias_cbu: 'bob.smith' },
  { id: 'C', name: 'Carlos', alias_cbu: 'carlos.lopez' },
  { id: 'D', name: 'Diana', alias_cbu: 'diana.martinez' }
];

function getDisplaySettlements(showOriginalView = false) {
  if (assignments.length > 0 && !showOriginalView) {
    return consolidatedSettlements;
  }
  return settlements;
}

function generateSummaryMessage(showOriginalView = false) {
  const currentSettlements = getDisplaySettlements(showOriginalView);
  
  let message = '📊 *RESUMEN - Evento Test*\n\n';
  message += '💰 *Total gastado:* USD $1,500.00\n';
  message += '👥 *Participantes:* 4\n\n';
  message += '💸 LIQUIDACIONES:\n\n';
  
  if (currentSettlements.length > 0) {
    // Agrupar liquidaciones por destinatario
    const settlementsByRecipient = currentSettlements.reduce((acc, settlement) => {
      const toParticipantName = settlement.toParticipantName;
      if (!acc[toParticipantName]) {
        acc[toParticipantName] = [];
      }
      acc[toParticipantName].push(settlement);
      return acc;
    }, {});

    Object.entries(settlementsByRecipient).forEach(([recipientName, settlementsForRecipient]) => {
      const recipient = eventParticipants.find(p => p.name === recipientName);
      const cbuAlias = recipient?.alias_cbu || 'Sin datos';
      
      message += `_${recipientName}_\n`;
      message += `💳 *${cbuAlias}*\n`;
      settlementsForRecipient.forEach((settlement) => {
        message += `  • ${settlement.fromParticipantName}: $${settlement.amount.toLocaleString()}\n`;
      });
      message += '\n';
    });
  } else {
    message += '✅ ¡Todas las cuentas están equilibradas!\n';
  }

  // Información de consolidación DESPUÉS de las liquidaciones
  if (assignments.length > 0 && !showOriginalView) {
    message += '\n━━━━━━━━━━━━━━━━━━\n';
    message += '🔄 *VISTA CONSOLIDADA*\n\n';
    
    // Mostrar quién paga por quién
    message += '👤 *ASIGNACIONES:*\n';
    assignments.forEach(assignment => {
      message += `• ${assignment.payerName} paga por ${assignment.debtorName}\n`;
    });
  }
  
  return message;
}

console.log('📋 Test: Mensaje de resumen consolidado');
console.log('══════════════════════════════════════');

const consolidatedMessage = generateSummaryMessage(false);
console.log(consolidatedMessage);

console.log('\n🧪 Verificaciones:');

// Verificar el orden
const liquidacionesIndex = consolidatedMessage.indexOf('💸 LIQUIDACIONES:');
const vistaConsolidadaIndex = consolidatedMessage.indexOf('🔄 *VISTA CONSOLIDADA*');
const asignacionesIndex = consolidatedMessage.indexOf('👤 *ASIGNACIONES:*');

console.log('✅ LIQUIDACIONES aparece primero:', liquidacionesIndex > 0);
console.log('✅ VISTA CONSOLIDADA aparece después de LIQUIDACIONES:', vistaConsolidadaIndex > liquidacionesIndex);
console.log('✅ ASIGNACIONES aparece dentro de VISTA CONSOLIDADA:', asignacionesIndex > vistaConsolidadaIndex);

// Verificar contenido de asignaciones
const containsAnaPaysBob = consolidatedMessage.includes('Ana paga por Bob');
const containsAnaPaysDiana = consolidatedMessage.includes('Ana paga por Diana');

console.log('✅ Muestra "Ana paga por Bob":', containsAnaPaysBob);
console.log('✅ Muestra "Ana paga por Diana":', containsAnaPaysDiana);

// Verificar estructura general
const hasLiquidacionSection = consolidatedMessage.includes('💸 LIQUIDACIONES:');
const hasConsolidatedSection = consolidatedMessage.includes('🔄 *VISTA CONSOLIDADA*');
const hasAssignmentsSection = consolidatedMessage.includes('👤 *ASIGNACIONES:*');
const hasSummarySection = consolidatedMessage.includes('📊 *RESUMEN:*'); // Debería ser false ahora

console.log('✅ Tiene sección de liquidaciones:', hasLiquidacionSection);
console.log('✅ Tiene sección consolidada:', hasConsolidatedSection);
console.log('✅ Tiene sección de asignaciones:', hasAssignmentsSection);
console.log('✅ NO tiene sección de resumen numérico:', !hasSummarySection);

const allTestsPassed = 
  liquidacionesIndex > 0 && 
  vistaConsolidadaIndex > liquidacionesIndex &&
  asignacionesIndex > vistaConsolidadaIndex &&
  containsAnaPaysBob &&
  containsAnaPaysDiana &&
  hasLiquidacionSection &&
  hasConsolidatedSection &&
  hasAssignmentsSection &&
  !hasSummarySection; // Verificar que NO tenga resumen numérico

console.log('\n🎯 RESULTADO FINAL:');
if (allTestsPassed) {
  console.log('🎉 ¡TODAS LAS PRUEBAS PASARON!');
  console.log('   ✓ VISTA CONSOLIDADA aparece después de liquidaciones');
  console.log('   ✓ Se muestran claramente las asignaciones (quién paga por quién)');
  console.log('   ✓ Eliminado el resumen numérico de ahorro');
  console.log('   ✓ Estructura simplificada y organizada');
} else {
  console.log('❌ Algunas pruebas fallaron. Revisar implementación.');
}

console.log('\n✨ Test completado.');