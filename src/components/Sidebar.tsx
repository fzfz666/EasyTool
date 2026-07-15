import React, { useState } from 'react';
import { 
  Braces, 
  GitCompare, 
  Layers, 
  Trash2, 
  Menu, 
  ChevronRight, 
  Sparkles,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export default function Sidebar({ currentRoute, onNavigate }: SidebarProps) {
  const [isHovered, setIsHovered] = useState(false);

  const menuItems = [
    {
      path: '/json',
      title: 'JSON 格式化 & 容错解析',
      shortTitle: 'JSON 解析',
      desc: '补全残缺JSON并生成树视图',
      icon: Braces,
      activeColor: 'bg-indigo-50 text-indigo-600 border-indigo-600',
      hoverColor: 'hover:bg-indigo-50/50 hover:text-indigo-600'
    },
    {
      path: '/diff',
      title: '极速文本差异比对',
      shortTitle: '文本比对',
      desc: '精准对齐并高亮行与字符差异',
      icon: GitCompare,
      activeColor: 'bg-emerald-50 text-emerald-600 border-emerald-600',
      hoverColor: 'hover:bg-emerald-50/50 hover:text-emerald-600'
    },
    {
      path: '/tokenizer',
      title: 'GPT Tokenizer 计算器',
      shortTitle: '分词计算',
      desc: '实时 Token 计数与切分可视化',
      icon: Layers,
      activeColor: 'bg-indigo-50 text-indigo-600 border-indigo-600',
      hoverColor: 'hover:bg-indigo-50/50 hover:text-indigo-600'
    },
    {
      path: '/dedup',
      title: '行文本智能去重',
      shortTitle: '文本去重',
      desc: '高精确度重复项过滤与快速定位',
      icon: Trash2,
      activeColor: 'bg-rose-50 text-rose-600 border-rose-600',
      hoverColor: 'hover:bg-rose-50/50 hover:text-rose-600'
    }
  ];

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-200 z-50 flex flex-col justify-between transition-all duration-300 ease-in-out shadow-lg shadow-slate-100 ${
        isHovered ? 'w-64' : 'w-[140px]'
      }`}
    >
      {/* 顶部 Brand Section */}
      <div className="flex flex-col">
        <div className="h-16 flex items-center px-4 border-b border-slate-200 gap-3 overflow-hidden whitespace-nowrap">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-extrabold shrink-0 shadow-md shadow-indigo-100">
            D
          </div>
          <div className={`flex flex-col transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-100'}`}>
            <span className="text-sm font-black text-slate-800 leading-none">DevDiff Pro</span>
            {isHovered && <span className="text-[9px] font-bold text-indigo-600 mt-1 uppercase tracking-wider">智能开发者工具箱</span>}
          </div>
        </div>

        {/* 菜单列表 */}
        <nav className="p-3 space-y-1.5 overflow-hidden">
          <p className={`text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2 mb-2 select-none whitespace-nowrap transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            核心工具服务
          </p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.path || (item.path === '/json' && currentRoute === '/');

            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left border-l-2 border-transparent transition-all cursor-pointer whitespace-nowrap ${
                  isActive 
                    ? item.activeColor + ' font-bold shadow-sm' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title={item.title}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <div className="flex flex-col min-w-0 transition-all duration-200">
                  <span className={`font-bold transition-all ${isHovered ? 'text-xs' : 'text-[11px]'}`}>
                    {isHovered ? item.title : item.shortTitle}
                  </span>
                  {isHovered && <span className="text-[10px] text-slate-400 mt-0.5 font-normal truncate">{item.desc}</span>}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 底部 Info Section */}
      <div className="p-3 border-t border-slate-200">
        {isHovered ? (
          <div className="space-y-2 select-none transition-opacity duration-200">
            <div className="p-2 bg-slate-50 rounded-xl flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
              <div className="text-[9px] font-bold text-slate-500 leading-tight">
                <p>100% 浏览器本地计算</p>
                <p className="text-slate-400 font-normal mt-0.5">杜绝泄密，无服务器留存</p>
              </div>
            </div>
            <div className="p-2 bg-indigo-50/50 rounded-xl flex items-center gap-2">
              <Zap className="h-4 w-4 text-indigo-500 shrink-0 animate-pulse" />
              <div className="text-[9px] font-bold text-slate-500 leading-tight">
                <p>极速容错引擎已激活</p>
                <p className="text-indigo-400 font-normal mt-0.5">当前版本 v2.6.5 Pro</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <ShieldCheck className="h-5 w-5 text-emerald-500" title="100% 客户端安全处理" />
          </div>
        )}
      </div>
    </aside>
  );
}
