import { Alert } from 'react-native';

export const showAlert = (
  title: string,
  message: string,
  buttons: { text: string; onPress?: () => void; style?: 'cancel' | 'destructive' | 'default' }[] = [{ text: 'OK' }]
) => {
  Alert.alert(title, message, buttons);
};

export const showConfirmAlert = (
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  onCancel?: () => void
) => {
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel', onPress: onCancel },
    { text: 'Confirmar', style: 'destructive', onPress: onConfirm },
  ]);
};

export const validateNotEmpty = (value: string, fieldName: string): boolean => {
  if (!value.trim()) {
    showAlert('Campo obrigatório', `Informe ${fieldName} antes de continuar.`);
    return false;
  }
  return true;
};

export const validateNumber = (value: number, min: number, max: number, fieldName: string): boolean => {
  if (value < min || value > max) {
    showAlert('Valor inválido', `${fieldName} deve estar entre ${min} e ${max}.`);
    return false;
  }
  return true;
};

export const validateArray = (arr: any[], fieldName: string): boolean => {
  if (!arr || arr.length === 0) {
    showAlert('Seleção obrigatória', `Selecione pelo menos um(a) ${fieldName}.`);
    return false;
  }
  return true;
};

export const formatError = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.mensagem) return error.response.data.mensagem;
  if (error?.message) return error.message;
  return 'Algo deu errado. Tente novamente.';
};
