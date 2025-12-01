import React from 'react';
import { AppView, ResearchField, UserContext } from '../../types';
import { FIELD_CONFIG } from '../../config';

interface FieldSelectViewProps {
  context: UserContext;
  setContext: (context: UserContext) => void;
  setView: (view: AppView) => void;
}

const FieldSelectView: React.FC<FieldSelectViewProps> = ({ context, setContext, setView }) => (
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
            className={`group glass-panel p-6 rounded-xl transition-all text-left flex items-start gap-4 border border-white/5 ${config.hoverBorderClass} hover:bg-white/5`}
          >
            <div className={`p-3 rounded-lg bg-white/5 group-hover:bg-transparent transition-colors`}>
              <config.icon size={24} className={`text-gray-400 ${config.groupHoverTextAccent} transition-colors`} />
            </div>
            <div>
              <h3 className={`text-lg font-semibold text-gray-200 ${config.groupHoverTextAccent} transition-colors`}>{fieldKey}</h3>
              <p className="text-sm text-gray-500 mt-1">{config.description}</p>
            </div>
          </button>
        );
      })}
    </div>
    <button onClick={() => setView(AppView.LANDING)} className="mt-12 text-gray-500 hover:text-white text-sm">Cancel</button>
  </div>
);

export default FieldSelectView;
