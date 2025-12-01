

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
  IDEA_GENERATION = 'Hypothesis Generation'
}

export enum ModelProvider {
  GEMINI_FLASH = 'gemini-2.5-flash',
  GEMINI_FLASH_LITE = 'gemini-2.5-flash-lite',
  GEMINI_PRO = 'gemini-3-pro-preview',
  GEMINI_THINKING = 'gemini-3-pro-preview-thinking',
  GEMINI_EXP = 'gemini-exp-1206',
  LEARN_LM = 'learnlm-1.5-pro-experimental',
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

export interface AgentConfig {
  systemInstruction?: string;
  enableSearch?: boolean;
}

export interface UserContext {
  field?: ResearchField;
  task?: ResearchTask;
  models: ModelProvider[];
  config?: AgentConfig;
}