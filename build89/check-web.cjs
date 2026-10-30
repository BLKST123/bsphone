const fs = require("node:fs");
const assert = require("node:assert/strict");
const path = require("node:path");
const publicRoot = path.resolve(__dirname, "native/app/src/main/assets/public");
const html = fs.readFileSync(path.join(publicRoot, "index.html"), "utf8");
const sourceHtml = fs.readFileSync(path.resolve(__dirname, "..", "index.html"), "utf8");
assert.equal(html, sourceHtml, "APK asset differs from _ghpages/index.html");
const localRefs = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/gi)]
  .map(match => match[1].trim())
  .filter(ref => ref && !/^(?:data:|blob:|https?:|javascript:|#)/i.test(ref))
  .map(ref => decodeURIComponent(ref.split(/[?#]/)[0]))
  .filter(Boolean);
for (const ref of new Set(localRefs)) {
  assert.ok(fs.existsSync(path.join(publicRoot, ref)), `missing packaged asset: ${ref}`);
}
for (const required of [
  "core/store/core-store.js",
  "core/store/readonly-store.js"
]) {
  assert.ok(fs.existsSync(path.join(publicRoot, required)), `missing store file: ${required}`);
}
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1])
  .filter((code) => code.trim());
for (const [index, code] of scripts.entries()) {
  try {
    new Function(code);
  } catch (error) {
    throw new Error(`inline script ${index + 1}: ${error.message}`);
  }
}
for (const marker of [
  "NativeHttp.request",
  "NativeHttp.cancel",
  "window.BSNativeHttp",
  "nativeHttpAvailable()",
  "chatTextFromResponse",
  "const BUILD_CODE=89",
  "window.BSBootAssertions"
]) {
  if (!html.includes(marker)) throw new Error(`missing marker: ${marker}`);
}
const normBaseSource = html.match(/function normBase\(u\)\{[\s\S]*?\n\}/)?.[0];
const isVersionedSource = html.match(/function isVersioned\(b\)\{[\s\S]*?\n\}/)?.[0];
const chatCandidatesSource = html.match(/function chatCandidates\(base\)\{[\s\S]*?\n\}/)?.[0];
if (!normBaseSource || !isVersionedSource || !chatCandidatesSource) throw new Error("API URL helpers missing");
const apiHelpers = new Function(`${normBaseSource}\n${isVersionedSource}\n${chatCandidatesSource}\nreturn {normBase,chatCandidates};`)();
assert.equal(apiHelpers.normBase("https://api.jumengai.net/pricing"), "https://api.jumengai.net");
assert.deepEqual(apiHelpers.chatCandidates("https://api.jumengai.net"), [
  "https://api.jumengai.net/chat/completions",
  "https://api.jumengai.net/v1/chat/completions"
]);
assert.deepEqual(apiHelpers.chatCandidates("https://api.jumengai.net/v1"), [
  "https://api.jumengai.net/v1/chat/completions"
]);
const apiFriendlySource = html.match(/function apiFriendly\(status,msg\)\{[\s\S]*?\n\}/)?.[0];
const chatTextSource = html.match(/function chatTextFromResponse\(txt,status,ok\)\{[\s\S]*?\n\}/)?.[0];
const responseStart = html.indexOf("function usageNumber(");
const responseEnd = html.indexOf("function chatTextFromResponse(");
const responseCore = responseStart >= 0 && responseEnd > responseStart ? html.slice(responseStart, responseEnd) : "";
if (!apiFriendlySource || !chatTextSource || !responseCore) throw new Error("response helpers missing");
const responseHelpers = new Function(`${apiFriendlySource}\n${responseCore}\n${chatTextSource}\nreturn {chatTextFromResponse};`)();
assert.equal(
  responseHelpers.chatTextFromResponse('{"choices":[{"message":{"content":" 好 "}}]}', 200, true),
  "好"
);
assert.throws(
  () => responseHelpers.chatTextFromResponse('{"error":{"message":"bad key"}}', 401, false),
  /API Key/
);
console.log(JSON.stringify({ ok: true, scripts: scripts.length, localRefs: [...new Set(localRefs)], bytes: Buffer.byteLength(html), apiUrls: true, storeAssets: true }));
