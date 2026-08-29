# 晨光厨房 · food-ordering-miniapp

情侣点餐 H5 小程序：480px 手机竖屏框，晨光厨房暖骨白视觉，男朋友视角文案（写给女朋友「懒洋洋」）。

## 功能

- 点菜 / 收藏 / 购物车 / 谁买单（AA · 我请 · TA请）双人格系统
- **407 道菜**：65 道原始种子 + 342 道来自 HowToCook 开源菜谱（公有领域），153 道带本地实拍图
- 详情页「男朋友的菜谱」：原料清单 + 编号制作步骤 + 卡路里（342 份，懒加载）
- 每页随机页头情话与标题（文案池集中在 `src/lib/sweetCopy.js`）
- 后台三页：菜品管理 / 厨房看板（状态推进）

## 跑起来

```bash
npm install
npm run dev      # http://127.0.0.1:5173/
npm run lint     # oxlint
npm test         # mockApi 冒烟测试
npm run build
python scripts/p6_static_gate.py   # 静态门禁（色值单源/暗色/断头路）
```

## 接手必读

架构约定、数据层说明、踩坑清单、进度台账全部在 **`PROJECT-HANDOFF.md`**；
改情话只动 `src/lib/sweetCopy.js`；菜品/菜谱数据用 `scripts/build_htc_seed.py` 重新生成。
`docs/prd.md` 为 v1.0 历史 PRD，仅作背景参考。
