import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type, FunctionResponse } from "@google/genai";
import { Expert } from '../types';
import { chatWithExpert } from './geminiService';

// Audio Contexts
let inputAudioContext: AudioContext | null = null;
let outputAudioContext: AudioContext | null = null;
let inputSource: MediaStreamAudioSourceNode | null = null;
let processor: ScriptProcessorNode | null = null;

// Helpers
const createBlob = (data: Float32Array): { data: string; mimeType: string } => {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  
  return {
    data: base64,
    mimeType: 'audio/pcm;rate=16000',
  };
};

const decodeAudioData = async (
  base64: string,
  ctx: AudioContext
): Promise<AudioBuffer> => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const dataInt16 = new Int16Array(bytes.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
};

export class LiveVoiceSession {
  private sessionPromise: Promise<any> | null = null;
  private currentSession: any = null;
  private isConnected = false;
  private nextStartTime = 0;
  private activeSources = new Set<AudioBufferSourceNode>();

  constructor(
    private experts: Expert[],
    private onStatusChange: (status: 'connecting' | 'connected' | 'speaking' | 'listening' | 'disconnected' | 'error') => void,
    private onAudioLevel: (level: number) => void
  ) {}

  async connect() {
    try {
      this.onStatusChange('connecting');
      const apiKey = process.env.API_KEY;
      if (!apiKey) throw new Error("No API Key");

      const ai = new GoogleGenAI({ apiKey });

      // Setup Audio
      inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const outputNode = outputAudioContext.createGain();
      outputNode.connect(outputAudioContext.destination);

      // Define Tool for Consulting Experts
      const consultTool: FunctionDeclaration = {
        name: "consult_expert",
        description: "Ask a specific text-based expert agent a question to get information from their mental model.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            expertName: {
              type: Type.STRING,
              description: "The name of the expert (e.g., 'Database Expert', 'API Expert')."
            },
            question: {
              type: Type.STRING,
              description: "The specific question to ask the expert."
            }
          },
          required: ["expertName", "question"]
        }
      };

      // Start Session
      this.sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: async () => {
            this.isConnected = true;
            this.onStatusChange('connected');
            
            // Start Mic Stream
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (!inputAudioContext) return;

            inputSource = inputAudioContext.createMediaStreamSource(stream);
            processor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate rough volume level for visualizer
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              this.onAudioLevel(rms * 5); // Amplify for visual effect

              const blob = createBlob(inputData);
              this.sessionPromise?.then(session => {
                session.sendRealtimeInput({ media: blob });
              });
            };

            inputSource.connect(processor);
            processor.connect(inputAudioContext.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Audio Output
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && outputAudioContext) {
              this.onStatusChange('speaking');
              
              this.nextStartTime = Math.max(this.nextStartTime, outputAudioContext.currentTime);
              const buffer = await decodeAudioData(audioData, outputAudioContext);
              
              const source = outputAudioContext.createBufferSource();
              source.buffer = buffer;
              source.connect(outputNode);
              
              source.addEventListener('ended', () => {
                this.activeSources.delete(source);
                if (this.activeSources.size === 0) {
                  this.onStatusChange('listening');
                }
              });

              source.start(this.nextStartTime);
              this.nextStartTime += buffer.duration;
              this.activeSources.add(source);
            }

            // Handle Interruption
            if (msg.serverContent?.interrupted) {
              this.stopAllAudio();
              this.onStatusChange('listening');
            }

            // Handle Tool Calls
            if (msg.toolCall) {
              for (const call of msg.toolCall.functionCalls) {
                if (call.name === 'consult_expert') {
                  this.handleConsultation(call.id, call.args);
                }
              }
            }
          },
          onclose: () => {
            this.isConnected = false;
            this.onStatusChange('disconnected');
          },
          onerror: (e) => {
            console.error(e);
            this.onStatusChange('error');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: `
            You are the "Neural Link Meta-Agent" for an Expert Agent System.
            You have voice access to a swarm of AI experts.
            
            Available Experts:
            ${this.experts.map(e => `- ${e.name} (${e.type})`).join('\n')}

            Your goal is to help the user by coordinating these experts.
            If the user asks a specific technical question, use the 'consult_expert' tool to ask the relevant expert, then summarize their answer verbally.
            Keep responses conversational, concise, and professional (sci-fi AI persona).
          `,
          tools: [{ functionDeclarations: [consultTool] }]
        }
      });
      
      this.currentSession = await this.sessionPromise;

    } catch (e) {
      console.error("Live Connection Error", e);
      this.onStatusChange('error');
    }
  }

  private async handleConsultation(callId: string, args: any) {
    const { expertName, question } = args;
    
    // Find expert
    const expert = this.experts.find(e => 
      e.name.toLowerCase().includes(expertName.toLowerCase()) ||
      expertName.toLowerCase().includes(e.name.toLowerCase())
    );

    let resultText = "Expert not found.";
    
    if (expert) {
       // Simulate chat
       const response = await chatWithExpert(expert, question, [], this.experts);
       resultText = `${expert.name} says: ${response.text}`;
    }

    // Send response back to Live model
    if (this.currentSession) {
       const response: FunctionResponse = {
         id: callId,
         name: 'consult_expert',
         response: { result: resultText }
       };
       this.currentSession.sendToolResponse({ functionResponses: [response] });
    }
  }

  private stopAllAudio() {
    this.activeSources.forEach(s => {
      try { s.stop(); } catch(e) {}
    });
    this.activeSources.clear();
    this.nextStartTime = 0;
    if (outputAudioContext) {
      this.nextStartTime = outputAudioContext.currentTime;
    }
  }

  disconnect() {
    this.stopAllAudio();
    if (processor) {
      processor.disconnect();
      processor.onaudioprocess = null;
    }
    if (inputSource) inputSource.disconnect();
    if (inputAudioContext) inputAudioContext.close();
    if (outputAudioContext) outputAudioContext.close();
    
    // There is no explicit .close() on the session object returned by connect() in the current SDK version based on docs,
    // but we can rely on GC and WebSocket closing if the client is destroyed, or send a close signal if available.
    // The prompt docs say "use session.close()", assuming it exists on the resolved session.
    // However, types might vary. We'll try.
    if (this.currentSession && typeof this.currentSession.close === 'function') {
        this.currentSession.close();
    }
  }
}
