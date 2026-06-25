'use strict';

/**
 * MetaGO CLI 主入口
 * 注册所有命令并解析命令行参数。
 */

const { program } = require('commander');

// 程序元信息
program.name('metago');
program.description('MetaGO CLI - 让 AI 从工具进化为生命体的能力引擎命令行接口');

// 注册各命令（每个模块导出一个接收 program 的注册函数）
require('./commands/version')(program);
require('./commands/list')(program);
require('./commands/show')(program);
require('./commands/run')(program);
require('./commands/init')(program);

// 自定义 help 子命令（commander 10 仅有 -h/--help flag，无内建 help 子命令，故自行注册）
program
  .command('help [command]')
  .description('显示帮助信息')
  .action((cmd) => {
    if (cmd) {
      const target = program.commands.find((c) => {
        const names = [c.name()];
        try {
          const aliases = c.aliases();
          if (Array.isArray(aliases)) names.push(...aliases);
        } catch (e) {
          /* 忽略 */
        }
        return names.includes(cmd);
      });
      if (target) {
        target.outputHelp();
      } else {
        console.error('未知命令: ' + cmd);
        process.exit(1);
      }
    } else {
      program.outputHelp();
    }
  });

/**
 * 启动 CLI：解析参数并执行。
 * 无任何参数时默认显示帮助信息。
 */
function run() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    program.outputHelp();
    process.exit(0);
    return;
  }

  program.parseAsync(process.argv).catch((err) => {
    console.error('错误: ' + err.message);
    process.exit(1);
  });
}

module.exports = { run, program };
