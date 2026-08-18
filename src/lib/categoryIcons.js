// Category icon mapping - emojis for category badges
export const CATEGORY_ICONS = {
  '家常菜': '🍳',
  '硬菜': '🥩',
  '素菜': '🥬',
  '主食': '🍚',
  '小吃': '🥟',
  '水果': '🍎',
  '饮品': '🥤',
  '汤类': '🍲',
  '川菜': '🌶️',
  '粤菜': '🦐',
  '湘菜': '🌶️',
  '鲁菜': '🍖',
  '苏菜': '🦀',
  '浙菜': '🐟',
  '闽菜': '🍜',
  '徽菜': '🍄',
  '东北菜': '🥟',
  '西北菜': '🍜',
  '云贵菜': '🍲',
  '其他': '🍽️',
}

// Get emoji icon for category badges
export function getCategoryEmoji(category) {
  return CATEGORY_ICONS[category] || '🍽️'
}

// Get the display image for a dish card
// If dish has image_url, use it; otherwise return null (fallback to emoji)
export function getDishImage(dish) {
  if (!dish) return null
  if (dish.image_url) return dish.image_url
  return null
}
