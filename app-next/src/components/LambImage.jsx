import { useState } from 'react'
import { assetUrl } from '../lib/assetUrl.js'

const POSES = new Set(['sleep', 'pray', 'play', 'bath', 'busy', 'steal', 'footer', 'avatar', 'mate'])

export function LambImage({ pose = 'sleep', alt = '', className = '', eager = false, ...rest }) {
  const [failed, setFailed] = useState(false)
  const src = assetUrl(`/lamb/${POSES.has(pose) ? pose : 'sleep'}.webp`)
  if (failed) {
    return <span className={`lamb-fallback ${className}`} aria-hidden="true" />
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable="false"
      onError={() => setFailed(true)}
      {...rest}
    />
  )
}

export function Avatar({ className = '' }) {
  return (
    <span className={`avatar ${className}`}>
      <LambImage pose="avatar" alt="懒懒" eager />
    </span>
  )
}
