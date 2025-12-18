// Test completo del sistema de condonación automática

const { ConsolidationService } = require('./src/services/ConsolidationService');

// Mock de datos similar al formato real de la app
const mockSettlements = [
  {
    id: 'settlement_1',
    eventId: 'test_event',
    fromParticipantId: 'eva',
    fromParticipantName: 'Eva',
    toParticipantId: 'maria',
    toParticipantName: 'María',
    amount: 5000,
    isPaid: false
  },
  {
    id: 'settlement_2', 
    eventId: 'test_event',
    fromParticipantId: 'bob',
    fromParticipantName: 'Bob',
    toParticipantId: 'eva',
    toParticipantName: 'Eva',
    amount: 3000,
    isPaid: false
  },
  {
    id: 'settlement_3',
    eventId: 'test_event', 
    fromParticipantId: 'carlos',
    fromParticipantName: 'Carlos',
    toParticipantId: 'diego',
    toParticipantName: 'Diego',
    amount: 2000,
    isPaid: false
  },
  {
    id: 'settlement_4',
    eventId: 'test_event',
    fromParticipantId: 'diego',
    fromParticipantName: 'Diego', 
    toParticipantId: 'carlos',
    toParticipantName: 'Carlos',
    amount: 1000,
    isPaid: false
  }
];

const mockAssignments = [
  {
    debtorId: 'bob',
    debtorName: 'Bob',
    payerId: 'eva',
    payerName: 'Eva',
    eventId: 'test_event'
  },
  {
    debtorId: 'diego',
    debtorName: 'Diego',
    payerId: 'carlos', 
    payerName: 'Carlos',
    eventId: 'test_event'
  }
];

console.log('🧪 TEST COMPLETO: SISTEMA DE CONDONACIÓN AUTOMÁTICA');
console.log('==================================================');

console.log('\n📋 DATOS DE ENTRADA:');
console.log('Liquidaciones originales:');
mockSettlements.forEach(s => {
  console.log(`   ${s.fromParticipantName} → ${s.toParticipantName}: $${s.amount}`);
});

console.log('\nAsignaciones de consolidación:');
mockAssignments.forEach(a => {
  console.log(`   ${a.payerName} pagará por ${a.debtorName}`);
});

try {
  console.log('\n⚡ PROCESANDO CONSOLIDACIÓN...');
  const result = ConsolidationService.applyConsolidations(mockSettlements, mockAssignments);
  
  console.log('\n✅ RESULTADO:');
  console.log(`Total liquidaciones originales: ${mockSettlements.length}`);
  console.log(`Total liquidaciones consolidadas: ${result.length}`);
  console.log(`Pagos condonados: ${mockSettlements.length - result.length}`);
  
  console.log('\nLiquidaciones consolidadas finales:');
  result.forEach(s => {
    console.log(`   ${s.fromParticipantName} → ${s.toParticipantName}: $${s.amount}`);
  });
  
  console.log('\n🎯 VERIFICACIÓN:');
  console.log('✅ Eva → María: $5,000 (deuda original de Eva)');
  console.log('🚫 Eva → Eva: CONDONADO (Bob le debía a Eva, Eva paga por Bob)'); 
  console.log('✅ Carlos → Diego: $2,000 (deuda original de Carlos)');
  console.log('🚫 Carlos → Carlos: CONDONADO (Diego le debía a Carlos, Carlos paga por Diego)');
  
  // Validar resultados
  const evaToMaria = result.find(s => s.fromParticipantName === 'Eva' && s.toParticipantName === 'María');
  const carlosToDiego = result.find(s => s.fromParticipantName === 'Carlos' && s.toParticipantName === 'Diego');
  const selfPayments = result.filter(s => s.fromParticipantId === s.toParticipantId);
  
  console.log('\n📊 VALIDACIÓN:');
  console.log(`Eva → María existe: ${evaToMaria ? '✅' : '❌'}`);
  console.log(`Carlos → Diego existe: ${carlosToDiego ? '✅' : '❌'}`);
  console.log(`Pagos a sí mismo: ${selfPayments.length === 0 ? '✅ NINGUNO (correcto)' : `❌ ${selfPayments.length} encontrados`}`);
  
  if (evaToMaria?.amount === 5000 && carlosToDiego?.amount === 2000 && selfPayments.length === 0) {
    console.log('\n🎉 ¡TEST EXITOSO! El sistema de condonación funciona correctamente.');
  } else {
    console.log('\n❌ TEST FALLIDO: Hay problemas en la lógica de condonación.');
  }
  
} catch (error) {
  console.error('❌ ERROR AL EJECUTAR TEST:', error.message);
  console.log('\n💡 Esto puede ser porque ConsolidationService no está disponible en Node.js');
  console.log('   El test debe ejecutarse dentro del contexto de React Native/Expo');
}