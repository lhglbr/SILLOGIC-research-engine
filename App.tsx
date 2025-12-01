
import React, { useState } from 'react';
import ParticleBackground from './components/ParticleBackground';
import ChatInterface from './components/ChatInterface';
import { AppView, ResearchField, ModelProvider, UserContext } from './types';
import LandingView from './components/views/LandingView';
import FieldSelectView from './components/views/FieldSelectView';
import TaskSelectView from './components/views/TaskSelectView';
import { FIELD_CONFIG } from './config';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [context, setContext] = useState<UserContext>({
    models: [ModelProvider.GEMINI_FLASH]
  });

  return (
    <div className="relative min-h-screen text-gray-100 font-sans selection:bg-blue-500/30 bg-black">
      <ParticleBackground field={context.field} />
      
      {/* View Router */}
      {view === AppView.LANDING && <LandingView setView={setView} />}
      {view === AppView.FIELD_SELECT && <FieldSelectView context={context} setContext={setContext} setView={setView} />}
      {view === AppView.TASK_SELECT && <TaskSelectView context={context} setContext={setContext} setView={setView} />}
      {view === AppView.WORKSPACE && (
        <ChatInterface 
          context={context} 
          themeColor={(context.field ? FIELD_CONFIG[context.field] : FIELD_CONFIG[ResearchField.GENERAL]).color}
          onBack={() => setView(AppView.TASK_SELECT)} 
        />
      )}
    </div>
  );
};

export default App;
