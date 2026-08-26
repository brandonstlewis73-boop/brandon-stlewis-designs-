import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const failures = [];
const warnings = [];

function read(file) {
  return readFileSync(join(root, file), "utf8");
}

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

const html = read("index.html");
const css = read("styles.css");
const js = read("script.js");
const manifest = JSON.parse(read("manifest.webmanifest"));
const sitemap = read("sitemap.xml");
const robots = read("robots.txt");
const vercel = JSON.parse(read("vercel.json"));

if (!html.includes('rel="canonical" href="https://www.brandonstlewisdesign.shop/"')) {
  fail("Canonical URL is not the production www URL.");
}

if (!html.includes('property="og:image" content="https://www.brandonstlewisdesign.shop/assets/')) {
  fail("Open Graph image is not an absolute production URL.");
}

if (html.includes("www.paypal.com/sdk/js")) {
  fail("PayPal SDK is still loaded globally in index.html.");
}

if (html.includes("importmap") || html.includes("unpkg.com/three") || js.includes("unpkg.com/three")) {
  fail("Three.js/importmap global loading is still present.");
}

if (/Example client review/i.test(html)) {
  fail("Example client review placeholder text is still present.");
}

if (/214748/.test(css)) {
  fail("Extreme z-index values are still present in CSS.");
}

if ((css.match(/!important/g) || []).length > 0) {
  fail("CSS still contains !important declarations.");
}

const requiredRoutes = ["/services", "/projects", "/process", "/pricing", "/policies", "/contact", "/reviews"];
for (const route of requiredRoutes) {
  if (!html.includes(`href="${route}"`) && !html.includes(`href='${route}'`)) {
    warn(`No visible href found for route ${route}.`);
  }
  if (!sitemap.includes(`https://www.brandonstlewisdesign.shop${route}`)) {
    fail(`Sitemap missing ${route}.`);
  }
}

if (!robots.includes("https://www.brandonstlewisdesign.shop/sitemap.xml")) {
  fail("robots.txt does not point to the production sitemap.");
}

for (const asset of html.matchAll(/(?:src|href)="\/?(assets\/[^"]+)"/g)) {
  if (!existsSync(join(root, asset[1]))) {
    fail(`Missing referenced asset: ${asset[1]}`);
  }
}

for (const file of ["robots.txt", "sitemap.xml", "404.html", "vercel.json"]) {
  if (!existsSync(join(root, file))) fail(`Missing production support file: ${file}`);
}

if (manifest.start_url !== "/" || manifest.scope !== "/") {
  fail("Manifest start_url/scope should remain rooted at /.");
}

const rewriteDestinations = new Set((vercel.rewrites || []).map((rewrite) => rewrite.destination));
if (!rewriteDestinations.has("/")) {
  fail("vercel.json does not rewrite app routes to the SPA entry.");
}

for (const endpoint of [
  "api/contact.js",
  "api/review.js",
  "api/paypal-config.js",
  "api/create-paypal-order.js",
  "api/capture-paypal-order.js",
]) {
  if (!existsSync(join(root, endpoint))) fail(`Missing API endpoint: ${endpoint}`);
}

if (!js.includes("window.BSDTrack")) {
  fail("Analytics hook window.BSDTrack is missing.");
}

if (warnings.length) {
  console.warn("Warnings:");
  warnings.forEach((message) => console.warn(`- ${message}`));
}

if (failures.length) {
  console.error("Audit failed:");
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log("Static production audit passed.");
