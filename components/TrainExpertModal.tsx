import React, { useState } from 'react';
import { X, Upload, FileCode, CheckCircle, AlertCircle, Loader2, Clock } from 'lucide-react';
import { Expert } from '../types';

interface TrainExpertModalProps {
  isOpen: boolean;
  onClose: () => void;
  expert: Expert;
  onTrainComplete: (expertId: string, trainingData: string, summary: string) => void; 
  // Changed signature: instead of newExpertise (result), we pass raw data to be queued.
  // Actually, to keep types simple in App.tsx without breaking `handleTrainComplete` signature mismatch,
  // let's adjust how we use this.
}

// Adjusted to strict "Queue" flow:
// User inputs text -> Clicks "Queue Training" -> Modal closes -> App adds task.

const TrainExpertModal: React.FC<any> = ({ isOpen, onClose, expert, onTrainComplete }) => {
  const [inputData, setInputData] = useState('');
  
  if (!isOpen) return null;

  const handleQueue = () => {
    if (!inputData.trim()) return;
    // We pass the raw data up. The summary is a placeholder since we haven't processed it yet.
    onTrainComplete(expert.id, inputData, "Queued for ingestion"); 
    onClose();
    setInputData('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Train {expert.name}</h2>
              <p className="text-gray-300 text-sm">Queue raw data for ingestion</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col gap-4 bg-gray-50">
          
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3">
             <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
             <div className="text-sm text-blue-800">
               <p className="font-semibold">Asynchronous Training</p>
               <p className="opacity-90">Training is computationally expensive. Your data will be added to the high-priority queue and processed in the background.</p>
             </div>
          </div>

          <div className="flex-1 flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-2">Raw Training Data</label>
            <textarea
              value={inputData}
              onChange={(e) => setInputData(e.target.value)}
              placeholder="e.g. CREATE TABLE users (id SERIAL PRIMARY KEY...)"
              className="flex-1 min-h-[200px] p-4 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none resize-none font-mono text-sm shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-gray-200 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleQueue}
            disabled={!inputData.trim()}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all
              ${!inputData.trim()
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 shadow-orange-200 hover:shadow-xl'
              }
            `}
          >
            <CheckCircle className="w-4 h-4" />
            Add to Queue
          </button>
        </div>

      </div>
    </div>
  );
};

export default TrainExpertModal;