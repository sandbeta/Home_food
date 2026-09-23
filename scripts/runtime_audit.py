#!/usr/bin/env python3
"""运行时 identifier 未定义扫描器 v2（改进正则）"""
import os, re, sys
from pathlib import Path
from collections import defaultdict

ROOT = Path(r'E:/晨光厨房-交付包-qoderwork/extracted')
SRC = ROOT / 'src'

def read(p):
    try: return p.read_text(encoding='utf-8')
    except: return ''

files = []
for ext in ('*.jsx', '*.js'):
    for f in SRC.rglob(ext):
        if any(x in str(f) for x in ('seedMenuExtra', 'seedNightExtra', 'seedRecipes', 'hotRecipes')): continue
        files.append(f)

# ---------- A. 未 import 的 JSX 组件（改进：default+named 混合、注释剥离） ----------
JSX_TAG = re.compile(r'<([A-Z][A-Za-z0-9_]*)[\s/>]')
IMPORT_LINE = re.compile(r"""^import\s+([^;]+?)\s+from\s+['"][^'"]+['"];?\s*$""", re.MULTILINE)
LOCAL_FUNC = re.compile(r"(?:function|const|class)\s+([A-Z][A-Za-z0-9_]*)")

def parse_import_clause(clause):
    """解析 import 子句里的所有 identifier"""
    names = set()
    clause = clause.strip()
    # default, { a, b as c }, * as ns
    parts = re.split(r',\s*(?![^{}]*\})', clause)
    for p in parts:
        p = p.strip()
        if not p: continue
        if p.startswith('{'):
            inner = p[1:-1]
            for q in inner.split(','):
                q = q.strip()
                if not q: continue
                if ' as ' in q: names.add(q.split(' as ')[1].strip())
                else: names.add(q.strip())
        elif p.startswith('*'):
            m = re.search(r'as\s+(\w+)', p)
            if m: names.add(m.group(1))
        elif re.match(r'^[A-Z]', p):
            names.add(p)
    return names

def strip_comments(src):
    # 去 /* */ 与 // 注释（避免注释里的 <Link/> 被当 JSX）
    src = re.sub(r'/\*[\s\S]*?\*/', '', src)
    src = re.sub(r'(?<!:)//[^\n]*', '', src)  # 保留 URL 里的 //
    return src

a_issues = []
for f in files:
    src = read(f)
    src_nc = strip_comments(src)
    if '<' not in src_nc: continue
    known = set()
    for m in IMPORT_LINE.finditer(src_nc):
        known |= parse_import_clause(m.group(1))
    known |= set(LOCAL_FUNC.findall(src_nc))
    known |= {'React', 'Fragment', 'Suspense', 'StrictMode'}
    tags = set(JSX_TAG.findall(src_nc))
    missing = sorted(t for t in tags if t not in known)
    if missing: a_issues.append((str(f.relative_to(ROOT)), missing))

# ---------- B. API 端点 ----------
MOCK = read(SRC / 'lib' / 'mockApi.js')
SERVER = read(ROOT / 'server' / 'index.cjs')
client_endpoints = set()
for f in files:
    src = read(f)
    for m in re.finditer(r"""(?:fetch|requestJson|getJson)\s*\(\s*['"](/api/[^'"]+)['"]""", src):
        path = re.sub(r'/\d+$', '/:id', m.group(1))
        client_endpoints.add(path)
    for m in re.finditer(r"""(?:fetch|requestJson|getJson)\s*\(\s*`(/api/[^`]+)`""", src):
        path = re.sub(r'\$\{[^}]+\}', ':id', m.group(1))
        client_endpoints.add(path)

def server_paths(src):
    out = set()
    for m in re.finditer(r"""pathname === ['"](/api/[^'"]+)['"]""", src): out.add(m.group(1))
    for m in re.finditer(r"""pathname\.match\(\/\^\\?\/api\\?\/(\w+)\\?\/\(""", src): out.add('/api/' + m.group(1) + '/:id')
    for m in re.finditer(r"""pathname\.match\(\/\^\\?\/api\\?\/(\w+)\\?\/\(\.\+\)\\?\$""", src): out.add('/api/' + m.group(1) + '/:id')
    return out
mock_paths = server_paths(MOCK)
srv_paths = server_paths(SERVER)
def covered(p, paths):
    if p in paths: return True
    # /api/dishes?xxx → /api/dishes
    base = p.split('?')[0]
    if base in paths: return True
    # /api/wishes?status=pending 归到 /api/wishes
    for m in paths:
        if m.rstrip('/').endswith(p.split('?')[0].rstrip('/')): return True
    return False
b_mock = sorted(p for p in client_endpoints if not covered(p, mock_paths))
b_srv = sorted(p for p in client_endpoints if not covered(p, srv_paths))

# ---------- C. 路由（改进：剥 query） ----------
APP = read(SRC / 'App.jsx')
routes = set(re.findall(r"""<Route\s+path=['"](/[^'"]+)['"]""", APP))
nav_paths = set()
for f in files:
    src = strip_comments(read(f))
    for m in re.finditer(r"""(?:to|href)=['"](/[^'"$]+)['"]""", src): nav_paths.add(m.group(1).split('?')[0])
    for m in re.finditer(r"""navigate\(\s*['"`](/[^'"`$]+)""", src): nav_paths.add(m.group(1).split('?')[0])
def route_matches(p, routes):
    if p in routes: return True
    for r in routes:
        if ':' in r:
            rp, pp = r.split('/'), p.split('/')
            if len(rp) == len(pp) and all(a == b or a.startswith(':') for a, b in zip(rp, pp)): return True
    return False
c_missing = sorted(p for p in nav_paths if not route_matches(p, routes) and not p.startswith('/api/'))

# ---------- D. CSS 变量 ----------
CSS = read(SRC / 'index.css')
defined = set(re.findall(r'(--[a-z][a-z0-9-]*)\s*:', CSS))
used = defaultdict(list)
for f in files:
    src = read(f)
    for m in re.finditer(r'var\((--[a-z][a-z0-9-]*)', src):
        tok = m.group(1)
        if tok.startswith('--tw-'): continue
        if tok not in defined: used[tok].append(f.name)
d_missing = {k: sorted(set(v)) for k, v in used.items()}

# ---------- E. Icon name（改进：value 是 ( 或 < 或 '） ----------
ICONS = read(SRC / 'components' / 'ui' / 'Icons.jsx')
icon_names = set(re.findall(r'^\s*([a-zA-Z][a-zA-Z0-9]*):\s*[\(\'<`]', ICONS, re.MULTILINE))
used_icons = defaultdict(list)
for f in files:
    src = read(f)
    for m in re.finditer(r"""<Icon\s+name=['"]([a-zA-Z][a-zA-Z0-9]*)['"]""", src):
        if m.group(1) not in icon_names: used_icons[m.group(1)].append(f.name)
e_missing = {k: sorted(set(v)) for k, v in used_icons.items()}

# ---------- F. localStorage key 拼写：同一 key 是否被 read 与 write 都用同一字面 ----------
LS_KEYS = defaultdict(set)
for f in files:
    src = read(f)
    for m in re.finditer(r"""localStorage\.(?:getItem|setItem|removeItem)\(\s*['"]([^'"]+)['"]""", src):
        LS_KEYS[m.group(1)].add(f.name)
# 只报"某 key 只被 getItem 从未 setItem"（可能是拼错，写入用了别的 key）
get_only = []
set_only = []
for k, fs in LS_KEYS.items():
    srcs = [read(ROOT / 'src' / 'x') for _ in []]  # placeholder
    # 简化：不做深入分析，只列出所有 key 供人工核对
    pass

# ---------- 输出 ----------
print('=== A. 未 import 的 JSX 组件 ===')
if not a_issues: print('  ✓ 无')
for f, miss in a_issues: print(f'  ✗ {f}: {miss}')

print('\n=== B. 客户端调用但双端未定义的 API ===')
print(f'  mockApi 缺: {b_mock or "无"}')
print(f'  server 缺:  {b_srv or "无"}')

print('\n=== C. 未挂路由的 Link/navigate ===')
if not c_missing: print('  ✓ 无')
for p in c_missing: print(f'  ✗ {p}')

print('\n=== D. 未定义的 CSS 变量 ===')
if not d_missing: print('  ✓ 无')
for tok, fs in sorted(d_missing.items()): print(f'  ✗ {tok}  in: {fs}')

print('\n=== E. 未定义的 Icon name ===')
print(f'  Icons.jsx 定义: {sorted(icon_names)}')
if not e_missing: print('  ✓ 无')
for name, fs in sorted(e_missing.items()): print(f'  ✗ {name}  in: {fs}')

print('\n=== F. 所有 localStorage key（人工核对） ===')
for k, fs in sorted(LS_KEYS.items()): print(f'  {k}  ({len(fs)} 处)')
