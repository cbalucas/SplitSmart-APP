export const createEventLanguage = {
  es: {
    header: {
      createEvent: 'Crear Evento',
      editEvent: 'Editar Evento'
    },
    
    form: {
      basicInformation: 'Información Básica',
      datesAndLocation: 'Fechas y Ubicación',
      financialConfiguration: 'Configuración Financiera',
      privacyConfiguration: 'Configuración de Privacidad',
      
      // Form fields
      eventName: 'Nombre del Evento',
      eventNamePlaceholder: 'Ej: Viaje a Bariloche',
      description: 'Descripción (Opcional)',
      descriptionPlaceholder: 'Describe de qué trata el evento...',
      startDate: 'Fecha de Inicio',
      selectDate: 'Seleccionar fecha',
      location: 'Ubicación (Opcional)',
      locationPlaceholder: 'Ej: Bariloche, Argentina',
      currency: 'Moneda *',
      eventType: 'Tipo de Evento',
      
      // Event types
      publicEvent: '🌐 Público',
      publicEventDescription: 'Visible para todos los usuarios',
      privateEvent: '🔒 Privado',
      privateEventDescription: 'Solo personas invitadas pueden participar',
      
      // Category
      category: 'Categoría *',
      categories: {
        travel: 'Viaje',
        home: 'Casa',
        dinner: 'Cena',
        work: 'Trabajo',
        event: 'Evento',
        other: 'Otro'
      }
    },
    
    actions: {
      createEvent: 'Crear Evento',
      updateEvent: 'Actualizar Evento',
      cancel: 'Cancelar',
      ok: 'OK',
      error: 'Error',
      eventCreated: 'Evento creado',
      eventUpdated: 'Evento actualizado',
      eventCreatedSuccess: 'El evento se ha creado exitosamente',
      eventUpdatedSuccess: 'El evento se ha actualizado exitosamente',
      discardChanges: 'Descartar cambios',
      discardMessage: '¿Estás seguro de que quieres salir? Los cambios no guardados se perderán.',
      exit: 'Salir'
    },
    
    validation: {
      nameRequired: 'El nombre del evento es requerido',
      nameMaxLength: 'El nombre no puede exceder 50 caracteres',
      dateRequired: 'La fecha de inicio es requerida',
      descriptionMaxLength: 'La descripción no puede exceder 200 caracteres',
      eventNotFound: 'No se encontró el evento',
      loadEventDataError: 'No se pudieron cargar los datos del evento',
      createEventError: 'No se pudo crear el evento. Intenta nuevamente.'
    }
  },
  
  en: {
    header: {
      createEvent: 'Create Event',
      editEvent: 'Edit Event'
    },
    
    form: {
      basicInformation: 'Basic Information',
      datesAndLocation: 'Dates and Location',
      financialConfiguration: 'Financial Configuration',
      privacyConfiguration: 'Privacy Configuration',
      
      eventName: 'Event Name',
      eventNamePlaceholder: 'e.g: Trip to Bariloche',
      description: 'Description (Optional)',
      descriptionPlaceholder: 'Describe what the event is about...',
      startDate: 'Start Date',
      selectDate: 'Select date',
      location: 'Location (Optional)',
      locationPlaceholder: 'e.g: Bariloche, Argentina',
      currency: 'Currency *',
      eventType: 'Event Type',
      
      publicEvent: '🌐 Public',
      publicEventDescription: 'Visible to all users',
      privateEvent: '🔒 Private',
      privateEventDescription: 'Only invited participants',
      
      category: 'Category *',
      categories: {
        travel: 'Travel',
        home: 'Home',
        dinner: 'Dinner',
        work: 'Work',
        event: 'Event',
        other: 'Other'
      }
    },
    
    actions: {
      createEvent: 'Create Event',
      updateEvent: 'Update Event',
      cancel: 'Cancel',
      ok: 'OK',
      error: 'Error',
      eventCreated: 'Event created',
      eventUpdated: 'Event updated',
      eventCreatedSuccess: 'The event has been created successfully',
      eventUpdatedSuccess: 'The event has been updated successfully',
      discardChanges: 'Discard changes',
      discardMessage: 'Are you sure you want to leave? Unsaved changes will be lost.',
      exit: 'Leave'
    },
    
    validation: {
      nameRequired: 'Event name is required',
      nameMaxLength: 'Name cannot exceed 50 characters',
      dateRequired: 'Start date is required',
      descriptionMaxLength: 'Description cannot exceed 200 characters',
      eventNotFound: 'Event not found',
      loadEventDataError: 'Could not load event data',
      createEventError: 'Could not create event. Please try again.'
    }
  },
  
  pt: {
    header: {
      createEvent: 'Criar Evento',
      editEvent: 'Editar Evento'
    },
    
    form: {
      basicInformation: 'Informações Básicas',
      datesAndLocation: 'Datas e Localização',
      financialConfiguration: 'Configuração Financeira',
      privacyConfiguration: 'Configuração de Privacidade',
      
      eventName: 'Nome do Evento',
      eventNamePlaceholder: 'ex: Viagem para Bariloche',
      description: 'Descrição (Opcional)',
      descriptionPlaceholder: 'Descreva sobre o que é o evento...',
      startDate: 'Data de Início',
      selectDate: 'Selecionar data',
      location: 'Localização (Opcional)',
      locationPlaceholder: 'ex: Bariloche, Argentina',
      currency: 'Moeda *',
      eventType: 'Tipo de Evento',
      
      publicEvent: '🌐 Público',
      publicEventDescription: 'Visível para todos os usuários',
      privateEvent: '🔒 Privado',
      privateEventDescription: 'Apenas participantes convidados',
      
      category: 'Categoria *',
      categories: {
        travel: 'Viagem',
        home: 'Casa',
        dinner: 'Jantar',
        work: 'Trabalho',
        event: 'Evento',
        other: 'Outro'
      }
    },
    
    actions: {
      createEvent: 'Criar Evento',
      updateEvent: 'Atualizar Evento',
      cancel: 'Cancelar',
      ok: 'OK',
      error: 'Erro',
      eventCreated: 'Evento criado',
      eventUpdated: 'Evento atualizado',
      eventCreatedSuccess: 'O evento foi criado com sucesso',
      eventUpdatedSuccess: 'O evento foi atualizado com sucesso',
      discardChanges: 'Descartar alterações',
      discardMessage: 'Tem certeza que deseja sair? As alterações não salvas serão perdidas.',
      exit: 'Sair'
    },
    
    validation: {
      nameRequired: 'Nome do evento é obrigatório',
      nameMaxLength: 'Nome não pode exceder 50 caracteres',
      dateRequired: 'Data de início é obrigatória',
      descriptionMaxLength: 'Descrição não pode exceder 200 caracteres',
      eventNotFound: 'Evento não encontrado',
      loadEventDataError: 'Não foi possível carregar dados do evento',
      createEventError: 'Não foi possível criar o evento. Tente novamente.'
    }
  }
};