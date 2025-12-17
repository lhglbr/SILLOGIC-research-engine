import React, { useState, useMemo, useRef, useEffect } from 'react';
import ParticleBackground from './components/ParticleBackground';
import ChatInterface from './components/ChatInterface';
import { PricingModal } from './components/PricingModal';
import { AppView, ResearchField, ResearchTask, ModelProvider, UserContext, ChatSession, AuthStrategy, SubscriptionTier } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Atom, Microscope, Binary, Sigma, Users, Globe, ChevronRight, BrainCircuit, Sparkles, FileSearch, FileText, PenTool, BarChart, TestTube, Code, Feather, PieChart, Network, Check, ChevronDown, Cpu, Zap, Box, Wrench, Flame, MessageSquare, Hexagon, Grid, Layers, Moon, Sun, Languages, Plus, History, Menu, Trash2, Layout, PanelLeftClose, LogOut, User, Crown, Gem, Eraser } from 'lucide-react';

// --- Localization Resources ---

const APP_TEXT = {
  en: {
    landingTitle: "ProtoChat",
    landingSubtitle: "The ultimate research companion.",
    initResearch: "Initialize Research",
    footer: "Powered by Gemini • Three.js • React",
    selectFieldTitle: "Select Research Discipline",
    selectFieldSubtitle: "Define the broad academic context for the AI model.",
    cancel: "Cancel",
    workspaceTitle: "Workspace",
    selectToolSubtitle: "Select a specialized research tool for this domain.",
    toolsTitle: "Research Tools",
    engineClusterTitle: "Engine Cluster",
    engineClusterSubtitle: "Select up to 3 for comparison",
    selectedEngines: "Selected Engines",
    selectModels: "Select Models",
    modelCount: (c: number) => `${c} Model${c > 1 ? 's' : ''} Selected`,
    maxModels: "MAXIMUM 3 MODELS SIMULTANEOUSLY",
    back: "← Back",
    launch: "Launch Workspace",
    newChat: "New Chat",
    history: "History",
    noHistory: "No saved sessions",
    today: "Today",
    logout: "Reset Session",
    profile: "Profile",
    upgrade: "Upgrade Plan",
    plan: "Plan",
    clearHistory: "Clear All History",
    confirmClear: "Are you sure you want to delete all chat history? This cannot be undone.",
    storageFull: "Storage Quota Exceeded. Please delete some old chats."
  },
  zh: {
    landingTitle: "ProtoChat",
    landingSubtitle: "您的终极科研伴侣。",
    initResearch: "开始研究",
    footer: "由 Gemini • Three.js • React 驱动",
    selectFieldTitle: "选择研究学科",
    selectFieldSubtitle: "为 AI 模型定义广泛的学术背景。",
    cancel: "取消",
    workspaceTitle: "工作区",
    selectToolSubtitle: "为此领域选择专门的研究工具。",
    toolsTitle: "研究工具",
    engineClusterTitle: "引擎集群",
    engineClusterSubtitle: "最多选择 3 个进行对比",
    selectedEngines: "已选引擎",
    selectModels: "选择模型",
    modelCount: (c: number) => `已选 ${c} 个模型`,
    maxModels: "同时最多支持 3 个模型",
    back: "← 返回",
    launch: "启动工作区",
    newChat: "新对话",
    history: "历史记录",
    noHistory: "暂无历史记录",
    today: "今天",
    logout: "重置会话",
    profile: "个人资料",
    upgrade: "升级方案",
    plan: "方案",
    clearHistory: "清空历史记录",
    confirmClear: "确定要删除所有聊天记录吗？此操作无法撤销。",
    storageFull: "本地存储空间已满，请删除旧的聊天记录。"
  }
};

const FIELD_LABELS = {
  en: {
    [ResearchField.PHYSICAL]: "Physical Sciences",
    [ResearchField.LIFE]: "Life Sciences",
    [ResearchField.FORMAL]: "Formal Sciences",
    [ResearchField.ENGINEERING]: "Engineering & Tech",
    [ResearchField.SOCIAL]: "Social Sciences",
    [ResearchField.GENERAL]: "General Research"
  },
  zh: {
    [ResearchField.PHYSICAL]: "物理科学",
    [ResearchField.LIFE]: "生命科学",
    [ResearchField.FORMAL]: "形式科学",
    [ResearchField.ENGINEERING]: "工程与技术",
    [ResearchField.SOCIAL]: "社会科学",
    [ResearchField.GENERAL]: "综合研究"
  }
};

// --- Configuration Helper ---

const getFieldConfig = (lang: 'en' | 'zh') => {
  const isZh = lang === 'zh';
  return {
    [ResearchField.PHYSICAL]: {
      color: 'violet',
      icon: Atom,
      label: FIELD_LABELS[lang][ResearchField.PHYSICAL],
      description: isZh ? "物理学、化学、天文学、地球科学" : "Physics, Chemistry, Astronomy, Earth Sciences",
      themeClass: "from-violet-500 to-purple-600",
      borderClass: "dark:border-violet-500/50 border-violet-500/30",
      bgClass: "dark:bg-violet-900/20 bg-violet-100/50",
      tasks: [
        { id: ResearchTask.DEEP_SEARCH, title: isZh ? "深度文献综述" : "Literature Review", desc: isZh ? "ArXiv/APS 综合研究" : "ArXiv/APS synthesis", icon: FileSearch },
        { id: ResearchTask.DATA_ANALYSIS, title: isZh ? "实验数据分析" : "Experimental Data", desc: isZh ? "分析原始数据集" : "Analyze raw datasets", icon: BarChart },
        { id: ResearchTask.CAD_DESIGN, title: isZh ? "仪器设计" : "Instrument Design", desc: isZh ? "原理图与蓝图" : "Schematics & Blueprints", icon: Grid },
      ]
    },
    [ResearchField.LIFE]: {
      color: 'emerald',
      icon: Microscope,
      label: FIELD_LABELS[lang][ResearchField.LIFE],
      description: isZh ? "生物学、医学、遗传学、生态学" : "Biology, Medicine, Genetics, Ecology",
      themeClass: "from-emerald-400 to-green-600",
      borderClass: "dark:border-emerald-500/50 border-emerald-500/30",
      bgClass: "dark:bg-emerald-900/20 bg-emerald-100/50",
      tasks: [
        { id: ResearchTask.DEEP_SEARCH, title: isZh ? "方案与实验搜索" : "Protocol Search", desc: isZh ? "方法论与临床试验" : "Methods & Clinical trials", icon: FileSearch },
        { id: ResearchTask.DATA_ANALYSIS, title: isZh ? "生物数据分析" : "Bio-Data Analysis", desc: isZh ? "基因组/蛋白质组数据" : "Genomic/Proteomic data", icon: TestTube },
        { id: ResearchTask.PAPER_EDITING, title: isZh ? "论文润色" : "Manuscript Polish", desc: isZh ? "高影响力期刊格式" : "Format for high-impact journals", icon: PenTool },
      ]
    },
    [ResearchField.FORMAL]: {
      color: 'cyan',
      icon: Binary,
      label: FIELD_LABELS[lang][ResearchField.FORMAL],
      description: isZh ? "数学、计算机科学、逻辑学、统计学" : "Mathematics, Computer Science, Logic, Statistics",
      themeClass: "from-cyan-400 to-blue-600",
      borderClass: "dark:border-cyan-500/50 border-cyan-500/30",
      bgClass: "dark:bg-cyan-900/20 bg-cyan-100/50",
      tasks: [
        { id: ResearchTask.IDEA_GENERATION, title: isZh ? "证明助手" : "Proof Assistant", desc: isZh ? "验证逻辑与定理" : "Verify logic & theorems", icon: BrainCircuit },
        { id: ResearchTask.DATA_ANALYSIS, title: isZh ? "算法分析" : "Algorithm Analysis", desc: isZh ? "优化代码与复杂度" : "Optimize code & complexity", icon: Code },
        { id: ResearchTask.PAPER_READING, title: isZh ? "技术拆解" : "Technical Breakdown", desc: isZh ? "简化复杂论文" : "Simplify complex papers", icon: FileText },
      ]
    },
    [ResearchField.ENGINEERING]: {
      color: 'amber',
      icon: Wrench,
      label: FIELD_LABELS[lang][ResearchField.ENGINEERING],
      description: isZh ? "土木、机械、电气、化学工程" : "Civil, Mechanical, Electrical, Chemical Engineering",
      themeClass: "from-amber-400 to-orange-600",
      borderClass: "dark:border-amber-500/50 border-amber-500/30",
      bgClass: "dark:bg-amber-900/20 bg-amber-100/50",
      tasks: [
        { id: ResearchTask.CAD_DESIGN, title: isZh ? "CAD 与原理图" : "CAD & Schematics", desc: isZh ? "电路、PCB、平面图" : "Circuits, PCBs, Floorplans", icon: Layers },
        { id: ResearchTask.IDEA_GENERATION, title: isZh ? "系统设计" : "System Design", desc: isZh ? "架构解决方案" : "Architectural solutions", icon: Sparkles },
        { id: ResearchTask.PAPER_EDITING, title: isZh ? "技术报告" : "Technical Report", desc: isZh ? "文档与提案" : "Documentation & proposals", icon: PenTool },
      ]
    },
    [ResearchField.SOCIAL]: {
      color: 'rose',
      icon: Users,
      label: FIELD_LABELS[lang][ResearchField.SOCIAL],
      description: isZh ? "心理学、社会学、经济学、政治学" : "Psychology, Sociology, Economics, Political Science",
      themeClass: "from-rose-400 to-pink-600",
      borderClass: "dark:border-rose-500/50 border-rose-500/30",
      bgClass: "dark:bg-rose-900/20 bg-rose-100/50",
      tasks: [
        { id: ResearchTask.DEEP_SEARCH, title: isZh ? "定性综合" : "Qualitative Synthesis", desc: isZh ? "元分析与理论" : "Meta-analysis & Theory", icon: Feather },
        { id: ResearchTask.DATA_ANALYSIS, title: isZh ? "统计分析" : "Statistical Analysis", desc: isZh ? "SPSS/R/Stata 解释" : "SPSS/R/Stata interpretation", icon: PieChart },
        { id: ResearchTask.IDEA_GENERATION, title: isZh ? "方法论设计" : "Methodology Design", desc: isZh ? "调查与实验设置" : "Survey & experiment setup", icon: Users },
      ]
    },
    [ResearchField.GENERAL]: {
      color: 'blue',
      icon: Globe,
      label: FIELD_LABELS[lang][ResearchField.GENERAL],
      description: isZh ? "跨学科与综合研究" : "Interdisciplinary & General Studies",
      themeClass: "from-blue-400 to-indigo-600",
      borderClass: "dark:border-blue-500/50 border-blue-500/30",
      bgClass: "dark:bg-blue-900/20 bg-blue-100/50",
      tasks: [
        { id: ResearchTask.DEEP_SEARCH, title: isZh ? "深度研究" : "Deep Research", desc: isZh ? "综合综述" : "Comprehensive review", icon: FileSearch },
        { id: ResearchTask.CAD_DESIGN, title: isZh ? "蓝图生成" : "Blueprint Gen", desc: isZh ? "生成技术图纸" : "Generate technical drawings", icon: Grid },
        { id: ResearchTask.PAPER_EDITING, title: isZh ? "学术编辑" : "Academic Editing", desc: isZh ? "润色写作" : "Polish writing", icon: PenTool },
        { id: ResearchTask.DATA_ANALYSIS, title: isZh ? "数据分析" : "Data Analysis", desc: isZh ? "统计咨询" : "Statistical consulting", icon: BarChart },
        { id: ResearchTask.IDEA_GENERATION, title: isZh ? "假设生成" : "Hypothesis Gen", desc: isZh ? "头脑风暴" : "Brainstorming ideas", icon: Sparkles },
      ]
    },
  };
};

const getModelsList = (lang: 'en' | 'zh') => {
  const isZh = lang === 'zh';
  return [
    // Google
    { id: ModelProvider.GEMINI_FLASH, name: "Gemini 2.5 Flash", desc: isZh ? "Google • 快速 & 多模态" : "Google • Fast & Multimodal", icon: Zap },
    { id: ModelProvider.GEMINI_PRO, name: "Gemini 3.0 Pro", desc: isZh ? "Google • 复杂推理" : "Google • Complex Reasoning", icon: Cpu },
    { id: ModelProvider.GEMINI_THINKING, name: "Gemini 3.0 Thinking", desc: isZh ? "Google • 深度逻辑" : "Google • Deep Logic", icon: BrainCircuit },
    
    // OpenAI
    { id: ModelProvider.OPENAI_GPT4O, name: "GPT-4o", desc: isZh ? "OpenAI • 全能模型" : "OpenAI • Omni Model", icon: MessageSquare },
    { id: ModelProvider.OPENAI_O1, name: "o1-preview", desc: isZh ? "OpenAI • 推理链" : "OpenAI • Reasoning Chain", icon: Sparkles },

    // Anthropic
    { id: ModelProvider.CLAUDE_3_5_SONNET, name: "Claude 3.5 Sonnet", desc: isZh ? "Anthropic • 编码 & 细节" : "Anthropic • Coding & Nuance", icon: Hexagon },

    // DeepSeek
    { id: ModelProvider.DEEPSEEK_V3, name: "DeepSeek V3", desc: isZh ? "DeepSeek • 高效 SOTA" : "DeepSeek • Efficient SOTA", icon: Flame },
    { id: ModelProvider.DEEPSEEK_R1, name: "DeepSeek R1", desc: isZh ? "DeepSeek • 数学专家" : "DeepSeek • Math Specialist", icon: Binary },

    // Groq / Meta
    { id: ModelProvider.GROQ_LLAMA_3, name: "Llama 3 70B", desc: isZh ? "Meta/Groq • 超低延迟" : "Meta/Groq • Ultra Low Latency", icon: Zap },
  ];
};

// --- Components ---

const ModelDropdown: React.FC<{ 
  selectedModels: ModelProvider[], 
  onToggle: (id: ModelProvider) => void,
  themeColor: string, 
  lang: 'en' | 'zh',
  modelsList: any[]
}> = ({ selectedModels, onToggle, themeColor, lang, modelsList }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const txt = APP_TEXT[lang];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex justify-between items-center glass-panel p-4 rounded-xl border transition-all ${isOpen ? `dark:border-${themeColor}-500 border-${themeColor}-400 dark:bg-white/5 bg-gray-50` : 'dark:border-white/10 border-black/5 hover:border-black/20 dark:hover:border-white/30'}`}
      >
        <div className="flex items-center gap-3">
          <Box size={20} className={`text-${themeColor}-500 dark:text-${themeColor}-400`} />
          <div className="text-left">
            <div className="text-sm font-bold text-gray-800 dark:text-gray-200">{txt.selectedEngines}</div>
            <div className={`text-xs text-${themeColor}-600 dark:text-${themeColor}-400`}>
              {selectedModels.length > 0 
                ? txt.modelCount(selectedModels.length)
                : txt.selectModels}
            </div>
          </div>
        </div>
        <ChevronDown size={18} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0c0c0e] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto">
          {modelsList.map((model) => {
            const isSelected = selectedModels.includes(model.id);
            return (
              <button
                key={model.id}
                onClick={() => onToggle(model.id)}
                className={`w-full flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${isSelected ? `dark:bg-${themeColor}-900/10 bg-${themeColor}-50` : ''}`}
              >
                 <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? `bg-${themeColor}-100 dark:bg-${themeColor}-500/20 text-${themeColor}-600 dark:text-${themeColor}-400` : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400'}`}>
                        <model.icon size={18} />
                    </div>
                    <div className="text-left">
                        <div className={`text-sm font-semibold ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>{model.name}</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-500 uppercase tracking-wider">{model.desc}</div>
                    </div>
                 </div>
                 <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? `bg-${themeColor}-500 border-${themeColor}-500 text-white` : 'border-gray-300 dark:border-gray-700'}`}>
                    {isSelected && <Check size={14} strokeWidth={3} />}
                 </div>
              </button>
            );
          })}
          <div className="p-2 bg-gray-50 dark:bg-black/40 text-[10px] text-gray-500 text-center border-t border-gray-100 dark:border-white/5">
             {txt.maxModels}
          </div>
        </div>
      )}
    </div>
  );
};

const ThemeToggle: React.FC<{ isDarkMode: boolean, toggle: () => void }> = ({ isDarkMode, toggle }) => (
  <button 
    onClick={toggle}
    className="p-2 rounded-full glass-panel hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors shadow-lg"
    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
  >
    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
  </button>
);

const LanguageToggle: React.FC<{ lang: 'en' | 'zh', toggle: () => void }> = ({ lang, toggle }) => (
  <button 
    onClick={toggle}
    className="p-2 rounded-full glass-panel hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors shadow-lg flex items-center justify-center gap-1 font-mono text-xs font-bold w-10 h-10"
    title="Switch Language"
  >
    {lang === 'en' ? 'EN' : 'ZH'}
  </button>
);

const Sidebar: React.FC<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  sessions: Record<string, ChatSession>;
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onClearHistory: () => void;
  lang: 'en' | 'zh';
  isDarkMode: boolean;
  toggleTheme: () => void;
  toggleLang: () => void;
  themeColor: string;
  fieldConfig: any;
  onUpgrade: () => void;
}> = ({ isOpen, setIsOpen, sessions, currentSessionId, onSelectSession, onNewChat, onDeleteSession, onClearHistory, lang, isDarkMode, toggleTheme, toggleLang, themeColor, fieldConfig, onUpgrade }) => {
    const txt = APP_TEXT[lang];
    const sessionList = (Object.values(sessions) as ChatSession[]).sort((a, b) => b.timestamp - a.timestamp);
    const { user, logout, strategy } = useAuth();
    
    // Determine badge color based on tier
    const getTierColor = (tier: string) => {
        if (tier === SubscriptionTier.TEAM) return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
        if (tier === SubscriptionTier.PRO) return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
        return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    };

    return (
        <>
            {/* Backdrop for mobile closing */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
            
            <div className={`fixed inset-y-0 left-0 z-40 bg-gray-100/95 dark:bg-[#0c0c0e]/95 backdrop-blur-xl border-r border-gray-200 dark:border-white/10 transition-transform duration-300 flex flex-col w-72 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
                {/* User Profile Section */}
                <div className="p-4 bg-gray-200/50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                   <div className="flex items-center gap-3 mb-3">
                       {user?.avatar ? (
                           <img src={user.avatar} className="w-10 h-10 rounded-full border border-gray-300 dark:border-white/20" alt="Avatar"/>
                       ) : (
                           <div className={`w-10 h-10 rounded-full bg-${themeColor}-600 flex items-center justify-center text-white font-bold`}>
                               {user?.name?.[0] || 'U'}
                           </div>
                       )}
                       <div className="min-w-0 flex-1">
                           <div className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.name}</div>
                           <div className="flex items-center gap-2 mt-0.5">
                               <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getTierColor(user?.tier || SubscriptionTier.FREE)} uppercase`}>
                                   {user?.tier || 'FREE'}
                               </span>
                           </div>
                       </div>
                   </div>

                   {/* Subscription Actions */}
                   <div className="grid grid-cols-2 gap-2 mb-3">
                       <button 
                           onClick={onUpgrade}
                           className="py-1.5 rounded bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wide hover:shadow-lg transition-all flex items-center justify-center gap-1"
                       >
                           <Crown size={12} /> {txt.upgrade}
                       </button>
                       <button 
                           onClick={() => logout()}
                           className="py-1.5 rounded bg-gray-300/50 dark:bg-white/5 hover:bg-red-500 hover:text-white dark:hover:bg-red-900/50 transition-colors text-[10px] font-bold uppercase tracking-wide text-gray-600 dark:text-gray-300 flex items-center justify-center gap-1"
                       >
                           <LogOut size={12}/> {txt.logout}
                       </button>
                   </div>
                </div>

                <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between gap-2">
                    <button 
                        onClick={onNewChat}
                        className={`flex-1 py-2 px-3 bg-${themeColor}-600 hover:bg-${themeColor}-500 text-white rounded-lg flex items-center justify-center gap-2 transition-colors font-semibold shadow-lg shadow-${themeColor}-500/20`}
                    >
                        <Plus size={18} />
                        <span className="text-sm">{txt.newChat}</span>
                    </button>
                    <button 
                        onClick={() => setIsOpen(false)} 
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-gray-500"
                    >
                        <PanelLeftClose size={18} />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-2">
                    <div className="flex items-center justify-between px-2 mb-2 mt-2">
                         <div className="text-xs font-bold text-gray-500 uppercase">{txt.history}</div>
                         {sessionList.length > 0 && (
                             <button onClick={onClearHistory} className="text-gray-400 hover:text-red-500 transition-colors" title={txt.clearHistory}>
                                 <Eraser size={12} />
                             </button>
                         )}
                    </div>
                    {sessionList.length === 0 ? (
                        <div className="text-center text-gray-400 dark:text-gray-600 text-sm py-4">{txt.noHistory}</div>
                    ) : (
                        sessionList.map(session => {
                            const sField = session.field ? fieldConfig[session.field] : fieldConfig[ResearchField.GENERAL];
                            // Use session color if we aren't overriding, otherwise use global override
                            const sColor = sField.color; 
                            
                            return (
                                <div 
                                    key={session.id}
                                    onClick={() => {
                                        onSelectSession(session.id);
                                        if (window.innerWidth < 768) setIsOpen(false); // Auto close on mobile
                                    }}
                                    className={`group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors mb-1 ${session.id === currentSessionId ? `bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white` : 'hover:bg-gray-200 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400'}`}
                                >
                                    <div className={`shrink-0 p-1.5 rounded-md bg-${sColor}-100 dark:bg-${sColor}-900/30 text-${sColor}-600 dark:text-${sColor}-400`}>
                                        <sField.icon size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium truncate">{session.title || txt.newChat}</div>
                                        <div className="text-[10px] opacity-60 truncate flex items-center gap-1">
                                            <span>{new Date(session.timestamp).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>{sField.label}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => onDeleteSession(session.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-500 rounded transition-all"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between bg-gray-50/50 dark:bg-white/5">
                    <ThemeToggle isDarkMode={isDarkMode} toggle={toggleTheme} />
                    <LanguageToggle lang={lang} toggle={toggleLang} />
                </div>
            </div>
        </>
    );
};


// --- Main App Content (Inner) ---

const AppContent: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [context, setContext] = useState<UserContext>({
    models: [ModelProvider.GEMINI_FLASH],
    language: 'en'
  });
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [customTheme, setCustomTheme] = useState<string | null>(null);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  const { isAuthenticated, isLoading, user } = useAuth();

  // Dynamic Configs based on Language
  const fieldConfig = useMemo(() => getFieldConfig(context.language), [context.language]);
  const modelsList = useMemo(() => getModelsList(context.language), [context.language]);
  const txt = APP_TEXT[context.language];

  // --- Session Management & Persistence ---
  
  // 1. Initialize from LocalStorage
  const [sessions, setSessions] = useState<Record<string, ChatSession>>(() => {
    try {
        const saved = localStorage.getItem('protochat_sessions_v1');
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        console.error("Failed to load sessions from local storage", e);
        return {};
    }
  });

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // 2. Persist to LocalStorage on change
  useEffect(() => {
    try {
        localStorage.setItem('protochat_sessions_v1', JSON.stringify(sessions));
    } catch (e) {
        console.error("Storage quota exceeded", e);
        // Optional: Trigger a toast or alert here if needed
    }
  }, [sessions]);

  // Theme Logic
  const fieldTheme = context.field ? fieldConfig[context.field] : fieldConfig[ResearchField.GENERAL];
  const activeThemeColor = customTheme || fieldTheme.color;

  // --- Auth Gating ---
  if (isLoading) {
      return (
          <div className="w-full h-screen bg-black flex items-center justify-center text-blue-500">
             <div className="flex flex-col items-center gap-4">
                 <div className="w-12 h-12 border-t-4 border-blue-500 rounded-full animate-spin"></div>
                 <div className="font-mono text-xs tracking-widest uppercase">Initializing Secure Session</div>
             </div>
          </div>
      );
  }
  
  // NOTE: Authentication check has been removed to bypass login screen. 
  // AuthContext now initializes with a default user.

  const toggleModel = (modelId: ModelProvider) => {
    setContext(prev => {
      const current = prev.models;
      if (current.includes(modelId)) {
        if (current.length === 1) return prev; // Must have at least one
        return { ...prev, models: current.filter(id => id !== modelId) };
      } else {
        if (current.length >= 3) return prev; // Max 3
        return { ...prev, models: [...current, modelId] };
      }
    });
  };

  const toggleLanguage = () => {
      setContext(prev => ({ ...prev, language: prev.language === 'en' ? 'zh' : 'en' }));
  };

  // --- Session Handlers ---
  
  const createNewSession = () => {
      const newId = Date.now().toString();
      const newSession: ChatSession = {
          id: newId,
          title: "New Research",
          timestamp: Date.now(),
          history: [],
          activeModels: context.models,
          field: context.field, // Save context to session
          task: context.task,
          knowledgeBase: [] // Initialize empty KB
      };
      setSessions(prev => ({ ...prev, [newId]: newSession }));
      setActiveSessionId(newId);
  };

  const updateSession = (id: string, data: Partial<ChatSession>) => {
      setSessions(prev => {
          const session = prev[id];
          if (!session) return prev;
          
          let title = session.title;
          if (data.history && data.history.length > 0 && session.title === "New Research") {
              const firstUserMsg = data.history.find(m => m.role === 'user');
              if (firstUserMsg) {
                  title = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
              }
          }

          return {
              ...prev,
              [id]: { ...session, ...data, title }
          };
      });
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setSessions(prev => {
          const next = { ...prev };
          delete next[id];
          return next;
      });
      if (activeSessionId === id) {
          setActiveSessionId(null);
      }
  };

  const clearAllHistory = () => {
      if (window.confirm(txt.confirmClear)) {
          setSessions({});
          setActiveSessionId(null);
          localStorage.removeItem('protochat_sessions_v1');
      }
  };

  // Switch session and restore context (field/task/models)
  const handleSelectSession = (id: string) => {
      const session = sessions[id];
      if (session) {
          setActiveSessionId(id);
          setContext(prev => ({
              ...prev,
              field: session.field || prev.field,
              task: session.task || prev.task,
              models: session.activeModels || prev.models
          }));
          // Ensure we go to workspace if selecting from sidebar
          setView(AppView.WORKSPACE);
      }
  };

  const handleLaunch = () => {
      if (!activeSessionId) {
        createNewSession();
      } else {
        // Ensure the active session inherits the selected models from the setup screen
        updateSession(activeSessionId, { activeModels: context.models });
      }
      setView(AppView.WORKSPACE);
      setSidebarOpen(true);
  };

  // --- Views ---

  const LandingView = () => (
    <div className="h-screen flex flex-col justify-center items-center z-10 relative px-4 text-center">
      {/* Container for content with Glass Effect */}
      <div className="p-12 rounded-3xl border border-white/20 bg-white/10 dark:bg-black/20 backdrop-blur-lg shadow-2xl flex flex-col items-center max-w-4xl w-full mx-4">
          <div className="mb-6 p-4 bg-white/50 dark:bg-white/5 rounded-full border border-black/5 dark:border-white/10 backdrop-blur-sm animate-pulse shadow-lg dark:shadow-none">
            <BrainCircuit className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-gray-800 to-blue-600 dark:from-blue-200 dark:via-white dark:to-blue-200 text-center tracking-tighter mb-6 font-mono drop-shadow-sm">
            {txt.landingTitle}
          </h1>
          <p className="text-gray-800 dark:text-gray-200 text-lg md:text-xl max-w-2xl text-center mb-12 font-light leading-relaxed">
            {txt.landingSubtitle}
          </p>
          <button 
            onClick={() => setView(AppView.FIELD_SELECT)}
            className="group relative px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-lg rounded-full hover:bg-gray-800 dark:hover:bg-blue-50 transition-all duration-300 flex items-center gap-2 overflow-hidden shadow-xl"
          >
            <span className="relative z-10">{txt.initResearch}</span>
            <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-emerald-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
          </button>
      </div>

      <div className="absolute bottom-8 text-xs text-gray-500 dark:text-gray-600 font-mono">
        {txt.footer}
      </div>
    </div>
  );

  const FieldSelectView = () => (
    <div className="h-screen flex flex-col items-center justify-center z-10 relative p-8">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{txt.selectFieldTitle}</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-10">{txt.selectFieldSubtitle}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl w-full">
        {(Object.keys(fieldConfig) as ResearchField[]).map((fieldKey) => {
          const config = fieldConfig[fieldKey];
          return (
            <button
              key={fieldKey}
              onClick={() => {
                setContext({ ...context, field: fieldKey });
                // Reset active session so we start fresh for this new field
                setActiveSessionId(null);
                setView(AppView.TASK_SELECT);
              }}
              className={`group glass-panel p-6 rounded-xl transition-all text-left flex items-start gap-4 border dark:border-white/5 border-black/5 hover:${config.borderClass} hover:bg-white/40 dark:hover:bg-white/5`}
            >
              <div className={`p-3 rounded-lg bg-black/5 dark:bg-white/5 group-hover:bg-transparent transition-colors`}>
                <config.icon size={24} className={`text-gray-600 dark:text-gray-400 group-hover:text-${config.color}-600 dark:group-hover:text-${config.color}-400 transition-colors`} />
              </div>
              <div>
                <h3 className={`text-lg font-semibold text-gray-800 dark:text-gray-200 group-hover:text-${config.color}-600 dark:group-hover:text-${config.color}-400 transition-colors`}>{config.label}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-500 mt-1">{config.description}</p>
              </div>
            </button>
          );
        })}
      </div>
      <button onClick={() => setView(AppView.LANDING)} className="mt-12 text-gray-500 hover:text-gray-900 dark:hover:text-white text-sm">{txt.cancel}</button>
    </div>
  );

  const TaskSelectView = () => (
    <div className="h-screen flex flex-col items-center justify-center z-10 relative p-8">
      <div className="max-w-5xl w-full">
        <div className="flex items-center gap-3 mb-2">
            <fieldTheme.icon className={`text-${activeThemeColor}-600 dark:text-${activeThemeColor}-400`} size={28} />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{fieldTheme.label} {txt.workspaceTitle}</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-8">{txt.selectToolSubtitle}</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Tasks Column */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold mb-4">{txt.toolsTitle}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fieldTheme.tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setContext(prev => ({ ...prev, task: task.id }))}
                  className={`glass-panel p-4 rounded-xl text-left transition-all border ${context.task === task.id ? `dark:bg-${activeThemeColor}-900/20 bg-${activeThemeColor}-100/50 dark:border-${activeThemeColor}-500/50 border-${activeThemeColor}-500/30` : 'dark:border-white/5 border-black/5 hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <task.icon size={20} className={context.task === task.id ? `text-${activeThemeColor}-600 dark:text-${activeThemeColor}-400` : 'text-gray-500 dark:text-gray-400'} />
                    <span className="font-semibold text-gray-900 dark:text-white">{task.title}</span>
                  </div>
                  <p className="text-xs text-gray-500">{task.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Models Column */}
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold">{txt.engineClusterTitle}</h3>
               <span className="text-xs text-gray-500">{txt.engineClusterSubtitle}</span>
            </div>
            
            <ModelDropdown 
              selectedModels={context.models} 
              onToggle={toggleModel} 
              themeColor={activeThemeColor}
              lang={context.language}
              modelsList={modelsList}
            />

            {/* Selected Chips Preview */}
            <div className="mt-4 flex flex-col gap-2">
              {context.models.map(mId => {
                const model = modelsList.find(m => m.id === mId);
                return (
                  <div key={mId} className="flex items-center gap-2 p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div className={`w-2 h-2 rounded-full bg-${activeThemeColor}-500 shadow shadow-${activeThemeColor}-500/50`}></div>
                    <span className="text-xs text-gray-600 dark:text-gray-300 font-mono">{model?.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-between items-center border-t border-gray-200 dark:border-white/10 pt-8">
          <button onClick={() => setView(AppView.FIELD_SELECT)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">{txt.back}</button>
          <button 
            disabled={!context.task}
            onClick={handleLaunch}
            className={`px-8 py-3 bg-${activeThemeColor}-600 hover:bg-${activeThemeColor}-500 disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-800 dark:disabled:text-gray-500 text-white font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg`}
          >
            {txt.launch} <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-full w-full`}>
      <div className="relative min-h-screen text-gray-900 dark:text-gray-100 font-sans selection:bg-blue-500/30 bg-gray-50 dark:bg-black transition-colors duration-500">
        <ParticleBackground field={context.field} themeColor={activeThemeColor} isDarkMode={isDarkMode} />
        
        {showPricing && (
            <PricingModal 
                lang={context.language} 
                onClose={() => setShowPricing(false)} 
                currentTier={user?.tier || SubscriptionTier.FREE}
            />
        )}

        {/* Global Controls - Only visible when NOT in workspace */}
        {view !== AppView.WORKSPACE && (
            <div className="fixed left-6 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-2">
                <ThemeToggle isDarkMode={isDarkMode} toggle={() => setIsDarkMode(!isDarkMode)} />
                <LanguageToggle lang={context.language} toggle={toggleLanguage} />
            </div>
        )}

        {/* View Router */}
        {view === AppView.LANDING && <LandingView />}
        {view === AppView.FIELD_SELECT && <FieldSelectView />}
        {view === AppView.TASK_SELECT && <TaskSelectView />}
        
        {view === AppView.WORKSPACE && (
          <div className="flex h-screen w-full relative">
            {/* Sidebar (Floating on Mobile, Docked on Desktop) */}
            <Sidebar 
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
                sessions={sessions}
                currentSessionId={activeSessionId || ''}
                onSelectSession={handleSelectSession}
                onNewChat={createNewSession}
                onDeleteSession={deleteSession}
                onClearHistory={clearAllHistory}
                lang={context.language}
                isDarkMode={isDarkMode}
                toggleTheme={() => setIsDarkMode(!isDarkMode)}
                toggleLang={toggleLanguage}
                themeColor={activeThemeColor}
                fieldConfig={fieldConfig}
                onUpgrade={() => setShowPricing(true)}
            />

            {/* Chat Interface - Pushed by Sidebar on Desktop, Full width on Mobile */}
            <div className={`flex-1 flex flex-col h-full transition-all duration-300 w-full ${sidebarOpen ? 'md:ml-72' : 'ml-0'}`}>
                {activeSessionId && sessions[activeSessionId] ? (
                    <ChatInterface 
                        key={activeSessionId} // Forces remount when switching sessions
                        context={context} 
                        themeColor={activeThemeColor}
                        isDarkMode={isDarkMode}
                        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
                        customTheme={customTheme}
                        onSetCustomTheme={setCustomTheme}
                        initialSessionData={sessions[activeSessionId]}
                        onUpdateSession={(data) => updateSession(activeSessionId, data)}
                        onBack={() => setView(AppView.TASK_SELECT)} 
                        onToggleLanguage={toggleLanguage}
                        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                         <button onClick={createNewSession} className="px-4 py-2 bg-blue-600 text-white rounded">Create Session</button>
                    </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- App Wrapper with Providers ---
const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    )
}

export default App;