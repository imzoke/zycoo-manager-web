/**
 * Global authority directive
 * Used for fine-grained control of component permissions
 * @Example v-permission="['system:user:add']"
 */
import type { App, Directive, DirectiveBinding } from 'vue';
import { useUserStore } from '@/store/modules/user';

function isAuth(el: Element, binding: any) {
  const userStore = useUserStore();
  const { value } = binding;

  if (value && value instanceof Array && value.length > 0) {
    const permissions = userStore.getPermissions;
    const requiredPermissions = value;

    const hasPermission = permissions.some((perm) => {
      // Handle wildcard permission (e.g., 'system:user:*') or exact match
      return requiredPermissions.includes(perm) || perm === '*:*:*';
    });

    if (!hasPermission) {
      el.parentNode && el.parentNode.removeChild(el);
    }
  } else {
    throw new Error(`need roles! Like v-permission="['system:user:add','system:user:edit']"`);
  }
}

const permission: Directive = {
  mounted(el: Element, binding: DirectiveBinding<any>) {
    isAuth(el, binding);
  },
  updated(el: Element, binding: DirectiveBinding<any>) {
    isAuth(el, binding);
  }
};

export function setupPermissionDirective(app: App) {
  app.directive('permission', permission);
}

export default permission;
