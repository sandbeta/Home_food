---
name: 晨光厨房 Chenguang Kitchen
description: 一本只印给两个人看的厨房别册——暖纸白、双人格温度对比、编辑杂志式的克制手作感
colors:
  clay: "#DD794E"
  clay-soft: "#F99E78"
  clay-deep: "#9F4F2D"
  sage: "#A4C39E"
  sage-soft: "#BBD3B5"
  caramel: "#B5793F"
  love: "#D98C84"
  danger: "#C2543F"
  paper: "#FDFBF7"
  paper-block: "#F6F0E7"
  card-surface: "#FFFDFA"
  on-dark: "#FFFDF9"
  ink: "#2B2620"
  ash: "#6B6155"
  mist: "#75695B"
  night-paper: "#232019"
  night-ink: "#F2EDE3"
typography:
  display:
    fontFamily: "'Playfair Display', 'Songti SC', 'SimSun', serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 1.06
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "'Playfair Display', 'Songti SC', 'SimSun', serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'Playfair Display', 'Songti SC', 'SimSun', serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.01em"
  body:
    fontFamily: "system-ui, 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.7
  label:
    fontFamily: "system-ui, 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.18em"
rounded:
  card: "24px"
  sheet: "28px"
  tile: "16px"
  btn: "12px"
  ctl: "8px"
spacing:
  page-x: "24px"
  section: "24px"
  card-p: "16px"
components:
  button-primary:
    backgroundColor: "{colors.clay}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.btn}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.clay}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.btn}"
    padding: "12px 20px"
  button-primary-active:
    backgroundColor: "{colors.clay-deep}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.btn}"
    padding: "12px 20px"
  button-quiet:
    backgroundColor: "{colors.paper-block}"
    textColor: "{colors.ink}"
    rounded: "{rounded.ctl}"
    padding: "8px 14px"
  chip-idle:
    backgroundColor: "{colors.paper-block}"
    textColor: "{colors.ash}"
    rounded: "9999px"
    padding: "10px 16px"
  chip-active:
    backgroundColor: "{colors.clay}"
    textColor: "{colors.on-dark}"
    rounded: "9999px"
    padding: "10px 16px"
  input-field:
    backgroundColor: "rgba(43, 38, 32, 0.03)"
    textColor: "{colors.ink}"
    rounded: "{rounded.btn}"
    padding: "12px 16px"
  nav-pill-active:
    backgroundColor: "{colors.clay}"
    textColor: "{colors.on-dark}"
    rounded: "9999px"
  card-surface:
    backgroundColor: "{colors.card-surface}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-p}"
  dock-orb:
    backgroundColor: "{colors.clay}"
    textColor: "{colors.on-dark}"
    rounded: "9999px"
    size: "64px"
---

# 设计系统：晨光厨房 Chenguang Kitchen

## Overview

**创意北极星："The Kitchen Zine（两人厨房别册）"**

晨光厨房不是一款点餐软件，而是一本只印给两个人看的家庭杂志：暖纸白的版面摊在阳光下的餐桌上，蜜橘色是"我🐱"的油墨，薄荷绿是"TA🐰"的油墨，菜是栏目、订单是连载、情话是编者注。整套系统在"编辑杂志质感"的克制框架里运行——纸面实底卡片、发丝级边框、收敛的圆角、衬线大标题；温度不靠花哨装饰，靠双人格色彩的对比与随机抽取的情话文案。

气质定性：**克制的手作感**。所有组件安静为底、动时点睛——hover 只亮一档光泽，按压只缩 2%，玻璃模糊严格限制在导航/操作层。每屏恰好一个"深色锚点"（蜜橘实底 + 暖白字的大卡），其余是浅色纸面；这是杂志"一张跨页大图 + 细密文字栏"的版面律。21:00–05:00 夜宵模式下整本别册换成暖木炭黑夜纸——双人格色与情感色一律不变：夜里也还是这两个人的颜色。

**关键特征：**
- 暖纸基底：页面底 `paper`、区块底 `paper-block`、卡面 `card-surface`，三层暖白从不使用纯白或冷灰
- 双人格温度对比：`clay`（我，暖）× `sage`（TA，冷）是唯一的身份色，价格永远穿 `caramel` 焦糖
- 一页一锚点：每屏恰好一块 clay 实底白字深色锚卡
- 眉题 + 衬线大标题 + 底部贯通发丝线 = 页头三件套
- 夜宵反相只换表面/文字/遮罩令牌，情感与人格色跨主题恒定

## Colors

调色板是一支暖色调的编辑部油墨盘：纸面近白微暖，墨色近黑带棕，两支配色一个像晒透的陶土、一个像晨雾里的薄荷。

### Primary（我 · 蜜橘）
- **Sun-baked Clay 晒透蜜橘**（#DD794E）：唯一动作色与激活态色——主按钮、导航激活药丸、强调链接、选中态。clay 色阶 00–90 覆盖浅底到深底全部场景
- **Clay Light 蜜橘高光**（#F99E78, clay-40）：hover 与激活浅底
- **Deep Terracotta 深赤陶**（#9F4F2D, clay-90）：渐变收尾与按压态

### Secondary（TA · 鼠尾草）
- **Morning Sage 晨雾鼠尾草**（#A4C39E, sage-40）："TA"的一切——身份渐变、选中态（如谁买单的 TA请）、sage 系徽章
- **Sage Haze 薄荷高光**（#BBD3B5, sage-30）：TA 侧浅底

### Tertiary（情感与数值）
- **Caramel 焦糖**（#B5793F）：所有价格数字与金额，衬线呈现——"钱"在这个家里由焦糖负责
- **Love Blush 柔霞红**（#D98C84）：收藏/喜爱态与购物车角标
- **Danger Rust 铁锈红**（#C2543F）：删除与破坏性动作（⚠️当前以 `--color-danger` 定义于 index.css，全库仅 1 处引用，实际删除键走 love——推广前先二选一，勿双源）

### Neutral（纸与墨）
- **Warm Paper 暖纸白**（#FDFBF7）：页面底（夜宵 → 木炭黑 #232019）
- **Clay Block 浅陶区块底**（#F6F0E7）：区块/安静按钮底
- **Card Paper 卡面纸**（#FFFDFA）：主卡面；**Dock Paper 药丸纸**（#FFFDF9）：停靠层与深底上的白字（on-dark）
- **Ink 墨**（#2B2620，夜宵 → #F2EDE3）：主文字；**Ash 灰**（#6B6155）：次文字；**Mist 雾**（#75695B）：占位/三级（对比 ≥5:1 达标线）
- 发丝边框统一 `rgba(43,38,32,0.08)`——墨的低浓度，不是新颜色

### 命名法则
**The One Voice Rule（一个声音法则）.** `clay` 只属于动作与激活态。它出现在哪里，哪里就是"可以点"。大面积色块用 clay 装饰 = 稀释了它的指令性。
**The One Anchor Rule（一屏一锚）.** 每个页面恰好一块 clay 实底白字深色锚卡（首页主推/购物车合计/夜宵锚块）。第二块锚点出现即版面失衡。
**The Same-Lovers Rule（夜不改色）.** 夜宵模式只反相表面/文字/遮罩令牌；clay、sage、love、caramel 在白天黑夜是同一组值——温度对比是两个人的身份，不随天色变。

## Typography

**Display 字体：** Playfair Display（本地 woff2 子集，可变 500–700；衬线栈回退 Songti SC/SimSun）
**Body 字体：** 系统无衬线栈（system-ui → PingFang SC → Microsoft YaHei），正文基准 15px
**Label/数字字体：** 同 body；数字场景启用 `lining-nums + tabular-nums` 等宽对齐

**气质：** 拉丁衬线做版面主角、中文系统体做叙述底——像杂志里英文刊名与中文正文的分工。Playfair 高对比衬线 + 紧字距大字号自带编辑感；数字一律 lining 等宽，价格与步进器才不会"跳"。

### 层级
- **Display**（bold 700, 40px, 行高 1.06, 字距 -0.035em）：页面大标题（PageHeader 标题槽 `text-display`）、大数字
- **Headline**（600, 24px, 行高约 1.25）：卡内主标题（text-2xl）
- **Title**（600, 18px, 行高 1.4）：区块标题（section-title 基准 18px）
- **Body**（400, 15px, 行高 1.7）：正文与描述；长文控制在壳宽内自然断行
- **Label**（700, 11px, 字距 0.18em, 全大写）：眉题 kicker（英文刊名）、小徽章、分类标签

### 命名法则
**The Price Wears Caramel Rule（钱穿焦糖）.** 一切金额/价格 = 衬线 + caramel；字号随场景，颜色与字族不换。
**The Eyebrow Rule（眉题规则）.** 页头副标题一律大写宽字距小字（0.18em/11px/700），衬线大标题之下、发丝线之上——杂志 kicker 是页面的"栏目名"。

## Layout

单列"手机杂志"模型：**480px 壳宽**（`--shell-w` 全站唯一真源）居中于桌面视口；页面左右边距 24px（`--space-page-x`），区块纵向节奏 24px（`--space-section`），卡内边距 16px（`--space-card-p`）。内容容器一律走 `PageContainer`，不得各页自定边距。

**底部停靠层（DockLayer）是全站唯一常驻固定层**：导航药丸与购物车球并排同一行（行高 72px、球径 64px、间距 12px、底衬安全区 `max(env(safe-area-inset-bottom), 16px)`），内容页底部内边距用 `--bottom-inset` 系列，杜绝散落的 `pb-28` 魔法数。购物车为空时球槽不渲染、药丸自然居中。

**Hero 溶底**：大图页面用多档纵向渐变（`--hero-wash-immersive` 五段 / `--hero-wash-functional` 单档）把图片溶进纸底，图片滤镜像素级参数（`--hero-filter-*`）随主题反相——图是版面的一部分，不是贴在纸上的照片。响应式：断点极少，`@media` 仅 reduced-motion 一处降级；宽度自适应靠壳约束。

## Elevation & Depth

混合体系：**纸面分层为主、暖调阴影为佐**。2026-09 严格重制后，backdrop-blur 玻璃只允许出现在导航/操作层（停靠药丸、吸顶栏、悬浮按钮、模态遮罩）；内容层卡面一律纯色暖陶 + 阴影分层。深度感来自"纸面三白（页底/区块底/卡面）+ 发丝边 + 阴影"的层叠，而非真实透明。

### 阴影词表（暖墨阴影，rgba 基座 = ink 43,38,32；夜宵换纯黑系并加强浓度）
- **shadow-1**（`0 1px 2px rgba(43,38,32,.05)`）：发丝级贴底（返回钮、静默卡）
- **shadow-2**（`0 2px 8px .06`）：卡片静止态
- **shadow-3**（`0 8px 24px .08`）：停靠层/浮起
- **shadow-4**（`0 16px 44px .12`）：模态/弹层
- **shadow-5**（`0 30px 70px .16`）：最高层（全站罕用，预留）
- **glow-clay / glow-sage**：双人格聚焦晕（3px 环 + 20px 扩散），激活/脉冲专用

### 命名法则
**The Warm Shadow Rule（暖墨阴影）.** 亮色模式禁止纯黑阴影；rgba 必须带 ink 的棕相。
**The Glass Recedes Rule（玻璃退后）.** 玻璃模糊是操作层的特权；内容卡是纸，不是玻璃。

## Shapes

形态语言 = **温和的圆角矩形 + 贯通发丝线**。圆角五档标尺：卡 24px / 底部浮层顶 28px / 瓦片与小卡 16px / 按钮 12px / 输入与小控件 8px；Tailwind 默认 rounded-lg/xl/2xl 被有意保留未覆盖（避免既有用法静默位移）。**同心圆律**：卡 24 − 内边距 16 = 控件 8，嵌套圆角永远内收。胶囊（chips/药丸/角标）一律 `rounded-full`，是版面里唯一的"全圆"家族。装饰性形态克制到近乎无：区块标题下一条 30×3px clay 短线、页头下一条 1px 发丝线，就是全部的线装。3D 工具类（perspective/preserve-3d）仅供 StoveStage 灶台舞台等签名组件使用，不进入常规版面。

## Components

### 按钮
- **主按钮 `.d3-btn.d3-btn-primary`**：clay 实底 + 暖白字 + 12px 圆角 + `inset 0 1px 0 rgba(255,255,255,.18)` 顶部高光线（手作的"压痕"）；hover 提亮 4% 并浮起 clay 系阴影；active 缩至 0.98
- **安静按钮 `.d3-btn-sm`**：paper-block 实底 + 发丝边 + 8px 圆角 + 13px 字；列表行内与次级动作；active 缩 0.97 并降透明
- 全站内边距按场景给（页面级常见 12×20px / 5×14px），颜色与圆角不得偏离标尺

### 筛选胶囊 Chip
胶囊 9999px、最小高 44px（触摸线）；静默 = paper-block 底 + ash 字 + 发丝边；激活 = clay 垂直渐变实底 + 暖白字 + clay 系投影，`layout` 过渡滑动。

### 卡片
24px 圆角、卡面纸色（或区块底）、1px 发丝边、shadow-2；hover 只加深阴影（shadow-3 浓度），**不位移、不放大**——纸不会跳起来。双人格卡（glass-me / glass-partner）以人格色 40% 描边 + 55% 人格浅底混入 surface。

### 输入框
墨 3% 浅底（夜宵自动提亮为白 9%）、发丝边、12px 圆角、mist 占位字；focus = clay-50 55% 描边 + 4px clay 14% 晕环。键盘焦点统一 `outline: 2px sage-soft`。

### 导航（停靠药丸 + 购物车球）
DockLayer：paper-strong 实底药丸（全圆、shadow-3）内四枚细线图标，激活项由 `layoutId="navGlow"` 的 clay 渐变胶囊滑过、图标转白加粗至 2.2——**全站唯一允许图标换色的位置**。购物车球 = clay 垂直渐变 64px 圆球，四层阴影塑出"陶瓷纽扣"（上高光 + 下暗环），love 色角标 spring 弹出。

### 签名组件：StoveStage 灶台
订单详情页的插画舞台：灶体梯形深灰渐变 + 灶膛口、`flame-flicker` 三条火苗、`stove-glow` 呼吸光晕、`steam-puff` 蒸汽——订单状态用"火"叙事（起火=烹饪中、起锅=完成）。允许存在的唯一拟物场景。

## Do's and Don'ts

### Do
- **Do** 新页面一律 `PageHeader + PageContainer + DockLayer`（后台三页例外，包 `AdminShell`）；边距节奏只吃 `--space-*` 标尺
- **Do** 颜色只写进 `src/index.css` 与 `src/theme/persona.js` 两处，页面消费 `var(--color-*)`；给运行时内联 var() 用的令牌必须放 `@theme static`（防树摇）
- **Do** 人格/情感语义走 persona.js 映射（clay=我、sage=TA、caramel=钱、love=收藏）；新增调用点 <2 的组件不建，≥2 才进 `components/ui/`
- **Do** 深色锚点卡上的白字统一 on-dark 暖白 #FFFDF9；深色实底与白字组合必须达 WCAG AA（clay-60 现值即为此校准）
- **Do** 页转场只动 opacity（`pageEnter`），位移动画放内层 `contentEnter`——外层 transform 会杀死 sticky 页头
- **Do** 图标取自 `ui/Icons.jsx` 细线 SVG（24 viewBox/currentColor）；文案进 `lib/sweetCopy.js` 单源
- **Do** 动效吃 `--dur-fast/base/slow` + `--ease-soft`，并为 `prefers-reduced-motion` 留降级

### Don't
- **Don't** 在 JSX 硬编码十六进制色（静态门禁 `p6_static_gate.py` 会拦：白名单外即红，(43,38,32) 墨系除外）
- **Don't** 给导航/快捷入口新增 emoji 图标；Don't 用纯黑阴影或冷白 #FFFFFF 卡面
- **Don't** 把 clay 用作大面积装饰底（见 The One Voice Rule）；Don't 一屏放两块深色锚点卡
- **Don't** 给内容层卡面开 backdrop-blur（玻璃退后律）；Don't 在 `--radius-*` 标尺外随手写圆角值
- **Don't** 在页面包裹层加 transform（转场禁令）；Don't 绕过 `mockApi`/`fetch` 直连数据——接口语义改动 mock 与 server 两端必须同步
- **Don't** 提议 WeUI/扁平微信风（所有者已实测否决并 revert，见 PROJECT-HANDOFF 台账）
