'use strict';

/**
 * show 命令
 * 显示某个技能的完整内容，支持 --frontmatter 仅显示元数据。
 */

const { loadSkill } = require('../lib/skills-loader');

module.exports = function (program) {
  program
    .command('show <skill-name>')
    .description('显示某个技能的完整内容')
    .option('--frontmatter', '仅显示 frontmatter 元数据')
    .action((skillName, options) => {
      const skill = loadSkill(skillName);
      if (!skill) {
        console.error('错误：未找到技能 "' + skillName + '"。');
        console.error('提示：运行 metago list 查看可用技能列表。');
        process.exit(1);
      }

      if (options.frontmatter) {
        // 仅输出 frontmatter 元数据
        console.log('---');
        for (const [k, v] of Object.entries(skill.frontmatter)) {
          console.log(k + ': ' + v);
        }
        console.log('---');
        return;
      }

      // 完整输出：技能名、描述、来源、文件路径，然后是正文
      console.log('技能名: ' + skill.name);
      console.log('描述: ' + skill.description);
      console.log('来源: ' + skill.source);
      console.log('文件: ' + skill.file);
      console.log('');
      console.log('---');
      console.log(skill.body);
      console.log('---');
    });
};
