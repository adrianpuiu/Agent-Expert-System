import React, { useState, useEffect, useRef } from 'react';
import { X, Swords, PauseCircle, PlayCircle, CheckCircle2, ShieldAlert, Cpu, Bot, User, Brain, AlertTriangle } from 'lucide-react';
import { Expert, WarRoomMessage } from '../types';
import { getWarRoomTurn } from '../services/geminiService';

interface WarRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  experts: Expert[];
}

const WarRoomModal: React.FC<WarRoomModalProps> = ({ isOpen, onClose, experts }) => {
  const [topic, setTopic] = useState('');
  const [isDebating, setIsDebating] = useState(false);
  const [isConsensusReached, setIsConsensusReached] = useState(false);
  const [messages, setMessages] = useState<WarRoomMessage[]>([]);
  const [turnCount, setTurnCount] = useState(0);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const maxTurns = 10; // Safety limit

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Debate Loop
  useEffect(() => {
    let timeout: any;

    const runTurn = async () => {
      if (!isDebating || isConsensusReached || turnCount >= maxTurns) {
        setIsDebating(false);
        return;
      }

      try {
        const turn = await getWarRoomTurn(topic, messages, experts);
        
        const newMessage: WarRoomMessage = {
          id: Math.random().toString(36).substr(2, 9),
          speakerId: turn.speakerId,
          speakerName: turn.speakerName,
          role: turn.speakerId === 'moderator' ? 'moderator' : 'expert',
          content: turn.content,
          timestamp: Date.now(),
          isConsensus: turn.isConsensus
        };

        setMessages(prev => [...prev, newMessage]);
        setTurnCount(prev => prev + 1);

        if (turn.isConsensus) {
          setIsConsensusReached(true);
          setIsDebating(false);
        } else {
          // Schedule next turn with a delay for reading
          timeout = setTimeout(runTurn, 2500); 
        }

      } catch (e) {
        console.error("Debate Error", e);
        setIsDebating(false);
      }
    };

    if (isDebating) {
      runTurn();
    }

    return () => clearTimeout(timeout);
  }, [isDebating, turnCount, messages, isConsensusReached, topic, experts]);

  if (!isOpen) return null;

  const handleStart = () => {
    if (!topic.trim()) return;
    setMessages([]);
    setIsConsensusReached(false);
    setTurnCount(0);
    setIsDebating(true);
  };

  const handleStop = () => {
    setIsDebating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden relative">
        
        {/* Background Grid Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(30,30,30,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(30,30,30,0.5)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20" />

        {/* Header */}
        <div className="p-6 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-900/30 border border-red-500/30 rounded-lg animate-pulse">
              <Swords className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide uppercase">War Room <span className="text-red-500">Active</span></h2>
              <p className="text-gray-400 text-xs font-mono">Multi-Agent Consensus Protocol</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden z-10">
          
          {/* Left: Experts List */}
          <div className="w-64 bg-black/20 border-r border-gray-800 p-4 hidden md:flex flex-col gap-3 overflow-y-auto">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Participants</h3>
            {experts.map(expert => {
               // Is this expert currently speaking?
               const isSpeaking = messages.length > 0 && messages[messages.length - 1].speakerId === expert.id && isDebating;
               
               return (
                <div 
                  key={expert.id} 
                  className={`
                    p-3 rounded-lg border transition-all duration-300
                    ${isSpeaking 
                      ? 'bg-red-900/20 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                      : 'bg-gray-800/40 border-gray-700/50 opacity-60'
                    }
                  `}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <Bot className={`w-4 h-4 ${isSpeaking ? 'text-red-400' : 'text-gray-400'}`} />
                    <span className={`text-sm font-bold ${isSpeaking ? 'text-white' : 'text-gray-300'}`}>{expert.name}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 uppercase">{expert.type}</p>
                  {isSpeaking && <div className="mt-2 h-1 w-full bg-red-500/20 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 w-1/3 animate-[shimmer_1s_infinite]" />
                  </div>}
                </div>
               );
            })}
          </div>

          {/* Center: Main Interface */}
          <div className="flex-1 flex flex-col bg-gray-950/50 relative">
            
            {/* Input (Only visible if not started) */}
            {messages.length === 0 && !isDebating ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <ShieldAlert className="w-16 h-16 text-gray-700 mb-6" />
                <h3 className="text-2xl font-bold text-white mb-2">Initiate Consensus Protocol</h3>
                <p className="text-gray-400 mb-8 max-w-lg">Define a complex architectural problem. The swarm will debate, critique, and synthesize a solution.</p>
                
                <div className="w-full max-w-2xl">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. How do we scale the websocket service to 1M concurrent users?"
                    className="w-full bg-gray-900 border border-gray-700 text-white p-4 rounded-xl focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none text-lg placeholder:text-gray-600 mb-4"
                  />
                  <button 
                    onClick={handleStart}
                    disabled={!topic.trim()}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
                  >
                    <Swords className="w-5 h-5" />
                    Engage Swarm
                  </button>
                </div>
              </div>
            ) : (
              // Transcript View
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                
                {/* Topic Header */}
                <div className="flex justify-center mb-8">
                   <div className="bg-gray-800/80 border border-gray-700 rounded-full px-6 py-2 text-sm text-gray-300 flex items-center gap-2">
                     <AlertTriangle className="w-4 h-4 text-yellow-500" />
                     Topic: <span className="text-white font-medium">{topic}</span>
                   </div>
                </div>

                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-500 ${msg.role === 'moderator' ? 'items-center' : 'items-start'}`}
                  >
                    {/* Speaker Header */}
                    {msg.role !== 'moderator' && (
                      <div className="flex items-center gap-2 mb-2 ml-4">
                        <span className="text-xs font-bold text-red-400 uppercase tracking-wider">{msg.speakerName}</span>
                        <span className="text-[10px] text-gray-600">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`
                      relative p-5 rounded-2xl border backdrop-blur-sm
                      ${msg.isConsensus 
                        ? 'bg-green-900/20 border-green-500/50 text-green-100 w-full text-center shadow-[0_0_30px_rgba(34,197,94,0.1)]'
                        : msg.role === 'moderator'
                          ? 'bg-gray-800/80 border-gray-700 text-gray-300 text-center text-sm italic px-8'
                          : 'bg-gray-900/80 border-gray-800 text-gray-200 rounded-tl-none shadow-md'
                      }
                    `}>
                       {msg.isConsensus && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Consensus Reached</div>}
                       {msg.content}
                    </div>
                  </div>
                ))}
                
                {isDebating && (
                   <div className="flex justify-center mt-4">
                     <div className="flex items-center gap-2 text-xs text-gray-500 animate-pulse">
                       <Cpu className="w-4 h-4" />
                       Analyzing...
                     </div>
                   </div>
                )}

                <div ref={scrollRef} />
              </div>
            )}
          </div>
        </div>

        {/* Footer Controls */}
        {messages.length > 0 && (
          <div className="p-4 border-t border-gray-800 bg-gray-900 flex justify-between items-center z-10">
             <div className="flex items-center gap-2 text-xs text-gray-500">
               <div className={`w-2 h-2 rounded-full ${isDebating ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
               {isDebating ? 'Live Session Active' : 'Session Paused'}
             </div>
             
             {!isConsensusReached && (
                <button 
                  onClick={isDebating ? handleStop : handleStart}
                  className={`
                    px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors
                    ${isDebating 
                      ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                      : 'bg-red-600 hover:bg-red-700 text-white'
                    }
                  `}
                >
                  {isDebating ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                  {isDebating ? 'Pause Debate' : 'Resume Debate'}
                </button>
             )}

             {isConsensusReached && (
               <button onClick={onClose} className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium">
                 Close Session
               </button>
             )}
          </div>
        )}

      </div>
    </div>
  );
};

export default WarRoomModal;