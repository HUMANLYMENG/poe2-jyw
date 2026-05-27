<template>
  <div class="poe2te-panel" :class="{ collapsed }">
    <!-- Toggle button -->
    <button class="toggle-btn" @click="collapsed = !collapsed" :title="collapsed ? '展开' : '收起'">
      {{ collapsed ? '◀' : '✕' }}
    </button>

    <div v-if="!collapsed" class="panel-body">
      <!-- Header -->
      <div class="panel-header">
        <span class="panel-title">⚡ PoE2 Trade</span>
        <span class="panel-version">v0.1</span>
      </div>

      <!-- Tabs -->
      <div class="tab-nav">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <AiSearch v-if="activeTab === 'search'" :league="currentLeague" />
        <SettingsPanel v-else-if="activeTab === 'settings'" />
      </div>

      <!-- Footer links -->
      <div class="panel-footer">
        <a href="https://poe2db.tw/tw/" target="_blank" class="footer-link">📖 编年史</a>
        <a href="https://poe.ninja/poe2/builds" target="_blank" class="footer-link">📊 Ninja</a>
        <a href="https://mobalytics.gg/poe-2/builds" target="_blank" class="footer-link">⚔️ Mobalytics</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue"
import AiSearch from "./AiSearch.vue"
import SettingsPanel from "./SettingsPanel.vue"

const collapsed = ref(false)
const activeTab = ref("search")

// Push page content left when panel expands (panel is on right)
watch(collapsed, (val) => {
  document.body.style.marginRight = val ? "32px" : "300px"
  document.body.style.transition = "margin-right 0.2s"
}, { immediate: true })

const tabs = [
  { id: "search", label: "🔍 AI搜索" },
  { id: "settings", label: "⚙️ 设置" },
]

// Detect current league from URL
const currentLeague = computed(() => {
  const path = window.location.pathname
  // Match only the league path, not any existing search ID
  const match = path.match(/\/trade2\/search\/(poe2\/\w+)/)
  return match ? match[1] : "poe2/Standard"
})
</script>

<style scoped>
.poe2te-panel {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  z-index: 99999;
  display: flex;
  flex-direction: row;
}

.poe2te-panel.collapsed {
  width: 32px;
}

.poe2te-panel:not(.collapsed) {
  width: 300px;
}

.toggle-btn {
  position: absolute;
  left: -28px;
  top: 12px;
  width: 28px;
  height: 48px;
  background: #1a1a2e;
  color: #8ab;
  border: 1px solid #2a2a4e;
  border-right: none;
  border-radius: 6px 0 0 6px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.toggle-btn:hover {
  background: #2a2a4e;
  color: #aaf;
}

.panel-body {
  width: 100%;
  height: 100%;
  background: #12121f;
  border-left: 1px solid #2a2a4e;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: #ccc;
}

.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid #2a2a4e;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.panel-title {
  font-size: 16px;
  font-weight: 700;
  color: #e0e0ff;
}

.panel-version {
  font-size: 11px;
  color: #555;
}

.tab-nav {
  display: flex;
  border-bottom: 1px solid #2a2a4e;
  flex-shrink: 0;
}

.tab-btn {
  flex: 1;
  padding: 8px 4px;
  background: none;
  border: none;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #99a;
}

.tab-btn.active {
  color: #aaf;
  border-bottom-color: #aaf;
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.placeholder {
  padding: 32px 16px;
  text-align: center;
  color: #555;
  font-size: 13px;
}

.panel-footer {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid #1a1a3e;
  background: #0a0a1a;
}

.footer-link {
  color: #889;
  font-size: 11px;
  text-decoration: none;
  padding: 3px 8px;
  border-radius: 4px;
  transition: all 0.15s;
}

.footer-link:hover {
  color: #eef;
  background: #2a2a5e;
}
</style>