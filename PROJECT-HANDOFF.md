# 项目交接文档 · 晨光厨房（food-ordering-miniapp）

> **给新对话的 AI / 开发者**：本文档是自包含的。读完即可接手，无需翻旧会话。
> 最后更新：2026-08-29　当前 HEAD：`21d81b5`　工作区：干净

---

## 1. 一句话简介

情侣点餐 H5 小程序（手机 480px 竖屏框）。已完成两轮工作：**①「晨光厨房」换肤（已完成并验收）**；**② UI 与信息架构全面重构（进行中，P0–P3 已完成，P4–P6 待做）**。

- **项目路径**：`C:/Users/87374/WorkBuddy/2026-08-15-23-13-20/food-ordering-review/food-ordering-miniapp`
- **重构方案全文**：`docs/superpowers/plans/2026-08-29-ui-ia-redesign.md`（含逐页布局规格与验收门禁）
- **换肤方案**：`docs/superpowers/specs/2026-08-17-sunlit-kitchen-reskin-design.md`
- **换肤执行台账**：`.superpowers/sdd/2026-08-18-sunlit-kitchen-reskin/progress.md`

## 2. 跑起来

```bash
cd <项目路径>
npm install          # node_modules 不在压缩包里
npm run dev          # 或: node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173
npm run build        # 沙箱里 dist/ 不可写，用: vite build --outDir /tmp/sk-build
npm run lint         # oxlint；正确入口 ./node_modules/.bin/oxlint
```

- dev server 启动后**必须做 HTTP 探测**确认（vite 输出有缓冲，后台任务看不到）：
  `urllib.request.urlopen('http://127.0.0.1:5173/')` 读 `<title>` 应为「晨光厨房 · 今天想吃什么」。
- 预览地址：`http://127.0.0.1:5173/`

## 3. 技术栈

React 19 + Vite 8 + Tailwind v4（`@theme` 令牌）+ React Router 7 + Framer Motion 12 + localStorage 模拟后端（`src/lib/mockApi.js`，离线可用）。

## 4. 设计语言（不可改的部分）

**晨光厨房 Sunlit Kitchen** —— 暖骨白亮色 + 双人格温度对比：

| 令牌 | 值 | 语义 |
|---|---|---|
| `--color-ink-900` | `#F7F3EC` | 页面底（暖骨白） |
| `--color-bone` | `#2B2620` | 主文字 |
| `--color-clay` / `-soft` | `#C8683F` / `#E0A07E` | 我(🐱) 赤陶暖 |
| `--color-sage` / `-soft` | `#7FA37A` / `#A9C4A4` | TA(🐰) 鼠尾草绿冷 |
| `--color-caramel/love/danger` | `#B5793F` / `#D98C84` / `#C2543F` | AA买单 / 喜爱 / 删除 |
| `--color-ash` / `mist` | `#6B6155` / `#9A9082` | 次文字 / 占位 |

核心语义必须保留：**双人格（我/TA）、购物车、谁买单（AA/我请/TA请）、收藏**。

## 5. 必须遵守的架构约定（改代码前先读）

1. **页面转场绝不能带 transform**（App.jsx 用 `motion.js` 的 `pageEnter`，纯 opacity）。任何 transform 会让包裹层成为 fixed/sticky 的包含块 → PageHeader 吸顶失效、FullBleedHero 错乱。要位移用 `contentEnter` 放**内层**。
2. **`DockLayer` 是全站唯一底部固定层**：导航药丸 + 购物车球**并排同一行**（flex 分宽），结构上不可能重叠。不要再加 `fixed bottom-*` 元素（此前 Menu 的 CTA 与球撞过）。
3. **所有页面用 `PageHeader`**（支持 `back`/`backTo`）；后台三页一律包 `AdminShell`（强制返回，消灭断头路）。
4. **颜色单源真值**：色值只写在 `src/index.css` + `src/theme/persona.js`（+`images.js`）。页面/组件一律 `var(--color-*)` 或 `PERSONA[...]`，**不许硬编码色值**。
5. **设计标尺在 `@theme static`**（index.css）：圆角 `card 28 / tile 20 / btn 16 / ctl 12 / sheet 32`；阴影 `--shadow-1..5`（暖调）+ `glow-clay/sage`；布局 `--shell-w 480 / --space-page-x 16 / --bottom-inset`。**不要覆盖 Tailwind 默认的 `text-xs/sm/base/lg` 和 `rounded-lg/xl`**（会让全站字号/圆角静默位移）。
6. **不可变文件（最小改动）**：`src/components/CartContext.jsx`、`src/lib/mockApi.js`、`src/lib/favorites.js`。
7. 新增共享组件放 `src/components/ui/`，**每个组件须有 ≥2 处真实调用点**才建。
8. 提交信息用中文，说明「为什么」而不只是「改了什么」。

## 6. 当前进度

### 已完成 ✅

| 轮次 | 内容 | 验收 |
|---|---|---|
| 换肤 T1–T12 | 暗房晚宴(暗) → 晨光厨房(亮)，含向后兼容别名、旧主题名清理 | IS_PASS 7 项全绿（`6c6dc17` + `e208a8c`） |
| 重构 P0 | 设计标尺令牌（`@theme static`，21 个）+ motion.js 收编 | `b6365f7` |
| 重构 P1 | 页面转场去 transform；DockLayer；PageHeader；`--shell-w` 收敛魔数 | `97e8296` |
| 重构 P2 | `src/components/ui/` 11 个组件（EmptyState/LoadingState/DishRow/OrderCard/PayerSelector/Stepper/StatCard/SectionHeader/Chip/PageContainer/AdminShell）；删死代码 D3FlipCard、TabBar | `a0d93db` |
| 重构 P3-a | **结算并入购物车**（Cart 一页完成下单；`/checkout` → 重定向 `/cart`） | `c496b76` |
| 重构 P3-b | **后台三页 AdminShell**（消灭 AdminDishes/AdminOrders 两处断头路） | `4c2a61f` |
| 重构 P3-c | **收藏并入点菜页**（分段控件 全部/⭐收藏；Menu 卡片补上缺失的跳详情 onClick；删与购物车球重叠的 CTA） | `21d81b5` |

### 待做 🔴（P4–P6，按序）

**P4 逐页重排**（规格见方案文档第六节）：
- [ ] `/favorites` 改重定向到 `/menu?fav=1`，**删除 Favorites.jsx**（Menu 已吸收其功能）
- [ ] Profile：移除「我的收藏」入口（已并入点菜页）、删除 `path:'#'` 的「设置/关于」空壳项
- [ ] Home：4 种列表隐喻（横轨×2+网格+列表）收敛为 3 种、约 1.5 屏（Hero→快捷→今日推荐大卡→常点的网格→最近订单 3 条）
- [ ] DishDetail：修 GlassCard 零内边距；用 ui/Stepper
- [ ] Orders / OrderDetail：用 ui/OrderCard、状态环尺寸令牌化（现硬编码 140×140）
- [ ] 每页容器换 PageContainer

**P5 质感**：
- [ ] 43 处硬编码 px 字号 → 字阶（`text-xs/sm/base/lg/xl/2xl/3xl` + `text-display`；脚本+精确计数断言，终验 grep 到 0）
- [ ] 卡片圆角统一到 `--radius-card/--radius-tile`（现散落 24/22/26px）；阴影统一到 `--shadow-*`
- [ ] serif 用于页面大标题与价格/统计数字（PageHeader 已是，页面内标题与数字待改）

**P6 验收（11 项门禁）**：build 0 / lint 0 error / 断头路 0 / 固定层零重叠 / sticky 生效 / 硬编码字号 0 / 暗色残留 0 / 旧命名 0 / 色值单源 / 业务文件改动最小 / reduced-motion 生效；最后**同步 `preview-all-features.html` 到新 IA（10 页）** 并提交。

## 7. 关键文件地图

```
src/
├── App.jsx                  路由+外壳（转场、DockLayer、--bottom-inset）
├── index.css                @theme 色板 + @theme static 设计标尺 + 组件类(.glass/.d3-*/.section-title)
├── theme/
│   ├── persona.js           PERSONA/ORDER_STATUS/PAYER + helpers（双人格真源）
│   ├── motion.js            pageEnter(纯opacity!)/contentEnter/cardEntrance/sheetUp/tapScale/stagger
│   └── images.js            HERO_IMAGES/三级图片回退(INK_PLACEHOLDER/heroFallback/resolveHero)
├── components/
│   ├── DockLayer.jsx        ★唯一底部固定层（导航+购物车球并排）
│   ├── PageHeader.jsx       ★统一页头（back/backTo/right）
│   ├── FloatingPillNav.jsx  4 tab 导航（无定位，DockLayer 管）
│   ├── D3CartOrb.jsx        购物车球（无定位，DockLayer 管）
│   ├── GlassCard.jsx / FullBleedHero.jsx / D3StatusRing.jsx / KissIcon.jsx / AddDishModal.jsx
│   └── ui/                  ★11 个共享组件（见 P2）
├── pages/                   11 页（Checkout 已删）
└── lib/                     mockApi.js(不可变) / favorites.js(不可变) / categoryIcons.js
```

## 8. 环境坑（务必牢记，踩过实录）

| 坑 | 对策 |
|---|---|
| 🔴 **`git rm` 会清空整个目录**（删 Checkout 时把 src/pages/ 12 个文件全洗了） | 删文件用 `python -c "import os; os.remove(r'<原生Windows绝对路径>')"`，再 `git add -A src/`。**每个阶段完成立即提交检查点**。恢复：`git checkout HEAD -- <目录>` |
| 🔴 沙箱写 `dist/` 被拦 | 构建用 `--outDir /tmp/sk-build` |
| 🟠 Tailwind v4 会**树摇掉未被 var() 引用的主题变量** | 设计令牌必须放 `@theme static`，否则产物里缺失 |
| 🟠 未被引用的组件**不进构建**，语法错误测不出来 | 用 dev server 逐模块转译探测：`GET /src/components/ui/X.jsx` 看是否 200 且无 "Transform failed" |
| 🟠 grep 带 alpha 的 rgba 要写 `rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*[\),]`（写 `\)` 会漏 `rgba(230,178,90,0.35)`） | 审计色值用「白名单差分」+ 此正则 |
| 🟠 grep 大小写敏感（`#2A1E0E` ≠ `#2a1e0e`） | 审计一律加 `-i` |
| 🟡 `pathlib.glob("src/**/*.{jsx}")` **不展开花括号**，静默匹配为空 | 用 `rglob("*.jsx")` 或显式文件列表 |
| 🟡 vite 后台启动输出有缓冲，TaskOutput 看不到 | `netstat -ano \| grep :5173` + HTTP 探测确认 |
| 🟡 oxlint 入口是 `./node_modules/.bin/oxlint`（`node_modules/oxlint/bin/oxlint.js` 不存在） | 用 .bin 下的脚本 |

## 9. 色值审计方法（P6 会用到）

1. 白名单种子 = 主题层文件（`index.css`、`theme/persona.js`、`theme/images.js`）的全部色值
2. 允许项：`#2b2620`(bone 正文)、`#9a4e2c`(深赤陶)、`rgb(0,0,0)`/`rgb(43,38,32)`(阴影)、纯白系
3. 逐文件差分，越界即残留；另跑「暗色检测」：max(R,G,B) < 0x50 且不在允许集
4. JS 实现：先 `str(p).replace("\\","/")` 归一化路径再比对（Windows 下 glob 产物是反斜杠，曾经因此误报）

## 10. 给新对话的开场白模板

> 请先读 `<项目路径>/PROJECT-HANDOFF.md`，然后继续执行其中的「P4 逐页重排」，从 `/favorites` 重定向和 Profile 清理开始。遵守第 5 节的架构约定与第 8 节的环境坑，每个阶段完成立即 build+lint+提交。
