# -*- coding: utf-8 -*-
"""
HowToCook（程序员做饭指南，公有领域/Unlicense）→ 晨光厨房种子菜品生成器

用法（需先稀疏克隆菜谱 md 到本地仓库）：
  git clone --depth 1 --filter=blob:none --sparse https://github.com/Anduin2017/HowToCook /tmp/htc
  cd /tmp/htc && git sparse-checkout set --no-cone '/dishes/**/*.md'
  python scripts/build_htc_seed.py --repo /tmp/htc

产出：
  1. src/lib/seedMenuExtra.js   —— 追加菜品数组（供 mockApi.js 合入种子库）
  2. public/dish-images/htc/    —— 每道菜预览图（Pillow 压缩；raw.githubusercontent
     国内不可达、jsDelivr gh 代理最终也跳它，故用 git 协议按需取 blob 后本地落盘）
  3. 控制台分类统计

约定（交接文档第 5.6 节 mockApi 最小改动）：数据放独立文件，mockApi 仅 +2 行接线。
缺失图的菜品由组件层品类 emoji 占位回退。
"""
import argparse
import io
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import unquote

try:
    from PIL import Image
except ImportError:
    print('!! 需要 Pillow：pip install pillow')
    sys.exit(1)

# HowToCook 分类 → 应用分类；MEAT=荤菜按关键词分 家常菜/硬菜
HARD_KEYWORDS = re.compile(r'红烧|炖|焖|卤|扒|肘|羊|牛腩|排骨|大骨|蹄|煲|烤')
CATEGORY_MAP = {
    'meat_dish': ('MEAT', '家常菜'),
    'aquatic': ('PLAIN', '家常菜'),
    'vegetable_dish': ('PLAIN', '素菜'),
    'staple': ('PLAIN', '主食'),
    'breakfast': ('PLAIN', '主食'),
    'soup': ('PLAIN', '汤类'),
    'dessert': ('PLAIN', '小吃'),
    'drink': ('PLAIN', '饮品'),
    'semi-finished': ('PLAIN', '其他'),
    # condiment 调料 / template 模板：非可点菜品，跳过
}
SKIP_DIRS = {'condiment', 'template'}
PRICE_BASE = {'家常菜': 22, '硬菜': 38, '素菜': 13, '主食': 14, '小吃': 13, '汤类': 16, '饮品': 10, '其他': 15}
ID_START = 500  # 避开种子 1-65 与用户后台自建菜的 id 区间

IMG_RE = re.compile(r'!\[[^\]]*\]\((\./[^)]+)\)')
NUMERIC_PREVIEW = re.compile(r'^\d{3}\.(jpg|jpeg|png|webp)$', re.I)


def git_out(repo: Path, *args) -> str:
    # core.quotepath=false：默认会把中文路径转成八进制转义加引号，导致路径匹配失败
    return subprocess.run(['git', '-c', 'core.quotepath=false', *args], cwd=repo,
                          capture_output=True, text=True, encoding='utf-8',
                          errors='replace', timeout=120, check=True).stdout


def git_blob(repo: Path, sha: str, attempts: int = 2) -> bytes | None:
    for _ in range(attempts):
        try:
            return subprocess.run(['git', 'cat-file', 'blob', sha], cwd=repo,
                                  capture_output=True, timeout=45, check=True).stdout
        except Exception:
            continue
    return None


BOILERPLATE = re.compile(r'遵循本指南|发现问题|可以改进|本指南|菜谱是|模板')

def first_sentence(text: str, cap: int = 46) -> str:
    s = text.strip().split('。')[0]
    return s if len(s) <= cap else s[:cap].rsplit('，', 1)[0]


def pick_desc(txt: str) -> str:
    """标题后第一段常是模板免责声明或重复标题，跳过它们取真正介绍菜品的段落。"""
    body = re.sub(r'^#.*\n', '', txt, count=1)
    for para in re.split(r'\n\s*\n', body):
        p = para.strip()
        if not p or p.startswith(('#', '![', '[', '- ', '*', '1.')) or BOILERPLATE.search(p):
            continue
        return first_sentence(p)
    return ''


class RepoImages:
    """目录内文件 → blob sha 映射 + 批量预取缺失 blob（git fetch 按 sha，GitHub 支持）。"""

    def __init__(self, repo: Path):
        self.repo = repo
        self.dir_cache = {}

    def dir_map(self, rel_dir: str) -> dict:
        if rel_dir not in self.dir_cache:
            mapping = {}
            for line in git_out(self.repo, 'ls-tree', f'HEAD:{rel_dir}').splitlines():
                meta, _, path = line.partition('\t')
                _mode, _typ, sha = meta.split()
                mapping[path] = sha
            self.dir_cache[rel_dir] = mapping
        return self.dir_cache[rel_dir]

    def read(self, rel_dir: str, path: str, img_src: Path | None = None) -> bytes | None:
        # 优先用已抢救到本地的文件（--img-src），否则按需走 promisor fetch
        if img_src:
            p = img_src / rel_dir / path
            if p.exists():
                return p.read_bytes()
        sha = self.dir_map(rel_dir).get(path)
        if not sha:
            return None
        return git_blob(self.repo, sha)


def parse_md(md: Path):
    txt = md.read_text(encoding='utf-8')
    m = re.match(r'^#\s+(.+)', txt)
    name = m.group(1).strip().removesuffix('的做法') if m else md.stem
    desc = pick_desc(txt)
    refs = [unquote(m2.group(1))[2:] for m2 in IMG_RE.finditer(txt)]  # 去掉 './'
    return name, desc, refs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--repo', default='/tmp/htc')
    ap.add_argument('--out-js', default='src/lib/seedMenuExtra.js')
    ap.add_argument('--img-dir', default='public/dish-images/htc')
    ap.add_argument('--img-src', default='', help='已有的图片文件目录（如 tarball 抢救产物），优先于 git 取 blob')
    args = ap.parse_args()

    repo, out_js, img_dir = Path(args.repo), Path(args.out_js), Path(args.img_dir)
    img_src = Path(args.img_src) if args.img_src else None
    img_dir.mkdir(parents=True, exist_ok=True)

    app_root = Path(__file__).resolve().parents[1]
    existing = set(re.findall(r"name: '([^']+)'", (app_root / 'src/lib/mockApi.js').read_text(encoding='utf-8')))

    imgs = RepoImages(repo)
    dishes, seen, stats = [], set(), {}
    jobs = []  # (dish_id, rel_dir, path)
    next_id = ID_START

    cat_dirs = sorted(d for d in (repo / 'dishes').iterdir() if d.is_dir() and d.name not in SKIP_DIRS)
    for cat_dir in cat_dirs:
        mode, app_cat = CATEGORY_MAP[cat_dir.name]
        for md in sorted(cat_dir.rglob('*.md')):
            name, desc, refs = parse_md(md)
            if not name or name in seen or name in existing:
                continue
            cat = app_cat
            if mode == 'MEAT' and HARD_KEYWORDS.search(name):
                cat = '硬菜'
            seen.add(name)
            rel_dir = md.parent.relative_to(repo).as_posix()
            dmap = imgs.dir_map(rel_dir)
            chosen = next((r for r in refs if r in dmap), None)
            if chosen is None:  # md 链接失灵时回退目录内编号预览图（000.jpg...）
                numbered = sorted(p for p in dmap if NUMERIC_PREVIEW.match(p))
                chosen = numbered[0] if numbered else None
            dish_id = next_id
            next_id += 1
            price = PRICE_BASE[cat] + (sum(ord(c) for c in name) % 9)
            image_url = ''
            if chosen:
                jobs.append((dish_id, rel_dir, chosen))
            dishes.append({'id': dish_id, 'name': name, 'price': price, 'category': cat,
                           'description': desc, 'available': 1, 'image_url': image_url,
                           '_img': (rel_dir, chosen)})

    print(f'解析 {len(dishes)} 道，需图片 {len(jobs)} 张，逐个按需取 blob（走 github.com 协议）...')

    saved = cached = 0
    for d in dishes:
        rel_dir, chosen = d.pop('_img')
        target = img_dir / f"{d['id']}.jpg"
        if target.exists():  # 幂等：已下载过的图直接复用，不重复走网络
            d['image_url'] = f'/dish-images/htc/{d["id"]}.jpg'
            cached += 1
            continue
        if not chosen:
            continue
        raw = imgs.read(rel_dir, chosen, img_src)
        if not raw:
            continue
        try:
            im = Image.open(io.BytesIO(raw)).convert('RGB')
            if im.width > 560:
                im = im.resize((560, int(im.height * 560 / im.width)))
            im.save(target, 'JPEG', quality=82)
            d['image_url'] = f'/dish-images/htc/{d["id"]}.jpg'
            saved += 1
        except Exception:
            continue

    lines = [
        '// ============================================================',
        '// HowToCook（程序员做饭指南）开源菜谱灌库数据 —— 公有领域/Unlicense，',
        '// 由 scripts/build_htc_seed.py 从仓库 Markdown 自动生成，请勿手改；',
        '// 重新生成：python scripts/build_htc_seed.py --repo <HowToCook 克隆目录>',
        f'// 共 {len(dishes)} 道，其中 {saved} 道带本地预览图（public/dish-images/htc/），',
        '// 其余由组件层品类 emoji 占位回退。',
        '// ============================================================',
        'export const SEED_MENU_EXTRA = [',
    ]
    for d in dishes:
        desc = d['description'].replace("'", '’')
        lines.append(
            f"  {{ id: {d['id']}, name: '{d['name']}', price: {d['price']}, "
            f"category: '{d['category']}', description: '{desc}', available: 1, "
            f"image_url: '{d['image_url']}' }},"
        )
    lines += [']', '']
    out_js.write_text('\n'.join(lines), encoding='utf-8')

    print(f'生成 {len(dishes)} 道 -> {out_js}，其中 {saved + cached} 道带图（缓存复用 {cached}）')
    for cat, n in sorted(stats.items(), key=lambda kv: -kv[1]):
        print(f'  {cat}: {n}')


if __name__ == '__main__':
    main()
