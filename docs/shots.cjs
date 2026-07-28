const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");

const CHROME =
  process.env.PUPPETEER_EXECUTABLE_PATH ||
  "C:\\Users\\28624\\.cache\\puppeteer\\chrome\\win64-148.0.7778.97\\chrome-win64\\chrome.exe";
const OUT = path.join(__dirname, "screenshots");
const URL_ = "http://localhost:4173/";

fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1100, deviceScaleFactor: 1 });
  await page.goto(URL_, { waitUntil: "networkidle0" });
  await sleep(400);

  // Helpers -----------------------------------------------------------
  const setLang = async (lang) => {
    await page.evaluate((l) => localStorage.setItem("qr-studio.lang", l), lang);
  };
  const setTheme = async (theme) => {
    await page.evaluate((t) => {
      localStorage.setItem("qr-studio.theme", t);
      document.documentElement.dataset.theme = t;
    }, theme);
  };
  const clickTab = async (tab) => {
    // tabs are buttons; pick by text
    const tabs = await page.$$(".tab");
    for (const t of tabs) {
      const txt = await page.evaluate((el) => el.textContent, t);
      if (txt && txt.toLowerCase().includes(tab.toLowerCase())) {
        await t.click();
        return;
      }
    }
  };
  const fillSingle = async (text) => {
    // single QR textarea — the first textarea in generate card
    await page.evaluate((val) => {
      const ta = document.querySelector('textarea.text-area');
      if (ta) {
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype,
          "value"
        ).set;
        setter.call(ta, val);
        ta.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }, text);
  };
  const pickType = async (label) => {
    // content type select is the one under type-row
    await page.evaluate((lbl) => {
      const selects = Array.from(document.querySelectorAll("select"));
      // the content-type select has options like "Plain text"
      const sel = selects.find((s) =>
        Array.from(s.options).some((o) => o.textContent.includes(lbl))
      );
      if (sel) {
        const opt = Array.from(sel.options).find((o) =>
          o.textContent.includes(lbl)
        );
        if (opt) sel.value = opt.value;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }, label);
  };
  const clickGenerate = async () => {
    const btns = await page.$$(".btn.primary");
    for (const b of btns) {
      const txt = await page.evaluate((el) => el.textContent, b);
      if (txt && /generate|生成/i.test(txt)) {
        await b.click();
        return;
      }
    }
  };
  const shot = async (name, fullPage = true) => {
    await sleep(700);
    await page.screenshot({
      path: path.join(OUT, `${name}.png`),
      fullPage,
    });
    console.log("saved", name);
  };

  // ============ 1. Generate — single QR (light, EN) ============
  await setLang("en");
  await setTheme("light");
  await clickTab("generate");
  await pickType("Plain text");
  await fillSingle("https://github.com/nuoyax/qr-studio");
  await clickGenerate();
  await shot("generate-single");

  // ============ 2. Generate — Wi-Fi template ============
  await page.reload({ waitUntil: "networkidle0" });
  await setLang("en");
  await setTheme("light");
  await clickTab("generate");
  await pickType("Wi-Fi");
  await sleep(300);
  await page.evaluate(() => {
    const inputs = document.querySelectorAll(".form-field input");
    if (inputs[0]) {
      const set = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value"
      ).set;
      set.call(inputs[0], "GuestWiFi");
      inputs[0].dispatchEvent(new Event("input", { bubbles: true }));
      if (inputs[1]) {
        set.call(inputs[1], "welcome123");
        inputs[1].dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
  });
  await clickGenerate();
  await shot("generate-wifi");

  // ============ 3. Generate — batch (light) ============
  await page.reload({ waitUntil: "networkidle0" });
  await setLang("en");
  await setTheme("light");
  await clickTab("generate");
  await page.evaluate(() => {
    const rows = document.querySelectorAll("tbody tr");
    const set = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    ).set;
    const data = [
      "https://nuoyax.io",
      "WIFI:T:WPA;S:Home;P:secret;;",
      "tel:+8613800000000",
      "mailto:hi@nuoyax.io",
    ];
    rows.forEach((row, i) => {
      const inp = row.querySelector("input.cell-input");
      if (inp) {
        set.call(inp, data[i] ?? "");
        inp.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
  });
  await clickGenerate();
  await sleep(900);
  await shot("generate-batch");

  // ============ 4. Decode (light, EN) ============
  await page.reload({ waitUntil: "networkidle0" });
  await setLang("en");
  await setTheme("light");
  await clickTab("decode");
  await sleep(400);
  await shot("decode");

  // ============ 5. Generate — dark mode ============
  await page.reload({ waitUntil: "networkidle0" });
  await setLang("en");
  await setTheme("dark");
  await clickTab("generate");
  await pickType("Plain text");
  await fillSingle("https://github.com/nuoyax/qr-studio");
  await clickGenerate();
  await shot("generate-dark");

  // ============ 6. Generate — Chinese ============
  await page.reload({ waitUntil: "networkidle0" });
  await setLang("zh");
  await setTheme("light");
  await clickTab("生成");
  await sleep(300);
  await fillSingle("https://github.com/nuoyax/qr-studio");
  await clickGenerate();
  await shot("generate-zh");

  await browser.close();
  console.log("done");
})().catch((e) => {
  console.error("SHOT ERROR:", e);
  process.exit(1);
});
