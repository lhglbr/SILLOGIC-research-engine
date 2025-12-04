

export enum AppView {
  LANDING = 'LANDING',
  FIELD_SELECT = 'FIELD_SELECT',
  TASK_SELECT = 'TASK_SELECT',
  WORKSPACE = 'WORKSPACE'
}

export enum ResearchField {
  PHYSICAL = 'Physical Sciences',
  LIFE = 'Life Sciences',
  FORMAL = 'Formal Sciences',
  ENGINEERING = 'Engineering & Technology',
  SOCIAL = 'Social Sciences & Humanities',
  GENERAL = 'General Research'
}

export enum ResearchTask {
  DEEP_SEARCH = 'Deep Literature Review',
  PAPER_READING = 'Paper Interpretation & Summary',
  PAPER_EDITING = 'Academic Writing & Polishing',
  DATA_ANALYSIS = 'Data Analysis & Visualization',
  IDEA_GENERATION = 'Hypothesis Generation',
  CAD_DESIGN = 'CAD & Blueprint Design'
}

export enum ModelProvider {
  // Google
  GEMINI_FLASH = 'gemini-2.5-flash',
  GEMINI_FLASH_LITE = 'gemini-2.5-flash-lite',
  GEMINI_PRO = 'gemini-3-pro-preview',
  GEMINI_THINKING = 'gemini-3-pro-preview-thinking',
  GEMINI_EXP = 'gemini-2.5-flash',
  LEARN_LM = 'gemini-3-pro-preview',
  
  // External (Simulated via Persona for Demo)
  OPENAI_GPT4O = 'gpt-4o',
  OPENAI_O1 = 'o1-preview',
  CLAUDE_3_5_SONNET = 'claude-3-5-sonnet',
  GROQ_LLAMA_3 = 'groq-llama-3-70b',
  DEEPSEEK_V3 = 'deepseek-v3',
  DEEPSEEK_R1 = 'deepseek-r1'
}

export interface MultiModelResponse {
  modelId: ModelProvider;
  modelName: string;
  content: string;
  isThinking: boolean;
  isDone: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isThinking?: boolean;
  multiResponses?: MultiModelResponse[];
}

export interface KnowledgeFile {
  id: string;
  name: string;
  type: string;
  file: File;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
  history: ChatMessage[];
  activeModels: ModelProvider[];
  field?: ResearchField;
  task?: ResearchTask;
  knowledgeBase: KnowledgeFile[];
}

// --- MCP Definitions ---
export interface MCPTool {
  name: string;
  description: string;
  parameters: any; // JSON Schema
}

export interface MCPPlugin {
  id: string;
  name: string;
  description: string;
  author: string;
  icon: any; // Lucide Icon component
  version: string;
  tools: MCPTool[];
  isInstalled?: boolean;
}

export interface AgentConfig {
  systemInstruction?: string;
  enableSearch?: boolean;
  temperature?: number;
  topP?: number;
  maxOutputTokens?: number;
  mcpPlugins?: MCPPlugin[]; // Installed MCP plugins
}

export interface UserContext {
  field?: ResearchField;
  task?: ResearchTask;
  models: ModelProvider[];
  config?: AgentConfig;
  language: 'en' | 'zh';
}

// --- Auth Definitions ---
export enum AuthStrategy {
  LOCAL = 'LOCAL',         // Demo/Dev mode
  CLERK = 'CLERK',         // Clerk.com
  NEXT_AUTH = 'NEXT_AUTH'  // NextAuth.js (Auth.js)
}

export enum SubscriptionTier {
  FREE = 'FREE',
  PRO = 'PRO',
  TEAM = 'TEAM'
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: 'admin' | 'researcher' | 'viewer';
  tier: SubscriptionTier;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  strategy: AuthStrategy;
  config: {
    clerkKey?: string;
    nextAuthUrl?: string;
  };
}