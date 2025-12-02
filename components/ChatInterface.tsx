
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, RefreshCw, ChevronLeft, Paperclip, X, Download, FileText, BrainCircuit, Maximize2, Copy, Check, FileDown, Cpu, Command, Settings, Mic, Volume2, Globe, Bot, Layers, Plus, Zap, Sparkles, MessageSquare, Hexagon, Flame, Sliders, VolumeX, ChevronDown, ChevronUp, Lightbulb, Code, PanelRightOpen, PanelRightClose, Pencil, RotateCcw, Image as ImageIcon, GitBranch, Split, Columns, Layout, PanelLeftClose, Database, HardDrive, Github, Terminal, Plug, Dna } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import { ChatMessage, UserContext, ModelProvider, AgentConfig, MCPPlugin, MCPTool } from '../types';
import { streamResponse, getSystemInstruction } from '../services/geminiService';
import { Type } from '@google/genai';

interface ChatInterfaceProps {
  context: UserContext;
  themeColor: string;
  onBack: () => void;
}

// --- Helpers ---
const getModelDisplayName = (id: ModelProvider) => {
    switch(id) {
        case ModelProvider.GEMINI_FLASH: return "Gemini 2.5 Flash";
        case ModelProvider.GEMINI_FLASH_LITE: return "Gemini 2.5 Flash-Lite";
        case ModelProvider.GEMINI_PRO: return "Gemini 3.0 Pro";
        case ModelProvider.GEMINI_THINKING: return "Gemini 3.0 Thinking";
        case ModelProvider.GEMINI_EXP: return "Gemini Experimental";
        case ModelProvider.LEARN_LM: return "LearnLM 1.5 Pro";
        case ModelProvider.OPENAI_GPT4O: return "GPT-4o";
        case ModelProvider.OPENAI_O1: return "o1-preview";
        case ModelProvider.CLAUDE_3_5_SONNET: return "Claude 3.5 Sonnet";
        case ModelProvider.GROQ_LLAMA_3: return "Llama 3 70B";
        case ModelProvider.DEEPSEEK_V3: return "DeepSeek V3";
        case ModelProvider.DEEPSEEK_R1: return "DeepSeek R1";
        default: return id;
    }
}

const AVAILABLE_MODELS = [
  { id: ModelProvider.GEMINI_FLASH, name: "Gemini 2.5 Flash", desc: "Google • Fast" },
  { id: ModelProvider.GEMINI_PRO, name: "Gemini 3.0 Pro", desc: "Google • Reasoning" },
  { id: ModelProvider.GEMINI_THINKING, name: "Gemini 3.0 Thinking", desc: "Google • Logic" },
  { id: ModelProvider.OPENAI_GPT4O, name: "GPT-4o", desc: "OpenAI • Omni" },
  { id: ModelProvider.CLAUDE_3_5_SONNET, name: "Claude 3.5 Sonnet", desc: "Anthropic" },
  { id: ModelProvider.DEEPSEEK_V3, name: "DeepSeek V3", desc: "DeepSeek" },
  { id: ModelProvider.GROQ_LLAMA_3, name: "Llama 3 70B", desc: "Groq" },
  { id: ModelProvider.OPENAI_O1, name: "o1-preview", desc: "OpenAI • Chain" },
  { id: ModelProvider.DEEPSEEK_R1, name: "DeepSeek R1", desc: "DeepSeek • Math" },
];

// --- MCP REGISTRY (MOCKED) ---
const MCP_REGISTRY: MCPPlugin[] = [
    {
        id: 'filesystem',
        name: 'Filesystem Explorer',
        description: 'Read and list local files in allowed directories.',
        author: 'Model Labs',
        version: '1.0.2',
        icon: HardDrive,
        tools: [
            {
                name: 'fs_list_directory',
                description: 'List files in a directory',
                parameters: { type: Type.OBJECT, properties: { path: { type: Type.STRING } }, required: ['path'] }
            },
            {
                name: 'fs_read_file',
                description: 'Read contents of a file',
                parameters: { type: Type.OBJECT, properties: { path: { type: Type.STRING } }, required: ['path'] }
            }
        ]
    },
    {
        id: 'postgres',
        name: 'PostgreSQL Connector',
        description: 'Query local or remote PostgreSQL databases.',
        author: 'DB Corp',
        version: '0.9.5',
        icon: Database,
        tools: [
            {
                name: 'pg_query',
                description: 'Execute a read-only SQL query',
                parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING } }, required: ['query'] }
            }
        ]
    },
    {
        id: 'github',
        name: 'GitHub Agent',
        description: 'Search repos, list issues, and view code.',
        author: 'Open Source',
        version: '2.1.0',
        icon: Github,
        tools: [
             {
                name: 'github_list_issues',
                description: 'List issues for a repository',
                parameters: { type: Type.OBJECT, properties: { repo: { type: Type.STRING } }, required: ['repo'] }
            }
        ]
    }
];


// --- Artifact System ---
interface ArtifactData {
    id: string;
    type: 'html' | 'svg' | 'react' | 'mermaid' | 'pdb';
    content: string;
    title: string;
}

const extractArtifact = (content: string): ArtifactData | null => {
    const htmlMatch = content.match(/```html([\s\S]*?)```/);
    if (htmlMatch) return { id: Date.now().toString(), type: 'html', content: htmlMatch[1], title: 'HTML Preview' };

    const svgMatch = content.match(/```svg([\s\S]*?)```/);
    if (svgMatch) return { id: Date.now().toString(), type: 'svg', content: svgMatch[1], title: 'Vector Graphic' };
    
    // PDB Match: ```pdb 1CRN ```
    const pdbMatch = content.match(/```pdb\n?([\s\S]*?)```/);
    if (pdbMatch) return { id: Date.now().toString(), type: 'pdb', content: pdbMatch[1].trim(), title: `Protein Structure (${pdbMatch[1].trim()})` };

    return null;
}

// --- Protein Viewer using 3Dmol.js ---
const ProteinRenderer: React.FC<{ pdbId: string }> = ({ pdbId }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        
        // Use the global $3Dmol object
        // @ts-ignore
        if (typeof $3Dmol === 'undefined') {
            if (containerRef.current) containerRef.current.innerHTML = "3Dmol library not loaded.";
            return;
        }

        const initViewer = async () => {
             // @ts-ignore
            const element = containerRef.current;
            // @ts-ignore
            const viewer = $3Dmol.createViewer(element, { backgroundColor: 'black' });
            
            try {
                // Fetch PDB data from RCSB
                const response = await fetch(`https://files.rcsb.org/download/${pdbId}.pdb`);
                if (!response.ok) throw new Error("Failed to fetch PDB");
                const pdbData = await response.text();

                viewer.addModel(pdbData, "pdb");
                viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
                viewer.zoomTo();
                viewer.render();
                viewer.animate({ loop: "backAndForth" });
            } catch (e) {
                console.error("PDB Error", e);
                element.innerHTML = `<div style="padding:20px; color:red">Failed to load PDB: ${pdbId}</div>`;
            }
        };

        initViewer();
    }, [pdbId]);

    return <div ref={containerRef} className="w-full h-full relative" />;
};

const ArtifactRenderer: React.FC<{ artifact: ArtifactData; themeColor: string }> = ({ artifact, themeColor }) => {
    if (artifact.type === 'svg') {
        return (
             <div className="w-full h-full flex items-center justify-center bg-white/5 p-4 overflow-auto">
                 <div dangerouslySetInnerHTML={{ __html: artifact.content }} className="max-w-full max-h-full" />
             </div>
        );
    }

    if (artifact.type === 'html') {
        return (
            <div className="w-full h-full bg-white rounded-lg overflow-hidden">
                <iframe 
                    srcDoc={artifact.content} 
                    className="w-full h-full border-none" 
                    title="Artifact Preview"
                    sandbox="allow-scripts"
                />
            </div>
        );
    }
    
    if (artifact.type === 'pdb') {
        return <ProteinRenderer pdbId={artifact.content} />;
    }

    return <div className="p-4 text-gray-400">Unsupported Artifact Type</div>;
}

// --- Components ---

interface MessageBubbleProps {
  message: ChatMessage;
  themeColor: string;
  onCopy: (text: string) => void;
  onExport: () => void;
  onSpeak: (text: string) => void;
  onPreviewArtifact: (artifact: ArtifactData) => void;
  onEdit: (msgId: string, newContent: string) => void;
  onFork: (msgId: string) => void;
}

const ThinkingProcess: React.FC<{ content: string; isThinking: boolean; themeColor: string }> = ({ content, isThinking, themeColor }) => {
    const [isExpanded, setIsExpanded] = useState(isThinking);
    useEffect(() => { if (isThinking) setIsExpanded(true); }, [isThinking]);

    if (!content) return null;

    return (
        <div className="mb-4 rounded-lg overflow-hidden border border-white/5 bg-black/20">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-full flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer text-left`}
            >
                <div className="flex items-center gap-2">
                    <BrainCircuit size={14} className={isThinking ? `text-${themeColor}-400 animate-pulse` : 'text-gray-500'} />
                    <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                        {isThinking ? 'Processing Logic Chain...' : 'Reasoning Process'}
                    </span>
                </div>
                {isExpanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
            </button>
            {isExpanded && (
                <div className="p-3 bg-black/40 border-t border-white/5">
                    <div className="prose prose-invert prose-xs max-w-none font-mono text-gray-400 text-xs leading-relaxed opacity-90">
                         <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Mermaid Renderer ---
const MermaidRenderer: React.FC<{ chart: string }> = ({ chart }) => {
    const [svg, setSvg] = useState<string>('');
    const containerRef = useRef<HTMLDivElement>(null);
    const id = useRef(`mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`).current;

    useEffect(() => {
        mermaid.initialize({ 
            startOnLoad: false, 
            theme: 'dark', 
            securityLevel: 'loose',
            fontFamily: 'Agency FB, Rajdhani, sans-serif'
        });
        
        const renderChart = async () => {
            try {
                const { svg } = await mermaid.render(id, chart);
                setSvg(svg);
            } catch (error) {
                console.error("Mermaid rendering error:", error);
                setSvg(`<div style="color:red; padding:10px; border:1px solid red">Diagram Error</div>`);
            }
        };
        renderChart();
    }, [chart, id]);

    return (
        <div 
            className="mermaid-container my-4 bg-[#0F0F12] border border-white/5 p-4 rounded-lg overflow-x-auto flex justify-center"
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    );
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkMath, remarkGfm]}
            rehypePlugins={[rehypeKatex]}
            components={{
                p: ({node, ...props}) => <p className="mb-4 leading-7" {...props} />,
                code: ({node, inline, className, children, ...props}: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const language = match ? match[1] : '';
                    
                    if (!inline && language === 'mermaid') {
                        return <MermaidRenderer chart={String(children).replace(/\n$/, '')} />;
                    }

                    return inline ? (
                        <code className="bg-white/10 px-1 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
                    ) : (
                        <code className="block bg-black/30 p-3 rounded-lg text-sm font-mono my-3 overflow-x-auto border border-white/5" {...props}>{children}</code>
                    )
                },
                a: ({node, ...props}) => <a className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table className="w-full text-left border-collapse" {...props} /></div>,
                thead: ({node, ...props}) => <thead className="bg-white/5" {...props} />,
                th: ({node, ...props}) => <th className="p-3 border-b border-white/10 font-bold text-gray-200 text-xs uppercase tracking-wider" {...props} />,
                td: ({node, ...props}) => <td className="p-3 border-b border-white/5 text-gray-300 text-sm" {...props} />,
            }}
        >
            {content}
        </ReactMarkdown>
    );
}

const parseContent = (rawText: string) => {
    const thinkMatch = rawText.match(/<think>([\s\S]*?)<\/think>/);
    const openThinkMatch = rawText.match(/<think>([\s\S]*)/);
    
    if (thinkMatch) {
        return { thought: thinkMatch[1].trim(), content: rawText.replace(thinkMatch[0], "").trim(), isThinking: false };
    } else if (openThinkMatch && !rawText.includes("</think>")) {
         return { thought: openThinkMatch[1].trim(), content: "", isThinking: true };
    }
    return { thought: null, content: rawText, isThinking: false };
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, themeColor, onCopy, onSpeak, onPreviewArtifact, onEdit, onFork }) => {
    const isUser = message.role === 'user';
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(message.content);

    if (isUser) {
        return (
            <div className="flex justify-end mb-8 pl-12 group">
                <div className="max-w-2xl w-full">
                    <div className="flex items-center justify-end gap-2 mb-2">
                        <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Research Query</span>
                         {/* Edit Control */}
                         <button 
                            onClick={() => setIsEditing(!isEditing)} 
                            className="opacity-50 hover:opacity-100 transition-opacity p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white"
                            title="Edit message"
                        >
                            <Pencil size={12} />
                        </button>
                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-white font-bold">U</div>
                    </div>
                    
                    <div className="p-5 rounded-2xl bg-gray-900/80 backdrop-blur-md border border-gray-700 shadow-xl relative">
                        {isEditing ? (
                            <div className="flex flex-col gap-2">
                                <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mb-1 flex items-center gap-1">
                                    <Pencil size={10} /> Edit & Restart
                                </div>
                                <textarea 
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="w-full bg-black/50 text-gray-200 text-sm p-3 rounded border border-gray-600 focus:outline-none focus:border-blue-500 font-sans"
                                    rows={4}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2 mt-1">
                                    <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors">Cancel</button>
                                    <button 
                                        onClick={() => { onEdit(message.id, editContent); setIsEditing(false); }}
                                        className={`px-3 py-1.5 text-xs bg-${themeColor}-600 text-white rounded hover:bg-${themeColor}-500 transition-colors shadow-lg shadow-${themeColor}-900/20 flex items-center gap-1`}
                                    >
                                        <RotateCcw size={12} /> Update
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-200 font-medium whitespace-pre-wrap leading-relaxed font-sans">
                                {message.content}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Model Message
    const isMulti = message.multiResponses && message.multiResponses.length > 0;
    const gridCols = isMulti 
        ? message.multiResponses!.length === 3 ? 'lg:grid-cols-3' : message.multiResponses!.length === 2 ? 'lg:grid-cols-2' : 'lg:grid-cols-1'
        : 'grid-cols-1';

    return (
        <div className="flex justify-start mb-12 pr-4 w-full">
            <div className="w-full">
                 <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2">
                        <div className={`p-1 rounded bg-${themeColor}-500/20 text-${themeColor}-400`}>
                            <BrainCircuit size={14} />
                        </div>
                        <span className={`text-xs font-mono text-${themeColor}-300 uppercase tracking-wider`}>
                            {isMulti ? `PROTOCHAT CLUSTER (${message.multiResponses?.length} CORES)` : 'PROTOCHAT INTELLIGENCE'}
                        </span>
                     </div>
                     {/* Fork Button for Answer */}
                     <button 
                        onClick={() => onFork(message.id)} 
                        className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 text-gray-500 hover:text-${themeColor}-400 transition-colors text-[10px] font-mono uppercase tracking-wider border border-transparent hover:border-${themeColor}-500/30`}
                        title="Fork conversation from this answer"
                     >
                         <GitBranch size={12} /> Fork Branch
                     </button>
                 </div>
                 
                 {isMulti && (
                     <div className={`grid gap-4 grid-cols-1 ${gridCols}`}>
                        {message.multiResponses!.map((res) => {
                             const { thought, content, isThinking: isThinkingContent } = parseContent(res.content);
                             const activelyThinking = res.isThinking || (isThinkingContent && !res.isDone);
                             const artifact = extractArtifact(content);
                             
                             return (
                                 <div key={res.modelId} className={`flex flex-col rounded-2xl bg-[#0a0a0f]/90 backdrop-blur-xl border border-${themeColor}-500/30 shadow-2xl shadow-${themeColor}-900/10 overflow-hidden`}>
                                    <div className={`px-4 py-2 bg-${themeColor}-900/10 border-b border-${themeColor}-500/20 flex justify-between items-center`}>
                                        <div className="flex items-center gap-2">
                                            <Cpu size={12} className={`text-${themeColor}-400`} />
                                            <span className="text-xs font-bold tracking-wider font-mono uppercase text-gray-300">{res.modelName}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => onSpeak(content)} className="text-gray-500 hover:text-white p-1"><Volume2 size={12} /></button>
                                            <button onClick={() => onCopy(content)} className="text-gray-500 hover:text-white p-1"><Copy size={12} /></button>
                                        </div>
                                    </div>
                                    
                                    <div className="p-6 flex-1 min-h-[200px]">
                                        {thought && <ThinkingProcess content={thought} isThinking={activelyThinking} themeColor={themeColor} />}
                                        
                                        {/* Artifact Detected Banner */}
                                        {artifact && (
                                            <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {artifact.type === 'pdb' ? <Dna size={16} className="text-emerald-400" /> : <Code size={16} className="text-blue-400" />}
                                                    <span className="text-xs text-blue-200 font-mono">Generated Artifact: {artifact.title}</span>
                                                </div>
                                                <button 
                                                    onClick={() => onPreviewArtifact(artifact)}
                                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded shadow-lg flex items-center gap-1"
                                                >
                                                    <PanelRightOpen size={12} /> Preview
                                                </button>
                                            </div>
                                        )}

                                        {activelyThinking && !thought && !content ? (
                                            <div className="flex items-center gap-2 text-gray-500 animate-pulse mt-4">
                                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-75"></span>
                                                <span className="text-xs font-mono">Initializing thought vector...</span>
                                            </div>
                                        ) : null}
                                        
                                        <div className="prose prose-invert prose-sm max-w-none text-gray-300 font-light font-sans">
                                            <MarkdownRenderer content={content} />
                                        </div>
                                    </div>
                                 </div>
                             );
                        })}
                     </div>
                 )}
            </div>
        </div>
    );
};

// --- Custom Hook for Chat Logic (Session Management) ---
const useChatSession = (initialContext: UserContext, initialHistory: ChatMessage[] = [], themeColor: string) => {
    const [messages, setMessages] = useState<ChatMessage[]>(initialHistory);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [activeModels, setActiveModels] = useState<ModelProvider[]>(initialContext.models);
    const [isListening, setIsListening] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // Scroll handling
    useEffect(() => { scrollToBottom(); }, [messages, isLoading]);
    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]); };
    const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));

    const toggleActiveModel = (modelId: ModelProvider) => {
        setActiveModels(prev => prev.includes(modelId) ? (prev.length === 1 ? prev : prev.filter(m => m !== modelId)) : (prev.length >= 3 ? prev : [...prev, modelId]));
    };

    const handleEditMessage = (msgId: string, newContent: string, agentConfig: AgentConfig) => {
        const idx = messages.findIndex(m => m.id === msgId);
        if (idx === -1) return;
        const newHistory = messages.slice(0, idx);
        handleSubmit(newContent, newHistory, agentConfig);
    };

    const handleSubmit = async (overrideInput: string | undefined, overrideHistory: ChatMessage[] | undefined, agentConfig: AgentConfig) => {
        const textToSend = overrideInput !== undefined ? overrideInput : input;
        const historyToUse = overrideHistory !== undefined ? overrideHistory : messages;
        
        if ((!textToSend.trim() && files.length === 0) || isLoading) return;
    
        const userMsgId = Date.now().toString();
        const currentFiles = [...files]; 
    
        // Clear UI state
        setInput('');
        setFiles([]);
        setIsLoading(true);
    
        // 1. User Message
        const userMsg: ChatMessage = {
            id: userMsgId,
            role: 'user',
            content: textToSend + (currentFiles.length > 0 ? `\n[Attached: ${currentFiles.map(f => f.name).join(', ')}]` : ''),
            timestamp: Date.now()
        };
        
        const newMessages = [...historyToUse, userMsg];
        setMessages(newMessages);
    
        // 2. Placeholder Model Message
        const modelMsgId = (Date.now() + 1).toString();
        const multiResponses = activeModels.map(m => ({
            modelId: m,
            modelName: getModelDisplayName(m),
            content: '',
            isThinking: true,
            isDone: false
        }));
    
        const modelMsg: ChatMessage = {
            id: modelMsgId,
            role: 'model',
            content: '',
            timestamp: Date.now(),
            isThinking: true,
            multiResponses: multiResponses
        };
        setMessages(prev => [...prev, modelMsg]);
    
        try {
            const promises = activeModels.map(async (modelId) => {
                const apiHistory = newMessages.map(m => {
                    if (m.role === 'user') return { role: 'user', parts: [{ text: m.content }] };
                    if (m.multiResponses && m.multiResponses.length > 0) {
                        const specificResponse = m.multiResponses.find(r => r.modelId === modelId);
                        return specificResponse ? { role: 'model', parts: [{ text: specificResponse.content }] } : { role: 'model', parts: [{ text: m.multiResponses[0].content }] };
                    }
                    return m.content ? { role: 'model', parts: [{ text: m.content }] } : null;
                }).filter(Boolean) as { role: string; parts: { text: string }[] }[];
    
                await streamResponse(
                    apiHistory,
                    textToSend,
                    currentFiles,
                    { field: initialContext.field!, task: initialContext.task!, config: agentConfig },
                    modelId,
                    (chunk) => {
                        setMessages(prev => prev.map(msg => {
                            if (msg.id === modelMsgId && msg.multiResponses) {
                                return { ...msg, multiResponses: msg.multiResponses.map(res => res.modelId === modelId ? { ...res, content: res.content + chunk, isThinking: false } : res) };
                            }
                            return msg;
                        }));
                    }
                );
                
                 setMessages(prev => prev.map(msg => {
                    if (msg.id === modelMsgId && msg.multiResponses) {
                        const updated = msg.multiResponses.map(res => res.modelId === modelId ? { ...res, isDone: true, isThinking: false } : res);
                        return { ...msg, multiResponses: updated, isThinking: !updated.every(r => r.isDone) };
                    }
                    return msg;
                }));
            });
            await Promise.all(promises);
        } catch (e) {
            console.error("Error", e);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        messages,
        setMessages,
        input,
        setInput,
        isLoading,
        files,
        setFiles,
        activeModels,
        setActiveModels,
        isListening,
        setIsListening,
        messagesEndRef,
        handleSubmit,
        handleFileSelect,
        removeFile,
        toggleActiveModel,
        handleEditMessage
    };
}

// --- Chat Pane Component (Reusable View) ---
interface ChatPaneProps {
    session: ReturnType<typeof useChatSession>;
    themeColor: string;
    agentConfig: AgentConfig;
    onPreviewArtifact: (artifact: ArtifactData) => void;
    onFork: (msgId: string) => void;
    showControls?: boolean;
    title?: string;
    onClose?: () => void;
}

const ChatPane: React.FC<ChatPaneProps> = ({ session, themeColor, agentConfig, onPreviewArtifact, onFork, showControls = true, title, onClose }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [showModelDropdown, setShowModelDropdown] = useState(false);
    const modelDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '56px';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = Math.min(scrollHeight, 200) + 'px';
        }
    }, [session.input]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
                setShowModelDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const speakText = (text: string) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.replace(/[*#`_]/g, ''));
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
    };

    const copyToClipboard = async (text: string) => { try { await navigator.clipboard.writeText(text); } catch (err) { console.error('Failed to copy!', err); } };
    const exportChat = () => { /* Export logic reuse or pass down */ };

    return (
        <div className="flex flex-col h-full relative">
            {title && (
                <div className="flex items-center justify-between p-3 border-b border-white/10 bg-[#0c0c0e]/80 backdrop-blur">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <GitBranch size={12} /> {title}
                    </span>
                    {onClose && <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={14} /></button>}
                </div>
            )}

            <div className="flex-1 overflow-y-auto pt-4 pb-48 px-4 md:px-8 scroll-smooth">
                 <div className="max-w-[95%] mx-auto">
                     {session.messages.map((msg) => (
                         <MessageBubble 
                           key={msg.id} 
                           message={msg} 
                           themeColor={themeColor}
                           onCopy={copyToClipboard}
                           onExport={exportChat}
                           onSpeak={speakText}
                           onPreviewArtifact={onPreviewArtifact}
                           onEdit={(id, content) => session.handleEditMessage(id, content, agentConfig)}
                           onFork={onFork}
                         />
                     ))}
                     <div ref={session.messagesEndRef} />
                 </div>
            </div>

             {/* Input Area */}
             <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent z-30 pointer-events-none">
                 <div className="pointer-events-auto">
                    {/* Active Models */}
                    <div className="max-w-4xl mx-auto mb-3 flex flex-wrap items-center gap-2 relative z-40">
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mr-2 flex items-center gap-1"><Layers size={10} /> Active Cluster:</span>
                        {session.activeModels.map(modelId => {
                            const modelDef = AVAILABLE_MODELS.find(m => m.id === modelId) || { name: modelId };
                            return (
                                <button key={modelId} onClick={() => session.toggleActiveModel(modelId)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-200 bg-${themeColor}-500/20 border-${themeColor}-500/50 text-${themeColor}-200`}>
                                    <div className={`w-1.5 h-1.5 rounded-full bg-${themeColor}-400 shadow-${themeColor}-500/50`} />
                                    {modelDef.name}
                                    <X size={10} className="hover:text-white" />
                                </button>
                            );
                        })}
                        <div className="relative" ref={modelDropdownRef}>
                            <button onClick={() => setShowModelDropdown(!showModelDropdown)} className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium border border-dashed border-gray-700 text-gray-500 hover:text-white hover:border-gray-500"><Plus size={12} /> Add</button>
                            {showModelDropdown && (
                                <div className="absolute bottom-full left-0 mb-2 w-56 bg-[#0c0c0e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                                    <div className="max-h-48 overflow-y-auto">
                                        {AVAILABLE_MODELS.map(model => (
                                            <button key={model.id} onClick={() => { session.toggleActiveModel(model.id); setShowModelDropdown(false); }} disabled={session.activeModels.includes(model.id)} className={`w-full text-left px-4 py-3 text-xs flex justify-between items-center hover:bg-white/5 ${session.activeModels.includes(model.id) ? 'opacity-50' : 'text-gray-300'}`}>
                                                <span>{model.name}</span>
                                                {session.activeModels.includes(model.id) && <Check size={12} className={`text-${themeColor}-400`} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {agentConfig.enableSearch && <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded bg-blue-900/30 border border-blue-500/30 text-[10px] text-blue-300"><Globe size={10} /> WEB CONNECTED</div>}
                        {agentConfig.mcpPlugins && agentConfig.mcpPlugins.length > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-900/30 border border-green-500/30 text-[10px] text-green-300">
                                <Plug size={10} /> MCP ACTIVE
                            </div>
                        )}
                    </div>

                    {/* File Previews */}
                    {session.files.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3 max-w-4xl mx-auto">
                            {session.files.map((file, i) => (
                                <div key={i} className={`flex items-center gap-2 bg-${themeColor}-900/30 border border-${themeColor}-500/30 px-3 py-1 rounded-lg text-xs text-${themeColor}-200 backdrop-blur-md`}>
                                    {file.type.startsWith('image/') ? (
                                        <ImageIcon size={14} className="text-pink-400" />
                                    ) : (
                                        <FileText size={14} />
                                    )}
                                    <span className="max-w-[150px] truncate">{file.name}</span>
                                    <button onClick={() => session.removeFile(i)} className="hover:text-white"><X size={12} /></button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="relative group max-w-4xl mx-auto">
                        <div className={`absolute -inset-0.5 bg-gradient-to-r from-${themeColor}-600 to-blue-600 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur`}></div>
                        <div className="relative flex items-end gap-2 bg-[#0c0c0e] rounded-xl p-2 border border-white/10 shadow-2xl">
                            <input type="file" multiple ref={fileInputRef} className="hidden" onChange={session.handleFileSelect} />
                            <div className="flex flex-col gap-1 mb-1">
                                <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Upload"><Paperclip size={18} /></button>
                            </div>
                            <textarea ref={textareaRef} value={session.input} onChange={(e) => session.setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); session.handleSubmit(undefined, undefined, agentConfig); } }} placeholder="Ask a research question... (Ctrl + Enter to send)" className="w-full bg-transparent text-gray-200 placeholder-gray-600 font-mono text-sm resize-none py-4 px-3 focus:outline-none scrollbar-hide overflow-y-auto" style={{ height: '56px' }} />
                            <button onClick={() => session.handleSubmit(undefined, undefined, agentConfig)} disabled={(session.isLoading || (!session.input.trim() && session.files.length === 0))} className={`p-3 mb-1 bg-${themeColor}-600 hover:bg-${themeColor}-500 text-white rounded-lg disabled:opacity-50 transition-all shadow-lg shadow-${themeColor}-900/20`}>{session.isLoading ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}</button>
                        </div>
                    </div>
                 </div>
              </div>
        </div>
    );
};


const ChatInterface: React.FC<ChatInterfaceProps> = ({ context, themeColor, onBack }) => {
  const [showSettings, setShowSettings] = useState(false);
  
  // Artifact State
  const [showArtifactPanel, setShowArtifactPanel] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<ArtifactData | null>(null);

  // Global Config
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
      enableSearch: false,
      systemInstruction: getSystemInstruction(context.field!, context.task!),
      temperature: 0.7,
      topP: 0.95,
      mcpPlugins: []
  });

  const [availableMCPs] = useState<MCPPlugin[]>(MCP_REGISTRY);

  const toggleMCPPlugin = (pluginId: string) => {
      setAgentConfig(prev => {
          const isInstalled = prev.mcpPlugins?.find(p => p.id === pluginId);
          let newPlugins;
          if (isInstalled) {
              newPlugins = prev.mcpPlugins?.filter(p => p.id !== pluginId) || [];
          } else {
              const plugin = availableMCPs.find(p => p.id === pluginId);
              newPlugins = plugin ? [...(prev.mcpPlugins || []), plugin] : prev.mcpPlugins;
          }
          return { ...prev, mcpPlugins: newPlugins };
      });
  };

  // Sessions
  const mainSession = useChatSession(context, [], themeColor);
  const [isSplit, setIsSplit] = useState(false);
  const secondarySession = useChatSession(context, [], themeColor);

  // Initial Welcome Message for Main Session
  useEffect(() => {
    if (mainSession.messages.length === 0) {
        mainSession.setMessages([{
            id: 'system-welcome',
            role: 'model',
            content: `### ${context.field} Workspace Initialized`,
            timestamp: Date.now(),
            multiResponses: [{
                modelId: ModelProvider.GEMINI_FLASH,
                modelName: "ProtoChat System",
                content: `### ${context.field} Workspace Initialized\n\nI am ready to assist with **${context.task}** using **${mainSession.activeModels.map(getModelDisplayName).join(', ')}**.\n\n**New Features:**\n- **Vision:** Upload images for analysis.\n- **Artifacts:** Code & Preview (HTML/SVG).\n- **Protein:** View 3D structures (ask for PDBs).\n- **Branching:** Click <GitBranch size={12} className="inline text-gray-500"/> on any AI response to open a parallel fork.`,
                isThinking: false,
                isDone: true
            }]
        }]);
    }
  }, []);

  const handleFork = (msgId: string) => {
      const idx = mainSession.messages.findIndex(m => m.id === msgId);
      if (idx !== -1) {
          const forkHistory = mainSession.messages.slice(0, idx + 1);
          secondarySession.setMessages(forkHistory);
          secondarySession.setActiveModels(mainSession.activeModels);
          setIsSplit(true);
      }
  };
  
  const handlePreviewArtifact = (artifact: ArtifactData) => {
      setActiveArtifact(artifact);
      setShowArtifactPanel(true);
  };

  const exportChat = () => {
      alert("Exporting current active session...");
  };

  return (
    <div className="flex h-screen w-full bg-[#050505] relative z-10 border-x border-white/5 font-sans overflow-hidden">
      
      {/* Main Area with Split Support */}
      <div className={`flex flex-col flex-1 h-full transition-all duration-300 ${showArtifactPanel ? 'w-1/2' : 'w-full'}`}>
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#050505]/95 backdrop-blur-sm z-30 shadow-lg">
            <div className="flex items-center space-x-4">
              <button onClick={onBack} className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-sm uppercase tracking-widest"><ChevronLeft size={16} /> Back</button>
              <div className="h-6 w-px bg-white/10"></div>
              <div>
                <h2 className={`text-${themeColor}-400 font-bold tracking-tight text-lg`}>{context.field}</h2>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-mono">{context.task}</span>
                  {isSplit && <span className="text-[10px] bg-purple-900/50 text-purple-300 px-2 rounded border border-purple-500/30 flex items-center gap-1"><Split size={10}/> SPLIT VIEW ACTIVE</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                 <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-lg hover:bg-white/5 ${showSettings ? 'text-white bg-white/10' : ''}`}><Settings size={18} /></button>
                 <button onClick={exportChat} className="flex items-center gap-2 hover:text-white ml-2"><Download size={14} /> EXPORT</button>
                 {activeArtifact && (
                     <button onClick={() => setShowArtifactPanel(!showArtifactPanel)} className={`ml-2 p-2 rounded hover:bg-white/5 ${showArtifactPanel ? 'text-blue-400' : ''}`}>
                        {showArtifactPanel ? <PanelRightClose size={18}/> : <PanelRightOpen size={18}/>}
                     </button>
                 )}
            </div>
          </div>

          {/* Split Content */}
          <div className="flex-1 flex overflow-hidden">
             {/* Left Pane (Main) */}
             <div className={`flex-1 border-r border-white/5 transition-all duration-300 ${isSplit ? 'w-1/2' : 'w-full'}`}>
                 <ChatPane 
                    session={mainSession} 
                    themeColor={themeColor} 
                    agentConfig={agentConfig}
                    onPreviewArtifact={handlePreviewArtifact}
                    onFork={handleFork}
                    title={isSplit ? "Original Thread" : undefined}
                 />
             </div>

             {/* Right Pane (Fork) */}
             {isSplit && (
                 <div className="flex-1 w-1/2 bg-[#08080a]">
                     <ChatPane 
                        session={secondarySession} 
                        themeColor={themeColor} 
                        agentConfig={agentConfig}
                        onPreviewArtifact={handlePreviewArtifact}
                        onFork={(id) => { /* Nested fork not supported in MVP */ }}
                        title="Forked Branch"
                        onClose={() => setIsSplit(false)}
                     />
                 </div>
             )}
          </div>
      </div>

      {/* Artifact Panel (Right Side) */}
      <div className={`border-l border-white/10 bg-[#0c0c0e] transition-all duration-300 flex flex-col ${showArtifactPanel ? 'w-1/2' : 'w-0 overflow-hidden'}`}>
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0c0c0e]">
              <div className="flex items-center gap-2">
                  <Code size={18} className="text-blue-400" />
                  <span className="font-bold text-gray-200 text-sm tracking-wider">ARTIFACT PREVIEW</span>
              </div>
              <button onClick={() => setShowArtifactPanel(false)} className="text-gray-500 hover:text-white"><X size={18}/></button>
          </div>
          <div className="flex-1 overflow-hidden relative bg-gray-900/50">
              {activeArtifact ? (
                  <ArtifactRenderer artifact={activeArtifact} themeColor={themeColor} />
              ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                      <FileText size={48} className="opacity-20" />
                      <span className="text-xs">No active artifact selected</span>
                  </div>
              )}
          </div>
      </div>
      
      {/* Settings Drawer (Overlay) */}
      <div className={`fixed inset-y-0 right-0 w-80 bg-[#0c0c0e] border-l border-white/10 shadow-2xl z-50 transform transition-transform duration-300 ${showSettings ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 h-full flex flex-col overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                  <h3 className="text-white font-bold tracking-wider flex items-center gap-2"><Bot size={18}/> AGENT CONFIG</h3>
                  <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
              </div>
              
              {/* Plugins / MCP Market */}
              <div className="mb-8">
                  <h4 className="text-xs text-gray-500 font-bold uppercase mb-4 tracking-widest flex items-center gap-2"><Plug size={12}/> MCP Marketplace</h4>
                  
                  {/* Native Search */}
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 mb-2">
                      <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded bg-blue-500/20 text-blue-400`}><Globe size={16} /></div>
                          <div><span className="text-sm text-gray-300 block font-medium">Google Search</span></div>
                      </div>
                      <button onClick={() => setAgentConfig(prev => ({ ...prev, enableSearch: !prev.enableSearch }))} className={`w-10 h-5 rounded-full relative transition-colors ${agentConfig.enableSearch ? `bg-${themeColor}-600` : 'bg-gray-700'}`}><div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${agentConfig.enableSearch ? 'translate-x-5' : ''}`}></div></button>
                  </div>

                  {/* Available MCP Plugins */}
                  <div className="space-y-2">
                      {availableMCPs.map(plugin => {
                          const isInstalled = agentConfig.mcpPlugins?.some(p => p.id === plugin.id);
                          return (
                              <div key={plugin.id} className="flex flex-col p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/20 transition-colors">
                                  <div className="flex justify-between items-start mb-2">
                                      <div className="flex items-center gap-2">
                                          <div className="p-1.5 rounded bg-gray-700 text-gray-300"><plugin.icon size={16} /></div>
                                          <div>
                                              <span className="text-sm text-gray-200 block font-medium">{plugin.name}</span>
                                              <span className="text-[10px] text-gray-500 block">{plugin.author} • v{plugin.version}</span>
                                          </div>
                                      </div>
                                      <button 
                                        onClick={() => toggleMCPPlugin(plugin.id)} 
                                        className={`px-3 py-1 text-[10px] font-bold rounded uppercase tracking-wider transition-colors ${isInstalled ? `bg-${themeColor}-900/50 text-${themeColor}-400 border border-${themeColor}-500/50` : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                                      >
                                          {isInstalled ? 'INSTALLED' : 'INSTALL'}
                                      </button>
                                  </div>
                                  <p className="text-xs text-gray-500 leading-relaxed">{plugin.description}</p>
                              </div>
                          );
                      })}
                  </div>
              </div>

              <div className="mb-8">
                  <h4 className="text-xs text-gray-500 font-bold uppercase mb-4 tracking-widest flex items-center gap-2"><Sliders size={12}/> Parameters</h4>
                  <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-2"><span>Temperature</span><span>{agentConfig.temperature}</span></div>
                      <input type="range" min="0" max="1" step="0.1" value={agentConfig.temperature} onChange={(e) => setAgentConfig(prev => ({...prev, temperature: parseFloat(e.target.value)}))} className={`w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-${themeColor}-500`}/>
                  </div>
                  <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-2"><span>Top P</span><span>{agentConfig.topP}</span></div>
                      <input type="range" min="0" max="1" step="0.05" value={agentConfig.topP} onChange={(e) => setAgentConfig(prev => ({...prev, topP: parseFloat(e.target.value)}))} className={`w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-${themeColor}-500`}/>
                  </div>
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                  <h4 className="text-xs text-gray-500 font-bold uppercase mb-4 tracking-widest flex items-center gap-2"><FileText size={12}/> System Instruction</h4>
                  <textarea value={agentConfig.systemInstruction} onChange={(e) => setAgentConfig(prev => ({ ...prev, systemInstruction: e.target.value }))} className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-xs font-mono text-gray-400 resize-none focus:outline-none focus:border-white/30" placeholder="Override system prompt..." />
              </div>
          </div>
      </div>
    </div>
  );
};

export default ChatInterface;