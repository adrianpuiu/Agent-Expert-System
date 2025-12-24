import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, Sparkles, Users, Globe, ExternalLink, Code, LayoutTemplate, ListTodo, Paperclip, ImageIcon, Trash2 } from 'lucide-react';
import { Expert, ChatMessage, ExpertStatus } from '../types';
import MermaidDiagram from './MermaidDiagram';
import ArtifactPanel, { Artifact } from './ArtifactPanel';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  expert: Expert | null;
  onSendMessage: (message: string, image?: string) => Promise<void>;
  onGenerateActionPlan: () => Promise<void>;
  messages: ChatMessage[];
  isProcessing: boolean;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, expert, onSendMessage, onGenerateActionPlan, messages, isProcessing }) => {
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Artifact State
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [showArtifacts, setShowArtifacts] = useState(false);
  const [activeArtifactId, setActiveArtifactId] = useState<string | null>(null);

  // Parse messages for artifacts whenever they change
  useEffect(() => {
    if (messages.length === 0) {
      setArtifacts([]);
      return;
    }

    const newArtifacts: Artifact[] = [];
    const codeBlockRegex = /```(\w+)?(?::([\w\.-]+))?\n([\s\S]*?)```/g;

    messages.forEach((msg, msgIdx) => {
      if (msg.role !== 'model') return;
      
      let match;
      while ((match = codeBlockRegex.exec(msg.text)) !== null) {
        const language = match[1] || 'text';
        const filename = match[2] || `snippet-${msgIdx}-${newArtifacts.length + 1}.${language === 'typescript' || language === 'ts' ? 'ts' : language === 'javascript' || language === 'js' ? 'js' : 'txt'}`;
        const content = match[3];

        const id = `art-${msgIdx}-${match.index}`;
        newArtifacts.push({ id, language, filename, content });
      }
    });

    if (newArtifacts.length !== artifacts.length) {
       setArtifacts(newArtifacts);
       if (newArtifacts.length > 0 && !activeArtifactId) {
         setActiveArtifactId(newArtifacts[newArtifacts.length - 1].id);
         setShowArtifacts(true);
       }
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showArtifacts]); 

  if (!isOpen || !expert) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || isProcessing) return;
    
    const msg = input;
    const img = selectedImage || undefined;
    
    setInput('');
    setSelectedImage(null); // Clear image after sending
    await onSendMessage(msg, img);
  };

  const handlePlanGeneration = async () => {
    setIsGeneratingPlan(true);
    await onGenerateActionPlan();
    setIsGeneratingPlan(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setSelectedImage(reader.result as string);
          };
          reader.readAsDataURL(file);
          e.preventDefault(); // Prevent default paste behavior if it was an image
        }
      }
    }
  };

  const renderMessageContent = (text: string) => {
    // Regex to split by code blocks, capturing the block
    const parts = text.split(/(```mermaid[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```mermaid')) {
        const code = part.replace(/^```mermaid\s*/, '').replace(/```$/, '').trim();
        return (
          <div key={index} className="my-3 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm w-full">
             <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-2">
               <div className="w-2 h-2 rounded-full bg-indigo-500" />
               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Visual Architecture</span>
             </div>
             {/* Fixed height container for diagram */}
             <div className="h-64 w-full bg-white relative">
                <MermaidDiagram code={code} />
             </div>
          </div>
        );
      }
      
      // Regular text
      if (!part.trim()) return null;
      return <p key={index} className="whitespace-pre-wrap leading-relaxed mb-2 last:mb-0">{part}</p>;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className={`
          bg-white rounded-xl shadow-2xl flex overflow-hidden transition-all duration-300
          ${showArtifacts ? 'w-full max-w-[90vw] h-[85vh]' : 'w-full max-w-2xl h-[600px] flex-col'}
        `}
      >
        
        {/* Main Chat Column */}
        <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white z-10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Bot className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-800">Chat with {expert.name}</h2>
                  <p className="text-xs text-gray-500">Ask questions based on current expertise</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Action Plan Generator */}
                {messages.length > 2 && (
                  <button
                    onClick={handlePlanGeneration}
                    disabled={isGeneratingPlan || isProcessing}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border bg-white border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 disabled:opacity-50"
                    title="Convert conversation to Action Items"
                  >
                    {isGeneratingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <ListTodo className="w-4 h-4" />}
                    <span className="hidden sm:inline">{isGeneratingPlan ? 'Parsing...' : 'Generate Plan'}</span>
                  </button>
                )}

                {artifacts.length > 0 && (
                  <button 
                    onClick={() => setShowArtifacts(!showArtifacts)}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border
                      ${showArtifacts 
                        ? 'bg-gray-100 text-gray-900 border-gray-300' 
                        : 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700 shadow-md shadow-blue-200'}
                    `}
                  >
                    {showArtifacts ? <LayoutTemplate className="w-4 h-4" /> : <Code className="w-4 h-4" />}
                    {showArtifacts ? 'Hide Workbench' : `View ${artifacts.length} Artifacts`}
                  </button>
                )}
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Real-time Collaboration Status Banner */}
            {expert.status === ExpertStatus.COLLABORATING && (
              <div className="bg-indigo-50 border-b border-indigo-100 p-2.5 flex items-center justify-center gap-3 text-xs font-medium text-indigo-700 animate-in slide-in-from-top-2 duration-300 flex-shrink-0">
                <div className="relative">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
                </div>
                <span>
                  <span className="font-bold">{expert.name}</span> is now collaborating with <span className="font-bold">{expert.collaboratingWith}</span>
                </span>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 custom-scrollbar">
              {messages.length === 0 && (
                <div className="text-center text-gray-400 mt-20">
                  <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Start a conversation with {expert.name}.</p>
                </div>
              )}
              
              {messages.map((msg, idx) => {
                if (msg.role === 'system') {
                  return (
                    <div key={idx} className="flex justify-center my-4 animate-in fade-in slide-in-from-bottom-2">
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 text-purple-800 text-xs px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="font-medium">{msg.text}</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`
                      max-w-[90%] rounded-2xl px-4 py-3 text-sm overflow-hidden shadow-sm
                      ${msg.role === 'user' 
                        ? 'bg-orange-600 text-white rounded-tr-none' 
                        : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'}
                    `}>
                      {msg.image && (
                         <div className="mb-3 rounded-lg overflow-hidden max-w-full">
                           <img src={msg.image} alt="User upload" className="max-h-64 object-cover" />
                         </div>
                      )}
                      <div className="w-full">
                        {renderMessageContent(msg.text)}
                      </div>
                      
                      {/* Sources Display */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                          <div className="w-full text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <Globe className="w-3 h-3" /> Sources
                          </div>
                          {msg.sources.map((source, i) => (
                            <a 
                              key={i} 
                              href={source.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded text-[10px] text-gray-600 transition-colors max-w-full truncate"
                              title={source.title}
                            >
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate max-w-[150px]">{source.title || 'Web Source'}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-600" />
                    <span className="text-xs text-gray-500">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0 relative">
              {/* Image Preview */}
              {selectedImage && (
                <div className="absolute bottom-full left-4 mb-2 bg-white p-2 rounded-lg shadow-lg border border-gray-200 animate-in slide-in-from-bottom-2 fade-in">
                  <div className="relative">
                    <img src={selectedImage} alt="Preview" className="h-20 w-auto rounded object-cover" />
                    <button 
                      onClick={() => setSelectedImage(null)}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex gap-2">
                <input 
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors border border-gray-200"
                  title="Attach Image"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Ask a question or paste an image..."
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                  disabled={isProcessing}
                />
                <button 
                  type="submit" 
                  disabled={(!input.trim() && !selectedImage) || isProcessing}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg px-4 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
        </div>

        {/* Artifact Workbench Column */}
        {showArtifacts && (
           <ArtifactPanel 
             artifacts={artifacts}
             activeArtifactId={activeArtifactId}
             onSelect={setActiveArtifactId}
             onClose={() => setShowArtifacts(false)}
           />
        )}

      </div>
    </div>
  );
};

export default ChatModal;