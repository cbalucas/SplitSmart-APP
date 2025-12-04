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
      cantDelete: string;
      inUse: string;
    };
  };
}

export const manageFriendsLanguage: Record<string, ManageFriendsLanguage> = {
  es: {
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
        cantDelete: 'No se puede eliminar',
        inUse: '{name} está siendo usado en eventos activos. Para eliminarlo, primero debes quitarlo de todos los eventos.',
      },
    },
  },
  en: {
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
        cantDelete: 'Cannot delete',
        inUse: '{name} is being used in active events. To delete it, first remove it from all events.',
      },
    },
  },
  pt: {
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
        cantDelete: 'Não é possível excluir',
        inUse: '{name} está sendo usado em eventos ativos. Para excluí-lo, primeiro remova-o de todos os eventos.',
      },
    },
  },
};