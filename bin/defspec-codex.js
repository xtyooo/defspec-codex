#!/usr/bin/env node

import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PKG = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
const SKILLS_SRC = resolve(ROOT, 'skills');
const DOCS_SRC = resolve(ROOT, 'templates', 'docs', 'defspec');
const AGENTS_SECTION_SRC = resolve(ROOT, 'templates', 'agents', 'AGENTS.section.md');
const PROJECT_DIR = process.cwd();
const CODEX_SKILLS_DIR = resolve(homedir(), '.agents', 'skills', 'defspec');

const SENTINEL_BEGIN = '<!-- defspec-codex:begin (do not edit between these markers) -->';
const SENTINEL_END = '<!-- defspec-codex:end -->';

function copyDirSync(src, dest) {
  let realSrc = src;
  try {
    realSrc = realpathSync(src);
  } catch {}

  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(realSrc, { withFileTypes: true })) {
    if (entry.name === '.DS_Store') continue;
    const srcPath = join(realSrc, entry.name);
    const destPath = join(dest, entry.name);
    let stat;
    try {
      stat = lstatSync(srcPath);
    } catch {
      continue;
    }
    if (stat.isSymbolicLink()) {
      try {
        const real = realpathSync(srcPath);
        const realStat = lstatSync(real);
        if (realStat.isDirectory()) copyDirSync(real, destPath);
        else copyFileSync(real, destPath);
      } catch {}
    } else if (stat.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else if (stat.isFile()) {
      copyFileSync(srcPath, destPath);
    }
  }
}

function countSkillDirs(dir) {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir, { withFileTypes: true }).filter((entry) => {
    return entry.isDirectory() && existsSync(resolve(dir, entry.name, 'SKILL.md'));
  }).length;
}

function sourceSkillNames() {
  return readdirSync(SKILLS_SRC, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function isHomeDir(path) {
  try {
    return realpathSync(path).toLowerCase() === realpathSync(homedir()).toLowerCase();
  } catch {
    return resolve(path).toLowerCase() === resolve(homedir()).toLowerCase();
  }
}

function showHelp() {
  console.log(`
defspec-codex v${PKG.version}

Usage:
  npx defspec-codex                 Install Codex skills and initialize this project
  npx defspec-codex --skills-only   Install/update global Codex skills only
  npx defspec-codex --init-only     Initialize current project only
  npx defspec-codex --check         Check current installation
  npx defspec-codex --uninstall     Remove current project DefSpec files
  npx defspec-codex --uninstall --skills-only
  npx defspec-codex --yes           Overwrite existing template files
  npx defspec-codex --force         Allow project init in home directory

After installing, restart Codex and type /defspec to discover DefSpec action skills.
`);
}

function replaceSentinelSection(content, section) {
  const start = content.indexOf(SENTINEL_BEGIN);
  if (start === -1) {
    return `${content.replace(/\s+$/, '')}\n\n${section.trim()}\n`;
  }
  const end = content.indexOf(SENTINEL_END, start);
  if (end === -1) {
    throw new Error('AGENTS.md contains a defspec-codex begin marker without an end marker.');
  }
  const afterEnd = end + SENTINEL_END.length;
  return `${content.slice(0, start).replace(/\s+$/, '')}\n\n${section.trim()}\n${content.slice(afterEnd).replace(/^\s+/, '\n')}`;
}

function removeSentinelSection(content) {
  const start = content.indexOf(SENTINEL_BEGIN);
  if (start === -1) return { content, removed: false };
  const end = content.indexOf(SENTINEL_END, start);
  if (end === -1) {
    throw new Error('AGENTS.md contains a defspec-codex begin marker without an end marker.');
  }
  return {
    content: `${content.slice(0, start).replace(/\s+$/, '')}${content.slice(end + SENTINEL_END.length).replace(/^\s+/, '\n')}`.trimEnd() + '\n',
    removed: true,
  };
}

function installSkills() {
  if (!existsSync(SKILLS_SRC)) throw new Error(`Missing skills source: ${SKILLS_SRC}`);
  mkdirSync(CODEX_SKILLS_DIR, { recursive: true });
  copyDirSync(SKILLS_SRC, CODEX_SKILLS_DIR);
  console.log(`  ✅ Codex skills: ${countSkillDirs(CODEX_SKILLS_DIR)} installed -> ${CODEX_SKILLS_DIR}`);
}

function initProject({ force, yes }) {
  if (!force && isHomeDir(PROJECT_DIR)) {
    throw new Error(`Refusing to initialize home directory: ${PROJECT_DIR}. Run from a project directory or pass --force.`);
  }

  const docsDest = resolve(PROJECT_DIR, 'docs', 'defspec');
  if (existsSync(docsDest) && !yes) {
    console.log(`  ℹ️  docs/defspec already exists; keeping existing files. Pass --yes to overwrite templates.`);
  } else {
    mkdirSync(resolve(PROJECT_DIR, 'docs'), { recursive: true });
    copyDirSync(DOCS_SRC, docsDest);
    console.log(`  ✅ Project docs -> ${docsDest}`);
  }

  const agentsPath = resolve(PROJECT_DIR, 'AGENTS.md');
  const section = readFileSync(AGENTS_SECTION_SRC, 'utf8');
  const existing = existsSync(agentsPath) ? readFileSync(agentsPath, 'utf8') : '# Codex Project Guide\n';
  const next = replaceSentinelSection(existing, section);
  if (next !== existing) {
    writeFileSync(agentsPath, next, 'utf8');
    console.log(`  ✅ AGENTS.md updated -> ${agentsPath}`);
  } else {
    console.log('  ✅ AGENTS.md already up to date');
  }
}

function checkInstall() {
  const names = sourceSkillNames();
  console.log(`\ndefspec-codex v${PKG.version} check\n`);
  console.log(`  Project: ${PROJECT_DIR}`);
  console.log(`  Global skill dir: ${CODEX_SKILLS_DIR}`);
  for (const name of names) {
    const ok = existsSync(resolve(CODEX_SKILLS_DIR, name, 'SKILL.md'));
    console.log(`  ${ok ? '✅' : '❌'} skill ${name}`);
  }
  console.log(`  ${existsSync(resolve(PROJECT_DIR, 'docs', 'defspec', 'DEFSPEC.md')) ? '✅' : '❌'} docs/defspec`);
  const agentsPath = resolve(PROJECT_DIR, 'AGENTS.md');
  const hasAgents = existsSync(agentsPath) && readFileSync(agentsPath, 'utf8').includes(SENTINEL_BEGIN);
  console.log(`  ${hasAgents ? '✅' : '❌'} AGENTS.md bootstrap`);
}

function uninstallSkills() {
  if (!existsSync(CODEX_SKILLS_DIR)) {
    console.log(`  ℹ️  No global DefSpec skills found at ${CODEX_SKILLS_DIR}`);
    return;
  }
  let removed = 0;
  const names = new Set(sourceSkillNames());
  for (const entry of readdirSync(CODEX_SKILLS_DIR, { withFileTypes: true })) {
    if (entry.isDirectory() && names.has(entry.name)) {
      rmSync(resolve(CODEX_SKILLS_DIR, entry.name), { recursive: true, force: true });
      removed++;
    }
  }
  try {
    if (readdirSync(CODEX_SKILLS_DIR).length === 0) rmSync(CODEX_SKILLS_DIR, { recursive: true, force: true });
  } catch {}
  console.log(`  ✅ Removed ${removed} global DefSpec skills`);
}

function uninstallProject() {
  const agentsPath = resolve(PROJECT_DIR, 'AGENTS.md');
  if (existsSync(agentsPath)) {
    const result = removeSentinelSection(readFileSync(agentsPath, 'utf8'));
    if (result.removed) {
      writeFileSync(agentsPath, result.content, 'utf8');
      console.log(`  ✅ Removed AGENTS.md bootstrap -> ${agentsPath}`);
    }
  }

  const docsDest = resolve(PROJECT_DIR, 'docs', 'defspec');
  if (existsSync(docsDest)) {
    rmSync(docsDest, { recursive: true, force: true });
    console.log(`  ✅ Removed project docs -> ${docsDest}`);
  }
}

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const help = has('--help') || has('-h');
const version = has('--version') || has('-v');
const check = has('--check');
const uninstall = has('--uninstall') || has('-u');
const skillsOnly = has('--skills-only');
const initOnly = has('--init-only');
const force = has('--force') || has('-f');
const yes = has('--yes') || has('-y');

try {
  if (help) {
    showHelp();
  } else if (version) {
    console.log(PKG.version);
  } else if (check) {
    checkInstall();
  } else if (uninstall) {
    console.log(`\ndefspec-codex v${PKG.version} uninstall\n`);
    if (!initOnly) uninstallSkills();
    if (!skillsOnly) uninstallProject();
    console.log('\n  Uninstall complete. Restart Codex if skills changed.\n');
  } else {
    console.log(`\ndefspec-codex v${PKG.version}\n`);
    if (!initOnly) installSkills();
    if (!skillsOnly) initProject({ force, yes });
    console.log('\n  Install complete. Restart Codex, then type /defspec in the composer.\n');
  }
} catch (error) {
  console.error(`\n  ❌ ${error.message}\n`);
  process.exit(1);
}

