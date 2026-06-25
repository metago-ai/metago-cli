#!/usr/bin/env node
'use strict';

/**
 * MetaGO CLI 入口
 * 让 AI 从工具进化为生命体的能力引擎 —— 命令行接口
 *
 * 该入口仅负责引导启动，所有命令注册逻辑在 src/index.js 中完成。
 */

const { run } = require('../src/index');

run();
