import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Bot, 
  Zap, 
  ArrowRight, 
  Check, 
  Copy, 
  RefreshCw, 
  ArrowLeft, 
  Wand2, 
  Target, 
  Users, 
  Shield, 
  Fingerprint, 
  BookOpen, 
  Briefcase,
  Code2,
  Terminal,
  Cpu
} from 'lucide-react';
import { generateMetaContent } from '../services/geminiService';

export type MetaActionType = 'prompt' | 'agent' | 'skill';

interface MetaActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: MetaActionType | null;
}

const LOADING_MESSAGES = [
  "Initializing Meta-Agent context...",
  "Analyzing requirements...",
  "Consulting expert patterns...",
  "Drafting structural logic...",
  "Optimizing output for best performance...",
  "Finalizing generation..."
];

const MetaActionModal: React.FC<MetaActionModalProps> = ({ isOpen, onClose, type }) => {
  // Wizard State
  // Steps: 0, 1, 2 (Inputs), 3 (Generating), 4 (Result)
  const [currentStep, setCurrentStep] = useState(0);
  
  // Inputs stored in array for easy indexing
  const [inputs, setInputs] = useState<string[]>(['', '', '']);
  
  // Result State
  const [result, setResult] = useState('');
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setInputs(['', '', '']);
      setResult('');
      setLoadingMsgIndex(0);
    }
  }, [isOpen, type]);

  // Loading Animation Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentStep === 3) {
      interval = setInterval(() => {
        setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [currentStep]);

  if (!isOpen || !type) return null;

  const updateInput = (value: string) => {
    const newInputs = [...inputs];
    newInputs[currentStep] = value;
    setInputs(newInputs);
  };

  // Configuration based on Type
  const getConfig = () => {
    switch(type) {
      case 'prompt':
        return {
          title: "Meta Prompt Engineer",
          subtitle: "Create structured system prompts",
          icon: <Sparkles className="w-6 h-6 text-white" />,
          color: "from-purple-600 to-indigo-600",
          shadow: "shadow-purple-500/20",
          accentColor: "text-purple-600",
          steps: [
            { 
              label: "Core Task", 
              question: "What is the primary goal?",
              description: "Define the specific task the AI must accomplish. Be as precise as possible.",
              icon: Target, 
              placeholder: "e.g., Create a Python script to scrape stock prices...", 
              type: 'textarea' 
            },
            { 
              label: "Audience", 
              question: "Who is this for?",
              description: "The target audience determines the tone, complexity, and format of the response.",
              icon: Users, 
              placeholder: "e.g., Junior Developers, Non-technical stakeholders, 5-year-old...", 
              type: 'input' 
            },
            { 
              label: "Constraints", 
              question: "Any boundaries?",
              description: "Set specific restrictions, style guides, or output formats (JSON, Markdown, etc).",
              icon: Shield, 
              placeholder: "e.g., JSON output only, no markdown, professional tone...", 
              type: 'input' 
            }
          ]
        };
      case 'agent':
        return {
          title: "Agent Architect",
          subtitle: "Define autonomous agent specifications",
          icon: <Bot className="w-6 h-6 text-white" />,
          color: "from-orange-500 to-red-600",
          shadow: "shadow-orange-500/20",
          accentColor: "text-orange-600",
          steps: [
            { 
              label: "Identity", 
              question: "Who is this agent?",
              description: "Give the agent a name and a high-level persona.",
              icon: Fingerprint, 
              placeholder: "e.g., SecurityAuditBot, The Code Reviewer...", 
              type: 'input' 
            },
            { 
              label: "Role", 
              question: "What is its purpose?",
              description: "Describe its responsibilities and what success looks like.",
              icon: Briefcase, 
              placeholder: "e.g., Responsible for analyzing smart contracts for vulnerabilities...", 
              type: 'textarea' 
            },
            { 
              label: "Knowledge", 
              question: "What does it know?",
              description: "Define the specific domain knowledge or expertise required.",
              icon: BookOpen, 
              placeholder: "e.g., Deep understanding of Solidity, OWASP Top 10, Gas optimization...", 
              type: 'textarea' 
            }
          ]
        };
      case 'skill':
        return {
          title: "Skill Factory",
          subtitle: "Generate reusable code functions",
          icon: <Zap className="w-6 h-6 text-white" />,
          color: "from-emerald-500 to-teal-600",
          shadow: "shadow-emerald-500/20",
          accentColor: "text-emerald-600",
          steps: [
            { 
              label: "Functionality", 
              question: "What does it do?",
              description: "Name the function and describe its single responsibility.",
              icon: Code2, 
              placeholder: "e.g., validateCustomerEmail", 
              type: 'input' 
            },
            { 
              label: "Inputs/Outputs", 
              question: "What goes in and out?",
              description: "Define arguments, types, and return values.",
              icon: Terminal, 
              placeholder: "e.g., email: string, checkMX: boolean -> Promise<boolean>", 
              type: 'input' 
            },
            { 
              label: "Logic", 
              question: "How does it work?",
              description: "Describe the algorithmic steps or business logic required.",
              icon: Cpu, 
              placeholder: "e.g., Regex check first, then DNS lookup, handle timeouts...", 
              type: 'textarea' 
            }
          ]
        };
    }
  };

  const config = getConfig();

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(c => c + 1);
    } else {
      handleGenerate();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(c => c - 1);
    }
  };

  const handleGenerate = async () => {
    setCurrentStep(3); // Generating state
    setResult('');
    
    // Construct structured input for the service
    let structuredInput = '';
    if (type === 'prompt') structuredInput = `Task: ${inputs[0]}\nTarget Audience: ${inputs[1]}\nConstraints: ${inputs[2]}`;
    if (type === 'agent') structuredInput = `Name: ${inputs[0]}\nRole: ${inputs[1]}\nKnowledge: ${inputs[2]}`;
    if (type === 'skill') structuredInput = `Function: ${inputs[0]}\nInputs: ${inputs[1]}\nLogic: ${inputs[2]}`;

    try {
      const content = await generateMetaContent(type, structuredInput);
      setResult(content);
      setCurrentStep(4); // Result state
    } catch (e) {
      console.error(e);
      setCurrentStep(2); // Go back to last input on error
      // In a real app, show error toast
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const CurrentStepIcon = currentStep < 3 ? config.steps[currentStep].icon : Sparkles;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col h-[650px] animate-in fade-in zoom-in duration-200 overflow-hidden font-sans">
        
        {/* Header */}
        <div className={`p-6 bg-gradient-to-r ${config.color} relative overflow-hidden flex-shrink-0 transition-all duration-500`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 transform rotate-12 scale-150 pointer-events-none">
            {config.icon}
          </div>
          <div className="relative z-10 flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl shadow-inner border border-white/10">
                {config.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{config.title}</h2>
                <p className="text-white/80 text-sm font-medium">{config.subtitle}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Indicators */}
          <div className="flex gap-2 mt-8 px-1">
             {[0, 1, 2].map(idx => (
               <div 
                 key={idx}
                 className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                   currentStep >= idx 
                    ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' 
                    : 'bg-black/20'
                 }`} 
               />
             ))}
             <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                   currentStep >= 3 
                    ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' 
                    : 'bg-black/20'
                 }`} 
             />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-gray-50 flex flex-col relative">
          
          {/* WIZARD INPUT STEPS (0, 1, 2) */}
          {currentStep < 3 && (
            <div className="flex-1 flex flex-col p-8 animate-in slide-in-from-right-8 duration-300">
              <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-center">
                
                {/* Step Indicator & Question */}
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg bg-white shadow-sm border border-gray-100 ${config.accentColor}`}>
                      <CurrentStepIcon className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                      Step {currentStep + 1} of 3
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">
                    {config.steps[currentStep].question}
                  </h3>
                  <p className="text-gray-500 text-lg">
                    {config.steps[currentStep].description}
                  </p>
                </div>

                {/* Input Field */}
                <div className="relative group">
                   {config.steps[currentStep].type === 'textarea' ? (
                     <textarea
                       value={inputs[currentStep]}
                       onChange={(e) => updateInput(e.target.value)}
                       placeholder={config.steps[currentStep].placeholder}
                       className="w-full h-40 p-6 text-lg rounded-2xl border border-gray-200 focus:border-transparent focus:ring-4 focus:ring-opacity-20 focus:outline-none resize-none bg-white shadow-sm transition-all focus:ring-indigo-500 text-gray-800"
                       autoFocus
                     />
                   ) : (
                      <input
                       type="text"
                       value={inputs[currentStep]}
                       onChange={(e) => updateInput(e.target.value)}
                       placeholder={config.steps[currentStep].placeholder}
                       className="w-full p-6 text-lg rounded-2xl border border-gray-200 focus:border-transparent focus:ring-4 focus:ring-opacity-20 focus:outline-none bg-white shadow-sm transition-all focus:ring-indigo-500 text-gray-800"
                       autoFocus
                       onKeyDown={(e) => {
                         if (e.key === 'Enter' && inputs[currentStep].trim()) handleNext();
                       }}
                     />
                   )}
                   <div className="absolute inset-0 rounded-2xl pointer-events-none ring-1 ring-inset ring-gray-900/5 group-focus-within:ring-2 group-focus-within:ring-indigo-500/20" />
                </div>
              </div>
            </div>
          )}

          {/* GENERATING STATE (3) */}
          {currentStep === 3 && (
            <div className="absolute inset-0 z-10 bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
               <div className="relative mb-8">
                  <div className={`absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r ${config.color} rounded-full animate-pulse`} />
                  <div className="relative p-8 bg-white rounded-3xl shadow-2xl border border-gray-100 ring-4 ring-gray-50">
                    <Wand2 className={`w-16 h-16 animate-spin-slow bg-gradient-to-r ${config.color} bg-clip-text text-transparent`} />
                  </div>
               </div>
               
               <h3 className="text-2xl font-bold text-gray-900 mb-3 min-h-[32px] tracking-tight">
                 {LOADING_MESSAGES[loadingMsgIndex]}
               </h3>
               <p className="text-gray-500 text-base max-w-md mx-auto leading-relaxed">
                 The Meta-Agent is synthesizing your inputs into a highly optimized format using Gemini 2.0 Flash Thinking.
               </p>

               <div className="mt-10 flex gap-1.5">
                 {[0, 1, 2].map(i => (
                   <div 
                    key={i} 
                    className="w-3 h-3 rounded-full bg-gray-200 animate-bounce" 
                    style={{ animationDelay: `${i * 150}ms` }}
                   />
                 ))}
               </div>
            </div>
          )}

          {/* RESULT STATE (4) */}
          {currentStep === 4 && (
            <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300">
              <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
                 <div className="flex items-center gap-2 text-sm font-medium text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                   <Check className="w-4 h-4" />
                   Generation Complete
                 </div>
                 <div className="flex gap-2">
                   <button
                     onClick={() => {
                       setCurrentStep(0);
                     }}
                     className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                   >
                     <RefreshCw className="w-3.5 h-3.5" />
                     New
                   </button>
                   <button
                     onClick={handleCopy}
                     className={`
                       flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all border
                       ${copied 
                         ? 'bg-green-50 text-green-700 border-green-200' 
                         : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                       }
                     `}
                   >
                     {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                     {copied ? 'Copied' : 'Copy'}
                   </button>
                 </div>
              </div>
              
              <div className="flex-1 bg-[#1e1e1e] overflow-auto custom-scrollbar p-8">
                <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap leading-relaxed max-w-4xl mx-auto">
                  <code>{result}</code>
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        {currentStep < 3 && (
          <div className="p-6 bg-white border-t border-gray-100 flex justify-between items-center">
             <button 
               onClick={currentStep === 0 ? onClose : handleBack}
               className="px-6 py-3 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors flex items-center gap-2"
             >
               {currentStep > 0 && <ArrowLeft className="w-4 h-4" />}
               {currentStep === 0 ? 'Cancel' : 'Back'}
             </button>
             
             <div className="flex gap-2">
               {currentStep < 2 ? (
                 <button
                   onClick={handleNext}
                   disabled={!inputs[currentStep].trim()}
                   className={`
                     flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all
                     ${!inputs[currentStep].trim() 
                        ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                        : 'bg-gray-900 hover:bg-black hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                     }
                   `}
                 >
                   Next Step
                   <ArrowRight className="w-4 h-4" />
                 </button>
               ) : (
                 <button
                   onClick={handleGenerate}
                   disabled={!inputs[currentStep].trim()}
                   className={`
                     flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all
                     ${!inputs[currentStep].trim() 
                        ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                        : `bg-gradient-to-r ${config.color} ${config.shadow} hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`
                     }
                   `}
                 >
                   <Sparkles className="w-4 h-4" />
                   Generate
                   <ArrowRight className="w-4 h-4 ml-1" />
                 </button>
               )}
             </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="p-6 bg-white border-t border-gray-100 flex justify-end items-center">
             <button
               onClick={onClose}
               className="px-8 py-3 rounded-xl font-bold text-white bg-gray-900 hover:bg-black shadow-lg hover:shadow-xl transition-all"
             >
               Done
             </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default MetaActionModal;