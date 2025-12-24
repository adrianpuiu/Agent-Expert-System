import React, { useState, useEffect, useRef } from 'react';
import { X, Swords, PauseCircle, PlayCircle, CheckCircle2, ShieldAlert, Cpu, Bot, User, Brain, AlertTriangle, Power, Mic, MicOff, Users, Globe, ExternalLink, Menu, LayoutList, LogOut, Gavel } from 'lucide-react';
import { Expert, WarRoomMessage } from '../types';
import { getWarRoomTurn } from '../services/geminiService';

interface WarRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  experts: Expert[];
}

const WarRoomModal: React.FC<WarRoomModalProps> = ({ onClose, experts }) => {
  const [topic, setTopic] = useState('');
  const [isDebating, setIsDebating] = useState(false);
  const [isConsensusReached, setIsConsensusReached] = useState(false);
  const [messages, setMessages] = useState<WarRoomMessage[]>([]);
  const [turnCount, setTurnCount] = useState(0);
  const [activeExpertIds, setActiveExpertIds] = useState<Set<string>>(new Set());
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isForcingConsensus, setIsForcingConsensus] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const isFetchingRef = useRef(false); // Prevent overlapping fetches when toggling experts
  const maxTurns = 15; // Soft limit before forcing consensus

  // Initialize active experts on mount
  useEffect(() => {
    setActiveExpertIds(new Set(experts.map(e => e.id)));
  }, [experts]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleExpert = (id: string) => {
    setActiveExpertIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Debate Loop
  useEffect(() => {
    let timeout: any;

    const runTurn = async () => {
      // Hard stop safety or if consensus reached
      if (!isDebating || isConsensusReached || turnCount >= maxTurns + 5) {
        setIsDebating(false);
        setIsForcingConsensus(false);
        return;
      }

      // If we are already fetching a turn, don't double-fire just because the user toggled an expert
      if (isFetchingRef.current) return;

      // Filter experts based on active set
      const activeExperts = experts.filter(e => activeExpertIds.has(e.id));

      if (activeExperts.length === 0) {
        // Don't stop debating state, just pause execution until someone is re-enabled
        return;
      }

      isFetchingRef.current = true;

      try {
        // Determine if we need to force consensus
        const shouldForceConsensus = isForcingConsensus || turnCount >= maxTurns;
        if (shouldForceConsensus && !isForcingConsensus) setIsForcingConsensus(true);

        const turn = await getWarRoomTurn(topic, messages, activeExperts, shouldForceConsensus);
        
        // Check if stopped while fetching
        if (!isDebating) return;

        const newMessage: WarRoomMessage = {
          id: Math.random().toString(36).substr(2, 9),
          speakerId: turn.speakerId,
          speakerName: turn.speakerName,
          role: turn.speakerId === 'moderator' ? 'moderator' : 'expert',
          content: turn.content,
          timestamp: Date.now(),
          isConsensus: turn.isConsensus,
          sources: turn.sources // Capture sources from API
        };

        setMessages(prev => [...prev, newMessage]);
        setTurnCount(prev => prev + 1);

        if (turn.isConsensus) {
          setIsConsensusReached(true);
          setIsDebating(false);
          setIsForcingConsensus(false);
        } else {
          // Schedule next turn
          // Logic handled by dependency change on messages/turnCount re-triggering effect
        }

      } catch (e) {
        console.error("Debate Error", e);
        setIsDebating(false);
      } finally {
        isFetchingRef.current = false;
      }
    };

    if (isDebating) {
       // Pause slightly before executing to allow UI to breathe
       const delay = messages.length === 0 ? 0 : 2500;
       timeout = setTimeout(runTurn, delay);
    }

    return () => clearTimeout(timeout);
  }, [isDebating, turnCount, messages, isConsensusReached, topic, experts, activeExpertIds, isForcingConsensus]);

  const handleStart = () => {
    if (!topic.trim()) return;
    setMessages([]);
    setIsConsensusReached(false);
    setTurnCount(0);
    setIsDebating(true);
    setIsForcingConsensus(false);
  };

  const handleStop = () => {
    setIsDebating(false);
  };

  const handleForceConsensus = () => {
    setIsForcingConsensus(true);
    if (!isDebating) setIsDebating(true);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm w-full h-[calc(100vh-9rem)] flex flex-col overflow-hidden relative animate-in fade-in zoom-in duration-300">
        
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-50" />

        {/* Header */}
        <div className="p-4 md:p-6 border-b border-gray-200 bg-white/80 backdrop-blur-md flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="p-2 md:p-3 bg-red-50 border border-red-100 rounded-xl hidden sm:block">
              <Swords className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                War Room 
                <span className="text-red-700 text-xs md:text-sm bg-red-50 px-2 py-0.5 rounded-full border border-red-100 font-medium">Active Protocol</span>
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-gray-500 text-[10px] md:text-xs font-medium hidden sm:inline">Multi-Agent Consensus System</span>
                {isDebating && (
                   <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-100 flex items-center gap-1">
                     <Users className="w-3 h-3" />
                     {activeExpertIds.size} Live
                   </span>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 hover:text-red-600 border border-gray-200 hover:border-red-100 rounded-lg transition-all text-sm font-medium shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Exit Session</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden z-10 relative bg-gray-50/50">
          
          {/* Mobile Sidebar Overlay */}
          {showMobileSidebar && (
            <div 
              className="absolute inset-0 bg-black/20 z-20 md:hidden backdrop-blur-sm"
              onClick={() => setShowMobileSidebar(false)}
            />
          )}

          {/* Left: Experts List (Responsive) */}
          <div className={`
            absolute md:relative inset-y-0 left-0 z-30 w-72 bg-white border-r border-gray-200 p-4 flex flex-col gap-3 overflow-y-auto transition-transform duration-300 shadow-xl md:shadow-none
            ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}>
            <div className="flex justify-between items-center mb-2 px-1">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                 <LayoutList className="w-3 h-3" /> Participants
               </h3>
               <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                 {activeExpertIds.size}/{experts.length}
               </span>
            </div>
            
            <div className="space-y-2">
              {experts.map(expert => {
                 const isSpeaking = messages.length > 0 && messages[messages.length - 1].speakerId === expert.id && isDebating;
                 const isActive = activeExpertIds.has(expert.id);
                 
                 return (
                  <div 
                    key={expert.id} 
                    onClick={() => toggleExpert(expert.id)}
                    className={`
                      p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none relative group
                      ${!isActive 
                          ? 'bg-white border-gray-100 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 hover:border-gray-300' 
                          : isSpeaking 
                            ? 'bg-red-50 border-red-200 shadow-sm ring-1 ring-red-100' 
                            : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-sm'
                      }
                    `}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                          <Bot className={`w-4 h-4 flex-shrink-0 ${isSpeaking ? 'text-red-500' : isActive ? 'text-green-600' : 'text-gray-400'}`} />
                          <span className={`text-sm font-bold truncate ${isSpeaking ? 'text-gray-900' : isActive ? 'text-gray-700' : 'text-gray-400 line-through decoration-gray-300'}`}>
                             {expert.name}
                          </span>
                      </div>
                      
                      {/* Toggle Indicator */}
                      <div className={`
                         w-5 h-5 rounded-full flex items-center justify-center transition-colors
                         ${isActive ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-100'}
                      `}>
                         {isActive ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-2">
                       <p className="text-[10px] text-gray-500 uppercase truncate pr-4">{expert.type}</p>
                       <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isActive ? 'text-green-700 bg-green-100' : 'text-gray-400 bg-gray-100'}`}>
                         {isActive ? 'IN ROOM' : 'MUTED'}
                       </span>
                    </div>
                    
                    {isSpeaking && <div className="mt-2 h-1 w-full bg-red-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 w-1/3 animate-[shimmer_1s_infinite]" />
                    </div>}
                  </div>
                 );
              })}
            </div>
          </div>

          {/* Center: Main Interface */}
          <div className="flex-1 flex flex-col relative min-w-0">
            
            {/* Input (Only visible if not started) */}
            {messages.length === 0 && !isDebating ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 text-center overflow-y-auto">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
                   <ShieldAlert className="w-12 h-12 text-gray-700" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Initiate Consensus Protocol</h3>
                <p className="text-gray-500 mb-8 max-w-lg leading-relaxed">Define a complex architectural problem. The swarm will debate, critique, and synthesize a solution.</p>
                
                <div className="w-full max-w-2xl bg-white p-2 rounded-2xl shadow-sm border border-gray-200">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. How do we scale the websocket service to 1M concurrent users?"
                    className="w-full bg-transparent text-gray-900 p-4 outline-none text-lg placeholder:text-gray-400"
                  />
                  
                  <div className="flex items-center justify-between px-4 pb-2 pt-2 border-t border-gray-100 mt-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span className={`w-2 h-2 rounded-full ${activeExpertIds.size > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {activeExpertIds.size} Experts Ready
                    </div>

                    <button 
                      onClick={handleStart}
                      disabled={!topic.trim() || activeExpertIds.size === 0}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-red-100 hover:shadow-lg flex items-center gap-2"
                    >
                      <Swords className="w-4 h-4" />
                      Engage Swarm
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Transcript View
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
                
                {/* Topic Header */}
                <div className="flex justify-center mb-8 sticky top-0 z-10">
                   <div className="bg-white/90 backdrop-blur border border-gray-200 shadow-sm rounded-full px-6 py-2 text-sm text-gray-500 flex items-center gap-2 max-w-full hover:border-gray-300 transition-colors cursor-help group">
                     <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                     <span className="truncate max-w-md">Topic: <span className="text-gray-900 font-semibold group-hover:text-black">{topic}</span></span>
                   </div>
                </div>
                
                {/* Empty State Warning */}
                {isDebating && activeExpertIds.size === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 ring-1 ring-amber-100">
                       <Users className="w-8 h-8 text-amber-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Debate Paused</h3>
                    <p className="text-gray-500 text-sm">Waiting for active participants...</p>
                    <p className="text-gray-400 text-xs mt-2">Enable experts in the sidebar to resume.</p>
                  </div>
                )}

                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-500 ${msg.role === 'moderator' ? 'items-center' : 'items-start'}`}
                  >
                    {/* Speaker Header */}
                    {msg.role !== 'moderator' && (
                      <div className="flex items-center gap-2 mb-2 ml-4">
                        <span className="text-xs font-bold text-red-600 uppercase tracking-wider">{msg.speakerName}</span>
                        <span className="text-[10px] text-gray-400">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                      </div>
                    )}

                    {/* Bubble */}
                    <div className={`
                      relative p-6 rounded-2xl border shadow-sm text-sm leading-relaxed
                      ${msg.isConsensus 
                        ? 'bg-green-50 border-green-200 text-green-900 w-full text-center shadow-green-100 ring-2 ring-green-100'
                        : msg.role === 'moderator'
                          ? 'bg-gray-100 border-transparent text-gray-600 text-center italic px-8 shadow-none'
                          : 'bg-white border-gray-200 text-gray-700 rounded-tl-none'
                      }
                    `}>
                       {msg.isConsensus && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase shadow-sm flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Consensus Reached</div>}
                       {msg.content}
                       
                       {/* Sources Display for War Room */}
                       {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                            <div className="w-full text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <Globe className="w-3 h-3" /> Grounded in Reality
                            </div>
                            {msg.sources.map((source, i) => (
                              <a 
                                key={i} 
                                href={source.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md text-[10px] text-gray-600 hover:text-gray-900 transition-colors max-w-full truncate"
                                title={source.title}
                              >
                                 <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                 <span className="truncate max-w-[200px]">{source.title || 'Web Source'}</span>
                              </a>
                            ))}
                          </div>
                       )}
                    </div>
                  </div>
                ))}
                
                {isDebating && activeExpertIds.size > 0 && (
                   <div className="flex justify-center mt-4 pb-8">
                     <div className="flex items-center gap-2 text-xs text-gray-400 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm animate-pulse">
                       {isForcingConsensus ? <Gavel className="w-3.5 h-3.5 text-orange-500" /> : <Cpu className="w-3.5 h-3.5" />}
                       {isForcingConsensus ? 'Finalizing Consensus...' : 'Analyzing...'}
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
          <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center z-10">
             <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
               <div className={`w-2 h-2 rounded-full ${isDebating ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
               {isDebating ? 'Live Session Active' : 'Session Paused'}
             </div>
             
             {!isConsensusReached && (
               <div className="flex gap-2">
                  <button 
                    onClick={isDebating ? handleStop : handleStart}
                    disabled={activeExpertIds.size === 0 && !isDebating}
                    className={`
                      px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-sm
                      ${isDebating 
                        ? 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700' 
                        : 'bg-red-600 hover:bg-red-700 text-white shadow-red-100'
                      }
                    `}
                  >
                    {isDebating ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                    {isDebating ? 'Pause' : 'Resume'}
                  </button>
                  
                  {isDebating && !isForcingConsensus && turnCount > 2 && (
                    <button 
                      onClick={handleForceConsensus}
                      className="px-4 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                      title="Force the Moderator to wrap up immediately"
                    >
                      <Gavel className="w-3.5 h-3.5" />
                      Conclude
                    </button>
                  )}
               </div>
             )}

             {isConsensusReached && (
               <button onClick={onClose} className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-bold shadow-lg shadow-gray-200 transition-all">
                 Close Session
               </button>
             )}
          </div>
        )}

    </div>
  );
};

export default WarRoomModal;