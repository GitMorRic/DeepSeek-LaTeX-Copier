// ==UserScript==
// @name         DeepSeek-LaTeX-Copier (DeepSeek公式复制器)
// @namespace    https://github.com/GitMorRic/DeepSeek-LaTeX-Copier
// @version      1.0.0
// @description  双击即可提取DeepSeek网页端的数学公式 (LaTeX)。支持悬停高亮交互，彻底解决复制乱码等问题，清洗系统双通道剪贴板。
// @author       Ricky
// @license      MIT
// @match        *://chat.deepseek.com/*
// @icon         https://chat.deepseek.com/favicon.ico
// @homepageURL  https://github.com/GitMorRic/DeepSeek-LaTeX-Copier
// @supportURL   https://github.com/GitMorRic/DeepSeek-LaTeX-Copier/issues
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // ==========================================
    // 1. 注入优雅的 UI 和交互样式 (防重复注入)
    // ==========================================
    if (!document.getElementById('ds-latex-copier-style')) {
        const style = document.createElement('style');
        style.id = 'ds-latex-copier-style';
        style.innerHTML = `
            /* 公式的悬停高亮效果 */
            .katex {
                transition: background-color 0.3s ease, border-radius 0.3s ease;
                transition-delay: 0.1s; /* 稍微停留才高亮，防止鼠标快速划过时闪烁 */
                position: relative;
            }
            .katex:hover {
                background-color: rgba(59, 130, 246, 0.12) !important;
                border-radius: 6px;
                cursor: pointer;
            }
            /* 独立段落公式右上角的文字提示 */
            .katex-display:hover::after {
                content: "双击复制 LaTeX";
                position: absolute;
                right: 0px;
                top: -18px;
                font-size: 11px;
                color: #9ca3af;
                pointer-events: none;
                opacity: 0.8;
                font-family: sans-serif;
            }

            /* 极致优雅的胶囊提示框 */
            .ds-elegant-tooltip {
                position: fixed;
                background: rgba(30, 30, 30, 0.85);
                color: #ffffff;
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 13px;
                font-family: sans-serif;
                backdrop-filter: blur(4px);
                pointer-events: none;
                z-index: 9999999;
                transform: translateY(10px) translateX(-50%);
                opacity: 0;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            }
            .ds-elegant-tooltip.show {
                transform: translateY(0) translateX(-50%);
                opacity: 1;
            }
        `;
        document.head.appendChild(style);
    }

    // ==========================================
    // 2. 极简胶囊提示框逻辑
    // ==========================================
    function showElegantTooltip(msg, x, y) {
        const tooltip = document.createElement('div');
        tooltip.className = 'ds-elegant-tooltip';
        tooltip.innerText = msg;

        // 如果提供鼠标坐标则跟随，否则底部居中
        if (x !== undefined && y !== undefined) {
            tooltip.style.left = `${x}px`;
            tooltip.style.top = `${y - 30}px`; 
        } else {
            tooltip.style.left = `50%`;
            tooltip.style.bottom = `40px`;
        }

        document.body.appendChild(tooltip);

        // 丝滑动画展示
        requestAnimationFrame(() => {
            tooltip.classList.add('show');
        });

        // 定时销毁
        setTimeout(() => {
            tooltip.classList.remove('show');
            setTimeout(() => tooltip.remove(), 300);
        }, 1200);
    }

    // ==========================================
    // 3. 核心交互：双击一键复制公式
    // ==========================================
    document.addEventListener('dblclick', function(e) {
        const katexBlock = e.target.closest('.katex');
        if (!katexBlock) return;

        // 清除系统默认的蓝色文本全选，提升按键质感
        window.getSelection().removeAllRanges();

        // 提取深层 LaTeX 源码
        const annotation = katexBlock.querySelector('annotation[encoding="application/x-tex"]');
        if (annotation) {
            const tex = annotation.textContent;
            const isDisplay = katexBlock.classList.contains('katex-display') ||
                             (katexBlock.parentElement && katexBlock.parentElement.classList.contains('katex-display'));
            const finalTex = isDisplay ? `\n$$ ${tex} $$\n` : `$${tex}$`;

            // 写入系统剪贴板
            navigator.clipboard.writeText(finalTex).then(() => {
                showElegantTooltip("已复制 LaTeX", e.clientX, e.clientY);
            });
        }
    });

    // ==========================================
    // 4. 兜底保护：传统 Ctrl+C 划选复制的通道清洗
    // ==========================================
    document.addEventListener('copy', function(e) {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
        const range = selection.getRangeAt(0);

        function getClosestKatex(node) {
            if (!node) return null;
            let current = node.nodeType === 3 ? node.parentElement : node;
            while (current && current !== document.body) {
                if (current.classList && (current.classList.contains('katex') || current.classList.contains('katex-display'))) return current;
                current = current.parentElement;
            }
            return null;
        }

        // 自动扩展选区边界，防止鼠标把公式选断裂
        const startKatex = getClosestKatex(range.startContainer);
        if (startKatex) range.setStartBefore(startKatex);
        const endKatex = getClosestKatex(range.endContainer);
        if (endKatex) range.setEndAfter(endKatex);

        const container = document.createElement('div');
        container.appendChild(range.cloneContents());
        const katexNodes = Array.from(container.querySelectorAll('.katex'));

        if (katexNodes.length === 0) return;

        e.preventDefault();

        // 拦截并替换 DOM 中的毒药标签
        katexNodes.forEach(katex => {
            const annotation = katex.querySelector('annotation[encoding="application/x-tex"]');
            if (annotation) {
                const tex = annotation.textContent;
                const isDisplay = katex.classList.contains('katex-display') || (katex.parentElement && katex.parentElement.classList.contains('katex-display'));
                const replaceStr = isDisplay ? `\n$$ ${tex} $$\n` : `$${tex}$`;
                const textNode = document.createTextNode(replaceStr);

                if (isDisplay && katex.parentElement.classList.contains('katex-display')) katex.parentElement.replaceWith(textNode);
                else katex.replaceWith(textNode);
            }
        });

        // 提取纯净文本
        document.body.appendChild(container);
        container.style.cssText = 'position:fixed; left:-9999px; top:-9999px; white-space:pre-wrap;';
        const cleanText = container.innerText;
        document.body.removeChild(container);

        // 双通道写入剪贴板，彻底消灭粘贴变图片现象
        if (e.clipboardData) {
            e.clipboardData.setData('text/plain', cleanText);
            e.clipboardData.setData('text/html', `<pre>${cleanText}</pre>`); 
        }

        showElegantTooltip("已提取选中区域的 LaTeX");

    }, true); // 使用捕获模式，抢夺浏览器复制控制权

})();
