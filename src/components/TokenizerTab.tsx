import React, { useState, useEffect } from 'react';
import { getEncoding, TiktokenEncoding } from 'js-tiktoken';
import { 
  FileText, 
  Binary, 
  HelpCircle, 
  Copy, 
  Check, 
  Sparkles, 
  Layers 
} from 'lucide-react';

type ModelType = 'cl100k_base' | 'o200k_base' | 'p50k_base' | 'r50k_base';

interface TokenInfo {
  id: number;
  text: string;
  colorClass: string;
}

const PASTEL_COLORS = [
  'bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-200/60',
  'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200/60',
  'bg-indigo-100 text-indigo-800 border-indigo-200 hover:bg-indigo-200/60',
  'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200/60',
  'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200/60',
  'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200/60',
  'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200 hover:bg-fuchsia-200/60',
  'bg-teal-100 text-teal-800 border-teal-200 hover:bg-teal-200/60',
];

export default function TokenizerTab() {
  const [inputText, setInputText] = useState(
    "Hello! GPT-4o uses the 'o200k_base' tokenizer, which encodes text more efficiently than older models. 你好！大语言模型会将文本切分为一个个 Token 进行处理，每个 Token 对应一个数值 ID。"
  );
  const [encodingModel, setEncodingModel] = useState<ModelType>('o200k_base');
  const [tokens, setTokens] = useState<number[]>([]);
  const [tokenSlices, setTokenSlices] = useState<TokenInfo[]>([]);
  const [copied, setCopied] = useState(false);
  const [hoveredToken, setHoveredToken] = useState<TokenInfo | null>(null);

  // Initialize and compute tokens
  useEffect(() => {
    try {
      const enc = getEncoding(encodingModel);
      const encoded = enc.encode(inputText);
      setTokens(encoded);

      // Map each token to its decoded string representation
      const slices: TokenInfo[] = [];
      for (let i = 0; i < encoded.length; i++) {
        const tokenId = encoded[i];
        let decodedText = '';
        try {
          // Decode single token
          decodedText = enc.decode([tokenId]);
        } catch {
          decodedText = '';
        }

        slices.push({
          id: tokenId,
          text: decodedText,
          colorClass: PASTEL_COLORS[i % PASTEL_COLORS.length],
        });
      }
      setTokenSlices(slices);
    } catch (err) {
      console.error("Tokenization error:", err);
    }
  }, [inputText, encodingModel]);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(tokens));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setInputText('');
  };

  return (
    <div className="space-y-6">
      
      {/* 选项 & 指标看板 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 选择编码模型 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              选择分词器模型 (Encoding)
            </label>
            <select
              value={encodingModel}
              onChange={(e) => setEncodingModel(e.target.value as ModelType)}
              className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="o200k_base">o200k_base (GPT-4o)</option>
              <option value="cl100k_base">cl100k_base (GPT-4 / GPT-3.5)</option>
              <option value="p50k_base">p50k_base (Codex / Davinci)</option>
              <option value="r50k_base">r50k_base (Legacy / GPT-2)</option>
            </select>
          </div>
          <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-indigo-500 shrink-0" />
            <span>GPT-4o 优化了中英文的分词效率</span>
          </div>
        </div>

        {/* Token 计数 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Token 总数</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1 font-mono">{tokens.length}</p>
          </div>
        </div>

        {/* 字符数计数 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">字符总长度</p>
            <p className="text-2xl font-bold text-slate-800 mt-1 font-mono">{inputText.length}</p>
          </div>
        </div>

        {/* 字节数计数 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Binary className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">UTF-8 字节数</p>
            <p className="text-2xl font-bold text-slate-800 mt-1 font-mono">
              {new Blob([inputText]).size}
            </p>
          </div>
        </div>
      </div>

      {/* 主工作区 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：输入文本面板 */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-lg shadow-slate-100/90 overflow-hidden flex flex-col min-h-[420px]">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-700">原文输入区 (输入后在右侧实时显示切分结果)</span>
            </div>
            <button
              onClick={handleClear}
              className="text-[10px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded transition-colors cursor-pointer"
            >
              清空
            </button>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="请在此输入你想进行 Tokenizer 分词计算的任何文本或代码..."
            className="flex-1 p-5 font-sans text-sm text-slate-700 leading-relaxed resize-none focus:outline-none border-0 bg-transparent placeholder-slate-400"
          />
        </div>

        {/* 右侧：分词可视化展示 */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-lg shadow-slate-100/90 overflow-hidden flex flex-col min-h-[420px]">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-700">Token 切分流 (Color-coded Tokenizer Stream)</span>
            </div>
            <button
              onClick={handleCopy}
              className="text-[10px] font-semibold text-slate-600 hover:text-indigo-600 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg hover:shadow-sm flex items-center gap-1 cursor-pointer"
              title="复制 Token IDs 数组"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              <span>复制 IDs</span>
            </button>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {/* Token 悬浮详情信息 */}
            <div className="h-9 px-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between">
              {hoveredToken ? (
                <div className="flex items-center justify-between w-full text-xs">
                  <span className="font-mono text-slate-500">
                    Token ID: <span className="font-bold text-indigo-600">{hoveredToken.id}</span>
                  </span>
                  <span className="font-mono text-slate-500">
                    代表字符: <code className="bg-slate-200 px-1 rounded font-sans text-slate-800">"{hoveredToken.text}"</code>
                  </span>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <HelpCircle className="h-3.5 w-3.5 text-slate-300" />
                  <span>将鼠标滑过下方的 Token 块，可以查看对应的 Token ID 与内容</span>
                </div>
              )}
            </div>

            {/* Token 流列表 */}
            {inputText ? (
              <div 
                className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl flex flex-wrap gap-x-0.5 gap-y-1 text-sm font-sans select-text break-words content-start overflow-y-auto max-h-[300px]"
                style={{ wordBreak: 'break-all' }}
              >
                {tokenSlices.map((slice, idx) => (
                  <span
                    key={idx}
                    onMouseEnter={() => setHoveredToken(slice)}
                    onMouseLeave={() => setHoveredToken(null)}
                    className={`inline-block px-0.5 py-0.5 border border-transparent font-mono rounded transition-all cursor-help select-text ${slice.colorClass} ${
                      hoveredToken?.id === slice.id && hoveredToken?.text === slice.text
                        ? 'ring-2 ring-indigo-500/50 scale-105 z-10'
                        : ''
                    }`}
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all'
                    }}
                  >
                    {slice.text.replace(/\n/g, '↵\n')}
                  </span>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <Layers className="h-8 w-8 text-slate-200 stroke-1 mb-2 animate-pulse" />
                <p className="text-xs">暂无切分数据，请在左侧输入文本</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}
