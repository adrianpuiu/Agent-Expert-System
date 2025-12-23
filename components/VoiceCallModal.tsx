import React, { useEffect, useState, useRef } from 'react';
import { X, Mic, MicOff, PhoneOff, Activity, Signal, Zap } from 'lucide-react';
import { Expert } from '../types';
import { LiveVoiceSession } from '../services/liveService';

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  experts: Expert[];
}

const VoiceCallModal: React.FC<VoiceCallModalProps> = ({ isOpen, onClose, experts }) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'speaking' | 'listening' | 'disconnected' | 'error'>('connecting');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const sessionRef = useRef<LiveVoiceSession | null>(null);
  
  // Animation Frame Ref for smooth visualizer decay
  const visualizerRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      const session = new LiveVoiceSession(
        experts,
        (s) => setStatus(s),
        (level) => {
             // Smooth smoothing
             visualizerRef.current = visualizerRef.current * 0.8 + level * 0.2;
             setAudioLevel(visualizerRef.current);
        }
      );
      session.connect();
      sessionRef.current = session;
    }

    return () => {
      sessionRef.current?.disconnect();
      sessionRef.current = null;
    };
  }, [isOpen, experts]);

  if (!isOpen) return null;

  const handleHangup = () => {
    sessionRef.current?.disconnect();
    onClose();
  };

  // Calculate visualizer circles
  const getScale = (base: number) => 1 + (audioLevel * base);
  const isAgentSpeaking = status === 'speaking';
  const isUserSpeaking = status === 'listening' && audioLevel > 0.05;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[60] flex flex-col items-center justify-center animate-in fade-in duration-500">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[100px] animate-pulse" />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-full backdrop-blur-md border border-white/10">
            <Activity className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-white font-bold tracking-wider text-sm">NEURAL VOICE LINK</h2>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${status === 'error' || status === 'disconnected' ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`} />
              <p className="text-indigo-200/60 text-xs uppercase font-mono tracking-widest">{status}</p>
            </div>
          </div>
        </div>
        <button onClick={handleHangup} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Visualizer */}
      <div className="relative flex items-center justify-center w-full max-w-lg aspect-square">
        
        {/* Core Orb */}
        <div 
          className={`
            relative z-20 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-100
            ${status === 'error' ? 'bg-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.3)]' : 'bg-white shadow-[0_0_80px_rgba(255,255,255,0.4)]'}
          `}
          style={{ transform: `scale(${isAgentSpeaking ? getScale(0.3) : 1})` }}
        >
          {status === 'connecting' ? (
             <div className="w-12 h-12 border-4 border-indigo-200 border-t-transparent rounded-full animate-spin" />
          ) : (
             <Zap className={`w-12 h-12 ${status === 'error' ? 'text-red-500' : 'text-indigo-600'}`} />
          )}
        </div>

        {/* Ripples (Agent Speaking) */}
        {isAgentSpeaking && (
           <>
             <div className="absolute inset-0 border border-white/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
             <div className="absolute inset-0 border border-indigo-400/30 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
           </>
        )}

        {/* Outer Rings (User Speaking) */}
        <div 
          className="absolute z-10 w-64 h-64 border border-indigo-500/30 rounded-full transition-all duration-75"
          style={{ 
             transform: `scale(${isUserSpeaking ? getScale(0.5) : 1})`,
             opacity: isUserSpeaking ? 0.8 : 0.2
          }} 
        />
        <div 
          className="absolute z-10 w-96 h-96 border border-indigo-500/10 rounded-full transition-all duration-100"
          style={{ 
             transform: `scale(${isUserSpeaking ? getScale(0.8) : 1})`,
             opacity: isUserSpeaking ? 0.5 : 0.1
          }} 
        />

        {/* Status Text */}
        <div className="absolute -bottom-16 text-center">
           <p className="text-xl font-light text-white tracking-widest uppercase">
             {status === 'speaking' ? 'Agent Speaking' : status === 'listening' ? 'Listening' : status}
           </p>
           {status === 'connected' && <p className="text-indigo-300/50 text-xs mt-2">Microphone Active</p>}
        </div>

      </div>

      {/* Controls */}
      <div className="absolute bottom-12 flex items-center gap-6">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`
            p-6 rounded-full transition-all duration-300 flex items-center justify-center
            ${isMuted ? 'bg-white text-gray-900' : 'bg-white/10 text-white hover:bg-white/20'}
          `}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
        
        <button 
          onClick={handleHangup}
          className="p-6 bg-red-600 hover:bg-red-500 text-white rounded-full shadow-[0_0_30px_rgba(220,38,38,0.4)] transition-all transform hover:scale-105"
        >
          <PhoneOff className="w-8 h-8" />
        </button>
      </div>

    </div>
  );
};

export default VoiceCallModal;