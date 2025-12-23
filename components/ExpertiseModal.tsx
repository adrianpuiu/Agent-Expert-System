import React, { useState, useEffect } from 'react';
import { X, RotateCcw, Copy, Check, FileText } from 'lucide-react';
import { Expert, ExpertiseHistory } from '../types';

interface ExpertiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expert: Expert;
  onRevert: (expertId: string, historyItem: ExpertiseHistory) => void;
}

const ExpertiseModal: React.FC<ExpertiseModalProps> = ({ isOpen, onClose, expert, onRevert }) => {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset selected version when modal opens/expert changes
  useEffect(() => {
    if (isOpen) {
      setSelectedVersion(expert.version);
    }
  }, [isOpen, expert]);

  if (!isOpen) return null;

  // Determine what to show
  const currentViewedContent = selectedVersion === expert.version 
    ? expert.expertise 
    : expert.history.find(h => h.version === selectedVersion)?.content || "";

  const isHistorical = selectedVersion !== expert.version;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentViewedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple visual syntax highlighter for YAML
  const renderHighlightedYaml = (content: string) => {
    return content.split('\n').map((line, i) => {
      // 1. Comments
      if (line.trim().startsWith('#')) {
        return <div key={i} className="text-gray-500 italic select-text">{line}</div>;
      }

      // 2. Key-Value pairs (e.g., "  key: value")
      // Matches: indent, key (alphanumeric+dashes+underscores ending in colon), whitespace, rest
      const keyValMatch = line.match(/^(\s*)([\w\-\d_]+:)(\s*)(.*)$/);
      if (keyValMatch) {
         return (
           <div key={i} className="select-text">
             <span>{keyValMatch[1]}</span>
             <span className="text-blue-400 font-semibold">{keyValMatch[2]}</span>
             <span>{keyValMatch[3]}</span>
             <span className="text-[#ce9178]">{keyValMatch[4]}</span>
           </div>
         );
      }

      // 3. List items (e.g., "  - item")
      const listMatch = line.match(/^(\s*-\s)(.*)$/);
      if (listMatch) {
        return (
          <div key={i} className="select-text">
            <span className="text-purple-400">{listMatch[1]}</span>
            <span className="text-[#ce9178]">{listMatch[2]}</span>
          </div>
        );
      }
      
      // 4. Fallback for other lines
      return <div key={i} className="text-gray-300 select-text">{line}</div>;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex overflow-hidden">
        
        {/* Sidebar: History */}
        <div className="w-1/3 bg-gray-50 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-bold text-gray-800">Version History</h3>
            <p className="text-xs text-gray-500">Track mental model evolution</p>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
            {/* Current Version */}
            <button 
              onClick={() => setSelectedVersion(expert.version)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedVersion === expert.version 
                  ? 'bg-white border-orange-200 shadow-sm ring-1 ring-orange-500/20' 
                  : 'bg-transparent border-transparent hover:bg-gray-100'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-sm text-gray-900">v{expert.version} (Current)</span>
                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Active</span>
              </div>
              <p className="text-xs text-gray-500 truncate">Latest version</p>
              <p className="text-[10px] text-gray-400 mt-1">{new Date(expert.lastUpdated).toLocaleString()}</p>
            </button>

            {/* History List */}
            {[...expert.history].reverse().map((hist) => (
              <button 
                key={hist.version}
                onClick={() => setSelectedVersion(hist.version)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedVersion === hist.version 
                    ? 'bg-white border-orange-200 shadow-sm ring-1 ring-orange-500/20' 
                    : 'bg-transparent border-transparent hover:bg-gray-100'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-sm text-gray-700">v{hist.version}</span>
                </div>
                <p className="text-xs text-gray-600 line-clamp-2">{hist.reason}</p>
                <p className="text-[10px] text-gray-400 mt-1">{new Date(hist.timestamp).toLocaleString()}</p>
              </button>
            ))}

            {expert.history.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-xs">
                No history available yet.
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white flex-shrink-0">
            <div className="flex flex-col">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-400" />
                {expert.name}
              </h2>
              <p className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-2">
                Viewing v{selectedVersion}
                {isHistorical && <span className="text-orange-600 font-bold">• Historical View</span>}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isHistorical && (
                <button 
                  onClick={() => {
                    const hist = expert.history.find(h => h.version === selectedVersion);
                    if(hist) onRevert(expert.id, hist);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 text-orange-700 text-xs font-medium rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Revert to this version
                </button>
              )}
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
          
          {/* Code Viewer */}
          <div className="flex-1 relative bg-[#1e1e1e] group overflow-hidden flex flex-col">
            
            {/* Copy Button (Floating) */}
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
               <button 
                 onClick={handleCopy}
                 className={`
                   flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-all
                   ${copied 
                     ? 'bg-green-500 text-white' 
                     : 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/10'
                   }
                 `}
               >
                 {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                 {copied ? 'Copied' : 'Copy YAML'}
               </button>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar p-6 font-mono text-sm leading-relaxed text-gray-300">
              {renderHighlightedYaml(currentViewedContent)}
            </div>
          </div>

          <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex justify-between flex-shrink-0">
             <span>{currentViewedContent.split('\n').length} lines</span>
             <span className="font-mono">YAML</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertiseModal;