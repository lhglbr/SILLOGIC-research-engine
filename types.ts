export enum AppView {
  LANDING = 'LANDING',
  FIELD_SELECT = 'FIELD_SELECT',
  TASK_SELECT = 'TASK_SELECT',
  WORKSPACE = 'WORKSPACE'
}

export enum ResearchField {
  PHYSICS = 'Theoretical Physics',
  BIOLOGY = 'Molecular Biology & Genetics',
  CS = 'Computer Science & AI',
  MATH = 'Applied Mathematics',
  SOCIAL = 'Social Sciences & Psychology',
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
  GEMINI_PRO = 'gemini-3-pro-preview',
  GEMINI_THINKING = 'gemini-3-pro-preview-thinking', // Internal flag for thinking config
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isThinking?: boolean;
}

export interface UserContext {
  field?: ResearchField;
  task?: ResearchTask;
  model: ModelProvider;
}
