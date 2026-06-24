# 雪峰Agent桌面版 — AI 高考志愿顾问

> 基于 [xuefeng-agent](https://github.com/ziqihe10-droid/xuefeng-agent) 改造的 Tauri 2 桌面应用。
> 内置官方录取数据库，安装即用，无需 Python 依赖。

## 下载

[![GitHub Release](https://img.shields.io/github/v/release/NanCheng-L/XuefengAgent-Desktop)](https://github.com/NanCheng-L/XuefengAgent-Desktop/releases/latest)

👉 **[点击下载最新版本](https://github.com/NanCheng-L/XuefengAgent-Desktop/releases/latest)**

> 进入下载页面后，找到 `.exe` 后缀的文件（如 `XuefengAgent-Desktop_0.1.1_x64-setup.exe`），点击下载并双击运行安装。

## 功能特性

- **本地数据库**: 8 省 × 2024-2025 年官方投档线，约 26 万条，位次精确匹配
- **AI 智能提取**: 自动从描述中识别省份、位次、专业偏好
- **联网搜索**: Tavily 优先，百度兜底（覆盖未收录省份）
- **多轮对话**: 上下文记忆，追问不用重复说
- **双模式**: 报考模式（正式志愿分析）←→ 娱乐模式（张雪峰风格）
- **深色/浅色主题**: 参考喵咪麦克配色，跟随主题切换
- **多服务商**: 预设 DeepSeek、小米 MiMo、通义千问、智谱 GLM 等 9 家服务商
- **独立设置窗口**: API 设置、软件设置（关于、会话管理、更新检查）
- **系统托盘**: 关闭窗口隐藏到托盘，不退出
- **自动更新**: 基于 GitHub Releases 的更新检查

## 技术栈

- **前端**: Vue 3 + TypeScript + Vite
- **桌面框架**: Tauri 2.0（Rust 后端）
- **数据库**: SQLite（rusqlite，bundled）
- **网络**: reqwest（百度搜索 + Tavily API）

## 快速开始

```bash
pnpm install --ignore-scripts   # 安装依赖
pnpm dev                         # 仅前端
pnpm tauri dev                   # 完整桌面应用
pnpm tauri build                 # 构建安装包
```

## 使用方法

1. 启动应用，点击顶部「API设置」或「点击设置 API」
2. 选择服务商，填写 API Key
3. 在输入框输入省份、分数、位次
4. 获取冲稳保志愿推荐

## 示例输入

```
浙江655分位次10500，想学计算机电子，不接受调剂
```

## 数据库覆盖

当前数据库包含 8 个省份的 2024-2025 年官方投档线数据（约 26 万条）：

| 省份 | 数据量 | 省份 | 数据量 |
|------|--------|------|--------|
| 河北 | 96,524 条 | 江苏 | 29,548 条 |
| 山东 | 64,513 条 | 内蒙古 | 9,504 条 |
| 浙江 | 46,595 条 | 安徽 | 4,379 条 |
| 江西 | 4,351 条 | 湖南 | 3,023 条 |

> ⚠️ 注意：数据库未覆盖四川、广东、湖北等省份。未覆盖的省份会通过联网搜索（Tavily/百度）获取数据。

## 项目结构

```
├── src/                        # 前端源码
│   ├── App.vue                 # 主布局
│   ├── components/             # 组件（TopBar、Sidebar、ChatArea、InputBox、UpdateChecker）
│   ├── views/                  # 独立窗口（SettingsPage、SoftwareSettingsPage）
│   ├── composables/            # useChat（聊天+数据管线）
│   └── utils/providers.ts      # 服务商预设
├── src-tauri/                  # Rust 后端
│   ├── src/lib.rs              # SQLite 查询 + 百度搜索 + Tavily
│   └── resources/              # 录取数据库
├── settings.html               # API 设置窗口入口
└── settings-page.html          # 软件设置窗口入口
```

## 免责声明

1. 志愿填报是考生自己的事，本工具仅供决策参考。
2. AI 可能出错，请务必自行核实。
3. 数据来自各省教育考试院官方投档线，但录取数据每年变化。
4. 使用本工具产生的任何决策及其后果，由考生和家长自行承担。

## 开源协议

本项目基于 [xuefeng-agent](https://github.com/ziqihe10-droid/xuefeng-agent) 改造，遵循 AGPL v3 协议。

## 致谢

- 原项目作者：贺子麒 (ziqihe10-droid)
- 原项目地址：https://github.com/ziqihe10-droid/xuefeng-agent
- 桌面版作者：[NanCheng-L](https://github.com/NanCheng-L)
