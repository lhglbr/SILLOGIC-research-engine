import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, RefreshCw, ChevronLeft, Paperclip, X, Download, FileText, BrainCircuit, Maximize2, Copy, Check, FileDown, Cpu, Zap, Sparkles, MessageSquare, Hexagon, Flame, Sliders, VolumeX, ChevronDown, ChevronUp, Lightbulb, Code, PanelRightOpen, PanelRightClose, Pencil, RotateCcw, Image as ImageIcon, GitBranch, Split, Columns, Layout, PanelLeftClose, Database, HardDrive, Github, Terminal, Plug, Dna, ZoomIn, ZoomOut, Move, StopCircle, Globe, Settings, Bot, Menu, BookOpen, UploadCloud, Film, Music, File, Lock, Crown, Palette, Sun, Moon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import { ChatMessage, UserContext, ModelProvider, AgentConfig, MCPPlugin, MCPTool, MultiModelResponse, ResearchField, ResearchTask, ChatSession, KnowledgeFile, SubscriptionTier } from '../types';
import { streamResponse } from '../services/geminiService';
import { PricingModal } from './PricingModal';
import { useAuth } from '../contexts/AuthContext';

interface ChatInterfaceProps {
  context: UserContext;
  themeColor: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  customTheme: string | null;
  onSetCustomTheme: (color: string | null) => void;
  initialSessionData?: ChatSession;
  onUpdateSession?: (data: Partial<ChatSession>) => void;
  onBack: () => void;
  onToggleLanguage: () => void;
  onToggleSidebar?: () => void;
}

// --- Translations ---
const TRANSLATIONS = {
    en: {
        activeCluster: "Select Engine",
        splitView: "Split View Active",
        singleSession: "Single Session",
        export: "Export Conversation",
        config: "Configuration",
        settings: "Settings",
        knowledgeBase: "Knowledge Base",
        uploadToKB: "Upload to Knowledge Base",
        kbDesc: "Upload PDFs, images, or audio to build a persistent context for this session.",
        messagePlaceholder: "Message ProtoChat...",
        askQuestion: "Ask a research question... (Ctrl + Enter to send)",
        send: "Send",
        thinking: "Reasoning Chain",
        complete: "Complete",
        preview: "Preview",
        viewArtifact: "View Generated Artifact",
        fork: "Fork",
        systemTemp: "System Temperature",
        topP: "Top P (Nucleus)",
        mcpMarketplace: "MCP Marketplace",
        installed: "INSTALLED",
        get: "GET",
        selectModels: "Select up to 3 Models",
        ready: "Ready to research.",
        selectEngine: "Select Engine",
        chars: "chars",
        files: "files",
        upgradeRequired: "Upgrade Required",
        unlockModel: "Upgrade to Pro to unlock this model.",
        appearance: "Appearance",
        themeMode: "Theme Mode",
        accentColor: "Accent Color",
        autoColor: "Auto (Field Default)",
        darkMode: "Dark Mode"
    },
    zh: {
        activeCluster: "选择模型引擎",
        splitView: "分屏模式",
        singleSession: "单会话模式",
        export: "导出对话",
        config: "系统配置",
        settings: "设置",
        knowledgeBase: "个人知识库",
        uploadToKB: "上传至知识库",
        kbDesc: "上传 PDF、图片或音频，为此会话构建持久上下文。",
        messagePlaceholder: "发送给 ProtoChat...",
        askQuestion: "输入研究问题... (Ctrl + Enter 发送)",
        send: "发送",
        thinking: "推理链",
        complete: "完成",
        preview: "预览",
        viewArtifact: "查看生成的工件",
        fork: "分叉",
        systemTemp: "系统温度 (Temperature)",
        topP: "核采样 (Top P)",
        mcpMarketplace: "MCP 插件市场",
        installed: "已安装",
        get: "获取",
        selectModels: "最多选择 3 个模型",
        ready: "准备开始研究。",
        selectEngine: "选择引擎",
        chars: "字符",
        files: "文件",
        upgradeRequired: "需要升级",
        unlockModel: "升级至 Pro 版以解锁此模型。",
        appearance: "外观",
        themeMode: "主题模式",
        accentColor: "主题色",
        autoColor: "自动 (学科默认)",
        darkMode: "深色模式"
    }
};

// --- Constants ---

const AVAILABLE_MODELS = [
  { id: ModelProvider.GEMINI_FLASH, name: "Gemini 2.5 Flash", desc: "Google • Fast", isPro: false },
  { id: ModelProvider.GEMINI_PRO, name: "Gemini 3.0 Pro", desc: "Google • Complex Reasoning", isPro: true },
  { id: ModelProvider.GEMINI_THINKING, name: "Gemini 3.0 Thinking", desc: "Google • Deep Logic", isPro: true },
  { id: ModelProvider.OPENAI_GPT4O, name: "GPT-4o", desc: "OpenAI • Omni", isPro: true },
  { id: ModelProvider.OPENAI_O1, name: "o1-preview", desc: "OpenAI • Reasoning", isPro: true },
  { id: ModelProvider.CLAUDE_3_5_SONNET, name: "Claude 3.5 Sonnet", desc: "Anthropic • Nuance", isPro: true },
  { id: ModelProvider.DEEPSEEK_V3, name: "DeepSeek V3", desc: "DeepSeek • Efficient", isPro: false },
  { id: ModelProvider.DEEPSEEK_R1, name: "DeepSeek R1", desc: "DeepSeek • Math", isPro: true },
  { id: ModelProvider.GROQ_LLAMA_3, name: "Llama 3 70B", desc: "Meta • Fast", isPro: false },
];

const MOCK_MCP_PLUGINS: MCPPlugin[] = [
    {
        id: 'filesystem', name: 'FileSystem Access', description: 'Read/Write local files (Simulated)', author: 'System', version: '1.0.0', icon: HardDrive,
        tools: [{ name: 'fs_read_file', description: 'Read file', parameters: {} }, { name: 'fs_list_directory', description: 'List dir', parameters: {} }]
    },
    {
        id: 'postgres', name: 'PostgreSQL Connector', description: 'Query SQL databases', author: 'PgTeam', version: '2.1.0', icon: Database,
        tools: [{ name: 'pg_query', description: 'Execute SQL', parameters: {} }]
    },
    {
        id: 'github', name: 'GitHub Integration', description: 'Manage issues & PRs', author: 'GitHub', version: '1.2.0', icon: Github,
        tools: [{ name: 'github_list_issues', description: 'List issues', parameters: {} }]
    }
];

const THEME_COLORS = ['blue', 'violet', 'emerald', 'amber', 'rose', 'cyan'];

// --- Sub-Components ---

// 1. Thinking Process Visualization (CoT)
const ThinkingProcess: React.FC<{ content: string, isDone: boolean, t: any }> = ({ content, isDone, t }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded && scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content, isExpanded]);

  return (
    <div className="my-2 rounded-lg border dark:border-white/10 border-black/10 dark:bg-black/30 bg-gray-100/50 overflow-hidden">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 dark:bg-white/5 bg-gray-200/50 hover:bg-gray-300/50 dark:hover:bg-white/10 transition-colors text-xs dark:text-gray-400 text-gray-600 font-mono uppercase tracking-wider"
      >
        <div className="flex items-center gap-2">
            <BrainCircuit size={14} className={isDone ? "text-gray-500" : "text-blue-500 animate-pulse"} />
            <span>{t.thinking} {isDone ? `(${t.complete})` : "..."}</span>
        </div>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {isExpanded && (
        <div ref={scrollRef} className="p-3 max-h-48 overflow-y-auto font-mono text-xs text-gray-600 dark:text-gray-500 whitespace-pre-wrap dark:bg-black/50 bg-white border-t border-black/5 dark:border-white/5">
            {content || "Initializing thought process..."}
            {!isDone && <span className="inline-block w-2 h-4 ml-1 bg-blue-500/50 animate-pulse align-middle"/>}
        </div>
      )}
    </div>
  );
};

// 2. Artifact Renderer (Right Panel)
const ArtifactRenderer: React.FC<{ content: string, type: 'svg' | 'html' | 'react' | 'pdb' | 'mermaid', onClose: () => void, t: any }> = ({ content, type, onClose, t }) => {
    const [scale, setScale] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (type === 'mermaid') {
             mermaid.initialize({ startOnLoad: true, theme: 'default' });
             mermaid.contentLoaded();
        }
        if (type === 'pdb') {
            // @ts-ignore
            if (window.$3Dmol) {
                // @ts-ignore
                const viewer = window.$3Dmol.createViewer(containerRef.current, { backgroundColor: 'white' });
                if (content.trim().length === 4) {
                    // @ts-ignore
                    window.$3Dmol.download(`pdb:${content.trim()}`, viewer, { multimodel: true, frames: true }, function() {
                        viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
                        viewer.zoomTo();
                        viewer.render();
                    });
                } else {
                     viewer.addModel(content, "pdb");
                     viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
                     viewer.zoomTo();
                     viewer.render();
                }
            }
        }
    }, [content, type]);

    const handleDownload = () => {
        const blob = new Blob([content], { type: type === 'svg' ? 'image/svg+xml' : 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `artifact.${type}`;
        a.click();
    };

    return (
        <div className="h-full flex flex-col dark:bg-[#0c0c0e] bg-white border-l dark:border-white/10 border-gray-200">
            <div className="flex items-center justify-between p-4 border-b dark:border-white/10 border-gray-200 dark:bg-white/5 bg-gray-50">
                <div className="flex items-center gap-2 text-sm font-bold dark:text-gray-200 text-gray-800 uppercase tracking-wider">
                    {type === 'pdb' ? <Dna size={16} className="text-emerald-500"/> : <Code size={16} className="text-blue-500"/>}
                    {type.toUpperCase()} {t.preview}
                </div>
                <div className="flex items-center gap-2">
                    {type === 'svg' && (
                        <>
                            <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"><ZoomOut size={16} className="text-gray-600 dark:text-gray-400"/></button>
                            <span className="text-xs text-gray-500 w-8 text-center">{Math.round(scale * 100)}%</span>
                            <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"><ZoomIn size={16} className="text-gray-600 dark:text-gray-400"/></button>
                        </>
                    )}
                    <button onClick={handleDownload} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded text-gray-400 hover:text-gray-900 dark:hover:text-white" title="Download">
                        <Download size={16}/>
                    </button>
                    <button onClick={onClose} className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        <PanelRightClose size={16}/>
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden relative dark:bg-[#0a0a0a] bg-gray-50">
                {type === 'svg' && (
                    <div className="w-full h-full flex items-center justify-center overflow-auto p-8">
                        <div 
                            style={{ transform: `scale(${scale})`, transition: 'transform 0.2s' }}
                            dangerouslySetInnerHTML={{ __html: content }} 
                        />
                    </div>
                )}
                {type === 'html' && (
                    <iframe title="preview" srcDoc={content} className="w-full h-full bg-white" />
                )}
                {(type === 'pdb' || type === 'mermaid') && (
                     <div ref={containerRef} className="w-full h-full relative bg-white" />
                )}
                {type === 'mermaid' && (
                    <div className="mermaid p-4 flex justify-center">{content}</div>
                )}
            </div>
        </div>
    );
};

// 3. Message Bubble
const MessageBubble: React.FC<{ 
    msg: ChatMessage, 
    themeColor: string, 
    onFork?: (msgId: string) => void,
    onViewArtifact: (content: string, type: any) => void,
    t: any
}> = ({ msg, themeColor, onFork, onViewArtifact, t }) => {
  const isUser = msg.role === 'user';
  
  const detectArtifact = (text: string) => {
     const svgMatch = text.match(/```svg\n([\s\S]*?)```/);
     const htmlMatch = text.match(/```html\n([\s\S]*?)```/);
     const pdbMatch = text.match(/```pdb\n([\s\S]*?)```/);
     const mermaidMatch = text.match(/```mermaid\n([\s\S]*?)```/);
     
     if (svgMatch) return { type: 'svg', content: svgMatch[1] };
     if (htmlMatch) return { type: 'html', content: htmlMatch[1] };
     if (pdbMatch) return { type: 'pdb', content: pdbMatch[1] };
     if (mermaidMatch) return { type: 'mermaid', content: mermaidMatch[1] };
     return null;
  };

  const renderContent = (text: string, isThinking = false) => {
      const thinkMatch = text.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
      const thinkContent = thinkMatch ? thinkMatch[1] : null;
      const finalContent = text.replace(/<think>[\s\S]*?(?:<\/think>|$)/, '').trim();

      const artifact = detectArtifact(finalContent);

      return (
        <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
            {thinkContent && (
                <ThinkingProcess content={thinkContent} isDone={!isThinking} t={t} />
            )}
            
            <ReactMarkdown 
                remarkPlugins={[remarkMath, remarkGfm]} 
                rehypePlugins={[rehypeKatex]}
                components={{
                    code({node, className, children, ...props}) {
                        const match = /language-(\w+)/.exec(className || '')
                        return !String(children).includes('\n') ? (
                            <code className={className} {...props}>{children}</code>
                        ) : (
                           <div className="relative group">
                             {(match && ['svg', 'html', 'xml', 'pdb', 'mermaid'].includes(match[1])) && (
                                 <button 
                                   onClick={() => onViewArtifact(String(children).replace(/\n$/, ''), match![1])}
                                   className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-${themeColor}-100 dark:bg-${themeColor}-600/20 text-${themeColor}-600 dark:text-${themeColor}-400 text-xs rounded border border-${themeColor}-200 dark:border-${themeColor}-500/30 hover:bg-${themeColor}-200 dark:hover:bg-${themeColor}-600/40 transition-colors`}
                                 >
                                    <Maximize2 size={12}/> {t.preview}
                                 </button>
                             )}
                             <pre className={className} {...props}><code>{children}</code></pre>
                           </div>
                        )
                    }
                }}
            >
                {finalContent || (isThinking ? "Thinking..." : "")}
            </ReactMarkdown>

            {artifact && (
                 <button 
                    onClick={() => onViewArtifact(artifact.content, artifact.type)}
                    className={`mt-4 w-full py-2 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg flex items-center justify-center gap-2 text-${themeColor}-600 dark:text-${themeColor}-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors`}
                 >
                    {artifact.type === 'pdb' ? <Dna size={16}/> : <Layout size={16}/>}
                    {t.viewArtifact} ({artifact.type.toUpperCase()})
                 </button>
            )}
        </div>
      );
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-6 group">
        <div className={`relative max-w-[85%] bg-white dark:bg-white/10 text-gray-800 dark:text-white p-4 rounded-2xl rounded-tr-none border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none dark:backdrop-blur-sm`}>
           {renderContent(msg.content)}
           <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                <button className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white bg-gray-200 dark:bg-black/50 rounded-full"><Pencil size={12}/></button>
           </div>
        </div>
      </div>
    );
  }

  // Model Response
  return (
    <div className="flex justify-start mb-8 w-full group relative">
      <div className={`w-8 h-8 rounded-full bg-${themeColor}-100 dark:bg-${themeColor}-600/20 border border-${themeColor}-200 dark:border-${themeColor}-500/30 flex items-center justify-center mr-3 shrink-0 mt-1`}>
         <Bot size={16} className={`text-${themeColor}-600 dark:text-${themeColor}-400`} />
      </div>
      
      <div className="flex-1 min-w-0">
         <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-xs font-bold text-${themeColor}-600 dark:text-${themeColor}-400`}>ProtoChat Intelligence</span>
            <span className="text-[10px] text-gray-400 font-mono">{new Date(msg.timestamp).toLocaleTimeString()}</span>
            {onFork && (
                <button 
                    onClick={() => onFork(msg.id)}
                    className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-full"
                >
                    <GitBranch size={10}/> {t.fork}
                </button>
            )}
         </div>

         {msg.multiResponses ? (
             <div className={`grid gap-4 ${msg.multiResponses.length > 1 ? 'lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                 {msg.multiResponses.map((res, idx) => (
                     <div key={idx} className="bg-white dark:bg-[#0c0c0e] border border-gray-200 dark:border-white/10 rounded-xl p-4 overflow-hidden shadow-sm dark:shadow-lg">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-white/5">
                            <div className={`w-2 h-2 rounded-full bg-${res.isDone ? 'green-500' : 'yellow-500'} animate-${res.isDone ? 'none' : 'pulse'}`} />
                            <span className="text-xs font-mono text-gray-500 dark:text-gray-400 uppercase">{res.modelName}</span>
                        </div>
                        {renderContent(res.content, res.isThinking)}
                     </div>
                 ))}
             </div>
         ) : (
             <div className="glass-panel p-5 rounded-xl rounded-tl-none border dark:border-white/10 border-gray-200 bg-white/50 dark:bg-white/5">
                 {renderContent(msg.content, msg.isThinking)}
             </div>
         )}
      </div>
    </div>
  );
};

// 4. Compact Model Dropdown (With Gating)
const ChatModelDropdown: React.FC<{
  activeModels: ModelProvider[],
  setActiveModels: (models: ModelProvider[]) => void,
  themeColor: string,
  t: any,
  onOpenPricing: () => void
}> = ({ activeModels, setActiveModels, themeColor, t, onOpenPricing }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  
  const currentTier = user?.tier || SubscriptionTier.FREE;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleModel = (id: ModelProvider, isPro: boolean) => {
     // Gating Check
     if (isPro && currentTier === SubscriptionTier.FREE) {
         setIsOpen(false);
         onOpenPricing();
         return;
     }

     if (activeModels.includes(id)) {
         if (activeModels.length > 1) setActiveModels(activeModels.filter(m => m !== id));
     } else {
         if (activeModels.length < 3) setActiveModels([...activeModels, id]);
     }
  };

  const getButtonLabel = () => {
    if (activeModels.length === 0) return t.selectEngine;
    const names = activeModels.map(id => {
        const m = AVAILABLE_MODELS.find(mod => mod.id === id);
        if (!m) return "";
        return m.name.split(" ")[0];
    });
    return names.join(" + ");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-mono uppercase tracking-wider ${isOpen ? `bg-${themeColor}-100 dark:bg-${themeColor}-600/20 border-${themeColor}-500 text-${themeColor}-600 dark:text-${themeColor}-400` : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
      >
        <Cpu size={14} />
        <span className="max-w-[200px] truncate">{getButtonLabel()}</span>
        {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {isOpen && (
        <div className="absolute bottom-full mb-2 left-0 w-64 bg-white dark:bg-[#0f0f11] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-64 overflow-y-auto">
          <div className="p-2 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 flex justify-between items-center">
              <span className="text-[10px] text-gray-500 font-bold uppercase">{t.selectModels}</span>
              {currentTier === SubscriptionTier.FREE && (
                  <button onClick={onOpenPricing} className="text-[10px] text-blue-500 hover:underline flex items-center gap-1">
                      <Crown size={10} /> Upgrade
                  </button>
              )}
          </div>
          {AVAILABLE_MODELS.map((model) => {
            const isSelected = activeModels.includes(model.id);
            const isLocked = model.isPro && currentTier === SubscriptionTier.FREE;
            
            return (
              <button
                key={model.id}
                onClick={() => toggleModel(model.id, model.isPro)}
                className={`w-full flex items-center justify-between p-3 border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${isSelected ? `bg-${themeColor}-50 dark:bg-${themeColor}-900/10` : ''}`}
              >
                 <div className="flex flex-col text-left">
                    <div className="flex items-center gap-2">
                         <span className={`text-xs font-semibold ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{model.name}</span>
                         {model.isPro && <Crown size={10} className="text-yellow-500"/>}
                    </div>
                 </div>
                 {isLocked ? (
                     <Lock size={12} className="text-gray-400" />
                 ) : (
                     isSelected && <Check size={14} className={`text-${themeColor}-600 dark:text-${themeColor}-400`} />
                 )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- Main Chat Pane Hook ---
const useChatSession = (initialHistory: ChatMessage[] = [], context: UserContext, onUpdate?: (data: any) => void) => {
    const [history, setHistory] = useState<ChatMessage[]>(initialHistory);
    const [isLoading, setIsLoading] = useState(false);
    const [input, setInput] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    
    // Knowledge Base files handled at parent level but we need to reference them for sending
    const [activeModels, setActiveModels] = useState<ModelProvider[]>(context.models);

    // Sync state changes to parent (Sidebar history)
    useEffect(() => {
        if (onUpdate && history.length > 0) {
            onUpdate({ history, activeModels });
        }
    }, [history, activeModels]);

    const handleSubmit = async (e?: React.FormEvent, knowledgeBaseFiles: KnowledgeFile[] = []) => {
        if (e) e.preventDefault();
        if ((!input.trim() && files.length === 0) || isLoading) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: Date.now()
        };

        const modelMsgId = (Date.now() + 1).toString();
        const initialMultiResponses: MultiModelResponse[] = activeModels.map(m => ({
            modelId: m,
            modelName: AVAILABLE_MODELS.find(am => am.id === m)?.name || m,
            content: "",
            isThinking: true,
            isDone: false
        }));

        const modelMsg: ChatMessage = {
            id: modelMsgId,
            role: 'model',
            content: "", 
            timestamp: Date.now(),
            multiResponses: initialMultiResponses,
            isThinking: true
        };

        setHistory(prev => [...prev, userMsg, modelMsg]);
        setInput("");
        setFiles([]);
        setIsLoading(true);

        try {
            await Promise.all(activeModels.map(async (modelId, index) => {
                const modelHistory = history.map(msg => {
                    if (msg.role === 'user') return { role: 'user', parts: [{ text: msg.content }] };
                    const specificResponse = msg.multiResponses?.find(r => r.modelId === modelId);
                    const text = specificResponse ? specificResponse.content : (msg.content || "");
                    return { role: 'model', parts: [{ text }] };
                });
                
                modelHistory.push({ role: 'user', parts: [{ text: userMsg.content }] });

                await streamResponse(
                    modelHistory,
                    userMsg.content,
                    files,
                    knowledgeBaseFiles,
                    {
                        field: context.field || ResearchField.GENERAL,
                        task: context.task || ResearchTask.DEEP_SEARCH,
                        config: context.config,
                        language: context.language
                    },
                    modelId,
                    (chunk) => {
                        setHistory(prev => prev.map(msg => {
                            if (msg.id === modelMsgId && msg.multiResponses) {
                                const newResponses = [...msg.multiResponses];
                                newResponses[index] = {
                                    ...newResponses[index],
                                    content: newResponses[index].content + chunk
                                };
                                return { ...msg, multiResponses: newResponses };
                            }
                            return msg;
                        }));
                    }
                );
                
                setHistory(prev => prev.map(msg => {
                    if (msg.id === modelMsgId && msg.multiResponses) {
                        const newResponses = [...msg.multiResponses];
                        newResponses[index] = { ...newResponses[index], isDone: true, isThinking: false };
                        return { ...msg, multiResponses: newResponses };
                    }
                    return msg;
                }));

            }));
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
            setHistory(prev => prev.map(msg => {
                if (msg.id === modelMsgId) return { ...msg, isThinking: false };
                return msg;
            }));
        }
    };

    return { history, setHistory, isLoading, input, setInput, files, setFiles, handleSubmit, activeModels, setActiveModels };
};


// --- Main Component ---

const ChatInterface: React.FC<ChatInterfaceProps> = ({ context, themeColor, isDarkMode, onToggleTheme, customTheme, onSetCustomTheme, initialSessionData, onUpdateSession, onBack, onToggleLanguage, onToggleSidebar }) => {
  const [panes, setPanes] = useState<number[]>([1]); 
  const [activePaneIdx, setActivePaneIdx] = useState(0);
  
  const [artifact, setArtifact] = useState<{content: string, type: 'svg'|'html'|'react'|'pdb'|'mermaid'}|null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isKbOpen, setIsKbOpen] = useState(false); // Knowledge Base Drawer State
  const [showPricing, setShowPricing] = useState(false);

  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeFile[]>(initialSessionData?.knowledgeBase || []);
  const [agentConfig, setAgentConfig] = useState<AgentConfig>(context.config || { temperature: 0.7, topP: 0.95, mcpPlugins: [] });

  const { user } = useAuth();
  const t = context.language === 'zh' ? TRANSLATIONS.zh : TRANSLATIONS.en;
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Use session1 as the primary session that syncs with parent (sidebar history)
  const session1 = useChatSession(initialSessionData?.history || [], context, onUpdateSession);
  const session2 = useChatSession([], context); // Secondary split pane, ephemeral for now

  const isSplit = panes.length > 1;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session1.history, session2.history]);

  // Handle Initial Data Change (switching sessions from sidebar)
  useEffect(() => {
      if (initialSessionData) {
          session1.setHistory(initialSessionData.history);
          if (initialSessionData.activeModels) session1.setActiveModels(initialSessionData.activeModels);
          if (initialSessionData.knowledgeBase) setKnowledgeBase(initialSessionData.knowledgeBase);
      }
  }, [initialSessionData?.id]);

  // Sync KB changes back to session
  useEffect(() => {
      if (onUpdateSession && initialSessionData) {
          onUpdateSession({ knowledgeBase });
      }
  }, [knowledgeBase]);

  const handleUploadToKB = (files: File[]) => {
      const newFiles: KnowledgeFile[] = files.map(f => ({
          id: Date.now() + Math.random().toString(),
          name: f.name,
          type: f.type,
          file: f,
          timestamp: Date.now()
      }));
      setKnowledgeBase(prev => [...prev, ...newFiles]);
  };

  const handleFork = (msgId: string, fromSession: number) => {
      if (isSplit) return; 
      
      const sourceSession = fromSession === 1 ? session1 : session2;
      const targetSession = fromSession === 1 ? session2 : session1;
      
      const idx = sourceSession.history.findIndex(m => m.id === msgId);
      if (idx === -1) return;
      
      const forkedHistory = sourceSession.history.slice(0, idx + 1);
      
      targetSession.setHistory(forkedHistory);
      targetSession.setActiveModels(sourceSession.activeModels);
      
      setPanes([1, 2]);
      setActivePaneIdx(1); 
  };

  const handleExport = (history: ChatMessage[]) => {
      const date = new Date().toLocaleString();
      let text = `# ProtoChat Export - ${date}\n\n`;
      text += `**Field:** ${context.field}\n**Task:** ${context.task}\n\n---\n\n`;
      text += history.map(m => {
          const role = m.role === 'user' ? '## User' : '## ProtoChat';
          const time = new Date(m.timestamp).toLocaleTimeString();
          const content = m.multiResponses 
            ? m.multiResponses.map(r => `### Model: ${r.modelName}\n${r.content}`).join('\n\n') 
            : m.content;
          return `${role} (${time})\n\n${content}`;
      }).join('\n\n---\n\n');
      
      const blob = new Blob([text], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `protochat_export_${Date.now()}.md`;
      a.click();
  };
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeSession = activePaneIdx === 0 ? session1 : session2;

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 128) + 'px';
    }
  }, [activeSession.input]);

  return (
    <div className="flex h-screen w-full overflow-hidden relative">
      
      {showPricing && (
          <PricingModal 
            lang={context.language} 
            onClose={() => setShowPricing(false)} 
            currentTier={user?.tier || SubscriptionTier.FREE}
          />
      )}

      {/* LEFT: Chat Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${artifact ? 'mr-[400px]' : ''}`}>
        
        {/* Header */}
        <div className="h-16 border-b dark:border-white/10 border-gray-200 dark:bg-black/40 bg-white/80 backdrop-blur flex items-center justify-between px-6 z-20">
            <div className="flex items-center gap-4">
                <button onClick={onToggleSidebar} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-gray-500">
                    <Menu size={20} />
                </button>
                <button onClick={onBack} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-wide font-mono flex items-center gap-2">
                        <Bot size={18} className={`text-${themeColor}-600 dark:text-${themeColor}-400`} />
                        ProtoChat <span className="text-gray-400">/</span> {context.field}
                    </h1>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <button 
                  onClick={onToggleLanguage}
                  className="hidden md:flex p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white items-center gap-1 font-mono text-xs"
                  title="Switch Language"
                >
                    <Globe size={18}/> {context.language === 'en' ? 'EN' : 'ZH'}
                </button>
                <div className="hidden md:block w-px h-6 bg-gray-200 dark:bg-white/10 mx-2" />
                
                {/* Knowledge Base Toggle */}
                <button 
                    onClick={() => { setIsKbOpen(true); setIsSettingsOpen(false); }}
                    className={`p-2 rounded-lg transition-colors relative ${isKbOpen ? `bg-${themeColor}-100 dark:bg-${themeColor}-600 text-${themeColor}-700 dark:text-white` : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                    title={t.knowledgeBase}
                >
                    <BookOpen size={18}/>
                    {knowledgeBase.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500"></span>}
                </button>

                <button onClick={() => isSplit ? setPanes([1]) : null} className={`hidden md:block p-2 rounded-lg ${!isSplit ? `bg-${themeColor}-100 dark:bg-${themeColor}-600 text-${themeColor}-700 dark:text-white` : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                    <MessageSquare size={18}/>
                </button>
                <button onClick={() => !isSplit && session1.history.length > 0 ? setPanes([1,2]) : null} className={`hidden md:block p-2 rounded-lg ${isSplit ? `bg-${themeColor}-100 dark:bg-${themeColor}-600 text-${themeColor}-700 dark:text-white` : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
                    <Columns size={18}/>
                </button>
                <button onClick={() => handleExport(activeSession.history)} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white" title={t.export}>
                    <Download size={18}/>
                </button>
                <button onClick={() => { setIsSettingsOpen(true); setIsKbOpen(false); }} className={`p-2 rounded-lg transition-colors ${isSettingsOpen ? `bg-${themeColor}-100 dark:bg-${themeColor}-600 text-${themeColor}-700 dark:text-white` : 'text-gray-400 hover:text-gray-900 dark:hover:text-white'}`} title={t.settings}>
                    <Settings size={18}/>
                </button>
            </div>
        </div>

        {/* Panes Container */}
        <div className="flex-1 flex overflow-hidden relative">
            {panes.map((paneId, idx) => {
                const session = paneId === 1 ? session1 : session2;
                const isActive = activePaneIdx === idx;
                
                return (
                    <div 
                        key={paneId} 
                        onClick={() => setActivePaneIdx(idx)}
                        className={`flex-1 flex flex-col min-w-0 border-r dark:border-white/10 border-gray-200 bg-gray-50/50 dark:bg-black/20 transition-opacity ${isActive ? 'opacity-100' : 'opacity-40 hover:opacity-80'}`}
                    >
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
                            {session.history.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 pointer-events-none">
                                    <BrainCircuit size={64} className={`text-${themeColor}-500 mb-4`} />
                                    <p className="text-lg font-mono text-gray-400 dark:text-gray-500">{t.ready}</p>
                                </div>
                            ) : (
                                session.history.map(msg => (
                                    <MessageBubble 
                                        key={msg.id} 
                                        msg={msg} 
                                        themeColor={themeColor} 
                                        onFork={(msgId) => handleFork(msgId, paneId)}
                                        onViewArtifact={(c, t) => setArtifact({content: c, type: t})}
                                        t={t}
                                    />
                                ))
                            )}
                            <div ref={bottomRef} />
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/90 dark:bg-black/80 backdrop-blur border-t dark:border-white/10 border-gray-200 z-30">
             <div className="flex items-center justify-between mb-3">
                 <ChatModelDropdown 
                    activeModels={activeSession.activeModels} 
                    setActiveModels={activeSession.setActiveModels} 
                    themeColor={themeColor}
                    t={t}
                    onOpenPricing={() => setShowPricing(true)}
                 />
                 <span className="text-[10px] text-gray-400 dark:text-gray-600 font-mono">
                     {activeSession.input.length} {t.chars}
                 </span>
             </div>

             <div className={`relative flex items-end gap-2 bg-white dark:bg-[#0c0c0e] rounded-xl p-2 border transition-colors ${activeSession.isLoading ? 'border-gray-200 dark:border-white/5 opacity-50' : `border-gray-300 dark:border-white/10 focus-within:border-${themeColor}-400 dark:focus-within:border-${themeColor}-500/50`}`}>
                <input 
                    type="file" 
                    id="file-upload" 
                    className="hidden" 
                    multiple 
                    onChange={(e) => e.target.files && activeSession.setFiles(Array.from(e.target.files))}
                />
                <button 
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="p-3 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
                >
                    <Paperclip size={20} />
                </button>
                
                <div className="flex-1 min-w-0">
                    {/* File Previews */}
                    {activeSession.files.length > 0 && (
                        <div className="flex gap-2 mb-2 overflow-x-auto">
                            {activeSession.files.map((f, i) => (
                                <div key={i} className="flex items-center gap-1 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-300">
                                    <FileText size={12}/> {f.name} <button onClick={() => activeSession.setFiles(activeSession.files.filter((_, idx) => idx !== i))}><X size={10}/></button>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <textarea
                        ref={textareaRef}
                        value={activeSession.input}
                        onChange={(e) => activeSession.setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                activeSession.handleSubmit(e, knowledgeBase);
                            }
                        }}
                        placeholder={isSplit ? (activePaneIdx === 0 ? "Message Left Pane..." : "Message Right Pane...") : t.askQuestion}
                        className="w-full bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 font-mono text-sm resize-none py-3 focus:outline-none min-h-[40px] max-h-32"
                        rows={1}
                    />
                </div>

                <button 
                    onClick={(e) => activeSession.handleSubmit(e, knowledgeBase)}
                    disabled={activeSession.isLoading || (!activeSession.input.trim() && activeSession.files.length === 0)}
                    className={`p-3 rounded-xl transition-all ${activeSession.isLoading ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500' : `bg-${themeColor}-600 hover:bg-${themeColor}-500 text-white shadow-lg shadow-${themeColor}-500/20`}`}
                >
                    {activeSession.isLoading ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
             </div>
        </div>

      </div>

      {/* RIGHT: Artifact Panel */}
      {artifact && (
          <div className="absolute inset-y-0 right-0 w-[400px] z-40 shadow-2xl animate-in slide-in-from-right duration-300">
              <ArtifactRenderer content={artifact.content} type={artifact.type} onClose={() => setArtifact(null)} t={t} />
          </div>
      )}

      {/* RIGHT: Knowledge Base Drawer */}
      {isKbOpen && (
          <div className="absolute inset-y-0 right-0 w-80 bg-white dark:bg-[#0f0f11] border-l border-gray-200 dark:border-white/10 z-50 p-6 flex flex-col shadow-2xl animate-in slide-in-from-right">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><BookOpen size={18}/> {t.knowledgeBase}</h2>
                  <button onClick={() => setIsKbOpen(false)}><X size={18} className="text-gray-400 hover:text-gray-900 dark:hover:text-white"/></button>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg text-xs text-blue-700 dark:text-blue-300 mb-6 border border-blue-100 dark:border-blue-800">
                  {t.kbDesc}
              </div>

              {/* Upload Area */}
              <div className="mb-6">
                  <input 
                      type="file" 
                      id="kb-upload" 
                      className="hidden" 
                      multiple 
                      accept=".pdf,.png,.jpg,.jpeg,.mp3,.wav,.mp4"
                      onChange={(e) => {
                          if (e.target.files) handleUploadToKB(Array.from(e.target.files));
                          e.target.value = ''; // Reset input
                      }}
                  />
                  <button 
                    onClick={() => document.getElementById('kb-upload')?.click()}
                    className={`w-full py-3 border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-${themeColor}-500 hover:text-${themeColor}-500 transition-colors`}
                  >
                      <UploadCloud size={24}/>
                      <span className="text-sm font-semibold">{t.uploadToKB}</span>
                  </button>
              </div>

              {/* File List */}
              <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
                  {knowledgeBase.length === 0 && (
                      <div className="text-center text-gray-400 italic text-sm py-10">No documents.</div>
                  )}
                  {knowledgeBase.map((kbFile) => {
                      let Icon = FileText;
                      if (kbFile.type.startsWith('image/')) Icon = ImageIcon;
                      if (kbFile.type.startsWith('audio/')) Icon = Music;
                      if (kbFile.type.startsWith('video/')) Icon = Film;
                      if (kbFile.type === 'application/pdf') Icon = File;

                      return (
                          <div key={kbFile.id} className="p-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-lg flex items-center gap-3 group">
                              <div className={`p-2 rounded bg-${themeColor}-100 dark:bg-${themeColor}-900/30 text-${themeColor}-600 dark:text-${themeColor}-400`}>
                                  <Icon size={16}/>
                              </div>
                              <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{kbFile.name}</div>
                                  <div className="text-[10px] text-gray-500 uppercase">{kbFile.type.split('/')[1] || 'FILE'}</div>
                              </div>
                              <button 
                                onClick={() => setKnowledgeBase(prev => prev.filter(f => f.id !== kbFile.id))}
                                className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                  <X size={14}/>
                              </button>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* RIGHT: Settings Drawer */}
      {isSettingsOpen && (
          <div className="absolute inset-y-0 right-0 w-80 bg-white dark:bg-[#0f0f11] border-l border-gray-200 dark:border-white/10 z-50 p-6 flex flex-col shadow-2xl animate-in slide-in-from-right">
              <div className="flex justify-between items-center mb-8">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2"><Sliders size={18}/> {t.config}</h2>
                  <button onClick={() => setIsSettingsOpen(false)}><X size={18} className="text-gray-400 hover:text-gray-900 dark:hover:text-white"/></button>
              </div>

              {/* Settings Controls */}
              <div className="space-y-6 overflow-y-auto flex-1 scrollbar-hide">
                  
                  {/* Appearance Section */}
                  <div className="border-b border-gray-200 dark:border-white/10 pb-6 mb-2">
                       <label className="text-xs font-bold text-gray-500 uppercase block mb-3 flex items-center gap-2">
                           <Palette size={14}/> {t.appearance}
                       </label>
                       
                       {/* Dark Mode Toggle */}
                       <div className="flex items-center justify-between mb-4">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{t.themeMode}</span>
                            <button 
                                onClick={onToggleTheme}
                                className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center gap-2 text-sm"
                            >
                                {isDarkMode ? <><Moon size={14}/> {t.darkMode}</> : <><Sun size={14}/> Light Mode</>}
                            </button>
                       </div>

                       {/* Color Theme Picker */}
                       <div className="space-y-2">
                            <span className="text-sm text-gray-700 dark:text-gray-300 block">{t.accentColor}</span>
                            <div className="grid grid-cols-6 gap-2">
                                {THEME_COLORS.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => onSetCustomTheme(color)}
                                        className={`w-8 h-8 rounded-full bg-${color}-500 hover:scale-110 transition-transform relative border-2 ${customTheme === color ? 'border-white shadow-lg' : 'border-transparent'}`}
                                    >
                                        {customTheme === color && <Check size={12} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>}
                                    </button>
                                ))}
                            </div>
                            <button 
                                onClick={() => onSetCustomTheme(null)}
                                className={`w-full py-2 mt-2 text-xs border border-dashed border-gray-300 dark:border-white/20 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${!customTheme ? 'text-gray-400' : 'text-blue-500'}`}
                            >
                                {t.autoColor}
                            </button>
                       </div>
                  </div>

                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-2">{t.systemTemp}</label>
                      <div className="flex items-center gap-3">
                          <input 
                            type="range" min="0" max="2" step="0.1" 
                            value={agentConfig.temperature} 
                            onChange={(e) => setAgentConfig({...agentConfig, temperature: parseFloat(e.target.value)})}
                            className="flex-1 accent-blue-500 bg-gray-200 dark:bg-gray-700 h-1 rounded appearance-none"
                          />
                          <span className="text-xs font-mono text-blue-500 dark:text-blue-400 w-8">{agentConfig.temperature}</span>
                      </div>
                  </div>

                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-2">{t.topP}</label>
                      <div className="flex items-center gap-3">
                          <input 
                            type="range" min="0" max="1" step="0.05" 
                            value={agentConfig.topP} 
                            onChange={(e) => setAgentConfig({...agentConfig, topP: parseFloat(e.target.value)})}
                            className="flex-1 accent-blue-500 bg-gray-200 dark:bg-gray-700 h-1 rounded appearance-none"
                          />
                          <span className="text-xs font-mono text-blue-500 dark:text-blue-400 w-8">{agentConfig.topP}</span>
                      </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-white/10 pt-4">
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-3 flex items-center gap-2">
                          <Plug size={14}/> {t.mcpMarketplace}
                      </label>
                      <div className="space-y-2">
                          {MOCK_MCP_PLUGINS.map(plugin => {
                              const isInstalled = agentConfig.mcpPlugins?.some(p => p.id === plugin.id);
                              return (
                                  <div key={plugin.id} className="p-3 rounded bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                          <plugin.icon size={16} className="text-gray-400"/>
                                          <div>
                                              <div className="text-sm font-semibold text-gray-800 dark:text-gray-300">{plugin.name}</div>
                                              <div className="text-[10px] text-gray-500">{plugin.description}</div>
                                          </div>
                                      </div>
                                      <button 
                                        onClick={() => {
                                            const current = agentConfig.mcpPlugins || [];
                                            if (isInstalled) setAgentConfig({...agentConfig, mcpPlugins: current.filter(p => p.id !== plugin.id)});
                                            else setAgentConfig({...agentConfig, mcpPlugins: [...current, plugin]});
                                        }}
                                        className={`px-2 py-1 rounded text-[10px] font-bold ${isInstalled ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-blue-600 text-white'}`}
                                      >
                                          {isInstalled ? t.installed : t.get}
                                      </button>
                                  </div>
                              )
                          })}
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default ChatInterface;