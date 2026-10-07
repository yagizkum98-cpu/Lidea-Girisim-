import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
const require = createRequire(import.meta.url);
let playwright;
try { playwright = require("playwright"); } catch { playwright = require(join(tmpdir(), "lidea-browser-tools/node_modules/playwright")); }
const browser = await playwright.chromium.launch({ channel: "chrome", headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(process.env.LIDEA_TEST_URL || "http://localhost:3002/girisimci");
  const profile = page.getByRole("region", { name: "Profil Tamamlama", exact: true });
  await profile.getByText("0 / 10 alan dolu", { exact: true }).waitFor();
  assert.equal(await profile.getByRole("button", { name: /düzenle$/ }).count(), 10);
  const dialog = page.getByRole("dialog");
  async function open(label) { await profile.getByRole("button", { name: `${label} düzenle`, exact: true }).click(); await dialog.waitFor(); }
  async function save() { await dialog.getByRole("button", { name: "Kaydet", exact: true }).click(); await dialog.waitFor({ state: "hidden" }); }
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: 32, height: 32 } });
  await open("Logo");
  await dialog.getByLabel("Logo yükle").setInputFiles({ name: "bad.png", mimeType: "image/png", buffer: Buffer.from("not a real image") });
  await dialog.getByRole("alert").waitFor();
  await dialog.getByLabel("Logo yükle").setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: png });
  await dialog.getByAltText("Girişim logosu önizleme").waitFor(); await save();
  await profile.getByText("1 / 10 alan dolu", { exact: true }).waitFor();
  await page.reload(); await profile.getByText("1 / 10 alan dolu", { exact: true }).waitFor();
  await open("Temel Bilgiler"); await dialog.getByLabel("Girişim adı", { exact: true }).fill("Test Girişimi"); await dialog.getByLabel("Kurucu adı", { exact: true }).fill("Test Kurucu"); await save();
  await open("Sektör"); await dialog.getByLabel("Sektör kategorisi").selectOption("Yapay Zeka"); await save();
  await open("Aşama"); await dialog.getByLabel("TRL seviyesi").selectOption("TRL 4"); await save();
  await open("Web Sitesi"); await dialog.getByLabel("Web Sitesi", { exact: true }).fill("https://example.com"); await save();
  for (const label of ["Problem", "Çözüm", "İş Modeli", "Traction"]) { await open(label); await dialog.getByLabel(label, { exact: true }).fill(`${label} metni`); await save(); }
  await open("Ekip"); await dialog.getByRole("button", { name: "Ekip Üyesi Ekle" }).click(); await dialog.getByLabel("Ad soyad").fill("Ekip Üyesi"); await dialog.getByLabel("Rol", { exact: true }).fill("Kurucu"); await dialog.getByLabel("Unvan").fill("CEO"); await save();
  await profile.getByText("10 / 10 alan dolu", { exact: true }).waitFor();
  await page.reload(); await profile.getByText("10 / 10 alan dolu", { exact: true }).waitFor();
  await open("Problem"); assert.equal(await dialog.getByLabel("Problem", { exact: true }).inputValue(), "Problem metni"); await dialog.getByLabel("Problem", { exact: true }).fill("Kaydedilmemeli"); await dialog.getByRole("button", { name: "Vazgeç", exact: true }).click();
  await open("Problem"); assert.equal(await dialog.getByLabel("Problem", { exact: true }).inputValue(), "Problem metni"); await page.keyboard.press("Escape"); await dialog.waitFor({ state: "hidden" });
  await profile.screenshot({ path: join(tmpdir(), "lidea-profile-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 }); await open("Ekip");
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  const bounds = await dialog.boundingBox(); assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 390);
  await page.screenshot({ path: join(tmpdir(), "lidea-profile-mobile.png") });
  await dialog.getByRole("button", { name: "Üyeyi Sil", exact: true }).click(); await save(); await profile.getByText("9 / 10 alan dolu", { exact: true }).waitFor();
  const unauthenticated = await page.request.patch("http://localhost:3002/api/entrepreneur/profile", { data: { name: "Other" } }); assert.equal(unauthenticated.status(), 401);
  console.log("PASS: 10 profile dialogs, PNG validation/upload, categories, TRL, team, completion, persistence, cancel/Escape, mobile and API authentication.");
} catch (error) {
  const pages = browser.contexts().flatMap((context) => context.pages());
  if (pages[0]) { console.log((await pages[0].getByRole("dialog").allTextContents()).join("\n")); await pages[0].screenshot({ path: join(tmpdir(), "lidea-profile-failure.png") }); }
  throw error;
} finally { await browser.close(); }
