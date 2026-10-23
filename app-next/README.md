# 懒懒的厨房

晨光厨房 2026-10-23 全量重构版。前端在 `app-next/`，旧版 `extracted/` 原样保留，可随时回滚。

## 跑起来

```bash
cd app-next
npm install
npm run dev        # http://localhost:5180/#/today
npm run build
npm run preview    # http://localhost:4180/#/today
```

`npm run lint` 0 warning / 0 error，`npm test` 11项全过。

## 技术栈

React 19 + Vite 8 + react-router-dom 7 + framer-motion 12。没有 Tailwind，样式全部手写，令牌集中在 `src/styles/tokens.css`。

## 数据怎么走

- Vite dev、preview、GitHub Pages：自动装 `src/lib/mockApi.js`，数据在 localStorage，键与旧版相同。
- 家庭服务端（端口8787或页面注入了 `window.__CHENGUANG_FAMILY__`）：不装 mock，直接请求同源 `/api`，接口与旧版 `server/index.cjs` 逐条对齐。
- 菜品、订单、纪念日、愿望、评分五个资源由 `src/state/DataContext.jsx` 统一加载；购物车、收藏、冰箱、昵称与外观各自有自己的本地键。

## 路由

| 路由 | 页面 | 说明 |
|---|---|---|
| `/today` | 今天 | 手绘小羊场景、今日主推、本周开火、纪念日、冰箱计数、快捷入口 |
| `/menu` | 菜单 | 搜索、分类、收藏筛选、给谁点、列表加购、许愿 |
| `/dish/:id` | 菜品深链 | 在菜单上打开同一道菜的面板，兼容旧书签 |
| `/cart` | 锅巴 | 左滑删除、份数、AA/我请/TA请、备注、分享、合并、下单 |
| `/orders` | 订单 | 按月份分组，进行中与已完成筛选 |
| `/orders/:id` | 订单详情 | 五段火候、明细、分账、评分、照这桌再来一单 |
| `/me` | 我的 | 统计、纪念日、成就、愿望、设置、后台入口 |
| `/fridge` | 冰箱 | 本地食材清单，加减与删除 |
| `/admin` | 厨房后台 | 概览与四个管理入口 |
| `/admin/dishes` | 菜品管理 | 加菜、改价、上下架、删除 |
| `/admin/orders` | 订单管理 | 推进pending→cutting→cooking→plating→completed |
| `/admin/anniversaries` | 纪念日 | 增删改，可绑定当天吃的菜 |
| `/admin/wishes` | 愿望池 | 做出来了、婉拒、放回待处理、删除 |

旧路由 `/home`、`/profile`、`/favorites`、`/checkout` 做了重定向。日历、口味画像、年度报告、热榜四页按本次范围裁掉，旧书签统一回到 `/me`。

## 设计层

两轨共用一套令牌。

- 装饰轨：今天页。手绘场景裁自所有者自己的六屏原型，粉色底、单一墨色、容器零描边、贴纸允许压图不压字。主图把墙面、地面、枕头、木桶、围巾这些暖色替换成粉色，白羊毛、棕耳、绿杯、蓝水保留；原奶油裁片在 `../design/assets/lamb-cream/` 备份。
- 功能轨：菜单、锅巴、我的、后台。白卡加玫瑰软投影，正文只用 `--ink` 与 `--ink-2`，coral 只做图标和大字号句中焦点。
- 照片统一 `saturate(.72) sepia(.16) brightness(1.03)`，没有豁免区。
- 触控下限44px，输入框本身也撑到44px；小控件不用 ink 实底。
- 主基调是浅樱粉，停靠栏是玫瑰粉，卡片近白；夜间是外观态，深玫底、奶油字、金色激活面，21:00到05:00自动切，也可以钉住。
- 头像用 160×160 方形裁片，整头居中，素材自带的 sage 环直接当边框，CSS 不再叠第二圈；旧的 140×165 非方形裁片会被 cover 压低头部，已废弃。
- 动效上限300ms，位移加缩放加透明度，`prefers-reduced-motion` 和“我的”里的“少动一点”都会关掉位移。

设计依据在 `../docs/2026-10-17-apple语言层-规则表.md`、`../playground/style-spec-lamb-13.md`、`../playground/ai-spec-mini-program-5.md`，以及 `../docs/2026-10-18-小羊主题首页-设计方案.md`。粉色主基调是 2026-10-23 的追加改动，令牌在 `src/styles/tokens.css`，奶油版备份在 `src/styles/tokens-cream.css.bak`。

## 目录

```
src/styles/      令牌、基础、组件、页面、插画
src/lib/         API、mock、候选池、日期、纪念日、夜宵、评分、冰箱、收藏、密码门
src/state/       设置、吐司、数据、购物车、菜品面板
src/components/  图标、菜品插画、行、面板、对话框、停靠栏、滑动删除、配角
src/pages/       八个主页面与五个后台页面
tests/           候选池与格式化的纯函数测试
tools/           CDP截图、明暗对比度与触控审计、下单与后台流程脚本
```

## 验收

最终生产构建跑了两套门禁。

- 8个路由 × 明暗两态：菜单页1374个文本节点，全部通过 WCAG AA；0个触控问题；0个横向溢出。
- 许愿弹层、菜品面板、后台加菜表单 × 明暗两态：0个对比度失败，0个触控问题。
- 320px + 大字号 + 夜间：文档宽等于视口宽，无横向溢出。
- 真实家庭服务端：下单写到 `state.json`，后台推进状态成功，无运行时异常。

证据与脚本在 `../research/20261023-全部重构/`。

## 已知缺口

- 还没有切到正式版。旧版仍在 `extracted/`，家庭服务端默认仍指旧 `dist`。
- 没有 Service Worker 和 PWA 安装能力。
- 菜品面板从 `/dish/:id` 深链打开后，关闭面板地址仍停在该路由，页面背后是菜单。
- 后台菜品上下架只有眼睛图标和 aria-label，没有可见文字。
- UI 层验证靠 CDP 审计与截图，没有组件测试框架；纯函数测试11项。
- 手绘场景来自700px宽的原型分镜，2倍屏下会略软。要更清晰需要原PSD或矢量稿。

## 切换建议

先把家庭服务端指向 `app-next/dist` 跑一天，确认家人手机、公网隧道、后台密码门都正常；再把旧 `extracted/src`、`public`、`dist` 归档到 `archives/20261023-旧版晨光厨房/`，最后把 `app-next` 换成新的主工程。切换会改家人正在用的界面，做之前先确认。
