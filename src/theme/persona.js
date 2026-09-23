// 晨光厨房 · 双人格语义唯一真源（我=玫瑰粉暖 / TA=鼠尾草绿冷）
export const PERSONA = {
  me: {
    key: 'me', label: '我', emoji: '🐱',
    color: 'var(--clay-50)', colorSoft: 'var(--clay-40)',
    gradient: 'linear-gradient(180deg, var(--clay-60) 0%, var(--clay-80) 100%)',
    on: 'var(--color-on-dark)',   /* clay 实底上的暖白字（达 AA） */
    glassBorder: 'color-mix(in srgb, var(--clay-50) 45%, transparent)',
    glow: '0 0 0 3px color-mix(in srgb, var(--clay-50) 18%, transparent), 0 6px 20px color-mix(in srgb, var(--clay-50) 22%, transparent)',
    chipBg: 'color-mix(in srgb, var(--clay-50) 14%, transparent)', chipColor: 'var(--clay-80)',
  },
  partner: {
    key: 'partner', label: 'TA', emoji: '🐑',
    color: 'var(--sage-40)', colorSoft: 'var(--sage-30)',
    gradient: 'linear-gradient(180deg, var(--sage-40) 0%, var(--sage-70) 100%)',
    on: 'var(--color-on-sage)',   /* sage 实底上的深绿字（白字在此仅 ~1.9:1，不达标） */
    glassBorder: 'color-mix(in srgb, var(--sage-40) 45%, transparent)',
    glow: '0 0 0 3px color-mix(in srgb, var(--sage-40) 18%, transparent), 0 6px 20px color-mix(in srgb, var(--sage-40) 22%, transparent)',
    chipBg: 'color-mix(in srgb, var(--sage-40) 14%, transparent)', chipColor: 'var(--sage-60)',
  },
}
export const ORDER_STATUS = {
  pending:   { text: '等着呢', emoji: '⏳', ring: ['var(--color-ember)', 'var(--color-ember)'],
               chipBg: 'color-mix(in srgb, var(--color-ember) 16%, transparent)', chipColor: 'var(--status-pending-text)' },
  preparing: { text: '在做了', emoji: '👨‍🍳', ring: ['var(--clay-50)', 'var(--clay-40)'],
               chipBg: 'color-mix(in srgb, var(--clay-50) 14%, transparent)', chipColor: 'var(--status-preparing-text)' },
  completed: { text: '做好啦', emoji: '🎉', ring: ['var(--sage-40)', 'var(--sage-30)'],
               chipBg: 'color-mix(in srgb, var(--sage-40) 16%, transparent)', chipColor: 'var(--status-completed-text)' },
}
export const PAYER = {
  aa:       { label: 'AA',   emoji: '✌️', border: 'color-mix(in srgb, var(--color-caramel) 50%, transparent)',  glow: '0 0 0 2px color-mix(in srgb, var(--color-caramel) 12%, transparent)', fill: 'var(--color-caramel-deep)' },
  me:       { label: '我请', emoji: '🙋', border: 'color-mix(in srgb, var(--clay-50) 60%, transparent)',  glow: '0 0 0 3px color-mix(in srgb, var(--clay-50) 20%, transparent)', fill: 'var(--clay-70)' },
  partner:  { label: 'TA请', emoji: '💝', border: 'color-mix(in srgb, var(--sage-40) 60%, transparent)', glow: '0 0 0 3px color-mix(in srgb, var(--sage-40) 20%, transparent)', fill: 'var(--sage-60)' },
}
export const personaOf = (k) => PERSONA[k] || PERSONA.me
export const orderStatusOf = (k) => ORDER_STATUS[k] || ORDER_STATUS.pending
export const payerOf = (k) => PAYER[k] || PAYER.aa
