import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, Sparkles, Users } from 'lucide-react';
import { Expert, ChatMessage, ExpertStatus } from '../types';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  expert: Expert | null;
  onSendMessage: (message: string) => Promise<void>;
  messages: ChatMessage[];
  isProcessing: boolean;
}

const ChatModal: React.FC<ChatModalProps> = ({ isOpen, onClose, expert, onSendMessage, messages, isProcessing }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isOpen || !expert) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    const msg = input;
    setInput('');
    await onSendMessage(msg);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Bot className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">Chat with {expert.name}</h2>
              <p className="text-xs text-gray-500">Ask questions based on current expertise</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Real-time Collaboration Status Banner */}
        {expert.status === ExpertStatus.COLLABORATING && (
          <div className="bg-indigo-50 border-b border-indigo-100 p-2.5 flex items-center justify-center gap-3 text-xs font-medium text-indigo-700 animate-in slide-in-from-top-2 duration-300">
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
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                  max-w-[80%] rounded-2xl px-4 py-3 text-sm
                  ${msg.role === 'user' 
                    ? 'bg-orange-600 text-white rounded-tr-none' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'}
                `}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
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
        <div className="p-4 bg-white border-t border-gray-200">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              disabled={isProcessing}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || isProcessing}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg px-4 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;