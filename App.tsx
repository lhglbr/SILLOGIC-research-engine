
import React, { useState, useMemo, useRef, useEffect } from 'react';
import ParticleBackground from './components/ParticleBackground';
import ChatInterface from './components/ChatInterface';
import { AppView, ResearchField, ResearchTask, ModelProvider, UserContext } from './types';
import { Atom, Microscope, Binary, Sigma, Users, Globe, ChevronRight, BrainCircuit, Sparkles, FileSearch, FileText, PenTool, BarChart, TestTube, Code, Feather, PieChart, Network, Check, ChevronDown, Cpu, Zap, Box } from 'lucide-react';

// --- Configuration per Field ---
const FIELD_CONFIG = {
  [ResearchField.PHYSICS]: {
    color: 'violet',
    icon: Atom,
    description: "Quantum mechanics, Astrophysics, Relativity",
    themeClass: "from-violet-500 to-purple-600",
    borderClass: "border-violet-500/50",
    bgClass: "bg-violet-900/20",
    tasks: [
      { id: ResearchTask.DEEP_SEARCH, title: "Literature Review", desc: "ArXiv & APS synthesis", icon: FileSearch },
      { id: ResearchTask.DATA_ANALYSIS, title: "Simulation Data", desc: "Analyze experimental datasets", icon: BarChart },
      { id: ResearchTask.IDEA_GENERATION, title: "Theory Derivation", desc: "Brainstorm mathematical models", icon: Sigma },
    ]
  },
  [ResearchField.BIOLOGY]: {
    color: 'emerald',
    icon: Microscope,
    description: "Genomics, Proteomics, Bioinformatics",
    themeClass: "from-emerald-400 to-green-600",
    borderClass: "border-emerald-500/50",
    bgClass: "bg-emerald-900/20",
    tasks: [
      { id: ResearchTask.DEEP_SEARCH, title: "PubMed Search", desc: "Find recent protocols", icon: FileSearch },
      { id: ResearchTask.DATA_ANALYSIS, title: "Bioinformatics", desc: "Sequence & protein analysis", icon: TestTube },
      { id: ResearchTask.PAPER_EDITING, title: "Lab Report Polish", desc: "Format for Nature/Cell", icon: PenTool },
    ]
  },
  [ResearchField.CS]: {
    color: 'cyan',
    icon: Binary,
    description: "AI/ML, Algorithms, Systems",
    themeClass: "from-cyan-400 to-blue-600",
    borderClass: "border-cyan-500/50",
    bgClass: "bg-cyan-900/20",
    tasks: [
      { id: ResearchTask.DEEP_SEARCH, title: "Tech Stack Review", desc: "Compare frameworks & tools", icon: Network },
      { id: ResearchTask.DATA_ANALYSIS, title: "Code Analysis", desc: "Debug & Optimize algorithms", icon: Code },
      { id: ResearchTask.IDEA_GENERATION, title: "System Design", desc: "Architect scalable solutions", icon: BrainCircuit },
    ]
  },
  [ResearchField.MATH]: {
    color: 'amber',
    icon: Sigma,
    description: "Topology, Number Theory, Analysis",
    themeClass: "from-amber-400 to-orange-600",
    borderClass: "border-amber-500/50",
    bgClass: "bg-amber-900/20",
    tasks: [
      { id: ResearchTask.IDEA_GENERATION, title: "Proof Assistant", desc: "Verify logical steps", icon: Sparkles },
      { id: ResearchTask.PAPER_READING, title: "Paper Deconstruction", desc: "Simplify complex theorems", icon: FileText },
      { id: ResearchTask.PAPER_EDITING, title: "LaTeX Formatting", desc: "Fix equation syntax", icon: PenTool },
    ]
  },
  [ResearchField.SOCIAL]: {
    color: 'rose',
    icon: Users,
    description: "Psychology, Sociology, Economics",
    themeClass: "from-rose-400 to-pink-600",
    borderClass: "border-rose-500/50",
    bgClass: "bg-rose-900/20",
    tasks: [
      { id: ResearchTask.DEEP_SEARCH, title: "Lit Synthesis", desc: "Qualitative meta-analysis", icon: Feather },
      { id: ResearchTask.DATA_ANALYSIS, title: "SPSS/R Stats", desc: "Survey data interpretation", icon: PieChart },
      { id: ResearchTask.IDEA_GENERATION, title: "Study Design", desc: "Methodology planning", icon: Users },
    ]
  },
  [ResearchField.GENERAL]: {
    color: 'blue',
    icon: Globe,
    description: "Interdisciplinary Studies",
    themeClass: "from-blue-400 to-indigo-600",
    borderClass: "border-blue-500/50",
    bgClass: "bg-blue-900/20",
    tasks: [
      { id: ResearchTask.DEEP_SEARCH, title: "Deep Research", desc: "Comprehensive review", icon: FileSearch },
      { id: ResearchTask.PAPER_READING, title: "Paper Reader", desc: "Summarize PDF/Text", icon: FileText },
      { id: ResearchTask.PAPER_EDITING, title: "Academic Editing", desc: "Polish writing", icon: PenTool },
      { id: ResearchTask.DATA_ANALYSIS, title: "Data Analysis", desc: "Statistical consulting", icon: BarChart },
      { id: ResearchTask.IDEA_GENERATION, title: "Hypothesis Gen", desc: "Brainstorming ideas", icon: Sparkles },
    ]
  },
};

const MODELS_LIST = [
  { id: ModelProvider.GEMINI_FLASH, name: "Gemini 2.5 Flash", desc: "Fastest • Multimodal", icon: Zap },
  { id: ModelProvider.GEMINI_FLASH_LITE, name: "Gemini 2.5 Flash-Lite", desc: "Ultra-Fast • Low Latency", icon: Zap },
  { id: ModelProvider.GEMINI_PRO, name: "Gemini 3.0 Pro", desc: "Complex Reasoning • SOTA", icon: Cpu },
  { id: ModelProvider.GEMINI_THINKING, name: "Gemini 3.0 Thinking", desc: "Deep Logic • Chain of Thought", icon: BrainCircuit },
  { id: ModelProvider.GEMINI_EXP, name: "Gemini Experimental", desc: "Latest Research Checkpoint", icon: TestTube },
  { id: ModelProvider.LEARN_LM, name: "LearnLM 1.5 Pro", desc: "Pedagogical • Tutor Mode", icon: Users },
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
        className={`w-full flex justify-between items-center glass-panel p-4 rounded-xl border transition-all ${isOpen ? `border-${themeColor}-500 bg-white/5` : 'border-white/10 hover:border-white/30'}`}
      >
        <div className="flex items-center gap-3">
          <Box size={20} className={`text-${themeColor}-400`} />
          <div className="text-left">
            <div className="text-sm font-bold text-gray-200">Selected Engines</div>
            <div className={`text-xs text-${themeColor}-400`}>
              {selectedModels.length > 0 
                ? `${selectedModels.length} Model${selectedModels.length > 1 ? 's' : ''} Selected` 
                : 'Select Models'}
            </div>
          </div>
        </div>
        <ChevronDown size={18} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0c0c0e] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto">
          {MODELS_LIST.map((model) => {
            const isSelected = selectedModels.includes(model.id);
            return (
              <button
                key={model.id}
                onClick={() => onToggle(model.id)}
                className={`w-full flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${isSelected ? `bg-${themeColor}-900/10` : ''}`}
              >
                 <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? `bg-${themeColor}-500/20 text-${themeColor}-400` : 'bg-white/5 text-gray-400'}`}>
                        <model.icon size={18} />
                    </div>
                    <div className="text-left">
                        <div className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-400'}`}>{model.name}</div>
                        <div className="text-[10px] text-gray-600 uppercase tracking-wider">{model.desc}</div>
                    </div>
                 </div>
                 <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected ? `bg-${themeColor}-500 border-${themeColor}-500` : 'border-gray-700'}`}>
                    {isSelected && <Check size={14} className="text-black" strokeWidth={3} />}
                 </div>
              </button>
            );
          })}
          <div className="p-2 bg-black/40 text-[10px] text-gray-500 text-center border-t border-white/5">
             MAXIMUM 3 MODELS SIMULTANEOUSLY
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [context, setContext] = useState<UserContext>({
    models: [ModelProvider.GEMINI_FLASH]
  });

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
      <div className="mb-8 p-4 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm animate-pulse">
        <BrainCircuit className="w-12 h-12 text-blue-400" />
      </div>
      <h1 className="text-6xl md:text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-white to-blue-200 text-center tracking-tighter mb-6 font-mono">
        SILLOGIC
      </h1>
      <p className="text-gray-400 text-lg md:text-xl max-w-2xl text-center mb-12 font-light">
        The ultimate research companion. Exploring the intersection of mathematical beauty and artificial intelligence.
      </p>
      <button 
        onClick={() => setView(AppView.FIELD_SELECT)}
        className="group relative px-8 py-4 bg-white text-black font-bold text-lg rounded-full hover:bg-blue-50 transition-all duration-300 flex items-center gap-2 overflow-hidden"
      >
        <span className="relative z-10">Initialize Research</span>
        <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-emerald-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
      </button>

      <div className="absolute bottom-8 text-xs text-gray-600 font-mono">
        Powered by Gemini • Three.js • React
      </div>
    </div>
  );

  const FieldSelectView = () => (
    <div className="h-screen flex flex-col items-center justify-center z-10 relative p-8">
      <h2 className="text-3xl font-bold text-white mb-2">Select Research Field</h2>
      <p className="text-gray-400 mb-10">Define the academic context for the AI model.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl w-full">
        {(Object.keys(FIELD_CONFIG) as ResearchField[]).map((fieldKey) => {
          const config = FIELD_CONFIG[fieldKey];
          return (
            <button
              key={fieldKey}
              onClick={() => {
                setContext({ ...context, field: fieldKey });
                setView(AppView.TASK_SELECT);
              }}
              className={`group glass-panel p-6 rounded-xl transition-all text-left flex items-start gap-4 border border-white/5 hover:${config.borderClass} hover:bg-white/5`}
            >
              <div className={`p-3 rounded-lg bg-white/5 group-hover:bg-transparent transition-colors`}>
                <config.icon size={24} className={`text-gray-400 group-hover:text-${config.color}-400 transition-colors`} />
              </div>
              <div>
                <h3 className={`text-lg font-semibold text-gray-200 group-hover:text-${config.color}-400 transition-colors`}>{fieldKey}</h3>
                <p className="text-sm text-gray-500 mt-1">{config.description}</p>
              </div>
            </button>
          );
        })}
      </div>
      <button onClick={() => setView(AppView.LANDING)} className="mt-12 text-gray-500 hover:text-white text-sm">Cancel</button>
    </div>
  );

  const TaskSelectView = () => (
    <div className="h-screen flex flex-col items-center justify-center z-10 relative p-8">
      <div className="max-w-5xl w-full">
        <div className="flex items-center gap-3 mb-2">
            <activeTheme.icon className={`text-${activeTheme.color}-400`} size={28} />
            <h2 className="text-3xl font-bold text-white">{context.field} Workspace</h2>
        </div>
        <p className="text-gray-400 mb-8">Select a specialized research tool for this domain.</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Tasks Column */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm uppercase tracking-wider text-gray-500 font-bold mb-4">Research Tools</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeTheme.tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => setContext(prev => ({ ...prev, task: task.id }))}
                  className={`glass-panel p-4 rounded-xl text-left transition-all border ${context.task === task.id ? `${activeTheme.bgClass} ${activeTheme.borderClass}` : 'border-white/5 hover:bg-white/5'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <task.icon size={20} className={context.task === task.id ? `text-${activeTheme.color}-400` : 'text-gray-400'} />
                    <span className="font-semibold text-white">{task.title}</span>
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
                  <div key={mId} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 border border-white/5">
                    <div className={`w-2 h-2 rounded-full bg-${activeTheme.color}-500 shadow shadow-${activeTheme.color}-500/50`}></div>
                    <span className="text-xs text-gray-300 font-mono">{model?.name}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-between items-center border-t border-white/10 pt-8">
          <button onClick={() => setView(AppView.FIELD_SELECT)} className="text-gray-500 hover:text-white">← Back</button>
          <button 
            disabled={!context.task}
            onClick={() => setView(AppView.WORKSPACE)}
            className={`px-8 py-3 bg-${activeTheme.color}-600 hover:bg-${activeTheme.color}-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold rounded-lg transition-all flex items-center gap-2`}
          >
            Launch Workspace <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen text-gray-100 font-sans selection:bg-blue-500/30 bg-black">
      <ParticleBackground field={context.field} />
      
      {/* View Router */}
      {view === AppView.LANDING && <LandingView />}
      {view === AppView.FIELD_SELECT && <FieldSelectView />}
      {view === AppView.TASK_SELECT && <TaskSelectView />}
      {view === AppView.WORKSPACE && (
        <ChatInterface 
          context={context} 
          themeColor={activeTheme.color}
          onBack={() => setView(AppView.TASK_SELECT)} 
        />
      )}
    </div>
  );
};

export default App;
