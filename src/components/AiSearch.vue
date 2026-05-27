<template>
  <div class="ai-search">
    <!-- Search Input -->
    <div class="search-input-area">
      <textarea
        v-model="searchText"
        placeholder="描述你要找的装备，例如: T1电点伤戒指 生命80以上 抗性"
        rows="3"
        :disabled="loading"
        @keydown.enter.exact.prevent="search"
        @keydown.enter.shift.exact=";"
      />
      <div class="input-actions">
        <span class="league-badge">{{ league }}</span>
        <button class="search-btn" :disabled="loading || !searchText.trim()" @click="search">
          <span v-if="!loading">🔍 搜索</span>
          <span v-else class="spinner">⏳</span>
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
      <p>AI 正在解析搜索条件...</p>
    </div>

    <!-- Result Preview -->
    <div v-if="parsedQuery && !loading" class="result-preview">
      <div v-if="parsedQuery.explanation" class="explanation">
        💡 {{ parsedQuery.explanation }}
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
          <span class="label">📝 中文</span>
          <span class="value zh-stats">{{ Object.values(parsedQuery.translations).join(' · ') }}</span>
        </div>
        <div class="summary-row" v-if="parsedQuery.unmatched?.length">
          <span class="label">⚠️ 未匹配</span>
          <span class="value unmatched">{{ parsedQuery.unmatched.join(', ') }}</span>
        </div>
        <div class="summary-row" v-if="parsedQuery.excluded?.length">
          <span class="label">🚫 已排除（不存在于{{ parsedQuery.type }}）</span>
          <span class="value unmatched">{{ parsedQuery.excluded.join(' · ') }}</span>
        </div>
        <div class="summary-row" v-if="parsedQuery.statSummary?.length">
          <span class="label">📏 约束</span>
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
          {{ executingSearch ? '⏳ 搜索中...' : '📊 在交易页面查看结果' }}
        </button>
        <button class="copy-btn" @click="copyQuery">📋 复制查询</button>
      </div>
    </div>

    <!-- Search History -->
    <div v-if="history.length" class="history-panel">
      <div class="history-header">
        <span>🕐 历史搜索</span>
        <button class="clear-history-btn" @click="clearHistory" title="清除历史">✕</button>
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
      <p>输入中文搜索条件，AI 会自动解析为精确搜索</p>
      <div class="examples">
        <p class="examples-title">试试：</p>
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
      // Make 401/403 errors actionable
      const raw = response.error || "AI search failed"
      if (raw.includes("401") || raw.includes("403") || raw.includes("auth")) {
        throw new Error("🔑 API 鉴权失败 — 请到 ⚙️ 设置检查 API Key 是否正确（通常以 sk- 开头）")
      }
      if (raw.includes("404") || raw.includes("not found")) {
        throw new Error("🔗 API 端点不存在 — 请检查设置中的 API URL 是否完整")
      }
      throw new Error(raw)
    }

    // Deep-clone to strip any non-serializable artifacts before Vue reactivity
    parsedQuery.value = JSON.parse(JSON.stringify(response.result))
    // Validate: AI must return a query object
    if (!parsedQuery.value?.query) {
      error.value = "⚠️ AI 返回的结果无法解析为搜索条件，请尝试更具体的描述"
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
    // Build full query
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

    const { id, total } = response.result as {
      id: string
      result: string[]
      total: number
    }

    // Navigate to the native PoE trade results page
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
  // Try modern clipboard API first, fallback to execCommand
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

function countStats(stats: NonNullable<TradeSearchQuery["query"]["stats"]>): number {
  let count = 0
  for (const group of stats) {
    count += group.filters?.filter((f) => !f.disabled).length || 0
  }
  return count
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

onMounted(() => {
  loadHistory()
})

function timeAgo(dateStr?: string): string {
  if (!dateStr) return ""
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)

  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
</script>

<style scoped>
.ai-search {
  padding: 12px;
}

.search-input-area {
  margin-bottom: 12px;
}

textarea {
  width: 100%;
  background: #1a1a2e;
  border: 1px solid #2a2a4e;
  border-radius: 6px;
  color: #ccc;
  padding: 10px;
  font-size: 13px;
  resize: vertical;
  font-family: inherit;
  min-height: 60px;
}

textarea:focus {
  outline: none;
  border-color: #4a4a8e;
}

textarea::placeholder {
  color: #555;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.league-badge {
  font-size: 11px;
  color: #556;
  background: #1a1a2e;
  padding: 3px 8px;
  border-radius: 4px;
}

.search-btn {
  background: #2a2a5e;
  color: #aac;
  border: 1px solid #3a3a6e;
  padding: 6px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.search-btn:hover:not(:disabled) {
  background: #3a3a7e;
  color: #fff;
}

.search-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { opacity: 1; }
  50% { opacity: 0.3; }
  to { opacity: 1; }
}

.error-box {
  background: #2a1515;
  border: 1px solid #6a2a2a;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  color: #e88;
  font-size: 12px;
}

.error-box button {
  background: none;
  border: none;
  color: #e88;
  cursor: pointer;
  font-size: 14px;
}

.loading-hint {
  text-align: center;
  padding: 20px;
  color: #556;
  font-size: 13px;
}

.result-preview {
  margin-top: 8px;
}

.explanation {
  background: #1a2a1a;
  border: 1px solid #2a4a2a;
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #8b8;
}

.query-summary {
  background: #1a1a2e;
  border: 1px solid #2a2a4e;
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 10px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 3px 0;
  font-size: 12px;
}

.summary-row .label {
  color: #666;
}

.summary-row .value {
  color: #aa8;
  font-weight: 600;
}

.summary-row .value.unmatched {
  color: #e88;
  font-weight: 400;
  font-size: 11px;
}

.summary-row .value.stat-summary {
  color: #ad8;
  font-weight: 600;
  font-size: 11px;
}

.summary-row .value.type-badge {
  color: #ace;
  background: #1a2a3a;
  padding: 1px 8px;
  border-radius: 4px;
  font-size: 11px;
}

.summary-row .value.eq-badge {
  color: #cea;
  background: #1a2a1a;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.summary-row .value.tag-list {
  color: #dca;
  font-size: 11px;
}

.result-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.apply-btn {
  flex: 1;
  background: #2a4a2a;
  color: #8b8;
  border: 1px solid #3a6a3a;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.apply-btn:hover:not(:disabled) {
  background: #3a6a3a;
  color: #afa;
}

.apply-btn:disabled {
  opacity: 0.4;
}

.copy-btn {
  background: #1a1a2e;
  color: #666;
  border: 1px solid #2a2a4e;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}

.copy-btn:hover {
  background: #2a2a4e;
  color: #99a;
}

.search-results {
  margin-top: 8px;
}

.results-header {
  font-size: 11px;
  color: #556;
  padding: 4px 0;
  border-bottom: 1px solid #2a2a4e;
  margin-bottom: 8px;
}

.result-item {
  background: #1a1a2e;
  border: 1px solid #2a2a4e;
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 6px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.item-name {
  font-size: 12px;
  color: #dda;
  font-weight: 600;
}

.item-price {
  font-size: 11px;
  color: #ad8;
  background: #1a2a1a;
  padding: 1px 6px;
  border-radius: 3px;
}

.item-mods {
  font-size: 11px;
}

.mod-text {
  display: block;
  color: #778;
  line-height: 1.4;
}

.mod-more {
  color: #445;
  font-size: 10px;
}

.item-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}

.whisper-btn {
  font-size: 11px;
  color: #8ab;
  text-decoration: none;
  padding: 2px 8px;
  background: #1a2a3a;
  border-radius: 3px;
}

.whisper-btn:hover {
  background: #2a3a5a;
}

.item-indexed {
  font-size: 10px;
  color: #445;
}

.empty-state {
  text-align: center;
  padding: 24px 12px;
  color: #556;
  font-size: 12px;
}

.examples {
  margin-top: 12px;
}

.examples-title {
  color: #445;
  margin-bottom: 8px;
}

.example-btn {
  display: block;
  width: 100%;
  text-align: left;
  background: #1a1a2e;
  border: 1px solid #2a2a4e;
  color: #778;
  padding: 6px 10px;
  margin-bottom: 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.1s;
}

.example-btn:hover {
  background: #2a2a4e;
  color: #99a;
}

/* ---- History Panel ---- */

.history-panel {
  margin-top: 16px;
  border-top: 1px solid #2a2a4e;
  padding-top: 10px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #667;
}

.clear-history-btn {
  background: none;
  border: none;
  color: #556;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 3px;
}

.clear-history-btn:hover {
  color: #e88;
  background: #2a1515;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.15s;
  margin-bottom: 2px;
}

.history-item:hover {
  background: #1a2a3a;
}

.history-text {
  color: #99a;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-right: 8px;
}

.history-meta {
  color: #556;
  font-size: 10px;
  white-space: nowrap;
}

/* ---- Translation ---- */

.zh-stats {
  color: #8b8 !important;
  font-size: 11px !important;
  font-weight: 400 !important;
  text-align: right;
  line-height: 1.4;
}
</style>
