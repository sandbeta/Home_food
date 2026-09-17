import { motion } from 'framer-motion'

export default function D3StatusRing({ config }) {
  return (
    <div
      className="relative mx-auto"
      style={{ width: 'var(--ring-size)', height: 'var(--ring-size)', perspective: '800px' }}
    >
      <div className="absolute inset-0 rounded-full" style={{
        background: `radial-gradient(circle, ${config.ring[1]}30, transparent 70%)`,
        transform: 'translateZ(-20px)'
      }} />
      <motion.div className="absolute inset-[-8px] rounded-full border-2 border-dashed opacity-30" style={{ borderColor: config.ring[1] }}
        animate={{ rotateZ: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }} />
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="60" fill="none" stroke={config.ring[0]} strokeWidth="8" opacity="0.3" />
        <motion.circle cx="70" cy="70" r="60" fill="none" stroke={config.ring[1]} strokeWidth="8"
          strokeLinecap="round" strokeDasharray="377"
          initial={{ strokeDashoffset: 377 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }} />
      </svg>
      <motion.div className="absolute inset-4 rounded-full flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${config.ring[0]}90, ${config.ring[1]}50)`,
          boxShadow: 'inset 0 2px 8px rgba(255,255,255,0.28), 0 6px 18px rgba(0,0,0,0.5)'
        }}
        initial={{ rotateX: 30, translateZ: -10 }}
        animate={{ rotateX: 0, translateZ: 10 }}
        transition={{ delay: 0.3, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.span className="text-5xl"
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26, delay: 0.4 }}
          style={{ transform: 'translateZ(8px)' }}>
          {config.emoji}
        </motion.span>
      </motion.div>
    </div>
  )
}
