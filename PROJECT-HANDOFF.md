# 项目交接文档 · 晨光厨房（food-ordering-miniapp）

> **给接力的 AI / 开发者**：本文档自包含，读完即可接手。
> **协作铁律：每一次代码/数据/文案修改，都必须同步更新本文档（进度表、文件地图、坑清单按需），随代码一起提交。** 这是项目所有者定的规矩。
> 最后更新：2026-09-17　代码 HEAD：编辑杂志换装轮（本轮提交）　工作区：干净
> 注：本文档自身的 docs 提交在代码 HEAD 之后，仓库实际 HEAD 会多一笔，属正常。

---

## 0. 项目身份与位置

- **是什么**：情侣点餐 H5 小程序（480px 手机竖屏框）。**男朋友视角的文案，写给女朋友——昵称「懒洋洋」**，所有面向用户的标题/情话都按此人设写。
- **位置（2026-08-29 已迁移）**：`E:\晨光厨房-交付包\extracted`（应用仓库）；交付包根目录还有 4 个历史 zip 与本文档副本 `PROJECT-HANDOFF-晨光厨房.md`（与仓库内本文档保持同步）。
- **当前状态**：重构（P0–P6）已完成验收；之后又经多轮实测打磨（视觉层次、文案个性化、HowToCook 数据源灌库、菜谱卡）。处于**个人使用 + 持续迭代**状态。

## 1. 跑起来

```bash
cd E:\晨光厨房-交付包\extracted
npm install        # 仅首次/换机器
npm run dev        # http://127.0.0.1:5173/
npm run build      # 构建验证（也可 --outDir 任意临时目录）
npm run lint       # oxlint；入口 ./node_modules/.bin/oxlint
npm test           # mockApi 冒烟测试（scripts/test_mockApi.mjs）
python scripts/p6_static_gate.py   # 色值单源/暗色残留/断头路 三项静态门禁
```
- dev server 启动后**必须 HTTP 探测**确认（vite 输出有缓冲）：`GET /` 的 `<title>` 应为「晨光厨房 · 今天想吃什么」。
- `/api/*` 直连会 502（vite 代理指向不存在的 :3000）——**正常现象**，浏览器端 mock 层在 fetch 阶段拦截，应用不受影响。

## 2. 技术栈

React 19 + Vite 8 + Tailwind v4（`@theme` 令牌）+ React Router 7 + Framer Motion 12 + localStorage 模拟后端（`src/lib/mockApi.js`，离线可用）。

## 3. 设计语言（不可改的部分）

**晨光厨房 Sunlit Kitchen** —— 暖骨白亮色 + 双人格温度对比：

| 令牌 | 值 | 语义 |
|---|---|---|
| `--color-ink-900` | `#FDFBF7` | 页面底（暖纸白，2026-09-17 提亮后） |
| `--color-bone` | `#2B2620` | 主文字 |
| `--color-clay` / `-soft` | `var(--clay-60)`=`#DD794E` / `#F99E78` | 我(🐱) 蜜橘暖（2026-09-17 提亮后回退 clay-60 折中档；soft 仍 clay-40） |
| `--color-sage` / `-soft` | `#A4C39E` / `#BBD3B5` | TA(🐰) 薄荷绿冷（2026-09-17 提亮 = sage-40/30） |
| `--color-caramel` / `love` / `danger` | `#B5793F` / `#D98C84` / `#C2543F` | 价格数字 / 喜爱 / 删除 |
| `--color-ash` / `mist` | `#6B6155` / `#9A9082` | 次文字 / 占位 |

核心语义必须保留：**双人格（我/TA）、购物车、谁买单（AA/我请/TA请）、收藏**。

**视觉层次原则（2026-08-29 实测打磨定稿）**：每屏一个深色锚点（首页主推卡、购物车合计卡 = clay 实底白字，其余浅色玻璃）；价格数字一律 caramel 衬线、clay 只留给动作/激活态；图片背景用 FullBleedHero 的多档纵向溶底叠层，不与玻璃卡硬碰；导航/快捷图标用 `ui/Icons.jsx` 细线 SVG（激活态白色），不再新增 emoji 图标。

**编辑杂志换装（2026-09-17）**：在晨光厨房色板与四大核心语义不变的前提下换装为「编辑杂志质感」——卡片由半透玻璃改为暖纸实底（`--color-glass: #FFFDFA`）+ 发丝边框 + 浅投影；圆角整体收敛（card 28→20px）；品牌渐变从 135° 粉橙对改为 180° 深赤陶/深鼠尾草（低饱和"专色"感）；页面边距 16→20px、区块节奏 20→26px、行高 1.6→1.7、display 字阶 34→40px 收紧字距；PageHeader 改为眉题（kicker 大写字距）+ 大衬线标题 + 底部贯通发丝线；SectionHeader 前缀赤陶短线；首页主推卡徽章改 No.xx 编号眉题。夜宵模式与 reduced-motion 降级逻辑未动。若所有者不喜欢，revert 本轮提交即可整体回退。

## 4. 架构约定（改代码前先读）

1. **页面转场绝不能带 transform**（App.jsx `pageEnter` 纯 opacity），否则 PageHeader 吸顶失效、FullBleedHero 错乱。位移用 `contentEnter` 放内层。
2. **DockLayer 是全站唯一常驻底部固定层**（导航+购物车球并排同行）。购物车为空时球槽不渲染（药丸自然居中），加购时药丸以 `layout` 动画让位——不要恢复恒定占位。
3. **所有用户侧页面用 `PageHeader`**（back/backTo/right）；后台三页一律包 `AdminShell`。后台标题保持功能命名（工具页不加情话）。
4. **颜色单源真值**：色值只写在 `src/index.css` + `src/theme/persona.js`；页面一律 `var(--color-*)`；给运行时 var() 用的令牌放 `@theme static`（防树摇）。新玻璃浓度用 `--glass-strong`。
5. **文案单源真值**：所有页头标题/情话池集中在 **`src/lib/sweetCopy.js`**（NICKNAME='懒洋洋' + 各页标题/副标题池），六页每次进入随机抽取。**改情话只动这个文件**；新增页面文案也放这里。
6. **不可变文件（最小改动，改须逐处说明）**：`src/components/CartContext.jsx`、`src/lib/mockApi.js`（已因数据接线 +2 行与菜谱注入 +3 行，均有据）、`src/lib/favorites.js`。
7. 共享组件放 `src/components/ui/`，≥2 处真实调用点才建；`Icons.jsx` 是图标基元集，单调用点也保留。
8. 提交信息用中文，说明「为什么」；**提交前跑 lint + build + `p6_static_gate.py`**。
9. **四件套别用 `2>&1 | Select-Object` 吞退出码**：构建失败时管道可能仍返回成功假象，判定必须看 `built in` 成功行或 `$LASTEXITCODE`（本轮 ui/ThemeToggle 曾把 `../theme` 写成少一层，就是靠 build 报错抓到的）。`src/components/ui/` 下引主题模块一律 `../../theme/`。

## 5. 数据层（菜品 407 道 + 菜谱 342 份）

- 种子库 = `mockApi.js` 内 65 道原始菜 + `src/lib/seedMenuExtra.js`（**342 道，由 HowToCook 生成**，勿手改）。
- 数据源：[Anduin2017/HowToCook](https://github.com/Anduin2017/HowToCook)（**公有领域/Unlicense**）。生成器 `scripts/build_htc_seed.py` 一条命令产出三件套：菜品摘要（seedMenuExtra.js）、本地压缩预览图（`public/dish-images/htc/`，153 张 560px/JPEG）、菜谱（seedRecipes.js）。
- **菜谱数据**：`src/lib/seedRecipes.js`（352KB，键=菜品 id，含 原料清单/步骤/难度星级/卡路里/小贴士）。**懒加载**：仅详情页经 mockApi 动态 import 注入 `/api/dishes/:id` 响应，列表与首屏不背体积。
- 详情页「男朋友的菜谱」卡：原料 pill + 编号步骤 + 💡小贴士；原 65 道老菜无菜谱数据，卡片自动隐藏。
- 重新生成：`python scripts/build_htc_seed.py --repo <HowToCook 克隆目录> [--img-src <已抢救图片目录>]`（图片幂等缓存，已存在不联网）。
- **国内网络坑**：raw.githubusercontent 不可达；jsDelivr 的 gh 代理最终跳 raw 也不可达；git 批量协商大包会被重置。可行路径：稀疏克隆只取 md（`--filter=blob:none --sparse`）+ 单 blob 按需取（小请求可过）+ codeload tarball 部分解压兜底。git 输出中文路径需 `-c core.quotepath=false`。

## 6. 关键文件地图

```
src/
├── App.jsx                  路由+外壳（纯 opacity 转场、DockLayer、--bottom-inset）
├── index.css                @theme 色板 + @theme static 标尺 + 组件类(.glass/.d3-*/.section-title)
├── theme/
│   ├── persona.js           PERSONA/ORDER_STATUS/PAYER + helpers（双人格真源）
│   ├── useTheme.js          ★主题源：时段判定(21-5点night)+手动覆盖仅当时段有效+跨界/回前台自动回归
│   ├── motion.js            pageEnter(纯opacity!)/contentEnter/cardEntrance/sheetUp/tapScale
│   └── images.js            HERO_IMAGES/三级图片回退
├── lib/
│   ├── mockApi.js           模拟后端（不可变*，改动须逐处说明）
│   ├── favorites.js         收藏 hook（不可变）
│   ├── categoryIcons.js     品类 emoji 与菜品图
│   ├── seedMenuExtra.js     HowToCook 灌库菜品 342 道（生成，勿手改）
│   ├── seedRecipes.js       菜谱数据 342 份（生成，懒加载，勿手改）
│   └── sweetCopy.js         ★ 全站个性化文案池（懒洋洋昵称 + 各页标题/情话，随机抽取）
├── components/
│   ├── DockLayer.jsx        ★唯一常驻底部固定层（空车药丸居中，球槽随购物车挂载）
│   ├── PageHeader.jsx       ★统一页头（back/backTo/right）
│   ├── FloatingPillNav.jsx  4 tab 导航（SVG 图标，激活态白）
│   ├── D3CartOrb.jsx        购物车球（入场/退场由 DockLayer 编排）
│   ├── GlassCard / FullBleedHero / D3StatusRing(--ring-size) / KissIcon / AddDishModal
│   └── ui/                  共享组件：Icons(细线图标集)/DishRow/OrderCard/EmptyState/
│                            LoadingState/PayerSelector/Stepper/StatCard/SectionHeader/
│                            Chip/PageContainer/AdminShell/ThemeToggle(页头夜宵快捷钮)
├── pages/                   10 页：Home/Menu/DishDetail/Cart/MyOrders/OrderDetail/
│                            Profile/Admin/AdminDishes/AdminOrders
│                            （Checkout、Favorites 已删，路由保留重定向）
public/dish-images/htc/     HowToCook 预览图 153 张（生成）
scripts/
├── p6_static_gate.py        静态门禁自检（色值单源差分/暗色/断头路）
├── build_htc_seed.py        HowToCook 灌库生成器
└── test_mockApi.mjs         mockApi 冒烟测试（npm test）
```

## 7. 进度台账（关键提交速查）

| 轮次 | 内容 | 提交 |
|---|---|---|
| 换肤 T1–T12 | 暗房晚宴 → 晨光厨房 | `6c6dc17`+`e208a8c` |
| 重构 P0–P3 | 令牌标尺/DockLayer+PageHeader/ui组件/结算并入购物车/AdminShell/收藏并入点菜 | `b6365f7`→`21d81b5` |
| P4 逐页重排 | favorites 重定向删页/Home 收敛 3 隐喻/DishDetail 修边+Stepper/OrderCard 统一/状态环令牌化 | `8c05af6`→`0d60f2b` |
| P5 质感 | 硬编码字号/圆角清零 + serif 数字 | `ad1ca26` |
| P6 验收 | 11 项门禁 + preview 重写为 10 屏 | `76280e6` |
| 视觉打磨① | 沉浸式叠层溶底 + 停靠层 --glass-strong | `8295012` |
| 视觉打磨② | 空车药丸居中（球槽随车挂载 + layout 动画） | `1e040bc` |
| 视觉打磨③ | 深色锚点卡（Home 主推/Cart 合计）+ 价格转 caramel + 人格徽章 + 四色快捷入口 + 字阶对比 | `5a9e6df` |
| 视觉打磨④ | 细线 SVG 图标集 ui/Icons（激活态转白） | `8659883` |
| 交互修正 | 删首页快捷入口（与底部导航重复） | `cc61606` |
| 数据源 | HowToCook 灌库 65→407 道菜 + 153 本地图 + 生成器 | `90dab1d` |
| 灌库配套 | 图片 onError 回退 emoji + 0 菜分类隐藏 | `4c4d586` |
| 个性化① | 首页欢迎语男朋友口吻（懒洋洋） | `e569fb0` |
| 个性化② | 各页页头文案统一男朋友口吻 | `7a4a32f` |
| 个性化③ | 页头文案随机化（sweetCopy.js 文案池） | `bd29ddf` |
| 功能 | 详情页「男朋友的菜谱」卡（342 份懒加载菜谱） | `249a8ef` |
| 交互修正② | 首页「换一道」原地换菜（此前误绑跳转菜单页）+ 主推位只用带实拍图的菜（无图菜 emoji 大卡太素），常点网格随轮换顺移 | `823dbd7` |
| 后台分页 | AdminDishes 同款「初始 30 条 + 加载更多」（407 行全量渲染是第二遍体检的唯一新发现） | 见 fix(admin) 提交 |
| WeUI 试点（已回滚） | 尝试微信 iOS 风（#EDEDED/品牌绿/系统字体/扁平白卡）于首页+点菜页；所有者确认**不好看**，整体 revert。结论：本项目设计语言仍为晨光厨房，勿再提议 WeUI/扁平风 | `5d2a066` |
| 迁移 | 项目迁至 E:\晨光厨房-交付包（本目录） | （无代码变更） |
| 旧命名清零 | AddDishModal 全量迁移新令牌（新增 --color-clay-deep 深赤陶）；index.css 删除全部历史别名定义（cream 系 13 处用法迁至 ink-900/850）；Icons 新增 gear 并推广到后台快捷入口 + Profile（3 调用点）| 本轮 |
| 质量体检轮 | 全工程审计后修复：灵感卡打字乱跳（改吃全量池）、死 Fredoka 字体、死端点 categories 移除、Fisher-Yates 无偏洗牌、featIdx 归零、状态 emoji 统一 🎉、Menu 列表分页（初始 30+加载更多）、mockApi 内存态缓存；新增 mockApi 冒烟测试 8 项（npm test）；README 重写 + prd.md 标注历史；preview 同步最新视觉 | 本轮 |
| 编辑杂志换装 | 全站视觉换装「编辑杂志质感」（所有者选定）：纸面卡/收圆角/深专色渐变/松间距/大衬线/眉题页头/编号主推卡；StoveStage、HotDishes 两处硬编码色收编令牌；DishDetail 价格补对齐 caramel 原则。build/lint/test/静态门禁全过 | 本轮 |
| Vercel 动效工程 | 参考 emilkowalski/skills（Vercel/Linear 设计工程师）的动画规范整改全站动效：① scale(0) 起跳全改 ≥0.9 淡入（DockLayer 购物车球、D3StatusRing、Cart 庆祝），去 180° 翻转/旋转 ② UI 动画压进 300ms 档（cardEntrance 500→340ms，状态环内盘 600→400ms 去 [0.34,1.56] 过冲曲线）③ 高频按压收敛到 0.92–0.97（Stepper/DishRow/收藏星/移除等多处），Stepper 数字弹跳去旋转、弹簧 stiffness 320/damping 26 去"跳跳床"④ 移除按钮 hover 90° 旋转、购物车球 hover 上浮等高频表演元素；Menu 清空按钮回弹曲线改标准 ease-out。顺带：PAYER 补 fill 字段（单源），OrderDetail 买单徽章改实底高对比（AA 底 #96612E 白字 ≥5:1）、备注分隔线与 +1 粒子收专色。装饰性低频动画（StoveStage 蒸汽/✨）按规范豁免保留。全部门禁通过 | 本轮 |
| 双人格色阶 | 参考 yeun/open-color（MIT）补齐 clay/sage 各 10 档色阶，写入 index.css 的 @theme static（--clay-00..90 / --sage-00..90）。推导法：open-color 全 13 色族 130 值 → CIE LCh(D65) → 逐档均值曲线 → 以现主色为锚点做明度加法平移 + 彩度比值缩放 + 色相均值漂移，越出色域裁剪彩度。锚定档 clay-70=#C8683F、sage-60=#7FA37A 与现值逐字节相同，本轮纯基础设施、页面观感零变化，无组件被迫改用。待办：hover/active/disabled 与夜宵模式择机绑定色阶档（当前仍是临时 rgba 拼） | 本轮 |
| 提亮方案一 | 所有者反馈"太暗沉"，主色沿色阶上提：clay #C8683F→#EC8A60(clay-50)、sage #7FA37A→#A4C39E(sage-40)，soft 各提一档；ink 三档底与 body-bg/scrim/hero-wash 同步提白；渐变改为 新主色→原锚点 的同族双档（观感更透但白字对比降至 2.5:1，深端 clay-70+ 兜底按压/夜宵）；全站 26 文件旧人格色 rgba 与旧 hex 字面量统一迁移，HotDishes 榜单色收编令牌；夜宵模式人格色不反相原则不变。build/lint/test/静态门禁全过 | 本轮 |
| 主色回退 clay-60 | 所有者预览提亮版后拍板回退折中档：`--color-clay` → `var(--clay-60)`=#DD794E，深色锚点卡（Home 主推/Cart 合计）白字对比 2.5:1 → 约 4.5:1 达 WCAG AA；soft/deep/sage/PAYER.fill 均不动。交接文档 §5 曾误写 #DC794E，以色阶真值 #DD794E 为准 | `afb6f78` |
| 色阶绑定收敛 | 全站 clay/sage/caramel 系硬编码 rgba/hex 统一绑到 `--clay-N0/--sage-N0` + `color-mix()`：SEED 层（index.css 组件类/辉光令牌/别名共 20 处、persona.js 16 处、motion.js 默认参 1 处）+ 页面/组件层 36 处清零，渲染值逐处等价（Tailwind 4/Lightning CSS 会输出 color-mix+hex8 双份，旧浏览器走回退，兼容稳）。**有意不绑**：① ink 系 rgba(43,38,32,x)（--color-bone 夜宵反相，绑了会改暗底观感）② persona ORDER_STATUS.ring 数组（D3StatusRing 有 `${ring[1]}30` 后缀拼接与 motion 描边插值，framer 不解析 var）③ PAYER.fill（保白字 ≥5:1 深锚）。绑定惯例：hover→20/30、按压→70、深文字→80/90、alpha 底按旧 rgba 的档位等价映射（clay-50/sage-40 系） | 本轮 |
| 夜宵提亮 | 所有者反馈夜宵模式（21:00–5:00 自动开启）"背景太深"：night 块整体抬亮——ink 三档 #16130F/#1F1A15/#2A241D → #232019/#2C2720/#383128（保棕相），body-bg radial 两端 #332C23→#1B1812，玻璃雾 0.05→0.08、发丝边 0.14→0.16，scrim/hero-wash/glass-strong 同步，Hero 压暗 22%→12%（brightness 0.78→0.88、functional 0.5→0.62）。人格色反相原则不变，亮色模式零影响。build/lint/test/静态门禁全过 | `de2c13b` |
| 夜宵开关可发现性+自动跟时 | 所有者两点反馈：①夜宵下开关位置不明显 → 新增 `ui/ThemeToggle.jsx`（玻璃钮，夜宵自动反相可见）注入四个 tab 页 PageHeader right 槽常驻；个人页开关关闭态轨道 rgba(43,38,32,.16) 绑到 bone 反相令牌（晨光渲染值不变，夜宵不再隐形）②要求随时间自动开启 → useTheme 重写：手动值带"生效时段戳"（凌晨归前一晚），跨过 05:00/21:00 边界自动回归时间规则；60s 轮询 + visibilitychange 回前台重算兜底（H5 后台 interval 不可靠）。副标题改「深夜 21 点后自动开，也可手动切」。时段逻辑一次性验证 9 项全过；?theme= 调试钩子保留且其生效期间暂停轮询接管（预览手动切换不被重置） | 本轮 |

## 8. 已知待办 / 候选项

- 测试覆盖仅 mockApi 冒烟（8 项），UI 组件无自动化测试——demo 项目可接受，引入框架时优先补 DishRow/OrderCard。
- D3StatusRing 内圈一处 rgba(0,0,0,0.5) 暗影为有意保留（深色内盘上的暗影）。
- ~~AddDishModal 旧命名残留~~ ✅ 已清零（见台账「旧命名清零」）；~~preview 落后~~ ✅ 已同步（但 clay-60 回退与色阶绑定后的 preview 仍未重建，观感等价影响小）。
- ~~hover/active 状态色绑定色阶~~ ✅ 人格色家族已全量绑定（见台账「色阶绑定收敛」）；ink 系中性灰 rgba **有意不绑**——--color-bone 在夜宵模式反相，若 rgba 绑 bone 会改变暗底观感（违反等价原则），需要时另立语义令牌。

## 9. 色值审计方法（门禁脚本已实现）

白名单种子 = `index.css` + `theme/persona.js` + `theme/images.js` 全部色值；允许项：bone 正文、深赤陶、黑/骨 rgb 阴影、纯白系。逐文件差分，越界即残留；另跑暗色检测（max(R,G,B)<0x50 且不在允许集）。见 `scripts/p6_static_gate.py`。2026-09-17 色阶绑定收敛后，页面/组件层人格色统一为 `var(--clay-N0)` + `color-mix()` 写法（不含 hex 字面量，天然不过门禁差分）；SEED 层内残留的少量 hex（ring 数组/PAYER.fill/色阶真值本身）属白名单豁免，勿再"顺手"迁移。

## 10. 给接力的开场白模板

> 请先读 `E:\晨光厨房-交付包\extracted\PROJECT-HANDOFF.md`。遵守第 4 节架构约定与第 5/9 节的坑，改动前跑 `npm run build`、`npm run lint`、`npm test`、`python scripts/p6_static_gate.py` 复验。**每次修改同步更新本文档（进度台账 + 文件地图 + 坑清单），随代码一起提交。** 文案改 `src/lib/sweetCopy.js`，菜品/菜谱数据用 `scripts/build_htc_seed.py` 重新生成。
