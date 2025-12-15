/**
 * Script de prueba para verificar la persistencia de la base de datos
 * Ejecutar este script para probar que los datos se mantienen entre reinicios
 */

import { openDatabase } from './src/services/database';

async function testDatabasePersistence() {
  console.log('🧪 INICIANDO PRUEBA DE PERSISTENCIA DE BASE DE DATOS');
  
  const db = openDatabase();
  
  // 1. Verificar si hay datos existentes
  console.log('\n📊 Verificando datos existentes...');
  
  // Contar usuarios
  db.transaction((tx) => {
    tx.executeSql(
      'SELECT COUNT(*) as count FROM users',
      [],
      (_, result) => {
        console.log(`👥 Usuarios en la base de datos: ${result.rows.item(0).count}`);
      },
      (_, error) => {
        console.log('❌ Error al contar usuarios:', error);
      }
    );
  });
  
  // Contar eventos
  db.transaction((tx) => {
    tx.executeSql(
      'SELECT COUNT(*) as count FROM events',
      [],
      (_, result) => {
        console.log(`📅 Eventos en la base de datos: ${result.rows.item(0).count}`);
      },
      (_, error) => {
        console.log('❌ Error al contar eventos:', error);
      }
    );
  });
  
  // Contar gastos
  db.transaction((tx) => {
    tx.executeSql(
      'SELECT COUNT(*) as count FROM expenses',
      [],
      (_, result) => {
        console.log(`💰 Gastos en la base de datos: ${result.rows.item(0).count}`);
      },
      (_, error) => {
        console.log('❌ Error al contar gastos:', error);
      }
    );
  });
  
  // 2. Crear datos de prueba si no existen
  console.log('\n🆕 Creando datos de prueba...');
  
  const testEventId = Date.now().toString();
  const testUserId = 'test-user-' + Date.now();
  
  // Crear usuario de prueba
  db.transaction((tx) => {
    tx.executeSql(
      `INSERT INTO users (id, username, email, phone, createdAt) VALUES (?, ?, ?, ?, ?)`,
      [testUserId, 'TestUser', 'test@example.com', '123456789', new Date().toISOString()],
      (_, result) => {
        console.log('✅ Usuario de prueba creado exitosamente');
      },
      (_, error) => {
        console.log('⚠️ Error al crear usuario (puede que ya exista):', error);
      }
    );
  });
  
  // Crear evento de prueba
  db.transaction((tx) => {
    tx.executeSql(
      `INSERT INTO events (id, title, description, createdBy, type, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      [testEventId, 'Evento de Prueba', 'Evento para verificar persistencia', testUserId, 'public', new Date().toISOString()],
      (_, result) => {
        console.log('✅ Evento de prueba creado exitosamente');
      },
      (_, error) => {
        console.log('⚠️ Error al crear evento:', error);
      }
    );
  });
  
  console.log('\n📋 INSTRUCCIONES:');
  console.log('1. Nota los conteos mostrados arriba');
  console.log('2. Reinicia la aplicación completamente');
  console.log('3. Ejecuta este script nuevamente');
  console.log('4. Los conteos deben ser iguales o mayores (no menores)');
  console.log('5. Si los conteos se reducen, la persistencia tiene problemas');
  
  console.log('\n✅ Prueba completada. Datos de prueba insertados.');
}

// Solo ejecutar si este archivo se carga directamente
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testDatabasePersistence };
} else {
  testDatabasePersistence();
}