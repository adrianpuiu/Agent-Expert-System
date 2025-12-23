import React from 'react';
import { Expert, ExpertStatus, ExpertType } from '../types';
import { Database, Server, Wifi, Layout, Brain, Activity, Eye, Zap, MessageSquare, Upload, Users, Cpu } from 'lucide-react';

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
      case ExpertType.DATABASE: return <Database className="w-6 h-6 text-orange-600" />;
      case ExpertType.API: return <Server className="w-6 h-6 text-orange-600" />;
      case ExpertType.BACKEND: return <Cpu className="w-6 h-6 text-orange-600" />;
      case ExpertType.WEBSOCKET: return <Wifi className="w-6 h-6 text-orange-600" />;
      case ExpertType.FRONTEND: return <Layout className="w-6 h-6 text-orange-600" />;
      default: return <Brain className="w-6 h-6 text-orange-600" />;
    }
  };

  return (
    <div className={`
      bg-white rounded-xl shadow-sm border p-6 flex flex-col justify-between transition-all hover:shadow-md
      ${expert.status === ExpertStatus.COLLABORATING ? 'border-indigo-200 ring-1 ring-indigo-500/20' : 'border-gray-200'}
    `}>
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${expert.status === ExpertStatus.COLLABORATING ? 'bg-indigo-100' : 'bg-orange-100'}`}>
              {getIcon(expert.type)}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{expert.name}</h3>
              <p className="text-xs text-gray-500">{expert.type} Expert</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border transition-all ${
            expert.status === ExpertStatus.ACTIVE ? 'bg-orange-100 text-orange-700 border-orange-200' :
            expert.status === ExpertStatus.LEARNING ? 'bg-purple-100 text-purple-700 border-purple-200 animate-pulse' :
            expert.status === ExpertStatus.THINKING ? 'bg-blue-100 text-blue-700 border-blue-200 animate-pulse' :
            expert.status === ExpertStatus.COLLABORATING ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm animate-pulse flex items-center gap-1' :
            'bg-gray-100 text-gray-600 border-gray-200'
          }`}>
             {expert.status === ExpertStatus.COLLABORATING && <Users className="w-3 h-3" />}
             {expert.status === ExpertStatus.COLLABORATING 
              ? `With ${expert.collaboratingWith?.split(' ')[0]}` 
              : expert.status}
          </span>
        </div>

        <p className="text-sm text-gray-600 mb-6 min-h-[40px]">{expert.description}</p>

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

      <div className="flex items-center gap-2">
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