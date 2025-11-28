import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ResearchField, ResearchTask, ModelProvider } from "../types";

// Helper to get detailed system instructions
const getSystemInstruction = (field: ResearchField, task: ResearchTask): string => {
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
  context: { field: ResearchField; task: ResearchTask; model: ModelProvider },
  onChunk: (text: string) => void
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let modelName: string = context.model;
  let config: any = {
    systemInstruction: getSystemInstruction(context.field, context.task),
  };

  if (context.model === ModelProvider.GEMINI_THINKING) {
    modelName = 'gemini-3-pro-preview';
    config.thinkingConfig = { thinkingBudget: 1024 };
  } else if (context.model === ModelProvider.GEMINI_PRO) {
      modelName = 'gemini-3-pro-preview';
  } else {
      modelName = 'gemini-2.5-flash';
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
      role: 'user',
      parts: currentParts 
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
    const errorMessage = "\n\n[System Error: Unable to connect to the research engine. Please verify your API key, network connection, or file compatibility.]";
    onChunk(errorMessage);
    return errorMessage;
  }
};