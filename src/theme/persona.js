// 晨光厨房 · 双人格语义唯一真源（我=赤陶暖 / TA=鼠尾草绿冷）
export const PERSONA = {
  me: {
    key: 'me', label: '我', emoji: '🐱',
    color: '#C8683F', colorSoft: '#E0A07E',
    gradient: 'linear-gradient(135deg, #E0A07E 0%, #C8683F 100%)',
    glassBorder: 'rgba(200,104,63,0.45)',
    glow: '0 0 0 3px rgba(200,104,63,0.18), 0 6px 20px rgba(200,104,63,0.22)',
    chipBg: 'rgba(200,104,63,0.14)', chipColor: '#C8683F',
  },
  partner: {
    key: 'partner', label: 'TA', emoji: '🐰',
    color: '#7FA37A', colorSoft: '#A9C4A4',
    gradient: 'linear-gradient(135deg, #A9C4A4 0%, #7FA37A 100%)',
    glassBorder: 'rgba(127,163,122,0.45)',
    glow: '0 0 0 3px rgba(127,163,122,0.18), 0 6px 20px rgba(127,163,122,0.22)',
    chipBg: 'rgba(127,163,122,0.14)', chipColor: '#7FA37A',
  },
}
export const ORDER_STATUS = {
  pending:   { text: '等着呢', emoji: '⏳', ring: ['#9A9082', '#9A9082'],
               chipBg: 'rgba(154,144,130,0.16)', chipColor: '#6B6155' },
  preparing: { text: '在做了', emoji: '👨‍🍳', ring: ['#C8683F', '#E0A07E'],
               chipBg: 'rgba(200,104,63,0.14)', chipColor: '#C8683F' },
  completed: { text: '做好啦', emoji: '🎉', ring: ['#7FA37A', '#A9C4A4'],
               chipBg: 'rgba(127,163,122,0.16)', chipColor: '#7FA37A' },
}
export const PAYER = {
  aa:       { label: 'AA',   emoji: '✌️', border: 'rgba(181,121,63,0.5)',  glow: '0 0 0 2px rgba(181,121,63,0.12)' },
  me:       { label: '我请', emoji: '🙋', border: 'rgba(200,104,63,0.6)',  glow: '0 0 0 3px rgba(200,104,63,0.20)' },
  partner:  { label: 'TA请', emoji: '💝', border: 'rgba(127,163,122,0.6)', glow: '0 0 0 3px rgba(127,163,122,0.20)' },
}
export const personaOf = (k) => PERSONA[k] || PERSONA.me
export const orderStatusOf = (k) => ORDER_STATUS[k] || ORDER_STATUS.pending
export const payerOf = (k) => PAYER[k] || PAYER.aa
