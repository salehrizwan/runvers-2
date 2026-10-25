import React, { useState } from 'react';
import { GameSettings } from '../types/game';
import { Settings, Volume2, VolumeX, Music, Monitor, Smartphone, X, User, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  settings: GameSettings;
  onChangeSettings: (newSettings: Partial<GameSettings>) => void;
  onClose: () => void;
}

const NAME_SUGGESTIONS = ['Saleh', 'Rizwan', 'ShadowRebel', 'CyberBlade', 'TurboX', 'Falcon'];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onChangeSettings,
  onClose,
}) => {
  const [nameInput, setNameInput] = useState(settings.playerName || 'Saleh');

  const handleNameChange = (val: string) => {
    const cleaned = val.slice(0, 15);
    setNameInput(cleaned);
    onChangeSettings({ playerName: cleaned });
    try {
      localStorage.setItem('runverse_player_name', cleaned);
    } catch {}
  };

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/80 backdrop-blur-none animate-in fade-in duration-200">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-neutral-900 border border-neutral-700 rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-black font-display text-white">GAME SETTINGS</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Name Customization */}
        <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-neutral-800/80 border border-cyan-500/30">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-display uppercase tracking-wider text-cyan-300 font-bold">
              <User className="w-4 h-4 text-cyan-400" />
              Player Nickname (آپ کا نام)
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">{nameInput.length}/15</span>
          </div>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Enter runner name..."
            maxLength={15}
            className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-neutral-700 text-white font-display font-bold text-sm focus:border-cyan-400 focus:outline-none transition"
          />
          {/* Quick suggestions */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-neutral-400 flex items-center gap-1 font-semibold">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Ideas:
            </span>
            {NAME_SUGGESTIONS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleNameChange(preset)}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition font-mono ${
                  nameInput === preset
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                    : 'bg-neutral-900 border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Graphics Quality */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-display uppercase tracking-wider text-neutral-300 font-bold">
            <Monitor className="w-4 h-4 text-cyan-400" />
            <span>Graphics Quality</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['low', 'medium', 'high'] as const).map((q) => (
              <button
                key={q}
                onClick={() => onChangeSettings({ graphicsQuality: q })}
                className={`py-2 px-3 rounded-xl border text-xs font-display font-bold uppercase transition ${
                  settings.graphicsQuality === q
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-neutral-800/80 border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-neutral-400">
            {settings.graphicsQuality === 'low'
              ? 'Optimized for high framerates on mobile and battery saving.'
              : settings.graphicsQuality === 'medium'
              ? 'Balanced PBR materials with soft shading.'
              : 'Maximum cinematic fidelity, soft shadows and full post-reflections.'}
          </span>
        </div>

        {/* Volume Slider */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-display uppercase tracking-wider text-neutral-300 font-bold">
            <span className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-amber-400" />
              Master Volume
            </span>
            <span className="font-mono text-amber-400">{Math.round(settings.volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.volume}
            onChange={(e) => onChangeSettings({ volume: parseFloat(e.target.value) })}
            className="w-full accent-amber-400 h-2 bg-neutral-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Audio Toggles */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onChangeSettings({ soundEnabled: !settings.soundEnabled })}
            className={`p-3 rounded-2xl border flex flex-col gap-1 items-start transition ${
              settings.soundEnabled
                ? 'bg-neutral-800 border-amber-400/40 text-white'
                : 'bg-neutral-900 border-white/10 text-neutral-500'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="text-[10px] font-mono uppercase">{settings.soundEnabled ? 'ON' : 'OFF'}</span>
            </div>
            <span className="text-xs font-display font-bold">Sound Effects</span>
          </button>

          <button
            onClick={() => onChangeSettings({ musicEnabled: !settings.musicEnabled })}
            className={`p-3 rounded-2xl border flex flex-col gap-1 items-start transition ${
              settings.musicEnabled
                ? 'bg-neutral-800 border-cyan-400/40 text-white'
                : 'bg-neutral-900 border-white/10 text-neutral-500'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <Music className={`w-4 h-4 ${settings.musicEnabled ? 'text-cyan-400' : ''}`} />
              <span className="text-[10px] font-mono uppercase">{settings.musicEnabled ? 'ON' : 'OFF'}</span>
            </div>
            <span className="text-xs font-display font-bold">Runner Music</span>
          </button>
        </div>

        {/* Touch Feedback */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-800/60 border border-white/10">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <div>
              <div className="text-xs font-display font-bold text-white">Touch Haptics</div>
              <div className="text-[11px] text-neutral-400">Vibrate on lane switch & jumps</div>
            </div>
          </div>
          <button
            onClick={() => onChangeSettings({ hapticFeedback: !settings.hapticFeedback })}
            className={`px-3 py-1 rounded-lg text-xs font-display font-bold border transition ${
              settings.hapticFeedback
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                : 'bg-neutral-900 border-white/10 text-neutral-500'
            }`}
          >
            {settings.hapticFeedback ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 text-black font-display font-black text-sm rounded-xl transition"
          >
            SAVE & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
