# 20261023 全部重构 · 验收素材

新应用在 `../../app-next/`，本目录只放证据和可复跑的脚本。

## 怎么生成

```bash
cd app-next
npm run build
npm run preview                    # 4180
BASE=http://localhost:4180 node tools/shots.mjs today menu me orders fridge admin admin/dishes
BASE=http://localhost:4180 node tools/night.mjs
BASE=http://localhost:4180 node tools/poses.mjs
BASE=http://localhost:4180 node tools/audit.mjs
BASE=http://localhost:4180 node tools/audit-overlays.mjs

# 功能链路（dev 5180，mock 数据）
node tools/flow2.mjs
node tools/edge-flow.mjs

# 真实家庭服务端（临时拷贝，不动原 state.json）
PORT=8787 node <临时目录>/server/index.cjs
node tools/family-flow.mjs
```

截图以 `deviceScaleFactor=2` 输出，视口390×844；320档为320×700。`BASE` 不填时脚本默认走5180。

## 关键结果

| 检查 | 范围 | 结果 |
|---|---|---|
| 生产构建 | `npm run build` | 通过，主包423.5kB / gzip131.2kB，种子菜谱按需加载 |
| Lint | 56个文件 | 0 warning / 0 error |
| 纯函数测试 | 候选池、金额、状态、AA、周计数、摘要 | 11/11通过 |
| 对比度 | 8路由 × 明暗两态 | 0条失败；菜单页每态1374个文本节点 |
| 触控 | 同上 | 0个小于44px，0个无名字 |
| 横向溢出 | 同上 | 0条 |
| 弹层 | 许愿、菜品面板、后台表单 × 明暗 | 0条对比度失败，0个触控问题 |
| 320px + 大字号 + 夜间 | 今天、菜单、锅巴 | 文档宽320，视口宽320 |
| 真实服务端 | 临时 state.json | 订单#1001落盘，后台从pending推进到cutting，无运行时异常 |
| 粉色主题复跑 | 8路由×明暗两态、弹层、320px大字号夜间 | 0条对比度失败，0个触控问题，0条横向溢出 |

## 图

`shots/` 是初版奶油主题的证据，保留不动。2026-10-23 晚主基调改为粉色后，新证据在 `shots-pink/`，包含今天、菜单、我的、锅巴、订单、冰箱、后台、夜间四页、六种姿态、评分、许愿、后台表单和320px大字号夜间，共28张。

| 文件 | 内容 |
|---|---|
| `day-today.png` | 今天页，玩态 |
| `day-menu.png` | 菜单首屏 |
| `day-me.png` | 我的 |
| `day-cart-with-items.png` | 锅巴两行，左滑删除修好后的状态 |
| `day-dish-sheet.png` | 菜品面板 |
| `day-rating-dialog.png` | 评分弹层 |
| `day-wish-dialog.png` | 许愿弹层 |
| `day-admin-dish-form.png` | 后台加菜表单 |
| `day-admin.png` / `day-admin-dishes.png` | 后台概览与菜品列表 |
| `day-order-completed.png` | 五段火候全部点亮 |
| `day-orders-empty.png` / `day-fridge-empty.png` | 空态 |
| `pose-pray.png` 等五张 | 睡以外的五种情绪态 |
| `night-today.png` / `night-menu.png` / `night-me.png` / `night-cart-empty.png` | 夜间四页 |
| `responsive-today-320-lg-night.png` / `responsive-menu-320-lg-night.png` | 320px大字号夜间 |
| `feature-favorites.png` | 收藏筛选 |
| `feature-admin-wishes.png` | 许愿落进后台 |
| `feature-cart-shared.png` | TA分享的购物车横幅 |
| `family-cart.png` / `family-order.png` / `family-admin.png` | 真实服务端链路 |

## 读图注意

审计脚本取元素自身计算色与最近不透明祖先背景，不认 `-webkit-text-stroke` 与 SVG stroke；本应用没有用描边救可读性的文字。`opacity` 低于0.15的节点会跳过，未解锁徽章的淡化不属于失败。风格门禁没有在这版应用里跑，因为视觉是裁片加工厂矢量，不是重画壁纸；可读性与触控用DOM门禁卡住。图片是外观证据，数字以审计输出为准。


## 粉色主基调（2026-10-23 晚）

`shots-pink/` 与 `shots/` 的页面、数据、脚本完全同源，只换了主色和手绘主图背景。关键图：

- `shots-pink/today.png`：浅樱粉底、玫瑰停靠栏、粉化主图
- `shots-pink/night-today.png`：深玫夜间 + 粉色主图
- `shots-pink/cart-with-items.png`：锅巴行与步进器
- `shots-pink/responsive-today-320-lg-night.png`：320px大字号夜间
- `shots-pink/rating-dialog.png` / `wish-dialog.png` / `admin-dish-form.png`：三个弹层

主图 SVG 的粉色版在 `../../design/svg/lamb-play-color-pink.svg`，线稿 `lamb-play-line.svg` 透明，可直接压粉底。原奶油裁片和令牌备份在 `../../design/assets/lamb-cream/` 与 `../../app-next/src/styles/tokens-cream.css.bak`。
