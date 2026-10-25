import * as THREE from 'three';
import { EnvironmentId, PowerUpType } from '../types/game';
import { EnvironmentThemeFactory } from './environments/EnvironmentThemes';
import { createCoinRuneTexture } from './proceduralTextures';

export interface ObstacleItem {
  mesh: THREE.Group;
  lane: number; // -1: left, 0: center, 1: right, 99: multi-lane
  type: 'jump_over' | 'slide_under' | 'dodge_lane';
  box: THREE.Box3;
  passed: boolean;
  isRollingBoulder?: boolean;
  isLavaGeyser?: boolean;
}

export interface CollectibleItem {
  mesh: THREE.Group;
  type: 'coin' | 'key' | 'powerup';
  powerUpType?: PowerUpType;
  lane: number;
  position: THREE.Vector3;
  collected: boolean;
  box: THREE.Box3;
}

export interface PortalItem {
  mesh: THREE.Group;
  worldZ: number;
  lane: number;
  box: THREE.Box3;
  entered: boolean;
}

export interface TrackChunk {
  group: THREE.Group;
  startZ: number;
  length: number;
  obstacles: ObstacleItem[];
  collectibles: CollectibleItem[];
  portal?: PortalItem;
}

export class TrackManager {
  public scene: THREE.Scene;
  public chunks: TrackChunk[] = [];
  public currentEnvId: EnvironmentId = 'ruins';

  public readonly LANE_WIDTH = 2.8;
  public readonly CHUNK_LENGTH = 40;
  public readonly NUM_CHUNKS = 7;
  public nextChunkZ = 0;

  // Track distance until next Dimensional Portal spawns (every ~480m)
  private distanceSinceLastPortal = 0;
  private readonly PORTAL_INTERVAL = 480;

  // Shared geometries and materials for performance
  private trackGeo: THREE.PlaneGeometry;
  private curbGeo: THREE.BoxGeometry;
  private coinGeo: THREE.CylinderGeometry;
  private coinMat: THREE.MeshStandardMaterial;
  private keyMat: THREE.MeshStandardMaterial;

  constructor(scene: THREE.Scene, envId: EnvironmentId = 'ruins') {
    this.scene = scene;
    this.currentEnvId = envId;

    this.trackGeo = new THREE.PlaneGeometry(9.6, this.CHUNK_LENGTH);
    this.curbGeo = new THREE.BoxGeometry(0.6, 0.4, this.CHUNK_LENGTH);

    const coinTex = createCoinRuneTexture();
    this.coinMat = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      map: coinTex,
      metalness: 0.85,
      roughness: 0.2,
      emissive: 0x8a6d00,
      emissiveIntensity: 0.25,
    });

    this.coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.08, 16);

    this.keyMat = new THREE.MeshStandardMaterial({
      color: 0x44eeff,
      emissive: 0x00bfff,
      emissiveIntensity: 0.8,
      metalness: 0.9,
      roughness: 0.15,
    });

    this.initChunks();
  }

  /**
   * Looking along +Z:
   * Screen Left is +X, Screen Right is -X.
   * lane = -1 is LEFT  -> +2.8m (Screen Left)
   * lane = 0  is MID   -> 0m
   * lane = +1 is RIGHT -> -2.8m (Screen Right)
   */
  public getLaneX(lane: number): number {
    return -lane * this.LANE_WIDTH;
  }

  private rngState = 123456789;
  public useSeededRandom = false;

  public setSeed(seed?: number) {
    if (seed !== undefined) {
      this.rngState = seed > 0 ? seed : 123456789;
      this.useSeededRandom = true;
    } else {
      this.useSeededRandom = false;
    }
  }

  public random(): number {
    if (this.useSeededRandom) {
      this.rngState = (this.rngState * 9301 + 49297) % 233280;
      return this.rngState / 233280;
    }
    return Math.random();
  }

  public setEnvironment(envId: EnvironmentId) {
    this.currentEnvId = envId;
    this.reset();
  }

  public reset(seed?: number) {
    if (seed !== undefined) {
      this.setSeed(seed);
    }
    for (const chunk of this.chunks) {
      this.scene.remove(chunk.group);
    }
    this.chunks = [];
    this.nextChunkZ = -20;
    this.distanceSinceLastPortal = 0;
    this.initChunks();
  }

  private initChunks() {
    for (let i = 0; i < this.NUM_CHUNKS; i++) {
      const isStartSafe = i < 2;
      this.spawnChunk(this.nextChunkZ, isStartSafe);
      this.nextChunkZ += this.CHUNK_LENGTH;
    }
  }

  public spawnChunk(startZ: number, safe: boolean) {
    const chunkGroup = new THREE.Group();
    chunkGroup.position.z = startZ + this.CHUNK_LENGTH / 2;

    const obstacles: ObstacleItem[] = [];
    const collectibles: CollectibleItem[] = [];
    let portal: PortalItem | undefined = undefined;

    // 1. Road Surface Plane
    const trackTex = EnvironmentThemeFactory.getTrackTexture(this.currentEnvId);
    trackTex.repeat.set(2, 8);

    const roadMat = new THREE.MeshStandardMaterial({
      map: trackTex,
      roughness: 0.8,
      metalness: 0.1,
    });

    const road = new THREE.Mesh(this.trackGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.receiveShadow = true;
    chunkGroup.add(road);

    // Left and Right Curbs
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x2a2826, roughness: 0.9 });
    const leftCurb = new THREE.Mesh(this.curbGeo, curbMat);
    leftCurb.position.set(4.8, 0.2, 0); // Screen Left
    leftCurb.receiveShadow = true;
    chunkGroup.add(leftCurb);

    const rightCurb = new THREE.Mesh(this.curbGeo, curbMat);
    rightCurb.position.set(-4.8, 0.2, 0); // Screen Right
    rightCurb.receiveShadow = true;
    chunkGroup.add(rightCurb);

    // 2. Scenery Pillars along outer borders
    for (let pz = -this.CHUNK_LENGTH / 2 + 10; pz < this.CHUNK_LENGTH / 2; pz += 20) {
      const leftPillar = EnvironmentThemeFactory.createSidePillar(this.currentEnvId);
      leftPillar.position.set(6.8, 0, pz); // Screen Left
      chunkGroup.add(leftPillar);

      const rightPillar = EnvironmentThemeFactory.createSidePillar(this.currentEnvId);
      rightPillar.position.set(-6.8, 0, pz); // Screen Right
      chunkGroup.add(rightPillar);
    }

    // 3. Check if it's time to spawn a Dimensional Warp Portal!
    this.distanceSinceLastPortal += this.CHUNK_LENGTH;
    if (!safe && this.distanceSinceLastPortal >= this.PORTAL_INTERVAL) {
      this.distanceSinceLastPortal = 0;
      const portalLanes = [-1, 0, 1];
      const pLane = portalLanes[Math.floor(Math.random() * portalLanes.length)];
      portal = this.createDimensionalPortal(chunkGroup, 0, pLane);
    } else if (!safe) {
      // Regular Realm-Specific Content
      this.populateChunkContent(chunkGroup, obstacles, collectibles);
    }

    this.scene.add(chunkGroup);
    this.chunks.push({
      group: chunkGroup,
      startZ,
      length: this.CHUNK_LENGTH,
      obstacles,
      collectibles,
      portal,
    });
  }

  // --- Dimensional Warp Portal Ring (Compact, placed in 1 lane) ---
  private createDimensionalPortal(chunkGroup: THREE.Group, zOff: number, lane: number): PortalItem {
    const portalGroup = new THREE.Group();
    const portalX = this.getLaneX(lane);
    portalGroup.position.set(portalX, 0, zOff);

    // Compact Stargate Ring sized for 1 lane
    const ringGeo = new THREE.TorusGeometry(1.35, 0.12, 12, 28);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x0088ff,
      emissiveIntensity: 0.9,
      metalness: 0.9,
      roughness: 0.15,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 1.45;
    portalGroup.add(ringMesh);

    // Rotating Runic Teeth on Ring
    const teethGroup = new THREE.Group();
    teethGroup.name = 'PortalTeeth';
    teethGroup.position.y = 1.45;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const tooth = new THREE.Mesh(
        new THREE.BoxGeometry(0.14, 0.35, 0.16),
        new THREE.MeshStandardMaterial({
          color: 0xffaa00,
          emissive: 0xff6600,
          emissiveIntensity: 0.8,
        })
      );
      tooth.position.set(Math.cos(angle) * 1.35, Math.sin(angle) * 1.35, 0);
      tooth.rotation.z = angle;
      teethGroup.add(tooth);
    }
    portalGroup.add(teethGroup);

    // Swirling Translucent Vortex Disk
    const vortexGeo = new THREE.CircleGeometry(1.22, 24);
    const vortexMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });
    const vortex = new THREE.Mesh(vortexGeo, vortexMat);
    vortex.position.y = 1.45;
    vortex.name = 'PortalVortex';
    portalGroup.add(vortex);

    // Celestial Vertical Beacon Light Beam (visible from afar)
    const beamGeo = new THREE.CylinderGeometry(0.18, 0.18, 24, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.25,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 12.0;
    portalGroup.add(beam);

    chunkGroup.add(portalGroup);

    return {
      mesh: portalGroup,
      worldZ: chunkGroup.position.z + zOff,
      lane,
      box: new THREE.Box3(),
      entered: false,
    };
  }

  private populateChunkContent(
    chunkGroup: THREE.Group,
    obstacles: ObstacleItem[],
    collectibles: CollectibleItem[]
  ) {
    const lanes = [-1, 0, 1]; // -1: Left, 0: Mid, 1: Right
    const zOffsets = [-12, 8];

    for (const zOff of zOffsets) {
      const roll = this.random();

      // Realm-Specific Unique Hazards!
      if (this.currentEnvId === 'jungle' && roll < 0.38) {
        // Jungle Special: Giant Rolling Mossy Boulder rolling down a lane!
        const targetLane = lanes[Math.floor(this.random() * lanes.length)];
        const obs = this.createRollingBoulder(targetLane);
        obs.mesh.position.set(this.getLaneX(targetLane), 0, zOff);
        chunkGroup.add(obs.mesh);
        obstacles.push(obs);

        // Put coins in the other lanes
        const openLanes = lanes.filter((l) => l !== targetLane);
        this.addStraightCoins(chunkGroup, collectibles, openLanes[0], zOff);
        continue;
      }

      if (this.currentEnvId === 'underground' && roll < 0.38) {
        // Underground Special: Vertical Molten Lava Geyser eruption!
        const targetLane = lanes[Math.floor(this.random() * lanes.length)];
        const obs = this.createLavaGeyser(targetLane);
        obs.mesh.position.set(this.getLaneX(targetLane), 0, zOff);
        chunkGroup.add(obs.mesh);
        obstacles.push(obs);

        this.addCoinArc(chunkGroup, collectibles, targetLane, zOff);
        continue;
      }

      if (this.currentEnvId === 'cybercity' && roll < 0.38) {
        // Cybercity Special: Cyan Laser Tripwire Grid!
        const targetLane = lanes[Math.floor(this.random() * lanes.length)];
        const obs = this.createLaserGrid(targetLane);
        obs.mesh.position.set(this.getLaneX(targetLane), 0, zOff);
        chunkGroup.add(obs.mesh);
        obstacles.push(obs);

        this.addCoinArc(chunkGroup, collectibles, targetLane, zOff);
        continue;
      }

      // Standard Theme-Adapted Obstacles
      if (roll < 0.4) {
        // Low Jump Barrier
        const targetLane = lanes[Math.floor(this.random() * lanes.length)];
        const obs = this.createLowBarrier(targetLane);
        obs.mesh.position.set(this.getLaneX(targetLane), 0, zOff);
        chunkGroup.add(obs.mesh);
        obstacles.push(obs);

        this.addCoinArc(chunkGroup, collectibles, targetLane, zOff);
      } else if (roll < 0.72) {
        // High Slide Archway
        const targetLane = lanes[Math.floor(this.random() * lanes.length)];
        const obs = this.createHighBarrier(targetLane);
        obs.mesh.position.set(this.getLaneX(targetLane), 0, zOff);
        chunkGroup.add(obs.mesh);
        obstacles.push(obs);

        this.addSlideCoins(chunkGroup, collectibles, targetLane, zOff);
      } else {
        // Tall Monolith Column (Lane Switch)
        const blockedLane = lanes[Math.floor(this.random() * lanes.length)];
        const obs = this.createTallColumn(blockedLane);
        obs.mesh.position.set(this.getLaneX(blockedLane), 0, zOff);
        chunkGroup.add(obs.mesh);
        obstacles.push(obs);

        const openLanes = lanes.filter((l) => l !== blockedLane);
        const coinLane = openLanes[Math.floor(this.random() * openLanes.length)];
        this.addStraightCoins(chunkGroup, collectibles, coinLane, zOff);
      }

      // Collectibles: Key or Power-up
      const specialRoll = this.random();
      if (specialRoll < 0.14) {
        const openLane = lanes[Math.floor(this.random() * lanes.length)];
        const keyItem = this.createKeyItem(openLane, zOff + 11);
        chunkGroup.add(keyItem.mesh);
        collectibles.push(keyItem);
      } else if (specialRoll < 0.25) {
        const openLane = lanes[Math.floor(this.random() * lanes.length)];
        const puTypes: PowerUpType[] = ['magnet', 'shield', 'boost', 'multiplier'];
        const puType = puTypes[Math.floor(this.random() * puTypes.length)];
        const puItem = this.createPowerUpItem(openLane, zOff + 10, puType);
        chunkGroup.add(puItem.mesh);
        collectibles.push(puItem);
      }
    }
  }

  // --- Unique Realm Hazards ---

  private createRollingBoulder(lane: number): ObstacleItem {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: 0x4a5538,
      roughness: 0.9,
      metalness: 0.1,
    });

    const sphere = new THREE.Mesh(new THREE.DodecahedronGeometry(1.0, 2), mat);
    sphere.position.y = 1.0;
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    group.add(sphere);

    return {
      mesh: group,
      lane,
      type: 'dodge_lane',
      box: new THREE.Box3(),
      passed: false,
      isRollingBoulder: true,
    };
  }

  private createLavaGeyser(lane: number): ObstacleItem {
    const group = new THREE.Group();

    // Volcanic base crater
    const crater = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 1.2, 0.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x1f1717, roughness: 0.8 })
    );
    crater.position.y = 0.2;
    group.add(crater);

    // Vertical Fire/Lava Jet (Jump over or lane dodge)
    const jet = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.6, 1.4, 8),
      new THREE.MeshBasicMaterial({ color: 0xff4500, transparent: true, opacity: 0.85 })
    );
    jet.position.y = 0.9;
    group.add(jet);

    return {
      mesh: group,
      lane,
      type: 'jump_over',
      box: new THREE.Box3(),
      passed: false,
      isLavaGeyser: true,
    };
  }

  private createLaserGrid(lane: number): ObstacleItem {
    const group = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 });

    const pL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 0.2), frameMat);
    pL.position.set(-1.1, 0.6, 0);
    group.add(pL);

    const pR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 0.2), frameMat);
    pR.position.set(1.1, 0.6, 0);
    group.add(pR);

    // Glowing cyan laser beam (low hurdle, jump over)
    const laser = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    laser.rotation.z = Math.PI / 2;
    laser.position.y = 0.5;
    group.add(laser);

    return {
      mesh: group,
      lane,
      type: 'jump_over',
      box: new THREE.Box3(),
      passed: false,
    };
  }

  // --- Standard Obstacles ---

  private createLowBarrier(lane: number): ObstacleItem {
    const group = new THREE.Group();
    let colColor = 0x993d24;
    if (this.currentEnvId === 'jungle') colColor = 0x3d2817;
    if (this.currentEnvId === 'underground') colColor = 0x2e1215;
    if (this.currentEnvId === 'cybercity') colColor = 0x1e293b;

    const mat = new THREE.MeshStandardMaterial({
      color: colColor,
      roughness: 0.7,
      metalness: 0.3,
    });

    const barrier = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.75, 0.45), mat);
    barrier.position.y = 0.38;
    barrier.castShadow = true;
    barrier.receiveShadow = true;
    group.add(barrier);

    const stripeMat = new THREE.MeshBasicMaterial({
      color: this.currentEnvId === 'cybercity' ? 0x00f0ff : 0xffcc00,
    });
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.44, 0.12, 0.47), stripeMat);
    stripe.position.y = 0.55;
    group.add(stripe);

    return {
      mesh: group,
      lane,
      type: 'jump_over',
      box: new THREE.Box3(),
      passed: false,
    };
  }

  private createHighBarrier(lane: number): ObstacleItem {
    const group = new THREE.Group();
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x2d3748,
      roughness: 0.5,
      metalness: 0.6,
    });

    const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 8), frameMat);
    postL.position.set(-1.15, 1.6, 0);
    postL.castShadow = true;
    group.add(postL);

    const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.2, 8), frameMat);
    postR.position.set(1.15, 1.6, 0);
    postR.castShadow = true;
    group.add(postR);

    // Overhead crossbar (player must slide under)
    let barColor = 0xb91c1c;
    if (this.currentEnvId === 'jungle') barColor = 0x2e421c;
    if (this.currentEnvId === 'underground') barColor = 0x7c1d1d;
    if (this.currentEnvId === 'cybercity') barColor = 0x0284c7;

    const overheadBar = new THREE.Mesh(
      new THREE.BoxGeometry(2.5, 1.2, 0.5),
      new THREE.MeshStandardMaterial({ color: barColor, roughness: 0.4, metalness: 0.5 })
    );
    overheadBar.position.set(0, 2.05, 0);
    overheadBar.castShadow = true;
    group.add(overheadBar);

    return {
      mesh: group,
      lane,
      type: 'slide_under',
      box: new THREE.Box3(),
      passed: false,
    };
  }

  private createTallColumn(lane: number): ObstacleItem {
    const group = new THREE.Group();
    let colColor = 0x475569;
    if (this.currentEnvId === 'ruins') colColor = 0x857053;
    if (this.currentEnvId === 'jungle') colColor = 0x2b3820;
    if (this.currentEnvId === 'underground') colColor = 0x1f1418;
    if (this.currentEnvId === 'cybercity') colColor = 0x0f172a;

    const colMat = new THREE.MeshStandardMaterial({
      color: colColor,
      roughness: 0.8,
      metalness: 0.2,
    });

    const col = new THREE.Mesh(new THREE.BoxGeometry(2.2, 5.0, 1.2), colMat);
    col.position.y = 2.5;
    col.castShadow = true;
    col.receiveShadow = true;
    group.add(col);

    const rune = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 1.5, 0.1),
      new THREE.MeshStandardMaterial({
        color: this.currentEnvId === 'cybercity' ? 0x00f0ff : 0xff8800,
        emissive: this.currentEnvId === 'cybercity' ? 0x0088ff : 0xee5500,
        emissiveIntensity: 0.7,
      })
    );
    rune.position.set(0, 2.2, 0.62);
    group.add(rune);

    return {
      mesh: group,
      lane,
      type: 'dodge_lane',
      box: new THREE.Box3(),
      passed: false,
    };
  }

  // --- Collectibles ---

  private addStraightCoins(
    chunkGroup: THREE.Group,
    collectibles: CollectibleItem[],
    lane: number,
    centerZ: number
  ) {
    for (let i = -2; i <= 2; i++) {
      const coinMesh = new THREE.Group();
      const disc = new THREE.Mesh(this.coinGeo, this.coinMat);
      disc.rotation.x = Math.PI / 2;
      coinMesh.add(disc);

      const z = centerZ + i * 2.2;
      const x = this.getLaneX(lane);
      coinMesh.position.set(x, 1.0, z);
      chunkGroup.add(coinMesh);

      collectibles.push({
        mesh: coinMesh,
        type: 'coin',
        lane,
        position: new THREE.Vector3(x, 1.0, z),
        collected: false,
        box: new THREE.Box3(),
      });
    }
  }

  private addCoinArc(
    chunkGroup: THREE.Group,
    collectibles: CollectibleItem[],
    lane: number,
    centerZ: number
  ) {
    const count = 5;
    for (let i = 0; i < count; i++) {
      const frac = i / (count - 1);
      const z = centerZ - 4 + frac * 8;
      const arcH = 1.0 + Math.sin(frac * Math.PI) * 1.8;

      const coinMesh = new THREE.Group();
      const disc = new THREE.Mesh(this.coinGeo, this.coinMat);
      disc.rotation.x = Math.PI / 2;
      coinMesh.add(disc);

      const x = this.getLaneX(lane);
      coinMesh.position.set(x, arcH, z);
      chunkGroup.add(coinMesh);

      collectibles.push({
        mesh: coinMesh,
        type: 'coin',
        lane,
        position: new THREE.Vector3(x, arcH, z),
        collected: false,
        box: new THREE.Box3(),
      });
    }
  }

  private addSlideCoins(
    chunkGroup: THREE.Group,
    collectibles: CollectibleItem[],
    lane: number,
    centerZ: number
  ) {
    for (let i = -2; i <= 2; i++) {
      const coinMesh = new THREE.Group();
      const disc = new THREE.Mesh(this.coinGeo, this.coinMat);
      disc.rotation.x = Math.PI / 2;
      coinMesh.add(disc);

      const z = centerZ + i * 2.2;
      const x = this.getLaneX(lane);
      coinMesh.position.set(x, 0.45, z);
      chunkGroup.add(coinMesh);

      collectibles.push({
        mesh: coinMesh,
        type: 'coin',
        lane,
        position: new THREE.Vector3(x, 0.45, z),
        collected: false,
        box: new THREE.Box3(),
      });
    }
  }

  private createKeyItem(lane: number, z: number): CollectibleItem {
    const keyGroup = new THREE.Group();

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.08, 8, 16), this.keyMat);
    ring.rotation.x = Math.PI / 2;
    keyGroup.add(ring);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8), this.keyMat);
    shaft.position.y = -0.55;
    keyGroup.add(shaft);

    const tooth1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.08), this.keyMat);
    tooth1.position.set(0.12, -0.75, 0);
    keyGroup.add(tooth1);

    const tooth2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.08), this.keyMat);
    tooth2.position.set(0.15, -0.9, 0);
    keyGroup.add(tooth2);

    const x = this.getLaneX(lane);
    keyGroup.position.set(x, 1.4, z);

    return {
      mesh: keyGroup,
      type: 'key',
      lane,
      position: new THREE.Vector3(x, 1.4, z),
      collected: false,
      box: new THREE.Box3(),
    };
  }

  private createPowerUpItem(lane: number, z: number, pType: PowerUpType): CollectibleItem {
    const puGroup = new THREE.Group();

    let orbColor = 0xff3b30;
    if (pType === 'shield') orbColor = 0x00d4ff;
    if (pType === 'boost') orbColor = 0xffcc00;
    if (pType === 'multiplier') orbColor = 0xc026d3;

    const orbMat = new THREE.MeshStandardMaterial({
      color: orbColor,
      emissive: orbColor,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.85,
      metalness: 0.8,
      roughness: 0.2,
    });

    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), orbMat);
    puGroup.add(orb);

    const inner = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    puGroup.add(inner);

    const x = this.getLaneX(lane);
    puGroup.position.set(x, 1.4, z);

    return {
      mesh: puGroup,
      type: 'powerup',
      powerUpType: pType,
      lane,
      position: new THREE.Vector3(x, 1.4, z),
      collected: false,
      box: new THREE.Box3(),
    };
  }

  public update(playerZ: number, delta: number) {
    // 1. Recycle chunks behind player
    for (let i = this.chunks.length - 1; i >= 0; i--) {
      const chunk = this.chunks[i];
      if (playerZ > chunk.startZ + chunk.length + 15) {
        this.scene.remove(chunk.group);
        this.chunks.splice(i, 1);

        this.spawnChunk(this.nextChunkZ, false);
        this.nextChunkZ += this.CHUNK_LENGTH;
      }
    }

    // 2. Animate items & update bounding boxes
    for (const chunk of this.chunks) {
      // Portal update
      if (chunk.portal && !chunk.portal.entered) {
        chunk.portal.box.setFromObject(chunk.portal.mesh);
        const teeth = chunk.portal.mesh.getObjectByName('PortalTeeth');
        if (teeth) teeth.rotation.z += delta * 1.5;
        const vortex = chunk.portal.mesh.getObjectByName('PortalVortex');
        if (vortex) vortex.rotation.z -= delta * 2.5;
      }

      // Obstacle boxes & rolling animations
      for (const obs of chunk.obstacles) {
        if (!obs.passed) {
          if (obs.isRollingBoulder) {
            obs.mesh.rotation.x += delta * 8; // Roll forward
          }
          obs.box.setFromObject(obs.mesh);
        }
      }

      // Collectibles
      for (const col of chunk.collectibles) {
        if (!col.collected) {
          col.mesh.rotation.y += delta * 3.5;
          col.mesh.position.y = col.position.y + Math.sin(Date.now() * 0.005 + col.position.z) * 0.08;
          col.box.setFromObject(col.mesh);
        }
      }
    }
  }
}
