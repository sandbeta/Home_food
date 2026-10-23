import { launchChrome, openAndSettle, screenshot, evaluate, closeChrome, sleep } from './cdp.mjs'
const stamp=Date.now(); const port=9840+(stamp%20)
const chrome=await launchChrome(port,`E:/tmp-lamb-cdp/edge${stamp}`)
const {client}=await openAndSettle({port,url:'http://localhost:5180/#/today',wait:2600})
const errors=[]; client.on('Runtime.exceptionThrown',(p)=>errors.push(p?.exceptionDetails?.exception?.description||p?.exceptionDetails?.text))
async function waitFor(sel,timeout=10000){const t=Date.now();while(Date.now()-t<timeout){const n=await evaluate(client,`document.querySelectorAll(${JSON.stringify(sel)}).length`);if(n)return n;await sleep(250)}return 0}
const overflow=async()=>evaluate(client,`({doc:document.documentElement.scrollWidth,win:innerWidth})`)

// 1) 320 + 大字号 + 夜间
await evaluate(client,`localStorage.setItem('lamb_text','lg'); localStorage.setItem('lamb_theme','night')`)
await client.send('Emulation.setDeviceMetricsOverride',{width:320,height:700,deviceScaleFactor:2,mobile:true,screenOrientation:{type:'portraitPrimary',angle:0}})
await evaluate(client,`location.reload()`); await sleep(2800)
await screenshot(client,'E:/tmp-lamb-shots/edge/today-320-lg-night.png')
console.log('320lg today overflow', await overflow())
await evaluate(client,`location.hash='#/menu'`); await sleep(1200)
await screenshot(client,'E:/tmp-lamb-shots/edge/menu-320-lg-night.png')
console.log('320lg menu overflow', await overflow())
await evaluate(client,`location.hash='#/cart'`); await sleep(900)
console.log('320lg cart overflow', await overflow())

// 回到 390 日间标准
await evaluate(client,`localStorage.setItem('lamb_text','md'); localStorage.setItem('lamb_theme','day')`)
await client.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true,screenOrientation:{type:'portraitPrimary',angle:0}})
await evaluate(client,`location.reload()`); await sleep(2600)

// 2) 收藏 → 收藏筛选
await evaluate(client,`location.hash='#/menu'`); await sleep(1200); await waitFor('.dish-row__add')
await evaluate(client,`document.querySelector('.dish-row__main').click()`); await sleep(800)
await evaluate(client,`document.querySelector('[aria-label="收藏"]').click()`); await sleep(400)
await evaluate(client,`document.querySelector('.dish-sheet__close').click()`); await sleep(400)
await evaluate(client,`[...document.querySelectorAll('.seg__item')].find(b=>b.textContent.includes('我的收藏'))?.click()`); await sleep(600)
console.log('favorites rows', await evaluate(client,`document.querySelectorAll('.dish-row').length`))
await screenshot(client,'E:/tmp-lamb-shots/edge/menu-favorites.png')

// 3) 许愿提交
await evaluate(client,`document.querySelector('[aria-label="许个愿"]').click()`); await sleep(500)
await evaluate(client,`(() => { const i = document.querySelector('#wish-name'); const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set; s.call(i,'红烧肉'); i.dispatchEvent(new Event('input',{bubbles:true})); })()`)
await sleep(200)
await evaluate(client,`[...document.querySelectorAll('.dialog__actions .btn')].find(b=>b.textContent.includes('送出去'))?.click()`); await sleep(1000)
await evaluate(client,`location.hash='#/admin/wishes'`); await sleep(1200)
console.log('pending wishes', await evaluate(client,`document.querySelectorAll('.admin-wish').length`))
await screenshot(client,'E:/tmp-lamb-shots/edge/admin-wishes.png')

// 4) 分享购物车 + 合并 TA 的分享
await evaluate(client,`location.hash='#/menu'`); await sleep(1200); await waitFor('.dish-row__add')
await evaluate(client,`document.querySelectorAll('.dish-row__add')[0].click()`); await sleep(500)
await evaluate(client,`location.hash='#/cart'`); await sleep(900)
await evaluate(client,`document.querySelector('[aria-label="分享锅巴给 TA"]').click()`); await sleep(900)
console.log('share toast', await evaluate(client,`document.querySelector('.toast')?.textContent || 'none'`))
await evaluate(client,`fetch('/api/cart/share',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:[{dish_id:7,name:'草莓酸奶杯',price:16,category:'水果',quantity:2,added_by:'partner'}],by:'partner'})}).then(r=>r.json())`)
await evaluate(client,`location.hash='#/menu'`); await sleep(600)
await evaluate(client,`location.hash='#/cart'`); await sleep(1000)
console.log('shared banner', await evaluate(client,`document.querySelector('.cart__shared')?.innerText || 'none'`))
await screenshot(client,'E:/tmp-lamb-shots/edge/cart-shared.png')
await evaluate(client,`document.querySelector('.cart__shared .btn')?.click()`); await sleep(700)
console.log('rows after merge', await evaluate(client,`document.querySelectorAll('.cart-row').length`))

console.log(errors.length?`ERRORS\n${errors.join('\n')}`:'no runtime errors')
await closeChrome(chrome); process.exit(0)
