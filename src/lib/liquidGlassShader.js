/* ============================================================
 * 液态玻璃 shader（WebGL2）
 *
 * 从原型 liquid-glass-proto.html 的片元着色器逐段移植。为什么不用 CSS：
 * backdrop-filter 只能做「模糊 + 提饱和」，做不出**边缘折射**（lensing），
 * 而边缘把背景"挤弯"是 iOS 26 Liquid Glass 最核心的识别特征。
 *
 * 视觉权重（按对"像不像 iOS"的贡献排序）：
 *   边缘折射带 > 上缘镜面高光 > 中间清透度 > 提饱和 > 模糊
 * 注意最后两项：模糊一大、白纱一厚，就退化成"磨砂塑料"而不是玻璃。
 * ============================================================ */

export const VERT_SRC = `#version 300 es
out vec2 vUv;
void main(){
  // 全屏三角形，不需要顶点缓冲：gl_VertexID 直接推出三个覆盖顶点
  vec2 p = vec2(float(gl_VertexID == 1 ? 3 : -1), float(gl_VertexID == 2 ? 3 : -1));
  vUv = p * 0.5 + 0.5;
  gl_Position = vec4(p, 0.0, 1.0);
}`

export const FRAG_SRC = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uTex;        // 场景纹理（清晰）
uniform sampler2D uTexBlur;    // 同一张纹理的模糊版
uniform vec2  uRes;            // 本画布像素尺寸
uniform vec2  uOrigin;         // 本画布左上角在视口中的位置（CSS px）
uniform vec2  uViewport;       // 视口 CSS 尺寸，用于把视口坐标换算成纹理 uv
uniform vec4  uRect;           // 玻璃矩形，视口 CSS px：x,y,w,h
uniform float uRadius;
uniform float uLens;           // 折射位移幅度（CSS px）
uniform float uCA;             // 色散：三通道压缩率的相对差
uniform float uSat;
uniform vec4  uTint;           // veil 色 + alpha（已从 CSS 令牌解析）
uniform vec4  uRimHi;          // 上缘高光的色 + alpha
uniform float uRimW;           // 高光线宽（CSS px）
uniform float uFrost;          // 内壁雾光强度
uniform float uSpec;
uniform float uFlat;          // 1 = 纯 veil（遮罩用），见下方说明

float sdRR(vec2 p, vec2 b, float r){
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
vec2 sdRRgrad(vec2 p, vec2 b, float r){
  vec2 s = sign(p);
  vec2 q = abs(p) - b + r;
  if (max(q.x, q.y) > 0.0) return s * (q / max(length(q), 1e-5));
  return (q.x > q.y) ? vec2(s.x, 0.0) : vec2(0.0, s.y);
}
vec3 sat3(vec3 c, float f){ float l = dot(c, vec3(0.2126,0.7152,0.0722)); return mix(vec3(l), c, f); }

void main(){
  // 本画布只覆盖玻璃矩形（外加阴影余量），所以坐标要绕两跳：
  //   片元 → 视口 CSS px → 纹理 uv
  // 玻璃几何一律在「视口 CSS px」空间里算，这样多块玻璃共用同一套参数。
  vec2 vp = uOrigin + vUv * uRes;                    // 视口 CSS px（y 向下）
  vec2 ctr = uRect.xy + uRect.zw * 0.5;
  vec2 b = uRect.zw * 0.5;
  float r = min(uRadius, min(b.x, b.y));
  vec2 lp = vp - ctr;
  float d = sdRR(lp, b, r);
  if (d > 2.0) { frag = vec4(0.0); return; }          // 玻璃外：全透明，露出下面的 CSS 层

  float aa = max(1.5, uRes.y * 0.002);
  float inside = 1.0 - smoothstep(-aa, aa, d);

  // 法线：SDF 的梯度。注意 y 轴向下，高光方向要跟着翻
  vec2 n = normalize(sdRRgrad(lp, b, r) + 1e-6);
  float rimW = min(b.x, b.y) * 0.92;
  float t = clamp(-d / rimW, 0.0, 1.0);
  float lensW = pow(1.0 - t, 2.6);                    // 边缘→1、中心→0：只有边缘弯折光线
  // 遮罩是**整屏大**的平面玻璃：b=(视口/2)，于是 rimW≈179、"边缘带"会盖满全屏，
  // 折射/雾光/高光全都糊到屏幕中间 —— 实测遮罩中心比 CSS 降级层亮 0.126。
  // iOS 的 dimming layer 本来也不折射（它只是把身后糊掉压暗），所以这里给 scrim
  // 一条 flat 通路：只保留「糊 + veil」，把 lensW 与所有边缘项一起归零。
  lensW *= (1.0 - uFlat);

  // 折射：把采样点朝玻璃中心挤，越靠边挤得越多 —— 这就是"边缘把背景弯折"的成因
  float pinch = uLens;
  vec2 base = vp / uViewport;
  vec2 dir = (base - ctr / uViewport);
  float squeeze = pinch * lensW / max(min(b.x, b.y), 1.0);
  // 色散：三通道用略微不同的压缩率，边缘因此带一圈极细的彩边
  vec2 cR = ctr / uViewport + dir * (1.0 - squeeze * (1.0 + uCA));
  vec2 cG = ctr / uViewport + dir * (1.0 - squeeze);
  vec2 cB = ctr / uViewport + dir * (1.0 - squeeze * (1.0 - uCA));
  // 边缘位移：沿法线把 uv 往外推，模拟厚玻璃的侧面看穿
  vec2 disp = n * (pinch * lensW) / uViewport;
  cR += disp * (1.0 + uCA); cG += disp; cB += disp * (1.0 - uCA);

  vec3 sharpC = vec3(texture(uTex, cR).r, texture(uTex, cG).g, texture(uTex, cB).b);
  vec3 blurC  = vec3(texture(uTexBlur, cR).r, texture(uTexBlur, cG).g, texture(uTexBlur, cB).b);

  // 中心糊、边缘清：真实厚玻璃是中间失焦、边缘因折射把内容拉近
  vec3 col = mix(blurC, sharpC, lensW * 0.85);
  col = sat3(col, uSat);
  col = mix(col, uTint.rgb, uTint.a);                 // 白纱（veil）—— 一定要薄

  // 上缘镜面高光：光从上方来（y 向下 → 上缘是 lp.y 负的那边）
  vec2 lv = normalize(vec2(-0.25, -1.0));
  float spec = pow(clamp(dot(n, lv), 0.0, 1.0), 2.0);
  col += spec * lensW * uSpec * 0.35;

  // 紧贴内缘的亮线 + 底部沉边（粉纸底上玻璃主要靠这两条立住）
  float edgeLine = exp(-abs(d + uRimW) * 1.4);
  edgeLine *= (1.0 - uFlat);
  col = mix(col, uRimHi.rgb, clamp(edgeLine * uRimHi.a * (0.35 + 0.65 * smoothstep(1.0, 0.0, lp.y / b.y * 0.5 + 0.5)), 0.0, 1.0));
  col *= 1.0 - 0.10 * edgeLine * smoothstep(0.0, 1.0, lp.y / b.y * 0.5 + 0.5);

  // 内壁雾光
  col = mix(col, uRimHi.rgb, uFrost * (1.0 - uFlat) * exp(-max(-d, 0.0) / max(rimW * 0.25, 1.0)));

  // 外投影
  float shadow = smoothstep(14.0, 0.0, d) * 0.16 * inside;
  float alpha = inside * (1.0 - shadow * 0.6) + shadow * 0.35;
  // ⚠ 不能再乘 inside：context 是 premultipliedAlpha:false，合成器会自己乘一次 alpha。
  //   这里乘了等于乘两遍 —— 内部 inside=1 看不出来，但边缘 ±1.5px 的抗锯齿带上
  //   inside≈0.5，颜色被压成 0.25，玻璃外圈就描出一圈灰边（实测导出的画布上
  //   那圈深灰环就是这么来的）。折射恰恰只发生在这一带，等于把识别特征涂掉了。
  frag = vec4(col, alpha);
}`

export const UNIFORM_NAMES = [
  'uTex', 'uTexBlur', 'uRes', 'uOrigin', 'uViewport', 'uRect', 'uRadius',
  'uLens', 'uCA', 'uSat', 'uTint', 'uRimHi', 'uRimW', 'uFrost', 'uSpec',
]
