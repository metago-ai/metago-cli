'use strict';

/**
 * version 命令
 * - 注册 -v / --version flag（显示版本号）
 * - 注册 version 子命令（显示版本号 + 已加载技能数量）
 */

const pkg = require('../../package.json');
const { loadAllSkills } = require('../lib/skills-loader');

module.exports = function (program) {
  // 注册 -v / --version flag
  program.version(pkg.version, '-v, --version', '显示版本号');

  // 注册 version 子命令
  program
    .command('version')
    .description('显示版本号和已安装的技能数量')
    .action(() => {
      let count = 0;
      try {
        count = loadAllSkills().length;
      } catch (e) {
        /* 忽略加载错误，技能数为 0 */
      }
      console.log('metago-cli v' + pkg.version);
      console.log('已加载技能数量: ' + count);
    });
};
