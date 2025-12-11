export interface UserProfileData {
  name: string;
  username?: string; // Nuevo campo opcional
  email: string;
  phone: string;
  // alias_cbu: string; // ELIMINADO
  preferredCurrency: 'ARS' | 'USD' | 'EUR' | 'BRL';
  autoLogout: 'never' | '5min' | '15min' | '30min';
  notifications: {
    paymentReceived: boolean; // Solo notificaciones de pagos recibidos via WhatsApp
  };
  privacy: {
    // shareEmail: boolean; // ELIMINADO
    // sharePhone: boolean; // ELIMINADO
    shareEvent: boolean; // NUEVO: Compartir Evento
    allowInvitations: boolean;
  };
}

export interface ProfileSectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  onPress?: () => void;
}

export interface SettingItemProps {
  title: string;
  subtitle?: string;
  icon: string;
  value?: string | boolean;
  type: 'navigation' | 'switch' | 'value';
  onPress?: () => void;
  onValueChange?: (value: boolean) => void;
}

export interface ProfileStats {
  totalEvents: number;
  activeEvents: number;
  completedEvents: number;
  archivedEvents: number;
  friendsCount: number;
}

export type CurrencyType = 'ARS' | 'USD' | 'EUR' | 'BRL';
export type NotificationKey = 'paymentReceived'; // Solo pagos recibidos via WhatsApp
export type PrivacyKey = 'shareEvent' | 'allowInvitations'; // Eliminados 'shareEmail', 'sharePhone'

// Nueva interfaz para datos de importación
export interface ImportDataComparison {
  current: {
    events: number;
    expenses: number;
    participants: number;
  };
  incoming: {
    events: number;
    expenses: number;
    participants: number;
  };
}

// Nueva interfaz para versiones de la app
export interface AppVersion {
  version: string;
  date: string;
  changes: {
    bugs: string[];
    improvements: string[];
    new: string[];
  };
}