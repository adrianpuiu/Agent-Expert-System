import React, { useState } from 'react';
import { X, Sparkles, Bot, Loader2, Save, ArrowRight, ArrowLeft, Database, Server, Wifi, Layout, Brain, CheckCircle2 } from 'lucide-react';
import { ExpertType } from '../types';
import { generateMetaContent } from '../services/geminiService';

interface CreateExpertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (expertData: { name: string; type: ExpertType; description: string; expertise: string }) => void;
}

const STEPS = [
  { id: 1, title: 'Identity', desc: 'Name & Type' },
  { id: 2, title: 'Role', desc: 'Context & Goals' },
  { id: 3, title: 'Knowledge', desc: 'Mental Model' }
];

const CreateExpertModal: React.FC<CreateExpertModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<ExpertType>(ExpertType.DATABASE);
  const [description, setDescription] = useState('');
  const [expertise, setExpertise] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(c => c + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(c => c - 1);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    const promptInput = `Name: ${name || 'Unnamed Agent'}
Expert Type: ${type}
Context/Description: ${description}

Please generate a comprehensive initial mental model in YAML format specifically designed for a ${type} Expert.
Ensure the structure reflects domain-specific knowledge (e.g., schemas for Database, endpoints for API, components for Frontend, events for WebSocket).`;

    const content = await generateMetaContent('agent', promptInput);
    setExpertise(content);
    setIsGenerating(false);
  };

  const handleSubmit = () => {
    if (!name || !description || !expertise) return;
    onCreate({ name, type, description, expertise });
    handleClose();
  };

  const handleClose = () => {
    onClose();
    // Reset after transition
    setTimeout(() => {
      setCurrentStep(1);
      setName('');
      setType(ExpertType.DATABASE);
      setDescription('');
      setExpertise('');
    }, 300);
  };

  const getTypeIcon = (t: ExpertType) => {
    switch (t) {
      case ExpertType.DATABASE: return <Database className="w-5 h-5" />;
      case ExpertType.API: return <Server className="w-5 h-5" />;
      case ExpertType.WEBSOCKET: return <Wifi className="w-5 h-5" />;
      case ExpertType.FRONTEND: return <Layout className="w-5 h-5" />;
      case ExpertType.META: return <Brain className="w-5 h-5" />;
      default: return <Bot className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col h-[600px] animate-in fade-in zoom-in duration-200 overflow-hidden">
        
        {/* Header with Progress Steps */}
        <div className="bg-gray-50/80 border-b border-gray-100 p-6">
          <div className="flex justify-between items-start mb-6">
             <div>
               <h2 className="text-xl font-bold text-gray-900">Create New Expert</h2>
               <p className="text-sm text-gray-500">Configure your intelligent agent</p>
             </div>
             <button onClick={handleClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
               <X className="w-5 h-5" />
             </button>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-between px-8 relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 transform -translate-y-1/2" />
            {STEPS.map((step) => {
              const isActive = currentStep >= step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <div key={step.id} className="flex flex-col items-center bg-gray-50 px-2 z-10">
                  <div 
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 border-2
                      ${isActive 
                        ? 'bg-orange-600 border-orange-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-400'
                      }
                      ${isCurrent ? 'ring-4 ring-orange-100' : ''}
                    `}
                  >
                    {isActive ? <CheckCircle2 className="w-5 h-5" /> : step.id}
                  </div>
                  <span className={`text-xs font-medium mt-2 ${isCurrent ? 'text-orange-600' : 'text-gray-500'}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          
          {/* STEP 1: IDENTITY */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">Name your expert</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-4 text-lg bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-300"
                  placeholder="e.g. Senior Database Architect"
                  autoFocus
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-700">Select expert type</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.values(ExpertType).map((t) => (
                    <button
                      key={t}
                      onClick={() => setType(t)}
                      className={`
                        flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all
                        ${type === t 
                          ? 'border-orange-500 bg-orange-50 text-orange-700' 
                          : 'border-gray-100 bg-white hover:border-orange-200 hover:bg-gray-50 text-gray-600'
                        }
                      `}
                    >
                      {getTypeIcon(t)}
                      <span className="text-sm font-medium">{t}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ROLE */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 h-full flex flex-col">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                <Bot className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Why is this important?</p>
                  <p className="opacity-90">The description defines the agent's persona. Be specific about what it should (and shouldn't) do.</p>
                </div>
              </div>

              <div className="space-y-2 flex-1 flex flex-col">
                <label className="text-sm font-semibold text-gray-700">Role Description & Context</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full flex-1 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none text-base"
                  placeholder={`You are a ${type} expert responsible for...\n\nYour goal is to...`}
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* STEP 3: KNOWLEDGE */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300 h-full flex flex-col">
              <div className="flex justify-between items-center">
                 <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                   Initial Mental Model (YAML)
                 </label>
                 <button 
                   onClick={handleGenerate}
                   disabled={isGenerating}
                   className="text-xs font-medium px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg flex items-center gap-1.5 hover:bg-orange-200 transition-colors disabled:opacity-50"
                 >
                   {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                   {isGenerating ? 'Generating...' : 'Regenerate with AI'}
                 </button>
              </div>

              <div className="relative group flex-1">
                 {!expertise && !isGenerating && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1e1e1e] rounded-xl z-10 bg-opacity-95">
                       <Sparkles className="w-8 h-8 text-gray-500 mb-3" />
                       <p className="text-gray-400 text-sm mb-4">No mental model defined yet.</p>
                       <button 
                         onClick={handleGenerate}
                         className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
                       >
                         Auto-Generate Knowledge Base
                       </button>
                    </div>
                 )}
                 
                 <textarea 
                   value={expertise}
                   onChange={(e) => setExpertise(e.target.value)}
                   className="w-full h-full p-4 bg-[#1e1e1e] text-gray-300 font-mono text-sm rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all resize-none custom-scrollbar"
                   placeholder="# YAML content..."
                 />
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <button 
            onClick={currentStep === 1 ? handleClose : handleBack}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 transition-colors"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>
          
          {currentStep < 3 ? (
            <button 
              onClick={handleNext}
              disabled={currentStep === 1 ? !name : !description}
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-200 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Next Step
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={!expertise}
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-200 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Create Expert
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default CreateExpertModal;