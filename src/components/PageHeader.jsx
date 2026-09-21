import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Character from './ui/Character'
import { useTheme } from '../theme/useTheme'

/**
 * 全站统一页头 —— 娃娃机世界的机顶。
 *
 * V3 设计稿换装（2026-09-21）：
 * 1. 最顶一条「羊毛云朵檐」（.wool-edge）—— 娃娃机的羊毛机顶，全站常驻的机器语言；
 *    吸顶时它跟着走，读作"这台机器一直在这儿"，而不是每页各长一顶。
 * 2. 身份徽记由自绘小羊换成**官方角色素材**（Character）：白天懒羊羊值班（doze），
 *    夜宵档换灰太狼（badgeNight）——深夜食堂换了看门的。
 * 3. 返回钮/徽记容器统一糖果描边（2px）。
 * 4. 眉题 + 衬线大标题 + 底部贯通发丝线三件套不变（编辑杂志语言保留）。
 *
 * 注意：本组件的 sticky 依赖「页面包裹层不带 transform」，见 motion.js 的 pageEnter 说明。
 */
export default function PageHeader({ title, eyebrow, subtitle, back = false, backTo, right, onBack }) {
  const navigate = useNavigate()
  const goBack = () => (backTo ? navigate(backTo) : navigate(-1))
  const { isNight } = useTheme()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="sticky top-0 z-40 overflow-hidden"
      style={{
        background:
          'linear-gradient(180deg, var(--scrim-top) 0%, rgba(0,0,0,0) 100%)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}
    >
      {/* 羊毛机顶：云朵下缘朝下卷进页头 */}
      <div className="wool-edge" aria-hidden="true" />

      <div
        className="flex items-center justify-between gap-3 pt-3 pb-4"
        style={{
          paddingLeft: 'var(--space-page-x)',
          paddingRight: 'var(--space-page-x)',
        }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* 身份徽记：官方角色素材坐在鼠尾草浅底上——双人格里的"TA"有正脸了 */}
          <div
            className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center overflow-hidden"
            style={{
              background: 'color-mix(in srgb, var(--sage-30) 45%, var(--surface))',
              border: '2px solid var(--sage-60)',
            }}
          >
            <Character who={isNight ? 'badgeNight' : 'badgeDay'} size={32} />
          </div>

          {back && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={onBack || goBack}
              aria-label="返回"
              className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'var(--color-glass)',
                border: '2px solid var(--color-line)',
                boxShadow: 'var(--shadow-1)',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-bone)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </motion.button>
          )}

          <div className="min-w-0">
            {(eyebrow || subtitle) && (
              <p
                className="text-[11px] font-bold uppercase mb-1 truncate"
                style={{
                  letterSpacing: '0.18em',
                  color: 'var(--color-ash)',
                }}
              >
                {eyebrow || subtitle}
              </p>
            )}
            <h1 className="font-serif text-display font-bold text-[var(--color-bone)] truncate">
              {title}
            </h1>
          </div>
        </div>

        {right && <div className="shrink-0">{right}</div>}
      </div>
      {/* 贯通发丝线：杂志栏目的分隔语言 */}
      <div style={{ borderTop: '1px solid var(--color-glass-border)', margin: '0 var(--space-page-x)' }} />
    </motion.div>
  )
}
