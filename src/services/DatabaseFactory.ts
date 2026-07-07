import { Platform } from 'react-native';
import { IDatabaseService } from './IDatabaseService';

/**
 * Selecciona la implementación correcta de IDatabaseService según la plataforma:
 * - ios / android / native → DatabaseService (expo-sqlite)
 * - web                   → IndexedDBDatabaseService (IndexedDB via idb)
 */
function createDatabaseService(): IDatabaseService {
  if (Platform.OS === 'web') {
    // Import dinámico para que expo-sqlite nunca se bundle en web
    const { IndexedDBDatabaseService } = require('./IndexedDBDatabaseService');
    return new IndexedDBDatabaseService() as IDatabaseService;
  }
  // Import dinámico para que expo-sqlite solo se cargue en nativo
  const { DatabaseService } = require('./database');
  return new DatabaseService() as IDatabaseService;
}

export const databaseService: IDatabaseService = createDatabaseService();
