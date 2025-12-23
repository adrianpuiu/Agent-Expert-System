import React from 'react';
import { AgentTask, TaskPriority, TaskStatus } from '../types';
import { Layers, Zap, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface TaskQueueWidgetProps {
  tasks: AgentTask[];
  isProcessing: boolean;
}

const TaskQueueWidget: React.FC<TaskQueueWidgetProps> = ({ tasks, isProcessing }) => {
  const pendingTasks = tasks.filter(t => t.status === TaskStatus.PENDING);
  const processingTask = tasks.find(t => t.status === TaskStatus.PROCESSING);

  // Sort by priority (desc) then time (asc)
  const sortedTasks = [...pendingTasks].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.timestamp - b.timestamp;
  });

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case TaskPriority.CRITICAL: return 'text-red-600 bg-red-50 border-red-200';
      case TaskPriority.HIGH: return 'text-orange-600 bg-orange-50 border-orange-200';
      case TaskPriority.MEDIUM: return 'text-blue-600 bg-blue-50 border-blue-200';
      case TaskPriority.LOW: return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600';
    }
  };

  const getPriorityLabel = (p: TaskPriority) => {
    switch (p) {
      case TaskPriority.CRITICAL: return 'CRITICAL';
      case TaskPriority.HIGH: return 'HIGH';
      case TaskPriority.MEDIUM: return 'MED';
      case TaskPriority.LOW: return 'LOW';
    }
  };

  if (tasks.length === 0 && !isProcessing) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
      
      {/* Header */}
      <div className="bg-gray-900 text-white p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" />
          <span className="font-bold text-sm">Agent Task Queue</span>
        </div>
        <div className="text-xs bg-gray-800 px-2 py-0.5 rounded-full">
          {pendingTasks.length} Pending
        </div>
      </div>

      {/* Active Task */}
      {processingTask ? (
        <div className="p-3 bg-orange-50 border-b border-orange-100">
          <div className="flex justify-between items-center mb-1">
             <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider flex items-center gap-1">
               <Loader2 className="w-3 h-3 animate-spin" />
               Processing Now
             </span>
             <span className={`text-[10px] font-bold px-1.5 rounded border ${getPriorityColor(processingTask.priority)}`}>
               {getPriorityLabel(processingTask.priority)}
             </span>
          </div>
          <p className="text-sm font-medium text-gray-800 truncate">{processingTask.description}</p>
        </div>
      ) : (
        <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2 text-gray-400 text-xs">
           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
           System Idle
        </div>
      )}

      {/* Queue List */}
      <div className="max-h-48 overflow-y-auto custom-scrollbar bg-white">
        {sortedTasks.length === 0 && !processingTask && (
          <div className="p-4 text-center text-gray-400 text-xs">
            Queue is empty.
          </div>
        )}
        
        {sortedTasks.map((task) => (
          <div key={task.id} className="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors flex items-start gap-2">
            <div className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              task.priority === TaskPriority.CRITICAL ? 'bg-red-500' : 
              task.priority === TaskPriority.HIGH ? 'bg-orange-500' : 'bg-gray-300'
            }`} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-xs text-gray-500">{task.type}</span>
                <span className={`text-[9px] px-1 rounded font-medium border ${getPriorityColor(task.priority)}`}>
                  {getPriorityLabel(task.priority)}
                </span>
              </div>
              <p className="text-xs font-medium text-gray-700 truncate" title={task.description}>
                {task.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskQueueWidget;