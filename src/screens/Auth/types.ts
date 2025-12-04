export interface LoginFormData {
  credential: string;
  password: string;
}

export interface LoginFormErrors {
  credential?: string;
  password?: string;
  general?: string;
}

export interface LoginScreenProps {
  // Propiedades adicionales si se necesitan en el futuro
}