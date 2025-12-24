<template>
  <div class="general-dashboard-page">
    <header>
      <h1>{{ t('views.general.dashboard.title') }}</h1>
      <n-button secondary @click="refresh">
        <template #icon>
          <n-icon v-if="loading"><Refresh class="refresh-spin" /></n-icon>
          <n-icon v-else><Refresh /></n-icon>
        </template>
        {{ t('global.txt.reload', 'Refresh') }}
      </n-button>
    </header>

    <n-grid :x-gap="12" :y-gap="12" :cols="4">
      <n-grid-item :span="4">
        <n-card :title="t('global.txt.systemInfo', 'System Info')">
          <n-descriptions bordered label-placement="left">
            <n-descriptions-item :label="t('global.txt.os', 'OS')">
              {{ systemInfo?.host.os }}
            </n-descriptions-item>
            <n-descriptions-item :label="t('global.txt.platform', 'Platform')">
              {{ systemInfo?.host.platform }}
            </n-descriptions-item>
            <n-descriptions-item :label="t('global.txt.uptime', 'Uptime')">
              {{ formatUptime(systemInfo?.host.uptime || 0) }}
            </n-descriptions-item>
          </n-descriptions>
        </n-card>
      </n-grid-item>

      <n-grid-item>
        <n-card :title="t('global.txt.cpu', 'CPU')">
          <div class="monitor-card">
            <n-progress
              type="dashboard"
              gap-position="bottom"
              :percentage="ensureNumber(systemInfo?.cpu.usage)"
              :color="getColor(systemInfo?.cpu.usage)"
            />
            <div class="details">
              <div class="label">{{ systemInfo?.cpu.model }}</div>
              <div class="sub-label">{{ systemInfo?.cpu.cores }} {{ t('global.txt.cores') }}</div>
            </div>
          </div>
        </n-card>
      </n-grid-item>

      <n-grid-item>
        <n-card :title="t('global.txt.memory', 'Memory')">
          <div class="monitor-card">
            <n-progress
              type="dashboard"
              gap-position="bottom"
              :percentage="ensureNumber(systemInfo?.memory.usage)"
              :color="getColor(systemInfo?.memory.usage)"
            />
            <div class="details">
              <div class="label">
                {{ formatBytes(systemInfo?.memory.used || 0) }} /
                {{ formatBytes(systemInfo?.memory.total || 0) }}
              </div>
            </div>
          </div>
        </n-card>
      </n-grid-item>

      <n-grid-item>
        <n-card :title="t('global.txt.disk', 'Disk')">
          <div class="monitor-card">
            <n-progress
              type="dashboard"
              gap-position="bottom"
              :percentage="ensureNumber(systemInfo?.disk.usage)"
              :color="getColor(systemInfo?.disk.usage)"
            />
            <div class="details">
              <div class="label">
                {{ formatBytes(systemInfo?.disk.used || 0) }} /
                {{ formatBytes(systemInfo?.disk.total || 0) }}
              </div>
            </div>
          </div>
        </n-card>
      </n-grid-item>

      <n-grid-item>
        <n-card :title="t('global.txt.network', 'Network')">
          <div class="monitor-card">
            <div class="network-stats">
              <div class="stat-item">
                <div class="label">{{ t('global.txt.sent') }}</div>
                <div class="value">{{ formatBytes(systemInfo?.network.bytes_sent || 0) }}</div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-item">
                <div class="label">{{ t('global.txt.recv') }}</div>
                <div class="value">{{ formatBytes(systemInfo?.network.bytes_recv || 0) }}</div>
              </div>
            </div>
          </div>
        </n-card>
      </n-grid-item>
    </n-grid>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from '@/hooks/web/useI18n';
import { Refresh } from '@vicons/tabler';
import { getSystemInfo, SystemInfo } from '@/api/system';

const { t } = useI18n();

const systemInfo = ref<SystemInfo | null>(null);
const loading = ref(false);
let timer: ReturnType<typeof setInterval> | null = null;

const fetchInfo = async () => {
  loading.value = true;
  try {
    const res = await getSystemInfo();
    systemInfo.value = res;
  } finally {
    loading.value = false;
  }
};

const refresh = () => {
  fetchInfo();
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatUptime = (seconds: number): string => {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);

  return parts.join(' ');
};

const ensureNumber = (val: number | undefined): number => {
  return val ? parseFloat(val.toFixed(2)) : 0;
};

const getColor = (percentage: number | undefined) => {
  if (!percentage) return undefined;
  if (percentage < 60) return '#18a058';
  if (percentage < 85) return '#f0a020';
  return '#d03050';
};

onMounted(() => {
  fetchInfo();
  timer = setInterval(fetchInfo, 5000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<style lang="less" scoped>
.general-dashboard-page {
  padding: 20px;

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h1 {
      margin: 0;
    }
  }

  .monitor-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px 0;

    .details {
      margin-top: 16px;
      text-align: center;

      .label {
        font-weight: 500;
        font-size: 16px;
      }
      .sub-label {
        color: #999;
        font-size: 12px;
      }
    }

    .network-stats {
      width: 100%;
      text-align: center;

      .stat-item {
        margin: 10px 0;

        .label {
          color: #999;
          font-size: 12px;
          margin-bottom: 4px;
        }
        .value {
          font-weight: 600;
          font-size: 18px;
        }
      }

      .stat-divider {
        border-bottom: 1px dashed #eee;
        margin: 10px 20px;
      }
    }
  }

  .refresh-spin {
    animation: rotate 1s linear infinite;
  }

  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
}
</style>
