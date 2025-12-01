import React from 'react';
import { AppView, ResearchField, ResearchTask, ModelProvider, UserContext } from '../../types';
import { Check, ChevronRight } from 'lucide-react';
import { FIELD_CONFIG } from '../../config';

interface TaskSelectViewProps {
  context: UserContext;
  setContext: React.Dispatch<React.SetStateAction<UserContext>>;
  setView: (view: AppView) => void;
}

const TaskSelectView: React.FC<TaskSelectViewProps> = ({ context, setContext, setView }) => {
  const activeTheme = context.field ? FIELD_CONFIG[context.field] : FIELD_CONFIG[ResearchField.GENERAL];

  const models = [
    { id: ModelProvider.GEMINI_FLASH, name: "Gemini 2.5 Flash", desc: "Fast, Efficient" },
    { id: ModelProvider.GEMINI_PRO, name: "Gemini 3.0 Pro", desc: "Complex Reasoning" },
    { id: ModelProvider.GEMINI_THINKING, name: "Gemini 3.0 Thinking", desc: "Deep Logic & Proof" },
  ];

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

  return (
    <div className="h-screen flex flex-col items-center justify-center z-10 relative p-8">
      <div className="max-w-5xl w-full">
        <div className="flex items-center gap-3 mb-2">
            <activeTheme.icon className={`${activeTheme.textAccent}`} size={28} />
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
                    <task.icon size={20} className={context.task === task.id ? `${activeTheme.textAccent}` : 'text-gray-400'} />
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
            <div className="space-y-3">
              {models.map((model) => {
                const isSelected = context.models.includes(model.id);
                return (
                  <button
                    key={model.id}
                    onClick={() => toggleModel(model.id)}
                    className={`w-full glass-panel p-4 rounded-xl text-left transition-all border flex justify-between items-center ${isSelected ? 'bg-white/10 border-white/50' : 'border-white/5 hover:bg-white/5'}`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">{model.name}</div>
                      <div className="text-xs text-gray-500">{model.desc}</div>
                    </div>
                    {isSelected ? (
                       <div className={`w-5 h-5 rounded flex items-center justify-center ${activeTheme.checkboxBg} text-black`}>
                         <Check size={14} strokeWidth={3} />
                       </div>
                    ) : (
                       <div className="w-5 h-5 rounded border border-gray-600"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-12 flex justify-between items-center border-t border-white/10 pt-8">
          <button onClick={() => setView(AppView.FIELD_SELECT)} className="text-gray-500 hover:text-white">← Back</button>
          <button
            disabled={!context.task}
            onClick={() => setView(AppView.WORKSPACE)}
            className={`px-8 py-3 ${activeTheme.launchButtonStyle} disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold rounded-lg transition-all flex items-center gap-2`}
          >
            Launch Workspace <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskSelectView;
