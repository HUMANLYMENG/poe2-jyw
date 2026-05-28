// ============================================================
// PoE2 Trade Enhancer — Shared Type Definitions
// ============================================================

// ---- PoE Trade API Types ----

export interface StatFilter {
  id: string
  value: { min?: number; max?: number }
  disabled?: boolean
  type?: "explicit" | "implicit" | "pseudo" | "enchant" | "fractured" | "desecrated" | "augment" | "sanctum" | "skill"
}

export interface StatGroup {
  type: "and" | "not" | "if" | "count" | "weight"
  filters: StatFilter[]
  value?: { min?: number; max?: number }
}

export interface TradeSearchQuery {
  query: {
    status?: { option: "online" | "any" }
    name?: string
    type?: string
    stats: StatGroup[]
    filters?: {
      type_filters?: { filters: Record<string, unknown> }
      weapon_filters?: Record<string, unknown>
      armour_filters?: Record<string, unknown>
      socket_filters?: Record<string, unknown>
      equipment_filters?: { filters: Record<string, { min?: number; max?: number }> }
      req_filters?: { filters: Record<string, { min?: number; max?: number }> }
      trade_filters?: {
        filters?: {
          account?: { input?: string }
          collapse?: { option?: string }
          indexed?: { option?: string }
          sale_type?: { option?: string }
          price?: { min?: number; max?: number; option?: string }
          fee?: { min?: number; max?: number }
        }
      }
    }
  }
  sort?: { price: "asc" | "desc" } | { indexed: "asc" | "desc" }
}

export interface SearchResult {
  id: string
  items: TradeItem[]
  total: number
}

export interface TradeItem {
  id: string
  listing: {
    indexed: string
    price?: {
      amount: number
      currency: string
    }
    account?: {
      name: string
      lastCharacterName?: string
    }
    whisper?: string
    whisper_token?: string
    hideout_token?: string
  }
  item: {
    name?: string
    baseType?: string
    typeLine?: string
    icon?: string
    ilvl?: number
    corrupted?: boolean
    explicitMods?: string[]
    implicitMods?: string[]
    enchantMods?: string[]
    craftedMods?: string[]
    fracturedMods?: string[]
    properties?: { name: string; values: [string, number][]; displayMode?: number }[]
    requirements?: { name: string; values: [string, number][]; displayMode?: number }[]
    extended?: {
      text?: string
      mods?: {
        explicit?: { name: string; tier: string; magnitude: number }[]
        implicit?: { name: string; tier: string; magnitude: number }[]
      }
    }
  }
}

// ---- Stat Data (from /api/trade2/data/stats) ----

export interface StatEntry {
  id: string
  text: string
  type: string
  option?: {
    options?: { id: string; text: string }[]
  }
}

export interface StatGroupData {
  label: string
  entries: StatEntry[]
}

// ---- AI Search Types ----

export interface AiSearchRequest {
  text: string
  league: string
  statMappings: string  // injected stat list
}

export interface AiSearchResponse {
  query: TradeSearchQuery
  explanation?: string
}

// ---- AI Provider Config ----

export interface AiProviderConfig {
  apiUrl: string    // e.g. "https://api.deepseek.com/v1/chat/completions"
  apiKey: string
  model: string     // e.g. "deepseek-chat"
}

// ---- Search Word Management ----

export interface SearchWordFolder {
  id: string
  name: string
  parentId: string | null
  color: string
  createdAt: number
  sortOrder: number
  scope: string  // e.g. "poe2::Standard"
}

export interface SearchWord {
  id: string
  folderId: string
  name: string
  rawText: string
  query: TradeSearchQuery
  league: string
  createdAt: number
  pinned: boolean
  lastUsedAt?: number
}

// ---- App Settings ----

export interface AppSettings {
  aiProvider: AiProviderConfig
  showChineseAffixes: boolean
  showTierLabels: boolean
  autoCollapseOutOfTier: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  aiProvider: {
    apiUrl: "https://api.deepseek.com/v1/chat/completions",
    apiKey: "",
    model: "deepseek-chat"
  },
  showChineseAffixes: true,
  showTierLabels: true,
  autoCollapseOutOfTier: false
}

// ---- Background Message Types ----

export interface SearchHistoryEntry {
  id: string
  text: string
  explanation: string
  type: string | null
  tags: string[]
  matched: number
  timestamp: number
}

export type BgMessage =
  | { type: "AI_SEARCH"; payload: { text: string; league: string } }
  | { type: "GET_STATS" }
  | { type: "TRANSLATE_STAT"; payload: { statId: string; statText: string } }
  | { type: "TRANSLATE_BATCH"; payload: { texts: string[] } }
  | { type: "EXECUTE_SEARCH"; payload: { query: TradeSearchQuery; league: string } }
  | { type: "FETCH_ITEMS"; payload: { hashes: string[]; searchId: string } }
  | { type: "GET_SETTINGS" }
  | { type: "SAVE_SETTINGS"; payload: AppSettings }
  | { type: "GET_HISTORY" }
  | { type: "CLEAR_HISTORY" }
  | { type: "RESOLVE_MOD_TIERS"; payload: { mods: { text: string; category?: string }[] } }

export type BgResponse<T = unknown> = {
  status: "success" | "error"
  result?: T
  error?: string
}
