#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find git repo root
let repoRoot;
try {
  repoRoot = execSync('git rev-parse --show-toplevel', { cwd: __dirname, encoding: 'utf8' }).trim();
} catch {
  repoRoot = path.resolve(__dirname, '..');
}

// Load esbuild and prettier dynamically
let esbuild, prettier;
try {
  esbuild = await import('esbuild');
} catch {
  try {
    esbuild = await import('file:///C:/Users/shivani/AppData/Local/npm-cache/_npx/beb367dfa21eb3f5/node_modules/esbuild/lib/main.js');
  } catch (e) {
    console.error('Failed to load esbuild:', e.message);
  }
}

try {
  prettier = await import('prettier');
} catch {
  try {
    prettier = await import('file:///C:/Users/shivani/AppData/Local/npm-cache/_npx/b388654678d519d9/node_modules/prettier/index.mjs');
  } catch (e) {
    console.error('Failed to load prettier:', e.message);
  }
}

const BASE_COMMIT = '51983f8';

function normalizeCode(rawCode) {
  // Strip .js/.jsx/.ts/.tsx extensions from imports and exports
  let code = rawCode.replace(/(from\s+['"][^'"]*?)\.(jsx?|tsx?)(['"])/g, '$1$3');
  // Dynamic imports: import('./foo.jsx') -> import('./foo')
  code = code.replace(/(import\s*\(\s*['"][^'"]*?)\.(jsx?|tsx?)(['"]\s*\))/g, '$1$3');
  // Strip CSS import difference if any, but CSS imports shouldn't change
  return code;
}

function normalizeEmittedCode(code) {
  // esbuild's tsx loader elides `import React from 'react'` when React is unused,
  // whereas jsx loader keeps it. If React is not referenced in the code body, normalize it out.
  const codeWithoutImports = code.replace(/^import\s+[^;]+;\r?\n?/gm, '');
  const reactUsed = /\bReact\b/.test(codeWithoutImports);
  if (!reactUsed) {
    code = code
      .replace(/^import\s+React\s+from\s+['"]react['"];?\r?\n?/gm, '')
      .replace(/^import\s+React\s*,\s*\{([^}]+)\}\s*from\s+['"]react['"];?/gm, (_, inner) => `import { ${inner.trim()} } from 'react';`);
  }
  return code.trim();
}

export async function transformAndFormat(code, filePath, isTs) {
  const ext = path.extname(filePath);
  const isJsx = ext === '.jsx' || ext === '.tsx' || (code.includes('<') && (code.includes('/>') || code.includes('</')));
  const loader = isJsx ? (isTs ? 'tsx' : 'jsx') : (isTs ? 'ts' : 'js');

  const normalized = normalizeCode(code);
  const transformed = await esbuild.transform(normalized, {
    loader,
    jsx: 'automatic',
    format: 'esm',
    target: 'esnext',
  });

  // Prettify the emitted JS
  const prettified = await prettier.format(transformed.code, {
    parser: 'babel',
    semi: true,
    singleQuote: true,
    trailingComma: 'es5',
  });

  return normalizeEmittedCode(prettified);
}

export function getBaseContent(basePath) {
  try {
    return execSync(`git -C "${repoRoot}" show ${BASE_COMMIT}:"${basePath}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
}

export function findBaseEquivalent(headPath) {
  const normHead = headPath.replace(/\\/g, '/');
  const candidateExts = ['.jsx', '.js', '.tsx', '.ts'];
  const baseWithoutExt = normHead.replace(/\.(tsx?|jsx?)$/, '');
  for (const ext of candidateExts) {
    const candidate = baseWithoutExt + ext;
    const content = getBaseContent(candidate);
    if (content !== null) return { basePath: candidate, content };
  }

  // Also check if original was in src/ before client/ restructuring
  if (normHead.startsWith('client/src/')) {
    const legacyPath = normHead.replace('client/src/', 'src/');
    const legacyWithoutExt = legacyPath.replace(/\.(tsx?|jsx?)$/, '');
    for (const ext of candidateExts) {
      const candidate = legacyWithoutExt + ext;
      const content = getBaseContent(candidate);
      if (content !== null) return { basePath: candidate, content };
    }
  }

  return null;
}

export function printUnifiedDiff(file, baseStr, headStr) {
  const baseLines = baseStr.split('\n');
  const headLines = headStr.split('\n');

  console.log(`\n--- BASE (${BASE_COMMIT})`);
  console.log(`+++ HEAD (${file})`);

  const max = Math.max(baseLines.length, headLines.length);
  let diffCount = 0;
  for (let i = 0; i < max; i++) {
    const b = baseLines[i] ?? '<EOF>';
    const h = headLines[i] ?? '<EOF>';
    if (b !== h) {
      diffCount++;
      console.log(`\nDiff at line ${i + 1}:`);
      console.log(`- ${b}`);
      console.log(`+ ${h}`);
      if (diffCount >= 5) {
        console.log(`... and more diff lines`);
        break;
      }
    }
  }
}

export async function checkFileEquivalence(headPath, explicitBasePath = null) {
  const normHead = headPath.replace(/\\/g, '/');
  let baseInfo = null;

  if (explicitBasePath) {
    const content = getBaseContent(explicitBasePath);
    if (content !== null) baseInfo = { basePath: explicitBasePath, content };
  } else {
    baseInfo = findBaseEquivalent(normHead);
  }

  if (!baseInfo) {
    return {
      file: normHead,
      status: 'SKIP',
      reason: 'No BASE equivalent found (new file in HEAD)',
    };
  }

  const fullHeadPath = path.resolve(repoRoot, normHead);
  if (!fs.existsSync(fullHeadPath)) {
    return {
      file: normHead,
      status: 'FAIL',
      reason: `HEAD file does not exist on disk: ${fullHeadPath}`,
    };
  }

  const headContent = fs.readFileSync(fullHeadPath, 'utf8');

  try {
    const isHeadTs = normHead.endsWith('.ts') || normHead.endsWith('.tsx');
    const isBaseTs = baseInfo.basePath.endsWith('.ts') || baseInfo.basePath.endsWith('.tsx');

    const baseEmitted = await transformAndFormat(baseInfo.content, baseInfo.basePath, isBaseTs);
    const headEmitted = await transformAndFormat(headContent, normHead, isHeadTs);

    if (baseEmitted === headEmitted) {
      return { file: normHead, basePath: baseInfo.basePath, status: 'PASS' };
    } else {
      return {
        file: normHead,
        basePath: baseInfo.basePath,
        status: 'FAIL',
        baseEmitted,
        headEmitted,
      };
    }
  } catch (err) {
    return {
      file: normHead,
      basePath: baseInfo.basePath,
      status: 'ERROR',
      reason: err.message,
    };
  }
}

async function run() {
  const args = process.argv.slice(2);
  const isAll = args.includes('--all');
  const nonFlags = args.filter((a) => !a.startsWith('--'));

  console.log(`=== Equivalence Gate (BASE: ${BASE_COMMIT}) ===`);

  if (!isAll && nonFlags.length === 2) {
    // Explicit pair: node scripts/ts-equiv-check.mjs <basePath> <headPath>
    const basePath = nonFlags[0];
    const headPath = nonFlags[1];
    const res = await checkFileEquivalence(headPath, basePath);
    if (res.status === 'PASS') {
      console.log(`PASS: ${headPath} is equivalent to ${basePath}`);
      process.exit(0);
    } else {
      console.error(`FAIL: ${headPath} differs from ${basePath}`);
      if (res.baseEmitted && res.headEmitted) {
        printUnifiedDiff(headPath, res.baseEmitted, res.headEmitted);
      } else if (res.reason) {
        console.error(res.reason);
      }
      process.exit(1);
    }
  }

  // Get all files from git
  const gitFiles = execSync(`git -C "${repoRoot}" ls-files client/src/`, { encoding: 'utf8' })
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  let targetFiles = gitFiles.filter((f) => /\.(ts|tsx)$/.test(f));

  // If a path/filter is provided without --all
  if (nonFlags.length === 1) {
    const filterNorm = nonFlags[0].replace(/\\/g, '/');
    targetFiles = targetFiles.filter((f) => f.includes(filterNorm));
  }

  // Skip files in dashboard/ by default unless explicitly targeted
  const explicitTarget = nonFlags[0] ? nonFlags[0].replace(/\\/g, '/') : '';
  if (!explicitTarget.includes('dashboard')) {
    targetFiles = targetFiles.filter((f) => !f.includes('client/src/dashboard/'));
  }

  // Also skip types/index.ts and vite-env.d.ts since they are type-only declarations without BASE runtime code
  targetFiles = targetFiles.filter((f) => !f.endsWith('.d.ts') && !f.endsWith('types/index.ts'));

  console.log(`Checking ${targetFiles.length} TypeScript file(s)...`);

  let passCount = 0;
  let failCount = 0;
  let skipCount = 0;
  const failures = [];

  for (const f of targetFiles) {
    const res = await checkFileEquivalence(f);
    if (res.status === 'PASS') {
      passCount++;
      console.log(`  [PASS] ${f}`);
    } else if (res.status === 'SKIP') {
      skipCount++;
      console.log(`  [SKIP] ${f} (${res.reason})`);
    } else {
      failCount++;
      console.log(`  [FAIL] ${f}`);
      failures.push(res);
    }
  }

  console.log(`\n--- Summary: ${passCount} PASS, ${failCount} FAIL, ${skipCount} SKIP ---`);

  if (failCount > 0) {
    console.log('\n=== FAILURES DETAIL ===');
    for (const f of failures) {
      console.log(`\nFailure in ${f.file} (BASE: ${f.basePath}):`);
      if (f.baseEmitted && f.headEmitted) {
        printUnifiedDiff(f.file, f.baseEmitted, f.headEmitted);
      } else if (f.reason) {
        console.log(`  Error: ${f.reason}`);
      }
    }
    process.exit(1);
  }

  process.exit(0);
}

run().catch((err) => {
  console.error('Equivalence check execution failed:', err);
  process.exit(1);
});
