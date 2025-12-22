<template>
  <div class="app-user">
    <div class="user-info">
      <img src="~@/assets/images/default-avatar.png" class="avatar" />
      <div class="content">
        <div class="username">{{ username }}</div>
        <div class="email">
          <n-text depth="3">{{ email }}</n-text>
        </div>
      </div>
    </div>
    <n-dropdown trigger="hover" :show-arrow="true" :options="options" @select="handleSelect">
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
import { Dots } from '@vicons/tabler';

import { useUserStore } from '@/store/modules/user';

const userStore = useUserStore();

const { username, email } = userStore.getUserInfo;

const options = [
  {
    label: 'Change Password',
    key: 'change_password'
  },
  {
    label: 'Logout',
    key: 'logout'
  }
];

const handleSelect = (key: string | number) => {
  console.log(key);
  switch (key) {
    case 'change_password':
      break;
    case 'logout':
      userStore.logout();
      break;
  }
};
</script>

<style lang="less" scoped>
.app-user {
  display: flex;
  justify-content: space-between;
}

.user-info {
  display: flex;

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
