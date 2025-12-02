
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, RefreshCw, ChevronLeft, Paperclip, X, Download, FileText, BrainCircuit, Maximize2, Copy, Check, FileDown, Cpu, Command, Settings, Mic, Volume2, Globe, Bot, Layers, Plus, Zap, Sparkles, MessageSquare, Hexagon, Flame, Sliders, VolumeX, ChevronDown, ChevronUp, Lightbulb, Code, PanelRightOpen, PanelRightClose, Pencil, RotateCcw, Image as ImageIcon, GitBranch, Split, Columns, Layout, PanelLeftClose, Database, HardDrive, Github, Terminal, Plug, Dna, ZoomIn, ZoomOut, Move, StopCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import { ChatMessage, UserContext, ModelProvider, AgentConfig, MCPPlugin, MCPTool, MultiModelResponse, ResearchField, ResearchTask } from '../types';
import { streamResponse } from '../services/geminiService';

interface ChatInterfaceProps {
  context: UserContext;
  themeColor: string;
  onBack: () => void;
}

// --- Constants ---

const AVAILABLE_MODELS = [
  { id: ModelProvider.GEMINI_FLASH, name: "Gemini 2.5 Flash", desc: "Google • Fast" },
  { id: ModelProvider.GEMINI_PRO, name: "Gemini 3.0 Pro", desc: "Google • Complex Reasoning" },
  { id: ModelProvider.GEMINI_THINKING, name: "Gemini 3.0 Thinking", desc: "Google • Deep Logic" },
  { id: ModelProvider.OPENAI_GPT4O, name: "GPT-4o", desc: "OpenAI • Omni" },
  { id: ModelProvider.OPENAI_O1, name: "o1-preview", desc: "OpenAI • Reasoning" },
  { id: ModelProvider.CLAUDE_3_5_SONNET, name: "Claude 3.5 Sonnet", desc: "Anthropic • Nuance" },
  { id: ModelProvider.DEEPSEEK_V3, name: "DeepSeek V3", desc: "DeepSeek • Efficient" },
  { id: ModelProvider.DEEPSEEK_R1, name: "DeepSeek R1", desc: "DeepSeek • Math" },
  { id: ModelProvider.GROQ_LLAMA_3, name: "Llama 3 70B", desc: "Meta • Fast" },
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

// --- Sub-Components ---

// 1. Thinking Process Visualization (CoT)
const ThinkingProcess: React.FC<{ content: string, isDone: boolean }> = ({ content, isDone }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isExpanded && scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content, isExpanded]);

  return (
    <div className="my-2 rounded-lg border border-white/10 bg-black/30 overflow-hidden">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 bg-white/5 hover:bg-white/10 transition-colors text-xs text-gray-400 font-mono uppercase tracking-wider"
      >
        <div className="flex items-center gap-2">
            <BrainCircuit size={14} className={isDone ? "text-gray-500" : "text-blue-400 animate-pulse"} />
            <span>Reasoning Chain {isDone ? "(Complete)" : "(Thinking...)"}</span>
        </div>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {isExpanded && (
        <div ref={scrollRef} className="p-3 max-h-48 overflow-y-auto font-mono text-xs text-gray-500 whitespace-pre-wrap bg-black/50 border-t border-white/5">
            {content || "Initializing thought process..."}
            {!isDone && <span className="inline-block w-2 h-4 ml-1 bg-blue-500/50 animate-pulse align-middle"/>}
        </div>
      )}
    </div>
  );
};

// 2. Artifact Renderer (Right Panel)
const ArtifactRenderer: React.FC<{ content: string, type: 'svg' | 'html' | 'react' | 'pdb' | 'mermaid', onClose: () => void }> = ({ content, type, onClose }) => {
    const [scale, setScale] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (type === 'mermaid') {
             mermaid.initialize({ startOnLoad: true, theme: 'dark' });
             mermaid.contentLoaded();
        }
        if (type === 'pdb') {
            // Initialize 3Dmol
            // @ts-ignore
            if (window.$3Dmol) {
                // @ts-ignore
                const viewer = window.$3Dmol.createViewer(containerRef.current, { backgroundColor: '0x000000' });
                // We assume content is just a PDB ID for this demo or raw data. 
                // If it's 4 chars, fetch it.
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
        <div className="h-full flex flex-col bg-[#0c0c0e] border-l border-white/10">
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-200 uppercase tracking-wider">
                    {type === 'pdb' ? <Dna size={16} className="text-emerald-400"/> : <Code size={16} className="text-blue-400"/>}
                    {type.toUpperCase()} Preview
                </div>
                <div className="flex items-center gap-2">
                    {type === 'svg' && (
                        <>
                            <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-1 hover:bg-white/10 rounded"><ZoomOut size={16}/></button>
                            <span className="text-xs text-gray-500 w-8 text-center">{Math.round(scale * 100)}%</span>
                            <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="p-1 hover:bg-white/10 rounded"><ZoomIn size={16}/></button>
                        </>
                    )}
                    <button onClick={handleDownload} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white" title="Download">
                        <Download size={16}/>
                    </button>
                    <button onClick={onClose} className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white">
                        <PanelRightClose size={16}/>
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-hidden relative bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
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
                     <div ref={containerRef} className="w-full h-full relative" />
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
    onViewArtifact: (content: string, type: any) => void 
}> = ({ msg, themeColor, onFork, onViewArtifact }) => {
  const isUser = msg.role === 'user';
  
  // Detect Artifacts
  const detectArtifact = (text: string) => {
     // Simple regex for blocks
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
      // Split CoT
      const thinkMatch = text.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
      const thinkContent = thinkMatch ? thinkMatch[1] : null;
      const finalContent = text.replace(/<think>[\s\S]*?(?:<\/think>|$)/, '').trim();

      const artifact = detectArtifact(finalContent);

      return (
        <div className="prose prose-invert max-w-none text-sm leading-relaxed">
            {thinkContent && (
                <ThinkingProcess content={thinkContent} isDone={!isThinking} />
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
                             {/* Artifact Preview Button */}
                             {(match && ['svg', 'html', 'xml', 'pdb', 'mermaid'].includes(match[1])) && (
                                 <button 
                                   onClick={() => onViewArtifact(String(children).replace(/\n$/, ''), match![1])}
                                   className={`absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-${themeColor}-600/20 text-${themeColor}-400 text-xs rounded border border-${themeColor}-500/30 hover:bg-${themeColor}-600/40 transition-colors`}
                                 >
                                    <Maximize2 size={12}/> Preview
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
                    className={`mt-4 w-full py-2 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center gap-2 text-${themeColor}-400 hover:bg-white/10 transition-colors`}
                 >
                    {artifact.type === 'pdb' ? <Dna size={16}/> : <Layout size={16}/>}
                    View Generated {artifact.type.toUpperCase()} Artifact
                 </button>
            )}
        </div>
      );
  };

  if (isUser) {
    return (
      <div className="flex justify-end mb-6 group">
        <div className={`relative max-w-[85%] bg-white/10 text-white p-4 rounded-2xl rounded-tr-none border border-white/10 backdrop-blur-sm`}>
           {renderContent(msg.content)}
           <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                <button className="p-1.5 text-gray-500 hover:text-white bg-black/50 rounded-full"><Pencil size={12}/></button>
           </div>
        </div>
      </div>
    );
  }

  // Model Response
  return (
    <div className="flex justify-start mb-8 w-full group relative">
      <div className={`w-8 h-8 rounded-full bg-${themeColor}-600/20 border border-${themeColor}-500/30 flex items-center justify-center mr-3 shrink-0 mt-1`}>
         <Bot size={16} className={`text-${themeColor}-400`} />
      </div>
      
      <div className="flex-1 min-w-0">
         <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-xs font-bold text-${themeColor}-400`}>ProtoChat Intelligence</span>
            <span className="text-[10px] text-gray-500 font-mono">{new Date(msg.timestamp).toLocaleTimeString()}</span>
            {/* Fork Button */}
            {onFork && (
                <button 
                    onClick={() => onFork(msg.id)}
                    className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-gray-400 hover:text-white bg-white/5 px-2 py-0.5 rounded-full"
                >
                    <GitBranch size={10}/> Fork
                </button>
            )}
         </div>

         {/* Multi-Model Grid or Single Response */}
         {msg.multiResponses ? (
             <div className={`grid gap-4 ${msg.multiResponses.length > 1 ? 'lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                 {msg.multiResponses.map((res, idx) => (
                     <div key={idx} className="bg-[#0c0c0e] border border-white/10 rounded-xl p-4 overflow-hidden shadow-lg">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                            <div className={`w-2 h-2 rounded-full bg-${res.isDone ? 'green-500' : 'yellow-500'} animate-${res.isDone ? 'none' : 'pulse'}`} />
                            <span className="text-xs font-mono text-gray-400 uppercase">{res.modelName}</span>
                        </div>
                        {renderContent(res.content, res.isThinking)}
                     </div>
                 ))}
             </div>
         ) : (
             <div className="glass-panel p-5 rounded-xl rounded-tl-none border border-white/10">
                 {renderContent(msg.content, msg.isThinking)}
             </div>
         )}
      </div>
    </div>
  );
};

// --- Main Chat Pane Hook ---
const useChatSession = (initialHistory: ChatMessage[] = [], context: UserContext) => {
    const [history, setHistory] = useState<ChatMessage[]>(initialHistory);
    const [isLoading, setIsLoading] = useState(false);
    const [input, setInput] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    
    // Active Models State for this session
    const [activeModels, setActiveModels] = useState<ModelProvider[]>(context.models);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if ((!input.trim() && files.length === 0) || isLoading) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: Date.now()
        };

        // Create optimistic model message
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
            content: "", // Aggregate or primary content could go here
            timestamp: Date.now(),
            multiResponses: initialMultiResponses,
            isThinking: true
        };

        setHistory(prev => [...prev, userMsg, modelMsg]);
        setInput("");
        setFiles([]);
        setIsLoading(true);

        // Parallel Streaming
        try {
            await Promise.all(activeModels.map(async (modelId, index) => {
                // Construct history for this specific model context
                // Filter previous multiResponses to find the one matching this model
                const modelHistory = history.map(msg => {
                    if (msg.role === 'user') return { role: 'user', parts: [{ text: msg.content }] };
                    // For model messages, find the specific response
                    const specificResponse = msg.multiResponses?.find(r => r.modelId === modelId);
                    // Fallback to first if not found (or single response)
                    const text = specificResponse ? specificResponse.content : (msg.content || "");
                    return { role: 'model', parts: [{ text }] };
                });
                
                // Add current user msg
                modelHistory.push({ role: 'user', parts: [{ text: userMsg.content }] });

                await streamResponse(
                    modelHistory,
                    userMsg.content, // Prompt
                    files, // Files
                    {
                        field: context.field || ResearchField.GENERAL,
                        task: context.task || ResearchTask.DEEP_SEARCH,
                        config: context.config
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
                
                // Mark this model as done
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

const ChatInterface: React.FC<ChatInterfaceProps> = ({ context, themeColor, onBack }) => {
  // Split View State
  const [panes, setPanes] = useState<number[]>([1]); // IDs of panes
  const [activePaneIdx, setActivePaneIdx] = useState(0);
  
  // Artifact Panel State
  const [artifact, setArtifact] = useState<{content: string, type: 'svg'|'html'|'react'|'pdb'|'mermaid'}|null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [agentConfig, setAgentConfig] = useState<AgentConfig>(context.config || { temperature: 0.7, topP: 0.95, mcpPlugins: [] });

  // Refs for auto-scroll
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // We need to lift the session state up to manage forks, or use a map of hooks?
  // Since hooks can't be dynamic, we'll implement a SinglePane component that wraps useChatSession
  // and we render 1 or 2 of them.
  
  // For the sake of this demo, we will implement the "Split" by just having two separate `useChatSession` instances inside a wrapper.
  // But wait, we can't call hooks conditionally.
  // We will always call two hooks, but only show one if not split.
  
  // Session 1 (Main)
  const session1 = useChatSession([], context);
  // Session 2 (Fork)
  const session2 = useChatSession([], context);

  const isSplit = panes.length > 1;

  // Sync scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session1.history, session2.history]);

  const handleFork = (msgId: string, fromSession: number) => {
      if (isSplit) return; // Only 2 panes supported for now
      
      const sourceSession = fromSession === 1 ? session1 : session2;
      const targetSession = fromSession === 1 ? session2 : session1;
      
      // Find index
      const idx = sourceSession.history.findIndex(m => m.id === msgId);
      if (idx === -1) return;
      
      // Copy history up to that point
      const forkedHistory = sourceSession.history.slice(0, idx + 1);
      
      targetSession.setHistory(forkedHistory);
      targetSession.setActiveModels(sourceSession.activeModels);
      
      setPanes([1, 2]);
      setActivePaneIdx(1); // Focus new pane
  };

  const handleExport = (history: ChatMessage[]) => {
      const text = history.map(m => `**${m.role.toUpperCase()}**: ${m.multiResponses ? m.multiResponses.map(r => r.content).join('\n---\n') : m.content}`).join('\n\n');
      const blob = new Blob([text], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `protochat_export_${Date.now()}.md`;
      a.click();
  };
  
  // Input Auto-Resize
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
      
      {/* LEFT: Chat Area (Flex Row for Split) */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${artifact ? 'mr-[400px]' : ''}`}>
        
        {/* Header */}
        <div className="h-16 border-b border-white/10 bg-black/40 backdrop-blur flex items-center justify-between px-6 z-20">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                    <ChevronLeft size={20} />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-lg font-bold text-white tracking-wide font-mono flex items-center gap-2">
                        <Bot size={18} className={`text-${themeColor}-400`} />
                        ProtoChat <span className="text-gray-600">/</span> {context.field}
                    </h1>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-wider">
                         <span>{isSplit ? "Split View Active" : "Single Session"}</span>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                <button onClick={() => isSplit ? setPanes([1]) : null} className={`p-2 rounded-lg ${!isSplit ? `bg-${themeColor}-600 text-white` : 'text-gray-500 hover:text-white'}`}>
                    <MessageSquare size={18}/>
                </button>
                <button onClick={() => !isSplit && session1.history.length > 0 ? setPanes([1,2]) : null} className={`p-2 rounded-lg ${isSplit ? `bg-${themeColor}-600 text-white` : 'text-gray-500 hover:text-white'}`}>
                    <Columns size={18}/>
                </button>
                <div className="w-px h-6 bg-white/10 mx-2" />
                <button onClick={() => setIsSettingsOpen(true)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white">
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
                        className={`flex-1 flex flex-col min-w-0 border-r border-white/10 bg-black/20 transition-opacity ${isActive ? 'opacity-100' : 'opacity-40 hover:opacity-80'}`}
                    >
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-hide">
                            {session.history.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30 pointer-events-none">
                                    <BrainCircuit size={64} className={`text-${themeColor}-500 mb-4`} />
                                    <p className="text-lg font-mono">Ready to research.</p>
                                </div>
                            ) : (
                                session.history.map(msg => (
                                    <MessageBubble 
                                        key={msg.id} 
                                        msg={msg} 
                                        themeColor={themeColor} 
                                        onFork={(msgId) => handleFork(msgId, paneId)}
                                        onViewArtifact={(c, t) => setArtifact({content: c, type: t})}
                                    />
                                ))
                            )}
                            <div ref={bottomRef} />
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Input Area (Global but targeted to active pane) */}
        <div className="p-4 bg-black/80 backdrop-blur border-t border-white/10 z-30">
             {/* Model Toggles */}
             <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                 <span className="text-[10px] uppercase font-bold text-gray-600 mr-2 shrink-0">Active Cluster:</span>
                 {AVAILABLE_MODELS.map(model => {
                     const isSelected = activeSession.activeModels.includes(model.id);
                     return (
                         <button
                            key={model.id}
                            onClick={() => {
                                const current = activeSession.activeModels;
                                if (isSelected && current.length > 1) activeSession.setActiveModels(current.filter(m => m !== model.id));
                                else if (!isSelected && current.length < 3) activeSession.setActiveModels([...current, model.id]);
                            }}
                            className={`px-2 py-1 rounded text-[10px] font-mono border transition-all whitespace-nowrap ${isSelected ? `bg-${themeColor}-600/20 border-${themeColor}-500 text-${themeColor}-400` : 'bg-transparent border-gray-700 text-gray-500 hover:border-gray-500'}`}
                         >
                             {model.name}
                         </button>
                     )
                 })}
                 <div className="ml-auto flex items-center gap-2">
                     <button onClick={() => handleExport(activeSession.history)} className="p-1 text-gray-500 hover:text-white" title="Export Chat">
                         <FileDown size={14}/>
                     </button>
                 </div>
             </div>

             {/* Input Box */}
             <div className={`relative flex items-end gap-2 bg-[#0c0c0e] rounded-xl p-2 border transition-colors ${activeSession.isLoading ? 'border-white/5 opacity-50' : `border-white/10 focus-within:border-${themeColor}-500/50`}`}>
                <input 
                    type="file" 
                    id="file-upload" 
                    className="hidden" 
                    multiple 
                    onChange={(e) => e.target.files && activeSession.setFiles(Array.from(e.target.files))}
                />
                <button 
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="p-3 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                >
                    <Paperclip size={20} />
                </button>
                
                <div className="flex-1 min-w-0">
                    {/* File Previews */}
                    {activeSession.files.length > 0 && (
                        <div className="flex gap-2 mb-2 overflow-x-auto">
                            {activeSession.files.map((f, i) => (
                                <div key={i} className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded text-xs text-gray-300">
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
                                activeSession.handleSubmit(e);
                            }
                        }}
                        placeholder={`Message ${isSplit ? (activePaneIdx === 0 ? "Left Pane" : "Right Pane") : "ProtoChat"}... (Ctrl + Enter to send)`}
                        className="w-full bg-transparent text-gray-200 placeholder-gray-600 font-mono text-sm resize-none py-3 focus:outline-none min-h-[40px] max-h-32"
                        rows={1}
                    />
                </div>

                <button 
                    onClick={activeSession.handleSubmit}
                    disabled={activeSession.isLoading || (!activeSession.input.trim() && activeSession.files.length === 0)}
                    className={`p-3 rounded-xl transition-all ${activeSession.isLoading ? 'bg-gray-800 text-gray-500' : `bg-${themeColor}-600 hover:bg-${themeColor}-500 text-white shadow-lg shadow-${themeColor}-500/20`}`}
                >
                    {activeSession.isLoading ? <RefreshCw size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
             </div>
        </div>

      </div>

      {/* RIGHT: Artifact Panel */}
      {artifact && (
          <div className="absolute inset-y-0 right-0 w-[400px] z-40 shadow-2xl animate-in slide-in-from-right duration-300">
              <ArtifactRenderer content={artifact.content} type={artifact.type} onClose={() => setArtifact(null)} />
          </div>
      )}

      {/* RIGHT: Settings Drawer */}
      {isSettingsOpen && (
          <div className="absolute inset-y-0 right-0 w-80 bg-[#0f0f11] border-l border-white/10 z-50 p-6 flex flex-col shadow-2xl animate-in slide-in-from-right">
              <div className="flex justify-between items-center mb-8">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2"><Sliders size={18}/> Configuration</h2>
                  <button onClick={() => setIsSettingsOpen(false)}><X size={18} className="text-gray-400 hover:text-white"/></button>
              </div>

              {/* Settings Controls */}
              <div className="space-y-6 overflow-y-auto flex-1 scrollbar-hide">
                  
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-2">System Temperature</label>
                      <div className="flex items-center gap-3">
                          <input 
                            type="range" min="0" max="2" step="0.1" 
                            value={agentConfig.temperature} 
                            onChange={(e) => setAgentConfig({...agentConfig, temperature: parseFloat(e.target.value)})}
                            className="flex-1 accent-blue-500 bg-gray-700 h-1 rounded appearance-none"
                          />
                          <span className="text-xs font-mono text-blue-400 w-8">{agentConfig.temperature}</span>
                      </div>
                  </div>

                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Top P (Nucleus)</label>
                      <div className="flex items-center gap-3">
                          <input 
                            type="range" min="0" max="1" step="0.05" 
                            value={agentConfig.topP} 
                            onChange={(e) => setAgentConfig({...agentConfig, topP: parseFloat(e.target.value)})}
                            className="flex-1 accent-blue-500 bg-gray-700 h-1 rounded appearance-none"
                          />
                          <span className="text-xs font-mono text-blue-400 w-8">{agentConfig.topP}</span>
                      </div>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                      <label className="text-xs font-bold text-gray-500 uppercase block mb-3 flex items-center gap-2">
                          <Plug size={14}/> MCP Marketplace
                      </label>
                      <div className="space-y-2">
                          {MOCK_MCP_PLUGINS.map(plugin => {
                              const isInstalled = agentConfig.mcpPlugins?.some(p => p.id === plugin.id);
                              return (
                                  <div key={plugin.id} className="p-3 rounded bg-white/5 border border-white/5 flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                          <plugin.icon size={16} className="text-gray-400"/>
                                          <div>
                                              <div className="text-sm font-semibold text-gray-300">{plugin.name}</div>
                                              <div className="text-[10px] text-gray-500">{plugin.description}</div>
                                          </div>
                                      </div>
                                      <button 
                                        onClick={() => {
                                            const current = agentConfig.mcpPlugins || [];
                                            if (isInstalled) setAgentConfig({...agentConfig, mcpPlugins: current.filter(p => p.id !== plugin.id)});
                                            else setAgentConfig({...agentConfig, mcpPlugins: [...current, plugin]});
                                        }}
                                        className={`px-2 py-1 rounded text-[10px] font-bold ${isInstalled ? 'bg-green-500/20 text-green-400' : 'bg-blue-600 text-white'}`}
                                      >
                                          {isInstalled ? 'INSTALLED' : 'GET'}
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
