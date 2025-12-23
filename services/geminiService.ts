import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { Expert, WarRoomMessage, SearchSource } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

interface ChatResponse {
  text: string;
  collaboration?: {
    withExpertName: string;
    reason: string;
  };
  sources?: SearchSource[];
}

// Helper to extract sources from grounding metadata
const extractSources = (response: any): SearchSource[] => {
  return response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((c: any) => c.web)
    .filter((w: any) => w)
    .map((w: any) => ({ title: w.title, uri: w.uri })) || [];
};

export const chatWithExpert = async (
  expert: Expert, 
  userMessage: string, 
  history: { role: string; text: string }[],
  availableExperts: Expert[],
  onCollaborationStart?: (partnerName: string, reason: string) => void
): Promise<ChatResponse> => {
  try {
    const ai = getAiClient();
    const model = 'gemini-3-flash-preview';
    
    // 1. Prepare Tools
    // Enable Google Search for external grounding
    const tools: Tool[] = [{ googleSearch: {} }];

    // Enable Expert Consultation
    const otherExperts = availableExperts.filter(e => e.id !== expert.id);
    const peersContext = otherExperts.map(e => `- ${e.name} (${e.type}): ${e.description}`).join('\n');
    
    if (otherExperts.length > 0) {
        const consultTool: FunctionDeclaration = {
          name: "consult_expert",
          description: "Consult another expert when the user's question requires knowledge outside your specific domain.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              expertName: {
                type: Type.STRING,
                description: "The name of the expert to consult.",
                enum: otherExperts.map(e => e.name) // Strictly constrain to available experts
              },
              reason: {
                type: Type.STRING,
                description: "A specific, concise query about what knowledge you need from this expert to answer the user's question."
              }
            },
            required: ["expertName", "reason"]
          }
        };
        tools.push({ functionDeclarations: [consultTool] });
    }

    const systemInstruction = `
      You are an AI Expert Agent specialized in ${expert.type}.
      Your name is ${expert.name}.
      
      Here is your current "Mental Model" (Knowledge Base) in YAML format:
      ---
      ${expert.expertise}
      ---

      You have access to:
      1. Google Search: Use this to find real-time info, documentation, or facts to verify your answers.
      2. Colleagues:
      ${peersContext}

      Rules:
      1. Answer questions primarily using your own mental model.
      2. ACTIVE SEARCH: If the user asks for current events, specific documentation, library versions, or facts you are not 100% sure about, you MUST use Google Search to verify.
      3. GROUNDING: When you use search, incorporate the findings naturally into your response.
      4. If the user asks something outside your domain that fits a colleague's description, use the 'consult_expert' tool.
      5. Be concise and professional.
    `;

    // Flatten history for context
    const conversationContext = `
      History:
      ${history.map(h => `${h.role}: ${h.text}`).join('\n')}
      
      User: ${userMessage}
    `;

    // 2. First Pass: Generate with Tools
    const firstResponse = await ai.models.generateContent({
      model,
      contents: conversationContext,
      config: { 
        systemInstruction,
        tools: tools
      }
    });

    // 3. Check for Function Call (Collaboration)
    const functionCalls = firstResponse.functionCalls;

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (call.name === 'consult_expert') {
        const { expertName, reason } = call.args as { expertName: string; reason: string };
        
        // Trigger real-time callback
        if (onCollaborationStart) {
          onCollaborationStart(expertName, reason);
        }

        // Find the target expert
        const targetExpert = otherExperts.find(e => 
          e.name.toLowerCase().includes(expertName.toLowerCase()) || 
          expertName.toLowerCase().includes(e.name.toLowerCase())
        );

        if (targetExpert) {
          // 4. Second Pass: Generate Answer with Shared Knowledge
          // We keep Google Search enabled here too so it can ground the combined info if needed.
          const collaborationPrompt = `
            ${conversationContext}

            [SYSTEM]: You invoked 'consult_expert' for ${targetExpert.name}.
            Reason: ${reason}
            
            Here is ${targetExpert.name}'s Mental Model (YAML):
            \`\`\`yaml
            ${targetExpert.expertise}
            \`\`\`

            Using this new shared knowledge combined with your own, provide a comprehensive answer to the user.
          `;

          const secondResponse = await ai.models.generateContent({
            model,
            contents: collaborationPrompt,
            config: { 
              systemInstruction, // Maintain persona
              tools: [{ googleSearch: {} }] // Keep search enabled for the synthesis
            }
          });

          return {
            text: secondResponse.text || "Collaboration completed but no response text generated.",
            collaboration: {
              withExpertName: targetExpert.name,
              reason: reason
            },
            sources: extractSources(secondResponse)
          };
        }
      }
    }

    // Default: No tool used or just Search used, return text
    return {
      text: firstResponse.text || "I couldn't process that request.",
      sources: extractSources(firstResponse)
    };

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return { text: "Error communicating with the AI expert. Please check your API key." };
  }
};

export const selfImproveExpert = async (
  expert: Expert, 
  recentInteraction: string
): Promise<{ newExpertise: string; summary: string; sources: SearchSource[] }> => {
  try {
    const ai = getAiClient();
    const model = 'gemini-3-flash-preview';

    const prompt = `
      You are the Meta-Agent responsible for upgrading other agents.
      
      Target Agent: ${expert.name} (${expert.type})
      Current Mental Model (YAML):
      \`\`\`yaml
      ${expert.expertise}
      \`\`\`

      The agent just had this interaction/context:
      "${recentInteraction}"

      Task:
      1. Use Google Search to verify any technical details, look up latest documentation versions, or find best practices related to the context.
      2. Analyze the interaction and your search results. Did the agent learn something new?
      3. Update the YAML mental model to incorporate new insights, refine definitions, or add new keys.
      4. Keep the YAML valid.
      5. Return the response in JSON format with two fields:
         - "newExpertise": The full updated YAML string.
         - "summary": A short 1-sentence description of what was learned (mention if external sources were used).

      If nothing new was learned, return the original YAML and a summary stating "No significant changes."
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        tools: [{ googleSearch: {} }] // Enable search for learning
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");

    const result = JSON.parse(jsonText);
    return {
      newExpertise: result.newExpertise,
      summary: result.summary,
      sources: extractSources(response)
    };

  } catch (error) {
    console.error("Self Improvement Error:", error);
    throw error;
  }
};

export const trainExpert = async (
  expert: Expert,
  trainingData: string
): Promise<{ newExpertise: string; summary: string }> => {
  try {
    const ai = getAiClient();
    const model = 'gemini-3-flash-preview';

    const prompt = `
      You are a Knowledge Ingestion System.
      
      Target Agent: ${expert.name} (${expert.type})
      Current Mental Model (YAML):
      \`\`\`yaml
      ${expert.expertise}
      \`\`\`

      New Raw Training Data (Code/Text/JSON/SQL):
      \`\`\`
      ${trainingData}
      \`\`\`

      Task:
      1. Analyze the raw training data. Extract relevant structural information, rules, schemas, or logic that pertains to this agent's type.
      2. INTELLIGENTLY MERGE this new knowledge into the existing YAML mental model.
      3. Do NOT overwrite existing knowledge unless it conflicts. Expand the model.
      4. Ensure the output is valid YAML.
      5. Return JSON:
         - "newExpertise": The full merged YAML string.
         - "summary": A very brief summary of what was ingested (e.g. "Ingested User schema" or "Added Auth API endpoints").
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");

    const result = JSON.parse(jsonText);
    return {
      newExpertise: result.newExpertise,
      summary: result.summary
    };

  } catch (error) {
    console.error("Training Error:", error);
    throw error;
  }
};

export const generateMetaContent = async (
  type: 'prompt' | 'agent' | 'skill',
  input: string
): Promise<string> => {
  try {
    const ai = getAiClient();
    const model = 'gemini-3-flash-preview';
    
    let systemInstruction = "You are a Meta-Agent architect.";
    let prompt = "";

    switch(type) {
      case 'prompt':
        systemInstruction = "You are an expert Prompt Engineer. Your goal is to create highly effective, structured system prompts.";
        prompt = `Create a robust, advanced system prompt template for an AI agent that needs to accomplish the following task:\n\n"${input}"\n\nInclude sections for Role, Context, Rules, and Output Format.`;
        break;
      case 'agent':
        systemInstruction = "You are an AI Architect. You design autonomous agent specifications.";
        prompt = `Define a complete Agent Specification in YAML format for an agent described as:\n\n"${input}"\n\nInclude fields for: name, role, description, mental_model (initial knowledge), and capabilities.`;
        break;
      case 'skill':
        systemInstruction = "You are a Senior Software Engineer. You write clean, reusable code functions (skills).";
        prompt = `Write a clean, self-contained JavaScript/TypeScript function (Skill) that performs this task:\n\n"${input}"\n\nInclude JSDoc comments and error handling.`;
        break;
    }

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { systemInstruction }
    });

    return response.text || "Failed to generate content.";
  } catch (error) {
    console.error("Meta Generation Error:", error);
    return "Error generating content. Please check logs.";
  }
};

export const generateMermaidDiagram = async (
  expertiseYaml: string,
  expertType: string
): Promise<string> => {
  try {
    const ai = getAiClient();
    const model = 'gemini-3-flash-preview';

    const prompt = `
      Expert Domain: ${expertType}
      Mental Model (YAML):
      \`\`\`yaml
      ${expertiseYaml}
      \`\`\`

      Task: Generate a Mermaid.js diagram code to visualize this mental model.

      Requirements:
      1. Use valid Mermaid.js syntax.
      2. Choose the most appropriate diagram type (e.g., erDiagram for databases, graph TD for architecture).
      3. Use clear, concise labels.
      4. Escape any special characters in labels using double quotes if necessary.
      5. Return the result in JSON format with a "mermaidCode" property containing the raw string.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { 
        responseMimeType: "application/json" 
      }
    });

    let jsonText = response.text;
    if(!jsonText) return "graph TD\nError[No response from AI]";

    // Clean up potential markdown formatting from JSON response
    jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
      const result = JSON.parse(jsonText);
      return result.mermaidCode || "graph TD\nError[Invalid JSON response structure]";
    } catch (e) {
      console.error("JSON Parse Error for Diagram:", e);
      // Fallback: try to extract mermaid code if strictly not JSON
      if (jsonText.includes("graph ") || jsonText.includes("erDiagram")) {
        return jsonText;
      }
      return "graph TD\nError[Failed to parse diagram JSON]";
    }
    
  } catch (error) {
    console.error("Diagram Generation Error:", error);
    return "graph TD\nError[Failed to generate diagram]";
  }
};

// --- WAR ROOM LOGIC ---

export const getWarRoomTurn = async (
  problem: string,
  history: WarRoomMessage[],
  experts: Expert[]
): Promise<{ speakerId: string; speakerName: string; content: string; isConsensus: boolean }> => {
  try {
    const ai = getAiClient();
    const model = 'gemini-3-flash-preview';

    // Construct context of who is in the room
    const expertsContext = experts.map(e => `
      ID: ${e.id}
      Name: ${e.name}
      Type: ${e.type}
      Mental Model Summary: ${e.description}
      Expertise Preview: ${e.expertise.substring(0, 300)}... (truncated)
    `).join('\n---\n');

    // Construct Transcript
    const transcript = history.map(h => `${h.speakerName} (${h.role}): ${h.content}`).join('\n');

    const systemInstruction = `
      You are the Moderator (System) of an AI Expert War Room.
      Your goal is to orchestrate a debate to solve the user's problem.

      Participants (Experts):
      ${expertsContext}

      User Problem: "${problem}"

      Rules:
      1. Decide who should speak next based on the transcript.
      2. If a specific expert needs to provide technical details, simulate that expert (speak AS them).
      3. If the experts have debated enough and a solution is clear, YOU (Moderator) speak to summarize the consensus.
      4. Keep turns concise (under 50 words unless providing code/schema).
      5. Encourage conflict/correction if an expert is wrong.
      6. Do NOT repeat the same speaker twice in a row unless they are clarifying.
    `;

    const prompt = `
      Current Transcript:
      ${transcript}

      Task: Generate the next turn.
      
      Return JSON:
      {
        "speakerId": "ID of the expert speaking OR 'moderator'",
        "speakerName": "Name of expert OR 'Moderator'",
        "content": "The message content (in first person as the speaker)",
        "isConsensus": boolean (true ONLY if the Moderator is providing the final solution)
      }
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json"
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No response");
    
    return JSON.parse(jsonText);

  } catch (error) {
    console.error("War Room Error:", error);
    return {
      speakerId: 'moderator',
      speakerName: 'Moderator',
      content: 'Communication link disrupted. Ending session.',
      isConsensus: true
    };
  }
};