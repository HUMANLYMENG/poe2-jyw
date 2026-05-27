# PoE2 Trade Enhancer

## 安装步骤（Firefox）

1. 下载 `build/firefox-mv2-prod/` 整个文件夹
2. Firefox 地址栏输入 `about:debugging`
3. 左侧点「此 Firefox」
4. 点击「临时载入附加组件…」
5. 选择 `build/firefox-mv2-prod/manifest.json`
6. 打开 `https://www.pathofexile.com/trade2/search/poe2/Standard`
7. 右侧面板 → ⚙️ 设置 → 填入你的 AI API Key
8. 回到「AI 生成」tab，输入中文描述 → 点击「生成」

> 注意：临时载入的扩展在 Firefox 重启后会消失，需重新载入。

## TODO

### Tier-based affix value ranges
- [ ] Crawl poe2db.tw affix pages to extract tier → value range mappings
- [ ] Store as JSON: `{ statText: { T1: [min,max], T2: [min,max], ... } }`
- [ ] When user says "T2生命" or "T1电点伤", auto-populate min/max from tier data
- [ ] Integrate into AI prompt so AI outputs the correct min/max for tier references
