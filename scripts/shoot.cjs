const puppeteer = require("puppeteer-core");
const path = require("path");
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const OUT = "C:\\Users\\MEDSAI~1\\AppData\\Local\\Temp\\claude\\C--Users-Med-Saief-Allah-Desktop-Bloomy-website\\ad18162b-8806-4004-94e9-6d4dbc615caa\\scratchpad";
const BASE = "http://localhost:3000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox", "--disable-gpu", "--force-prefers-reduced-motion"] });
  const page = await browser.newPage();
  const shot = async (n) => { await page.screenshot({ path: path.join(OUT, n) }); console.log("📸", n); };
  try {
    await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 1 });
    await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 90000 }); await sleep(900); await shot("gray-home.png");
    await page.goto(BASE + "/produit/sauvage", { waitUntil: "networkidle2" }); await sleep(800); await shot("gray-pdp.png");
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await page.goto(BASE + "/", { waitUntil: "networkidle2" }); await sleep(700); await shot("gray-mobile.png");
  } catch (e) { console.error("ERR", e.message); }
  finally { await browser.close(); }
})();
