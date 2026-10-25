import React, { useEffect, useState } from 'react';
import { Key, Heart, X, Zap } from 'lucide-react';

interface ReviveModalProps {
  requiredKeys: number;
  availableKeys: number;
  score: number;
  distance: number;
  onRevive: () => void;
  onGiveUp: () => void;
}

export const ReviveModal: React.FC<ReviveModalProps> = ({
  requiredKeys,
  availableKeys,
  score,
  distance,
  onRevive,
  onGiveUp,
}) => {
  const [timeLeft, setTimeLeft] = useState(5);
  const hasEnoughKeys = availableKeys >= requiredKeys;

  // 5-second countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      onGiveUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onGiveUp]);

  return (
    <div className="absolute inset-0 z-35 flex items-center justify-center p-4 bg-black/85 backdrop-blur-none animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-neutral-900 border-2 border-amber-500/60 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center gap-5 relative overflow-hidden">
        {/* Glow background accent */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Circular Countdown Ring */}
        <div className="relative w-20 h-20 flex items-center justify-center mt-2">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              className="stroke-neutral-800"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="42"
              className="stroke-amber-400 transition-all duration-1000 ease-linear"
              strokeWidth="8"
              strokeDasharray={264}
              strokeDashoffset={264 * (1 - timeLeft / 5)}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <span className="absolute font-display font-black text-3xl text-white">
            {timeLeft}
          </span>
        </div>

        {/* Title & Prompt */}
        <div>
          <span className="text-xs uppercase font-display font-bold tracking-widest text-amber-400">
            Crashed!
          </span>
          <h2 className="text-2xl font-black font-display text-white mt-0.5">
            SAVE ME & CONTINUE?
          </h2>
          <p className="text-xs text-neutral-300 mt-1">
            Keep your run going with <span className="font-bold text-cyan-400">{score.toLocaleString()} pts</span> and <span className="font-bold text-cyan-400">{distance}m</span>!
          </p>
        </div>

        {/* Keys Required Box */}
        <div className="w-full bg-black/60 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-cyan-500/20 rounded-xl border border-cyan-500/30">
              <Key className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-left">
              <div className="text-[11px] font-display uppercase font-semibold text-neutral-400">
                Revive Cost
              </div>
              <div className="text-base font-black font-display text-white">
                {requiredKeys} {requiredKeys === 1 ? 'Ancient Key' : 'Ancient Keys'}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[11px] font-display uppercase font-semibold text-neutral-400">
              You Have
            </div>
            <div
              className={`text-base font-black font-display ${
                hasEnoughKeys ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {availableKeys} Keys
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-2.5">
          <button
            onClick={() => {
              if (hasEnoughKeys) onRevive();
            }}
            disabled={!hasEnoughKeys}
            className={`w-full py-4 rounded-2xl font-display font-black text-base flex items-center justify-center gap-2 shadow-xl transition-all ${
              hasEnoughKeys
                ? 'bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 text-black hover:scale-102 active:scale-98 shadow-[0_0_25px_rgba(6,182,212,0.4)] cursor-pointer'
                : 'bg-neutral-800 text-neutral-500 border border-white/5 cursor-not-allowed'
            }`}
          >
            <Zap className="w-5 h-5 fill-current" />
            {hasEnoughKeys
              ? `USE ${requiredKeys} ${requiredKeys === 1 ? 'KEY' : 'KEYS'} TO REVIVE`
              : 'NOT ENOUGH KEYS'}
          </button>

          <button
            onClick={onGiveUp}
            className="w-full py-2.5 bg-neutral-800/80 hover:bg-neutral-850 text-neutral-400 hover:text-white font-display font-bold text-xs rounded-xl border border-white/5 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
            NO THANKS, END RUN
          </button>
        </div>
      </div>
    </div>
  );
};
