# 设计文档：晨光厨房 Sunlit Kitchen — 小程序全量视觉重排

- **日期**：2026-08-17
- **基线 commit**：`038988e`（暗房晚宴版，保留作旧基线，可回滚）
- **流程**：superpowers architectural（brainstorming → spec → writing-plans → 实现 → review）
- **范围**：仅视觉层重排；功能、双人格、购物车、谁买单、收藏逻辑一行不动

---

## 1. 目标与非目标

### 目标
- 把「温暖情侣 2.0 / 暗房晚宴」小程序整体重做成新视觉语言 **晨光厨房 Sunlit Kitchen**。
- 气质：明亮、温柔、杂志编辑感（像周末早晨的厨房），与暗房晚宴（暗、压暗、金/铂）形成最大反差。
- 双人格改用**温度对比**：我🐱 = 暖赤陶，TA🐰 = 冷鼠尾草绿。
- 全 12 页 + 全局组件（悬浮药丸导航、购物车球、状态环）统一换肤。

### 非目标（明确不做）
- 不改任何业务逻辑：购物车按人拆分、谁买单（AA/我请/TA请）、🐱/🐰 切换、收藏、订单流。
- 不重构组件结构、不引入新依赖、不改路由、不改数据层（`CartContext.jsx` / `mockApi.js` / `favorites.js` 三文件保持原样）。
- 不做后端、不做真账号体系。

---

## 2. 设计语言（视觉系统）

### 2.1 调色板（Tailwind v4 `@theme` 语义变量）
| 语义 | 值 | 用途 |
|---|---|---|
| `--color-ink-900` | `#F7F3EC` | 主底（暖骨白） |
| `--color-ink-850` | `#EFE7DA` | 区块底（浅陶） |
| `--color-ink-800` | `#E4DACC` | 次级底 |
| `--color-bone` | `#2B2620` | 主文字（墨） |
| `--color-ash` | `#6B6155` | 次级文字 |
| `--color-mist` | `#9A9082` | 弱文字 / 占位 |
| `--color-clay` | `#C8683F` | 我🐱 暖（赤陶） |
| `--color-clay-soft` | `#E0A07E` | 我 浅 |
| `--color-sage` | `#7FA37A` | TA🐰 冷（鼠尾草绿） |
| `--color-sage-soft` | `#A9C4A4` | TA 浅 |
| `--color-caramel` | `#B5793F` | 中性暖强调（焦糖） |
| `--color-love` | `#D98C84` | 喜爱 / 删除（柔红） |
| `--color-danger` | `#C2543F` | 危险 / 删除强调 |
| `--color-glass` | `rgba(255,253,249,0.62)` | 浅色磨砂卡底 |
| `--color-glass-border` | `rgba(43,38,32,0.10)` | 浅色描边 |
| `--color-clay-gradient` | `linear-gradient(135deg,#E0A07E,#C8683F)` | 我 按钮/球 |
| `--color-sage-gradient` | `linear-gradient(135deg,#A9C4A4,#7FA37A)` | TA 按钮 |
| `--radius-card` | `28px` | 卡圆角 |
| `--radius-btn` | `16px` | 按钮圆角 |
| `--radius-ctl` | `12px` | 控件圆角 |
| `--font-serif` | `'Playfair Display','Noto Serif SC',serif` | 标题 |
| `--font-sans` | `'Noto Sans SC','Inter',system-ui,sans-serif` | 正文 |

> **历史变量名保留映射**：`--color-primary` → clay、`--color-secondary` → sage、`--color-cream` → 暖骨白、`--color-text` → 墨字、`--color-border` → 浅描边。这样未改写的页面仍能编译并自动套用浅色主题。

### 2.2 字体
- 标题：Playfair Display + Noto Serif SC（衬线，大字号、letter-spacing 收紧）
- 正文：Noto Sans SC + Inter
- 通过 Google Fonts CDN 引入，带 system 字体回退

### 2.3 质感与图像
- 柔光而非高反差；大圆角（卡 28 / 按钮 16）；低透明度暖灰轻投影（`0 8px 24px rgba(43,38,32,0.08)`）
- icon 圆润描边、手绘感
- **全屏美食 hero**：保留，但改为明亮调——Unsplash 明亮食物图 + 暖色提亮叠层（不再压暗），保证文字在浅底上可读（顶部加浅渐隐遮罩或底部浅色玻璃条）

### 2.4 双人格表达
- 我🐱 → 赤陶 `#C8683F`（暖）；TA🐰 → 鼠尾草绿 `#7FA37A`（冷）
- 头像：`avatar-me`（赤陶渐变 + 暖光晕）/ `avatar-partner`（鼠尾草绿渐变 + 冷光晕）
- 购物车按人双栏：`glass-me`（赤陶发丝边）/ `glass-partner`（鼠尾草绿发丝边）
- 谁买单三态：AA = 中性焦糖边 / 我请 = 赤陶边 / TA请 = 鼠尾草绿边

---

## 3. 架构与改造清单（仅视觉层）

### 3.1 全局主题
- `src/index.css`：重写 `@theme` 为晨光调色板（§2.1）；新增 `.glass` / `.glass-elevated` / `.glass-me` / `.glass-partner` 浅色磨砂样式 + `@supports not (backdrop-filter)` 回退实色浅卡；`.avatar-me` / `.avatar-partner`；`.glow-clay` / `.glow-sage`；`.section-title`（衬线 + 赤陶渐变下划线）；`body` 背景改为暖骨白径向渐变；保留 `prefers-reduced-motion` 关闭块。

### 3.2 单一真源
- `src/theme/persona.js`：PERSONA.me.color/clay、.partner.color/sage；ORDER_STATUS（待处理=`--color-mist` 中性灰 / 制作中=`--color-clay` 暖赤陶 / 已完成=`--color-sage` 鼠尾草绿-success）；PAYER（aa=焦糖 / me=赤陶 / partner=鼠尾草绿）。新增 `personaOf / orderStatusOf / payerOf` 保持不变。
- `src/theme/images.js`：HERO_IMAGES 改为明亮食物图（或叠层提亮）；保留三级降级（Unsplash → 本地 webp → 暖色渐变占位）。

### 3.3 布局原语（重做）
- `FullBleedHero`：明亮叠层（提亮 + 浅渐隐），不再 `brightness(0.42)` 压暗；`variant="functional"` 改为极淡模糊 + 浅遮罩。
- `GlassCard`：浅色磨砂 + 入场动效（`cardEntrance`）。
- `FloatingPillNav`：浅色玻璃药丸，激活态赤陶渐变 + 暖光晕。

### 3.4 应用壳
- `App.jsx`：环境光晕改为赤陶（左）/ 鼠尾草绿（右）低透明度；背景 `--color-ink-900`（暖骨白）；`{!isAdmin && <FloatingPillNav/>}`、`{!isAdmin && <D3CartOrb/>}`；PageLoader 改为 clay。
- `Header.jsx`：浅色渐变玻璃条，`bg rgba(247,243,236,0.74)→transparent`，标题墨字，赤陶下划线。

### 3.5 12 个页面（换肤，逻辑不动）
Home / Menu / DishDetail / Favorites / MyOrders / OrderDetail / Profile / Cart / Checkout / Admin / AdminDishes / AdminOrders —— 各自替换暗色硬编码为 persona.js 取值；价格改 clay-soft、喜爱改 love、状态 chip 走 ORDER_STATUS；购物车双栏、谁买单三态、🐱/🐰 切换、状态环均保持原语义，仅材质/光色更新。

### 3.6 D3 组件换肤（仅材质/光/色，3D 逻辑不动）
- `D3CartOrb`：赤陶渐变球（原金球）
- `D3FlipCard`：背面浅色玻璃（原白→米白）
- `D3StatusRing`：环色由 `config.ring` 驱动（ORDER_STATUS 配色）
- `AddDishModal`：浅色玻璃上滑
- `KissIcon`：love 填充（已是 currentColor，调用处传 `text-[var(--color-love)]`）

### 3.7 不可变文件（严禁改动）
`src/context/CartContext.jsx`（或同等路径）、`src/lib/mockApi.js`、`src/lib/favorites.js` —— 业务与双人格逻辑零改动。

---

## 4. 数据流与不变式

- 所有业务状态仍经 `useCart()` 与 `persona.js` 读取；页面不得硬编码赤陶/鼠尾草绿 hex。
- **颜色唯一真源规则**：双人格/状态/谁买单配色仅定义于 `persona.js` 与 `index.css`；其余文件引用变量或 `PERSONA[*].color`，不得出现 `#C8683F`/`#7FA37A` 等字面量（grep 校验）。
- 购物车拆分、谁买单、🐱/🐰、收藏的 render 逻辑保持原样，仅改 className / 颜色来源。

---

## 5. 降级与无障碍

- `prefers-reduced-motion: reduce`：关闭 KenBurns / 入场位移 / 光晕脉冲。
- `backdrop-filter` 不支持：`@supports not (backdrop-filter)` 回退实色浅卡 `rgba(255,253,249,0.92)`。
- 正文对比度：墨字 `#2B2620` on 暖骨白 `#F7F3EC` 满足 WCAG AA。
- hero 图加载失败三级降级，文字/卡片始终可读。

---

## 6. 验收标准（IS_PASS）

- `npm run build` → **0 error**（12 页 chunk 全出）
- `npx oxlint` → **0 error**（允许既有的 2 个 warning：其一在不可变 `CartContext.jsx`，其一 `exhaustive-deps`）
- 旧暗色 hex（`#0E0C0A` / `#E6B25A` / `#C2C7D2` / `#F0CE92` / `#DDE0E8` 等）全仓 grep **零残留**
- 双人格/状态/谁买单配色 hex 除 `persona.js` 与 `index.css` 外 **零硬编码**
- **12/12 页可用**，**0 逻辑砍**（购物车/双人格/谁买单/收藏流程完整）
- 提交：在 `038988e` 之上新 commit（旧基线保留可回滚）

---

## 7. 风险与对策
- **浅底可读性**：hero 明亮图可能导致文字看不清 → 顶部浅渐隐遮罩 + 浅色玻璃信息条兜底。
- **配色漂移**：严格 persona.js 单一真源 + grep 校验。
- **动效性能**：仅保留必要 Framer Motion 入场，reduced-motion 全关。
- **回滚**：旧版 `038988e` 不动，新提交叠加其上，可 `git revert` 回暗房晚宴。
