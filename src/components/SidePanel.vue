<template>
  <div class="poe2te-panel" :class="{ collapsed }">
    <!-- Toggle — compact floating icon -->
    <button
      class="toggle-btn"
      @click="collapsed = !collapsed"
      :title="collapsed ? '展开面板' : '收起面板'"
    >
      <svg class="toggle-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <template v-if="collapsed">
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="8" y1="18" x2="16" y2="18" />
        </template>
        <template v-else>
          <line x1="18" y1="6" x2="6" y2="6" />
          <line x1="18" y1="12" x2="6" y2="12" />
          <line x1="18" y1="18" x2="6" y2="18" />
        </template>
      </svg>
    </button>

    <div v-if="!collapsed" class="panel-body">
      <!-- Header -->
      <div class="panel-header">
        <span class="panel-title">PoE2 Trade</span>
        <div class="header-right">
          <button class="help-btn" @click="showHelp = !showHelp" title="搜索关键词帮助">?</button>
          <span class="panel-version">v0.1</span>
        </div>
      </div>

      <!-- Help Popover -->
      <div v-if="showHelp" class="help-popover">
        <div class="help-title">搜索词缀类型</div>
        <table class="help-table">
          <thead>
            <tr>
              <th>词缀类型</th>
              <th>你可以这样说</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="ht-type">普通词缀</td>
              <td>词缀 · 词条 · T1~T9</td>
            </tr>
            <tr>
              <td class="ht-type">基底</td>
              <td>基底 · 底子 · 自带</td>
            </tr>
            <tr>
              <td class="ht-type">附魔</td>
              <td>附魔 · 附魔词</td>
            </tr>
            <tr>
              <td class="ht-type">固定/破裂</td>
              <td>固定 · 固定住 · 破裂 · 裂痕</td>
            </tr>
            <tr>
              <td class="ht-type">亵渎</td>
              <td>亵渎 · 亵渎词 · desecrated</td>
            </tr>
            <tr>
              <td class="ht-type">模糊搜索</td>
              <td>模糊 · 任意 · 任意来源 · 不限定</td>
            </tr>
          </tbody>
        </table>
        <div class="help-subtitle">装备属性（自动走装备过滤）</div>
        <table class="help-table">
          <thead>
            <tr>
              <th>属性</th>
              <th>适用</th>
            </tr>
          </thead>
          <tbody>
            <tr><td class="ht-type">护甲/闪避/护盾</td><td>胸甲 头盔 手套 鞋子</td></tr>
            <tr><td class="ht-type">伤害/秒伤</td><td>所有武器</td></tr>
            <tr><td class="ht-type">攻速/武器速度</td><td>所有武器</td></tr>
            <tr><td class="ht-type">暴击率</td><td>所有武器</td></tr>
            <tr><td class="ht-type">装填时间</td><td>弩</td></tr>
            <tr><td class="ht-type">格挡率</td><td>盾牌</td></tr>
            <tr><td class="ht-type">精魂</td><td>所有装备</td></tr>
          </tbody>
        </table>
        <div class="help-examples">
          <div class="help-subtitle">例子</div>
          <div class="help-ex">"弓 伤害大于200 暴击率大于9" → 自动走装备过滤</div>
          <div class="help-ex">"任意来源移动速度30% 鞋子" → 移速必带</div>
          <div class="help-ex">"格挡30以上 盾牌" → 装备过滤，不是词缀</div>
          <div class="help-ex">说"词缀"才搜词缀 — "弓 暴击词缀" → stat</div>
        </div>
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
        <a href="https://poe2db.tw/tw/" target="_blank" class="footer-link">编年史</a>
        <a href="https://poe.ninja/poe2/builds" target="_blank" class="footer-link">Ninja</a>
        <a href="https://mobalytics.gg/poe-2/builds" target="_blank" class="footer-link">Mobalytics</a>
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
const showHelp = ref(false)

watch(collapsed, (val) => {
  document.body.style.marginRight = val ? "0px" : "300px"
  document.body.style.transition = "margin-right 0.2s"
}, { immediate: true })

const tabs = [
  { id: "search", label: "AI 生成" },
  { id: "settings", label: "设置" },
]

const currentLeague = computed(() => {
  const path = window.location.pathname
  const match = path.match(/\/trade2\/search\/(poe2\/\w+)/)
  return match ? match[1] : "poe2/Standard"
})
</script>

<style scoped>
/* ============================================
   PoE Trade Site Aesthetic
   ============================================ */

.poe2te-panel {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  z-index: 99999;
  display: flex;
  flex-direction: row;
}

.poe2te-panel.collapsed { width: 0; }
.poe2te-panel:not(.collapsed) { width: 300px; }

/* ---- Toggle ---- */
.toggle-btn {
  position: absolute;
  top: 12px; right: 0;
  width: 28px; height: 28px;
  background: #0f0f0f;
  border: 1px solid #4a3820;
  border-radius: 2px;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  z-index: 10;
}
.collapsed .toggle-btn {
  right: 0;
  border-right: none;
  border-radius: 2px 0 0 2px;
}
.poe2te-panel:not(.collapsed) .toggle-btn {
  right: 300px;
  border-left: none;
  border-radius: 0 2px 2px 0;
}
.toggle-btn:hover { background: #1a1410; border-color: #8b7030; }
.toggle-svg { width: 16px; height: 16px; color: #6c5830; transition: color 0.15s; }
.toggle-btn:hover .toggle-svg { color: #c8aa6e; }

/* ---- Panel Body ---- */
.panel-body {
  width: 100%; height: 100%;
  background: #0c0c0c;
  display: flex; flex-direction: column;
  overflow: hidden;
  color: #b0a080;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", serif;
  border-left: 1px solid #4a3820;
}

/* ---- Header ---- */
.panel-header {
  padding: 10px 14px;
  border-bottom: 1px solid #3a2818;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  background: #0a0a0a;
}
.panel-title {
  font-size: 15px; font-weight: 600;
  color: #c8aa6e;
  letter-spacing: 0.02em;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.panel-version { font-size: 10px; color: #5a4a30; }

/* ---- Help Button ---- */
.help-btn {
  width: 18px; height: 18px;
  background: none;
  border: 1px solid #4a3820;
  border-radius: 1px;
  color: #6a5a40;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  line-height: 1;
}
.help-btn:hover {
  background: #1a1410;
  border-color: #8b7030;
  color: #c8aa6e;
}

/* ---- Help Popover ---- */
.help-popover {
  background: #12100c;
  border: 1px solid #4a3820;
  border-top: none;
  padding: 10px 12px;
  font-size: 10px;
  max-height: 420px;
  overflow-y: auto;
  flex-shrink: 0;
}
.help-title {
  font-size: 11px; font-weight: 600;
  color: #c8aa6e;
  margin-bottom: 8px;
}
.help-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 8px;
}
.help-table th {
  text-align: left;
  font-weight: 600;
  color: #8b7030;
  padding: 2px 4px;
  border-bottom: 1px solid #3a2818;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.help-table td {
  padding: 3px 4px;
  color: #9a8a60;
  font-size: 10px;
  border-bottom: 1px solid #2a1a10;
}
.ht-type {
  color: #c8aa6e;
  white-space: nowrap;
  font-weight: 500;
}
.help-subtitle {
  font-size: 10px; font-weight: 600;
  color: #8b7030;
  margin: 6px 0 4px;
}
.help-ex {
  color: #6a5a40;
  font-size: 9px;
  padding: 1px 0;
  line-height: 1.6;
}

/* ---- Tab Navigation ---- */
.tab-nav {
  display: flex;
  border-bottom: 1px solid #3a2818;
  flex-shrink: 0;
  background: #0a0a0a;
}
.tab-btn {
  flex: 1; padding: 9px 4px;
  background: none; border: none;
  color: #6a5a40; font-size: 12px; cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.15s; font-weight: 500;
}
.tab-btn:hover { color: #af8b4c; }
.tab-btn.active { color: #c8aa6e; border-bottom-color: #8b7030; }

/* ---- Content Area ---- */
.tab-content {
  flex: 1; overflow-y: auto;
  padding: 0; background: #0c0c0c;
}

/* ---- Footer ---- */
.panel-footer {
  display: flex; gap: 0; padding: 0;
  border-top: 1px solid #3a2818;
  background: #0a0a0a; flex-shrink: 0;
}
.footer-link {
  flex: 1; color: #5a4a30; font-size: 10px;
  text-decoration: none; padding: 8px 4px;
  text-align: center; transition: all 0.15s;
  border-right: 1px solid #3a2818;
  letter-spacing: 0.02em;
}
.footer-link:last-child { border-right: none; }
.footer-link:hover { color: #c8aa6e; background: #141414; }
</style>
