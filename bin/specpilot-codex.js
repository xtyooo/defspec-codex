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
import { createInterface } from 'readline/promises';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PKG = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
const SKILLS_SRC = resolve(ROOT, 'skills');
const DOCS_SRC = resolve(ROOT, 'templates', 'docs', 'specpilot');
const AGENTS_SECTION_SRC = resolve(ROOT, 'templates', 'agents', 'AGENTS.section.md');
const PROJECT_DIR = process.cwd();
const PROJECT_CODEX_SKILLS_DIR = resolve(PROJECT_DIR, '.codex', 'skills');
const LEGACY_GLOBAL_SPEC_SKILLS_DIR = resolve(homedir(), '.agents', 'skills', 'specpilot');
const LEGACY_GLOBAL_DEFSPEC_SKILLS_DIR = resolve(homedir(), '.agents', 'skills', 'defspec');
const LEGACY_PLUGIN_DIR = resolve(homedir(), 'plugins', 'specpilot');
const LEGACY_DEFSPEC_PLUGIN_DIR = resolve(homedir(), 'plugins', 'defspec');
const CODEX_MARKETPLACE_PATH = resolve(homedir(), '.agents', 'plugins', 'marketplace.json');
const CODEX_CONFIG_PATH = resolve(homedir(), '.codex', 'config.toml');

const SENTINEL_BEGIN = '<!-- specpilot-codex:begin (do not edit between these markers) -->';
const SENTINEL_END = '<!-- specpilot-codex:end -->';
const LEGACY_SENTINEL_BEGIN = '<!-- defspec-codex:begin (do not edit between these markers) -->';
const LEGACY_SENTINEL_END = '<!-- defspec-codex:end -->';

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

function isHomeDir(path) {
  try {
    return realpathSync(path).toLowerCase() === realpathSync(homedir()).toLowerCase();
  } catch {
    return resolve(path).toLowerCase() === resolve(homedir()).toLowerCase();
  }
}

function sourceSkillNames() {
  if (!existsSync(SKILLS_SRC)) return [];
  return readdirSync(SKILLS_SRC, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('specpilot-'))
    .filter((entry) => existsSync(resolve(SKILLS_SRC, entry.name, 'SKILL.md')))
    .map((entry) => entry.name)
    .sort();
}

function isSpecPilotSkillDir(path) {
  if (!existsSync(resolve(path, 'SKILL.md'))) return false;
  const name = path.split(/[\\/]/).pop() ?? '';
  return name.startsWith('specpilot-') || name.startsWith('defspec-');
}

function cleanupSkillDirs(parentDir, label) {
  if (!existsSync(parentDir)) {
    console.log(`  OK no ${label} found`);
    return 0;
  }

  let removed = 0;
  for (const entry of readdirSync(parentDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const target = resolve(parentDir, entry.name);
    if (!isSpecPilotSkillDir(target)) continue;
    rmSync(target, { recursive: true, force: true });
    removed++;
  }

  console.log(`  OK removed ${removed} ${label} entr${removed === 1 ? 'y' : 'ies'}`);
  return removed;
}

function installProjectSkills() {
  const skills = sourceSkillNames();
  if (skills.length === 0) throw new Error(`No SpecPilot skills found in ${SKILLS_SRC}`);

  mkdirSync(PROJECT_CODEX_SKILLS_DIR, { recursive: true });
  cleanupSkillDirs(PROJECT_CODEX_SKILLS_DIR, 'project SpecPilot skills');
  for (const skill of skills) {
    copyDirSync(resolve(SKILLS_SRC, skill), resolve(PROJECT_CODEX_SKILLS_DIR, skill));
  }
  console.log(`  OK Codex skills: ${skills.length} installed -> ${PROJECT_CODEX_SKILLS_DIR}`);
}

function removeMarkedSection(content, begin, endMarker, label) {
  const start = content.indexOf(begin);
  if (start === -1) return { content, removed: false };
  const end = content.indexOf(endMarker, start);
  if (end === -1) {
    throw new Error(`AGENTS.md contains a ${label} begin marker without an end marker.`);
  }
  return {
    content: `${content.slice(0, start).replace(/\s+$/, '')}${content.slice(end + endMarker.length).replace(/^\s+/, '\n')}`.trimEnd() + '\n',
    removed: true,
  };
}

function replaceSentinelSection(content, section) {
  const start = content.indexOf(SENTINEL_BEGIN);
  if (start === -1) {
    return `${content.replace(/\s+$/, '')}\n\n${section.trim()}\n`;
  }
  const end = content.indexOf(SENTINEL_END, start);
  if (end === -1) {
    throw new Error('AGENTS.md contains a specpilot-codex begin marker without an end marker.');
  }
  const afterEnd = end + SENTINEL_END.length;
  return `${content.slice(0, start).replace(/\s+$/, '')}\n\n${section.trim()}\n${content.slice(afterEnd).replace(/^\s+/, '\n')}`;
}

function removeSentinelSection(content) {
  const current = removeMarkedSection(content, SENTINEL_BEGIN, SENTINEL_END, 'specpilot-codex');
  const legacy = removeMarkedSection(current.content, LEGACY_SENTINEL_BEGIN, LEGACY_SENTINEL_END, 'defspec-codex');
  return {
    content: legacy.content,
    removed: current.removed || legacy.removed,
  };
}

function readJsonFile(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJsonFile(path, payload) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

function normalizeTomlNewlines(content) {
  return content.replace(/\r\n/g, '\n');
}

function removeTomlBlockContent(content, header) {
  const target = `[${header}]`;
  const lines = normalizeTomlNewlines(content).split('\n');
  const kept = [];
  let skipping = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\[[^\]]+\]$/.test(trimmed)) {
      skipping = trimmed === target;
      if (skipping) continue;
    }
    if (!skipping) kept.push(line);
  }

  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

function cleanupLegacyPluginConfig() {
  if (existsSync(LEGACY_PLUGIN_DIR)) {
    rmSync(LEGACY_PLUGIN_DIR, { recursive: true, force: true });
    console.log(`  OK removed legacy SpecPilot plugin -> ${LEGACY_PLUGIN_DIR}`);
  }
  if (existsSync(LEGACY_DEFSPEC_PLUGIN_DIR)) {
    rmSync(LEGACY_DEFSPEC_PLUGIN_DIR, { recursive: true, force: true });
    console.log(`  OK removed legacy DefSpec plugin -> ${LEGACY_DEFSPEC_PLUGIN_DIR}`);
  }

  if (existsSync(CODEX_MARKETPLACE_PATH)) {
    const payload = readJsonFile(CODEX_MARKETPLACE_PATH, null);
    if (payload && Array.isArray(payload.plugins)) {
      const before = payload.plugins.length;
      payload.plugins = payload.plugins.filter((plugin) => !plugin || !['specpilot', 'defspec'].includes(plugin.name));
      if (payload.plugins.length !== before) {
        writeJsonFile(CODEX_MARKETPLACE_PATH, payload);
        console.log(`  OK removed legacy marketplace entries -> ${CODEX_MARKETPLACE_PATH}`);
      }
    }
  }

  if (existsSync(CODEX_CONFIG_PATH)) {
    let next = readFileSync(CODEX_CONFIG_PATH, 'utf8');
    for (const header of [
      'marketplaces.specpilot-local',
      'plugins."specpilot@specpilot-local"',
      'marketplaces.defspec-local',
      'plugins."defspec@defspec-local"',
    ]) {
      next = removeTomlBlockContent(next, header);
    }
    writeFileSync(CODEX_CONFIG_PATH, next, 'utf8');
    console.log(`  OK removed legacy Codex plugin config -> ${CODEX_CONFIG_PATH}`);
  }
}

function cleanupLegacySkillLocations() {
  cleanupSkillDirs(LEGACY_GLOBAL_SPEC_SKILLS_DIR, 'legacy global SpecPilot skills');
  cleanupSkillDirs(LEGACY_GLOBAL_DEFSPEC_SKILLS_DIR, 'legacy global DefSpec skills');
  cleanupSkillDirs(resolve(LEGACY_PLUGIN_DIR, 'skills'), 'legacy plugin SpecPilot skills');
  cleanupSkillDirs(resolve(LEGACY_DEFSPEC_PLUGIN_DIR, 'skills'), 'legacy plugin DefSpec skills');
}

function installCodexIntegration() {
  cleanupLegacySkillLocations();
  cleanupLegacyPluginConfig();
  installProjectSkills();
}

function uninstallCodexIntegration() {
  cleanupSkillDirs(PROJECT_CODEX_SKILLS_DIR, 'project SpecPilot skills');
  cleanupLegacySkillLocations();
  cleanupLegacyPluginConfig();
}

function updateAgentsBootstrap({ withAgents }) {
  const agentsPath = resolve(PROJECT_DIR, 'AGENTS.md');
  if (!withAgents) {
    if (!existsSync(agentsPath)) return;
    const result = removeSentinelSection(readFileSync(agentsPath, 'utf8'));
    if (result.removed) {
      writeFileSync(agentsPath, result.content, 'utf8');
      console.log(`  OK removed legacy AGENTS.md SpecPilot bootstrap -> ${agentsPath}`);
    }
    return;
  }

  const section = readFileSync(AGENTS_SECTION_SRC, 'utf8');
  const existing = existsSync(agentsPath) ? readFileSync(agentsPath, 'utf8') : '# Codex Project Guide\n';
  const next = replaceSentinelSection(existing, section);
  if (next !== existing) {
    writeFileSync(agentsPath, next, 'utf8');
    console.log(`  OK AGENTS.md updated -> ${agentsPath}`);
  } else {
    console.log('  OK AGENTS.md already up to date');
  }
}

function initProject({ force, yes, withAgents }) {
  if (!force && isHomeDir(PROJECT_DIR)) {
    throw new Error(`Refusing to initialize home directory: ${PROJECT_DIR}. Run from a project directory or pass --force.`);
  }

  const docsDest = resolve(PROJECT_DIR, 'docs', 'specpilot');
  if (existsSync(docsDest) && !yes) {
    console.log(`  INFO docs/specpilot already exists; keeping existing files. Pass --yes to overwrite templates.`);
  } else {
    mkdirSync(resolve(PROJECT_DIR, 'docs'), { recursive: true });
    copyDirSync(DOCS_SRC, docsDest);
    console.log(`  OK project docs -> ${docsDest}`);
  }

  updateAgentsBootstrap({ withAgents });
}

function projectGuideNeedsInit() {
  const guidePath = resolve(PROJECT_DIR, 'docs', 'specpilot', 'project-guide.md');
  if (!existsSync(guidePath)) return false;
  const content = readFileSync(guidePath, 'utf8');
  return content.includes('待补全');
}

function buildProjectGuidePrompt() {
  return `请初始化当前项目的 SpecPilot project-guide。

请先阅读：

1. docs/specpilot/SPECPILOT.md
2. docs/specpilot/project.md
3. docs/specpilot/project-guide.md
4. AGENTS.md（如果存在）

然后分析当前仓库的真实代码结构、技术栈、开发规范、运行方式、测试方式和常见改动路径，并更新 docs/specpilot/project-guide.md。

要求：

1. 遍历项目主要目录，说明各模块职责。
2. 识别语言、框架、数据库、缓存、队列、协议、部署方式和外部依赖。
3. 总结项目分层、依赖方向、生成代码规则和常见改动路径。
4. 提取当前项目的测试、构建、运行命令。
5. 标出后续需求开发时必须注意的约束、风险和不要修改的文件。
6. 内容要面向后续 SpecPilot 需求开发，不写无关介绍，不保留“待补全”。

完成后请运行必要的轻量检查，并总结你更新了哪些项目指南内容。`;
}

async function promptProjectGuideInit({ skip }) {
  if (skip || !projectGuideNeedsInit()) return;

  const guidePath = resolve(PROJECT_DIR, 'docs', 'specpilot', 'project-guide.md');
  console.log(`
  Next recommended step: initialize project-guide.md

  SpecPilot has created:
    ${guidePath}

  Why this matters:
    project-guide.md is the project map Codex reads before future SpecPilot work.
    If it stays as a template, Codex may miss your module boundaries, build commands,
    generated-code rules, test strategy, and files that should not be touched.
`);

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.log('  Non-interactive shell detected. To initialize later, send this prompt to Codex:\n');
    console.log(buildProjectGuidePrompt());
    return;
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question('  Start project-guide initialization now? [Y/n] ')).trim().toLowerCase();
  rl.close();

  if (answer && !['y', 'yes'].includes(answer)) {
    console.log(`
  Skipped for now.

  When you are ready, open Codex in this project and send:

${buildProjectGuidePrompt()}
`);
    return;
  }

  console.log(`
  Copy the prompt below into Codex to start initialization:

${buildProjectGuidePrompt()}
`);
}

function checkInstall() {
  const skills = sourceSkillNames();
  console.log(`\nspecpilot-codex v${PKG.version} check\n`);
  console.log(`  Project: ${PROJECT_DIR}`);
  console.log(`  Codex skills dir: ${PROJECT_CODEX_SKILLS_DIR}`);
  for (const skill of skills) {
    const ok = existsSync(resolve(PROJECT_CODEX_SKILLS_DIR, skill, 'SKILL.md'));
    console.log(`  ${ok ? 'OK' : 'MISSING'} skill ${skill}`);
  }
  console.log(`  ${existsSync(resolve(PROJECT_DIR, 'docs', 'specpilot', 'SPECPILOT.md')) ? 'OK' : 'MISSING'} docs/specpilot`);

  const agentsPath = resolve(PROJECT_DIR, 'AGENTS.md');
  const agentsContent = existsSync(agentsPath) ? readFileSync(agentsPath, 'utf8') : '';
  const hasAgents = agentsContent.includes(SENTINEL_BEGIN);
  console.log(`  ${hasAgents ? 'INFO' : 'OK'} AGENTS.md SpecPilot bootstrap ${hasAgents ? 'present (optional)' : 'not installed by default'}`);

  const legacyPlugin = existsSync(LEGACY_PLUGIN_DIR);
  const legacyConfig = existsSync(CODEX_CONFIG_PATH)
    && /specpilot-local|plugins\."specpilot@specpilot-local"/.test(readFileSync(CODEX_CONFIG_PATH, 'utf8'));
  console.log(`  ${!legacyPlugin ? 'OK' : 'LEGACY'} no legacy SpecPilot plugin directory`);
  console.log(`  ${!legacyConfig ? 'OK' : 'LEGACY'} no legacy SpecPilot plugin config`);
}

function uninstallProject() {
  const agentsPath = resolve(PROJECT_DIR, 'AGENTS.md');
  if (existsSync(agentsPath)) {
    const result = removeSentinelSection(readFileSync(agentsPath, 'utf8'));
    if (result.removed) {
      writeFileSync(agentsPath, result.content, 'utf8');
      console.log(`  OK removed AGENTS.md bootstrap -> ${agentsPath}`);
    }
  }

  const docsDest = resolve(PROJECT_DIR, 'docs', 'specpilot');
  if (existsSync(docsDest)) {
    rmSync(docsDest, { recursive: true, force: true });
    console.log(`  OK removed project docs -> ${docsDest}`);
  }
}

function showHelp() {
  console.log(`
specpilot-codex v${PKG.version}

Usage:
  npx specpilot-codex                 Install Codex SpecPilot skills and initialize this project
  npx specpilot-codex --skills-only   Install/update project Codex skills only
  npx specpilot-codex --integration-only
  npx specpilot-codex --init-only     Initialize current project docs only
  npx specpilot-codex --with-agents   Also write the optional AGENTS.md SpecPilot bootstrap
  npx specpilot-codex --check         Check current installation
  npx specpilot-codex --uninstall     Remove current project SpecPilot docs and skills
  npx specpilot-codex --uninstall --skills-only
  npx specpilot-codex --no-guide-prompt
  npx specpilot-codex --yes           Overwrite existing template files
  npx specpilot-codex --force         Allow project init in home directory

After installing, restart Codex if the new skills are not visible yet.
`);
}

const args = process.argv.slice(2);
const has = (flag) => args.includes(flag);
const help = has('--help') || has('-h');
const version = has('--version') || has('-v');
const check = has('--check');
const uninstall = has('--uninstall') || has('-u');
const skillsOnly = has('--skills-only') || has('--integration-only');
const initOnly = has('--init-only');
const force = has('--force') || has('-f');
const yes = has('--yes') || has('-y');
const noGuidePrompt = has('--no-guide-prompt');
const withAgents = has('--with-agents');

try {
  if (help) {
    showHelp();
  } else if (version) {
    console.log(PKG.version);
  } else if (check) {
    checkInstall();
  } else if (uninstall) {
    console.log(`\nspecpilot-codex v${PKG.version} uninstall\n`);
    if (!initOnly) uninstallCodexIntegration();
    if (!skillsOnly) uninstallProject();
    console.log('\n  Uninstall complete. Restart Codex if skills changed.\n');
  } else {
    console.log(`\nspecpilot-codex v${PKG.version}\n`);
    if (!initOnly) installCodexIntegration();
    if (!skillsOnly) initProject({ force, yes, withAgents });
    if (!skillsOnly) await promptProjectGuideInit({ skip: noGuidePrompt });
    console.log('\n  Install complete. Restart Codex if skills are not visible yet.\n');
  }
} catch (error) {
  console.error(`\n  ERROR ${error.message}\n`);
  process.exit(1);
}
