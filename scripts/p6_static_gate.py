# -*- coding: utf-8 -*-
# P6 静态门禁自检：色值单源差分 + 暗色残留 + 断头路（方法见交接文档第 9 节）
#
# 两条硬规矩（2026-10-08 补）：
#   ① 路径一律从 __file__ 推 ROOT，不依赖当前工作目录。原写法通篇Path('src')，
#      在别的目录下跑就扫到 0 个文件 → leaks/darks 全空 → 打印「0/0」并以 0 退出，
#      即「什么都没扫到所以通过」。runtime_audit 曾因同类问题整轮失效（见 9-28 审查），
#      这里按同一原则堵死。
#   ② 扫到 0 个源文件即退出码 1：空数据必须 fail，不能 pass。
#   ③ stdout/stderr 显式转 UTF-8，否则中文 Windows 的 GBK 控制台会在打印 ✓ 时抛
#      UnicodeEncodeError，门禁以崩溃收场（结果虽是"红"，但报的是错而不是结论）。
import re
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'src'
if not SRC.is_dir():
    print(f'[p6] 数据源失效：{SRC} 不存在，疑似路径迁移，拒绝报绿', file=sys.stderr)
    sys.exit(1)

# 先数文件再读种子：种子缺失/源目录为空都要给一句人话，而不是抛 traceback。
src_files = list(SRC.rglob('*.jsx')) + list(SRC.rglob('*.js'))
if not src_files:
    print(f'[p6] 在 {SRC} 下扫到 0 个源文件，拒绝报绿', file=sys.stderr)
    sys.exit(1)

SEED = [ROOT / 'src' / 'index.css', ROOT / 'src' / 'theme' / 'persona.js', ROOT / 'src' / 'theme' / 'images.js']
missing_seed = [s for s in SEED if not s.is_file()]
if missing_seed:
    print('[p6] 种子文件缺失，拒绝报绿：' + ', '.join(s.relative_to(ROOT).as_posix() for s in missing_seed), file=sys.stderr)
    sys.exit(1)

ALLOWED_HEX = {'2b2620', '9a4e2c', 'fffdf9', 'ffffff', 'fff', 'fbf8f2', 'ede4d6', '1a2417'}

hexre = re.compile(r'#([0-9a-fA-F]{3,8})\b')
rgbre = re.compile(r'rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*[\),]')

wl_hex, wl_rgb = set(ALLOWED_HEX), set()
for sf in SEED:
    txt = sf.read_text(encoding='utf-8')
    wl_hex |= {m.group(1).lower() for m in hexre.finditer(txt)}
    wl_rgb |= {(int(m.group(1)), int(m.group(2)), int(m.group(3))) for m in rgbre.finditer(txt)}

leaks, darks = [], []
seed_rels = {s.relative_to(ROOT).as_posix() for s in SEED}
for p in src_files:
    rel = p.relative_to(ROOT).as_posix()
    if rel in seed_rels:
        continue
    txt = p.read_text(encoding='utf-8')
    for m in hexre.finditer(txt):
        h = m.group(1).lower()
        if len(h) in (3, 6, 8) and h not in wl_hex:
            leaks.append(f'{rel}: #{h}')
    for m in rgbre.finditer(txt):
        rgb = (int(m.group(1)), int(m.group(2)), int(m.group(3)))
        if rgb in wl_rgb:
            continue
        if max(rgb) < 0x50 and rgb not in {(0, 0, 0), (43, 38, 32)}:
            darks.append(f'{rel}: rgb{rgb}')

print('色值泄露(主题层外新 hex):', len(leaks))
for x in leaks[:12]:
    print('  ', x)
print('暗色残留:', len(darks))
for x in darks[:12]:
    print('  ', x)

pages = ['Home', 'Menu', 'DishDetail', 'Cart', 'MyOrders', 'OrderDetail', 'Profile', 'Admin', 'AdminDishes', 'AdminOrders']
missing = [pg for pg in pages
           if 'PageHeader' not in (ROOT / 'src' / 'pages' / f'{pg}.jsx').read_text(encoding='utf-8')
           and 'AdminShell' not in (ROOT / 'src' / 'pages' / f'{pg}.jsx').read_text(encoding='utf-8')]
print('缺页头/返回的页面:', missing or '无（断头路 0）')
print(f'（已扫 {len(src_files)} 个源文件）')
