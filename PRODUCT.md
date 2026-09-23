# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **主用户**：女朋友「懒洋洋」——在手机上（家庭 WiFi 或公网隧道下的浏览器）点菜、收藏、查看订单的人；使用场景是居家、饭后、深夜饿了，心态放松、决策随意。
- **次要用户**：男朋友（产品所有者兼「掌勺人」，写文案、上菜、管理后台）；家庭成员（共享同一局域网后端）。

## Product Purpose

情侣点餐 H5 小程序「晨光厨房」：女朋友在 480px 手机竖屏框里浏览菜品、加入购物车、下单并选择谁买单；男朋友按订单做菜。成功 = 她愿意每天打开它点菜，它比微信里随口说一句更有趣、更有仪式感。夜宵时段（21:00–05:00）自动切换夜宵模式，端出专属夜宵首页与开屏宵夜弹窗。

## Positioning

- 只服务一个家庭：数据不出家门（本地 Node 服务端 + state.json 原子持久化），可选双击 exe 启动。
- 双人格机制：我(🐱) / TA(🐑) 两套人格色贯穿购物车、买单（AA/我请/TA请）、收藏。
- 男朋友视角文案：所有页头标题/情话从 `sweetCopy.js` 文案池随机抽取，昵称固定「懒洋洋」。
- 真实内容量级：432 道菜（含 25 道夜宵种子）、342 份懒加载菜谱（原料/步骤/难度/卡路里），菜品预览图 231/432 为真实照片（HowToCook 实拍 + Wikimedia CC），其余 emoji 占位。

## Operating Context

- 日常运行：家里常开电脑双击 `server/晨光厨房服务端.exe`（:8787），全家手机浏览器访问；开发预览走 `npm run dev`（:5173，浏览器 mock 模式，各设备数据独立）。
- 公网访问经 OpenFrp 隧道（手机直开网址，两端不装 App）。
- 每次进入应用：时段判定自动决定白天/夜宵界面；页头情话随机抽取。

## Capabilities and Constraints

- 技术栈：React 19 + Vite 8 + Tailwind v4（@theme 令牌）+ React Router 7 + Framer Motion 12 + localStorage mock（离线可用）。
- **不可变文件（最小改动，改须逐处说明）**：`src/components/CartContext.jsx`、`src/lib/mockApi.js`、`src/lib/favorites.js`。
- **单源真值**：色值只写在 `src/index.css` + `src/theme/persona.js`（+images.js）；文案只改 `src/lib/sweetCopy.js`；生成数据文件（seedMenuExtra/seedRecipes/seedNightExtra）勿手改。
- **架构红线**：页面转场禁 transform（纯 opacity）；DockLayer 是全站唯一常驻底部固定层；用户侧页面一律 PageHeader，后台三页一律 AdminShell 且标题保持功能命名。
- **接口同步**：mockApi 与 server/index.cjs 一比一复刻，改接口语义两边都要动。
- **质量门禁**：改码必跑 `npm run build` / `npm run lint` / `npm test` / `python scripts/p6_static_gate.py`（退出码须显式核验）；每次修改同步更新 PROJECT-HANDOFF.md（含根目录副本）。
- 接口语义改动必须双端同步；夜宵种子 id 段 900–924。

## Brand Commitments

- 产品名「晨光厨房 Sunlit Kitchen」；昵称「懒洋洋」与男朋友口吻文案为永久人设。
- **四大核心语义不可移除**：双人格（我/TA）、购物车、谁买单（AA/我请/TA请）、收藏。
- 菜品预览图必须真实照片，禁止 AI 生成图（用户明令）。
- **2026-09-21 所有者确认**：所有者即懒羊羊 IP 方（ALPHA），本小程序为非商用家庭自用，官方懒羊羊形象素材可直接使用。
- **2026-09-21 视觉方向裁定（先选后回）**：曾按官方「懒羊羊 来抓娃娃吧 / 治愈养成图鉴」设计语言全站换装（糖果色板/娃娃机签名交互/深夜奶油夜宵），**同日所有者拍板回滚**，现行视觉世界恢复为「编辑杂志质感 · Rosy Kitchen 粉纸版」（DESIGN.md 以此为准）。懒羊羊版完整代码保存在快照提交 `0a543aa`，日后重启可重放；该参考图风格不再是绑定约束，重新启用需所有者再次确认。

## Evidence on Hand

- 代码仓库：`E:\晨光厨房-交付包\extracted`（HEAD 见 git log；工作区状态以 git 为准）。
- 数据：432 道菜种子、342 份菜谱、真实图 231 张（`public/dish-images/`：htc/ 169、real/ 35、dish-*.webp 11）。
- 文档：`PROJECT-HANDOFF-晨光厨房.md`（全量）+ 两份会话交接（2026-09-17 / 09-18）。
- 组件资产：`ui/LazySheep.jsx`（自绘懒羊羊 v2，四表情）、`ui/Icons.jsx`（细线 SVG 图标集）。
- 参考图：所有者提供的 10 张懒羊羊官方设计图（抓娃娃机主题 + 治愈养成图鉴主题，©ALPHA，已授权本项目使用）。
- 不得虚构：任何外部用户、评价、下载量、公开运营数据。

## Product Principles

1. 她是主角：一切界面、文案、彩蛋都围绕「懒洋洋被照顾」的体感设计。
2. 数据不出家门：家庭私有部署是产品立场，不是技术细节。
3. 真实优先：菜品图用真实照片，菜谱来自可验证开源库，不造假不 AI。
4. 明亮治愈 > 沉稳克制：所有者一贯偏好明亮、可爱、有温度的视觉与交互。
5. 单源纪律：颜色、文案、数据各有唯一真源文件，改哪类东西去哪个文件。

## Accessibility & Inclusion

- 全站尊重 prefers-reduced-motion（动效降级为纯 opacity 淡入）。
- 深色锚点卡白字对比保持 WCAG AA（≥4.5:1）。
- 触屏为主：按压反馈、≥44px 常用触摸区。
