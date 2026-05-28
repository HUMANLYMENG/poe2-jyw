# PoE2 Trade Enhancer

AI-powered natural language search for Path of Exile 2 trade. Type Chinese, get API queries.

Chrome + Firefox browser extension. Built with [Plasmo](https://plasmo.com) + Vue 3.

## Features

- **Natural language → PoE2 trade API** — "T1电点伤戒指 生命80+ 词缀抗性加起来大于50" → live search
- **Smart equipment filters** — weapon damage, APS, crit, reload time, block, spirit, ES/armour/evasion auto-route to equipment_filters
- **Stat type detection** — explicit/implicit/enchant/fractured/desecrated/pseudo from keywords
- **Weight/count stat groups** — "任意抗性总和>59", "至少3条词缀"
- **CN↔EN page translation** — exact-match dict (9,529 entries) for PoE trade site
- **Mod tier labels** — T0/T1/T2 styled badges on item popups (gold/silver/bronze)
- **Multi-provider AI** — DeepSeek, OpenAI, MiniMax, custom endpoints

## Install

### Chrome
1. Download `poe2-trade-enhancer.zip`
2. Unzip
3. `chrome://extensions` → Developer mode → Load unpacked → select folder

### Firefox
1. Download `poe2-trade-enhancer-ff.zip`
2. Unzip
3. `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → select `manifest.json`

## Usage

Open the side panel on [PoE2 Trade](https://www.pathofexile.com/trade2/search/poe2/Standard). Type your query in Chinese and click 生成.

### Examples

| Query | What it does |
|-------|-------------|
| `T1电点伤的戒指 生命80+ 词缀抗性加起来大于50` | Ring with T1 lightning damage, 80+ life, weighted resistance sum |
| `弓 伤害大于200 暴击率大于9 投射物技能等级 至少3d` | Bow with damage>200, crit>9%, +projectile skills, min 3div |
| `猎首腰带` | Headhunter unique belt |
| `移速30%以上 鞋子` | Boots with 30%+ movement speed |

### Stat type keywords

| Say this | Searches |
|----------|---------|
| 词缀 / 词条 / T1~T9 | Explicit mods only |
| 基底 / 底子 / 自带 | Implicit mods only |
| 附魔 / 附魔词 | Enchants only |
| 固定 / 破裂 / 裂痕 | Fractured mods only |
| 模糊 / 任意来源 | All types (explicit + implicit + enchant + fractured + desecrated) |
| (nothing) | All types (same as 任意来源) |

### Equipment filters (auto-detected)

Equipment base stats go to equipment_filters automatically. Only say 词缀 to force stat search:

| Attribute | Equipment filter | Applies to |
|-----------|-----------------|-----------|
| 护甲/闪避/能量护盾 | ar / ev / es | Body Armour, Helmet, Boots, Gloves |
| 伤害/大伤 | damage | All weapons |
| 秒伤/DPS | dps | All weapons |
| 物理秒伤 | pdps | All weapons |
| 元素秒伤 | edps | All weapons |
| 攻速/武器速度 | aps | All weapons |
| 暴击率 | crit | All weapons |
| 装填时间 | reload_time | Crossbows |
| 格挡率 | block | Shields |
| 精魂 | spirit | All items |

### Price abbreviations

| Input | Currency |
|-------|----------|
| `50e` / `50ex` | 50 Exalted |
| `10d` / `10div` | 10 Divine |
| `100c` | 100 Chaos |

## Settings

Open the 设置 tab in the side panel:
- **API URL** — OpenAI-compatible endpoint (DeepSeek, OpenAI, MiniMax, custom)
- **API Key** — your provider key
- **Model** — model name (e.g. `deepseek-chat`, `MiniMax-M2.7`)
- **Show Chinese affixes** — toggle page translation
- **Show tier labels** — toggle T0/T1/T2 tier badges on item mods

## Project Structure

```
src/
├── background.ts          # AI prompt, PoE API proxy, stat matching, tier resolution
├── content.ts             # Content script entry — mounts Vue panel + injectors
├── content/
│   ├── affix-injector.ts  # Page translator — DOM scan → dict lookup → CN injection
│   └── tier-injector.ts   # Tier label enhancer — Px/Sx → T0/T1/T2 badges
├── components/
│   ├── AiSearch.vue       # AI search UI + history
│   ├── SidePanel.vue      # Panel container + help popover
│   └── SettingsPanel.vue  # Provider/model/settings form
├── types.ts               # Shared TypeScript types
└── data/                  # Reference data
public/
├── poe2_en_zh.json        # 9,529 en→zh dictionary
├── poe2_zh_en.json        # 9,187 zh→en dictionary
└── poe2-base-affixes.json # 14,744 affixes from poe2db.tw
```

## Build

```bash
bash build.sh         # Chrome MV3 → build/poe2-trade-enhancer.zip
bash build-ff.sh      # Firefox MV2 → build/poe2-trade-enhancer-ff.zip
```

## Data Sources

- **PoE2 Trade API** — live stats, filters, search, fetch
- **poe2db.tw** — affix tier data (crawled via Playwright)
- **编年史 / PoE Ninja / Mobalytics** — footer quick links

## License

MIT
