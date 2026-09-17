// ============================================================
// 晨光厨房 · 夜宵菜品扩充（2026-09-17 所有者反馈"深夜没有多少能当夜宵的菜"）
// 25 道经典宵夜：烧烤炸串 / 夜面炒饭 / 饺包馄饨 / 卤味辣锅 / 糖水暖饮。
// 手写种子（非生成器产物），emoji 占位回退与灌库无图菜同机制；
// id 段 900-924，避开原始 1-65 与 HowToCook 500-841。
// ============================================================
export const SEED_NIGHT_EXTRA = [
  // —— 烧烤炸物：深夜烟火气 ——
  { id: 900, name: '深夜烤串拼盘', price: 26, category: '小吃', description: '孜然辣椒面，炭火气拉满', available: 1, image_url: '' },
  { id: 901, name: '炸串三兄弟', price: 15, category: '小吃', description: '面糊酥壳刷甜辣酱，外脆里嫩', available: 1, image_url: '' },
  { id: 902, name: '烤冷面', price: 12, category: '小吃', description: '酸甜酱香加蛋加肠，街摊之王', available: 1, image_url: '' },
  { id: 903, name: '炭烤豆腐', price: 10, category: '小吃', description: '外壳焦香，蘸汁一绝', available: 1, image_url: '' },
  { id: 904, name: '孜然烤鸡翅', price: 22, category: '小吃', description: '焦边渗油，越啃越香', available: 1, image_url: '' },

  // —— 夜面炒饭：碳水快乐 ——
  { id: 905, name: '扬州炒饭', price: 16, category: '主食', description: '粒粒金黄，蛋香包裹', available: 1, image_url: '' },
  { id: 906, name: '豪华泡面', price: 12, category: '主食', description: '加蛋加肠加青菜，深夜仪式感', available: 1, image_url: '' },
  { id: 907, name: '螺蛳粉', price: 18, category: '主食', description: '越嗦越上头，懂的人秒懂', available: 1, image_url: '' },
  { id: 908, name: '酸辣粉', price: 12, category: '主食', description: '粉条弹牙，酸辣醒神', available: 1, image_url: '' },
  { id: 909, name: '酱油炒年糕', price: 14, category: '小吃', description: '软糯焦香，甜咸拉丝', available: 1, image_url: '' },
  { id: 910, name: '鸡蛋炒河粉', price: 15, category: '主食', description: '镬气十足，深夜补给站', available: 1, image_url: '' },

  // —— 饺包馄饨：一口爆汁 ——
  { id: 911, name: '生煎包', price: 14, category: '小吃', description: '底脆皮薄，咬开爆汁要小心', available: 1, image_url: '' },
  { id: 912, name: '锅贴饺', price: 13, category: '小吃', description: '金黄脆底，蘸醋刚刚好', available: 1, image_url: '' },
  { id: 913, name: '小笼汤包', price: 16, category: '小吃', description: '轻轻提，慢慢移，先开窗后喝汤', available: 1, image_url: '' },
  { id: 914, name: '红油抄手', price: 14, category: '小吃', description: '皮薄馅嫩，麻辣红油开胃', available: 1, image_url: '' },
  { id: 915, name: '皮蛋瘦肉粥', price: 10, category: '主食', description: '暖胃绵密，深夜收尾舒服', available: 1, image_url: '' },
  { id: 916, name: '手抓饼加蛋', price: 9, category: '小吃', description: '层层掉渣，海苔肉松自由', available: 1, image_url: '' },

  // —— 卤味辣锅：越啃越上头 ——
  { id: 917, name: '麻辣鸭脖', price: 15, category: '小吃', description: '越啃越上头，追剧标配', available: 1, image_url: '' },
  { id: 918, name: '卤味拼盘', price: 24, category: '小吃', description: '鸭翅豆干藕片，一卤到底', available: 1, image_url: '' },
  { id: 919, name: '麻辣拌', price: 16, category: '小吃', description: '自选配菜，麻辣甜香裹满', available: 1, image_url: '' },
  { id: 920, name: '辣炒花蛤', price: 28, category: '小吃', description: '深夜大排档常驻，嗦到停不下', available: 1, image_url: '' },
  { id: 921, name: '砂锅豆腐煲', price: 18, category: '汤类', description: '咕嘟咕嘟，暖到心里', available: 1, image_url: '' },

  // —— 糖水暖饮：甜甜的收尾 ——
  { id: 922, name: '酒酿圆子', price: 8, category: '汤类', description: '微醺小甜水，一碗收住深夜', available: 1, image_url: '' },
  { id: 923, name: '银耳红枣羹', price: 9, category: '汤类', description: '胶质慢炖，甜而不腻', available: 1, image_url: '' },
  { id: 924, name: '热可可牛奶', price: 8, category: '饮品', description: '温热一杯，困意慢慢上来', available: 1, image_url: '' },
]
