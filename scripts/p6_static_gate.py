# -*- coding: utf-8 -*-
# P6 静态门禁自检：色值单源差分 + 暗色残留 + 断头路（方法见交接文档第 9 节）
import re
from pathlib import Path

SEED = ['src/index.css', 'src/theme/persona.js', 'src/theme/images.js']
ALLOWED_HEX = {'2b2620', '9a4e2c', 'fffdf9', 'ffffff', 'fff', 'fbf8f2', 'ede4d6', '1a2417'}

hexre = re.compile(r'#([0-9a-fA-F]{3,8})\b')
rgbre = re.compile(r'rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*[\),]')

wl_hex, wl_rgb = set(ALLOWED_HEX), set()
for sf in SEED:
    txt = Path(sf).read_text(encoding='utf-8')
    wl_hex |= {m.group(1).lower() for m in hexre.finditer(txt)}
    wl_rgb |= {(int(m.group(1)), int(m.group(2)), int(m.group(3))) for m in rgbre.finditer(txt)}

leaks, darks = [], []
for p in list(Path('src').rglob('*.jsx')) + list(Path('src').rglob('*.js')):
    rel = p.as_posix()
    if rel in SEED:
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
           if 'PageHeader' not in Path(f'src/pages/{pg}.jsx').read_text(encoding='utf-8')
           and 'AdminShell' not in Path(f'src/pages/{pg}.jsx').read_text(encoding='utf-8')]
print('缺页头/返回的页面:', missing or '无（断头路 0）')
