// Renders the still image shown before the 3D is ready, from the demo itself (so it always matches).
// Needs Playwright and a running dev server:  npm run dev  then  npm run poster
// Optional: URL=http://localhost:5173 npm run poster
let chromium;
try {
  ({ chromium } = await import("@playwright/test"));
} catch {
  console.error("Install Playwright first: npm i -D @playwright/test (uses your installed Chrome, no download needed).");
  process.exit(1);
}
const url = process.env.URL ?? "http://localhost:5173";
const browser = await chromium.launch({ channel: "chrome", args: ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
await page.goto(`${url}/?c=`);
await page.waitForFunction(() => !document.body.innerText.includes("Preparing the 3D view"), null, { timeout: 30000 });
await page.waitForTimeout(800);
// Only the product: hide the overlay controls that sit on top of the canvas.
await page.addStyleTag({ content: ".views, .notice, .stage-status { display: none !important; }" });
await page.locator("canvas").screenshot({ path: "public/poster.jpg", type: "jpeg", quality: 82 });
await browser.close();
console.log("Saved public/poster.jpg");
