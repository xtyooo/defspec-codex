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
const COMMANDS_SRC = resolve(ROOT, 'commands');
const ASSETS_SRC = resolve(ROOT, 'assets');
const PLUGIN_MANIFEST_SRC = resolve(ROOT, '.codex-plugin');
const DOCS_SRC = resolve(ROOT, 'templates', 'docs', 'specpilot');
const AGENTS_SECTION_SRC = resolve(ROOT, 'templates', 'agents', 'AGENTS.section.md');
const PROJECT_DIR = process.cwd();
const CODEX_SKILLS_DIR = resolve(homedir(), '.agents', 'skills', 'specpilot');
const CODEX_PLUGIN_NAME = 'specpilot';
const CODEX_MARKETPLACE_NAME = 'specpilot-local';
const CODEX_PLUGIN_DIR = resolve(homedir(), 'plugins', CODEX_PLUGIN_NAME);
const CODEX_MARKETPLACE_PATH = resolve(homedir(), '.agents', 'plugins', 'marketplace.json');
const CODEX_CONFIG_PATH = resolve(homedir(), '.codex', 'config.toml');
const LEGACY_CODEX_SKILLS_DIR = resolve(homedir(), '.agents', 'skills', 'defspec');
const LEGACY_CODEX_PLUGIN_NAME = 'defspec';
const LEGACY_CODEX_MARKETPLACE_NAME = 'defspec-local';
const LEGACY_CODEX_PLUGIN_DIR = resolve(homedir(), 'plugins', LEGACY_CODEX_PLUGIN_NAME);

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

function countSpecPilotSkillDirs(dir) {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir, { withFileTypes: true }).filter((entry) => {
    return entry.isDirectory() && isSpecPilotSkillDir(resolve(dir, entry.name));
  }).length;
}

function sourceCommandNames() {
  if (!existsSync(COMMANDS_SRC)) return [];
  return readdirSync(COMMANDS_SRC, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('_'))
    .map((entry) => entry.name.replace(/\.md$/, ''));
}

function isSpecPilotSkillDir(path) {
  if (!existsSync(resolve(path, 'SKILL.md'))) return false;
  const name = path.split(/[\\/]/).pop() ?? '';
  return name.startsWith('specpilot-') || name.startsWith('defspec-');
}

function cleanupSkillDirs(parentDir, label) {
  if (!existsSync(parentDir)) {
    console.log(`  ✅ No ${label} found`);
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

  try {
    if (readdirSync(parentDir).length === 0 && parentDir.endsWith(`${CODEX_PLUGIN_NAME}`)) {
      rmSync(parentDir, { recursive: true, force: true });
    }
  } catch {}

  console.log(`  ✅ Removed ${removed} ${label} entr${removed === 1 ? 'y' : 'ies'}`);
  return removed;
}

function cleanupLegacySpecPilotSkills() {
  cleanupSkillDirs(CODEX_SKILLS_DIR, 'legacy SpecPilot global skills');
  cleanupSkillDirs(resolve(CODEX_PLUGIN_DIR, 'skills'), 'legacy SpecPilot plugin skills');
  cleanupSkillDirs(resolve(PROJECT_DIR, '.codex', 'skills'), 'legacy project SpecPilot/DefSpec skills');
  cleanupSkillDirs(LEGACY_CODEX_SKILLS_DIR, 'legacy DefSpec global skills');
  cleanupSkillDirs(resolve(LEGACY_CODEX_PLUGIN_DIR, 'skills'), 'legacy DefSpec plugin skills');
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
specpilot-codex v${PKG.version}

Usage:
  npx specpilot-codex                 Install Codex /specpilot commands and initialize this project
  npx specpilot-codex --skills-only   Install/update global Codex command integration only
  npx specpilot-codex --integration-only
  npx specpilot-codex --init-only     Initialize current project only
  npx specpilot-codex --with-agents   Also write the optional AGENTS.md SpecPilot bootstrap
  npx specpilot-codex --check         Check current installation
  npx specpilot-codex --uninstall     Remove current project SpecPilot files
  npx specpilot-codex --uninstall --skills-only
  npx specpilot-codex --no-guide-prompt
  npx specpilot-codex --yes           Overwrite existing template files
  npx specpilot-codex --force         Allow project init in home directory

After installing, restart Codex and type /specpilot to discover SpecPilot commands.
`);
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

function installPluginBundle() {
  if (!existsSync(PLUGIN_MANIFEST_SRC)) throw new Error(`Missing plugin manifest source: ${PLUGIN_MANIFEST_SRC}`);
  if (!existsSync(COMMANDS_SRC)) throw new Error(`Missing commands source: ${COMMANDS_SRC}`);

  rmSync(CODEX_PLUGIN_DIR, { recursive: true, force: true });
  mkdirSync(CODEX_PLUGIN_DIR, { recursive: true });
  copyDirSync(PLUGIN_MANIFEST_SRC, resolve(CODEX_PLUGIN_DIR, '.codex-plugin'));
  copyDirSync(COMMANDS_SRC, resolve(CODEX_PLUGIN_DIR, 'commands'));
  if (existsSync(ASSETS_SRC)) copyDirSync(ASSETS_SRC, resolve(CODEX_PLUGIN_DIR, 'assets'));
  console.log(`  ✅ Codex plugin commands: ${sourceCommandNames().length} installed -> ${CODEX_PLUGIN_DIR}`);
}

function installMarketplace() {
  const payload = readJsonFile(CODEX_MARKETPLACE_PATH, {
    name: CODEX_MARKETPLACE_NAME,
    interface: { displayName: 'SpecPilot Local' },
    plugins: [],
  });

  if (!payload.name) payload.name = CODEX_MARKETPLACE_NAME;
  if (!payload.interface || typeof payload.interface !== 'object') payload.interface = { displayName: 'SpecPilot Local' };
  if (!Array.isArray(payload.plugins)) payload.plugins = [];

  const entry = {
    name: CODEX_PLUGIN_NAME,
    source: {
      source: 'local',
      path: './plugins/specpilot',
    },
    policy: {
      installation: 'AVAILABLE',
      authentication: 'ON_INSTALL',
    },
    category: 'Coding',
  };

  payload.plugins = payload.plugins.filter((plugin) => !plugin || plugin.name !== LEGACY_CODEX_PLUGIN_NAME);
  const index = payload.plugins.findIndex((plugin) => plugin && plugin.name === CODEX_PLUGIN_NAME);
  if (index === -1) payload.plugins.push(entry);
  else payload.plugins[index] = entry;

  writeJsonFile(CODEX_MARKETPLACE_PATH, payload);
  console.log(`  ✅ Codex marketplace -> ${CODEX_MARKETPLACE_PATH}`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

function cleanupSpecPilotConfigFragments(content) {
  let next = normalizeTomlNewlines(content);
  next = removeTomlBlockContent(next, `marketplaces.${CODEX_MARKETPLACE_NAME}`);
  next = removeTomlBlockContent(next, `plugins."${CODEX_PLUGIN_NAME}@${CODEX_MARKETPLACE_NAME}"`);
  next = removeTomlBlockContent(next, `marketplaces.${LEGACY_CODEX_MARKETPLACE_NAME}`);
  next = removeTomlBlockContent(next, `plugins."${LEGACY_CODEX_PLUGIN_NAME}@${LEGACY_CODEX_MARKETPLACE_NAME}"`);

  const lines = next.split('\n');
  const cleaned = [];
  for (let index = 0; index < lines.length; index++) {
    const current = lines[index];
    const following = lines[index + 1] ?? '';
    const isSpecPilotSourcePair = /^source_type\s*=\s*"local"\s*$/.test(current)
      && following === `source = ${quoteTomlString(homedir())}`;
    if (isSpecPilotSourcePair) {
      index++;
      continue;
    }
    cleaned.push(current);
  }

  return cleaned.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

function upsertTomlBlock(content, header, body) {
  const block = `[${header}]\n${body.trimEnd()}\n`;
  const withoutExisting = removeTomlBlockContent(cleanupSpecPilotConfigFragments(content), header).trimEnd();
  return `${withoutExisting}\n\n${block}`;
}
function quoteTomlString(value) {
  return `'${value.replace(/'/g, "''")}'`;
}

function installCodexConfig() {
  const existing = cleanupSpecPilotConfigFragments(existsSync(CODEX_CONFIG_PATH) ? readFileSync(CODEX_CONFIG_PATH, 'utf8') : '');
  const marketplaceBlock = `[marketplaces.${CODEX_MARKETPLACE_NAME}]\nlast_updated = "${new Date().toISOString()}"\nsource_type = "local"\nsource = ${quoteTomlString(homedir())}\n`;
  const pluginBlock = `[plugins."${CODEX_PLUGIN_NAME}@${CODEX_MARKETPLACE_NAME}"]\nenabled = true\n`;
  const next = `${existing.trimEnd()}\n\n${marketplaceBlock}\n${pluginBlock}`;
  mkdirSync(dirname(CODEX_CONFIG_PATH), { recursive: true });
  writeFileSync(CODEX_CONFIG_PATH, next.trimEnd() + '\n', 'utf8');
  console.log(`  ✅ Codex config enabled -> ${CODEX_CONFIG_PATH}`);
}

function installCodexIntegration() {
  cleanupLegacySpecPilotSkills();
  cleanupLegacyDefSpecPluginBundle();
  installPluginBundle();
  installMarketplace();
  installCodexConfig();
}

function cleanupLegacyDefSpecPluginBundle() {
  if (existsSync(LEGACY_CODEX_PLUGIN_DIR)) {
    rmSync(LEGACY_CODEX_PLUGIN_DIR, { recursive: true, force: true });
    console.log(`  ✅ Removed legacy DefSpec plugin -> ${LEGACY_CODEX_PLUGIN_DIR}`);
  }
}

function updateAgentsBootstrap({ withAgents }) {
  const agentsPath = resolve(PROJECT_DIR, 'AGENTS.md');
  if (!withAgents) {
    if (!existsSync(agentsPath)) return;
    const result = removeSentinelSection(readFileSync(agentsPath, 'utf8'));
    if (result.removed) {
      writeFileSync(agentsPath, result.content, 'utf8');
      console.log(`  ✅ Removed legacy AGENTS.md SpecPilot bootstrap -> ${agentsPath}`);
    }
    return;
  }

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

function initProject({ force, yes, withAgents }) {
  if (!force && isHomeDir(PROJECT_DIR)) {
    throw new Error(`Refusing to initialize home directory: ${PROJECT_DIR}. Run from a project directory or pass --force.`);
  }

  const docsDest = resolve(PROJECT_DIR, 'docs', 'specpilot');
  if (existsSync(docsDest) && !yes) {
    console.log(`  ℹ️  docs/specpilot already exists; keeping existing files. Pass --yes to overwrite templates.`);
  } else {
    mkdirSync(resolve(PROJECT_DIR, 'docs'), { recursive: true });
    copyDirSync(DOCS_SRC, docsDest);
    console.log(`  ✅ Project docs -> ${docsDest}`);
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

1. docs/specpilot/specpilot.md
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

  What "initialize" means:
    Codex should inspect this repository, then replace the placeholder sections in
    docs/specpilot/project-guide.md with project-specific guidance.
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
  const commands = sourceCommandNames();
  console.log(`\nspecpilot-codex v${PKG.version} check\n`);
  console.log(`  Project: ${PROJECT_DIR}`);
  console.log(`  Canonical entry: /specpilot:* commands`);
  console.log(`  Codex plugin dir: ${CODEX_PLUGIN_DIR}`);
  for (const name of commands) {
    const ok = existsSync(resolve(CODEX_PLUGIN_DIR, 'commands', `${name}.md`));
    console.log(`  ${ok ? '✅' : '❌'} command /specpilot:${name}`);
  }
  const hasManifest = existsSync(resolve(CODEX_PLUGIN_DIR, '.codex-plugin', 'plugin.json'));
  console.log(`  ${hasManifest ? '✅' : '❌'} plugin manifest`);
  const manifestContent = hasManifest ? readFileSync(resolve(CODEX_PLUGIN_DIR, '.codex-plugin', 'plugin.json'), 'utf8') : '';
  const manifestExposesSkills = /"skills"\s*:/.test(manifestContent);
  console.log(`  ${!manifestExposesSkills ? '✅' : '❌'} plugin manifest does not expose skills`);
  const legacyGlobalSkills = countSpecPilotSkillDirs(CODEX_SKILLS_DIR);
  const legacyPluginSkills = countSpecPilotSkillDirs(resolve(CODEX_PLUGIN_DIR, 'skills'));
  const legacyProjectSkills = countSpecPilotSkillDirs(resolve(PROJECT_DIR, '.codex', 'skills'));
  const legacyDefSpecGlobalSkills = countSpecPilotSkillDirs(LEGACY_CODEX_SKILLS_DIR);
  console.log(`  ${legacyGlobalSkills === 0 ? '✅' : '❌'} no legacy global SpecPilot skills`);
  console.log(`  ${legacyPluginSkills === 0 ? '✅' : '❌'} no legacy plugin SpecPilot skills`);
  console.log(`  ${legacyProjectSkills === 0 ? '✅' : '❌'} no legacy project SpecPilot skills`);
  console.log(`  ${legacyDefSpecGlobalSkills === 0 ? '✅' : '❌'} no legacy DefSpec global skills`);
  const hasMarketplace = existsSync(CODEX_MARKETPLACE_PATH) && readFileSync(CODEX_MARKETPLACE_PATH, 'utf8').includes('"name": "specpilot"');
  console.log(`  ${hasMarketplace ? '✅' : '❌'} marketplace entry`);
  const configContent = existsSync(CODEX_CONFIG_PATH) ? readFileSync(CODEX_CONFIG_PATH, 'utf8') : '';
  const pluginConfigMatches = configContent.match(new RegExp(`\\[plugins\\."${escapeRegExp(CODEX_PLUGIN_NAME)}@${escapeRegExp(CODEX_MARKETPLACE_NAME)}"\\]`, 'g')) ?? [];
  const marketplaceConfigMatches = configContent.match(new RegExp(`\\[marketplaces\\.${escapeRegExp(CODEX_MARKETPLACE_NAME)}\\]`, 'g')) ?? [];
  const hasConfig = pluginConfigMatches.length === 1 && marketplaceConfigMatches.length === 1;
  console.log(`  ${hasConfig ? '✅' : '❌'} Codex plugin enabled`);
  const hasLegacyPluginDir = existsSync(LEGACY_CODEX_PLUGIN_DIR);
  console.log(`  ${!hasLegacyPluginDir ? '✅' : '❌'} no legacy DefSpec plugin`);
  console.log(`  ${existsSync(resolve(PROJECT_DIR, 'docs', 'specpilot', 'SPECPILOT.md')) ? '✅' : '❌'} docs/specpilot`);
  const agentsPath = resolve(PROJECT_DIR, 'AGENTS.md');
  const agentsContent = existsSync(agentsPath) ? readFileSync(agentsPath, 'utf8') : '';
  const hasAgents = agentsContent.includes(SENTINEL_BEGIN);
  const hasLegacyAgentsSkillText = /\.codex[\\/]skills|local Codex skills|Codex skills installed by `specpilot-codex`/i.test(agentsContent);
  console.log(`  ${hasAgents ? 'ℹ️ ' : '✅'} AGENTS.md SpecPilot bootstrap ${hasAgents ? 'present (optional)' : 'not installed by default'}`);
  if (!hasAgents && hasLegacyAgentsSkillText) {
    console.log('  ℹ️  AGENTS.md contains legacy SpecPilot skill wording; it is safe to keep, but /specpilot commands no longer need it');
  }
}

function uninstallSkills() {
  cleanupLegacySpecPilotSkills();
}

function removeTomlBlock(content, header) {
  return cleanupSpecPilotConfigFragments(removeTomlBlockContent(content, header));
}

function uninstallPluginBundle() {
  if (existsSync(CODEX_PLUGIN_DIR)) {
    rmSync(CODEX_PLUGIN_DIR, { recursive: true, force: true });
    console.log(`  ✅ Removed Codex plugin -> ${CODEX_PLUGIN_DIR}`);
  }

  if (existsSync(CODEX_MARKETPLACE_PATH)) {
    const payload = readJsonFile(CODEX_MARKETPLACE_PATH, null);
    if (payload && Array.isArray(payload.plugins)) {
      const before = payload.plugins.length;
      payload.plugins = payload.plugins.filter((plugin) => !plugin || plugin.name !== CODEX_PLUGIN_NAME);
      if (payload.plugins.length !== before) {
        writeJsonFile(CODEX_MARKETPLACE_PATH, payload);
        console.log(`  ✅ Removed marketplace entry -> ${CODEX_MARKETPLACE_PATH}`);
      }
    }
  }

  if (existsSync(CODEX_CONFIG_PATH)) {
    let next = readFileSync(CODEX_CONFIG_PATH, 'utf8');
    next = removeTomlBlock(next, `plugins."${CODEX_PLUGIN_NAME}@${CODEX_MARKETPLACE_NAME}"`);
    next = removeTomlBlock(next, `marketplaces.${CODEX_MARKETPLACE_NAME}`);
    writeFileSync(CODEX_CONFIG_PATH, next, 'utf8');
    console.log(`  ✅ Removed Codex config entries -> ${CODEX_CONFIG_PATH}`);
  }
  cleanupLegacyDefSpecPluginBundle();
}

function uninstallCodexIntegration() {
  uninstallSkills();
  uninstallPluginBundle();
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

  const docsDest = resolve(PROJECT_DIR, 'docs', 'specpilot');
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
    console.log('\n  Uninstall complete. Restart Codex if integration changed.\n');
  } else {
    console.log(`\nspecpilot-codex v${PKG.version}\n`);
    if (!initOnly) installCodexIntegration();
    if (!skillsOnly) initProject({ force, yes, withAgents });
    if (!skillsOnly) await promptProjectGuideInit({ skip: noGuidePrompt });
    console.log('\n  Install complete. Restart Codex, then type /specpilot in the composer.\n');
  }
} catch (error) {
  console.error(`\n  ❌ ${error.message}\n`);
  process.exit(1);
}
