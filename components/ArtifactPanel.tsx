import React, { useState } from 'react';
import { Copy, Download, X, FileCode, Check } from 'lucide-react';

export interface Artifact {
  id: string;
  language: string;
  filename: string;
  content: string;
}

interface ArtifactPanelProps {
  artifacts: Artifact[];
  activeArtifactId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const ArtifactPanel: React.FC<ArtifactPanelProps> = ({ artifacts, activeArtifactId, onSelect, onClose }) => {
  const activeArtifact = artifacts.find(a => a.id === activeArtifactId) || artifacts[0];
  const [copied, setCopied] = useState(false);

  if (!activeArtifact) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeArtifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([activeArtifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeArtifact.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[#111111] text-gray-300 border-l border-gray-800 w-full md:w-1/2 lg:w-[600px] shadow-2xl animate-in slide-in-from-right duration-300">
       {/* Header */}
       <div className="flex items-center justify-between p-2 border-b border-gray-800 bg-[#151515]">
         <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar no-scrollbar flex-1 mr-2">
            {artifacts.map(art => (
              <button
                key={art.id}
                onClick={() => onSelect(art.id)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-t-lg text-xs font-medium transition-all whitespace-nowrap border-b-2
                  ${art.id === activeArtifact.id 
                    ? 'bg-[#1e1e1e] text-blue-400 border-blue-500' 
                    : 'bg-transparent text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'
                  }
                `}
                title={art.filename}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span className="truncate max-w-[120px]">{art.filename}</span>
              </button>
            ))}
         </div>
         <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-white transition-colors">
           <X className="w-5 h-5" />
         </button>
       </div>

       {/* Toolbar */}
       <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-gray-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-gray-500 uppercase font-bold">{activeArtifact.language || 'TEXT'}</span>
            <span className="text-gray-700">|</span>
            <span className="text-gray-500">{activeArtifact.content.split('\n').length} lines</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleCopy} 
              className={`
                flex items-center gap-1.5 px-2 py-1 rounded transition-colors
                ${copied ? 'text-green-400 bg-green-900/20' : 'hover:text-white hover:bg-white/5'}
              `}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={handleDownload} className="flex items-center gap-1.5 px-2 py-1 rounded hover:text-white hover:bg-white/5 transition-colors">
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </div>
       </div>

       {/* Code View */}
       <div className="flex-1 overflow-auto custom-scrollbar p-4 bg-[#111111] font-mono text-sm leading-relaxed text-gray-300 relative selection:bg-blue-500/30">
          <pre className="whitespace-pre-wrap">{activeArtifact.content}</pre>
       </div>
    </div>
  );
};

export default ArtifactPanel;