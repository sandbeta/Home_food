import { getJson, requestJson } from './request.js'

const json = (method, body) => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export const api = {
  dishes: {
    all: () => getJson('/api/dishes/all'),
    list: (category = '全部') => getJson(`/api/dishes?category=${encodeURIComponent(category)}`),
    get: (id) => getJson(`/api/dishes/${id}`),
    create: (payload) => getJson('/api/dishes', json('POST', payload)),
    update: (id, payload) => getJson(`/api/dishes/${id}`, json('PUT', payload)),
    remove: (id) => getJson(`/api/dishes/${id}`, { method: 'DELETE' }),
  },
  orders: {
    list: (status) => getJson(status ? `/api/orders?status=${encodeURIComponent(status)}` : '/api/orders'),
    get: (id) => getJson(`/api/orders/${id}`),
    create: (payload) => getJson('/api/orders', json('POST', payload)),
    setStatus: (id, status) => getJson(`/api/orders/${id}/status`, json('PUT', { status })),
  },
  anniversaries: {
    list: () => getJson('/api/anniversaries'),
    create: (payload) => getJson('/api/anniversaries', json('POST', payload)),
    update: (id, payload) => getJson(`/api/anniversaries/${id}`, json('PUT', payload)),
    remove: (id) => getJson(`/api/anniversaries/${id}`, { method: 'DELETE' }),
  },
  wishes: {
    list: (status) => getJson(status ? `/api/wishes?status=${encodeURIComponent(status)}` : '/api/wishes'),
    create: (payload) => getJson('/api/wishes', json('POST', payload)),
    update: (id, payload) => getJson(`/api/wishes/${id}`, json('PUT', payload)),
    remove: (id) => getJson(`/api/wishes/${id}`, { method: 'DELETE' }),
  },
  ratings: {
    list: ({ dishId, limit } = {}) => {
      const q = new URLSearchParams()
      if (dishId != null) q.set('dish_id', dishId)
      if (limit) q.set('limit', limit)
      const s = q.toString()
      return getJson('/api/ratings' + (s ? `?${s}` : ''))
    },
    create: (payload) => getJson('/api/ratings', json('POST', payload)),
  },
  settlement: (month) => getJson('/api/settlements' + (month ? `?month=${encodeURIComponent(month)}` : '')),
  cart: {
    share: (payload) => getJson('/api/cart/share', json('POST', payload)),
    shared: () => getJson('/api/cart/shared'),
  },
}

export async function loginAdmin(password) {
  const res = await requestJson('/api/admin/login', json('POST', { password }))
  return res.json().catch(() => ({}))
}
