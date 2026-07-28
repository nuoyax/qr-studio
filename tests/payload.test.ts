import { describe, it, expect } from "vitest";
import {
  CONTENT_TYPES,
  CONTENT_TYPE_MAP,
  emptyValues,
} from "../src/lib/payload";

describe("payload builders", () => {
  it("text returns raw trimmed content", () => {
    expect(CONTENT_TYPE_MAP.text.build({ text: "  hi  " })).toBe("  hi  ");
  });

  it("url prepends https:// when scheme missing", () => {
    expect(CONTENT_TYPE_MAP.url.build({ url: "example.com" })).toBe(
      "https://example.com",
    );
    expect(CONTENT_TYPE_MAP.url.build({ url: "http://x.io" })).toBe(
      "http://x.io",
    );
  });

  it("url rejects empty", () => {
    expect(CONTENT_TYPE_MAP.url.build({ url: "" })).toBe("");
  });

  it("wifi builds WPA payload with escaping", () => {
    const p = CONTENT_TYPE_MAP.wifi.build({
      ssid: "My;Net",
      password: 'pa"ss',
      encryption: "WPA",
      hidden: "false",
    });
    expect(p).toBe('WIFI:T:WPA;S:My\\;Net;P:pa\\"ss;H:false;');
  });

  it("wifi nopass omits password", () => {
    const p = CONTENT_TYPE_MAP.wifi.build({
      ssid: "Open",
      encryption: "nopass",
      hidden: "false",
    });
    expect(p).toBe("WIFI:T:nopass;S:Open;H:false;");
  });

  it("wifi rejects empty ssid", () => {
    expect(
      CONTENT_TYPE_MAP.wifi.build({ ssid: "", encryption: "WPA", hidden: "false" }),
    ).toBe("");
  });

  it("vcard requires at least a name", () => {
    expect(CONTENT_TYPE_MAP.vcard.build({})).toBe("");
    const p = CONTENT_TYPE_MAP.vcard.build({ lastName: "Doe", firstName: "Jane" });
    expect(p).toContain("BEGIN:VCARD");
    expect(p).toContain("N:Doe;Jane;;;");
    expect(p).toContain("END:VCARD");
  });

  it("sms builds SMSTO: payload", () => {
    expect(CONTENT_TYPE_MAP.sms.build({ number: "123", body: "hi" })).toBe(
      "SMSTO:123:hi",
    );
    expect(CONTENT_TYPE_MAP.sms.build({ number: "123", body: "" })).toBe(
      "SMSTO:123:",
    );
    expect(CONTENT_TYPE_MAP.sms.build({ number: "", body: "hi" })).toBe("");
  });

  it("email builds mailto with query params", () => {
    const p = CONTENT_TYPE_MAP.email.build({
      to: "a@b.com",
      subject: "Hi there",
      body: "Hello",
    });
    expect(p).toContain("mailto:a@b.com?");
    expect(p).toContain("subject=Hi%20there");
    expect(p).toContain("body=Hello");
  });

  it("tel builds tel: payload", () => {
    expect(CONTENT_TYPE_MAP.tel.build({ number: "+86 138" })).toBe(
      "tel:+86 138",
    );
    expect(CONTENT_TYPE_MAP.tel.build({ number: "" })).toBe("");
  });

  it("geo builds geo: payload", () => {
    const p = CONTENT_TYPE_MAP.geo.build({
      lat: "39.9",
      lng: "116.4",
      label: "北京",
    });
    expect(p).toBe("geo:39.9,116.4?q=" + encodeURIComponent("北京"));
    expect(CONTENT_TYPE_MAP.geo.build({ lat: "", lng: "1" })).toBe("");
  });

  it("emptyValues seeds selects with first option", () => {
    const v = emptyValues("wifi");
    expect(v.encryption).toBe("WPA");
    expect(v.hidden).toBe("false");
    expect(v.ssid).toBe("");
  });

  it("CONTENT_TYPES covers all eight types", () => {
    expect(CONTENT_TYPES.map((c) => c.type).sort()).toEqual(
      [
        "email",
        "geo",
        "sms",
        "tel",
        "text",
        "url",
        "vcard",
        "wifi",
      ].sort(),
    );
  });
});
