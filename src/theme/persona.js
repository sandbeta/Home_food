// 晨光厨房 · 双人格语义唯一真源（我=赤陶暖 / TA=鼠尾草绿冷）
export const PERSONA = {
  me: {
    key: 'me', label: '我', emoji: '🐱',
    color: '#EC8A60', colorSoft: '#F99E78',
    gradient: 'linear-gradient(180deg, #EC8A60 0%, #B55B35 100%)',
    glassBorder: 'rgba(236,138,96,0.45)',
    glow: '0 0 0 3px rgba(236,138,96,0.18), 0 6px 20px rgba(236,138,96,0.22)',
    chipBg: 'rgba(236,138,96,0.14)', chipColor: '#C8683F',
  },
  partner: {
    key: 'partner', label: 'TA', emoji: '🐰',
    color: '#A4C39E', colorSoft: '#BBD3B5',
    gradient: 'linear-gradient(180deg, #A4C39E 0%, #6E9269 100%)',
    glassBorder: 'rgba(164,195,158,0.45)',
    glow: '0 0 0 3px rgba(164,195,158,0.18), 0 6px 20px rgba(164,195,158,0.22)',
    chipBg: 'rgba(164,195,158,0.14)', chipColor: '#7FA37A',
  },
}
export const ORDER_STATUS = {
  pending:   { text: '等着呢', emoji: '⏳', ring: ['#9A9082', '#9A9082'],
               chipBg: 'rgba(154,144,130,0.16)', chipColor: '#6B6155' },
  preparing: { text: '在做了', emoji: '👨‍🍳', ring: ['#EC8A60', '#F99E78'],
               chipBg: 'rgba(236,138,96,0.14)', chipColor: '#C8683F' },
  completed: { text: '做好啦', emoji: '🎉', ring: ['#A4C39E', '#BBD3B5'],
               chipBg: 'rgba(164,195,158,0.16)', chipColor: '#7FA37A' },
}
export const PAYER = {
  aa:       { label: 'AA',   emoji: '✌️', border: 'rgba(181,121,63,0.5)',  glow: '0 0 0 2px rgba(181,121,63,0.12)', fill: '#96612E' },
  me:       { label: '我请', emoji: '🙋', border: 'rgba(236,138,96,0.6)',  glow: '0 0 0 3px rgba(236,138,96,0.20)', fill: '#C8683F' },
  partner:  { label: 'TA请', emoji: '💝', border: 'rgba(164,195,158,0.6)', glow: '0 0 0 3px rgba(164,195,158,0.20)', fill: '#7FA37A' },
}
export const personaOf = (k) => PERSONA[k] || PERSONA.me
export const orderStatusOf = (k) => ORDER_STATUS[k] || ORDER_STATUS.pending
export const payerOf = (k) => PAYER[k] || PAYER.aa
