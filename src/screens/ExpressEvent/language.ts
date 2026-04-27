export type ExpressLanguage = 'es' | 'en' | 'pt';

interface ExpressTranslations {
  screenTitle: string;
  welcome: string;
  askEventName: string;
  askEventDate: string;
  askParticipants: string;
  askParticipantsHint: string;
  confirmParticipants: string;
  noFriends: string;
  askBulkParticipants: string;
  askBulkParticipantsExtra: string;
  bulkParticipantsHint: string;
  bulkParticipantsSkip: string;
  duplicateParticipants: string;
  cancelRestart: string;
  cancelRestartConfirm: string;
  temporaryWarning: string;
  askHasExpenses: string;
  noExpensesHint: string;
  askExpenseTitle: string;
  askExpenseAmount: string;
  askExpenseDate: string;
  askExpensePayer: string;
  askMoreExpenses: string;
  yes: string;
  no: string;
  summaryHeader: string;
  summaryEvent: string;
  summaryDate: string;
  summaryParticipants: string;
  summaryNoParticipants: string;
  summaryExpenses: string;
  summaryNoExpenses: string;
  summaryExpenseItem: string;
  summaryPaidBy: string;
  confirmCreate: string;
  creating: string;
  successMessage: string;
  goToDetail: string;
  detailHint: string;
  inputPlaceholderName: string;
  inputPlaceholderAmount: string;
  inputPlaceholderExpenseTitle: string;
  selectDate: string;
  selectPayer: string;
  noParticipantsSelected: string;
  noParticipantsSkipExpenses: string;
  invalidAmount: string;
  requiredField: string;
  errorCreating: string;
  selectAll: string;
  clearAll: string;
  expenseCount: string;
  sectionLabelEventName: string;
  sectionLabelEventDate: string;
  sectionLabelParticipants: string;
  sectionLabelBulkParticipants: string;
  sectionLabelExpenses: string;
  sectionLabelExpenseTitle: string;
  sectionLabelExpenseAmount: string;
  sectionLabelExpenseDate: string;
  sectionLabelExpensePayer: string;
  sectionLabelMoreExpenses: string;
  sectionLabelSummary: string;
  langChangeNotice: string;
  langChangeContinue: string;
  langChangeRestart: string;
  cancelCreate: string;
  goBackStep: string;
  timeoutMessage: string;
  // Menú inicial
  askMode: string;
  modeExpress: string;
  modeAdvanced: string;
  modeHelp: string;
  // Modo ayuda
  helpWelcome: string;
  helpInputPlaceholder: string;
  helpSectionLabel: string;
  helpBackToMenu: string;
  helpSeeOptions: string;
  helpAnswerEvent: string;
  helpAnswerExpense: string;
  helpAnswerParticipant: string;
  helpAnswerFriend: string;
  helpAnswerSettlement: string;
  helpAnswerDefault: string;
  helpChooseOption: string;
  // Etiquetas de las preguntas predefinidas
  helpQ1: string;
  helpQ2: string;
  helpQ3: string;
  helpQ4: string;
  helpQ5: string;
  // Modo avanzado - split
  askSplitType: string;
  splitTypeEqual: string;
  splitTypePercentage: string;
  splitTypeCustom: string;
  askSplitValues: string;
  splitPercentageError: string;
  splitAmountError: string;
  sectionLabelSplitType: string;
  sectionLabelSplitValues: string;
  summaryCustomSplitLabel: string;
  // Modo avanzado - múltiples pagadores
  askPayerCount: string;
  payerSingle: string;
  payerMultiple: string;
  askExpensePayerAdvanced: string;
  confirmMultiPayers: string;
  multiPayerSumError: string;
  summaryMultiPaidBy: string;
  // Excluir participantes
  askExcludeParticipants: string;
  noExclusions: string;
  confirmExclusions: string;
  sectionLabelPayerCount: string;
  sectionLabelExclude: string;
  // Tip en resumen
  summaryStandardTip: string;
}

const es: ExpressTranslations = {
  screenTitle: 'Splitty',
  welcome: '¡Hola! Soy Splitty ⚡, tu asistente para crear eventos rápidos. ¡Empecemos!',
  askEventName: '¿Cómo se llama el evento?',
  askEventDate: '¿Cuál es la fecha del evento?',
  askParticipants: '¿Quiénes van a participar? Seleccioná tus amigos:',
  askParticipantsHint: '💡 Seleccioná de tu lista. Luego vas a poder agregar más por nombre.',
  confirmParticipants: 'Participantes seleccionados:',
  noFriends: 'No tenés amigos guardados aún. Podés agregarlos desde "Amigos" en el menú principal.',
  askBulkParticipants: '¿Quiénes van a participar? Escribí los nombres separados por coma:',
  askBulkParticipantsExtra: '¿Querés agregar más participantes por nombre? Escribílos separados por coma:',
  bulkParticipantsHint: 'Ejemplo: Ana, Carlos, María López',
  bulkParticipantsSkip: 'Saltar, sin más participantes',
  duplicateParticipants: '⚠️ Algunos nombres ya están en la lista: {names}. Corregílos o eliminálos antes de continuar.',
  cancelRestart: 'Salir',
  cancelRestartConfirm: '¿Segúro? Se perderá todo lo que cargaste.',
  temporaryWarning: '⚠️ Tenés participantes temporales seleccionados. Recordá que deberás convertirlos a amigos permanentes o cargarlos desde el detalle del evento.',
  askHasExpenses: '¿Tenés gastos para cargar en este evento?',
  noExpensesHint: 'Sin problema, podés agregar los gastos más tarde desde el detalle del evento.',
  askExpenseTitle: '¿Cuál es el nombre del gasto?',
  askExpenseAmount: '¿Cuánto fue el monto?',
  askExpenseDate: '¿Cuándo fue el gasto?',
  askExpensePayer: '¿Quién pagó?',
  askMoreExpenses: '¿Querés agregar otro gasto?',
  yes: 'Sí',
  no: 'No',
  summaryHeader: '¡Perfecto! Acá está el resumen:',
  summaryEvent: '🎉 Evento:',
  summaryDate: '🗓 Fecha:',
  summaryParticipants: '👥 Participantes:',
  summaryNoParticipants: '  – Se cargarán en el detalle del evento.',
  summaryExpenses: '💰 Gastos:',
  summaryNoExpenses: '  – Se cargarán en el detalle del evento.',
  summaryExpenseItem: '• {title} — ${amount}',
  summaryPaidBy: 'Pagó: {name}',
  confirmCreate: '¿Creamos el evento?',
  creating: 'Creando evento...',
  successMessage: '✅ ¡Evento creado exitosamente!',
  goToDetail: 'Ver detalle',
  detailHint: '💡 Las demás modificaciones (editar participantes, dividir gastos, etc.) las podés hacer desde el detalle del evento.',
  inputPlaceholderName: 'Nombre del evento...',
  inputPlaceholderAmount: 'Monto...',
  inputPlaceholderExpenseTitle: 'Nombre del gasto...',
  selectDate: 'Seleccionar fecha',
  selectPayer: 'Seleccioná quién pagó',
  noParticipantsSelected: 'Seleccioná al menos un participante',  noParticipantsSkipExpenses: 'No hay participantes cargados. Podrás agregar gastos desde el detalle del evento una vez que agregues participantes.',  invalidAmount: 'Ingresá un monto válido mayor a 0',
  requiredField: 'Este campo es obligatorio',
  errorCreating: 'Hubo un error al crear el evento. Intentá nuevamente.',
  selectAll: 'Seleccionar todos',
  clearAll: 'Limpiar',
  expenseCount: '{count} gasto{plural}',
  sectionLabelEventName: 'Nombre del evento',
  sectionLabelEventDate: 'Fecha del evento',
  sectionLabelParticipants: 'Participantes',
  sectionLabelBulkParticipants: 'Agregar participantes',
  sectionLabelExpenses: '¿Tenés gastos?',
  sectionLabelExpenseTitle: 'Descripción del gasto',
  sectionLabelExpenseAmount: 'Monto del gasto',
  sectionLabelExpenseDate: 'Fecha del gasto',
  sectionLabelExpensePayer: '¿Quién pagó?',
  sectionLabelMoreExpenses: '¿Más gastos?',
  sectionLabelSummary: 'Resumen del evento',
  langChangeNotice: 'Cambiaste el idioma. Los mensajes anteriores quedarán en el idioma original. ¿Querés volver a empezar en el nuevo idioma?',
  langChangeContinue: 'Continuar',
  langChangeRestart: 'Volver a empezar',
  cancelCreate: 'Cancelar carga',
  goBackStep: 'Paso anterior',
  timeoutMessage: '⏰ El chat estuvo inactivo por 5 minutos. Volvé a la pantalla principal e ingresá nuevamente para continuar.',
  askMode: '¿En qué te puedo ayudar hoy?',
  modeExpress: 'Crear evento express',
  modeAdvanced: 'Evento Avanzado',
  modeHelp: 'Tengo una consulta',
  // Modo ayuda
  helpWelcome: '¡Claro! Preguntame lo que necesités sobre SplitSmart. Hago lo mejor que puedo 😊',
  helpInputPlaceholder: 'Ingresá un número (1-5)...',
  helpSectionLabel: 'Consulta',
  helpBackToMenu: 'Volver al menú',
  helpSeeOptions: 'Ver opciones',
  helpAnswerEvent: 'Para crear un evento, podés usar el modo express (rápido, con Splitty) o el botón “+” del inicio (manual, con más opciones). Desde el detalle del evento podés editarlo, agregar participantes y gastos.',
  helpAnswerExpense: 'Los gastos se cargan durante la creación del evento o desde su detalle. Cada gasto tiene nombre, monto, fecha y quién pagó (puede ser más de un participante). La división entre participantes es automática, pero se pueden excluir participantes de un gasto.',
  helpAnswerParticipant: 'Los participantes pueden ser amigos guardados o personas temporales. Los amigos se agregan desde la sección “Amigos” del menú principal. Los temporales no tienen cuenta propia. Un participante temporal puede pasar a ser amigo si al crearlo o editarlo se tilda la opción correspondiente.',
  helpAnswerFriend: 'Agregá amigos desde el menú desplegable (...) en la parte superior derecha, opción "Amigos" en la pantalla de inicio. Una vez agregados, aparecen disponibles al crear eventos y cargar gastos.',
  helpAnswerSettlement: 'Desde el detalle de un evento podés ver las liquidaciones: cuánto debe cada uno y a quién. Podés marcar pagos como realizados para llevar el control.',
  helpAnswerDefault: 'No encontré una respuesta exacta para eso. Podés usar el tour de ayuda (icón \u2753 en la barra) para conocer cada sección, o volver al menú y crear tu primer evento.',
  helpChooseOption: 'Elegí una opción ingresando su número:',
  helpQ1: '¿Cómo agrego amigos?',
  helpQ2: '¿Cómo creo un evento?',
  helpQ3: '¿Cómo cargo gastos?',
  helpQ4: '¿Cómo agrego participantes?',
  helpQ5: '¿Cómo funciona la liquidación?',
  // Modo avanzado - split
  askSplitType: '¿Cómo querés dividir este gasto entre los participantes?',
  splitTypeEqual: 'Partes iguales',
  splitTypePercentage: 'Por porcentaje',
  splitTypeCustom: 'Por monto fijo',
  askSplitValues: 'Ingresá el valor para cada participante:',
  splitPercentageError: '⚠️ Los porcentajes deben sumar exactamente 100%. Revisá los valores.',
  splitAmountError: '⚠️ Los montos deben sumar $\{amount\}. Revisá los valores.',
  sectionLabelSplitType: 'Tipo de división',
  sectionLabelSplitValues: 'División personalizada',
  summaryCustomSplitLabel: 'División',
  // Modo avanzado - múltiples pagadores
  askPayerCount: '¿Pagó una sola persona o varias?',
  payerSingle: '1 persona',
  payerMultiple: 'Varias personas',
  askExpensePayerAdvanced: '¿Quién pagó? Seleccioná los pagadores e indicá cuánto puso cada uno:',
  confirmMultiPayers: '✅ Confirmar pagadores',
  multiPayerSumError: '⚠️ La suma de los pagadores debe ser igual al monto del gasto (${amount}).',
  summaryMultiPaidBy: 'Pagaron: {names}',
  // Excluir participantes
  askExcludeParticipants: '¿Hay algún participante que no participe en este gasto?',
  noExclusions: 'No, todos participan',
  confirmExclusions: '✅ Confirmar exclusiones',
  sectionLabelPayerCount: '¿1 o varios pagadores?',
  sectionLabelExclude: 'Excluir participantes',
  // Tip en resumen
  summaryStandardTip: '💡 Para agregar más de un pagador o dividir el gasto de forma personalizada, editá el gasto desde Detalle del evento → Gastos. O activá la versión avanzada de Splitty desde tu perfil.',
};

const en: ExpressTranslations = {
  screenTitle: 'Splitty',
  welcome: 'Hi! I\'m Splitty ⚡, your assistant for creating events fast. Let\'s go!',
  askEventName: 'What\'s the event name?',
  askEventDate: 'What\'s the event date?',
  askParticipants: 'Who\'s joining? Select your friends:',
  askParticipantsHint: '💡 Select from your list. You can add more by name in the next step.',
  confirmParticipants: 'Selected participants:',
  noFriends: 'You have no saved friends yet. You can add them from "Friends" in the main menu.',
  askBulkParticipants: 'Who will participate? Write their names separated by commas:',
  askBulkParticipantsExtra: 'Do you want to add more participants by name? Write them separated by commas:',
  bulkParticipantsHint: 'Example: Ana, Carlos, Maria Lopez',
  bulkParticipantsSkip: 'Skip, no more participants',
  duplicateParticipants: '⚠️ Some names are already in the list: {names}. Fix or remove them before continuing.',
  cancelRestart: 'Exit',
  cancelRestartConfirm: 'Are you sure? All progress will be lost.',
  temporaryWarning: '⚠️ You have temporary participants selected. Remember to convert them to permanent friends or add them from the event detail.',
  askHasExpenses: 'Do you have any expenses to add to this event?',
  noExpensesHint: 'No problem, you can add expenses later from the event detail.',
  askExpenseTitle: 'What\'s the expense name?',
  askExpenseAmount: 'How much was it?',
  askExpenseDate: 'When was the expense?',
  askExpensePayer: 'Who paid?',
  askMoreExpenses: 'Do you want to add another expense?',
  yes: 'Yes',
  no: 'No',
  summaryHeader: 'Here\'s the summary:',
  summaryEvent: '🎉 Event:',
  summaryDate: '🗓 Date:',
  summaryParticipants: '👥 Participants:',
  summaryNoParticipants: '  – Will be added in the event detail.',
  summaryExpenses: '💰 Expenses:',
  summaryNoExpenses: '  – Will be added in the event detail.',
  summaryExpenseItem: '• {title} — ${amount}',
  summaryPaidBy: 'Paid by: {name}',
  confirmCreate: 'Shall we create the event?',
  creating: 'Creating event...',
  successMessage: '✅ Event created successfully!',
  goToDetail: 'View detail',
  detailHint: '💡 Further changes (editing participants, splitting expenses, etc.) can be done from the event detail.',
  inputPlaceholderName: 'Event name...',
  inputPlaceholderAmount: 'Amount...',
  inputPlaceholderExpenseTitle: 'Expense name...',
  selectDate: 'Select date',
  selectPayer: 'Select who paid',
  noParticipantsSelected: 'Select at least one participant',
  noParticipantsSkipExpenses: 'No participants added. You can add expenses from the event detail once you add participants.',
  invalidAmount: 'Enter a valid amount greater than 0',
  requiredField: 'This field is required',
  errorCreating: 'There was an error creating the event. Please try again.',
  selectAll: 'Select all',
  clearAll: 'Clear',
  expenseCount: '{count} expense{plural}',
  sectionLabelEventName: 'Event name',
  sectionLabelEventDate: 'Event date',
  sectionLabelParticipants: 'Participants',
  sectionLabelBulkParticipants: 'Add participants',
  sectionLabelExpenses: 'Add expenses?',
  sectionLabelExpenseTitle: 'Expense description',
  sectionLabelExpenseAmount: 'Expense amount',
  sectionLabelExpenseDate: 'Expense date',
  sectionLabelExpensePayer: 'Who paid?',
  sectionLabelMoreExpenses: 'More expenses?',
  sectionLabelSummary: 'Event summary',
  langChangeNotice: 'You changed the language. Previous messages will remain in the original language. Do you want to start over in the new language?',
  langChangeContinue: 'Continue',
  langChangeRestart: 'Start over',
  cancelCreate: 'Cancel creation',
  goBackStep: 'Previous step',
  timeoutMessage: '⏰ The chat has been inactive for 5 minutes. Return to the home screen and open Splitty again to continue.',
  askMode: 'How can I help you today?',
  modeExpress: 'Create express event',
  modeAdvanced: 'Advanced Event',
  modeHelp: 'I have a question',
  // Help mode
  helpWelcome: 'Of course! Ask me anything about SplitSmart. I\'ll do my best 😊',
  helpInputPlaceholder: 'Enter a number (1-5)...',
  helpSectionLabel: 'Question',
  helpBackToMenu: 'Back to menu',
  helpSeeOptions: 'See options',
  helpAnswerEvent: 'To create an event, you can use express mode (quick, with Splitty) or the "+" button on the home screen (manual, with more options). From the event detail you can edit it, add participants and expenses.',
  helpAnswerExpense: 'Expenses can be added during event creation or from the event detail. Each expense has a name, amount, date, and who paid. Splitting among participants is automatic.',
  helpAnswerParticipant: 'Participants can be saved friends or temporary people (name only). Friends are added from the \u201cFriends\u201d section in the main menu. Temporary participants don\'t have their own account.',
  helpAnswerFriend: 'Add friends via the \u201cFriends\u201d button on the home screen. Once added, they appear when creating events and logging expenses.',
  helpAnswerSettlement: 'From the event detail you can see settlements: how much each person owes and to whom. You can mark payments as done to keep track.',
  helpAnswerDefault: 'I couldn\'t find an exact answer for that. You can use the help tour (\u2753 icon in the toolbar) to explore each section, or go back to the menu and create your first event.',
  helpChooseOption: 'Choose an option by entering its number:',
  helpQ2: 'How do I create an event?',
  helpQ3: 'How do I add expenses?',
  helpQ4: 'How do I add participants?',
  helpQ5: 'How does settlement work?',
  // Advanced mode - split
  askSplitType: 'How do you want to split this expense among participants?',
  splitTypeEqual: 'Equal shares',
  splitTypePercentage: 'By percentage',
  splitTypeCustom: 'By fixed amount',
  askSplitValues: 'Enter the value for each participant:',
  splitPercentageError: '⚠️ Percentages must add up to exactly 100%. Please review the values.',
  splitAmountError: '⚠️ Amounts must add up to $\{amount\}. Please review the values.',
  sectionLabelSplitType: 'Split type',
  sectionLabelSplitValues: 'Custom split',
  summaryCustomSplitLabel: 'Split',
  // Advanced mode - multiple payers
  askPayerCount: 'Did one person or multiple people pay?',
  payerSingle: '1 person',
  payerMultiple: 'Multiple people',
  askExpensePayerAdvanced: 'Who paid? Select the payers and enter how much each paid:',
  confirmMultiPayers: '✅ Confirm payers',
  multiPayerSumError: '⚠️ The sum of payers must equal the expense amount (${amount}).',
  summaryMultiPaidBy: 'Paid by: {names}',
  // Exclude participants
  askExcludeParticipants: 'Is there any participant who is not part of this expense?',
  noExclusions: 'No, everyone participates',
  confirmExclusions: '✅ Confirm exclusions',
  sectionLabelPayerCount: '1 or multiple payers?',
  sectionLabelExclude: 'Exclude participants',
  // Summary tip
  summaryStandardTip: '💡 To add more than one payer or customize the split, edit the expense from Event Detail → Expenses. Or enable the advanced version of Splitty in your profile.',
};

const pt: ExpressTranslations = {
  screenTitle: 'Splitty',
  welcome: 'Olá! Sou o Splitty ⚡, seu assistente para criar eventos rápidos. Vamos lá!',
  askEventName: 'Qual é o nome do evento?',
  askEventDate: 'Qual é a data do evento?',
  askParticipants: 'Quem vai participar? Selecione seus amigos:',
  askParticipantsHint: '💡 Selecione da sua lista. Você pode adicionar mais por nome no próximo passo.',
  confirmParticipants: 'Participantes selecionados:',
  noFriends: 'Você ainda não tem amigos salvos. Pode adicioná-los em "Amigos" no menu principal.',
  askBulkParticipants: 'Quem vai participar? Escreva os nomes separados por vírgula:',
  askBulkParticipantsExtra: 'Quer adicionar mais participantes por nome? Escreva-os separados por vírgula:',
  bulkParticipantsHint: 'Exemplo: Ana, Carlos, Maria Lopez',
  bulkParticipantsSkip: 'Pular, sem mais participantes',
  duplicateParticipants: '⚠️ Alguns nomes já estão na lista: {names}. Corrija ou remova-os antes de continuar.',
  cancelRestart: 'Sair',
  cancelRestartConfirm: 'Tem certeza? Todo o progresso será perdido.',
  temporaryWarning: '⚠️ Você tem participantes temporários selecionados. Lembre-se de convertê-los a amigos permanentes ou adicioná-los nos detalhes do evento.',
  askHasExpenses: 'Você tem despesas para adicionar neste evento?',
  noExpensesHint: 'Sem problema, você pode adicionar despesas mais tarde nos detalhes do evento.',
  askExpenseTitle: 'Qual é o nome da despesa?',
  askExpenseAmount: 'Quanto foi o valor?',
  askExpenseDate: 'Quando foi a despesa?',
  askExpensePayer: 'Quem pagou?',
  askMoreExpenses: 'Você quer adicionar outra despesa?',
  yes: 'Sim',
  no: 'Não',
  summaryHeader: 'Aqui está o resumo:',
  summaryEvent: '🎉 Evento:',
  summaryDate: '🗓 Data:',
  summaryParticipants: '👥 Participantes:',
  summaryNoParticipants: '  – Serão adicionados nos detalhes do evento.',
  summaryExpenses: '💰 Despesas:',
  summaryNoExpenses: '  – Serão adicionadas nos detalhes do evento.',
  summaryExpenseItem: '• {title} — ${amount}',
  summaryPaidBy: 'Pago por: {name}',
  confirmCreate: 'Vamos criar o evento?',
  creating: 'Criando evento...',
  successMessage: '✅ Evento criado com sucesso!',
  goToDetail: 'Ver detalhes',
  detailHint: '💡 Outras modificações (editar participantes, dividir despesas, etc.) podem ser feitas nos detalhes do evento.',
  inputPlaceholderName: 'Nome do evento...',
  inputPlaceholderAmount: 'Valor...',
  inputPlaceholderExpenseTitle: 'Nome da despesa...',
  selectDate: 'Selecionar data',
  selectPayer: 'Selecione quem pagou',
  noParticipantsSelected: 'Selecione pelo menos um participante',
  noParticipantsSkipExpenses: 'Nenhum participante adicionado. Você pode adicionar despesas nos detalhes do evento depois de adicionar participantes.',
  invalidAmount: 'Insira um valor válido maior que 0',
  requiredField: 'Este campo é obrigatório',
  errorCreating: 'Houve um erro ao criar o evento. Tente novamente.',
  selectAll: 'Selecionar todos',
  clearAll: 'Limpar',
  expenseCount: '{count} despesa{plural}',
  sectionLabelEventName: 'Nome do evento',
  sectionLabelEventDate: 'Data do evento',
  sectionLabelParticipants: 'Participantes',
  sectionLabelBulkParticipants: 'Adicionar participantes',
  sectionLabelExpenses: 'Adicionar despesas?',
  sectionLabelExpenseTitle: 'Descrição da despesa',
  sectionLabelExpenseAmount: 'Valor da despesa',
  sectionLabelExpenseDate: 'Data da despesa',
  sectionLabelExpensePayer: 'Quem pagou?',
  sectionLabelMoreExpenses: 'Mais despesas?',
  sectionLabelSummary: 'Resumo do evento',
  langChangeNotice: 'Você mudou o idioma. As mensagens anteriores ficarão no idioma original. Quer começar novamente no novo idioma?',
  langChangeContinue: 'Continuar',
  langChangeRestart: 'Começar novamente',
  cancelCreate: 'Cancelar criação',
  goBackStep: 'Etapa anterior',
  timeoutMessage: '⏰ O chat ficou inativo por 5 minutos. Volte à tela inicial e abra o Splitty novamente para continuar.',
  askMode: 'Como posso te ajudar hoje?',
  modeExpress: 'Criar evento express',
  modeAdvanced: 'Evento Avançado',
  modeHelp: 'Tenho uma dúvida',
  // Modo ajuda
  helpWelcome: 'Claro! Pode me perguntar o que precisar sobre o SplitSmart. Farei o meu melhor 😊',
  helpInputPlaceholder: 'Digite um número (1-5)...',
  helpSectionLabel: 'Dúvida',
  helpBackToMenu: 'Voltar ao menu',
  helpSeeOptions: 'Ver opções',
  helpAnswerEvent: 'Para criar um evento, você pode usar o modo express (rápido, com o Splitty) ou o botão "+" na tela inicial (manual, com mais opções). Nos detalhes do evento você pode editá-lo, adicionar participantes e despesas.',
  helpAnswerExpense: 'As despesas podem ser adicionadas durante a criação do evento ou nos detalhes. Cada despesa tem nome, valor, data e quem pagou. A divisão entre participantes é automática.',
  helpAnswerParticipant: 'Os participantes podem ser amigos salvos ou pessoas temporárias (só com nome). Amigos são adicionados na seção \u201cAmigos\u201d do menu principal. Temporários não têm conta própria.',
  helpAnswerFriend: 'Adicione amigos pelo botão \u201cAmigos\u201d na tela inicial. Uma vez adicionados, aparecem ao criar eventos e registrar despesas.',
  helpAnswerSettlement: 'Nos detalhes do evento você pode ver as liquidações: quanto cada um deve e para quem. Você pode marcar pagamentos como realizados para controle.',
  helpAnswerDefault: 'Não encontrei uma resposta exata para isso. Você pode usar o tour de ajuda (icône \u2753 na barra) para conhecer cada seção, ou voltar ao menu e criar seu primeiro evento.',
  helpChooseOption: 'Escolha uma opção digitando seu número:',
  helpQ2: 'Como crio um evento?',
  helpQ3: 'Como adiciono despesas?',
  helpQ4: 'Como adiciono participantes?',
  helpQ5: 'Como funciona a liquidação?',
  // Modo avançado - split
  askSplitType: 'Como você quer dividir esta despesa entre os participantes?',
  splitTypeEqual: 'Partes iguais',
  splitTypePercentage: 'Por porcentagem',
  splitTypeCustom: 'Por valor fixo',
  askSplitValues: 'Insira o valor para cada participante:',
  splitPercentageError: '⚠️ As porcentagens devem somar exatamente 100%. Revise os valores.',
  splitAmountError: '⚠️ Os valores devem somar $\{amount\}. Revise os valores.',
  sectionLabelSplitType: 'Tipo de divisão',
  sectionLabelSplitValues: 'Divisão personalizada',
  summaryCustomSplitLabel: 'Divisão',
  // Modo avançado - múltiplos pagadores
  askPayerCount: 'Uma pessoa pagou ou várias?',
  payerSingle: '1 pessoa',
  payerMultiple: 'Várias pessoas',
  askExpensePayerAdvanced: 'Quem pagou? Selecione os pagadores e indique quanto cada um pagou:',
  confirmMultiPayers: '✅ Confirmar pagadores',
  multiPayerSumError: '⚠️ A soma dos pagadores deve ser igual ao valor da despesa (${amount}).',
  summaryMultiPaidBy: 'Pago por: {names}',
  // Excluir participantes
  askExcludeParticipants: 'Há algum participante que não participa desta despesa?',
  noExclusions: 'Não, todos participam',
  confirmExclusions: '✅ Confirmar exclusões',
  sectionLabelPayerCount: '1 ou vários pagadores?',
  sectionLabelExclude: 'Excluir participantes',
  // Dica no resumo
  summaryStandardTip: '💡 Para adicionar mais de um pagador ou dividir a despesa de forma personalizada, edite a despesa em Detalhes do evento → Despesas. Ou ative a versão avançada do Splitty no seu perfil.',
};

export const expressLanguage: Record<ExpressLanguage, ExpressTranslations> = { es, en, pt };
