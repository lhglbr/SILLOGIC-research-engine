import React from 'react';
import { BrainCircuit, ChevronRight } from 'lucide-react';
import { AppView } from '../../types';

interface LandingViewProps {
  setView: (view: AppView) => void;
}

const LandingView: React.FC<LandingViewProps> = ({ setView }) => (
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

export default LandingView;
