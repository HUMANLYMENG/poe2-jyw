# PoE2 Trade Enhancer

AI-powered Chrome extension for Path of Exile 2 trade site. Natural language search, CN↔EN translation, and more — all powered by **your own AI API**. No backend, no paywall, no data collection.

## Features (Phase 0-3)

### 🔍 AI Natural Language Search
Describe what you need in Chinese (or English), and AI converts it to a precise PoE2 trade search query.

```
"T1电点伤的戒指 生命80以上 抗性 价格5D以内"
→ { type: "Ring", stats: [...], price: { max: 5, option: "divine" } }
```

### 🌐 Chinese-English Translation
- Inline Chinese translations for every affix on search results
- Stat filter sidebar labels translated
- Static translation for 50+ common affixes, with AI fallback for unknowns

### ⚙️ Bring Your Own AI
- Supports any OpenAI-compatible API
- Built-in presets: **DeepSeek**, **OpenAI**, **oMLX (local)**
- Your API key stays in your browser, never sent anywhere else

## Quick Start

```bash
# Install
npm install

# Build
chmod +x build.sh
./build.sh

# Or directly:
npm run build
```

### Load in Chrome
1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `build/chrome-mv3-prod/`

### Configure AI API
1. Click the extensions puzzle icon → PoE2 Trade Enhancer
2. Or click the ⚙️ Settings tab in the side panel on any PoE trade page
3. Enter your AI API URL, key, and model
4. Click **Save**

### Use
Visit `https://www.pathofexile.com/trade2/search/poe2/Standard` and the side panel appears on the right.

## Project Structure

```
src/
├── content.ts              # Content script entry (injects Vue panel)
├── background.ts            # Background worker (AI API, PoE API, translation)
├── types.ts                 # Shared TypeScript types
├── components/
│   ├── SidePanel.vue         # Main panel with tab navigation
│   ├── AiSearch.vue          # AI search interface
│   └── SettingsPanel.vue     # API configuration
└── content/
    └── affix-injector.ts    # DOM injection for CN translations
```

## Tech Stack

- **Framework:** Plasmo (Chrome Extension)
- **UI:** Vue 3 + scoped CSS
- **Data:** chrome.storage.sync, IndexedDB (via idb)
- **APIs:** PoE official trade API (no login required), user's AI API

## Roadmap

- [x] Phase 0: Project scaffold
- [x] Phase 1: Side panel injection
- [x] Phase 2: AI natural language search
- [x] Phase 3: CN-EN affix translation
- [ ] Phase 4: Search word management (folders, import/export)
- [ ] Phase 5: Tier display and highlighting
- [ ] Phase 6: Aggregate dashboard (ECharts)
- [ ] Phase 7: Settings polish, one-click whisper

## License

MIT
