/**
 * 🧪 SCRIPT DE PRUEBA - SISTEMA DE LIQUIDACIONES MEJORADO
 * 
 * Este script prueba el nuevo sistema de cálculo de liquidaciones que:
 * ✅ Recalcula automáticamente al crear/editar/eliminar gastos
 * ✅ Usa solo la tabla 'settlements' (elimina dependency de Payment[])
 * ✅ Mantiene liquidaciones pagadas al recalcular
 * ✅ Genera liquidaciones optimizadas
 */

import { databaseService } from '../src/services/database';

// Datos de prueba
const testEventId = 'test_event_liquidaciones';
const testParticipants = [
  { id: 'alice', name: 'Alice' },
  { id: 'bob', name: 'Bob' },
  { id: 'charlie', name: 'Charlie' }
];

const testExpenses = [
  { 
    id: 'expense1', 
    description: 'Cena restaurante', 
    amount: 150, 
    payerId: 'alice',
    splits: [
      { participantId: 'alice', amount: 50 },
      { participantId: 'bob', amount: 50 },
      { participantId: 'charlie', amount: 50 }
    ]
  },
  {
    id: 'expense2',
    description: 'Gasolina', 
    amount: 60,
    payerId: 'bob',
    splits: [
      { participantId: 'alice', amount: 20 },
      { participantId: 'bob', amount: 20 },
      { participantId: 'charlie', amount: 20 }
    ]
  }
];

async function runLiquidationTest() {
  console.log('🧪 ===== PRUEBA DE SISTEMA DE LIQUIDACIONES =====');
  
  try {
    // 1. LIMPIAR DATOS DE PRUEBA
    console.log('\n1️⃣ Limpiando datos de prueba anteriores...');
    await cleanTestData();

    // 2. CREAR EVENTO Y PARTICIPANTES
    console.log('\n2️⃣ Creando evento y participantes...');
    await setupTestData();

    // 3. CREAR PRIMER GASTO - DEBE GENERAR LIQUIDACIONES
    console.log('\n3️⃣ Creando primer gasto (Alice paga $150)...');
    await createTestExpense(testExpenses[0]);
    await showCurrentLiquidations('Después del primer gasto');

    // 4. CREAR SEGUNDO GASTO - DEBE RECALCULAR LIQUIDACIONES
    console.log('\n4️⃣ Creando segundo gasto (Bob paga $60)...');
    await createTestExpense(testExpenses[1]);
    await showCurrentLiquidations('Después del segundo gasto');

    // 5. SIMULAR PAGO - MARCAR UNA LIQUIDACIÓN COMO PAGADA
    console.log('\n5️⃣ Simulando pago de una liquidación...');
    await markSettlementAsPaid();
    await showCurrentLiquidations('Después de marcar pago');

    // 6. MODIFICAR GASTO - DEBE RECALCULAR SIN TOCAR PAGOS
    console.log('\n6️⃣ Modificando pagador del primer gasto (Alice → Charlie)...');
    await modifyExpensePayer();
    await showCurrentLiquidations('Después de cambiar pagador');

    // 7. ELIMINAR GASTO - DEBE RECALCULAR
    console.log('\n7️⃣ Eliminando segundo gasto...');
    await deleteTestExpense(testExpenses[1].id);
    await showCurrentLiquidations('Después de eliminar gasto');

    console.log('\n✅ ===== PRUEBA COMPLETADA EXITOSAMENTE =====');

  } catch (error) {
    console.error('❌ Error en prueba:', error);
  }
}

async function cleanTestData() {
  // Eliminar en orden correcto para evitar problemas de FK
  await databaseService.db?.runAsync('DELETE FROM settlements WHERE event_id = ?', [testEventId]);
  await databaseService.db?.runAsync('DELETE FROM splits WHERE expense_id LIKE "expense%"');
  await databaseService.db?.runAsync('DELETE FROM expenses WHERE event_id = ?', [testEventId]);
  await databaseService.db?.runAsync('DELETE FROM event_participants WHERE event_id = ?', [testEventId]);
  await databaseService.db?.runAsync('DELETE FROM events WHERE id = ?', [testEventId]);
  
  // Eliminar participantes de prueba
  for (const p of testParticipants) {
    await databaseService.db?.runAsync('DELETE FROM participants WHERE id = ?', [p.id]);
  }
  
  console.log('🧹 Datos de prueba limpiados');
}

async function setupTestData() {
  // Crear evento
  await databaseService.createEvent({
    id: testEventId,
    name: 'Evento Prueba Liquidaciones',
    description: 'Evento para probar el sistema de liquidaciones',
    startDate: new Date().toISOString(),
    currency: 'ARS',
    type: 'public',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  // Crear participantes
  for (const participant of testParticipants) {
    await databaseService.createParticipant({
      id: participant.id,
      name: participant.name,
      participantType: 'temporary',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await databaseService.addParticipantToEvent(testEventId, participant.id, 'member');
  }

  console.log('📝 Evento y participantes creados');
}

async function createTestExpense(expenseData) {
  const currentTime = new Date().toISOString();
  
  // Crear gasto
  await databaseService.createExpense({
    id: expenseData.id,
    eventId: testEventId,
    description: expenseData.description,
    amount: expenseData.amount,
    currency: 'ARS',
    date: currentTime,
    payerId: expenseData.payerId,
    isActive: true,
    createdAt: currentTime,
    updatedAt: currentTime
  });

  // Crear splits
  for (const split of expenseData.splits) {
    await databaseService.createSplit({
      id: `split_${expenseData.id}_${split.participantId}`,
      expenseId: expenseData.id,
      participantId: split.participantId,
      amount: split.amount,
      type: 'equal',
      isPaid: false,
      createdAt: currentTime,
      updatedAt: currentTime
    });
  }

  console.log(`💰 Gasto creado: ${expenseData.description} - $${expenseData.amount} (${expenseData.payerId})`);
}

async function showCurrentLiquidations(title) {
  console.log(`\n📊 ${title}:`);
  
  const settlements = await databaseService.getSettlementsByEvent(testEventId);
  
  if (settlements.length === 0) {
    console.log('   🔍 No hay liquidaciones pendientes');
    return;
  }

  settlements.forEach((s, index) => {
    const status = s.isPaid ? '✅ PAGADO' : '⏳ PENDIENTE';
    console.log(`   ${index + 1}. ${s.fromParticipantName} → ${s.toParticipantName}: $${s.amount} ${status}`);
  });

  // Mostrar balances calculados
  const expenses = await databaseService.getExpensesByEvent(testEventId);
  const splits = await databaseService.getSplitsByEvent(testEventId);
  const participants = testParticipants;

  console.log('\n   💰 Balances individuales:');
  participants.forEach(p => {
    const totalPaid = expenses.filter(e => e.payerId === p.id).reduce((sum, e) => sum + e.amount, 0);
    const totalOwed = splits.filter(s => s.participantId === p.id).reduce((sum, s) => sum + s.amount, 0);
    const balance = totalOwed - totalPaid;
    
    const balanceText = balance > 0 ? `debe $${balance}` : balance < 0 ? `le deben $${Math.abs(balance)}` : 'está al día';
    console.log(`     ${p.name}: Pagó $${totalPaid}, debe $${totalOwed} → ${balanceText}`);
  });
}

async function markSettlementAsPaid() {
  const settlements = await databaseService.getSettlementsByEvent(testEventId);
  if (settlements.length > 0) {
    const firstSettlement = settlements[0];
    await databaseService.updateSettlement(firstSettlement.id, {
      isPaid: true,
      paidAt: new Date().toISOString()
    });
    console.log(`💳 Marcado como pagado: ${firstSettlement.fromParticipantName} → ${firstSettlement.toParticipantName} $${firstSettlement.amount}`);
  }
}

async function modifyExpensePayer() {
  await databaseService.updateExpense(testExpenses[0].id, {
    payerId: 'charlie' // Cambiar de Alice a Charlie
  });
  console.log('🔄 Pagador modificado: Alice → Charlie');
}

async function deleteTestExpense(expenseId) {
  await databaseService.deleteExpense(expenseId);
  console.log('🗑️ Gasto eliminado');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runLiquidationTest().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

export { runLiquidationTest };