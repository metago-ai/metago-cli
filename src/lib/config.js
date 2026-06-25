'use strict';

/**
 * 配置管理
 * 负责 ~/.metago/ 配置目录与 config.json 的读写，统一跨平台路径处理。
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const pkg = require('../../package.json');

/**
 * 获取配置目录：~/.metago/
 */
function getConfigDir() {
  return path.join(os.homedir(), '.metago');
}

/**
 * 获取配置文件路径：~/.metago/config.json
 */
function getConfigPath() {
  return path.join(getConfigDir(), 'config.json');
}

/**
 * 默认配置（读取失败或未初始化时返回）
 */
function defaultConfig() {
  return {
    version: pkg.version,
    initialized: false,
    initializedAt: null,
    skillsDirs: []
  };
}

/**
 * 读取配置；若不存在或解析失败则返回默认配置（不抛错）。
 */
function loadConfig() {
  try {
    const raw = fs.readFileSync(getConfigPath(), 'utf-8');
    const parsed = JSON.parse(raw);
    return Object.assign(defaultConfig(), parsed);
  } catch (e) {
    return defaultConfig();
  }
}

/**
 * 写入配置；自动创建配置目录。
 */
function saveConfig(config) {
  const dir = getConfigDir();
  fs.mkdirSync(dir, { recursive: true });
  const merged = Object.assign(defaultConfig(), config);
  fs.writeFileSync(getConfigPath(), JSON.stringify(merged, null, 2), 'utf-8');
  return merged;
}

/**
 * 判断配置是否已初始化
 */
function isInitialized() {
  return !!loadConfig().initialized;
}

module.exports = {
  getConfigDir,
  getConfigPath,
  defaultConfig,
  loadConfig,
  saveConfig,
  isInitialized
};
