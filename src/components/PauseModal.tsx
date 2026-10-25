import React from 'react';
import { GameStats, Mission } from '../types/game';
import { Play, RotateCcw, Home, Volume2, VolumeX, Music, Award } from 'lucide-react';
import { soundManager } from '../audio/SoundManager';

interface PauseModalProps {
  stats: GameStats;
  missions: Mission[];
  soundEnabled: boolean;
  musicEnabled: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onResume: () => void;
  onRestart: () => void;
  onQuitToMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  stats,
  missions,
  soundEnabled,
  musicEnabled,
  onToggleSound,
  onToggleMusic,
  onResume,
  onRestart,
  onQuitToMenu,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/80 backdrop-blur-none animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-700/80 rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
        {/* Title */}
        <div className="text-center">
          <span className="text-xs font-display uppercase tracking-widest text-amber-400 font-bold">
            Adventure Paused
          </span>
          <h2 className="text-3xl font-black font-display text-white mt-1">
            GAME PAUSED
          </h2>
        </div>

        {/* Current Run Snapshot */}
        <div className="grid grid-cols-2 gap-3 bg-black/50 border border-white/10 rounded-2xl p-3 text-center">
          <div>
            <div className="text-[11px] font-display uppercase text-neutral-400">Score</div>
            <div className="text-xl font-bold font-display text-white">{stats.score.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-[11px] font-display uppercase text-neutral-400">Distance</div>
            <div className="text-xl font-bold font-display text-cyan-400">{stats.distance} m</div>
          </div>
        </div>

        {/* Quick Missions Snapshot */}
        <div className="bg-black/40 border border-white/5 rounded-2xl p-3 flex flex-col gap-2">
          <div className="flex items-center gap-1.5 text-xs font-display uppercase font-bold text-amber-400">
            <Award className="w-3.5 h-3.5" />
            <span>Active Objectives</span>
          </div>
          <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto pr-1">
            {missions.slice(0, 3).map((m) => (
              <div key={m.id} className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                <span className="text-neutral-300 truncate max-w-[200px]">{m.title}</span>
                <span className="font-mono text-neutral-400">
                  {m.completed ? 'Done' : `${m.current}/${m.target}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Audio Quick Toggles */}
        <div className="flex items-center justify-center gap-4 py-1">
          <button
            onClick={onToggleSound}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-display font-semibold transition ${
              soundEnabled
                ? 'bg-neutral-800 border-amber-400/40 text-amber-300'
                : 'bg-neutral-900 border-white/10 text-neutral-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            SFX: {soundEnabled ? 'ON' : 'OFF'}
          </button>

          <button
            onClick={onToggleMusic}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-display font-semibold transition ${
              musicEnabled
                ? 'bg-neutral-800 border-cyan-400/40 text-cyan-300'
                : 'bg-neutral-900 border-white/10 text-neutral-500'
            }`}
          >
            <Music className="w-4 h-4" />
            Music: {musicEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onResume}
            className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-yellow-400 text-black font-display font-black text-lg rounded-xl shadow-lg hover:brightness-110 active:scale-98 transition flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-black" />
            RESUME RUN
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={onRestart}
              className="py-3 bg-neutral-800 hover:bg-neutral-750 border border-white/15 text-white font-display font-bold text-sm rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              RESTART
            </button>

            <button
              onClick={onQuitToMenu}
              className="py-3 bg-neutral-800 hover:bg-neutral-750 border border-white/15 text-white font-display font-bold text-sm rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Home className="w-4 h-4" />
              MAIN MENU
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
