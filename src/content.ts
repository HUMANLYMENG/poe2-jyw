// ============================================================
// Content Script Entry Point
// Injects the Vue side panel into the PoE trade page
// ============================================================

import { createApp } from "vue"
import SidePanel from "./components/SidePanel.vue"
import { initPageTranslator } from "./content/affix-injector"
import { initTierLabels } from "./content/tier-injector"

// ---- Plasmo config (must be at top level) ----
export const config = {
  matches: [
    "https://www.pathofexile.com/trade2/*",
    "https://www.pathofexile.com/trade/*",
  ],
}

// ---- Wait for trade page to be ready ----
function waitForTradeApp(timeoutMs = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const check = () => {
      const app = document.querySelector("#trade")
      if (app) {
        resolve()
      } else if (Date.now() - start > timeoutMs) {
        reject(new Error(`Trade page not found after ${timeoutMs}ms`))
      } else {
        setTimeout(check, 500)
      }
    }
    check()
  })
}

// ---- Inject CSS ----
function injectStyles() {
  // Always replace to pick up style changes across extension reloads
  const old = document.getElementById("poe2te-styles")
  if (old) old.remove()
  const style = document.createElement("style")
  style.id = "poe2te-styles"
  style.textContent = `
    #poe2te-root {
      position: fixed;
      top: 0;
      right: 0;
      height: 100vh;
      z-index: 99999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
    }

    #poe2te-root * {
      box-sizing: border-box;
    }

    /* Chinese affix overlay */
    .poe2te-cn-affix {
      display: inline-block;
      margin-left: 6px;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 11px;
      color: #7aa;
      background: rgba(120, 170, 170, 0.1);
      vertical-align: middle;
      white-space: nowrap;
    }

    .poe2te-tier-badge {
      display: inline-block;
      margin-right: 4px;
      padding: 0 6px;
      border-radius: 2px;
      font-size: 11px;
      font-weight: 700;
      vertical-align: middle;
      line-height: 1.6;
    }

    .poe2te-tier-T0 { background: linear-gradient(135deg, #ff6b35, #ffd700); color: #1a0a00; font-weight: 800; text-shadow: 0 0 4px rgba(255,215,0,0.5); }
    .poe2te-tier-T1 { background: #ffd700; color: #1a1a00; font-weight: 700; }
    .poe2te-tier-T2 { background: #8b7030; color: #fff; font-weight: 700; }
    .poe2te-tier-T3 { background: #6c4825; color: #c8aa6e; font-weight: 600; }
    .poe2te-tier-default { background: #3a2a10; color: #8a7a5a; font-weight: 500; }

    /* Translations for stat filter panel */
    .poe2te-stat-cn {
      color: #8ab;
      font-size: 11px;
      margin-left: 4px;
    }

    /* Side panel scrollbar */
    .poe2te-panel ::-webkit-scrollbar {
      width: 6px;
    }
    .poe2te-panel ::-webkit-scrollbar-thumb {
      background: #444;
      border-radius: 3px;
    }
    .poe2te-panel ::-webkit-scrollbar-track {
      background: #1a1a1a;
    }
  `
  document.head.appendChild(style)
}

// ---- Main Init ----
async function init() {
  console.log("[PoE2 Trade Enhancer] Initializing...")

  injectStyles()

  // Wait for the trade page to load
  await waitForTradeApp()
  console.log("[PoE2 Trade Enhancer] Trade page detected")

  // Create mounting point (prevent duplicates from SPA navigation)
  let root = document.getElementById("poe2te-root") as HTMLElement | null
  if (!root) {
    root = document.createElement("div")
    root.id = "poe2te-root"
    document.body.appendChild(root)
  }

  // Mount Vue app
  const app = createApp(SidePanel)
  app.mount(root)
  console.log("[PoE2 Trade Enhancer] Panel mounted")

  // Start page translation
  initPageTranslator()
  console.log("[PoE2 Trade Enhancer] Page translator started")

  // Start tier label injection
  initTierLabels()
  console.log("[PoE2 Trade Enhancer] Tier labels started")
}

// Start
init().catch(console.error)
