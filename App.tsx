import React, { useState, useMemo, useRef, useEffect } from 'react';
import ParticleBackground from './components/ParticleBackground';
import ChatInterface from './components/ChatInterface';
import { AppView, ResearchField, ResearchTask, ModelProvider, UserContext } from './types';
import { Atom, Microscope, Binary, Sigma, Users, Globe, ChevronRight, BrainCircuit, Sparkles, FileSearch, FileText, PenTool, BarChart, TestTube, Code, Feather, PieChart, Network, Check, ChevronDown, Cpu, Zap, Box, Wrench, Flame, MessageSquare, Hexagon, Grid, Layers, Moon, Sun } from 'lucide-react';

// --- Configuration per Field ---
const FIELD_CONFIG = {
  [ResearchField.PHYSICAL]: {
    color: 'violet',
    icon: Atom,
    description: "Physics, Chemistry, Astronomy, Earth Sciences",
    themeClass: "from-violet-500 to-purple-600",
    borderClass: "dark:border-violet-500/50 border-violet-500/30",
    bgClass: "dark:bg-violet-900/20 bg-violet-100/50",
    tasks: [
      { id: ResearchTask.DEEP_SEARCH, title: "Literature Review", desc: "ArXiv/APS synthesis", icon: FileSearch },
      { id: ResearchTask.DATA_ANALYSIS, title: "Experimental Data", desc: "Analyze raw datasets", icon: BarChart },
      { id: ResearchTask.CAD_DESIGN, title: "Instrument Design", desc: "Schematics & Blueprints", icon: Grid },
    ]
  },
  [ResearchField.LIFE]: {
    color: 'emerald',
    icon: Microscope,
    description: "Biology, Medicine, Genetics, Ecology",
    themeClass: "from-emerald-400 to-green-600",
    borderClass: "dark:border-emerald-500/50 border-emerald-500/30",
    bgClass: "dark:bg-emerald-900/20 bg-emerald-100/50",
    tasks: [
      { id: ResearchTask.DEEP_SEARCH, title: "Protocol Search", desc: "Methods & Clinical trials", icon: FileSearch },
      { id: ResearchTask.DATA_ANALYSIS, title: "Bio-Data Analysis", desc: "Genomic/Proteomic data", icon: TestTube },
      { id: ResearchTask.PAPER_EDITING, title: "Manuscript Polish", desc: "Format for high-impact journals", icon: PenTool },
    ]
  },
  [ResearchField.FORMAL]: {
    color: 'cyan',
    icon: Binary,
    description: "Mathematics, Computer Science, Logic, Statistics",
    themeClass: "from-cyan-400 to-blue-600",
    borderClass: "dark:border-cyan-500/50 border-cyan-500/30",
    bgClass: "dark:bg-cyan-900/20 bg-cyan-100/50",
    tasks: [
      { id: ResearchTask.IDEA_GENERATION, title: "Proof Assistant", desc: "Verify logic & theorems", icon: BrainCircuit },
      { id: ResearchTask.DATA_ANALYSIS, title: "Algorithm Analysis", desc: "Optimize code & complexity", icon: Code },
      { id: ResearchTask.PAPER_READING, title: "Technical Breakdown", desc: "Simplify complex papers", icon: FileText },
    ]
  },
  [ResearchField.ENGINEERING]: {
    color: 'amber',
    icon: Wrench,
    description: "Civil, Mechanical, Electrical, Chemical Engineering",
    themeClass: "from-amber-400 to-orange-600",
    borderClass: "dark:border-amber-500/50 border-amber-500/30",
    bgClass: "dark:bg-amber-900/20 bg-amber-100/50",
    tasks: [
      { id: ResearchTask.CAD_DESIGN, title: "CAD & Schematics", desc: "Circuits, PCBs, Floorplans", icon: Layers },
      { id: ResearchTask.IDEA_GENERATION, title: "System Design", desc: "Architectural solutions", icon: Sparkles },
      { id: ResearchTask.PAPER_EDITING, title: "Technical Report", desc: "Documentation & proposals", icon: PenTool },
    ]
  },
  [ResearchField.SOCIAL]: {
    color: 'rose',
    icon: Users,
    description: "Psychology, Sociology, Economics, Political Science",
    themeClass: "from-rose-400 to-pink-600",
    borderClass: "dark:border-rose-500/50 border-rose-500/30",
    bgClass: "dark:bg-rose-900/20 bg-rose-100/50",
    tasks: [
      { id: ResearchTask.DEEP_SEARCH, title: "Qualitative Synthesis", desc: "Meta-analysis & Theory", icon: Feather },
      { id: ResearchTask.DATA_ANALYSIS, title: "Statistical Analysis", desc: "SPSS/R/Stata interpretation", icon: PieChart },
      { id: ResearchTask.IDEA_GENERATION, title: "Methodology Design", desc: "Survey & experiment setup", icon: Users },
    ]
  },
  [ResearchField.GENERAL]: {
    color: 'blue',
    icon: Globe,
    description: "Interdisciplinary & General Studies",
    themeClass: "from-blue-400 to-indigo-600",
    borderClass: "dark:border-blue-500/50 border-blue-500/30",
    bgClass: "dark:bg-blue-900/20 bg-blue-100/50",
    tasks: [
      { id: ResearchTask.DEEP_SEARCH, title: "Deep Research", desc: "Comprehensive review", icon: FileSearch },
      { id: ResearchTask.CAD_DESIGN, title: "Blueprint Gen", desc: "Generate technical drawings", icon: Grid },
      { id: ResearchTask.PAPER_EDITING, title: "Academic Editing", desc: "Polish writing", icon: PenTool },
      { id: ResearchTask.DATA_ANALYSIS, title: "Data Analysis", desc: "Statistical consulting", icon: BarChart },
      { id: ResearchTask.IDEA_GENERATION, title: "Hypothesis Gen", desc: "Brainstorming ideas", icon: Sparkles },
    ]
  },
};

const MODELS_LIST = [
  // Google
  { id: ModelProvider.GEMINI_FLASH, name: "Gemini 2.5 Flash", desc: "Google • Fast & Multimodal", icon: Zap },
  { id: ModelProvider.GEMINI_PRO, name: "Gemini 3.0 Pro", desc: "Google • Complex Reasoning", icon: Cpu },
  { id: ModelProvider.GEMINI_THINKING, name: "Gemini 3.0 Thinking", desc: "Google • Deep Logic", icon: BrainCircuit },
  
  // OpenAI
  { id: ModelProvider.OPENAI_GPT4O, name: "GPT-4o", desc: "OpenAI • Omni Model", icon: MessageSquare },
  { id: ModelProvider.OPENAI_O1, name: "o1-preview", desc: "OpenAI • Reasoning Chain", icon: Sparkles },

  // Anthropic
  { id: ModelProvider.CLAUDE_3_5_SONNET, name: "Claude 3.5 Sonnet", desc: "Anthropic • Coding & Nuance", icon: Hexagon },

  // DeepSeek
  { id: ModelProvider.DEEPSEEK_V3, name: "DeepSeek V3", desc: "DeepSeek • Efficient SOTA", icon: Flame },
  { id: ModelProvider.DEEPSEEK_R1, name: "DeepSeek R1", desc: "DeepSeek • Math Specialist", icon: Binary },

  // Groq / Meta
  { id: ModelProvider.GROQ_LLAMA_3, name: "Llama 3 70B", desc: "Meta/Groq • Ultra Low Latency", icon: Zap },
];

const ModelDropdown: React.FC<{ 
  selectedModels: ModelProvider[], 
  onToggle: (id: ModelProvider) => void,
  themeColor: string
}> = ({ selectedModels, onToggle, themeColor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
            <div className="text-sm font-bold text-gray-800 dark:text-gray-200">Selected Engines</div>
            <div className={`text-xs text-${themeColor}-600 dark:text-${themeColor}-400`}>
              {selectedModels.length > 0 
                ? `${selectedModels.length} Model${selectedModels.length > 1 ? 's' : ''} Selected` 
                : 'Select Models'}
            </div>
          </div>
        </div>
        <ChevronDown size={18} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0c0c0e] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto">
          {MODELS_LIST.map((model) => {
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
             MAXIMUM 3 MODELS SIMULTANEOUSLY
          </div>
        </div>
      )}
    </div>
  );
};

const ThemeToggle: React.FC<{ isDarkMode: boolean, toggle: () => void }> = ({ isDarkMode, toggle }) => (
  <button 
    onClick={toggle}
    className="fixed bottom-6 left-6 z-50 p-2 rounded-full glass-panel hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors shadow-lg"
    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
  >
    {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
  </button>
);

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [context, setContext] = useState<UserContext>({
    models: [ModelProvider.GEMINI_FLASH]
  });
  const [isDarkMode, setIsDarkMode] = useState(true);

  const activeTheme = context.field ? FIELD_CONFIG[context.field] : FIELD_CONFIG[ResearchField.GENERAL];

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

  // --- Views ---

  const LandingView = () => (
    <div className="h-screen flex flex-col justify-center items-center z-10 relative px-4">
      <div className="mb-8 p-4 bg-white/50 dark:bg-white/5 rounded-full border border-black/5 dark:border-white/10 backdrop-blur-sm animate-pulse shadow-lg dark:shadow-none">
        <BrainCircuit className="w-12 h-12 text-blue-600 dark:text-blue-400" />
      </div>
      <h1 className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-gray-800 to-blue-600 dark:from-blue-200 dark:via-white dark:to-blue-200 text-center tracking-tighter mb-6 font-mono drop-shadow-sm">
        ProtoChat
      </h1>
      <p className="text-gray-600 dark:text-gray-400 text-lg md:text-xl max-w-2xl text-center mb-12 font-light">
        The ultimate research companion. Exploring the intersection of mathematical beauty and artificial intelligence.
      </p>
      <button 
        onClick={() => setView(AppView.FIELD_SELECT)}
        className="group relative px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-lg rounded-full hover:bg-gray-800 dark:hover:bg-blue-50 transition-all duration-300 flex items-center gap-2 overflow-hidden shadow-xl"
      >
        <span className="relative z-10">Initialize Research</span>
        <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-emerald-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
      </button>

      <div className="absolute bottom-8 text-xs text-gray-500 dark:text-gray-600 font-mono">
        Powered by Gemini • Three.js • React
      </div>
    </div>
  );

  const FieldSelectView = () => (
    <div className="h-screen flex flex-col items-center justify-center z-10 relative p-8">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Select Research Discipline</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-10">Define the broad academic context for the AI model.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl w-full">
        {(Object.keys(FIELD_CONFIG) as ResearchField[]).map((fieldKey) => {
          const config = FIELD_CONFIG[fieldKey];
          return (
            <button
              key={fieldKey}
              onClick={() => {
                setContext({ ...context, field: fieldKey });
                setView(AppView.TASK_SELECT);
              }}
              className={`group glass-panel p-6 rounded-xl transition-all text-left flex items-start gap-4 border dark:border-white/5 border-black/5 hover:${config.borderClass} hover:bg-white/40 dark:hover:bg-white/5`}
            >
              <div className={`p-3 rounded-lg bg-black/5 dark:bg-white/5 group-hover:bg-transparent transition-colors`}>
                <config.icon size={24} className={`text-gray-600 dark:text-gray-400 group-hover:text-${config.color}-600 dark:group-hover:text-${config.color}-400 transition-colors`} />
              </div>
              <div>
                <h3 className={`text-lg font-semibold text-gray-800 dark:text-gray-200 group-hover:text-${config.color}-600 dark:group-hover:text-${config.color}-400 transition-colors`}>{fieldKey}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-500 mt-1">{config.description}</p>
              </div>
            </button>
          );
        })}
      </div>
      <button onClick={() => setView(AppView.LANDING)} className="mt-12 text-gray-500 hover:text-gray-900 dark:hover:text-white text-sm">Cancel</button>
    </div>
  );

  const TaskSelectView = () => (
    <div className="h-screen flex flex-col items-center justify-center z-10 relative p-8">
      <div className="max-w-5xl w-full">
        <div className="flex items-center gap-3 mb-2">
            <activeTheme.icon className={`text-${activeTheme.color}-600 dark:text-${activeTheme.color}-400`} size={28} />
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{context.field} Workspace</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Select a specialized research tool for this domain.</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Tasks Column */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold mb-4">Research Tools</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeTheme.tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setContext(prev => ({ ...prev, task: task.id }))}
                  className={`glass-panel p-4 rounded-xl text-left transition-all border ${context.task === task.id ? `${activeTheme.bgClass} ${activeTheme.borderClass}` : 'dark:border-white/5 border-black/5 hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <task.icon size={20} className={context.task === task.id ? `text-${activeTheme.color}-600 dark:text-${activeTheme.color}-400` : 'text-gray-500 dark:text-gray-400'} />
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
               <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold">Engine Cluster</h3>
               <span className="text-xs text-gray-500">Select up to 3 for comparison</span>
            </div>
            
            {/* Model Dropdown Implementation */}
            <ModelDropdown 
              selectedModels={context.models} 
              onToggle={toggleModel} 
              themeColor={activeTheme.color} 
            />

            {/* Selected Chips Preview */}
            <div className="mt-4 flex flex-col gap-2">
              {context.models.map(mId => {
                const model = MODELS_LIST.find(m => m.id === mId);
                return (
                  <div key={mId} className="flex items-center gap-2 p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                    <div className={`w-2 h-2 rounded-full bg-${activeTheme.color}-500 shadow shadow-${activeTheme.color}-500/50`}></div>
                    <span className="text-xs text-gray-600 dark:text-gray-300 font-mono">{model?.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-between items-center border-t border-gray-200 dark:border-white/10 pt-8">
          <button onClick={() => setView(AppView.FIELD_SELECT)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">← Back</button>
          <button 
            disabled={!context.task}
            onClick={() => setView(AppView.WORKSPACE)}
            className={`px-8 py-3 bg-${activeTheme.color}-600 hover:bg-${activeTheme.color}-500 disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-800 dark:disabled:text-gray-500 text-white font-bold rounded-lg transition-all flex items-center gap-2 shadow-lg`}
          >
            Launch Workspace <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${isDarkMode ? 'dark' : ''} h-full w-full`}>
      <div className="relative min-h-screen text-gray-900 dark:text-gray-100 font-sans selection:bg-blue-500/30 bg-gray-50 dark:bg-black transition-colors duration-500">
        <ParticleBackground field={context.field} isDarkMode={isDarkMode} />
        
        {/* Global Theme Toggle */}
        <ThemeToggle isDarkMode={isDarkMode} toggle={() => setIsDarkMode(!isDarkMode)} />

        {/* View Router */}
        {view === AppView.LANDING && <LandingView />}
        {view === AppView.FIELD_SELECT && <FieldSelectView />}
        {view === AppView.TASK_SELECT && <TaskSelectView />}
        {view === AppView.WORKSPACE && (
          <ChatInterface 
            context={context} 
            themeColor={activeTheme.color}
            isDarkMode={isDarkMode}
            onBack={() => setView(AppView.TASK_SELECT)} 
          />
        )}
      </div>
    </div>
  );
};

export default App;