import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  EnvironmentId,
  GameState,
  GameStats,
  GameSettings,
  PowerUpType,
  PowerUpState,
  Mission,
  HeroOutfitVariant,
  RivalState,
} from '../types/game';
import { HeroModel } from './models/HeroModel';
import { MonsterModel } from './models/MonsterModel';
import { TrackManager } from './TrackManager';
import { ENVIRONMENTS } from './environments/EnvironmentThemes';
import { soundManager } from '../audio/SoundManager';

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  private pmremGenerator: THREE.PMREMGenerator;

  // Scene Components
  public hero: HeroModel;
  public monster: MonsterModel;
  public track: TrackManager;
  private keyLight: THREE.DirectionalLight;
  private fillLight: THREE.HemisphereLight;

  // Game Loop & Software GL
  private isSoftwareGl = false;
  private frameId = 0;
  private isRunning = false;
  private lastTime = 0;

  // Game State
  public state: GameState = 'START';
  public currentEnvId: EnvironmentId = 'ruins';
  public stats: GameStats = {
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
  };

  public settings: GameSettings = {
    playerName: 'Saleh',
    soundEnabled: true,
    musicEnabled: true,
    volume: 0.8,
    graphicsQuality: 'high',
    hapticFeedback: true,
  };

  public missions: Mission[] = [];
  public activePowerUps: PowerUpState[] = [];

  // Multiplayer State
  public isMultiplayer = false;
  public myOutfitVariant: HeroOutfitVariant = 'teal_rebel';
  public rivalHero: HeroModel | null = null;
  public rivalData: RivalState | null = null;
  private lastMultiplayerBroadcast = 0;

  // Player Kinematics
  private currentLane = 0; // -1: Left, 0: Mid, 1: Right
  private targetLaneX = 0;
  private playerX = 0;
  private playerY = 0;
  private playerZ = 0;
  private playerVy = 0;
  private isGrounded = true;
  private isSliding = false;
  private slideTimer = 0;
  private readonly SLIDE_DURATION = 0.8;
  private invulnerableTimer = 0;

  // Speed & Monster
  private baseSpeed = 20.0;
  private currentSpeed = 20.0;
  private monsterDistance = 22.0; // Hidden out of view when running clean
  private cameraShake = 0;
  public isMonsterChasing = false;
  private monsterChaseTimer = 0;
  public currentRunRevives = 0;

  // Callbacks to React UI & Multiplayer
  public onStatsUpdate?: (stats: GameStats, powerUps: PowerUpState[], monsterProximity: number) => void;
  public onGameOver?: (stats: GameStats) => void;
  public onMissionComplete?: (mission: Mission) => void;
  public onPortalWarp?: (realmName: string, tagline: string) => void;
  public onPromptRevive?: (cost: number, availableKeys: number) => void;
  public onMultiplayerSync?: (payload: {
    x: number;
    y: number;
    z: number;
    lane: number;
    animState: string;
    speed: number;
    distance: number;
    score: number;
    isAlive: boolean;
  }) => void;
  public onPlayerStumble?: () => void;
  public onPlayerFatalCrash?: (distance: number, score: number) => void;
  public onPlayerReviveDone?: () => void;
  public onPlayerFinishedRun?: (distance: number, score: number, coins: number) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    // 1. Detect Software GL
    this.isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 3. Scene & Camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 350);

    // 4. RoomEnvironment for PBR Reflections
    this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = this.pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

    // 5. Lighting Rig
    this.fillLight = new THREE.HemisphereLight(0xd4a373, 0x3a2c20, 0.8);
    this.scene.add(this.fillLight);

    this.keyLight = new THREE.DirectionalLight(0xffeedd, 1.8);
    this.keyLight.position.set(15, 28, -10);
    this.keyLight.castShadow = !this.isSoftwareGl;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.camera.near = 5;
    this.keyLight.shadow.camera.far = 80;
    const d = 16;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    // 6. Actors & Track
    this.hero = new HeroModel();
    this.scene.add(this.hero.group);

    this.monster = new MonsterModel();
    this.scene.add(this.monster.group);

    this.track = new TrackManager(this.scene, this.currentEnvId);

    // Load persisted records
    this.loadPersistedData();
    this.applyEnvironment(this.currentEnvId);

    // Resize handling
    window.addEventListener('resize', this.onWindowResize);
    this.onWindowResize();

    // Start render loop
    this.lastTime = performance.now();
    this.isRunning = true;
    this.tick();
  }

  private loadPersistedData() {
    try {
      const savedName = localStorage.getItem('runverse_player_name');
      if (savedName) this.settings.playerName = savedName;

      const savedHigh = localStorage.getItem('runverse_highscore');
      if (savedHigh) this.stats.highScore = parseInt(savedHigh, 10) || 0;

      const savedTotalCoins = localStorage.getItem('runverse_total_coins');
      if (savedTotalCoins) this.stats.totalCoins = parseInt(savedTotalCoins, 10) || 0;

      const savedTotalKeys = localStorage.getItem('runverse_total_keys');
      if (savedTotalKeys) this.stats.totalKeys = parseInt(savedTotalKeys, 10) || 0;

      const savedMissions = localStorage.getItem('runverse_missions');
      if (savedMissions) {
        this.missions = JSON.parse(savedMissions);
      } else {
        this.initDefaultMissions();
      }
    } catch {
      this.initDefaultMissions();
    }
  }

  private initDefaultMissions() {
    this.missions = [
      {
        id: 'm1',
        title: 'Rookie Explorer',
        description: 'Sprint 500 meters in a single run',
        target: 500,
        current: 0,
        completed: false,
        rewardCoins: 200,
        rewardKeys: 1,
        type: 'distance',
      },
      {
        id: 'm2',
        title: 'Gold Rush',
        description: 'Collect 100 Runverse coins in one run',
        target: 100,
        current: 0,
        completed: false,
        rewardCoins: 300,
        rewardKeys: 1,
        type: 'coins',
      },
      {
        id: 'm3',
        title: 'Key to the Ruins',
        description: 'Find 3 ancient runic keys across all runs',
        target: 3,
        current: 0,
        completed: false,
        rewardCoins: 500,
        rewardKeys: 2,
        type: 'keys',
      },
      {
        id: 'm4',
        title: 'Acrobat Reflexes',
        description: 'Jump over 10 hurdles or low barriers',
        target: 10,
        current: 0,
        completed: false,
        rewardCoins: 250,
        rewardKeys: 1,
        type: 'jumps',
      },
      {
        id: 'm5',
        title: 'Tunnel Crawler',
        description: 'Slide under 8 high archway barriers',
        target: 8,
        current: 0,
        completed: false,
        rewardCoins: 250,
        rewardKeys: 1,
        type: 'slides',
      },
      {
        id: 'm6',
        title: 'Outrun the Beast',
        description: 'Survive 1200 meters without getting caught',
        target: 1200,
        current: 0,
        completed: false,
        rewardCoins: 750,
        rewardKeys: 3,
        type: 'distance',
      },
    ];
  }

  private savePersistedData() {
    try {
      localStorage.setItem('runverse_highscore', this.stats.highScore.toString());
      localStorage.setItem('runverse_total_coins', this.stats.totalCoins.toString());
      localStorage.setItem('runverse_total_keys', this.stats.totalKeys.toString());
      localStorage.setItem('runverse_missions', JSON.stringify(this.missions));
    } catch {
      // storage unavailable
    }
  }

  public applyEnvironment(envId: EnvironmentId) {
    this.currentEnvId = envId;
    const env = ENVIRONMENTS[envId];

    // Background and Fog
    this.scene.background = new THREE.Color(env.skyColor);
    this.scene.fog = new THREE.FogExp2(env.fogColor, env.fogDensity);

    // Lighting
    this.fillLight.color.setHex(env.skyColor);
    this.fillLight.groundColor.setHex(env.groundColor);
    this.fillLight.intensity = env.ambientIntensity;

    this.keyLight.color.setHex(env.sunColor);
    this.keyLight.intensity = env.sunIntensity;

    // Track
    this.track.setEnvironment(envId);
  }

  public setQuality(quality: 'low' | 'medium' | 'high') {
    this.settings.graphicsQuality = quality;
    if (quality === 'low' || this.isSoftwareGl) {
      this.renderer.shadowMap.enabled = false;
      this.renderer.setPixelRatio(1);
    } else if (quality === 'medium') {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    } else {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }
  }

  public setPlayerName(name: string) {
    this.settings.playerName = name.trim().slice(0, 16) || 'Runner';
    try {
      localStorage.setItem('runverse_player_name', this.settings.playerName);
    } catch {}
  }

  public setOutfit(variant: HeroOutfitVariant) {
    if (this.myOutfitVariant === variant && this.hero) return;
    this.myOutfitVariant = variant;
    const oldPos = this.hero.group.position.clone();
    this.scene.remove(this.hero.group);
    this.hero = new HeroModel(variant);
    this.hero.group.position.copy(oldPos);
    this.scene.add(this.hero.group);
  }

  public setupMultiplayerRival(rivalName: string, rivalVariant: HeroOutfitVariant) {
    this.isMultiplayer = true;
    if (this.rivalHero) {
      this.scene.remove(this.rivalHero.group);
      this.rivalHero = null;
    }
    this.rivalHero = new HeroModel(rivalVariant, rivalName);
    // Position rival on right lane by default
    this.rivalHero.group.position.set(this.track.getLaneX(1), 0, 0);
    this.scene.add(this.rivalHero.group);
    this.rivalData = {
      x: this.track.getLaneX(1),
      y: 0,
      z: 0,
      lane: 1,
      animState: 'RUN',
      speed: this.baseSpeed,
      distance: 0,
      score: 0,
      isAlive: true,
    };
  }

  public updateRivalState(state: Partial<RivalState>) {
    if (!this.rivalData) return;
    Object.assign(this.rivalData, state);
  }

  public clearMultiplayer() {
    this.isMultiplayer = false;
    if (this.rivalHero) {
      this.scene.remove(this.rivalHero.group);
      this.rivalHero = null;
    }
    this.rivalData = null;
    this.setOutfit('teal_rebel');
  }

  public startRun(envId?: EnvironmentId, seed?: number) {
    if (envId) {
      this.applyEnvironment(envId);
    }

    // Reset player position and kinematics
    this.currentLane = 0;
    this.targetLaneX = 0;
    this.playerX = 0;
    this.playerY = 0;
    this.playerZ = 0;
    this.playerVy = 0;
    this.isGrounded = true;
    this.isSliding = false;
    this.slideTimer = 0;
    this.invulnerableTimer = 0;

    // Reset speeds & pursuit
    this.baseSpeed = 20.0;
    this.currentSpeed = 20.0;
    this.monsterDistance = 22.0; // Hidden out of sight when clean
    this.isMonsterChasing = false;
    this.monsterChaseTimer = 0;
    this.currentRunRevives = 0;
    this.activePowerUps = [];

    // Reset run stats
    this.stats.score = 0;
    this.stats.distance = 0;
    this.stats.coins = 0;
    this.stats.keys = 0;
    this.stats.gamesPlayed++;

    // Track reset with optional seed
    this.track.reset(seed);

    // Position Hero & Monster
    this.hero.group.position.set(0, 0, 0);
    this.hero.setShieldVisible(false);
    this.hero.setMagnetVisible(false);
    this.hero.setBoostVisible(false);

    if (this.rivalHero) {
      this.rivalHero.group.position.set(this.track.getLaneX(1), 0, 0);
      this.rivalHero.group.visible = true;
    }

    this.monster.group.position.set(0, 0, -this.monsterDistance);
    this.monster.group.visible = false;

    // Audio
    soundManager.startMusic();

    this.state = 'PLAYING';
  }

  public revivePlayer() {
    const requiredKeys = Math.pow(2, this.currentRunRevives);
    if (this.stats.totalKeys >= requiredKeys) {
      this.stats.totalKeys -= requiredKeys;
      this.currentRunRevives++;
      this.savePersistedData();
    }

    this.state = 'PLAYING';
    this.invulnerableTimer = 2.5;
    this.hero.setShieldVisible(true);
    this.isGrounded = true;
    this.playerY = 0;
    this.playerVy = 0;
    this.isSliding = false;
    this.isMonsterChasing = false;
    this.monsterChaseTimer = 0;
    this.monsterDistance = 22.0;
    this.monster.group.visible = false;
    this.lastTime = performance.now();

    soundManager.startMusic();
    soundManager.playPowerup();

    if (this.onPlayerReviveDone) {
      this.onPlayerReviveDone();
    }
  }

  public pauseGame() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      soundManager.stopMusic();
    }
  }

  public resumeGame() {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastTime = performance.now();
      soundManager.startMusic();
    }
  }

  public triggerGameOver() {
    this.state = 'GAMEOVER';
    soundManager.stopMusic();
    soundManager.playGameOver();

    // Update totals
    this.stats.totalCoins += this.stats.coins;
    this.stats.totalKeys += this.stats.keys;
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
    }

    // Check unlocks
    ENVIRONMENTS.jungle.unlocked = this.stats.totalKeys >= 2 || this.stats.highScore >= 2000;
    ENVIRONMENTS.underground.unlocked = this.stats.totalKeys >= 5 || this.stats.highScore >= 5000;
    ENVIRONMENTS.cybercity.unlocked = this.stats.totalKeys >= 8 || this.stats.highScore >= 10000;

    this.savePersistedData();

    if (this.onPlayerFinishedRun) {
      this.onPlayerFinishedRun(Math.floor(this.stats.distance), Math.floor(this.stats.score), this.stats.coins);
    }

    if (this.onGameOver) {
      this.onGameOver(this.stats);
    }
  }

  // --- Controls Input Handlers ---

  public moveLeft() {
    if (this.state !== 'PLAYING') return;
    if (this.currentLane > -1) {
      this.currentLane--;
      this.targetLaneX = this.track.getLaneX(this.currentLane);
    }
  }

  public moveRight() {
    if (this.state !== 'PLAYING') return;
    if (this.currentLane < 1) {
      this.currentLane++;
      this.targetLaneX = this.track.getLaneX(this.currentLane);
    }
  }

  public jump() {
    if (this.state !== 'PLAYING') return;
    if (this.isGrounded) {
      this.playerVy = 13.5;
      this.isGrounded = false;
      this.isSliding = false;
      this.stats.jumpsCount++;
      soundManager.playJump();
      this.checkMissionProgress('jumps', 1);
    }
  }

  public slide() {
    if (this.state !== 'PLAYING') return;
    // Can initiate slide or fast drop if jumping
    if (!this.isGrounded) {
      this.playerVy = -18.0; // Fast dive
    }
    this.isSliding = true;
    this.slideTimer = this.SLIDE_DURATION;
    this.stats.slidesCount++;
    soundManager.playSlide();
    this.checkMissionProgress('slides', 1);
  }

  // --- Main Tick Loop ---

  private tick = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    let delta = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Clamp delta to prevent huge jumps if tab was backgrounded
    if (delta > 0.1) delta = 0.1;

    if (this.state === 'PLAYING') {
      this.updateGame(delta);
    } else if (this.state === 'START') {
      // Idle intro showcase animation
      this.updateIntro(delta);
    }

    // Render frame
    this.renderer.render(this.scene, this.camera);

    // Schedule next frame with software GL pacing
    if (this.isSoftwareGl) {
      setTimeout(this.tick, 30);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private updateIntro(delta: number) {
    // Gentle camera orbit around the hero at start
    const t = performance.now() * 0.0008;
    this.camera.position.set(Math.sin(t) * 5, 2.5, Math.cos(t) * 5 + 3);
    this.camera.lookAt(0, 1.2, 0);
    this.hero.update(delta, 'RUN', 10, 0);
    this.monster.group.position.set(0, 0, -7.5);
    this.monster.update(delta, 10, 0, 7.5);
  }

  private updateGame(delta: number) {
    // 1. Power-ups update
    let hasBoost = false;
    let hasShield = false;
    let hasMagnet = false;
    let scoreMultiplier = 1;

    for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
      const pu = this.activePowerUps[i];
      pu.duration -= delta;
      if (pu.duration <= 0) {
        this.activePowerUps.splice(i, 1);
      } else {
        if (pu.type === 'boost') hasBoost = true;
        if (pu.type === 'shield') hasShield = true;
        if (pu.type === 'magnet') hasMagnet = true;
        if (pu.type === 'multiplier') scoreMultiplier = 2;
      }
    }

    this.hero.setShieldVisible(hasShield);
    this.hero.setMagnetVisible(hasMagnet);
    this.hero.setBoostVisible(hasBoost);

    // 2. Speed progression
    // Naturally increases speed as distance increases
    const distanceBonus = Math.min(10.0, this.stats.distance * 0.005);
    this.currentSpeed = (this.baseSpeed + distanceBonus) * (hasBoost ? 1.45 : 1.0);

    // 3. Player Forward Movement & Distance
    const moveZ = this.currentSpeed * delta;
    this.playerZ += moveZ;
    this.stats.distance = Math.floor(this.playerZ);
    this.stats.score += Math.floor(moveZ * 2 * scoreMultiplier);

    this.checkMissionProgress('distance', this.stats.distance);

    // 4. Player Lane Smoothing
    this.playerX = THREE.MathUtils.damp(this.playerX, this.targetLaneX, 16, delta);

    // 5. Jump & Gravity
    if (!this.isGrounded) {
      this.playerY += this.playerVy * delta;
      this.playerVy -= 36.0 * delta; // Gravity
      if (this.playerY <= 0) {
        this.playerY = 0;
        this.playerVy = 0;
        this.isGrounded = true;
      }
    }

    // 6. Slide Timer
    if (this.isSliding) {
      this.slideTimer -= delta;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // Determine hero state
    let heroAnimState: 'RUN' | 'JUMP' | 'SLIDE' | 'STUMBLE' = 'RUN';
    if (!this.isGrounded) heroAnimState = 'JUMP';
    else if (this.isSliding) heroAnimState = 'SLIDE';

    this.hero.group.position.set(this.playerX, this.playerY, this.playerZ);
    this.hero.update(delta, heroAnimState, this.currentSpeed, this.targetLaneX);

    // 6.5. Multiplayer Sync & Rival Interpolation
    if (this.isMultiplayer) {
      if (performance.now() - this.lastMultiplayerBroadcast > 45) {
        this.lastMultiplayerBroadcast = performance.now();
        if (this.onMultiplayerSync) {
          this.onMultiplayerSync({
            x: this.playerX,
            y: this.playerY,
            z: this.playerZ,
            lane: this.currentLane,
            animState: heroAnimState,
            speed: this.currentSpeed,
            distance: this.stats.distance,
            score: this.stats.score,
            isAlive: true,
          });
        }
      }

      if (this.rivalHero && this.rivalData) {
        this.rivalHero.group.position.x = THREE.MathUtils.damp(this.rivalHero.group.position.x, this.rivalData.x, 14, delta);
        this.rivalHero.group.position.y = THREE.MathUtils.damp(this.rivalHero.group.position.y, this.rivalData.y, 14, delta);
        this.rivalHero.group.position.z = THREE.MathUtils.damp(this.rivalHero.group.position.z, this.rivalData.z, 14, delta);

        this.rivalHero.update(delta, this.rivalData.animState, this.rivalData.speed || 20, this.rivalData.x);
        this.rivalHero.group.visible = true;
      }
    }

    // 7. Monster Pursuit Kinematics (Subway Surfers Inspector style)
    if (this.isMonsterChasing) {
      this.monsterChaseTimer -= delta;
      this.monsterDistance = THREE.MathUtils.damp(this.monsterDistance, 4.8, 4, delta);
      this.monster.group.visible = true;

      if (this.monsterChaseTimer <= 0) {
        // Player ran clean for 6 seconds and escaped!
        this.isMonsterChasing = false;
      }
    } else {
      // Monster falls back far behind and disappears from view
      this.monsterDistance = THREE.MathUtils.damp(this.monsterDistance, 22.0, 1.8, delta);
      this.monster.group.visible = this.monsterDistance < 15.0;
    }

    const monsterTargetZ = this.playerZ - this.monsterDistance;
    this.monster.group.position.z = monsterTargetZ;
    this.monster.update(delta, this.currentSpeed, this.playerX, this.monsterDistance);

    // Threat meter & audio tension
    const proximity = this.isMonsterChasing
      ? Math.max(0.65, Math.min(1.0, (10.0 - this.monsterDistance) / 5.2))
      : 0;
    soundManager.setMonsterProximity(proximity);

    // 8. Track update & recycling
    this.track.update(this.playerZ, delta);

    // 9. Invulnerability decay and blink visual
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= delta;
      this.hero.group.visible = Math.floor(performance.now() / 80) % 2 === 0;
    } else {
      this.hero.group.visible = true;
    }

    // 10. Collision Detection with Obstacles
    this.checkObstacleCollisions(hasShield, hasBoost);

    // 11. Magnet & Collectibles
    this.checkCollectibleCollisions(hasMagnet, scoreMultiplier, delta);

    // 12. Dimensional Warp Portal Collision (Only triggers if in the portal lane!)
    for (const chunk of this.track.chunks) {
      if (chunk.portal && !chunk.portal.entered) {
        const portalWorldZ = chunk.portal.mesh.position.z + chunk.group.position.z;
        if (
          Math.abs(this.playerZ - portalWorldZ) < 2.4 &&
          this.currentLane === chunk.portal.lane
        ) {
          chunk.portal.entered = true;
          this.triggerPortalWarp();
          break;
        }
      }
    }

    // 13. Dynamic Third-Person Camera Follow
    const proximityLift = this.isMonsterChasing ? 1.0 : 0.0;
    const camTargetX = this.playerX * 0.35;
    const camTargetY = this.playerY * 0.5 + 3.3 + proximityLift * 1.1;
    const camTargetZ = this.playerZ - 6.5 - proximityLift * 0.6;

    this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, camTargetX, 12, delta);
    this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, camTargetY, 12, delta);
    this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, camTargetZ, 18, delta);

    // Camera shake decay
    if (this.cameraShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.cameraShake;
      this.camera.position.y += (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake = Math.max(0, this.cameraShake - delta * 2.5);
    }

    // Look at player lead point
    const lookTarget = new THREE.Vector3(
      this.playerX * 0.7,
      this.playerY * 0.5 + 1.2,
      this.playerZ + 12.0
    );
    this.camera.lookAt(lookTarget);

    // Dynamic FOV for high speed / boost
    const targetFov = hasBoost ? 72 : 62;
    this.camera.fov = THREE.MathUtils.damp(this.camera.fov, targetFov, 8, delta);
    this.camera.updateProjectionMatrix();

    // Move directional light with player for crisp local shadows
    this.keyLight.position.set(this.playerX + 15, 28, this.playerZ - 10);
    this.keyLight.target.position.set(this.playerX, 0, this.playerZ + 10);
    this.keyLight.target.updateMatrixWorld();

    // Notify React UI
    if (this.onStatsUpdate) {
      this.onStatsUpdate({ ...this.stats }, [...this.activePowerUps], proximity);
    }
  }

  private triggerPortalWarp() {
    soundManager.playWarp();
    this.cameraShake = 0.9;
    this.stats.score += 1500;
    this.stats.coins += 20;

    // Cycle to next realm in sequence: Ruins -> Jungle -> Underground -> Cybercity -> Ruins
    const realmSequence: EnvironmentId[] = ['ruins', 'jungle', 'underground', 'cybercity'];
    const currentIndex = realmSequence.indexOf(this.currentEnvId);
    const nextEnvId = realmSequence[(currentIndex + 1) % realmSequence.length];

    this.currentEnvId = nextEnvId;
    const env = ENVIRONMENTS[nextEnvId];

    // Smoothly apply new atmospheric lighting and fog
    this.scene.background = new THREE.Color(env.skyColor);
    this.scene.fog = new THREE.FogExp2(env.fogColor, env.fogDensity);
    this.fillLight.color.setHex(env.skyColor);
    this.fillLight.groundColor.setHex(env.groundColor);
    this.fillLight.intensity = env.ambientIntensity;
    this.keyLight.color.setHex(env.sunColor);
    this.keyLight.intensity = env.sunIntensity;

    // Switch track generator theme for upcoming chunks
    this.track.currentEnvId = nextEnvId;

    // Increase speed for progressive difficulty
    this.baseSpeed = Math.min(30.0, this.baseSpeed + 1.8);

    if (this.onPortalWarp) {
      this.onPortalWarp(env.name, env.tagline);
    }
  }

  private checkObstacleCollisions(hasShield: boolean, hasBoost: boolean) {
    if (this.invulnerableTimer > 0) return;

    // Player collision AABB
    const playerH = this.isSliding ? 0.65 : 1.7;
    const playerBox = new THREE.Box3(
      new THREE.Vector3(this.playerX - 0.45, this.playerY, this.playerZ - 0.35),
      new THREE.Vector3(this.playerX + 0.45, this.playerY + playerH, this.playerZ + 0.35)
    );

    for (const chunk of this.track.chunks) {
      for (const obs of chunk.obstacles) {
        if (obs.passed) continue;

        if (this.playerZ > obs.mesh.position.z + chunk.group.position.z + 2.5) {
          obs.passed = true;
          continue;
        }

        if (playerBox.intersectsBox(obs.box)) {
          obs.passed = true;

          if (hasBoost) {
            soundManager.playHit();
            this.cameraShake = 0.4;
            continue;
          }

          if (hasShield) {
            soundManager.playShieldBreak();
            this.activePowerUps = this.activePowerUps.filter((p) => p.type !== 'shield');
            this.hero.setShieldVisible(false);
            this.invulnerableTimer = 1.2;
            this.cameraShake = 0.35;
            continue;
          }

          // Stumble or Fatal Knockdown
          soundManager.playHit();
          this.cameraShake = 0.65;

          // If already being chased by the monster OR direct solid pillar crash: Fatal crash!
          if (this.isMonsterChasing || obs.type === 'dodge_lane') {
            soundManager.playMonsterRoar();
            this.state = 'REVIVE';
            this.hero.update(0.016, 'DEAD', 0, 0);
            soundManager.stopMusic();

            if (this.onPlayerFatalCrash) {
              this.onPlayerFatalCrash(Math.floor(this.stats.distance), Math.floor(this.stats.score));
            }

            const cost = Math.pow(2, this.currentRunRevives);
            if (this.onPromptRevive) {
              this.onPromptRevive(cost, this.stats.totalKeys);
            } else {
              this.triggerGameOver();
            }
            return;
          } else {
            // First stumble! Monster surges in behind player
            this.isMonsterChasing = true;
            this.monsterChaseTimer = 6.0; // Run clean for 6s to escape
            this.monsterDistance = 5.0;
            this.monster.group.visible = true;
            soundManager.playMonsterRoar();
            this.invulnerableTimer = 1.4;

            if (this.onPlayerStumble) {
              this.onPlayerStumble();
            }
          }
        }
      }
    }
  }

  private checkCollectibleCollisions(hasMagnet: boolean, scoreMultiplier: number, delta: number) {
    const playerPos = new THREE.Vector3(this.playerX, this.playerY + 1.0, this.playerZ);

    for (const chunk of this.track.chunks) {
      for (const col of chunk.collectibles) {
        if (col.collected) continue;

        // World position of collectible
        const colWorldPos = new THREE.Vector3();
        col.mesh.getWorldPosition(colWorldPos);

        const dist = playerPos.distanceTo(colWorldPos);

        // Magnet attraction
        if (hasMagnet && col.type === 'coin' && dist < 14.0) {
          col.mesh.position.lerp(
            new THREE.Vector3(
              this.playerX - chunk.group.position.x,
              this.playerY + 1.0,
              this.playerZ - chunk.group.position.z
            ),
            delta * 8.0
          );
        }

        // Collection radius
        if (dist < 1.35) {
          col.collected = true;
          chunk.group.remove(col.mesh);

          if (col.type === 'coin') {
            const coinGain = 1;
            this.stats.coins += coinGain;
            this.stats.score += 50 * scoreMultiplier;
            soundManager.playCoin();
            this.checkMissionProgress('coins', this.stats.coins);
          } else if (col.type === 'key') {
            this.stats.keys += 1;
            this.stats.score += 500;
            soundManager.playKey();
            this.checkMissionProgress('keys', 1);
          } else if (col.type === 'powerup' && col.powerUpType) {
            this.activatePowerUp(col.powerUpType);
            soundManager.playPowerup();
          }
        }
      }
    }
  }

  private activatePowerUp(type: PowerUpType) {
    const duration = type === 'boost' ? 5.0 : 10.0;
    const existing = this.activePowerUps.find((p) => p.type === type);
    if (existing) {
      existing.duration = duration;
    } else {
      this.activePowerUps.push({
        type,
        duration,
        totalDuration: duration,
      });
    }
  }

  private checkMissionProgress(type: Mission['type'], amount: number) {
    let changed = false;
    for (const mission of this.missions) {
      if (mission.completed || mission.type !== type) continue;

      if (type === 'distance') {
        mission.current = Math.max(mission.current, amount);
      } else {
        mission.current += amount;
      }

      if (mission.current >= mission.target) {
        mission.completed = true;
        this.stats.totalCoins += mission.rewardCoins;
        this.stats.totalKeys += mission.rewardKeys;
        changed = true;
        if (this.onMissionComplete) {
          this.onMissionComplete(mission);
        }
      }
    }

    if (changed) {
      this.savePersistedData();
    }
  }

  public onWindowResize = () => {
    if (!this.canvas || !this.renderer || !this.camera) return;
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  public destroy() {
    this.isRunning = false;
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.onWindowResize);
    this.pmremGenerator.dispose();
    this.renderer.dispose();
  }
}
