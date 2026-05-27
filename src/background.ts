// ============================================================
// Background Service Worker
// Handles: AI search, PoE API proxy, stat translation, settings
// ============================================================

import type {
  AiProviderConfig,
  AppSettings,
  BgMessage,
  BgResponse,
  SearchHistoryEntry,
  StatEntry,
  TradeSearchQuery,
} from "~types"
import { DEFAULT_SETTINGS } from "~types"

// ---- Translation Dictionary ---- 

let enZhDict: Record<string, string> | null = null

// ---- Affix Validation (poe2db.tw data) ----

let affixDb: { categories: Array<{ category: string; slug: string; affixes: Array<{ details?: string; stat_text?: string; type?: string }> }> } | null = null
let categoryAffixFingerprints: Map<string, Set<string>> = new Map()

async function loadAffixDb(): Promise<void> {
  if (affixDb) return
  try {
    const url = chrome.runtime.getURL("poe2-base-affixes.json")
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`Affix DB load failed: ${resp.status}`)
    affixDb = await resp.json()
    
    // Build fingerprint sets per category slug
    for (const cat of affixDb!.categories) {
      if (!cat.affixes && !cat.base_items) continue  // skip empty
      const fps = new Set<string>()
      
      // Helper: clean text and add normalized fingerprint
      const addFp = (text: string) => {
        if (!text) return
        // Strip leading level number and trailing metadata tags+weight
        // DB format: "1 Adds (1—2) to (4—5) Physical Damage Damage,Physical,Attack 1000"
        let cleaned = text
          .replace(/^\d+\s+/, "")                           // strip leading level number
          .replace(/\s+[A-Z][a-zA-Z,]*\s+\d+\s*$/g, "")      // strip trailing "Tags 1000"
          .replace(/\s+[a-z]+\s*$/g, "")                      // strip trailing lowercase author
          .trim()
        if (!cleaned) return
        const fp = cleaned
          .replace(/\([\d.—]+\)/g, "#")
          .replace(/[\d.]+/g, "#")
          .replace(/[+\-%]/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .toLowerCase()
        if (fp.length > 3 && fp.split(" ").length >= 3) fps.add(fp)
      }
      
      // Affixes
      for (const affix of (cat.affixes || [])) {
        addFp(affix.details || affix.stat_text || "")
      }
      
      // Base item implicits (e.g. bow bases with implicit crit)
      for (const base of (cat.base_items || [])) {
        for (const imp of (base.implicits || [])) {
          addFp(imp)
        }
      }
      
      categoryAffixFingerprints.set(cat.slug, fps)
    }

    // Build merged fingerprints for parent categories (Boots, Gloves, etc.)
    for (const [parent, subSlugs] of Object.entries(MERGED_SLUGS)) {
      const merged = new Set<string>()
      for (const subSlug of subSlugs) {
        const subFps = categoryAffixFingerprints.get(subSlug)
        if (subFps) for (const fp of subFps) merged.add(fp)
      }
      categoryAffixFingerprints.set(parent, merged)
      console.log(`[PoE2] Merged ${parent}: ${merged.size} fingerprints from ${subSlugs.length} subcategories`)
    }

    console.log(`[PoE2] Affix DB loaded: ${affixDb!.categories.length} categories`)
  } catch (e) {
    console.warn("[PoE2] Affix DB not available:", e)
  }
}

// Map AI type names to poe2db category slugs
const TYPE_TO_SLUG: Record<string, string> = {
  "Ring": "Rings", "Amulet": "Amulets", "Belt": "Belts",
  "Boots": "Boots", "Gloves": "Gloves", "Helmet": "Helmets",
  "Body Armour": "Body Armours", "Focus": "Foci",
  "Quiver": "Quivers",
  "Bow": "Bows", "Crossbow": "Crossbows",
  "Claw": "Claws", "Dagger": "Daggers",
  "One Handed Sword": "One_Hand_Swords", "One Handed Axe": "One_Hand_Axes",
  "One Handed Mace": "One_Hand_Maces",
  "Two Handed Sword": "Two_Hand_Swords", "Two Handed Axe": "Two_Hand_Axes",
  "Two Handed Mace": "Two_Hand_Maces",
  "Spear": "Spears", "Flail": "Flails",
  "Quarterstaff": "Quarterstaves", "Wand": "Wands", "Sceptre": "Sceptres", "Staff": "Staves",
}

// DB has attribute-specific subcategories (Boots_str, Boots_dex, etc.).
// Merged parent slugs that pull from all subcategory variants.
// Keys MUST match TYPE_TO_SLUG values (the slug used for lookup).
const MERGED_SLUGS: Record<string, string[]> = {
  "Boots": ["Boots_str", "Boots_dex", "Boots_int", "Boots_str_dex", "Boots_str_int", "Boots_dex_int"],
  "Gloves": ["Gloves_str", "Gloves_dex", "Gloves_int", "Gloves_str_dex", "Gloves_str_int", "Gloves_dex_int"],
  "Helmets": ["Helmets_str", "Helmets_dex", "Helmets_int", "Helmets_str_dex", "Helmets_str_int", "Helmets_dex_int"],
  "Body Armours": ["Body_Armours_str", "Body_Armours_dex", "Body_Armours_int", "Body_Armours_str_dex", "Body_Armours_str_int", "Body_Armours_dex_int"],
}

function validateStatForCategory(statText: string, categoryType: string): { valid: boolean; categorySlug?: string } {
  if (!affixDb || !categoryType) return { valid: true } // can't validate, assume valid
  
  const slug = TYPE_TO_SLUG[categoryType]
  if (!slug) return { valid: true } // unknown category, assume valid
  
  const fps = categoryAffixFingerprints.get(slug)
  if (!fps || fps.size === 0) return { valid: true }
  
  // Normalize the API stat text the same way as DB fingerprints are built
  const fp = statText
    .replace(/\([\d.—]+\)/g, "#")  // ranges like (1—2) or (1-2) -> #
    .replace(/[\d.]+/g, "#")       // standalone numbers -> #
    .replace(/[+\-%]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
  
  // Prefix match: API stat fp must START WITH a DB fingerprint
  for (const dbFp of fps) {
    if (fp.startsWith(dbFp)) return { valid: true, categorySlug: slug }
  }
  
  return { valid: false, categorySlug: slug }
}

async function loadDictionary(): Promise<Record<string, string>> {
  if (enZhDict) return enZhDict
  try {
    const url = chrome.runtime.getURL("poe2_en_zh.json")
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`Dict load failed: ${resp.status}`)
    enZhDict = await resp.json()
    console.log(`[PoE2] Dictionary loaded: ${Object.keys(enZhDict!).length} entries`)
    return enZhDict!
  } catch (e) {
    console.warn("[PoE2] Dictionary not available, translations disabled:", e)
    enZhDict = {}
    return {}
  }
}

function normalizeStatText(text: string): string {
  return text
    .replace(/[+\-]?\d+(?:\.\d+)?/g, "#")  // replace numbers with #
    .replace(/^[+\-]\s*/, "")                // strip leading +/-
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

function translateEnToZh(englishText: string): string | null {
  if (!enZhDict || Object.keys(enZhDict).length === 0) return null
  
  // Extract real numbers from the original text
  const realNumbers = englishText.match(/[+\-]?\d+(?:\.\d+)?/g) || []
  
  const needle = normalizeStatText(englishText)
  if (!needle) return null
  
  // Exact normalized match only (numbers → #)
  for (const [en, zh] of Object.entries(enZhDict)) {
    if (normalizeStatText(en) === needle) {
      return substituteNumbers(zh, realNumbers)
    }
  }
  
  return null
}

function substituteNumbers(template: string, numbers: string[]): string {
  if (!numbers.length) return template
  let result = template
  let numIdx = 0
  // Replace # placeholders in order with actual numbers
  result = result.replace(/#/g, () => {
    const num = numbers[numIdx]
    numIdx = (numIdx + 1) % numbers.length
    return num || "#"
  })
  return result
}

// ---- Settings Management ----

async function getSettings(): Promise<AppSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get("settings", (result) => {
      if (chrome.runtime.lastError) {
        console.warn("[PoE2] getSettings error:", chrome.runtime.lastError)
        resolve({ ...DEFAULT_SETTINGS })
        return
      }
      // Debug
      chrome.storage.local.get(null, (all) => {
        console.log("[PoE2] getSettings: result_keys=", Object.keys(result || {}),
          "all_keys=", Object.keys(all || {}))
      })
      resolve(result?.settings || DEFAULT_SETTINGS)
    })
  })
}

async function saveSettings(settings: AppSettings): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log("[PoE2] saveSettings: saving key_len=" + (settings?.aiProvider?.apiKey?.length || 0))
    chrome.storage.local.set({ settings }, () => {
      if (chrome.runtime.lastError) {
        console.error("[PoE2] saveSettings error:", chrome.runtime.lastError)
        reject(new Error("保存失败: " + chrome.runtime.lastError.message))
      } else {
        console.log("[PoE2] saveSettings: set callback OK")
        resolve()
      }
    })
  })
}

// Callback-based storage helpers (Firefox MV2 doesn't support Promise API)
function storageGet(keys: string | string[] | null): Promise<Record<string, any>> {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys as any, (result) => {
      if (chrome.runtime.lastError) {
        console.warn("[PoE2] storageGet error:", chrome.runtime.lastError)
        resolve({})
      } else {
        resolve(result || {})
      }
    })
  })
}

function storageSet(items: Record<string, any>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(items, () => {
      if (chrome.runtime.lastError) {
        console.warn("[PoE2] storageSet error:", chrome.runtime.lastError)
      }
      resolve()
    })
  })
}

function storageRemove(keys: string | string[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(keys as any, () => {
      if (chrome.runtime.lastError) {
        console.warn("[PoE2] storageRemove error:", chrome.runtime.lastError)
      }
      resolve()
    })
  })
}

// ---- PoE2 Translation Dictionary ----
// Full dictionary loaded from COMMON_STATS_SNIPPET in AI prompt.
// For runtime zh→en lookup, use STAT_LOOKUP message (requires dict file in extension package).

// Common stat descriptions injected into AI prompt for accuracy
const COMMON_STATS_SNIPPET = `## Reference: Common Stat Descriptions (exact English → Chinese)
Use these EXACT English texts when the user describes these stats:
- "adds # to # lightning damage to attacks" → 攻擊附加閃電傷害
- "adds # to # fire damage to attacks" → 攻擊附加火焰傷害
- "adds # to # cold damage to attacks" → 攻擊附加冰冷傷害
- "adds # to # physical damage to attacks" → 攻擊附加物理傷害
- "+# to maximum Life" → 最大生命
- "+# to maximum Mana" → 最大魔力
- "+# to maximum Energy Shield" → 最大能量護盾
- "+# to maximum Energy Shield (Local)" → 本地能量護盾（胸甲/头/手/鞋）
- "#% increased Movement Speed" → 移動速度
- "#% increased Attack Speed" → 攻擊速度
- "#% increased Cast Speed" → 施放速度
- "#% to Fire Resistance" → 火焰抗性
- "#% to Cold Resistance" → 冰冷抗性
- "#% to Lightning Resistance" → 閃電抗性
- "#% to Chaos Resistance" → 混沌抗性
- "#% to all Elemental Resistances" → 全部元素抗性
- "+# to Strength" → 力量
- "+# to Dexterity" → 敏捷
- "+# to Intelligence" → 智慧
- "+# to all Attributes" → 全能力
- "+# to Spirit" → 精魂
- "#% increased Rarity of Items found" → 物品稀有度
- "#% increased Critical Hit Chance" → 暴擊率
- "+#% to Critical Damage Bonus" → 暴擊傷害加成
- "#% increased Spell Damage" → 法術傷害
- "#% increased Physical Damage" → 物理傷害
- "#% increased Lightning Damage" → 閃電傷害
- "#% increased Fire Damage" → 火焰傷害
- "#% increased Cold Damage" → 冰冷傷害
- "#% increased Chaos Damage" → 混沌傷害
- "+# to Evasion Rating" → 閃避值
- "+# to Evasion Rating (Local)" → 本地閃避（護甲裝備詞綴）
- "+# to Armour" → 護甲值
- "+# to Armour (Local)" → 本地護甲（護甲裝備詞綴）
- "#% increased Armour (Local)" → 護甲%提高（本地）
- "#% increased Evasion Rating (Local)" → 閃避%提高（本地）
- "+# to Accuracy Rating (Local)" → 命中值（武器本地）
- "#% increased Attack Speed (Local)" → 攻擊速度（武器本地）
- "+#% to Block chance" → 格擋率
- "#% increased Block chance (Local)" → 格擋率（盾牌本地）
- "# Life Regeneration per second" → 每秒生命回復
- "Leech #% of Physical Attack Damage as Life" → 物理攻擊傷害生命偷取
- "gain # Life per enemy killed" → 擊殺回復生命
- "#% increased Skill Speed" → 技能速度
- "#% increased Mana Regeneration Rate" → 魔力回復速度
`;

// ---- PoE Trade API ----

const POE_API_BASE = "https://www.pathofexile.com/api/trade2"

let statsCache: StatEntry[] | null = null
let statsCacheTime = 0
const STATS_CACHE_TTL = 3600_000 // 1 hour

export async function fetchStats(): Promise<StatEntry[]> {
  if (statsCache && Date.now() - statsCacheTime < STATS_CACHE_TTL) {
    return statsCache
  }

  const resp = await fetch(`${POE_API_BASE}/data/stats`)
  if (!resp.ok) throw new Error(`Stats API returned ${resp.status}`)

  const data = await resp.json()
  const entries: StatEntry[] = []

  for (const group of data.result || []) {
    for (const entry of group.entries || []) {
      entries.push({
        id: entry.id,
        text: entry.text,
        type: entry.type,
        option: entry.option,
      })
    }
  }

  statsCache = entries
  statsCacheTime = Date.now()
  return entries
}

export async function executeSearch(
  query: TradeSearchQuery,
  league: string
): Promise<{ id: string; result: string[]; total: number }> {
  const resp = await fetch(`${POE_API_BASE}/search/${league}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  })
  if (!resp.ok) {
    const errText = await resp.text()
    throw new Error(`Search API returned ${resp.status}: ${errText}`)
  }
  return resp.json()
}

export async function fetchItems(
  hashes: string[],
  searchId: string
): Promise<{ result: unknown[] }> {
  const resp = await fetch(
    `${POE_API_BASE}/fetch/${hashes.join(",")}?query=${searchId}`
  )
  if (!resp.ok) {
    const errText = await resp.text()
    throw new Error(`Fetch API returned ${resp.status}: ${errText.slice(0, 200)}`)
  }
  return resp.json()
}

// ---- AI Search ----

const AI_SYSTEM_PROMPT = `You are a Path of Exile 2 trade search parser. Convert the user's Chinese natural language search into a JSON search intent.

## Output Format
You MUST output this exact JSON structure:
{
  "stats": [
    { "text": "exact English stat description", "min": number_or_null, "max": number_or_null, "statType": "explicit"|"implicit"|"pseudo"|"enchant"|"fractured"|null }
  ],
  "type": "item category in English, or null",
  "name": "unique item name in English, or null",
  "equipment": [
    { "id": "filter_id", "min": number_or_null, "max": number_or_null }
  ],
  "rarity": "normal"|"magic"|"rare"|"unique"|"nonunique"|null,
  "ilvl": { "min": number_or_null, "max": number_or_null } or null,
  "quality": { "min": number_or_null, "max": number_or_null } or null,
  "req": [
    { "id": "lvl"|"str"|"dex"|"int", "min": number_or_null, "max": number_or_null }
  ],
  "runeSockets": { "min": number_or_null, "max": number_or_null } or null,
  "saleType": "priced"|"priced_with_info"|"unpriced"|"any"|null,
  "listed": "1hour"|"3hours"|"12hours"|"1day"|"3days"|"1week"|"2weeks"|"1month"|"2months"|null,
  "sellerAccount": "account name string, or null",
  "collapse": true|false|null,
  "goldFee": { "min": number_or_null, "max": number_or_null } or null,
  "status": "online" or "any",
  "sort": "price-asc" or "price-desc",
  "price": { "min": number_or_null, "max": number_or_null, "currency": "chaos"|"divine"|"exalted" or null },
  "explanation": "brief Chinese summary"
}

## Rules

### Item Type
1. "type": identify the item category from user input. Valid values (case-sensitive):
   - Ring (戒指), Amulet (项链), Belt (腰带)
   - Boots (鞋子), Gloves (手套), Helmet (头盔), Body Armour (胸甲)
   - Shield (盾牌), Quiver (箭袋), Focus (法器)
   - Claw (爪), Dagger (匕首), One Handed Sword (单手剑), One Handed Axe (单手斧), One Handed Mace (单手锤)
   - Two Handed Sword (双手剑), Two Handed Axe (双手斧), Two Handed Mace (双手锤)
   - Spear (长矛), Flail (连枷), Quarterstaff (长杖/武杖)
   - Bow (弓), Crossbow (弩), Wand (短杖/魔杖), Sceptre (权杖), Staff (法杖)
   - Life Flask (生命药剂), Mana Flask (魔力药剂), Flask (通用药剂)
   - Jewel (珠宝), Waystone (异界地图), Tablet (碑牌), Rune (符文), Soul Core (灵魂核心)
   - Skill Gem (技能宝石), Support Gem (辅助宝石)

### Stats (right-side affix filters)
2. "text" MUST be an EXACT English stat description as it appears on PoE items, e.g.:
   - "adds # to # lightning damage to attacks" (NOT "lightning damage")
   - "#% increased Movement Speed" (NOT "movement speed")
   - "+# to maximum Life" 
   - "#% to Fire Resistance"
   Use # as placeholder. Copy the wording exactly from in-game.
3. "min"/"max" = the numeric threshold. null if not specified.
4. "statType": the stat category. ⚠️ CRITICAL — detect from user wording:

   Keywords → statType mapping:
   - "词缀" / "词条" / "T1" / "T2" / "随机词" → "explicit" (黄装词缀)
   - "基底" / "底子" / "自带" / "原生" → "implicit" (装备基底自带)
   - "附魔" / "附魔词" → "enchant" (附魔)
   - "破裂" / "裂痕" / "固定" / "固定词" / "固定住" → "fractured" (破裂/固定词)
   - "亵渎" / "亵渎词" / "desecrated" → "desecrated" (亵渎词)
   - "伪" / "综合" / "合计" → "pseudo" (计算值)
   - "模糊" / "任意" / "不限定" / "任意来源" / no keyword → null (搜索全部类型)
   
   ⚠️ "null" = match ALL stat types (explicit + implicit + enchant + fractured)
   Use null when user doesn't specify, or when they say "模糊"/"任意来源".
   
   Examples:
   - "基底抗性戒指" → statType:"implicit" for the resistance stat
   - "固定住 攻速的弓" → statType:"fractured" for attack speed
   - "附魔施法速度的手套" → statType:"enchant" for cast speed
   - "模糊搜索冰抗大于50" → statType:null (search all types)
   - "混沌抗性词缀的项链" on Ming's Heart → statType:"implicit" (明心项链的混沌抗是基底)
   - "T1生命的胸甲" → statType:"explicit"
   - "至少3条破裂词缀" → count group, each filter statType:"fractured"

   ⚠️ "任意来源/综合/总和 + 数值" RULE:
   When user says "任意来源XX总和>N" or "综合XX>N" or "XX加起来>N",
   put the NUMBER DIRECTLY on the stat min/max. Do NOT create a separate statGroup.
   Example: "能量护盾总和>20" → {"text":"# to maximum Energy Shield","min":20,"statType":null}
   Example: "任意来源冰抗大于30" → {"text":"#% to Cold Resistance","min":30,"statType":null}
   The system handles type expansion + weight sum automatically when min/max is set on a null-statType stat.

5. "statGroups": additional group logic for weight/count/not queries. ALWAYS an array.
   Use the flat "stats" array for individual filters (T1电点伤, 生命80+, etc.)
   Use statGroups ONLY for special group logic (weight sum, count, not).
   The two are ADDITIVE — individual stats still go in "stats", group logic in "statGroups".
   
   Group types:
   - "and": ALL filters must match (you rarely need this — use flat "stats" instead)
   - "not": NONE match (exclude). E.g. "不要闪避" → statGroups:[{type:"not",filters:[...]}]
   - "count": at least value.min filters match. E.g. "至少3条抗性" → count group, value.min=3.
        Use value.max for "不超过/最多 N 条". E.g. "抗性不超过3条" → count group, value.max=3.
        Both can be set together. E.g. "2-4条抗性" → count group, value.min=2, value.max=4.
   - "weight": SUM of matching filter VALUES ≥ value.min. Use for "总和/加起来" queries.
        "总和大于40" → weight group, value.min=40.
        "总和不超过40" → weight group, value.max=40.
   
   COMPLETE EXAMPLE — "T1电点伤戒指 生命80+ 任意抗性加起来大于30 不超过200e":
   {
     "stats": [
       {"text":"adds # to # lightning damage to attacks","min":null,"max":null,"statType":null},
       {"text":"+# to maximum Life","min":80,"max":null,"statType":null}
     ],
     "type": "Ring",
     "statGroups": [{
       "type": "weight",
       "value": {"min": 30},
       "filters": [
         {"text":"#% to Fire Resistance","min":null,"max":null,"statType":null},
         {"text":"#% to Cold Resistance","min":null,"max":null,"statType":null},
         {"text":"#% to Lightning Resistance","min":null,"max":null,"statType":null},
         {"text":"#% to Chaos Resistance","min":null,"max":null,"statType":null}
       ]
     }],
     "price": {"max":200,"currency":"exalted"},
     "explanation": "电点伤+生命+抗性总和>30的戒指，预算200e"
   }
   
   Empty array [] when no special group logic. Never omit this field.

### Equipment (left-side attribute filters)
4. "equipment": array. Use these exact "id" values:
   - ar (护甲), ev (闪避), es (能量护盾/ES), block (格挡率), spirit (精魂)
   - dps (秒伤), pdps (物理秒伤), edps (元素秒伤), damage (单次伤害)
   - aps (攻速), crit (暴击率), reload_time (装填时间, use max for upper bound)
   
   ⚠️ CRITICAL — Equipment vs Stat distinction:
   
   ⚠️ **ARMOUR EQUIPMENT RULE — CRITICAL** ⚠️
   On armour pieces (Body Armour, Helmet, Boots, Gloves), **EVERY** mention of
   Energy Shield (ES/能量护盾), Armour (护甲), or Evasion (闪避) goes to equipment.
   **NEVER** put them in stats.
   
   This covers ALL phrasing:
   - "属性XX" / "高XX" / "低XX" / "XX大于N" / "XX至少N" / "XX" alone
   - Even vague descriptors like "高ES胸甲" → equipment, NO stat entry
   - "胸甲需要高护甲" → equipment
   - "ES胸甲 护盾大于500" → equipment only (both "ES" and "护盾大于500")
   
   Examples:
   - "高ES胸甲" → equipment:[{id:"es",min:null,max:null}], stats:[] (NO ES stat!)
   - "属性能量护盾大于100" → equipment:[{id:"es",min:100,max:null}]
   - "高护甲高闪避衣服" → equipment:[{id:"ar",min:null,max:null},{id:"ev",min:null,max:null}]
   - "胸甲ES1000" → equipment:[{id:"es",min:1000,max:null}]
   - "胸甲 护盾词缀" → ONLY then use stats with (Local): "+# to maximum Energy Shield (Local)"
   - "高ES胸甲 属性能量护盾大于100" → equipment:[{id:"es",min:100}], NO stats entry for ES
   
   Only on JEWELRY/WEAPONS: "+# to maximum Energy Shield" → stat.
   Only on ARMOUR when user EXPLICITLY says "词缀/词条/mod/affix": use (Local) variant.
   
   Other (Local) stats (when user says "词缀" on armour):
   - Armour pieces: "+# to Armour (Local)", "#% increased Armour (Local)",
     "+# to Evasion Rating (Local)", "#% increased Evasion Rating (Local)"
   - Weapons: "+# to Accuracy Rating (Local)", "#% increased Attack Speed (Local)"
   - Shields: "#% increased Block chance (Local)"
   
   E.g. "戒指能量护盾50" → stats:[{text:"+# to maximum Energy Shield",min:50}].
   E.g. "高护甲闪避衣服" → equipment:[{id:"ar",min:null,max:null},{id:"ev",min:null,max:null}].

### Type Filters
5. "rarity": "rare" if user says 稀有/黄装, "unique" for 传奇/暗金, "magic" for 魔法/蓝装, "normal" for 白装/普通, "nonunique" for 非传奇. null = any.
6. "ilvl": item level (物品等级). E.g. "物品等级80+" → {min:80,max:null}, "ilvl 70-85" → {min:70,max:85}. null if not specified.
7. "quality": item quality (品质). E.g. "品质20" → {min:20,max:null}. null if not specified.
8. "runeSockets": augmentable sockets (可打孔数/符文孔). E.g. "2孔" → {min:2,max:null}. null if not specified.

### Requirements
9. "req": array. IDs: lvl (需求等级), str (需求力量), dex (需求敏捷), int (需求智慧).
   E.g. "需求等级60以下 力量50+" → [{id:"lvl",min:null,max:60},{id:"str",min:50,max:null}]
   Empty [] if not mentioned.

### Trade Filters
10. "price": buyout price. "currency": "chaos"|"divine"|"exalted". Currency abbreviations:
    - c/chaos/C = chaos (混沌石)
    - d/div/D/divine = divine (神圣石)  
    - e/ex/E/exalted = exalted (崇高石)
    E.g. "最高50e" or "不超过200e" → {max:200,currency:"exalted"}, "10d以上" → {min:10,currency:"divine"}, "5c-20c" → {min:5,max:20,currency:"chaos"}
    null if no price limit. "最高"/"不超过"/"最多" = max, "以上"/"最少"/"最低" = min.
11. "saleType": "priced" for 一口价/标价, "priced_with_info" for 带备注价格, "unpriced" for 无标价, "any" or null.
12. "listed": time since listed (上架时间). "1hour"/"3hours"/"12hours"/"1day"/"3days"/"1week"/"2weeks"/"1month"/"2months". E.g. "上架1天内" → "1day". null = any time.
13. "sellerAccount": seller name (卖家名). null if not specified.
14. "collapse": true to collapse listings by account (合并同一卖家). null for default (no).
15. "goldFee": gold fee (金币费用). E.g. "金币费不超过500" → {min:null,max:500}. null if not specified.

### General
16. "name" = null unless user names a specific unique item.
17. "status": "online" by default.
18. "sort": "price-asc" by default.
19. "explanation" in Chinese.
20. For "鞋子" or "boots": include a movement speed stat.

## ⚠️ CRITICAL: ALWAYS include price when mentioned
If the user says ANY price limit — "最高X", "不超过X", "X以下", "X以上", "最少X", "X-Yc/d/e", "budget X" — you MUST output the "price" field. Never skip it.
Double-check before responding: did the user mention a price? If yes, output it.

## ⚠️ Weapon stat types
On weapons (Bow, Sword, Axe, etc.), critical chance is "#% to Critical Hit Chance" NOT "#% increased Critical Hit Chance".
On weapons, added damage is "Adds # to # Physical Damage" NOT "#% increased Physical Damage" (that's a prefix).
Always use the EXACT stat text from the reference above.

Respond with ONLY the JSON. No markdown, no code fences.

${COMMON_STATS_SNIPPET}`;

// ---- Local Stat Matching ----

interface AiIntent {
  stats: { text: string; min: number | null; max: number | null; statType?: string | null }[]
  type: string | null
  name: string | null
  equipment: { id: string; min: number | null; max: number | null }[]
  statGroups: { type: string; value: { min?: number; max?: number }; filters: { text: string; min: number | null; max: number | null; statType?: string | null }[] }[]
  rarity: string | null
  ilvl: { min: number | null; max: number | null } | null
  quality: { min: number | null; max: number | null } | null
  req: { id: string; min: number | null; max: number | null }[]
  runeSockets: { min: number | null; max: number | null } | null
  saleType: string | null
  listed: string | null
  sellerAccount: string | null
  collapse: boolean | null
  goldFee: { min: number | null; max: number | null } | null
  status: "online" | "any"
  sort: string
  price: { min: number | null; max: number | null; currency: string | null } | null
  explanation: string
}

function fuzzyMatchStat(searchText: string, stats: StatEntry[]): StatEntry | null {
  const needle = searchText.toLowerCase().replace(/#/g, "").replace(/[+-]/g, "").trim()
  
  let best: StatEntry | null = null
  let bestScore = 0

  for (const stat of stats) {
    const haystack = (stat.text || "").toLowerCase()
    
    // Exact match after stripping placeholders
    if (haystack === needle) return stat
    
    // Substring match
    if (haystack.includes(needle) || needle.includes(haystack)) {
      const score = Math.min(haystack.length, needle.length) / Math.max(haystack.length, needle.length)
      if (score > bestScore) {
        bestScore = score
        best = stat
      }
    }
  }

  // If no substring match, try word-by-word
  if (!best) {
    const words = needle.split(/\s+/).filter(w => w.length > 2)
    for (const stat of stats) {
      const haystack = (stat.text || "").toLowerCase()
      const matched = words.filter(w => haystack.includes(w)).length
      const score = matched / words.length
      if (score > 0.5 && score > bestScore) {
        bestScore = score
        best = stat
      }
    }
  }

  return best
}

function buildTradeQuery(intent: AiIntent, stats: StatEntry[]): TradeSearchQuery {
  // Build stat groups
  const statGroups: StatGroup[] = []

  // Helper to convert a stat intent to filter(s).
  // When statType is null (user wants "all types"), returns multiple filters
  // because PoE API defaults to "explicit" when type is omitted.
  const ALL_STAT_TYPES = ["explicit", "implicit", "enchant", "fractured", "desecrated"] as const

  const toFilter = (s: { text: string; min: number | null; max: number | null; statType?: string | null }): StatFilter | null => {
    if (!s.text) return null
    const matched = fuzzyMatchStat(s.text, stats)
    if (!matched) return null
    const filter: StatFilter = {
      id: matched.id,
      value: {
        min: s.min ?? undefined,
        max: s.max ?? undefined,
      },
      disabled: false,
    }
    if (s.statType) {
      filter.type = s.statType as StatFilter["type"]
    }
    return filter
  }

  // Expand filters: when statType is null, duplicate for all types
  // CRITICAL: PoE API uses type-prefixed IDs (explicit.stat_XXX), not a "type" field.
  // We must rebuild the stat ID with the correct type prefix for each variant.
  // Also filters out type variants whose ID doesn't exist in the stats API.
  const expandFilters = (filters: StatFilter[], originalIntents: { statType?: string | null }[]): StatFilter[] => {
    // Build a set of valid stat IDs for fast lookup
    const validIds = new Set(stats.map(s => s.id))
    const result: StatFilter[] = []
    for (let i = 0; i < filters.length; i++) {
      const f = filters[i]
      const intent = originalIntents[i]
      if (!intent?.statType) {
        // Extract numeric stat ID from the prefix, then rebuild for each type
        const idParts = String(f.id).split(".")
        const numericId = idParts.length > 1 ? idParts.slice(1).join(".") : idParts[0]
        for (const t of ALL_STAT_TYPES) {
          const typedId = t + "." + numericId
          if (validIds.has(typedId)) {
            result.push({ ...f, id: typedId, type: t })
          }
        }
      } else {
        result.push(f)
      }
    }
    return result
  }

  // Check if a stat intent needs expansion (statType is null)
  const needsExpansion = (intent: { statType?: string | null }): boolean => !intent.statType

  // Flat stats → process individually
  // Expanded (null statType) → COUNT group (min=1, "any type")
  // Non-expanded → AND group
  if (intent.stats?.length) {
    const andFilters: StatFilter[] = []
    for (let i = 0; i < intent.stats.length; i++) {
      const s = intent.stats[i]
      const f = toFilter(s)
      if (!f) continue
      if (needsExpansion(s)) {
        // statType null with min/max → WEIGHT group (sum across types)
        // statType null without bounds → COUNT group (min=1, any type matches)
        const variants = expandFilters([f], [s])
        if (!variants.length) continue
        if (s.min != null || s.max != null) {
          // Weight group: strip individual filter values, constraint is on group level
          const strippedVariants = variants.map(v => ({ ...v, value: {} }))
          statGroups.push({ type: "weight", filters: strippedVariants, value: { min: s.min ?? undefined, max: s.max ?? undefined } })
        } else {
          statGroups.push({ type: "count", filters: variants, value: { min: 1 } })
        }
      } else {
        andFilters.push(f)
      }
    }
    if (andFilters.length) {
      statGroups.push({ type: "and", filters: andFilters })
    }
  }

  // statGroups → additional group logic (weight/count/not) — coexists with flat stats
  if (intent.statGroups?.length) {
    for (const group of intent.statGroups) {
      const filters = group.filters.map(toFilter).filter(Boolean) as StatFilter[]
      const expanded = expandFilters(filters, group.filters)
      if (expanded.length) {
        statGroups.push({
          type: group.type as StatGroup["type"],
          filters: expanded,
          value: (group.value?.min != null || group.value?.max != null)
            ? { min: group.value.min, max: group.value.max }
            : undefined,
        })
      }
    }
  }

  // Human-readable type → API category ID
  const TYPE_TO_CATEGORY: Record<string, string> = {
    "Ring": "accessory.ring",
    "Amulet": "accessory.amulet",
    "Belt": "accessory.belt",
    "Boots": "armour.boots",
    "Gloves": "armour.gloves",
    "Helmet": "armour.helmet",
    "Body Armour": "armour.chest",
    "Shield": "armour.shield",
    "Quiver": "armour.quiver",
    "Focus": "armour.focus",
    "Claw": "weapon.claw",
    "Dagger": "weapon.dagger",
    "One Handed Sword": "weapon.onesword",
    "One Handed Axe": "weapon.oneaxe",
    "One Handed Mace": "weapon.onemace",
    "Spear": "weapon.spear",
    "Flail": "weapon.flail",
    "Two Handed Sword": "weapon.twosword",
    "Two Handed Axe": "weapon.twoaxe",
    "Two Handed Mace": "weapon.twomace",
    "Quarterstaff": "weapon.warstaff",
    "Bow": "weapon.bow",
    "Crossbow": "weapon.crossbow",
    "Wand": "weapon.wand",
    "Sceptre": "weapon.sceptre",
    "Staff": "weapon.staff",
    "Life Flask": "flask.life",
    "Mana Flask": "flask.mana",
    "Flask": "flask",
    "Jewel": "jewel",
    "Waystone": "map.waystone",
    "Tablet": "map.tablet",
    "Rune": "currency.rune",
    "Soul Core": "currency.soulcore",
    "Skill Gem": "gem.activegem",
    "Support Gem": "gem.supportgem",
  }

  const query: TradeSearchQuery = {
    query: {
      status: { option: intent.status || "online" },
      stats: statGroups,
      filters: {},
    },
    sort: intent.sort === "price-desc" ? { price: "desc" } : { price: "asc" },
  }

  // Item Category (type_filters.category)
  // Collect all type_filters into one object
  const typeFilterEntries: Record<string, unknown> = {}

  if (intent.type) {
    const categoryId = TYPE_TO_CATEGORY[intent.type]
    if (categoryId) {
      typeFilterEntries.category = { option: categoryId }
    }
  }
  if (intent.rarity) {
    typeFilterEntries.rarity = { option: intent.rarity }
  }
  if (intent.ilvl) {
    typeFilterEntries.ilvl = {}
    if (intent.ilvl.min != null) (typeFilterEntries.ilvl as Record<string, number>).min = intent.ilvl.min
    if (intent.ilvl.max != null) (typeFilterEntries.ilvl as Record<string, number>).max = intent.ilvl.max
  }
  if (intent.quality) {
    typeFilterEntries.quality = {}
    if (intent.quality.min != null) (typeFilterEntries.quality as Record<string, number>).min = intent.quality.min
    if (intent.quality.max != null) (typeFilterEntries.quality as Record<string, number>).max = intent.quality.max
  }

  if (Object.keys(typeFilterEntries).length) {
    query.query.filters = {
      ...query.query.filters,
      type_filters: { filters: typeFilterEntries },
    }
  }

  // Equipment Filters (armour, DPS, rune_sockets, etc.)
  if (intent.equipment?.length || intent.runeSockets) {
    const eqFilters: Record<string, { min?: number; max?: number }> = {}
    for (const eq of intent.equipment || []) {
      if (!eq.id) continue
      eqFilters[eq.id] = {}
      if (eq.min != null) eqFilters[eq.id].min = eq.min
      if (eq.max != null) eqFilters[eq.id].max = eq.max
    }
    if (intent.runeSockets) {
      eqFilters.rune_sockets = {}
      if (intent.runeSockets.min != null) eqFilters.rune_sockets.min = intent.runeSockets.min
      if (intent.runeSockets.max != null) eqFilters.rune_sockets.max = intent.runeSockets.max
    }
    if (Object.keys(eqFilters).length) {
      query.query.filters = {
        ...query.query.filters,
        equipment_filters: { filters: eqFilters },
      }
    }
  }

  // Requirements (level, str, dex, int)
  if (intent.req?.length) {
    const reqFilters: Record<string, { min?: number; max?: number }> = {}
    for (const r of intent.req) {
      if (!r.id) continue
      reqFilters[r.id] = {}
      if (r.min != null) reqFilters[r.id].min = r.min
      if (r.max != null) reqFilters[r.id].max = r.max
    }
    if (Object.keys(reqFilters).length) {
      query.query.filters = {
        ...query.query.filters,
        req_filters: { filters: reqFilters },
      }
    }
  }

  if (intent.name) {
    query.query.name = intent.name
  }

  // Trade Filters (price, saleType, listed, etc.)
  if (intent.price?.currency || intent.saleType || intent.listed || intent.sellerAccount || intent.collapse != null || intent.goldFee) {
    const tradeObj: Record<string, unknown> = {}
    if (intent.price?.currency) {
      tradeObj.price = {
        min: intent.price.min ?? undefined,
        max: intent.price.max ?? undefined,
        option: intent.price.currency,
      }
    }
    if (intent.saleType) {
      tradeObj.sale_type = { option: intent.saleType === "priced" ? null : intent.saleType }
    }
    if (intent.listed) {
      tradeObj.indexed = { option: intent.listed }
    }
    if (intent.sellerAccount) {
      tradeObj.account = { input: intent.sellerAccount }
    }
    if (intent.collapse != null) {
      tradeObj.collapse = { option: intent.collapse ? "true" : null }
    }
    if (intent.goldFee) {
      tradeObj.fee = {}
      if (intent.goldFee.min != null) (tradeObj.fee as Record<string, number>).min = intent.goldFee.min
      if (intent.goldFee.max != null) (tradeObj.fee as Record<string, number>).max = intent.goldFee.max
    }
    query.query.filters = {
      ...query.query.filters,
      trade_filters: { filters: tradeObj } as TradeSearchQuery["query"]["filters"]["trade_filters"],
    }
  }

  return query
}

async function callAiApi(
  userText: string,
  config: AiProviderConfig
): Promise<string> {
  if (!config.apiKey || config.apiKey.length < 3) {
    throw new Error("API Key 未设置或太短 — 请在 ⚙️ 设置中填写")
  }
  if (!config.apiUrl) {
    throw new Error("API URL 未设置 — 请在 ⚙️ 设置中填写")
  }

  const resp = await fetch(config.apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: AI_SYSTEM_PROMPT },
        { role: "user", content: userText },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    }),
  })

  if (!resp.ok) {
    const errText = await resp.text()
    // Don't leak API key or full auth config in errors
    const cleanErr = errText.slice(0, 200)
    console.error("[PoE2] AI API error:", resp.status, cleanErr)
    throw new Error(`AI API 返回 ${resp.status}: ${cleanErr}`)
  }

  const data = await resp.json()
  return data.choices?.[0]?.message?.content || ""
}

// ---- Affix Translation Cache ----

const TRANSLATION_CACHE = new Map<string, string>()

// Common PoE stat translations (static fallback)
const STATIC_TRANSLATIONS: Record<string, string> = {
  "to maximum Life": "最大生命",
  "to maximum Mana": "最大魔力",
  "to maximum Energy Shield": "最大能量护盾",
  "to Strength": "力量",
  "to Dexterity": "敏捷",
  "to Intelligence": "智慧",
  "to all Attributes": "全属性",
  "to Fire Resistance": "火焰抗性",
  "to Cold Resistance": "冰冷抗性",
  "to Lightning Resistance": "闪电抗性",
  "to Chaos Resistance": "混沌抗性",
  "to all Elemental Resistances": "全元素抗性",
  "increased Rarity of Items found": "物品稀有度提高",
  "increased Movement Speed": "移动速度提高",
  "increased Attack Speed": "攻击速度提高",
  "increased Cast Speed": "施法速度提高",
  "to Spirit": "精魂",
  "physical damage": "物理伤害",
  "fire damage": "火焰伤害",
  "cold damage": "冰冷伤害",
  "lightning damage": "闪电伤害",
  "chaos damage": "混沌伤害",
  "adds": "附加",
  "increased": "提高",
  "reduced": "降低",
  "more": "更多",
  "less": "更少",
  "Critical Strike Chance": "暴击率",
  "Critical Hit Chance": "暴击率",
  "Critical Damage Bonus": "暴击伤害加成",
  "attack damage": "攻击伤害",
  "spell damage": "法术伤害",
  "elemental damage": "元素伤害",
  "minion damage": "召唤物伤害",
  "Armour": "护甲",
  "Evasion": "闪避",
  "Energy Shield": "能量护盾",
  "Life Regeneration": "生命回复",
  "Mana Regeneration": "魔力回复",
  "Life Recovery": "生命恢复",
  "stun recovery": "晕眩回复",
  "Block chance": "格挡率",
  "Spell Suppression": "法术压制",
  "chance to Suppress Spell Damage": "法术压制率",
}

function translateStatText(englishText: string): string {
  // Check cache first
  if (TRANSLATION_CACHE.has(englishText)) {
    return TRANSLATION_CACHE.get(englishText)!
  }

  // Apply static translations
  let result = englishText
  for (const [en, cn] of Object.entries(STATIC_TRANSLATIONS)) {
    result = result.replace(new RegExp(en, "gi"), cn)
  }

  // Clean up remaining patterns
  result = result
    .replace(/(\d+\.?\d*)/g, "$1") // keep numbers
    .replace(/^([+-]?\d+\.?\d*)\s*/, "$1 ") // normalize spacing after +/- numbers

  TRANSLATION_CACHE.set(englishText, result)
  return result
}

// ---- Message Handler ----

chrome.runtime.onMessage.addListener(
  (
    message: BgMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: BgResponse) => void
  ): boolean => {
    handleMessage(message).then(sendResponse).catch((err) => {
      sendResponse({ status: "error", error: String(err) })
    })
    return true // keep channel open for async
  }
)

async function handleMessage(msg: BgMessage): Promise<BgResponse> {
  switch (msg.type) {
    case "AI_SEARCH": {
      const settings = await getSettings()
      const raw = await callAiApi(msg.payload.text, settings.aiProvider)
      
      // Strip code fences and parse AI intent
      const clean = raw.replace(/```(?:json)?\s*/g, "").trim()
      let intent: AiIntent
      try {
        intent = JSON.parse(clean)
      } catch {
        return { status: "error", error: `Failed to parse AI response: ${raw.slice(0, 200)}` }
      }

      // Load stats and match locally
      const stats = await fetchStats()
      const query = buildTradeQuery(intent, stats)
      
      // Count matched vs unmatched across all stat groups
      const allFilters = query.query.stats?.flatMap(g => g.filters) || []
      const matched = allFilters.filter(f => !f.disabled).length
      
      // ---- Affix validation: enforce category constraints ----
      await loadAffixDb()
      const excluded: string[] = []
      if (intent.type) {
        for (const f of allFilters) {
          if (f.disabled) continue
          const statEntry = stats.find(s => s.id === f.id)
          if (statEntry?.text) {
            const result = validateStatForCategory(statEntry.text, intent.type)
            if (!result.valid) {
              f.disabled = true  // Remove from search
              excluded.push(statEntry.text)
            }
          }
        }
      }

      // ---- Dedup: if equipment filter covers ES/AR/EV, remove duplicate stats ----
      const ARMOUR_TYPES = ["Body Armour", "Helmet", "Boots", "Gloves"]
      const EQUIP_STAT_PATTERNS: Record<string, RegExp> = {
        es: /energy shield/i,
        ar: /armour(?!.*evasion)/i,
        ev: /evasion/i,
      }
      if (ARMOUR_TYPES.includes(intent.type || "") && intent.equipment?.length) {
        for (const eq of intent.equipment) {
          const pattern = EQUIP_STAT_PATTERNS[eq.id]
          if (!pattern) continue
          for (const f of allFilters) {
            if (f.disabled) continue
            const statEntry = stats.find(s => s.id === f.id)
            if (statEntry?.text && pattern.test(statEntry.text)) {
              f.disabled = true
              excluded.push(statEntry.text + " (已由装备属性覆盖)")
            }
          }
        }
      }
      
      // Collect all stat texts from groups or flat stats
      const allStatTexts = (
        intent.statGroups?.flatMap(g => g.filters) || intent.stats || []
      ).filter(s => s.text)
      const unmatched = allStatTexts.filter(s => {
        if (!s.text) return false
        return !fuzzyMatchStat(s.text, stats)
      })

      // Return both the built query and a user-friendly preview
      const RARITY_LABELS: Record<string, string> = {
        normal: "白装", magic: "蓝装", rare: "稀有", unique: "传奇", nonunique: "非传奇",
      }
      const SALE_TYPE_LABELS: Record<string, string> = {
        priced: "一口价", priced_with_info: "带备注价", unpriced: "无标价",
      }
      const LISTED_LABELS: Record<string, string> = {
        "1hour": "1小时内", "3hours": "3小时内", "12hours": "12小时内",
        "1day": "1天内", "3days": "3天内", "1week": "1周内",
        "2weeks": "2周内", "1month": "1月内", "2months": "2月内",
      }
      const REQ_LABELS: Record<string, string> = { lvl: "需求等级", str: "需求力量", dex: "需求敏捷", int: "需求智慧" }
      const equipmentLabels: Record<string, string> = {
        ar: "护甲", ev: "闪避", es: "能量护盾", block: "格挡率",
        spirit: "精魂", dps: "秒伤", pdps: "物理DPS", edps: "元素DPS",
        damage: "伤害", aps: "攻速", crit: "暴击率", reload_time: "装填时间",
      }

      const previewTags: string[] = []

      if (intent.rarity) previewTags.push(RARITY_LABELS[intent.rarity] || intent.rarity)
      if (intent.ilvl) {
        const r = intent.ilvl.min != null && intent.ilvl.max != null ? `${intent.ilvl.min}-${intent.ilvl.max}`
          : intent.ilvl.min != null ? `≥${intent.ilvl.min}` : `≤${intent.ilvl.max}`
        previewTags.push(`物品等级${r}`)
      }
      if (intent.quality) {
        const r = intent.quality.min != null ? `≥${intent.quality.min}` : `≤${intent.quality.max}`
        previewTags.push(`品质${r}`)
      }
      if (intent.runeSockets) {
        const r = intent.runeSockets.min != null ? `≥${intent.runeSockets.min}` : `≤${intent.runeSockets.max}`
        previewTags.push(`${r}孔`)
      }
      if (intent.req?.length) {
        for (const r of intent.req) {
          const label = REQ_LABELS[r.id] || r.id
          const v = r.min != null && r.max != null ? `${r.min}-${r.max}`
            : r.min != null ? `≥${r.min}` : `≤${r.max}`
          previewTags.push(`${label}${v}`)
        }
      }
      if (intent.saleType) previewTags.push(SALE_TYPE_LABELS[intent.saleType] || intent.saleType)
      if (intent.listed) previewTags.push(`上架${LISTED_LABELS[intent.listed] || intent.listed}`)
      if (intent.sellerAccount) previewTags.push(`卖家:${intent.sellerAccount}`)
      if (intent.goldFee) {
        const r = intent.goldFee.min != null && intent.goldFee.max != null ? `${intent.goldFee.min}-${intent.goldFee.max}`
          : intent.goldFee.min != null ? `≥${intent.goldFee.min}` : `≤${intent.goldFee.max}`
        previewTags.push(`金币费${r}`)
      }
      if (intent.price?.currency) {
        const currencyNames: Record<string, string> = { chaos: "c", divine: "d", exalted: "e" }
        const sym = currencyNames[intent.price.currency] || intent.price.currency
        const r = intent.price.min != null && intent.price.max != null ? `${intent.price.min}-${intent.price.max} ${sym}`
          : intent.price.min != null ? `≥${intent.price.min} ${sym}` : `≤${intent.price.max} ${sym}`
        previewTags.push(`💰 ${r}`)
      }

      const equipmentPreview = (intent.equipment || [])
        .filter(e => e.id)
        .map(e => {
          const label = equipmentLabels[e.id] || e.id
          const range = e.min != null && e.max != null ? `${e.min}-${e.max}` 
            : e.min != null ? `≥${e.min}` : `≤${e.max}`
          return `${label}${range}`
        })

      // ---- Translation: match stat IDs → English text → Chinese + type ----
      await loadDictionary()
      const allMatchedFilters = query.query.stats?.flatMap(g => g.filters).filter(f => !f.disabled) || []
      const translations: Record<string, string> = {}
      const statTypes: Record<string, string> = {}
      for (const f of allMatchedFilters) {
        const statEntry = stats.find(s => s.id === f.id)
        if (statEntry?.text) {
          const zh = translateEnToZh(statEntry.text)
          if (zh) {
            // Key by stat text + type so different types don't collapse
            const key = statEntry.text + (f.type ? "::" + f.type : "")
            translations[key] = zh
            if (f.type) statTypes[key] = f.type
          }
        }
      }

      // ---- Save search history ----
      const historyEntry: SearchHistoryEntry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        text: msg.payload.text,
        explanation: intent.explanation || "",
        type: intent.type || null,
        tags: previewTags,
        matched,
        timestamp: Date.now(),
      }
      try {
        const stored = await storageGet("searchHistory")
        const history: SearchHistoryEntry[] = stored.searchHistory || []
        history.unshift(historyEntry)
        // Keep last 50 entries
        if (history.length > 50) history.length = 50
        await storageSet({ searchHistory: history })
      } catch (e) {
        console.warn("[PoE2] Failed to save history:", e)
      }

      // Build stat group summary for display
      const statSummary: string[] = []
      for (const g of (intent.statGroups || [])) {
        const typeLabel = g.type === "count" ? "条数" : g.type === "weight" ? "总和" : g.type
        const parts: string[] = []
        if (g.value?.min != null) parts.push(`≥${g.value.min}`)
        if (g.value?.max != null) parts.push(`≤${g.value.max}`)
        statSummary.push(`${typeLabel}(${parts.join(",")})`)
      }

      return {
        status: "success",
        result: {
          query: query.query,
          sort: query.sort,
          explanation: intent.explanation || "",
          type: intent.type || null,
          equipment: equipmentPreview,
          tags: previewTags,
          matched,
          unmatched: unmatched.map(s => s.text),
          translations,
          statTypes,
          excluded,
          statSummary,
        },
      }
    }

    case "GET_STATS": {
      const stats = await fetchStats()
      return { status: "success", result: stats }
    }

    case "TRANSLATE_STAT": {
      const translated = translateStatText(msg.payload.statText)
      return { status: "success", result: translated }
    }

    case "EXECUTE_SEARCH": {
      const result = await executeSearch(msg.payload.query, msg.payload.league)
      return { status: "success", result }
    }

    case "FETCH_ITEMS": {
      const result = await fetchItems(msg.payload.hashes, msg.payload.searchId)
      return { status: "success", result }
    }

    case "GET_SETTINGS": {
      const settings = await getSettings()
      return { status: "success", result: settings }
    }

    case "SAVE_SETTINGS": {
      await saveSettings(msg.payload)
      // Verify immediately that it was persisted
      const verify = await getSettings()
      const keyOk = verify?.aiProvider?.apiKey === msg.payload?.aiProvider?.apiKey
      console.log("[PoE2] Settings saved. Verify:", keyOk ? "OK" : "MISMATCH",
        "saved_key_len=" + (msg.payload?.aiProvider?.apiKey?.length || 0),
        "read_key_len=" + (verify?.aiProvider?.apiKey?.length || 0))
      return { status: "success", result: verify }
    }

    case "TRANSLATE_BATCH": {
      await loadDictionary()
      const result: Record<string, string> = {}
      for (const text of msg.payload.texts) {
        const zh = translateEnToZh(text)
        if (zh) result[text] = zh
      }
      return { status: "success", result }
    }

    case "GET_HISTORY": {
      const stored = await storageGet("searchHistory")
      return { status: "success", result: stored.searchHistory || [] }
    }

    case "CLEAR_HISTORY": {
      await storageRemove("searchHistory")
      return { status: "success" }
    }

    default:
      return { status: "error", error: "Unknown message type" }
  }
}

// Initialize stats cache on install
chrome.runtime.onInstalled.addListener(() => {
  fetchStats().catch(() => {}) // warm cache
})

console.log("[PoE2 Trade Enhancer] Background worker ready")
