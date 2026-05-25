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
const COMMANDS_SRC = resolve(ROOT, 'commands');
const ASSETS_SRC = resolve(ROOT, 'assets');
const PLUGIN_MANIFEST_SRC = resolve(ROOT, '.codex-plugin');
const DOCS_SRC = resolve(ROOT, 'templates', 'docs', 'defspec');
const AGENTS_SECTION_SRC = resolve(ROOT, 'templates', 'agents', 'AGENTS.section.md');
const PROJECT_DIR = process.cwd();
const CODEX_SKILLS_DIR = resolve(homedir(), '.agents', 'skills', 'defspec');
const CODEX_PLUGIN_NAME = 'defspec';
const CODEX_MARKETPLACE_NAME = 'defspec-local';
const CODEX_PLUGIN_DIR = resolve(homedir(), 'plugins', CODEX_PLUGIN_NAME);
const CODEX_MARKETPLACE_PATH = resolve(homedir(), '.agents', 'plugins', 'marketplace.json');
const CODEX_CONFIG_PATH = resolve(homedir(), '.codex', 'config.toml');

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

function sourceCommandNames() {
  if (!existsSync(COMMANDS_SRC)) return [];
  return readdirSync(COMMANDS_SRC, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && !entry.name.startsWith('_'))
    .map((entry) => entry.name.replace(/\.md$/, ''));
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
  npx defspec-codex                 Install Codex plugin/skills and initialize this project
  npx defspec-codex --skills-only   Install/update global Codex integration only
  npx defspec-codex --init-only     Initialize current project only
  npx defspec-codex --check         Check current installation
  npx defspec-codex --uninstall     Remove current project DefSpec files
  npx defspec-codex --uninstall --skills-only
  npx defspec-codex --no-guide-prompt
  npx defspec-codex --yes           Overwrite existing template files
  npx defspec-codex --force         Allow project init in home directory

After installing, restart Codex and type /defspec to discover DefSpec commands.
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
  copyDirSync(SKILLS_SRC, resolve(CODEX_PLUGIN_DIR, 'skills'));
  if (existsSync(ASSETS_SRC)) copyDirSync(ASSETS_SRC, resolve(CODEX_PLUGIN_DIR, 'assets'));
  console.log(`  ✅ Codex plugin commands: ${sourceCommandNames().length} installed -> ${CODEX_PLUGIN_DIR}`);
}

function installMarketplace() {
  const payload = readJsonFile(CODEX_MARKETPLACE_PATH, {
    name: CODEX_MARKETPLACE_NAME,
    interface: { displayName: 'DefSpec Local' },
    plugins: [],
  });

  if (!payload.name) payload.name = CODEX_MARKETPLACE_NAME;
  if (!payload.interface || typeof payload.interface !== 'object') payload.interface = { displayName: 'DefSpec Local' };
  if (!Array.isArray(payload.plugins)) payload.plugins = [];

  const entry = {
    name: CODEX_PLUGIN_NAME,
    source: {
      source: 'local',
      path: './plugins/defspec',
    },
    policy: {
      installation: 'AVAILABLE',
      authentication: 'ON_INSTALL',
    },
    category: 'Coding',
  };

  const index = payload.plugins.findIndex((plugin) => plugin && plugin.name === CODEX_PLUGIN_NAME);
  if (index === -1) payload.plugins.push(entry);
  else payload.plugins[index] = entry;

  writeJsonFile(CODEX_MARKETPLACE_PATH, payload);
  console.log(`  ✅ Codex marketplace -> ${CODEX_MARKETPLACE_PATH}`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function upsertTomlBlock(content, header, body) {
  const escapedHeader = escapeRegExp(header);
  const pattern = new RegExp(`\\n?\\[${escapedHeader}\\]\\n[\\s\\S]*?(?=\\n\\[[^\\n]+\\]|$)`, 'm');
  const block = `[${header}]\n${body.trimEnd()}\n`;
  if (pattern.test(content)) {
    return content.replace(pattern, `\n${block}`);
  }
  return `${content.replace(/\s+$/, '')}\n\n${block}`;
}

function quoteTomlString(value) {
  return `'${value.replace(/'/g, "''")}'`;
}

function installCodexConfig() {
  const existing = existsSync(CODEX_CONFIG_PATH) ? readFileSync(CODEX_CONFIG_PATH, 'utf8') : '';
  let next = upsertTomlBlock(
    existing,
    `marketplaces.${CODEX_MARKETPLACE_NAME}`,
    `last_updated = "${new Date().toISOString()}"\nsource_type = "local"\nsource = ${quoteTomlString(homedir())}`,
  );
  next = upsertTomlBlock(
    next,
    `plugins."${CODEX_PLUGIN_NAME}@${CODEX_MARKETPLACE_NAME}"`,
    'enabled = true',
  );
  mkdirSync(dirname(CODEX_CONFIG_PATH), { recursive: true });
  writeFileSync(CODEX_CONFIG_PATH, next.trimEnd() + '\n', 'utf8');
  console.log(`  ✅ Codex config enabled -> ${CODEX_CONFIG_PATH}`);
}

function installCodexIntegration() {
  installSkills();
  installPluginBundle();
  installMarketplace();
  installCodexConfig();
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

function projectGuideNeedsInit() {
  const guidePath = resolve(PROJECT_DIR, 'docs', 'defspec', 'project-guide.md');
  if (!existsSync(guidePath)) return false;
  const content = readFileSync(guidePath, 'utf8');
  return content.includes('待补全');
}

function buildProjectGuidePrompt() {
  return `请初始化当前项目的 DefSpec project-guide。

请先阅读：

1. docs/defspec/DEFSPEC.md
2. docs/defspec/project.md
3. docs/defspec/project-guide.md
4. AGENTS.md

然后分析当前仓库的真实代码结构、技术栈、开发规范、运行方式、测试方式和常见改动路径，并更新 docs/defspec/project-guide.md。

要求：

1. 遍历项目主要目录，说明各模块职责。
2. 识别语言、框架、数据库、缓存、队列、协议、部署方式和外部依赖。
3. 总结项目分层、依赖方向、生成代码规则和常见改动路径。
4. 提取当前项目的测试、构建、运行命令。
5. 标出后续需求开发时必须注意的约束、风险和不要修改的文件。
6. 内容要面向后续 DefSpec 需求开发，不写无关介绍，不保留“待补全”。

完成后请运行必要的轻量检查，并总结你更新了哪些项目指南内容。`;
}

async function promptProjectGuideInit({ skip }) {
  if (skip || !projectGuideNeedsInit()) return;

  const guidePath = resolve(PROJECT_DIR, 'docs', 'defspec', 'project-guide.md');
  console.log(`
  Next recommended step: initialize project-guide.md

  DefSpec has created:
    ${guidePath}

  Why this matters:
    project-guide.md is the project map Codex reads before future DefSpec work.
    If it stays as a template, Codex may miss your module boundaries, build commands,
    generated-code rules, test strategy, and files that should not be touched.

  What "initialize" means:
    Codex should inspect this repository, then replace the placeholder sections in
    docs/defspec/project-guide.md with project-specific guidance.
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
  const names = sourceSkillNames();
  const commands = sourceCommandNames();
  console.log(`\ndefspec-codex v${PKG.version} check\n`);
  console.log(`  Project: ${PROJECT_DIR}`);
  console.log(`  Global skill dir: ${CODEX_SKILLS_DIR}`);
  console.log(`  Codex plugin dir: ${CODEX_PLUGIN_DIR}`);
  for (const name of names) {
    const ok = existsSync(resolve(CODEX_SKILLS_DIR, name, 'SKILL.md'));
    console.log(`  ${ok ? '✅' : '❌'} skill ${name}`);
  }
  for (const name of commands) {
    const ok = existsSync(resolve(CODEX_PLUGIN_DIR, 'commands', `${name}.md`));
    console.log(`  ${ok ? '✅' : '❌'} command /defspec:${name}`);
  }
  const hasManifest = existsSync(resolve(CODEX_PLUGIN_DIR, '.codex-plugin', 'plugin.json'));
  console.log(`  ${hasManifest ? '✅' : '❌'} plugin manifest`);
  const hasMarketplace = existsSync(CODEX_MARKETPLACE_PATH) && readFileSync(CODEX_MARKETPLACE_PATH, 'utf8').includes('"name": "defspec"');
  console.log(`  ${hasMarketplace ? '✅' : '❌'} marketplace entry`);
  const hasConfig = existsSync(CODEX_CONFIG_PATH) && readFileSync(CODEX_CONFIG_PATH, 'utf8').includes(`[plugins."${CODEX_PLUGIN_NAME}@${CODEX_MARKETPLACE_NAME}"]`);
  console.log(`  ${hasConfig ? '✅' : '❌'} Codex plugin enabled`);
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

function removeTomlBlock(content, header) {
  const escapedHeader = escapeRegExp(header);
  const pattern = new RegExp(`\\n?\\[${escapedHeader}\\]\\n[\\s\\S]*?(?=\\n\\[[^\\n]+\\]|$)`, 'm');
  return content.replace(pattern, '').trimEnd() + '\n';
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
const noGuidePrompt = has('--no-guide-prompt');

try {
  if (help) {
    showHelp();
  } else if (version) {
    console.log(PKG.version);
  } else if (check) {
    checkInstall();
  } else if (uninstall) {
    console.log(`\ndefspec-codex v${PKG.version} uninstall\n`);
    if (!initOnly) uninstallCodexIntegration();
    if (!skillsOnly) uninstallProject();
    console.log('\n  Uninstall complete. Restart Codex if integration changed.\n');
  } else {
    console.log(`\ndefspec-codex v${PKG.version}\n`);
    if (!initOnly) installCodexIntegration();
    if (!skillsOnly) initProject({ force, yes });
    if (!skillsOnly) await promptProjectGuideInit({ skip: noGuidePrompt });
    console.log('\n  Install complete. Restart Codex, then type /defspec in the composer.\n');
  }
} catch (error) {
  console.error(`\n  ❌ ${error.message}\n`);
  process.exit(1);
}
