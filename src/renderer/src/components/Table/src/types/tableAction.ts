import { NButton } from 'naive-ui';

export interface ActionItem extends Partial<InstanceType<typeof NButton>> {
  onClick?: Fn;
  label?: string;
  icon?: string;
  popConfirm?: PopConfirm;
  disabled?: boolean;
  divider?: boolean;
}

export interface PopConfirm {
  title: string;
  okText?: string;
  cancelText?: string;
  confirm: Fn;
  cancel?: Fn;
  icon?: string;
}
