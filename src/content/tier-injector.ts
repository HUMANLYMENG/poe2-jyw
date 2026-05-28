// ============================================================
// Tier label enhancer — styles Px/Sx labels when tier is T1/T2
// ============================================================

let tierLabelsEnabled = true
const processedMods = new WeakSet<HTMLElement>()

// ---- Init ----

export function initTierLabels(): void {
  chrome.storage?.local?.get("settings").then((result: any) => {
    if (result?.settings?.showTierLabels === false) {
      tierLabelsEnabled = false
      return
    }
    startTierObserver()
  }).catch(() => startTierObserver())
}

// ---- Watch for item popups ----

function startTierObserver(): void {
  // PoE trade page uses React with hashed class names — watch broadly
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (!(node instanceof HTMLElement)) continue
        // Check if this looks like an item popup (has mod-like content with Px/Sx)
        if (node.textContent && /[PS]\d/.test(node.textContent)) {
          setTimeout(() => injectTierEnhancements(node), 300)
        }
      }
    }
  })

  observer.observe(document.body, { childList: true, subtree: true })
  
  // Also run on initial page load (search results)
  setTimeout(() => injectTierEnhancements(document.body), 2000)
  setTimeout(() => injectTierEnhancements(document.body), 5000)
}

// ---- Scan for mods with Px/Sx labels ----

interface ModToResolve {
  el: HTMLElement
  fullText: string       // complete mod text
  labelNode: ChildNode   // the text node containing Px/Sx
  labelText: string      // "P2", "S4", etc.
  labelOffset: number    // start position of label in textContent
}

async function injectTierEnhancements(root: HTMLElement): Promise<void> {
  if (!tierLabelsEnabled) return

  const modsToResolve: ModToResolve[] = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)

  while (walker.nextNode()) {
    const node = walker.currentNode as Text
    const text = node.textContent || ""
    
    // Match Px or Sx anywhere in the text (not just standalone)
    const match = text.match(/([PS]\d+)/)
    if (!match) continue

    const parent = node.parentElement
    if (!parent || processedMods.has(parent)) continue

    // Get the full mod text — prefer English original from title attribute
    // Walk up the DOM tree to find a title (may be on ancestor, not direct parent)
    let englishText: string | null = null
    let el: HTMLElement | null = parent
    while (el) {
      const title = el.getAttribute("title")
      if (title) { englishText = title; break }
      el = el.parentElement
    }
    // Fall back to textContent if no title found
    englishText = englishText || (parent.closest("[title]") as HTMLElement)?.getAttribute("title") || null
    const fullText = englishText || (parent.textContent || "").trim()
    if (!fullText) continue

    processedMods.add(parent)
    modsToResolve.push({
      el: parent,
      fullText,
      labelNode: node,
      labelText: match[1],
      labelOffset: match.index || 0,
    })
  }

  if (!modsToResolve.length) return

  // Batch resolve tiers via background
  try {
    const resp = await chrome.runtime.sendMessage({
      type: "RESOLVE_MOD_TIERS",
      payload: {
        mods: modsToResolve.map(m => ({ text: m.fullText }))
      }
    })

    if (resp.status !== "success" || !resp.result) return
    const tierResults: Record<number, { tier: number; label: string } | null> = resp.result

    // Apply styling for T1/T2 tiers
    for (let i = 0; i < modsToResolve.length; i++) {
      const { el, labelNode, labelText, labelOffset } = modsToResolve[i]
      const result = tierResults[i]
      if (!result) continue

      applyTierStyle(el, labelNode, labelText, labelOffset, result.tier)
    }
  } catch {
    // Background might not be ready
  }
}

// ---- Apply gold/silver styling for T1/T2 ----

function applyTierStyle(
  el: HTMLElement,
  labelNode: ChildNode,
  labelText: string,
  labelOffset: number,
  tier: number
): void {
  if (tier > 2 || tier < 0) return  // only T0, T1, T2 get styled

  const textNode = labelNode as Text
  const len = labelText.length

  // Split the text node: "xxxP2 yyy" → "xxx" + "P2" + " yyy"
  const afterLabel = textNode.splitText(labelOffset + len)
  const labelOnly = textNode.splitText(labelOffset)

  // Wrap the label portion in a styled span
  const labelSpan = document.createElement("span")
  labelSpan.className = `poe2te-tier-badge poe2te-tier-T${tier}`
  labelSpan.textContent = labelOnly.textContent || labelText

  // Replace the label text node with our styled span
  const parent = labelOnly.parentNode
  if (parent) {
    parent.replaceChild(labelSpan, labelOnly)
  }
}
