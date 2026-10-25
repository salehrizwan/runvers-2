import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { GameState, GameStats, PowerUpState, EnvironmentId, GameSettings, RivalState, MultiplayerPlayer } from './types/game';
import { HUD } from './components/HUD';
import { StartScreen } from './components/StartScreen';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { MissionsModal } from './components/MissionsModal';
import { SettingsModal } from './components/SettingsModal';
import { MobileControls } from './components/MobileControls';
import { ReviveModal } from './components/ReviveModal';
import { MultiplayerModal } from './components/MultiplayerModal';
import { MultiplayerHUD } from './components/MultiplayerHUD';
import { RaceResultsModal } from './components/RaceResultsModal';
import { multiplayerManager } from './game/multiplayer/MultiplayerManager';
import { soundManager } from './audio/SoundManager';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // UI State
  const [gameState, setGameState] = useState<GameState>('START');
  const [selectedEnv, setSelectedEnv] = useState<EnvironmentId>('ruins');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    distance: 0,
    coins: 0,
    totalCoins: 0,
    keys: 0,
    totalKeys: 0,
    jumpsCount: 0,
    slidesCount: 0,
    gamesPlayed: 0,
  });
  const [powerUps, setPowerUps] = useState<PowerUpState[]>([]);
  const [monsterProximity, setMonsterProximity] = useState(0);
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  const [warpNotification, setWarpNotification] = useState<{ realmName: string; tagline: string } | null>(null);
  const [reviveCost, setReviveCost] = useState(1);

  // Multiplayer States
  const [showMultiplayerModal, setShowMultiplayerModal] = useState(false);
  const [showRaceResults, setShowRaceResults] = useState(false);
  const [racePlayers, setRacePlayers] = useState<MultiplayerPlayer[]>([]);
  const [multiplayerCountdown, setMultiplayerCountdown] = useState<number | null>(null);
  const [isMultiplayerRace, setIsMultiplayerRace] = useState(false);
  const [rivalState, setRivalState] = useState<RivalState | null>(null);
  const [rivalNotification, setRivalNotification] = useState<{ message: string; type: 'stumble' | 'crash' | 'revive' } | null>(null);

  // Modals
  const [showMissions, setShowMissions] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Settings State
  const [settings, setSettings] = useState<GameSettings>(() => {
    const savedName = localStorage.getItem('runverse_player_name') || 'Saleh';
    return {
      playerName: savedName,
      soundEnabled: true,
      musicEnabled: true,
      volume: 0.8,
      graphicsQuality: 'high',
      hapticFeedback: true,
    };
  });

  // Initialize Game Engine on Canvas Mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current);
    engineRef.current = engine;

    // Load initial stats into state
    setStats({ ...engine.stats });

    // Hook callbacks
    engine.onStatsUpdate = (newStats, newPowerUps, proximity) => {
      setStats(newStats);
      setPowerUps(newPowerUps);
      setMonsterProximity(proximity);
    };

    engine.onPromptRevive = (cost) => {
      setReviveCost(cost);
      setGameState('REVIVE');
    };

    engine.onGameOver = (finalStats) => {
      setGameState('GAMEOVER');
      setStats(finalStats);
      setIsNewHighScore(finalStats.score >= finalStats.highScore && finalStats.score > 0);
    };

    engine.onPortalWarp = (realmName, tagline) => {
      setWarpNotification({ realmName, tagline });
      setTimeout(() => {
        setWarpNotification(null);
      }, 3500);
    };

    // Engine to Multiplayer Manager callbacks
    engine.onMultiplayerSync = (syncData) => {
      multiplayerManager.sendPlayerSync(syncData);
    };

    engine.onPlayerStumble = () => {
      multiplayerManager.sendStumble();
    };

    engine.onPlayerFatalCrash = (distance, score) => {
      multiplayerManager.sendFatalCrash(distance, score);
    };

    engine.onPlayerReviveDone = () => {
      multiplayerManager.sendRevive();
    };

    engine.onPlayerFinishedRun = (distance, score, coins) => {
      multiplayerManager.sendFinished(distance, score, coins);
    };

    // Multiplayer Manager to Client callbacks
    multiplayerManager.onRaceCountdown = (count, seed) => {
      setShowMultiplayerModal(false);
      setShowRaceResults(false);
      setMultiplayerCountdown(count);
      setIsMultiplayerRace(true);

      // Configure outfits and 3D rival model
      engine.setOutfit(multiplayerManager.myVariant);
      engine.setupMultiplayerRival(multiplayerManager.rivalName, multiplayerManager.rivalVariant);

      let remaining = count;
      const interval = setInterval(() => {
        remaining--;
        if (remaining > 0) {
          setMultiplayerCountdown(remaining);
          soundManager.playCoin();
        } else if (remaining === 0) {
          setMultiplayerCountdown(0);
          soundManager.playPowerup();
          engine.startRun(selectedEnv, seed);
          setGameState('PLAYING');
        } else {
          clearInterval(interval);
          setMultiplayerCountdown(null);
        }
      }, 1000);
    };

    multiplayerManager.onRivalSync = (state) => {
      setRivalState(state);
      engine.updateRivalState(state);
    };

    multiplayerManager.onRivalStumble = () => {
      setRivalNotification({
        message: `⚡ ${multiplayerManager.rivalName} stumbled! Beast is closing in!`,
        type: 'stumble',
      });
      setTimeout(() => setRivalNotification(null), 3500);
    };

    multiplayerManager.onRivalCrashed = (distance) => {
      setRivalNotification({
        message: `💥 ${multiplayerManager.rivalName} crashed at ${distance}m!`,
        type: 'crash',
      });
      setTimeout(() => setRivalNotification(null), 4000);
    };

    multiplayerManager.onRivalRevived = () => {
      setRivalNotification({
        message: `✨ ${multiplayerManager.rivalName} revived with keys!`,
        type: 'revive',
      });
      setTimeout(() => setRivalNotification(null), 3500);
    };

    multiplayerManager.onRaceCompleted = (players) => {
      setRacePlayers(players);
      setShowRaceResults(true);
    };

    multiplayerManager.onRivalLeft = (msg) => {
      setRivalNotification({ message: msg, type: 'crash' });
      setTimeout(() => setRivalNotification(null), 4500);
    };

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [selectedEnv]);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        engine.moveLeft();
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        engine.moveRight();
      } else if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Space') {
        e.preventDefault();
        engine.jump();
      } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        e.preventDefault();
        engine.slide();
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        if (engine.state === 'PLAYING') {
          engine.pauseGame();
          setGameState('PAUSED');
        } else if (engine.state === 'PAUSED') {
          engine.resumeGame();
          setGameState('PLAYING');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Start Run Handler
  const handleStartGame = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.startRun(selectedEnv);
    setGameState('PLAYING');
    setIsNewHighScore(false);
  }, [selectedEnv]);

  // Pause Handlers
  const handlePause = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.pauseGame();
    setGameState('PAUSED');
  }, []);

  const handleResume = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.resumeGame();
    setGameState('PLAYING');
  }, []);

  const handleRestart = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.startRun(selectedEnv);
    setGameState('PLAYING');
    setIsNewHighScore(false);
  }, [selectedEnv]);

  const handleRevive = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.revivePlayer();
    setGameState('PLAYING');
  }, []);

  const handleGiveUp = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.triggerGameOver();
  }, []);

  const handleQuitToMenu = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.state = 'START';
    engineRef.current.clearMultiplayer();
    setIsMultiplayerRace(false);
    setRivalState(null);
    setRivalNotification(null);
    soundManager.stopMusic();
    setGameState('START');
    setPowerUps([]);
  }, []);

  // Settings Updates
  const handleChangeSettings = (partial: Partial<GameSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      if (partial.playerName !== undefined && engineRef.current) {
        engineRef.current.setPlayerName(partial.playerName);
      }
      if (partial.soundEnabled !== undefined) {
        soundManager.setSoundEnabled(partial.soundEnabled);
      }
      if (partial.musicEnabled !== undefined) {
        soundManager.setMusicEnabled(partial.musicEnabled);
      }
      if (partial.volume !== undefined) {
        soundManager.setVolume(partial.volume);
      }
      if (partial.graphicsQuality !== undefined && engineRef.current) {
        engineRef.current.setQuality(partial.graphicsQuality);
      }
      return next;
    });
  };

  const handleSelectEnv = (envId: EnvironmentId) => {
    setSelectedEnv(envId);
    if (engineRef.current) {
      engineRef.current.applyEnvironment(envId);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#07090e] select-none">
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block z-0"
      />

      {/* In-Game HUD & Mobile Controls */}
      {gameState === 'PLAYING' && (
        <>
          <HUD
            stats={stats}
            powerUps={powerUps}
            monsterProximity={monsterProximity}
            warpNotification={warpNotification}
            onPause={handlePause}
          />
          {isMultiplayerRace && (
            <MultiplayerHUD
              myDistance={stats.distance}
              myName={settings.playerName}
              rivalName={multiplayerManager.rivalName}
              rivalState={rivalState}
              notification={rivalNotification}
            />
          )}
          <MobileControls
            onLeft={() => engineRef.current?.moveLeft()}
            onRight={() => engineRef.current?.moveRight()}
            onJump={() => engineRef.current?.jump()}
            onSlide={() => engineRef.current?.slide()}
            haptics={settings.hapticFeedback}
          />
        </>
      )}

      {/* Start Screen */}
      {gameState === 'START' && (
        <StartScreen
          stats={stats}
          selectedEnv={selectedEnv}
          playerName={settings.playerName}
          onSelectEnv={handleSelectEnv}
          onStartGame={handleStartGame}
          onOpenMultiplayer={() => setShowMultiplayerModal(true)}
          onOpenMissions={() => setShowMissions(true)}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* 3.. 2.. 1.. GO! Countdown Overlay */}
      {multiplayerCountdown !== null && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-none pointer-events-none">
          <div className="text-center animate-bounce">
            <div className="text-xs uppercase font-mono tracking-widest text-cyan-400 mb-2">
              2-PLAYER RACE LAUNCHING
            </div>
            <div className="text-8xl md:text-9xl font-black font-display text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-300 to-amber-500 drop-shadow-[0_0_40px_rgba(245,158,11,0.8)]">
              {multiplayerCountdown === 0 ? 'GO!' : multiplayerCountdown}
            </div>
          </div>
        </div>
      )}

      {/* Multiplayer Lobby / Code Modal */}
      {showMultiplayerModal && (
        <MultiplayerModal
          playerName={settings.playerName}
          onOpenSettings={() => setShowSettings(true)}
          onClose={() => setShowMultiplayerModal(false)}
          onStartMultiplayerRace={() => {
            // Handled via onRaceCountdown
          }}
        />
      )}

      {/* Race Results Modal */}
      {showRaceResults && (
        <RaceResultsModal
          myId={multiplayerManager.playerId || 'host'}
          players={
            racePlayers.length > 0
              ? racePlayers
              : [
                  {
                    id: multiplayerManager.playerId || 'me',
                    name: settings.playerName,
                    isHost: multiplayerManager.isHost,
                    colorVariant: multiplayerManager.myVariant,
                    distance: stats.distance,
                    score: stats.score,
                    coins: stats.coins,
                    isAlive: false,
                    finished: true,
                  },
                  {
                    id: 'rival',
                    name: multiplayerManager.rivalName,
                    isHost: !multiplayerManager.isHost,
                    colorVariant: multiplayerManager.rivalVariant,
                    distance: rivalState?.distance || 0,
                    score: rivalState?.score || 0,
                    coins: 0,
                    isAlive: false,
                    finished: true,
                  },
                ]
          }
          onRematch={() => {
            setShowRaceResults(false);
            multiplayerManager.requestRematch();
          }}
          onExit={() => {
            setShowRaceResults(false);
            setIsMultiplayerRace(false);
            multiplayerManager.leaveRoom();
            handleQuitToMenu();
          }}
        />
      )}

      {/* Pause Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          stats={stats}
          missions={engineRef.current?.missions || []}
          soundEnabled={settings.soundEnabled}
          musicEnabled={settings.musicEnabled}
          onToggleSound={() =>
            handleChangeSettings({ soundEnabled: !settings.soundEnabled })
          }
          onToggleMusic={() =>
            handleChangeSettings({ musicEnabled: !settings.musicEnabled })
          }
          onResume={handleResume}
          onRestart={handleRestart}
          onQuitToMenu={handleQuitToMenu}
        />
      )}

      {/* Revive Prompt Modal */}
      {gameState === 'REVIVE' && (
        <ReviveModal
          requiredKeys={reviveCost}
          availableKeys={stats.totalKeys}
          score={stats.score}
          distance={stats.distance}
          onRevive={handleRevive}
          onGiveUp={handleGiveUp}
        />
      )}

      {/* Game Over Modal (Solo run or fallback) */}
      {gameState === 'GAMEOVER' && !showRaceResults && (
        <GameOverModal
          stats={stats}
          isNewHighScore={isNewHighScore}
          onRestart={handleRestart}
          onMenu={handleQuitToMenu}
        />
      )}

      {/* Missions & Progression Modal */}
      {showMissions && (
        <MissionsModal
          missions={engineRef.current?.missions || []}
          stats={stats}
          onClose={() => setShowMissions(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onChangeSettings={handleChangeSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
