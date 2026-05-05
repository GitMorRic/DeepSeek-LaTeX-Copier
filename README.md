# deepseek-latex-copier
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![GreasyFork](https://img.shields.io/badge/GreasyFork-Click_to_Install-green.svg)](#)

一个用于解决DeepSeek网页版数学公式(LaTeX)复制乱码问题的Tampermonkey（油猴)用户脚本

## 痛点和解决方案
截止2025年5月5日,在DeepSeek网页端复制数学公式时，会出现：
-  **字符重复/乱码**：如 `q(t)q(t)` 或 `q˙q˙`（由于 KaTeX 的无障碍双重渲染导致）

*本脚本的解决方案：**
绕过表层视觉DOM，精准提取底层的`<annotation encoding="application/x-tex">`源码。并同时清洗系统剪贴板的`text/plain`和`text/html` 双通道,进而可以粘贴得到纯文本

## Core Features
- 🖱️鼠标悬停公式区域自动泛起高亮
- ⚡对着公式双击或鼠标选中后正常复制即可提取源码

## 🛠️安装说明 (Installation)
1. 安装浏览器扩展程序 **Tampermonkey** (油猴)。
2. ⚠️ **【极其重要】**：在浏览器的扩展程序管理页 (`chrome://extensions/`) 中，必须打开右上角的 **[开发者模式] (Developer mode)**！否则脚本会被浏览器拦截。
3. 点击此处一键安装脚本：[👉 安装 DeepSeek LaTeX Copier](#) 

## 更新日志 (Changelog)
- V1.0.0: 20260506,初次提交,实现悬停高亮、双击复制、极简胶囊提示，彻底清洗剪贴板双通道数据

