import { ResearchField, ResearchTask } from './types';
import { Atom, Microscope, Binary, Sigma, Users, Globe, FileSearch, BarChart, TestTube, PenTool, Sparkles, FileText, Network, Feather, PieChart, BrainCircuit, Code } from 'lucide-react';

export const FIELD_CONFIG = {
  [ResearchField.PHYSICS]: {
    // color: 'violet', // Removed in favor of explicit classes
    icon: Atom,
    description: "Quantum mechanics, Astrophysics, Relativity",
    themeClass: "from-violet-500 to-purple-600",
    borderClass: "border-violet-500/50",
    bgClass: "bg-violet-900/20",
    textAccent: "text-violet-400",
    groupHoverTextAccent: "group-hover:text-violet-400",
    checkboxBg: "bg-violet-500",
    launchButtonStyle: "bg-violet-600 hover:bg-violet-500",
    tasks: [
      { id: ResearchTask.DEEP_SEARCH, title: "Literature Review", desc: "ArXiv & APS synthesis", icon: FileSearch },
      { id: ResearchTask.DATA_ANALYSIS, title: "Simulation Data", desc: "Analyze experimental datasets", icon: BarChart },
      { id: ResearchTask.IDEA_GENERATION, title: "Theory Derivation", desc: "Brainstorm mathematical models", icon: Sigma },
    ]
  },
  [ResearchField.BIOLOGY]: {
    // color: 'emerald',
    icon: Microscope,
    description: "Genomics, Proteomics, Bioinformatics",
    themeClass: "from-emerald-400 to-green-600",
    borderClass: "border-emerald-500/50",
    bgClass: "bg-emerald-900/20",
    textAccent: "text-emerald-400",
    groupHoverTextAccent: "group-hover:text-emerald-400",
    checkboxBg: "bg-emerald-500",
    launchButtonStyle: "bg-emerald-600 hover:bg-emerald-500",
    tasks: [
      { id: ResearchTask.DEEP_SEARCH, title: "PubMed Search", desc: "Find recent protocols", icon: FileSearch },
      { id: ResearchTask.DATA_ANALYSIS, title: "Bioinformatics", desc: "Sequence & protein analysis", icon: TestTube },
      { id: ResearchTask.PAPER_EDITING, title: "Lab Report Polish", desc: "Format for Nature/Cell", icon: PenTool },
    ]
  },
  [ResearchField.CS]: {
    // color: 'cyan',
    icon: Binary,
    description: "AI/ML, Algorithms, Systems",
    themeClass: "from-cyan-400 to-blue-600",
    borderClass: "border-cyan-500/50",
    bgClass: "bg-cyan-900/20",
    textAccent: "text-cyan-400",
    groupHoverTextAccent: "group-hover:text-cyan-400",
    checkboxBg: "bg-cyan-500",
    launchButtonStyle: "bg-cyan-600 hover:bg-cyan-500",
    tasks: [
      { id: ResearchTask.DEEP_SEARCH, title: "Tech Stack Review", desc: "Compare frameworks & tools", icon: Network },
      { id: ResearchTask.DATA_ANALYSIS, title: "Code Analysis", desc: "Debug & Optimize algorithms", icon: Code },
      { id: ResearchTask.IDEA_GENERATION, title: "System Design", desc: "Architect scalable solutions", icon: BrainCircuit },
    ]
  },
  [ResearchField.MATH]: {
    // color: 'amber',
    icon: Sigma,
    description: "Topology, Number Theory, Analysis",
    themeClass: "from-amber-400 to-orange-600",
    borderClass: "border-amber-500/50",
    bgClass: "bg-amber-900/20",
    textAccent: "text-amber-400",
    groupHoverTextAccent: "group-hover:text-amber-400",
    checkboxBg: "bg-amber-500",
    launchButtonStyle: "bg-amber-600 hover:bg-amber-500",
    tasks: [
      { id: ResearchTask.IDEA_GENERATION, title: "Proof Assistant", desc: "Verify logical steps", icon: Sparkles },
      { id: ResearchTask.PAPER_READING, title: "Paper Deconstruction", desc: "Simplify complex theorems", icon: FileText },
      { id: ResearchTask.PAPER_EDITING, title: "LaTeX Formatting", desc: "Fix equation syntax", icon: PenTool },
    ]
  },
  [ResearchField.SOCIAL]: {
    // color: 'rose',
    icon: Users,
    description: "Psychology, Sociology, Economics",
    themeClass: "from-rose-400 to-pink-600",
    borderClass: "border-rose-500/50",
    bgClass: "bg-rose-900/20",
    textAccent: "text-rose-400",
    groupHoverTextAccent: "group-hover:text-rose-400",
    checkboxBg: "bg-rose-500",
    launchButtonStyle: "bg-rose-600 hover:bg-rose-500",
    tasks: [
      { id: ResearchTask.DEEP_SEARCH, title: "Lit Synthesis", desc: "Qualitative meta-analysis", icon: Feather },
      { id: ResearchTask.DATA_ANALYSIS, title: "SPSS/R Stats", desc: "Survey data interpretation", icon: PieChart },
      { id: ResearchTask.IDEA_GENERATION, title: "Study Design", desc: "Methodology planning", icon: Users },
    ]
  },
  [ResearchField.GENERAL]: {
    // color: 'blue',
    icon: Globe,
    description: "Interdisciplinary Studies",
    themeClass: "from-blue-400 to-indigo-600",
    borderClass: "border-blue-500/50",
    bgClass: "bg-blue-900/20",
    textAccent: "text-blue-400",
    groupHoverTextAccent: "group-hover:text-blue-400",
    checkboxBg: "bg-blue-500",
    launchButtonStyle: "bg-blue-600 hover:bg-blue-500",
    tasks: [
      { id: ResearchTask.DEEP_SEARCH, title: "Deep Research", desc: "Comprehensive review", icon: FileSearch },
      { id: ResearchTask.PAPER_READING, title: "Paper Reader", desc: "Summarize PDF/Text", icon: FileText },
      { id: ResearchTask.PAPER_EDITING, title: "Academic Editing", desc: "Polish writing", icon: PenTool },
      { id: ResearchTask.DATA_ANALYSIS, title: "Data Analysis", desc: "Statistical consulting", icon: BarChart },
      { id: ResearchTask.IDEA_GENERATION, title: "Hypothesis Gen", desc: "Brainstorming ideas", icon: Sparkles },
    ]
  },
};
