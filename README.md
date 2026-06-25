# MetaGO CLI

> 让 AI 从工具进化为生命体 —— 在终端中直接调用元构能力引擎

`metago-cli` 是 [MetaGO Lifeform Kit](https://gitee.com/metago/metago-lifeform) 的命令行接口工具，让你无需依赖任何 IDE，即可在终端中列出、查看、调用"元构能力引擎"的 26 个生命体技能。

## 特性

- **零 IDE 依赖**：纯命令行调用，任意终端环境可用
- **跨平台**：Windows / macOS / Linux 全平台兼容
- **多源技能加载**：自动按优先级搜索多个候选技能目录
- **双格式兼容**：同时支持 frontmatter 带 description 与正文带 `## 描述` 两种 SKILL.md 格式
- **提示词生成**：把"技能指令 + 用户输入"组装成可粘贴到任意 AI 客户端的提示词
- **零硬编码凭证**：不包含任何 API token 或密钥

## 安装

### 全局安装（推荐）

```bash
npm install -g metago-cli
```

安装后即可在任意终端使用 `metago` 命令。

### 本地运行（开发）

```bash
git clone https://gitee.com/metago/metago-cli.git
cd metago-cli
npm install
node bin/metago.js <command>
```

## 快速开始

```bash
metago init                                  # 初始化环境，记录技能目录
metago list                                  # 列出所有技能
metago show metago-critique                  # 查看技能详情
metago run metago-critique --input "你的内容" # 生成技能调用提示词
```

## 命令说明

### `metago list`（别名 `ls`）

列出所有可用技能。

```bash
metago list            # 表格输出（技能名 | 描述 | 来源）
metago ls --json       # JSON 格式输出
```

### `metago show <skill-name>`

显示某个技能的完整内容。

```bash
metago show metago-critique                  # 完整内容
metago show metago-critique --frontmatter   # 仅显示 frontmatter 元数据
```

### `metago run <skill-name>`

调用某个技能处理输入文本，生成可复制粘贴到任意 AI 客户端的"技能调用提示词"。

由于 CLI 本身不调用 AI，本命令的语义是：把技能指令 + 用户输入组装成一段文本输出。

**输入来源**（互斥，优先级 `--input` > `--file` > `--stdin`）：

| 选项 | 说明 |
| --- | --- |
| `-i, --input <text>` | 直接输入文本 |
| `-f, --file <path>` | 从文件读取输入 |
| `--stdin` | 从标准输入读取 |

**输出**：

| 选项 | 说明 |
| --- | --- |
| `-o, --output <path>` | 输出到文件；默认输出到 stdout |

**示例**：

```bash
metago run metago-critique --input "需要批判性分析的内容"
metago run metago-critique --file ./input.txt
cat ./input.txt | metago run metago-critique --stdin
metago run metago-critique --input "内容" --output prompt.md
```

**输出格式**：

```
技能: {name}
描述: {description}
---
{技能正文}
---
用户输入: {input}
```

### `metago init`

初始化 MetaGO 环境：

- 创建配置目录 `~/.metago/`
- 按优先级搜索并记录技能目录
- 写入配置文件 `~/.metago/config.json`（记录 skills 路径、版本等）
- 若未找到 `metago-lifeform`，提示安装方式

### `metago version`（别名 `-v`、`--version`）

```bash
metago version     # 显示版本号 + 已加载技能数量
metago -v          # 显示版本号
metago --version   # 显示版本号
```

### `metago help`

```bash
metago help        # 显示总帮助
metago help list   # 显示指定命令的帮助
metago             # 无参数等同 help
```

## 技能目录搜索逻辑

MetaGO CLI 按以下优先级搜索技能目录（同名技能先找到的优先，自动去重）：

| 优先级 | 来源 | 路径 |
| --- | --- | --- |
| ① | 环境变量 | `$METAGO_SKILLS_DIR` |
| ② | 当前工作目录 | `./skills` |
| ③ | 配置文件 | `~/.metago/config.json` 中记录的路径（`init` 时写入） |
| ④ | 用户家目录 | `~/.trae-cn/skills` |
| ⑤ | 本包同级目录 | `../metago-lifeform/skills`（开发/克隆场景） |

通过环境变量自定义技能目录：

```bash
# Linux / macOS
export METAGO_SKILLS_DIR=/path/to/skills

# Windows PowerShell
$env:METAGO_SKILLS_DIR = "D:\path\to\skills"

# Windows CMD
set METAGO_SKILLS_DIR=D:\path\to\skills
```

## 配置文件

路径：`~/.metago/config.json`

```json
{
  "version": "1.0.0",
  "initialized": true,
  "initializedAt": "2026-06-26T00:00:00.000Z",
  "skillsDirs": [
    "/home/user/.trae-cn/skills",
    "/path/to/metago-lifeform/skills"
  ]
}
```

## SKILL.md 格式兼容

支持两种 frontmatter 格式，CLI 自动兼容：

**格式 A**（metago-lifeform 标准，描述在 frontmatter）：

```markdown
---
name: "metago-critique"
description: "批判性分析技能。对任何输入进行L1-L5分级批判性分析..."
source_document: 元构全息智能引擎.txt
---

# 批判性分析（metago-critique）
...
```

**格式 B**（Trae 安装版，描述在正文 `## 描述` 章节）：

```markdown
---
source_document: 元构完整信息.txt
source_skill: 批判性分析
---

# 批判性分析

## 描述
对任何输入进行L1-L5分级批判性分析...
```

兼容策略：

- `name` 缺失时，用技能目录名回退
- `description` 缺失时，从正文 `## 描述` / `## Description` 章节提取首行回退

## 与 metago-lifeform 的关系

| 项目 | 定位 |
| --- | --- |
| **metago-lifeform** | 能力引擎本体，沉淀 26 个生命体技能的 `SKILL.md` 定义、各 IDE 适配器、MCP Server 等核心资产 |
| **metago-cli** | 能力引擎的命令行入口，运行时搜索 metago-lifeform 的技能目录（**不作为 npm 依赖**），把技能能力暴露给终端用户 |

二者解耦：`metago-cli` 的 `package.json` 不依赖 `metago-lifeform`，而是通过运行时目录搜索发现技能，从而支持本地克隆、全局安装、IDE 安装等多种技能来源。

## 与产品矩阵的关系（战略规划第 3 阶段）

MetaGO 产品矩阵分三阶段推进：

1. **第 1 阶段 · 能力内核**：`metago-lifeform` 沉淀 26 个生命体技能与多 IDE 适配器，定义"AI 生命体"的能力基线。
2. **第 2 阶段 · IDE 集成**：通过 Trae / Cursor / Claude Code / Codex 等适配器，让能力在 IDE 内被调用。
3. **第 3 阶段 · 全域触达**：`metago-cli` 让能力脱离 IDE，进入终端、CI/CD、脚本、自动化流程，成为任意环境可调用的基础设施。

`metago-cli` 是第 3 阶段的关键交付：它使元构能力从"IDE 内的辅助"升级为"全域可调用的能力底座"，为后续的 MCP Server 对外服务、CI 集成、批处理自动化、Agent 编排奠定基础。

## 文件结构

```
metago-cli/
├── package.json
├── README.md
├── LICENSE
├── bin/
│   └── metago.js          # CLI 入口（含 shebang）
└── src/
    ├── index.js            # 主命令注册
    ├── commands/
    │   ├── list.js         # list / ls
    │   ├── show.js         # show
    │   ├── run.js          # run
    │   ├── init.js         # init
    │   └── version.js      # version
    └── lib/
        ├── skills-loader.js  # 技能目录搜索与 SKILL.md 解析
        └── config.js         # 配置管理（~/.metago/）
```

## 技术栈

- Node.js `>= 14`
- [Commander.js](https://github.com/tj/commander.js) `10.x`
- CommonJS 模块系统
- 自实现 YAML frontmatter 解析（无第三方 YAML 依赖）

## 开发约束

- 不硬编码任何 API token 或凭证
- 不依赖 `metago-lifeform` 作为 npm 依赖（运行时搜索技能目录）
- 代码跨平台兼容（Windows / macOS / Linux）
- 所有注释与用户输出使用中文
- `package.json` 的 `bin` 字段配置为 `./bin/metago.js`

## License

MIT (c) MetaGO Lightyear

## 仓库

- Gitee: https://gitee.com/metago/metago-cli.git
