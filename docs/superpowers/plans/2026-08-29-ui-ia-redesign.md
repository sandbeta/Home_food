# 晨光厨房 · UI 与信息架构全面重构

**项目**：`C:/Users/87374/WorkBuddy/2026-08-15-23-13-20/food-ordering-review/food-ordering-miniapp`
**当前基线**：`master` @ `e208a8c`（T1–T12 换肤已 IS_PASS）

## 目标与已确认方向

| 项 | 决定 |
|---|---|
| 配色 | **保留晨光厨房色板**，本轮不动色值 |
| 深度 | **深化质感**：补字阶/间距/圆角/阴影/动效标尺，做到设计稿级打磨 |
| 幅度 | **彻底重构**：重做导航模型与信息架构，允许合并/拆分页面、重定义用户路径 |
| 范围 | **12 页全覆盖**（用户端 9 + 后台 3） |
| 逻辑 | 允许小幅调整，但双人格 / 购物车 / 谁买单 / 收藏 的核心语义必须保留 |

---

## 一、现状关键问题（本轮必须解掉的）

### 🔴 结构与导航
1. **三个断头路**：`AdminDishes`、`AdminOrders`、`Checkout` 无任何站内返回入口（无 `<Link>`、无 `navigate`、无返回键）。且 `/admin` 路由下底部导航被隐藏（App.jsx:74-75）→ **进去出不来**。
2. **transform 祖先破坏定位**：页面转场 `motion.div` 带 x:20/-20（App.jsx:46-52）产生包含块，导致 `Header` 的 `sticky top-0` **实际失效**，`FullBleedHero` 被迫手写 `left:50%/translateX(-50%)/width:min(480px,100%)` 居中 hack（FullBleedHero.jsx:14）。
3. **三层固定元素靠魔法数互相避让**：`<main>` `pb-28`（App.jsx:44）、导航 `bottom-5`、购物车球 `bottom-24`、Menu 底部 CTA `bottom-24`（Menu:359）→ Menu 页 CTA 与购物车球**同高重叠**。
4. **480 魔数散落 5 处**：App.jsx:37、FullBleedHero:14、FloatingPillNav:26、TabBar:24、Menu:359。
5. **Header 内边距错位**：Header 自带 `px-5`（Header.jsx:18），全站页面用 `px-4` → 差 4px。

### 🟠 信息架构
6. **首页堆砌 4 种列表隐喻**：横轨（八大菜系）+ 横轨（推荐）+ 2 列网格（大家爱吃）+ 竖列表（最近订单），约 2.5 屏。
7. **收藏埋两级深**：只能 我的 → 我的收藏 进入（Profile.jsx:11），与「收藏就是为了加购」的动机错位。
8. **Cart / Checkout 割裂**：两页各写一份 `PAYER_OPTIONS` 常量与买单选择器（Cart:12-16 / Checkout:12-16），是同一流程被切成两页。
9. **后台视觉断层**：Admin 三页无 Hero，与用户端 9 页观感不一致。
10. **空壳菜单项**：Profile 的「设置」「关于」`path:'#'`，点了没反应。

### 🟡 设计系统缺标尺
11. **无字阶**：43 处硬编码 px 字号（11px×9、10px×9、15px×8、13px×6 + 离群 9/16/17/18/20/26/28/32px）。
12. **无间距/阴影/动效标尺**，全靠裸值；卡片圆角不统一（`24px`/`22px`/`!26px` vs 令牌 `28px`）。
13. **重复模式 6 类**：菜品行 4 份副本（Home:205/Menu:298/Favorites:34/AdminDishes:68）、订单卡 2 份（MyOrders ≈ AdminOrders 逐行雷同）、空态 6 变体、加载态 3 份相同、买单选择器 2 份、步进器 2 套尺寸（30px / 36px）。
14. **死代码**：`D3FlipCard`（零引用）、`TabBar`（已被 FloatingPillNav 取代，仍引用废弃别名 `--color-peach/--color-card`）。
15. `motion.js` 的 `pageVariants` 未被使用且与 App 横向转场冲突；`glowPulse()` 默认色仍是废弃金色。

---

## 二、新信息架构

### 页面与路由（12 → 10）

| 路由 | 变化 | 说明 |
|---|---|---|
| `/home` | 重排 | 4 种列表隐喻 → 收敛为 2 种 |
| `/menu` | **吸收收藏** | 顶部加 `全部 / ⭐收藏` 分段控件；`/favorites` 重定向到 `/menu?fav=1` |
| `/dish/:id` | 重排 | 修 GlassCard 零内边距导致文字贴圆角边 |
| `/cart` | **吸收结算** | 我点的 / TA点的 / 备注 / 谁买单 / 合计 / 提交 一页完成 |
| ~~`/checkout`~~ | **删除** | 重定向到 `/cart` |
| `/orders` | 重排 | 复用新 `OrderCard` |
| `/orders/:id` | 重排 | 状态环改令牌尺寸（现硬编码 140×140） |
| `/profile` | 重排 | 去掉空壳项；收藏入口移除（已并入点菜页） |
| `/admin` | 重排 | 加 AdminShell 统一标题与返回 |
| `/admin/dishes` | 重排 | **补返回入口**（现为断头路） |
| `/admin/orders` | 重排 | **补返回入口**；订单卡与 MyOrders 共用组件 |

**为什么这样合并**
- 收藏并入点菜：收藏的下一步动作永远是「加购」，放在点菜页做分段筛选，少一次跳转且消除一份菜品行副本。
- 结算并入购物车：两者本就是同一流程的先后两段，且各自维护一份买单选择器。合并后消除重复，并顺带解决 Checkout 断头路。
- 旧路由保留重定向，避免外链失效。

### 主流程（重定义后的用户路径）
```
浏览：/home ──► /menu（分段：全部 / 收藏）
                └─► /dish/:id ──► 加购（右下角购物车球）
下单：购物车球 ──► /cart（我点的 + TA点的 + 备注 + 谁买单 + 提交）
                  └─► 提交成功 ──► /orders/:id
追踪：/orders ──► /orders/:id
身份：/profile ──► /admin（后台三页，带统一返回）
```

---

## 三、新导航模型

### 1. 解掉 transform 包含块（治本）
- 页面转场 **改为纯 opacity**（`initial/animate/exit` 只动 opacity，0.18s），去掉 x 位移。
- 效果：`position: fixed` 后代恢复正常、`Header` 的 `sticky top-0` **真正生效**、`FullBleedHero` 可删掉居中 hack。
- 页面转场改用 `motion.js` 的 `pageVariants`（把 App 内联的横向位移收编进去），删掉 App.jsx:48-50 的硬编码。

### 2. 单一底部停靠层（DockLayer）
- 新建 `DockLayer`：`position: fixed; bottom: 0` 的唯一底部固定层，内含底部导航 + 购物车球（球以 `absolute` 定位在导航**上方**）。
- 二者处于同一已定位容器内 → **结构上不可能重叠**。
- Menu 那个 `fixed bottom-24` 的 CTA **删除**（其动作由购物车球 + 导航承担）。
- 引入布局令牌，取代 `pb-28` 魔法数：
  ```
  --dock-h: 68px;  --dock-orb: 64px;
  --safe-bottom: max(env(safe-area-inset-bottom), 16px);
  --bottom-inset: calc(var(--dock-h) + var(--dock-orb) + var(--safe-bottom));
  ```
  `<main>` 用 `padding-bottom: var(--bottom-inset)`；admin 路由用较小值。

### 3. 统一返回（消灭全部断头路）
- 新建 `PageHeader`（title / subtitle / back / right），`back` 支持 `navigate(-1)` 或指定 `backTo`。**所有页面统一使用**。
- `AdminShell`：后台三页共用外壳，强制提供「← 返回」到 `/admin`，`/admin` 提供「← 返回用户端」到 `/home`。
- 落地后每页必须满足：底部导航可达 **或** 有返回入口。

### 4. 后台视觉一致性
- AdminShell 提供统一的标题区（不必是照片 Hero，用晨光渐变 + 排版构成的头部），消除「无 Hero 断层」。

---

## 四、设计系统深化（保留色值，补标尺）

在 `src/index.css` 的 `@theme` 中**新增**（不动现有色值与历史别名）：

```css
/* 字阶 —— 正文 sans，标题/数字 serif（杂志编辑感） */
--text-xs: 0.6875rem;  --text-xs--line-height: 1.5;      /* 11px 辅助/角标 */
--text-sm: 0.8125rem;  --text-sm--line-height: 1.55;     /* 13px 次要正文 */
--text-base: 0.9375rem;--text-base--line-height: 1.6;    /* 15px 正文 */
--text-lg: 1.0625rem;  --text-lg--line-height: 1.5;      /* 17px 小标题 */
--text-xl: 1.25rem;    --text-xl--line-height: 1.4;      /* 20px 卡片标题 */
--text-2xl: 1.5rem;    --text-2xl--line-height: 1.3;     /* 24px 区块标题 */
--text-3xl: 1.875rem;  --text-3xl--line-height: 1.25;    /* 30px 页面标题 */
--text-display: 2.25rem;--text-display--line-height:1.15;/* 36px 总价/大数字 */

/* 布局语义间距 */
--space-page-x: 16px;        /* 页面左右边距（Header 也对齐到这里） */
--space-section: 20px;       /* 区块间距 */
--space-card-p: 16px;        /* 卡片内边距 */

/* 圆角 */
--radius-xs: 8px; --radius-sm: 12px; --radius-md: 16px;
--radius-lg: 22px; --radius-card: 28px; --radius-sheet: 32px;

/* 暖调阴影（不用纯黑） */
--shadow-1: 0 1px 2px rgba(43,38,32,.05);
--shadow-2: 0 2px 8px rgba(43,38,32,.06);
--shadow-3: 0 8px 24px rgba(43,38,32,.08);
--shadow-4: 0 16px 44px rgba(43,38,32,.12);
--shadow-5: 0 30px 70px rgba(43,38,32,.16);

/* 动效 */
--ease-soft: cubic-bezier(.22,1,.36,1);
--dur-fast: .15s; --dur-base: .25s; --dur-slow: .45s;
```

**排版策略**：Playfair serif 用于页面大标题、区块标题、价格/统计数字（现仅 `.section-title` 用），Noto Sans SC 用于正文与 UI 控件。标题加 `-0.01em ~ -0.02em` 字距。

**动效收编**（`src/theme/motion.js`）：统一为 `pageEnter` / `cardEntrance(delay)` / `sheetUp` / `tapScale`；`glowPulse` 默认色改 clay；删除未用的 `slideUpPanel` 或接进 Sheet。

**存量清理**：43 处硬编码 px 字号全部替换为字阶令牌（脚本+断言，终验 grep 到 0）；卡片圆角统一到 `--radius-card`；阴影统一到 `--shadow-*`。

---

## 五、共享组件集（消除 6 类重复）

新建 `src/components/ui/`：

| 组件 | Props | 消除的重复 |
|---|---|---|
| `PageHeader` | `title, subtitle, back, backTo, right` | 统一返回 + 对齐 `px-4` |
| `DishRow` | `dish, variant('default'\|'compact'\|'manage'), onFav, onAdd, actions` | 菜品行 4 份副本 |
| `OrderCard` | `order, variant('user'\|'admin'), onAdvance` | MyOrders ≈ AdminOrders |
| `EmptyState` | `emoji, title, desc, action` | 6 个变体 |
| `LoadingState` | `text` | 3 份相同实现 |
| `PayerSelector` | `value, onChange` | Cart / Checkout 各一份 |
| `Stepper` | `value, onChange, min, size` | 30px / 36px 两套 |
| `SectionHeader` | `title, action` | Home 内 4 份 |
| `StatCard` | `value, label, accent` | Profile 2 格 / Admin 3 格 |
| `Chip` | `active, onClick, children` | 筛选 chip 样式不一 |
| `Sheet` | `open, onClose, children` | 泛化 AddDishModal 外壳 |
| `AdminShell` | `title, children` | 后台统一头部与返回 |

布局原语：`PageContainer`（统一 `padding-x` + `padding-bottom: var(--bottom-inset)`）、`Stack`（统一纵向节奏）、`DockLayer`。

**同时删除**：`D3FlipCard.jsx`、`TabBar.jsx`（死代码）。

---

## 六、逐页布局规格

| 页面 | 区块顺序（自上而下） |
|---|---|
| **Home** | Hero → PageHeader → 快捷入口（4 宫格）→ **今日推荐主推大卡**（1 张，大图）→ 常点的（2 列网格）→ 最近订单（最多 3 条 + 查看全部）→ 结束。**从 4 种列表隐喻收敛为「主推卡 + 2 列网格 + 竖列表」3 种，约 1.5 屏** |
| **Menu** | Hero → PageHeader → 分段控件（全部 / ⭐收藏）→ 搜索 → 今日灵感 → 分类 chips → 菜品列表（统一 `DishRow`）→ 结尾留白（无 fixed CTA） |
| **DishDetail** | Hero → PageHeader(back + 收藏) → 信息卡（补内边距）→ 数量卡（统一 `Stepper`）→ 加购卡 |
| **Cart**（含原 Checkout） | functional Hero → PageHeader(back) → 我点的 → TA点的 → 备注 → `PayerSelector` → 合计 + 提交 → 提交成功覆盖层 → 跳 `/orders/:id` |
| **Orders** | Hero → PageHeader → 状态筛选 → `OrderCard` 列表 / `EmptyState` / `LoadingState` |
| **OrderDetail** | Hero → PageHeader(back) → 状态环（尺寸令牌化）→ 菜品明细 → 谁买单 → 备注 → 时间戳 |
| **Profile** | Hero → PageHeader → 身份卡（我/TA 切换）→ `StatCard` ×2 → 入口列表（仅保留有效项：管理后台；空壳项删除或改为内联展开） |
| **Admin** | AdminShell 头部 → `StatCard` ×3 → 快捷入口 ×2 → 返回用户端 |
| **AdminDishes** | AdminShell(back) → Header(right: +添加) → 菜品卡（`DishRow variant="manage"`）/ `EmptyState` |
| **AdminOrders** | AdminShell(back) → 状态筛选 → `OrderCard variant="admin"` |

---

## 七、执行顺序（每阶段 build + lint 全绿，可独立验收）

| 阶段 | 内容 | 验收标准 |
|---|---|---|
| **P0 地基** | `index.css` 补字阶/间距/圆角/阴影/动效令牌；`motion.js` 收编 + 修 glowPulse 默认色 | build 绿；令牌可被引擎解析 |
| **P1 外壳** | App.jsx 转场去掉 transform；`DockLayer`（导航+球同容器）；`PageHeader`；`--bottom-inset` 取代 pb-28 | sticky 生效；球与导航零重叠；每页有返回或导航 |
| **P2 组件** | `src/components/ui/` 12 个组件落地；删 `D3FlipCard`/`TabBar` | 组件被引用；lint 0 error |
| **P3 IA** | 合并 Checkout→Cart、Favorites→Menu（旧路由重定向）；`AdminShell`；Profile 清空壳 | 路由重定向可用；断头路为 0 |
| **P4 逐页** | 10 页按上表重排 | 各页 build 绿 |
| **P5 质感** | serif 用到标题与数字；43 处硬编码字号→字阶；圆角/阴影统一；空白/加载态打磨 | 硬编码字号 grep 到 0 |
| **P6 验收** | 全量门禁 + 更新 `preview-all-features.html` + 提交 | 见下 |

## 八、验收门禁（P6）

1. `vite build` exit 0（沙箱写 `dist/` 被拦，用 `--outDir /tmp/sk-build`）
2. `./node_modules/.bin/oxlint` **0 error**
3. **断头路为 0**：每一页都有底部导航或返回入口（含 admin 三页）
4. **固定层零重叠**：导航 / 购物车球 / Menu 无同高 CTA
5. **sticky 生效**：Header 滚动时吸顶（transform 已移除）
6. **硬编码字号 0**：43 处 px 字号全部换成字阶令牌
7. 暗色残留 0、旧 gold/platinum 命名 0、色值单源（主题层外 0 泄露）
8. `CartContext.jsx` / `mockApi.js` / `favorites.js` **改动最小化**（必要小改需逐处说明）
9. 双人格 / 购物车 / 谁买单 / 收藏 核心语义回归通过
10. `prefers-reduced-motion` 仍生效
11. `preview-all-features.html` 同步为新 IA（10 页）

## 九、风险与对策

| 风险 | 对策 |
|---|---|
| 删 `/favorites`、`/checkout` 致外链失效 | 保留重定向路由（`/favorites`→`/menu?fav=1`、`/checkout`→`/cart`） |
| 去掉 transform 后转场观感变平 | 用 opacity + 内容层轻微纵向位移（位移放在**内层**元素，不放在页面包裹层，避免再造包含块） |
| Cart/Checkout 合并改动下单流程 | 保持 `submitOrder` 调用语义与成功后跳转 `/orders/:id` 不变；只合并 UI |
| FullBleedHero 重定父级影响观感 | 逐 variant（immersive/functional）比对；保留三级图片回退 |
| 43 处字号替换范围大、易漏 | 脚本化替换 + 精确计数断言 + 终验 grep 到 0 |
| 新增 12 个组件可能过度抽象 | 每个组件需有 ≥2 处真实调用点，否则不建 |

## 十、关键文件

**必改**
- `src/index.css`（令牌）
- `src/theme/motion.js`（动效收编）
- `src/App.jsx`（转场 / shell / DockLayer）
- `src/components/Header.jsx` → 演进为 `PageHeader`
- `src/components/FloatingPillNav.jsx`、`D3CartOrb.jsx`（并入 DockLayer）
- `src/components/GlassCard.jsx`（默认内边距 + 阴影令牌）
- `src/components/D3StatusRing.jsx`（尺寸令牌化）
- `src/components/FullBleedHero.jsx`（删居中 hack）
- 12 个页面（`src/pages/*.jsx`）
- `preview-all-features.html`

**必需最小改动**（非必要不动）
- `src/components/CartContext.jsx`、`src/lib/mockApi.js`、`src/lib/favorites.js`

**删除**
- `src/components/D3FlipCard.jsx`、`src/components/TabBar.jsx`
