import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import JsonParserTab from './components/JsonParserTab';
import TextDiffTab from './components/TextDiffTab';
import TokenizerTab from './components/TokenizerTab';
import DedupTab from './components/DedupTab';

export default function App() {
  // Read path on initialization with support for both path and hash-based fallbacks
  const getRouteFromUrl = () => {
    const path = window.location.pathname;
    if (path === '/diff' || window.location.hash === '#/diff') return '/diff';
    if (path === '/tokenizer' || window.location.hash === '#/tokenizer') return '/tokenizer';
    if (path === '/dedup' || window.location.hash === '#/dedup') return '/dedup';
    return '/json'; // Default
  };

  const [currentRoute, setCurrentRoute] = useState<string>(getRouteFromUrl());

  const handleNavigate = (path: string) => {
    // 1. Update window history with pushState
    window.history.pushState({}, '', path);
    // 2. Fallback hash tracking for safe hosting
    window.location.hash = '#' + path;
    // 3. React state change
    setCurrentRoute(path);

    // 4. Manually notify 51.la of SPA state change if loaded
    const globalWindow = window as any;
    if (globalWindow.LA && typeof globalWindow.LA.track === 'function') {
      try {
        globalWindow.LA.track('pageview', { path: path });
      } catch (e) {
        console.warn('LA tracking triggered:', e);
      }
    }
  };

  // Listen to popstate for back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(getRouteFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Map route to the appropriate Tab element
  const renderActiveTab = () => {
    switch (currentRoute) {
      case '/diff':
        return (
          <motion.div
            key="diff-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex-1 flex flex-col"
          >
            <TextDiffTab />
          </motion.div>
        );
      case '/tokenizer':
        return (
          <motion.div
            key="tokenizer-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex-1 flex flex-col"
          >
            <TokenizerTab />
          </motion.div>
        );
      case '/dedup':
        return (
          <motion.div
            key="dedup-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex-1 flex flex-col"
          >
            <DedupTab />
          </motion.div>
        );
      default:
        return (
          <motion.div
            key="json-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="flex-1 flex flex-col"
          >
            <JsonParserTab />
          </motion.div>
        );
    }
  };

  return (
    <div id="app-container" className="min-h-screen bg-[#F8FAFC] flex selection:bg-indigo-150 selection:text-indigo-900">
      
      {/* 1. Collapsible Hover Sidebar Navigation */}
      <Sidebar currentRoute={currentRoute} onNavigate={handleNavigate} />

      {/* 2. Main Content Container (shifted to make space for Sidebar) */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <Header currentRoute={currentRoute} />

        {/* Workspace Canvas */}
        <main className="flex-1 pl-[164px] pr-6 py-6 flex flex-col gap-6 max-w-[1500px] w-full mx-auto transition-all duration-300">
          <AnimatePresence mode="wait">
            {renderActiveTab()}
          </AnimatePresence>
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-200 bg-white py-5 pl-[164px] pr-6 mt-auto transition-all duration-300">
          <div className="max-w-[1500px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-mono">
                DevDiff Pro &copy; 2026 | 全面守护隐私安全的极速开发者本地辅助工具箱
              </span>
            </div>
            <div className="flex gap-4 text-[11px] font-mono text-slate-400">
              <span>环境安全：100% 浏览器沙盒计算</span>
              <span>•</span>
              <span>核心技术：Partial Parser & Dynamic LCS & js-tiktoken BPE</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
