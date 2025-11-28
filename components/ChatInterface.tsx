import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  Handle, 
  Position,
  useReactFlow,
  ReactFlowProvider,
  MarkerType
} from 'reactflow';
import { Send, RefreshCw, ChevronLeft, Paperclip, X, Download, FileText, BrainCircuit, Maximize2 } from 'lucide-react';
import { ChatMessage, UserContext } from '../types';
import { streamResponse } from '../services/geminiService';

interface ChatInterfaceProps {
  context: UserContext;
  themeColor: string;
  onBack: () => void;
}

// --- Theme Colors ---
const THEME_COLORS: Record<string, string> = {
  violet: '#8b5cf6',
  emerald: '#10b981',
  cyan: '#06b6d4',
  amber: '#f59e0b',
  rose: '#f43f5e',
  blue: '#3b82f6',
};

const THEME_RGBS: Record<string, string> = {
  violet: '139, 92, 246',
  emerald: '16, 185, 129',
  cyan: '6, 182, 212',
  amber: '245, 158, 11',
  rose: '244, 63, 94',
  blue: '59, 130, 246',
};

// --- Custom Node Components ---

const UserNode = ({ data }: { data: { label: string; themeColor: string; files?: string[] } }) => {
  const color = THEME_COLORS[data.themeColor] || '#fff';
  return (
    <div className="relative min-w-[300px] max-w-[400px]">
      <div className={`p-4 rounded-2xl bg-gray-900/80 backdrop-blur-md border border-gray-700 shadow-xl`}>
         <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-800">
            <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-white font-bold">U</div>
            <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Research Query</span>
         </div>
         {data.files && data.files.length > 0 && (
             <div className="mb-3 flex flex-wrap gap-2">
                 {data.files.map((f, i) => (
                     <span key={i} className="text-[10px] px-2 py-1 bg-gray-800 rounded text-gray-300 flex items-center gap-1">
                         <FileText size={10} /> {f}
                     </span>
                 ))}
             </div>
         )}
         <div className="text-sm text-gray-200 font-medium whitespace-pre-wrap leading-relaxed">
            {data.label}
         </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-gray-500 !w-3 !h-3 !-right-1.5" />
    </div>
  );
};

const ModelNode = ({ data }: { data: { label: string; themeColor: string; isThinking?: boolean } }) => {
  const color = THEME_COLORS[data.themeColor] || '#3b82f6';
  const rgb = THEME_RGBS[data.themeColor] || '59, 130, 246';
  
  return (
    <div className="relative min-w-[400px] max-w-[600px]">
      <Handle type="target" position={Position.Left} className="!bg-gray-500 !w-3 !h-3 !-left-1.5" />
      <div className={`rounded-2xl bg-[#0a0a0f]/90 backdrop-blur-xl border border-${data.themeColor}-500/30 shadow-2xl shadow-${data.themeColor}-900/20 overflow-hidden`}>
         <div className={`px-4 py-3 bg-${data.themeColor}-900/20 border-b border-${data.themeColor}-500/20 flex justify-between items-center`}>
            <div className="flex items-center gap-2">
                <div className={`p-1 rounded bg-${data.themeColor}-500/20 text-${data.themeColor}-400`}>
                    <BrainCircuit size={14} />
                </div>
                <span className={`text-xs font-mono text-${data.themeColor}-300 uppercase tracking-wider`}>SILLOGIC INTELLIGENCE</span>
            </div>
            <div className="flex gap-2">
                <button className="text-gray-500 hover:text-white transition-colors" title="Copy"><FileText size={14} /></button>
                <button className="text-gray-500 hover:text-white transition-colors" title="Export"><Download size={14} /></button>
            </div>
         </div>
         
         <div className="p-6">
            <div className="text-sm text-gray-300 font-light leading-7 whitespace-pre-wrap font-sans">
                {data.label || <span className="animate-pulse flex items-center gap-2"><span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></span> Thinking...</span>}
            </div>
         </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  userNode: UserNode,
  modelNode: ModelNode,
};

// --- Layout Hook ---
// Calculates positions: Users on Left (x=0), Models on Right (x=500)
// Vertically stacked based on the height of the previous row
const useAutoLayout = (nodes: Node[], setNodes: React.Dispatch<React.SetStateAction<Node[]>>) => {
    useEffect(() => {
        let currentY = 50;
        const GAP_Y = 50;
        const updates: {id: string, position: {x: number, y: number}}[] = [];
        let changed = false;

        // Group by "conversation turn" (User -> Model) roughly by ID order
        // This assumes alternating IDs or structured flow. 
        // We'll iterate simply: if it's a user node, place at left. If model, place at right, same Y.
        // Then increment Y by the MAX height of that row.
        
        // Since we don't know explicit pairs, we can assume a sequential flow.
        
        const sortedNodes = [...nodes].sort((a, b) => {
            // Sort roughly by Y if already set, or ID/creation time
             return parseInt(a.id) - parseInt(b.id); // Assuming timestamp IDs
        });

        // We need to wait for dimensions to be measured by React Flow
        // However, we can just stack them for now based on index if dimensions aren't ready
        // Real logic: Find the previous node, see its Y + Height.
        
        // Simple 2-column Timeline Layout
        // We will process nodes in pairs if possible
        
        let lastUserY = 0;
        let lastUserHeight = 0;
        
        for (let i = 0; i < sortedNodes.length; i++) {
            const node = sortedNodes[i];
            const isUser = node.type === 'userNode';
            
            // Dimensions are null initially
            const height = node.height || 150; 
            
            let x = 0;
            let y = 0;

            if (isUser) {
                // User Node starts a new "Row"
                // Y is after the previous interactions
                // But specifically, after the previous User node + its answer
                if (i > 0) {
                     // Find the bottom-most point of previous nodes
                     const prevNodes = sortedNodes.slice(0, i);
                     const maxY = Math.max(...prevNodes.map(n => n.position.y + (n.height || 150)));
                     currentY = maxY + GAP_Y;
                }
                x = 0;
                y = currentY;
                lastUserY = y;
                lastUserHeight = height;
            } else {
                // Model Node
                // Should align with the last User Node
                x = 500; 
                y = lastUserY; // Align tops
            }

            if (Math.abs(node.position.x - x) > 1 || Math.abs(node.position.y - y) > 1) {
                updates.push({ id: node.id, position: { x, y } });
                changed = true;
            }
        }

        if (changed) {
            setNodes((nds) => 
                nds.map((n) => {
                    const update = updates.find(u => u.id === n.id);
                    return update ? { ...n, position: update.position } : n;
                })
            );
        }
    }, [nodes.length, nodes.map(n => n.height).join(','), setNodes]); // Recalculate when node count or heights change
};


// --- Main Component ---

const ChatInterface: React.FC<ChatInterfaceProps> = ({ context, themeColor, onBack }) => {
  // State
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Message
  useEffect(() => {
     if (nodes.length === 0) {
        const welcomeId = Date.now().toString();
        const welcomeNode: Node = {
            id: welcomeId,
            type: 'modelNode',
            position: { x: 500, y: 50 },
            data: { 
                label: `### ${context.field} Workspace Initialized\n\nI am ready to assist with **${context.task}**.\n\nUpload papers (PDF), images, or datasets to begin analysis.`,
                themeColor 
            },
        };
        setNodes([welcomeNode]);
     }
  }, []);

  // Use layout hook
  useAutoLayout(nodes, setNodes);

  // File Handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };
  const removeFile = (index: number) => setFiles(prev => prev.filter((_, i) => i !== index));

  // Submit Handler
  const handleSubmit = async () => {
    if ((!input.trim() && files.length === 0) || isLoading) return;

    const userMsgId = Date.now().toString();
    const modelMsgId = (Date.now() + 1).toString();
    const currentInput = input;
    const currentFiles = [...files];
    
    // Clear Input
    setInput('');
    setFiles([]);
    setIsLoading(true);

    // 1. Create User Node
    const userNode: Node = {
        id: userMsgId,
        type: 'userNode',
        position: { x: 0, y: 0 }, // Layout hook will fix
        data: { 
            label: currentInput, 
            themeColor,
            files: currentFiles.map(f => f.name)
        },
    };

    // 2. Create Model Node (Loading)
    const modelNode: Node = {
        id: modelMsgId,
        type: 'modelNode',
        position: { x: 500, y: 0 }, // Layout hook will fix
        data: { label: '', themeColor, isThinking: true },
    };

    // 3. Create Edge
    const edge: Edge = {
        id: `e-${userMsgId}-${modelMsgId}`,
        source: userMsgId,
        target: modelMsgId,
        animated: true,
        style: { stroke: THEME_COLORS[themeColor] || '#fff', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: THEME_COLORS[themeColor] || '#fff' },
    };

    setNodes((nds) => [...nds, userNode, modelNode]);
    setEdges((eds) => [...eds, edge]);

    // 4. Stream Response
    // Construct history for API
    const history = nodes
        .filter(n => n.type === 'userNode' || n.type === 'modelNode')
        .map(n => ({
            role: n.type === 'userNode' ? 'user' : 'model',
            parts: [{ text: n.data.label }]
        }))
        .filter(h => h.parts[0].text !== ''); // Filter empty pending

    try {
        await streamResponse(
            history,
            currentInput,
            currentFiles,
            context as Required<UserContext>,
            (chunk) => {
                setNodes((nds) => nds.map(n => {
                    if (n.id === modelMsgId) {
                        return {
                            ...n,
                            data: {
                                ...n.data,
                                label: n.data.label + chunk,
                                isThinking: false
                            }
                        };
                    }
                    return n;
                }));
            }
        );
    } catch (e) {
        console.error(e);
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
      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#050505]/90 backdrop-blur-sm z-30 absolute top-0 w-full">
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
              <span className={`text-xs text-${themeColor}-300 font-mono opacity-80`}>{context.model}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-gray-500">
             <span className="flex items-center gap-1"><Maximize2 size={12}/> INFINITE CANVAS ENABLED</span>
        </div>
      </div>

      {/* React Flow Area */}
      <div className="flex-1 w-full h-full">
         <ReactFlowProvider>
             <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.1}
                maxZoom={2}
                defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
                className="bg-transparent"
             >
                <Background color="#222" gap={20} size={1} />
                <Controls className="!bg-gray-900 !border-gray-800 !fill-white" />
             </ReactFlow>
         </ReactFlowProvider>
      </div>

      {/* Input Overlay */}
      <div className="p-4 bg-[#050505] border-t border-white/10 relative z-30">
        
        {/* File Chips */}
        {files.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
                {files.map((file, i) => (
                    <div key={i} className={`flex items-center gap-2 bg-${themeColor}-900/30 border border-${themeColor}-500/30 px-3 py-1 rounded-full text-xs text-${themeColor}-200`}>
                        <FileText size={12} />
                        <span className="max-w-[150px] truncate">{file.name}</span>
                        <button onClick={() => removeFile(i)} className="hover:text-white"><X size={12} /></button>
                    </div>
                ))}
            </div>
        )}

        <div className="relative group max-w-4xl mx-auto">
            <div className={`absolute -inset-0.5 bg-gradient-to-r from-${themeColor}-600 to-blue-600 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur`}></div>
            <div className="relative flex items-end gap-2 bg-[#0c0c0e] rounded-xl p-2 border border-white/10">
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
                  onClick={() => handleSubmit()}
                  disabled={(isLoading || (!input.trim() && files.length === 0))}
                  className={`p-3 mb-1 bg-${themeColor}-600 hover:bg-${themeColor}-500 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-${themeColor}-900/20`}
                >
                  {isLoading ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                </button>
            </div>
        </div>
        <div className="mt-2 flex justify-between px-2 text-[10px] text-gray-700 font-mono uppercase tracking-widest max-w-4xl mx-auto">
            <span>SILLOGIC v3.1 // INFINITE FLOW</span>
            <span>SECURE ENCRYPTED CONNECTION</span>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;