# Zotero 单篇 PDF 配色

为 Zotero 里的每篇 PDF 单独选择 **跟随 Zotero、固定浅色或固定深色**。固定配色只应用于 PDF 纸张，纸张周围的背景和阅读器界面继续跟随 Zotero 的外观。选择会保存在本机，下次打开时自动恢复。

## 安装

1. [下载 v0.1.4 安装包](zotero-pdf-color-0.1.4.xpi)。
2. 在 Zotero 打开 **工具 → 插件 → 齿轮 → 从文件安装插件**，选择下载的文件。
3. 打开 PDF，在「外观」按钮旁的下拉框选择配色。

适用于 Zotero 10.0.7 至 10.0.x。可用 `zip -X zotero-pdf-color.xpi manifest.json bootstrap.js` 从源码打包。

## 项目结构

- `manifest.json` 记录插件名称、版本和支持的 Zotero 版本。
- `bootstrap.js` 是插件入口，负责添加配色菜单、保存每个 PDF 的选择并应用主题。
- `zotero-pdf-color-0.1.4.xpi` 是可以直接导入 Zotero 的安装包。
- `README.md` 提供功能介绍和安装说明，`LICENSE` 包含 MIT 许可证。

## 项目分工

由 [TYC1211](https://github.com/TYC1211) 提出想法，ChatGPT-6.1 负责实现。

特别感谢 GPT-6.1 的帮助，让没有编程经验的我也能把这个想法做成一个可以安装使用的 Zotero 插件。

项目采用 [MIT 许可证](LICENSE)。
