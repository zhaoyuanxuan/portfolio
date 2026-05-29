# Zhao Yuanxuan · Portfolio

一个克制、理性、有数学感与空间感的设计师作品集站点。

> "I design things that help people understand complexity."

## 设计语言

- **气质**：Rational · Systematic · AI Native · Minimal · Mathematical · Quiet Luxury · Structured
- **避免**：太互联网 / 太花哨 / 太 Dribbble / 太营销 / 太赛博朋克
- **参考**：Stripe（数学感与层次）· Linear（克制感）· Tesla（空间感）· Apple Mac Studio（滑动叙事）· Alibaba Design（细节）
- **动效**：光效背景 · 滚动渐入 · 字体分行入场 · 鼠标视差 · 标语 marquee

## 结构

```
01 Hero          一句话定位 + 大图视觉
02 About         头像 + 基本信息 + 设计信念 + 经历 + 长期关注
03 Selected Work 6 个作品（占位中）
04 Contact       行动召唤 + 联系方式
```

## 文件

- `index.html` — 页面结构（语义化、可访问）
- `styles.css` — 设计系统、版式、布局、动效
- `script.js`  — i18n（中/英）、滚动状态、视差、reveal、时钟

## 本地预览

直接用浏览器双击 `index.html` 即可。  
或在该目录下任意一种方式启动静态服务（推荐，便于字体/缓存）：

```bash
# Python 3
python3 -m http.server 5173
# Node
npx serve .
```

然后访问 http://localhost:5173

---

## 占位图替换指南（重要）

页面中所有需要替换的图片都使用 `.placeholder` 组件标注，自带：
- 网格 + 中心十字辅助线
- 虚线描边
- 左下角说明：`ID · 尺寸 · 比例`

每个占位图在 HTML 中都带有：

```html
<figure class="placeholder" data-ph="hero-1" data-size="3840×2160 · 16:9">
  ...
</figure>
```

通过 `data-ph` 即可定位。下面是完整清单：

| data-ph        | 位置                     | 替换图片要求                | 备注                       |
| -------------- | ------------------------ | --------------------------- | -------------------------- |
| `hero-media`   | 首页 Hero **背景视觉**   | **3840 × 2160 · 16:9** 或 **mp4/webm 视频** | 整个区域用于动态视频或大图，会被自动羽化融入页面；替换时直接把 `.hero__media` 内的 `.hero__motif` 整块替换成 `<img>` 或 `<video autoplay muted loop playsinline>` |
| `portrait`     | About 区头像             | **1200 × 1200 · 1:1**       | 会被径向遮罩自动羽化，背景过渡自然，建议低饱和、留白居中的人像 |
| `work-01` ~ `work-06` | Selected Work 6 个项目封面 | **1920 × 1080 · 16:9** | 标准项目封面 |

### 替换步骤（任选其一）

**方式 A：用 `<img>` 直接替换占位**

把原本的：
```html
<figure class="placeholder" data-ph="hero-1" data-size="3840×2160 · 16:9">
  <div class="placeholder__crosshair"></div>
  <figcaption>
    <span>HERO_01</span>
    <span>3840 × 2160 · 16:9</span>
  </figcaption>
</figure>
```

替换为：
```html
<figure class="hero__visual" data-ph="hero-1">
  <img src="./assets/hero-1.jpg" alt="Project hero visual" />
</figure>
```

并确保 `<img>` 加上：

```css
img { width: 100%; height: 100%; object-fit: cover; display: block; }
```

（实际上你可以保留 `.placeholder` 类，把 `<img>` 直接塞进去也能正常显示。）

**方式 B：通过 CSS 背景图替换（不改 HTML）**

在 `styles.css` 末尾追加：

```css
.placeholder[data-ph="hero-1"]   { background-image: url(./assets/hero-1.jpg); background-size: cover; background-position: center; }
.placeholder[data-ph="portrait"] { background-image: url(./assets/portrait.jpg); background-size: cover; background-position: center; }
.placeholder[data-ph="work-01"]  { background-image: url(./assets/work-01.jpg); background-size: cover; background-position: center; }
/* … 其他依此类推 */

/* 隐藏占位辅助线 */
.placeholder[data-ph][style*="background-image"]::before,
.placeholder[data-ph][style*="background-image"]::after,
.placeholder[data-ph][style*="background-image"] .placeholder__crosshair,
.placeholder[data-ph][style*="background-image"] figcaption { display: none; }
```

### 建议目录

把图片放到 `./assets/`，便于管理：

```
作品网站/
├─ index.html
├─ styles.css
├─ script.js
├─ README.md
└─ assets/
   ├─ hero-1.jpg     (3840×2160)
   ├─ portrait.jpg   (1200×1200)
   ├─ work-01.jpg    (1920×1080)
   ├─ work-02.jpg
   ├─ work-03.jpg
   ├─ work-04.jpg
   ├─ work-05.jpg
   └─ work-06.jpg
```

---

## 项目信息可编辑位

| 区块                | 字段                       | 位置（`index.html`）       |
| ------------------- | -------------------------- | -------------------------- |
| Hero                | 三行标题                   | `.hero__title`             |
| About               | 姓名 / Title / 城市 / 经验 / 状态 / 联系 | `.about__facts` |
| About               | 个人简介                   | `.about__bio`              |
| 设计信念            | 7 条                       | `.beliefs__list`           |
| 职业经历            | 时间线                     | `.career__list`            |
| 长期关注            | 3 张卡                     | `.focus__grid`             |
| Selected Work       | 6 个项目（标题/标签/年份/封面/简述） | `.work__item` |
| Contact             | 邮箱 / 电话 / 链接         | `.contact__grid`           |
| Footer              | 版权 / 引语 / 城市         | `.foot`                    |

---

## 国际化

页面右上角 `EN / 中` 按钮可在中英之间切换。文案在 `script.js` 中 `dict` 对象统一维护。

## 性能 & 可访问性

- 使用 `system + Inter + Fraunces + JetBrains Mono`，Google Fonts 已 preconnect
- `prefers-reduced-motion` 自动关闭动画
- 语义化 HTML（`section / article / header / nav / dl`）
- 全键盘可达；导航高对比

## Checklist 对应

- [x] 首页 Hero 足够强
- [x] 首屏一句话能表达你是谁
- [x] 项目不超过 10 个（当前 6 个）
- [x] 每个项目都有明确逻辑（标签 / 年份 / 简述）
- [x] 图片风格统一（占位规范统一）
- [x] 动效克制（淡入 / 视差 / 滚动）
- [x] 移动端适配
- [x] 页面加载速度（无重型依赖）
- [x] 中英文版本

---

Built quietly · 2025
