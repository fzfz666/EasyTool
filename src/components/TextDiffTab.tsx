import React, { useState, useEffect, useRef } from 'react';
import { 
  Trash2, 
  GitCompare, 
  ArrowLeftRight, 
  Check, 
  Copy, 
  Plus, 
  Minus, 
  Edit3, 
  Info
} from 'lucide-react';
import { computeTextDiff, DiffRow, DiffStats, DiffOptions } from '../utils/diff';

export default function TextDiffTab() {
  const [leftText, setLeftText] = useState(
    "1. 深度学习是人工智能领域一个极其令人兴奋的分支。\n2. 在本教程中，我们将深入探索最新的神经网络模型。\n3. 注意保持代码和文本空格的排版一致性。\n4. 这是原始文本的一行，其中包含一些旧的陈述句式。\n5. 我们非常喜欢使用 React 与 TypeScript 开发高性能的前端应用！"
  );
  const [rightText, setSetRightText] = useState(
    "1. 深度学习是人工智能（AI）领域中一个非常令人兴奋的、前沿的核心分支。\n2. 在本教程中，我们将深入探索并学习最先进的高阶大语言模型。\n3.   注意保持代码和文本空格的排版一致性。\n4. 这是经过更新的新行，使用了全新的表达方式。\n5. 我们非常喜欢使用 React、TypeScript 以及 Tailwind CSS 极速构建优雅的前端 Web 应用！"
  );

  const [options, setOptions] = useState<DiffOptions & { syncScroll: boolean }>({
    ignoreCase: false,
    ignoreWhitespace: true,
    syncScroll: true,
  });

  const [diffData, setDiffData] = useState<{ rows: DiffRow[]; stats: DiffStats } | null>(null);
  const [svgPaths, setSvgPaths] = useState<{ id: string, d: string, type: string }[]>([]);
  const [isCopiedLeft, setIsCopiedLeft] = useState(false);
  const [isCopiedRight, setIsCopiedRight] = useState(false);

  const leftTextareaRef = useRef<HTMLTextAreaElement>(null);
  const rightTextareaRef = useRef<HTMLTextAreaElement>(null);
  const leftBackdropRef = useRef<HTMLDivElement>(null);
  const rightBackdropRef = useRef<HTMLDivElement>(null);
  const leftGutterRef = useRef<HTMLDivElement>(null);
  const rightGutterRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const isSyncingScroll = useRef(false);
  const drawConnectionsFrame = useRef<number | null>(null);

  useEffect(() => {
    const data = computeTextDiff(leftText, rightText, options);
    setDiffData(data);
  }, [leftText, rightText, options]);

  const drawConnectionsReal = () => {
    const svg = svgRef.current;
    if (!svg || !leftTextareaRef.current || !rightTextareaRef.current) return;

    const svgRect = svg.getBoundingClientRect();
    if (!diffData) return;

    const parentLeftRect = leftTextareaRef.current.getBoundingClientRect();
    const parentRightRect = rightTextareaRef.current.getBoundingClientRect();

    const getMidpointY = (el: HTMLElement, parentRect: DOMRect) => {
      const rect = el.getBoundingClientRect();
      if (rect.top > parentRect.bottom || rect.bottom < parentRect.top) {
        return null;
      }
      return rect.top + rect.height / 2 - svgRect.top;
    };

    const newPaths: { id: string, d: string, type: string }[] = [];

    diffData.rows.forEach((row) => {
      const leftLineNum = row.left.lineNum;
      const rightLineNum = row.right.lineNum;
      
      // Only draw connecting lines for matched/modified rows to avoid clutter
      if (leftLineNum !== null && rightLineNum !== null && (row.left.type === 'unchanged' || row.left.type === 'modified')) {
        const leftEl = document.getElementById(`left-line-${leftLineNum}`);
        const rightEl = document.getElementById(`right-line-${rightLineNum}`);

        if (leftEl && rightEl) {
          const y1 = getMidpointY(leftEl, parentLeftRect);
          const y2 = getMidpointY(rightEl, parentRightRect);

          if (y1 !== null && y2 !== null) {
            const width = svgRect.width;
            const d = `M 0,${y1} C ${width / 2},${y1} ${width / 2},${y2} ${width},${y2}`;
            newPaths.push({
              id: `${leftLineNum}-${rightLineNum}`,
              d,
              type: row.left.type
            });
          }
        }
      }
    });
    setSvgPaths(newPaths);
  };

  const drawConnections = () => {
    if (drawConnectionsFrame.current) {
      cancelAnimationFrame(drawConnectionsFrame.current);
    }
    drawConnectionsFrame.current = requestAnimationFrame(drawConnectionsReal);
  };

  useEffect(() => {
    const timer = setTimeout(drawConnections, 50);
    return () => clearTimeout(timer);
  }, [leftText, rightText, diffData, options]);

  useEffect(() => {
    window.addEventListener('resize', drawConnections);
    return () => window.removeEventListener('resize', drawConnections);
  }, [diffData]);

  const handleLeftScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (leftBackdropRef.current) leftBackdropRef.current.scrollTop = scrollTop;
    if (leftGutterRef.current) leftGutterRef.current.scrollTop = scrollTop;

    if (options.syncScroll && rightTextareaRef.current && !isSyncingScroll.current) {
      isSyncingScroll.current = true;
      rightTextareaRef.current.scrollTop = scrollTop;
      if (rightBackdropRef.current) rightBackdropRef.current.scrollTop = scrollTop;
      if (rightGutterRef.current) rightGutterRef.current.scrollTop = scrollTop;
      setTimeout(() => { isSyncingScroll.current = false; }, 10);
    }
    drawConnections();
  };

  const handleRightScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (rightBackdropRef.current) rightBackdropRef.current.scrollTop = scrollTop;
    if (rightGutterRef.current) rightGutterRef.current.scrollTop = scrollTop;

    if (options.syncScroll && leftTextareaRef.current && !isSyncingScroll.current) {
      isSyncingScroll.current = true;
      leftTextareaRef.current.scrollTop = scrollTop;
      if (leftBackdropRef.current) leftBackdropRef.current.scrollTop = scrollTop;
      if (leftGutterRef.current) leftGutterRef.current.scrollTop = scrollTop;
      setTimeout(() => { isSyncingScroll.current = false; }, 10);
    }
    drawConnections();
  };

  const handleClearAll = () => {
    setLeftText('');
    setSetRightText('');
  };

  const handleSwap = () => {
    const temp = leftText;
    setLeftText(rightText);
    setSetRightText(temp);
  };

  const handleCopy = (side: 'left' | 'right') => {
    navigator.clipboard.writeText(side === 'left' ? leftText : rightText);
    if (side === 'left') {
      setIsCopiedLeft(true);
      setTimeout(() => setIsCopiedLeft(false), 2000);
    } else {
      setIsCopiedRight(true);
      setTimeout(() => setIsCopiedRight(false), 2000);
    }
  };

  const leftLineMap = new Map<number, { type: string; charSpans?: any[] }>();
  const rightLineMap = new Map<number, { type: string; charSpans?: any[] }>();

  diffData?.rows.forEach((row) => {
    if (row.left.lineNum !== null) {
      leftLineMap.set(row.left.lineNum, { type: row.left.type, charSpans: row.left.charSpans });
    }
    if (row.right.lineNum !== null) {
      rightLineMap.set(row.right.lineNum, { type: row.right.type, charSpans: row.right.charSpans });
    }
  });

  const leftLinesArray = leftText.split('\n');
  const rightLinesArray = rightText.split('\n');

  // Exact shared styling to guarantee perfect overlay alignment between transparent textarea and backdrop div
  const sharedStyles: React.CSSProperties = {
    fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
    fontSize: '13px',
    lineHeight: '24px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    padding: '16px',
    margin: 0,
    border: 'none',
    boxSizing: 'border-box',
  };

  const renderLineContent = (text: string, charSpans?: { text: string; type: 'normal' | 'diff' }[], isLeft = true) => {
    if (!text && (!charSpans || charSpans.length === 0)) return '\n'; // Must have newline to maintain block height
    
    if (charSpans && charSpans.length > 0) {
      return charSpans.map((span, sIdx) => {
        if (span.type === 'diff') {
          return (
            <span
              key={sIdx}
              className={`${
                isLeft ? 'bg-rose-200/80 text-rose-950' : 'bg-emerald-200/80 text-emerald-950'
              }`}
            >
              {span.text}
            </span>
          );
        }
        return <span key={sIdx}>{span.text}</span>;
      });
    }
    return text;
  };

  const calculateMatchScore = () => {
    if (!diffData) return 0;
    const { additions, deletions, modifications, totalLinesLeft } = diffData.stats;
    const totalLines = Math.max(totalLinesLeft, 1);
    const changesCount = additions + deletions + modifications;
    return Math.max(0, 100 - Math.round((changesCount / totalLines) * 100));
  };

  return (
    <div className="space-y-6">
      {/* Metrics Dashboard */}
      {diffData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 font-sans leading-none">新增行数</p>
              <p className="text-xl font-black text-emerald-600 mt-1 font-mono">{diffData.stats.additions}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <Minus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 font-sans leading-none">删除行数</p>
              <p className="text-xl font-black text-rose-600 mt-1 font-mono">{diffData.stats.deletions}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Edit3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 font-sans leading-none">修改行数</p>
              <p className="text-xl font-black text-amber-600 mt-1 font-mono">{diffData.stats.modifications}</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <GitCompare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 font-sans leading-none">文本相似度</p>
              <p className="text-xl font-black text-slate-800 mt-1 font-mono">{calculateMatchScore()}%</p>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col justify-center gap-1.5 col-span-2 md:col-span-1">
            <label className="flex items-center gap-2 text-[11px] font-medium text-slate-600 cursor-pointer select-none">
              <input type="checkbox" checked={options.ignoreWhitespace} onChange={(e) => setOptions({ ...options, ignoreWhitespace: e.target.checked })} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5" />
              <span>忽略空格/缩进差异</span>
            </label>
            <label className="flex items-center gap-2 text-[11px] font-medium text-slate-600 cursor-pointer select-none">
              <input type="checkbox" checked={options.ignoreCase} onChange={(e) => setOptions({ ...options, ignoreCase: e.target.checked })} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5" />
              <span>忽略大小写</span>
            </label>
            <label className="flex items-center gap-2 text-[11px] font-medium text-slate-600 cursor-pointer select-none">
              <input type="checkbox" checked={options.syncScroll} onChange={(e) => setOptions({ ...options, syncScroll: e.target.checked })} className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5" />
              <span className="font-semibold text-indigo-600">双栏同步滚动</span>
            </label>
          </div>
        </div>
      )}

      {/* Dual-Pane Editor with Transparent Overlay Technique */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_40px_1fr] border border-slate-200 rounded-3xl overflow-hidden shadow-lg shadow-slate-100/90 bg-white items-stretch relative min-h-[500px]">
        
        {/* LEFT PANEL */}
        <div className="flex flex-col min-h-[500px] min-w-0 bg-white relative">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-600 border border-rose-200 font-mono">A</span>
              <span className="text-xs font-bold text-slate-700">原始文本</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => handleCopy('left')} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="复制">
                {isCopiedLeft ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <div className="flex-1 flex overflow-hidden font-mono text-[13px] leading-[24px] relative">
            {/* Gutter */}
            <div ref={leftGutterRef} className="select-none text-right bg-slate-50 border-r border-slate-150 text-slate-400 px-3 py-4 flex flex-col text-[11px] leading-[24px] min-w-[3rem] shrink-0 overflow-hidden">
              {leftLinesArray.map((_, idx) => {
                const type = leftLineMap.get(idx + 1)?.type;
                return (
                  <div key={idx} className={`h-[24px] flex items-center justify-end pr-1 ${type === 'removed' ? 'text-rose-500 font-bold bg-rose-100/50 rounded-sm' : ''} ${type === 'modified' ? 'text-amber-600 font-bold bg-amber-100/50 rounded-sm' : ''}`}>{idx + 1}</div>
                );
              })}
            </div>
            {/* Editor Area */}
            <div className="flex-1 relative h-full overflow-hidden bg-white">
              {/* BACKDROP: Renders colored blocks */}
              <div ref={leftBackdropRef} className="absolute inset-0 pointer-events-none select-none text-slate-800" style={{ ...sharedStyles, overflowY: 'hidden', overflowX: 'hidden' }}>
                {leftLinesArray.map((lineText, idx) => {
                  const lineNum = idx + 1;
                  const info = leftLineMap.get(lineNum);
                  const isRemoved = info?.type === 'removed';
                  return (
                    <div key={idx} id={`left-line-${lineNum}`} className={`min-h-[24px] rounded-sm ${isRemoved ? 'bg-rose-50' : ''}`}>
                      {isRemoved ? (lineText || '\n') : renderLineContent(lineText, info?.charSpans, true)}
                    </div>
                  );
                })}
              </div>
              {/* FOREGROUND: Transparent Textarea */}
              <textarea
                ref={leftTextareaRef}
                value={leftText}
                onChange={(e) => setLeftText(e.target.value)}
                onScroll={handleLeftScroll}
                placeholder="在此输入原始文本..."
                spellCheck="false"
                className="absolute inset-0 w-full h-full resize-none focus:outline-none selection:bg-indigo-200/60"
                style={{ ...sharedStyles, color: 'transparent', caretColor: '#0f172a', background: 'transparent', overflowY: 'auto' }}
              />
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN: SVG Connections */}
        <div className="bg-slate-50 border-r border-l border-slate-200 relative flex items-stretch select-none shrink-0 w-[40px]">
          <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {svgPaths.map((p) => (
              <path
                key={p.id}
                d={p.d}
                fill="none"
                stroke={p.type === 'unchanged' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(245, 158, 11, 0.4)'}
                strokeWidth={p.type === 'unchanged' ? 1 : 1.5}
                strokeDasharray={p.type === 'modified' ? '4,4' : undefined}
                className="transition-all duration-300 ease-out"
              />
            ))}
          </svg>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex flex-col min-h-[500px] min-w-0 bg-white relative">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-600 border border-emerald-200 font-mono">B</span>
              <span className="text-xs font-bold text-slate-700">最新修改版本</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => handleCopy('right')} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" title="复制">
                {isCopiedRight ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <div className="flex-1 flex overflow-hidden font-mono text-[13px] leading-[24px] relative">
            {/* Gutter */}
            <div ref={rightGutterRef} className="select-none text-right bg-slate-50 border-r border-slate-150 text-slate-400 px-3 py-4 flex flex-col text-[11px] leading-[24px] min-w-[3rem] shrink-0 overflow-hidden">
              {rightLinesArray.map((_, idx) => {
                const type = rightLineMap.get(idx + 1)?.type;
                return (
                  <div key={idx} className={`h-[24px] flex items-center justify-end pr-1 ${type === 'added' ? 'text-emerald-500 font-bold bg-emerald-100/50 rounded-sm' : ''} ${type === 'modified' ? 'text-amber-600 font-bold bg-amber-100/50 rounded-sm' : ''}`}>{idx + 1}</div>
                );
              })}
            </div>
            {/* Editor Area */}
            <div className="flex-1 relative h-full overflow-hidden bg-white">
              {/* BACKDROP: Renders colored blocks */}
              <div ref={rightBackdropRef} className="absolute inset-0 pointer-events-none select-none text-slate-800" style={{ ...sharedStyles, overflowY: 'hidden', overflowX: 'hidden' }}>
                {rightLinesArray.map((lineText, idx) => {
                  const lineNum = idx + 1;
                  const info = rightLineMap.get(lineNum);
                  const isAdded = info?.type === 'added';
                  return (
                    <div key={idx} id={`right-line-${lineNum}`} className={`min-h-[24px] rounded-sm ${isAdded ? 'bg-emerald-50' : ''}`}>
                      {isAdded ? (lineText || '\n') : renderLineContent(lineText, info?.charSpans, false)}
                    </div>
                  );
                })}
              </div>
              {/* FOREGROUND: Transparent Textarea */}
              <textarea
                ref={rightTextareaRef}
                value={rightText}
                onChange={(e) => setSetRightText(e.target.value)}
                onScroll={handleRightScroll}
                placeholder="在此输入修改后的文本..."
                spellCheck="false"
                className="absolute inset-0 w-full h-full resize-none focus:outline-none selection:bg-indigo-200/60"
                style={{ ...sharedStyles, color: 'transparent', caretColor: '#0f172a', background: 'transparent', overflowY: 'auto' }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
        <Info className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5 animate-pulse" />
        <div className="text-xs text-indigo-950 space-y-1">
          <h4 className="font-bold">💡 字符级方块高亮比对说明:</h4>
          <p>
            1. <strong>无缝编辑与比对</strong>：无需切换视图，在原文本框内编辑，系统会自动计算并将差异以<strong>彩色方块</strong>高亮显示。
          </p>
          <p>
            2. <strong>告别重影</strong>：采用底层渲染分离技术，编辑时光标与文字精准贴合，视觉呈现完美清晰无重叠。
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2.5">
          <button onClick={handleSwap} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 shadow-sm transition-all cursor-pointer">
            <ArrowLeftRight className="h-4 w-4 text-indigo-500" />
            <span>交换左右面板</span>
          </button>
          <button onClick={handleClearAll} className="px-4 py-2 bg-rose-50 border border-rose-100 hover:bg-rose-100/50 rounded-xl text-xs font-bold text-rose-600 flex items-center gap-2 shadow-sm transition-all cursor-pointer">
            <Trash2 className="h-4 w-4" />
            <span>清空内容</span>
          </button>
        </div>
      </div>
      
    </div>
  );
}
