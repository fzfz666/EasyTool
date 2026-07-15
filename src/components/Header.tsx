import React from 'react';
import { Sparkles, Terminal } from 'lucide-react';

interface HeaderProps {
  currentRoute: string;
}

export default function Header({ currentRoute }: HeaderProps) {
  // Translate current route to a Chinese title
  const getToolTitle = () => {
    switch (currentRoute) {
      case '/diff':
        return {
          title: '极速文本差异比对',
          badge: '精密对齐比对',
          desc: '对齐空白占位，精准字符及行高亮，解决传统对比错乱痛点'
        };
      case '/tokenizer':
        return {
          title: 'GPT Tokenizer 计算器',
          badge: 'Token 级细粒度切分',
          desc: '支持 cl100k_base & o200k_base 切分算法及可视化流渲染'
        };
      case '/dedup':
        return {
          title: '行文本智能去重',
          badge: '高精确行过滤器',
          desc: '支持首尾空格/全部空格忽略，独家支持重复项滚动对齐与快速跳转'
        };
      default:
        return {
          title: 'JSON 智能格式化与高精容错解析',
          badge: '容错极速解析',
          desc: '智能补全残缺或含反斜杠的 JSON 数据，并高亮语法中断处'
        };
    }
  };

  const tool = getToolTitle();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 sticky top-0 z-40 shadow-sm ml-[140px] transition-all duration-300">
      <div className="flex items-center gap-3">
        {/* Current Tool Title (Chinese) with a clean badge */}
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-black tracking-tight text-slate-800">
            {tool.title}
          </h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-sans">
            {tool.badge}
          </span>
        </div>
        
        <span className="hidden lg:inline text-slate-300">|</span>
        <p className="hidden lg:inline text-[11px] text-slate-400 font-medium">
          {tool.desc}
        </p>
      </div>

      {/* Prominent Sponsor Ad Space */}
      <a
        href="http://freely.mindto.top"
        target="_blank"
        rel="noopener noreferrer"
        className="flex px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-lg items-center justify-center shadow-md hover:shadow-lg transition-all group cursor-pointer shrink-0 ml-4"
      >
        <Sparkles className="h-4 w-4 mr-2 text-indigo-100 animate-pulse" />
        <span className="text-sm tracking-wide">电脑语音输入法 点我下载</span>
      </a>
    </header>
  );
}
