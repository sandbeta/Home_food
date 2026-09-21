// ============================================================
// 懒羊羊官方角色素材 · 单源映射（2026-09-21 · V3 设计稿落地）
// ------------------------------------------------------------
// 素材 = 官方参考图抠出的透明底 PNG（public/lazy-assets/）。
// 版权：所有者即 IP 方（ALPHA），非商用家庭自用，授权使用。
// 纪律：使用位先在此登记，页面不写散落路径；抠图边缘在深色底上
// 可能带极淡奶白边，深色场景用容器（圆底/卡片）托住即可。
// 2026-09-21 所有者反馈：透明底素材在界面上显"镂空不完整"。
// 分两类处理：① 悬浮在卡面上的大图（娃娃机轮换池 / 空态肖像 / 彩蛋 /
// 页尾探头）→ 用 opaque/ 实底贴纸版（粉纸圆角底 + 玫瑰高光描边）；
// ② 已坐在实心圆底容器里的小徽记（badgeDay/Night/Meimei，PageHeader 的
// 鼠尾草圆底）→ 仍用透明底，避免"圆里套方"双重描边。原透明底 PNG 全保留。
// ============================================================
import { assetUrl } from '../lib/assetUrl'

const img = (f) => assetUrl(`/lazy-assets/${f}`)          // 透明底（小徽记用）
const imgOpaque = (f) => assetUrl(`/lazy-assets/opaque/${f}`) // 实底贴纸（悬浮大图用）

export const CHARACTER = {
  /* —— 娃娃机挂点轮换池（Home/NightHome 主推位，随「换一道」轮换） —— */
  lazyApple:   { src: imgOpaque('lazy-apple.png'),    name: '懒羊羊 · 苹果' },
  meimeiLolli: { src: imgOpaque('meimei-lolli.png'),  name: '美羊羊 · 棒棒糖' },
  huiCupcake:  { src: imgOpaque('hui-cupcake.png'),   name: '灰太狼 · 纸杯蛋糕' },
  lazyMedal:   { src: imgOpaque('lazy-medal.png'),    name: '懒羊羊 · 奖牌' },
  /* —— 页头徽记（TA 的化身；宵夜档灰太狼值班）—— 坐实心圆底，保透明 —— */
  badgeDay:    { src: img('punch-lazy.png'),    name: '页头 · 懒羊羊' },
  badgeNight:  { src: img('punch-hui.png'),     name: '页头 · 灰太狼' },
  badgeMeimei: { src: img('punch-meimei.png'),  name: '页头 · 美羊羊' },
  /* —— 场景点缀（悬浮卡面/弹窗，用实底贴纸） —— */
  peek:        { src: imgOpaque('top-lazy.png'),    name: '趴栏探头 · 弹窗横幅' },
  egg:         { src: imgOpaque('egg-sheep.png'),   name: '荷包蛋早安 · 身份卡' },
  grass:       { src: imgOpaque('grass-sheep.png'), name: '草地探头 · 页尾收边' },
  disc:        { src: imgOpaque('disc-hui.png'),    name: '黑胶值班 · 宵夜弹窗' },
  claw:        { src: imgOpaque('claw-lazy.png'),   name: '被抓瞬间 · 庆祝彩蛋' },
}

/** 娃娃机轮换池（key 顺序即「换一道」轮换顺序，稳定不随机） */
export const CLAW_POOL = ['lazyApple', 'meimeiLolli', 'huiCupcake', 'lazyMedal']
