import React from 'react';
import { GameStats, PowerUpState } from '../types/game';
import { Pause, Coins, Key, Shield, Magnet, Zap, Sparkles } from 'lucide-react';

interface HUDProps {
  stats: GameStats;
  powerUps: PowerUpState[];
  monsterProximity: number; // 0 to 1
  warpNotification?: { realmName: string; tagline: string } | null;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  powerUps,
  monsterProximity,
  warpNotification,
  onPause,
}) => {
  const isDanger = monsterProximity > 0.45;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 md:p-6 overflow-hidden">
      {/* Danger Vignette Warning */}
      {isDanger && (
        <div
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none border-4 border-red-500/50"
          style={{
            boxShadow: `inset 0 0 ${Math.floor(monsterProximity * 90)}px rgba(220, 38, 38, ${monsterProximity * 0.7})`,
          }}
        />
      )}

      {/* Dimensional Warp Banner */}
      {warpNotification && (
        <div className="absolute top-20 inset-x-0 mx-auto w-full max-w-lg px-4 pointer-events-none z-20 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-gradient-to-r from-cyan-950/90 via-blue-900/95 to-cyan-950/90 border-2 border-cyan-400 p-4 rounded-3xl shadow-[0_0_40px_rgba(6,182,212,0.8)] text-center">
            <div className="text-[11px] font-display font-black uppercase tracking-[0.3em] text-cyan-300">
              ⚡ DIMENSIONAL PORTAL WARP (+1,500 PTS) ⚡
            </div>
            <div className="text-2xl md:text-3xl font-black font-display text-white mt-0.5 tracking-wide">
              {warpNotification.realmName}
            </div>
            <div className="text-xs text-cyan-200/90 font-display font-semibold mt-1">
              {warpNotification.tagline}
            </div>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="flex items-start justify-between w-full max-w-5xl mx-auto">
        {/* Left: Avatar, Score & Distance */}
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-2xl overflow-hidden border border-teal-400 bg-black/60 shadow-md shrink-0 hidden sm:block">
            <img
              src="/assets/aistudio/male_02f22d64.jpg"
              alt="Urban Rebel"
              className="w-full h-full object-cover object-top"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-2 bg-black/60 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-none">
              <span className="text-xs uppercase tracking-wider text-amber-400/90 font-bold font-display">Score</span>
              <span className="text-2xl md:text-3xl font-black font-display text-white tracking-wider">
                {stats.score.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-black/50 border border-white/10 px-3 py-1.5 rounded-lg w-fit">
              <span className="text-xs uppercase tracking-wider text-neutral-400 font-semibold font-display">Distance</span>
              <span className="text-sm md:text-base font-bold font-display text-cyan-400">
                {stats.distance} <span className="text-xs text-neutral-400">m</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Monster Proximity Threat Meter */}
        <div className="flex flex-col items-center">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all duration-300 ${
              isDanger
                ? 'bg-red-950/80 border-red-500 text-red-200'
                : 'bg-black/60 border-white/10 text-neutral-300'
            }`}
          >
            <span className="text-[11px] font-display uppercase tracking-widest font-bold">
              {isDanger ? 'BEAST PURSUIT! RUN!' : 'PATH CLEAR'}
            </span>
            <div className="w-16 md:w-28 h-2.5 bg-neutral-800 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  isDanger ? 'bg-gradient-to-r from-orange-500 to-red-600' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, monsterProximity * 100))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Coins, Keys & Pause Button */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-black/60 border border-amber-500/30 px-3 py-1.5 rounded-xl">
            <Coins className="w-4 h-4 text-amber-400 animate-bounce" />
            <span className="font-display font-bold text-amber-300 text-base md:text-lg">
              {stats.coins}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-black/60 border border-cyan-500/30 px-2.5 py-1.5 rounded-xl">
            <Key className="w-4 h-4 text-cyan-400" />
            <span className="font-display font-bold text-cyan-300 text-base md:text-lg">
              {stats.keys}
            </span>
          </div>

          <button
            onClick={onPause}
            className="pointer-events-auto p-2.5 bg-black/60 hover:bg-neutral-800 border border-white/20 active:scale-95 rounded-xl transition text-white"
            title="Pause (Esc or P)"
          >
            <Pause className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Active Power-up Timers Tray */}
      {powerUps.length > 0 && (
        <div className="flex items-center justify-center gap-3 w-full max-w-md mx-auto mb-20 md:mb-6">
          {powerUps.map((pu) => {
            const pct = Math.max(0, Math.min(100, (pu.duration / pu.totalDuration) * 100));
            let icon = <Zap className="w-4 h-4 text-yellow-400" />;
            let title = 'BOOST';
            let color = 'from-amber-400 to-yellow-500';

            if (pu.type === 'shield') {
              icon = <Shield className="w-4 h-4 text-cyan-400" />;
              title = 'SHIELD';
              color = 'from-cyan-400 to-blue-500';
            } else if (pu.type === 'magnet') {
              icon = <Magnet className="w-4 h-4 text-rose-400" />;
              title = 'MAGNET';
              color = 'from-rose-500 to-pink-500';
            } else if (pu.type === 'multiplier') {
              icon = <Sparkles className="w-4 h-4 text-purple-400" />;
              title = '2X SCORE';
              color = 'from-purple-500 to-fuchsia-500';
            }

            return (
              <div
                key={pu.type}
                className="flex items-center gap-2 bg-black/75 border border-white/20 px-3 py-1.5 rounded-xl shadow-lg"
              >
                {icon}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-display font-bold uppercase tracking-wider text-white">
                      {title}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-300">
                      {pu.duration.toFixed(1)}s
                    </span>
                  </div>
                  <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden mt-0.5">
                    <div
                      className={`h-full bg-gradient-to-r ${color} transition-all duration-100`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
