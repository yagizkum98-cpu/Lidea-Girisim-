import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require("playwright"); } catch { playwright = require(join(tmpdir(), "lidea-browser-tools/node_modules/playwright")); }
const origin = process.env.LIDEA_TEST_URL || "http://localhost:3010";
const browser = await playwright.chromium.launch({ channel: "chrome", headless: true });
try {
  const anonymous = await browser.newContext();
  for (const path of ["/admin", "/admin/basvurular", "/admin/ayarlar", "/girisimci", "/lideacheck"]) {
    const response = await anonymous.request.get(origin + path, { maxRedirects: 0 });
    assert.equal(response.status(), 307, `Anonymous access to ${path}`);
    assert.ok(response.headers().location.includes("/giris?next="));
  }
  for (const path of ["/api/auth/admin", "/api/auth/entrepreneur", "/api/applications", "/api/startups", "/api/entrepreneur/me"]) {
    assert.equal((await anonymous.request.get(origin + path)).status(), 401, `Anonymous API ${path}`);
  }
  const forged = await browser.newContext();
  await forged.addCookies([{ name: "lidea-session", value: "forged-token", url: origin }]);
  assert.equal((await forged.request.get(origin + "/admin", { maxRedirects: 0 })).status(), 307);
  await forged.close();
  const page = await anonymous.newPage();
  await page.goto(origin + "/admin");
  await page.getByLabel("E-posta", { exact: true }).fill("admin@lideagirisim.com");
  await page.getByLabel("Şifre", { exact: true }).fill("wrong-password");
  await page.getByRole("button", { name: "Giriş Yap", exact: true }).click();
  await page.getByRole("alert").waitFor();
  await page.getByLabel("Şifre", { exact: true }).fill("lideagirisim2027!");
  await page.getByRole("button", { name: "Giriş Yap", exact: true }).click();
  await page.waitForURL(origin + "/admin");
  await page.getByRole("navigation", { name: "Panel erişimi" }).waitFor();
  for (const [name, path] of [["Girişimci Paneli", "/girisimci"], ["Lidea Check", "/lideacheck"], ["Admin Paneli", "/admin"]]) {
    await page.getByRole("navigation", { name: "Panel erişimi" }).getByRole("link", { name, exact: true }).click();
    await page.waitForURL(origin + path);
    await page.getByRole("navigation", { name: "Panel erişimi" }).waitFor();
  }
  await page.screenshot({ path: join(tmpdir(), "lidea-auth-admin-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  const nav = page.getByRole("navigation", { name: "Panel erişimi" });
  assert.equal(await nav.evaluate((node) => node.scrollWidth > node.clientWidth), false, "Panel navigation fits mobile");
  await page.screenshot({ path: join(tmpdir(), "lidea-auth-admin-mobile.png") });
  await nav.getByRole("button", { name: "Çıkış Yap", exact: true }).click();
  await page.waitForURL(origin + "/giris");
  assert.equal((await anonymous.request.get(origin + "/api/auth/admin")).status(), 401);
  assert.equal((await anonymous.request.get(origin + "/admin", { maxRedirects: 0 })).status(), 307);
  for (const endpoint of ["admin", "entrepreneur"]) {
    assert.equal((await anonymous.request.post(origin + "/api/auth/" + endpoint, { data: { email: "tester@lideagirisim.com", password: "1234567890" } })).status(), 401);
    const result = await anonymous.request.post(origin + "/api/auth/" + endpoint, { data: { email: "tester@lideagirisim.com", password: "lideagirisim2027!" } });
    assert.equal(result.status(), 200);
    const cookie = (await anonymous.cookies()).find((item) => item.name === "lidea-session");
    assert.ok(cookie.httpOnly); assert.equal(cookie.sameSite, "Lax");
    for (const path of ["/admin", "/girisimci", "/lideacheck"]) assert.equal((await anonymous.request.get(origin + path)).status(), 200);
    await anonymous.request.delete(origin + "/api/auth/" + endpoint);
  }
  await anonymous.close();
  console.log("PASS: login required, protected APIs, forged/wrong credentials, admin/tester access, logout and responsive navigation");
} finally { await browser.close(); }
