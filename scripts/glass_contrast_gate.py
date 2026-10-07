#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
glass_contrast_gate.py —— 操作层真玻璃的双态对比度门禁（2026-09-27）

为什么要有这个脚本：
  玻璃 = 半透明底 + 透过来的任意内容。白天那批 .glass 之所以是「假玻璃」，
  正因为 tint 是不透明实色，对比度反而稳；一旦真的给 tint 加 alpha，
  文字下面就成了照片/卡片/夜纸，**对比度从「恒定」变成「随内容波动」**。
  本脚本把这个波动收成上下界：对每个操作层表面，拿最坏的几种底色去量。

它做什么：
  1. 从 src/index.css 解析 @theme static 的白天令牌，再叠加 [data-theme="night"] 的覆盖，
     解出 --glass-tint-* 在 day / night 两态的真实 RGB + alpha。
  2. 对每个表面，把 tint 依次合成到「可能的最坏背景」上：
     纸面四档 + 照片极端（近黑 / 近白），并额外合成一遍 saturate() 之后的版本
     （玻璃会提透过色的饱和度，亮度会跟着漂，只量原色会低估风险）。
  3. 用量 WCAG 2 相对亮度对比该表面实际在用的前景色，取全部组合的**最小值**。
  4. 正文 < 4.5:1、大字/图形 < 3:1 即判红并以非零码退出。

它不做什么（边界要说清）：
  · 不模拟 blur 的空间效应——模糊只降低局部方差，不改变平均亮度，对对比度中性偏保守。
  · 不管 --radius / 热区尺寸 / 动效；那些另有门禁。
  · 只覆盖它自己声明的那几个表面。新表面要在 SURFACES 里登记，否则等于没测。

用法：
  python scripts/glass_contrast_gate.py          # 跑门禁
  python scripts/glass_contrast_gate.py -v       # 打印每个表面的最坏组合明细
"""
import os
import re
import sys
import argparse

# Windows 控制台默认 GBK，中文报告会糊成乱码——门禁的输出也得能读
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

CSS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "src", "index.css")
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

# ---------------------------------------------------------------- 颜色工具
def hex_to_rgb(s):
    s = s.strip()
    if s.startswith("#"):
        s = s[1:]
        if len(s) == 3:
            s = "".join(c * 2 for c in s)
        return tuple(int(s[i:i + 2], 16) for i in (0, 2, 4)), 1.0
    m = re.match(r"rgba?\(([^)]+)\)", s)
    if m:
        p = [x.strip() for x in m.group(1).split(",")]
        return (float(p[0]), float(p[1]), float(p[2])), (float(p[3]) if len(p) > 3 else 1.0)
    if s == "transparent":
        return (0.0, 0.0, 0.0), 0.0
    raise ValueError("无法解析颜色: %r" % s)


def rel_lum(rgb):
    def ch(c):
        c /= 255.0
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = rgb
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)


def contrast(fg_rgb, bg_rgb):
    a, b = rel_lum(fg_rgb), rel_lum(bg_rgb)
    hi, lo = max(a, b), min(a, b)
    return (hi + 0.05) / (lo + 0.05)


def over(src_rgb, src_a, dst_rgb):
    """src 半透明压在 dst（不透明）上，返回合成后的 RGB。"""
    return tuple(src_a * s + (1 - src_a) * d for s, d in zip(src_rgb, dst_rgb))


def saturate(rgb, factor):
    """近似 CSS filter: saturate()——把各通道从亮度轴上推开 factor 倍。"""
    lum = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
    return tuple(max(0.0, min(255.0, lum + (c - lum) * factor)) for c in rgb)


# ---------------------------------------------------------------- 令牌解析
def strip_comments(text):
    """去掉 /* */ 注释。必须在校验前做：注释里写的示例值（例如
    「实测曾把药丸底算成 --glass-tint-panel:#fadce9e8」）会被声明正则当成真令牌抓走，
    导致门禁算出一个不存在的颜色 —— 这是实测踩过的坑，别去掉这一步。"""
    return re.sub(r"/\*.*?\*/", "", text, flags=re.S)


def parse_tokens(css_text):
    """返回 (day_tokens, night_overrides)，值都是原始字符串。"""
    css_text = strip_comments(css_text)
    m = re.search(r"@theme static\s*\{(.*?)\n\}", css_text, re.S)
    day = {}
    if m:
        for name, val in re.findall(r"(--[a-z0-9-]+)\s*:\s*([^;]+);", m.group(1)):
            day.setdefault(name, val.strip())
    # 兼容：@theme（非 static）块里的令牌也一并收，后者不覆盖前者
    m2 = re.search(r"\n@theme\s*\{(.*?)\n\}", css_text, re.S)
    if m2:
        for name, val in re.findall(r"(--[a-z0-9-]+)\s*:\s*([^;]+);", m2.group(1)):
            day.setdefault(name, val.strip())
    night = {}
    m3 = re.search(r'\[data-theme="night"\]\s*\{(.*?)\n\}', css_text, re.S)
    if m3:
        for name, val in re.findall(r"(--[a-z0-9-]+)\s*:\s*([^;]+);", m3.group(1)):
            night[name] = val.strip()
    return day, night


def night_trace(name, day, night, seen=None):
    """这个令牌在夜宵态到底会不会变？返回它被覆盖的路径（空=没覆盖）。

    直接覆盖算；**晚绑定的间接覆盖也算** —— --glass-rim-hi 现在是
    `inset 0 1.5px 0 var(--glass-rim-color)`，夜宵只覆盖颜色那一层就够了。
    硬要求它自己也写一份覆盖，等于逼 CSS 把同一个值写两处（正是 US-002
    特意拆掉的双真值）。所以这里顺着 var() 往下找，并把链路报出来供人复核。
    """
    seen = seen or set()
    if name in seen:
        return []
    seen.add(name)
    if name in night:
        return [name]
    for ref in re.findall(r"var\((--[a-z0-9-]+)", day.get(name, "")):
        sub = night_trace(ref, day, night, seen)
        if sub:
            return ["%s→%s" % (name, sub[0])]
    return []


def resolve(expr, tokens, depth=0):
    """把 var()/color-mix()/hex 表达式解析成 (rgb, alpha)。"""
    if depth > 12:
        raise ValueError("令牌嵌套过深")
    expr = expr.strip()
    # 裸令牌名（测试脚本里直接传 '--color-ash' 这种）
    if re.match(r"^--[a-z0-9-]+$", expr):
        if expr not in tokens:
            raise KeyError("未定义令牌 %s" % expr)
        return resolve(tokens[expr], tokens, depth + 1)
    m = re.match(r"^var\((--[a-z0-9-]+)(?:\s*,\s*(.+))?\)$", expr)
    if m:
        name, fallback = m.group(1), m.group(2)
        if name in tokens:
            return resolve(tokens[name], tokens, depth + 1)
        if fallback:
            return resolve(fallback, tokens, depth + 1)
        raise KeyError("未定义令牌 %s（来自 %s）" % (name, expr))
    m = re.match(r"^color-mix\(in srgb,(.*),\s*(.*)\)$", expr, re.S)
    if m:
        a_raw, b_raw = m.group(1).strip(), m.group(2).strip()
        def split_pct(x):
            mm = re.match(r"^(\d+(?:\.\d+)?)%\s+(.+)$", x) or re.match(r"^(.+?)\s+(\d+(?:\.\d+)?)%$", x)
            if mm:
                first, second = mm.group(1), mm.group(2)
                if first.endswith("%"):
                    return float(first[:-1]), second
                return float(second), first
            return None, x
        pa, va = split_pct(a_raw)
        pb, vb = split_pct(b_raw)
        if pa is None and pb is None:
            raise ValueError("color-mix 缺百分比: %s" % expr)
        if pa is None:
            pa, va, pb, vb = 100 - pb, vb, pb, a_raw
        if pb is None:
            pb = 100 - pa
        ca, aa = resolve(va, tokens, depth + 1) if va != "transparent" else ((0, 0, 0), 0.0)
        cb, ab = resolve(vb, tokens, depth + 1) if vb != "transparent" else ((0, 0, 0), 0.0)
        fa, fb = pa / 100.0, pb / 100.0
        # 预乘混合（CSS color-mix 语义），transparent 视作 alpha=0
        w = fa * aa + fb * ab
        rgb = tuple((fa * aa * ca[i] + fb * ab * cb[i]) / w if w else 0.0 for i in range(3))
        return rgb, w  # 预乘混合后的 alpha
    if expr.startswith("linear-gradient") or expr.startswith("radial-gradient"):
        raise ValueError("渐变不能当单一颜色解析: %s" % expr)
    return hex_to_rgb(expr)


def token_rgb_alpha(name, tokens):
    return resolve(tokens[name], tokens)


# ---------------------------------------------------------------- 被测表面
# 最坏背景包络：纸面四档 + 照片极端（近黑 / 近白）。玻璃后面可能是任意菜品照片。
BACKDROPS = {
    "day": [
        ("纸面 ink-900", "--color-ink-900"),
        ("纸面 ink-850", "--color-ink-850"),
        ("纸面 ink-800", "--color-ink-800"),
        ("卡面 surface", "--surface"),
        ("照片·近黑", "#1A1418"),
        ("照片·近白", "#FFFFFF"),
    ],
    "night": [
        ("夜纸 ink-900", "--color-ink-900"),
        ("夜纸 ink-850", "--color-ink-850"),
        ("夜纸 ink-800", "--color-ink-800"),
        ("夜卡面 surface", "--surface"),
        ("照片·近黑", "#0B0809"),
        ("照片·近白", "#FFFFFF"),
    ],
}

# 每个表面的「真实背后是什么」必须分开登记 —— 第一版对所有表面统一套用照片极端包络，
# 结果把 alpha 一路推到 0.87 换对比度，做出了用户实测反馈「一点毛玻璃都没有」的白纸。
# 分开建模才是真的：抽屉关闭键坐在 d3-card-face 的**不透明卡面**上，照片到不了它背后。
PAPER = ["纸面 ink-900", "纸面 ink-850", "纸面 ink-800", "卡面 surface",
         "夜纸 ink-900", "夜纸 ink-850", "夜纸 ink-800", "夜卡面 surface"]
PHOTO = ["照片·近黑", "照片·近白"]

# 表面 → (tint 令牌, 该表面上实际在用的前景色, 门槛)
# 前景色只登记「真的压在这个表面上」的文字/图标色，避免虚报。
# 阈值口径分两档（WCAG 2.2）：正文 1.4.3 → 4.5:1；图形对象/UI 组件 1.4.11 → 3:1。
#   kind="text" → 4.5；kind="icon" → 3.0（图标笔画细，另建议留 0.5 的余量，脚本会提示）
ICON_FLOOR, TEXT_FLOOR = 3.0, 4.5
ICON_MARGIN = 0.5  # 图标建议余量：1.5px~2px 描边在照片上比纯色块更难读

SURFACES = [
    {
        "id": "panel",
        "name": "停靠药丸导航 / 吸顶栏",
        "tint": "--glass-tint-panel",
        # FloatingPillNav：图标 22px、未激活态用 ash；标签只作 aria-label，不渲染成文字
        # 药丸是 fixed 层，滚动时菜品照片确实会从它下面穿过 → 照片极端必须算进来
        "beds": PAPER + PHOTO,
        # 第 5 项 halo：该前景是否被 .glass-halo 光晕包住（FloatingPillNav 未激活图标）
        "fg": [("ash（未激活图标）", "--color-ash", "icon", None, True)],
        "needs_saturate": "--glass-sat",
        "needs_bright": "--glass-bright",
    },
    {
        "id": "ctl",
        "name": "抽屉/表单上的玻璃关闭键",
        "tint": "--glass-tint-ctl",
        # 背后是抽屉自己的不透明卡面（d3-card-face）/ 吸顶栏 88% 纸面遮罩 → 照片到不了
        # 若哪天把抽屉本体也改成半透明，这里要连 PHOTO 一起加回来
        "beds": PAPER,
        # 逐一登记真实压在 ctl 上的前景色（改这些组件时必须同步这里）。
        # 第 4 项是「这条组合出现在哪些态」——ThemeToggle 白天用 clay、夜宵用 love，
        # 把它们都当成两态共有会虚报（love 在浅玻璃上必然不过，但白天压根不出现）。
        "fg": [
            ("ash（关闭键图标）", "--color-ash", "icon", None, False),
            ("love（夜宵主题图标）", "--color-love", "icon", ("night",), True),
            ("clay（白天主题图标）", "--color-clay", "icon", ("day",), True),
        ],
        "needs_saturate": "--glass-sat",
        "needs_bright": "--glass-bright",
    },
    {
        # 故意不透的一层：照片上的收藏心形。love 在浅底天花板 3.43:1，
        # 只能靠实底盘托住语义色，见 index.css .ctl-plate 的注释。
        "id": "plate",
        "name": "照片上的实心盘（非玻璃）",
        "tint": "--ctl-plate-bed",
        "opaque": True,
        "fg": [
            ("love（已收藏心形）", "--color-love", "icon", None, False),
            ("mist（未收藏心形）", "--color-mist", "icon", None, False),
        ],
        "needs_saturate": "--glass-sat",
        "needs_bright": "--glass-bright",
    },
]


# ---------------------------------------------------------------- 检查 4：WebGL 层与 CSS 层同源
# 为什么单独立一道闸（US-004/005 的回归防线）：
#   两条链路（CSS .glass-op / WebGL LiquidGlass）叠在同一块表面上，观感必须一致，
#   否则 WebGL 接管的那一瞬间会跳。跳的原因几乎总是**同一个光学量被写了两份**：
#   实测踩过的三起 ——
#     · .glass-op--sticky 写死 blur(14px)，shader 读 --glass-blur-panel(9px) → 吸顶栏压照片时差 0.087；
#     · JS 自己正则抓 color-mix 的通道，Chrome 序列化后是 0–1 浮点 → 白纱读成黑纱，白天玻璃凭空压暗 22%；
#     · rim alpha 写死 0.9，而白天令牌 0.95 / 夜宵 0.55 → 夜宵高光线比 CSS 那层亮一档。
#   这三起都不是「算错」，是「值有两个真源」。所以这里不重算颜色，只做一件事：
#   **禁止绕过 CSS 令牌的第三种写法出现**。令牌是 index.css 里的唯一真源（§3 架构约定）。
GL_FILES = {
    "src/components/LiquidGlass.jsx": os.path.join(ROOT, "src", "components", "LiquidGlass.jsx"),
    "src/lib/liquidGlassShader.js": os.path.join(ROOT, "src", "lib", "liquidGlassShader.js"),
}

# readGlassParams 里「令牌读不到时」的兜底值。允许它们存在（真删了，令牌一旦丢名字
# 玻璃会静默读成 0/透明，比写死更难查），但**必须逐条登记在这里**：
# 新增一处没登记的兜底色 = 有人开始写第二份真值，判红。
FALLBACK_COLORS = {
    "src/components/LiquidGlass.jsx": [
        (255, 249, 252, 0.22),   # --glass-tint-panel 缺失时
        (255, 249, 252, 0.95),   # --glass-rim-color 缺失时
    ],
}

# 喂给 shader 的光学 uniform：实参必须来自 readGlassParams() 的 p（即 CSS 令牌）。
# uFlat 是开关不是光学量，几何/纹理索引 uniform 天然只能是数字，都不在此列。
OPTICAL_UNIFORMS = {"uLens", "uCA", "uSat", "uTint", "uRimHi", "uRimW",
                    "uFrost", "uSpec", "uRadius"}

HEXRE = re.compile(r"#[0-9a-fA-F]{3,8}\b")
RGBRE = re.compile(r"\brgba?\s*\(")
# [r, g, b] / [r, g, b, a] 形式的兜底色（0–255 三元组，a 可选）
ARRRE = re.compile(r"\[\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(0?\.\d+|1(?:\.0+)?)\s*)?\]")
UNIFORMRE = re.compile(r"gl\.uniform(?:[124][fi]|1fv)\s*\(\s*U\.(\w+)\s*,([^\n]*)")
# .glass-op* 规则里必须走 var() 的函数
BACKDROP_FN = re.compile(r"\b(blur|saturate|brightness)\s*\(\s*([^)]*)\)")


def strip_js_comments(text):
    """去掉块注释与行注释 —— 注释里引用的示例色值/令牌会被当成真代码抓走，
    这个坑本脚本在 CSS 侧已经踩过一次（见 strip_comments 的说明）。"""
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    text = re.sub(r"(?m)^\s*//.*$", "", text)
    return re.sub(r"(?<![:'/])//[^'\"\n]*$", "", text, flags=re.M)


def check_homology():
    """返回违规列表（空 = 通过）。只判「有没有绕过令牌的新写法」，不重算颜色。"""
    bad = []

    # ---- 4a. GL 两个文件里不许出现字面色值 ----
    for rel, path in GL_FILES.items():
        if not os.path.exists(path):
            bad.append(("GL 同源", rel, "文件不见了（架构约定里的文件被移走/改名）"))
            continue
        txt = open(path, encoding="utf-8").read()
        code = strip_js_comments(txt)
        # #version 300 es 里的 # 会被 HEXRE 误抓，先摘掉 GLSL 预处理指令
        code = re.sub(r"#\s*version[^\n]*", "", code)
        for m in HEXRE.finditer(code):
            bad.append(("GL 同源", rel, "字面 hex 色值 %s（颜色只能来自 index.css 令牌）" % m.group(0)))
        for m in RGBRE.finditer(code):
            bad.append(("GL 同源", rel, "字面 rgb()/rgba() 色值（颜色只能来自 index.css 令牌）"))
        allowed = list(FALLBACK_COLORS.get(rel, []))
        for m in ARRRE.finditer(code):
            rgb = tuple(int(m.group(i)) for i in (1, 2, 3))
            a = float(m.group(4)) if m.group(4) else 1.0
            quad = rgb + (a,)
            if quad in allowed:
                allowed.remove(quad)          # 一条兜底只许用一次，防复制扩散
                continue
            if any(c > 200 for c in rgb) or a < 1.0:
                bad.append(("GL 同源", rel,
                            "未登记的兜底色 %s（要留兜底就同步登记进 FALLBACK_COLORS 并写清对应令牌）"
                            % (m.group(0),)))

    # ---- 4b. 光学 uniform 的实参必须来自 p（readGlassParams） ----
    js_path = GL_FILES["src/components/LiquidGlass.jsx"]
    if os.path.exists(js_path):
        code = strip_js_comments(open(js_path, encoding="utf-8").read())
        for name, args in UNIFORMRE.findall(code):
            if name not in OPTICAL_UNIFORMS:
                continue
            args = args.rstrip(" )")
            probe = args
            if name == "uRadius":
                # 显式 prop 覆盖是合法入参，兜底仍回落令牌
                probe = re.sub(r"radius\s*!=\s*null\s*\?\s*radius\s*:\s*p\.\w+", "p.radius", probe)
            # p.tint[0] 的通道索引与 /255 归一化分母不是「第二份真值」，摘掉再查数字
            probe = re.sub(r"p\.\w+(\s*\[\s*\d+\s*\])?", "", probe)
            probe = re.sub(r"\b255\b", "", probe)
            if re.search(r"\d", probe):
                bad.append(("GL 同源", "LiquidGlass.jsx",
                            "uniform %s 的实参 %r 含硬编码数字 —— 光学参数只能读 CSS 令牌，"
                            "否则与 .glass-op 降级层不同源" % (name, args.strip())))
            if not re.search(r"p\.\w", args):
                bad.append(("GL 同源", "LiquidGlass.jsx",
                            "uniform %s 的实参 %r 没有走 readGlassParams()" % (name, args.strip())))

    # ---- 4c. .glass-op* 四条规则的模糊/饱和/亮度必须走 var() ----
    css_text = strip_comments(open(CSS, encoding="utf-8").read())
    for m in re.finditer(r"(\.glass-op[a-z-]*)\s*\{([^}]*)\}", css_text):
        sel, body = m.group(1), m.group(2)
        for decl in re.finditer(r"(?:webkit-)?backdrop-filter\s*:\s*([^;]+)", body):
            for fn, arg in BACKDROP_FN.findall(decl.group(1)):
                if "var(" in arg:
                    continue
                bad.append(("GL 同源", sel,
                            "%s(%s) 写死字面值 —— shader 读的是 --glass-* 令牌，"
                            "这里必须用 var() 引同一份（历史踩坑：sticky 写死 blur(14px) vs 面板 9px）"
                            % (fn, arg.strip())))
        if sel in (".glass-op", ".glass-op--ctl", ".glass-op--scrim"):
            bg = re.search(r"(?:^|;)\s*background\s*:\s*([^;]+)", body)
            if bg and "var(" not in bg.group(1) and "color-mix" in bg.group(1):
                bad.append(("GL 同源", sel, "background 未走令牌: %s" % bg.group(1).strip()))

    # ---- 4d. 令牌必须在两侧都被消费（有一侧独享 = 迟早漂移） ----
    js_src = open(js_path, encoding="utf-8").read() if os.path.exists(js_path) else ""
    # CSS 侧的「消费」允许走令牌链：.glass-op 规则体直接 var()，
    # 或像 --glass-rim-hi 那样组合另一个 var() —— 只扫规则体会把链上的 rim-w 误报成独享。
    css_body = css_text
    for tok in ("--glass-blur-panel", "--glass-blur-ctl", "--glass-sat",
                "--glass-bright", "--glass-tint-panel", "--glass-tint-ctl",
                "--glass-tint-scrim", "--glass-rim-color", "--glass-rim-w"):
        in_js = tok in js_src
        in_css = ("var(%s)" % tok) in css_body or ("var(%s, " % tok) in css_body
        if in_js and not in_css:
            bad.append(("GL 同源", tok, "只有 WebGL 侧在用它，CSS 降级层没有对应物 → 两态切换会跳"))
    return bad


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-v", "--verbose", action="store_true", help="打印每个表面的最坏组合明细")
    args = ap.parse_args()

    css_text = open(CSS, encoding="utf-8").read()
    day_tok, night_ovr = parse_tokens(css_text)
    night_tok = dict(day_tok)
    night_tok.update(night_ovr)

    # 先校验：夜宵档必须真的覆盖了这组玻璃令牌，否则「只验一态」的坑会复发。
    # 覆盖可以是直接的，也可以顺着 var() 间接生效（见 night_trace）。
    must_invert = ["--glass-tint-panel", "--glass-tint-ctl", "--glass-rim-hi",
                   "--glass-inner-frost", "--glass-tint-scrim"]
    missing = [t for t in must_invert if not night_trace(t, day_tok, night_ovr)]
    covered_via = [(t, night_trace(t, day_tok, night_ovr)[0]) for t in must_invert
                   if t not in night_ovr and night_trace(t, day_tok, night_ovr)]

    failures = []
    print("=" * 74)
    print("操作层真玻璃 · 双态对比度门禁")
    print("=" * 74)
    for theme, toks in (("day", day_tok), ("night", night_tok)):
        label = "白天 Rosy" if theme == "day" else "夜宵 Night"
        print("\n【%s】" % label)
        for surf in SURFACES:
            tint_rgb, tint_a = token_rgb_alpha(surf["tint"], toks)
            if surf.get("opaque"):
                tint_a = 1.0  # 实心盘：没有透，背景包络只用于验证它确实不透
            m = re.match(r"(\d+)%", toks.get(surf["needs_saturate"], "100%"))
            sat_factor = (int(m.group(1)) / 100.0) if m else 1.0
            bright_factor = float(toks.get(surf["needs_bright"], "1").strip())
            print("  ○ %s  tint alpha=%.2f  saturate=%.0f%%  brightness=%.2f"
                  % (surf["name"], tint_a, sat_factor * 100, bright_factor))
            # 光晕建模：--glass-halo-lift 是「笔画周围被晕层抬向 halo 色的等效覆盖系数」。
            # 它不是量出来的，是假设值 —— 所以门禁同时打印**裸图标**的数值，
            # 让审稿人一眼看见有多少安全性是押在这个假设上的。
            halo_lift = float(toks.get("--glass-halo-lift", "0").strip() or 0)
            try:
                halo_rgb = resolve(toks["--glass-halo-rgb"], toks)[0] if "--glass-halo-rgb" in toks else None
            except Exception:
                halo_rgb = None
            for fg_name, fg_tok, kind, only, halo in surf["fg"]:
                if only and theme not in only:
                    continue
                min_ratio = TEXT_FLOOR if kind == "text" else ICON_FLOOR
                fg_rgb, _ = token_rgb_alpha(fg_tok, toks)
                # 判定口径 = 真实链路（blur → saturate → brightness 全生效）。
                # 另两档只报为参考：backdrop-filter 与 brightness() 同属 Chrome 76+ /
                # Safari 9.1+ / Firefox 103+，不存在「只糊不压亮度」的真实浏览器状态；
                # 拿它判红会把 alpha 越推越高、最后做成用户实测「一点玻璃都没有」的白纸。
                REAL = "饱和+亮度"
                rows, per_mode = [], {}
                bare_min = 99.0
                for bd_name, bd_val in BACKDROPS[theme]:
                    if surf.get("beds") and bd_name not in surf["beds"]:
                        continue
                    bd = resolve(bd_val, toks)[0] if bd_val.startswith("--") else hex_to_rgb(bd_val)[0]
                    sat_bd = saturate(bd, sat_factor)
                    for mode, base in (("原色", bd),
                                       ("仅饱和", sat_bd),
                                       (REAL, tuple(c * bright_factor for c in sat_bd))):
                        comp = over(tint_rgb, tint_a, base)
                        bare = contrast(fg_rgb, comp)          # 裸图标（没有光晕兜底）
                        if mode == REAL:
                            bare_min = min(bare_min, bare)     # 只记真实链路，别把假想档混进来
                        judged = over(halo_rgb, halo_lift, comp) if (halo and halo_rgb is not None and halo_lift > 0) else comp
                        ratio = contrast(fg_rgb, judged)
                        rows.append((ratio, "%s/%s" % (bd_name, mode), comp))   # ← 存**加晕前**的底
                        if mode not in per_mode or ratio < per_mode[mode][0]:
                            per_mode[mode] = (ratio, "%s / %s" % (bd_name, mode), comp)
                if not rows:
                    print("      %-24s 无可判定背景（beds 配错？）" % fg_name)
                    continue
                worst = per_mode[REAL]
                ok = worst[0] >= min_ratio
                thin = "（偏薄）" if (ok and kind == "icon" and worst[0] < min_ratio + ICON_MARGIN) else ""
                tag = "有晕" if (halo and halo_rgb is not None) else "无晕"
                # 把「光晕系数」这个假设翻译成余量：解出达标真正需要的 lift。
                # 只要它远小于 --glass-halo-lift 的取值，说明结论不押在假设上。
                need = ""
                if halo and halo_rgb is not None:
                    lo, hi = 0.0, 1.0
                    best = None
                    # worst 对应的合成底已在 per_mode 里；这里对同一最坏组合反解所需 lift
                    comp_w = worst[2]
                    for _ in range(48):
                        mid = (lo + hi) / 2.0
                        if contrast(fg_rgb, over(halo_rgb, mid, comp_w)) >= min_ratio:
                            hi, best = mid, mid
                        else:
                            lo = mid
                    need = "｜达标仅需 lift %s" % ("%.2f" % best if best is not None else "1.0 不够")
                print("      %-22s %s判定 %5.2f:1（%s门槛 %.1f:1）%s%-6s ← %s｜同点裸值 %5.2f:1 %s"
                      % (fg_name, tag, worst[0], "图标" if kind == "icon" else "正文",
                         min_ratio, "达标" if ok else "不达标", thin, worst[1], bare_min, need))
                if args.verbose:
                    for ratio, name, comp in sorted(rows)[:6]:
                        print("          %5.2f:1  %-26s 合成底 rgb(%3d,%3d,%3d)"
                              % (ratio, name, *tuple(int(round(c)) for c in comp)))
                if not ok:
                    failures.append((label, surf["name"], fg_name, worst[0], min_ratio, worst[1]))

    # 遮罩不透明度：没有文字，但压不住内容就等于抽屉浮不起来，给个下限提示
    print("\n  · 模态遮罩遮蔽度（无文字，只量它把背后压暗的程度）")
    for theme, toks in (("day", day_tok), ("night", night_tok)):
        _, a = token_rgb_alpha("--glass-tint-scrim", toks)
        state = "够" if a >= 0.30 else "偏轻"
        print("      %-6s alpha=%.2f → %s" % ("白天" if theme == "day" else "夜宵", a, state))

    # ---- 检查 2：夜宵块禁止 color-mix(… 会反相的令牌 …) ----
    # Lightning CSS 给 color-mix 生成的静态回退按 :root 求值，看不见 [data-theme="night"]
    # 的覆盖 → 不支持 color-mix 的浏览器在夜宵态拿到白天那档颜色（实测曾把药丸底算成浅粉）。
    # 新写的夜宵令牌一律用字面 rgba；既有历史写法列在 WAIVED 里，只提示不阻断。
    WAIVED = {
        "--color-line": "2026-09-21 娃娃机世界层既有写法，牵动全站描边，另案处理",
    }
    invertable = set(night_ovr)  # 有夜宵覆盖 = 会反相
    offenders, waived_hits = [], []
    for name, val in night_ovr.items():
        if "color-mix" not in val:
            continue
        refs = set(re.findall(r"var\((--[a-z0-9-]+)", val))
        bad = sorted(r for r in refs if r in invertable and not r.startswith("--glass-"))
        bad = [r for r in bad if r not in ("--color-glass",)]
        if not bad:
            continue
        (waived_hits if name in WAIVED else offenders).append((name, val, bad))

    print("\n  · 夜宵 color-mix 回退陷阱检查")
    for name, val, bad in offenders:
        print("      ✗ %s = color-mix 引用了会反相的 %s" % (name, ", ".join(bad)))
        failures.append(("两态一致", name, "引用 " + "/".join(bad), 0, 1, "静态回退按 :root 求值"))
    for name, val, bad in waived_hits:
        print("      ⚠ 既有豁免 %s → %s" % (name, WAIVED[name]))
    if not offenders and not waived_hits:
        print("      无命中")
    elif not offenders:
        print("      新增写法全部安全（豁免 %d 处历史写法）" % len(waived_hits))

    # ---- 检查 3：令牌必须在两态都登记 ----
    for t in must_invert:
        if t not in day_tok:
            failures.append(("两态一致", t, "白天缺定义", 0, 1, "-"))

    # ---- 检查 4：WebGL 层与 CSS 降级层同源（US-004/005 回归防线）----
    homo = check_homology()
    print("\n  · GL 层 / CSS 层同源检查（禁第三种真值）")
    if homo:
        for _cat, where, msg in homo:
            print("      ✗ %s：%s" % (where, msg))
    else:
        print("      通过：光学参数都走 index.css 令牌，无绕过写法")
    for _cat, where, msg in homo:
        failures.append(("同源", where, msg, 0, 1, "check_homology"))

    print("\n" + "=" * 74)
    if covered_via:
        print("夜宵覆盖走的是间接层（自身不重写，值由下层令牌反相带下来）：")
        for t, path in covered_via:
            print("  · %s 经 %s" % (t, path))
    if missing:
        print("夜宵档缺少覆盖的令牌（会白天达夜宵不达标）：")
        for t in missing:
            print("  ✗ %s" % t)
    if failures:
        print("对比度不达标 %d 项：" % len(failures))
        for theme, sname, fg, got, need, where in failures:
            print("  ✗ [%s] %s / %s —— %.2f:1 < %.1f:1（最坏来自 %s）" % (theme, sname, fg, got, need, where))
        print("\n处置建议：调高 --glass-tint-* 的 color-mix 百分比（alpha 越大越稳），")
        print("或把该表面的前景色从 ash 提到 bone。改完必须重跑本脚本 + 两态截图。")
        sys.exit(1)
    if missing:
        sys.exit(1)
    print("全部通过：两态 × 全部最坏背景 × 全部登记前景色 ≥ 门槛")
    sys.exit(0)


if __name__ == "__main__":
    main()
