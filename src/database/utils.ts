/**
 * 🔄 Utilidades de Importación/Exportación basadas en DER
 * 
 * Este archivo contiene funciones utilitarias que utilizan el esquema DER
 * para asegurar consistencia en las operaciones de import/export.
 */

import { 
  ExportSchema, 
  IMPORT_ORDER, 
  DELETE_ORDER,
  UserEntity,
  EventEntity,
  ParticipantEntity,
  EventParticipantEntity,
  ExpenseEntity,
  SplitEntity,
  SettlementEntity,
  ConsolidationAssignmentEntity,
  AppVersionEntity
} from './schema';

// =====================================================
// 🛡️ VALIDADORES DE ESQUEMA
// =====================================================

/**
 * Valida si los datos importados cumplen con el esquema DER
 */
export function validateImportSchema(data: any): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validar estructura principal
  if (!data || typeof data !== 'object') {
    errors.push('Los datos importados no tienen estructura válida');
    return { isValid: false, errors, warnings };
  }

  // Validar metadatos
  if (!data.metadata?.exportedBy || data.metadata.exportedBy !== 'SplitSmart') {
    errors.push('Los datos no provienen de una exportación válida de SplitSmart');
  }

  // Validar versión
  if (!data.version) {
    warnings.push('Versión de exportación no especificada, asumiendo compatibilidad');
  }

  // Validar sección data
  if (!data.data || typeof data.data !== 'object') {
    errors.push('Sección "data" faltante o inválida');
    return { isValid: false, errors, warnings };
  }

  // Validar tablas principales
  const requiredTables = ['events', 'participants', 'expenses'];
  for (const table of requiredTables) {
    if (!Array.isArray(data.data[table])) {
      errors.push(`Tabla requerida "${table}" faltante o no es un array`);
    }
  }

  // Validar campos requeridos en cada entidad
  if (data.data.users && Array.isArray(data.data.users)) {
    data.data.users.forEach((user: any, index: number) => {
      if (!user.id || !user.username || !user.email || !user.name) {
        errors.push(`Usuario en índice ${index} falta campos requeridos (id, username, email, name)`);
      }
    });
  }

  if (data.data.events && Array.isArray(data.data.events)) {
    data.data.events.forEach((event: any, index: number) => {
      if (!event.id || !event.name || !event.start_date) {
        errors.push(`Evento en índice ${index} falta campos requeridos (id, name, start_date)`);
      }
    });
  }

  if (data.data.participants && Array.isArray(data.data.participants)) {
    data.data.participants.forEach((participant: any, index: number) => {
      if (!participant.id || !participant.name) {
        errors.push(`Participante en índice ${index} falta campos requeridos (id, name)`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Normaliza los datos importados para que coincidan con el esquema DER
 */
export function normalizeImportData(data: any): ExportSchema {
  const normalizedData: any = {
    version: data.version || '2.1',
    exportDate: data.exportDate || new Date().toISOString(),
    appVersion: data.appVersion || 'unknown',
    metadata: {
      exportedBy: 'SplitSmart',
      version: data.version || '2.1',
      exportDate: data.exportDate || new Date().toISOString(),
      appVersion: data.appVersion || 'unknown'
    },
    data: {},
    statistics: data.statistics || {},
    integrity: data.integrity || {}
  };

  // Normalizar cada tabla según el orden de importación
  for (const tableName of IMPORT_ORDER) {
    const tableData = data.data?.[tableName] || [];
    normalizedData.data[tableName] = normalizeTableData(tableName, tableData);
  }

  return normalizedData;
}

/**
 * Normaliza los datos de una tabla específica
 */
function normalizeTableData(tableName: string, tableData: any[]): any[] {
  if (!Array.isArray(tableData)) {
    return [];
  }

  return tableData.map(record => {
    switch (tableName) {
      case 'users':
        return normalizeUserRecord(record);
      case 'events':
        return normalizeEventRecord(record);
      case 'participants':
        return normalizeParticipantRecord(record);
      case 'event_participants':
        return normalizeEventParticipantRecord(record);
      case 'expenses':
        return normalizeExpenseRecord(record);
      case 'splits':
        return normalizeSplitRecord(record);
      case 'settlements':
        return normalizeSettlementRecord(record);
      case 'consolidation_assignments':
        return normalizeConsolidationRecord(record);
      case 'app_versions':
        return normalizeAppVersionRecord(record);
      default:
        return record;
    }
  });
}

// =====================================================
// 📋 NORMALIZADORES POR ENTIDAD
// =====================================================

function normalizeUserRecord(record: any): UserEntity {
  return {
    id: record.id,
    username: record.username,
    email: record.email,
    password: record.password || '',
    name: record.name,
    phone: record.phone || null,
    alias_cbu: record.alias_cbu || null,
    avatar: record.avatar || null,
    preferred_currency: record.preferred_currency || 'ARS',
    auto_logout: record.auto_logout || 'never',
    skip_password: record.skip_password || 0,
    auto_login: record.auto_login || 0,
    notifications_expense_added: record.notifications_expense_added || 1,
    notifications_payment_received: record.notifications_payment_received || 0,
    notifications_event_updated: record.notifications_event_updated || 0,
    notifications_weekly_report: record.notifications_weekly_report || 0,
    privacy_share_email: record.privacy_share_email || 0,
    privacy_share_phone: record.privacy_share_phone || 0,
    privacy_allow_invitations: record.privacy_allow_invitations || 1,
    privacy_share_event: record.privacy_share_event || 1,
    created_at: record.created_at || new Date().toISOString(),
    updated_at: record.updated_at || new Date().toISOString()
  };
}

function normalizeEventRecord(record: any): EventEntity {
  return {
    id: record.id,
    name: record.name,
    description: record.description || null,
    start_date: record.start_date || record.startDate || new Date().toISOString(),
    location: record.location || null,
    currency: record.currency || 'ARS',
    status: record.status || 'active',
    type: record.type || 'other',
    category: record.category || null,
    creator_id: record.creator_id || record.creatorId || null,
    created_at: record.created_at || record.createdAt || new Date().toISOString(),
    updated_at: record.updated_at || record.updatedAt || new Date().toISOString()
  };
}

function normalizeParticipantRecord(record: any): ParticipantEntity {
  return {
    id: record.id,
    name: record.name,
    email: record.email || null,
    phone: record.phone || null,
    alias_cbu: record.alias_cbu || null,
    avatar: record.avatar || null,
    participant_type: record.participant_type || record.participantType || 'temporary',
    is_active: record.is_active !== undefined ? record.is_active : (record.isActive !== undefined ? (record.isActive ? 1 : 0) : 1),
    created_at: record.created_at || record.createdAt || new Date().toISOString(),
    updated_at: record.updated_at || record.updatedAt || new Date().toISOString()
  };
}

function normalizeEventParticipantRecord(record: any): EventParticipantEntity {
  return {
    id: record.id || `${record.event_id}_${record.participant_id}`,
    event_id: record.event_id || record.eventId,
    participant_id: record.participant_id || record.participantId,
    role: record.role || 'participant',
    balance: record.balance || null,
    joined_at: record.joined_at || record.joinedAt || new Date().toISOString()
  };
}

function normalizeExpenseRecord(record: any): ExpenseEntity {
  return {
    id: record.id,
    event_id: record.event_id || record.eventId,
    payer_id: record.payer_id || record.payerId,
    description: record.description,
    amount: record.amount,
    date: record.date || new Date().toISOString(),
    category: record.category || null,
    // receipt_image omitido intencionalmente por privacidad
    notes: record.notes || null,
    is_active: record.is_active !== undefined ? record.is_active : (record.isActive !== undefined ? (record.isActive ? 1 : 0) : 1),
    created_at: record.created_at || record.createdAt || new Date().toISOString(),
    updated_at: record.updated_at || record.updatedAt || new Date().toISOString()
  };
}

function normalizeSplitRecord(record: any): SplitEntity {
  return {
    id: record.id,
    expense_id: record.expense_id || record.expenseId,
    participant_id: record.participant_id || record.participantId,
    amount: record.amount,
    percentage: record.percentage || null,
    type: record.type || 'equal',
    is_paid: record.is_paid !== undefined ? record.is_paid : (record.isPaid !== undefined ? (record.isPaid ? 1 : 0) : 0),
    created_at: record.created_at || record.createdAt || new Date().toISOString(),
    updated_at: record.updated_at || record.updatedAt || new Date().toISOString()
  };
}

function normalizeSettlementRecord(record: any): SettlementEntity {
  return {
    id: record.id,
    event_id: record.event_id,
    from_participant_id: record.from_participant_id,
    from_participant_name: record.from_participant_name || 'Participante',
    to_participant_id: record.to_participant_id,
    to_participant_name: record.to_participant_name || 'Participante',
    amount: record.amount,
    is_paid: record.is_paid !== undefined ? record.is_paid : 0,
    paid_at: record.paid_at || null,
    event_status: record.event_status || 'active',
    // receipt_image omitido intencionalmente por privacidad
    notes: record.notes || null,
    created_at: record.created_at || new Date().toISOString(),
    updated_at: record.updated_at || new Date().toISOString()
  };
}

function normalizeConsolidationRecord(record: any): ConsolidationAssignmentEntity {
  return {
    id: record.id || undefined, // Auto-increment, puede no tener ID
    event_id: record.event_id,
    payer_id: record.payer_id,
    payer_name: record.payer_name || 'Unknown Payer',
    debtor_id: record.debtor_id,
    debtor_name: record.debtor_name || 'Unknown Debtor',
    created_at: record.created_at || new Date().toISOString(),
    updated_at: record.updated_at || new Date().toISOString()
  };
}

function normalizeAppVersionRecord(record: any): AppVersionEntity {
  return {
    id: record.id || undefined, // Auto-increment
    version: record.version,
    version_name: record.version_name || null,
    release_date: record.release_date || new Date().toISOString(),
    is_current: record.is_current || 0,
    changelog_improvements: record.changelog_improvements || null,
    changelog_features: record.changelog_features || null,
    changelog_bugfixes: record.changelog_bugfixes || null,
    created_at: record.created_at || new Date().toISOString()
  };
}

// =====================================================
// 📊 VALIDADORES DE INTEGRIDAD REFERENCIAL
// =====================================================

/**
 * Valida las foreign keys en los datos a importar
 */
export function validateReferentialIntegrity(data: ExportSchema): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Crear mapas de IDs existentes para validación
  const userIds = new Set(data.data.users?.map(u => u.id) || []);
  const participantIds = new Set(data.data.participants?.map(p => p.id) || []);
  const eventIds = new Set(data.data.events?.map(e => e.id) || []);
  const expenseIds = new Set(data.data.expenses?.map(e => e.id) || []);

  // Validar eventos -> usuarios (creator)
  data.data.events?.forEach(event => {
    if (event.creator_id && !userIds.has(event.creator_id)) {
      warnings.push(`Evento ${event.id}: creator_id ${event.creator_id} no existe en usuarios`);
    }
  });

  // Validar event_participants
  data.data.event_participants?.forEach(ep => {
    if (!eventIds.has(ep.event_id)) {
      errors.push(`EventParticipant ${ep.id}: event_id ${ep.event_id} no existe`);
    }
    if (!participantIds.has(ep.participant_id)) {
      errors.push(`EventParticipant ${ep.id}: participant_id ${ep.participant_id} no existe`);
    }
  });

  // Validar gastos
  data.data.expenses?.forEach(expense => {
    if (!eventIds.has(expense.event_id)) {
      errors.push(`Gasto ${expense.id}: event_id ${expense.event_id} no existe`);
    }
    if (!participantIds.has(expense.payer_id)) {
      errors.push(`Gasto ${expense.id}: payer_id ${expense.payer_id} no existe`);
    }
  });

  // Validar splits
  data.data.splits?.forEach(split => {
    if (!expenseIds.has(split.expense_id)) {
      errors.push(`Split ${split.id}: expense_id ${split.expense_id} no existe`);
    }
    if (!participantIds.has(split.participant_id)) {
      errors.push(`Split ${split.id}: participant_id ${split.participant_id} no existe`);
    }
  });

  // Validar settlements
  data.data.settlements?.forEach(settlement => {
    if (!eventIds.has(settlement.event_id)) {
      errors.push(`Settlement ${settlement.id}: event_id ${settlement.event_id} no existe`);
    }
    if (!participantIds.has(settlement.from_participant_id)) {
      errors.push(`Settlement ${settlement.id}: from_participant_id ${settlement.from_participant_id} no existe`);
    }
    if (!participantIds.has(settlement.to_participant_id)) {
      errors.push(`Settlement ${settlement.id}: to_participant_id ${settlement.to_participant_id} no existe`);
    }
  });

  // Validar consolidaciones
  data.data.consolidation_assignments?.forEach(consolidation => {
    if (!eventIds.has(consolidation.event_id)) {
      errors.push(`Consolidation ${consolidation.id}: event_id ${consolidation.event_id} no existe`);
    }
    if (!participantIds.has(consolidation.payer_id)) {
      errors.push(`Consolidation ${consolidation.id}: payer_id ${consolidation.payer_id} no existe`);
    }
    if (!participantIds.has(consolidation.debtor_id)) {
      errors.push(`Consolidation ${consolidation.id}: debtor_id ${consolidation.debtor_id} no existe`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Genera estadísticas de los datos que se van a importar
 */
export function generateImportStatistics(data: ExportSchema) {
  return {
    totalUsers: data.data.users?.length || 0,
    totalEvents: data.data.events?.length || 0,
    totalParticipants: data.data.participants?.length || 0,
    totalEventParticipants: data.data.event_participants?.length || 0,
    totalExpenses: data.data.expenses?.length || 0,
    totalSplits: data.data.splits?.length || 0,
    totalSettlements: data.data.settlements?.length || 0,
    totalConsolidations: data.data.consolidation_assignments?.length || 0,
    totalAppVersions: data.data.app_versions?.length || 0,
    
    // Análisis adicional
    activeEvents: data.data.events?.filter(e => e.status === 'active').length || 0,
    completedEvents: data.data.events?.filter(e => e.status === 'completed').length || 0,
    archivedEvents: data.data.events?.filter(e => e.status === 'archived').length || 0,
    friendParticipants: data.data.participants?.filter(p => p.participant_type === 'friend').length || 0,
    temporaryParticipants: data.data.participants?.filter(p => p.participant_type === 'temporary').length || 0,
    
    totalExpenseAmount: data.data.expenses?.reduce((sum, e) => sum + e.amount, 0) || 0,
    totalSettlementAmount: data.data.settlements?.reduce((sum, s) => sum + s.amount, 0) || 0,
    paidSettlements: data.data.settlements?.filter(s => s.is_paid === 1).length || 0
  };
}

export default {
  validateImportSchema,
  normalizeImportData,
  validateReferentialIntegrity,
  generateImportStatistics,
  IMPORT_ORDER,
  DELETE_ORDER
};