export interface EventFormData {
  name: string;
  description: string;
  startDate: Date | null;
  location: string;
  currency: 'ARS' | 'USD' | 'EUR' | 'BRL';
  eventType: 'public' | 'private';
  category: 'viaje' | 'casa' | 'cena' | 'trabajo' | 'evento' | 'otro';
}

export interface EventFormErrors {
  name?: string;
  startDate?: string;
  description?: string;
}

export interface CreateEventProps {
  // Props adicionales si las necesitamos
}

export interface RouteParams {
  mode?: 'create' | 'edit';
  eventId?: string;
}
