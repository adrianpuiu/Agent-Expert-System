import React from 'react';
import { Expert, ExpertStatus, ExpertType } from '../types';
import { Database, Server, Wifi, Layout, Brain, Activity, Eye, Zap, MessageSquare, Upload, Users, Cpu, Network, Cloud, ShieldCheck } from 'lucide-react';

interface ExpertCardProps {
  expert: Expert;
  onChat: (expert: Expert) => void;
  onImprove: (expert: Expert) => void;
  onView: (expert: Expert) => void;
  onTrain: (expert: Expert) => void;
}

const ExpertCard: React.FC<ExpertCardProps> = ({ expert, onChat, onImprove, onView, onTrain }) => {
  
  const getIcon = (type: ExpertType) => {
    switch (type) {
      case ExpertType.DATABASE: return <Database className="w-6 h-6" />;
      case ExpertType.API: return <Server className="w-6 h-6" />;
      case ExpertType.BACKEND: return <Cpu className="w-6 h-6" />;
      case ExpertType.WEBSOCKET: return <Wifi className="w-6 h-6" />;
      case ExpertType.FRONTEND: return <Layout className="w-6 h-6" />;
      case ExpertType.DEVOPS: return <Cloud className="w-6 h-6" />;
      case ExpertType.SECURITY: return <ShieldCheck className="w-6 h-6" />;
      default: return <Brain className="w-6 h-6" />;
    }
  };

  const isCollaborating = expert.status === ExpertStatus.COLLABORATING;
  const partnerName = expert.collaboratingWith ? expert.collaboratingWith.split(' ')[0] : 'Peer';

  return (
    <div className={`
      bg-white rounded-xl shadow-sm border p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-md relative overflow-hidden group
      ${isCollaborating 
        ? 'border-indigo-400 ring-4 ring-indigo-50/50 shadow-[0_0_30px_rgba(99,102,241,0.15)] z-10 scale-[1.01]' 
        : 'border-gray-200'}
    `}>
      {/* Collaboration Visuals */}
      {isCollaborating && (
        <>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-300 via-purple-400 to-indigo-300 animate-shimmer" style={{backgroundSize: '200% 100%'}} />
          <div className="absolute -right-12 -top-12 w-32 h-32 bg-indigo-50/80 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-purple-50/80 rounded-full blur-3xl pointer-events-none" />
        </>
      )}

      <div className="relative">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`
              p-2 rounded-lg transition-colors duration-300 relative
              ${isCollaborating ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}
            `}>
              {getIcon(expert.type)}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{expert.name}</h3>
              <p className="text-xs text-gray-500">{expert.type} Expert</p>
            </div>
          </div>
          
          <span 
            title={isCollaborating ? `Collaborating with ${expert.collaboratingWith}` : expert.status}
            className={`
            px-2.5 py-1 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5 cursor-help
            ${expert.status === ExpertStatus.ACTIVE ? 'bg-orange-50 text-orange-700 border-orange-100' :
              expert.status === ExpertStatus.LEARNING ? 'bg-purple-100 text-purple-700 border-purple-200 animate-pulse' :
              expert.status === ExpertStatus.THINKING ? 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse' :
              isCollaborating ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm animate-pulse ring-1 ring-indigo-100' :
              'bg-gray-100 text-gray-600 border-gray-200'}
          `}>
             {isCollaborating && <Network className="w-3.5 h-3.5" />}
             {isCollaborating 
              ? <span className="font-semibold flex items-center gap-1">Linked <span className="opacity-50 text-[10px] mx-0.5">↔</span> {partnerName}</span>
              : <span className="capitalize">{expert.status}</span>}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-6 min-h-[40px]">{expert.description}</p>
        
        {/* Dynamic Topic Indicator for Collaborating Experts */}
        {isCollaborating && expert.collaborationTopic && (
           <div className="mb-4 -mt-2 bg-indigo-50/80 border border-indigo-100 rounded-lg p-2 text-xs text-indigo-800 flex items-start gap-1.5 animate-in fade-in slide-in-from-top-1">
              <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2 italic opacity-90">{expert.collaborationTopic}</span>
           </div>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-500 mb-6">
          <div className="flex items-center gap-1">
            <Activity className="w-3 h-3" />
            <span>{expert.learnings} learnings</span>
          </div>
          <div className="flex items-center gap-1">
            <span>•</span>
            <span>v{expert.version}.0</span>
          </div>
          <div className="flex items-center gap-1">
             <span>•</span>
            <span>{new Date(expert.lastUpdated).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 relative">
        <button 
          onClick={() => onChat(expert)}
          className="flex-1 bg-orange-700 hover:bg-orange-800 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          Chat
        </button>
        
        <button 
          onClick={() => onTrain(expert)}
          className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 text-gray-700 transition-colors"
          title="Train (Ingest Knowledge)"
        >
          <Upload className="w-4 h-4" />
        </button>

        <button 
          onClick={() => onImprove(expert)}
          disabled={expert.status !== ExpertStatus.IDLE && expert.status !== ExpertStatus.ACTIVE}
          className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Trigger Self-Improvement"
        >
          <Zap className="w-4 h-4" />
        </button>
        
        <button 
          onClick={() => onView(expert)}
          className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
          title="View Mental Model"
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ExpertCard;