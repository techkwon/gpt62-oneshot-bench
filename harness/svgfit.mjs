// ep7 svg: whole drawing fitted in 1280x800 (object-fit: contain), same for every model -> rec/ep7-svg-<m>.png
const fs = await import("node:fs");
const B = "/Users/techkwon/Developer/MyApps/Youtube/gpt62-lecture/samples";
const task = await taskSpace("gpt62 svgfit"); const page = task.page("p1");
await page.cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
for (const m of ["fable","opus","gpt61","astra","sol"]) {
  await page.goto(`http://127.0.0.1:8766/ep7-svgfit/${m}/index.html`, { timeout: 30000 }); await page.waitForTimeout(1200);
  const r = await page.cdp("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(`${B}/rec/ep7-svg-${m}.png`, Buffer.from(r.data, "base64")); console.log("svg", m);
}
await task.finish({ keep: [] });
