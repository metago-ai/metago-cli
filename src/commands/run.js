'use strict';

/**
 * run 命令
 * 调用某个技能处理输入文本，生成可复制粘贴到任意 AI 客户端的"技能调用提示词"。
 *
 * 由于 CLI 无法直接调用 AI，本命令的语义是：把技能指令 + 用户输入组装成一段文本输出到 stdout。
 *
 * 输入来源（互斥，优先级：--input > --file > --stdin）：
 *   --input <text>  直接输入文本
 *   --file <path>   从文件读取
 *   --stdin         从标准输入读取
 * 输出：
 *   --output <path> 写入文件；否则输出到 stdout
 */

const fs = require('fs');
const path = require('path');
const { loadSkill } = require('../lib/skills-loader');

module.exports = function (program) {
  program
    .command('run <skill-name>')
    .description('调用某个技能处理输入文本，生成可粘贴到 AI 客户端的提示词')
    .option('-i, --input <text>', '直接输入文本')
    .option('-f, --file <path>', '从文件读取输入')
    .option('--stdin', '从标准输入读取')
    .option('-o, --output <path>', '输出到文件')
    .action(async (skillName, options) => {
      const skill = loadSkill(skillName);
      if (!skill) {
        console.error('错误：未找到技能 "' + skillName + '"。');
        console.error('提示：运行 metago list 查看可用技能列表。');
        process.exit(1);
      }

      // 收集输入
      let input = '';
      if (options.input != null) {
        input = String(options.input);
      } else if (options.file) {
        const filePath = path.resolve(options.file);
        try {
          input = fs.readFileSync(filePath, 'utf-8');
        } catch (e) {
          console.error('错误：无法读取文件 ' + options.file + '：' + e.message);
          process.exit(1);
        }
      } else if (options.stdin) {
        input = await readStdin();
        if (input === '') {
          console.error('错误：--stdin 未读取到任何输入。');
          process.exit(1);
        }
      } else {
        console.error('错误：未提供输入。请使用 --input、--file 或 --stdin 提供输入。');
        console.error('');
        console.error('示例：');
        console.error('  metago run ' + skillName + ' --input "需要分析的内容"');
        console.error('  metago run ' + skillName + ' --file ./input.txt');
        console.error('  cat ./input.txt | metago run ' + skillName + ' --stdin');
        process.exit(1);
      }

      // 组装提示词（严格遵循规格输出格式）
      const prompt =
        '技能: ' + skill.name + '\n' +
        '描述: ' + skill.description + '\n' +
        '---\n' +
        skill.body + '\n' +
        '---\n' +
        '用户输入: ' + input;

      if (options.output) {
        const outPath = path.resolve(options.output);
        try {
          fs.writeFileSync(outPath, prompt, 'utf-8');
          console.error('提示词已写入: ' + outPath);
        } catch (e) {
          console.error('错误：无法写入文件 ' + options.output + '：' + e.message);
          process.exit(1);
        }
      } else {
        // 用 stdout 输出，便于管道与重定向；末尾补一个换行
        process.stdout.write(prompt + '\n');
      }
    });
};

/**
 * 读取 stdin 全部内容为字符串。
 * 若处于交互式 TTY（无管道输入），返回空串避免无限阻塞。
 */
function readStdin() {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(''));
  });
}
