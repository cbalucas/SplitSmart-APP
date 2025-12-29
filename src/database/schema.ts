/**
 * 📊 DER (Diagrama de Entidad-Relación) Completo - SplitSmart Database Schema
 * 
 * Este archivo define el esquema completo de la base de datos de SplitSmart
 * para asegurar consistencia entre importación y exportación de datos.
 * 
 * Versión: 2.1
 * Última actualización: 2025-12-29
 */

// =====================================================
// 🎯 ENTIDADES PRINCIPALES
// =====================================================

/**
 * 👤 USUARIOS - Tabla principal de usuarios del sistema
 */
export interface UserEntity {
  // Primary Key
  id: string;                              // TEXT PRIMARY KEY
  
  // Credenciales
  username: string;                        // TEXT UNIQUE NOT NULL
  email: string;                          // TEXT UNIQUE NOT NULL  
  password: string;                       // TEXT NOT NULL
  
  // Información Personal
  name: string;                           // TEXT NOT NULL
  phone?: string;                         // TEXT
  alias_cbu?: string;                     // TEXT
  avatar?: string;                        // TEXT (URI)
  
  // Configuraciones
  preferred_currency: 'ARS' | 'USD' | 'EUR' | 'BRL'; // TEXT DEFAULT 'ARS'
  auto_logout: 'never' | '5min' | '15min' | '30min';  // TEXT DEFAULT 'never'
  skip_password: number;                  // INTEGER DEFAULT 0 (boolean)
  auto_login: number;                     // INTEGER DEFAULT 0 (boolean)
  
  // Notificaciones
  notifications_expense_added: number;     // INTEGER DEFAULT 1
  notifications_payment_received: number;  // INTEGER DEFAULT 0
  notifications_event_updated: number;     // INTEGER DEFAULT 0
  notifications_weekly_report: number;     // INTEGER DEFAULT 0
  
  // Privacidad
  privacy_share_email: number;            // INTEGER DEFAULT 0
  privacy_share_phone: number;            // INTEGER DEFAULT 0
  privacy_allow_invitations: number;      // INTEGER DEFAULT 1
  privacy_share_event: number;            // INTEGER DEFAULT 1
  
  // Auditoría
  created_at: string;                     // TEXT (ISO 8601)
  updated_at: string;                     // TEXT (ISO 8601)
}

/**
 * 🎉 EVENTOS - Eventos principales donde se dividen gastos
 */
export interface EventEntity {
  // Primary Key
  id: string;                             // TEXT PRIMARY KEY
  
  // Información básica
  name: string;                           // TEXT NOT NULL
  description?: string;                   // TEXT
  start_date: string;                     // TEXT NOT NULL (ISO 8601)
  location?: string;                      // TEXT
  
  // Configuración
  currency: string;                       // TEXT DEFAULT 'ARS'
  status: 'active' | 'completed' | 'archived'; // TEXT DEFAULT 'active'
  type: 'trip' | 'dinner' | 'party' | 'shared_expense' | 'other'; // TEXT DEFAULT 'other'
  category?: string;                      // TEXT
  
  // Relaciones
  creator_id?: string;                    // TEXT, FK -> users.id
  
  // Auditoría
  created_at: string;                     // TEXT NOT NULL
  updated_at: string;                     // TEXT NOT NULL
}

/**
 * 👥 PARTICIPANTES - Personas que participan en eventos
 */
export interface ParticipantEntity {
  // Primary Key
  id: string;                             // TEXT PRIMARY KEY
  
  // Información personal
  name: string;                           // TEXT NOT NULL
  email?: string;                         // TEXT
  phone?: string;                         // TEXT
  alias_cbu?: string;                     // TEXT
  avatar?: string;                        // TEXT (URI)
  
  // Tipo de participante
  participant_type: 'friend' | 'temporary'; // TEXT DEFAULT 'temporary'
  
  // Estado
  is_active: number;                      // INTEGER DEFAULT 1 (boolean)
  
  // Auditoría
  created_at: string;                     // TEXT
  updated_at: string;                     // TEXT
}

/**
 * 🔗 EVENTO_PARTICIPANTES - Relación muchos a muchos entre eventos y participantes
 */
export interface EventParticipantEntity {
  // Primary Key
  id: string;                             // TEXT PRIMARY KEY
  
  // Foreign Keys
  event_id: string;                       // TEXT NOT NULL, FK -> events.id
  participant_id: string;                 // TEXT NOT NULL, FK -> participants.id
  
  // Metadatos de participación
  role: 'creator' | 'participant' | 'viewer'; // TEXT DEFAULT 'participant'
  balance?: number;                       // REAL (calculated field)
  joined_at: string;                      // TEXT NOT NULL
  
  // Constraints: UNIQUE(event_id, participant_id)
}

// =====================================================
// 💰 ENTIDADES FINANCIERAS
// =====================================================

/**
 * 🧾 GASTOS - Gastos individuales en un evento
 */
export interface ExpenseEntity {
  // Primary Key
  id: string;                             // TEXT PRIMARY KEY
  
  // Foreign Keys
  event_id: string;                       // TEXT NOT NULL, FK -> events.id
  payer_id: string;                       // TEXT NOT NULL, FK -> participants.id
  
  // Información del gasto
  description: string;                    // TEXT NOT NULL
  amount: number;                         // REAL NOT NULL
  date: string;                           // TEXT NOT NULL (ISO 8601)
  category?: 'food' | 'transport' | 'accommodation' | 'entertainment' | 'other'; // TEXT
  
  // Metadatos
  receipt_image?: string;                 // TEXT (URI)
  notes?: string;                         // TEXT
  is_active: number;                      // INTEGER DEFAULT 1
  
  // Auditoría
  created_at: string;                     // TEXT
  updated_at: string;                     // TEXT
}

/**
 * ✂️ DIVISIONES - Cómo se divide un gasto entre participantes
 */
export interface SplitEntity {
  // Primary Key
  id: string;                             // TEXT PRIMARY KEY
  
  // Foreign Keys
  expense_id: string;                     // TEXT NOT NULL, FK -> expenses.id
  participant_id: string;                 // TEXT NOT NULL, FK -> participants.id
  
  // División del gasto
  amount: number;                         // REAL NOT NULL
  percentage?: number;                    // REAL
  type: 'equal' | 'fixed' | 'percentage' | 'custom'; // TEXT DEFAULT 'equal'
  
  // Estado de pago (legacy, mantenido por compatibilidad)
  is_paid: number;                        // INTEGER DEFAULT 0
  
  // Auditoría
  created_at: string;                     // TEXT
  updated_at: string;                     // TEXT
}

/**
 * 💸 LIQUIDACIONES - Cálculos de quién debe pagar a quién (tabla unificada)
 */
export interface SettlementEntity {
  // Primary Key
  id: string;                             // TEXT PRIMARY KEY
  
  // Foreign Keys
  event_id: string;                       // TEXT NOT NULL, FK -> events.id
  from_participant_id: string;            // TEXT NOT NULL, FK -> participants.id
  to_participant_id: string;              // TEXT NOT NULL, FK -> participants.id
  
  // Nombres para referencia rápida (desnormalizado por performance)
  from_participant_name: string;          // TEXT NOT NULL
  to_participant_name: string;            // TEXT NOT NULL
  
  // Información financiera
  amount: number;                         // REAL NOT NULL
  
  // Estado de pago
  is_paid: number;                        // INTEGER DEFAULT 0 (boolean)
  paid_at?: string;                       // TEXT (ISO 8601)
  
  // Estado del evento cuando se creó/actualizó la liquidación
  event_status: 'active' | 'completed' | 'archived'; // TEXT NOT NULL DEFAULT 'active'
  
  // Metadatos del pago
  receipt_image?: string;                 // TEXT (URI)
  notes?: string;                         // TEXT
  
  // Auditoría
  created_at: string;                     // TEXT NOT NULL
  updated_at: string;                     // TEXT NOT NULL
}

// =====================================================
// 🔄 ENTIDADES DE CONSOLIDACIÓN
// =====================================================

/**
 * 🎛️ ASIGNACIONES_CONSOLIDACIÓN - Sistema de consolidación de pagos
 */
export interface ConsolidationAssignmentEntity {
  // Primary Key
  id: number;                             // INTEGER PRIMARY KEY AUTOINCREMENT
  
  // Foreign Keys
  event_id: string;                       // TEXT NOT NULL, FK -> events.id
  payer_id: string;                       // TEXT NOT NULL, FK -> participants.id (quien pagará)
  debtor_id: string;                      // TEXT NOT NULL, FK -> participants.id (por quien pagará)
  
  // Nombres para referencia (desnormalizado)
  payer_name: string;                     // TEXT NOT NULL
  debtor_name: string;                    // TEXT NOT NULL
  
  // Auditoría
  created_at: string;                     // TEXT NOT NULL
  updated_at: string;                     // TEXT NOT NULL
}

// =====================================================
// 📱 ENTIDADES DE SISTEMA
// =====================================================

/**
 * 📦 VERSIONES_APP - Historial de versiones de la aplicación
 */
export interface AppVersionEntity {
  // Primary Key
  id: number;                             // INTEGER PRIMARY KEY AUTOINCREMENT
  
  // Información de versión
  version: string;                        // TEXT UNIQUE NOT NULL (ej: "1.2.1")
  version_name?: string;                  // TEXT (nombre descriptivo)
  release_date: string;                   // TEXT NOT NULL (ISO 8601)
  is_current: number;                     // INTEGER DEFAULT 0 (boolean)
  
  // Changelog
  changelog_improvements?: string;        // TEXT (JSON string)
  changelog_features?: string;            // TEXT (JSON string)
  changelog_bugfixes?: string;           // TEXT (JSON string)
  
  // Auditoría
  created_at: string;                     // TEXT NOT NULL
}

// =====================================================
// 🔗 RELACIONES Y CONSTRAINTS
// =====================================================

export interface DatabaseRelationships {
  // Eventos -> Usuario (creador)
  events_creator: {
    parent: 'users';
    child: 'events';
    parent_key: 'id';
    child_key: 'creator_id';
    constraint: 'ON DELETE SET NULL';
  };
  
  // Evento-Participantes -> Eventos
  event_participants_event: {
    parent: 'events';
    child: 'event_participants';
    parent_key: 'id';
    child_key: 'event_id';
    constraint: 'ON DELETE CASCADE';
  };
  
  // Evento-Participantes -> Participantes
  event_participants_participant: {
    parent: 'participants';
    child: 'event_participants';
    parent_key: 'id';
    child_key: 'participant_id';
    constraint: 'ON DELETE CASCADE';
  };
  
  // Gastos -> Eventos
  expenses_event: {
    parent: 'events';
    child: 'expenses';
    parent_key: 'id';
    child_key: 'event_id';
    constraint: 'ON DELETE CASCADE';
  };
  
  // Gastos -> Participantes (pagador)
  expenses_payer: {
    parent: 'participants';
    child: 'expenses';
    parent_key: 'id';
    child_key: 'payer_id';
    constraint: 'ON DELETE RESTRICT';
  };
  
  // Divisiones -> Gastos
  splits_expense: {
    parent: 'expenses';
    child: 'splits';
    parent_key: 'id';
    child_key: 'expense_id';
    constraint: 'ON DELETE CASCADE';
  };
  
  // Divisiones -> Participantes
  splits_participant: {
    parent: 'participants';
    child: 'splits';
    parent_key: 'id';
    child_key: 'participant_id';
    constraint: 'ON DELETE CASCADE';
  };
  
  // Liquidaciones -> Eventos
  settlements_event: {
    parent: 'events';
    child: 'settlements';
    parent_key: 'id';
    child_key: 'event_id';
    constraint: 'ON DELETE CASCADE';
  };
  
  // Liquidaciones -> Participantes (from)
  settlements_from: {
    parent: 'participants';
    child: 'settlements';
    parent_key: 'id';
    child_key: 'from_participant_id';
    constraint: 'ON DELETE RESTRICT';
  };
  
  // Liquidaciones -> Participantes (to)
  settlements_to: {
    parent: 'participants';
    child: 'settlements';
    parent_key: 'id';
    child_key: 'to_participant_id';
    constraint: 'ON DELETE RESTRICT';
  };
  
  // Consolidaciones -> Eventos
  consolidation_assignments_event: {
    parent: 'events';
    child: 'consolidation_assignments';
    parent_key: 'id';
    child_key: 'event_id';
    constraint: 'ON DELETE CASCADE';
  };
  
  // Consolidaciones -> Participantes (payer)
  consolidation_assignments_payer: {
    parent: 'participants';
    child: 'consolidation_assignments';
    parent_key: 'id';
    child_key: 'payer_id';
    constraint: 'ON DELETE RESTRICT';
  };
  
  // Consolidaciones -> Participantes (debtor)
  consolidation_assignments_debtor: {
    parent: 'participants';
    child: 'consolidation_assignments';
    parent_key: 'id';
    child_key: 'debtor_id';
    constraint: 'ON DELETE RESTRICT';
  };
}

// =====================================================
// 📋 ÍNDICES DE PERFORMANCE
// =====================================================

export interface DatabaseIndexes {
  // Índices de relaciones principales
  idx_event_participants_event_id: 'event_participants(event_id)';
  idx_expenses_event_id: 'expenses(event_id)';
  idx_splits_expense_id: 'splits(expense_id)';
  idx_settlements_event_id: 'settlements(event_id)';
  idx_consolidation_assignments_event_id: 'consolidation_assignments(event_id)';
  
  // Índices de sistema
  idx_app_versions_current: 'app_versions(is_current)';
  
  // Índices compuestos (recomendados para queries frecuentes)
  idx_settlements_event_paid: 'settlements(event_id, is_paid)';
  idx_expenses_event_active: 'expenses(event_id, is_active)';
  idx_participants_type_active: 'participants(participant_type, is_active)';
}

// =====================================================
// 🚀 ESQUEMA DE EXPORTACIÓN/IMPORTACIÓN
// =====================================================

/**
 * Estructura estándar para exportación/importación de datos
 */
export interface ExportSchema {
  // Metadatos de la exportación
  version: string;                        // "2.1"
  exportDate: string;                     // ISO 8601
  appVersion: string;                     // Version de la app
  
  metadata: {
    exportedBy: 'SplitSmart';
    version: string;
    exportDate: string;
    appVersion: string;
  };
  
  // Datos principales (en orden de dependencias)
  data: {
    users: UserEntity[];
    events: EventEntity[];
    participants: ParticipantEntity[];
    event_participants: EventParticipantEntity[];
    expenses: ExpenseEntity[];
    splits: SplitEntity[];
    settlements: SettlementEntity[];
    consolidation_assignments: ConsolidationAssignmentEntity[];
    app_versions: AppVersionEntity[];
  };
  
  // Estadísticas del export
  statistics: {
    totalEvents: number;
    totalParticipants: number;
    totalExpenses: number;
    totalSettlements: number;
    totalConsolidations: number;
    totalAmount: number;
    friendsCount: number;
    activeEvents: number;
    completedEvents: number;
  };
  
  // Integridad de datos
  integrity: {
    recordCounts: {
      [tableName: string]: number;
    };
    exportChecksum?: string;
  };
}

// =====================================================
// 🛡️ VALIDACIONES DE INTEGRIDAD
// =====================================================

export interface IntegrityChecks {
  // Validaciones de foreign keys
  foreignKeyConstraints: {
    [relationName: string]: {
      query: string;
      description: string;
    };
  };
  
  // Validaciones de negocio
  businessRules: {
    // Suma de splits debe igual al gasto
    splits_sum_equals_expense: string;
    
    // Balance de participante debe ser correcto
    participant_balance_integrity: string;
    
    // Estado de eventos vs liquidaciones
    event_status_consistency: string;
    
    // Consolidaciones válidas (no auto-asignaciones)
    consolidation_validity: string;
  };
  
  // Validaciones de datos
  dataValidations: {
    // Campos requeridos no nulos
    required_fields: string[];
    
    // Formatos de fecha válidos
    date_formats: string[];
    
    // Valores enum válidos
    enum_values: {
      [fieldName: string]: string[];
    };
  };
}

/**
 * 📄 Orden de importación recomendado para evitar violaciones de FK
 */
export const IMPORT_ORDER = [
  'users',                    // 1. Usuarios primero (no dependen de nada)
  'participants',             // 2. Participantes (no dependen de nada)
  'events',                   // 3. Eventos (pueden depender de users como creator)
  'event_participants',       // 4. Relaciones evento-participante
  'expenses',                 // 5. Gastos (dependen de events y participants)
  'splits',                   // 6. Divisiones (dependen de expenses y participants)
  'settlements',              // 7. Liquidaciones (dependen de events y participants)
  'consolidation_assignments',// 8. Consolidaciones (dependen de events y participants)
  'app_versions'             // 9. Versiones (independientes, van al final)
] as const;

/**
 * 🗑️ Orden de eliminación recomendado (reverso del import)
 */
export const DELETE_ORDER = [...IMPORT_ORDER].reverse();