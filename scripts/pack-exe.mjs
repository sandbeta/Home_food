// ============================================================
// 一键打包「晨光厨房服务端.exe」（Node SEA）
// 用法：npm run pack:exe（需本机已有 Node ≥20.12；实测 v24）
// 产物：server/晨光厨房服务端.exe（内嵌服务端代码；dist/ 与 data/ 留在原地）
//
// 步骤：1) 生成 SEA blob  2) 复制本机 node.exe  3) postject 注入  4) 清理中间物
// 注意：注入会破坏 Node 官方签名（ Defender 可能弹窗拦截，属已知现象，
//       被拦时选择"允许"或给项目目录加排除项即可）。
// ============================================================
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const EXE = path.join(ROOT, 'server', '晨光厨房服务端.exe')
const run = (cmd) => { console.log('>', cmd); execSync(cmd, { cwd: ROOT, stdio: 'inherit' }) }

// 1) blob
run('node --experimental-sea-config server/sea-config.json')

// 2) 复制 node.exe
const nodeExe = process.execPath
fs.copyFileSync(nodeExe, EXE)
console.log(`> copy ${nodeExe} -> ${EXE} (${(fs.statSync(EXE).size / 1048576).toFixed(0)}MB)`)

// 3) 注入
try {
  run('npx --yes postject "server/晨光厨房服务端.exe" NODE_SEA_BLOB sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2')
} finally {
  // 4) 清理中间物（注入失败也别留 blob 在仓库里）
  fs.rmSync(path.join(ROOT, 'sea-prep.blob'), { force: true })
}
console.log('\n完成：双击 server/晨光厨房服务端.exe 即可启动家庭服务端。')
console.log('分发时把整个 extracted 文件夹拷走即可（exe 需与 dist/ 和 server/data/ 同项目）。')
