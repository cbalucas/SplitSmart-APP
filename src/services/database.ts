import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import { Event, Participant, Expense, EventParticipant, Split, Payment } from '../types';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized: boolean = false;
  private initPromise: Promise<void> | null = null;

  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized && this.db) {
      return;
    }
    
    if (this.initPromise) {
      await this.initPromise;
      return;
    }
    
    throw new Error('Database not initialized. Call init() first.');
  }

  async init() {
    // If already initializing, wait for it
    if (this.initPromise) {
      return this.initPromise;
    }
    
    // If already initialized, return
    if (this.isInitialized && this.db) {
      console.log('ℹ️ Database already initialized');
      return Promise.resolve();
    }
    
    this.initPromise = this._initInternal();
    await this.initPromise;
    this.initPromise = null;
  }

  private async _initInternal() {
    try {
      console.log('🔄 Initializing database...');
      this.db = await SQLite.openDatabaseAsync('splitsmart.db');
      
      if (!this.db) {
        throw new Error('Failed to open database');
      }
      
      console.log('✅ Database opened, creating tables...');
      await this.createTables();
      
      console.log('✅ Tables created, running migrations...');
      await this.runMigrations();
      
      // Test query to verify database is working
      console.log('🧪 Testing database connection...');
      await this.db.getAllAsync('SELECT 1 as test');
      
      // Verify new unified table exists
      console.log('🔍 Verifying database schema...');
      const transactionsInfo = await this.db.getAllAsync('PRAGMA table_info(transactions)');
      
      if (transactionsInfo.length === 0) {
        console.log('⚠️ Transactions table missing, running migrations...');
        await this.createTables();
      }
      
      this.isInitialized = true;
      console.log('✅ Database initialized and tested successfully');
    } catch (error) {
      this.isInitialized = false;
      console.error('❌ Database initialization error:', error);
      console.error('❌ Attempting to recover...');
      
      // Try to recover by deleting and recreating
      try {
        await SQLite.deleteDatabaseAsync('splitsmart.db');
        console.log('🗑️ Deleted corrupted database');
        
        this.db = await SQLite.openDatabaseAsync('splitsmart.db');
        await this.createTables();
        await this.runMigrations();
        
        this.isInitialized = true;
        console.log('✅ Database recovered successfully');
      } catch (recoveryError) {
        this.isInitialized = false;
        console.error('❌ Failed to recover database:', recoveryError);
        throw recoveryError;
      }
    }
  }

  private async runMigrations() {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Migration: Add is_paid column to splits table if it doesn't exist
      try {
        await this.db.execAsync('ALTER TABLE splits ADD COLUMN is_paid INTEGER DEFAULT 0');
        console.log('✅ Migration: Added is_paid column to splits table');
      } catch (error: any) {
        // Column already exists, ignore error
        if (error.message?.includes('duplicate column name')) {
          console.log('⚠️ Column is_paid already exists in splits table');
        } else {
          console.error('❌ Error adding is_paid column:', error);
        }
      }

      // Migration: Add participant_type column to participants table if it doesn't exist
      try {
        await this.db.execAsync('ALTER TABLE participants ADD COLUMN participant_type TEXT DEFAULT "temporary"');
        console.log('✅ Migration: Added participant_type column to participants table');
      } catch (error: any) {
        // Column already exists, ignore error
        if (error.message?.includes('duplicate column name')) {
          console.log('⚠️ Column participant_type already exists in participants table');
        } else {
          console.error('❌ Error adding participant_type column:', error);
        }
      }

      // Migration: Add receipt_image column to expenses table if it doesn't exist
      try {
        await this.db.execAsync('ALTER TABLE expenses ADD COLUMN receipt_image TEXT');
        console.log('✅ Migration: Added receipt_image column to expenses table');
      } catch (error: any) {
        // Column already exists, ignore error
        if (error.message?.includes('duplicate column name')) {
          console.log('⚠️ Column receipt_image already exists in expenses table');
        } else {
          console.error('❌ Error adding receipt_image column:', error);
        }
      }

      // Migration obsoleta removida - payments table ya no existe, ahora se usa transactions

      // Migration: Add skip_password column to users table if it doesn't exist
      try {
        await this.db.execAsync('ALTER TABLE users ADD COLUMN skip_password INTEGER DEFAULT 0');
        console.log('✅ Migration: Added skip_password column to users table');
      } catch (error: any) {
        // Column already exists, ignore error
        if (error.message?.includes('duplicate column name')) {
          console.log('⚠️ Column skip_password already exists in users table');
        } else {
          console.error('❌ Error adding skip_password column:', error);
        }
      }

      // Migration: Add avatar column to users table if it doesn't exist
      try {
        await this.db.execAsync('ALTER TABLE users ADD COLUMN avatar TEXT');
        console.log('✅ Migration: Added avatar column to users table');
      } catch (error: any) {
        // Column already exists, ignore error
        if (error.message?.includes('duplicate column name')) {
          console.log('⚠️ Column avatar already exists in users table');
        } else {
          console.error('❌ Error adding avatar column:', error);
        }
      }

      // Migration: Add auto_logout column to users table if it doesn't exist
      try {
        await this.db.execAsync('ALTER TABLE users ADD COLUMN auto_logout TEXT DEFAULT "never"');
        console.log('✅ Migration: Added auto_logout column to users table');
      } catch (error: any) {
        // Column already exists, ignore error
        if (error.message?.includes('duplicate column name')) {
          console.log('⚠️ Column auto_logout already exists in users table');
        } else {
          console.error('❌ Error adding auto_logout column:', error);
        }
      }

      // Migration: Add privacy_share_event column to users table if it doesn't exist
      try {
        await this.db.execAsync('ALTER TABLE users ADD COLUMN privacy_share_event INTEGER DEFAULT 1');
        console.log('✅ Migration: Added privacy_share_event column to users table');
      } catch (error: any) {
        // Column already exists, ignore error
        if (error.message?.includes('duplicate column name')) {
          console.log('⚠️ Column privacy_share_event already exists in users table');
        } else {
          console.error('❌ Error adding privacy_share_event column:', error);
        }
      }

      // Migration: Add closed_at column to events table if it doesn't exist
      try {
        const eventsInfo = await this.db.getAllAsync('PRAGMA table_info(events)');
        const hasClosedAt = eventsInfo.some((col: any) => col.name === 'closed_at');
        
        if (!hasClosedAt) {
          await this.db.execAsync('ALTER TABLE events ADD COLUMN closed_at TEXT');
          console.log('✅ Migration: Added closed_at column to events table');
        } else {
          console.log('⚠️ Column closed_at already exists in events table');
        }
      } catch (error: any) {
        console.error('❌ Error in closed_at migration for events:', error);
      }

      // Migration: Add completed_at column to events table if it doesn't exist
      try {
        const eventsInfo = await this.db.getAllAsync('PRAGMA table_info(events)');
        const hasCompletedAt = eventsInfo.some((col: any) => col.name === 'completed_at');
        
        if (!hasCompletedAt) {
          await this.db.execAsync('ALTER TABLE events ADD COLUMN completed_at TEXT');
          console.log('✅ Migration: Added completed_at column to events table');
        } else {
          console.log('⚠️ Column completed_at already exists in events table');
        }
      } catch (error: any) {
        console.error('❌ Error in completed_at migration for events:', error);
      }

      // Migration: Update status CHECK constraint to include 'closed'
      // SQLite doesn't support ALTER to modify CHECK constraints, so we need to recreate the table
      try {
        // Check if events table exists and get its schema
        const tableInfo = await this.db.getAllAsync(`SELECT sql FROM sqlite_master WHERE type='table' AND name='events'`);
        
        if (tableInfo.length > 0) {
          const tableSchema = (tableInfo[0] as any).sql as string;
          
          // Check if the constraint includes 'closed'
          if (tableSchema && !tableSchema.includes("'closed'")) {
            console.log('🔄 Migrating events table to support "closed" status...');
            
            // Get all existing events data
            const existingEvents = await this.db.getAllAsync('SELECT * FROM events');
            
            // Rename old table
            await this.db.execAsync('ALTER TABLE events RENAME TO events_old');
            
            // Create new table with updated constraint
            await this.db.execAsync(`
              CREATE TABLE events (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                start_date TEXT NOT NULL,
                location TEXT,
                currency TEXT NOT NULL DEFAULT 'ARS',
                total_amount REAL DEFAULT 0,
                status TEXT CHECK(status IN ('active', 'closed', 'completed', 'archived')) DEFAULT 'active',
                type TEXT CHECK(type IN ('public', 'private')) DEFAULT 'public',
                category TEXT DEFAULT 'evento',
                creator_id TEXT,
                closed_at TEXT,
                completed_at TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
              )
            `);
            
            // Copy data from old table to new table
            if (existingEvents.length > 0) {
              for (const event of existingEvents) {
                const evt = event as any;
                await this.db.runAsync(
                  `INSERT INTO events (id, name, description, start_date, location, currency, total_amount, status, type, category, creator_id, closed_at, completed_at, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [
                    evt.id, evt.name, evt.description, evt.start_date, evt.location,
                    evt.currency, evt.total_amount, evt.status, evt.type, evt.category,
                    evt.creator_id, evt.closed_at, evt.completed_at, evt.created_at, evt.updated_at
                  ]
                );
              }
            }
            
            // Drop old table
            await this.db.execAsync('DROP TABLE events_old');
            
            console.log('✅ Migration: Events table updated to support "closed" status');
          } else {
            console.log('⚠️ Events table already supports "closed" status');
          }
        }
      } catch (error: any) {
        console.error('❌ Error migrating events table status constraint:', error);
      }

      // Migration: Actualizar usuarios existentes - cambiar default notifications_payment_received a 0
      try {
        const result = await this.db.runAsync('UPDATE users SET notifications_payment_received = 0 WHERE notifications_payment_received = 1');
        console.log('✅ Updated', result.changes, 'existing users notification preferences to default OFF');
      } catch (error: any) {
        console.log('⚠️ Error updating notification preferences:', error);
      }

      // Migration: Add event_status column to settlements table
      try {
        // Check if event_status column exists
        const settlementsColumns = await this.db.getAllAsync(`PRAGMA table_info(settlements)`);
        const hasEventStatus = settlementsColumns.some((col: any) => col.name === 'event_status');
        
        if (!hasEventStatus) {
          await this.db.execAsync('ALTER TABLE settlements ADD COLUMN event_status TEXT NOT NULL DEFAULT "active"');
          console.log('✅ Migration: Added event_status column to settlements table');
        } else {
          console.log('⚠️ Column event_status already exists in settlements table');
        }
      } catch (error: any) {
        console.error('❌ Error in event_status migration for settlements:', error);
      }

      // Migration: Initialize app versions data
      try {
        await this.initializeVersionHistory();
        console.log('✅ Migration: Version history initialized');
      } catch (error: any) {
        console.error('❌ Error initializing version history:', error);
      }

    } catch (error) {
      console.error('❌ Error running migrations:', error);
    }
  }

  private async dropAndRecreateDatabase() {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Drop all existing tables including problematic legacy ones
      await this.db.execAsync('DROP TABLE IF EXISTS transactions');
      await this.db.execAsync('DROP TABLE IF EXISTS splits');
      await this.db.execAsync('DROP TABLE IF EXISTS expenses');
      await this.db.execAsync('DROP TABLE IF EXISTS event_participants');
      await this.db.execAsync('DROP TABLE IF EXISTS participants');
      await this.db.execAsync('DROP TABLE IF EXISTS events');
      await this.db.execAsync('DROP TABLE IF EXISTS users');
      await this.db.execAsync('DROP TABLE IF EXISTS app_versions');
      // Drop problematic legacy tables
      await this.db.execAsync('DROP TABLE IF EXISTS settlements_legacy');
      await this.db.execAsync('DROP TABLE IF EXISTS payments_legacy');
      await this.db.execAsync('DROP TABLE IF EXISTS document_views');
      await this.db.execAsync('DROP TABLE IF EXISTS expense_splits');
      await this.db.execAsync('DROP TABLE IF EXISTS participant_inclusion_rules');
      
      console.log('🗑️ Dropped existing tables');
      await this.createTables();
    } catch (error) {
      console.error('❌ Error dropping and recreating database:', error);
      throw error;
    }
  }

  // ===== VERSION MANAGEMENT METHODS =====
  private async initializeVersionHistory() {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Check if versions already exist
      const existingVersions = await this.db.getAllAsync('SELECT COUNT(*) as count FROM app_versions');
      const versionCount = (existingVersions[0] as any)?.count || 0;

      if (versionCount === 0) {
        console.log('🔄 Initializing version history...');
        
        // Insert version 1.0.0 - Foundation
        await this.db.runAsync(`
          INSERT INTO app_versions (
            version, version_name, release_date, is_current, 
            changelog_improvements, changelog_features, changelog_bugfixes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          '1.0.0',
          'Lanzamiento Inicial',
          '1 Oct 2025',
          0, // Not current version
          JSON.stringify([]),
          JSON.stringify([
            'Gestión de gastos compartidos',
            'Creación y administración de eventos',
            'Cálculos automáticos de liquidaciones',
            'Sistema de usuarios y perfiles básico'
          ]),
          JSON.stringify([]),
          '2025-10-01T00:00:00.000Z'
        ]);

        // Insert consolidated version 1.1.0 with all evolved features
        await this.db.runAsync(`
          INSERT INTO app_versions (
            version, version_name, release_date, is_current, 
            changelog_improvements, changelog_features, changelog_bugfixes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          '1.1.0',
          'Versión Consolidada',
          '11 Dic 2025',
          1, // Is current version
          JSON.stringify([
            'Perfil de usuario completamente renovado',
            'Validaciones mejoradas en formularios',
            'Botones de edición más intuitivos',
            'Avatar editable directamente',
            'Interfaz de liquidaciones mejorada',
            'Cálculos de gastos optimizados',
            'Rendimiento general mejorado',
            'Interfaz de usuario refinada'
          ]),
          JSON.stringify([
            'Gestión avanzada de eventos y participantes',
            'Sistema completo de exportación/importación',
            'Notificaciones WhatsApp integradas',
            'Temas claro/oscuro',
            'Soporte para múltiples monedas',
            'Auto-logout configurable',
            'Sistema de privacidad y notificaciones',
            'Gestión completa de liquidaciones',
            'Avatar editable con cámara/galería',
            'Modal de historial de versiones'
          ]),
          JSON.stringify([
            'Alineación de botones en modo edición',
            'Visibilidad mejorada en modo oscuro',
            'Errores de validación de campos',
            'Problemas de base de datos corregidos',
            'Migraciones de esquema implementadas',
            'Duplicaciones de liquidaciones solucionadas',
            'Persistencia de notificaciones corregida',
            'Iconos alineados correctamente',
            'Estabilidad general mejorada'
          ]),
          new Date().toISOString()
        ]);

        console.log('✅ Version history initialized with consolidated v1.1.0');
      } else {
        console.log('⚠️ Version history already exists');
      }
    } catch (error) {
      console.error('❌ Error initializing version history:', error);
      throw error;
    }
  }

  async getCurrentVersion(): Promise<{ version: string; versionName: string } | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const result = await this.db.getFirstAsync(
        'SELECT version, version_name FROM app_versions WHERE is_current = 1 ORDER BY created_at DESC LIMIT 1'
      ) as any;
      
      return result ? { 
        version: result.version, 
        versionName: result.version_name || result.version 
      } : null;
    } catch (error) {
      console.error('❌ Error getting current version:', error);
      return null;
    }
  }

  async getVersionHistory(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const versions = await this.db.getAllAsync(`
        SELECT * FROM app_versions 
        ORDER BY created_at DESC
      `);
      
      return versions.map((v: any) => ({
        ...v,
        changelog_improvements: v.changelog_improvements ? JSON.parse(v.changelog_improvements) : [],
        changelog_features: v.changelog_features ? JSON.parse(v.changelog_features) : [],
        changelog_bugfixes: v.changelog_bugfixes ? JSON.parse(v.changelog_bugfixes) : []
      }));
    } catch (error) {
      console.error('❌ Error getting version history:', error);
      return [];
    }
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log('✅ Creating tables if they don\'t exist...');

      // Events table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          start_date TEXT NOT NULL,
          location TEXT,
          currency TEXT NOT NULL DEFAULT 'ARS',
          total_amount REAL DEFAULT 0,
          status TEXT CHECK(status IN ('active', 'closed', 'completed', 'archived')) DEFAULT 'active',
          type TEXT CHECK(type IN ('public', 'private')) DEFAULT 'public',
          category TEXT DEFAULT 'evento',
          creator_id TEXT,
          closed_at TEXT,
          completed_at TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )
      `);

      // Participants table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS participants (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          alias_cbu TEXT,
          avatar TEXT,
          is_active INTEGER DEFAULT 1,
          participant_type TEXT CHECK(participant_type IN ('friend', 'temporary')) DEFAULT 'temporary',
          created_at TEXT,
          updated_at TEXT
        )
      `);

      // Event Participants relationship table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS event_participants (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          participant_id TEXT NOT NULL,
          role TEXT CHECK(role IN ('owner', 'admin', 'member', 'viewer')) DEFAULT 'member',
          balance REAL DEFAULT 0,
          joined_at TEXT,
          FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
          FOREIGN KEY (participant_id) REFERENCES participants (id) ON DELETE CASCADE,
          UNIQUE(event_id, participant_id)
        )
      `);

      // Expenses table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          description TEXT NOT NULL,
          amount REAL NOT NULL,
          currency TEXT NOT NULL DEFAULT 'USD',
          date TEXT NOT NULL,
          category TEXT,
          payer_id TEXT NOT NULL,
          receipt_image TEXT,
          is_active INTEGER DEFAULT 1,
          created_at TEXT,
          updated_at TEXT,
          FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
          FOREIGN KEY (payer_id) REFERENCES participants (id)
        )
      `);

      // Splits table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS splits (
          id TEXT PRIMARY KEY,
          expense_id TEXT NOT NULL,
          participant_id TEXT NOT NULL,
          amount REAL NOT NULL,
          percentage REAL,
          type TEXT CHECK(type IN ('equal', 'fixed', 'percentage', 'custom')) DEFAULT 'equal',
          is_paid INTEGER DEFAULT 0,
          created_at TEXT,
          updated_at TEXT,
          FOREIGN KEY (expense_id) REFERENCES expenses (id) ON DELETE CASCADE,
          FOREIGN KEY (participant_id) REFERENCES participants (id) ON DELETE CASCADE
        )
      `);

      // Settlements table unificada (liquidaciones con pagos)
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS settlements (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          from_participant_id TEXT NOT NULL,
          from_participant_name TEXT NOT NULL,
          to_participant_id TEXT NOT NULL,
          to_participant_name TEXT NOT NULL,
          amount REAL NOT NULL,
          
          -- ESTADO DE PAGO SIMPLE
          is_paid INTEGER DEFAULT 0,
          paid_at TEXT,
          
          -- ESTADO DEL EVENTO CUANDO SE CREA/ACTUALIZA LA LIQUIDACIÓN
          event_status TEXT NOT NULL DEFAULT 'active',
          
          -- METADATOS DEL PAGO
          receipt_image TEXT,
          notes TEXT,
          
          -- AUDITORIA
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          
          -- RELACIONES
          FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE,
          FOREIGN KEY (from_participant_id) REFERENCES participants (id),
          FOREIGN KEY (to_participant_id) REFERENCES participants (id)
        )
      `);

      // Migrar datos existentes de transactions a settlements
      await this.migrateTransactionsToSettlements();

      // Users table for profile data
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          phone TEXT,
          alias_cbu TEXT,
          avatar TEXT,
          preferred_currency TEXT DEFAULT 'ARS',
          auto_logout TEXT DEFAULT 'never',
          skip_password INTEGER DEFAULT 0,
          notifications_expense_added INTEGER DEFAULT 1,
          notifications_payment_received INTEGER DEFAULT 0,
          notifications_event_updated INTEGER DEFAULT 0,
          notifications_weekly_report INTEGER DEFAULT 0,
          privacy_share_email INTEGER DEFAULT 0,
          privacy_share_phone INTEGER DEFAULT 0,
          privacy_allow_invitations INTEGER DEFAULT 1,
          privacy_share_event INTEGER DEFAULT 1,
          created_at TEXT,
          updated_at TEXT
        )
      `);

      // Create indexes for better performance
      // App Versions table for version history management
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS app_versions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          version TEXT UNIQUE NOT NULL,
          version_name TEXT,
          release_date TEXT NOT NULL,
          is_current INTEGER DEFAULT 0,
          changelog_improvements TEXT,
          changelog_features TEXT,
          changelog_bugfixes TEXT,
          created_at TEXT NOT NULL
        )
      `);

      await this.db.execAsync(`CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON event_participants(event_id)`);
      await this.db.execAsync(`CREATE INDEX IF NOT EXISTS idx_expenses_event_id ON expenses(event_id)`);
      await this.db.execAsync(`CREATE INDEX IF NOT EXISTS idx_splits_expense_id ON splits(expense_id)`);
      await this.db.execAsync(`CREATE INDEX IF NOT EXISTS idx_settlements_event_id ON settlements(event_id)`);
      await this.db.execAsync(`CREATE INDEX IF NOT EXISTS idx_app_versions_current ON app_versions(is_current)`);

      console.log('✅ All tables and indexes created successfully');
      
      // Crear el usuario demo si no existe
      await this.createDemoUserIfNotExists();
      
      console.log('✅ Database tables ready and demo user verified');
    } catch (error) {
      console.error('❌ Error creating tables:', error);
      throw error;
    }
  }

  private async createDemoUserIfNotExists(): Promise<void> {
    try {
      const demoUser = await this.getUserByCredential('demo');
      if (!demoUser) {
        console.log('📝 Creating demo user...');
        await this.createUser({
          id: 'demo-user',
          name: 'Usuario Demo',
          username: 'demo',
          email: 'demo@splitsmart.com',
          password: '',
          skipPassword: true
        });
        console.log('✅ Demo user created in database with skipPassword');
      } else {
        console.log('✅ Demo user already exists');
      }
    } catch (error) {
      console.error('❌ Error creating demo user:', error);
    }
  }

  // Events CRUD
  async createEvent(event: Omit<Event, 'totalAmount'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        `INSERT INTO events (id, name, description, start_date, location, currency, status, type, category, creator_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          event.id,
          event.name,
          event.description || null,
          event.startDate,
          event.location || null,
          event.currency,
          event.status,
          event.type,
          event.category || null,
          event.creatorId || null,
          event.createdAt,
          event.updatedAt
        ]
      );
    } catch (error) {
      console.error('❌ Error creating event:', error);
      throw error;
    }
  }

  async updateEvent(id: string, updates: Partial<Event>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Construir la consulta dinámicamente basada en los campos a actualizar
      const fields = [];
      const values = [];
      
      if (updates.name !== undefined) {
        fields.push('name = ?');
        values.push(updates.name);
      }
      if (updates.description !== undefined) {
        fields.push('description = ?');
        values.push(updates.description);
      }
      if (updates.startDate !== undefined) {
        fields.push('start_date = ?');
        values.push(updates.startDate);
      }
      if (updates.location !== undefined) {
        fields.push('location = ?');
        values.push(updates.location);
      }
      if (updates.currency !== undefined) {
        fields.push('currency = ?');
        values.push(updates.currency);
      }
      if (updates.status !== undefined) {
        fields.push('status = ?');
        values.push(updates.status);
      }
      if (updates.type !== undefined) {
        fields.push('type = ?');
        values.push(updates.type);
      }
      if (updates.category !== undefined) {
        fields.push('category = ?');
        values.push(updates.category);
      }
      if (updates.closedAt !== undefined) {
        fields.push('closed_at = ?');
        values.push(updates.closedAt);
      }
      if (updates.completedAt !== undefined) {
        fields.push('completed_at = ?');
        values.push(updates.completedAt);
      }
      
      // Siempre actualizar updated_at
      fields.push('updated_at = ?');
      values.push(new Date().toISOString());
      
      // Añadir el ID al final
      values.push(id);
      
      const query = `UPDATE events SET ${fields.join(', ')} WHERE id = ?`;
      
      await this.db.runAsync(query, values);
      
      console.log('✅ Event updated successfully:', id);
    } catch (error) {
      console.error('❌ Error updating event:', error);
      throw error;
    }
  }

  async deleteEvent(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Eliminar en orden por dependencias
      await this.db.runAsync('DELETE FROM settlements WHERE event_id = ?', [id]);
      await this.db.runAsync('DELETE FROM splits WHERE expense_id IN (SELECT id FROM expenses WHERE event_id = ?)', [id]);
      await this.db.runAsync('DELETE FROM expenses WHERE event_id = ?', [id]);
      await this.db.runAsync('DELETE FROM event_participants WHERE event_id = ?', [id]);
      await this.db.runAsync('DELETE FROM events WHERE id = ?', [id]);
      
      console.log('✅ Event and related data deleted successfully:', id);
    } catch (error) {
      console.error('❌ Error deleting event:', error);
      throw error;
    }
  }

  async getEvents(): Promise<Event[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync('SELECT * FROM events ORDER BY created_at DESC');
      return result.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        startDate: row.start_date,
        location: row.location,
        currency: row.currency,
        totalAmount: row.total_amount,
        status: row.status,
        type: row.type,
        category: row.category,
        creatorId: row.creator_id,
        closedAt: row.closed_at,
        completedAt: row.completed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('❌ Error getting events:', error);
      throw error;
    }
  }

  async getEventById(eventId: string): Promise<Event | null> {
    if (!this.db || !this.isInitialized) {
      console.error('❌ Database not ready in getEventById. Initialized:', this.isInitialized);
      return null;
    }

    try {
      console.log(`📥 Getting event by ID: ${eventId}`);
      const result = await this.db.getFirstAsync(
        'SELECT * FROM events WHERE id = ?',
        [eventId]
      );
      
      if (!result) {
        console.log(`❌ Event not found: ${eventId}`);
        return null;
      }

      return {
        id: result.id,
        name: result.name,
        description: result.description,
        startDate: result.start_date,
        location: result.location,
        currency: result.currency,
        totalAmount: result.total_amount,
        status: result.status,
        type: result.type,
        category: result.category,
        creatorId: result.creator_id,
        closedAt: result.closed_at,
        completedAt: result.completed_at,
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };
    } catch (error) {
      console.error('❌ Error getting event by ID:', error);
      return null;
    }
  }

  // Participants CRUD
  async createParticipant(participant: Participant): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        `INSERT INTO participants (id, name, email, phone, alias_cbu, avatar, is_active, participant_type, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          participant.id,
          participant.name,
          participant.email || null,
          participant.phone || null,
          participant.alias_cbu || null,
          participant.avatar || null,
          participant.isActive ? 1 : 0,
          participant.participantType || 'temporary',
          participant.createdAt || new Date().toISOString(),
          participant.updatedAt || new Date().toISOString()
        ]
      );
    } catch (error) {
      console.error('❌ Error creating participant:', error);
      throw error;
    }
  }

  async getParticipants(): Promise<Participant[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync('SELECT * FROM participants WHERE is_active = 1');
      return result.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        alias_cbu: row.alias_cbu,
        avatar: row.avatar,
        isActive: row.is_active === 1,
        participantType: row.participant_type || 'temporary',
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('❌ Error getting participants:', error);
      throw error;
    }
  }

  async getParticipantById(participantId: string): Promise<Participant | null> {
    if (!this.db || !this.isInitialized) {
      console.error('❌ Database not ready in getParticipantById. Initialized:', this.isInitialized);
      return null;
    }

    try {
      console.log(`📥 Getting participant by ID: ${participantId}`);
      const result = await this.db.getFirstAsync(
        'SELECT * FROM participants WHERE id = ? AND is_active = 1',
        [participantId]
      );
      
      if (!result) {
        console.log(`❌ Participant not found: ${participantId}`);
        return null;
      }

      return {
        id: result.id,
        name: result.name,
        email: result.email,
        phone: result.phone,
        alias_cbu: result.alias_cbu,
        avatar: result.avatar,
        isActive: result.is_active === 1,
        participantType: result.participant_type || 'temporary',
        createdAt: result.created_at,
        updatedAt: result.updated_at
      };
    } catch (error) {
      console.error('❌ Error getting participant by ID:', error);
      return null;
    }
  }

  async getExpenses(): Promise<Expense[]> {
    if (!this.db || !this.isInitialized) {
      console.error('❌ Database not ready in getExpenses. Initialized:', this.isInitialized);
      return []; // Return empty array instead of throwing
    }

    try {
      console.log('📥 Getting all expenses...');
      const result = await this.db.getAllAsync(
        'SELECT * FROM expenses WHERE is_active = 1 ORDER BY date DESC'
      );
      
      console.log(`✅ Found ${result.length} expenses`);
      
      return result.map((row: any) => ({
        id: row.id,
        eventId: row.event_id,
        description: row.description,
        amount: row.amount,
        currency: row.currency,
        date: row.date,
        category: row.category,
        payerId: row.payer_id,
        receiptImage: row.receipt_image,
        isActive: row.is_active === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('❌ Error getting expenses:', error);
      throw error;
    }
  }

  // Get only friends (permanent participants)
  async getFriends(): Promise<Participant[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM participants WHERE is_active = 1 AND participant_type = ? ORDER BY name ASC',
        ['friend']
      );
      return result.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        alias_cbu: row.alias_cbu,
        avatar: row.avatar,
        isActive: row.is_active === 1,
        participantType: row.participant_type,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('❌ Error getting friends:', error);
      throw error;
    }
  }

  // Update participant type (convert temporary to friend or vice versa)
  async updateParticipantType(id: string, type: 'friend' | 'temporary'): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        'UPDATE participants SET participant_type = ?, updated_at = ? WHERE id = ?',
        [type, new Date().toISOString(), id]
      );
      console.log(`✅ Participant ${id} updated to ${type}`);
    } catch (error) {
      console.error('❌ Error updating participant type:', error);
      throw error;
    }
  }

  // Update participant information
  async updateParticipant(id: string, updates: Partial<Participant>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (updates.name !== undefined) {
        fields.push('name = ?');
        values.push(updates.name);
      }
      if (updates.email !== undefined) {
        fields.push('email = ?');
        values.push(updates.email || null);
      }
      if (updates.phone !== undefined) {
        fields.push('phone = ?');
        values.push(updates.phone || null);
      }
      if (updates.alias_cbu !== undefined) {
        fields.push('alias_cbu = ?');
        values.push(updates.alias_cbu || null);
      }
      if (updates.avatar !== undefined) {
        fields.push('avatar = ?');
        values.push(updates.avatar || null);
      }
      if (updates.participantType !== undefined) {
        fields.push('participant_type = ?');
        values.push(updates.participantType);
      }

      fields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(id);

      await this.db.runAsync(
        `UPDATE participants SET ${fields.join(', ')} WHERE id = ?`,
        values
      );
      console.log(`✅ Participant ${id} updated successfully`);
    } catch (error) {
      console.error('❌ Error updating participant:', error);
      throw error;
    }
  }

  // Delete participant (only if not used in any events)
  async deleteParticipant(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Check if participant is used in any event
      const result = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM event_participants WHERE participant_id = ?',
        [id]
      );

      if (result && result.count > 0) {
        throw new Error('Cannot delete participant: still used in events');
      }

      await this.db.runAsync('DELETE FROM participants WHERE id = ?', [id]);
      console.log(`✅ Participant ${id} deleted successfully`);
    } catch (error) {
      console.error('❌ Error deleting participant:', error);
      throw error;
    }
  }

  // Event Participants CRUD
  async addParticipantToEvent(eventParticipant: EventParticipant): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        `INSERT INTO event_participants (id, event_id, participant_id, role, balance, joined_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          eventParticipant.id,
          eventParticipant.eventId,
          eventParticipant.participantId,
          eventParticipant.role,
          eventParticipant.balance || 0,
          eventParticipant.joinedAt || new Date().toISOString()
        ]
      );
    } catch (error) {
      console.error('❌ Error adding participant to event:', error);
      throw error;
    }
  }

  async getEventParticipants(eventId: string): Promise<(Participant & { role: EventParticipant['role']; balance: number; joinedAt: string })[]> {
    if (!this.db || !this.isInitialized) {
      console.error('❌ Database not ready in getEventParticipants. Initialized:', this.isInitialized);
      return []; // Return empty array instead of throwing
    }

    try {
      console.log(`📥 Getting participants for event: ${eventId}`);
      const result = await this.db.getAllAsync(
        `SELECT p.*, ep.role, ep.balance, ep.joined_at
         FROM participants p
         JOIN event_participants ep ON p.id = ep.participant_id
         WHERE ep.event_id = ? AND p.is_active = 1`,
        [eventId]
      );
      
      console.log(`✅ Found ${result.length} participants for event ${eventId}`);
      
      return result.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        alias_cbu: row.alias_cbu,
        avatar: row.avatar,
        isActive: row.is_active === 1,
        participantType: row.participant_type || 'temporary',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        role: row.role,
        balance: row.balance,
        joinedAt: row.joined_at
      }));
    } catch (error) {
      console.error('❌ Error getting event participants:', error);
      console.error('❌ Event ID:', eventId);
      console.error('❌ Database state:', this.db ? 'initialized' : 'null');
      return []; // Return empty array instead of throwing
    }
  }

  // Expenses CRUD
  async createExpense(expense: Expense): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        `INSERT INTO expenses (id, event_id, description, amount, currency, date, category, payer_id, receipt_image, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          expense.id,
          expense.eventId,
          expense.description,
          expense.amount,
          expense.currency,
          expense.date,
          expense.category || null,
          expense.payerId,
          expense.receiptImage || null,
          expense.isActive ? 1 : 0,
          expense.createdAt || new Date().toISOString(),
          expense.updatedAt || new Date().toISOString()
        ]
      );

      // 🔄 RECALCULAR LIQUIDACIONES AUTOMÁTICAMENTE
      await this.recalculateSettlementsForEvent(expense.eventId);
      
    } catch (error) {
      console.error('❌ Error creating expense:', error);
      throw error;
    }
  }

  // Función auxiliar para crear expense sin recalcular automáticamente (para el flujo con splits)
  async createExpenseWithoutRecalculation(expense: Expense): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        `INSERT INTO expenses (id, event_id, description, amount, currency, date, category, payer_id, receipt_image, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          expense.id,
          expense.eventId,
          expense.description,
          expense.amount,
          expense.currency,
          expense.date,
          expense.category || null,
          expense.payerId,
          expense.receiptImage || null,
          expense.isActive !== false ? 1 : 0,
          expense.createdAt || new Date().toISOString(),
          expense.updatedAt || new Date().toISOString()
        ]
      );

      // NO recalcular automáticamente - se hará manualmente después de crear splits
      
    } catch (error) {
      console.error('❌ Error creating expense (without recalculation):', error);
      throw error;
    }
  }

  async getExpensesByEvent(eventId: string): Promise<Expense[]> {
    if (!this.db || !this.isInitialized) {
      console.error('❌ Database not ready in getExpensesByEvent. Initialized:', this.isInitialized);
      return []; // Return empty array instead of throwing
    }

    try {
      console.log(`📥 Getting expenses for event: ${eventId}`);
      const result = await this.db.getAllAsync(
        'SELECT * FROM expenses WHERE event_id = ? AND is_active = 1 ORDER BY date DESC',
        [eventId]
      );
      
      console.log(`✅ Found ${result.length} expenses for event ${eventId}`);
      
      return result.map((row: any) => ({
        id: row.id,
        eventId: row.event_id,
        description: row.description,
        amount: row.amount,
        currency: row.currency,
        date: row.date,
        category: row.category,
        payerId: row.payer_id,
        receiptImage: row.receipt_image,
        isActive: row.is_active === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('❌ Error getting expenses by event:', error);
      throw error;
    }
  }

  // Splits CRUD
  async createSplit(split: Split): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        `INSERT INTO splits (id, expense_id, participant_id, amount, percentage, type, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          split.id,
          split.expenseId,
          split.participantId,
          split.amount,
          split.percentage || null,
          split.type || 'equal',
          split.createdAt || new Date().toISOString(),
          split.updatedAt || new Date().toISOString()
        ]
      );
    } catch (error) {
      console.error('❌ Error creating split:', error);
      throw error;
    }
  }

  async getSplitsByExpense(expenseId: string): Promise<Split[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM splits WHERE expense_id = ?',
        [expenseId]
      );
      
      return result.map((row: any) => ({
        id: row.id,
        expenseId: row.expense_id,
        participantId: row.participant_id,
        amount: row.amount,
        percentage: row.percentage,
        type: row.type,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('❌ Error getting splits by expense:', error);
      throw error;
    }
  }

  async getSplitsByEvent(eventId: string): Promise<Split[]> {
    if (!this.db || !this.isInitialized) {
      console.error('❌ Database not ready in getSplitsByEvent. Initialized:', this.isInitialized);
      return []; // Return empty array instead of throwing
    }

    try {
      console.log(`📥 Getting splits for event: ${eventId}`);
      const result = await this.db.getAllAsync(`
        SELECT s.* FROM splits s
        INNER JOIN expenses e ON s.expense_id = e.id
        WHERE e.event_id = ?
      `, [eventId]);
      
      console.log(`✅ Found ${result.length} splits for event ${eventId}`);
      
      return result.map((row: any) => ({
        id: row.id,
        expenseId: row.expense_id,
        participantId: row.participant_id,
        amount: row.amount,
        percentage: row.percentage,
        type: row.type,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('❌ Error getting splits by event:', error);
      console.error('❌ Event ID:', eventId);
      console.error('❌ Database state:', this.db ? 'initialized' : 'null');
      return []; // Return empty array instead of throwing
    }
  }

  async getSplits(): Promise<Split[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log('📥 Getting all splits');
      const rows = await this.db.getAllAsync(
        `SELECT * FROM splits ORDER BY created_at DESC`
      );
      
      const splits: Split[] = (rows as any[]).map((row: any) => ({
        id: row.id,
        expenseId: row.expense_id,
        participantId: row.participant_id,
        amount: row.amount,
        isPaid: Boolean(row.is_paid),
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      console.log(`📊 Got ${splits.length} splits`);
      return splits;
    } catch (error) {
      console.error('❌ Error getting all splits:', error);
      throw error;
    }
  }

  // Transactions CRUD (DEPRECATED - usar settlements)
  async createTransaction(transaction: any): Promise<void> {
    console.warn('⚠️ createTransaction is deprecated. Use createSettlement instead.');
    
    // Convertir transaction a settlement
    const settlement = {
      id: transaction.id,
      eventId: transaction.eventId,
      fromParticipantId: transaction.fromParticipantId,
      fromParticipantName: transaction.fromParticipantName,
      toParticipantId: transaction.toParticipantId,
      toParticipantName: transaction.toParticipantName,
      amount: transaction.amount,
      isPaid: transaction.status === 'confirmed',
      paidAt: transaction.confirmedAt,
      receiptImage: transaction.receiptImage,
      notes: transaction.notes,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    };
    
    await this.createSettlement(settlement);
  }

  // Método legacy para compatibilidad con Payment
  async createPayment(payment: Payment): Promise<void> {
    console.warn('⚠️ createPayment is deprecated. Payments are now handled as paid settlements.');
    
    // Crear un settlement marcado como pagado
    const settlement = {
      id: payment.id,
      eventId: payment.eventId,
      fromParticipantId: payment.fromParticipantId,
      fromParticipantName: 'Manual Payment',
      toParticipantId: payment.toParticipantId,
      toParticipantName: 'Manual Payment',
      amount: payment.amount,
      isPaid: payment.isConfirmed,
      paidAt: payment.isConfirmed ? payment.date : null,
      receiptImage: payment.receiptImage,
      notes: payment.notes,
      createdAt: payment.createdAt || new Date().toISOString(),
      updatedAt: payment.updatedAt || new Date().toISOString()
    };
    await this.createSettlement(settlement);
  }

  async getPaymentsByEvent(eventId: string): Promise<Payment[]> {
    if (!this.db || !this.isInitialized) {
      console.error('❌ Database not ready in getPaymentsByEvent. Initialized:', this.isInitialized);
      return []; // Return empty array instead of throwing
    }

    try {
      console.log(`📥 Getting payments for event: ${eventId}`);
      // Obtener settlements pagados como payments para compatibilidad
      const result = await this.db.getAllAsync(
        'SELECT * FROM settlements WHERE event_id = ? AND is_paid = 1 ORDER BY paid_at DESC',
        [eventId]
      );
      
      console.log(`✅ Found ${result.length} payments (paid settlements) for event ${eventId}`);
      
      return result.map((row: any) => ({
        id: `settlement_payment_${row.id}`,
        eventId: row.event_id,
        fromParticipantId: row.from_participant_id,
        toParticipantId: row.to_participant_id,
        amount: row.amount,
        date: row.paid_at || row.updated_at,
        notes: row.notes || 'Pago de liquidación',
        receiptImage: row.receipt_image,
        isConfirmed: true, // Los settlements pagados siempre están confirmados
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('❌ Error getting payments by event:', error);
      console.error('❌ Event ID:', eventId);
      console.error('❌ Database state:', this.db ? 'initialized' : 'null');
      return []; // Return empty array instead of throwing
    }
  }

  async getTransactionsByEvent(eventId: string, type?: 'calculated' | 'manual' | 'payment'): Promise<any[]> {
    if (!this.db || !this.isInitialized) {
      console.error('❌ Database not ready in getTransactionsByEvent. Initialized:', this.isInitialized);
      return [];
    }

    try {
      // Con la nueva estructura, solo tenemos settlements
      // 'calculated' = todos los settlements
      // 'payment' = settlements pagados (is_paid = 1)
      // 'manual' = no aplica, devolvemos array vacío para compatibilidad
      
      if (type === 'manual') {
        console.log(`⚠️ Manual transactions no longer exist, returning empty array`);
        return [];
      }
      
      let query = 'SELECT * FROM settlements WHERE event_id = ?';
      let params = [eventId];
      
      if (type === 'payment') {
        query += ' AND is_paid = 1';
      }
      
      query += ' ORDER BY created_at DESC';
      
      const settlements = await this.db.getAllAsync(query, params);
      
      return settlements.map((s: any) => ({
        id: s.id,
        eventId: s.event_id,
        fromParticipantId: s.from_participant_id,
        fromParticipantName: s.from_participant_name,
        toParticipantId: s.to_participant_id,
        toParticipantName: s.to_participant_name,
        amount: s.amount,
        type: type || 'calculated',
        status: s.is_paid ? 'confirmed' : 'pending',
        date: s.paid_at || s.created_at,
        notes: s.notes,
        receiptImage: s.receipt_image,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
        confirmedAt: s.confirmed_at,
        // Campos legacy para compatibilidad
        isConfirmed: s.status === 'confirmed',
        isPaid: s.status === 'confirmed'
      }));
    } catch (error) {
      console.error('❌ Error getting transactions by event:', error);
      return [];
    }
  }

  async updatePayment(paymentId: string, updates: Partial<Payment>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const updateFields: string[] = [];
      const values: any[] = [];

      if (updates.notes !== undefined) {
        updateFields.push('notes = ?');
        values.push(updates.notes);
      }
      if (updates.receiptImage !== undefined) {
        updateFields.push('receipt_image = ?');
        values.push(updates.receiptImage);
      }
      if (updates.isConfirmed !== undefined) {
        updateFields.push('status = ?');
        values.push(updates.isConfirmed ? 'confirmed' : 'pending');
        if (updates.isConfirmed) {
          updateFields.push('confirmed_at = ?');
          values.push(new Date().toISOString());
        } else {
          updateFields.push('confirmed_at = ?');
          values.push(null);
        }
      }

      updateFields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(paymentId);

      await this.db.runAsync(
        `UPDATE transactions SET ${updateFields.join(', ')} WHERE id = ? AND type = 'manual'`,
        values
      );
    } catch (error) {
      console.error('❌ Error updating payment:', error);
      throw error;
    }
  }

  async updateTransaction(transactionId: string, updates: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const updateFields: string[] = [];
      const values: any[] = [];

      if (updates.amount !== undefined) {
        updateFields.push('amount = ?');
        values.push(updates.amount);
      }
      if (updates.status !== undefined) {
        updateFields.push('status = ?');
        values.push(updates.status);
        // Auto-set confirmed_at when status becomes confirmed
        if (updates.status === 'confirmed') {
          updateFields.push('confirmed_at = ?');
          values.push(updates.confirmedAt || new Date().toISOString());
        } else if (updates.status === 'pending' || updates.status === 'cancelled') {
          updateFields.push('confirmed_at = ?');
          values.push(null);
        }
      }
      if (updates.date !== undefined) {
        updateFields.push('date = ?');
        values.push(updates.date);
      }
      if (updates.notes !== undefined) {
        updateFields.push('notes = ?');
        values.push(updates.notes || null);
      }
      if (updates.receiptImage !== undefined) {
        updateFields.push('receipt_image = ?');
        values.push(updates.receiptImage || null);
      }
      if (updates.fromParticipantName !== undefined) {
        updateFields.push('from_participant_name = ?');
        values.push(updates.fromParticipantName);
      }
      if (updates.toParticipantName !== undefined) {
        updateFields.push('to_participant_name = ?');
        values.push(updates.toParticipantName);
      }

      updateFields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(transactionId);

      await this.db.runAsync(
        `UPDATE transactions SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );
      console.log('✅ Transaction updated successfully');
    } catch (error) {
      console.error('❌ Error updating transaction:', error);
      throw error;
    }
  }

  // Settlements CRUD - Nueva implementación simplificada
  async createSettlement(settlement: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Obtener el estado actual del evento si no se proporciona
      let eventStatus = settlement.eventStatus;
      if (!eventStatus) {
        const event = await this.getEventById(settlement.eventId);
        eventStatus = event?.status || 'active';
      }
      
      await this.db.runAsync(
        `INSERT INTO settlements (
          id, event_id, from_participant_id, from_participant_name,
          to_participant_id, to_participant_name, amount, is_paid, paid_at,
          event_status, receipt_image, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          settlement.id, settlement.eventId, settlement.fromParticipantId, settlement.fromParticipantName,
          settlement.toParticipantId, settlement.toParticipantName, settlement.amount,
          settlement.isPaid ? 1 : 0, settlement.paidAt || null,
          eventStatus,
          settlement.receiptImage || null, settlement.notes || null,
          settlement.createdAt || new Date().toISOString(),
          settlement.updatedAt || new Date().toISOString()
        ]
      );
      console.log('✅ Settlement created successfully');
    } catch (error) {
      console.error('❌ Error creating settlement:', error);
      throw error;
    }
  }

  async getSettlementsByEvent(eventId: string): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const settlements = await this.db.getAllAsync(
        'SELECT * FROM settlements WHERE event_id = ? ORDER BY created_at DESC',
        [eventId]
      );

      return settlements.map((s: any) => ({
        id: s.id,
        eventId: s.event_id,
        fromParticipantId: s.from_participant_id,
        fromParticipantName: s.from_participant_name,
        toParticipantId: s.to_participant_id,
        toParticipantName: s.to_participant_name,
        amount: s.amount,
        isPaid: s.is_paid === 1,
        paidAt: s.paid_at,
        eventStatus: s.event_status || 'active',
        receiptImage: s.receipt_image,
        notes: s.notes,
        createdAt: s.created_at,
        updatedAt: s.updated_at
      }));
    } catch (error) {
      console.error('❌ Error getting settlements:', error);
      return [];
    }
  }

  async updateSettlement(settlementId: string, updates: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const updateFields: string[] = [];
      const values: any[] = [];

      if (updates.amount !== undefined) {
        updateFields.push('amount = ?');
        values.push(updates.amount);
      }
      if (updates.eventStatus !== undefined) {
        updateFields.push('event_status = ?');
        values.push(updates.eventStatus);
      }
      if (updates.isPaid !== undefined) {
        updateFields.push('is_paid = ?');
        values.push(updates.isPaid ? 1 : 0);
      }
      if (updates.paidAt !== undefined) {
        updateFields.push('paid_at = ?');
        values.push(updates.paidAt);
      }
      if (updates.receiptImage !== undefined) {
        updateFields.push('receipt_image = ?');
        values.push(updates.receiptImage);
      }
      if (updates.notes !== undefined) {
        updateFields.push('notes = ?');
        values.push(updates.notes);
      }
      if (updates.fromParticipantName !== undefined) {
        updateFields.push('from_participant_name = ?');
        values.push(updates.fromParticipantName);
      }
      if (updates.toParticipantName !== undefined) {
        updateFields.push('to_participant_name = ?');
        values.push(updates.toParticipantName);
      }

      if (updateFields.length === 0) {
        console.log('⚠️ No updates provided for settlement');
        return;
      }

      // Siempre actualizar updated_at
      updateFields.push('updated_at = ?');
      values.push(new Date().toISOString());

      values.push(settlementId);

      await this.db.runAsync(
        `UPDATE settlements SET ${updateFields.join(', ')} WHERE id = ?`,
        values
      );

      console.log('✅ Settlement updated successfully');
    } catch (error) {
      console.error('❌ Error updating settlement:', error);
      throw error;
    }
  }

  async getSettlementById(settlementId: string): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const settlement = await this.db.getFirstAsync(
        'SELECT * FROM settlements WHERE id = ?',
        [settlementId]
      );

      if (!settlement) return null;

      return {
        id: settlement.id,
        eventId: settlement.event_id,
        fromParticipantId: settlement.from_participant_id,
        fromParticipantName: settlement.from_participant_name,
        toParticipantId: settlement.to_participant_id,
        toParticipantName: settlement.to_participant_name,
        amount: settlement.amount,
        isPaid: settlement.is_paid === 1,
        paidAt: settlement.paid_at,
        eventStatus: settlement.event_status || 'active',
        receiptImage: settlement.receipt_image,
        notes: settlement.notes,
        createdAt: settlement.created_at,
        updatedAt: settlement.updated_at
      };
    } catch (error) {
      console.error('❌ Error getting settlement:', error);
      return null;
    }
  }

  // =====================================================
  // FUNCIÓN CENTRALIZADA DE RECÁLCULO DE LIQUIDACIONES
  // =====================================================
  async recalculateSettlementsForEvent(eventId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log(`🔄 Recalculando liquidaciones para evento: ${eventId}`);

      // 1. Obtener datos del evento
      const expenses = await this.getExpensesByEvent(eventId);
      const splits = await this.getSplitsByEvent(eventId); 
      const participants = await this.getEventParticipants(eventId);

      if (expenses.length === 0) {
        console.log('📝 No hay gastos, eliminando liquidaciones no pagadas');
        await this.db.runAsync(
          'DELETE FROM settlements WHERE event_id = ? AND is_paid = 0',
          [eventId]
        );
        return;
      }

      // 2. Calcular balances usando la lógica centralizada
      const balances = this.calculateBalancesFromData(expenses, splits, participants);
      
      // 3. Generar liquidaciones optimizadas
      const newSettlements = this.calculateOptimalSettlements(balances);

      // 4. Eliminar liquidaciones NO PAGADAS (mantener las pagadas)
      await this.db.runAsync(
        'DELETE FROM settlements WHERE event_id = ? AND is_paid = 0',
        [eventId]
      );

      // 5. Crear nuevas liquidaciones
      const currentTime = new Date().toISOString();
      for (const settlement of newSettlements) {
        if (settlement.amount > 0.01) { // Solo crear si hay monto significativo
          const settlementId = `settlement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await this.createSettlement({
            id: settlementId,
            eventId: eventId,
            fromParticipantId: settlement.fromParticipantId,
            fromParticipantName: settlement.fromParticipantName,
            toParticipantId: settlement.toParticipantId,
            toParticipantName: settlement.toParticipantName,
            amount: settlement.amount,
            isPaid: false,
            paidAt: null,
            createdAt: currentTime,
            updatedAt: currentTime
          });
        }
      }

      console.log(`✅ Liquidaciones recalculadas: ${newSettlements.length} nuevas liquidaciones`);

    } catch (error) {
      console.error('❌ Error recalculando liquidaciones:', error);
      throw error;
    }
  }

  // Función helper para calcular balances desde datos raw
  private calculateBalancesFromData(expenses: any[], splits: any[], participants: any[]): any[] {
    const balances: { [participantId: string]: any } = {};

    // Inicializar balances
    participants.forEach(p => {
      balances[p.id] = {
        participantId: p.id,
        participantName: p.name,
        totalPaid: 0,
        totalOwed: 0,
        balance: 0
      };
    });

    // Calcular lo que pagó cada uno (créditos)
    expenses.forEach(expense => {
      if (balances[expense.payerId]) {
        balances[expense.payerId].totalPaid += expense.amount;
      }
    });

    // Calcular lo que debe cada uno (débitos) 
    splits.forEach(split => {
      if (balances[split.participantId]) {
        balances[split.participantId].totalOwed += split.amount;
      }
    });

    // Calcular balance final (positivo = debe dinero, negativo = le deben)
    Object.values(balances).forEach((balance: any) => {
      balance.balance = balance.totalOwed - balance.totalPaid;
    });

    return Object.values(balances);
  }

  // Función helper para generar liquidaciones optimizadas
  private calculateOptimalSettlements(balances: any[]): any[] {
    const debtors = balances.filter(b => b.balance > 0).sort((a, b) => b.balance - a.balance);
    const creditors = balances.filter(b => b.balance < 0).sort((a, b) => a.balance - b.balance);
    
    const settlements: any[] = [];
    let debtorIndex = 0;
    let creditorIndex = 0;

    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const debtor = debtors[debtorIndex];
      const creditor = creditors[creditorIndex];
      
      const amount = Math.min(debtor.balance, Math.abs(creditor.balance));
      
      if (amount > 0.01) { // Solo crear si es significativo
        settlements.push({
          fromParticipantId: debtor.participantId,
          fromParticipantName: debtor.participantName,
          toParticipantId: creditor.participantId,
          toParticipantName: creditor.participantName,
          amount: Math.round(amount * 100) / 100
        });
      }

      debtor.balance -= amount;
      creditor.balance += amount;

      if (debtor.balance <= 0.01) debtorIndex++;
      if (creditor.balance >= -0.01) creditorIndex++;
    }

    return settlements;
  }

  async updateSettlementsEventStatus(eventId: string, newEventStatus: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        'UPDATE settlements SET event_status = ?, updated_at = ? WHERE event_id = ?',
        [newEventStatus, new Date().toISOString(), eventId]
      );
      console.log(`✅ Updated settlements status to ${newEventStatus} for event ${eventId}`);
    } catch (error) {
      console.error('❌ Error updating settlements event status:', error);
      throw error;
    }
  }

  async resetSettlementsPayments(eventId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Resetear todos los pagos y comprobantes al pasar de archivado a activo
      await this.db.runAsync(
        `UPDATE settlements SET 
          is_paid = 0, 
          paid_at = NULL, 
          receipt_image = NULL, 
          notes = NULL,
          event_status = 'active',
          updated_at = ? 
        WHERE event_id = ?`,
        [new Date().toISOString(), eventId]
      );
      console.log(`✅ Reset all settlement payments for event ${eventId}`);
    } catch (error) {
      console.error('❌ Error resetting settlement payments:', error);
      throw error;
    }
  }

  async deleteSettlementsByEvent(eventId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync('DELETE FROM settlements WHERE event_id = ?', [eventId]);
      console.log('✅ Settlements deleted for event');
    } catch (error) {
      console.error('❌ Error deleting settlements:', error);
      throw error;
    }
  }

  async deleteSettlement(settlementId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync('DELETE FROM settlements WHERE id = ?', [settlementId]);
      console.log('✅ Settlement deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting settlement:', error);
      throw error;
    }
  }



  async updateSettlementParticipantNames(participantId: string, newName: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Update settlements where this participant is the sender (from)
      await this.db.runAsync(
        'UPDATE settlements SET from_participant_name = ?, updated_at = ? WHERE from_participant_id = ?',
        [newName, new Date().toISOString(), participantId]
      );

      // Update settlements where this participant is the receiver (to)
      await this.db.runAsync(
        'UPDATE settlements SET to_participant_name = ?, updated_at = ? WHERE to_participant_id = ?',
        [newName, new Date().toISOString(), participantId]
      );

      console.log(`✅ Settlement names updated for participant ${participantId}`);
    } catch (error) {
      console.error('❌ Error updating settlement names:', error);
      throw error;
    }
  }

  // Utility methods
  async clearAllData(includeVersions: boolean = false): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Obtener todas las tablas de datos (excluyendo solo system tables de SQLite)
      const tables = await this.db.getAllAsync(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
      );

      console.log('📋 Tables found in database:', tables.map((t: any) => t.name).join(', '));
      console.log(`🗑️ Clear mode: ${includeVersions ? 'Including app versions' : 'Preserving app versions'}`);

      // Borrar datos de cada tabla encontrada
      let clearedCount = 0;
      for (const table of tables as any[]) {
        const tableName = table.name;
        try {
          // Verificar si la tabla existe y es accesible
          const tableInfo = await this.db.getAllAsync(`PRAGMA table_info(${tableName})`);
          
          if (!tableInfo || tableInfo.length === 0) {
            console.warn(`⚠️ Table ${tableName} appears to not exist or be inaccessible, skipping...`);
            continue;
          }
          
          // Verificar si la tabla tiene datos antes de borrar
          const countResult = await this.db.getFirstAsync(
            `SELECT COUNT(*) as count FROM ${tableName}`
          ) as any;
          const recordCount = countResult?.count || 0;
          
          if (recordCount > 0) {
            // Manejar app_versions según el parámetro
            if (tableName === 'app_versions' && !includeVersions) {
              console.log(`ℹ️ Preserving app_versions table (${recordCount} records) - contains version history`);
            } else {
              // Intentar borrar con DELETE first
              try {
                await this.db.execAsync(`DELETE FROM ${tableName}`);
                console.log(`🗑️ Cleared table: ${tableName} (${recordCount} records deleted)`);
                clearedCount++;
              } catch (deleteError) {
                console.warn(`⚠️ DELETE failed for ${tableName}, trying alternative method:`, deleteError);
                try {
                  // Método alternativo
                  await this.db.execAsync(`DELETE FROM ${tableName}`);
                  await this.db.execAsync(`UPDATE sqlite_sequence SET seq = 0 WHERE name = '${tableName}'`);
                  console.log(`🗑️ Force cleared table: ${tableName}`);
                  clearedCount++;
                } catch (truncateError) {
                  console.error(`❌ Could not clear table ${tableName} with any method:`, truncateError);
                }
              }
            }
          } else {
            console.log(`ℹ️ Table ${tableName} was already empty`);
          }
        } catch (error) {
          console.warn(`⚠️ Could not access table ${tableName}:`, error);
        }
      }
      
      // Reiniciar secuencias de autoincremento
      try {
        await this.db.execAsync('DELETE FROM sqlite_sequence');
        console.log('🔄 Reset autoincrement sequences');
      } catch (error) {
        console.warn('⚠️ Could not reset sequences:', error);
      }
      
      // After clearing data, also drop problematic legacy tables that keep regenerating
      try {
        console.log('🗑️ Removing problematic legacy tables...');
        await this.db.execAsync('DROP TABLE IF EXISTS settlements_legacy');
        await this.db.execAsync('DROP TABLE IF EXISTS document_views'); 
        await this.db.execAsync('DROP TABLE IF EXISTS expense_splits');
        await this.db.execAsync('DROP TABLE IF EXISTS participant_inclusion_rules');
        console.log('✅ Problematic legacy tables removed');
      } catch (error) {
        console.warn('⚠️ Could not remove legacy tables:', error);
      }

      console.log(`✅ All data cleared successfully. ${clearedCount} tables processed.`);
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      throw error;
    }
  }

  async resetDatabase(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.dropAndRecreateDatabase();
      console.log('✅ Database reset successfully');
    } catch (error) {
      console.error('❌ Error resetting database:', error);
      throw error;
    }
  }

  async nukeDatabase(): Promise<void> {
    try {
      console.log('💥 Nuking database - complete destruction and recreation...');
      
      // Close current database connection
      if (this.db) {
        await this.db.closeAsync();
        this.db = null;
      }

      // Delete the entire database file
      const dbPath = `${FileSystem.documentDirectory}SQLite/splitsmart.db`;
      
      try {
        const fileInfo = await FileSystem.getInfoAsync(dbPath);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(dbPath);
          console.log('💥 Database file deleted');
        }
      } catch (deleteError) {
        console.warn('⚠️ Could not delete database file:', deleteError);
      }

      // Recreate from scratch
      console.log('🔄 Recreating database from scratch...');
      await this.init();
      console.log('✅ Database nuked and recreated successfully');
    } catch (error) {
      console.error('❌ Error nuking database:', error);
      throw error;
    }
  }

  async exportData(): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log('📦 Starting complete data export...');
      
      const [
        events, 
        participants, 
        expenses, 
        settlements,
        splits
      ] = await Promise.all([
        this.getEvents(),
        this.getParticipants(),
        this.getAllExpenses(),
        this.getAllSettlements(),
        this.getAllSplits()
      ]);

      // Obtener usuarios (crear función si no existe)
      const users = await this.getAllUsers();

      // Los settlements ya vienen en el formato correcto de la base de datos

      // Calculate statistics
      const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      const exportData = {
        version: '2.0',
        exportDate: new Date().toISOString(),
        appVersion: '1.4.1',
        metadata: {
          exportedBy: 'SplitSmart',
          version: '2.0',
          exportDate: new Date().toISOString(),
          appVersion: '1.4.1'
        },
        data: {
          // Main entities
          users,
          events,
          participants,
          expenses,
          transactions, // Nueva tabla unificada
          
          // Legacy format para compatibilidad
          payments,
          settlements,
          
          // Relationships
          event_participants: eventParticipants,
          splits,
        },
        statistics: {
          totalEvents: events.length,
          totalParticipants: participants.length,
          totalExpenses: expenses.length,
          totalTransactions: transactions.length,
          totalPayments: payments.length,
          totalSettlements: settlements.length,
          totalAmount: totalAmount,
          friendsCount: participants.filter(p => p.participantType === 'friend').length,
          activeEvents: events.filter(e => e.status === 'active').length,
          completedEvents: events.filter(e => e.status === 'completed').length
        },
        integrity: {
          recordCounts: {
            users: users.length,
            events: events.length,
            participants: participants.length,
            expenses: expenses.length,
            transactions: transactions.length,
            payments: payments.length,
            event_participants: eventParticipants.length,
            splits: splits.length,
            settlements: settlements.length
          }
        },
        notes: {
          imageExclusion: 'Images (avatars, receipts) are not included in this export for privacy and file size reasons',
          dataIntegrity: 'All relational data and foreign keys are preserved for complete restoration'
        }
      };

      console.log('✅ Export completed successfully');
      console.log('📊 Export statistics:', exportData.statistics);
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('❌ Export data error:', error);
      throw error;
    }
  }

  private async getAllExpenses(): Promise<Expense[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync('SELECT * FROM expenses WHERE is_active = 1');
      return result.map((row: any) => ({
        id: row.id,
        eventId: row.event_id,
        description: row.description,
        amount: row.amount,
        currency: row.currency,
        date: row.date,
        category: row.category,
        payerId: row.payer_id,
        receiptImage: row.receipt_image,
        isActive: row.is_active === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('❌ Error getting all expenses:', error);
      throw error;
    }
  }

  private async getAllPayments(): Promise<Payment[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync('SELECT * FROM transactions WHERE type = \'manual\'');
      return result.map((row: any) => ({
        id: row.id,
        eventId: row.event_id,
        fromParticipantId: row.from_participant_id,
        toParticipantId: row.to_participant_id,
        amount: row.amount,
        date: row.date,
        notes: row.notes,
        receiptImage: row.receipt_image,
        isConfirmed: row.status === 'confirmed',
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('❌ Error getting all payments:', error);
      throw error;
    }
  }

  private async getAllTransactions(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync('SELECT * FROM transactions');
      return result.map((row: any) => ({
        id: row.id,
        eventId: row.event_id,
        fromParticipantId: row.from_participant_id,
        fromParticipantName: row.from_participant_name,
        toParticipantId: row.to_participant_id,
        toParticipantName: row.to_participant_name,
        amount: row.amount,
        type: row.type,
        status: row.status,
        date: row.date,
        notes: row.notes,
        receiptImage: row.receipt_image,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        confirmedAt: row.confirmed_at
      }));
    } catch (error) {
      console.error('❌ Error getting all transactions:', error);
      throw error;
    }
  }

  private async getAllUsers(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync('SELECT * FROM users');
      return result.map((row: any) => ({
        id: row.id,
        username: row.username,
        email: row.email,
        name: row.name,
        phone: row.phone,
        alias_cbu: row.alias_cbu,
        preferred_currency: row.preferred_currency,
        skip_password: row.skip_password === 1,
        notifications_expense_added: row.notifications_expense_added === 1,
        notifications_payment_received: row.notifications_payment_received === 1,
        notifications_event_updated: row.notifications_event_updated === 1,
        notifications_weekly_report: row.notifications_weekly_report === 1,
        privacy_share_email: row.privacy_share_email === 1,
        privacy_share_phone: row.privacy_share_phone === 1,
        privacy_allow_invitations: row.privacy_allow_invitations === 1,
        created_at: row.created_at,
        updated_at: row.updated_at
        // Note: password and avatar are excluded for security and privacy
      }));
    } catch (error) {
      console.error('❌ Error getting all users:', error);
      throw error;
    }
  }

  private async getAllEventParticipants(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync('SELECT * FROM event_participants');
      return result.map((row: any) => ({
        id: row.id,
        event_id: row.event_id,
        participant_id: row.participant_id,
        role: row.role,
        balance: row.balance,
        joined_at: row.joined_at
      }));
    } catch (error) {
      console.error('❌ Error getting all event participants:', error);
      throw error;
    }
  }

  private async getAllSplits(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync('SELECT * FROM splits');
      return result.map((row: any) => ({
        id: row.id,
        expense_id: row.expense_id,
        participant_id: row.participant_id,
        amount: row.amount,
        percentage: row.percentage,
        type: row.type,
        is_paid: row.is_paid === 1,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (error) {
      console.error('❌ Error getting all splits:', error);
      throw error;
    }
  }

  private async getAllSettlements(): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const result = await this.db.getAllAsync('SELECT * FROM transactions WHERE type = \'calculated\'');
      return result.map((row: any) => ({
        id: row.id,
        event_id: row.event_id,
        from_participant_id: row.from_participant_id,
        from_participant_name: row.from_participant_name,
        to_participant_id: row.to_participant_id,
        to_participant_name: row.to_participant_name,
        amount: row.amount,
        is_paid: row.status === 'confirmed' ? 1 : 0,
        receipt_image: row.receipt_image,
        paid_at: row.confirmed_at,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));
    } catch (error) {
      console.error('❌ Error getting all settlements:', error);
      throw error;
    }
  }

  async updateExpense(expenseId: string, expense: Partial<Expense>, splits?: Split[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const updates: string[] = [];
      const values: any[] = [];

      if (expense.description !== undefined) {
        updates.push('description = ?');
        values.push(expense.description);
      }
      if (expense.amount !== undefined) {
        updates.push('amount = ?');
        values.push(expense.amount);
      }
      if (expense.date !== undefined) {
        updates.push('date = ?');
        values.push(expense.date);
      }
      if (expense.category !== undefined) {
        updates.push('category = ?');
        values.push(expense.category);
      }
      if (expense.payerId !== undefined) {
        updates.push('payer_id = ?');
        values.push(expense.payerId);
      }
      if (expense.currency !== undefined) {
        updates.push('currency = ?');
        values.push(expense.currency);
      }
      if (expense.receiptImage !== undefined) {
        updates.push('receipt_image = ?');
        values.push(expense.receiptImage);
      }

      updates.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(expenseId);

      if (updates.length > 0) {
        await this.db.runAsync(
          `UPDATE expenses SET ${updates.join(', ')} WHERE id = ?`,
          values
        );
      }

      // Update splits if provided
      if (splits && splits.length > 0) {
        // Delete old splits
        await this.db.runAsync('DELETE FROM splits WHERE expense_id = ?', [expenseId]);
        
        // Insert new splits
        for (const split of splits) {
          await this.db.runAsync(
            `INSERT INTO splits (id, expense_id, participant_id, amount, percentage, type, is_paid, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              split.id,
              expenseId,
              split.participantId,
              split.amount,
              split.percentage || null,
              split.type || 'equal',
              split.isPaid ? 1 : 0,
              split.createdAt || new Date().toISOString(),
              split.updatedAt || new Date().toISOString()
            ]
          );
        }
      }

      // 🔄 OBTENER EVENT_ID Y RECALCULAR LIQUIDACIONES
      const expenseData = await this.db.getFirstAsync('SELECT event_id FROM expenses WHERE id = ?', [expenseId]);
      if (expenseData?.event_id) {
        await this.recalculateSettlementsForEvent(expenseData.event_id);
      }

      console.log('✅ Expense updated successfully');
    } catch (error) {
      console.error('❌ Error updating expense:', error);
      throw error;
    }
  }

  async deleteExpense(expenseId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // 🔄 OBTENER EVENT_ID ANTES DE BORRAR
      const expenseData = await this.db.getFirstAsync('SELECT event_id FROM expenses WHERE id = ?', [expenseId]);
      
      // First delete all splits related to this expense
      await this.db.runAsync('DELETE FROM splits WHERE expense_id = ?', [expenseId]);
      
      // Then delete the expense itself
      await this.db.runAsync('DELETE FROM expenses WHERE id = ?', [expenseId]);
      
      // 🔄 RECALCULAR LIQUIDACIONES DESPUÉS DE BORRAR
      if (expenseData?.event_id) {
        await this.recalculateSettlementsForEvent(expenseData.event_id);
      }
      
      console.log('✅ Expense deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting expense:', error);
      throw error;
    }
  }

  async removeParticipantFromEvent(eventId: string, participantId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Check if participant has paid any expenses in THIS EVENT specifically
      const expenseCount = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM expenses WHERE payer_id = ? AND event_id = ?',
        [participantId, eventId]
      ) as { count: number };

      if (expenseCount.count > 0) {
        throw new Error('No se puede eliminar un participante que ha pagado gastos en este evento. Primero cambia el pagador de esos gastos.');
      }

      // If participant is only in splits (not a payer), we can remove them and recalculate splits
      const splitCount = await this.db.getFirstAsync(
        `SELECT COUNT(*) as count FROM splits s 
         INNER JOIN expenses e ON s.expense_id = e.id 
         WHERE s.participant_id = ? AND e.event_id = ?`,
        [participantId, eventId]
      ) as { count: number };

      if (splitCount.count > 0) {
        // Get all expenses in THIS EVENT where this participant has splits
        const expensesWithSplits = await this.db.getAllAsync(
          `SELECT DISTINCT e.id, e.amount, e.event_id 
           FROM expenses e 
           INNER JOIN splits s ON e.id = s.expense_id 
           WHERE s.participant_id = ? AND e.event_id = ?`,
          [participantId, eventId]
        ) as Array<{ id: string; amount: number; event_id: string }>;

        // Remove participant's splits only for this event
        await this.db.runAsync(
          `DELETE FROM splits 
           WHERE participant_id = ? 
           AND expense_id IN (SELECT id FROM expenses WHERE event_id = ?)`,
          [participantId, eventId]
        );

        // Recalculate splits for each affected expense
        for (const expense of expensesWithSplits) {
          // Get remaining splits for this expense
          const remainingSplits = await this.db.getAllAsync(
            'SELECT * FROM splits WHERE expense_id = ?',
            [expense.id]
          ) as Array<any>;

          if (remainingSplits.length > 0) {
            // Recalculate equal division
            const amountPerPerson = expense.amount / remainingSplits.length;
            
            for (const split of remainingSplits) {
              await this.db.runAsync(
                'UPDATE splits SET amount = ?, percentage = ?, updated_at = ? WHERE id = ?',
                [amountPerPerson, (100 / remainingSplits.length), new Date().toISOString(), split.id]
              );
            }
          }
        }
      }

      // Remove participant from event
      await this.db.runAsync(
        'DELETE FROM event_participants WHERE event_id = ? AND participant_id = ?',
        [eventId, participantId]
      );

      // Delete participant if not in other events
      const otherEvents = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM event_participants WHERE participant_id = ?',
        [participantId]
      ) as { count: number };

      if (otherEvents.count === 0) {
        await this.db.runAsync('DELETE FROM participants WHERE id = ?', [participantId]);
      }

      console.log('✅ Participant removed successfully');
    } catch (error) {
      console.error('❌ Error removing participant:', error);
      throw error;
    }
  }

  async addParticipantToAllExpenses(eventId: string, participantId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Get all expenses for this event
      const expenses = await this.db.getAllAsync(
        'SELECT * FROM expenses WHERE event_id = ?',
        [eventId]
      ) as Array<any>;

      for (const expense of expenses) {
        // Get current splits for this expense
        const currentSplits = await this.db.getAllAsync(
          'SELECT * FROM splits WHERE expense_id = ?',
          [expense.id]
        ) as Array<any>;

        // Check if participant is already in splits
        const existingSplit = currentSplits.find(s => s.participant_id === participantId);
        if (existingSplit) {
          console.log(`Participant already in expense ${expense.id}, skipping`);
          continue;
        }

        // Calculate new split amount with the new participant
        const newParticipantCount = currentSplits.length + 1;
        const amountPerPerson = expense.amount / newParticipantCount;
        const percentagePerPerson = 100 / newParticipantCount;

        // Update existing splits with new amounts
        for (const split of currentSplits) {
          await this.db.runAsync(
            'UPDATE splits SET amount = ?, percentage = ?, updated_at = ? WHERE id = ?',
            [amountPerPerson, percentagePerPerson, new Date().toISOString(), split.id]
          );
        }

        // Add new split for the new participant
        const newSplitId = `${expense.id}_${participantId}`;
        await this.db.runAsync(
          `INSERT INTO splits (id, expense_id, participant_id, amount, percentage, type, is_paid, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newSplitId,
            expense.id,
            participantId,
            amountPerPerson,
            percentagePerPerson,
            'equal',
            0,
            new Date().toISOString(),
            new Date().toISOString()
          ]
        );
      }

      console.log('✅ Participant added to all expenses successfully');
    } catch (error) {
      console.error('❌ Error adding participant to expenses:', error);
      throw error;
    }
  }

  // User Profile Functions
  async getUserProfile(userId: string): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      console.log('👤 Getting user profile for ID:', userId);
      const user = await this.db.getFirstAsync(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );
      
      if (user) {
        console.log('💾 Profile found - notifications_payment_received:', user.notifications_payment_received);
      } else {
        console.log('⚠️ No profile found for user ID:', userId);
      }
      
      return user || null;
    } catch (error) {
      console.error('❌ Error getting user profile:', error);
      return null;
    }
  }

  async getUserByCredential(credential: string): Promise<any | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      const user = await this.db.getFirstAsync(
        'SELECT * FROM users WHERE LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)',
        [credential, credential]
      );
      return user || null;
    } catch (error) {
      console.error('❌ Error getting user by credential:', error);
      return null;
    }
  }

  async createUser(user: {
    id: string;
    username: string;
    email: string;
    password: string;
    name: string;
    phone?: string;
    alias_cbu?: string;
    skipPassword?: boolean;
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        `INSERT INTO users (id, username, email, password, name, phone, alias_cbu, skip_password, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          user.username,
          user.email,
          user.password,
          user.name,
          user.phone || null,
          user.alias_cbu || null,
          user.skipPassword ? 1 : 0,
          new Date().toISOString(),
          new Date().toISOString()
        ]
      );
      console.log('✅ User created successfully');
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, updates: {
    name?: string;
    email?: string;
    phone?: string;
    alias_cbu?: string;
    preferred_currency?: string;
    skipPassword?: boolean;
    avatar?: string;
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (updates.name !== undefined) {
        fields.push('name = ?');
        values.push(updates.name);
      }
      if (updates.email !== undefined) {
        fields.push('email = ?');
        values.push(updates.email);
      }
      if (updates.phone !== undefined) {
        fields.push('phone = ?');
        values.push(updates.phone);
      }
      if (updates.alias_cbu !== undefined) {
        fields.push('alias_cbu = ?');
        values.push(updates.alias_cbu);
      }
      if (updates.preferred_currency !== undefined) {
        fields.push('preferred_currency = ?');
        values.push(updates.preferred_currency);
      }
      if (updates.skipPassword !== undefined) {
        fields.push('skip_password = ?');
        values.push(updates.skipPassword ? 1 : 0);
      }
      if (updates.avatar !== undefined) {
        fields.push('avatar = ?');
        values.push(updates.avatar || null);
      }

      fields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(userId);

      await this.db.runAsync(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      console.log('✅ User profile updated successfully');
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      throw error;
    }
  }

  async forceUpdateDemoUser(userId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        'UPDATE users SET skip_password = 1, updated_at = ? WHERE id = ?',
        [new Date().toISOString(), userId]
      );

      console.log('✅ Demo user skip_password forced to 1');
    } catch (error) {
      console.error('❌ Error forcing demo user update:', error);
      throw error;
    }
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      await this.db.runAsync(
        'UPDATE users SET password = ?, updated_at = ? WHERE id = ?',
        [newPassword, new Date().toISOString(), userId]
      );

      console.log('✅ User password updated successfully');
    } catch (error) {
      console.error('❌ Error updating user password:', error);
      throw error;
    }
  }

  async updateUserNotifications(userId: string, notifications: {
    expenseAdded?: boolean;
    paymentReceived?: boolean;
    eventUpdated?: boolean;
    weeklyReport?: boolean;
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log('💾 Updating notifications in DB for user:', userId, 'with:', notifications);
      
      // Verificar si el usuario existe
      const existingUser = await this.getUserProfile(userId);
      
      if (!existingUser) {
        console.log('👤 User not found, creating demo user:', userId);
        // Crear usuario demo si no existe
        await this.createUser({
          id: userId,
          name: 'Usuario Demo',
          username: 'demo',
          email: 'demo@splitsmart.com',
          avatar: null,
          skipPassword: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log('✅ Demo user created successfully');
      }
      
      const fields: string[] = [];
      const values: any[] = [];

      if (notifications.expenseAdded !== undefined) {
        fields.push('notifications_expense_added = ?');
        values.push(notifications.expenseAdded ? 1 : 0);
      }
      if (notifications.paymentReceived !== undefined) {
        fields.push('notifications_payment_received = ?');
        values.push(notifications.paymentReceived ? 1 : 0);
      }
      if (notifications.eventUpdated !== undefined) {
        fields.push('notifications_event_updated = ?');
        values.push(notifications.eventUpdated ? 1 : 0);
      }
      if (notifications.weeklyReport !== undefined) {
        fields.push('notifications_weekly_report = ?');
        values.push(notifications.weeklyReport ? 1 : 0);
      }

      fields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(userId);

      const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
      console.log('💾 SQL Query:', query, 'Values:', values);
      
      const result = await this.db.runAsync(query, values);
      
      console.log('✅ User notifications updated successfully. Rows affected:', result.changes);
    } catch (error) {
      console.error('❌ Error updating user notifications:', error);
      throw error;
    }
  }

  async updateUserPrivacy(userId: string, privacy: {
    shareEmail?: boolean;
    sharePhone?: boolean;
    allowInvitations?: boolean;
  }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (privacy.shareEmail !== undefined) {
        fields.push('privacy_share_email = ?');
        values.push(privacy.shareEmail ? 1 : 0);
      }
      if (privacy.sharePhone !== undefined) {
        fields.push('privacy_share_phone = ?');
        values.push(privacy.sharePhone ? 1 : 0);
      }
      if (privacy.allowInvitations !== undefined) {
        fields.push('privacy_allow_invitations = ?');
        values.push(privacy.allowInvitations ? 1 : 0);
      }

      fields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(userId);

      await this.db.runAsync(
        `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      console.log('✅ User privacy settings updated successfully');
    } catch (error) {
      console.error('❌ Error updating user privacy:', error);
      throw error;
    }
  }

  // Función de diagnóstico para identificar tablas problemáticas
  async diagnoseTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log('🔍 === DIAGNÓSTICO DE TABLAS ===');
      
      // Obtener tablas del schema
      const tables = await this.db.getAllAsync(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
      );
      
      console.log('📋 Tablas encontradas en schema:', tables.map((t: any) => t.name));
      
      // Verificar cada tabla individualmente
      for (const table of tables as any[]) {
        const tableName = table.name;
        try {
          // Verificar estructura
          const columns = await this.db.getAllAsync(`PRAGMA table_info(${tableName})`);
          console.log(`🏗️ ${tableName}: ${columns.length} columnas`);
          
          // Verificar datos
          const count = await this.db.getFirstAsync(`SELECT COUNT(*) as count FROM ${tableName}`) as any;
          console.log(`📊 ${tableName}: ${count?.count || 0} registros`);
          
        } catch (error) {
          console.error(`❌ Error con tabla ${tableName}:`, error);
        }
      }
      
      console.log('🔍 === FIN DIAGNÓSTICO ===');
    } catch (error) {
      console.error('❌ Error en diagnóstico:', error);
    }
  }

  async getDatabaseStats(): Promise<{
    tables: { [tableName: string]: number };
    totalRecords: number;
    databaseSize: string;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      const stats: { [tableName: string]: number } = {};
      let totalRecords = 0;

      // Obtener todas las tablas existentes
      const tables = await this.db.getAllAsync(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
      );

      console.log('📋 Database tables found:', tables.map((t: any) => t.name).join(', '));

      // Contar registros en cada tabla
      for (const table of tables as any[]) {
        const tableName = table.name;
        try {
          // Verificar primero que la tabla existe y es accesible
          const tableInfo = await this.db.getAllAsync(
            `PRAGMA table_info(${tableName})`
          );
          
          if (tableInfo && tableInfo.length > 0) {
            const result = await this.db.getFirstAsync(
              `SELECT COUNT(*) as count FROM ${tableName}`
            ) as any;
            
            const count = result?.count || 0;
            stats[tableName] = count;
            
            // Para app_versions, mostrar información más detallada
            if (tableName === 'app_versions' && count > 0) {
              const versions = await this.db.getAllAsync(
                `SELECT DISTINCT version FROM app_versions ORDER BY version`
              ) as any[];
              console.log(`📱 App versions in database: ${versions.map(v => v.version).join(', ')}`);
            }
            
            totalRecords += count;
            
            if (count > 0) {
              console.log(`📊 Table ${tableName}: ${count} records`);
            }
          } else {
            console.warn(`⚠️ Table ${tableName} appears to be empty or inaccessible`);
            stats[tableName] = 0;
          }
        } catch (error) {
          console.warn(`⚠️ Error accessing table ${tableName}:`, error);
          stats[tableName] = 0;
        }
      }

      // Calcular tamaño aproximado de la base de datos
      let databaseSize = '< 1 MB';
      try {
        const sizeResult = await this.db.getFirstAsync(
          `SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()`
        ) as any;
        
        if (sizeResult?.size) {
          const sizeInBytes = sizeResult.size;
          const sizeInMB = sizeInBytes / (1024 * 1024);
          
          if (sizeInMB >= 1) {
            databaseSize = `${sizeInMB.toFixed(2)} MB`;
          } else {
            const sizeInKB = sizeInBytes / 1024;
            databaseSize = `${sizeInKB.toFixed(1)} KB`;
          }
        }
      } catch (error) {
        console.warn('⚠️ Error calculating database size:', error);
      }

      console.log('📊 Database statistics:', { stats, totalRecords, databaseSize });
      return {
        tables: stats,
        totalRecords,
        databaseSize
      };
    } catch (error) {
      console.error('❌ Error getting database stats:', error);
      throw error;
    }
  }

  // MIGRACIÓN DE TRANSACTIONS A SETTLEMENTS SIMPLIFICADOS
  async migrateTransactionsToSettlements(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log('🔄 Starting migration from transactions to settlements...');

      // Verificar si existe tabla transactions
      const transactionsExists = await this.db.getFirstAsync(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='transactions'`
      );

      if (!transactionsExists) {
        console.log('✅ No transactions table found, migration not needed');
        return;
      }

      // Migrar calculated transactions (liquidaciones) a settlements
      const existingTransactions = await this.db.getAllAsync(
        `SELECT * FROM transactions WHERE type = 'calculated'`
      ).catch(() => []);

      let migrated = 0;
      for (const tx of existingTransactions as any[]) {
        const isPaid = tx.status === 'confirmed' || tx.confirmed_at;
        
        await this.db.runAsync(
          `INSERT OR IGNORE INTO settlements (
            id, event_id, from_participant_id, from_participant_name,
            to_participant_id, to_participant_name, amount, is_paid, paid_at,
            receipt_image, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            tx.id, tx.event_id, tx.from_participant_id, tx.from_participant_name,
            tx.to_participant_id, tx.to_participant_name, tx.amount,
            isPaid ? 1 : 0, isPaid ? (tx.confirmed_at || tx.updated_at) : null,
            tx.receipt_image, tx.notes, tx.created_at, tx.updated_at
          ]
        );
        migrated++;
      }

      console.log(`✅ Migrated ${migrated} settlements from transactions table`);

      // Renombrar tabla transactions para backup
      await this.db.execAsync(`ALTER TABLE transactions RENAME TO transactions_backup`);
      console.log('✅ Transactions table backed up as transactions_backup');

    } catch (error: any) {
      console.error('❌ Error during migration:', error);
      throw error;
    }
  }

  // MIGRACIÓN DE DATOS A TABLA UNIFICADA (LEGACY)
  async migrateOldTablesToTransactions(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    try {
      console.log('🔄 Starting migration to unified transactions table...');

      // Verificar si las tablas anteriores existen
      const settlementsExists = await this.db.getFirstAsync(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='settlements'`
      );
      
      const paymentsExists = await this.db.getFirstAsync(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='payments'`
      );

      if (!settlementsExists && !paymentsExists) {
        console.log('✅ No old tables found, migration not needed');
        return;
      }

      let migratedSettlements = 0;
      let migratedPayments = 0;

      // Migrar settlements existentes
      if (settlementsExists) {
        const existingSettlements = await this.db.getAllAsync(
          `SELECT * FROM settlements`
        ).catch(() => []);

        for (const settlement of existingSettlements as any[]) {
          await this.db.runAsync(
            `INSERT OR IGNORE INTO transactions (id, event_id, from_participant_id, from_participant_name, 
             to_participant_id, to_participant_name, amount, type, status, date, receipt_image, 
             created_at, updated_at, confirmed_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'calculated', ?, ?, ?, ?, ?, ?)`,
            [
              settlement.id,
              settlement.event_id,
              settlement.from_participant_id,
              settlement.from_participant_name,
              settlement.to_participant_id,
              settlement.to_participant_name,
              settlement.amount,
              settlement.is_paid ? 'confirmed' : 'pending',
              settlement.paid_at || settlement.created_at,
              settlement.receipt_image,
              settlement.created_at,
              settlement.updated_at,
              settlement.is_paid ? settlement.paid_at : null
            ]
          );
        }
        
        migratedSettlements = existingSettlements.length;
      }

      // Migrar payments existentes
      if (paymentsExists) {
        const existingPayments = await this.db.getAllAsync(
          `SELECT * FROM payments`
        ).catch(() => []);

        for (const payment of existingPayments as any[]) {
          // Obtener nombres de participantes
          const fromParticipant = await this.db.getFirstAsync(
            `SELECT name FROM participants WHERE id = ?`,
            [payment.from_participant_id]
          ).catch(() => null) as any;
          
          const toParticipant = await this.db.getFirstAsync(
            `SELECT name FROM participants WHERE id = ?`,
            [payment.to_participant_id]
          ).catch(() => null) as any;

          await this.db.runAsync(
            `INSERT OR IGNORE INTO transactions (id, event_id, from_participant_id, from_participant_name, 
             to_participant_id, to_participant_name, amount, type, status, date, notes, receipt_image, 
             created_at, updated_at, confirmed_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'manual', ?, ?, ?, ?, ?, ?, ?)`,
            [
              payment.id,
              payment.event_id,
              payment.from_participant_id,
              fromParticipant?.name || 'Participante',
              payment.to_participant_id,
              toParticipant?.name || 'Participante',
              payment.amount,
              payment.is_confirmed ? 'confirmed' : 'pending',
              payment.date,
              payment.notes,
              payment.receipt_image,
              payment.created_at,
              payment.updated_at,
              payment.is_confirmed ? payment.date : null
            ]
          );
        }
        
        migratedPayments = existingPayments.length;
        
        // Eliminar tabla payments después de migrar
        await this.db.execAsync(`DROP TABLE IF EXISTS payments`);
      }

      // Eliminar tabla settlements después de migrar
      if (settlementsExists && migratedSettlements > 0) {
        await this.db.execAsync(`DROP TABLE IF EXISTS settlements`);
      }

      console.log(`✅ Migration completed: ${migratedSettlements} settlements + ${migratedPayments} payments → transactions`);
    } catch (error) {
      console.error('❌ Error during migration:', error);
      // No lanzar error para no bloquear la inicialización
      console.log('⚠️ Migration failed, but continuing with empty transactions table');
    }
  }

  // Funciones auxiliares ya definidas arriba en la clase
}

export const databaseService = new DatabaseService();