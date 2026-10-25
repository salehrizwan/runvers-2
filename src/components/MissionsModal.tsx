import React from 'react';
import { Mission, GameStats } from '../types/game';
import { ENVIRONMENTS } from '../game/environments/EnvironmentThemes';
import { Award, CheckCircle2, Coins, Key, Lock, X } from 'lucide-react';

interface MissionsModalProps {
  missions: Mission[];
  stats: GameStats;
  onClose: () => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  missions,
  stats,
  onClose,
}) => {
  const envList = Object.values(ENVIRONMENTS);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/80 backdrop-blur-none animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-700 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-black font-display text-white">Missions & Progression</h2>
              <p className="text-xs text-neutral-400">Complete challenges to earn Coins, Keys, and unlock new Realms</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {/* World Realms Unlock Status */}
          <div>
            <h3 className="text-xs font-display uppercase tracking-widest text-amber-400 font-bold mb-2">
              World Realms Progression
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {envList.map((env) => {
                const isUnlocked = env.unlocked;
                return (
                  <div
                    key={env.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between ${
                      isUnlocked
                        ? 'bg-neutral-800/80 border-white/10'
                        : 'bg-black/60 border-neutral-800 opacity-70'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-display font-semibold text-neutral-400">
                        {env.tagline}
                      </div>
                      <div className="font-display font-bold text-sm text-white">{env.name}</div>
                      {!isUnlocked && (
                        <div className="text-[10px] text-amber-400 font-display mt-0.5">
                          Req: {env.requiredKeys} Keys or {env.requiredDistance}m
                        </div>
                      )}
                    </div>
                    {isUnlocked ? (
                      <div className="flex items-center gap-1 text-emerald-400 text-xs font-display font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Ready</span>
                      </div>
                    ) : (
                      <Lock className="w-4 h-4 text-neutral-500" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Missions List */}
          <div>
            <h3 className="text-xs font-display uppercase tracking-widest text-cyan-400 font-bold mb-2">
              Active Runner Missions
            </h3>
            <div className="space-y-2.5">
              {missions.map((m) => {
                const pct = Math.min(100, Math.floor((m.current / m.target) * 100));
                return (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-2xl border transition ${
                      m.completed
                        ? 'bg-emerald-950/20 border-emerald-500/30'
                        : 'bg-black/50 border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-bold text-sm text-white">{m.title}</h4>
                          {m.completed && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold font-display px-2 py-0.5 rounded-full border border-emerald-500/30">
                              COMPLETED
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 mt-0.5">{m.description}</p>
                      </div>

                      {/* Reward Pills */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {m.rewardCoins > 0 && (
                          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg text-xs font-display font-bold text-amber-300">
                            <Coins className="w-3.5 h-3.5 text-amber-400" />
                            <span>+{m.rewardCoins}</span>
                          </div>
                        )}
                        {m.rewardKeys > 0 && (
                          <div className="flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-lg text-xs font-display font-bold text-cyan-300">
                            <Key className="w-3.5 h-3.5 text-cyan-400" />
                            <span>+{m.rewardKeys}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mb-1">
                      <span>Progress</span>
                      <span>
                        {m.current} / {m.target} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          m.completed
                            ? 'bg-emerald-500'
                            : 'bg-gradient-to-r from-amber-400 to-cyan-400'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-display font-bold text-sm rounded-xl transition"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
