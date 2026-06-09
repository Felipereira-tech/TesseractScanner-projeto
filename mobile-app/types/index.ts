export type AlertButton = {
  text: string;
  onPress?: () => void | Promise<void>;
  style?: 'cancel' | 'destructive' | 'default';
};

export type ModalState = {
  visible: boolean;
  data: any | null;
};
