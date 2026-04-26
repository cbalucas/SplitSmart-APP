export interface ManageFriendsLanguage {
  screen: {
    title: string;
    searchPlaceholder: string;
  };
  tabs: {
    list: string;
    new: string;
  };
  form: {
    addTitle: string;
    editTitle: string;
    nameLabel: string;
    namePlaceholder: string;
    cbuLabel: string;
    cbuPlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    optional: string;
    required: string;
    visibilityPublic: string;
    visibilityPrivate: string;
    visibilityPublicDesc: string;
    visibilityPrivateDesc: string;
  };
  filter: {
    all: string;
    own: string;
    public: string;
    private: string;
  };
  nameValidation: {
    tooShort: string;
    checking: string;
    available: string;
    duplicate: string;
  };
  buttons: {
    add: string;
    edit: string;
    save: string;
    cancel: string;
    delete: string;
    close: string;
  };
  empty: {
    title: string;
    subtitle: string;
    button: string;
  };
  alerts: {
    delete: {
      title: string;
      message: string;
      cancel: string;
      confirm: string;
    };
    success: {
      added: string;
      updated: string;
      deleted: string;
    };
    error: {
      general: string;
      nameRequired: string;
      duplicateName: string;
      cantDelete: string;
      inUse: string;
      deleteFailed: string;
      saveFailed: string;
      phoneInvalid: string;
      emailInvalid: string;
    };
  };
}

export const manageFriendsLanguage: Record<string, ManageFriendsLanguage> = {
  es: {
    nameValidation: {
      tooShort: 'El nombre debe tener al menos 2 caracteres',
      checking: 'Verificando...',
      available: '✓ Nombre disponible',
      duplicate: 'Ya existe un amigo con ese nombre',
    },
    screen: {
      title: 'Gestionar Amigos',
      searchPlaceholder: 'Buscar amigos...',
    },
    tabs: {
      list: 'Lista',
      new: 'Nuevo',
    },
    form: {
      addTitle: 'Agregar Amigo',
      editTitle: 'Editar Amigo',
      nameLabel: 'Nombre',
      namePlaceholder: 'Ingresa el nombre',
      cbuLabel: 'CBU/Alias',
      cbuPlaceholder: 'CBU o alias bancario',
      phoneLabel: 'Teléfono',
      phonePlaceholder: '+54 9 11 1234-5678',
      emailLabel: 'Email',
      emailPlaceholder: 'correo@ejemplo.com',
      optional: '(opcional)',
      required: '*',
      visibilityPublic: 'Público',
      visibilityPrivate: 'Privado',
      visibilityPublicDesc: 'Visible para todos los usuarios',
      visibilityPrivateDesc: 'Solo visible para vos',
    },
    filter: {
      all: 'Todos',
      own: 'Propios',
      public: 'Públicos',
      private: 'Privados',
    },
    buttons: {
      add: 'Agregar',
      edit: 'Editar',
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      close: 'Cerrar',
    },
    empty: {
      title: 'No tienes amigos agregados',
      subtitle: 'Agrega amigos para poder incluirlos rápidamente en tus eventos',
      button: 'Agregar Primer Amigo',
    },
    alerts: {
      delete: {
        title: 'Eliminar Amigo',
        message: '¿Estás seguro de que quieres eliminar a {name} de tu lista de amigos?',
        cancel: 'Cancelar',
        confirm: 'Eliminar',
      },
      success: {
        added: '✅ Agregado - Amigo agregado correctamente',
        updated: '✅ Actualizado - Amigo actualizado correctamente',
        deleted: '✅ Eliminado - {name} fue eliminado correctamente',
      },
      error: {
        general: 'Error',
        nameRequired: 'El nombre es obligatorio',
        duplicateName: 'Ya existe un amigo con ese nombre',
        cantDelete: 'No se puede eliminar',
        inUse: '{name} está siendo usado en eventos activos. Para eliminarlo, primero debes quitarlo de todos los eventos.',
        deleteFailed: 'No se pudo eliminar el amigo',
        saveFailed: 'No se pudo guardar el amigo',
        phoneInvalid: 'Formato de teléfono inválido. Solo se permite + al inicio, seguido de números, espacios, guiones y paréntesis',
        emailInvalid: 'Formato de email inválido. Debe contener @ y un dominio válido',
      },
    },
  },
  en: {
    nameValidation: {
      tooShort: 'Name must be at least 2 characters',
      checking: 'Checking...',
      available: '✓ Name available',
      duplicate: 'A friend with that name already exists',
    },
    screen: {
      title: 'Manage Friends',
      searchPlaceholder: 'Search friends...',
    },
    tabs: {
      list: 'List',
      new: 'New',
    },
    form: {
      addTitle: 'Add Friend',
      editTitle: 'Edit Friend',
      nameLabel: 'Name',
      namePlaceholder: 'Enter name',
      cbuLabel: 'CBU/Alias',
      cbuPlaceholder: 'Bank CBU or alias',
      phoneLabel: 'Phone',
      phonePlaceholder: '+1 555 123-4567',
      emailLabel: 'Email',
      emailPlaceholder: 'email@example.com',
      optional: '(optional)',
      required: '*',
      visibilityPublic: 'Public',
      visibilityPrivate: 'Private',
      visibilityPublicDesc: 'Visible to all users',
      visibilityPrivateDesc: 'Only visible to you',
    },
    filter: {
      all: 'All',
      own: 'Own',
      public: 'Public',
      private: 'Private',
    },
    buttons: {
      add: 'Add',
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      close: 'Close',
    },
    empty: {
      title: 'No friends added yet',
      subtitle: 'Add friends to quickly include them in your events',
      button: 'Add First Friend',
    },
    alerts: {
      delete: {
        title: 'Delete Friend',
        message: 'Are you sure you want to delete {name} from your friends list?',
        cancel: 'Cancel',
        confirm: 'Delete',
      },
      success: {
        added: '✅ Added - Friend added successfully',
        updated: '✅ Updated - Friend updated successfully',
        deleted: '✅ Deleted - {name} was deleted successfully',
      },
      error: {
        general: 'Error',
        nameRequired: 'Name is required',
        duplicateName: 'A friend with that name already exists',
        cantDelete: 'Cannot delete',
        inUse: '{name} is being used in active events. To delete it, first remove it from all events.',
        deleteFailed: 'Could not delete friend',
        saveFailed: 'Could not save friend',
        phoneInvalid: 'Invalid phone format. Only + at the start, followed by numbers, spaces, hyphens and parentheses is allowed',
        emailInvalid: 'Invalid email format. It must contain @ and a valid domain',
      },
    },
  },
  pt: {
    nameValidation: {
      tooShort: 'O nome deve ter pelo menos 2 caracteres',
      checking: 'Verificando...',
      available: '✓ Nome disponível',
      duplicate: 'Já existe um amigo com esse nome',
    },
    screen: {
      title: 'Gerenciar Amigos',
      searchPlaceholder: 'Buscar amigos...',
    },
    tabs: {
      list: 'Lista',
      new: 'Novo',
    },
    form: {
      addTitle: 'Adicionar Amigo',
      editTitle: 'Editar Amigo',
      nameLabel: 'Nome',
      namePlaceholder: 'Digite o nome',
      cbuLabel: 'PIX/Chave',
      cbuPlaceholder: 'Chave PIX',
      phoneLabel: 'Telefone',
      phonePlaceholder: '+55 11 91234-5678',
      emailLabel: 'Email',
      emailPlaceholder: 'email@exemplo.com',
      optional: '(opcional)',
      required: '*',
      visibilityPublic: 'Público',
      visibilityPrivate: 'Privado',
      visibilityPublicDesc: 'Visível para todos os usuários',
      visibilityPrivateDesc: 'Visível apenas para você',
    },
    filter: {
      all: 'Todos',
      own: 'Próprios',
      public: 'Públicos',
      private: 'Privados',
    },
    buttons: {
      add: 'Adicionar',
      edit: 'Editar',
      save: 'Salvar',
      cancel: 'Cancelar',
      delete: 'Excluir',
      close: 'Fechar',
    },
    empty: {
      title: 'Nenhum amigo adicionado',
      subtitle: 'Adicione amigos para incluí-los rapidamente em seus eventos',
      button: 'Adicionar Primeiro Amigo',
    },
    alerts: {
      delete: {
        title: 'Excluir Amigo',
        message: 'Tem certeza de que deseja excluir {name} da sua lista de amigos?',
        cancel: 'Cancelar',
        confirm: 'Excluir',
      },
      success: {
        added: '✅ Adicionado - Amigo adicionado com sucesso',
        updated: '✅ Atualizado - Amigo atualizado com sucesso',
        deleted: '✅ Excluído - {name} foi excluído com sucesso',
      },
      error: {
        general: 'Erro',
        nameRequired: 'O nome é obrigatório',
        duplicateName: 'Já existe um amigo com esse nome',
        cantDelete: 'Não é possível excluir',
        inUse: '{name} está sendo usado em eventos ativos. Para excluí-lo, primeiro remova-o de todos os eventos.',
        deleteFailed: 'Não foi possível excluir o amigo',
        saveFailed: 'Não foi possível salvar o amigo',
        phoneInvalid: 'Formato de telefone inválido. Apenas + no início, seguido de números, espaços, hífens e parênteses é permitido',
        emailInvalid: 'Formato de e-mail inválido. Deve conter @ e um domínio válido',
      },
    },
  },
};