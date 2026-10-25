import React from 'react';
import { EnvironmentId, GameStats } from '../types/game';
import { ENVIRONMENTS } from '../game/environments/EnvironmentThemes';
import { Play, Trophy, Coins, Key, Award, Settings, Download, Lock, CheckCircle } from 'lucide-react';

interface StartScreenProps {
  stats: GameStats;
  selectedEnv: EnvironmentId;
  playerName: string;
  onSelectEnv: (envId: EnvironmentId) => void;
  onStartGame: () => void;
  onOpenMultiplayer: () => void;
  onOpenMissions: () => void;
  onOpenSettings: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  stats,
  selectedEnv,
  playerName,
  onSelectEnv,
  onStartGame,
  onOpenMultiplayer,
  onOpenMissions,
  onOpenSettings,
}) => {
  const envList = Object.values(ENVIRONMENTS);

  const getRealmDetails = (id: EnvironmentId) => {
    switch (id) {
      case 'ruins':
        return {
          hazards: 'Stone Hurdles & Obelisks',
          speed: '20 m/s',
          badge: 'Balanced Challenge',
        };
      case 'jungle':
        return {
          hazards: 'Rolling Boulders & Wild Vines',
          speed: '23 m/s',
          badge: 'Fast Pace',
        };
      case 'underground':
        return {
          hazards: 'Molten Lava Geysers & Steam',
          speed: '26 m/s',
          badge: 'High Danger',
        };
      case 'cybercity':
        return {
          hazards: 'Laser Tripwires & Cyber Pylons',
          speed: '29 m/s',
          badge: 'Extreme Speed',
        };
    }
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 md:p-8 bg-gradient-to-t from-black/85 via-black/40 to-black/75 overflow-y-auto">
      {/* Top Bar: Vault Bank & Stats */}
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
        <div className="flex items-center gap-2 bg-black/60 border border-white/10 px-3.5 py-1.5 rounded-xl">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-xs uppercase font-display text-neutral-400 font-semibold">High Score</span>
          <span className="text-base font-bold font-display text-amber-400">
            {stats.highScore.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Player Name Tag with Edit */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 bg-neutral-800/80 hover:bg-neutral-700/80 border border-cyan-500/30 px-3 py-1.5 rounded-xl text-xs font-display font-bold text-cyan-300 transition cursor-pointer"
            title="Edit Player Name"
          >
            <span>👤 {playerName}</span>
            <span className="text-[10px] text-neutral-400">✏️</span>
          </button>

          <div className="flex items-center gap-1.5 bg-black/60 border border-amber-500/20 px-3 py-1.5 rounded-xl">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold font-display text-amber-300">
              {stats.totalCoins}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-black/60 border border-cyan-500/20 px-3 py-1.5 rounded-xl">
            <Key className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold font-display text-cyan-300">
              {stats.totalKeys}
            </span>
          </div>

          <button
            onClick={onOpenSettings}
            className="p-2 bg-black/60 hover:bg-neutral-800 border border-white/10 active:scale-95 rounded-xl transition text-neutral-300 hover:text-white"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Hero Title & Environment Carousel */}
      <div className="flex flex-col items-center justify-center text-center my-auto py-4 max-w-4xl mx-auto">
        {/* Logo */}
        <div className="relative mb-2">
          <span className="text-xs md:text-sm font-display tracking-[0.35em] uppercase text-cyan-400 font-bold mb-1 block">
            Endless 3D Runner Adventure
          </span>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-amber-500 drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
            RUNVERSE
          </h1>
          <div className="h-1 w-32 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-2" />
        </div>

        {/* Urban Rebel Hero Card */}
        <div className="flex items-center gap-3 bg-black/60 border border-teal-500/40 px-3.5 py-1.5 rounded-2xl mb-3 shadow-[0_0_20px_rgba(20,150,148,0.25)]">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-teal-400 shrink-0">
            <img
              src="/assets/aistudio/male_02f22d64.jpg"
              alt="Urban Rebel Hero"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="text-left">
            <div className="text-[10px] font-display uppercase tracking-widest text-teal-400 font-bold">
              Runner Selected
            </div>
            <div className="text-sm font-black font-display text-white">
              Urban Rebel (Spiky Bandana)
            </div>
          </div>
        </div>

        <p className="text-neutral-300 text-xs md:text-sm max-w-xl mx-auto mb-4 px-4">
          Dodge traps, leap volcanic geysers, and slide through ancient ruins as Gorgonoth stalks your run. Reach glowing <span className="text-cyan-400 font-bold">Dimensional Stargate Portals</span> in selected lanes to warp between realms!
        </p>

        {/* Environment Selector Cards */}
        <div className="w-full mb-6">
          <div className="flex items-center justify-between mb-2.5 px-2">
            <span className="text-xs font-display uppercase tracking-widest text-neutral-400 font-bold">
              Select World Realm & Criteria
            </span>
            <span className="text-xs text-amber-400 font-display font-semibold">
              {envList.filter((e) => e.unlocked).length} / {envList.length} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {envList.map((env) => {
              const isSelected = selectedEnv === env.id;
              const isUnlocked = env.unlocked;
              const details = getRealmDetails(env.id);

              return (
                <div
                  key={env.id}
                  onClick={() => {
                    if (isUnlocked) onSelectEnv(env.id);
                  }}
                  className={`relative p-3.5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.3)] ring-1 ring-amber-400'
                      : isUnlocked
                      ? 'bg-black/60 border-white/10 hover:border-white/30 cursor-pointer'
                      : 'bg-black/80 border-neutral-800 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-display uppercase font-bold tracking-wider text-amber-400">
                        {details.badge}
                      </span>
                      {isUnlocked ? (
                        isSelected ? (
                          <CheckCircle className="w-4 h-4 text-amber-400" />
                        ) : null
                      ) : (
                        <Lock className="w-4 h-4 text-neutral-500" />
                      )}
                    </div>

                    <h3 className="font-display font-bold text-sm md:text-base text-white">
                      {env.name}
                    </h3>
                    <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                      {env.tagline}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-white/10 flex flex-col gap-1 text-[11px] font-display">
                    <div className="flex items-center justify-between text-neutral-300">
                      <span className="text-neutral-500">Hazards:</span>
                      <span className="font-semibold text-neutral-200 text-right truncate max-w-[130px]">{details.hazards}</span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-300">
                      <span className="text-neutral-500">Pace:</span>
                      <span className="font-bold text-cyan-300">{details.speed}</span>
                    </div>

                    {!isUnlocked && (
                      <div className="text-[10px] text-amber-300 font-display mt-1 bg-amber-950/50 p-1 rounded-lg border border-amber-800/50 text-center font-bold">
                        Requires {env.requiredKeys} Keys or {env.requiredDistance}m
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons: 2-Player Online vs Solo */}
        <div className="flex flex-col sm:flex-row items-center gap-3.5 w-full max-w-lg justify-center">
          {/* Online Multiplayer Button */}
          <button
            onClick={onOpenMultiplayer}
            className="group w-full sm:w-auto flex-1 relative inline-flex items-center justify-center px-6 py-4 font-display text-base md:text-lg font-black text-black bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 rounded-2xl shadow-[0_10px_30px_rgba(6,182,212,0.4)] hover:shadow-[0_15px_40px_rgba(6,182,212,0.65)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-black mr-2 animate-ping" />
            ONLINE 2-PLAYER RACE
          </button>

          {/* Solo Button */}
          <button
            onClick={onStartGame}
            className="group w-full sm:w-auto relative inline-flex items-center justify-center px-6 py-4 font-display text-base md:text-lg font-black text-black bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 rounded-2xl shadow-[0_10px_30px_rgba(245,158,11,0.35)] hover:shadow-[0_15px_40px_rgba(245,158,11,0.55)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <Play className="w-5 h-5 mr-1.5 fill-black" />
            SOLO RUN
          </button>
        </div>
      </div>

      {/* Bottom Dock: Controls & Missions */}
      <div className="flex flex-wrap items-center justify-between gap-3 w-full max-w-5xl mx-auto pt-4 border-t border-white/10 text-xs">
        {/* Controls Quick Reference */}
        <div className="flex items-center gap-3 text-neutral-400 flex-wrap">
          <span className="hidden sm:inline font-semibold">Controls:</span>
          <span className="bg-neutral-800 px-2 py-1 rounded text-neutral-200 font-mono">A / D / ← →</span>
          <span>Steer Lanes</span>
          <span className="bg-neutral-800 px-2 py-1 rounded text-neutral-200 font-mono">W / ↑ / Space</span>
          <span>Jump</span>
          <span className="bg-neutral-800 px-2 py-1 rounded text-neutral-200 font-mono">S / ↓</span>
          <span>Slide</span>
        </div>

        {/* Missions Button */}
        <button
          onClick={onOpenMissions}
          className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900/90 hover:bg-neutral-800 border border-white/10 hover:border-amber-400/50 rounded-xl font-display font-semibold text-neutral-200 transition"
        >
          <Award className="w-4 h-4 text-amber-400" />
          Missions & Rewards
        </button>
      </div>
    </div>
  );
};
