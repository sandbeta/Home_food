import { useEffect, useState } from 'react'
import DishArt from './DishArt.jsx'
import { dishImage } from '../lib/assetUrl.js'

/* 菜品图统一入口：有实拍用实拍，文件缺失或加载失败时退回分类矢量插画。
   旧数据里有 image_url 指向不存在的文件，列表不能因此开天窗。 */
export default function DishThumb({ dish, size = 58, className = '', alt = '', eager = false }) {
  const src = dishImage(dish)
  const [failed, setFailed] = useState(false)

  useEffect(() => { setFailed(false) }, [src])

  if (!src || failed) return <DishArt dish={dish} size={size} className={className} />
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable="false"
      onError={() => setFailed(true)}
    />
  )
}
