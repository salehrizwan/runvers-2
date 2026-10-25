import React from 'react';
import { GameStats } from '../types/game';
import { RotateCcw, Home, Trophy, Coins, Key, Flame } from 'lucide-react';

interface GameOverModalProps {
  stats: GameStats;
  isNewHighScore: boolean;
  onRestart: () => void;
  onMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  isNewHighScore,
  onRestart,
  onMenu,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/85 backdrop-blur-none animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-neutral-900 border border-red-900/60 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-center">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-950/80 border border-red-700/50 rounded-full text-red-300 text-xs font-display font-bold uppercase tracking-widest mb-2">
            <Flame className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            CAUGHT BY GORGONOTH
          </div>
          <h2 className="text-4xl font-black font-display text-white tracking-wide">
            RUN TERMINATED
          </h2>
        </div>

        {/* New Record Banner */}
        {isNewHighScore && (
          <div className="bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 border border-amber-400/60 p-2.5 rounded-2xl flex items-center justify-center gap-2 text-amber-300 font-display font-bold text-sm animate-bounce">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>NEW HIGH SCORE RECORD!</span>
          </div>
        )}

        {/* Score & Distance Big Card */}
        <div className="bg-black/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
          <div>
            <div className="text-xs uppercase font-display font-semibold text-neutral-400">Final Score</div>
            <div className="text-4xl font-black font-display text-amber-400 tracking-wider">
              {stats.score.toLocaleString()}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
            <div>
              <div className="text-[11px] font-display uppercase text-neutral-400">Distance</div>
              <div className="text-base font-bold font-display text-cyan-400">{stats.distance}m</div>
            </div>
            <div>
              <div className="text-[11px] font-display uppercase text-neutral-400">Coins</div>
              <div className="text-base font-bold font-display text-amber-300">+{stats.coins}</div>
            </div>
            <div>
              <div className="text-[11px] font-display uppercase text-neutral-400">Keys</div>
              <div className="text-base font-bold font-display text-cyan-300">+{stats.keys}</div>
            </div>
          </div>
        </div>

        {/* Career Bank Total */}
        <div className="flex items-center justify-around bg-neutral-950/70 border border-white/5 py-2.5 px-4 rounded-xl text-xs text-neutral-400 font-display">
          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>Total Coins: <strong className="text-white">{stats.totalCoins}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Key className="w-4 h-4 text-cyan-400" />
            <span>Total Keys: <strong className="text-white">{stats.totalKeys}</strong></span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 pt-1">
          <button
            onClick={onRestart}
            className="w-full py-4 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-black font-display font-black text-lg rounded-2xl shadow-xl hover:brightness-110 active:scale-98 transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            RUN AGAIN
          </button>

          <button
            onClick={onMenu}
            className="w-full py-3 bg-neutral-800 hover:bg-neutral-750 border border-white/10 text-neutral-200 font-display font-bold text-sm rounded-xl transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            RETURN TO MENU
          </button>
        </div>
      </div>
    </div>
  );
};
