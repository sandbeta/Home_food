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
- `/api/*` 直连会 502（vite 代理指向 :8787，dev 时家庭服务端通常未启动）——**正常现象**，浏览器端 mock 层在 fetch 阶段拦截，应用不受影响。家庭局域网共享部署见 §10。

## 2. 技术栈

React 19 + Vite 8 + Tailwind v4（`@theme` 令牌）+ React Router 7 + Framer Motion 12 + localStorage 模拟后端（`src/lib/mockApi.js`，离线可用）；可选**家庭本地服务端** `server/index.mjs`（零依赖 Node + JSON 文件持久化，数据不出家门，见 §10）。

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
6. **不可变文件（最小改动，改须逐处说明）**：`src/components/CartContext.jsx`、`src/lib/mockApi.js`（已因数据接线 +2 行与菜谱注入 +3 行、夜宵种子接线 +3 行 import/push 与 1 处注释更新、真实图覆盖表集中注入一段（表+两条 forEach，见 §5），均有据）、`src/lib/favorites.js`。
7. 共享组件放 `src/components/ui/`，≥2 处真实调用点才建；`Icons.jsx` 是图标基元集，单调用点也保留。
8. 提交信息用中文，说明「为什么」；**提交前跑 lint + build + `p6_static_gate.py`**。
9. **四件套别用 `2>&1 | Select-Object` 吞退出码**：构建失败时管道可能仍返回成功假象，判定必须看 `built in` 成功行或 `$LASTEXITCODE`（本轮 ui/ThemeToggle 曾把 `../theme` 写成少一层，就是靠 build 报错抓到的）。`src/components/ui/` 下引主题模块一律 `../../theme/`。

## 5. 数据层（菜品 432 道 + 菜谱 342 份）

- 种子库 = `mockApi.js` 内 65 道原始菜 + `src/lib/seedMenuExtra.js`（**342 道，由 HowToCook 生成**，勿手改）+ `src/lib/seedNightExtra.js`（**25 道夜宵手写种子**，id 900-924，emoji 占位无图）。
- **真实图覆盖表（2026-09-18 图片真实化）**：所有者要求预览图用真实照片、不用 AI 生成。`mockApi.js` 内新增 `REAL_IMAGE_OVERRIDES`（78 条 id→路径，集中一段、生成文件不动）+ 两条 forEach（覆盖应用 / AI 图清退）。图片来源 = HowToCook 仓库实拍 27 张（GitHub blob API 拉取：11 张直接覆盖原 `dish-{id}.webp` 路径不变、16 张入 `htc/`）+ Wikimedia Commons CC 照片 35 张（`public/dish-images/real/{id}.webp`，560px webp）。原 65 道 AI 图：35 道换真实图、19 道删文件清退留 emoji、11 道即上列覆盖。全库带真实图 231/432，其余 emoji 占位。⚠️ Wikimedia 搜索错配率高（菜单/街景/古画/人物像混入），所有新图经联系表逐张目检后才保留，宁缺毋滥。
- 数据源：[Anduin2017/HowToCook](https://github.com/Anduin2017/HowToCook)（**公有领域/Unlicense**）。生成器 `scripts/build_htc_seed.py` 一条命令产出三件套：菜品摘要（seedMenuExtra.js）、本地压缩预览图（`public/dish-images/htc/`，153 张 560px/JPEG）、菜谱（seedRecipes.js）。
- **菜谱数据**：`src/lib/seedRecipes.js`（352KB，键=菜品 id，含 原料清单/步骤/难度星级/卡路里/小贴士）。**懒加载**：仅详情页经 mockApi 动态 import 注入 `/api/dishes/:id` 响应，列表与首屏不背体积。
- 详情页「男朋友的菜谱」卡：原料 pill + 编号步骤 + 💡小贴士；原 65 道老菜无菜谱数据，卡片自动隐藏。
- 重新生成：`python scripts/build_htc_seed.py --repo <HowToCook 克隆目录> [--img-src <已抢救图片目录>]`（图片幂等缓存，已存在不联网）。
- **国内网络坑**：raw.githubusercontent 不可达；jsDelivr 的 gh 代理最终跳 raw 也不可达（2026-09-18 实测连 cdn.jsdelivr.net 也会被强制断连）；git 批量协商大包会被重置；codeload tarball 能连但国内速度 ~20KB/s 且长连接易被超时截断（12MB 断在半路）。**可行路径（2026-09-18 再验证）**：GitHub `git/trees?recursive=1` API 拿全树 + 单 blob API（base64）按需取图，小请求稳定快；Wikimedia Commons API 需系统代理开启才可达（直连 SSL 握手超时）。git 输出中文路径需 `-c core.quotepath=false`。

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
│   ├── seedNightExtra.js    夜宵手写种子 25 道（id 900-924，emoji 占位）
│   ├── nightRules.js        ★夜宵判定规则库（isNightSnack/nightPick，首页选品+点菜筛选共用）
│   ├── adminGate.js         ★公网 Admin 密码门（包装 fetch 捕获 401→弹层输密→换 cookie 重放；见 §10.5）
│   ├── seedRecipes.js       菜谱数据 342 份（生成，懒加载，勿手改）
│   └── sweetCopy.js         ★ 全站个性化文案池（懒洋洋昵称 + 各页标题/情话，随机抽取）
├── components/
│   ├── DockLayer.jsx        ★唯一常驻底部固定层（空车药丸居中，球槽随购物车挂载）
│   ├── PageHeader.jsx       ★统一页头（back/backTo/right）
│   ├── FloatingPillNav.jsx  4 tab 导航（SVG 图标，激活态白）
│   ├── D3CartOrb.jsx        购物车球（入场/退场由 DockLayer 编排）
│   ├── NightSnackSheet.jsx  ★夜宵开屏弹窗（进入夜宵即弹六宫格宵夜，一键加购；App 外壳常驻）
│   ├── GlassCard / FullBleedHero / D3StatusRing(--ring-size) / KissIcon / AddDishModal
│   └── ui/                  共享组件：Icons(细线图标集)/DishRow/OrderCard/EmptyState/
│                            LoadingState/PayerSelector/Stepper/StatCard/SectionHeader/
│                            Chip/PageContainer/AdminShell/ThemeToggle(页头夜宵快捷钮)
├── pages/                   11 页：Home/NightHome(夜宵专属首页)/Menu/DishDetail/Cart/MyOrders/OrderDetail/
│                            Profile/Admin/AdminDishes/AdminOrders
│                            （Checkout、Favorites 已删，路由保留重定向）
public/dish-images/         菜品预览图：htc/ 169 张（生成 153 + 真实化轮补 16）、real/ 35 张（Wikimedia CC）、dish-*.webp 仅存 11 张（均已被 HowToCook 实拍覆盖，其余 AI 图已删）
server/                    家庭本地服务端（零依赖 Node，双击 exe 或 npm run family，见 §10）
├── index.cjs              运行入口（CJS，兼 Node SEA exe 入口）：/api 一比一复刻 mockApi + 托管 dist（注入 __CHENGUANG_FAMILY__ 标记）+ 公网写门控（§10.5）+ state.json 原子持久化 + fatal 防闪退
├── admin-password.txt     公网管理密码（本机私有，gitignore；不存在=公网管理禁用）
├── public-mode.txt        内容为 1 时强制公网模式（HTTPS 隧道无 XFF 时必开，§10.5）
├── sea-config.json        SEA 打包配置（main=index.cjs）
├── 晨光厨房服务端.exe      pack:exe 产物（gitignore，88MB = node.exe 内嵌代码，dist/data 在旁）
└── data/                  seed-dishes.json(432)/seed-recipes.json(342) 出厂种子；state.json 运行时数据(gitignore)
scripts/
├── p6_static_gate.py        静态门禁自检（色值单源差分/暗色/断头路）
├── build_htc_seed.py        HowToCook 灌库生成器
├── test_mockApi.mjs         mockApi 冒烟测试（npm test）
├── export-seeds.mjs         导出菜品/菜谱种子 JSON → server/data（家庭服务端首启数据）
└── pack-exe.mjs             一键打 SEA exe（blob→复制 node.exe→postject 注入→清中间物）
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
| 夜宵场景落地 | 所有者反馈"夜宵模式点亮了，但菜品里没多少能当夜宵的"。双层修复（选定「两者都做」）：**数据层**——新增 `lib/seedNightExtra.js` 25 道经典宵夜（烧烤炸串/夜面炒饭/饺包馄饨/卤味辣锅/糖水暖饮，id 900-924 避开灌库段，emoji 占位同无图灌库菜机制），mockApi 接线（不可变文件三处改动：+1 行 import、+2 行 push、1 处注释 407→432），冒烟断言 407→432；**规则层**——新增 `lib/nightRules.js`（isNightSnack 关键词只匹配菜名+排除名单兜住可乐鸡翅/啤酒鸭类误伤；nightPick 命中<6 回退全池防夜宵空窗）。全库命中 70/432=16.2%（一次性脚本人工复核：新增 25 道全命中，存量粥/粉/串/糖水/卤味系命中合理）。接线：Home 夜宵模式下主推/网格/换一道整池收敛夜宵系（保序过滤，白天零变化）；Menu 分类 chips 首位旁增「🌙夜宵」伪分类（前端过滤，visibleCats 豁免空分类隐藏）。build/lint/test/静态门禁全过 | `4f2de14` |
| 夜宵开屏弹窗 | 所有者要求"夜宵模式开启时自动弹出夜宵菜品"。新增 `components/NightSnackSheet.jsx`（App.jsx 挂载，admin 路由不挂）：夜宵亮起当下自动端出六宫格宵夜 sheet（nightPick 池洗牌取 6，emoji+菜名+caramel 价+一键 + 加购走 useCart.addItem，「看全店」跳 /menu?cat=夜宵）。**每时段只弹一次**：localStorage 存 slotStamp 时段戳（useTheme 导出 slotStamp，凌晨归前一晚），先占坑再弹防重渲染重复打扰；跨到新夜宵时段自动恢复。Menu 增 ?cat= 热同步（与 ?fav=1 同款模式）。弹窗骨架与 AddDishModal 同款（遮罩+sheetUp 底部卡，reduced-motion 降级纯 opacity），文案进 NIGHT_SNACK_NOTES 池。build/lint/test/门禁全过 | `9a65127` |
| DishRow 收藏钮对齐 | 所有者截图反馈点菜页爱心与加购钮"歪歪扭扭"：心钮原 `right-2`(8px) 贴卡角，加购钮在内容区（右缘距卡边 --space-card-p=18px），且两钮半径不同（16 vs 20px）→ 圆心横向差 14px。改 `right-[calc(var(--space-card-p)_+_4px)]`：右缘 22px，圆心 38px 与加购钮圆心(18+20)同垂线，纵向上下呼应成一条轴。仅 DishRow 一处，Home 网格/后台 manage 变体不受影响（showFav 只在 Menu 开启） | `01c920f` |
| 夜宵改版（弹窗修复+专属首页） | 所有者两反馈：①**弹窗只在初次有效**——根因=上轮 SHOWN_KEY 按 slotStamp 做了"每时段只弹一次"持久化去重，同晚关过/刷新过就再也不弹。改为组件常驻 App 外壳 + isNight 转变即弹（light→night 切换、夜宵态刷新都触发；关一次后切页不重弹），废弃 localStorage 去重 ②**夜宵要另一套界面**——新增 `pages/NightHome.jsx`：深夜主推大卡（手动"换一道"，不做自动轮换陪吃更安静）+「这些点得多」双列网格每格一键加购 + 全店夜宵入口；App.jsx 路由层 `/home` 按 isNight 分发（懒加载分包），Home.jsx 撤销上轮的 nightPick 派生恢复纯白天版。文案池 NIGHT_HOME_TITLES/NOTES 进 sweetCopy。四大语义与底导不动。build/lint/test/门禁全过 | `51c8f36` |
| 菜品图真实化 | 所有者要求预览图全部真实照片、禁 AI 生成（实测确认原 65 张 dish-*.webp 带"AI生成"水印）。三批抓取：HowToCook 仓库实拍 27（GitHub blob API，jsDelivr/tarball 国内均不可用）、Wikimedia Commons CC 照片 35（代理开启后可达；三批共 115 搜，**联系表逐张目检剔除 33 张错配**——菜单/街景/古画/人物像混入率高，宁缺毋滥）、其余留 emoji。mockApi 注入 REAL_IMAGE_OVERRIDES 78 条+覆盖应用/AI 清退两条 forEach；19 张无真实图可配的 AI 图删文件。全库真实图 231/432，dish-*.webp 仅剩 11 张且均为 HowToCook 实拍覆盖。四件套全过 | `842cd6a`+`89c37b3` |
| 家庭局域网服务端 | 所有者要家庭使用+数据本地存储（选定"各手机共享同一后端"场景）。新增 `server/index.mjs`：零依赖 Node HTTP，接口一比一复刻 mockApi（降序/available 过滤/服务端重算总价/recipe 注入/missingSeed 按名补齐），数据原子写 `server/data/state.json`（tmp+rename，gitignore），同时托管 dist/ 静态（SPA 兜底+防目录穿越），绑 0.0.0.0:8787 并打印局域网地址。`main.jsx` 按端口 8787 判定模式：家庭=真实 fetch、其余=动态装载 mock（种子包不进关键路径）；vite proxy 3000→8787；`scripts/export-seeds.mjs` 导出 432 菜+342 菜谱种子 JSON。E2E 15 项+重启持久化全过。文档新增 §10 部署手册（三步启动/种子重导/备份=拷 state.json/边界声明）。顺带清账：删除 35 张数据层早已清退但磁盘残留的孤儿 AI 图，兑现"零 AI 残留" | `827f6ca` |
| 双击启动 exe | 所有者要"点一下就能启动服务端"。服务端 mjs→**CJS**（`server/index.cjs`，SEA 硬性要求；行为回归 10 项全过后删旧 mjs）；SEA 路径解析：exe 认 server/ 内（推荐）与项目根两种摆位，种子缺失报友好错误。`scripts/pack-exe.mjs`+`npm run pack:exe` 一键打包：`--experimental-sea-config` 出 blob → 复制本机 node.exe（v24，88MB）→ npx postject 注入（签名破坏警告属预期）→ 清中间物；exe/dist/state 全部 gitignore。双击体验硬化：`fatal()` 统一所有致命错误（端口占用/种子缺失/初始化失败）——打印原因+等回车关窗（readSync，stdin 不可用时 Atomics.wait 挂起防闪退），顶部 uncaughtException 兜底；修掉两处 `holdOpen()+process.exit` 并存导致"保持窗口"形同虚设的 bug（libuv 句柄未净时强退还会触发断言崩溃，回归脚本实测复现过）。产物实测：exe 直跑 432 菜接口+页面 200+E2E 十项全过、数据落 exe 旁 server/data。文档 §10/§6/台账同步，部署手册改推双击 exe | 本轮 |

## 8. 已知待办 / 候选项

- 测试覆盖仅 mockApi 冒烟（8 项），UI 组件无自动化测试——demo 项目可接受，引入框架时优先补 DishRow/OrderCard。
- D3StatusRing 内圈一处 rgba(0,0,0,0.5) 暗影为有意保留（深色内盘上的暗影）。
- ~~AddDishModal 旧命名残留~~ ✅ 已清零（见台账「旧命名清零」）；~~preview 落后~~ ✅ 已同步（但 clay-60 回退与色阶绑定后的 preview 仍未重建，观感等价影响小）。
- ~~hover/active 状态色绑定色阶~~ ✅ 人格色家族已全量绑定（见台账「色阶绑定收敛」）；ink 系中性灰 rgba **有意不绑**——--color-bone 在夜宵模式反相，若 rgba 绑 bone 会改变暗底观感（违反等价原则），需要时另立语义令牌。

## 9. 色值审计方法（门禁脚本已实现）

白名单种子 = `index.css` + `theme/persona.js` + `theme/images.js` 全部色值；允许项：bone 正文、深赤陶、黑/骨 rgb 阴影、纯白系。逐文件差分，越界即残留；另跑暗色检测（max(R,G,B)<0x50 且不在允许集）。见 `scripts/p6_static_gate.py`。2026-09-17 色阶绑定收敛后，页面/组件层人格色统一为 `var(--clay-N0)` + `color-mix()` 写法（不含 hex 字面量，天然不过门禁差分）；SEED 层内残留的少量 hex（ring 数组/PAYER.fill/色阶真值本身）属白名单豁免，勿再"顺手"迁移。

## 10. 家庭局域网部署（数据不出家门，2026-09-18）

**架构**：家里常开电脑跑 `server/index.mjs`（零依赖 Node，需 ≥18），数据持久化 `server/data/state.json`（原子写：tmp+rename）；全家手机浏览器访问 `http://<家电脑IP>:8787` 共享同一份菜品/订单。前端模式判定在 `main.jsx`：端口 8787 → 真实 fetch；其余（vite dev / Pages / file://）→ 动态装载浏览器 mock（mock 的 400KB 种子不进家庭模式关键包）。**服务端接口一比一复刻 mockApi**（含 id 降序、available 过滤、服务端重算总价、recipe 注入），改前端接口语义时两边都要动。

**部署三步（在家电脑上）**：
```bash
cd E:\晨光厨房-交付包\extracted
npm run build          # 产出 dist/（服务端直接托管）
npm run family         # 启动，控制台打印局域网地址
```
**双击 exe（推荐日常用法）**：`server\晨光厨房服务端.exe`（Node SEA 单文件，内嵌服务端代码，无需命令行）。`npm run pack:exe` 可随时重打（需 Node ≥20.12；注入破坏 Node 官方签名，Defender 弹窗时选"允许"）。exe 认两种摆位：放 server/ 目录内（推荐）或项目根；它只管代码，dist/ 与 data/ 在旁——分发时整个 extracted 文件夹一起拷。
手机连同一 WiFi 打开打印的地址即可。防火墙弹窗时允许专用网络。开机自启可选：任务计划程序登录时运行该 exe。

**数据**：首启自动从 `server/data/seed-dishes.json`+`seed-recipes.json` 建 state.json；种子更新（灌库/新菜）后跑 `npm run export:seeds` 重导，重启服务按名补齐。`state.json` 已 gitignore（运行数据不入库）。备份=拷走 state.json 一个文件。**双击防闪退**：所有致命错误（端口占用/种子缺失/初始化失败）走 `fatal()`——打印原因、等回车再关窗，双击场景绝不一闪而过。

**E2E 已验**（15 项+重启持久化）：菜品/分类/详情菜谱/下单总价/状态推进/加改删下架/静态托管/404 语义/重启不丢数据。

## 10.5 公网访问（隧道部署，2026-09-18 晚）

**路线决策**：用户要求"手机浏览器直接输网址、两端不装 App 不开代理"。Tailscale/组网类被排除（手机要装客户端）；Cloudflare/Funnel 类被排除（海外入口国内直连不稳，本机 Clash 不可依赖——实测控制面超时）；**最终选定国内 frp 公益节点 OpenFrp**（console.openfrp.net，免费 2 隧道/12Mbps/初始 1GB+每日签到补流量，大陆节点需实名）。花生壳（1Mbps/1GB 月）为备胎。

**代码侧已完成（本次会话）**：
1. **家庭模式判定升级**（`main.jsx` + `server/index.cjs`）：旧判据"端口==8787"在隧道域名（80/443）下失效。现服务端端出 index.html 时于 `</head>` 前注入 `window.__CHENGUANG_FAMILY__=true`（按 index.html mtime 缓存，重建即失效）；前端判定"标记 or 8787 端口"，双判据兼容 file:// 旧用法。**隧道场景务必访问 http(s):// 根路径进首页拿标记；若 OpenFrp 映射带子路径，相对资源仍可加载**（hash 路由+相对 base 天然兼容）。
2. **Admin 密码门**：`index.cjs` 对"公网来源的写接口"（POST/PUT/DELETE /api/dishes*、/api/orders/:id/status）返回 401 `admin_auth_required`；`POST /api/admin/login` 校密换 7 天 httpOnly cookie（`cg_admin`，随机 token 仅存内存）。读接口与 POST /api/orders（公网点餐）放行。密码来源：`server/admin-password.txt`（gitignore，已加入）或环境变量 `FAMILY_ADMIN_PASSWORD`；未配置时公网写 401、登录 503（公网管理禁用，局域网如旧）。前端 `src/lib/adminGate.js` 包装 fetch 捕获 401 → 弹密码层（纯内联样式走 CSS 变量，p6 门禁零告警）→ 成功自动重放原请求。
3. **公网识别两态 + 强制开关**：XFF 头或外网来源 IP → 公网。**⚠️OpenFrp 文档：HTTP 隧道 frpc 自动加 XFF；HTTPS 隧道不加**——故提供 `server/public-mode.txt`（内容 `1`）或 `FAMILY_PUBLIC_MODE=1`：开启后所有写操作一律过门（本机也不例外）。**用 HTTPS 隧道或不确定时必须开此开关**，否则密码门形同虚设。
4. 验证记录：隔离实例（_pubtest/_gatecheck，用后即删）8 项全过——注入✓ 公网PUT无cookie 401✓ 局域网PUT 200✓ 公网下单 201✓ 错密码 401✓ 对密码+cookie 公网PUT 200✓ 换会话无cookie 401✓ 公网模式(无XFF)强制401/放行✓；四件套全绿；`.gitignore` 已排除 admin-password.txt / public-mode.txt。

**待办（部署侧，下轮接续）**：用户在 OpenFrp 注册实名 → 建 HTTP 隧道（127.0.0.1:8787）→ 拿到公网域名 → 本机写 admin-password.txt（建议同时写 public-mode.txt=1）→ **重启 8787 服务**（当前运行中的仍是旧代码！exe 需 `npm run pack:exe` 重打或改用 node/新 exe）→ 手机实测公网浏览/下单/管理三链路 + 真实 dist 注入验证。隧道掉线自恢复可考虑计划任务保活。

**边界**：单实例内存态+写盘，家庭并发足够；localStorage 设备数据（购物车/主题/收藏）不随服务端共享；密码门是"公网化最低安全垫"，非完整账号体系（token 重启失效需重新输一次）。

## 11. 给接力的开场白模板

> 请先读 `E:\晨光厨房-交付包\extracted\PROJECT-HANDOFF.md`。遵守第 4 节架构约定与第 5/9 节的坑，改动前跑 `npm run build`、`npm run lint`、`npm test`、`python scripts/p6_static_gate.py` 复验。**每次修改同步更新本文档（进度台账 + 文件地图 + 坑清单），随代码一起提交。** 文案改 `src/lib/sweetCopy.js`，菜品/菜谱数据用 `scripts/build_htc_seed.py` 重新生成。
