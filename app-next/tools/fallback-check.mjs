import { launchChrome, openAndSettle, evaluate, screenshot, closeChrome, sleep } from './cdp.mjs'
const stamp=Date.now(); const port=9990+(stamp%10)
const chrome=await launchChrome(port,`E:/tmp-lamb-fb/p${stamp}`)
const { client } = await openAndSettle({ port, url:'http://localhost:5180/#/dish/1', width:390, height:844, dpr:2, wait:3000 })
await sleep(800)
console.log(await evaluate(client, `(() => ({ sheet: document.querySelectorAll('.sheet').length, img: document.querySelectorAll('.dish-sheet__hero img').length, svg: document.querySelectorAll('.dish-sheet__hero svg').length, name: document.querySelector('#dish-sheet-name')?.textContent }))()`))
await screenshot(client,'E:/点餐小程序—抓娃娃机/research/20261023-全部重构/shots-pink/dish-fallback.png')
await closeChrome(chrome); process.exit(0)
