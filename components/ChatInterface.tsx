import React, { useState, useRef, useEffect } from 'react';
import { Send, RefreshCw, ChevronLeft, Paperclip, X, Download, FileText, BrainCircuit, Maximize2, Copy, Check, FileDown, Cpu, Command, Settings, Mic, Volume2, Globe, Bot, Layers, Plus, Zap, Sparkles, MessageSquare, Hexagon, Flame, Sliders, VolumeX } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { ChatMessage, UserContext, ModelProvider, AgentConfig } from '../types';
import { streamResponse, getSystemInstruction } from '../services/geminiService';

interface ChatInterfaceProps {
  context: UserContext;
  themeColor: string;
  onBack: () => void;
}

// Helper to get friendly name
const getModelDisplayName = (id: ModelProvider) => {
    switch(id) {
        // Google
        case ModelProvider.GEMINI_FLASH: return "Gemini 2.5 Flash";
        case ModelProvider.GEMINI_FLASH_LITE: return "Gemini 2.5 Flash-Lite";
        case ModelProvider.GEMINI_PRO: return "Gemini 3.0 Pro";
        case ModelProvider.GEMINI_THINKING: return "Gemini 3.0 Thinking";
        case ModelProvider.GEMINI_EXP: return "Gemini Experimental";
        case ModelProvider.LEARN_LM: return "LearnLM 1.5 Pro";
        
        // External
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
  // Google
  { id: ModelProvider.GEMINI_FLASH, name: "Gemini 2.5 Flash", desc: "Google • Fast" },
  { id: ModelProvider.GEMINI_PRO, name: "Gemini 3.0 Pro", desc: "Google • Reasoning" },
  { id: ModelProvider.GEMINI_THINKING, name: "Gemini 3.0 Thinking", desc: "Google • Logic" },
  
  // Others
  { id: ModelProvider.OPENAI_GPT4O, name: "GPT-4o", desc: "OpenAI • Omni" },
  { id: ModelProvider.CLAUDE_3_5_SONNET, name: "Claude 3.5 Sonnet", desc: "Anthropic" },
  { id: ModelProvider.DEEPSEEK_V3, name: "DeepSeek V3", desc: "DeepSeek" },
  { id: ModelProvider.GROQ_LLAMA_3, name: "Llama 3 70B", desc: "Groq" },
  { id: ModelProvider.OPENAI_O1, name: "o1-preview", desc: "OpenAI • Chain" },
  { id: ModelProvider.DEEPSEEK_R1, name: "DeepSeek R1", desc: "DeepSeek • Math" },
];

interface MessageBubbleProps {
  message: ChatMessage;
  themeColor: string;
  onCopy: (text: string) => void;
  onExport: () => void;
  onSpeak: (text: string) => void;
}

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
                p: ({node, ...props}) => <p className="mb-4 leading-7" {...props} />,
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold mt-6 mb-3" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-5 mb-2" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4 ml-2" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-4 ml-2" {...props} />,
                li: ({node, ...props}) => <li className="mb-1" {...props} />,
                code: ({node, inline, className, children, ...props}: any) => {
                    return inline ? (
                        <code className="bg-white/10 px-1 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>
                    ) : (
                        <code className="block bg-black/30 p-3 rounded-lg text-sm font-mono my-3 overflow-x-auto border border-white/5" {...props}>{children}</code>
                    )
                },
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-white/20 pl-4 italic my-4 opacity-80" {...props} />,
                a: ({node, ...props}) => <a className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
            }}
        >
            {content}
        </ReactMarkdown>
    );
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, themeColor, onCopy, onExport, onSpeak }) => {
    const isUser = message.role === 'user';
    
    if (isUser) {
        return (
            <div className="flex justify-end mb-8 pl-12">
                <div className="max-w-2xl w-full">
                    <div className="flex items-center justify-end gap-2 mb-2">
                        <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Research Query</span>
                        <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-white font-bold">U</div>
                    </div>
                    <div className="p-5 rounded-2xl bg-gray-900/80 backdrop-blur-md border border-gray-700 shadow-xl">
                        <div className="text-sm text-gray-200 font-medium whitespace-pre-wrap leading-relaxed">
                            {message.content}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Model Message (potentially parallel)
    const isMulti = message.multiResponses && message.multiResponses.length > 0;
    
    // Determine grid columns based on count (Responsive: 1 col on mobile, multi on large)
    const gridCols = isMulti 
        ? message.multiResponses!.length === 3 
            ? 'lg:grid-cols-3' 
            : message.multiResponses!.length === 2 
                ? 'lg:grid-cols-2' 
                : 'lg:grid-cols-1'
        : 'grid-cols-1';

    return (
        <div className="flex justify-start mb-12 pr-4 w-full">
            <div className="w-full">
                 <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1 rounded bg-${themeColor}-500/20 text-${themeColor}-400`}>
                        <BrainCircuit size={14} />
                    </div>
                    <span className={`text-xs font-mono text-${themeColor}-300 uppercase tracking-wider`}>
                        {isMulti ? `PROTOCHAT CLUSTER (${message.multiResponses?.length} CORES)` : 'PROTOCHAT INTELLIGENCE'}
                    </span>
                 </div>
                 
                 {isMulti ? (
                     <div className={`grid gap-4 grid-cols-1 ${gridCols}`}>
                        {message.multiResponses!.map((res, idx) => (
                             <div key={res.modelId} className={`flex flex-col rounded-2xl bg-[#0a0a0f]/90 backdrop-blur-xl border border-${themeColor}-500/30 shadow-2xl shadow-${themeColor}-900/10 overflow-hidden`}>
                                {/* Sub-Toolbar */}
                                <div className={`px-4 py-2 bg-${themeColor}-900/10 border-b border-${themeColor}-500/20 flex justify-between items-center`}>
                                    <div className="flex items-center gap-2">
                                        <Cpu size={12} className={`text-${themeColor}-400`} />
                                        <span className="text-[10px] text-white font-bold tracking-wider font-mono uppercase">{res.modelName}</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => onSpeak(res.content)} className="text-gray-500 hover:text-white transition-colors p-1" title="Read Aloud">
                                            <Volume2 size={12} />
                                        </button>
                                        <button onClick={() => onCopy(res.content)} className="text-gray-500 hover:text-white transition-colors p-1" title="Copy">
                                            <Copy size={12} />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="p-6 flex-1 min-h-[200px]">
                                    {res.isThinking ? (
                                        <div className="flex items-center gap-2 text-gray-500 animate-pulse mt-4">
                                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-75"></span>
                                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-150"></span>
                                        </div>
                                    ) : null}
                                    
                                    <div className="prose prose-invert prose-sm max-w-none text-gray-300 font-light font-sans">
                                        <MarkdownRenderer content={res.content} />
                                    </div>
                                </div>
                             </div>
                        ))}
                     </div>
                 ) : (
                     /* Legacy single response fallback */
                     <div className={`rounded-2xl bg-[#0a0a0f]/90 backdrop-blur-xl border border-${themeColor}-500/30 shadow-2xl shadow-${themeColor}-900/10 overflow-hidden`}>
                        <div className={`px-4 py-2 bg-${themeColor}-900/10 border-b border-${themeColor}-500/20 flex justify-between items-center`}>
                            <div className="text-[10px] text-gray-500 font-mono">
                                {new Date(message.timestamp).toLocaleTimeString()}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => onSpeak(message.content)} className="text-gray-500 hover:text-white transition-colors p-1" title="Read Aloud">
                                    <Volume2 size={14} />
                                </button>
                                <button onClick={() => onCopy(message.content)} className="text-gray-500 hover:text-white transition-colors p-1" title="Copy">
                                    <Copy size={14} />
                                </button>
                                <button onClick={onExport} className="text-gray-500 hover:text-white transition-colors p-1" title="Export Thread">
                                    <FileDown size={14} />
                                </button>
                            </div>
                        </div>

                        <div className="p-8">
                            {message.isThinking ? (
                                <div className="flex items-center gap-3 text-gray-400 animate-pulse">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                                    <span className="text-sm font-mono">Processing Logic...</span>
                                </div>
                            ) : (
                                <div className="prose prose-invert prose-sm max-w-none text-gray-300 font-light font-sans">
                                     <MarkdownRenderer content={message.content} />
                                </div>
                            )}
                        </div>
                     </div>
                 )}
            </div>
        </div>
    );
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ context, themeColor, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  
  // Active Models State (Local override of context)
  const [activeModels, setActiveModels] = useState<ModelProvider[]>(context.models);

  // Settings State
  const [agentConfig, setAgentConfig] = useState<AgentConfig>({
      enableSearch: false,
      systemInstruction: getSystemInstruction(context.field!, context.task!),
      temperature: 0.7,
      topP: 0.95
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close model dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
            setShowModelDropdown(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize Welcome Message
  useEffect(() => {
    if (messages.length === 0) {
        setMessages([{
            id: 'system-welcome',
            role: 'model',
            content: `### ${context.field} Workspace Initialized\n\nI am ready to assist with **${context.task}** using **${activeModels.map(getModelDisplayName).join(', ')}**.\n\nUpload papers (PDF), images, or datasets to begin analysis.`,
            timestamp: Date.now()
        }]);
    }
  }, []);

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Auto-resize input
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = '56px'; // Reset to min height to allow shrinking
        const scrollHeight = textareaRef.current.scrollHeight;
        textareaRef.current.style.height = Math.min(scrollHeight, 200) + 'px'; // Cap at 200px
    }
  }, [input]);

  // File Handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };
  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));

  // Speech to Text
  const startListening = () => {
      if ('webkitSpeechRecognition' in window) {
          const recognition = new (window as any).webkitSpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          
          recognition.onstart = () => setIsListening(true);
          recognition.onend = () => setIsListening(false);
          
          recognition.onresult = (event: any) => {
              const text = event.results[0][0].transcript;
              setInput(prev => prev + (prev ? ' ' : '') + text);
          };
          recognition.start();
      } else {
          alert("Speech recognition is not supported in this browser.");
      }
  };

  // Text to Speech
  const speakText = (text: string) => {
      window.speechSynthesis.cancel();
      if (isSpeaking) {
          setIsSpeaking(false);
          return;
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.1;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      
      // Clean up markdown syntax for speech
      const cleanText = text.replace(/[*#`_]/g, '');
      utterance.text = cleanText;
      
      window.speechSynthesis.speak(utterance);
  };

  // Copy Functionality
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  // Export Functionality
  const exportChat = () => {
    const text = messages.map(m => {
        if (m.multiResponses) {
            let out = `[MODEL CLUSTER] ${new Date(m.timestamp).toLocaleTimeString()}\n`;
            m.multiResponses.forEach(r => {
                out += `\n--- ${r.modelName} ---\n${r.content}\n`;
            });
            return out;
        }
        return `[${m.role.toUpperCase()}] ${new Date(m.timestamp).toLocaleTimeString()}\n${m.content}\n\n`
    }).join('========================================\n\n');
    
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ProtoChat_${context.field}_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleActiveModel = (modelId: ModelProvider) => {
      setActiveModels(prev => {
          if (prev.includes(modelId)) {
              if (prev.length === 1) return prev; // Keep at least one
              return prev.filter(m => m !== modelId);
          } else {
              if (prev.length >= 3) return prev; // Max 3
              return [...prev, modelId];
          }
      });
  };

  // Submit Handler
  const handleSubmit = async () => {
    if ((!input.trim() && files.length === 0) || isLoading) return;

    const userText = input;
    const currentFiles = [...files];
    const userMsgId = Date.now().toString();
    
    // Clear Input
    setInput('');
    setFiles([]);
    setIsLoading(true);

    // 1. Add User Message
    const userMsg: ChatMessage = {
        id: userMsgId,
        role: 'user',
        content: userText + (currentFiles.length > 0 ? `\n[Attached: ${currentFiles.map(f => f.name).join(', ')}]` : ''),
        timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);

    // 2. Add Placeholder Model Message (Multi-Model Container)
    const modelMsgId = (Date.now() + 1).toString();
    
    // USE ACTIVE MODELS STATE HERE
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
        content: '', // Not used for multi
        timestamp: Date.now(),
        isThinking: true,
        multiResponses: multiResponses
    };
    setMessages(prev => [...prev, modelMsg]);

    try {
        const promises = activeModels.map(async (modelId) => {
            // Construct history specific to this model to maintain conversational continuity
            const history = messages.map(m => {
                if (m.role === 'user') {
                    return { role: 'user', parts: [{ text: m.content }] };
                }
                // Model message
                if (m.multiResponses && m.multiResponses.length > 0) {
                    // Try to find this model's previous response
                    const specificResponse = m.multiResponses.find(r => r.modelId === modelId);
                    if (specificResponse) {
                        return { role: 'model', parts: [{ text: specificResponse.content }] };
                    }
                    // Fallback: If this model didn't answer previously (e.g. wasn't selected), use the first available answer
                    // This ensures the model isn't blind to previous context.
                    return { role: 'model', parts: [{ text: m.multiResponses[0].content }] };
                }
                // Single/Legacy response
                if (m.content) {
                    return { role: 'model', parts: [{ text: m.content }] };
                }
                return null;
            }).filter(Boolean) as { role: string; parts: { text: string }[] }[];

            await streamResponse(
                history,
                userText,
                currentFiles,
                { field: context.field!, task: context.task!, config: agentConfig },
                modelId,
                (chunk) => {
                    setMessages(prev => prev.map(msg => {
                        if (msg.id === modelMsgId && msg.multiResponses) {
                            const updatedResponses = msg.multiResponses.map(res => {
                                if (res.modelId === modelId) {
                                    return { 
                                        ...res, 
                                        content: res.content + chunk, 
                                        isThinking: false 
                                    };
                                }
                                return res;
                            });
                            return { ...msg, multiResponses: updatedResponses };
                        }
                        return msg;
                    }));
                }
            );
            
            // Mark individual model as done
             setMessages(prev => prev.map(msg => {
                if (msg.id === modelMsgId && msg.multiResponses) {
                    const updatedResponses = msg.multiResponses.map(res => {
                        if (res.modelId === modelId) {
                            return { ...res, isDone: true, isThinking: false };
                        }
                        return res;
                    });
                    // Check if all are done
                    const allDone = updatedResponses.every(r => r.isDone);
                    return { ...msg, multiResponses: updatedResponses, isThinking: !allDone };
                }
                return msg;
            }));
        });

        await Promise.all(promises);

    } catch (e) {
        console.error("Parallel execution error", e);
    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Only submit on Ctrl+Enter or Cmd+Enter
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#050505] relative z-10 border-x border-white/5 font-sans">
      
      {/* Settings Drawer */}
      <div className={`fixed inset-y-0 right-0 w-80 bg-[#0c0c0e] border-l border-white/10 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${showSettings ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 h-full flex flex-col overflow-y-auto">
              <div className="flex justify-between items-center mb-8">
                  <h3 className="text-white font-bold tracking-wider flex items-center gap-2"><Bot size={18}/> AGENT CONFIG</h3>
                  <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
              </div>
              
              {/* Plugins */}
              <div className="mb-8">
                  <h4 className="text-xs text-gray-500 font-bold uppercase mb-4 tracking-widest flex items-center gap-2"><Globe size={12}/> Plugins</h4>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded bg-blue-500/20 text-blue-400`}>
                            <Globe size={16} />
                          </div>
                          <div>
                            <span className="text-sm text-gray-300 block font-medium">Google Search</span>
                            <span className="text-[10px] text-gray-500 block">Real-time web grounding</span>
                          </div>
                      </div>
                      <button 
                        onClick={() => setAgentConfig(prev => ({ ...prev, enableSearch: !prev.enableSearch }))}
                        className={`w-10 h-5 rounded-full relative transition-colors ${agentConfig.enableSearch ? `bg-${themeColor}-600` : 'bg-gray-700'}`}
                      >
                          <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${agentConfig.enableSearch ? 'translate-x-5' : ''}`}></div>
                      </button>
                  </div>
              </div>

              {/* Generation Parameters (Lobe Style) */}
              <div className="mb-8">
                  <h4 className="text-xs text-gray-500 font-bold uppercase mb-4 tracking-widest flex items-center gap-2"><Sliders size={12}/> Parameters</h4>
                  
                  {/* Temperature */}
                  <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-2">
                          <span>Temperature</span>
                          <span>{agentConfig.temperature}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="1" step="0.1"
                        value={agentConfig.temperature}
                        onChange={(e) => setAgentConfig(prev => ({...prev, temperature: parseFloat(e.target.value)}))}
                        className={`w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-${themeColor}-500`}
                      />
                      <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                          <span>Precise</span>
                          <span>Creative</span>
                      </div>
                  </div>

                  {/* Top P */}
                  <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-400 mb-2">
                          <span>Top P</span>
                          <span>{agentConfig.topP}</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="1" step="0.05"
                        value={agentConfig.topP}
                        onChange={(e) => setAgentConfig(prev => ({...prev, topP: parseFloat(e.target.value)}))}
                        className={`w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-${themeColor}-500`}
                      />
                  </div>
              </div>

              {/* System Prompt */}
              <div className="flex-1 flex flex-col min-h-0">
                  <h4 className="text-xs text-gray-500 font-bold uppercase mb-4 tracking-widest flex items-center gap-2"><FileText size={12}/> System Instruction</h4>
                  <textarea 
                    value={agentConfig.systemInstruction}
                    onChange={(e) => setAgentConfig(prev => ({ ...prev, systemInstruction: e.target.value }))}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg p-3 text-xs font-mono text-gray-400 resize-none focus:outline-none focus:border-white/30 transition-colors"
                    placeholder="Override system prompt..."
                  />
                  <div className="mt-2 text-[10px] text-gray-600">
                      Modifies the AI persona for the next message.
                  </div>
              </div>
          </div>
      </div>

      {/* Header */}
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#050505]/95 backdrop-blur-sm z-30 absolute top-0 w-full shadow-lg">
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 text-sm uppercase tracking-widest"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <div className="h-6 w-px bg-white/10"></div>
          <div>
            <h2 className={`text-${themeColor}-400 font-bold tracking-tight text-lg shadow-${themeColor}-500/50 drop-shadow-sm`}>{context.field}</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono">{context.task}</span>
              <span className="text-xs text-gray-600">•</span>
              <span className={`text-xs text-${themeColor}-300 font-mono opacity-80`}>
                  {activeModels.length} Model(s) Active
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
             <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-lg hover:bg-white/5 transition-colors ${showSettings ? 'text-white bg-white/10' : ''}`} title="Agent Settings">
                <Settings size={18} />
             </button>
             <button onClick={exportChat} className="flex items-center gap-2 hover:text-white transition-colors ml-2">
                <Download size={14} /> EXPORT
             </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto pt-24 pb-48 px-4 md:px-8 scroll-smooth">
         <div className="max-w-[95%] mx-auto">
             {messages.map((msg) => (
                 <MessageBubble 
                   key={msg.id} 
                   message={msg} 
                   themeColor={themeColor}
                   onCopy={copyToClipboard}
                   onExport={exportChat}
                   onSpeak={speakText}
                 />
             ))}
             <div ref={messagesEndRef} />
         </div>
      </div>

      {/* Input Overlay */}
      <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent z-30">
        
        {/* Active Model Toggles (Quick Access) */}
        <div className="max-w-4xl mx-auto mb-3 flex flex-wrap items-center gap-2 relative z-40">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mr-2 flex items-center gap-1">
                <Layers size={10} /> Active Cluster:
            </span>
            
            {/* Active Chips */}
            {activeModels.map(modelId => {
                const modelDef = AVAILABLE_MODELS.find(m => m.id === modelId) || { name: modelId };
                return (
                    <button
                        key={modelId}
                        onClick={() => toggleActiveModel(modelId)}
                        className={`
                            flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border transition-all duration-200
                            bg-${themeColor}-500/20 border-${themeColor}-500/50 text-${themeColor}-200 shadow-[0_0_10px_rgba(0,0,0,0.2)]
                        `}
                    >
                        <div className={`w-1.5 h-1.5 rounded-full shadow-sm bg-${themeColor}-400 shadow-${themeColor}-500/50`} />
                        {modelDef.name}
                        <X size={10} className="hover:text-white" />
                    </button>
                );
            })}

            {/* Add Model Dropdown Button */}
            <div className="relative" ref={modelDropdownRef}>
                <button 
                    onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium border border-dashed border-gray-700 text-gray-500 hover:text-white hover:border-gray-500 transition-colors"
                >
                    <Plus size={12} /> Add
                </button>

                {showModelDropdown && (
                    <div className="absolute bottom-full left-0 mb-2 w-56 bg-[#0c0c0e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                        <div className="p-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b border-white/5 bg-black/20">
                            Available Engines
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                            {AVAILABLE_MODELS.map(model => {
                                const isActive = activeModels.includes(model.id);
                                return (
                                    <button
                                        key={model.id}
                                        onClick={() => { toggleActiveModel(model.id); setShowModelDropdown(false); }}
                                        disabled={isActive}
                                        className={`w-full text-left px-4 py-3 text-xs flex justify-between items-center hover:bg-white/5 transition-colors ${isActive ? 'opacity-50 cursor-not-allowed' : 'text-gray-300'}`}
                                    >
                                        <span>{model.name}</span>
                                        {isActive && <Check size={12} className={`text-${themeColor}-400`} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Visual Plugin Indicators */}
            {agentConfig.enableSearch && (
                 <div className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded bg-blue-900/30 border border-blue-500/30 text-[10px] text-blue-300">
                     <Globe size={10} /> WEB CONNECTED
                 </div>
            )}
        </div>

        {/* File Chips */}
        {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3 max-w-4xl mx-auto">
                {files.map((file, i) => (
                    <div key={i} className={`flex items-center gap-2 bg-${themeColor}-900/30 border border-${themeColor}-500/30 px-3 py-1 rounded-full text-xs text-${themeColor}-200 backdrop-blur-md`}>
                        <FileText size={12} />
                        <span className="max-w-[150px] truncate">{file.name}</span>
                        <button onClick={() => removeFile(i)} className="hover:text-white"><X size={12} /></button>
                    </div>
                ))}
            </div>
        )}

        <div className="relative group max-w-4xl mx-auto">
            <div className={`absolute -inset-0.5 bg-gradient-to-r from-${themeColor}-600 to-blue-600 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur`}></div>
            <div className="relative flex items-end gap-2 bg-[#0c0c0e] rounded-xl p-2 border border-white/10 shadow-2xl">
                <input 
                    type="file" 
                    multiple 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={handleFileSelect} 
                />
                
                <div className="flex flex-col gap-1 mb-1">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Upload Papers/Data"
                    >
                        <Paperclip size={18} />
                    </button>
                    <button 
                        onClick={startListening}
                        className={`p-3 rounded-lg transition-colors ${isListening ? 'text-red-500 bg-red-500/10 animate-pulse' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                        title="Voice Input"
                    >
                        <Mic size={18} />
                    </button>
                    {isSpeaking && (
                         <button 
                            onClick={() => window.speechSynthesis.cancel()}
                            className="p-3 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 rounded-lg transition-colors"
                            title="Stop Speaking"
                        >
                            <VolumeX size={18} />
                        </button>
                    )}
                </div>

                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a research question... (Ctrl + Enter to send)"
                  className="w-full bg-transparent text-gray-200 placeholder-gray-600 font-mono text-sm resize-none py-4 px-3 focus:outline-none scrollbar-hide overflow-y-auto"
                  style={{ height: '56px' }}
                />
                <button
                  onClick={handleSubmit}
                  disabled={(isLoading || (!input.trim() && files.length === 0))}
                  title="Press Ctrl + Enter to send"
                  className={`p-3 mb-1 bg-${themeColor}-600 hover:bg-${themeColor}-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-${themeColor}-900/20`}
                >
                  {isLoading ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                </button>
            </div>
        </div>
        <div className="mt-3 flex justify-between px-2 text-[10px] text-gray-700 font-mono uppercase tracking-widest max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <span>ProtoChat v4.0</span>
                <span className={`text-${themeColor}-500/80 flex items-center gap-1`}>
                    <Command size={10} className="inline"/> + ENTER TO SEND
                </span>
            </div>
            <span>SECURE ENCRYPTED CONNECTION</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;