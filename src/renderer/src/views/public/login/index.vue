<template>
  <div class="login-page">
    <div class="login-panel">
      <h1>{{ t('views.login.title') }}</h1>
      <n-form ref="formRef" :model="formValue" :rules="rules" @keypress.enter="handleSubmit">
        <n-form-item :label="t('views.login.form.email')" path="email">
          <n-input v-model:value="formValue.email" clearable>
            <template #prefix>
              <n-icon :component="User" />
            </template>
          </n-input>
        </n-form-item>
        <n-form-item :label="t('views.login.form.password')" path="password">
          <n-input v-model:value="formValue.password" type="password" show-password-on="mousedown">
            <template #prefix>
              <n-icon :component="Lock" />
            </template>
          </n-input>
        </n-form-item>
        <n-button
          class="btn-submit"
          type="primary"
          :loading="loading"
          block
          strong
          @click="handleSubmit"
        >
          {{ t('global.txt.submit') }}
        </n-button>
      </n-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@/hooks/web/useI18n';
import { useUserStore } from '@/store/modules/user';
import { Lock, User } from '@vicons/tabler';
import { FormInst } from 'naive-ui';
import { ref, unref } from 'vue';

const { t } = useI18n();

const loading = ref(false);
const formRef = ref<FormInst | null>(null);
const formValue = ref({ email: '', password: '' });

const userStore = useUserStore();

const rules = {
  email: [
    { required: true, message: t('views.login.rules.email.required'), trigger: 'blur' },
    { type: 'email', message: t('views.login.rules.email.format'), trigger: 'blur' }
  ],
  password: { required: true, message: t('views.login.rules.password.required'), trigger: 'blur' }
};

const handleSubmit = (e) => {
  e.preventDefault();
  formRef.value?.validate(async (errors) => {
    window.$message.destroyAll();
    if (!errors) {
      loading.value = true;
      const { email, password } = unref(formValue);
      try {
        const userInfo = await userStore.login({ email: email, password: password });

        if (userInfo) {
          window.$notification.success({
            content: 'Success',
            meta: `Welcome: ${userInfo.username}`,
            duration: 3000
          });
        } else {
          window.$message.error('Failed');
        }
      } catch (error) {
        console.error(error);
      } finally {
        loading.value = false;
      }
    } else {
      console.log(errors);
    }
  });
};
</script>

<style lang="less" scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;

  .login-panel {
    padding: 20px;
    min-width: 360px;

    h1 {
      margin-top: 0;
      margin-bottom: 20px;
    }

    .btn-submit {
      margin-top: 10px;
    }
  }
}
</style>
