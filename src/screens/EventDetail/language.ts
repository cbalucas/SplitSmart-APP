export const eventDetailLanguage = {
  // Header and Navigation
  title: 'Detalle del Evento',
  back: 'Volver',
  
  // Tabs
  tabs: {
    summary: 'Resumen',
    participants: 'Participantes', 
    expenses: 'Gastos',
    payments: 'Pagos'
  },
  
  // Summary Tab
  summary: {
    title: '📊 Resumen del Evento',
    eventInfo: '📋 Información del Evento',
    settlements: '💸 Liquidación de Cuentas',
    categories: '📊 Gastos por Categoría',
    shareButtons: {
      summary: 'Compartir Resumen',
      event: 'Compartir Evento'
    },
    eventActions: {
      closeEvent: 'Cerrar Evento',
      reopenEvent: 'Reabrir',
      editEvent: 'Editar Evento',
      deleteEvent: 'Eliminar Evento'
    },
    stats: {
      participants: 'Participantes',
      expenses: 'Gastos', 
      totalSpent: 'Total Gastado',
      currency: 'Moneda'
    },
    status: {
      active: '🟢 Activo',
      closed: '🔒 Cerrado',
      completed: '✅ Completado',
      archived: '📁 Archivado'
    },
    noSettlements: {
      title: '¡Perfecto!',
      message: 'Todas las cuentas están equilibradas'
    },
    settlementInfo: 'Cierra el evento para poder marcar las liquidaciones como pagadas'
  },

  // Participants Tab  
  participants: {
    title: '👥 Participantes',
    addButton: 'Agregar',
    emptyState: {
      title: 'No hay participantes',
      subtitle: 'Agrega participantes para dividir los gastos'
    },
    balance: {
      owes: 'Debe pagar',
      owed: 'Se le debe',
      balanced: 'Equilibrado'
    },
    actions: {
      edit: 'Editar',
      remove: 'Eliminar',
      goToFriends: 'Ir a Mis Amigos'
    },
    editModal: {
      title: 'Editar Participante',
      fields: {
        name: 'Nombre',
        email: 'Email (Opcional)',
        phone: 'Teléfono (Opcional)', 
        aliasCbu: 'CBU/Alias (Opcional)'
      },
      placeholders: {
        name: 'Nombre del participante',
        email: 'correo@ejemplo.com',
        phone: '+54 9 11 1234-5678',
        aliasCbu: 'Alias o CBU para pagos'
      },
      convertToFriend: {
        title: '⭐ Convertir en Amigo Permanente',
        subtitle: 'Aparecerá en "Mis Amigos" y podrás agregarlo fácilmente a otros eventos'
      },
      buttons: {
        cancel: 'Cancelar',
        save: 'Guardar'
      }
    }
  },

  // Expenses Tab
  expenses: {
    title: '💸 Gastos',
    addButton: 'Agregar',
    search: {
      placeholder: 'Buscar gastos...',
      filterButton: 'Filtros'
    },
    filters: {
      title: 'Filtros y Ordenamiento',
      sortBy: 'Ordenar por:',
      sortOptions: {
        date: 'Fecha',
        amount: 'Monto', 
        description: 'Nombre'
      },
      filterByPayer: 'Filtrar por pagador:',
      all: 'Todos',
      clearFilters: 'Limpiar filtros'
    },
    emptyStates: {
      noExpenses: {
        title: 'No hay gastos registrados',
        subtitle: 'Toca "Agregar" para crear el primer gasto'
      },
      noResults: {
        title: 'No se encontraron gastos',
        subtitle: 'Intenta con otros filtros o búsqueda'
      }
    },
    item: {
      paidBy: 'Pagado por',
      division: 'División',
      participants: 'part',
      excluded: 'exc',
      excludedTitle: 'Excluidos:',
      receipt: '📷 Comprobante',
      actions: {
        edit: 'Editar',
        delete: 'Eliminar'
      }
    }
  },

  // Payments Tab
  payments: {
    title: '💰 Estado de Pagos',
    stats: {
      pending: 'Pendiente',
      paid: 'Pagado'
    },
    createFromSettlements: 'Crear pagos desde liquidaciones',
    list: {
      title: '💸 Pagos',
      emptyState: {
        title: 'No hay pagos registrados',
        subtitle: 'Crea pagos desde las liquidaciones pendientes'
      }
    },
    item: {
      addReceipt: 'Agregar comprobante',
      viewReceipt: 'Ver comprobante'
    }
  },

  // Actions and Buttons
  actions: {
    add: 'Agregar',
    edit: 'Editar', 
    delete: 'Eliminar',
    save: 'Guardar',
    cancel: 'Cancelar',
    close: 'Cerrar',
    reopen: 'Reabrir',
    share: 'Compartir',
    confirm: 'Confirmar',
    back: 'Volver'
  },

  // Alerts and Messages
  alerts: {
    eventClosed: {
      title: 'Evento Cerrado',
      message: 'No se pueden agregar gastos en un evento cerrado'
    },
    closeEvent: {
      title: '🔒 Cerrar Evento',
      message: 'Al cerrar el evento no podrás agregar, editar o eliminar gastos ni participantes. Solo podrás marcar las liquidaciones como pagadas.\n\n¿Deseas continuar?'
    },
    reopenEvent: {
      title: '🔓 Reabrir Evento',
      message: '¿Deseas reabrir el evento? Podrás volver a editar gastos y participantes.'
    },
    deleteEvent: {
      title: 'Eliminar Evento',
      message: '¿Estás seguro de que quieres eliminar este evento? Esta acción no se puede deshacer.'
    },
    deleteExpense: {
      title: 'Eliminar Gasto',
      message: '¿Estás seguro de que quieres eliminar este gasto?'
    },
    removeParticipant: {
      title: 'Eliminar Participante',
      message: '¿Estás seguro de que quieres eliminar este participante del evento?'
    },
    editFriend: {
      title: 'ℹ️ Editar Amigo',
      message: 'es un amigo permanente. Para editarlo, ve a la sección "Mis Amigos" desde el menú principal.'
    },
    eventCompleted: {
      title: '🎉 ¡Evento Completado!',
      message: 'Todas las liquidaciones han sido pagadas'
    },
    createPayments: {
      title: 'Crear Pagos',
      message: '¿Deseas crear pagos basados en las liquidaciones pendientes?'
    }
  },

  // Success Messages
  success: {
    participantAdded: 'Participante agregado correctamente',
    participantUpdated: 'Participante actualizado correctamente', 
    participantRemoved: 'Participante eliminado correctamente',
    convertedToFriend: 'Convertido a Amigo',
    convertedToFriendMessage: 'ahora es un amigo permanente y aparecerá en "Mis Amigos"',
    expenseDeleted: 'Gasto eliminado correctamente',
    eventClosed: 'Evento cerrado correctamente',
    eventReopened: 'El evento está activo nuevamente',
    eventDeleted: 'Evento eliminado correctamente',
    receiptAdded: 'Comprobante agregado',
    receiptRemoved: 'Comprobante eliminado',
    paymentsCreated: 'pagos creados correctamente'
  },

  // Error Messages
  errors: {
    eventNotFound: 'Evento no encontrado',
    nameRequired: 'El nombre es obligatorio',
    participantUpdateFailed: 'No se pudo actualizar el participante',
    participantRemoveFailed: 'No se pudo eliminar el participante',
    expenseDeleteFailed: 'No se pudo eliminar el gasto',
    eventCloseFailed: 'No se pudo cerrar el evento',
    eventReopenFailed: 'No se pudo reabrir el evento',
    eventDeleteFailed: 'No se pudo eliminar el evento',
    receiptUpdateFailed: 'No se pudo actualizar el comprobante',
    paymentUpdateFailed: 'No se pudo actualizar el estado del pago',
    paymentsCreateFailed: 'No se pudieron crear los pagos',
    whatsappNotAvailable: 'WhatsApp no disponible',
    whatsappFallback: 'El resumen se copió al portapapeles. Puedes pegarlo en cualquier aplicación.',
    whatsappError: 'Error al abrir WhatsApp'
  },

  // Share Messages
  share: {
    summaryTitle: '📊 *RESUMEN - ',
    eventTitle: '🎉 *',
    totalSpent: '💰 *Total gastado:* ',
    participantsCount: '👥 *Participantes:* ',
    settlementsTitle: '💸 *LIQUIDACIÓN DE CUENTAS:*',
    settlementsBalanced: '✅ ¡Todas las cuentas están equilibradas!',
    expensesTitle: '💸 *GASTOS (',
    paid: ' ✅ PAGADO',
    location: '📍 *Ubicación:* ',
    date: '📅 *Fecha:* ',
    currency: '💰 *Moneda:* ',
    status: '📊 *Estado:* ',
    participantsTitle: '👥 *PARTICIPANTES (',
    totalLabel: '💵 *TOTAL: $',
    liquidationTitle: '💸 *LIQUIDACIÓN:*',
    noExpenses: 'Sin gastos registrados',
    exceptions: ' | Excep: ',
    cbuNotAvailable: 'CBU no disponible'
  },

  // Status Labels
  statusLabels: {
    active: 'Activo',
    closed: 'Cerrado',
    completed: 'Completado',
    archived: 'Archivado'
  },

  // Category Labels
  categories: {
    general: 'General',
    food: 'Comida',
    transport: 'Transporte', 
    entertainment: 'Entretenimiento',
    accommodation: 'Alojamiento',
    other: 'Otros'
  },

  // Settlement Labels
  settlements: {
    paid: 'PAGADO',
    pending: 'PENDIENTE',
    markAsPaid: 'Marcar como pagado',
    markAsPending: 'Marcar como pendiente'
  }
};

export type EventDetailLanguageType = typeof eventDetailLanguage;