import React, { useState, useEffect, useRef } from 'react';
import { 
  Trash2, 
  Check, 
  Copy, 
  ListOrdered, 
  Filter
} from 'lucide-react';

interface RuleOptions {
  ignoreTrim: boolean;
  ignoreAllSpaces: boolean;
  caseSensitive: boolean;
  keepRule: 'first' | 'last';
}

interface AnalyzedLine {
  originalIndex: number;
  text: string;
  cleanedText: string;
  isDuplicate: boolean;
  duplicateOfIndex?: number;
  kept: boolean;
}

export default function DedupTab() {
  const [rawText, setRawText] = useState(
    "1. 苹果\n2. 香蕉\n3. 苹果\n4.  香蕉 \n5. 橙子\n6. 苹果\n7. 葡萄\n8. ORANGE\n9. 橙子"
  );
  
  const [options, setOptions] = useState<RuleOptions>({
    ignoreTrim: true,
    ignoreAllSpaces: false,
    caseSensitive: false,
    keepRule: 'first'
  });

  const [analyzedLines, setAnalyzedLines] = useState<AnalyzedLine[]>([]);
  const [deduplicatedText, setDeduplicatedText] = useState('');
  const [copied, setCopied] = useState(false);

  const leftBackdropRef = useRef<HTMLDivElement>(null);
  const leftGutterRef = useRef<HTMLDivElement>(null);
  const rightGutterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const rawLines = rawText.split('\n');
    
    const cleaned = rawLines.map((line) => {
      let text = line;
      if (options.ignoreTrim) {
        text = text.trim();
      }
      if (options.ignoreAllSpaces) {
        text = text.replace(/\s+/g, '');
      }
      if (!options.caseSensitive) {
        text = text.toLowerCase();
      }
      return text;
    });

    const seen = new Map<string, number>();
    const linesAnalysis: AnalyzedLine[] = [];

    if (options.keepRule === 'first') {
      for (let i = 0; i < rawLines.length; i++) {
        const cleanVal = cleaned[i];
        const lineContent = rawLines[i];
        
        if (lineContent === '' && i === rawLines.length - 1 && i > 0) {
          linesAnalysis.push({
            originalIndex: i + 1,
            text: lineContent,
            cleanedText: cleanVal,
            isDuplicate: false,
            kept: true
          });
          continue;
        }

        if (seen.has(cleanVal)) {
          const firstSeenLineNum = seen.get(cleanVal)!;
          linesAnalysis.push({
            originalIndex: i + 1,
            text: lineContent,
            cleanedText: cleanVal,
            isDuplicate: true,
            duplicateOfIndex: firstSeenLineNum,
            kept: false
          });
        } else {
          seen.set(cleanVal, i + 1);
          linesAnalysis.push({
            originalIndex: i + 1,
            text: lineContent,
            cleanedText: cleanVal,
            isDuplicate: false,
            kept: true
          });
        }
      }
    } else {
      const lastSeen = new Map<string, number>();
      for (let i = rawLines.length - 1; i >= 0; i--) {
        const cleanVal = cleaned[i];
        if (!lastSeen.has(cleanVal)) {
          lastSeen.set(cleanVal, i + 1);
        }
      }

      for (let i = 0; i < rawLines.length; i++) {
        const cleanVal = cleaned[i];
        const lineContent = rawLines[i];
        const targetKeptIndex = lastSeen.get(cleanVal)!;

        if (i + 1 === targetKeptIndex) {
          linesAnalysis.push({
            originalIndex: i + 1,
            text: lineContent,
            cleanedText: cleanVal,
            isDuplicate: false,
            kept: true
          });
        } else {
          linesAnalysis.push({
            originalIndex: i + 1,
            text: lineContent,
            cleanedText: cleanVal,
            isDuplicate: true,
            duplicateOfIndex: targetKeptIndex,
            kept: false
          });
        }
      }
    }

    setAnalyzedLines(linesAnalysis);
    setDeduplicatedText(linesAnalysis.filter(l => l.kept).map(l => l.text).join('\n'));
  }, [rawText, options]);

  const handleCopyOutput = () => {
    navigator.clipboard.writeText(deduplicatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalLines = analyzedLines.length;
  const duplicateCount = analyzedLines.filter(l => l.isDuplicate).length;
  const keptCount = totalLines - duplicateCount;

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

  return (
    <div className="space-y-6">
      
      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl">
            <ListOrdered className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 font-sans leading-none">原文总行数</p>
            <p className="text-xl font-bold text-slate-800 mt-1 font-mono">{totalLines}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 font-sans leading-none">检测到重复行 (已删)</p>
            <p className="text-xl font-bold text-rose-600 mt-1 font-mono">{duplicateCount}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 font-sans leading-none">保留唯一行</p>
            <p className="text-xl font-bold text-emerald-600 mt-1 font-mono">{keptCount}</p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col justify-center gap-1.5 col-span-2 md:col-span-1">
          <label className="flex items-center gap-2 text-[10px] font-semibold text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={options.ignoreTrim}
              onChange={(e) => setOptions({ ...options, ignoreTrim: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
            />
            <span>忽略首尾空格</span>
          </label>
          <label className="flex items-center gap-2 text-[10px] font-semibold text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={options.ignoreAllSpaces}
              onChange={(e) => setOptions({ ...options, ignoreAllSpaces: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
            />
            <span>忽略所有空格</span>
          </label>
          <div className="flex items-center gap-3 mt-0.5 pt-0.5 border-t border-slate-200/60 justify-between">
            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={options.caseSensitive}
                onChange={(e) => setOptions({ ...options, caseSensitive: e.target.checked })}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
              />
              <span>区分大小写</span>
            </label>
            <select
              value={options.keepRule}
              onChange={(e) => setOptions({ ...options, keepRule: e.target.value as 'first' | 'last' })}
              className="text-[9px] font-bold text-slate-500 bg-white border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none"
            >
              <option value="first">保留首次出现</option>
              <option value="last">保留末次出现</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dual Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-slate-200 rounded-3xl overflow-hidden shadow-lg shadow-slate-100/90 bg-white items-stretch min-h-[500px]">
        
        {/* Left Panel: Edit & Highlight */}
        <div className="flex flex-col min-h-[500px] min-w-0 bg-white relative border-r border-slate-200">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-600 border border-rose-200 font-mono">A</span>
              <span className="text-xs font-bold text-slate-700">原始文本 (可直接编辑)</span>
            </div>
            <button
              onClick={() => setRawText('')}
              className="text-[10px] font-semibold text-rose-600 hover:bg-rose-50 px-2 py-1 rounded transition-colors cursor-pointer"
            >
              清空
            </button>
          </div>
          <div className="flex-1 flex overflow-hidden font-mono text-[13px] leading-[24px] relative">
            <div ref={leftGutterRef} className="select-none text-right bg-slate-50 border-r border-slate-150 text-slate-400 px-3 py-4 flex flex-col text-[11px] leading-[24px] min-w-[3rem] shrink-0 overflow-hidden">
               {analyzedLines.map((line, idx) => (
                  <div key={idx} className={`h-[24px] flex items-center justify-end pr-1 ${line.isDuplicate ? 'text-rose-500 font-bold bg-rose-100/50 rounded-sm' : ''}`}>{idx + 1}</div>
               ))}
            </div>
            <div className="flex-1 relative h-full overflow-hidden bg-white">
              <div ref={leftBackdropRef} className="absolute inset-0 pointer-events-none select-none text-slate-800" style={{ ...sharedStyles, overflowY: 'hidden', overflowX: 'hidden' }}>
                {analyzedLines.map((line, idx) => (
                  <div key={idx} className={`min-h-[24px] rounded-sm ${line.isDuplicate ? 'bg-rose-50 text-rose-700/80 line-through' : ''}`}>
                    {line.text || '\n'}
                  </div>
                ))}
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                onScroll={(e) => {
                  if (leftBackdropRef.current) leftBackdropRef.current.scrollTop = e.currentTarget.scrollTop;
                  if (leftGutterRef.current) leftGutterRef.current.scrollTop = e.currentTarget.scrollTop;
                }}
                placeholder="在此输入或粘贴需要去除重复行的内容..."
                spellCheck="false"
                className="absolute inset-0 w-full h-full resize-none focus:outline-none selection:bg-indigo-200/60"
                style={{ ...sharedStyles, color: 'transparent', caretColor: '#0f172a', background: 'transparent', overflowY: 'auto' }}
              />
            </div>
          </div>
        </div>

        {/* Right Panel: Result */}
        <div className="flex flex-col min-h-[500px] min-w-0 bg-slate-50/30 relative">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-600 border border-emerald-200 font-mono">B</span>
              <span className="text-xs font-bold text-slate-700">保留的唯一项 (输出结果)</span>
            </div>
            <button
              onClick={handleCopyOutput}
              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              title="复制"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span className="text-[10px] font-bold">复制结果</span>
            </button>
          </div>
          <div className="flex-1 flex overflow-hidden font-mono text-[13px] leading-[24px] relative">
            <div ref={rightGutterRef} className="select-none text-right bg-slate-50 border-r border-slate-150 text-slate-400 px-3 py-4 flex flex-col text-[11px] leading-[24px] min-w-[3rem] shrink-0 overflow-hidden">
               {analyzedLines.filter(l => l.kept).map((_, idx) => (
                  <div key={idx} className={`h-[24px] flex items-center justify-end pr-1 text-emerald-500 font-bold bg-emerald-50/50 rounded-sm`}>{idx + 1}</div>
               ))}
            </div>
            <div className="flex-1 relative h-full overflow-hidden">
               <textarea
                 readOnly
                 value={deduplicatedText}
                 onScroll={(e) => {
                   if (rightGutterRef.current) rightGutterRef.current.scrollTop = e.currentTarget.scrollTop;
                 }}
                 className="absolute inset-0 w-full h-full resize-none focus:outline-none bg-transparent text-emerald-900"
                 style={{ ...sharedStyles, overflowY: 'auto' }}
               />
            </div>
          </div>
        </div>

      </div>

      {/* Templates */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <span className="text-[11px] text-slate-400 font-mono">加载测试去重数据:</span>
        <button
          onClick={() => setRawText("苹果\n香蕉\n苹果\n香蕉\n葡萄\n香蕉\n橙子\n苹果")}
          className="text-[10px] font-medium text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg hover:shadow-sm cursor-pointer"
        >
          简单水果重复
        </button>
        <button
          onClick={() => setRawText("const config = {\n  port: 3000,\n  port: 3000,\n  host: 'localhost',\n  secure: false\n};")}
          className="text-[10px] font-medium text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg hover:shadow-sm cursor-pointer"
        >
          代码配置排重
        </button>
        <button
          onClick={() => setRawText("  Item 1\nItem 1\n  item 1\nItem 2  \nItem 2")}
          className="text-[10px] font-medium text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg hover:shadow-sm cursor-pointer"
        >
          空格大小写差异
        </button>
      </div>
      
    </div>
  );
}
