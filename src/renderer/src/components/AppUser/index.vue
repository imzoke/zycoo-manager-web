<template>
  <div class="app-user" :style="{ 'justify-content': collapsed ? 'center' : 'space-between' }">
    <div v-if="!collapsed" class="user-info">
      <img src="/public/images/default-avatar.png" class="avatar" />
      <div class="content">
        <div class="username">
          <n-text>{{ username }}</n-text>
          <n-tag
            :type="role.code === 'role_super_admin' ? 'error' : 'primary'"
            size="small"
            style="margin-left: 5px"
          >
            {{ t(role.name, role.name) }}
          </n-tag>
        </div>
        <div class="email">
          <n-text depth="3">{{ email }}</n-text>
        </div>
      </div>
    </div>
    <n-dropdown trigger="hover" :options="options" @select="handleSelect">
      <n-button text>
        <template #icon>
          <n-icon size="24">
            <Dots />
          </n-icon>
        </template>
      </n-button>
    </n-dropdown>
  </div>
</template>

<script lang="ts" setup>
import { Dots, Logout, ShieldLock } from '@vicons/tabler';
import { computed, h } from 'vue';

import { useUserStore } from '@/store/modules/user';
import { renderIcon } from '@/utils';
import { NTag, NText } from 'naive-ui';
import { useI18n } from '@/hooks/web/useI18n';

const { t } = useI18n();

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
});

const userStore = useUserStore();

const { username, email, roles } = userStore.getUserInfo;

const role = computed(() => {
  return roles?.[0];
});

const userItem = computed(() => {
  return h('div', { class: ['user-info', 'p-5'] }, [
    h('img', { src: '/public/images/default-avatar.png', class: 'avatar' }),
    h('div', { class: 'content' }, [
      h('div', { class: 'username' }, [
        username,
        h(
          NTag,
          {
            type: role.value.code === 'role_super_admin' ? 'error' : 'primary',
            size: 'small',
            style: 'margin-left: 5px'
          },
          t(role.value.name, role.value.name)
        )
      ]),
      h('div', { class: 'email' }, h(NText, { depth: '3' }, email))
    ])
  ]);
});

const options = computed(() => {
  const opt = [
    {
      label: t('global.txt.changePassword'),
      key: 'change_password',
      icon: renderIcon(ShieldLock)
    },
    {
      label: t('global.txt.logout'),
      key: 'logout',
      icon: renderIcon(Logout)
    }
  ];
  return props.collapsed
    ? [
        {
          key: 'header',
          type: 'render',
          render: () => userItem.value
        },
        ...opt
      ]
    : opt;
});

const handleSelect = (key: string | number) => {
  switch (key) {
    case 'change_password':
      break;
    case 'logout':
      userStore.logout();
      break;
  }
};
</script>

<style lang="less">
.app-user {
  display: flex;
  align-items: center;
  width: 100%;
  overflow: hidden;
}

.user-info {
  display: flex;

  &.p-5 {
    padding: 10px;
  }

  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
  }

  .content {
    display: flex;
    flex-direction: column;
    margin: 0 10px;
  }

  .username {
    font-size: 1rem;
    font-weight: 600;
    line-height: 20px;
    color: #0d0d0d;
  }

  .email {
    font-size: 0.75rem;
    line-height: 14px;
  }
}
</style>
