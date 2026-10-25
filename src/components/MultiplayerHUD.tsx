import React from 'react';
import { RivalState } from '../types/game';
import { Trophy, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';

interface MultiplayerHUDProps {
  myDistance: number;
  myName: string;
  rivalName: string;
  rivalState: RivalState | null;
  notification: { message: string; type: 'stumble' | 'crash' | 'revive' } | null;
}

export const MultiplayerHUD: React.FC<MultiplayerHUDProps> = ({
  myDistance,
  myName,
  rivalName,
  rivalState,
  notification,
}) => {
  const rivalDist = rivalState?.distance || 0;
  const lead = myDistance - rivalDist;
  const isAhead = lead >= 0;

  return (
    <div className="absolute top-16 left-0 right-0 z-20 flex flex-col items-center pointer-events-none px-4 gap-2">
      {/* Race Progress Bar */}
      <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/75 border border-white/15 backdrop-blur-none shadow-2xl text-white">
        {/* You */}
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-mono text-cyan-300 uppercase leading-none">YOU ({myName})</span>
            <span className="text-sm font-black font-mono leading-tight">{myDistance}m</span>
          </div>
        </div>

        {/* Lead Badge */}
        <div
          className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 border ${
            isAhead
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
          }`}
        >
          {isAhead ? (
            <>
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              <span>+{lead}m LEAD</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>{Math.abs(lead)}m BEHIND</span>
            </>
          )}
        </div>

        {/* Rival */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-mono text-rose-400 uppercase leading-none">RIVAL ({rivalName})</span>
            <span className="text-sm font-black font-mono leading-tight">{rivalDist}m</span>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
        </div>
      </div>

      {/* Rival Live Event Toast */}
      {notification && (
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-display font-bold shadow-lg animate-in slide-in-from-top-3 duration-200 border ${
            notification.type === 'stumble'
              ? 'bg-amber-500/90 text-black border-amber-300'
              : notification.type === 'crash'
              ? 'bg-rose-600/95 text-white border-rose-400'
              : 'bg-cyan-500/90 text-black border-cyan-300'
          }`}
        >
          {notification.type === 'stumble' && <AlertTriangle className="w-4 h-4 shrink-0" />}
          {notification.type === 'crash' && <Zap className="w-4 h-4 shrink-0" />}
          {notification.type === 'revive' && <ShieldCheck className="w-4 h-4 shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
};
