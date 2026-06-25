'use strict';

/**
 * init 命令
 * 初始化 MetaGO 环境：检查 metago-lifeform 是否安装、创建 ~/.metago/ 目录、写入 config.json。
 */

const fs = require('fs');
const pkg = require('../../package.json');
const { findSkillsDirs, getCandidateSkillsDirs } = require('../lib/skills-loader');
const { getConfigDir, getConfigPath, loadConfig, saveConfig } = require('../lib/config');

module.exports = function (program) {
  program
    .command('init')
    .description('初始化 MetaGO 环境')
    .action(() => {
      console.log('MetaGO 环境初始化');
      console.log('==================');
      console.log('');

      // 1. 创建配置目录 ~/.metago/
      const configDir = getConfigDir();
      try {
        fs.mkdirSync(configDir, { recursive: true });
        console.log('[OK] 已创建配置目录: ' + configDir);
      } catch (e) {
        console.error('[FAIL] 创建配置目录失败: ' + e.message);
        process.exit(1);
      }

      // 2. 检查 metago-lifeform 是否安装（通过搜索技能目录）
      const foundDirs = findSkillsDirs();
      if (foundDirs.length === 0) {
        console.log('[WARN] 未找到 metago-lifeform 技能目录。');
        console.log('       已搜索以下候选目录（均不存在）：');
        getCandidateSkillsDirs().forEach(c => {
          console.log('       - ' + c.path + '  (' + c.source + ')');
        });
        console.log('');
        console.log('       请安装 metago-lifeform，或通过以下方式指定技能目录：');
        console.log('         · 设置环境变量 METAGO_SKILLS_DIR 指向技能目录');
        console.log('         · 将技能目录放到当前目录的 ./skills');
        console.log('         · 将技能目录放到 ~/.trae-cn/skills');
        console.log('         · 将 metago-lifeform 克隆到本包的同级目录');
      } else {
        console.log('[OK] 找到技能目录：');
        foundDirs.forEach(d => {
          console.log('       - ' + d.path + '  (来源: ' + d.source + ')');
        });
      }

      // 3. 写入配置文件 config.json（记录 skills 路径、版本等）
      const config = loadConfig();
      config.version = pkg.version;
      config.initialized = true;
      config.initializedAt = new Date().toISOString();
      config.skillsDirs = foundDirs.map(d => d.path);
      saveConfig(config);
      console.log('[OK] 已写入配置文件: ' + getConfigPath());

      console.log('');
      console.log('初始化完成。现在可以使用以下命令：');
      console.log('  metago list            列出所有技能');
      console.log('  metago show <name>     查看技能详情');
      console.log('  metago run <name>      生成技能调用提示词');
      console.log('  metago version         查看版本与技能数量');
    });
};
