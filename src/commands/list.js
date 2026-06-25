'use strict';

/**
 * list / ls 命令
 * 列出所有可用技能，支持表格（默认）与 JSON 两种输出格式。
 */

const { loadAllSkills, findSkillsDirs } = require('../lib/skills-loader');

module.exports = function (program) {
  program
    .command('list')
    .alias('ls')
    .description('列出所有可用技能')
    .option('--json', '以 JSON 格式输出')
    .action((options) => {
      const skills = loadAllSkills();

      if (skills.length === 0) {
        const dirs = findSkillsDirs();
        console.error('未找到任何技能。');
        console.error('');
        console.error('已搜索以下候选目录（均未包含技能）：');
        const candidates = dirs.length > 0 ? dirs : [];
        if (candidates.length === 0) {
          console.error('  （无任何候选目录存在）');
        } else {
          candidates.forEach(d => console.error('  - ' + d.path + '  (来源: ' + d.source + ')'));
        }
        console.error('');
        console.error('提示：可通过以下方式提供技能目录：');
        console.error('  1. 设置环境变量 METAGO_SKILLS_DIR 指向技能目录');
        console.error('  2. 运行 metago init 初始化环境并记录路径');
        console.error('  3. 将技能放到当前目录的 ./skills 子目录');
        console.error('  4. 将技能放到 ~/.trae-cn/skills');
        process.exit(1);
      }

      if (options.json) {
        const data = skills.map(s => ({
          name: s.name,
          description: s.description,
          source: s.source
        }));
        console.log(JSON.stringify(data, null, 2));
        return;
      }

      // 表格输出：技能名 | 描述 | 来源
      const headers = ['技能名', '描述', '来源'];
      const rows = skills.map(s => [s.name, s.description, s.source]);
      printTable(headers, rows);

      console.error('');
      console.error('共 ' + skills.length + ' 个技能。运行 metago show <技能名> 查看详情。');
    });
};

/**
 * 简单的表格打印（带边框），自动按显示宽度对齐，中文按 2 列宽计算。
 */
function printTable(headers, rows) {
  const allRows = [headers, ...rows];
  const widths = headers.map((_, i) =>
    Math.max(...allRows.map(r => displayWidth(String(r[i] == null ? '' : r[i]))))
  );
  const sep = '+-' + widths.map(w => '-'.repeat(w)).join('-+-') + '-+';
  console.log(sep);
  console.log('| ' + headers.map((h, i) => pad(h, widths[i])).join(' | ') + ' |');
  console.log(sep);
  for (const row of rows) {
    console.log('| ' + row.map((cell, i) => pad(String(cell == null ? '' : cell), widths[i])).join(' | ') + ' |');
  }
  console.log(sep);
}

/**
 * 计算字符串的显示宽度（CJK 字符算 2 列，其余算 1 列）。
 */
function displayWidth(str) {
  let w = 0;
  for (const ch of str) {
    w += /[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(ch) ? 2 : 1;
  }
  return w;
}

/**
 * 按显示宽度右侧补空格对齐。
 */
function pad(str, width) {
  const w = displayWidth(str);
  return str + ' '.repeat(Math.max(0, width - w));
}
