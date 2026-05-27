// ============================================================
// Page translator — injects Chinese translations into PoE trade page
// Scans ALL visible text nodes, no CSS class dependency
// ============================================================

let showChineseEnabled = true
let translatedTexts = new Set<string>()

// ---- Init ----

export function initPageTranslator(): void {
  chrome.storage?.local?.get("settings").then((result: any) => {
    if (result?.settings?.showChineseAffixes === false) {
      showChineseEnabled = false
    }
  }).catch(() => {})

  observeAndTranslate()
}

// ---- Watch for dynamic content ----

function observeAndTranslate(): void {
  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  const observer = new MutationObserver(() => {
    if (!showChineseEnabled) return
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      debounceTimer = null
      scanAndTranslate()
    }, 500)
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  window.addEventListener("beforeunload", () => observer.disconnect(), { once: true })

  // Initial run after page loads
  setTimeout(scanAndTranslate, 1500)
  setTimeout(scanAndTranslate, 4000)
}

// ---- Scan all leaf text nodes for translatable content ----

function isLikelyPoEStat(text: string): boolean {
  // Must contain letters
  if (!/[a-zA-Z]{3,}/.test(text)) return false
  
  // PoE stats typically have numbers, %, +, or keywords
  const hasNumbers = /[\d.]+/.test(text)
  const hasPercent = /%/.test(text)
  const hasPlus = /\+/.test(text)
  
  // PoE keywords
  const poeKeywords = /\b(damage|resistance|life|mana|shield|armour|evasion|attack|cast|speed|critical|chance|spell|elemental|fire|cold|lightning|chaos|physical|strength|dexterity|intelligence|spirit|rarity|leech|regen|block|stun|accuracy|projectile|area|minion|totem|curse|aura|warcry|bleed|poison|ignite|shock|freeze|chill)\b/i
  
  // Short labels that are UI elements
  const isShortLabel = text.length >= 2 && text.length <= 30 && /^[A-Z][a-z]+(\s[A-Z][a-z]+)*$/.test(text)
  
  return hasNumbers || hasPercent || hasPlus || poeKeywords.test(text) || isShortLabel
}

function scanAndTranslate(): void {
  if (!showChineseEnabled) return

  const textsToTranslate = new Set<string>()

  // Walk ALL leaf elements (no children or only text)
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Skip script, style, hidden elements
        const parent = node.parentElement
        if (!parent) return NodeFilter.FILTER_REJECT
        if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE' || parent.tagName === 'NOSCRIPT') return NodeFilter.FILTER_REJECT
        if (parent.hasAttribute('hidden') || parent.style.display === 'none' || parent.style.visibility === 'hidden') return NodeFilter.FILTER_REJECT
        // Skip if parent already has our translation
        if (parent.classList.contains('poe2te-cn-affix')) return NodeFilter.FILTER_REJECT
        return NodeFilter.FILTER_ACCEPT
      }
    }
  )

  const textNodes: Text[] = []
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text)
  }

  // Group adjacent text nodes by their parent element
  const parentTexts = new Map<Element, string>()
  
  for (const node of textNodes) {
    const parent = node.parentElement!
    const text = node.textContent || ""
    const existing = parentTexts.get(parent) || ""
    parentTexts.set(parent, existing + text)
  }

  // Filter for PoE-related texts
  for (const [parent, fullText] of parentTexts) {
    const text = fullText.trim()
    if (!text || text.length < 2) continue
    
    // Skip already translated
    if (translatedTexts.has(text)) continue
    
    if (isLikelyPoEStat(text)) {
      textsToTranslate.add(text)
    }
  }

  if (textsToTranslate.size === 0) return

  // Apply static UI translations first
  applyStaticTranslations(textsToTranslate)

  // Batch translate remaining via background
  const remaining = Array.from(textsToTranslate).filter(t => !UI_LABEL_TRANSLATIONS[t])
  if (remaining.length > 0) {
    batchTranslateAndApply(remaining)
  }
}

// ---- Static UI label translations ----

const UI_LABEL_TRANSLATIONS: Record<string, string> = {
  "Type Filters": "类型过滤器",
  "Weapon Filters": "武器过滤",
  "Armour Filters": "护甲过滤",
  "Socket Filters": "插槽过滤",
  "Trade Filters": "交易过滤",
  "Stat Filters": "状态过滤",
  "Item Filters": "物品过滤",
  "Misc Filters": "杂项过滤",
  "Requirements": "需求",
  "Properties": "属性",
  "Add Stat Filter": "增加状态过滤器",
  "Add Filter": "添加过滤",
  "Search Items": "查找物品",
  "Online": "在线",
  "Online Only": "仅在线",
  "Any": "任意",
  "And": "且",
  "Not": "非",
  "If": "若",
  "Count": "数量",
  "Weight": "权重",
  "Buyout Price": "一口价",
  "Min": "最小",
  "Max": "最大",
  "Category": "物品类型",
  "Rarity": "稀有度",
  "Item Level": "物品等级",
  "Quality": "品质",
  "Sockets": "插槽",
  "Links": "连接",
  "Corrupted": "已腐化",
  "Clear": "清除",
  "Reset": "重置",
  "Sort by": "排序",
  "Price": "价格",
  "Listed": "上架时间",
  "Seller": "卖家",
  "Status": "状态",
  "Reload Time": "装填时间",
  "Attack Speed": "攻击速度",
  "Critical Hit Chance": "暴击率",
  "Critical Damage Bonus": "暴击伤害加成",
  "Damage per Second": "每秒伤害",
  "Physical DPS": "物理秒伤",
  "Elemental DPS": "元素秒伤",
  "Armour": "护甲",
  "Evasion": "闪避",
  "Energy Shield": "能量护盾",
  "Block Chance": "格挡率",
  "Spirit": "精魂",
  "Equipment": "装备",
  "Flasks": "药剂",
  "Jewels": "珠宝",
  "Gems": "宝石",
  "Weapons": "武器",
  "Body Armours": "胸甲",
  "Helmets": "头部",
  "Gloves": "手套",
  "Boots": "鞋子",
  "Shields": "盾牌",
  "Amulets": "项链",
  "Rings": "戒指",
  "Belts": "腰带",
  "Quivers": "箭袋",
  "Foci": "法器",
  "Sceptres": "权杖",
  "Wands": "短杖",
  "Staves": "法杖",
  "Bows": "弓",
  "Crossbows": "弩",
  "Claws": "爪",
  "Daggers": "匕首",
  "One Hand Swords": "单手剑",
  "One Hand Axes": "单手斧",
  "One Hand Maces": "单手锤",
  "Two Hand Swords": "双手剑",
  "Two Hand Axes": "双手斧",
  "Two Hand Maces": "双手锤",
  "Spears": "长矛",
  "Flails": "连枷",
  "Warstaves": "长杖",
}

function applyStaticTranslations(texts: Set<string>): void {
  const result: Record<string, string> = {}
  for (const text of texts) {
    if (UI_LABEL_TRANSLATIONS[text]) {
      result[text] = UI_LABEL_TRANSLATIONS[text]
    }
  }
  if (Object.keys(result).length) {
    injectTranslations(result)
  }
}

// ---- Send to background and apply ----

async function batchTranslateAndApply(texts: string[]): Promise<void> {
  try {
    const resp = await chrome.runtime.sendMessage({
      type: "TRANSLATE_BATCH",
      payload: { texts },
    })

    if (resp.status !== "success" || !resp.result) return
    const translations: Record<string, string> = resp.result
    if (Object.keys(translations).length === 0) return

    injectTranslations(translations)
  } catch {
    // Background might not be ready
  }
}

// ---- Apply translations to DOM ----

function injectTranslations(translations: Record<string, string>): void {
  for (const [en, zh] of Object.entries(translations)) {
    if (translatedTexts.has(en)) continue
    translatedTexts.add(en)

    // Short labels (≤40 chars): replace textContent of matching elements directly
    if (en.length <= 40) {
      let found = false
      document.querySelectorAll("span, div, button, label, option, th, td, a, li, p, h1, h2, h3, h4, h5, h6").forEach((el) => {
        if (found) return // only replace first match
        const htmlEl = el as HTMLElement
        if (htmlEl.children.length > 0) return
        const text = (htmlEl.textContent || "").trim()
        if (text === en) {
          htmlEl.textContent = zh
          htmlEl.title = en
          found = true
        }
      })
      if (found) continue
    }

    // Longer text: find text nodes and append CN span
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      { acceptNode: () => NodeFilter.FILTER_ACCEPT }
    )

    while (walker.nextNode()) {
      const node = walker.currentNode as Text
      if (node.textContent?.trim() !== en) continue
      
      const parent = node.parentElement
      if (!parent) continue
      
      const span = document.createElement("span")
      span.className = "poe2te-cn-affix"
      span.textContent = " " + (zh.length > 50 ? zh.slice(0, 48) + "…" : zh)
      span.title = en
      parent.appendChild(span)
      break // only first match
    }
  }
}
