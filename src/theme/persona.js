// ============================================================
// 暗房晚宴 · 双人格语义唯一真源
// 所有页面/组件一律从这里取双人格颜色，禁止硬编码 #E6B25A / #C2C7D2
// ============================================================

// 双人格：我(me) = 暖金主光 / TA(partner) = 冷铂辅光
export const PERSONA = {
  me: {
    key: 'me',
    label: '我',
    emoji: '🐱',
    color: '#E6B25A',
    colorSoft: '#F0CE92',
    gradient: 'linear-gradient(135deg, #F0CE92 0%, #E6B25A 100%)',
    glassBorder: 'rgba(230,178,90,0.45)',
    glow: '0 0 0 3px rgba(230,178,90,0.18), 0 6px 20px rgba(230,178,90,0.22)',
    chipBg: 'rgba(230,178,90,0.16)',
    chipColor: '#F0CE92',
  },
  partner: {
    key: 'partner',
    label: 'TA',
    emoji: '🐰',
    color: '#C2C7D2',
    colorSoft: '#DDE0E8',
    gradient: 'linear-gradient(135deg, #DDE0E8 0%, #C2C7D2 100%)',
    glassBorder: 'rgba(194,199,210,0.45)',
    glow: '0 0 0 3px rgba(194,199,210,0.18), 0 6px 20px rgba(194,199,210,0.22)',
    chipBg: 'rgba(194,199,210,0.16)',
    chipColor: '#DDE0E8',
  },
}

// 订单状态 × 视觉：待处理=铂 / 制作中=金 / 已完成=鼠尾草绿
export const ORDER_STATUS = {
  pending: {
    text: '等着呢',
    emoji: '⏳',
    ring: ['#C2C7D2', '#C2C7D2'],
    chipBg: 'rgba(194,199,210,0.14)',
    chipColor: '#DDE0E8',
  },
  preparing: {
    text: '在做了',
    emoji: '👨‍🍳',
    ring: ['#E6B25A', '#F0CE92'],
    chipBg: 'rgba(230,178,90,0.14)',
    chipColor: '#F0CE92',
  },
  completed: {
    text: '做好啦',
    emoji: '🎉',
    ring: ['#9DB39A', '#9DB39A'],
    chipBg: 'rgba(157,179,154,0.16)',
    chipColor: '#9DB39A',
  },
}

// 谁买单：AA=中性 / 我请=金 / TA请=铂
export const PAYER = {
  aa: {
    label: 'AA',
    emoji: '✌️',
    border: 'rgba(245,241,234,0.18)',
    glow: '0 0 0 2px rgba(245,241,234,0.10)',
  },
  me: {
    label: '我请',
    emoji: '🙋',
    border: 'rgba(230,178,90,0.6)',
    glow: '0 0 0 3px rgba(230,178,90,0.20)',
  },
  partner: {
    label: 'TA请',
    emoji: '💝',
    border: 'rgba(194,199,210,0.6)',
    glow: '0 0 0 3px rgba(194,199,210,0.20)',
  },
}

export const personaOf = (k) => PERSONA[k] || PERSONA.me
export const orderStatusOf = (k) => ORDER_STATUS[k] || ORDER_STATUS.pending
export const payerOf = (k) => PAYER[k] || PAYER.aa
