<template>
  <div class="settings-panel">
    <!-- AI API Configuration -->
    <div class="section">
      <h3 class="section-title">🤖 AI API 配置</h3>
      <p class="section-desc">接入你自己的 AI API 来驱动自然语言搜索</p>

      <div class="form-group">
        <label>API 端点 URL</label>
        <input
          v-model="settings.aiProvider.apiUrl"
          type="text"
          placeholder="https://api.deepseek.com/v1/chat/completions"
        />
      </div>

      <div class="form-group">
        <label>API Key</label>
        <input
          v-model="settings.aiProvider.apiKey"
          type="password"
          placeholder="sk-..."
        />
      </div>

      <div class="form-group">
        <label>模型名称</label>
        <input
          v-model="settings.aiProvider.model"
          type="text"
          placeholder="deepseek-chat"
        />
      </div>

      <div class="presets">
        <span class="presets-label">快速配置：</span>
        <button @click="usePreset('deepseek')" class="preset-btn">DeepSeek</button>
        <button @click="usePreset('openai')" class="preset-btn">OpenAI</button>
        <button @click="usePreset('omlx')" class="preset-btn">oMLX (本地)</button>
      </div>
    </div>

    <!-- Display Options -->
    <div class="section">
      <h3 class="section-title">👁️ 显示选项</h3>
      <label class="toggle-row">
        <input type="checkbox" v-model="settings.showChineseAffixes" />
        <span>显示中文词缀翻译</span>
      </label>
      <label class="toggle-row">
        <input type="checkbox" v-model="settings.showTierLabels" />
        <span>显示 T 级标签 (开发中)</span>
      </label>
      <label class="toggle-row">
        <input type="checkbox" v-model="settings.autoCollapseOutOfTier" />
        <span>自动折叠超T阶物品 (开发中)</span>
      </label>
    </div>

    <!-- Save -->
    <div class="actions">
      <button class="save-btn" @click="save" :disabled="saving">
        <span v-if="saving">⏳ 保存中...</span>
        <span v-else>💾 保存设置</span>
      </button>
      <span v-if="saveStatus" class="save-status" :class="saveStatusType">{{ saveStatus }}</span>
    </div>

    <!-- About -->
    <div class="section about">
      <h3 class="section-title">📦 关于</h3>
      <p>PoE2 Trade Enhancer v0.1.0</p>
      <p>纯前端 · 无需后端 · 你的数据你做主</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import { type AppSettings, DEFAULT_SETTINGS } from "../types"

const settings = ref<AppSettings>({ ...DEFAULT_SETTINGS })
const saving = ref(false)
const saveStatus = ref("")
const saveStatusType = ref<"ok" | "err">("ok")

onMounted(async () => {
  try {
    const resp = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" })
    if (resp.status === "success" && resp.result) {
      settings.value = resp.result as AppSettings
    }
  } catch {
    // Use defaults
  }
})

async function save(): Promise<void> {
  saving.value = true
  saveStatus.value = ""

  // Validate API key format
  const key = settings.value.aiProvider.apiKey
  if (!key) {
    saveStatus.value = "⚠️ API Key 不能为空"
    saveStatusType.value = "err"
    saving.value = false
    return
  }

  try {
    const resp = await chrome.runtime.sendMessage({
      type: "SAVE_SETTINGS",
      payload: JSON.parse(JSON.stringify(settings.value)),
    })
    if (resp?.status !== "success") {
      throw new Error(resp?.error || "Unknown error")
    }
    // Background now returns verified settings; use them to update local state
    if (resp.result?.aiProvider) {
      settings.value.aiProvider = resp.result.aiProvider
    }
    saveStatus.value = "✅ 已保存 (" + (resp.result?.aiProvider?.apiKey ? "Key已设置" : "无Key") + ")"
    saveStatusType.value = "ok"
  } catch (e: any) {
    saveStatus.value = "❌ 保存失败: " + (e?.message || "未知错误")
    saveStatusType.value = "err"
  } finally {
    saving.value = false
  }
}

const PRESETS: Record<string, Partial<AppSettings["aiProvider"]>> = {
  deepseek: {
    apiUrl: "https://api.deepseek.com/v1/chat/completions",
    model: "deepseek-chat",
  },
  openai: {
    apiUrl: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
  },
  omlx: {
    apiUrl: "http://127.0.0.1:8000/v1/chat/completions",
    model: "gemma-4-E2B-Heretic-Uncensored-mlx-4bit",
  },
}

function usePreset(name: string): void {
  const preset = PRESETS[name]
  if (preset) {
    settings.value.aiProvider = {
      ...settings.value.aiProvider,
      ...preset,
      apiKey: settings.value.aiProvider.apiKey, // keep existing key
    }
    if (name === "omlx") {
      settings.value.aiProvider.apiKey = "local"
    }
    saveStatus.value = ""
  }
}
</script>

<style scoped>
.settings-panel { padding: 12px; }
.section { margin-bottom: 20px; }
.section-title { font-size: 14px; font-weight: 600; color: #cca; margin-bottom: 4px; }
.section-desc { font-size: 11px; color: #556; margin-bottom: 12px; }
.form-group { margin-bottom: 10px; }
.form-group label { display: block; font-size: 11px; color: #778; margin-bottom: 3px; }
.form-group input { width: 100%; background: #1a1a2e; border: 1px solid #2a2a4e; border-radius: 4px; color: #ccc; padding: 6px 10px; font-size: 12px; font-family: monospace; }
.form-group input:focus { outline: none; border-color: #4a4a8e; }
.presets { margin-top: 8px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.presets-label { font-size: 11px; color: #556; }
.preset-btn { background: #1a1a2e; border: 1px solid #2a2a4e; color: #778; padding: 3px 10px; border-radius: 4px; cursor: pointer; font-size: 11px; }
.preset-btn:hover { background: #2a2a4e; color: #99a; }
.toggle-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; font-size: 12px; color: #998; cursor: pointer; }
.toggle-row input[type="checkbox"] { accent-color: #4a4a8e; }
.actions { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
.save-btn { background: #2a2a5e; color: #aac; border: 1px solid #3a3a6e; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-size: 13px; min-width: 120px; }
.save-btn:hover:not(:disabled) { background: #3a3a7e; color: #fff; }
.save-btn:disabled { opacity: 0.5; }
.save-status { font-size: 13px; font-weight: 600; }
.save-status.ok { color: #6a6; }
.save-status.err { color: #e66; }
.about { margin-top: 16px; padding-top: 16px; border-top: 1px solid #2a2a4e; }
.about p { font-size: 11px; color: #445; margin: 2px 0; }
</style>
