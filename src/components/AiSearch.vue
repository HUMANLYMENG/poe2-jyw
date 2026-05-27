<template>
  <div class="ai-search">
    <!-- Search Input -->
    <div class="search-input-area">
      <textarea
        v-model="searchText"
        placeholder="描述装备，如：T1电点伤戒指 生命80以上 抗性"
        rows="3"
        :disabled="loading"
        @keydown.enter.exact.prevent="search"
        @keydown.enter.shift.exact=";"
      />
      <div class="input-actions">
        <span class="league-badge">{{ league }}</span>
        <button class="gen-btn" :disabled="loading || !searchText.trim()" @click="search">
          <span v-if="!loading">生成</span>
          <span v-else>...</span>
        </button>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="error-box">
      <p>{{ error }}</p>
      <button @click="error = ''">✕</button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-hint">
      <p>解析中...</p>
    </div>

    <!-- Result Preview -->
    <div v-if="parsedQuery && !loading" class="result-preview">
      <div v-if="parsedQuery.explanation" class="explanation">
        {{ parsedQuery.explanation }}
      </div>

      <div class="query-summary">
        <div class="summary-row" v-if="parsedQuery.type">
          <span class="label">类别</span>
          <span class="value type-badge">{{ parsedQuery.type }}</span>
        </div>
        <div class="summary-row" v-if="parsedQuery.equipment?.length">
          <span class="label">装备属性</span>
          <span class="value eq-badge">{{ parsedQuery.equipment.join(' · ') }}</span>
        </div>
        <div class="summary-row" v-if="parsedQuery.tags?.length">
          <span class="label">筛选</span>
          <span class="value tag-list">{{ parsedQuery.tags.join(' · ') }}</span>
        </div>
        <div class="summary-row" v-if="parsedQuery.query?.name">
          <span class="label">名称</span>
          <span class="value">{{ parsedQuery.query.name }}</span>
        </div>
        <div class="summary-row" v-if="parsedQuery.matched != null">
          <span class="label">词缀</span>
          <span class="value">{{ parsedQuery.matched }} 个匹配</span>
        </div>
        <div class="summary-row" v-if="parsedQuery.translations && Object.keys(parsedQuery.translations).length">
          <span class="label">中文</span>
          <span class="value zh-stats">
            <span v-for="(zh, en) in parsedQuery.translations" :key="en" class="zh-item">
              <span class="type-badge-sm">{{ typeLabel(parsedQuery.statTypes?.[en]) }}</span>
              {{ zh }}
            </span>
          </span>
        </div>
        <div class="summary-row" v-if="parsedQuery.unmatched?.length">
          <span class="label">未匹配</span>
          <span class="value unmatched">{{ parsedQuery.unmatched.join(', ') }}</span>
        </div>
        <div class="summary-row" v-if="parsedQuery.excluded?.length">
          <span class="label">已排除（不存在于{{ parsedQuery.type }}）</span>
          <span class="value unmatched">{{ parsedQuery.excluded.join(' · ') }}</span>
        </div>
        <div class="summary-row" v-if="parsedQuery.statSummary?.length">
          <span class="label">约束</span>
          <span class="value stat-summary">{{ parsedQuery.statSummary.join(' · ') }}</span>
        </div>
        <div class="summary-row" v-if="parsedQuery.query?.filters?.trade_filters?.filters?.price">
          <span class="label">价格</span>
          <span class="value">{{ formatPrice(parsedQuery.query.filters.trade_filters.filters.price) }}</span>
        </div>
        <div class="summary-row">
          <span class="label">排序</span>
          <span class="value">{{ parsedQuery.sort?.price === 'asc' ? '价格从低到高' : parsedQuery.sort?.price === 'desc' ? '价格从高到低' : '默认' }}</span>
        </div>
        <div class="summary-row" v-if="parsedQuery.query?.status?.option">
          <span class="label">状态</span>
          <span class="value">{{ parsedQuery.query.status.option === 'online' ? '仅在线' : '全部' }}</span>
        </div>
      </div>

      <div class="result-actions">
        <button class="apply-btn" @click="executeSearch" :disabled="executingSearch">
          {{ executingSearch ? '跳转中...' : '在交易页查看结果' }}
        </button>
        <button class="copy-btn" @click="copyQuery">复制</button>
      </div>
    </div>

    <!-- Search History -->
    <div v-if="history.length" class="history-panel">
      <div class="history-header">
        <span>历史</span>
        <button class="clear-history-btn" @click="clearHistory" title="清除历史">清除</button>
      </div>
      <div
        v-for="h in history.slice(0, 10)"
        :key="h.id"
        class="history-item"
        @click="searchText = h.text; search()"
      >
        <span class="history-text">{{ h.text }}</span>
        <span class="history-meta">{{ h.matched }}条 · {{ formatTimeAgo(h.timestamp) }}</span>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="!parsedQuery && !loading && !error" class="empty-state">
      <p>输入中文描述，AI 自动生成精确搜索条件</p>
      <div class="examples">
        <button
          v-for="ex in examples"
          :key="ex"
          class="example-btn"
          @click="searchText = ex; search()"
        >
          {{ ex }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import type { SearchHistoryEntry, TradeSearchQuery } from "../types"

const props = defineProps<{ league: string }>()

// State
const searchText = ref("")
const loading = ref(false)
const error = ref("")
const parsedQuery = ref<{
  query: TradeSearchQuery["query"]
  sort: TradeSearchQuery["sort"]
  explanation?: string
  type?: string | null
  equipment?: string[]
  tags?: string[]
  matched?: number
  unmatched?: string[]
  translations?: Record<string, string>
  statTypes?: Record<string, string>
  warnings?: string[]
  excluded?: string[]
  statSummary?: string[]
} | null>(null)
const executingSearch = ref(false)
const history = ref<SearchHistoryEntry[]>([])

const examples = [
  "T1电点伤的戒指 生命80+ 抗性",
  "移速30%以上 鞋子",
  "Ming's Heart 混沌抗性",
  "高ES胸甲 智慧50+",
]

// Send to background for AI parsing
async function search(): Promise<void> {
  const text = searchText.value.trim()
  if (!text || loading.value) return

  loading.value = true
  error.value = ""
  parsedQuery.value = null

  try {
    const response = await chrome.runtime.sendMessage({
      type: "AI_SEARCH",
      payload: { text, league: props.league },
    })

    if (response.status !== "success") {
      const raw = response.error || "AI search failed"
      if (raw.includes("401") || raw.includes("403") || raw.includes("auth")) {
        throw new Error("API 鉴权失败 — 请到设置检查 API Key")
      }
      if (raw.includes("404") || raw.includes("not found")) {
        throw new Error("API 端点不存在 — 请检查 API URL")
      }
      throw new Error(raw)
    }

    parsedQuery.value = JSON.parse(JSON.stringify(response.result))
    if (!parsedQuery.value?.query) {
      error.value = "AI 返回的结果无法解析，请重试"
      parsedQuery.value = null
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

// Execute the actual trade search
async function executeSearch(): Promise<void> {
  if (!parsedQuery.value?.query) return

  executingSearch.value = true
  error.value = ""

  try {
    const fullQuery: TradeSearchQuery = {
      query: {
        status: parsedQuery.value.query.status || { option: "online" },
        ...parsedQuery.value.query,
      },
      sort: parsedQuery.value.sort || { price: "asc" },
    }

    const response = await chrome.runtime.sendMessage({
      type: "EXECUTE_SEARCH",
      payload: { query: JSON.parse(JSON.stringify(fullQuery)), league: props.league },
    })

    if (response.status !== "success") {
      throw new Error(response.error || "Search failed")
    }

    const { id } = response.result as { id: string; result: string[]; total: number }
    const tradeUrl = `https://www.pathofexile.com/trade2/search/${props.league}/${id}`
    window.location.href = tradeUrl
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    executingSearch.value = false
  }
}

function copyQuery(): void {
  if (!parsedQuery.value) return
  const text = JSON.stringify(parsedQuery.value, null, 2)
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text))
  } else {
    fallbackCopy(text)
  }
}

function fallbackCopy(text: string): void {
  const ta = document.createElement("textarea")
  ta.value = text
  ta.style.position = "fixed"
  ta.style.left = "-9999px"
  document.body.appendChild(ta)
  ta.select()
  document.execCommand("copy")
  document.body.removeChild(ta)
}

function formatPrice(price: { min?: number; max?: number; option?: string }): string {
  const parts: string[] = []
  if (price.min != null) parts.push(`${price.min}`)
  if (price.max != null) parts.push(`- ${price.max}`)
  if (price.option) parts.push(price.option)
  return parts.join(" ") || "不限"
}

async function loadHistory(): Promise<void> {
  try {
    const resp = await chrome.runtime.sendMessage({ type: "GET_HISTORY" })
    if (resp.status === "success") {
      history.value = resp.result || []
    }
  } catch { /* ignore */ }
}

async function clearHistory(): Promise<void> {
  await chrome.runtime.sendMessage({ type: "CLEAR_HISTORY" })
  history.value = []
}

function formatTimeAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 60) return "刚刚"
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  return `${Math.floor(diff / 86400)}天前`
}

const TYPE_CN: Record<string, string> = {
  explicit: "词缀", implicit: "基底", enchant: "附魔", fractured: "固定", desecrated: "亵渎", pseudo: "综合",
}
function typeLabel(t: string | undefined): string {
  if (!t) return ""
  return TYPE_CN[t] || t
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
/* ============================================
   PoE Trade Site Aesthetic
   ============================================ */

.ai-search {
  padding: 10px;
}

/* ---- Search Input ---- */
.search-input-area {
  margin-bottom: 10px;
}

textarea {
  width: 100%;
  background: #121212;
  border: 1px solid #4a3820;
  border-radius: 2px;
  color: #c0b090;
  padding: 9px;
  font-size: 12px;
  resize: vertical;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", serif;
  min-height: 58px;
  line-height: 1.5;
  box-sizing: border-box;
}

textarea:focus {
  outline: none;
  border-color: #8b7030;
}

textarea::placeholder {
  color: #4a3a20;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
}

.league-badge {
  font-size: 10px;
  color: #5a4a30;
  background: #111;
  padding: 2px 7px;
  border: 1px solid #3a2818;
  border-radius: 1px;
  letter-spacing: 0.02em;
}

/* ---- Generate Button ---- */
.gen-btn {
  background: #1a1410;
  color: #c8aa6e;
  border: 1px solid #6c4825;
  padding: 5px 16px;
  border-radius: 2px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  transition: all 0.15s;
}

.gen-btn:hover:not(:disabled) {
  background: #2a2018;
  border-color: #8b7030;
  color: #e0c080;
  box-shadow: 0 0 6px rgba(175, 139, 76, 0.15);
}

.gen-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* ---- Error ---- */
.error-box {
  background: #1a0f0f;
  border: 1px solid #6a2a2a;
  border-radius: 2px;
  padding: 9px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  color: #c86464;
  font-size: 11px;
}

.error-box button {
  background: none;
  border: none;
  color: #c86464;
  cursor: pointer;
  font-size: 13px;
  padding: 0 4px;
}

/* ---- Loading ---- */
.loading-hint {
  text-align: center;
  padding: 18px;
  color: #5a4a30;
  font-size: 12px;
}

/* ---- Result Preview ---- */
.result-preview {
  margin-top: 6px;
}

.explanation {
  background: #11180c;
  border: 1px solid #3a5a2a;
  border-radius: 2px;
  padding: 7px 9px;
  margin-bottom: 8px;
  font-size: 11px;
  color: #7a9a5a;
  line-height: 1.5;
}

.query-summary {
  background: #0f0f0f;
  border: 1px solid #3a2818;
  border-radius: 2px;
  padding: 7px 9px;
  margin-bottom: 8px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 2px 0;
  font-size: 11px;
  line-height: 1.6;
}

.summary-row .label {
  color: #5a4a30;
  flex-shrink: 0;
  margin-right: 8px;
}

.summary-row .value {
  color: #b0a080;
  font-weight: 500;
  text-align: right;
}

.summary-row .value.unmatched {
  color: #c86464;
  font-weight: 400;
  font-size: 10px;
}

.summary-row .value.stat-summary {
  color: #7a9a5a;
  font-weight: 500;
  font-size: 10px;
}

.summary-row .value.type-badge {
  color: #c8aa6e;
  background: #1a1410;
  padding: 1px 7px;
  border: 1px solid #4a3820;
  border-radius: 1px;
  font-size: 10px;
}

.summary-row .value.eq-badge {
  color: #8a9a6a;
  background: #11140c;
  padding: 1px 5px;
  border: 1px solid #3a4a2a;
  border-radius: 1px;
  font-size: 10px;
}

.summary-row .value.tag-list {
  color: #a09070;
  font-size: 10px;
}

/* ---- Action Buttons ---- */
.result-actions {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.apply-btn {
  flex: 1;
  background: #14140c;
  color: #a0b870;
  border: 1px solid #4a5a2a;
  padding: 7px 10px;
  border-radius: 2px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.15s;
}

.apply-btn:hover:not(:disabled) {
  background: #1a200e;
  border-color: #6a7a3a;
  color: #b8d080;
}

.apply-btn:disabled {
  opacity: 0.3;
}

.copy-btn {
  background: #0f0f0f;
  color: #5a4a30;
  border: 1px solid #3a2818;
  padding: 7px 12px;
  border-radius: 2px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.15s;
}

.copy-btn:hover {
  background: #1a1a1a;
  color: #8b7030;
  border-color: #4a3820;
}

/* ---- History ---- */
.history-panel {
  margin-top: 14px;
  border-top: 1px solid #3a2818;
  padding-top: 10px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  font-size: 11px;
  color: #5a4a30;
  font-weight: 500;
}

.clear-history-btn {
  background: none;
  border: none;
  color: #4a3820;
  cursor: pointer;
  font-size: 10px;
  padding: 2px 6px;
  transition: color 0.15s;
}

.clear-history-btn:hover {
  color: #c86464;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 7px;
  border: 1px solid transparent;
  border-radius: 1px;
  cursor: pointer;
  transition: all 0.12s;
  margin-bottom: 1px;
}

.history-item:hover {
  background: #12120c;
  border-color: #3a2818;
}

.history-text {
  color: #9a8a60;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 6px;
}

.history-meta {
  color: #4a3a20;
  font-size: 9px;
  white-space: nowrap;
}

/* ---- Empty State ---- */
.empty-state {
  text-align: center;
  padding: 20px 10px;
  color: #5a4a30;
  font-size: 11px;
}

.examples {
  margin-top: 10px;
}

.example-btn {
  display: block;
  width: 100%;
  text-align: left;
  background: #0f0f0f;
  border: 1px solid #3a2818;
  color: #7a6a50;
  padding: 5px 9px;
  margin-bottom: 3px;
  border-radius: 1px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.1s;
}

.example-btn:hover {
  background: #16120c;
  border-color: #4a3820;
  color: #a09070;
}

/* ---- Translation Stats ---- */
.zh-stats {
  color: #7a9a5a !important;
  font-size: 10px !important;
  font-weight: 400 !important;
  text-align: right;
  line-height: 1.5;
}

.zh-item {
  display: inline;
  white-space: nowrap;
}

.zh-item + .zh-item::before {
  content: " · ";
  color: #3a4a2a;
}

.type-badge-sm {
  display: inline-block;
  font-size: 8px;
  font-weight: 600;
  color: #8b7030;
  background: #1a1410;
  border: 1px solid #4a3820;
  border-radius: 1px;
  padding: 0 3px;
  margin-right: 2px;
  vertical-align: middle;
  line-height: 1.6;
  text-transform: none;
}
</style>
