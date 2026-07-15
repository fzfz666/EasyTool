import React, { useState, useEffect, useRef } from 'react';
import { 
  FileJson, 
  Trash2, 
  Copy, 
  Check, 
  Sparkles, 
  AlertCircle, 
  EyeOff, 
  Code, 
  Braces, 
  Scissors, 
  CheckCircle2, 
  ChevronRight, 
  ChevronDown 
} from 'lucide-react';
import { 
  PartialJsonParser, 
  unescapeSlashes, 
  escapeSlashes, 
  detectEscapedJson, 
  ParserResult 
} from '../utils/partialJson';

// Recursive JSON Tree node renderer for premium visual inspection
interface TreeNodeProps {
  key?: React.Key;
  label: string;
  value: any;
  isLast?: boolean;
}

function JsonTreeNode({ label, value, isLast = true }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(true);

  if (value === null) {
    return (
      <div className="pl-4 py-0.5 font-mono text-xs flex items-center gap-1.5">
        <span className="text-slate-500 font-medium">{label}:</span>
        <span className="text-pink-600 font-semibold bg-pink-50 px-1 rounded">null</span>
        {!isLast && <span className="text-slate-400">,</span>}
      </div>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <div className="pl-4 py-0.5 font-mono text-xs flex items-center gap-1.5">
        <span className="text-slate-500 font-medium">{label}:</span>
        <span className={`font-semibold bg-emerald-50 px-1 rounded ${value ? 'text-emerald-600' : 'text-rose-600'}`}>
          {value ? 'true' : 'false'}
        </span>
        {!isLast && <span className="text-slate-400">,</span>}
      </div>
    );
  }

  if (typeof value === 'number') {
    return (
      <div className="pl-4 py-0.5 font-mono text-xs flex items-center gap-1.5">
        <span className="text-slate-500 font-medium">{label}:</span>
        <span className="text-amber-600 font-semibold">{value}</span>
        {!isLast && <span className="text-slate-400">,</span>}
      </div>
    );
  }

  if (typeof value === 'string') {
    return (
      <div className="pl-4 py-0.5 font-mono text-xs flex items-baseline gap-1.5 break-all">
        <span className="text-slate-500 font-medium shrink-0">{label}:</span>
        <span className="text-teal-600 font-medium">"{value}"</span>
        {!isLast && <span className="text-slate-400 shrink-0">,</span>}
      </div>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <div className="pl-4 py-0.5 font-mono text-xs flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">{label}:</span>
          <span className="text-slate-400">[]</span>
          {!isLast && <span className="text-slate-400">,</span>}
        </div>
      );
    }

    return (
      <div className="pl-4 py-0.5 font-mono text-xs">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 hover:bg-slate-100 rounded px-1 -ml-1 text-left cursor-pointer"
        >
          {expanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
          <span className="text-indigo-600 font-medium">{label}:</span>
          <span className="text-slate-400">Array({value.length}) [</span>
        </button>
        {expanded && (
          <div className="border-l border-slate-100 ml-1.5 pl-2 mt-0.5 space-y-0.5">
            {value.map((item, idx) => (
              <JsonTreeNode 
                key={idx} 
                label={`[${idx}]`} 
                value={item} 
                isLast={idx === value.length - 1} 
              />
            ))}
          </div>
        )}
        {expanded && <div className="text-slate-400 pl-4">]</div>}
      </div>
    );
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) {
      return (
        <div className="pl-4 py-0.5 font-mono text-xs flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">{label}:</span>
          <span className="text-slate-400">{"{}"}</span>
          {!isLast && <span className="text-slate-400">,</span>}
        </div>
      );
    }

    return (
      <div className="pl-4 py-0.5 font-mono text-xs">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 hover:bg-slate-100 rounded px-1 -ml-1 text-left cursor-pointer"
        >
          {expanded ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
          <span className="text-slate-700 font-medium">{label}:</span>
          <span className="text-slate-400">{"{"}</span>
        </button>
        {expanded && (
          <div className="border-l border-slate-100 ml-1.5 pl-2 mt-0.5 space-y-0.5">
            {keys.map((key, idx) => (
              <JsonTreeNode 
                key={key} 
                label={key} 
                value={value[key]} 
                isLast={idx === keys.length - 1} 
              />
            ))}
          </div>
        )}
        {expanded && <div className="text-slate-400 pl-4">{"}"}</div>}
      </div>
    );
  }

  return null;
}

export default function JsonParserTab() {
  const [rawText, setRawText] = useState('{\n  "name": "DevStudio Premium",\n  "status": "online",\n  "rating": 4.9,\n  "supportedTypes": [\n    "JSON",\n    "Plain Text",\n    "Markdown"\n  ],\n  "autoDetectEscapes": true,\n  "isAwesome": true\n}');
  const [parseResult, setParseResult] = useState<ParserResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showTree, setShowTree] = useState(false);
  const [hasEscapes, setHasEscapes] = useState(false);
  const [stripNoticeDismissed, setStripNoticeDismissed] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Synchronized scroll
  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (backdropRef.current) {
      backdropRef.current.scrollTop = e.currentTarget.scrollTop;
      backdropRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  // Render high-contrast syntax overlay mapping success vs failure
  const renderBackdropContent = () => {
    if (!rawText) return null;
    if (parseResult && !parseResult.fullyParsed) {
      const splitIndex = parseResult.errorPos;
      if (splitIndex >= 0 && splitIndex <= rawText.length) {
        const parsedPart = rawText.slice(0, splitIndex);
        const errorChar = rawText.slice(splitIndex, splitIndex + 1);
        const unparsedPart = rawText.slice(splitIndex + 1);
        return (
          <>
            <span className="text-emerald-700 bg-emerald-500/10 rounded-sm">{parsedPart}</span>
            <span className="bg-rose-500 text-white font-bold px-1 rounded shadow-sm relative inline-block animate-pulse min-w-[4px]">{errorChar || ' '}</span>
            <span className="text-rose-700 bg-rose-500/10 border-b border-dashed border-rose-400">{unparsedPart}</span>
          </>
        );
      }
    }
    return <span className="text-slate-800">{rawText}</span>;
  };

  // Trigger parsing in real-time
  useEffect(() => {
    if (!rawText.trim()) {
      setParseResult(null);
      setHasEscapes(false);
      return;
    }

    const parser = new PartialJsonParser(rawText);
    const result = parser.parse();
    setParseResult(result);

    // Detect if escape backslashes are highly prevalent
    const escaped = detectEscapedJson(rawText);
    setHasEscapes(escaped);
  }, [rawText]);

  // Clean raw text
  const handleClear = () => {
    setRawText('');
    setStripNoticeDismissed(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Format standard JSON
  const handleFormat = () => {
    if (!rawText.trim()) return;
    try {
      // First unescape slashes if it is a double escaped string
      let textToParse = rawText;
      if (hasEscapes) {
        textToParse = unescapeSlashes(rawText);
      }
      
      const parsed = JSON.parse(textToParse);
      setRawText(JSON.stringify(parsed, null, 2));
      setHasEscapes(false);
    } catch {
      // If full JSON parse fails, use the best-effort parsed value
      if (parseResult && parseResult.value !== undefined) {
        setRawText(JSON.stringify(parseResult.value, null, 2));
      }
    }
  };

  // Minify JSON
  const handleMinify = () => {
    if (!rawText.trim()) return;
    try {
      let textToParse = rawText;
      if (hasEscapes) {
        textToParse = unescapeSlashes(rawText);
      }
      const parsed = JSON.parse(textToParse);
      setRawText(JSON.stringify(parsed));
      setHasEscapes(false);
    } catch {
      if (parseResult && parseResult.value !== undefined) {
        setRawText(JSON.stringify(parseResult.value));
      }
    }
  };

  // Copy parsed and formatted output
  const handleCopy = () => {
    const textToCopy = parseResult && parseResult.value !== undefined 
      ? JSON.stringify(parseResult.value, null, 2) 
      : rawText;
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle Strip Slashes (去转义)
  const handleStripSlashes = () => {
    const stripped = unescapeSlashes(rawText);
    setRawText(stripped);
    setHasEscapes(false);
    setStripNoticeDismissed(true);
  };

  // Handle Add Slashes (加转义)
  const handleAddSlashes = () => {
    const escaped = escapeSlashes(rawText);
    setRawText(escaped);
    setHasEscapes(true);
  };

  // Handle demo paste
  const handlePasteDemo = (type: 'valid' | 'broken' | 'escaped') => {
    if (type === 'valid') {
      setRawText('{\n  "store": {\n    "book": [\n      { "category": "reference", "author": "Nigel Rees", "title": "Sayings of the Century", "price": 8.95 },\n      { "category": "fiction", "author": "Evelyn Waugh", "title": "Sword of Honour", "price": 12.99 }\n    ],\n    "bicycle": { "color": "red", "price": 19.95 }\n  },\n  "expensive": 10\n}');
    } else if (type === 'broken') {
      // Syntax error inside the array at price
      setRawText('{\n  "store": {\n    "book": [\n      { "category": "reference", "author": "Nigel Rees", "title": "Sayings of the Century", "price": 8.95 },\n      { "category": "fiction", "author": "Evelyn Waugh", "title": "Sword of Honour", "price": 12.99, "broken": \n    ],\n    "bicycle": { "color": "red", "price": 19.95 }\n  }\n}');
    } else {
      setRawText('"{\\"id\\": 102,\\"title\\": \\"Book of Magic\\",\\"nested\\": \\"{\\\\\\"pages\\\\\\": 450,\\\\\\\"author\\\\\\": \\\\\\\"John Doe\\\\\\\"}\\"}"');
    }
    setStripNoticeDismissed(false);
  };

  // Calculate lines for line gutter
  const lines = rawText.split('\n');
  const errorLine = parseResult && !parseResult.fullyParsed ? parseResult.errorLine : -1;

  return (
    <div className="space-y-6">
      {/* Dynamic Smart Notification Area */}
      {hasEscapes && !stripNoticeDismissed && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300">
          <div className="flex gap-3">
            <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600 shrink-0">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                💡 检测到带有反斜杠转义的 JSON 字符串 (Escaped JSON Detected)
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                您的输入中包含较多反斜杠转义字符（如 <code className="bg-slate-100 px-1 rounded font-mono text-[10px]">\"</code>）。 
                我们可以一键去除这些转义，以便正常进行标准 JSON 的格式化和健康解析。
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setStripNoticeDismissed(true)}
              className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
            >
              忽略提示
            </button>
            <button
              onClick={handleStripSlashes}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Scissors className="h-3.5 w-3.5" />
              <span>一键去除转义并解析 (Strip Slashes)</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COMPONENT: RAW JSON EDITOR (Lg: 6 cols) */}
        <div className="lg:col-span-6 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-md shadow-slate-100/80 overflow-hidden min-h-[500px]">
          
          {/* Editor Header Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <FileJson className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-semibold text-slate-700">JSON 输入与高精对比高亮区</span>
            </div>
            
            {/* Quick action buttons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleFormat}
                disabled={!rawText.trim()}
                className="px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-40 transition-colors cursor-pointer"
                title="智能排版与层级对齐"
              >
                智能格式化
              </button>
              <button
                onClick={handleMinify}
                disabled={!rawText.trim()}
                className="px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-40 transition-colors cursor-pointer"
                title="压缩至单行，去除所有多余空格"
              >
                极速压缩
              </button>
              <button
                onClick={handleStripSlashes}
                disabled={!rawText.trim()}
                className="px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-40 transition-colors cursor-pointer"
                title="剥离反斜杠转义"
              >
                去转义
              </button>
              <button
                onClick={handleAddSlashes}
                disabled={!rawText.trim()}
                className="px-2.5 py-1 text-[11px] font-medium bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-40 transition-colors cursor-pointer"
                title="添加反斜杠，编码双引号"
              >
                加转义
              </button>
              <div className="h-4 w-px bg-slate-200 mx-1"></div>
              <button
                onClick={handleClear}
                disabled={!rawText}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="清空内容"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Code Editor and Line Numbers Wrapper */}
          <div className="flex-1 flex overflow-hidden font-mono text-sm relative">
            
            {/* Line numbers gutter */}
            <div className="select-none text-right bg-slate-50/80 border-r border-slate-200 text-slate-400 px-3 py-4 flex flex-col space-y-0.5 select-none text-[11px] leading-[22px] min-w-[3.5rem] shrink-0">
              {lines.map((_, idx) => {
                const isErrLine = idx + 1 === errorLine;
                return (
                  <div 
                    key={idx}
                    className={`h-[22px] flex items-center justify-end pr-1 transition-colors ${
                      isErrLine ? 'text-rose-500 font-bold bg-rose-50 rounded px-1' : ''
                    }`}
                  >
                    {idx + 1}
                  </div>
                );
              })}
            </div>

            {/* Editable Text Area + Precision Syntax Backdrop Overlay */}
            <div className="flex-1 relative h-full overflow-hidden">
              {/* Backing backdrop layer */}
              <div 
                ref={backdropRef}
                className="absolute inset-0 p-4 font-mono text-xs leading-[22px] pointer-events-none whitespace-pre-wrap break-all overflow-y-auto overflow-x-hidden border border-transparent select-none"
                style={{ 
                  boxSizing: 'border-box',
                  wordBreak: 'break-all',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {renderBackdropContent()}
              </div>

              {/* Foreground interactive transparent textarea */}
              <textarea
                ref={textareaRef}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                onScroll={handleScroll}
                placeholder="请在此粘贴或编写需要解析比对的 JSON 原始数据..."
                spellCheck="false"
                className="absolute inset-0 w-full h-full p-4 font-mono text-xs leading-[22px] resize-none focus:outline-none overflow-y-auto overflow-x-hidden bg-transparent border-0 text-transparent caret-slate-900 selection:bg-indigo-100/70 selection:text-indigo-950"
                style={{
                  boxSizing: 'border-box',
                  wordBreak: 'break-all',
                  whiteSpace: 'pre-wrap',
                  outline: 'none',
                }}
              />

              {/* Error Gutter Overlay / Alert Badge */}
              {parseResult && !parseResult.fullyParsed && (
                <div className="absolute bottom-4 left-4 right-4 bg-rose-50/95 border border-rose-100 rounded-xl p-3 shadow-lg flex items-start gap-2.5 backdrop-blur-sm z-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-rose-900">
                      ⚠️ 检测到语法错误，并在下图中高亮出中断标记（粉红段前为已成功解析节点，红框为出错字符）
                    </p>
                    <p className="text-[11px] text-rose-700 mt-0.5 break-all font-mono">
                      原因：{parseResult.errorMessage}。发生位置：<span className="font-bold font-sans">第 {parseResult.errorLine} 行, 第 {parseResult.errorCol} 列</span>
                    </p>
                    <button 
                      onClick={() => {
                        // Focus and highlight error line
                        if (textareaRef.current) {
                          textareaRef.current.focus();
                          const lineIndex = parseResult.errorLine - 1;
                          const characterIndex = parseResult.errorCol;
                          const textLines = rawText.split('\n');
                          let charOffset = 0;
                          for (let l = 0; l < lineIndex; l++) {
                            charOffset += textLines[l].length + 1; // +1 for newline
                          }
                          charOffset += Math.max(0, characterIndex - 1);
                          textareaRef.current.setSelectionRange(charOffset, charOffset + 3);
                        }
                      }}
                      className="text-[10px] text-rose-600 underline font-semibold mt-1 hover:text-rose-800 cursor-pointer block"
                    >
                      点击在输入面板中精确定位错误字符
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Gutter footer: Preset demopasters */}
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400 font-mono">
              快速加载测试示例:
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handlePasteDemo('valid')}
                className="text-[10px] font-medium text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 px-2 py-1 rounded hover:shadow-sm cursor-pointer"
              >
                标准复杂 JSON 示例
              </button>
              <button
                onClick={() => handlePasteDemo('broken')}
                className="text-[10px] font-medium text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 px-2 py-1 rounded hover:shadow-sm cursor-pointer"
              >
                残缺语法错误 JSON
              </button>
              <button
                onClick={() => handlePasteDemo('escaped')}
                className="text-[10px] font-medium text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 px-2 py-1 rounded hover:shadow-sm cursor-pointer"
              >
                双重转义字符串
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COMPONENT: DETAILED PARSING METRICS & SYNTAX FORMATTED VIEWER (Lg: 6 cols) */}
        <div className="lg:col-span-6 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-md shadow-slate-100/80 overflow-hidden min-h-[500px]">
          
          {/* Format Panel Toolbar */}
          <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <Braces className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-semibold text-slate-700">格式化与容错输出</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Output view-mode switches */}
              <button
                onClick={() => setShowTree(false)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg flex items-center gap-1 cursor-pointer transition-all ${
                  !showTree 
                    ? 'bg-white text-indigo-600 border border-indigo-100 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                <span>代码视图</span>
              </button>
              <button
                onClick={() => setShowTree(true)}
                disabled={!parseResult || parseResult.value === undefined}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-lg flex items-center gap-1 cursor-pointer transition-all disabled:opacity-40 ${
                  showTree 
                    ? 'bg-white text-indigo-600 border border-indigo-100 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <EyeOff className="h-3.5 w-3.5" />
                <span>交互式节点树</span>
              </button>
              <div className="h-4 w-px bg-slate-200"></div>
              <button
                onClick={handleCopy}
                disabled={!rawText.trim()}
                className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg transition-all shadow-sm flex items-center justify-center cursor-pointer"
                title="复制格式化/已修复后的代码"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Parser Results / Progress Diagnostics */}
          {parseResult ? (
            <div className="border-b border-slate-200 bg-slate-50/30 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {parseResult.fullyParsed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      <CheckCircle2 className="h-3 w-3" /> 完美解析 (100% 格式无误)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 animate-pulse">
                      <AlertCircle className="h-3 w-3" /> 残缺容错 (最大努力修复并呈现)
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  有效字符解析进度：{' '}
                  <span className={`font-bold ${parseResult.fullyParsed ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {parseResult.successPercentage}%
                  </span>
                </div>
              </div>

              {/* Progress gauge bar */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    parseResult.fullyParsed ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-500 to-amber-500'
                  }`}
                  style={{ width: `${parseResult.successPercentage}%` }}
                ></div>
              </div>

              {/* Character length indicator */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>成功解析字符数: {parseResult.successLength} 个字符</span>
                <span>输入字符总长度: {rawText.length} 个字符</span>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 text-center text-slate-400 text-xs">
              在左侧输入 JSON 即可看到实时诊断和自适应健康解析百分比
            </div>
          )}

          {/* Content Viewer viewport */}
          <div className="flex-1 bg-slate-50/20 overflow-auto p-4 font-mono text-xs leading-relaxed">
            {!rawText.trim() ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <Braces className="h-8 w-8 text-slate-300 stroke-1 mb-2" />
                <p className="text-xs">解析后的标准美化代码将在此输出...</p>
                <p className="text-[10px] text-slate-400 mt-1 font-sans">暂无输入数据</p>
              </div>
            ) : showTree ? (
              <div className="space-y-1">
                <div className="text-[11px] text-slate-400 font-mono mb-2 pb-1.5 border-b border-slate-200">
                  交互式多级节点树 (展示成功还原的合法部分结构)
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm max-w-full overflow-x-auto">
                  <JsonTreeNode label="root" value={parseResult?.value} />
                </div>
              </div>
            ) : (
              <pre className="text-slate-800 font-mono text-[11px] leading-[20px] select-text break-all whitespace-pre-wrap">
                {parseResult && parseResult.value !== undefined 
                  ? JSON.stringify(parseResult.value, null, 2) 
                  : `// 由于开头或深层嵌套格式存在致命错误，无法完美呈现。
// 以下是 DevDiff 引擎最大努力提取和隔离的前段有效对象树结构 (截止至 ${parseResult?.errorPos} 字符偏移量):
${JSON.stringify(parseResult?.value || null, null, 2)}`}
              </pre>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
