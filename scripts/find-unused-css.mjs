import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const srcDir = path.join(rootDir, 'src');

// 1. Gather all JS, JSX, HTML source files
function getSourceFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getSourceFiles(fullPath));
    } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.html')) {
      results.push(fullPath);
    }
  }
  return results;
}

const sourceFiles = getSourceFiles(srcDir);
const sourceContents = sourceFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');

// 2. Read App.css
const appCssPath = path.join(srcDir, 'App.css');
const appCssContent = fs.readFileSync(appCssPath, 'utf8');

// 3. Extract CSS classes from App.css
const classRegex = /\.([a-zA-Z0-9_-]+)/g;
const foundClasses = new Set();
let match;
while ((match = classRegex.exec(appCssContent)) !== null) {
  foundClasses.add(match[1]);
}

console.log(`Total unique classes in App.css: ${foundClasses.size}`);

const usedClasses = new Set();
const unusedClasses = new Set();

for (const cls of foundClasses) {
  // Check if class exists in JS/JSX files
  // Match as word or in className
  const wordRegex = new RegExp(`\\b${cls}\\b`);
  if (wordRegex.test(sourceContents)) {
    usedClasses.add(cls);
  } else {
    unusedClasses.add(cls);
  }
}

console.log(`Used classes: ${usedClasses.size}`);
console.log(`Unused classes: ${unusedClasses.size}`);

// Write analysis report to artifacts/ui/unused-css.json
const reportDir = path.join(rootDir, 'artifacts', 'ui');
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(
  path.join(reportDir, 'unused-css.json'),
  JSON.stringify(
    {
      totalUniqueClasses: foundClasses.size,
      usedCount: usedClasses.size,
      unusedCount: unusedClasses.size,
      usedClasses: Array.from(usedClasses).sort(),
      unusedClasses: Array.from(unusedClasses).sort(),
    },
    null,
    2
  )
);

console.log(`Report written to artifacts/ui/unused-css.json`);
