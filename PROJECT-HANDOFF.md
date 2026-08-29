# 项目交接文档 · 晨光厨房（food-ordering-miniapp）

> **给接力的 AI / 开发者**：本文档自包含，读完即可接手。
> **协作铁律：每一次代码/数据/文案修改，都必须同步更新本文档（进度表、文件地图、坑清单按需），随代码一起提交。** 这是项目所有者定的规矩。
> 最后更新：2026-08-29　代码 HEAD：`92cad75`　工作区：干净
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
| `--color-ink-900` | `#F7F3EC` | 页面底（暖骨白） |
| `--color-bone` | `#2B2620` | 主文字 |
| `--color-clay` / `-soft` | `#C8683F` / `#E0A07E` | 我(🐱) 赤陶暖 |
| `--color-sage` / `-soft` | `#7FA37A` / `#A9C4A4` | TA(🐰) 鼠尾草绿冷 |
| `--color-caramel` / `love` / `danger` | `#B5793F` / `#D98C84` / `#C2543F` | 价格数字 / 喜爱 / 删除 |
| `--color-ash` / `mist` | `#6B6155` / `#9A9082` | 次文字 / 占位 |

核心语义必须保留：**双人格（我/TA）、购物车、谁买单（AA/我请/TA请）、收藏**。

**视觉层次原则（2026-08-29 实测打磨定稿）**：每屏一个深色锚点（首页主推卡、购物车合计卡 = clay 实底白字，其余浅色玻璃）；价格数字一律 caramel 衬线、clay 只留给动作/激活态；图片背景用 FullBleedHero 的多档纵向溶底叠层，不与玻璃卡硬碰；导航/快捷图标用 `ui/Icons.jsx` 细线 SVG（激活态白色），不再新增 emoji 图标。

## 4. 架构约定（改代码前先读）

1. **页面转场绝不能带 transform**（App.jsx `pageEnter` 纯 opacity），否则 PageHeader 吸顶失效、FullBleedHero 错乱。位移用 `contentEnter` 放内层。
2. **DockLayer 是全站唯一常驻底部固定层**（导航+购物车球并排同行）。购物车为空时球槽不渲染（药丸自然居中），加购时药丸以 `layout` 动画让位——不要恢复恒定占位。
3. **所有用户侧页面用 `PageHeader`**（back/backTo/right）；后台三页一律包 `AdminShell`。后台标题保持功能命名（工具页不加情话）。
4. **颜色单源真值**：色值只写在 `src/index.css` + `src/theme/persona.js`；页面一律 `var(--color-*)`；给运行时 var() 用的令牌放 `@theme static`（防树摇）。新玻璃浓度用 `--glass-strong`。
5. **文案单源真值**：所有页头标题/情话池集中在 **`src/lib/sweetCopy.js`**（NICKNAME='懒洋洋' + 各页标题/副标题池），六页每次进入随机抽取。**改情话只动这个文件**；新增页面文案也放这里。
6. **不可变文件（最小改动，改须逐处说明）**：`src/components/CartContext.jsx`、`src/lib/mockApi.js`（已因数据接线 +2 行与菜谱注入 +3 行，均有据）、`src/lib/favorites.js`。
7. 共享组件放 `src/components/ui/`，≥2 处真实调用点才建；`Icons.jsx` 是图标基元集，单调用点也保留。
8. 提交信息用中文，说明「为什么」；**提交前跑 lint + build + `p6_static_gate.py`**。

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
│                            Chip/PageContainer/AdminShell
├── pages/                   10 页：Home/Menu/DishDetail/Cart/MyOrders/OrderDetail/
│                            Profile/Admin/AdminDishes/AdminOrders
│                            （Checkout、Favorites 已删，路由保留重定向）
public/dish-images/htc/     HowToCook 预览图 153 张（生成）
scripts/
├── p6_static_gate.py        静态门禁自检（色值单源差分/暗色/断头路）
└── build_htc_seed.py        HowToCook 灌库生成器
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
| 迁移 | 项目迁至 E:\晨光厨房-交付包（本目录） | （无代码变更） |

## 8. 已知待办 / 候选项

- `preview-all-features.html` 又落后于最新视觉（深色锚点卡、图标化、快捷入口删除、菜谱卡均未同步）——下次大改版时一并重写。
- `Icons.jsx` 目前仅 FloatingPillNav 一个调用点；后台快捷入口/Profile 行项想换图标时直接复用它。
- AddDishModal 仍是旧命名残留大户（--color-primary 系、Fredoka 字体），P6 旧命名门禁若重启需优先处理。
- D3StatusRing 内圈一处 rgba(0,0,0,0.5) 暗影为有意保留（深色内盘上的暗影）。

## 9. 色值审计方法（门禁脚本已实现）

白名单种子 = `index.css` + `theme/persona.js` + `theme/images.js` 全部色值；允许项：bone 正文、深赤陶、黑/骨 rgb 阴影、纯白系。逐文件差分，越界即残留；另跑暗色检测（max(R,G,B)<0x50 且不在允许集）。见 `scripts/p6_static_gate.py`。

## 10. 给接力的开场白模板

> 请先读 `E:\晨光厨房-交付包\extracted\PROJECT-HANDOFF.md`。遵守第 4 节架构约定与第 5/9 节的坑，改动前跑 `npm run build`、`npm run lint`、`python scripts/p6_static_gate.py` 复验。**每次修改同步更新本文档（进度台账 + 文件地图 + 坑清单），随代码一起提交。** 文案改 `src/lib/sweetCopy.js`，菜品/菜谱数据用 `scripts/build_htc_seed.py` 重新生成。
