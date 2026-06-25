## 版本公告模板

用户说"整理版本公告"时，执行以下逻辑：

1. 用 `git log --oneline <上一版本号对应commit>..HEAD` 获取变更列表
2. 按 修复/新增/改进/文档 分类整理
3. 用以下模板输出中文公告：

```
## 雪峰Agent vX.X.X 更新公告

---

**🎓 雪峰Agent vX.X.X 已发布！**

<一句话概述本次更新重点>

### 🔧 修复
- <修复项>

### ✨ 新增
- <新增项>

### 🚀 改进
- <改进项>

### 📜 文档
- <文档变更>（如有）

---

📥 **下载**：[GitHub Releases](https://github.com/NanCheng-L/XuefengAgent-Desktop/releases/latest)
💬 **反馈**：[GitHub Issues](https://github.com/NanCheng-L/XuefengAgent-Desktop/issues)
```
