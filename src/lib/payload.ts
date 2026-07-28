/**
 * Structured payload builders for QR codes.
 * Each type produces a single string that QR scanners understand.
 */

export type ContentType =
  | "text"
  | "url"
  | "wifi"
  | "vcard"
  | "sms"
  | "email"
  | "tel"
  | "geo";

export interface FieldDef {
  key: string;
  label: Record<"en" | "zh", string>;
  placeholder?: Record<"en" | "zh", string>;
  type?: "text" | "textarea" | "select" | "number";
  options?: { value: string; label: Record<"en" | "zh", string> }[];
  required?: boolean;
}

export interface ContentTypeDef {
  type: ContentType;
  label: Record<"en" | "zh", string>;
  fields: FieldDef[];
  /** Build the QR payload string from form values. Returns "" if invalid. */
  build: (v: Record<string, string>) => string;
}

const esc = (s: string) => s.replace(/([\\;,":])/g, "\\$1");

export const CONTENT_TYPES: ContentTypeDef[] = [
  {
    type: "text",
    label: { en: "Plain text", zh: "纯文本" },
    fields: [
      {
        key: "text",
        label: { en: "Content", zh: "内容" },
        placeholder: { en: "Any text…", zh: "任意文本…" },
        type: "textarea",
        required: true,
      },
    ],
    build: (v) => v.text ?? "",
  },
  {
    type: "url",
    label: { en: "URL", zh: "网址" },
    fields: [
      {
        key: "url",
        label: { en: "URL", zh: "网址" },
        placeholder: { en: "https://example.com", zh: "https://example.com" },
        required: true,
      },
    ],
    build: (v) => {
      const u = (v.url ?? "").trim();
      if (!u) return "";
      return /^https?:\/\//i.test(u) ? u : `https://${u}`;
    },
  },
  {
    type: "wifi",
    label: { en: "Wi-Fi", zh: "Wi-Fi" },
    fields: [
      {
        key: "ssid",
        label: { en: "SSID (network name)", zh: "SSID（网络名称）" },
        placeholder: { en: "MyNetwork", zh: "我的网络" },
        required: true,
      },
      {
        key: "password",
        label: { en: "Password", zh: "密码" },
        placeholder: { en: "password", zh: "密码" },
      },
      {
        key: "encryption",
        label: { en: "Encryption", zh: "加密方式" },
        type: "select",
        options: [
          { value: "WPA", label: { en: "WPA/WPA2", zh: "WPA/WPA2" } },
          { value: "WEP", label: { en: "WEP", zh: "WEP" } },
          { value: "nopass", label: { en: "None", zh: "无加密" } },
        ],
      },
      {
        key: "hidden",
        label: { en: "Hidden network", zh: "隐藏网络" },
        type: "select",
        options: [
          { value: "false", label: { en: "No", zh: "否" } },
          { value: "true", label: { en: "Yes", zh: "是" } },
        ],
      },
    ],
    build: (v) => {
      const ssid = v.ssid ?? "";
      if (!ssid) return "";
      const enc = v.encryption || "WPA";
      const pw = v.password ?? "";
      const hidden = v.hidden === "true" ? "true" : "false";
      if (enc === "nopass") {
        return `WIFI:T:nopass;S:${esc(ssid)};H:${hidden};`;
      }
      return `WIFI:T:${enc};S:${esc(ssid)};P:${esc(pw)};H:${hidden};`;
    },
  },
  {
    type: "vcard",
    label: { en: "Contact (vCard)", zh: "名片（vCard）" },
    fields: [
      {
        key: "firstName",
        label: { en: "First name", zh: "名" },
        placeholder: { en: "John", zh: "三" },
      },
      {
        key: "lastName",
        label: { en: "Last name", zh: "姓" },
        placeholder: { en: "Doe", zh: "张" },
        required: true,
      },
      {
        key: "org",
        label: { en: "Organization", zh: "组织" },
        placeholder: { en: "Company Inc.", zh: "某公司" },
      },
      {
        key: "phone",
        label: { en: "Phone", zh: "电话" },
        placeholder: { en: "+1 555 1234567", zh: "13800000000" },
      },
      {
        key: "email",
        label: { en: "Email", zh: "邮箱" },
        placeholder: { en: "john@example.com", zh: "name@example.com" },
      },
      {
        key: "url",
        label: { en: "Website", zh: "网址" },
        placeholder: { en: "https://example.com", zh: "https://example.com" },
      },
      {
        key: "note",
        label: { en: "Note", zh: "备注" },
        type: "textarea",
        placeholder: { en: "Optional note", zh: "可选备注" },
      },
    ],
    build: (v) => {
      const last = (v.lastName ?? "").trim();
      const first = (v.firstName ?? "").trim();
      if (!last && !first) return "";
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${last};${first};;;`,
        `FN:${first} ${last}`.trim(),
      ];
      if (v.org) lines.push(`ORG:${v.org}`);
      if (v.phone) lines.push(`TEL;TYPE=CELL:${v.phone}`);
      if (v.email) lines.push(`EMAIL:${v.email}`);
      if (v.url) lines.push(`URL:${v.url}`);
      if (v.note) lines.push(`NOTE:${v.note}`);
      lines.push("END:VCARD");
      return lines.join("\n");
    },
  },
  {
    type: "sms",
    label: { en: "SMS", zh: "短信" },
    fields: [
      {
        key: "number",
        label: { en: "Phone number", zh: "电话号码" },
        placeholder: { en: "+1 555 1234567", zh: "13800000000" },
        required: true,
      },
      {
        key: "body",
        label: { en: "Message", zh: "短信内容" },
        type: "textarea",
        placeholder: { en: "Hello!", zh: "你好！" },
      },
    ],
    build: (v) => {
      const num = (v.number ?? "").trim();
      if (!num) return "";
      const body = v.body ?? "";
      // SMSTO: form is widely supported; colon-separated.
      return body ? `SMSTO:${num}:${body}` : `SMSTO:${num}:`;
    },
  },
  {
    type: "email",
    label: { en: "Email", zh: "邮件" },
    fields: [
      {
        key: "to",
        label: { en: "To", zh: "收件人" },
        placeholder: { en: "name@example.com", zh: "name@example.com" },
        required: true,
      },
      {
        key: "subject",
        label: { en: "Subject", zh: "主题" },
        placeholder: { en: "Hello", zh: "你好" },
      },
      {
        key: "body",
        label: { en: "Body", zh: "正文" },
        type: "textarea",
        placeholder: { en: "Message…", zh: "正文…" },
      },
    ],
    build: (v) => {
      const to = (v.to ?? "").trim();
      if (!to) return "";
      const params: string[] = [];
      if (v.subject) params.push(`subject=${encodeURIComponent(v.subject)}`);
      if (v.body) params.push(`body=${encodeURIComponent(v.body)}`);
      return params.length ? `mailto:${to}?${params.join("&")}` : `mailto:${to}`;
    },
  },
  {
    type: "tel",
    label: { en: "Phone call", zh: "拨打电话" },
    fields: [
      {
        key: "number",
        label: { en: "Phone number", zh: "电话号码" },
        placeholder: { en: "+1 555 1234567", zh: "13800000000" },
        required: true,
      },
    ],
    build: (v) => {
      const num = (v.number ?? "").trim();
      return num ? `tel:${num}` : "";
    },
  },
  {
    type: "geo",
    label: { en: "Geolocation", zh: "地理位置" },
    fields: [
      {
        key: "lat",
        label: { en: "Latitude", zh: "纬度" },
        type: "number",
        placeholder: { en: "39.9042", zh: "39.9042" },
        required: true,
      },
      {
        key: "lng",
        label: { en: "Longitude", zh: "经度" },
        type: "number",
        placeholder: { en: "116.4074", zh: "116.4074" },
        required: true,
      },
      {
        key: "label",
        label: { en: "Label (optional)", zh: "名称（可选）" },
        placeholder: { en: "Tiananmen", zh: "天安门" },
      },
    ],
    build: (v) => {
      const lat = (v.lat ?? "").trim();
      const lng = (v.lng ?? "").trim();
      if (!lat || !lng) return "";
      return `geo:${lat},${lng}${v.label ? `?q=${encodeURIComponent(v.label)}` : ""}`;
    },
  },
];

export const CONTENT_TYPE_MAP: Record<ContentType, ContentTypeDef> =
  Object.fromEntries(CONTENT_TYPES.map((c) => [c.type, c])) as Record<
    ContentType,
    ContentTypeDef
  >;

/** Empty form values object for a given content type. */
export function emptyValues(type: ContentType): Record<string, string> {
  const def = CONTENT_TYPE_MAP[type];
  const out: Record<string, string> = {};
  for (const f of def.fields) {
    if (f.type === "select" && f.options?.length) {
      out[f.key] = f.options[0].value;
    } else {
      out[f.key] = "";
    }
  }
  return out;
}
