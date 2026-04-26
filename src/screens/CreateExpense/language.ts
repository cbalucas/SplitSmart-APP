export const createExpenseLanguage = {
  es: {
    // Header
    headerTitle: {
      create: 'Agregar Gasto',
      edit: 'Editar Gasto'
    },
    
    // Card: Información del Gasto
    expenseInfoCard: {
      title: '📝 Información del Gasto',
      descriptionLabel: '¿En qué se gastó?',
      descriptionPlaceholder: 'Ej: Cena en restaurante',
      amountLabel: 'Monto Total',
      amountPlaceholder: '0.00',
      dateLabel: 'Fecha del Gasto'
    },
    
    // Card: ¿Quién pagó?
    payerCard: {
      title: '👤 ¿Quién pagó?',
      searchLabel: 'Buscar participante',
      searchPlaceholder: 'Buscar...'
    },
    
    // Card: Participantes y División
    participantsCard: {
      title: '👥 Participantes y División',
      subtitle: 'División automática en partes iguales según los participantes seleccionados',
      subtitlePercentage: 'Ingresa el porcentaje para cada participante (deben sumar 100%)',
      subtitleFixed: 'Ingresa el monto exacto para cada participante',
      excludedLabel: 'Excluido',
      warningText: '⚠️ Debes incluir al menos un participante en el gasto',
      splitTypeLabel: 'Tipo de división',
      splitTypeEqual: 'Partes iguales',
      splitTypePercentage: 'Porcentaje',
      splitTypeFixed: 'Monto fijo',
      percentageSum: 'Suma: {sum}%',
      fixedSum: 'Suma: ${sum}',
      remainingAmount: 'Restante: ${remaining}',
      splitSumOk: 'División correcta ✓',
      splitSumError: 'La suma no coincide con el monto total'
    },
    
    // Card: Comprobante
    receiptCard: {
      title: '📷 Comprobante (Opcional)',
      attachButton: 'Adjuntar comprobante o recibo',
      changeButton: 'Cambiar',
      deleteButton: 'Eliminar'
    },
    
    // Card: Categorización
    categoryCard: {
      title: '🏷️ Categorización',
      sectionLabel: 'Categoría'
    },
    
    // Categories
    categories: {
      comida: 'Comida',
      transporte: 'Transporte',
      alojamiento: 'Alojamiento',
      entretenimiento: 'Entretenimiento',
      compras: 'Compras',
      salud: 'Salud',
      educacion: 'Educación',
      otros: 'Otros'
    },
    
    // Footer Buttons
    buttons: {
      cancel: 'Cancelar',
      create: 'Crear Gasto',
      update: 'Actualizar'
    },
    
    // Alerts and Messages
    alerts: {
      createSuccess: {
        title: 'Gasto creado',
        message: 'El gasto se ha registrado exitosamente'
      },
      updateSuccess: {
        title: 'Gasto actualizado',
        message: 'El gasto se ha actualizado exitosamente'
      },
      validationError: 'Los montos no coinciden con el total del gasto',
      modifyPeople: {
        title: 'Modificar personas',
        message: 'Por defecto: {count} persona(s)\n\nIngresa el número de personas para este gasto específico (1-20), o deja vacío para usar el valor por defecto:',
        invalidNumber: 'Ingresa un número entre 1 y 20'
      },
      exitConfirm: {
        title: 'Confirmar',
        message: '¿Estás seguro de que quieres salir? Los cambios no guardados se perderán.',
        cancel: 'Cancelar',
        confirm: 'Salir'
      },
      imageOptions: {
        title: 'Seleccionar imagen',
        camera: 'Tomar foto',
        gallery: 'Elegir de galería'
      },
      permissions: {
        camera: 'Necesitamos permiso para acceder a tu cámara',
        photos: 'Necesitamos permiso para acceder a tus fotos',
        title: 'Permiso requerido'
      },
      errors: {
        general: 'Error',
        loadEvent: 'No se pudieron cargar los datos del evento',
        loadExpense: 'No se pudieron cargar los datos del gasto',
        selectImage: 'No se pudo seleccionar la imagen',
        takePhoto: 'No se pudo tomar la foto',
        saveExpense: 'No se pudo guardar el gasto'
      }
    },
    
    // Summary section
    summary: {
      total: 'Total',
      participants: 'participantes',
      participant: 'participante'
    },
    
    // Multiple payers card
    multiplePayersCard: {
      toggleLabel: 'Múltiples pagadores',
      toggleSubtitle: 'Dividir el pago entre varias personas',
      sumOk: 'La suma coincide con el monto del gasto ✓',
      sumMismatch: 'Suma: ${sum} — Falta: ${remaining} para completar el pago',
      minPayersWarning: 'Seleccioná al menos 2 pagadores'
    },

    // Form Errors
    errors: {
      description: 'La descripción es requerida',
      amount: 'El monto debe ser mayor a 0',
      payerId: 'Debe seleccionar quién pagó',
      splits: 'Debe incluir al menos un participante'
    }
  },
  
  en: {
    // Header
    headerTitle: {
      create: 'Add Expense',
      edit: 'Edit Expense'
    },
    
    // Card: Información del Gasto
    expenseInfoCard: {
      title: '📝 Expense Information',
      descriptionLabel: 'What was spent on?',
      descriptionPlaceholder: 'e.g.: Restaurant dinner',
      amountLabel: 'Total Amount',
      amountPlaceholder: '0.00',
      dateLabel: 'Expense Date'
    },
    
    // Card: ¿Quién pagó?
    payerCard: {
      title: '👤 Who paid?',
      searchLabel: 'Search participant',
      searchPlaceholder: 'Search...'
    },
    
    // Card: Participantes y División
    participantsCard: {
      title: '👥 Participants & Split',
      subtitle: 'Automatic equal split among selected participants',
      subtitlePercentage: 'Enter the percentage for each participant (must sum to 100%)',
      subtitleFixed: 'Enter the exact amount for each participant',
      excludedLabel: 'Excluded',
      warningText: '⚠️ You must include at least one participant',
      splitTypeLabel: 'Split type',
      splitTypeEqual: 'Equal parts',
      splitTypePercentage: 'Percentage',
      splitTypeFixed: 'Fixed amount',
      percentageSum: 'Sum: {sum}%',
      fixedSum: 'Sum: ${sum}',
      remainingAmount: 'Remaining: ${remaining}',
      splitSumOk: 'Split correct ✓',
      splitSumError: 'Sum does not match total amount'
    },
    
    // Card: Comprobante
    receiptCard: {
      title: '📷 Receipt (Optional)',
      attachButton: 'Attach receipt or proof',
      changeButton: 'Change',
      deleteButton: 'Delete'
    },
    
    // Card: Categorización
    categoryCard: {
      title: '🏷️ Categorization',
      sectionLabel: 'Category'
    },
    
    // Categories
    categories: {
      comida: 'Food',
      transporte: 'Transport',
      alojamiento: 'Accommodation',
      entretenimiento: 'Entertainment',
      compras: 'Shopping',
      salud: 'Health',
      educacion: 'Education',
      otros: 'Others'
    },
    
    // Footer Buttons
    buttons: {
      cancel: 'Cancel',
      create: 'Create Expense',
      update: 'Update'
    },
    
    // Alerts and Messages
    alerts: {
      createSuccess: {
        title: 'Expense created',
        message: 'The expense has been registered successfully'
      },
      updateSuccess: {
        title: 'Expense updated',
        message: 'The expense has been updated successfully'
      },
      validationError: 'The amounts do not match the total expense',
      modifyPeople: {
        title: 'Modify people',
        message: 'Default: {count} person(s)\n\nEnter the number of people for this specific expense (1-20), or leave empty to use the default value:',
        invalidNumber: 'Enter a number between 1 and 20'
      },
      exitConfirm: {
        title: 'Confirm',
        message: 'Are you sure you want to exit? Unsaved changes will be lost.',
        cancel: 'Cancel',
        confirm: 'Exit'
      },
      imageOptions: {
        title: 'Select image',
        camera: 'Take photo',
        gallery: 'Choose from gallery'
      },
      permissions: {
        camera: 'We need permission to access your camera',
        photos: 'We need permission to access your photos',
        title: 'Permission required'
      },
      errors: {
        general: 'Error',
        loadEvent: 'Could not load event data',
        loadExpense: 'Could not load expense data',
        selectImage: 'Could not select image',
        takePhoto: 'Could not take photo',
        saveExpense: 'Could not save expense'
      }
    },

    // Summary section
    summary: {
      total: 'Total',
      participants: 'participants',
      participant: 'participant'
    },

    // Multiple payers card
    multiplePayersCard: {
      toggleLabel: 'Multiple payers',
      toggleSubtitle: 'Split the payment among several people',
      sumOk: 'The sum matches the expense amount ✓',
      sumMismatch: 'Sum: ${sum} — Missing: ${remaining} to complete payment',
      minPayersWarning: 'Select at least 2 payers'
    },

    // Form Errors
    errors: {
      description: 'Description is required',
      amount: 'Amount must be greater than 0',
      payerId: 'Must select who paid',
      splits: 'Must include at least one participant'
    }
  },
  
  pt: {
    // Header
    headerTitle: {
      create: 'Adicionar Despesa',
      edit: 'Editar Despesa'
    },
    
    // Card: Información del Gasto
    expenseInfoCard: {
      title: '📝 Informações da Despesa',
      descriptionLabel: 'Em que foi gasto?',
      descriptionPlaceholder: 'Ex: Jantar no restaurante',
      amountLabel: 'Valor Total',
      amountPlaceholder: '0.00',
      dateLabel: 'Data da Despesa'
    },
    
    // Card: ¿Quién pagó?
    payerCard: {
      title: '👤 Quem pagou?',
      searchLabel: 'Buscar participante',
      searchPlaceholder: 'Buscar...'
    },
    
    // Card: Participantes y División
    participantsCard: {
      title: '👥 Participantes e Divisão',
      subtitle: 'Divisão automática em partes iguais entre os participantes selecionados',
      subtitlePercentage: 'Insira a porcentagem para cada participante (deve somar 100%)',
      subtitleFixed: 'Insira o valor exato para cada participante',
      excludedLabel: 'Excluído',
      warningText: '⚠️ Você deve incluir pelo menos um participante',
      splitTypeLabel: 'Tipo de divisão',
      splitTypeEqual: 'Partes iguais',
      splitTypePercentage: 'Porcentagem',
      splitTypeFixed: 'Valor fixo',
      percentageSum: 'Soma: {sum}%',
      fixedSum: 'Soma: ${sum}',
      remainingAmount: 'Restante: ${remaining}',
      splitSumOk: 'Divisão correta ✓',
      splitSumError: 'A soma não coincide com o valor total'
    },
    
    // Card: Comprobante
    receiptCard: {
      title: '📷 Comprovante (Opcional)',
      attachButton: 'Anexar comprovante ou recibo',
      changeButton: 'Alterar',
      deleteButton: 'Excluir'
    },
    
    // Card: Categorización
    categoryCard: {
      title: '🏷️ Categorização',
      sectionLabel: 'Categoria'
    },
    
    // Categories
    categories: {
      comida: 'Comida',
      transporte: 'Transporte',
      alojamiento: 'Acomodação',
      entretenimiento: 'Entretenimento',
      compras: 'Compras',
      salud: 'Saúde',
      educacion: 'Educação',
      otros: 'Outros'
    },
    
    // Footer Buttons
    buttons: {
      cancel: 'Cancelar',
      create: 'Criar Despesa',
      update: 'Atualizar'
    },
    
    // Alerts and Messages
    alerts: {
      createSuccess: {
        title: 'Despesa criada',
        message: 'A despesa foi registrada com sucesso'
      },
      updateSuccess: {
        title: 'Despesa atualizada',
        message: 'A despesa foi atualizada com sucesso'
      },
      validationError: 'Os valores não coincidem com o total da despesa',
      modifyPeople: {
        title: 'Modificar pessoas',
        message: 'Padrão: {count} pessoa(s)\n\nDigite o número de pessoas para esta despesa específica (1-20), ou deixe vazio para usar o valor padrão:',
        invalidNumber: 'Digite um número entre 1 e 20'
      },
      exitConfirm: {
        title: 'Confirmar',
        message: 'Tem certeza de que deseja sair? As alterações não salvas serão perdidas.',
        cancel: 'Cancelar',
        confirm: 'Sair'
      },
      imageOptions: {
        title: 'Selecionar imagem',
        camera: 'Tirar foto',
        gallery: 'Escolher da galeria'
      },
      permissions: {
        camera: 'Precisamos de permissão para acessar sua câmera',
        photos: 'Precisamos de permissão para acessar suas fotos',
        title: 'Permissão necessária'
      },
      errors: {
        general: 'Erro',
        loadEvent: 'Não foi possível carregar os dados do evento',
        loadExpense: 'Não foi possível carregar os dados da despesa',
        selectImage: 'Não foi possível selecionar a imagem',
        takePhoto: 'Não foi possível tirar a foto',
        saveExpense: 'Não foi possível salvar a despesa'
      }
    },

    // Summary section
    summary: {
      total: 'Total',
      participants: 'participantes',
      participant: 'participante'
    },

    // Multiple payers card
    multiplePayersCard: {
      toggleLabel: 'Múltiplos pagadores',
      toggleSubtitle: 'Dividir o pagamento entre várias pessoas',
      sumOk: 'A soma coincide com o valor da despesa ✓',
      sumMismatch: 'Soma: ${sum} — Falta: ${remaining} para completar o pagamento',
      minPayersWarning: 'Selecione pelo menos 2 pagadores'
    },

    // Form Errors
    errors: {
      description: 'A descrição é obrigatória',
      amount: 'O valor deve ser maior que 0',
      payerId: 'Deve selecionar quem pagou',
      splits: 'Deve incluir pelo menos um participante'
    }
  }
};