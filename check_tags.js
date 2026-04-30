// HTML structure + JS syntax check for index.html
// - Verifies HTML tags are balanced (ignoring void elements and content inside <script>/<style>)
// - Extracts each inline <script> body and runs it through Node's syntax checker (acorn-based)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const os = require('os');

const FILE = path.resolve(__dirname, 'index.html');
const html = fs.readFileSync(FILE, 'utf8');
const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);

const stripped = html
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, m => m.match(/<script\b[^>]*>/)[0] + '</script>')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/g,  m => m.match(/<style\b[^>]*>/)[0]  + '</style>')
  .replace(/<!--[\s\S]*?-->/g, '');

let problems = 0;
const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)(?:\s[^>]*)?\/?>/g;
const stack = [];
let m;
while ((m = tagRe.exec(stripped))) {
  const full = m[0];
  const name = m[1].toLowerCase();
  if (VOID.has(name) || full.endsWith('/>')) continue;
  if (full.startsWith('</')) {
    if (!stack.length) { console.log('CLOSE without OPEN: </' + name + '>'); problems++; }
    else if (stack.at(-1).name !== name) { console.log('MISMATCH: <' + stack.at(-1).name + '> closed by </' + name + '>'); problems++; stack.pop(); }
    else stack.pop();
  } else {
    stack.push({ name });
  }
}
if (stack.length) { console.log('UNCLOSED:', stack.map(s => s.name).join(', ')); problems += stack.length; }

const scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/g;
let i = 0;
while ((m = scriptRe.exec(html))) {
  if (/\bsrc=/.test(m[1])) continue;
  i++;
  const tmp = path.join(os.tmpdir(), `__camping_script_${i}.mjs`);
  fs.writeFileSync(tmp, m[2]);
  try {
    execFileSync(process.execPath, ['--check', tmp], { stdio: 'pipe' });
  } catch (e) {
    console.log(`SCRIPT #${i} parse error:\n` + (e.stderr ? e.stderr.toString() : e.message));
    problems++;
  } finally {
    try { fs.unlinkSync(tmp); } catch {}
  }
}

if (!problems) console.log('OK — tags balanced, scripts parse cleanly.');
process.exit(problems ? 1 : 0);
