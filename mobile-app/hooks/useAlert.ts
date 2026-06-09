import { useCallback } from 'react';
import { Alert } from 'react-native';
import type { AlertButton } from '@/types';

export const useAlert = () => {
  const show = useCallback((title: string, message: string, buttons?: AlertButton[]) => {
    Alert.alert(title, message, buttons);
  }, []);

  const confirm = useCallback((title: string, message: string, onConfirm: () => void | Promise<void>, onCancel?: () => void) => {
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel', onPress: onCancel },
      { text: 'Confirmar', style: 'destructive', onPress: onConfirm },
    ]);
  }, []);

  const error = useCallback((message: string, onDismiss?: () => void) => {
    Alert.alert('Erro', message, [{ text: 'OK', onPress: onDismiss }]);
  }, []);

  const success = useCallback((message: string, onDismiss?: () => void) => {
    Alert.alert('Sucesso', message, [{ text: 'OK', onPress: onDismiss }]);
  }, []);

  return { show, confirm, error, success };
};
