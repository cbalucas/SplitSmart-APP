export type AlertType = 'error' | 'success' | 'warning' | 'confirm' | 'info' | 'destructive';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface AlertOptions {
  type?: AlertType;
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

type ShowAlertFn = (options: AlertOptions) => void;

let _showAlert: ShowAlertFn | null = null;

export const registerAlertHandler = (fn: ShowAlertFn): void => {
  _showAlert = fn;
};

export const showAlert = (options: AlertOptions): void => {
  _showAlert?.(options);
};
