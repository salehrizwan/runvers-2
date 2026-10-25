import React, { useState } from 'react';
import { multiplayerManager } from '../game/multiplayer/MultiplayerManager';
import { Users, Copy, Check, Play, LogIn, Sparkles, Loader2, X, ShieldAlert } from 'lucide-react';

interface MultiplayerModalProps {
  playerName: string;
  onOpenSettings: () => void;
  onClose: () => void;
  onStartMultiplayerRace: () => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  playerName,
  onOpenSettings,
  onClose,
  onStartMultiplayerRace,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [roomCode, setRoomCode] = useState<string | null>(multiplayerManager.roomCode);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [guestName, setGuestName] = useState<string | null>(multiplayerManager.rivalName !== 'Rival' ? multiplayerManager.rivalName : null);
  const [hostName, setHostName] = useState<string | null>(null);
  const [joinedAsGuest, setJoinedAsGuest] = useState(false);

  // Setup callbacks
  React.useEffect(() => {
    multiplayerManager.onRoomCreated = (code) => {
      setRoomCode(code);
      setIsLoading(false);
      setErrorMessage(null);
    };

    multiplayerManager.onGuestJoined = (guest) => {
      setGuestName(guest);
      setIsLoading(false);
    };

    multiplayerManager.onRoomJoined = (code, host) => {
      setRoomCode(code);
      setHostName(host);
      setJoinedAsGuest(true);
      setIsLoading(false);
      setErrorMessage(null);
    };

    multiplayerManager.onError = (err) => {
      setErrorMessage(err);
      setIsLoading(false);
    };

    return () => {
      // Don't detach race callbacks here
    };
  }, []);

  const handleCreateRoom = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await multiplayerManager.createRoom(playerName);
    } catch {
      setErrorMessage('Could not connect to multiplayer server. Please try again.');
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code || code.length < 4) {
      setErrorMessage('Please enter a valid 4-digit room code.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await multiplayerManager.joinRoom(code, playerName);
    } catch {
      setErrorMessage('Unable to connect to game room.');
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLaunchRace = () => {
    multiplayerManager.startRace();
    onStartMultiplayerRace();
  };

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/85 backdrop-blur-none animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-700 rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black font-display tracking-wide">ONLINE 2-PLAYER RACE</h2>
              <p className="text-xs text-neutral-400 font-urdu">آن لائن دوست کے ساتھ کھیلیں</p>
            </div>
          </div>
          <button
            onClick={() => {
              multiplayerManager.leaveRoom();
              onClose();
            }}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Player Profile Strip */}
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-neutral-800/80 border border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center font-black text-black text-xs font-display">
              {playerName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-[10px] text-neutral-400 uppercase font-mono tracking-wider">Your Nickname</div>
              <div className="text-sm font-bold font-display text-white">{playerName}</div>
            </div>
          </div>
          <button
            onClick={onOpenSettings}
            className="text-xs px-3 py-1.5 rounded-xl bg-neutral-700/80 hover:bg-neutral-600 text-neutral-200 font-display font-semibold transition"
          >
            Change Name ✏️
          </button>
        </div>

        {/* Tab Switcher (Only if not joined yet) */}
        {!roomCode && (
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-neutral-950 border border-white/10 text-xs font-display font-bold">
            <button
              onClick={() => {
                setActiveTab('create');
                setErrorMessage(null);
              }}
              className={`py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
                activeTab === 'create'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-black shadow-lg shadow-cyan-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              CREATE ROOM (کمرہ بنائیں)
            </button>
            <button
              onClick={() => {
                setActiveTab('join');
                setErrorMessage(null);
              }}
              className={`py-2.5 rounded-xl transition flex items-center justify-center gap-2 ${
                activeTab === 'join'
                  ? 'bg-gradient-to-r from-rose-500 to-crimson-600 text-white shadow-lg shadow-rose-500/20'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LogIn className="w-4 h-4" />
              JOIN ROOM (جوائن کریں)
            </button>
          </div>
        )}

        {/* Error message banner */}
        {errorMessage && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: CREATE ROOM VIEW */}
        {activeTab === 'create' && !joinedAsGuest && (
          <div className="flex flex-col gap-4">
            {!roomCode ? (
              <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-neutral-800/40 border border-dashed border-white/10 text-center gap-3">
                <p className="text-xs text-neutral-300 max-w-xs">
                  Generate a private 4-digit code and share it with your friend to race together in real time!
                </p>
                <button
                  onClick={handleCreateRoom}
                  disabled={isLoading}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-black font-display font-black text-sm tracking-wide shadow-lg shadow-cyan-400/20 hover:scale-[1.02] active:scale-[0.98] transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  GENERATE ROOM CODE
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Big Code Card */}
                <div className="p-4 rounded-2xl bg-neutral-950 border border-cyan-500/40 flex flex-col items-center justify-center gap-2 text-center relative overflow-hidden">
                  <div className="text-[10px] uppercase tracking-widest text-cyan-400 font-mono">
                    YOUR ROOM CODE (دوست کو یہ کوڈ دیں)
                  </div>
                  <div className="text-4xl font-mono font-black text-white tracking-[0.25em]">{roomCode}</div>
                  <button
                    onClick={handleCopyCode}
                    className="mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-cyan-300 font-mono transition"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'COPIED TO CLIPBOARD!' : 'COPY CODE'}
                  </button>
                </div>

                {/* Both Players Roster Card */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Host Player Card (Teal Rebel) */}
                  <div className="p-3.5 rounded-2xl bg-teal-950/40 border border-teal-500/40 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-teal-400 font-bold">PLAYER 1 (YOU)</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="font-display font-black text-white text-base truncate">{playerName}</div>
                    <div className="flex items-center gap-2 text-[11px] text-teal-300 font-mono">
                      <span className="w-3 h-3 rounded-full bg-[#149694] border border-white/20" />
                      Teal Rebel Outfit
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-center font-bold">
                      HOST (READY)
                    </span>
                  </div>

                  {/* Guest Player Card (Crimson Rebel) */}
                  <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-rose-400 font-bold">PLAYER 2 (FRIEND)</span>
                      <span className={`w-2 h-2 rounded-full ${guestName ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
                    </div>
                    <div className="font-display font-black text-white text-base truncate">
                      {guestName || 'Waiting for Friend...'}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-rose-300 font-mono">
                      <span className="w-3 h-3 rounded-full bg-[#c9184a] border border-white/20" />
                      Crimson Rebel Outfit
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border text-center font-bold ${
                        guestName
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {guestName ? 'CONNECTED & READY' : 'WAITING TO JOIN...'}
                    </span>
                  </div>
                </div>

                {/* Action button */}
                {guestName ? (
                  <button
                    onClick={handleLaunchRace}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-black font-display font-black text-base tracking-wider shadow-lg shadow-emerald-400/30 hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    START 2-PLAYER RACE NOW! (ریس شروع کریں)
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-neutral-800/60 border border-white/5 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    Waiting for your friend to enter code <strong>{roomCode}</strong>...
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: JOIN ROOM VIEW */}
        {activeTab === 'join' && !joinedAsGuest && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-display font-bold uppercase tracking-wider text-rose-300">
                Enter Friend's 4-Digit Room Code (کوڈ درج کریں)
              </label>
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. 7492"
                maxLength={6}
                className="w-full px-4 py-3.5 rounded-2xl bg-neutral-950 border border-neutral-700 text-center font-mono font-black text-2xl tracking-[0.25em] text-white focus:border-rose-400 focus:outline-none transition uppercase"
              />
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={isLoading || joinCodeInput.length < 4}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-display font-black text-sm tracking-wide shadow-lg shadow-rose-500/25 hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              JOIN RACE ROOM
            </button>
          </div>
        )}

        {/* GUEST CONNECTED WAITING VIEW */}
        {joinedAsGuest && (
          <div className="flex flex-col items-center gap-4 py-3 text-center">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-2 text-xs font-display font-bold">
              <Check className="w-4 h-4 text-emerald-400" />
              Connected to Room {roomCode}!
            </div>

            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="p-3.5 rounded-2xl bg-teal-950/40 border border-teal-500/40 flex flex-col gap-1.5 text-left">
                <span className="text-[10px] font-mono text-teal-400 uppercase">HOST</span>
                <span className="font-display font-bold text-white text-base">{hostName || 'Rival Host'}</span>
                <span className="text-[10px] text-teal-300 font-mono">Teal Rebel</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex flex-col gap-1.5 text-left">
                <span className="text-[10px] font-mono text-rose-400 uppercase">YOU (GUEST)</span>
                <span className="font-display font-bold text-white text-base">{playerName}</span>
                <span className="text-[10px] text-rose-300 font-mono">Crimson Rebel</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-neutral-300 font-mono animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              Waiting for Host ({hostName}) to launch race...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
