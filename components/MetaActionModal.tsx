import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Bot, 
  Zap, 
  ArrowRight, 
  Check, 
  Copy, 
  Loader2, 
  ChevronRight, 
  Wand2, 
  Terminal, 
  User, 
  Code,
  ArrowLeft,
  RefreshCw
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
  const [step, setStep] = useState<'input' | 'generating' | 'result'>('input');
  
  // Input State
  const [field1, setField1] = useState('');
  const [field2, setField2] = useState('');
  const [field3, setField3] = useState('');
  
  // Result State
  const [result, setResult] = useState('');
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setResult('');
      setField1('');
      setField2('');
      setField3('');
      setLoadingMsgIndex(0);
    }
  }, [isOpen, type]);

  // Loading Animation Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'generating') {
      interval = setInterval(() => {
        setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [step]);

  if (!isOpen || !type) return null;

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
          fields: [
            { label: "Core Task / Goal", placeholder: "What is the primary task the AI must accomplish?", type: 'textarea', val: field1, set: setField1 },
            { label: "Target Audience", placeholder: "Who is this prompt for? (e.g., Developers, 5-year-olds)", type: 'input', val: field2, set: setField2 },
            { label: "Constraints & Style", placeholder: "Any specific restrictions or tone requirements?", type: 'input', val: field3, set: setField3 }
          ]
        };
      case 'agent':
        return {
          title: "Agent Architect",
          subtitle: "Define autonomous agent specifications",
          icon: <Bot className="w-6 h-6 text-white" />,
          color: "from-orange-500 to-red-600",
          shadow: "shadow-orange-500/20",
          fields: [
            { label: "Agent Name", placeholder: "e.g., SecurityAuditBot", type: 'input', val: field1, set: setField1 },
            { label: "Role & Objectives", placeholder: "What is its job? What is it responsible for?", type: 'textarea', val: field2, set: setField2 },
            { label: "Key Knowledge Areas", placeholder: "What specific domain knowledge does it need?", type: 'textarea', val: field3, set: setField3 }
          ]
        };
      case 'skill':
        return {
          title: "Skill Factory",
          subtitle: "Generate reusable code functions",
          icon: <Zap className="w-6 h-6 text-white" />,
          color: "from-emerald-500 to-teal-600",
          shadow: "shadow-emerald-500/20",
          fields: [
            { label: "Function Name", placeholder: "e.g., validateCustomerEmail", type: 'input', val: field1, set: setField1 },
            { label: "Input Arguments", placeholder: "e.g., email: string, checkMX: boolean", type: 'input', val: field2, set: setField2 },
            { label: "Logic & Requirements", placeholder: "Describe what the code should do step-by-step...", type: 'textarea', val: field3, set: setField3 }
          ]
        };
    }
  };

  const config = getConfig();

  const handleGenerate = async () => {
    if (!field1.trim()) return;
    setStep('generating');
    setResult('');
    
    // Construct structured input for the service
    let structuredInput = '';
    if (type === 'prompt') structuredInput = `Task: ${field1}\nTarget Audience: ${field2}\nConstraints: ${field3}`;
    if (type === 'agent') structuredInput = `Name: ${field1}\nRole: ${field2}\nKnowledge: ${field3}`;
    if (type === 'skill') structuredInput = `Function: ${field1}\nInputs: ${field2}\nLogic: ${field3}`;

    try {
      const content = await generateMetaContent(type, structuredInput);
      setResult(content);
      setStep('result');
    } catch (e) {
      console.error(e);
      setStep('input');
      // In a real app, show error toast
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col h-[700px] animate-in fade-in zoom-in duration-200 overflow-hidden">
        
        {/* Header */}
        <div className={`p-6 bg-gradient-to-r ${config.color} relative overflow-hidden flex-shrink-0`}>
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
          <div className="flex gap-2 mt-6">
             <div className={`h-1 flex-1 rounded-full bg-white/30 ${step === 'input' ? 'bg-white' : 'bg-white/80'}`} />
             <div className={`h-1 flex-1 rounded-full bg-white/30 ${step === 'generating' ? 'bg-white animate-pulse' : step === 'result' ? 'bg-white/80' : ''}`} />
             <div className={`h-1 flex-1 rounded-full bg-white/30 ${step === 'result' ? 'bg-white' : ''}`} />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-gray-50 flex flex-col relative">
          
          {/* STEP 1: INPUT */}
          {step === 'input' && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 animate-in slide-in-from-right-8 duration-300">
              <div className="space-y-6 max-w-3xl mx-auto">
                 {config.fields.map((field, idx) => (
                   <div key={idx} className="space-y-2">
                     <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                       {idx === 0 && <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs">1</span>}
                       {idx === 1 && <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs">2</span>}
                       {idx === 2 && <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs">3</span>}
                       {field.label}
                     </label>
                     {field.type === 'textarea' ? (
                       <textarea
                         value={field.val}
                         onChange={(e) => field.set(e.target.value)}
                         placeholder={field.placeholder}
                         className="w-full h-32 p-4 rounded-xl border border-gray-200 focus:border-transparent focus:ring-2 focus:ring-opacity-50 focus:outline-none resize-none bg-white shadow-sm transition-all focus:ring-indigo-500 text-gray-800"
                         autoFocus={idx === 0}
                       />
                     ) : (
                        <input
                         type="text"
                         value={field.val}
                         onChange={(e) => field.set(e.target.value)}
                         placeholder={field.placeholder}
                         className="w-full p-4 rounded-xl border border-gray-200 focus:border-transparent focus:ring-2 focus:ring-opacity-50 focus:outline-none bg-white shadow-sm transition-all focus:ring-indigo-500 text-gray-800"
                       />
                     )}
                   </div>
                 ))}
              </div>
            </div>
          )}

          {/* STEP 2: GENERATING */}
          {step === 'generating' && (
            <div className="absolute inset-0 z-10 bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
               <div className="relative mb-8">
                  <div className={`absolute inset-0 blur-2xl opacity-20 bg-gradient-to-r ${config.color} rounded-full animate-pulse`} />
                  <div className="relative p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
                    <Wand2 className={`w-12 h-12 animate-spin-slow bg-gradient-to-r ${config.color} bg-clip-text text-transparent`} />
                  </div>
               </div>
               
               <h3 className="text-xl font-bold text-gray-900 mb-2 min-h-[28px]">
                 {LOADING_MESSAGES[loadingMsgIndex]}
               </h3>
               <p className="text-gray-500 text-sm max-w-md mx-auto">
                 Using Gemini 2.0 Flash Thinking to construct high-quality, structured output based on your requirements.
               </p>

               <div className="mt-8 flex gap-1">
                 {[0, 1, 2].map(i => (
                   <div 
                    key={i} 
                    className="w-2.5 h-2.5 rounded-full bg-gray-300 animate-bounce" 
                    style={{ animationDelay: `${i * 150}ms` }}
                   />
                 ))}
               </div>
            </div>
          )}

          {/* STEP 3: RESULT */}
          {step === 'result' && (
            <div className="flex-1 flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300">
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                 <div className="flex items-center gap-2 text-sm text-gray-600">
                   <Check className="w-4 h-4 text-green-500" />
                   Generation Complete
                 </div>
                 <div className="flex gap-2">
                   <button
                     onClick={() => setStep('input')}
                     className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                   >
                     <RefreshCw className="w-3.5 h-3.5" />
                     Refine
                   </button>
                   <button
                     onClick={handleCopy}
                     className={`
                       flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all
                       ${copied ? 'bg-green-100 text-green-700' : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'}
                     `}
                   >
                     {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                     {copied ? 'Copied' : 'Copy'}
                   </button>
                 </div>
              </div>
              
              <div className="flex-1 bg-[#1e1e1e] overflow-auto custom-scrollbar p-6">
                <pre className="font-mono text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                  <code>{result}</code>
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        {step === 'input' && (
          <div className="p-6 bg-white border-t border-gray-100 flex justify-between items-center">
             <button 
               onClick={onClose}
               className="px-6 py-3 rounded-xl text-sm font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
             >
               Cancel
             </button>
             <button
               onClick={handleGenerate}
               disabled={!field1.trim()}
               className={`
                 flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all
                 ${!field1.trim() 
                    ? 'bg-gray-300 cursor-not-allowed shadow-none' 
                    : `bg-gradient-to-r ${config.color} ${config.shadow} hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`
                 }
               `}
             >
               <Sparkles className="w-4 h-4" />
               Generate Content
               <ArrowRight className="w-4 h-4 ml-1" />
             </button>
          </div>
        )}

        {step === 'result' && (
          <div className="p-6 bg-white border-t border-gray-100 flex justify-between items-center">
             <button 
               onClick={() => setStep('input')}
               className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
             >
               <ArrowLeft className="w-4 h-4" />
               Back to Editor
             </button>
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