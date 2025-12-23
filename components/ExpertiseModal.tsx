import React, { useState, useEffect, useMemo } from 'react';
import { X, RotateCcw, Copy, Check, FileText, GitCommit, FileDiff, ArrowRight, History, Clock } from 'lucide-react';
import { Expert, ExpertiseHistory } from '../types';

interface ExpertiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expert: Expert;
  onRevert: (expertId: string, historyItem: ExpertiseHistory) => void;
}

type DiffLine = {
  type: 'same' | 'added' | 'removed';
  content: string;
};

// Simple line-by-line diff algorithm
const computeDiff = (oldText: string, newText: string): DiffLine[] => {
  const oldLines = oldText ? oldText.split('\n') : [];
  const newLines = newText ? newText.split('\n') : [];
  
  const diff: DiffLine[] = [];
  let i = 0;
  let j = 0;

  // Very basic LCS-like approximation for visualization
  while (i < oldLines.length || j < newLines.length) {
    if (i < oldLines.length && j < newLines.length && oldLines[i] === newLines[j]) {
      diff.push({ type: 'same', content: oldLines[i] });
      i++;
      j++;
    } else if (j < newLines.length && (!oldLines[i] || newLines[j] !== oldLines[i+1])) {
      // Assume addition if it doesn't match next old line
      diff.push({ type: 'added', content: newLines[j] });
      j++;
    } else if (i < oldLines.length) {
      // Assume removal
      diff.push({ type: 'removed', content: oldLines[i] });
      i++;
    }
  }
  return diff;
};

const ExpertiseModal: React.FC<ExpertiseModalProps> = ({ isOpen, onClose, expert, onRevert }) => {
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'code' | 'diff'>('code');
  const [copied, setCopied] = useState(false);

  // Reset selected version when modal opens/expert changes
  useEffect(() => {
    if (isOpen) {
      setSelectedVersion(expert.version);
      setViewMode('code');
    }
  }, [isOpen, expert]);

  // Construct full history list (Current + Past) sorted descending
  const fullHistory = useMemo(() => {
    const current = {
      version: expert.version,
      content: expert.expertise,
      timestamp: expert.lastUpdated,
      reason: "Current Version"
    };
    return [current, ...expert.history].sort((a, b) => b.version - a.version);
  }, [expert]);

  if (!isOpen) return null;

  const selectedEntry = fullHistory.find(h => h.version === selectedVersion);
  const previousEntry = fullHistory.find(h => h.version === (selectedVersion || 0) - 1);

  const currentViewedContent = selectedEntry?.content || "";
  const previousContent = previousEntry?.content || "";
  
  const isHistorical = selectedVersion !== expert.version;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentViewedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Renderers ---

  // 1. Simple YAML Highlighter
  const renderHighlightedYaml = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Comments
      if (line.trim().startsWith('#')) {
        return <div key={i} className="text-gray-500 italic select-text px-4">{line}</div>;
      }
      // Key-Value pairs
      const keyValMatch = line.match(/^(\s*)([\w\-\d_]+:)(\s*)(.*)$/);
      if (keyValMatch) {
         return (
           <div key={i} className="select-text px-4 hover:bg-white/5">
             <span>{keyValMatch[1]}</span>
             <span className="text-blue-400 font-semibold">{keyValMatch[2]}</span>
             <span>{keyValMatch[3]}</span>
             <span className="text-[#ce9178]">{keyValMatch[4]}</span>
           </div>
         );
      }
      // List items
      const listMatch = line.match(/^(\s*-\s)(.*)$/);
      if (listMatch) {
        return (
          <div key={i} className="select-text px-4 hover:bg-white/5">
            <span className="text-purple-400">{listMatch[1]}</span>
            <span className="text-[#ce9178]">{listMatch[2]}</span>
          </div>
        );
      }
      return <div key={i} className="text-gray-300 select-text px-4 hover:bg-white/5">{line}</div>;
    });
  };

  // 2. Diff Renderer
  const renderDiff = () => {
    if (!previousEntry && selectedVersion === 1) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
           <GitCommit className="w-12 h-12 mb-4 opacity-20" />
           <p>Initial Version. No history to compare.</p>
        </div>
      );
    }
    
    const diffLines = computeDiff(previousContent, currentViewedContent);

    return diffLines.map((line, i) => {
      if (line.type === 'added') {
        return (
          <div key={i} className="bg-green-500/10 border-l-2 border-green-500 px-4 text-green-100 flex gap-4 hover:bg-green-500/20">
            <span className="text-green-500/50 w-4 select-none">+</span>
            <span>{line.content}</span>
          </div>
        );
      }
      if (line.type === 'removed') {
        return (
          <div key={i} className="bg-red-500/10 border-l-2 border-red-500 px-4 text-red-300 flex gap-4 hover:bg-red-500/20 opacity-70">
            <span className="text-red-500/50 w-4 select-none">-</span>
            <span className="line-through">{line.content}</span>
          </div>
        );
      }
      return (
        <div key={i} className="text-gray-500 px-4 flex gap-4 opacity-50">
          <span className="w-4 select-none"> </span>
          <span>{line.content}</span>
        </div>
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[85vh] flex overflow-hidden">
        
        {/* Sidebar: Timeline History */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-gray-200 bg-gray-100/50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <History className="w-4 h-4" />
              Evolution Timeline
            </h3>
            <p className="text-xs text-gray-500 mt-1">Select a point in time to inspect</p>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 relative">
            {/* Timeline Line */}
            <div className="absolute left-7 top-6 bottom-0 w-0.5 bg-gray-200 z-0" />

            {fullHistory.map((hist, idx) => {
               const isSelected = selectedVersion === hist.version;
               const isCurrent = hist.version === expert.version;
               
               return (
                <div key={hist.version} className="relative z-10 mb-6 group">
                  <button 
                    onClick={() => setSelectedVersion(hist.version)}
                    className={`
                      w-full text-left ml-8 relative transition-all duration-200
                      ${isSelected ? 'scale-100' : 'scale-95 opacity-70 hover:opacity-100 hover:scale-100'}
                    `}
                  >
                    {/* Timeline Node */}
                    <div className={`
                      absolute -left-[41px] top-1 w-5 h-5 rounded-full border-4 transition-colors duration-200
                      ${isSelected 
                        ? 'bg-white border-orange-500 shadow-md scale-110' 
                        : isCurrent 
                          ? 'bg-orange-500 border-orange-200'
                          : 'bg-gray-300 border-gray-100 group-hover:bg-gray-400'
                      }
                    `} />
                    
                    <div className={`
                      p-3 rounded-xl border shadow-sm transition-all
                      ${isSelected 
                        ? 'bg-white border-orange-200 shadow-orange-100 ring-1 ring-orange-500/20' 
                        : 'bg-white border-gray-200 hover:border-gray-300'
                      }
                    `}>
                      <div className="flex justify-between items-start mb-1">
                        <span className={`font-bold text-sm ${isSelected ? 'text-orange-700' : 'text-gray-700'}`}>
                          v{hist.version}.0
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">
                            Latest
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 font-medium line-clamp-2 leading-relaxed">
                        {hist.reason}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400">
                        <Clock className="w-3 h-3" />
                        {new Date(hist.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </button>
                </div>
               );
            })}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-white min-w-0">
          
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400" />
                  {expert.name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                   <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">v{selectedVersion}</span>
                   {selectedVersion !== 1 && (
                     <>
                        <ArrowRight className="w-3 h-3 text-gray-300" />
                        <span>Compared to v{(selectedVersion || 0) - 1}</span>
                     </>
                   )}
                </div>
              </div>
              
              {/* View Toggle */}
              <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                 <button
                   onClick={() => setViewMode('code')}
                   className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                     viewMode === 'code' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                   }`}
                 >
                   <FileText className="w-3.5 h-3.5" />
                   Source
                 </button>
                 <button
                   onClick={() => setViewMode('diff')}
                   className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                     viewMode === 'diff' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                   }`}
                 >
                   <FileDiff className="w-3.5 h-3.5" />
                   Changes
                 </button>
              </div>
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
                  Revert
                </button>
              )}
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
          
          {/* Content Viewer */}
          <div className="flex-1 relative bg-[#1e1e1e] group overflow-hidden flex flex-col">
            
            {/* Copy Button (Only on Source view) */}
            {viewMode === 'code' && (
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
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            )}

            <div className="flex-1 overflow-auto custom-scrollbar p-6 font-mono text-sm leading-relaxed">
              {viewMode === 'code' ? renderHighlightedYaml(currentViewedContent) : renderDiff()}
            </div>
          </div>

          <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex justify-between flex-shrink-0">
             <div className="flex gap-4">
               {viewMode === 'diff' && (
                 <>
                   <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" /> Added</span>
                   <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> Removed</span>
                 </>
               )}
             </div>
             <span className="font-mono">YAML</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertiseModal;