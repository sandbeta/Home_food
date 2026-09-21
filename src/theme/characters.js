// ============================================================
// 懒羊羊官方角色素材 · 单源映射（2026-09-21 · V3 设计稿落地）
// ------------------------------------------------------------
// 素材 = 官方参考图抠出的透明底 PNG（public/lazy-assets/）。
// 版权：所有者即 IP 方（ALPHA），非商用家庭自用，授权使用。
// 纪律：使用位先在此登记，页面不写散落路径；抠图边缘在深色底上
// 可能带极淡奶白边，深色场景用容器（圆底/卡片）托住即可。
// ============================================================
import { assetUrl } from '../lib/assetUrl'

const img = (f) => assetUrl(`/lazy-assets/${f}`)

export const CHARACTER = {
  /* —— 娃娃机挂点轮换池（Home/NightHome 主推位，随「换一道」轮换） —— */
  lazyApple:   { src: img('lazy-apple.png'),    name: '懒羊羊 · 苹果' },
  meimeiLolli: { src: img('meimei-lolli.png'),  name: '美羊羊 · 棒棒糖' },
  huiCupcake:  { src: img('hui-cupcake.png'),   name: '灰太狼 · 纸杯蛋糕' },
  lazyMedal:   { src: img('lazy-medal.png'),    name: '懒羊羊 · 奖牌' },
  /* —— 页头徽记（TA 的化身；宵夜档灰太狼值班） —— */
  badgeDay:    { src: img('punch-lazy.png'),    name: '页头 · 懒羊羊' },
  badgeNight:  { src: img('punch-hui.png'),     name: '页头 · 灰太狼' },
  badgeMeimei: { src: img('punch-meimei.png'),  name: '页头 · 美羊羊' },
  /* —— 场景点缀 —— */
  peek:        { src: img('top-lazy.png'),      name: '趴栏探头 · 弹窗横幅' },
  egg:         { src: img('egg-sheep.png'),     name: '荷包蛋早安 · 身份卡' },
  grass:       { src: img('grass-sheep.png'),   name: '草地探头 · 页尾收边' },
  disc:        { src: img('disc-hui.png'),      name: '黑胶值班 · 宵夜弹窗' },
  claw:        { src: img('claw-lazy.png'),     name: '被抓瞬间 · 庆祝彩蛋' },
}

/** 娃娃机轮换池（key 顺序即「换一道」轮换顺序，稳定不随机） */
export const CLAW_POOL = ['lazyApple', 'meimeiLolli', 'huiCupcake', 'lazyMedal']
