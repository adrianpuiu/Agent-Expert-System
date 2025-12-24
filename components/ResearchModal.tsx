import React, { useState } from 'react';
import { X, Globe, Search, Clock, CheckCircle } from 'lucide-react';
import { Expert } from '../types';

interface ResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  expert: Expert | null;
  onResearchQueue: (expertId: string, topic: string) => void;
}

const ResearchModal: React.FC<ResearchModalProps> = ({ isOpen, onClose, expert, onResearchQueue }) => {
  const [topic, setTopic] = useState('');

  if (!isOpen || !expert) return null;

  const handleQueue = () => {
    if (!topic.trim()) return;
    onResearchQueue(expert.id, topic);
    onClose();
    setTopic('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-900 to-indigo-900 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Research Mission</h2>
              <p className="text-blue-200 text-sm">Update {expert.name}'s mental model</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-blue-200 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4 bg-gray-50">
           <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-3">
             <Search className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
             <div className="text-sm text-indigo-800">
               <p className="font-semibold">Active Research</p>
               <p className="opacity-90">The agent will use Google Search to find real-time documentation, updates, and best practices for the topic you provide.</p>
             </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">Topic to Research</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. React 19 Server Actions migration guide"
              className="w-full p-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium text-gray-800 shadow-sm transition-all"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleQueue()}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-white border-t border-gray-200 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleQueue}
            disabled={!topic.trim()}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all
              ${!topic.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 hover:shadow-xl'
              }
            `}
          >
            <Clock className="w-4 h-4" />
            Queue Research
          </button>
        </div>

      </div>
    </div>
  );
};

export default ResearchModal;
