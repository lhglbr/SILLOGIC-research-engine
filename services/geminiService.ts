

import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ResearchField, ResearchTask, ModelProvider, AgentConfig } from "../types";

// Helper to get detailed system instructions
export const getSystemInstruction = (field: ResearchField, task: ResearchTask): string => {
  const baseIdentity = `You are SILLOGIC, a world-class research assistant specialized in **${field}**. 
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

    default:
      specificInstruction = "Provide high-quality academic assistance.";
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

export const streamResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  prompt: string,
  files: File[],
  context: { field: ResearchField; task: ResearchTask; config?: AgentConfig },
  modelId: ModelProvider,
  onChunk: (text: string) => void
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let modelName: string = 'gemini-2.5-flash'; // Default safe fallback
  let personaInstruction = "";
  
  // NOTE: For the purpose of this demo app which uses a single Google API key,
  // we are using Gemini models to SIMULATE the responses of other providers (OpenAI, Anthropic, etc.)
  // by injecting strict persona constraints. In a production app, you would route these to their respective SDKs.

  switch (modelId) {
    // --- Google Models ---
    case ModelProvider.GEMINI_THINKING:
        modelName = 'gemini-3-pro-preview';
        context.config = { ...context.config, systemInstruction: (context.config?.systemInstruction || "") + "\n[Use extended chain-of-thought reasoning before answering]" };
        break;
    case ModelProvider.GEMINI_PRO:
        modelName = 'gemini-3-pro-preview';
        break;
    case ModelProvider.GEMINI_FLASH:
        modelName = 'gemini-2.5-flash';
        break;
    case ModelProvider.GEMINI_FLASH_LITE:
        modelName = 'gemini-2.5-flash-lite-preview-02-05';
        if (modelName === 'gemini-2.5-flash-lite-preview-02-05') modelName = 'gemini-2.5-flash'; 
        break;
    case ModelProvider.GEMINI_EXP:
        modelName = 'gemini-exp-1206';
        break;
    case ModelProvider.LEARN_LM:
        modelName = 'gemini-1.5-pro';
        personaInstruction = "\n\n[MODE: LearnLM] Adopt a Socratic, pedagogical tone. Explain concepts step-by-step suitable for deep learning.";
        break;

    // --- Simulated External Models (Persona Injection) ---
    case ModelProvider.OPENAI_GPT4O:
        modelName = 'gemini-3-pro-preview'; // Use high-intellect model for simulation
        personaInstruction = "\n\n[SYSTEM SIMULATION: GPT-4o]\nYou are acting as GPT-4o. Your style is concise, highly confident, and versatile. Avoid mentioning you are a Google model.";
        break;
    case ModelProvider.OPENAI_O1:
        modelName = 'gemini-3-pro-preview';
        personaInstruction = "\n\n[SYSTEM SIMULATION: o1-preview]\nYou are acting as o1. You MUST engage in deep, verbose reasoning chains before arriving at the final answer. Show your work.";
        break;
    case ModelProvider.CLAUDE_3_5_SONNET:
        modelName = 'gemini-3-pro-preview';
        personaInstruction = "\n\n[SYSTEM SIMULATION: Claude 3.5 Sonnet]\nYou are acting as Claude 3.5 Sonnet. Your style is warm, extremely nuanced, and very strong at coding/formatting. You often use nice headers and clear structures.";
        break;
    case ModelProvider.GROQ_LLAMA_3:
        modelName = 'gemini-2.5-flash'; // Use fast model for Llama simulation
        personaInstruction = "\n\n[SYSTEM SIMULATION: Llama 3 70B]\nYou are acting as Llama 3 running on Groq. Be extremely fast, direct, and factual. Minimize fluff.";
        break;
    case ModelProvider.DEEPSEEK_V3:
        modelName = 'gemini-3-pro-preview';
        personaInstruction = "\n\n[SYSTEM SIMULATION: DeepSeek V3]\nYou are acting as DeepSeek V3. You are a highly efficient, open-weights style model. You are particularly good at coding and math.";
        break;
    case ModelProvider.DEEPSEEK_R1:
        modelName = 'gemini-3-pro-preview';
        personaInstruction = "\n\n[SYSTEM SIMULATION: DeepSeek R1]\nYou are acting as DeepSeek R1 (Reasoning). You prioritize mathematical rigor and logical steps.";
        break;
        
    default:
        modelName = 'gemini-2.5-flash';
  }

  // Combine instructions
  let baseConfigInstruction = context.config?.systemInstruction || getSystemInstruction(context.field, context.task);
  let finalSystemInstruction = baseConfigInstruction + personaInstruction;

  let config: any = {
    systemInstruction: finalSystemInstruction,
  };

  if (modelId === ModelProvider.GEMINI_THINKING) {
      config.thinkingConfig = { thinkingBudget: 2048 };
  }

  // Tool Configuration
  if (context.config?.enableSearch) {
    config.tools = [{ googleSearch: {} }];
  }

  try {
    // Process files
    const fileParts = await Promise.all(files.map(f => fileToPart(f)));
    
    // Construct current message parts
    const currentParts: any[] = [...fileParts];
    if (prompt) currentParts.push({ text: prompt });

    const chat = ai.chats.create({
      model: modelName,
      config: config,
      history: history.map(h => ({
          role: h.role,
          parts: h.parts
      }))
    });

    const result = await chat.sendMessageStream({ 
      message: currentParts
    });
    
    let fullText = "";
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      const text = c.text;
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }
    return fullText;

  } catch (error) {
    console.error("Gemini API Error:", error);
    const errorMessage = `\n\n[System Error: ${modelId} connection failed. Verify API key or Model Availability.]`;
    onChunk(errorMessage);
    return errorMessage;
  }
};