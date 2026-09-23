# 项目交接文档 · 晨光厨房（food-ordering-miniapp）

> **给接力的 AI / 开发者**：本文档自包含，读完即可接手。
> **协作铁律：每一次代码/数据/文案修改，都必须同步更新本文档（进度表、文件地图、坑清单按需），随代码一起提交。** 这是项目所有者定的规矩。
> 最后更新：2026-09-23　代码 HEAD：master f802a59b + 本轮第四轮全量整改（未提交）　工作区：脏（spark-output/ + .impeccable/critique/ 未追踪 + 大量源码改动）
> **状态：2026-09-23 第四轮 impeccable critique 全量整改已落地**（4 blocker + 32 major + 26/32 minor，四件套全绿）。详见 §7.15。核心新立规矩见 §4 第 10–13 条：令牌变更 checklist / sub-44 逐消费者验证 / mockApi↔server 自动 diff / PRODUCT.md 承诺自动核查。
> 上一轮 V3 曾回滚（见台账「懒羊羊换装（已回滚）」），本轮为按所有者审阅通过的独立原型（`../prototype-lazy-claw/index.html`）重新落地，首页在娃娃机签名交互之下仍保留「常点的」快捷网格与「最近订单」，兼顾主题与点菜效率。
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

**晨光厨房 Rosy Kitchen** —— 暖骨白亮色 + 双人格温度对比：

| 令牌 | 值 | 语义 |
|---|---|---|
| `--color-ink-900` | `#FDF6F8` | 页面底（粉纸白，2026-09-17 提亮后） |
| `--color-bone` | `#2B2429` | 主文字 |
| `--color-clay` / `-soft` | `var(--clay-60)`=`#B84569` / `#E585A5` | 我(🐱) 玫瑰粉暖（2026-09-17 提亮后回退 clay-60 折中档；soft 仍 clay-40） |
| `--color-sage` / `-soft` | `#A4C39E` / `#BBD3B5` | TA(🐑) 薄荷绿冷（2026-09-17 提亮 = sage-40/30） |
| `--color-caramel` / `love` / `danger` | `#9E5B63` / `#D96488` / `#C13E4E` | 价格数字 / 喜爱 / 删除 |
| `--color-ash` / `mist` | `#6E6069` / `#9C8F96` | 次文字 / 占位 |

核心语义必须保留：**双人格（我/TA）、购物车、谁买单（AA/我请/TA请）、收藏**。

**视觉层次原则（2026-08-29 实测打磨定稿）**：每屏一个深色锚点（首页主推卡、购物车合计卡 = clay 实底白字，其余浅色玻璃）；价格数字一律 caramel 衬线、clay 只留给动作/激活态；图片背景用 FullBleedHero 的多档纵向溶底叠层，不与玻璃卡硬碰；导航/快捷图标用 `ui/Icons.jsx` 细线 SVG（激活态白色），不再新增 emoji 图标。

**编辑杂志换装（2026-09-17）**：在晨光厨房色板与四大核心语义不变的前提下换装为「编辑杂志质感」——卡片由半透玻璃改为暖纸实底（`--color-glass: #FFF9FB`）+ 发丝边框 + 浅投影；圆角整体收敛（card 28→20px）；品牌渐变从 135° 粉橙对改为 180° 深梅粉/深鼠尾草（低饱和"专色"感）；页面边距 16→20px、区块节奏 20→26px、行高 1.6→1.7、display 字阶 34→40px 收紧字距；PageHeader 改为眉题（kicker 大写字距）+ 大衬线标题 + 底部贯通发丝线；SectionHeader 前缀梅粉短线；首页主推卡徽章改 No.xx 编号眉题。夜宵模式与 reduced-motion 降级逻辑未动。若所有者不喜欢，revert 本轮提交即可整体回退。

**懒羊羊抓娃娃主题 V3 换装（2026-09-21，本轮）** —— 设计稿 `懒羊羊抓娃娃主题设计稿 V3 · 粉色基调`（源文件 `E:\晨光厨房-交付包\lazy-theme-design-20260921T064417653Z\懒羊羊抓娃娃主题设计稿.html`，PDF 同目录 `pdf\20260921\`）落地为**形态层**，色板与圆角标尺**逐值吻合、零改动**：

| 层 | 内容 |
|---|---|
| 世界件 | 页头最顶常驻**羊毛云朵檐** `.wool-edge`（吸顶跟随，全站唯一机器语言）；首页/宵夜页尾**草地收边** `.grass-hem`（夜宵自动压暗） |
| 签名组件 | **ClawMachine 抓娃娃点餐机**：机顶羊毛檐 + 机名 + `No.xx` 糖牌 + 泡泡时钟（clay 实底，实时时间）；玻璃罩内吊官方角色素材 + 主推菜圆盘；出菜口面板（菜名 + caramel 价 + 换一道）；「换一道」= 提走旧的→放下新的 ≈0.95s；自动轮换走底部 clay 进度条 |
| 描边两档 | `--color-line`（rgba(43,36,41,.14)／夜宵 bone 20% 混色）做**普通卡/瓦片/胶囊**的 2px 可见轮廓；`--clay-deep` 做**签名件**（娃娃机机身、主按钮、激活胶囊、购物车球、加号钮）。原 1px 发丝边退位为"纸的接缝"（区块分隔、页头贯通线、列表行内规则线） |
| 角色素材 | 官方抠图 PNG 进 `public/lazy-assets/`（12 张）+ `theme/characters.js` 单源映射 + `ui/Character.jsx` 统一样式壳。**分工**：官方素材管大尺寸/静态肖像位（页头徽记 白天懒羊羊·夜宵灰太狼、空态主图、娃娃机吊挂）；自绘 `LazySheep` 管小尺寸+表情（购物车球四表情、加载陪等、灶边陪等、身份徽章、App 骨架环） |
| 新令牌 | `--plate-bg` 图鉴盘底（双主题同族端点；不消费它会在夜宵下渲染成灰球，实测踩过）；`.pill-tag` 图鉴药丸；`.status-seg` 订单三段跑灯 |
| 页面层 | 详情页原料改 `.pill-tag`、菜谱小贴士分隔改 2px 虚线；购物车条目改"糖果清单行"（分类圆牌 + 步进器 36px 档）、买单三选恢复三色（AA 金棕描边／我请 clay 实底／TA请 sage 实底——此前三档统一 clay，把 TA 的身份色吞了）；订单详情加三段跑灯；点菜/热门搜索框改糖果胶囊 |
| 修掉的旧 bug | ①娃娃机曾自绘爪钩叠在"自带爪钩的官方素材"上 → 重影（已删自绘机构，见 DESIGN.md 纪律）②`PayerSelector` 残留已废弃的过冲缓动曲线 `[0.34,1.56,0.64,1]` → 收编 EASE ③夜宵图鉴盘灰球 |

⚠️ 与设计稿的**唯一有意偏离**：设计稿六屏都没有 Hero 大图（全站纯粉纸），而 Menu/DishDetail/Cart/Orders/Profile/Hot 六页仍保留 `FullBleedHero` 底片层（编辑杂志身份的既有语言，本轮未动）。若要完全对齐设计稿，需把这六页的 Hero 一并摘除，并把 DishDetail 的大图改成设计稿里的「图鉴卡 hero-plate」（VT 共享元素形变名 `heroNameFor` 需一并从 FullBleedHero 挪过去）——属独立一轮，见 §8 待办。

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
10. **令牌变更 checklist（2026-09-23 §7.15 立）**：@theme 新增/改动任何"小字前景"令牌（`--color-clay-text` / `--color-caramel` / `--color-mist` 一类）→ 必在 `[data-theme="night"]` 段配套加提亮档（否则夜宵会 ~2-3:1 不达标，如 M-c1 上轮 clay-text 忘加）；任何"实底 fill"令牌 → 必走不反相深档（`--color-caramel-deep` / `--color-mist-deep` / `--clay-10` badge 底一类），或显式声明"text/fill 双职"禁令。检测器看不见 var() 作 fill 越界，只能靠读消费者 + 算比值。
11. **sub-44 逐消费者验证（2026-09-23 §7.15 立）**：热区抬到 44 类整改必须逐个消费者验（**按钮本体**、内层 icon、伪元素覆盖区），不能只看外层容器（M-t2 上一轮声称"抬到 44"只抬了 pill、真正 button 仍 h-9=36 就是此漏洞）。台账规矩：sub-44 整改条目要写"具体抬了哪些消费者"。
12. **mockApi ↔ server 自动 diff（2026-09-23 §7.15 立）**：`scripts/p6_static_gate.py` 或 CI 加字段级 diff（id / name / price / category / available / image_url），漂移即 fail；`nextDishId` 段位、seed 同名冲突属同类根因，靠人工容易漏（见 §7.15 M-d1/M-d2）。
13. **PRODUCT.md 承诺的自动核查（2026-09-23 §7.15 立）**：reduced-motion（M-k1 已加 `<MotionConfig reducedMotion="user">`）、44 触摸区（M-t 系列）、AA 对比（M-c 系列）三大承诺，应有一道自动核查（impeccable detect 或自建规则），别靠每轮 critique 才发现。

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
│   ├── characters.js        ★官方角色素材单源映射（CHARACTER + CLAW_POOL 轮换池，路径只在此登记）
│   ├── useTheme.js          ★主题源：时段判定(21-5点night)+手动覆盖仅当时段有效+跨界/回前台自动回归
│   ├── motion.js            pageEnter(纯opacity!)/contentEnter/cardEntrance/sheetUp/tapScale
│   └── images.js            HERO_IMAGES/三级图片回退
├── lib/
│   ├── mockApi.js           模拟后端（不可变*，改动须逐处说明）
│   ├── favorites.js         收藏 hook（不可变）
│   ├── request.js           ★§7.15 M-s5 新增：全站 fetch 走 requestJson（默认 12s 超时 + AbortController）
│   ├── announce.js          ★§7.15 m-12 新增：全局 sr-only live region 桥（App 顶部挂 #cg-live-region，各处 window.__cgAnnounce 播报）
│   ├── anniversary.js       ★批 1 新增：anniversariesToday / nextAnniversary / formatAnniDate 三个纯函数
│   ├── categoryIcons.js     品类 emoji 与菜品图
│   ├── seedMenuExtra.js     HowToCook 灌库菜品 342 道（生成，勿手改）
│   ├── seedNightExtra.js    夜宵手写种子 25 道（id 900-924，emoji 占位；§7.15 M-d2 后 905/907/915 已加"深夜"前缀消歧）
│   ├── nightRules.js        ★夜宵判定规则库（isNightSnack/nightPick + §7.15 m-26 新增 nightPickInfo 返回 isFallback）
│   ├── sceneRules.js        ★场景快选规则（SCENES 吃辣/清淡/快手/仪式感 + scenePick，Menu 前端过滤）
│   ├── adminGate.js         ★公网 Admin 密码门（包装 fetch 捕获 401→弹层输密→换 cookie 重放；见 §10.5）
│   ├── seedRecipes.js       菜谱数据 342 份（生成，懒加载，勿手改）
│   └── sweetCopy.js         ★ 全站个性化文案池（懒洋洋昵称 + 各页标题/情话，随机抽取；§7.15/批 1 补 HOT_*/NIGHT_SNACK_TITLE/ORDER_STATUS_DESC/ANNIVERSARY_*）
├── components/
│   ├── DockLayer.jsx        ★唯一常驻底部固定层（空车药丸居中，球槽随购物车挂载）
│   ├── PageHeader.jsx       ★统一页头（back/backTo/right）
│   ├── FloatingPillNav.jsx  4 tab 导航（SVG 图标，激活态白）
│   ├── D3CartOrb.jsx        购物车球（入场/退场由 DockLayer 编排）
│   ├── NightSnackSheet.jsx  ★夜宵开屏弹窗（进入夜宵即弹六宫格宵夜，一键加购；App 外壳常驻）
│   ├── ErrorBoundary.jsx    ★§7.15 B2 新增·顶层错误兜底（任何组件抛错走 EmptyState 而非整站白屏）
│   ├── AnniversaryBanner.jsx ★批 1 新增·纪念日命中日 Home 顶部横幅（clay 实底 + 🎉 图钉 + 可选跳绑定 dish）
│   ├── WishFormModal.jsx    ★批 1 新增·愿望提交弹窗（走 useDialogA11y 焦点陷阱 + safe-area 底衬）
│   ├── GlassCard / FullBleedHero(name=VT形变名) / KissIcon / AddDishModal（D3StatusRing 已删，见台账"机械债清零"）
│   ├── ClawMachine.jsx      ★签名组件·抓娃娃点餐机（羊毛檐+泡泡时钟+玻璃罩吊角色+主推圆盘+出菜口；Home/NightHome 共用，夜宵变体 showClock=false）
│   ├── AmbientLightCanvas.jsx  ★overdrive WebGL 晨光（渐进增强，失败即静默退场回 CSS 光斑）
│   └── ui/                  共享组件：Icons(细线图标集)/Character(官方角色素材壳)/LazySheep(自绘四表情小羊)/
│                            DishRow/OrderCard/EmptyState/LoadingState/PayerSelector/Stepper/StatCard/
│                            SectionHeader/Chip/LuckyDishCard/PageContainer/AdminShell/ThemeToggle(页头夜宵快捷钮)/
│                            StickerEditor(★批 1 新增·便签留言条编辑器，4 底色 6 图钉，走 @theme 令牌)
├── pages/                   13 页：Home/NightHome(夜宵专属首页)/Menu/DishDetail/Cart/MyOrders/OrderDetail/
│                            Profile/Admin/AdminDishes/AdminOrders/HotDishes +
│                            ★批 1 新增：AdminAnniversaries(纪念日管理)/AdminWishes(愿望池管理)
│                            （Checkout、Favorites 已删，路由保留重定向）
public/dish-images/         菜品预览图：htc/ 169 张（生成 153 + 真实化轮补 16）、real/ 37 张（Wikimedia CC）、dish-*.webp 仅存 11 张（均已被 HowToCook 实拍覆盖，其余 AI 图已删）
public/lazy-assets/         官方角色抠图 12 张（V3 娃娃机主题）：4 张抓娃娃场景挂点池 + 3 张页头打卡徽记 + 5 张场景点缀；映射见 theme/characters.js
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
| 懒羊羊换装（已回滚） | 2026-09-21 曾按所有者要求做「懒羊羊奶油牧场」全站换装（糖果色板/娃娃机签名交互/站酷快乐体/深夜奶油夜宵，四件套全绿+评审整改批），**同日所有者拍板回滚**——恢复粉色版（Rosy Kitchen）原状。懒羊羊版完整代码保存在分支 `lazy-sheep-snapshot`（提交 0a543aa），日后想找回：`git checkout 0a543aa -- <文件>` 或重放该提交。本次回滚为手工逆向还原（粉色版从未提交，无 git 基线可 revert）：43 文件逐处回替 + Home/index.css/DESIGN.md/favicon 按会话原稿重建 + 墨色 rgba 全局逆向 15 处 + 删 3 个新增文件（ClawMachine/字体子集/简报）。回滚后四件套全绿（build/lint/test/门禁 0），Edge 静帧核验=粉色封面刊头条版原状。**教训：观感换装轮做完当天就该请所有者拍板提交，未提交的大改回滚只能靠会话原稿重建，脆弱且昂贵** | 本轮 |
| 首页封面刊头条（impeccable bolder） | 所有者要求用 impeccable bolder 放大 Home hero 区胆量（编辑杂志身份内）。落地：PageContainer 首块新增「封面刊头条」——超大衬线刊名「晨光/厨房」拆两行错位排布（clamp 52–74px、行高 0.94、字距 -0.04em，第一行左缩进 44px、第二行右缩进 112px 形成对角张力），左缘书脊竖排当日日期（writing-mode: vertical-rl），右下倾斜 5° 的封面菜照片卡叠压刊名第二行右角（复用今日主推 featured 与 DishRow 同款图回退，点击进详情），folio 行（The Kitchen Zine + No.周数深赤陶衬线）压在大字下方，收口发丝线（marginTop 32 给封面卡注脚让位）。hero 令牌仅调参未绕开：白天 `--hero-wash-immersive` 上段 0.52/0.58→0.62/0.70（52% 处 0.78→0.80）、`--hero-filter-immersive` brightness 1.04→0.97/saturate 1.05→1.02，夜宵反相块未动。入场全走内层 contentEnter，外层无 transform，PageHeader sticky 与 fixed 定位不受影响。零新色值/字体/圆角（全消费 var 令牌），断头路门禁 0。四件套全绿 + 浏览器实截白天首页/菜单页目检（folio 期号与封面卡注脚重叠已在核验轮修掉）。NightHome 未动（夜宵另有界面） | 本轮 |
| typeset 排版层级审计 | impeccable typeset 全站扫描（重点 PageHeader/SectionHeader/Home/Menu），只动字族/字重/字距行高，零布局零文案。修三类：①**字重越界清零**——Playfair 可变轴 500–700，全站 8 处衬线 `font-extrabold`(800)（Home/NightHome 主推价、DishRow/LuckyDishCard/NightHome 网格价、HotDishes 名次）与 4 处无衬线 800（DishRow 菜名、LuckyDishCard 徽章、Menu 分组标题/+1 粒子、HotDishes NO. 徽章、DishDetail 加购按钮）全收 `font-bold`(700)，消除浏览器合成假粗；②**衬线对比泄漏修复**——全局 h1–h6 默认衬线让 4 处行级数据标题（DishRow/LuckyDishCard/Cart 商品名、OrderDetail「都选了啥」）静默吃宋体，显式 `font-sans` 归位无衬线（菜名是数据不是版面主角）；③**字距漂移收敛**——封面刊名 -0.04em→display 档 -0.035em、folio 0.22em 与 No.眉题 0.2em→eyebrow 标尺 0.18em（Home/NightHome 两处）、SectionHeader 删内联 -0.02em 回归全局 h2 的 -0.01em。合规确认：display 档两处（PageHeader/Cart 合计）均页面主标题/大数字正当用途；mist 只在占位与三级辅助位分工一致。四件套全绿 + 浏览器实截 Home/Menu/Cart 目检。遗留报告不动（字号不在本轮维度）：10px 微标全站 8 处同值同角色属封面系刻意档；adminGate.js 密码弹层 12px 离标尺一档（17/13px 恰等 lg/sm 档），该文件为公网门控、p6 门禁零告警，动它须另轮评估 | 本轮 |
| colorize 状态色收编 | impeccable colorize 全站审计 hover/active/focus/disabled 色源。**先纠偏预设**：「色阶绑定收敛」轮已把六大点名组件（GlassCard/Chip/DishRow/OrderCard/Stepper/PayerSelector）的人格色系 rgba 全部绑到 `--clay-N0`/`--sage-N0` + `color-mix`（hover→20/30、按压→70 惯例即用户本轮指定映射，已就位）；本轮逐文件复核组件内剩余 rgba 全属台账**有意不绑**类别——墨系中性阴影 rgba(43,38,32,x)（--color-bone 夜宵反相，绑 clay 会改暗底观感）与白色高光 rgba(255,255,255,x)，不属"同族色改写"，强套反破等价。真漏网两处已修：①GlassCard 默认阴影 `0 8px 24px rgba(43,38,32,0.08)`→`var(--shadow-3)`（定义逐字节相同，白天零变化，附带收益：夜宵自动跟反相阴影阶）②AdminDishes 删除钮光晕 `rgba(194,84,63,0.2)`→`color-mix(--color-danger 20%)`（danger 真值 #C2543F=rgb(194,84,63) 等价，色源归单源）。语义复核通过：PAYER aa→caramel/me→clay/partner→sage、ORDER_STATUS pending 中性/preparing clay/completed sage 均未被调换。四件套全绿 + impeccable detect 改动文件零告警 | 本轮 |
| delight 灶火接力 | 下单成功惊喜（所有者选定方案 B）。①Cart 提交成功层：通用 🎉 庆祝换成「锅已上灶」——🍲 从上方 280ms 落坐 `.stove-base` 灶台（复用 StoveStage 现成视觉，此刻熄火不撒谎）、蒸汽 keyframes 扶一记、文案 ORDER_PLACED_NOTE 进 sweetCopy；z-[60] 盖停靠层（截图抓到 z-50 被导航穿帮）；1.1s 自动让路 + 点击任意处立即跳过（skipRef 兑现）；tap+双段振动走 sfx 开关；reduced 纯淡入。②OrderDetail 灶火接力：12s 低频轮询（未完成才查/切后台跳过/completed 永停/卸载清理），pending→preparing 真实到达一刻灶台绽放一次性暖橙光晕（1.2s 自熄）+chip 按 ORDER_STATUS 新色脉冲+settle() 声；preparing→completed 现有起锅动画活播+chip sage 脉冲；只在状态前进时报喜防回退误触。E2E 真链路实测四幕截图（落锅/熄火等待/焖煮/起锅），测试订单已从浏览器存储清除。四件套全绿 | 本轮 |
| quieter 管理端降温 | Admin/AdminOrders/AdminDishes/AddDishModal/AdminShell 五文件降温（Operate 模式）：人格色只留两处——各页唯一主操作（+添加 d3-btn-primary / 推进按钮 clay/sage 实底）与人格标识（🐱🐰头像chip、状态条）。①AdminShell 头部赤陶→鼠尾草彩带改中性暖墨渐隐 rgba(43,38,32,.04/.015)；②Admin 统计数字 clay/caramel/sage 彩点全转 bone 墨色（StatCard 组件默认值未动，Profile 不受波及）、快捷入口去 3px 彩色左条+图标转 ash；③AdminOrders 推进按钮去辉光投影与 hover 浮起（反馈只留 whileTap 0.97）；④AdminDishes 行内三钮全转安静纸面按钮（上架/编辑 ash/bone 字+发丝边，删除转 danger 描边字，全部去彩底渐变与光晕——原三行六色是扫描噪音源）、加载更多去 clay 字与彩边；⑤AddDishModal 把手/🌙位徽标/输入彩点全转中性、去输入框左侧装饰 emoji（label 已有文字）、去输入框 ink-850 重影底、去关闭钮 hover 放大、主钮回归 d3-btn-primary、浮层动效收编 sheetUp+reduced 降级。功能字段文案零改动（自检收回误删的 select 选项 emoji 与误加的 * 号）。四件套全绿+detect 零告警+8787 实截三张目检 | 本轮 |
| distill 购物车瘦身 | 目标动线「看清单→选人→下单」。删除清单经所有者逐项确认后执行：**已删**=合计锚点卡的 KissIcon 爱心（display 大数字独担强调，删掉卡上第二强调源）。**保留（所有者裁定）**=A1 人格卡 glow 光晕、A2 💬 浮动动画、A3 备注卡壳、B1 买单卡壳（卡片套卡片接受为分组感）、B3 FullBleedHero 底图（全站一致性优先）。备注插在清单与选人之间未动（未获重排指示）。四件套全绿+detect 零告警 | 本轮 |
| polish Menu 页收尾 | 按 DESIGN.md 逐维对齐，9 处修复：①WhoSelector rounded-2xl→ctl 标尺（与兄弟分段控件同值）②③④⑤四处 `transition-all`→按实际变化属性收窄（transition-colors / box-shadow,border-color）⑥⑦两处 `[0.34,1.56,0.64,1]` 过冲曲线残留（Vercel 动效轮已裁定废弃）→EASE ⑧菜系分组标签 clay→ash（One Voice Rule：clay 只属于可点动作）⑨骨架卡 p-3.5/space-y-3.5→space-card-p 双处对齐（消除加载完成跳动）。看过没改：「没搜到这口」手写空态与 EmptyState 并存（搜索专属变体，收敛=重设计，超 polish 范围）、WhoSelector/分段 emoji（既有身份标识非新增图标）、搜索框 ink-800 提亮层（聚焦功能需要）、边距/壳宽/字阶/三级色/玻璃边五维实测本就对齐。四件套全绿+detect 零告警 | 本轮 |
| animate 夜宵动效 + 暗底可读性复核 | ①**NightHome**：宵夜八格由同帧出现改 cardEntrance+0.06 逐格错峰（基准 0.1 让标题先到，末格 0.52s 起）；「换一道」裸按钮补 motion.button+tapScale 按压反馈；主推卡换菜动效补 reduced 分支（去 scale 只留淡入）——本页此前无任何降级路径，本轮补齐。②**NightSnackSheet**：浮层入场收编 sheetUp 预设（原为内联复制同参数，去重）；六宫格 sheet 落定后逐格亮相（基准 0.22 等 spring 起势，总时长 0.86s 封顶）；🌙「灯亮着」徽章挂 glowPulse sage 低频呼吸（全站 glowPulse 首调用；color-mix+var 在 boxShadow 复合插值中作静态后缀、framer 只插值几何数字，无 var 解析问题；AnimatePresence 卸载即停循环，reduced 不传 animate）；「看全店」whileTap 0.97→tapScale 预设。全部只用 motion.js 现有预设，pageEnter/外层 transform 未触碰。中途 build 抓到六格 motion.div 闭合标签错配（§4.9 预告的坑兑现），已修。四件套全绿。③**暗底人格色复核（只测未改）**：clay-50 作前景 #EC8A60 vs 夜宵页底 6.48:1/卡面 5.90:1——用户担心的这一档反而是暗底上最可读的 clay；--color-clay(clay-60) 链接 5.36 ✓；**两处边缘**：ORDER_STATUS.preparing chipColor clay-70 小字暗底 3.88:1 不足 4.5（白天 ~4.4 同边缘）；白字压 clay-60 **实底**（d3-btn-primary CTA/加购钮/购物车球）2.99:1——「主色回退 clay-60」台账的"≈4.5:1"仅对锚点卡渐变深端成立（clay-80 4.58 ✓），实底按钮两主题同值、非夜宵特有。截图三张交所有者定夺，未动色 | 本轮 |
| 粉色换装第一轮（Rosy Kitchen） | 所有者要求「整体色调切换成粉色」，shape 确认后执行全局粉：clay 蜜橘十档色阶整体重定为玫瑰粉（--clay-00..90 新值，主色 clay-60=#B84569）；sage 鼠尾草绿**全阶原样保留**（粉×绿撞色成为新的双人格对比）；ink 三档纸面/卡面/区块底→粉纸家族，body-bg/scrim/hero-wash/遮罩组同步；墨色由暖棕改深梅棕 #2B2429（bone/ash/mist 三档重算，纸面对比 14.2/5.6/4.9）；caramel→玫瑰金棕 #9E5B63（价格角色不变）、love→玫粉 #D96488、danger→洋红红 #C13E4E（70% 混色双主题 6.9/5.1 达 AA）；夜宵模式反相块从暖木炭改深莓紫（ink-900 #241B21 等整组）。副产收益：锚点色白字对比由旧 clay-60 的 2.99:1 提到 5.05:1，真正达 WCAG AA（旧台账「≈4.5:1」仅对渐变深端成立）。改动落点：index.css 全量色板与墨系 rgba、theme/persona.js（ring/6 处 hex）、AmbientLightCanvas GLSL 归一色、13 个组件/页面的墨系 rgba 字面量（共 74+6+1+14 处）；DESIGN.md/.impeccable/design.json/PRODUCT.md/本文档第 3 节同步为粉色世界。四件套全绿（p6 门禁：色值泄露 0/暗色残留 0/断头路 0） | 本轮 |
| 纸面粉化第二轮 | 所有者反馈“白天模式整体还不是粉色调”——上轮只粉化了点缀色，纸面近白看不出。本轮动纸面系统本身：页底 #FDF6F8→#FAE7EF（藕粉，可感知定调）、区块底→#F5DBE6、次级底→#ECC9D9、卡面保持最亮层（glass #FFF9FC/surface #FFF7FA/glass-strong 同步）、body-bg 改粉调顶光 radial、scrim/Hero 溶底组换 rgba(250,231,239,x)。文字档随底加深：ash #675A62、mist #6F6067（粉纸各档 ≥4.5:1）；夜宵块新增 --color-caramel 覆盖 #C08492（夜卡面 5.2:1，补上轮 3.0 旧账）。夜宵/人格色/结构零改动。四件套全绿 | 本轮 || 本轮 |
| 纸面浸染第三轮 | 所有者要“泡在粉里”：中度粉提至浸染档——页底→#F9D6E6（樱花粉）、区块→#F5C6DC、次级→#F0B6D0，卡面/药丸转粉白 #FFF0F7（仍全页最亮层），glass #FFEFF6，body-bg/scrim/溶底组换 rgba(249,214,230,x)，::selection clay-10→clay-30（粉底上选中可见）；ash→#5F5259、mist→#64555C、caramel→#9E5B63（全底 ≥4.5:1 核算脚本内置门槛）。夜宵/人格色/结构零改动。四件套全绿 | 本轮 || 本轮 |
| 全纸浸染第四轮（卡面吃粉） | 所有者要求“卡面也吃粉”：卡面/surface/glass #FFF0F7/#FFEFF6→#FFEBF3（粉纸档），页底→#F9D3E5、区块→#F5C3DB、次级→#F0B4CF，亮区只剩深色锚点卡与停靠药丸（glass-strong 保留 #FFF0F7）；门槛自动收口：ash→#5F5259、mist→#5E4F56、caramel→#9A575F（卡面 ≥4.5:1），chip 文字→var(--clay-80)，persona pending 徽章漏网硬编码 #6E6069 收编进 ash 档，溶底组 rgba(249,211,229,x)。夜宵/结构零改动。四件套全绿 | 本轮 || 本轮 |
| clay 色相校准第五轮 | 所有者反馈锚点卡/药丸/加购钮“不是粉色，是酒红”——clay-60 #B84569 蓝通道占比高（B/G=1.52）读作紫红。十档色阶整体色相平移 341°→347°、B/G 降至 1.30（更正的红、更少的蓝），主色 #B84569→#BF4F68（白字 4.56:1 仍达 AA）；clay-00/10 手工定档避免纯白（违反纸面律）。消费点同步：index.css 色阶+clay-deep、persona ring/fill、AmbientLightCanvas GLSL 归一值、DESIGN.md、design.json tonalRamp。sage/纸面/夜宵零改动。四件套全绿 | 本轮 || 本轮 |
| 浅粉收口第六轮 | 所有者要「再浅一点的粉、所有 UI 符合粉调」（TA 绿经确认保留）：纸面提浅一档（页底#FCE7F0/区块#FADCE9/次级#F8D0E1/卡面#FFF4F8/药丸#FFF8FB，溶底组随动）；UI 归粉——on-dark 暖米白→#FFF9FC（JSX #FFFDF9 字面量收编 var 消费）、clay-60→#BE4E67 保白字 ≥4.5、灶台暖橙火→玫瑰粉火、灶体灰→梅灰、灶膛口→夜梅色、favicon 初代蜜橘→现主粉、theme-color→页底同值。门槛按真实消费路径全组合 ≥4.5:1 后写入。夜宵/TA 绿/结构零改动。四件套全绿 | 本轮 || 本轮 |
| 懒羊羊形象化（impeccable craft） | 所有者要求参考《喜羊羊与灰太狼》懒羊羊设计 UI，**明确约束：不改原有色调、不动原有彩蛋**。落地为纯形态层：新 `components/ui/LazySheep.jsx`——冰淇淋卷发型+羊毛刘海+口水巾（sage-30 面饰）细线头像，四表情 mood 系统（doze 犯困/sleep 熟睡/sniff 闻香/happy 满足）+ SheepZzz 飘字；4.5s 统一慢呼吸律动。接入 12 文件：PageHeader 全站页头左侧常驻小羊（晨光 doze/夜宵 sniff）；D3CartOrb 球心 🛒→羊脸（件数 0/1/4/8 触发 sleep→doze→sniff→happy）；LoadingState 锅边趴睡羊+App 骨架环陪睡；EmptyState 加 icon="lazySheep" 分支（Cart 空车用 sleep、Home 空锅引导用 doze）；StoveStage pending 灶边陪睡/preparing 闻香守灶/completed 盘边羊升级为 happy 正脸+💤→zZ；LuckyDishCard 签筒旁小羊摇签时 sniff 摇晃；NightSnackSheet 开张徽标换 sniff；Profile 进阶徽章 chip 的 sheep 线图标换 happy 正脸；Cart 下单庆祝层加 sniff 小羊。**零改动清单**：index.css/sweetCopy.js/persona.js/useTheme.js/motion.js 全部原样（色调令牌与彩蛋文案池零触碰；partnerBadge 进阶、摇一摇抽签、文案随机池行为不变）。新色值零（全消费 var 令牌，p6 门禁 0/0/0）；装饰层 aria-hidden；全部动效 reduced-motion 降级。build/lint/test 全绿（lint 剩 1 条为 CartContext 历史警告）；Chrome 无头截图核验 7 面（day home/menu/cart/profile、night home 弹窗徽标、桌面 1440、注入购物车球的 sniff 态）。注意：LazySheep 的 happy 腮红用 --clay-30、sheepBreath 常量刻意不导出（避 react-refresh 警告） | 本轮 |
| 懒羊羊 v2 重画（所有者打回） | 所有者看后判定 v1"不是懒羊羊的元素"——细线轮廓缩到 30px 糊成一团，识别特征全丢。**推倒重画为实心插画**，锁死原作四大识别特征：①头顶冰淇淋卷发型（向右盘起的"雪糕"卷，本羊灵魂）②云朵状羊毛刘海帽（下缘波浪压额）③圆白脸+绿豆眼（四表情保留：doze 眼皮下压/sleep 弯闭眼/sniff 圆眼放大+高光+腮红/happy 眯眼笑）④下巴 sage-30 口水巾+扇贝缘；耳朵两瓣白叶。配色仍零新色值：WOOL=--color-on-dark（static 不随夜宵反相）、线稿瞳仁=--clay-deep、巾=sage-30、腮红=clay-30，夜宵下羊长相不变。同步提存在感：页头徽记 30→38（容器 9→11）、购物车球 40→50、空态主图 84→100、灶边 26→32、盘边 34→40、签筒 22→28、徽章 18→24（恢复口水巾）、弹窗 24→30、骨架 17→22、锅边 26→34；MyOrders 空态 stoveOff→lazySheep sleep（所有者截图点名处）、Cart 空车 sleep→doze（睁眼更醒目）。build/lint/p6 门禁全绿；无头截图核验 orders 空态（卷发型+睡眼+绿巾可辨识）与 home 页头徽记。截图踩坑复记：lazy 分块页（cart/profile）无头截图常空白=分块未及加载的时序假象，须以 dump-dom 计数为准（羊 svg 2/文案在/无 React error） | 本轮 |
| 娃娃机改可交互签名件 + 角色实底贴纸（本轮） | 所有者两反馈：①**角色透明底在界面上"镂空不完整"**——一次性烘焙 `public/lazy-assets/opaque/` 12 张实底贴纸（粉纸圆角底 + 玫瑰高光描边），characters.js 分两类：悬浮大图（娃娃机轮换池/空态肖像/彩蛋/页尾探头）走 opaque、已坐实心圆底的小徽记（badge*）仍走透明底避免"圆里套方"双描边，原透明 PNG 全留可切回。②**娃娃机要"独立可交互有动画特效"**——`ClawMachine.jsx` 推倒重写为真·可玩机构：**自绘**轨道+滑车+缆线+三指开合爪（SVG，全 var 令牌），被抓玩偶改用可表情的自绘 `LazySheep`（doze→sniff→happy 随相位切换），点「抓取」或点罩即演完整一拍：**下爪→合钳(六芒星爆点)→提起→横移到出菜口→松爪落槽(彩纸屑+机身一震+「抓到菜名」浮标)→换新玩偶落下**（SEQ 状态机 ≈1.9s，低频签名不受 300ms 档约束）；**抓到即"抓一个算一个"**：落槽一刻 `onCatch(dish)`→Home/NightHome 接 `addItem` 进购物车，随后 `onGrab` 轮换下一只；抓取期间 `frozen` 锁住当前玩偶防自动轮换中途换菜致动画错乱；`prefers-reduced-motion` 降级为淡入换新+立即结算（不演行程）；外层守转场红线无 transform，位移全在机内元素。菜名改可点按钮进详情（原整罩点击进详情让位给"点击=抓取"）。四件套全绿（build✓/lint 仅 CartContext 历史 warning/test 8 项✓/p6 门禁 0·0·0）。**观感未经无头截图核验**（本机 Chrome/Edge headless 已挂，见 MEMORY 无头截图坑），交所有者在 live dev 目检 | 本轮 |
| ui-ux-pro-max 界面体检整改（本轮） | 用 ui-ux-pro-max 技能对照 Pre-Delivery 清单全站审，按优先级修 6 项：**①[高·无障碍]** `index.html` viewport 去掉 `maximum-scale=1.0,user-scalable=no`（WCAG 1.4.4 反模式）+ `viewport-fit=cover`；**②[高·动效]** 首页主推每 5s 自动轮换但触屏无暂停（只有 hover 暂停）——机顶加 SVG 播放/暂停切换钮（`ClawMachine` 新 `autoOn/onToggleAuto`，Home `autoOn` 进 canRotate），补 `onFocus/onBlur` 暂停 + `onTouchStart` 重置倒计时；**③[高·一致性]** 收藏钮 `⭐/🤍`（星↔心形状都变 + emoji 违禁）统一为心形 SVG（`Icons` 新增 `heart` + `filled` 参数），DishRow/DishDetail 接入，`filled` 随状态、love/mist 换色、补 `aria-pressed`；**④[中·触控]** 全局 `button,a,[role=button]{touch-action:manipulation}` 去 300ms 点延迟；**⑤[中·暗色对比]** 订单状态 chip 文字改语义令牌 `--status-{pending,preparing,completed}-text`（白天深字 / 夜宵覆盖 clay-30/sage-30/浅梅灰，修夜宵"暗字压暗底"不达 4.5:1 旧账，persona.js 改引令牌）；**⑥[低·图标纪律]** ThemeToggle 🌙☀️→moon/sun SVG（热区 40→44）、LuckyDishCard 音效 🔔🔕→bell/bellOff SVG（28→36）。`Icons.jsx` 一次性补 heart/moon/sun/bell/bellOff/play/pause 七枚 + `filled` 变体。**有意保留**（所有者既定，非 bug）：菜品分类/缩略图占位 emoji（数据非图标）、🐱 人格标识、后台/状态装饰 emoji。四件套全绿（build/lint 仅 CartContext 历史 warning/test 8 项/p6 门禁 0·0·0）。观感仍未经无头截图核验，交所有者 live 目检 | 本轮 |
| 修首页抓取逻辑 bug（本轮） | 所有者指出：点「抓取」时下方「常点的」网格也跟着顺移，逻辑不对。根因=`Home.nextDish` 里 `setGridOffset(o=>o+1)`（沿用旧"换一道"大卡+网格一起翻的手感）。抓取语义已变（抓走主推=加购），网格是"你家稳定爱吃的那几道"不该被打乱。**改法**：`nextDish` 只 `setRotIdx+1`（从"非常点的"池取下一道主推）+ 重置轮换计时，删掉 `setGridOffset` 顺移；网格保持固定。主推池本就排除网格 6 格（`rotPool`），解耦后无重复。四件套全绿 | 本轮 |
| **懒羊羊抓娃娃主题 V3 落地** | 所有者给《懒羊羊抓娃娃主题设计稿 V3·粉色基调》，要求「按设计稿重构 UI，保留原有功能」。上一轮已落一半（ClawMachine/characters.js/lazy-assets/Home+NightHome 换装，未提交），本轮补齐并修缺陷：**修重影**——官方挂点素材自带横梁+缆线+带爱心的爪钩，组件又自绘一套 ClawHook/rail/bar/rop，叠起来双爪（删自绘机构，改为整幅素材 150×150 contain 顶对齐，四张纵横比都 <1 故挂点天然对齐；抓取演出改为"提走旧的→放下新的"两拍 ≈0.95s）；**修灰球**——图鉴盘底 `radial-gradient(on-dark → surface)` 两端分属反相/不反相色系，夜宵下渲染成灰球（新增 `--plate-bg` 双主题同族令牌，娃娃机圆盘 + DishRow 缩略图接入）；**修吞色**——PayerSelector 三档曾统一 `d3-btn-primary`（全 clay），把 TA 的 sage 身份色吞了（恢复设计稿三色：AA 金棕描边／我请 clay 实底／TA请 sage 实底），并清掉该文件残留的已废弃过冲曲线。**世界层**：`--color-line` 描边两档（普通卡 2px 可见糖果轮廓／签名件 2px clay-deep；原 1px 发丝边退位为"纸的接缝"），页头最顶常驻羊毛云朵檐，页尾草地收边；**材质层 12 个组件**（PageHeader 官方角色徽记+羊毛檐、Chip、Stepper、DishRow 图鉴圆牌、Character 新建、EmptyState 空态改官方素材、GlassCard、FloatingPillNav/D3CartOrb/ThemeToggle 描边、OrderCard 芯片、PayerSelector）；**页面层**（详情 pill-tag 原料 + 虚线小贴士、购物车糖果清单行 + 分类圆牌 + 步进器 36px 档、订单三段跑灯 `.status-seg`、点菜/热门搜索改糖果胶囊）。`CartContext` 加 `category` 字段（1 行，购物车圆牌用；旧本地购物车无此字段 → `getCategoryEmoji` 回退 🍽️，无需迁移）。四件套全绿（build/lint 1 条 CartContext 历史警告/test 8 项/p6 门禁 0·0·0），Edge 实测截图 8 张逐屏目检（白天首页/点菜/详情/购物车/订单详情 + 夜宵首页弹窗与静态；夜宵盘底修复前后对比确认）。**与设计稿唯一有意偏离**：六屏设计稿无 Hero 大图，本项目 Menu/DishDetail/Cart/Orders/Profile/Hot 六页仍保留 FullBleedHero（既有编辑杂志语言），未擅自摘除，列为 §8 待办请所有者拍板 | 本轮 |

## 7.9 impeccable 全站审查 + colorize + audit + harden（2026-09-22，本轮）

用 impeccable `critique` 做双评估审查（设计评审 + 检测器，dual-agent），综合 27/40；据所有者拍板逐项整改：

- **colorize（对比度 + 单源）**：修 TA 模式主操作近乎不可见（白字压 sage ~1.9:1）——`theme/persona.js` 新增语义字段 `on`（me→on-dark、partner→on-sage），`DishDetail` CTA 与 `DishRow` 加购「+」改吃 `persona.on`（`DishRow` 加 `onAccent` prop，`Menu` 传 `partner.on`）。新增前景令牌 `--color-clay-text`(=clay-70，纸面 ~5:1)，全站 clay 小字链接/标签（Home/NightHome/Menu/OrderDetail/LuckyDishCard）从 clay-60 收编过去。占位符去掉稀释 alpha（AddDishModal ash/40、Cart mist/70 → 回落 `--color-mist`）。`Profile` 人格标题去渐变字（浅 sage 端 ~1.3:1 且违 editorial 系统）改实色 `--color-bone`。冷白 `#FFF9FC`/`text-white` 收进 `--color-on-dark`（`FloatingPillNav`/`StoveStage`/`D3CartOrb` 角标/`AddDishModal`），`D3CartOrb` 角标底向 clay-deep 压一档达 AA。DESIGN.md 补 `clay-text`/`persona.on` 两条 Do。
- **audit（娃娃机 spec↔code 对齐）**：所有者**认可自绘**——DESIGN.md 娃娃机段落 + Don't 条目 + `index.css:687` 注释全部改写为承认自绘机构（轨道/滑车/缆线/三指爪 + 抓主推菜盘 + 落槽即加购），解除"不要画爪钩"红线，标注 `CLAW_POOL`/`.claw-sprite` 已从 hero 退役（官方素材现仅 PageHeader 徽记 + EmptyState）。
- **抓取加撤销兜底**：保留"抓一个算一个"核心机制（**未动 `CartContext`**）——`ClawMachine` 的「抓到「X」」浮标升级为可点「撤销」（新 `onUndo` prop，Home/NightHome 用现有 `updateQuantity` 把该菜当前人格数量减一实现，零不可变文件改动）；顺带修该浮标的 framer 居中 bug（动画 y/scale 覆盖了 style translateX(-50%)，改用 framer `x:'-50%'`），并把浮标存续从 0.7s 延长到 ~4.2s 以便点到撤销。
- **harden（去原生对话框 + 补静默失败）**：`Cart` 下单失败 `alert()` → 锚点卡内联 danger 错误条（含 `res.ok` 校验，失败不清车）；`AdminDishes` 删除 `confirm()` → 两段式「确认删除？」，load/toggle/delete/save 全补 `res.ok`+catch→内联 `listErr` 横幅；`AddDishModal.handleSubmit` 改 await `onSave`+try/catch→弹窗内联 `saveErr`（失败保留输入不关闭）+ 保存中禁用；`AdminOrders` loadOrders 补 catch（不再无限转圈）+ 状态推进错误→内联横幅。
- **门禁**：每批改动后 build✓ / lint（仅 `CartContext` 历史 warning）/ test 8 项✓ / p6 门禁 0·0·0；impeccable detect 改动文件零新增 finding。观感仍待所有者 live dev 目检（本机无头截图不稳）。

## 7.10 impeccable 复评（Round2）+ 修自引入回归 + distill（2026-09-22）

第二轮 impeccable `critique`（双评估，读当前码复核）：**27 → 33/40**。确认上轮整改到位（on-sage CTA 8.31→4.57:1、clay-text 10 站点 5.46:1、占位 mist、角标压深、#FFF9FC 全站令牌化——并纠出子代理误报：index.css 无 #FFF9FC 残留，仅第 75 行定义处）。同时诚实认领本轮 harden **自引入的 2 个 P1 回归并当场修复**：

- **P1-1 错误条文字不达 AA**：上一步我写的三处 banner 用了裸 `var(--color-danger)` 作小字（白天 ~4.19/夜宵 ~2.72:1）。改回 `color-mix(danger 70%, bone)`（对齐 `EmptyState:61` 既有写法，bone 随主题反相双档达 AA）——AdminDishes/AdminOrders/AddDishModal。
- **P1-2 撤销浮标键盘态**：撤销 `<button>` 曾嵌在 `role="button"` 可点机壳内（非法 ARIA 嵌套 + Enter/Space 冒泡到 case.onKeyDown→runGrab = 撤销变再加购）。**把浮标移出机壳做成合法 sibling**（`ClawMachine` mx-3 wrapper 加 relative），既消除冒泡又去掉嵌套；补 onKeyDown stopPropagation 兜底；热区 pill h-11/撤销 h-9 抬到 ~44。
- **distill NightHome 三态**：补 loading/failed/reload（对齐 Home），去掉 `.catch` 吞异常致整页空白；失败/空池 → EmptyState error + 再试一次。
- **distill Menu 首屏减负**：主类目行默认 10 chip 收敛到 5（其余仍走「更多菜系」渐进披露），且当前选中类目即使在 5 之外也强制可见。
- **P2 顺手**：Cart 我/TA 小计金额 clay/sage→caramel（sage 曾 1.84:1 近乎隐形，且违反 Price-Wears-Caramel）；ClawMachine 彩纸 `var(--sage)` 死令牌→`var(--color-sage)`。
- **未做（留 owner 定夺）**：LuckyDishCard 是否下移、admin/筛选 emoji→Icons、sub-44 触摸区批量、persona.js 裸 hex/#8A4E56 收编。**已做（同日追加）**：🐰→🐑 活文档纠（PRODUCT/DESIGN/HANDOFF 色表；docs/ 归档与 2026-08 历史计划留原样）、AddDishModal/NightSnackSheet 焦点陷阱 + `role=dialog`/`aria-modal` + Esc（新 `src/lib/useDialogA11y.js`）。

## 7.11 polish：筛选/推进图标化 + sub-44 抬升（2026-09-22）

- **emoji→Icons（功能性图标）**：`Icons.jsx` 补 `sparkles`（全部）/`clock`（等着呢）/`check`（做好啦·做好了）三枚细线图标；`MyOrders`、`AdminOrders` 状态筛选 chip 与 `AdminOrders` 推进按钮（开始做→`flame`、做好了→`check`）从 emoji 改 `<Icon>`；`Chip` 基类补 `gap-1.5`（图标+文字间距）。有意保留：`🐱/🐑` 人格标识、EmptyState/LoadingState 装饰 emoji（非导航/快捷入口）。
- **sub-44 触摸区**：夜宵首页网格加购、夜宵开屏六宫格加购（28→44）、热榜加购（32→44）、购物车移除钮（32→44）、购物车 Stepper（36→44）统一抬到 44px 触控底线，对齐 `DishRow`。
- 门禁：build✓ / lint（2 条历史：CartContext + 根 `_an.mjs`）/ test✓ / p6 0·0·0；detect 改动文件仅既有字号建议，零新增。
- **仍未做（留 owner）**：LuckyDishCard 下移、`persona.js` 裸 hex/#8A4E56 收编、Menu 更多/收起等二级 chip 的 44 抬升、`docs/`(architecture/prd) 历史 emoji 文档纠（归档不动）；观感待 live 目检（尤其夜宵网格 44 圆钮是否显拥挤）。

## 7.12 persona.js 裸 hex 收编（2026-09-22）

- `theme/persona.js` 内所有裸 hex/rgba 改为引用 `@theme` 令牌：`ORDER_STATUS.ring` pending→`var(--color-ember)`、preparing→`var(--clay-50)/var(--clay-40)`、completed→`var(--sage-40)/var(--sage-30)`；pending `chipBg` `rgba(156,143,150,.16)`→`color-mix(var(--color-ember) 16%)`；`PAYER.fill` me→`var(--clay-70)`、partner→`var(--sage-60)`（均等值），孤儿第 15 色 `aa fill #8A4E56`（无任何令牌匹配、被 detect 点名的唯一 persona 越界色）归入 `var(--color-caramel)`（AA 语义本就是焦糖，border/glow 早已用 caramel，顺带纠偏）。此后 persona.js 零裸 hex，随令牌再调自动传导。
- **联动**：`OrderCard.jsx:42` 顶部状态条原用 `${bar}88 / ${bar}22` 十六进制拼接（要求 bar 是裸 hex），bar 变 var() 后失效 → 改 `color-mix(in srgb, ${bar} 53%/13%, transparent)`（#88≈53%、#22≈13%，hex/var 两种入参都吃）。已全仓扫 `${bar}xx`/`stopColor` 无其它裸色拼接依赖。
- 门禁：build✓ / lint（2 历史）/ test✓ / p6 0·0·0。

## 7.13 第三轮 critique：修 §7.12 引入的夜宵 AA 回归（2026-09-22）

- 第三轮 impeccable `critique`（双评估，读当前码）：**34/40（27→33→34，趋缓）**。抓到 §7.12 把 `PAYER.aa.fill` 并进 `--color-caramel` 是**回归**——caramel 是会随夜宵提亮的**文本色**（#9A575F→#C08492），作徽章实底时其上 on-dark 亮字掉到 ~2.9:1 不达标（原孤儿 #8A4E56 恰是不反相的深底，是对的，只是没令牌化）。
- **修**：新增不反相填充令牌 `--color-caramel-deep: #8A4E56`（@theme static，无夜宵覆盖），`PAYER.aa.fill` 指向它；DESIGN.md 补该色 + "徽章 fill 用深档、勿用会提亮的文本 caramel" 说明。顺带把 `index.css` 两处裸 `#FFF9FC`（`.d3-btn-primary`/`.avatar-me`）收进 `var(--color-on-dark)`。检测器随附验证：persona.js 那条 #8A4E56 已消失（color 10→9，总 34→33）。
- **同根因未修（留待办）**：`HotDishes.RANK_COLORS` 把 `--color-mist`/`--color-caramel`（均会反相）同时当**徽章底(行110)**和**名次数字前景(行143)**用 → NO.2 银/NO.3 铜夜宵同样 ~2.9–3.0:1。需拆 fill/text 两套色才能干净修，未顺手做。另：sub-44 只做完加购圈（弹窗关闭/娃娃机 auto 钮/Menu pill/后台行按钮/LuckyDishCard 仍 <44）；`adminGate` 密码层无 `role=dialog`/Esc/焦点陷阱；热榜 toast 与购物车庆祝层无 live region。→ 建议 `/无障碍检查` + `/optimize`。
- **教训**：连续两轮"修 A 引入 B"。立规矩——凡把裸色并进令牌，改完必扫该令牌所有 background/fill 消费者在两主题下的 on-dark 对比；若令牌 text/fill 双职，必须拆出非反相 fill 变体。检测器看不见 var() 作 fill 的越界，只能靠读消费者 + 算比值。

## 7.14 第三轮 P2 收尾：徽章夜宵 AA + sub-44 二波 + adminGate dialog（2026-09-22）

- **热榜 NO.2/NO.3 夜宵 AA（§7.13 遗留同根因）**：`HotDishes` 的 `RANK_COLORS` 一数组两用（徽章底 110 + 名次大数字前景 143）。拆成 `RANK_FILLS`（`--color-clay/--color-mist-deep/--color-caramel-deep`，不反相，配 on-dark 亮字两主题 AA）供徽章底，`RANK_COLORS` 仍供前景数字（该随夜宵提亮）。新增 `--color-mist-deep: #5E4F56`（@theme static，无夜宵覆盖）+ DESIGN 收录。
- **sub-44 二波**：AddDishModal/NightSnackSheet 关闭钮 `w-8→w-11`、娃娃机 auto 钮 `w-8→w-11` + 抓取钮 `min-h-[44px]`、Menu 更多/收起 pill `min-h-[44px]`、AdminDishes 行三钮/AdminOrders 推进钮/LuckyDishCard 音效·摇签·加一份/HotDishes 菜谱/OrderDetail 全部订单 统一 `min-h-[44px]` 或 `w-11 h-11`。按新规矩扫过：装饰性小圆（confetti/角标/头像徽记）非交互不动。
- **adminGate 对话框化**：`lib/adminGate.js` 密码层补 `role=dialog`/`aria-modal`/`aria-label` + Esc 取消 + Tab 焦点陷阱 + 点遮罩空白关闭 + 焦点归还；`.cg-gate-err` 加 `role=alert aria-live=assertive`（密码错误可播报）。
- **成功反馈 live region**：热榜"已加入"toast、购物车"锅已上灶"庆祝层、娃娃机"抓到「X」"浮标 各加 `role=status aria-live=polite`，读屏用户能听到成功。
- 门禁：build✓ / lint（2 历史）/ test✓ / p6 0·0·0；detect 改动文件仅既有字号建议零新增。观感待 live 目检（关闭钮/抓取 pill 抬到 44 后弹窗与机腹是否协调）。

## 7.15 第四轮 critique + 全量整改（2026-09-23）

第四轮 impeccable 审查（四路并行子 agent + detect 交叉印证，产出 68 findings：4 Blocker / 32 Major / 32 Minor）。同日按分组一次性整改完毕，四件套全绿。审查完整报告与 68 条明细见 `spark-output/check/晨光厨房-走查报告.md` 与 `spark-output/context/check.json`。

**Blocker（4）**：
- **B1 AdminOrders 做好了推进按钮**：sage 实底上文字用会反相的 `--color-bone`，夜宵 1.38~1.66:1 完全不可见。改 `var(--color-on-sage)`；把「压在人格渐变实底的文字必取 persona.on」写进 STATUS_ACTIONS 注释与本文件正向纪律段。
- **B2 OrderDetail 首屏 fetch 无 r.ok**：404 body 被当合法订单 setOrder → order.items.map 抛 TypeError → 整站白屏（无 ErrorBoundary）。首屏 fetch 走 `requestJson`（自带 r.ok），404 落 `notfound` 分支、其它错误/超时落 `network` 分支分别渲染 EmptyState；渲染处再补 `!Array.isArray(order.items)` 双兜底。**顶层新增 `<ErrorBoundary>`**（`components/ErrorBoundary.jsx`）包住 Routes，全站任何组件抛错都走 EmptyState 兜底不再白屏。
- **B3 双端夜宵种子漂移**（澄清为「agent 用 name diff 撞到灌库版」的误报 + 真实同名冲突）：脚本字段级 diff 确认 server/data/seed-dishes.json 里 905/907/915 三处字段其实与 mockApi `seedNightExtra.js` **值已一致**（agent B 把灌库版 735/767/713 的 ¥20/¥19/¥17 误认成夜宵版）。真问题是 M-d2「fresh 装机同屏两条同名不同价」。修 M-d2（下条）后观感自动消解。
- **B4 键盘不可达簇**：DishRow 整行 / Home 常点网格 / Home 最近订单 / HotDishes 榜单卡 / NightHome 网格 / Profile 头像 / Profile 后台入口 六处主要导航用 `<div onClick>`，键盘用户完全无法进详情、无法进后台。前六处补 `role="button" + tabIndex={0} + onKeyDown Enter/Space`（内部加购/收藏已是真 `<button>` 保留 stopPropagation）；Profile 头像改 `<motion.button role="switch" aria-checked>`，后台入口改 `<Link to="/admin">`。

**Major 分组（32）**：
- **对比度 7**：M-c1 `--color-clay-text` 加夜宵覆盖（`--clay-30`）救 10 处小字链接；M-c2 `.d3-badge` 底改不反相 `--clay-10` 深字压浅底双档 ≥6；M-c3 `me.gradient` 起色 clay-50→clay-60（on-dark 4.52:1）；M-c4 Cart 锚点小字去 opacity 82~90%→100% on-dark 达 AA；M-c5 焦点环全局改 `outline: bone + box-shadow: on-dark halo`（白天 bone 深、夜宵 bone 浅，两档 ≥9:1）；M-c6 PayerSelector AA 激活档改 `--color-caramel-deep` 底 + `on-dark` 字（同 HotDishes RANK_FILLS 思路）；M-c7 Hot NO.4+ 徽章底从 `rgba(43,36,41,0.45)` → `--color-mist-deep` 与前三同族。
- **触摸目标 5**：M-t1 PageHeader 返回钮 `w-10→w-11`；M-t2 娃娃机撤销按钮本体 `h-9→h-11`（§7.14 声称抬 44 但只抬外层 pill 是回归验证漏洞）+ 菜名钮 min-h-[44px]；M-t3 Menu WhoSelector + 分段钮 + 清空钮加 min-h-[44px]；M-t4 Home/NightHome SectionHeader 全部链接包 min-h-[44px]；M-t5 Profile 夜宵开关 my-[8px] 撑热区 44 + AdminDishes + 添加/知道了 min-h-[44px] + Admin 快捷入口。
- **a11y 结构 4**：M-k1 App 外层包 `<MotionConfig reducedMotion="user">` 兑现 PRODUCT.md 承诺（CSS 全局 media query 管不到 framer 内联动画，全站 cardEntrance/contentEnter y:16 / DockLayer 球入场 / navGlow 弹簧 / EmptyState 浮动 / LoadingState 循环 / Cart 💬 呼吸等一次性降级为纯 opacity）；M-k2 AddDishModal 四字段 label 补 htmlFor + input id + 错误 aria-describedby + aria-required；M-k3 WhoSelector 补 role=radiogroup + role=radio + aria-checked + aria-label，emoji span aria-hidden；M-k4 KissIcon svg 加 `aria-hidden focusable="false"`（全站价格前缀噪音清）。
- **视觉规范 6**：M-v1 `--plate-bg` 迁移 5 处（HotDishes / Home 常点网格 / NightHome 网格 / LuckyDishCard / StoveStage 起锅白盘——StoveStage 是唯一夜宵真会变"半融化灰盘"的破律，改用两端不反相 on-dark 家族渐变）；M-v2 StoveStage/ClawMachine 灶体/火苗/罩底/灶膛口 5 组裸 hex 收编 `@theme static` 新令牌（--stove-body-1/2 / --stove-mouth / --stove-live / --flame-hi / --flame-mid / --claw-case-hi）；M-v3 Menu 手写搜索空态收敛到统一 `EmptyState`；M-v4 HotDishes 页头文案走 sweetCopy 补 HOT_TITLES/HOT_NOTES（曾是全站唯一不走文案池的用户页）；M-v5 Menu 分段「🍜/⭐」→ Icons.jsx 的 menu/heart 细线 SVG；M-v6 Profile 夜宵开关轨道阴影 `rgba(0,0,0,0.12)` → 新令牌 `--inset-warm-1`（暖墨 + 夜宵 0.42 加强版）。
- **状态交互 8**：M-s1 NightSnackSheet 异步 effect 无 cancel → `alive` flag + isNight=false 兜底 setOpen(false)；M-s2 Home/NightHome undoCatch 用 useRef 记抓取时 whoAmI 快照，撤销按快照人格 updateQuantity（浮标 4.2s 窗口切人格不再错减 TA）；M-s3 MyOrders/Profile/Admin/HotDishes 补 requestJson + catch + 内联失败条（对齐 AdminOrders 模式，曾是同类坑重漏网）；M-s4 CartContext useState 初始化 JSON.parse 后加 `Array.isArray(raw) && 每项关键字段校验` 双守卫（**不可变文件 · 改动逐处说明**）；M-s5 全站 fetch 走新 `lib/request.js`（requestJson 默认 12s 超时 + AbortController）；M-s6 Cart mountedRef 保护 1.1s 庆祝期返回不再 navigate 到幽灵订单；M-s7 ClawMachine SEQ 起手即乐观 onCatch 加购（原落槽才加，动画期间切页/卸载会 clearTimeout 丢加购）；M-s8 Menu 夜宵分支 + NightSnackSheet 消费 `/api/dishes/all` 前 `filter(d => Number(d.available) !== 0)`（原端点不过滤，下架语义在夜宵链路整体失效）。
- **数据一致性 2**：M-d1 mockApi fresh 态 `nextDishId: 66 → 10000`（与 server 字面一致，**不可变文件 · 改动逐处说明**）；M-d2 mockApi missingSeed 判定从 `name` → ``${id}|${name}` 双键（**不可变文件 · 同 §4**）+ seedNightExtra 905/907/915 三道 name 加「深夜」前缀消歧（与灌库版 735/767/713 拉开），server/data/seed-dishes.json 同步 rename。

**Minor 修 26 / 留下轮 6**：修完 m-1~m-24（含 m-30 两段式删除 5s 自动收起 / m-11 DishDetail 首字下沉 Array.from 取首字素 + sr-only 完整文本 / m-20 Stepper useRef 累加防丢更新 / m-17 摇签 65→130ms 步进避 15Hz 闪变 / m-21 Cart 下单响应 price diff 播报 / m-22 Home/NightHome/Hot cacheList 回填初值让 VT 生效 / m-23 PayerSelector label 「我/TA」→ 🐱/🐑 明示真实人格 / m-26 nightPickInfo 返回 isFallback + NightHome 降级角标 / m-27 空池 empty 与 failed 分离 / m-31 App 顶部 debugLocked 可关闭角标 / m-12 lib/announce 挂全局 sr-only live region / m-13 保留组件独立 role=status 兼容）；**留下轮**：m-25 撤销浮标改队列（UI 结构变更）、m-32 OrderDetail completed 停轮询（服务端 PUT 状态方向校验涉及不可变文件两端同步）、m-4 Profile 头像 hover scale+rotate（有意为之的彩蛋，保留）、m-9 Stepper 完整 name 传参（可选 prop 已加，各调用点补齐留后）。

**四条新立的正向纪律**（追加到 §4，防同类回归）：
1. **令牌变更 checklist**：@theme 里新增/改动任何"小字前景"令牌（如 --color-clay-text / --color-caramel / --color-mist）→ 必在 `[data-theme="night"]` 段配套加提亮档（否则夜宵 ~2-3:1）；任何"实底 fill"令牌 → 必走不反相深档（--color-caramel-deep / --color-mist-deep 一类），或显式声明"text/fill 双职"禁令。检测器看不见 var() 作 fill 越界，只能靠读消费者 + 算比值。
2. **sub-44 逐消费者验证**：热区抬到 44 类整改必须逐个消费者验（按钮本体、内层 icon），不能只看外层容器（本轮 §7.14 声称撤销浮标抬到 44 只抬了 pill、真正 button 仍 h-9=36 就是此漏洞）。
3. **mockApi ↔ server 自动 diff**：`scripts/p6_static_gate.py` 或 CI 加字段级 diff（id/name/price/category/available/image_url），漂移即 fail；`nextDishId` 段位、seed 同名冲突属同类根因，靠人工容易漏。
4. **PRODUCT.md 承诺的自动核查**：reduced-motion（M-k1 MotionConfig）、44 触摸区（M-t 系列）、AA 对比（M-c 系列）三大承诺，应有一道自动核查（impeccable detect 或自建规则），别靠每轮 critique 才发现。

**新增文件**：`src/lib/request.js`（fetch 超时/AbortController 封装）、`src/lib/announce.js`（sr-only live region 桥）、`src/components/ErrorBoundary.jsx`（顶层兜底）。

**不可变文件改动清单**（§4.6 铁律）：`CartContext.jsx`（M-s4 类型守卫）· `mockApi.js`（M-d1 nextDishId 10000 + M-d2 (id|name) 双键去重）· `favorites.js`（未改）。所有改动均在源码里注释了 "M-sX/M-dX 修" 标记，便于逐处追溯。

**门禁**：build✓ / lint 仅 2 历史 warnings（`_an.mjs` 根脚本 + CartContext 只导出 hook 触发 react-refresh 属既有）/ test 8 项✓ / p6 静态门禁 色值泄露 0·暗色残留 0·断头路 0；四路 agent 交叉印证的高置信度 3 项（B1 视觉+a11y / B2 逻辑+边界 / B4 键盘不可达簇）+ 逻辑 agent 独立脚本 diff 确认的 B3 全部落地。观感待 live 目检（撤销按钮 h-11、Menu 分段 SVG 化、ClawMachine 起手即加购手感、focus 环双层 bone+halo 两主题、PayerSelector 「🐱 请 / 🐑 请」新文案）。

## 7.16 功能扩展批 1：纪念日 + 便签留言 + 愿望池（2026-09-23）

第四轮审查全量整改落地后，所有者同意扩功能。18 项候选分 6 批实施，本批为 S 级三条（情感增量最高、工程量最低）。

**新增数据层**（mockApi ↔ server 一比一，两端**不可变文件**改动记入 §4）：
- `state.anniversaries`（id / name / date:YYYY-MM-DD / annual:bool / dish_id / note） + `nextAnniversaryId`
- `state.wishes`（id / name / note / by:'me'|'partner' / status:'pending'|'added'|'rejected' / created_at / added_dish_id） + `nextWishId`
- `order.sticker`（{ bg, pin, msg } · msg ≤60 字，为 null 视为无便签）
- 两组 CRUD 端点：`/api/anniversaries` 与 `/api/wishes`（GET/POST + /:id PUT/DELETE）
- 老 state 兼容：loadState 里 `!Array.isArray(state.anniversaries)` 等四道兜底补齐

**顺路修双端漂移一处**：`server/index.cjs` initState 里 `missingSeed` 判定仍是 `name` 单键（§7.15 M-d2 只改了 mockApi 忘同步 server）→ 一并改成 `(id|name)` 双键，兑现本轮 §4.12「两端自动 diff」立的第一条规矩。

**新增组件与页**：
- `src/lib/anniversary.js`（anniversariesToday / nextAnniversary / formatAnniDate 三个纯函数）
- `src/components/AnniversaryBanner.jsx`（命中日 Home 顶部横幅，clay 实底 + 🎉 图钉 + 可选跳绑定 dish）
- `src/components/ui/StickerEditor.jsx`（Cart 里的便签编辑器：4 底色 + 6 图钉 emoji + 手写文案，折叠式，未编辑时仅一行"贴张便签"入口）
- `src/components/WishFormModal.jsx`（许愿弹窗，走 useDialogA11y 焦点陷阱 + safe-area 底衬）
- `src/pages/AdminAnniversaries.jsx`（Admin 管理页，行内展开式表单，顶部"下一个倒计时"锚点卡）
- `src/pages/AdminWishes.jsx`（Admin 管理页，pending/added/rejected/全部 四档 tab + 补齐跳 /admin/dishes 预填）

**新增令牌**（§4.10 令牌变更 checklist 兑现）：`--sticker-{rose,sage,apricot,sky}-{a,b}` 八个 @theme static（世界件、跨主题恒定不反相，与灶体/火苗同层）；StickerEditor 与 OrderDetail 便签呈现都从 @theme 消费 var()，**p6 门禁 0 泄露**。

**功能集成点**：
- Home：拉 anniversaries → useMemo 命中 → useEffect 一次性切 pageTitle/sweetNote 到 ANNIVERSARY_TITLES/NOTES 池 + 顶部挂 Banner + 娃娃机 rotIdx===0 首轮锁定 hitDish（用户点换一道/抓取后正常轮换）
- Cart：新增便签卡（在备注与买单之间）+ handleSubmit POST body 加 sticker 字段（msg 空则 null）
- OrderDetail：有 sticker.msg 时"备注卡"换成"贴在灶台上的便签纸"（rotate -1.2° + 图钉 + 手写字体），无 sticker 保留原样；两个都有 → 便签里嵌"给厨房：xxx"一行
- Menu：列表末尾（不管空态/满态）"没找到想吃的那一道？→ 许个愿，让他变出来 🌠"入口 + 挂 WishFormModal
- Profile：新增「我们的日子」卡（今日命中显示"今天是·N 年"，否则"下一个·N 天后"，无数据引导点管理），跳 /admin/anniversaries
- Admin：新增两入口（纪念日 / 愿望池），愿望池 pending>0 时右上角 love 色数字角标；stats 拉取从 Promise.all 升级为 Promise.allSettled 让单点失败不拖全表
- App.jsx：两条 lazy 路由 + Routes

**sweetCopy 池新增**：`ANNIVERSARY_TITLES`（5 条命中日大标题）+ `ANNIVERSARY_NOTES`（5 条命中日副标题），延续男朋友口吻 + 懒洋洋昵称人设。

**四件套门禁**：build ✓ 2.55s / lint 4 warnings 0 errors（2 处历史 CartContext/`_an.mjs` + 2 处新组件的 react-refresh/only-export-components 属既有模式）/ test 8/8 ✓ / **p6 色值泄露 0 · 暗色残留 0 · 断头路 0**。

**已知小 gap（留下轮）**：AdminWishes "变出来"目前先 PUT status='added' 再跳 /admin/dishes?state.prefill=xxx；AddDishModal 未接住 prefill 参数（下一批把 AddDishModal 支持从 location.state 读预填 name/description 就闭环）。

## 7.17 功能扩展批 2：细分进度 + 备菜清单 + 做菜看板（2026-09-23）

三小批合并落地。他侧最急的三个（"我做到哪一步了"、"要买啥"、"今天总共做几单"），从"两按钮 + 一个订单页"升级到"完整厨房看板"。四件套全绿。

### 2a · 细分进度（三档 → 六档）
- 状态从 `pending / preparing / completed` 扩到 `pending / cutting / cooking / plating / completed`，`preparing` 保留作**向后兼容别名**（读取时归一化到 cooking，UI 上不再显），不破坏历史订单渲染
- `src/theme/persona.js` `ORDER_STATUS` 加三档，chipBg/chipColor/ring 都共用 preparing 的 clay 系（都是"在做"，视觉同族，跑灯标签与文案区分档）
- `src/lib/sweetCopy.js` `ORDER_STATUS_DESC` 加 cutting/cooking/plating 三条男朋友口吻文案
- **推进链** `src/pages/AdminOrders.jsx` 从"两按钮固定映射"改成 `NEXT_STEP[order.status] → 下一档`：pending→cutting→cooking→plating→completed（旧 preparing 走 cooking 分支）
- **跑灯** `src/pages/OrderDetail.jsx` `STATUS_FLOW` 从三档扩到五档；`normalize(s)` 让 status='preparing' 归入 cooking，`STATUS_FLOW.indexOf(normalize(order.status))` 定位当前段；轮询"前进才播庆祝"用归一化后的索引比较（避免旧订单 preparing→plating 被误判为回退不播）
- **灶台视觉** `StoveStage.jsx` 保持三态（熄火/进行中/起锅）不变，只是 `preparing = !pending && statusKey !== 'completed'`，六值 statusKey 都能正确映射到三态视觉，不需要拆更多动画档
- **双端 API 白名单** `mockApi.js` + `server/index.cjs` PUT `/api/orders/:id/status` 加 `VALID = ['pending','preparing','cutting','cooking','plating','completed']`，非法 status 返 400（禁脏数据）；**方向校验留给 m-32 下一轮做**

### 2b · 备菜清单（Cart 底部 Sheet + 一键复制去超市）
- **新工具** `src/lib/purchaseList.js`：`buildPurchaseList(items)` 走 `/api/dishes/:id`（懒加载 recipe）→ ingredients 归一化到「第一个空格前 = 名字」→ 同名合并 → 返回 `{list: [{name, from: [dishName]}], noRecipe: [dishName]}`；`toPlainText()` 输出可复制到剪贴板的纯文本
- **简化决策**：不解析数量（"3 片 / 100 g / 适量"混合难合并），家庭自用够用心智；不分类（用户买菜的分类比菜谱更粗，交给用户）；无菜谱的老 65 道菜单列 noRecipe 提示"凭印象准备"
- **新组件** `src/components/PurchaseListSheet.jsx`：底部 sheet + 焦点陷阱（复用 `useDialogA11y`）+ safe-area 底衬 + 每项原料一行 + 括号里"用在：X、Y"显示来源菜；底部一键复制按钮走 `navigator.clipboard.writeText()` + 全局 live region 播报"采购清单已复制"
- **Cart 集成**：TA 点的分组卡之后、备注卡之前加"🛒 要买这些东西"入口（GlassCard 内 motion.button，min-h-[44px]），点击 open sheet

### 2c · 做菜看板（AdminOrders 今日待做视图）
- 首位加筛选档 `{value: '__today', label: '今日待做'}`；**默认 filter 从 `''` 改成 `'__today'`**（他打开后台第一眼就是想看的"今天要做的所有单"）
- 特殊值 `__today` 前端本地过滤（当天 created_at + status !== 'completed'）；不给两端加 `?status_in` / `?unfinished` 参数，家庭订单量 <百级成本可忽略
- 顶部（filter='__today' 且有单时）插**今日采购清单卡**：clay 锚点卡样式，"N 单 · 共 M 道菜要备 · 点复制去超市"，点击展开 `PurchaseListSheet`（复用 2b 组件），items 从当前过滤后所有单的 items 扁平合并
- 空态文案随筛选切换："__today" 时显"今天没单要忙 · 茶先泡上，等她点单再来"（🍵），其它保留"暂时没有订单"

## §6 文件地图同步
- `src/components/` 加 `PurchaseListSheet.jsx`（批 2b）
- `src/lib/` 加 `purchaseList.js`（批 2b）
- `pages/AdminOrders.jsx` 与 `OrderDetail.jsx` 消费扩档
- `theme/persona.js` ORDER_STATUS 从 3 档扩到 6 档
- `lib/sweetCopy.js` ORDER_STATUS_DESC 加 cutting/cooking/plating

## 门禁
build ✓ 3.03s / lint 4 warnings 0 errors / test 8/8 ✓（"状态推进 pending→preparing" 冒烟用例仍走合法六值通过）/ **p6 0·0·0**。

## 观感待 live 目检
- AdminOrders 默认打开就是"今日待做"看板视图（顶部采购锚点卡 + 下面单据）
- OrderDetail 五段跑灯在小屏 480 宽的挤压表现
- StoveStage 三态在 cutting/cooking/plating 都归为 preparing 视觉是否合理（细分档差异靠跑灯与文案承载，灶火本身不逐档变化）
- PurchaseListSheet 长清单滚动 + 一键复制反馈
- AdminOrders `NEXT_STEP` 四段按钮的文案是否精准（"下锅" / "装盘" / "做好了"，从"开始做"到"做好了"叙事链是否自然）

## 已知小 gap（留下轮）
- 状态方向校验（禁回退）留 m-32 一起做
- 每档细分时长（cutting/cooking/plating 各自预期耗时）未做，`COOK_MS=25 分钟` 仍是"从下单起总耗时"，与真实"下锅才 25 分"有偏差；下一批可以把焖煮进度改成"按当前档推算"
- 采购清单数量合并（"3 片 + 2 片 = 5 片"）需 ingredient 结构化，暂不做

## 7.18 功能扩展批 3：厨房日历 + 口味雷达 + 今日菜卡分享（2026-09-23）

"这本别册"能翻页 + 能带出门。三小批合并落地。四件套全绿。

### 3a · 厨房日历（月历视图回看每天吃了啥）
- 新页 `src/pages/KitchenCalendar.jsx`（挂 `/calendar` 路由，lazy 分包，从 Profile 入口进）
- 数据源：`/api/orders` 全表本地按 `YYYY-MM-DD` 分桶（家庭订单量 <百级）
- 视图：月历网格 7 列 × 42 格（6 周），顶部月份 ← → 切换；每格日号 + 圆点（那天有单则显，最多 3 个）+ 数字角标（当日多单）
- 今日格 clay 描边突出；非本月淡 28% 透明；无单日不可点
- 点某日 → 底部 sheet 展示当日所有 OrderCard（复用 `ui/OrderCard`，同 MyOrders 同源）；safe-area 底衬、焦点陷阱由外层 sheetUp 保证
- 顶部文案池 `CAL_TITLES` 内联（不进 sweetCopy，属功能命名一致 Admin 三页例外规矩）

### 3b · 口味雷达（五维画像 + TOP5 最爱）
- 新页 `src/pages/TasteProfile.jsx`（挂 `/taste` 路由，lazy，从 Profile 入口进）
- 五维聚合：**荤**（硬菜 + 川/粤/湘/鲁/苏/浙/闽/徽 + 东北/西北/云贵） · **素**（素菜 + 汤类） · **主食** · **小食**（小吃 + 水果 + 饮品） · **深夜**（走 isNightSnack 关键词判定，与"荤/素/主食"正交 —— 一菜若是夜宵优先归夜宵）
- **手绘 SVG 雷达**（不引外部图表库）：中心 100/100、半径 74、三层同心网格 + 五条轴线 + 数据多边形（clay-50 半透明填 + clay-deep 描边）+ 顶点小圆 + 维度标签；归一化到"最大维度 = 满格"
- 卡片下方 **翻牌 TOP 5**：按 dish_name 计数，NO.1 clay、NO.2 mist-deep、NO.3 caramel-deep、NO.4/5 ash（沿用热榜拆 fill 令牌的路子，不反相）
- 空态引导"去点菜"；err 走 EmptyState error + 再试一次

### 3c · 今日菜卡分享（canvas 手绘海报，长按保存到相册）
- 新组件 `src/components/DishShareCard.jsx`：底部 sheet + useDialogA11y 焦点陷阱 + safe-area 底衬
- 手绘 **800×1000 PNG**：顶部羊毛云朵檐（三段弧形连排）+ 品牌"晨光厨房 · Sunlit Kitchen"+ No.xx 编号 + 大标题"{NICKNAME}，今天想吃" + 菜名（wrapText 换行，最多两行）+ 中央圆形图鉴盘（有图 clip+cover 画入，失败降级 emoji 大字）+ clay-deep 描边一圈 + ¥价格（caramel 大字）+ 底部 slogan + 日期
- **图片跨域兜底**：走 `<img crossOrigin="anonymous">` 加载；`onerror` 或 `toDataURL` 抛 tainted → fallback 到 emoji 版本（仍能分享）
- 输出 dataURL 挂 `<img>` + `<a download>` "下载图片"按钮 + 长按保存提示（移动端浏览器通用）
- 集成到 Home：娃娃机之后加"📸 分享今日菜卡给 TA 看"入口（min-h-[44px] 虚线圆角按钮），点开通 sheet

### 集成
- **App.jsx**：`/calendar` `/taste` 两条 lazy 路由
- **Profile**：在「我们的日子」卡下方串两张入口卡（📅 我们的日历 · 数 N 单记录 / 🍲 口味画像 · 五维雷达），保持 sage/love 色调区分（日历走 TA 侧，画像走 love 情感侧）
- **Home**：娃娃机之后加"分享今日菜卡"入口 + 挂 `<DishShareCard>` 组件

### 门禁
build ✓ 3.38s / lint 6 warnings 0 errors（历史 4 条 + KitchenCalendar/TasteProfile/DishShareCard 各 react-refresh only-export-components 属既有模式）/ test 8/8 ✓ / **p6 0 · 0 · 0**（雷达 fill 色与 TOP5 fill 色全走 @theme 令牌，无泄露）

### 观感待 live 目检
- 日历格小屏 480 宽下 aspect-square 的挤压
- 雷达图 dim 数标签（荤/素/主食/小食/深夜）在极小半径下的可读性
- TOP5 前三名金/银/铜色阶是否被理解
- 分享菜卡的圆形图鉴盘：有实拍图（231/432）时的 crop 精度 / 无图 emoji 版是否好看
- 长按保存提示的引导强度（"长按上方保存"文案是否有效）

## 7.19 功能扩展批 4：AA 结算 + 忌口提醒 + 年度别册（2026-09-23）

数据与回顾三条。四件套全绿。

### 4a · AA 结算单（家庭语义 = 各付各的）
- **数据层新增两字段**：`order.owed_me` / `order.owed_partner`（结算快照，落库后不随事后菜价漂）；payer 归一化：`me` → 全归 🐱 / `partner` → 全归 🐑 / `aa` → 按 items.added_by 分账（**家庭场景 AA 语义 = 各付各的**，不是均摊）
- **新增 GET /api/settlements?month=YYYY-MM**：按月聚合 { orders_count, total, owed_me, owed_partner, by_payer }；历史订单缺 owed_* 时按 items+payer 现算兜底（家庭老数据兼容）
- 双端一比一（mockApi + server/index.cjs 均加，**不可变文件**改动记入 §4）
- OrderDetail 合计区 payer='aa' 时下方展开「🐱 ¥X · 🐑 ¥Y」一行小字（caramel 衬线数字）；无 owed_* 从 items 现算

### 4b · 忌口清单（提交前温柔提示 · 不阻断）
- **新工具** `src/lib/avoid.js`：`readAvoids/writeAvoids`（localStorage 设备级，家庭自用不共享）· `matchAvoid(ingredients, list)` 子串匹配（**预设 alias 展开**：如"海鲜" → 虾/蟹/贝/蛤/蛏/鲍；"酒精" → 料酒/啤酒/白酒/红酒/米酒/醪糟）· `scanDishes(dishesWithRecipe, list)` 批量扫
- **8 项预设**：香菜 / 葱 / 姜 / 蒜 / 辣（辣椒） / 麻（花椒） / 海鲜 / 酒（酒精），+ 自定义关键词（≤8 字）
- Profile 加「🌿 忌口清单」折叠卡（在口味画像入口之后、后台入口之前）：Chip 多选 + 自定义输入 + 一键清空；命中项前 4 个显示在副标题
- Cart 提交前扫描：**首次拦、再点即放行**（"提示不阻断"的家庭场景规则）· 拉每道菜 recipe → scanDishes → 命中 setAvoidHit + 显内联 warning 卡（暖墨色 ember 底 + 深字）· 「知道啦，仍然下单」→ setAvoidConfirmed(true) 再 handleSubmit · 「先返回改改」→ 收提示
- announce 播报「有 N 道菜含忌口，请看一眼」

### 4c · 年度别册（可打印的年终总结）
- **新页** `src/pages/AnnualReport.jsx`（挂 `/report`，从 Profile 入口进）
- 数据源：/api/orders 全表本地按年分桶（家庭订单量 <百级）
- 视图：
  - 年份切换（横向 tab + ‹ › 按可用年）
  - 四大关键指标：总单数 / 总花费 / 🐱 出了 / 🐑 出了（caramel / clay / sage 分色）
  - 手绘 SVG 月度柱图（12 根）
  - 深夜比例（🌙 vs 白天，走 isNightSnack 判定）
  - TOP 10 最爱（前三金/银/铜走 fill 令牌）
  - 最常开伙的一天（日期 + 周几）
  - 谁在买单：AA / 🐱 请 / 🐑 请 三档柱条
  - 🖨️ 打印按钮 → window.print()
- **新增 @media print 样式**（index.css 尾）：隐藏 .no-print/nav/footer/停靠层/购物车球；body 白底黑字；.d3-card-face 去阴影/去玻璃，保留发丝边；sticky 回滚到流内；主色令牌保留可辨识度（--color-bone→#000）
- Profile 底部加「📖 年度别册」入口卡（clay 锚点色，与"我们的日子"同层分量）

### 集成
- Profile：入口卡新增「🌿 忌口」+「📖 年度别册」共两张
- Cart：忌口扫描 + 命中拦截 UI（合计卡内、submitError 之上）
- OrderDetail：AA 结算分账展示（合计区下方一行小字）
- App.jsx：/report 一条 lazy 路由
- mockApi + server：order.owed_me/owed_partner + /api/settlements 双端同步

### §4.6 不可变文件改动清单
- `mockApi.js` + `server/index.cjs`（POST /api/orders 落 owed_me/owed_partner + GET /api/settlements 新端点）
- 语义增量、不破坏既有订单读接口；历史订单缺 owed_* 读取时现算兜底
- **未动 CartContext.jsx 与 favorites.js**

### 门禁
build ✓ 3.31s / lint 6 warnings 0 errors（历史 4 + AnnualReport/DishShareCard 等 react-refresh 属既有）/ test 8/8 ✓ / p6 0 · 0 · 0（忌口卡用 ember/on-dark 混色、年报柱图用 var 令牌，无泄露）

### 观感待 live 目检
- Cart 忌口内联卡的暖墨色 ember 底与深字对比（白天/夜宵）
- OrderDetail 合计区 payer=aa 时的两行小字布局
- 年度别册月度柱图小屏 480 宽下 12 根的间距
- 打印预览：浏览器 Ctrl-P 出的 PDF 版式（sticky 页头去 sticky / 底片层隐藏 / 卡片去阴影是否够清爽）

## 7.20 功能扩展批 5：双人协作点菜（跨设备分享购物车，2026-09-23）

四大核心语义里"双人格"最深化的一步。**决策：不做实时同步，做"手动分享 + 拉取合并"** —— 覆盖家庭日常"我点几份给你看看"的核心场景，工程量约 1/3，无需乐观并发/版本冲突/轮询机制。

### 数据层
- `state.sharedCart` 新增一份跨设备快照：`{ items, sharedBy, sharedAt }`（loadState 老 state 兼容补齐 + fresh 初值 + catch 兜底，三处都改）
- **新端点**：
  - `POST /api/cart/share` `{ items, by }` → 全量替换 state.sharedCart（含 added_by 归属保留）
  - `GET /api/cart/shared` → 返回当前 sharedCart 快照（无则 items:[]）
- mockApi + server 双端一比一（不可变文件改动记入 §4）

### 客户端
- **CartContext.jsx 增量三方法**（**不可变文件 · 只加不改主 reducer**）：
  - `shareCart()` → 拉本地 items 快照 POST /api/cart/share（by=当前 whoAmI），announce 播报
  - `fetchSharedCart()` → GET /api/cart/shared
  - `mergeSharedCart(sharedItems)` → 遍历把每条**按 added_by 原归属**合并进本地（同菜同人格 qty 累加，否则 push 新行）；announce 播报"已合并 N 件"
- **Cart.jsx 集成**：
  - 挂载时 `useEffect` 拉一次 sharedCart；若 `sharedBy !== whoAmI` 且非空 → 顶部（我点的分组之上）插入提示条：**📬 TA 分享了 N 件 · {timeAgo} · 「合并」按钮**
  - 合并成功 2.4s "已合并 ✓" sage 反馈条
  - 合计卡"下单啦"按钮之上加**「📤 把这一车分享给 TA（N 件）」**次级按钮（min-h-[44px]，on-dark 18% 混底），成功切 sage + "✓ 已分享，TA 打开就能看到" 2.4s 反馈
  - 顶栏加 `timeAgo(iso)` 辅助（刚刚/N 分钟前/N 小时前/昨天/N 天前）
  - 家庭场景 her→me / me→her 一人分享、另一人开 Cart 就看到 —— 无需轮询，无需冲突处理

### 与"实时共同车"的取舍
- **为什么不做实时同步**：需 state.cart 主表 + version 乐观并发 + 5s 轮询/SSE + 冲突处理，工程量 3-4 倍；家庭两人同时编辑同一车的场景极少（一般一人点完分享，另一人看合并），"手动分享+合并"覆盖 95% 场景
- **迁移路径**：若未来上真时同步，`sharedCart` 直接升级成主 `cart` 表即可（API 命名 /api/cart/* 已留位），客户端改动仅集中在 CartContext 三方法

### 门禁
build ✓ 2.04s / lint 6 warnings 0 errors / test 8/8 / p6 0 · 0 · 0

### 观感待 live 目检
- 提示条 sage 半透底 + 深字（on-sage）在白天/夜宵的对比
- 「📤 分享给 TA」按钮在合计卡内视觉层次（是否抢"下单啦"主按钮）
- 「已分享 / 已合并」2.4s 反馈时长够不够看清
- 合并后 items 归属正确性（本地她点的仍挂 partner、TA 分享的仍挂 me，不重贴）

## 7.21 功能扩展批 6：冰箱 + 成就徽章 + 批量上下架 + 今日心情（2026-09-23）

18 项候选的最后一批。做完即"六批全部落地、语音留下轮"。四件套全绿。

### 6a · 厨房冰箱（家庭"我们家有啥菜"，采购清单自动划掉）
- 新工具 `src/lib/fridge.js`：`readFridge/writeFridge/upsertItem/removeItem/adjustQty/hasInFridge`；localStorage 设备级 `couple_order_fridge_v1`，形如 `{ [name]: { qty, unit, updatedAt } }`；qty 归 0 自动删除
- 新页 `src/pages/Fridge.jsx`（`/fridge`，从 Profile 入口进）：添加条（名/量/单位）+ 搜索 + 按更新时间倒序列表 + 每项 ± 与移除（min-h-[44px]）+ 空态引导
- PurchaseListSheet 集成：`buildPurchaseList` 完成后遍历与 `readFridge()` 做子串匹配（"生姜" ↔ fridge key "姜"）→ 每项 `hasAtHome` 标记 → 顶部三档 tab（**要买 N 件 / 家里有 M 件 / 全部**）+ 列表按 tab 过滤 → "家里有"打绿 + 划线降 opacity、"要买"打 clay-text；复制按钮文案跟 tab 变（复制要买的 vs 全部）

### 6b · 成就徽章墙（12 枚懒洋洋干饭进阶）
- 新工具 `src/lib/achievements.js`：`ACHIEVEMENTS` 常量（12 枚）+ `computeAchievements(orders)` 遍历纯前端算解锁与首次达成时间
- 12 枚：**开张之喜** 🎉（首单）· **深夜食客** 🌙（首点夜宵）· **请客大方** 💝（payer≠aa）· **一桌老饕** 🍽️（一单 10+ 份）· **十单 / 半百 / 百单** 🔟🥘👨‍🍳 · **吃遍八系** 🗺️（一单 5 种菜系）· **一周不断火** 🔥（连 7 天有单）· **双人共事** 🐱🐑（同单两人都有）· **四季同吃** 🍂（跨 4 个月）· **一周年了** 💍（首单满 365 天）
- Profile 加「🏆 我的成就」卡（忌口之后、入口列表之前）：2 列 grid 12 枚；解锁 sage 半透底 + clay-text 计数「N/12」；未解锁灰底 opacity 0.55 + `filter: grayscale(1)`
- **无服务端改动**：全从 `/api/orders` 拉本地算，家庭 <千级订单量成本可忽略；未来若要持久化"首次达成时间"可挪到 `state.achievements`

### 6c · 批量上下架（AdminDishes 表格视图的轻量替代）
- 决策：单元格编辑（价格/卡路里/时长）需要 form state 与变化 diff，工程量与家庭价值不匹配 —— 只做**批量上下架**（最刚需），编辑仍走单条 AddDishModal
- 顶部右侧"+ 添加"按钮左侧加"☑️ 批量"toggle；每行左侧加 checkbox（min-h-[44px] 触摸区）
- 选中 >0 时底部 fixed 操作条（bone 底 + on-dark 字，浮在 safe-area 上）：**选 N 道 · [上架] [下架] [取消]** 三按钮，全 min-h-[44px]
- 循环 PUT `/api/dishes/:id` `{ available }`，家庭 <千道量级；失败内联 listErr；announce 播报"批量上下架完成：成功 N，失败 M"

### 6d · 今日心情（简化版：只切 HOME_NOTES 池，不改主题色）
- 决策：**不改氛围色** —— 会破坏"clay/sage 跨主题恒定"的同款人格色律；改主题色需新增一整套 mood 令牌 + 双档对比度验证，边际成本不值。简化到**只切副标题情话池**，覆盖"我今天心情不一样，说点不一样的"的核心情感需求
- 新工具 `src/lib/mood.js`：MOODS 常量 4 项（happy 😊 / hungry 🤤 / tired 😪 / emo 🥺）+ read/write（localStorage 设备级）
- `sweetCopy.MOOD_HOME_NOTES` 4 池 × 各 4 条男朋友口吻文案
- Home 顶部（PageContainer 首行、纪念日 Banner 之上）一行心情 chips（role=radiogroup + role=radio + aria-checked），选中切 clay 实底；已选时"清除"按钮
- Home 内 `handleMood(k)`：再点同 key 视为取消；未命中纪念日时才让 sweetNote 走 mood 池

### 6e · 语音备注（明确留下轮）
- 需要：MediaRecorder API + 二进制存储（state.orders.notesAudio base64 or 服务端 uploads 目录）+ Cart 与 OrderDetail 播放器 + mockApi/server 双端 uploads 语义
- 家庭场景"她懒得打字"实际发生率与工程量不成比例；先做**"忌口/采购/分享"这类日常高频**，语音作为下一次扩展
- 记入 §8 已知待办

### §4.6 不可变文件改动清单
- 无（本批 4 项都走本地或已有 API 端点）

### 集成
- **App.jsx**：+1 条 lazy 路由 `/fridge`（+ 之前累计新增：/admin/anniversaries /admin/wishes /calendar /taste /report /fridge 共 6 条）
- **Profile**：+3 张入口卡（冰箱 / 成就 / 年度别册），+忌口折叠卡
- **Home**：+心情 chips（PageContainer 首行）
- **AdminDishes**：+批量模式（顶部按钮 + 行 checkbox + 底部操作条）
- **PurchaseListSheet**：+冰箱对比 tab（三档 + 每项 ✓/要买标签）

### 门禁
build ✓ 1.96s / lint 9 warnings 0 errors（新增 3 条来自新页面组件的 react-refresh/only-export-components 属既有模式）/ test 8/8 ✓ / p6 色值泄露 0 · 暗色残留 0 · 断头路 0

### 观感待 live 目检
- 冰箱卡顶部三档 tab 与列表"要买 vs 家里有"分组的视觉对比
- 成就 12 枚在 480 宽下的两列 grid 是否拥挤、grayscale(1) 未解锁态是否够"灰灰的等待感"
- AdminDishes 批量操作条 z-index 与 DockLayer / AddDishModal 的层次（当前 z-40 应低于 modal z-50）
- Home 心情 chips 溢出滚动是否顺滑（4 枚 + 清除按钮在 480 宽度可能勉强）

## 8. 已知待办 / 候选项

- **Hero 大图取舍（待所有者拍板，2026-09-21）**：V3 设计稿六屏全部是纯粉纸、无底片大图，而本项目 Menu / DishDetail / Cart / Orders / Profile / Hot 六页仍保留 `FullBleedHero`。两种走法：①保留（现状，编辑杂志身份的既有语言，糖果描边坐在照片上略吵但读得清）②全部摘除对齐设计稿（需把 DishDetail 的大图改成设计稿的「图鉴卡 hero-plate」，并把 VT 共享元素形变名 `heroNameFor(dish.id)` 从 `FullBleedHero` 挪到那块 hero-plate 上，否则菜卡→详情的形变会失效；另外 `theme/images.js` + `--hero-wash-*` / `--hero-filter-*` 令牌会一并变成死代码，要连着清）。**做之前先问所有者**——这是观感级决策，且上一轮已有"换装做完当天被要求回滚"的先例。
- 测试覆盖仅 mockApi 冒烟（8 项），UI 组件无自动化测试——demo 项目可接受，引入框架时优先补 DishRow/OrderCard。
- 官方角色素材（`public/lazy-assets/`）为本人非商用家庭自用；若要对外分发，需替换为自绘 LazySheep 或取得授权。
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
