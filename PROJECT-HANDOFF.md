# 项目交接文档 · 晨光厨房（food-ordering-miniapp）

> **给接力的 AI / 开发者**：本文档自包含，读完即可接手。
> **协作铁律：每一次代码/数据/文案修改，都必须同步更新本文档（进度表、文件地图、坑清单按需），随代码一起提交。** 这是项目所有者定的规矩。
> 最后更新：2026-09-19　代码 HEAD：首页封面刊头条轮（impeccable bolder，本轮提交）　工作区：干净
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
6. **不可变文件（最小改动，改须逐处说明）**：`src/components/CartContext.jsx`、`src/lib/mockApi.js`（已因数据接线 +2 行与菜谱注入 +3 行、夜宵种子接线 +3 行 import/push 与 1 处注释更新、真实图覆盖表集中注入一段（表+两条 forEach，见 §5）、夜宵池补图覆盖表 +2 条（919/904，见 §5 与台账），均有据）、`src/lib/favorites.js`。
7. 共享组件放 `src/components/ui/`，≥2 处真实调用点才建；`Icons.jsx` 是图标基元集，单调用点也保留。
8. 提交信息用中文，说明「为什么」；**提交前跑 lint + build + `p6_static_gate.py`**。
9. **四件套别用 `2>&1 | Select-Object` 吞退出码**：构建失败时管道可能仍返回成功假象，判定必须看 `built in` 成功行或 `$LASTEXITCODE`（本轮 ui/ThemeToggle 曾把 `../theme` 写成少一层，就是靠 build 报错抓到的）。`src/components/ui/` 下引主题模块一律 `../../theme/`。

## 5. 数据层（菜品 432 道 + 菜谱 342 份）

- 种子库 = `mockApi.js` 内 65 道原始菜 + `src/lib/seedMenuExtra.js`（**342 道，由 HowToCook 生成**，勿手改）+ `src/lib/seedNightExtra.js`（**25 道夜宵手写种子**，id 900-924，emoji 占位无图）。
- **真实图覆盖表（2026-09-18 图片真实化）**：所有者要求预览图用真实照片、不用 AI 生成。`mockApi.js` 内新增 `REAL_IMAGE_OVERRIDES`（80 条 id→路径，集中一段、生成文件不动）+ 两条 forEach（覆盖应用 / AI 图清退）。图片来源 = HowToCook 仓库实拍 27 张（GitHub blob API 拉取：11 张直接覆盖原 `dish-{id}.webp` 路径不变、16 张入 `htc/`）+ Wikimedia Commons CC 照片 37 张（`public/dish-images/real/{id}.webp`，560px webp）。原 65 道 AI 图：35 道换真实图、19 道删文件清退留 emoji、11 道即上列覆盖。全库带真实图 233/432，其余 emoji 占位。⚠️ Wikimedia 搜索错配率高（菜单/街景/古画/人物像混入），所有新图经联系表逐张目检后才保留，宁缺毋滥。
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
│   ├── sceneRules.js        ★场景快选规则（SCENES 吃辣/清淡/快手/仪式感 + scenePick，Menu 前端过滤）
│   ├── adminGate.js         ★公网 Admin 密码门（包装 fetch 捕获 401→弹层输密→换 cookie 重放；见 §10.5）
│   ├── seedRecipes.js       菜谱数据 342 份（生成，懒加载，勿手改）
│   └── sweetCopy.js         ★ 全站个性化文案池（懒洋洋昵称 + 各页标题/情话，随机抽取）
├── components/
│   ├── DockLayer.jsx        ★唯一常驻底部固定层（空车药丸居中，球槽随购物车挂载）
│   ├── PageHeader.jsx       ★统一页头（back/backTo/right）
│   ├── FloatingPillNav.jsx  4 tab 导航（SVG 图标，激活态白）
│   ├── D3CartOrb.jsx        购物车球（入场/退场由 DockLayer 编排）
│   ├── NightSnackSheet.jsx  ★夜宵开屏弹窗（进入夜宵即弹六宫格宵夜，一键加购；App 外壳常驻）
│   ├── GlassCard / FullBleedHero(name=VT形变名) / KissIcon / AddDishModal（D3StatusRing 已删，见台账"机械债清零"）
│   ├── AmbientLightCanvas.jsx  ★overdrive WebGL 晨光（渐进增强，失败即静默退场回 CSS 光斑）
│   └── ui/                  共享组件：Icons(细线图标集)/DishRow/OrderCard/EmptyState/
│                            LoadingState/PayerSelector/Stepper/StatCard/SectionHeader/
│                            Chip/PageContainer/AdminShell/ThemeToggle(页头夜宵快捷钮)
├── pages/                   11 页：Home/NightHome(夜宵专属首页)/Menu/DishDetail/Cart/MyOrders/OrderDetail/
│                            Profile/Admin/AdminDishes/AdminOrders
│                            （Checkout、Favorites 已删，路由保留重定向）
public/dish-images/         菜品预览图：htc/ 169 张（生成 153 + 真实化轮补 16）、real/ 37 张（Wikimedia CC）、dish-*.webp 仅存 11 张（均已被 HowToCook 实拍覆盖，其余 AI 图已删）
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
| critique 整改（P0/P1 三连） | impeccable 双评审（Menu+Home 各 27/36）落地：**Menu/Home fetch 失败不再静默空列表**——loadError/homeFailed 态 + EmptyState「厨房暂时断联」+「再试一次」（RETRY_NOTES 安慰池进 sweetCopy），Home 另有首屏 LoadingState 与 0 菜「去点菜」引导；**分类 chips 收敛到共享 Chip 组件**（CATEGORY_CONFIG emoji 删除，44px 触达 + active clay 渐变一次到位，修「emoji 图标违反 Don't」与双实现漂移）；**LuckyDishCard 撤 GlassCard** 改 d3-card-face 纸面（玻璃退后律）；**新增场景快选行**（sceneRules.js 四场景前端过滤，与菜系列表正交、再点取消）——回应「分类是数据库语言」尖锐问题，菜系保留在「更多菜系」。四件套全绿；检测器二进制缺失（.part 残件+下载挂起），确定性扫描缺席已声明 | `待填` |
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
| 夜宵池补图（impeccable 第二轮第 1 条） | 所有者要"视觉优先做加法"，补图列最大杠杆。HowToCook 图源已尽（无图菜=该仓库本身无配图的菜谱），转 Wikimedia 重试夜宵池 8 道无图菜：两批 14 搜，目检联系表后**只有 2 张干净匹配入库**（919 麻辣拌、904 孜然烤鸡翅），牛肉河粉/炒蛏子两张"边缘图"与 4 张错配（橄榄饭/韩式辣炒年糕/马来炸年糕）全部按宁缺毋滥弃用；酒酿圆子、卤味拼盘维持 emoji。覆盖表 78→80、real/ 35→37、全库 231→233。四件套全过 | 本轮 |
| 刊物体裁再放大（impeccable 第二轮第 2 条 bolder） | 所有者要在"编辑杂志"身份内做加法。三处：①SectionHeader 加可选 index 参数，首页"今日推荐/常点的/最近订单"传 01/02/03 栏目序号（衬线小字+clay-deep，呼应封面 No. 语言），未传序号的 HotDishes/Admin/NightHome 观感不变；②主推卡价格 text-2xl→2rem display 档制造"数字时刻"（初用 var(--text-display)=40px 撑破卡片底部被 overflow 裁切，实测后收 2rem）。全部走现成令牌无新色值。Edge 无头截图核验时踩坑：首页主推卡 5s 自动轮换+入场动画，截图常撞转场透明帧致内容区空白，须 mock 通道（vite 5173，非家庭服务端 8787——后者按设计不载种子）+ 抓静帧，最终以 home-full.png 证实渲染。四件套全过 | 本轮 |
| 视觉加法 A+B（impeccable 第二轮 3/4/5/10/11 条） | **A 锚卡油墨+夜宵滤镜**：`@theme static` 加 `--anchor-ink`（clay 渐变之上叠一层顶部 on-dark 高光 radial，模拟油墨浓淡反光，文字区在底部深色端白字对比不受影响）与 `--tile-img-filter`（夜宵反相块覆盖为 brightness 0.86/saturate 0.9，白天 none），首页/购物车/夜宵三块深色锚卡统一换 `--anchor-ink`，NightHome 网格图套滤镜让图"溶"进夜纸。**B 空态/加载态插画化**：Icons.jsx 加 emptyPlate 空盘/stoveOff 熄火灶/potBoil 水开锅三枚同线规细线插画（EmptyState 加可选 icon 参数向后兼容，未传仍走 emoji），Cart→空盘、MyOrders→熄火灶；LoadingState 默认（🍳/无 emoji）改水开锅 SVG+锅沿蒸汽冒泡（复用 steam-puff），后台 🍽️/👨‍🍳 与 error 📡 保留；DishDetail 简介首字下沉（Playfair 2.1em 内联 float、clay-deep、aria-hidden）、手气签菜名 font-sans→font-serif 衬线化。踩坑：脚本插图标误插到 PATHS 对象外致 build 失败，正则搬回；LuckyDishCard text-[1.25rem] 触检测器改 text-xl（同 20px）。四件套全过、检测器无新增告警 | `c5b351e` |
| 视觉加法 C+D（impeccable 第二轮 5/6/8/11 条） | **C1 加购飞入**：Menu spawnParticle 落点改抛物线飞进购物车球——D3CartOrb 加 `id="cart-orb"` 锚点取真实球心（未挂载兜底壳右下），+1 粒子 x/y 数组关键帧（顶点上拱 52px、times [0,0.55,1]、EASE、0.55s、末端 scale 0.55 落球），reduced 退化原位淡出，清理 950→620ms。**C2 下单庆祝**：核查第一轮已实现"锅已上灶"落灶+蒸汽覆盖层，不重复造。**C3 灶台三态差异**：pending 新增 `stove-glow ember`（opacity 0.38/blur 9px/慢半拍 3.4s）一缕余温暗火，与 preparing 旺火、completed 起锅叙事拉开层次。**D1 滚动视差：放弃**——FullBleedHero 是 fixed 底片层，内容做视差需 transform 而外层 transform 杀 sticky 页头（DESIGN.md 转场禁令），收益不抵破律风险。**D2 数字时刻**：OrderDetail 合计 text-2xl→text-3xl（30px，避首页 40px 撑破坑）。四件套全过、本轮组件零新告警（index.css 若干 gradient-text/bounce-easing/裸色值为第一轮前历史债，加法轮不动）| 本轮 |
| 机械债清零（impeccable 第三轮 P0+P1+P2） | 全量 detect 49 条告警逐条对账后的三类清偿。**P0 真视觉欠账**：①::selection/input caret 主题化（暖纸页此前选中是浏览器冷蓝高亮——clay-10 底+bone 字，夜宵档 clay-50 45% 半透；caret clay/clay-40）②主题切换过渡从"只有背景慢半拍"扩到文字/边框/卡面（d3-card-face/d3-btn/d3-btn-sm/d3-input transition 补 background-color/border-color/color 三属性走 --dur-slow，夜宵反相不再硬切）③StoveStage pending 熄火灶膛的 🔥 emoji 换 Icons flame 细线图标 opacity 40%（签名组件不再违"图标禁 emoji"律）。**P1 令牌统一**：新增 --color-on-dark/--color-on-sage/--color-ember 三令牌（@theme static），OrderDetail 买单徽章两处字面色、avatar-partner 反色、StoveStage 余温 rgba 收编；adminGate 密码弹层离标尺值收编（16px 圆角→radius-card、0 8px 32px 阴影→shadow-4、按钮圆角→radius-btn、17px 标题→1.125rem title 档、按钮字色→on-dark）。**P2 死代码拆除**（全部 grep 核验零引用）：index.css 摘除 3D 工具类全套/gradient-text 三兄弟/bg-warm·bg-cool/divider/section-title/soft-block/glass-elevated/wiggle·slide-up·fade-in·scale-in·slide-from-bottom/d3-* 七组 keyframes+七个 animate 类/cart-empty-bounce/pulse-glow-clay·sage 死对，夜宵段 soft-block 选择器摘除；**D3StatusRing.jsx 整文件删除**（StoveStage 接替后无人 import）。index.css 657→576 行。**对账声明**：剩余 31 条告警逐条核验均为"工具与 DESIGN.md 记录面差异"非视觉债——stove/night 系定义色（DESIGN.md 拟物豁免与夜宵黑系阴影明文允许）、999px 胶囊记法、13px=0.8125rem 等值档、封面 10px/clamp 刊头刻意档（typeset 轮已裁定）、进度条 width linear（设计意图）。踩坑记录：手术脚本首跑 d3-bounce-in 锚点误写 rotateX(2)（漏 deg）触发断言中止未伤盘；npm 裸跑目录错误 ENOENT 一次，四件套以显式 cwd 复跑全绿。四件套全过、p6 门禁过 | 本轮 |
| bolder 第四轮（平淡面放大胆） | 全站扫描后锁定三处从未被改造的"最平"面，在编辑杂志身份内加浓：①**StatCard 数字时刻**——Profile/Admin 统计值 text-2xl→display 档(40px)衬线+leading-none，标签补 0.12em 字距（Admin 三格均为小整数计数、Profile 累计消费实际量级 3 位内，无撑破风险，实测确认）；②**Profile 身份名** 18px→30px 衬线大字（渐变 clip 保留），"你是谁"成为页面主角；③**HotDishes 趋势榜杂志化**——名次数字 18px→40px display 档（前三金/银铜/雾色阶不变，w-7→w-12），heat 文字下新增 3px 油墨热度条（clay 渐变按家庭烹饪率百分比填槽，数值解析自 t.heat 字符串、不新增数据源）。reduced-motion 零新动效（纯排版）；色/字/圆角全走现成令牌。四件套全绿、检测器 30 条无新增（HotDishes:108/149 两条为既有记录面差异）；Edge 静帧实测 /profile 与 /hot（注意路由是 /hot 非 /hot-dishes）目检通过 | 本轮 |
| colorize「警示有温度」第五轮 | impeccable colorize 审计结论：全站 error 角色无色彩（📡断联/😵找不到四个错误态与正常空态同款 ash 灰，grayscale 遮蔽状态）、adminGate 密码错提示误用动作色 clay（违 One Voice + 白天 2.68:1 不达小字 AA）、love/danger 双源旧账结案。**修法（零新色值）**：①EmptyState 加 `tone="error"`——标题与双色光斑交给 danger 家族混色 `color-mix(danger 70%, bone)`，Home/Menu/DishDetail/OrderDetail 四错误态接入，色做氛围强化不做唯一编码（emoji/文案/按钮语义全保留）②gate 错误文字 clay→同混色，动作色归位③bone 随夜宵反相，混色自动双主题达标——全背景扫描（白天三档纸面/夜宵四档炭底）定比例 70%（白天最低 5.78/夜宵 4.67 全过 4.5:1），80% 版夜宵 4.04 不达标已否④index.css 注释与 DESIGN.md Tertiary 段结案：love 纯情感、danger 唯一警示源，双源 ⚠️ 摘除。中性灰保留裁定：菜谱食材 chips/热量子徽章无对应语义色，硬塞即破律（手册"Neutral gray is valid when it serves the world"）。四件套全绿、检测器 30 无新增、产物 CSS 变量与 tone 接线核验通过 | 本轮 |
| overdrive 翻页套件（VT 形变+滚动显影+WebGL 晨光） | 所有者点名"令人惊艳"，三技术各管一个时机、互不打架，全程渐进增强。**①点击·View Transitions 共享元素**：新 `lib/vt.js`（morphTo/morphBack/heroNameFor/dish+list 双缓存）。Menu DishRow、Home 封面卡+网格卡、NightHome 网格、Hot 榜单卡 ⇄ DishDetail hero 形变（菜卡图框"长成"详情页大图，返回缩回原位）；App AnimatePresence 经 `state.vt` 旁路本次转场（mode=wait 与快照打架）；lazy 页先 await import 再 flushSync 绕死结；不支持/reduced/异常全回落现有淡入，导航不因增强而断（updateCallbackDone.catch 兜底）。返回按钮只在导航 state.morphFrom 存在（形变进入）时走 morphBack，刷新/普通进入走原生 goBack——防模块级 target 过时导致跳错页。封面卡与网格互斥（featured 不入网格），同名双元素结构上不可能。**②滚动·纯 CSS 显影**：`animation-timeline: view()` 下 ink-draw——SectionHeader 短线/刊头条发丝线/Hot 热度条随滚入抽长；@supports 包整块，不支持=零变化。**③静止·WebGL 晨光**：新 `AmbientLightCanvas` 160×240 单大三角 shader，clay/sage 双光斑缓慢漂移+指针视差（±3%），alpha≤0.09 与静态光斑同量级（氛围不是特效）；无 WebGL/编译失败/上下文丢失/卸载 → 静默退场回 CSS 光斑；隐藏停 rAF 省电；reduced 不挂载。壳层两团 CSS 光斑挂 26s/21s 漂移呼吸。`::view-transition-group(dish-hero)` 0.36s EASE。四件套全绿（WebGL 归一浮点色不触 hex 门禁）；Edge 实测画布挂载与页面健康。**形变与画布流动需真实点击/肉眼验收** | 本轮 |
| 家庭局域网服务端 | 所有者要家庭使用+数据本地存储（选定"各手机共享同一后端"场景）。新增 `server/index.mjs`：零依赖 Node HTTP，接口一比一复刻 mockApi（降序/available 过滤/服务端重算总价/recipe 注入/missingSeed 按名补齐），数据原子写 `server/data/state.json`（tmp+rename，gitignore），同时托管 dist/ 静态（SPA 兜底+防目录穿越），绑 0.0.0.0:8787 并打印局域网地址。`main.jsx` 按端口 8787 判定模式：家庭=真实 fetch、其余=动态装载 mock（种子包不进关键路径）；vite proxy 3000→8787；`scripts/export-seeds.mjs` 导出 432 菜+342 菜谱种子 JSON。E2E 15 项+重启持久化全过。文档新增 §10 部署手册（三步启动/种子重导/备份=拷 state.json/边界声明）。顺带清账：删除 35 张数据层早已清退但磁盘残留的孤儿 AI 图，兑现"零 AI 残留" | `827f6ca` |
| 双击启动 exe | 所有者要"点一下就能启动服务端"。服务端 mjs→**CJS**（`server/index.cjs`，SEA 硬性要求；行为回归 10 项全过后删旧 mjs）；SEA 路径解析：exe 认 server/ 内（推荐）与项目根两种摆位，种子缺失报友好错误。`scripts/pack-exe.mjs`+`npm run pack:exe` 一键打包：`--experimental-sea-config` 出 blob → 复制本机 node.exe（v24，88MB）→ npx postject 注入（签名破坏警告属预期）→ 清中间物；exe/dist/state 全部 gitignore。双击体验硬化：`fatal()` 统一所有致命错误（端口占用/种子缺失/初始化失败）——打印原因+等回车关窗（readSync，stdin 不可用时 Atomics.wait 挂起防闪退），顶部 uncaughtException 兜底；修掉两处 `holdOpen()+process.exit` 并存导致"保持窗口"形同虚设的 bug（libuv 句柄未净时强退还会触发断言崩溃，回归脚本实测复现过）。产物实测：exe 直跑 432 菜接口+页面 200+E2E 十项全过、数据落 exe 旁 server/data。文档 §10/§6/台账同步，部署手册改推双击 exe | 本轮 |
| 首页封面刊头条（impeccable bolder） | 所有者要求用 impeccable bolder 放大 Home hero 区胆量（编辑杂志身份内）。落地：PageContainer 首块新增「封面刊头条」——超大衬线刊名「晨光/厨房」拆两行错位排布（clamp 52–74px、行高 0.94、字距 -0.04em，第一行左缩进 44px、第二行右缩进 112px 形成对角张力），左缘书脊竖排当日日期（writing-mode: vertical-rl），右下倾斜 5° 的封面菜照片卡叠压刊名第二行右角（复用今日主推 featured 与 DishRow 同款图回退，点击进详情），folio 行（The Kitchen Zine + No.周数深赤陶衬线）压在大字下方，收口发丝线（marginTop 32 给封面卡注脚让位）。hero 令牌仅调参未绕开：白天 `--hero-wash-immersive` 上段 0.52/0.58→0.62/0.70（52% 处 0.78→0.80）、`--hero-filter-immersive` brightness 1.04→0.97/saturate 1.05→1.02，夜宵反相块未动。入场全走内层 contentEnter，外层无 transform，PageHeader sticky 与 fixed 定位不受影响。零新色值/字体/圆角（全消费 var 令牌），断头路门禁 0。四件套全绿 + 浏览器实截白天首页/菜单页目检（folio 期号与封面卡注脚重叠已在核验轮修掉）。NightHome 未动（夜宵另有界面） | 本轮 |
| typeset 排版层级审计 | impeccable typeset 全站扫描（重点 PageHeader/SectionHeader/Home/Menu），只动字族/字重/字距行高，零布局零文案。修三类：①**字重越界清零**——Playfair 可变轴 500–700，全站 8 处衬线 `font-extrabold`(800)（Home/NightHome 主推价、DishRow/LuckyDishCard/NightHome 网格价、HotDishes 名次）与 4 处无衬线 800（DishRow 菜名、LuckyDishCard 徽章、Menu 分组标题/+1 粒子、HotDishes NO. 徽章、DishDetail 加购按钮）全收 `font-bold`(700)，消除浏览器合成假粗；②**衬线对比泄漏修复**——全局 h1–h6 默认衬线让 4 处行级数据标题（DishRow/LuckyDishCard/Cart 商品名、OrderDetail「都选了啥」）静默吃宋体，显式 `font-sans` 归位无衬线（菜名是数据不是版面主角）；③**字距漂移收敛**——封面刊名 -0.04em→display 档 -0.035em、folio 0.22em 与 No.眉题 0.2em→eyebrow 标尺 0.18em（Home/NightHome 两处）、SectionHeader 删内联 -0.02em 回归全局 h2 的 -0.01em。合规确认：display 档两处（PageHeader/Cart 合计）均页面主标题/大数字正当用途；mist 只在占位与三级辅助位分工一致。四件套全绿 + 浏览器实截 Home/Menu/Cart 目检。遗留报告不动（字号不在本轮维度）：10px 微标全站 8 处同值同角色属封面系刻意档；adminGate.js 密码弹层 12px 离标尺一档（17/13px 恰等 lg/sm 档），该文件为公网门控、p6 门禁零告警，动它须另轮评估 | 本轮 |
| colorize 状态色收编 | impeccable colorize 全站审计 hover/active/focus/disabled 色源。**先纠偏预设**：「色阶绑定收敛」轮已把六大点名组件（GlassCard/Chip/DishRow/OrderCard/Stepper/PayerSelector）的人格色系 rgba 全部绑到 `--clay-N0`/`--sage-N0` + `color-mix`（hover→20/30、按压→70 惯例即用户本轮指定映射，已就位）；本轮逐文件复核组件内剩余 rgba 全属台账**有意不绑**类别——墨系中性阴影 rgba(43,38,32,x)（--color-bone 夜宵反相，绑 clay 会改暗底观感）与白色高光 rgba(255,255,255,x)，不属"同族色改写"，强套反破等价。真漏网两处已修：①GlassCard 默认阴影 `0 8px 24px rgba(43,38,32,0.08)`→`var(--shadow-3)`（定义逐字节相同，白天零变化，附带收益：夜宵自动跟反相阴影阶）②AdminDishes 删除钮光晕 `rgba(194,84,63,0.2)`→`color-mix(--color-danger 20%)`（danger 真值 #C2543F=rgb(194,84,63) 等价，色源归单源）。语义复核通过：PAYER aa→caramel/me→clay/partner→sage、ORDER_STATUS pending 中性/preparing clay/completed sage 均未被调换。四件套全绿 + impeccable detect 改动文件零告警 | 本轮 |
| delight 灶火接力 | 下单成功惊喜（所有者选定方案 B）。①Cart 提交成功层：通用 🎉 庆祝换成「锅已上灶」——🍲 从上方 280ms 落坐 `.stove-base` 灶台（复用 StoveStage 现成视觉，此刻熄火不撒谎）、蒸汽 keyframes 扶一记、文案 ORDER_PLACED_NOTE 进 sweetCopy；z-[60] 盖停靠层（截图抓到 z-50 被导航穿帮）；1.1s 自动让路 + 点击任意处立即跳过（skipRef 兑现）；tap+双段振动走 sfx 开关；reduced 纯淡入。②OrderDetail 灶火接力：12s 低频轮询（未完成才查/切后台跳过/completed 永停/卸载清理），pending→preparing 真实到达一刻灶台绽放一次性暖橙光晕（1.2s 自熄）+chip 按 ORDER_STATUS 新色脉冲+settle() 声；preparing→completed 现有起锅动画活播+chip sage 脉冲；只在状态前进时报喜防回退误触。E2E 真链路实测四幕截图（落锅/熄火等待/焖煮/起锅），测试订单已从浏览器存储清除。四件套全绿 | 本轮 |
| quieter 管理端降温 | Admin/AdminOrders/AdminDishes/AddDishModal/AdminShell 五文件降温（Operate 模式）：人格色只留两处——各页唯一主操作（+添加 d3-btn-primary / 推进按钮 clay/sage 实底）与人格标识（🐱🐰头像chip、状态条）。①AdminShell 头部赤陶→鼠尾草彩带改中性暖墨渐隐 rgba(43,38,32,.04/.015)；②Admin 统计数字 clay/caramel/sage 彩点全转 bone 墨色（StatCard 组件默认值未动，Profile 不受波及）、快捷入口去 3px 彩色左条+图标转 ash；③AdminOrders 推进按钮去辉光投影与 hover 浮起（反馈只留 whileTap 0.97）；④AdminDishes 行内三钮全转安静纸面按钮（上架/编辑 ash/bone 字+发丝边，删除转 danger 描边字，全部去彩底渐变与光晕——原三行六色是扫描噪音源）、加载更多去 clay 字与彩边；⑤AddDishModal 把手/🌙位徽标/输入彩点全转中性、去输入框左侧装饰 emoji（label 已有文字）、去输入框 ink-850 重影底、去关闭钮 hover 放大、主钮回归 d3-btn-primary、浮层动效收编 sheetUp+reduced 降级。功能字段文案零改动（自检收回误删的 select 选项 emoji 与误加的 * 号）。四件套全绿+detect 零告警+8787 实截三张目检 | 本轮 |
| distill 购物车瘦身 | 目标动线「看清单→选人→下单」。删除清单经所有者逐项确认后执行：**已删**=合计锚点卡的 KissIcon 爱心（display 大数字独担强调，删掉卡上第二强调源）。**保留（所有者裁定）**=A1 人格卡 glow 光晕、A2 💬 浮动动画、A3 备注卡壳、B1 买单卡壳（卡片套卡片接受为分组感）、B3 FullBleedHero 底图（全站一致性优先）。备注插在清单与选人之间未动（未获重排指示）。四件套全绿+detect 零告警 | 本轮 |
| polish Menu 页收尾 | 按 DESIGN.md 逐维对齐，9 处修复：①WhoSelector rounded-2xl→ctl 标尺（与兄弟分段控件同值）②③④⑤四处 `transition-all`→按实际变化属性收窄（transition-colors / box-shadow,border-color）⑥⑦两处 `[0.34,1.56,0.64,1]` 过冲曲线残留（Vercel 动效轮已裁定废弃）→EASE ⑧菜系分组标签 clay→ash（One Voice Rule：clay 只属于可点动作）⑨骨架卡 p-3.5/space-y-3.5→space-card-p 双处对齐（消除加载完成跳动）。看过没改：「没搜到这口」手写空态与 EmptyState 并存（搜索专属变体，收敛=重设计，超 polish 范围）、WhoSelector/分段 emoji（既有身份标识非新增图标）、搜索框 ink-800 提亮层（聚焦功能需要）、边距/壳宽/字阶/三级色/玻璃边五维实测本就对齐。四件套全绿+detect 零告警 | 本轮 |
| animate 夜宵动效 + 暗底可读性复核 | ①**NightHome**：宵夜八格由同帧出现改 cardEntrance+0.06 逐格错峰（基准 0.1 让标题先到，末格 0.52s 起）；「换一道」裸按钮补 motion.button+tapScale 按压反馈；主推卡换菜动效补 reduced 分支（去 scale 只留淡入）——本页此前无任何降级路径，本轮补齐。②**NightSnackSheet**：浮层入场收编 sheetUp 预设（原为内联复制同参数，去重）；六宫格 sheet 落定后逐格亮相（基准 0.22 等 spring 起势，总时长 0.86s 封顶）；🌙「灯亮着」徽章挂 glowPulse sage 低频呼吸（全站 glowPulse 首调用；color-mix+var 在 boxShadow 复合插值中作静态后缀、framer 只插值几何数字，无 var 解析问题；AnimatePresence 卸载即停循环，reduced 不传 animate）；「看全店」whileTap 0.97→tapScale 预设。全部只用 motion.js 现有预设，pageEnter/外层 transform 未触碰。中途 build 抓到六格 motion.div 闭合标签错配（§4.9 预告的坑兑现），已修。四件套全绿。③**暗底人格色复核（只测未改）**：clay-50 作前景 #EC8A60 vs 夜宵页底 6.48:1/卡面 5.90:1——用户担心的这一档反而是暗底上最可读的 clay；--color-clay(clay-60) 链接 5.36 ✓；**两处边缘**：ORDER_STATUS.preparing chipColor clay-70 小字暗底 3.88:1 不足 4.5（白天 ~4.4 同边缘）；白字压 clay-60 **实底**（d3-btn-primary CTA/加购钮/购物车球）2.99:1——「主色回退 clay-60」台账的"≈4.5:1"仅对锚点卡渐变深端成立（clay-80 4.58 ✓），实底按钮两主题同值、非夜宵特有。截图三张交所有者定夺，未动色 | 本轮 |

## 8. 已知待办 / 候选项

- 测试覆盖仅 mockApi 冒烟（8 项），UI 组件无自动化测试——demo 项目可接受，引入框架时优先补 DishRow/OrderCard。
- ~~D3StatusRing 内圈一处 rgba(0,0,0,0.5) 暗影为有意保留~~ ✅ 组件整体已删（死文件零引用，见台账"机械债清零"）；--ring-size 令牌仍由 StoveStage 消费。
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
