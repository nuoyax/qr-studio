# 二维码工具

> 浏览器端的**二维码生成与解码**工具，支持批量处理、粘贴图片解码、XLSX 导入导出。基于 React + TypeScript + Vite。

**[English](./README.md)** · 中文（默认入口为英文）

---

## 功能

### 生成

- **单个二维码** — 将任意文本或链接生成为二维码，实时预览。
- **结构化模板** — 通过表单直接生成 网址 / Wi-Fi / 名片（vCard）/ 短信 / 邮件 / 电话 / 地理位置 二维码，无需手写格式。
- **样式化二维码** — 码点可选 方块 / 圆角 / 圆点，可自定义定位点（码眼）颜色，并支持**居中嵌入 Logo**（嵌入时纠错等级自动提升至 H 补偿遮挡）。
- **批量生成** — 粘贴多行内容，或从 **XLSX / TXT / CSV** 导入，一键批量生成。
- **可定制** — 尺寸、纠错等级（L/M/Q/H）、边距、前景色与背景色。
- **导出** — 单独下载每个 PNG、**全部打包为 ZIP 下载**，或**将内容列表导出为 XLSX**。
- 单个纯文本二维码支持 **SVG 导出**（矢量、可缩放）。

### 解码

- **单张图片** — 选择图片文件，识别其中的二维码。
- **粘贴图片** — 复制截图或图片，在「解码」页任意位置按 **Ctrl+V** 即可立即识别。
- **摄像头扫码** — 用设备摄像头实时扫描二维码（多摄像头设备可前后切换），识别到即自动停止。
- **批量解码** — 拖拽或一次选择多张图片，结果以表格列出。
- **导出** — 复制任意解码结果到剪贴板，或**将全部结果导出为 XLSX**（文件名、解码文本、状态）。

### 通用

- 🔒 **完全本地运行** — 所有处理均在浏览器内完成，数据不会上传到任何服务器。
- 🌐 **中英双语** — 默认英文，可切换简体中文，并记住你的选择。
- 🌙 **深色模式** — 首次访问自动跟随系统，切换后记住选择。
- 🕘 **历史记录** — 本地保存最近的生成与解码记录，可恢复、清除或导出为 **CSV / JSON**。
- 📱 **响应式**布局，桌面与移动端均可用。
- ⚡ 基于 **React 18 + TypeScript + Vite 6**，使用 [`qrcode`](https://www.npmjs.com/package/qrcode)、[`jsqr`](https://www.npmjs.com/package/jsqr)、[`xlsx`](https://www.npmjs.com/package/xlsx)（SheetJS）、[`jszip`](https://www.npmjs.com/package/jszip)。

---

## 技术栈

| 层级         | 选择                                      |
| ------------ | ----------------------------------------- |
| 框架         | React 18                                  |
| 语言         | TypeScript 5                              |
| 构建工具     | Vite 6                                    |
| 二维码生成   | `qrcode`                                  |
| 二维码解码   | `jsqr`                                    |
| 表格处理     | `xlsx`（SheetJS）                         |
| ZIP 打包     | `jszip`                                   |
| 部署         | GitHub Pages（静态 `dist/`）              |

---

## 快速开始

### 前置条件

- Node.js **18+**（已在 Node 22 上测试）
- npm 9+

### 安装与运行

```bash
# 安装依赖
npm install

# 启动开发服务器（http://localhost:5173）
npm run dev

# 类型检查 + 生产构建
npm run build

# 本地预览生产构建
npm run preview
```

生产构建输出到 `dist/` 目录。

---

## 项目结构

```
qr-studio/
├── index.html
├── vite.config.ts
├── tsconfig*.json
├── package.json
├── public/
│   └── qr.svg
└── src/
    ├── main.tsx              # 入口
    ├── App.tsx               # 外壳：标签页、头部、语言切换
    ├── styles.css            # 界面样式
    ├── components/
    │   ├── Generator.tsx     # 生成（单个 + 批量）
    │   └── Decoder.tsx      # 解码（单个 + 批量 + 粘贴）
    └── lib/
        ├── qr.ts             # 生成二维码 data URL
        ├── svg.ts            # 生成二维码 SVG 字符串
        ├── decode.ts         # 从图片 / ImageData 解码二维码
        ├── excel.ts          # 读写 XLSX、TXT/CSV
        ├── zip.ts            # ZIP 打包 + Blob 下载
        └── i18n.ts           # 英文 / 中文 字典
```

---

## 部署到 GitHub Pages

本仓库内置 GitHub Actions 工作流（`.github/workflows/deploy.yml`），会自动构建并发布站点。

### 方式一：自动部署（推荐）

1. 将仓库推送到 GitHub。
2. 进入 **Settings → Pages → Build and deployment → Source = GitHub Actions**。
3. 推送到 `main`（或手动触发工作流）。站点将发布在：
   `https://<你的用户名>.github.io/qr-studio/`

Vite 配置使用 `base: "./"`，构建产物可在任意项目子路径下工作。

### 方式二：手动部署

```bash
npm run build
# 将 dist/ 内容上传到你的静态托管（Pages / Netlify / Vercel 等）
```

---

## 发布 Release

推送版本标签（`v1.0.0`、`v1.1.0-rc.1`…）会触发 **Release** 工作流（`.github/workflows/release.yml`），它会：

1. 构建生产产物（`npm run build`）。
2. 将 `dist/` 打包为 `qr-studio-<tag>.zip`。
3. 生成 SHA256 校验文件（`checksums-sha256.txt`）。
4. 创建 GitHub Release 并附上 zip 与校验文件，自动生成发布说明（自上个标签以来的提交日志）。含 `-` 的标签会被标记为预发布。

```bash
# 创建并推送标签以发布
git tag v1.1.0
git push origin v1.1.0
```

产物会出现在 GitHub 仓库的 **Releases** 页面。版本历史见 [CHANGELOG.md](./CHANGELOG.md)。

---

## 使用技巧

- **从 Excel 批量生成**：每行一个内容条目（优先使用名为 `Content` / `Text` / `URL` 的列，否则取第一列）。导入 `.xlsx` 后点击生成。
- **粘贴解码**：截图（`Win+Shift+S` / `Cmd+Shift+4`），在「解码」页按 `Ctrl+V` / `Cmd+V` — 图片中的二维码会被立即识别。
- **摄像头扫码**：需 HTTPS 或 `localhost`（浏览器安全限制），手机端默认优先使用后置摄像头。
- **纠错等级**：等级越高（Q/H）容错越强，但二维码越密。默认 `M` 即可；嵌入 Logo 时会强制使用 `H`。

---

## 许可证

MIT — 见 [LICENSE](./LICENSE)。
