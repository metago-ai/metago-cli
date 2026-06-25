'use strict';

/**
 * 技能加载器
 * 负责按优先级搜索技能目录、加载并解析 SKILL.md 文件（含 YAML frontmatter）。
 *
 * SKILL.md 格式示例：
 *   ---
 *   name: "metago-critique"
 *   description: "批判性分析技能..."
 *   source_document: 元构全息智能引擎.txt
 *   ---
 *
 *   # 技能正文内容...
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { loadConfig } = require('./config');

/**
 * 获取技能目录候选列表（按优先级排序，包含来源标识）。
 *
 * 优先级（符合规格要求，并额外支持配置文件中记录的路径）：
 *   ① 环境变量 METAGO_SKILLS_DIR
 *   ② ./skills（当前工作目录）
 *   ③ ~/.metago/config.json 中记录的 skills 路径（init 时写入，便于全局安装后复用）
 *   ④ ~/.trae-cn/skills（用户家目录）
 *   ⑤ ../metago-lifeform/skills（相对于本包目录）
 */
function getCandidateSkillsDirs() {
  const candidates = [];

  // ① 环境变量
  if (process.env.METAGO_SKILLS_DIR) {
    candidates.push({
      path: path.resolve(process.env.METAGO_SKILLS_DIR),
      source: '环境变量 METAGO_SKILLS_DIR'
    });
  }

  // ② 当前工作目录下的 ./skills
  candidates.push({
    path: path.resolve(process.cwd(), 'skills'),
    source: './skills (当前工作目录)'
  });

  // ③ 配置文件中记录的路径（init 时写入）
  try {
    const config = loadConfig();
    if (Array.isArray(config.skillsDirs)) {
      for (const p of config.skillsDirs) {
        if (typeof p === 'string' && p.trim()) {
          candidates.push({
            path: path.resolve(p),
            source: '配置文件 (~/.metago/config.json)'
          });
        }
      }
    }
  } catch (e) {
    /* 忽略读取失败 */
  }

  // ④ 用户家目录 ~/.trae-cn/skills
  candidates.push({
    path: path.join(os.homedir(), '.trae-cn', 'skills'),
    source: '~/.trae-cn/skills'
  });

  // ⑤ 相对于本包目录的 ../metago-lifeform/skills
  // __dirname = <包根>/src/lib，向上两级到包根，再上一级，进入 metago-lifeform/skills
  candidates.push({
    path: path.resolve(__dirname, '..', '..', '..', 'metago-lifeform', 'skills'),
    source: '../metago-lifeform/skills'
  });

  return candidates;
}

/**
 * 返回所有实际存在的技能目录（按优先级去重）。
 * @returns {Array<{path:string, source:string}>}
 */
function findSkillsDirs() {
  const candidates = getCandidateSkillsDirs();
  const seen = new Set();
  const found = [];
  for (const c of candidates) {
    const norm = path.normalize(c.path);
    if (seen.has(norm)) continue;
    seen.add(norm);
    try {
      if (fs.statSync(c.path).isDirectory()) {
        found.push({ path: c.path, source: c.source });
      }
    } catch (e) {
      /* 目录不存在，跳过 */
    }
  }
  return found;
}

/**
 * 解析 YAML frontmatter 与正文。
 * 仅支持简单的 `key: value` 形式，value 可带单/双引号；不依赖第三方 YAML 库。
 *
 * @param {string} content SKILL.md 原始内容
 * @returns {{frontmatter:Object, body:string}}
 */
function parseFrontmatter(content) {
  const result = { frontmatter: {}, body: content };
  // 匹配开头的 --- ... --- 块
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    // 无 frontmatter，整体作为正文
    return { frontmatter: {}, body: content };
  }

  const yamlText = match[1];
  const body = match[2];
  const frontmatter = {};

  for (const line of yamlText.split(/\r?\n/)) {
    if (!line.trim()) continue;
    if (line.trim().startsWith('#')) continue; // 注释行
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    // 去除包裹引号
    if (value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))) {
      value = value.slice(1, -1);
    }
    frontmatter[key] = value;
  }

  return { frontmatter, body };
}

/**
 * 解析单个 SKILL.md 文件，返回技能对象。
 */
function parseSkillFile(filePath, source) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(raw);
  const stat = fs.statSync(filePath);
  // name：优先用 frontmatter.name，否则用目录名回退
  const name = frontmatter.name || path.basename(path.dirname(filePath));
  // description：优先用 frontmatter.description，否则从正文 "## 描述" 章节回退提取
  const description = frontmatter.description || extractDescriptionFromBody(body);
  return {
    name: name,
    description: description,
    frontmatter: frontmatter,
    body: body.trim(),
    raw: raw,
    dir: path.dirname(filePath),
    file: filePath,
    source: source,
    mtime: stat.mtime
  };
}

/**
 * 从正文的 "## 描述" / "## Description" 章节提取首行作为描述。
 * 兼容 ~/.trae-cn/skills 中把描述放在正文、frontmatter 无 description 字段的 SKILL.md 格式。
 * 找不到时回退到正文第一个非空、非标题行。
 */
function extractDescriptionFromBody(body) {
  const re = /^##\s*(?:描述|Description)\s*\r?\n([\s\S]*?)(?=\r?\n##\s|$)/im;
  const m = body.match(re);
  if (m && m[1]) {
    const firstLine = m[1].trim().split(/\r?\n/)[0].trim();
    if (firstLine) return firstLine;
  }
  // 回退：取正文第一个非空、非标题行
  for (const line of body.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    if (t.startsWith('#')) continue;
    return t;
  }
  return '';
}

/**
 * 加载所有技能（合并多个目录，按 name 去重，先出现的优先）。
 * 结果按技能名排序。
 */
function loadAllSkills() {
  const dirs = findSkillsDirs();
  const map = new Map();

  for (const d of dirs) {
    let entries = [];
    try {
      entries = fs.readdirSync(d.path, { withFileTypes: true });
    } catch (e) {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const skillFile = path.join(d.path, entry.name, 'SKILL.md');
      try {
        fs.accessSync(skillFile, fs.constants.R_OK);
      } catch (e) {
        continue; // 该子目录无 SKILL.md，跳过
      }
      try {
        const skill = parseSkillFile(skillFile, d.source);
        if (!map.has(skill.name)) {
          map.set(skill.name, skill);
        }
      } catch (e) {
        /* 解析失败，跳过该技能 */
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * 按名称加载单个技能。
 * @param {string} name 技能名（frontmatter 中的 name）
 * @returns {object|null}
 */
function loadSkill(name) {
  return loadAllSkills().find(s => s.name === name) || null;
}

module.exports = {
  getCandidateSkillsDirs,
  findSkillsDirs,
  parseFrontmatter,
  parseSkillFile,
  loadAllSkills,
  loadSkill
};
