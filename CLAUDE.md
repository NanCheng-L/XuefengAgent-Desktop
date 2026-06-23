# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 语言要求

- 所有对话和文档都使用中文
- 代码注释使用中文
- 错误提示使用中文

## 项目概述

雪峰Agent桌面版是一款 AI 高考志愿顾问桌面应用，基于 xuefeng-agent 项目改造。内置 24 省官方录取数据库，支持 AI 智能志愿推荐、联网搜索、多轮对话等功能。

## 技术栈

- **前端**: Vue 3 + TypeScript + Vite
- **桌面框架**: Tauri 2.0（使用 NSIS 打包）
- **后端**: Rust（Tauri 2）
- **目标平台**: Windows 10/11 x86_64

## 常用命令

```bash
# 安装依赖
pnpm install

# 前端开发（仅 Vite，不含 Tauri）
pnpm dev

# Tauri 开发模式（前端 + Rust 后端）
pnpm tauri dev

# 构建生产版本
pnpm tauri build

# TypeScript 类型检查
vue-tsc --noEmit
```

## 架构

### 前后端通信

前端通过 `@tauri-apps/api` 的 `invoke()` 调用 Rust 后端命令，`src-tauri/src/lib.rs` 中用 `#[tauri::command]` 注册的函数即为可调用的后端命令。数据通过 `serde` 序列化/反序列化在前后端之间传输，Rust 结构体使用 `#[serde(rename_all = "camelCase")]` 与 TypeScript 驼峰命名对齐。

### 前端结构 (`src/`)

- `components/` — 通用组件（`Sidebar`、`ChatArea`、`InputBox`、`ApiSettings`）
- `composables/` — Vue 组合式函数（`useChat` 聊天状态管理）
- `types/` — TypeScript 类型定义
- `utils/` — 工具函数

### 后端结构 (`src-tauri/src/`)

- `main.rs` — 入口
- `lib.rs` — 核心逻辑，包含所有 `#[tauri::command]` 命令

## 关键功能

- **聊天管理**: 多轮对话、新建/切换/删除对话
- **模式切换**: 报考模式（正式志愿分析）←→ 娱乐模式（张雪峰风格）
- **API 设置**: Base URL、API Key、Model、Tavily Key 配置
- **深色模式**: 主题切换
- **数据提取**: AI 智能提取省份、位次、专业偏好
- **联网搜索**: Tavily 优先，百度兜底

## 版本号管理

版本号需同时更新三处：

- `package.json` 的 `version`
- `src-tauri/Cargo.toml` 的 `version`
- `src-tauri/tauri.conf.json` 的 `version`

## 注意事项

- 后端暂未实现，前端通过 HTTP 调用 Python 服务器（xuefeng-agent 项目的 server.py）
- 数据库文件 `admission_clean.db.gz` 需放在项目根目录
- API Key 存储在浏览器 localStorage，不上传服务器
- **git add、git commit 只有用户明确说"提交 git"时才执行，不要主动提交**