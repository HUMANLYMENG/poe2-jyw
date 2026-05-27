<template>
  <div class="settings-panel">
    <!-- AI API Configuration -->
    <div class="section">
      <h3 class="section-title">AI API 配置</h3>
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
      <h3 class="section-title">显示选项</h3>
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
        <span v-if="saving">保存中...</span>
        <span v-else>保存设置</span>
      </button>
      <span v-if="saveStatus" class="save-status" :class="saveStatusType">{{ saveStatus }}</span>
    </div>

    <!-- About -->
    <div class="section about">
      <h3 class="section-title">关于</h3>
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

  const key = settings.value.aiProvider.apiKey
  if (!key) {
    saveStatus.value = "API Key 不能为空"
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
    if (resp.result?.aiProvider) {
      settings.value.aiProvider = resp.result.aiProvider
    }
    saveStatus.value = "已保存 (" + (resp.result?.aiProvider?.apiKey ? "Key已设置" : "无Key") + ")"
    saveStatusType.value = "ok"
  } catch (e: any) {
    saveStatus.value = "保存失败: " + (e?.message || "未知错误")
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
      apiKey: settings.value.aiProvider.apiKey,
    }
    if (name === "omlx") {
      settings.value.aiProvider.apiKey = "local"
    }
    saveStatus.value = ""
  }
}
</script>

<style scoped>
/* ============================================
   PoE Trade Site Aesthetic
   ============================================ */

.settings-panel {
  padding: 10px;
}

.section {
  margin-bottom: 18px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #c8aa6e;
  margin-bottom: 3px;
}

.section-desc {
  font-size: 10px;
  color: #5a4a30;
  margin-bottom: 10px;
}

/* ---- Form ---- */
.form-group {
  margin-bottom: 8px;
}

.form-group label {
  display: block;
  font-size: 10px;
  color: #6a5a40;
  margin-bottom: 2px;
}

.form-group input {
  width: 100%;
  background: #121212;
  border: 1px solid #4a3820;
  border-radius: 2px;
  color: #c0b090;
  padding: 5px 8px;
  font-size: 11px;
  font-family: "SF Mono", "Fira Code", monospace;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #8b7030;
}

.form-group input::placeholder {
  color: #3a2818;
}

/* ---- Presets ---- */
.presets {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.presets-label {
  font-size: 10px;
  color: #5a4a30;
}

.preset-btn {
  background: #0f0f0f;
  border: 1px solid #4a3820;
  color: #7a6a50;
  padding: 2px 8px;
  border-radius: 1px;
  cursor: pointer;
  font-size: 10px;
  transition: all 0.12s;
}

.preset-btn:hover {
  background: #1a1410;
  border-color: #6c4825;
  color: #c8aa6e;
}

/* ---- Toggles ---- */
.toggle-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  font-size: 11px;
  color: #9a8a60;
  cursor: pointer;
}

.toggle-row input[type="checkbox"] {
  accent-color: #8b7030;
}

/* ---- Save ---- */
.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
}

.save-btn {
  background: #1a1410;
  color: #c8aa6e;
  border: 1px solid #6c4825;
  padding: 7px 18px;
  border-radius: 2px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  min-width: 110px;
  transition: all 0.15s;
}

.save-btn:hover:not(:disabled) {
  background: #2a2018;
  border-color: #8b7030;
  color: #e0c080;
}

.save-btn:disabled {
  opacity: 0.4;
}

.save-status {
  font-size: 11px;
  font-weight: 500;
}

.save-status.ok {
  color: #7a9a5a;
}

.save-status.err {
  color: #c86464;
}

/* ---- About ---- */
.about {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #3a2818;
}

.about p {
  font-size: 10px;
  color: #4a3a20;
  margin: 1px 0;
}
</style>
