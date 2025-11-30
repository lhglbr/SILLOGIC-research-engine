
import React, { useState, useRef, useEffect } from 'react';
import { Send, RefreshCw, ChevronLeft, Paperclip, X, Download, FileText, BrainCircuit, Maximize2, Copy, Check, FileDown, Cpu } from 'lucide-react';
import { ChatMessage, UserContext, ModelProvider } from '../types';
import { streamResponse } from '../services/geminiService';

interface ChatInterfaceProps {
  context: UserContext;
  themeColor: string;
  onBack: () => void;
}

// Helper to get friendly name
const getModelDisplayName = (id: ModelProvider) => {
    switch(id) {
        case ModelProvider.GEMINI_FLASH: return "Gemini 2.5 Flash";
        case ModelProvider.GEMINI_PRO: return "Gemini 3.0 Pro";
        case ModelProvider.GEMINI_THINKING: return "Gemini 3.0 Thinking";
        default: return id;
    }
}

interface MessageBubbleProps {
  message: ChatMessage;
  themeColor: string;
  onCopy: (text: string) => void;
  onExport: () => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, themeColor, onCopy, onExport }) => {
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

    return (
        <div className="flex justify-start mb-12 pr-4 w-full">
            <div className="w-full">
                 <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1 rounded bg-${themeColor}-500/20 text-${themeColor}-400`}>
                        <BrainCircuit size={14} />
                    </div>
                    <span className={`text-xs font-mono text-${themeColor}-300 uppercase tracking-wider`}>
                        {isMulti ? `SILLOGIC CLUSTER (${message.multiResponses?.length} CORES)` : 'SILLOGIC INTELLIGENCE'}
                    </span>
                 </div>
                 
                 {isMulti ? (
                     <div className={`grid gap-4 ${message.multiResponses!.length === 3 ? 'grid-cols-3' : message.multiResponses!.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {message.multiResponses!.map((res, idx) => (
                             <div key={res.modelId} className={`flex flex-col rounded-2xl bg-[#0a0a0f]/90 backdrop-blur-xl border border-${themeColor}-500/30 shadow-2xl shadow-${themeColor}-900/10 overflow-hidden`}>
                                {/* Sub-Toolbar */}
                                <div className={`px-4 py-2 bg-${themeColor}-900/10 border-b border-${themeColor}-500/20 flex justify-between items-center`}>
                                    <div className="flex items-center gap-2">
                                        <Cpu size={12} className={`text-${themeColor}-400`} />
                                        <span className="text-[10px] text-white font-bold tracking-wider font-mono uppercase">{res.modelName}</span>
                                    </div>
                                    <button onClick={() => onCopy(res.content)} className="text-gray-500 hover:text-white transition-colors p-1" title="Copy">
                                        <Copy size={12} />
                                    </button>
                                </div>
                                
                                <div className="p-6 flex-1 min-h-[200px]">
                                    {res.isThinking ? (
                                        <div className="flex items-center gap-2 text-gray-500 animate-pulse mt-4">
                                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-75"></span>
                                            <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-150"></span>
                                        </div>
                                    ) : null}
                                    
                                    <div className="prose prose-invert prose-sm max-w-none text-gray-300 font-light leading-7 whitespace-pre-wrap font-sans">
                                        {res.content}
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
                                <div className="prose prose-invert prose-sm max-w-none text-gray-300 font-light leading-7 whitespace-pre-wrap font-sans">
                                    {message.content}
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
  const [files, setFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Welcome Message
  useEffect(() => {
    if (messages.length === 0) {
        setMessages([{
            id: 'system-welcome',
            role: 'model',
            content: `### ${context.field} Workspace Initialized\n\nI am ready to assist with **${context.task}** using **${context.models.map(getModelDisplayName).join(', ')}**.\n\nUpload papers (PDF), images, or datasets to begin analysis.`,
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

  // File Handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };
  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));

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
    a.download = `SILLOGIC_${context.field}_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
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
    
    const multiResponses = context.models.map(m => ({
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

    // 3. Parallel API Calls
    const history = messages.filter(m => !m.multiResponses).map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
    }));

    try {
        const promises = context.models.map(async (modelId) => {
            await streamResponse(
                history,
                userText,
                currentFiles,
                { field: context.field!, task: context.task! },
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
        // Error handling is managed individually in streamResponse but we can add global notification here if needed
    } finally {
        setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#050505] relative z-10 border-x border-white/5">
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
              <span className={`text-xs text-${themeColor}-300 font-mono opacity-80`}>{context.models.length} Model(s) Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
             <button onClick={exportChat} className="flex items-center gap-2 hover:text-white transition-colors">
                <Download size={14} /> EXPORT REPORT
             </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto pt-24 pb-32 px-4 md:px-8 scroll-smooth">
         <div className="max-w-[95%] mx-auto">
             {messages.map((msg) => (
                 <MessageBubble 
                   key={msg.id} 
                   message={msg} 
                   themeColor={themeColor}
                   onCopy={copyToClipboard}
                   onExport={exportChat}
                 />
             ))}
             <div ref={messagesEndRef} />
         </div>
      </div>

      {/* Input Overlay */}
      <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent z-30">
        
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
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 mb-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Upload Papers/Data"
                >
                    <Paperclip size={18} />
                </button>
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask a research question or upload data..."
                  className="w-full bg-transparent text-gray-200 placeholder-gray-600 font-mono text-sm resize-none p-3 h-14 max-h-32 focus:outline-none scrollbar-hide"
                />
                <button
                  onClick={handleSubmit}
                  disabled={(isLoading || (!input.trim() && files.length === 0))}
                  className={`p-3 mb-1 bg-${themeColor}-600 hover:bg-${themeColor}-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-${themeColor}-900/20`}
                >
                  {isLoading ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                </button>
            </div>
        </div>
        <div className="mt-3 flex justify-between px-2 text-[10px] text-gray-700 font-mono uppercase tracking-widest max-w-4xl mx-auto">
            <span>SILLOGIC v3.1</span>
            <span>SECURE ENCRYPTED CONNECTION</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
