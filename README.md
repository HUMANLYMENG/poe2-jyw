# PoE2 Trade Enhancer（JYW）

AI 驱动的流放之路2市集自然语言搜索。输入中文，自动生成 API 查询。

Chrome + Firefox 浏览器扩展，基于 [Plasmo](https://plasmo.com) + Vue 3。

## 功能

- **中文 → PoE2 市集 API** — "T1电点伤戒指 生命80+ 抗性总和>50" → 实时搜索
- **智能装备过滤** — 武器伤害、攻速、暴击、装填时间、格挡率、精魂、护甲/闪避/护盾自动走 equipment_filters
- **词缀类型识别** — 从关键词识别 explicit/implicit/enchant/fractured/desecrated/pseudo
- **权重/计数筛选** — "任意抗性总和>59"、"至少3条词缀"
- **中英页面翻译** — 基于 9,529 条精确匹配字典翻译 PoE 市集页面
- **多模型支持** — DeepSeek、OpenAI、MiniMax、自定义 API

> ⚠️ T级词缀标签（T0/T1/T2 高亮）代码已实现但当前不工作，暂不推荐开启。

## 安装

从 [Releases](https://github.com/HUMANLYMENG/poe2-jyw/releases) 下载最新版本，或直接 clone 仓库取 `build/` 目录下的文件。

### Chrome
1. 下载 `poe2-trade-enhancer.zip`
2. 解压
3. `chrome://extensions` → 开启开发者模式 → 加载已解压的扩展 → 选择解压后的文件夹

### Firefox
1. Clone 仓库或下载源码，进入 `build/firefox-mv2-prod/` 目录
2. 地址栏输入 `about:debugging#/runtime/this-firefox`
3. 点击「临时载入附加组件」→ 选择 `build/firefox-mv2-prod/manifest.json`

> ⚠️ Firefox 正式版不支持永久安装未签名扩展，每次重启浏览器需重新加载。如需要永久安装，请使用 [Firefox Developer Edition](https://www.mozilla.org/firefox/developer/) 并将 `xpinstall.signatures.required` 设为 `false`。

## 使用

在 [PoE2 市集](https://www.pathofexile.com/trade2/search/poe2/Standard) 打开侧边栏，输入中文查询，点击 **生成搜索**。

### 搜索示例

| 输入 | 效果 |
|------|------|
| `T1电点伤的戒指 生命80+ 抗性总和大于50` | 戒指，T1 闪电点伤，80+ 生命，抗性权重和 |
| `弓 伤害大于200 暴击率大于9 投射物技能等级 至少3d` | 弓，伤害>200，暴击>9%，+投射物技能，最低 3div |
| `猎首腰带` | 猎首传奇腰带 |
| `移速30%以上 鞋子` | 鞋子，30%+ 移动速度 |
| `天赋珠宝 元素额外伤害 基底` | 珠宝，任意元素 gain as extra，implicit 词缀 |
| `法杖 物理伤害提高 施法速度 基底暴击率 词缀全域暴击率` | 法杖：inc 物伤 + 施速走装备过滤，基底暴击走 implicit，全域暴击走 explicit |
| `长杖 攻击格挡 法术格挡 伤害格挡` | 攻击格挡/法术格挡走装备过滤，伤害格挡走 explicit |
| `衣服 护盾 精魂 抗性` | 护盾走装备过滤，精魂走装备过滤，抗性走 explicit（仅抗性默认走词缀） |

### 词缀类型关键词

| 这么说 | 搜索范围 |
|--------|---------|
| 词缀 / 词条 / T1~T9 | 仅 explicit |
| 基底 / 底子 / 自带 | 仅 implicit |
| 附魔 / 附魔词 | 仅 enchant |
| 固定 / 破裂 / 裂痕 | 仅 fractured |
| 亵渎 / 不洁 | 仅 desecrated |
| 模糊 / 任意来源 | 全部类型（explicit + implicit + enchant + fractured + desecrated） |
| （不指定） | 默认全部类型（同上） |

### 装备属性过滤（自动识别）

装备底材属性自动走 equipment_filters，加"词缀"二字可强制走词缀搜索：

| 属性 | 过滤字段 | 适用装备 |
|------|---------|---------|
| 护甲/闪避/能量护盾 | ar / ev / es | 胸甲、头盔、鞋子、手套 |
| 伤害/大伤/小伤/元素伤 | damage | 全部武器 |
| 秒伤/DPS | dps | 全部武器 |
| 物理秒伤 | pdps | 全部武器 |
| 元素秒伤 | edps | 全部武器 |
| 攻速/武器速度 | aps | 全部武器 |
| 暴击率 | crit | 全部武器 |
| 装填时间 | reload_time | 弩 |
| 格挡率（攻击/法术格挡） | block | 盾牌 |
| 精魂 | spirit | 全部装备 |

### 价格简写

| 输入 | 通货 |
|------|------|
| `50e` / `50ex` | 50 崇高石 |
| `10d` / `10div` | 10 神圣石 |
| `100c` | 100 混沌石 |

## 设置

打开侧边栏的 **设置** 面板：

- **API 地址** — OpenAI 兼容的 API 端点（DeepSeek、OpenAI、MiniMax、自定义）
- **API Key** — 你的 API 密钥
- **模型** — 模型名称（如 `deepseek-chat`、`MiniMax-M2.7`）
- **显示中文词缀** — 开启/关闭页面翻译

## 项目结构

```
src/
├── background.ts          # AI 提示词、PoE API 代理、词缀匹配、T级解析
├── content.ts             # 内容脚本入口 — 挂载 Vue 面板 + 注入器
├── content/
│   ├── affix-injector.ts  # 页面翻译 — DOM 扫描 → 字典查找 → 中文注入
│   └── tier-injector.ts   # T级标签 — Px/Sx → T0/T1/T2 徽章
├── components/
│   ├── AiSearch.vue       # AI 搜索界面 + 历史记录
│   ├── SidePanel.vue      # 面板容器 + 帮助弹窗
│   └── SettingsPanel.vue  # 模型/API 设置表单
├── types.ts               # 共享 TypeScript 类型
└── data/                  # 参考数据
public/
├── poe2_en_zh.json        # 9,529 条 英→中 字典
├── poe2_zh_en.json        # 9,187 条 中→英 字典
└── poe2-base-affixes.json # 14,744 条词缀数据（来自 poe2db.tw）
```

## 构建

```bash
bash build.sh         # Chrome MV3 → build/poe2-trade-enhancer.zip
bash build-ff.sh      # Firefox MV2 → build/poe2-trade-enhancer-ff.zip
```

## 数据来源

- **PoE2 市集 API** — 实时 stats、filters、搜索、获取
- **poe2db.tw** — 词缀等级数据（通过 Playwright 爬取）
- **编年史 / PoE Ninja / Mobalytics** — 页脚快捷链接

## 许可证

MIT
