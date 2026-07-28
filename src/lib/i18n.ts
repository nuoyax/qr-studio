export type Lang = "en" | "zh";

export interface Dict {
  appTitle: string;
  appSubtitle: string;
  tabGenerate: string;
  tabDecode: string;
  langLabel: string;

  // Shared
  reset: string;
  download: string;
  copy: string;
  copied: string;
  copyFailed: string;
  remove: string;
  clearAll: string;
  importFile: string;
  importHint: string;
  exportXlsx: string;
  exportZip: string;
  results: string;
  noResults: string;
  status: string;
  preview: string;
  fileName: string;
  actions: string;
  index: string;

  // Generate
  genSubtitle: string;
  singleGen: string;
  batchGen: string;
  contentPlaceholder: string;
  size: string;
  ecLevel: string;
  margin: string;
  fgColor: string;
  bgColor: string;
  generate: string;
  genResultEmpty: string;
  downloadPng: string;
  downloadSvg: string;
  addRow: string;
  importXlsx: string;
  importTxt: string;
  batchEmpty: string;
  batchGenerated: string;
  exportZipTip: string;
  colContent: string;
  colImage: string;
  colStatus: string;
  statusDone: string;
  statusError: string;

  // Decode
  decSubtitle: string;
  singleDec: string;
  batchDec: string;
  pickImage: string;
  orPaste: string;
  pasteHint: string;
  pickImages: string;
  dragDrop: string;
  dragDropActive: string;
  decodedValue: string;
  noQrFound: string;
  colDecoded: string;

  // Footer
  footer: string;
  github: string;

  // Errors
  errEmpty: string;
  errRows: string;
  errLoad: string;
}

const en: Dict = {
  appTitle: "QR Code Tools",
  appSubtitle: "Generate & decode QR codes — batch support, paste image, XLSX export.",
  tabGenerate: "Generate",
  tabDecode: "Decode",
  langLabel: "中文",

  reset: "Reset",
  download: "Download",
  copy: "Copy",
  copied: "Copied",
  copyFailed: "Copy failed",
  remove: "Remove",
  clearAll: "Clear all",
  importFile: "Import file",
  importHint: "Import",
  exportXlsx: "Export XLSX",
  exportZip: "Export ZIP",
  results: "Results",
  noResults: "No results yet.",
  status: "Status",
  preview: "Preview",
  fileName: "File",
  actions: "Actions",
  index: "#",

  genSubtitle: "Create QR codes from text or URLs.",
  singleGen: "Single QR",
  batchGen: "Batch generate",
  contentPlaceholder: "Enter text or URL…",
  size: "Size",
  ecLevel: "Error correction",
  margin: "Margin",
  fgColor: "Foreground",
  bgColor: "Background",
  generate: "Generate",
  genResultEmpty: "Enter content and click Generate.",
  downloadPng: "Download PNG",
  downloadSvg: "Download SVG",
  addRow: "Add row",
  importXlsx: "Import XLSX",
  importTxt: "Import TXT/CSV",
  batchEmpty: "Add rows or import a file to start.",
  batchGenerated: "Generated {n} QR codes.",
  exportZipTip: "Download all QR images as a ZIP.",
  colContent: "Content",
  colImage: "Image",
  colStatus: "Status",
  statusDone: "Done",
  statusError: "Error",

  decSubtitle: "Read QR codes from images.",
  singleDec: "Single image",
  batchDec: "Batch decode",
  pickImage: "Choose image",
  orPaste: "or paste an image (Ctrl+V)",
  pasteHint: "Paste an image from clipboard anywhere on this tab.",
  pickImages: "Choose images",
  dragDrop: "Drag & drop images here, or click to browse",
  dragDropActive: "Drop images…",
  decodedValue: "Decoded value",
  noQrFound: "No QR code found.",
  colDecoded: "Decoded",

  footer: "Runs entirely in your browser. No data leaves your device.",
  github: "GitHub",

  errEmpty: "Please enter content.",
  errRows: "Add at least one row with content.",
  errLoad: "Failed to load file.",
};

const zh: Dict = {
  appTitle: "二维码工具",
  appSubtitle: "生成与解码二维码 — 支持批量、粘贴图片、导出 XLSX。",
  tabGenerate: "生成",
  tabDecode: "解码",
  langLabel: "English",

  reset: "重置",
  download: "下载",
  copy: "复制",
  copied: "已复制",
  copyFailed: "复制失败",
  remove: "删除",
  clearAll: "全部清除",
  importFile: "导入文件",
  importHint: "导入",
  exportXlsx: "导出 XLSX",
  exportZip: "导出 ZIP",
  results: "结果",
  noResults: "暂无结果。",
  status: "状态",
  preview: "预览",
  fileName: "文件",
  actions: "操作",
  index: "#",

  genSubtitle: "从文本或链接生成二维码。",
  singleGen: "单个二维码",
  batchGen: "批量生成",
  contentPlaceholder: "输入文本或链接…",
  size: "尺寸",
  ecLevel: "纠错等级",
  margin: "边距",
  fgColor: "前景色",
  bgColor: "背景色",
  generate: "生成",
  genResultEmpty: "输入内容后点击「生成」。",
  downloadPng: "下载 PNG",
  downloadSvg: "下载 SVG",
  addRow: "新增一行",
  importXlsx: "导入 XLSX",
  importTxt: "导入 TXT/CSV",
  batchEmpty: "新增行或导入文件以开始。",
  batchGenerated: "已生成 {n} 个二维码。",
  exportZipTip: "将所有二维码图片打包为 ZIP 下载。",
  colContent: "内容",
  colImage: "图片",
  colStatus: "状态",
  statusDone: "完成",
  statusError: "失败",

  decSubtitle: "从图片中识别二维码。",
  singleDec: "单张图片",
  batchDec: "批量解码",
  pickImage: "选择图片",
  orPaste: "或粘贴图片（Ctrl+V）",
  pasteHint: "在本页任意位置粘贴剪贴板中的图片即可识别。",
  pickImages: "选择图片",
  dragDrop: "将图片拖拽到此处，或点击选择",
  dragDropActive: "松开以添加图片…",
  decodedValue: "解码结果",
  noQrFound: "未找到二维码。",
  colDecoded: "解码内容",

  footer: "完全在浏览器本地运行，数据不会离开你的设备。",
  github: "GitHub",

  errEmpty: "请输入内容。",
  errRows: "请至少添加一行内容。",
  errLoad: "文件加载失败。",
};

export const dictionaries: Record<Lang, Dict> = { en, zh };

export function format(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] !== undefined ? String(vars[k]) : `{${k}}`,
  );
}
