---
name: 晨光厨房 Chenguang Kitchen
description: 一本只印给两个人看的厨房别册——粉纸白、双人格温度对比、编辑杂志式的克制手作感
colors:
  clay: "#BE4E67"
  clay-soft: "#EA98AA"
  clay-deep: "#7F2A3D"
  sage: "#A4C39E"
  sage-soft: "#BBD3B5"
  caramel: "#9A575F"
  caramel-deep: "#8A4E56"
  mist-deep: "#5E4F56"
  love: "#D96488"
  danger: "#C13E4E"
  paper: "#FCE7F0"
  paper-block: "#FADCE9"
  card-surface: "#FFF4F8"
  on-dark: "#FFF9FC"
  line: "rgba(43,36,41,0.14)"
  ink: "#2B2429"
  ash: "#5F5259"
  mist: "#5E4F56"
  night-paper: "#241B21"
  night-ink: "#F3ECEF"
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
    backgroundColor: "rgba(43, 36, 41, 0.03)"
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

晨光厨房不是一款点餐软件，而是一本只印给两个人看的家庭杂志：粉纸白的版面摊在阳光下的餐桌上，玫瑰粉色是"我🐱"的油墨，薄荷绿是"TA🐑"的油墨，菜是栏目、订单是连载、情话是编者注。整套系统在"编辑杂志质感"的克制框架里运行——纸面实底卡片、发丝级边框、收敛的圆角、衬线大标题；温度不靠花哨装饰，靠双人格色彩的对比与随机抽取的情话文案。

气质定性：**克制的手作感**。所有组件安静为底、动时点睛——hover 只亮一档光泽，按压只缩 2%，玻璃模糊严格限制在导航/操作层。每屏恰好一个"深色锚点"（玫瑰粉实底 + 暖白字的大卡），其余是浅色纸面；这是杂志"一张跨页大图 + 细密文字栏"的版面律。21:00–05:00 夜宵模式下整本别册换成深莓紫夜纸——双人格色与情感色一律不变：夜里也还是这两个人的颜色。

**关键特征：**
- 粉纸基底：页面底 `paper`（浅樱粉）、区块底 `paper-block`（玫瑰粉）、卡面 `card-surface`（粉纸档），四层全吃粉，亮区只剩深色锚点卡与停靠药丸
- 双人格温度对比：`clay`（我，暖）× `sage`（TA，冷）是唯一的身份色，价格永远穿 `caramel` 玫瑰金棕
- 一页一锚点：每屏恰好一块 clay 实底白字深色锚卡（首页由签名组件娃娃机的 clay 件承担）
- 眉题 + 衬线大标题 + 底部贯通发丝线 = 页头三件套，页头最顶常驻羊毛云朵檐
- **糖果描边**：卡片/瓦片/胶囊一律 2px `--color-line` 可见轮廓（不是发丝边）；签名件用 2px `--clay-deep`
- 夜宵反相只换表面/文字/遮罩令牌，情感与人格色跨主题恒定

## Colors

调色板是一支粉调的编辑部油墨盘：纸面樱花粉浸染三档，墨色近黑带梅，两支配色一个像晒透的玫瑰花瓣、一个像晨雾里的薄荷。

### Primary（我 · 玫瑰粉）
- **Rose Clay 晒透玫瑰粉**（#BE4E67）：唯一动作色与激活态色——主按钮、导航激活药丸、强调链接、选中态。clay 色阶 00–90 覆盖浅底到深底全部场景
- **Rose Light 玫瑰高光**（#EA98AA, clay-40）：hover 与激活浅底
- **Deep Plum Rose 深梅粉**（#7F2A3D, clay-90）：渐变收尾与按压态

### Secondary（TA · 鼠尾草）
- **Morning Sage 晨雾鼠尾草**（#A4C39E, sage-40）："TA"的一切——身份渐变、选中态（如谁买单的 TA请）、sage 系徽章
- **Sage Haze 薄荷高光**（#BBD3B5, sage-30）：TA 侧浅底

### Tertiary（情感与数值）
- **Rosegold 玫瑰金棕**（#9A575F，夜宵提亮为浅玫瑰金 #C08492）：所有价格数字与金额，衬线呈现——"钱"在这个家里由玫瑰金棕负责
- **Rosegold Deep 焦糖实底**（#8A4E56，**不随夜宵反相**）：caramel 的**填充**专用变体——仅用于"亮字压在焦糖底上"的徽章（AA 买单 chip、热榜 NO.3 铜牌等）。文本色 `--color-caramel` 夜宵会提亮成 #C08492，作实底时其上 on-dark 亮字会掉到 ~2.9:1 不达标；徽章底必须用这个不反相的深档
- **Rose Blush 玫霞粉**（#D96488）：收藏/喜爱态与购物车角标（纯情感角色）
- **Danger Magenta 洋红红**（#C13E4E）：删除与错误警示的**唯一色源**（Cart 移除钮、AdminDishes 删除钮、EmptyState `tone="error"` 的断联/找不到态、Admin 密码门错误文字）。小字与标题级文字警示一律吃 `color-mix(in srgb, var(--color-danger) 70%, var(--color-bone))` 混色——bone 随夜宵反相，白天/暗底两档自动过 AA。love×danger 双源旧账已结案：love 只管情感，danger 只管警示

### Neutral（纸与墨）
- **Rosy Paper 浅樱粉**（#FCE7F0）：页面底（浅档浸染）（夜宵 → 深莓紫 #241B21）
- **Rose Block 玫瑰粉区块底**（#FADCE9）：区块/安静按钮底
- **Card Paper 卡面粉纸**（#FFF4F8）：主卡面；**Dock Paper 药丸纸**（#FFF9FC）：停靠层与深底上的白字（on-dark）
- **Ink 墨**（#2B2429，夜宵 → #F3ECEF）：主文字；**Ash 灰**（#5F5259）：次文字；**Mist 雾**（#5E4F56）：占位/三级（全纸浸染各底 ≥4.5:1）
- 发丝边框统一 `rgba(43,36,41,0.08)`——墨的低浓度，不是新颜色

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
**The Price Wears Caramel Rule（钱穿玫瑰金棕）.** 一切金额/价格 = 衬线 + caramel；字号随场景，颜色与字族不换。
**The Eyebrow Rule（眉题规则）.** 页头副标题一律大写宽字距小字（0.18em/11px/700），衬线大标题之下、发丝线之上——杂志 kicker 是页面的"栏目名"。

## Layout

单列"手机杂志"模型：**480px 壳宽**（`--shell-w` 全站唯一真源）居中于桌面视口；页面左右边距 24px（`--space-page-x`），区块纵向节奏 24px（`--space-section`），卡内边距 16px（`--space-card-p`）。内容容器一律走 `PageContainer`，不得各页自定边距。

**底部停靠层（DockLayer）是全站唯一常驻固定层**：导航药丸与购物车球并排同一行（行高 72px、球径 64px、间距 12px、底衬安全区 `max(env(safe-area-inset-bottom), 16px)`），内容页底部内边距用 `--bottom-inset` 系列，杜绝散落的 `pb-28` 魔法数。购物车为空时球槽不渲染、药丸自然居中。

**Hero 溶底**：大图页面用多档纵向渐变（`--hero-wash-immersive` 五段 / `--hero-wash-functional` 单档）把图片溶进纸底，图片滤镜像素级参数（`--hero-filter-*`）随主题反相——图是版面的一部分，不是贴在纸上的照片。响应式：断点极少，`@media` 仅 reduced-motion 一处降级；宽度自适应靠壳约束。

## Elevation & Depth

混合体系：**纸面分层为主、暖调阴影为佐**。2026-09 严格重制后，backdrop-blur 玻璃只允许出现在导航/操作层（停靠药丸、吸顶栏、悬浮按钮、模态遮罩）；内容层卡面一律纯色粉纸 + 阴影分层。深度感来自"纸面四档（樱花页底/玫瑰区块/深玫瑰次级/粉纸卡面）+ 发丝边 + 阴影"的层叠，而非真实透明。

### 阴影词表（暖墨阴影，rgba 基座 = ink 43,36,41；夜宵换纯黑系并加强浓度）
- **shadow-1**（`0 1px 2px rgba(43,36,41,.05)`）：发丝级贴底（返回钮、静默卡）
- **shadow-2**（`0 2px 8px .06`）：卡片静止态
- **shadow-3**（`0 8px 24px .08`）：停靠层/浮起
- **shadow-4**（`0 16px 44px .12`）：模态/弹层
- **shadow-5**（`0 30px 70px .16`）：最高层（全站罕用，预留）
- **glow-clay / glow-sage**：双人格聚焦晕（3px 环 + 20px 扩散），激活/脉冲专用

### 命名法则
**The Warm Shadow Rule（暖墨阴影）.** 亮色模式禁止纯黑阴影；rgba 必须带 ink 的棕相。
**The Glass Recedes Rule（玻璃退后）.** 玻璃模糊是操作层的特权；内容卡是纸，不是玻璃。

## Shapes

形态语言 = **糖果描边圆角矩形 + 羊毛云朵檐 + 贯通发丝线**。圆角五档标尺：卡 24px / 底部浮层顶 28px / 瓦片与小卡 16px / 按钮 12px / 输入与小控件 8px；Tailwind 默认 rounded-lg/xl/2xl 被有意保留未覆盖（避免既有用法静默位移）。**同心圆律**：卡 24 − 内边距 16 = 控件 8，嵌套圆角永远内收。胶囊（chips/药丸/角标）一律 `rounded-full`，是版面里唯一的"全圆"家族。

**描边两档（2026-09-21 V3 设计稿换装，取代原"一律 1px 发丝边"）**：
- `--color-line`（`rgba(43,36,41,.14)`，夜宵 = bone 20% 混色 ≈ #4D4347）：**普通卡片 / 瓦片 / 输入 / 胶囊**的可见轮廓。发丝边（`--color-glass-border`，8%）从此只用于"纸的接缝"——区块分隔线、页头贯通线、列表行内规则线，不再做卡片外框。
- `--clay-deep`（#7F2A3D）：**签名件**专用——娃娃机机身、主按钮、激活胶囊、购物车球、加号钮。它是"这台机器/这个动作"的强调，不参与常规卡片。

装饰性线装：区块标题前缀 clay 短线、页头底部 1px 发丝线、机头与瓦片之间的 `2px dashed --color-line` 缝（娃娃机的"机壳拼缝"语言）。3D 工具类仅供 StoveStage 使用。**羊毛云朵檐**（`.wool-edge`）与**草地收边**（`.grass-hem`）是这一版新增的两个世界件：前者常驻页头最顶（全站唯一的机器语言，吸顶跟随），后者只收在首页/宵夜页的页尾。

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

### 签名组件：ClawMachine 抓娃娃点餐机
首页第一焦点（夜宵页为宵夜变体）：机顶羊毛檐 + 机名 + `No.xx` 糖牌 + **泡泡时钟**（clay 实底胶囊，实时时间，全站唯一的时间显示），机腹玻璃罩内是**自绘抓取机构**——顶部轨道 + 滑车 + 缆线 + 三指开合爪；被抓的"物品"= 当前主推菜圆盘（实拍图 / 分类 emoji 兜底）。点罩子任意处或底部「抓取」即演一遍完整抓取（下爪→合钳星芒→提起→横移落槽→彩纸+机身一震+"抓到「X」"浮标），**落槽一刻回调 `onCatch(dish)` 直接加购**——即产品机制「抓一个算一个」。底部出菜面板（菜名点看做法 + caramel 价格 + 抓取按钮）。自动轮换时走一条 clay 进度条预告下一次（≈0.95s 低频签名动效，不受 UI 300ms 档约束）。

⚠️ 工程纪律（2026-09-22 所有者确认「认可自绘」）：**机构自绘是现行真相**——V3 由所有者要求"独立可交互有动画特效"，故组件自带轨道/缆线/三指爪，抓取物为主推菜圆盘而非官方玩偶。旧版"不画机构、交给官方素材悬吊"的做法与其配套资源（`CLAW_POOL` / `.claw-sprite`）**已从 hero 退役**，官方角色素材现只出现在 PageHeader 徽记（`Character`）与 EmptyState。原"不要给娃娃机画爪钩/横梁/缆线"红线就此解除；不要再往机腹塞官方抓娃娃玩偶素材，否则与自绘机构重影。

### 角色素材：官方图 × 自绘小羊的分工
- **官方素材**（`theme/characters.js` → `ui/Character.jsx`）：大尺寸与静态肖像位——页头徽记（白天懒羊羊 / 夜宵灰太狼值班）、空态主图。素材自带配色，不继承 `currentColor`，**必须给托底容器**（圆底或卡片）。
- **自绘 LazySheep**（`ui/LazySheep.jsx`）：小尺寸 + 需要表情状态的地方——购物车球（0/1/4/8 件四表情）、加载态陪等、灶边陪等、身份徽章 happy、App 骨架环（22px）。官方素材没有多表情，缩到 20–30px 也读不出是谁。
两套并存是刻意的分工，不是混搭：一个负责"官方正脸"，一个负责"表情与极小尺寸"。

### 订单状态三段跑灯 `.status-seg`
订单详情页灶台上方一整排（取代原页脚一枚小胶囊）：已走完的段转 sage 实底、当前段 clay 实底 + 一次性脉冲、未到的段安静纸面。**clay 在此处用于"进行态"而非装饰底**，与 StoveStage 灶火同色同义——这是 One Voice Rule 的显式豁免项。

### 图鉴盘底 `--plate-bg`
菜品/角色的圆形图鉴位（娃娃机主推圆盘、菜品行缩略图）必须消费这个令牌，不要自己写 `radial-gradient(on-dark → surface)`：`--color-on-dark` 不随夜宵反相、`--surface` 反相，两个端点分属不同色系，夜宵下会渲染成一颗"灰球"（实测踩过）。令牌两端同族，双主题各自成立。

## Do's and Don'ts

### Do
- **Do** 新页面一律 `PageHeader + PageContainer + DockLayer`（后台三页例外，包 `AdminShell`）；边距节奏只吃 `--space-*` 标尺
- **Do** 颜色只写进 `src/index.css` 与 `src/theme/persona.js` 两处，页面消费 `var(--color-*)`；给运行时内联 var() 用的令牌必须放 `@theme static`（防树摇）
- **Do** 人格/情感语义走 persona.js 映射（clay=我、sage=TA、caramel=钱、love=收藏）；新增调用点 <2 的组件不建，≥2 才进 `components/ui/`
- **Do** 深色锚点卡上的白字统一 on-dark 暖白 #FFF9FC；深色实底与白字组合必须达 WCAG AA（clay-60 现值即为此校准）
- **Do** clay 做**小字链接/标签前景**（写在纸面上，非填充）时走 `--color-clay-text`（=clay-70，纸面 ~5:1 达 AA）；`--color-clay`（clay-60 ~4.0:1）只作**填充**配白字，不作小字前景
- **Do** 压在人格渐变实底上的文字/图标一律取 `persona.on`（`theme/persona.js`：me→on-dark，partner→on-sage）；白字在 sage 上仅 ~1.9:1，TA 模式主操作必须吃 on-sage
- **Do** 页转场只动 opacity（`pageEnter`），位移动画放内层 `contentEnter`——外层 transform 会杀死 sticky 页头
- **Do** 图标取自 `ui/Icons.jsx` 细线 SVG（24 viewBox/currentColor）；文案进 `lib/sweetCopy.js` 单源
- **Do** 动效吃 `--dur-fast/base/slow` + `--ease-soft`，并为 `prefers-reduced-motion` 留降级

### Don't
- **Don't** 在 JSX 硬编码十六进制色（静态门禁 `p6_static_gate.py` 会拦：白名单外即红，(43,36,41) 墨系除外）
- **Don't** 给导航/快捷入口新增 emoji 图标；Don't 用纯黑阴影或冷白 #FFFFFF 卡面
- **Don't** 把 clay 用作大面积装饰底（见 The One Voice Rule；`.status-seg` 进行态是显式豁免）；Don't 一屏放两块深色锚点卡
- **Don't** 给内容层卡面开 backdrop-blur（玻璃退后律）；Don't 在 `--radius-*` 标尺外随手写圆角值
- **Don't** 往娃娃机机腹塞官方抓娃娃玩偶素材（V3 已改为自绘机构抓主推菜盘，叠官方玩偶会重影）；Don't 把官方角色素材放进小于 30px 的槽位（会读不出是谁，用自绘 LazySheep）
- **Don't** 自己写图鉴盘底渐变（必须消费 `--plate-bg`，否则夜宵下变灰球）
- **Don't** 在页面包裹层加 transform（转场禁令）；Don't 绕过 `mockApi`/`fetch` 直连数据——接口语义改动 mock 与 server 两端必须同步
- **Don't** 提议 WeUI/扁平微信风（所有者已实测否决并 revert，见 PROJECT-HANDOFF 台账）
