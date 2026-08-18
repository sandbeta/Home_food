import { motion } from 'framer-motion'
import { useState } from 'react'

export default function D3FlipCard({ front, back, className = '' }) {
  const [flipped, setFlipped] = useState(false)

  return (
    <div
      className={`relative cursor-pointer ${className}`}
      style={{ perspective: '1000px' }}
      onClick={() => setFlipped(!flipped)}
    >
      <motion.div
        className="relative w-full preserve-3d"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="absolute inset-0 backface-hidden rounded-3xl overflow-hidden shadow-xl" style={{ backfaceVisibility: 'hidden' }}>
          {front}
        </div>
        <div
          className="absolute inset-0 backface-hidden rounded-3xl overflow-hidden shadow-xl flex items-center justify-center p-6 border border-[var(--color-glass-border)]"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'linear-gradient(135deg, #1E1A15, #0E0C0A)' }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  )
}
