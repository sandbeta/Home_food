# 晨光厨房 Sunlit Kitchen 重排 · 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把现有小程序（暗房晚宴版，commit `038988e`）的整体视觉层从「暗房压暗」翻成「晨光厨房」——暖骨白底 + 赤陶(我🐱)/鼠尾草绿(TA🐰) 温度对比，明亮柔光、浅色磨砂卡；功能/双人格/购物车/谁买单/收藏逻辑一行不动。

**Architecture:** 仅替换视觉层：重映射 Tailwind v4 `@theme` 调色板 + 重写 `theme/persona.js` 双人格取值 + 重做 3 个布局原语 + 换肤 12 页与 D3 组件。沿用历史变量名（如 `--color-primary`）做值重映射以保证未改写页仍可编译。颜色唯一真源为 `persona.js` 与 `index.css`，全仓 grep 校验零硬编码。

**Tech Stack:** React 19 + Vite 8 + Tailwind v4（`@theme` tokens）+ React Router 7 + Framer Motion 12 + localStorage 模拟后端。Lint：`oxlint`。Node：托管版 22.22.2。

**Spec:** `docs/superpowers/specs/2026-08-17-sunlit-kitchen-reskin-design.md`（本计划逐条落实该 spec，执行者同时阅读 spec）

## Global Constraints

- 不可变文件零改动：`src/components/CartContext.jsx`、`src/lib/mockApi.js`、`src/lib/favorites.js`（业务逻辑/双人格状态/购物车拆分/谁买单/收藏）。
- 颜色唯一真源：`#C8683F`(赤陶) / `#7FA37A`(鼠尾草绿) / `#B5793F`(焦糖) / `#D98C84`(love) 等双人格与状态色仅允许出现在 `src/theme/persona.js` 与 `src/index.css`；其余文件一律引 `var(--color-*)` 或 `PERSONA[*].color`，不得出现字面量（grep 校验）。
- 旧暗色 hex 必须全仓零残留：`#0E0C0A` / `#16130F` / `#1E1A15` / `#E6B25A` / `#C2C7D2` / `#F0CE92` / `#DDE0E8` / `#9DB39A` / `#E8A6A0` / `#D7736B` / `#F5F1EA` / `#A89F92` / `#6E665C`。
- 保留 `prefers-reduced-motion` 全局关闭块；`backdrop-filter` 不支持时回退实色浅卡 `rgba(255,253,249,0.92)`。
- 字体经 Google Fonts CDN 引入（Playfair Display + Noto Serif SC + Noto Sans SC + Inter），带 system 回退；不新增依赖。
- 提交：在 `038988e` 之上逐任务 commit；旧基线保留可回滚。

---

## File Structure

**全局主题（重写）**
- `src/index.css` — `@theme` 重映射为晨光调色板；新增/改 `.glass`/`.glass-elevated`/`.glass-me`/`.glass-partner` 浅色磨砂；`.avatar-me`/`.avatar-partner`；`.glow-clay`/`.glow-sage`；`.section-title`；`body` 暖骨白径向渐变；保留 reduced-motion 块。

**单一真源（重写）**
- `src/theme/persona.js` — PERSONA.me=赤陶 / .partner=鼠尾草绿；ORDER_STATUS（待处理=中性灰 / 制作中=赤陶 / 已完成=鼠尾草绿）；PAYER（aa=焦糖 / me=赤陶 / partner=鼠尾草绿）。
- `src/theme/images.js` — HERO_IMAGES 改为明亮食物图（或叠层提亮）；保留三级降级。

**布局原语（重写）**
- `src/components/FullBleedHero.jsx` — 明亮叠层（提亮 + 浅渐隐），`variant="functional"` 极淡模糊 + 浅遮罩。
- `src/components/GlassCard.jsx` — 浅色磨砂 + `cardEntrance` 入场。
- `src/components/FloatingPillNav.jsx` — 浅色玻璃药丸，激活态赤陶渐变 + 暖光晕。

**应用壳（改）**
- `src/App.jsx` — 环境光晕赤陶(左)/鼠尾草绿(右)低透；背景 `--color-ink-900`；PageLoader 改 clay。
- `src/components/Header.jsx` — 浅色渐变玻璃条，标题墨字，赤陶下划线。

**12 页（换肤）**
- `src/pages/Home.jsx` `Menu.jsx` `DishDetail.jsx` `Favorites.jsx` `MyOrders.jsx` `OrderDetail.jsx` `Profile.jsx` `Cart.jsx` `Checkout.jsx` `Admin.jsx` `AdminDishes.jsx` `AdminOrders.jsx`

**D3 组件（换肤，3D 逻辑不动）**
- `src/components/D3CartOrb.jsx`（赤陶球）、`D3FlipCard.jsx`（浅色背面）、`D3StatusRing.jsx`（ring 由 `config.ring` 驱动）、`AddDishModal.jsx`（浅色上滑）、`KissIcon.jsx`（love 填充，已是 currentColor）

**不可变（勿碰）**
- `src/components/CartContext.jsx` `src/lib/mockApi.js` `src/lib/favorites.js`

---

## 验收套件（贯穿所有任务的"测试"）

本计划无单元测试；以"可构建 + 零硬编码 + 零旧色残留"作为回归测试。每完成一个任务，执行对应范围的 grep；全部任务完成后执行完整 IS_PASS 套件（见 Task 12）。

**局部校验（每个任务末步）示例：**
```bash
cd /c/Users/87374/WorkBuddy/2026-08-15-23-13-20/food-ordering-review/food-ordering-miniapp
export PATH="C:/Users/87374/.workbuddy/binaries/node/versions/22.22.2:$PATH"
# 确认本次改的文件里没有遗留旧暗色 hex
grep -rn -iE "#0E0C0A|#16130F|#1E1A15|#E6B25A|#C2C7D2|#F0CE92|#DDE0E8|#9DB39A|#E8A6A0|#D7736B|#F5F1EA|#A89F92|#6E665C" src/<本任务涉及文件> && echo "FAIL: 旧色残留" || echo "OK"
# 确认没有在 persona.js / index.css 以外的文件硬编码新双人格色
grep -rn -iE "#C8683F|#7FA37A|#B5793F|#D98C84|A9C4A4|E0A07E" src --include=*.jsx --include=*.js | grep -v "src/theme/persona.js" | grep -v "src/index.css" && echo "FAIL: 硬编码双人格色" || echo "OK"
```

---

### Task 1: 重写 `src/index.css` 为晨光调色板

**Files:**
- Modify: `src/index.css`（整文件 `@theme` 与玻璃/头像/辉光/section-title/body 背景段）

**Interfaces:**
- Consumes: spec §2.1 调色板表；历史变量名映射（§2.1 末段）
- Produces: 全局 CSS 变量、`.glass*`/`.avatar-*`/`.glow-*`/`.section-title` 类，供后续所有任务引用

- [ ] **Step 1: 写失败用例（先确认旧色当下存在）**
```bash
cd /c/Users/87374/WorkBuddy/2026-08-15-23-13-20/food-ordering-review/food-ordering-miniapp
grep -c "#0E0C0A" src/index.css   # 期望 >0（旧暗底存在，说明"测试"当前红）
```

- [ ] **Step 2: 重写 `@theme` 块（替换 §4-71 行内容为以下晨光值）**
保留结构，逐变量改值：
```css
@theme {
  --color-ink-900: #F7F3EC;   /* 主底 暖骨白 */
  --color-ink-850: #EFE7DA;   /* 区块底 浅陶 */
  --color-ink-800: #E4DACC;   /* 次级底 */

  --color-bone: #2B2620;      /* 主文字 墨 */
  --color-ash: #6B6155;       /* 次文字 */
  --color-mist: #9A9082;      /* 三级/占位 */

  --color-clay: #C8683F;      /* 我(me) 赤陶(暖) */
  --color-clay-soft: #E0A07E; /* 赤陶高光 */
  --color-sage: #7FA37A;      /* TA(partner) 鼠尾草绿(冷) */
  --color-sage-soft: #A9C4A4; /* 鼠尾草高光 */

  --color-caramel: #B5793F;   /* 中性暖强调 焦糖 */
  --color-love: #D98C84;      /* 喜爱/删除 柔红 */
  --color-danger: #C2543F;    /* 危险/删除强调 */

  --color-glass: rgba(255,253,249,0.62);
  --color-glass-border: rgba(43,38,32,0.10);

  --color-clay-gradient: linear-gradient(135deg, #E0A07E 0%, #C8683F 100%);
  --color-sage-gradient: linear-gradient(135deg, #A9C4A4 0%, #7FA37A 100%);

  --radius-card: 28px;
  --radius-btn: 16px;
  --radius-ctl: 12px;

  --font-serif: "Playfair Display", "Noto Serif SC", serif;
  --font-sans: "Noto Sans SC", "Inter", system-ui, sans-serif;

  /* 历史名重映射（向后兼容，只换值不换名） */
  --color-primary: #C8683F;
  --color-primary-light: rgba(200,104,63,0.14);
  --color-primary-dark: #9A4E2C;
  --color-peach: #E0A07E;
  --color-peach-light: rgba(224,160,126,0.16);
  --color-secondary: #7FA37A;
  --color-secondary-light: rgba(127,163,122,0.14);
  --color-haze: #7FA37A;
  --color-haze-light: rgba(127,163,122,0.14);
  --color-cream: #F7F3EC;            /* → 暖骨白 */
  --color-cream-dark: #EFE7DA;
  --color-card: #FFFDF9;
  --color-card-side: #EFE7DA;
  --color-surface: #FFFDF9;
  --color-text: #2B2620;
  --color-text-secondary: #6B6155;
  --color-text-tertiary: #9A9082;
  --color-border: rgba(43,38,32,0.10);
  --color-success: #7FA37A;
  --color-warning: #C8683F;
  --color-info: #7FA37A;
  --color-love: #D98C84;
  --color-primary-gradient: linear-gradient(135deg, #E0A07E 0%, #C8683F 100%);
}
```

- [ ] **Step 3: 改 `body`/背景（§78-101 行）为暖骨白径向渐变 + 浅 vignette**
```css
html, body {
  color: var(--color-text);
  background: radial-gradient(120% 80% at 50% 0%, #FBF8F2 0%, var(--color-ink-900) 55%, #EDE4D6 100%);
}
body::before {
  background: radial-gradient(130% 100% at 50% 40%, transparent 60%, rgba(43,38,32,0.06) 100%);
}
```

- [ ] **Step 4: 改玻璃系统（§138-160 行）为浅色**
`.glass` background→`var(--color-glass)`、border→`var(--color-glass-border)`；`@supports not` 回退→`rgba(255,253,249,0.92)`；`.d3-card-face` 同步；`.glass-me` 赤陶发丝边 `rgba(200,104,63,0.40)` + 浅赤陶渐变底；`.glass-partner` 鼠尾草绿发丝边 `rgba(127,163,122,0.40)` + 浅绿渐变底；`.glass-elevated` 阴影改 `rgba(43,38,32,0.10)`。

- [ ] **Step 5: 改头像/辉光/按钮（§180-292 行）**
`.d3-btn-primary` background→`var(--color-clay-gradient)`、color→`#FFFDF9`；`.avatar-me`→`linear-gradient(135deg,#E0A07E,#C8683F)` color `#FFFDF9`；`.avatar-partner`→`linear-gradient(135deg,#A9C4A4,#7FA37A)` color `#1A2417`；`.glow-gold`→`.glow-clay`（`rgba(200,104,63,...)`）、`.glow-platinum`→`.glow-sage`（`rgba(127,163,122,...)`）；`.pulse-glow-gold`→`.pulse-glow-clay`、`.pulse-glow-platinum`→`.pulse-glow-sage`；`.bg-warm`→浅陶渐变、`.bg-cool`→浅绿灰渐变；`.gradient-text-gold`/`.gradient-text`→`var(--color-clay-gradient)`；`.section-title` 下划线 `var(--color-clay-gradient)`；`.d3-input` 背景 `rgba(43,38,32,0.04)`、focus 边框 `rgba(200,104,63,0.55)`；`.d3-badge` 改赤陶系；`.soft-block` 背景 `rgba(43,38,32,0.04)`。
> 注意：`D3CartOrb`/`AdminDishes`/`AdminOrders` 等页面若仍引用 `.glow-gold`/`.glow-platinum` 旧类名，本任务一并新增别名类或直接改引用（见 Task 10/Task 9）。

- [ ] **Step 6: 保留 `prefers-reduced-motion` 块（§364-373）不变**

- [ ] **Step 7: 局部校验 + 构建**
```bash
grep -c "#0E0C0A" src/index.css && echo "FAIL" || echo "OK 旧暗底已移除"
export PATH="C:/Users/87374/.workbuddy/binaries/node/versions/22.22.2:$PATH"
npm run build 2>&1 | tail -4   # 期望 0 error
```

- [ ] **Step 8: Commit**
```bash
git add src/index.css
git commit -m "feat(theme): 晨光厨房调色板 — index.css 重映射"
```

---

### Task 2: 重写 `src/theme/persona.js` 双人格取值

**Files:**
- Modify: `src/theme/persona.js`（整文件内容）

**Interfaces:**
- Consumes: spec §2.1 / §3.2 配色
- Produces: `PERSONA`/`ORDER_STATUS`/`PAYER` 及其 `personaOf/orderStatusOf/payerOf`，供所有页面与组件引用

- [ ] **Step 1: 写失败用例**
```bash
grep -c "#E6B25A" src/theme/persona.js   # 期望 >0（旧金/铂色存在）
```

- [ ] **Step 2: 整体替换为晨光取值**
```js
// 晨光厨房 · 双人格语义唯一真源（我=赤陶暖 / TA=鼠尾草绿冷）
export const PERSONA = {
  me: {
    key: 'me', label: '我', emoji: '🐱',
    color: '#C8683F', colorSoft: '#E0A07E',
    gradient: 'linear-gradient(135deg, #E0A07E 0%, #C8683F 100%)',
    glassBorder: 'rgba(200,104,63,0.45)',
    glow: '0 0 0 3px rgba(200,104,63,0.18), 0 6px 20px rgba(200,104,63,0.22)',
    chipBg: 'rgba(200,104,63,0.14)', chipColor: '#C8683F',
  },
  partner: {
    key: 'partner', label: 'TA', emoji: '🐰',
    color: '#7FA37A', colorSoft: '#A9C4A4',
    gradient: 'linear-gradient(135deg, #A9C4A4 0%, #7FA37A 100%)',
    glassBorder: 'rgba(127,163,122,0.45)',
    glow: '0 0 0 3px rgba(127,163,122,0.18), 0 6px 20px rgba(127,163,122,0.22)',
    chipBg: 'rgba(127,163,122,0.14)', chipColor: '#7FA37A',
  },
}
export const ORDER_STATUS = {
  pending:   { text: '等着呢', emoji: '⏳', ring: ['#9A9082', '#9A9082'],
               chipBg: 'rgba(154,144,130,0.16)', chipColor: '#6B6155' },
  preparing: { text: '在做了', emoji: '👨‍🍳', ring: ['#C8683F', '#E0A07E'],
               chipBg: 'rgba(200,104,63,0.14)', chipColor: '#C8683F' },
  completed: { text: '做好啦', emoji: '🎉', ring: ['#7FA37A', '#A9C4A4'],
               chipBg: 'rgba(127,163,122,0.16)', chipColor: '#7FA37A' },
}
export const PAYER = {
  aa:       { label: 'AA',   emoji: '✌️', border: 'rgba(181,121,63,0.5)',  glow: '0 0 0 2px rgba(181,121,63,0.12)' },
  me:       { label: '我请', emoji: '🙋', border: 'rgba(200,104,63,0.6)',  glow: '0 0 0 3px rgba(200,104,63,0.20)' },
  partner:  { label: 'TA请', emoji: '💝', border: 'rgba(127,163,122,0.6)', glow: '0 0 0 3px rgba(127,163,122,0.20)' },
}
export const personaOf = (k) => PERSONA[k] || PERSONA.me
export const orderStatusOf = (k) => ORDER_STATUS[k] || ORDER_STATUS.pending
export const payerOf = (k) => PAYER[k] || PAYER.aa
```

- [ ] **Step 3: 校验无旧金/铂残留**
```bash
grep -c "#E6B25A\|#C2C7D2" src/theme/persona.js && echo "FAIL" || echo "OK"
```

- [ ] **Step 4: Commit**
```bash
git add src/theme/persona.js
git commit -m "feat(theme): 双人格/状态/谁买单取值翻为赤陶·鼠尾草绿"
```

---

### Task 3: 明亮 hero 图（images.js）

**Files:**
- Modify: `src/theme/images.js`（`HERO_IMAGES` 各 key 的 URL 改为明亮食物图；保留三级降级函数）

**Interfaces:**
- Consumes: 现有 `HERO_IMAGES`/`LOCAL_FALLBACKS`/`INK_PLACEHOLDER`/`heroFallback`/`resolveHero` 结构
- Produces: 供 `FullBleedHero` 与各页 `HERO_IMAGES[key]` 引用

- [ ] **Step 1: 将 `HERO_IMAGES` 的 Unsplash URL 换成**明亮调**食物图（query 偏向 bright/light/fresh，如 `bright-breakfast`, `fresh-salad`, `sunlit-kitchen`）；`INK_PLACEHOLDER` 改为暖骨白→浅陶渐变 `linear-gradient(135deg,#F7F3EC,#EFE7DA)`。
> 若原 URL 已可用，仅调整 `INK_PLACEHOLDER` 与叠层即可，不必换源。

- [ ] **Step 2: 确认降级链完好**（`resolveHero`/`heroFallback` 三级：Unsplash→本地 webp→暖色占位），不改逻辑。

- [ ] **Step 3: 构建验证**
```bash
export PATH="C:/Users/87374/.workbuddy/binaries/node/versions/22.22.2:$PATH"
npm run build 2>&1 | tail -3
```

- [ ] **Step 4: Commit**
```bash
git add src/theme/images.js
git commit -m "feat(theme): hero 图转明亮调 + 暖色占位降级"
```

---

### Task 4: 重写 3 个布局原语

**Files:**
- Modify: `src/components/FullBleedHero.jsx` `src/components/GlassCard.jsx` `src/components/FloatingPillNav.jsx`

**Interfaces:**
- Consumes: `src/theme/motion.js`（`cardEntrance`/`pageVariants`/`usePrefersReducedMotion`）、`PERSONA`/`personaOf`
- Produces: 各页共用的 `FullBleedHero`/`GlassCard`/`FloatingPillNav`

- [ ] **Step 1: `FullBleedHero` — 明亮叠层**
`variant="immersive"`：去掉 `brightness(0.42)` 压暗，改为 `brightness(1.04) saturate(1.05)` + 顶部 `linear-gradient(180deg, rgba(247,243,236,0.55) 0%, transparent 35%)` 浅渐隐遮罩，保证浅底文字可读；`variant="functional"`：`blur(14px) brightness(0.96)` + 浅遮罩 `rgba(247,243,236,0.5)`。KenBurns 在 reduced-motion 下关闭。

- [ ] **Step 2: `GlassCard` — 浅色磨砂**
`className` 默认含 `glass rounded-[var(--radius-card)]`；`boxShadow` 默认 `0 8px 24px rgba(43,38,32,0.08)`；入场沿用 `cardEntrance(delay)`。

- [ ] **Step 3: `FloatingPillNav` — 浅色药丸**
背景 `var(--color-glass)` + `border var(--color-glass-border)`；激活态 `layoutId="navGlow"` 用 `var(--color-clay-gradient)` + `boxShadow: 0 6px 18px rgba(200,104,63,0.28)`；非激活图标色 `var(--color-ash)`，激活 `var(--color-clay)`。

- [ ] **Step 4: 构建 + 局部 grep**
```bash
export PATH="C:/Users/87374/.workbuddy/binaries/node/versions/22.22.2:$PATH"
npm run build 2>&1 | tail -3
```

- [ ] **Step 5: Commit**
```bash
git add src/components/FullBleedHero.jsx src/components/GlassCard.jsx src/components/FloatingPillNav.jsx
git commit -m "feat(components): 晨光版 FullBleedHero/GlassCard/FloatingPillNav"
```

---

### Task 5: 应用壳 App + Header

**Files:**
- Modify: `src/App.jsx` `src/components/Header.jsx`

**Interfaces:**
- Consumes: `PERSONA`/`personaOf`、`.glass`、`.glow-clay`/`.glow-sage`
- Produces: 全站外壳视觉（光晕、背景、导航挂载、PageLoader）

- [ ] **Step 1: `App.jsx`** 环境光晕改赤陶(左)/鼠尾草绿(右)低透（`rgba(200,104,63,0.10)` / `rgba(127,163,122,0.10)`）；外壳 `bg-[var(--color-ink-900)]`、border `var(--color-glass-border)`；保留 `{!isAdmin && <FloatingPillNav/>}` 与 `{!isAdmin && <D3CartOrb/>}`；PageLoader 转圈色改 `var(--color-clay)`。

- [ ] **Step 2: `Header.jsx`** 渐变玻璃条 `background: linear-gradient(180deg, rgba(247,243,236,0.78) 0%, rgba(247,243,236,0) 100%)`、`backdrop-filter: blur(14px)`；标题 `var(--color-bone)` + 衬线；下划线 `from-[var(--color-clay-soft)] to-[var(--color-clay)]`；副标题 `var(--color-ash)`。

- [ ] **Step 3: 构建**
```bash
export PATH="C:/Users/87374/.workbuddy/binaries/node/versions/22.22.2:$PATH"
npm run build 2>&1 | tail -3
```

- [ ] **Step 4: Commit**
```bash
git add src/App.jsx src/components/Header.jsx
git commit -m "feat(shell): App/Header 晨光外壳 + 赤陶/鼠尾草光晕"
```

---

### Task 6: 沉浸型页 Home / Menu / DishDetail

**Files:**
- Modify: `src/pages/Home.jsx` `src/pages/Menu.jsx` `src/pages/DishDetail.jsx`

**Interfaces:**
- Consumes: `FullBleedHero`/`GlassCard`、`PERSONA`/`personaOf`、`HERO_IMAGES`、`useCart()`（保逻辑）
- Produces: 三个沉浸页视觉（逻辑不变）

- [ ] **Step 1: `Home.jsx`** `FullBleedHero src={HERO_IMAGES.home}`；价格改 `var(--color-clay)`；KissIcon 改 `text-[var(--color-love)]`；快捷入口/分类 chip 改 `.glass`；banner 改 `GlassCard`；移除任何 `#FF6B5B/#6C7FE0/#FFF8F2` 旧暖色（若有）；`whoAmI` 切换逻辑不变。

- [ ] **Step 2: `Menu.jsx`** `FullBleedHero src={HERO_IMAGES.menu}`；`WhoSelector` 激活态用 `avatar-me glow-clay` / `avatar-partner glow-sage`（来自 `PERSONA[opt.value]`）；`CATEGORY_CONFIG` 去彩虹色；`RecommendCard`→`GlassCard`；加购按钮 `var(--color-clay-gradient)`；底部 CTA 改用 `animate-pulse-glow-clay`。

- [ ] **Step 3: `DishDetail.jsx`** `FullBleedHero src={dish.image_url||HERO_IMAGES.dish}`；信息/数量/加购包 `GlassCard`；`const persona = PERSONA[whoAmI]`；`+` 按钮 `var(--color-clay-gradient)`；价格 `var(--color-clay-soft)`；KissIcon `text-[var(--color-love)]`。

- [ ] **Step 4: 局部 grep + 构建**
```bash
cd /c/Users/87374/WorkBuddy/2026-08-15-23-13-20/food-ordering-review/food-ordering-miniapp
export PATH="C:/Users/87374/.workbuddy/binaries/node/versions/22.22.2:$PATH"
grep -rn -iE "#FF6B5B|#6C7FE0|#FFF8F2|#E6B25A|#C2C7D2" src/pages/Home.jsx src/pages/Menu.jsx src/pages/DishDetail.jsx && echo "FAIL" || echo "OK"
npm run build 2>&1 | tail -3
```

- [ ] **Step 5: Commit**
```bash
git add src/pages/Home.jsx src/pages/Menu.jsx src/pages/DishDetail.jsx
git commit -m "feat(pages): Home/Menu/DishDetail 晨光换肤"
```

---

### Task 7: 沉浸型页 Favorites / MyOrders / OrderDetail

**Files:**
- Modify: `src/pages/Favorites.jsx` `src/pages/MyOrders.jsx` `src/pages/OrderDetail.jsx`

**Interfaces:**
- Consumes: `FullBleedHero`/`GlassCard`/`D3StatusRing`、`ORDER_STATUS`/`orderStatusOf`、`PERSONA`/`personaOf`、`useCart()`

- [ ] **Step 1: `Favorites.jsx`** `FullBleedHero src={HERO_IMAGES.favorites}`；菜图底浅渐变遮罩（保证可读）；价格 `var(--color-clay-soft)`；KissIcon `text-[var(--color-love)]`；移除按钮改 `var(--color-danger)`。收藏逻辑不变。

- [ ] **Step 2: `MyOrders.jsx`** 重建 `STATUS_MAP` 取自 `ORDER_STATUS`（bar=ring[1]）；状态 chip 用 `status.chipBg/chipColor`；头像 chip `avatar-me/avatar-partner`；价格 `var(--color-clay-soft)`、文字 `bone/ash`。

- [ ] **Step 3: `OrderDetail.jsx`** `FullBleedHero src={HERO_IMAGES.order}`；`STATUS_MAP` 取自 `ORDER_STATUS`(+emoji/desc)；`D3StatusRing config={{ring: status.ring}}`；各块 `GlassCard`；谁买单标签 `PAYER[order.payer]`；note 卡、合计 `var(--color-clay-soft)`。

- [ ] **Step 4: 局部 grep + 构建**
```bash
export PATH="C:/Users/87374/.workbuddy/binaries/node/versions/22.22.2:$PATH"
grep -rn -iE "#E6B25A|#C2C7D2|#9DB39A" src/pages/Favorites.jsx src/pages/MyOrders.jsx src/pages/OrderDetail.jsx && echo "FAIL" || echo "OK"
npm run build 2>&1 | tail -3
```

- [ ] **Step 5: Commit**
```bash
git add src/pages/Favorites.jsx src/pages/MyOrders.jsx src/pages/OrderDetail.jsx
git commit -m "feat(pages): Favorites/MyOrders/OrderDetail 晨光换肤"
```

---

### Task 8: 功能型页 Profile / Cart / Checkout

**Files:**
- Modify: `src/pages/Profile.jsx` `src/pages/Cart.jsx` `src/pages/Checkout.jsx`

**Interfaces:**
- Consumes: `FullBleedHero`/`GlassCard`、`PERSONA`/`personaOf`、`PAYER`/`payerOf`、`useCart()`

- [ ] **Step 1: `Profile.jsx`** `FullBleedHero src={HERO_IMAGES.profile}`；头像卡 `whoAmI/setWhoAmI`（来自 `useCart()`），点击切 🐱/🐰，应用 `avatar-me is-active`/`avatar-partner is-active`；统计数字 `var(--color-clay-soft)`；菜单项 `bone/ash`。

- [ ] **Step 2: `Cart.jsx`** `FullBleedHero variant="functional"`（空/有货两态）；拆 `meItems/partnerItems` 用 `GlassCard className="glass-me"`/`glass-partner` + `glow={PERSONA.me/partner.glow}`；各自显头像 + 小计；`PAYER_OPTIONS` 激活 `borderColor: p.border, boxShadow: p.glow`；数量按钮 `var(--color-clay-gradient)`；文字 `bone/ash/clay-soft`。`updateQuantity/removeItem/clearCart` 不变。

- [ ] **Step 3: `Checkout.jsx`** `FullBleedHero variant="functional"`；商品/备注/谁买单/合计各 `GlassCard`；`PAYER_OPTIONS` 激活 `borderColor: p.border, boxShadow: p.glow`；庆祝遮罩 `bg-[rgba(247,243,236,0.96)]` + `var(--color-bone)` 文字；POST/`clearCart`/navigate 不变。

- [ ] **Step 4: 局部 grep + 构建**
```bash
export PATH="C:/Users/87374/.workbuddy/binaries/node/versions/22.22.2:$PATH"
grep -rn -iE "#E6B25A|#C2C7D2" src/pages/Profile.jsx src/pages/Cart.jsx src/pages/Checkout.jsx && echo "FAIL" || echo "OK"
npm run build 2>&1 | tail -3
```

- [ ] **Step 5: Commit**
```bash
git add src/pages/Profile.jsx src/pages/Cart.jsx src/pages/Checkout.jsx
git commit -m "feat(pages): Profile/Cart/Checkout 晨光换肤"
```

---

### Task 9: 后台 Admin / AdminDishes / AdminOrders

**Files:**
- Modify: `src/pages/Admin.jsx` `src/pages/AdminDishes.jsx` `src/pages/AdminOrders.jsx`

**Interfaces:**
- Consumes: `PERSONA`/`personaOf`、`ORDER_STATUS`/`orderStatusOf`、`useCart()`（保逻辑）

- [ ] **Step 1: `Admin.jsx`** 浅色玻璃控制台：可读性优先；统计卡 `.glass`；主底 `var(--color-ink-900)`；pill nav 已被 App `!isAdmin` 隐藏，无需处理。

- [ ] **Step 2: `AdminDishes.jsx`** 菜品行 `.glass`；操作按钮：上架=鼠尾草绿(`var(--color-sage-gradient)` 或 PERSONA.partner)/编辑=赤陶(PERSONA.me)/删除=love(`var(--color-love)`)；去旧分类彩虹色。增删改逻辑不变。

- [ ] **Step 3: `AdminOrders.jsx`** 订单行 `.glass`；状态按钮走 `ORDER_STATUS`（pending→开始做 用 PERSONA.partner.gradient / preparing→完成 用 PERSONA.me.gradient）；改单逻辑不变。

- [ ] **Step 4: 局部 grep + 构建（重点查旧 `.glow-gold`/`.glow-platinum` 类名是否已替换）**
```bash
export PATH="C:/Users/87374/.workbuddy/binaries/node/versions/22.22.2:$PATH"
grep -rn -iE "glow-gold|glow-platinum|#E6B25A|#C2C7D2" src/pages/Admin.jsx src/pages/AdminDishes.jsx src/pages/AdminOrders.jsx && echo "FAIL" || echo "OK"
npm run build 2>&1 | tail -3
```

- [ ] **Step 5: Commit**
```bash
git add src/pages/Admin.jsx src/pages/AdminDishes.jsx src/pages/AdminOrders.jsx
git commit -m "feat(admin): 后台三页浅色玻璃换肤"
```

---

### Task 10: D3 组件换肤（仅材质/光/色）

**Files:**
- Modify: `src/components/D3CartOrb.jsx` `src/components/D3FlipCard.jsx` `src/components/D3StatusRing.jsx` `src/components/AddDishModal.jsx` `src/components/KissIcon.jsx`

**Interfaces:**
- Consumes: `PERSONA`/`personaOf`（颜色唯一真源）、`ORDER_STATUS`
- Produces: 同 3D 行为、新材质光色

- [ ] **Step 1: `D3CartOrb.jsx`** 球体渐变改 `var(--color-clay-gradient)`（`linear-gradient(135deg,#E0A07E,#C8683F)`），阴影 `0 6px 20px rgba(200,104,63,0.30)`；数量角标底色赤陶、文字 `#FFFDF9`。**3D 运动逻辑不动**。

- [ ] **Step 2: `D3FlipCard.jsx`** 背面 `backface-hidden` 改浅色玻璃：`background: var(--color-glass)` + `border var(--color-glass-border)`；正面图不变。3D 翻转逻辑不动。

- [ ] **Step 3: `D3StatusRing.jsx`** 环色已用 `config.ring`，无需改值；仅把内阴影/外阴影调浅以适配浅底：`boxShadow inset 0 2px 8px rgba(255,255,255,0.5), 0 4px 12px rgba(43,38,32,0.10)`。

- [ ] **Step 4: `AddDishModal.jsx`** 遮罩 `background: rgba(43,38,32,0.28)` + `blur(8px)`；关闭按钮改 `.glass`（`bg-[var(--color-glass)]` + 墨字）；表单卡 `.glass`。

- [ ] **Step 5: `KissIcon.jsx`** 已是 `currentColor`，调用处传 `text-[var(--color-love)]` 即可；确认无硬编码旧 love 色。

- [ ] **Step 6: 局部 grep + 构建**
```bash
export PATH="C:/Users/87374/.workbuddy/binaries/node/versions/22.22.2:$PATH"
grep -rn -iE "#E6B25A|#C2C7D2|#F0CE92|#DDE0E8" src/components/D3CartOrb.jsx src/components/D3FlipCard.jsx src/components/D3StatusRing.jsx src/components/AddDishModal.jsx && echo "FAIL" || echo "OK"
npm run build 2>&1 | tail -3
```

- [ ] **Step 7: Commit**
```bash
git add src/components/D3CartOrb.jsx src/components/D3FlipCard.jsx src/components/D3StatusRing.jsx src/components/AddDishModal.jsx src/components/KissIcon.jsx
git commit -m "feat(d3): 球体/翻转卡/状态环/弹窗换肤为赤陶·鼠尾草绿"
```

---

### Task 11: 全量一致性 + 降级 + grep 零残留

**Files:**
- Scan: 全 `src`（不改结构，仅清理遗漏）

**Interfaces:**
- Consumes: 前 10 个任务的产出
- Produces: 干净、零硬编码、零旧色的代码库

- [ ] **Step 1: 全仓旧暗色 hex 零残留**
```bash
cd /c/Users/87374/WorkBuddy/2026-08-15-23-13-20/food-ordering-review/food-ordering-miniapp
grep -rn -iE "#0E0C0A|#16130F|#1E1A15|#E6B25A|#C2C7D2|#F0CE92|#DDE0E8|#9DB39A|#E8A6A0|#D7736B|#F5F1EA|#A89F92|#6E665C" src && echo "FAIL 旧色残留" || echo "OK 旧色零残留"
```

- [ ] **Step 2: 双人格色仅出自 persona.js / index.css**
```bash
grep -rn -iE "#C8683F|#7FA37A|#B5793F|#D98C84|#E0A07E|#A9C4A4" src --include=*.jsx --include=*.js | grep -v "src/theme/persona.js" | grep -v "src/index.css" && echo "FAIL 硬编码" || echo "OK 唯一真源"
```

- [ ] **Step 3: 旧类名清理** 确认无 `.glow-gold`/`.glow-platinum`/`.pulse-glow-gold`/`.pulse-glow-platinum`/`.bg-warm`/`.bg-cool` 残留引用（如有，改 `.glow-clay`/`.glow-sage` 或等价）。

- [ ] **Step 4: 不可变文件未动**
```bash
git diff --name-only HEAD~10 -- src/components/CartContext.jsx src/lib/mockApi.js src/lib/favorites.js || echo "OK 业务文件未改"
```

- [ ] **Step 5: 构建**
```bash
export PATH="C:/Users/87374/.workbuddy/binaries/node/versions/22.22.2:$PATH"
npm run build 2>&1 | tail -3
```

- [ ] **Step 6: Commit（若 Step 1-3 有清理改动）**
```bash
git add -A && git commit -m "chore: 一致性清理 — 旧色/旧类名零残留" || echo "无需提交"
```

---

### Task 12: IS_PASS 验收 + 最终提交

**Files:**
- Verify: 全仓

**Interfaces:**
- Consumes: Task 1–11 全部产出

- [ ] **Step 1: 写失败用例 — 在重排前运行本套件应失败（红线）**
```bash
cd /c/Users/87374/WorkBuddy/2026-08-15-23-13-20/food-ordering-review/food-ordering-miniapp
grep -rn -iE "#0E0C0A|#E6B25A|#C2C7D2" src && echo "（基线态：应 FAIL，旧暗色尚在）" || echo "（已是晨光态）"
```

- [ ] **Step 2: 运行完整 IS_PASS 套件**
```bash
export PATH="C:/Users/87374/.workbuddy/binaries/node/versions/22.22.2:$PATH"
echo "===BUILD===" && npm run build 2>&1 | tail -5
echo "===LINT===" && npx oxlint 2>&1 | tail -8
echo "===OLD COLOR RESIDUAL===" && (grep -rn -iE "#0E0C0A|#16130F|#1E1A15|#E6B25A|#C2C7D2|#F0CE92|#DDE0E8|#9DB39A|#E8A6A0|#D7736B|#F5F1EA|#A89F92|#6E665C" src && echo "FAIL" || echo "PASS 旧色零残留")
echo "===HARDCODE PERSONA COLOR===" && (grep -rn -iE "#C8683F|#7FA37A|#B5793F|#D98C84" src --include=*.jsx --include=*.js | grep -v "src/theme/persona.js" | grep -v "src/index.css" && echo "FAIL" || echo "PASS 唯一真源")
echo "===PAGE COUNT===" && ls src/pages | wc -l
```
期望：build 0 error、lint 0 error（仅允许既存 2 warning）、旧色 PASS、硬编码 PASS、12 页。

- [ ] **Step 3: 业务不可变校验**
```bash
git diff --name-only 038988e -- src/components/CartContext.jsx src/lib/mockApi.js src/lib/favorites.js && echo "FAIL 业务文件被改" || echo "PASS 业务文件未动"
```

- [ ] **Step 4: 提交验收报告（如尚未有总提交）**
```bash
git add -A && git commit -m "chore: 晨光厨房重排 IS_PASS — build/lint 0 error, 旧色零残留, 12/12 页可用" || echo "已是最新"
git log --oneline -1
```

- [ ] **Step 5: 回滚确认说明**
告知用户：旧暗房晚宴基线 `038988e` 未动，可 `git revert`/checkout 回滚；本次变更叠在其上。

---

## Self-Review（计划自检）

1. **Spec 覆盖**：§2.1 调色板→Task1/2；§2.2 字体→Task1（CDN 已存在，沿用）；§2.3 质感/hero→Task1/3/4；§2.4 双人格→Task2/4/5/6-9；§3.1-3.6 文件清单→Task1-10 逐条对应；§3.7 不可变→Task11/12 校验；§4 数据流→全局约束+Task2；§5 降级→Task1/4；§6 IS_PASS→Task12。覆盖完整。
2. **占位扫描**：无 TBD/TODO；每步含具体值或命令。Task3 允许"若 URL 可用则仅改占位"为条件式但给出明确备选动作，非占位。
3. **类型一致性**：`PERSONA[*].color/gradient/glow/glassBorder/chipBg/chipColor`、`ORDER_STATUS[*].ring/chipBg/chipColor`、`PAYER[*].border/glow` 在 Task2 定义，Task4-10 引用一致；`config.ring` 在 Task7/10 与 `D3StatusRing` 接口一致。
4. **已知风险**：Task1 旧类名 `.glow-gold`/`.glow-platinum` 被页面引用时，需同步在 Task1 新增别名或 Task9/10 改引用——已在 Step5/Task9 Step4 显式覆盖。
