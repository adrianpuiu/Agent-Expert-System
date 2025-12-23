import React, { useState } from 'react';
import { X, Sparkles, Bot, Zap, ArrowRight, Check, Copy, Loader2 } from 'lucide-react';
import { generateMetaContent } from '../services/geminiService';

export type MetaActionType = 'prompt' | 'agent' | 'skill';

interface MetaActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: MetaActionType | null;
}

const MetaActionModal: React.FC<MetaActionModalProps> = ({ isOpen, onClose, type }) => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !type) return null;

  const config = {
    prompt: {
      title: "Generate Meta Prompt",
      icon: <Sparkles className="w-6 h-6 text-white" />,
      color: "from-purple-500 to-indigo-600",
      placeholder: "E.g., An agent that reviews pull requests and checks for security vulnerabilities...",
      buttonText: "Generate Prompt",
      resultLabel: "Generated Prompt Template"
    },
    agent: {
      title: "Build Meta Agent",
      icon: <Bot className="w-6 h-6 text-white" />,
      color: "from-orange-500 to-red-600",
      placeholder: "E.g., A customer support agent for a SaaS platform that handles billing inquiries...",
      buttonText: "Architect Agent",
      resultLabel: "Agent Specification (YAML)"
    },
    skill: {
      title: "Create Meta Skill",
      icon: <Zap className="w-6 h-6 text-white" />,
      color: "from-emerald-500 to-teal-600",
      placeholder: "E.g., A function that validates email addresses and checks domain MX records...",
      buttonText: "Code Skill",
      resultLabel: "Skill Function (TypeScript)"
    }
  }[type];

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    setResult('');
    
    const content = await generateMetaContent(type, input);
    
    setResult(content);
    setIsLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
        
        {/* Header with Dynamic Gradient */}
        <div className={`p-6 bg-gradient-to-r ${config.color} relative overflow-hidden flex-shrink-0`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 transform rotate-12 scale-150 pointer-events-none">
            {config.icon}
          </div>
          <div className="relative z-10 flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-xl shadow-inner">
                {config.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">{config.title}</h2>
                <p className="text-white/80 text-sm font-medium">AI-Powered Generation</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-hidden bg-gray-50/50 flex flex-col">
          {!result ? (
            <div className="space-y-4 flex flex-col h-full">
              <label className="block text-sm font-semibold text-gray-700">
                What should this {type} do?
              </label>
              <textarea
                className="w-full h-40 p-4 rounded-xl border border-gray-200 focus:border-transparent focus:ring-2 focus:ring-orange-500/50 focus:outline-none resize-none bg-white shadow-sm text-gray-800 placeholder-gray-400 transition-all text-base"
                placeholder={config.placeholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleGenerate}
                  disabled={!input.trim() || isLoading}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white shadow-md transition-all
                    ${!input.trim() || isLoading 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : `bg-gradient-to-r ${config.color} hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`
                    }
                  `}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      {config.buttonText}
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center mb-3 flex-shrink-0">
                <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  {config.resultLabel}
                </span>
                <div className="flex gap-2">
                   <button 
                    onClick={() => setResult('')}
                    className="text-xs font-medium text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Generate New
                  </button>
                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs font-medium bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg shadow-sm transition-all active:scale-95"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              
              {/* Result Area */}
              <div className="relative flex-1 bg-[#1e1e1e] rounded-xl overflow-hidden shadow-inner border border-gray-800 group flex flex-col">
                <div className="flex-1 overflow-auto custom-scrollbar p-6">
                  <pre className="font-mono text-sm text-gray-100 whitespace-pre-wrap break-words leading-relaxed selection:bg-orange-500/30">
                    <code>{result}</code>
                  </pre>
                </div>
                {/* Status Bar */}
                <div className="px-4 py-2 bg-[#252526] border-t border-[#333] flex justify-between items-center text-[10px] text-gray-500 font-mono">
                   <span>{result.length} chars</span>
                   <span>{type.toUpperCase()} Generated</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MetaActionModal;