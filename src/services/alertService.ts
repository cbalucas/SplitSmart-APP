export type AlertType = 'error' | 'success' | 'warning' | 'confirm' | 'info' | 'destructive';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
  icon?: string;
}

export interface AlertOptions {
  type?: AlertType;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  /** Cuando es true muestra un spinner en lugar de botones (no se puede cerrar manualmente) */
  isLoading?: boolean;
}

type ShowAlertFn = (options: AlertOptions) => void;
type DismissAlertFn = () => void;

let _showAlert: ShowAlertFn | null = null;
let _dismissAlert: DismissAlertFn | null = null;

export const registerAlertHandler = (fn: ShowAlertFn): void => {
  _showAlert = fn;
};

export const registerDismissHandler = (fn: DismissAlertFn): void => {
  _dismissAlert = fn;
};

export const showAlert = (options: AlertOptions): void => {
  _showAlert?.(options);
};

export const dismissAlert = (): void => {
  _dismissAlert?.();
};
