---
name: update-json
description: 生成 latest.json 文件用于自动更新，用户说"更新json文件"或"更新一下json文件"时触发
---

# 生成 latest.json

用户说"更新json文件"或"更新一下json文件"时，按以下步骤执行：

## 打包默认目录

```
src-tauri\target\release\bundle\nsis\
```

## 步骤

1. **获取当前版本号**：从 `package.json` 读取当前版本号
2. **查找打包文件**：在打包目录中查找签名文件
   - 签名文件：`XuefengAgent-Desktop_{version}_x64-setup.exe.sig`
3. **读取签名**：读取签名文件内容
4. **生成版本公告**：
   - 优先从 CHANGELOG.md 提取
   - 如果没有，从 git log 提取
5. **生成 latest.json**：放在项目根目录

## latest.json 格式

```json
{
  "version": "0.1.3",
  "notes": "版本公告内容（换行用\n）",
  "pub_date": "2026-06-26T17:30:00.000Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "签名文件内容",
      "url": "https://github.com/NanCheng-L/XuefengAgent-Desktop/releases/download/v{version}/XuefengAgent-Desktop_{version}_x64-setup.exe"
    }
  }
}
```

## 注意事项

- 版本号前加 `v`（如 `0.1.3` → `v0.1.3`）
- URL 使用 GitHub Release 的下载地址
- pub_date 使用当前时间，ISO 8601 格式
- 生成后提示用户手动上传到 GitHub Release
- 不要自动创建 Release 或上传文件
