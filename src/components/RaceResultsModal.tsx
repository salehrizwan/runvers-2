import React from 'react';
import { MultiplayerPlayer } from '../types/game';
import { Trophy, RotateCcw, Home, Award, Zap, Coins } from 'lucide-react';

interface RaceResultsModalProps {
  myId: string;
  players: MultiplayerPlayer[];
  onRematch: () => void;
  onExit: () => void;
}

export const RaceResultsModal: React.FC<RaceResultsModalProps> = ({
  myId,
  players,
  onRematch,
  onExit,
}) => {
  const me = players.find((p) => p.id === myId) || players[0];
  const rival = players.find((p) => p.id !== myId) || players[1] || players[0];

  const won = me.distance > (rival?.distance || 0);
  const tie = me.distance === (rival?.distance || 0);

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-none animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-700 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-white text-center">
        {/* Banner */}
        <div className="flex flex-col items-center gap-2">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
              won
                ? 'bg-gradient-to-tr from-amber-400 to-yellow-500 text-black shadow-amber-500/30'
                : tie
                ? 'bg-neutral-700 text-white'
                : 'bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-rose-500/30'
            }`}
          >
            {won ? <Trophy className="w-9 h-9" /> : <Award className="w-9 h-9" />}
          </div>
          <h2 className="text-2xl font-black font-display tracking-wider">
            {won ? '🏆 VICTORY!' : tie ? '🤝 EPIC TIE!' : '🥈 RUNNER UP!'}
          </h2>
          <p className="text-xs text-neutral-400 font-urdu">
            {won
              ? 'مبارک ہو! آپ نے اپنے دوست کو پیچھے چھوڑ دیا!'
              : 'بہت خوب مقابلہ رہا! کیا آپ دوبارہ چیلنج کرنا چاہتے ہیں؟'}
          </p>
        </div>

        {/* Side-by-Side Results Card */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-neutral-950 border border-white/10">
          {/* You */}
          <div
            className={`p-3 rounded-xl border flex flex-col gap-2 text-left ${
              won ? 'bg-amber-500/10 border-amber-400/40' : 'bg-neutral-900 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-cyan-300 font-bold">YOU</span>
              {won && <span className="text-xs">👑 WINNER</span>}
            </div>
            <div className="font-display font-black text-white text-base truncate">{me.name}</div>

            <div className="flex flex-col gap-1 pt-1 border-t border-white/10 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-neutral-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400" /> Dist:
                </span>
                <span className="font-bold text-white">{me.distance}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400 flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-400" /> Score:
                </span>
                <span className="font-bold text-white">{me.score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400 flex items-center gap-1">
                  <Coins className="w-3 h-3 text-yellow-400" /> Coins:
                </span>
                <span className="font-bold text-white">{me.coins}</span>
              </div>
            </div>
          </div>

          {/* Rival */}
          <div
            className={`p-3 rounded-xl border flex flex-col gap-2 text-left ${
              !won && !tie ? 'bg-amber-500/10 border-amber-400/40' : 'bg-neutral-900 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase text-rose-300 font-bold">RIVAL</span>
              {!won && !tie && <span className="text-xs">👑 WINNER</span>}
            </div>
            <div className="font-display font-black text-white text-base truncate">{rival?.name || 'Rival'}</div>

            <div className="flex flex-col gap-1 pt-1 border-t border-white/10 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-neutral-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-rose-400" /> Dist:
                </span>
                <span className="font-bold text-white">{rival?.distance || 0}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400 flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-400" /> Score:
                </span>
                <span className="font-bold text-white">{rival?.score || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400 flex items-center gap-1">
                  <Coins className="w-3 h-3 text-yellow-400" /> Coins:
                </span>
                <span className="font-bold text-white">{rival?.coins || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onRematch}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 text-black font-display font-black text-sm tracking-wide shadow-lg shadow-amber-400/25 hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            REMATCH! (دوبارہ ریس لگائیں)
          </button>
          <button
            onClick={onExit}
            className="w-full py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-display font-bold text-xs tracking-wider transition flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            MAIN MENU (مرکزی مینو)
          </button>
        </div>
      </div>
    </div>
  );
};
