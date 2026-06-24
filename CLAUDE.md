# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 语言要求

- 所有对话和文档都使用中文
- 代码注释使用中文
- 错误提示使用中文

## 红线（必须遵守）

- **git add、git commit 只有用户明确说"提交 git"时才执行，不要主动提交**
- **不要自己提交代码，必须等用户说"提交代码"**
- **删除文件、删除目录、修改 .env、密钥、token、数据库 schema 变更前必须先问用户**

## 项目概述

雪峰Agent桌面版是一款 AI 高考志愿顾问桌面应用，基于 xuefeng-agent 项目改造。内置 8 省官方录取数据库（约 26 万条），支持 AI 智能志愿推荐、联网搜索、多轮对话等功能。

## 技术栈

- **前端**: Vue 3 + TypeScript + Vite
- **桌面框架**: Tauri 2.0（NSIS 打包）
- **后端**: Rust（SQLite 查询 + 百度搜索 + Tavily 搜索）
- **目标平台**: Windows 10/11 x86_64

## 常用命令

```bash
pnpm install --ignore-scripts  # 安装依赖
pnpm dev                        # 仅前端开发
pnpm tauri dev                  # 完整桌面应用
pnpm tauri build                # 构建生产版本
vue-tsc --noEmit                # TypeScript 类型检查
```

## 前端结构 (`src/`)

- `App.vue` — 主布局，精简到 ~90 行
- `components/` — 组件
  - `TopBar.vue` — 顶部栏（模型显示、模式切换、主题、设置按钮）
  - `Sidebar.vue` — 左侧对话列表
  - `ChatArea.vue` — 聊天消息区域（v-md-preview 渲染 markdown）
  - `InputBox.vue` — 输入框
  - `UpdateChecker.vue` — 更新检查组件
- `views/` — 独立窗口页面
  - `SettingsPage.vue` — API 设置窗口
  - `SoftwareSettingsPage.vue` — 软件设置窗口
- `composables/` — 组合式函数
  - `useChat.ts` — 聊天状态管理、AI 数据管线、数据库查询
- `utils/providers.ts` — 服务商预设配置（DeepSeek、小米 MiMo、通义千问等）
- `types/index.ts` — TypeScript 类型定义

## 后端结构 (`src-tauri/src/`)

- `lib.rs` — Rust 后端（SQLite 查询、百度搜索、Tavily 搜索、系统托盘）
- `main.rs` — 入口
- `resources/admission_clean.db.gz` — 录取数据库（运行时自动解压）

## 多窗口架构

- **主窗口** — 聊天界面
- **settings** — API 设置（`settings.html` → `settings-main.ts` → `SettingsPage.vue`）
- **software-settings** — 软件设置（`settings-page.html` → `settings-page-main.ts` → `SoftwareSettingsPage.vue`）

窗口间通信：设置窗口保存后通过 Tauri 事件 `config-updated` 通知主窗口。

## 主题系统

- 默认浅色，`data-theme="dark"` 切换深色
- 配色参考喵咪麦克（pico-denoise）：浅色奶油白+橘色 / 深色黑色+绿色
- CSS 变量定义在 `src/assets/styles/global.css`
- 所有组件使用 `var(--bg)`、`var(--surface)`、`var(--primary)` 等变量

## 服务商预设 (`utils/providers.ts`)

| 服务商 | API 地址 | 备注 |
|--------|----------|------|
| DeepSeek（推荐） | api.deepseek.com | v4-flash / v4-pro |
| 小米 MiMo（推荐） | api.xiaomimimo.com/v1 | mimo-v2.5-pro / mimo-v2.5 |
| 小米 MiMo (套餐) | token-plan-cn.xiaomimimo.com/v1 | 同上 |
| 通义千问 | dashscope.aliyuncs.com | qwen-plus/turbo/max |
| 智谱 GLM | open.bigmodel.cn | glm-4-flash/plus/long |
| 豆包 | ark.cn-beijing.volces.com | doubao-1.5-pro/lite |
| Moonshot | api.moonshot.cn | v1-8k/32k/128k |
| GPT | api.openai.com | gpt-4o/4o-mini |
| Claude | api.anthropic.com | sonnet-4/3.5-haiku |

## 版本号管理

版本号需同时更新三处：`package.json`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json`

## 注意事项

- 数据库文件 `admission_clean.db.gz` 放在 `src-tauri/resources/`
- API Key 存储在浏览器 localStorage，不上传服务器
- URL 自动处理 `/v1` 重复拼接（如小米 MiMo 的 URL 已含 `/v1`）
