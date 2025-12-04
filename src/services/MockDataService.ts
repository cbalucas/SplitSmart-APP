import { Event, Participant, Expense, Payment } from '../types';
import { DEMO_USER } from '../constants/demoUser';

export class MockDataService {
  
  static getDemoEvents(): Event[] {
    return [
      {
        id: "event-demo-001",
        name: "Cena de Amigos",
        description: "Cena de viernes en el restaurante",
        startDate: new Date("2024-11-01T20:00:00.000Z").toISOString(),
        location: "Restaurante Italiano",
        currency: "ARS",
        totalAmount: 15000,
        status: "active",
        type: "private",
        category: "cena",
        creatorId: DEMO_USER.id,
        createdAt: new Date("2024-11-01T18:00:00.000Z").toISOString(),
        updatedAt: new Date("2024-11-06T10:00:00.000Z").toISOString()
      },
      {
        id: "event-demo-002", 
        name: "Fin de Semana en Bariloche",
        description: "Viaje de fin de semana con amigos",
        startDate: new Date("2024-12-15T09:00:00.000Z").toISOString(),
        location: "Bariloche, Argentina",
        currency: "ARS",
        totalAmount: 85000,
        status: "active",
        type: "private", 
        category: "viaje",
        creatorId: DEMO_USER.id,
        createdAt: new Date("2024-11-05T14:00:00.000Z").toISOString(),
        updatedAt: new Date("2024-11-06T09:00:00.000Z").toISOString()
      },
      {
        id: "event-demo-003",
        name: "Gastos de Casa - Noviembre",
        description: "Gastos compartidos del departamento",
        startDate: new Date("2024-11-01T00:00:00.000Z").toISOString(),
        location: "Departamento Palermo",
        currency: "ARS",
        totalAmount: 45000,
        status: "completed",
        type: "private",
        category: "casa",
        creatorId: DEMO_USER.id,
        createdAt: new Date("2024-11-01T00:00:00.000Z").toISOString(),
        updatedAt: new Date("2024-11-30T23:59:59.000Z").toISOString()
      }
    ];
  }
  
  static getDemoParticipants(): Participant[] {
    return [
      {
        id: "participant-demo-001",
        name: "Demo",
        email: "demo@splitsmart.com",
        participantType: 'friend',
        isActive: true
      },
      {
        id: "participant-demo-002",
        name: "Ana García",
        email: "ana.garcia@email.com", 
        phone: "+54 9 11 2345-6789",
        participantType: 'friend',
        isActive: true
      },
      {
        id: "participant-demo-003",
        name: "Carlos Rodríguez",
        email: "carlos.rodriguez@email.com",
        phone: "+54 9 11 3456-7890",
        alias_cbu: "carlos.mp",
        participantType: 'friend',
        isActive: true
      },
      {
        id: "participant-demo-004",
        name: "María López",
        email: "maria.lopez@email.com",
        phone: "+54 9 11 4567-8901",
        participantType: 'friend',
        isActive: true
      }
    ];
  }
  
  static getDemoExpenses(): Expense[] {
    return [
      {
        id: "expense-demo-001",
        eventId: "event-demo-001",
        description: "Cena principal",
        amount: 12000,
        currency: "ARS",
        date: new Date("2024-11-01T21:00:00.000Z").toISOString(),
        category: "cena",
        payerId: "participant-demo-001",
        isActive: true,
        createdAt: new Date("2024-11-01T21:30:00.000Z").toISOString(),
        updatedAt: new Date("2024-11-01T21:30:00.000Z").toISOString()
      },
      {
        id: "expense-demo-002", 
        eventId: "event-demo-001",
        description: "Propinas",
        amount: 3000,
        currency: "ARS",
        date: new Date("2024-11-01T22:30:00.000Z").toISOString(),
        category: "otro",
        payerId: "participant-demo-002",
        isActive: true,
        createdAt: new Date("2024-11-01T22:45:00.000Z").toISOString(),
        updatedAt: new Date("2024-11-01T22:45:00.000Z").toISOString()
      },
      {
        id: "expense-demo-003",
        eventId: "event-demo-002",
        description: "Hotel - 2 noches", 
        amount: 45000,
        currency: "ARS",
        date: new Date("2024-12-15T15:00:00.000Z").toISOString(),
        category: "viaje",
        payerId: "participant-demo-001",
        isActive: true,
        createdAt: new Date("2024-11-05T16:00:00.000Z").toISOString(),
        updatedAt: new Date("2024-11-05T16:00:00.000Z").toISOString()
      },
      {
        id: "expense-demo-004",
        eventId: "event-demo-002",
        description: "Combustible ida y vuelta",
        amount: 25000,
        currency: "ARS", 
        date: new Date("2024-12-15T08:00:00.000Z").toISOString(),
        category: "transporte",
        payerId: "participant-demo-004",
        isActive: true,
        createdAt: new Date("2024-11-05T17:00:00.000Z").toISOString(),
        updatedAt: new Date("2024-11-05T17:00:00.000Z").toISOString()
      }
    ];
  }

  // Método para inicializar datos DEMO en la base de datos
  static async seedDemoData(dbService: any) {
    try {
      // Insertar eventos de ejemplo
      const events = this.getDemoEvents();
      for (const event of events) {
        await dbService.insertEvent(event);
      }
      
      console.log('✅ Datos DEMO cargados exitosamente');
    } catch (error) {
      console.error('❌ Error cargando datos DEMO:', error);
    }
  }
}