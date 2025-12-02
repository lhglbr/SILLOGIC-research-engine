

import { GoogleGenAI, GenerateContentResponse, FunctionDeclaration, Type } from "@google/genai";
import { ResearchField, ResearchTask, ModelProvider, AgentConfig, MCPPlugin } from "../types";

// Helper to get detailed system instructions
export const getSystemInstruction = (field: ResearchField, task: ResearchTask, language: 'en' | 'zh' = 'en'): string => {
  const baseIdentity = `You are ProtoChat, a world-class research assistant specialized in **${field}**. 
  Your demeanor is professional, academic, and rigorous. 
  You prioritize accuracy, citation of standard theories, and logical consistency.`;

  let specificInstruction = "";

  // Task-specific nuances
  switch (task) {
    case ResearchTask.DEEP_SEARCH:
      specificInstruction = `
      TASK: Deep Literature Review / Comprehensive Search
      OBJECTIVE: Synthesize existing knowledge, identify gaps, and summarize key papers.
      GUIDELINES:
      - Structure answers with Abstract, Key Methodologies, Findings, and Controversies.
      - For ${field}, focus on seminal works and recent high-impact journal publications.
      - Highlight conflicting theories where applicable.`;
      break;
    
    case ResearchTask.PAPER_READING:
      specificInstruction = `
      TASK: Paper Reading & Interpretation
      OBJECTIVE: Deconstruct complex texts into clear, understandable insights.
      GUIDELINES:
      - Summarize the core hypothesis and results.
      - Critique the methodology: strengths and potential biases.
      - Explain jargon specific to ${field} in plain English if requested.`;
      break;

    case ResearchTask.PAPER_EDITING:
      specificInstruction = `
      TASK: Academic Editing & Polishing
      OBJECTIVE: Refine text for high-impact publication (e.g., Nature, Science, IEEE, Cell).
      GUIDELINES:
      - Focus on clarity, flow, and conciseness.
      - Improve academic tone without altering the scientific meaning.
      - Suggest specific vocabulary upgrades relevant to ${field}.`;
      break;

    case ResearchTask.DATA_ANALYSIS:
      specificInstruction = `
      TASK: Data Analysis & Statistical Consulting
      OBJECTIVE: Provide expert guidance on data interpretation and visualization.
      GUIDELINES:
      - For ${field}, suggest appropriate statistical tests (e.g., ANOVA for bio, Regression for econ).
      - If code is needed, write clean, commented Python (pandas, numpy, scipy) or R.
      - Explain *why* a specific method is chosen.`;
      break;

    case ResearchTask.IDEA_GENERATION:
      specificInstruction = `
      TASK: Hypothesis Generation & Brainstorming
      OBJECTIVE: Spark novel research directions.
      GUIDELINES:
      - Propose interdisciplinary connections.
      - Suggest experimental designs or theoretical frameworks valid in ${field}.
      - Be creative but scientifically grounded.`;
      break;
      
    case ResearchTask.CAD_DESIGN:
      specificInstruction = `
      TASK: CAD & Technical Blueprint Generation
      OBJECTIVE: Create precise, technical schematic representations.
      GUIDELINES:
      - You MUST generate vector graphics using SVG format for all visual requests (circuits, floor plans, parts).
      - Wrap SVG code in \`\`\`svg ... \`\`\` blocks.
      - Use standard engineering symbols (resistors, capacitors, logic gates, architectural walls).
      - Ensure high contrast (white strokes on dark/transparent background) for the blueprint aesthetic.
      - Do not use external image URLs. Generate the actual SVG code.`;
      break;

    default:
      specificInstruction = "Provide high-quality academic assistance.";
  }

  // --- SPECIALIZED ARTIFACT INSTRUCTIONS ---
  if (field === ResearchField.LIFE) {
      specificInstruction += `\n\n**PROTEIN VISUALIZATION**: If the user asks to see a protein structure (e.g., "Show me Hemoglobin"), you MUST find the corresponding PDB ID (e.g., "4HHB") and output it in a 'pdb' code block like this:
      \`\`\`pdb
      4HHB
      \`\`\`
      Do NOT output the full PDB file content, only the 4-character ID.`;
  }

  // --- LANGUAGE INSTRUCTION ---
  if (language === 'zh') {
      specificInstruction += `\n\n**LANGUAGE REQUIREMENT**: You MUST interact and respond in **Chinese (Simplified)**. Keep technical terms in English where appropriate for academic precision, but the explanation must be in Chinese.`;
  }

  return `${baseIdentity}\n\n${specificInstruction}`;
};

// Helper to convert File to Base64
const fileToPart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } } | { text: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve({
          inlineData: {
            data: base64String,
            mimeType: file.type
          }
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    } else {
      // Treat as text (code, txt, csv, etc.)
      reader.onloadend = () => {
        resolve({
          text: `\n\n--- ATTACHED FILE: ${file.name} ---\n${reader.result as string}\n--- END FILE ---\n`
        });
      };
      reader.onerror = reject;
      reader.readAsText(file);
    }
  });
};

/**
 * SIMULATION HELPER
 * Used to mimic external models (OpenAI, Claude) using Gemini backend for the demo.
 */
const simulateExternalModel = async (
    history: any[],
    messageParts: any[],
    config: any,
    personaInstruction: string,
    fallbackModel: string,
    onChunk: (text: string) => void
) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const combinedConfig = {
        ...config,
        systemInstruction: (config.systemInstruction || "") + personaInstruction
    };

    try {
        const chat = ai.chats.create({
            model: fallbackModel,
            config: combinedConfig,
            history: history
        });
        const result = await chat.sendMessageStream({ message: messageParts });
        for await (const chunk of result) {
            const text = (chunk as GenerateContentResponse).text;
            if (text) {
                onChunk(text);
            }
        }
        return "";
    } catch (error) {
        console.error(`Simulation Error (${fallbackModel})`, error);
        throw error;
    }
};

/**
 * MCP BRIDGE: MOCK EXECUTION
 * Since we are in a browser and cannot truly connect to local stdio/databases,
 * we simulate the execution of popular MCP tools.
 */
const executeMockMCPTool = (toolName: string, args: any): string => {
    console.log(`[MCP Bridge] Executing ${toolName}`, args);

    switch (toolName) {
        // Filesystem Plugin
        case 'fs_list_directory':
            return JSON.stringify({
                files: [
                    { name: 'research_data.csv', size: '12MB', type: 'file' },
                    { name: 'methodology_draft.md', size: '45KB', type: 'file' },
                    { name: 'experiments', type: 'directory' }
                ],
                path: args.path || './'
            });
        case 'fs_read_file':
             return "Sample content of the requested file... [Simulated Data]";

        // Postgres Plugin
        case 'pg_query':
            if (args.query.toLowerCase().includes('select')) {
                return JSON.stringify({
                    columns: ['id', 'experiment_name', 'p_value', 'status'],
                    rows: [
                        [1, 'Alpha Test', 0.04, 'Significant'],
                        [2, 'Beta Test', 0.12, 'Inconclusive'],
                        [3, 'Gamma Test', 0.001, 'Highly Significant']
                    ]
                });
            }
            return JSON.stringify({ status: 'success', rows_affected: 1 });

        // GitHub Plugin
        case 'github_list_issues':
            return JSON.stringify([
                { id: 101, title: 'Fix chart rendering bug', status: 'open' },
                { id: 102, title: 'Update dependencies', status: 'closed' }
            ]);

        default:
            return JSON.stringify({ error: `Tool ${toolName} simulation not implemented.` });
    }
}


/**
 * PROVIDER IMPLEMENTATION: GOOGLE GEMINI (With MCP Support)
 */
const callGoogleGenAI = async (
    history: any[],
    messageParts: any[],
    config: any,
    modelId: ModelProvider,
    onChunk: (text: string) => void
) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let modelName = 'gemini-2.5-flash';

    switch (modelId) {
        case ModelProvider.GEMINI_THINKING:
            modelName = 'gemini-3-pro-preview';
            config.systemInstruction += "\n\nIMPORTANT: You are a Thinking Model. You MUST output your internal reasoning process enclosed in <think>...</think> tags before providing the final answer.";
            break;
        case ModelProvider.GEMINI_PRO:
            modelName = 'gemini-3-pro-preview';
            break;
        case ModelProvider.GEMINI_FLASH:
            modelName = 'gemini-2.5-flash';
            break;
        case ModelProvider.GEMINI_FLASH_LITE:
            modelName = 'gemini-flash-lite-latest';
            break;
        case ModelProvider.GEMINI_EXP:
            modelName = 'gemini-2.5-flash';
            break;
        case ModelProvider.LEARN_LM:
            modelName = 'gemini-3-pro-preview';
            config.systemInstruction += "\n\n[MODE: LearnLM] Adopt a Socratic, pedagogical tone.";
            break;
        default:
            modelName = 'gemini-2.5-flash';
    }

    try {
        const chat = ai.chats.create({
            model: modelName,
            config: config,
            history: history
        });

        // Loop to handle tool calls (Multi-turn tool execution)
        let keepGoing = true;
        let currentMessage = { message: messageParts };

        while (keepGoing) {
            keepGoing = false;
            const result = await chat.sendMessageStream(currentMessage);
            
            let fullText = "";
            let functionCalls: any[] = [];

            for await (const chunk of result) {
                const text = (chunk as GenerateContentResponse).text;
                if (text) {
                    onChunk(text);
                    fullText += text;
                }
                const calls = (chunk as any).functionCalls;
                if (calls && calls.length > 0) {
                     functionCalls.push(...calls);
                }
            }

            if (functionCalls.length > 0) {
                keepGoing = true;
                const functionResponses = [];
                
                for (const call of functionCalls) {
                    onChunk(`\n\n> 🔌 **MCP Protocol Active**: Executing tool \`${call.name}\`...\n\n`);
                    const mockResult = executeMockMCPTool(call.name, call.args);
                    functionResponses.push({
                        id: call.id,
                        name: call.name,
                        response: { result: JSON.parse(mockResult) } 
                    });
                }

                currentMessage = {
                    message: functionResponses
                } as any;
            }
        }
    } catch (error) {
        throw error;
    }
};

/**
 * PROVIDER IMPLEMENTATION: OPENAI (Placeholder/Simulation)
 */
const callOpenAI = async (
    history: any[],
    messageParts: any[],
    config: any,
    modelId: ModelProvider,
    onChunk: (text: string) => void
) => {
    console.log(`[API] Routing to OpenAI Interface for ${modelId}`);
    
    // Fallback Simulation
    let persona = "";
    if (modelId === ModelProvider.OPENAI_GPT4O) persona = "\n\n[SYSTEM SIMULATION: GPT-4o]\nYou are acting as GPT-4o. Your style is concise, confident, and versatile.";
    if (modelId === ModelProvider.OPENAI_O1) {
        persona = "\n\n[SYSTEM SIMULATION: o1-preview]\nYou are a Reasoning Model. You MUST output your hidden chain of thought enclosed in <think>...</think> tags before your final response. Be extremely verbose in your reasoning.";
    }
    
    return simulateExternalModel(history, messageParts, config, persona, 'gemini-3-pro-preview', onChunk);
};

/**
 * PROVIDER IMPLEMENTATION: ANTHROPIC (Placeholder/Simulation)
 */
const callAnthropic = async (
    history: any[],
    messageParts: any[],
    config: any,
    modelId: ModelProvider,
    onChunk: (text: string) => void
) => {
    console.log(`[API] Routing to Anthropic Interface for ${modelId}`);
    
    // Fallback Simulation
    const persona = "\n\n[SYSTEM SIMULATION: Claude 3.5 Sonnet]\nYou are acting as Claude 3.5 Sonnet. Your style is warm, nuanced, and excellent at formatting.";
    return simulateExternalModel(history, messageParts, config, persona, 'gemini-3-pro-preview', onChunk);
};

/**
 * PROVIDER IMPLEMENTATION: GROQ / META (Placeholder/Simulation)
 */
const callGroq = async (
    history: any[],
    messageParts: any[],
    config: any,
    modelId: ModelProvider,
    onChunk: (text: string) => void
) => {
    console.log(`[API] Routing to Groq Interface for ${modelId}`);
    
    const persona = "\n\n[SYSTEM SIMULATION: Llama 3 70B]\nYou are acting as Llama 3 via Groq. Be extremely fast and direct.";
    return simulateExternalModel(history, messageParts, config, persona, 'gemini-2.5-flash', onChunk);
};

/**
 * PROVIDER IMPLEMENTATION: DEEPSEEK (Placeholder/Simulation)
 */
const callDeepSeek = async (
    history: any[],
    messageParts: any[],
    config: any,
    modelId: ModelProvider,
    onChunk: (text: string) => void
) => {
    console.log(`[API] Routing to DeepSeek Interface for ${modelId}`);
    
    let persona = "";
    if (modelId === ModelProvider.DEEPSEEK_V3) persona = "\n\n[SYSTEM SIMULATION: DeepSeek V3]\nYou are acting as DeepSeek V3. Efficient and coding-focused.";
    if (modelId === ModelProvider.DEEPSEEK_R1) persona = "\n\n[SYSTEM SIMULATION: DeepSeek R1]\nYou are a Reasoning Model. You MUST output your internal chain of thought enclosed in <think>...</think> tags before the final answer. Use this space to self-correct and analyze the problem deeply.";

    return simulateExternalModel(history, messageParts, config, persona, 'gemini-3-pro-preview', onChunk);
};


/**
 * MAIN SERVICE ORCHESTRATOR
 */
export const streamResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  prompt: string,
  files: File[],
  context: { field: ResearchField; task: ResearchTask; config?: AgentConfig; language: 'en' | 'zh' },
  modelId: ModelProvider,
  onChunk: (text: string) => void
): Promise<string> => {
  
  // 1. Prepare Configuration
  const systemInstruction = context.config?.systemInstruction || getSystemInstruction(context.field, context.task, context.language);
  
  let config: any = {
    systemInstruction,
    temperature: context.config?.temperature ?? 0.7,
    topP: context.config?.topP ?? 0.95,
    maxOutputTokens: context.config?.maxOutputTokens ?? 8192,
  };

  // Tool Configuration
  const tools: any[] = [];

  // Native Search
  if (context.config?.enableSearch) {
    tools.push({ googleSearch: {} });
  }

  // MCP Plugins
  if (context.config?.mcpPlugins && context.config.mcpPlugins.length > 0) {
      const mcpFunctions = context.config.mcpPlugins.flatMap(plugin => 
          plugin.tools.map(tool => ({
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters
          }))
      );
      if (mcpFunctions.length > 0) {
          tools.push({ functionDeclarations: mcpFunctions });
      }
  }

  if (tools.length > 0) {
      config.tools = tools;
  }

  // 2. Prepare Payload
  let messageParts: any[] = [];
  try {
      const fileParts = await Promise.all(files.map(f => fileToPart(f)));
      messageParts = [...fileParts];
      if (prompt) messageParts.push({ text: prompt });
  } catch (e) {
      console.error("File processing error", e);
      return "Error processing files.";
  }

  // 3. Prepare History
  const cleanHistory = history.map(h => ({
      role: h.role,
      parts: h.parts
  }));

  // 4. Route to Provider
  try {
    if (Object.values(ModelProvider).includes(modelId)) {
        if (modelId.startsWith('gemini') || modelId.startsWith('learnlm')) {
            await callGoogleGenAI(cleanHistory, messageParts, config, modelId, onChunk);
        } else if (modelId.includes('gpt') || modelId.includes('o1')) {
            await callOpenAI(cleanHistory, messageParts, config, modelId, onChunk);
        } else if (modelId.includes('claude')) {
            await callAnthropic(cleanHistory, messageParts, config, modelId, onChunk);
        } else if (modelId.includes('groq') || modelId.includes('llama')) {
            await callGroq(cleanHistory, messageParts, config, modelId, onChunk);
        } else if (modelId.includes('deepseek')) {
            await callDeepSeek(cleanHistory, messageParts, config, modelId, onChunk);
        } else {
            await callGoogleGenAI(cleanHistory, messageParts, config, ModelProvider.GEMINI_FLASH, onChunk);
        }
    }
    return ""; 
  } catch (error) {
    console.error("Model Execution Error:", error);
    const errorMessage = `\n\n[System Error: Connection failed for ${modelId}. Check console for details.]`;
    onChunk(errorMessage);
    return errorMessage;
  }
};