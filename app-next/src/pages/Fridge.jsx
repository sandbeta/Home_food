import { useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import Icon from '../components/Icon.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { readFridge, upsertItem, removeItem, adjustQty } from '../lib/fridge.js'
import { useToast } from '../state/ToastContext.jsx'

const PRESETS = ['鸡蛋', '葱', '姜', '蒜', '牛奶', '面条', '番茄', '土豆']

export default function Fridge() {
  const toast = useToast()
  const [map, setMap] = useState(() => readFridge())
  const [name, setName] = useState('')
  const [qty, setQty] = useState('1')
  const [unit, setUnit] = useState('')

  const list = useMemo(() => Object.entries(map)
    .map(([key, v]) => ({ name: key, ...v }))
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''))), [map])

  const add = (n = name, q = qty, u = unit) => {
    const key = String(n || '').trim()
    if (!key) return
    const next = upsertItem(key, { qty: Math.max(0, Number(q) || 1), unit: String(u || '').trim() })
    setMap({ ...next })
    if (n === name) { setName(''); setQty('1'); setUnit('') }
    toast(`${key} 放好了`)
  }

  const bump = (key, delta) => {
    setMap({ ...adjustQty(key, delta) })
  }

  const drop = (key) => {
    setMap({ ...removeItem(key) })
    toast(`拿掉了 ${key}`)
  }

  return (
    <>
      <PageHeader title="冰箱" sub={list.length ? `${list.length} 样 · 家里有底` : '记一下家里有什么'} back />
      <div className="page fridge-page">
        <section className="card card--pad">
          <p className="t-micro">放点什么进来</p>
          <div className="fridge-add">
            <div className="field grow">
              <input
                className="field__input"
                value={name}
                maxLength={16}
                placeholder="鸡蛋、番茄、半盒牛奶…"
                aria-label="食材名"
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') add() }}
              />
            </div>
            <div className="field fridge-add__qty">
              <input
                className="field__input"
                value={qty}
                inputMode="numeric"
                aria-label="数量"
                onChange={(e) => setQty(e.target.value.replace(/[^\d]/g, ''))}
              />
            </div>
            <div className="field fridge-add__unit">
              <input
                className="field__input"
                value={unit}
                maxLength={4}
                placeholder="个"
                aria-label="单位"
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
            <button type="button" className="btn btn--honey fridge-add__btn" onClick={() => add()} disabled={!name.trim()}>
              <Icon name="plus" size={18} /> 放进去
            </button>
          </div>
          <div className="fridge-presets scroll-x">
            {PRESETS.map((p) => (
              <button key={p} type="button" className="chip chip--field" onClick={() => add(p, 1, '')}>
                + {p}
              </button>
            ))}
          </div>
        </section>

        {!list.length ? (
          <EmptyState
            pose="mate"
            title="冰箱空着"
            note="先记几样常备的，下次点菜心里有数。"
          />
        ) : (
          <section className="card card--pad fridge-list">
            {list.map((it) => (
              <div key={it.name} className="fridge-row">
                <span className="fridge-row__name grow">{it.name}</span>
                <span className="fridge-row__qty t-num">{it.qty}</span>
                <span className="fridge-row__unit">{it.unit || '份'}</span>
                <button type="button" className="icon-btn icon-btn--field" aria-label={`${it.name} 少一样`} onClick={() => bump(it.name, -1)}>
                  <Icon name="minus" size={16} />
                </button>
                <button type="button" className="icon-btn icon-btn--field" aria-label={`${it.name} 多一样`} onClick={() => bump(it.name, 1)}>
                  <Icon name="plus" size={16} />
                </button>
                <button type="button" className="icon-btn" aria-label={`拿掉 ${it.name}`} onClick={() => drop(it.name)}>
                  <Icon name="trash" size={17} />
                </button>
              </div>
            ))}
          </section>
        )}

        <p className="t-micro fridge-note">冰箱只记在这台设备上，换设备不会同步。</p>
      </div>
    </>
  )
}
