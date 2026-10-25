import * as THREE from 'three';
import { HeroOutfitVariant } from '../../types/game';
import {
  createUrbanRebelBackTexture,
  createUrbanRebelShirtTexture,
  createUrbanRebelFaceTexture,
  createUrbanRebelHeadbandTexture,
  createNamePlateTexture,
} from '../proceduralTextures';

/**
 * "Urban Rebel" 3D Hero Model for RUNVERSE.
 * Supports distinct colorway variants ('teal_rebel' and 'crimson_rebel')
 * and dynamic floating 3D nameplates for multiplayer races.
 */
export class HeroModel {
  public group: THREE.Group;
  public variant: HeroOutfitVariant;
  private namePlateSprite: THREE.Sprite | null = null;

  // Joint pivots for skeletal-like running & jumping kinematics
  private hips: THREE.Group;
  private torso: THREE.Group;
  private head: THREE.Group;

  private leftArm: THREE.Group;
  private leftForearm: THREE.Group;
  private rightArm: THREE.Group;
  private rightForearm: THREE.Group;

  private leftLeg: THREE.Group;
  private leftShin: THREE.Group;
  private rightLeg: THREE.Group;
  private rightShin: THREE.Group;

  // Power-up visual attachments
  private shieldMesh: THREE.Mesh;
  private magnetHalo: THREE.Mesh;
  private dashParticles: THREE.Points;

  // Animation cycle & lean
  private runCycle = 0;
  private leanAngle = 0;

  constructor(variant: HeroOutfitVariant = 'teal_rebel', namePlateText?: string) {
    this.variant = variant;
    this.group = new THREE.Group();
    this.group.name = `UrbanRebel_${variant}`;

    const isCrimson = variant === 'crimson_rebel';

    // Procedural textures
    const backTex = createUrbanRebelBackTexture(variant);
    const shirtTex = createUrbanRebelShirtTexture(variant);
    const faceTex = createUrbanRebelFaceTexture();
    const headbandTex = createUrbanRebelHeadbandTexture(variant);

    // Materials
    const hairMat = new THREE.MeshStandardMaterial({
      color: isCrimson ? 0x24140d : 0x3d2012,
      roughness: 0.85,
      metalness: 0.05,
    });

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xf3c29f,
      roughness: 0.65,
      metalness: 0.05,
    });

    const tealJacketMat = new THREE.MeshStandardMaterial({
      color: isCrimson ? 0xc9184a : 0x149694, // Crimson vs Teal
      roughness: 0.5,
      metalness: 0.15,
    });

    const orangeHoodMat = new THREE.MeshStandardMaterial({
      color: isCrimson ? 0x7209b7 : 0xff5d00, // Neon Purple vs Neon Orange
      roughness: 0.6,
      metalness: 0.1,
    });

    const cargoPantsMat = new THREE.MeshStandardMaterial({
      color: isCrimson ? 0x18181b : 0x244248, // Obsidian vs Dark Teal
      roughness: 0.75,
      metalness: 0.1,
    });

    const blackShirtMat = new THREE.MeshStandardMaterial({
      map: shirtTex,
      roughness: 0.7,
      metalness: 0.1,
    });

    const backJacketMat = new THREE.MeshStandardMaterial({
      map: backTex,
      roughness: 0.55,
      metalness: 0.1,
    });

    const faceMat = new THREE.MeshStandardMaterial({
      map: faceTex,
      roughness: 0.6,
      metalness: 0.05,
    });

    const headbandMat = new THREE.MeshStandardMaterial({
      map: headbandTex,
      roughness: 0.7,
      metalness: 0.1,
    });

    const gloveMat = new THREE.MeshStandardMaterial({
      color: 0x181a20, // Fingerless street gloves
      roughness: 0.6,
      metalness: 0.2,
    });

    const earbudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.6,
    });

    const backpackMat = new THREE.MeshStandardMaterial({
      color: isCrimson ? 0x1a1518 : 0x202428,
      roughness: 0.8,
      metalness: 0.1,
    });

    const limeShoeMat = new THREE.MeshStandardMaterial({
      color: isCrimson ? 0xff0054 : 0x6eff2e, // Ruby vs Lime
      roughness: 0.4,
      metalness: 0.2,
    });

    const cyanShoeMat = new THREE.MeshStandardMaterial({
      color: isCrimson ? 0xffb703 : 0x00e5ff, // Golden vs Cyan
      roughness: 0.4,
      metalness: 0.2,
    });

    const whiteSoleMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.5,
      metalness: 0.1,
    });

    // 0. Floating Nameplate (if specified)
    if (namePlateText) {
      const plateTex = createNamePlateTexture(namePlateText, variant);
      const spriteMat = new THREE.SpriteMaterial({
        map: plateTex,
        depthTest: false,
        depthWrite: false,
      });
      this.namePlateSprite = new THREE.Sprite(spriteMat);
      this.namePlateSprite.scale.set(1.9, 0.45, 1);
      this.namePlateSprite.position.set(0, 2.2, 0);
      this.namePlateSprite.renderOrder = 999;
      this.group.add(this.namePlateSprite);
    }

    // 1. Hips (y = 0.96)
    this.hips = new THREE.Group();
    this.hips.position.y = 0.96;
    this.group.add(this.hips);

    const hipsMesh = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.24, 0.3), cargoPantsMat);
    hipsMesh.castShadow = true;
    hipsMesh.receiveShadow = true;
    this.hips.add(hipsMesh);

    // Hanging orange belt strap
    const beltTab = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.22, 0.04), orangeHoodMat);
    beltTab.position.set(-0.08, -0.08, 0.16);
    this.hips.add(beltTab);

    // 2. Torso (Attached to hips)
    this.torso = new THREE.Group();
    this.torso.position.y = 0.13;
    this.hips.add(this.torso);

    // Main chest with multi-materials (Front has rainbow tee, Back has URBAN REBEL graffiti)
    const torsoGeo = new THREE.BoxGeometry(0.48, 0.5, 0.32);
    const torsoMats = [
      tealJacketMat, // Right
      tealJacketMat, // Left
      tealJacketMat, // Top
      tealJacketMat, // Bottom
      blackShirtMat, // Front (Rainbow graphic tee)
      backJacketMat, // Back (URBAN REBEL graffiti!)
    ];
    const torsoMesh = new THREE.Mesh(torsoGeo, torsoMats);
    torsoMesh.position.y = 0.25;
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    this.torso.add(torsoMesh);

    // Neon orange hood resting around neck/back
    const hoodCollar = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.08, 8, 16), orangeHoodMat);
    hoodCollar.position.set(0, 0.48, -0.06);
    hoodCollar.rotation.x = Math.PI / 3;
    this.torso.add(hoodCollar);

    // Dark Street Backpack on back
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.38, 0.18), backpackMat);
    backpack.position.set(0, 0.26, -0.22);
    backpack.castShadow = true;
    this.torso.add(backpack);

    // Backpack front pocket
    const bpPocket = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.08), tealJacketMat);
    bpPocket.position.set(0, 0.20, -0.32);
    this.torso.add(bpPocket);

    // 3. Head & Hair
    this.head = new THREE.Group();
    this.head.position.y = 0.56;
    this.torso.add(this.head);

    // Head base with face texture on front
    const headGeo = new THREE.BoxGeometry(0.3, 0.3, 0.28);
    const headMats = [
      skinMat, // Right
      skinMat, // Left
      hairMat, // Top
      skinMat, // Bottom
      faceMat, // Front (Eyes, Smirk, Warpaint!)
      hairMat, // Back
    ];
    const headMesh = new THREE.Mesh(headGeo, headMats);
    headMesh.position.y = 0.15;
    headMesh.castShadow = true;
    this.head.add(headMesh);

    // Striped street headband tied around forehead
    const headbandMesh = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.08, 0.3), headbandMat);
    headbandMesh.position.set(0, 0.22, 0.01);
    this.head.add(headbandMesh);

    // Bandana knot ribbons at the back of head
    const knot = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 5), headbandMat);
    knot.rotation.z = Math.PI / 4;
    knot.position.set(-0.06, 0.20, -0.16);
    this.head.add(knot);

    const knot2 = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.18, 5), headbandMat);
    knot2.rotation.z = -Math.PI / 4;
    knot2.position.set(0.06, 0.20, -0.16);
    this.head.add(knot2);

    // Spiky anime hair cluster (top, sides, back)
    const hairSpikes = [
      { pos: [0, 0.34, 0.02], scale: [0.12, 0.22, 0.12], rot: [0.2, 0, 0] },
      { pos: [-0.1, 0.33, 0.04], scale: [0.1, 0.2, 0.1], rot: [0.3, 0, -0.3] },
      { pos: [0.1, 0.33, 0.04], scale: [0.1, 0.2, 0.1], rot: [0.3, 0, 0.3] },
      { pos: [-0.14, 0.28, -0.06], scale: [0.08, 0.18, 0.08], rot: [0, 0, -0.4] },
      { pos: [0.14, 0.28, -0.06], scale: [0.08, 0.18, 0.08], rot: [0, 0, 0.4] },
      { pos: [0, 0.28, -0.16], scale: [0.12, 0.2, 0.12], rot: [-0.4, 0, 0] },
      { pos: [-0.08, 0.24, -0.16], scale: [0.1, 0.18, 0.1], rot: [-0.3, 0, -0.3] },
      { pos: [0.08, 0.24, -0.16], scale: [0.1, 0.18, 0.1], rot: [-0.3, 0, 0.3] },
    ];
    hairSpikes.forEach((s) => {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(s.scale[0], s.scale[1], 4), hairMat);
      cone.position.set(s.pos[0], s.pos[1], s.pos[2]);
      cone.rotation.set(s.rot[0], s.rot[1], s.rot[2]);
      cone.castShadow = true;
      this.head.add(cone);
    });

    // White wireless earbud in ear
    const earbud = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), earbudMat);
    earbud.position.set(-0.16, 0.14, 0.02);
    this.head.add(earbud);

    const earbudStem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.06, 6), earbudMat);
    earbudStem.position.set(-0.16, 0.11, 0.03);
    earbudStem.rotation.z = -0.2;
    this.head.add(earbudStem);

    // 4. Arms
    // Left Arm
    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.31, 0.44, 0);
    this.torso.add(this.leftArm);

    const leftShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), tealJacketMat);
    this.leftArm.add(leftShoulder);

    const leftBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.24, 8), tealJacketMat);
    leftBicep.position.y = -0.12;
    this.leftArm.add(leftBicep);

    // Sleeve purple badge
    const badgeL = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.08, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x9333ea })
    );
    badgeL.position.set(-0.07, -0.12, 0);
    this.leftArm.add(badgeL);

    this.leftForearm = new THREE.Group();
    this.leftForearm.position.y = -0.24;
    this.leftArm.add(this.leftForearm);

    // Forearm skin
    const leftSkin = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.18, 8), skinMat);
    leftSkin.position.y = -0.09;
    this.leftForearm.add(leftSkin);

    // Stacked neon wristbands (Magenta, Yellow, Cyan)
    const wb1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.062, 0.014, 6, 12),
      new THREE.MeshBasicMaterial({ color: 0xff007f })
    );
    wb1.rotation.x = Math.PI / 2;
    wb1.position.y = -0.16;
    this.leftForearm.add(wb1);

    const wb2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.062, 0.014, 6, 12),
      new THREE.MeshBasicMaterial({ color: 0xffd600 })
    );
    wb2.rotation.x = Math.PI / 2;
    wb2.position.y = -0.19;
    this.leftForearm.add(wb2);

    // Fingerless glove hand
    const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.12), gloveMat);
    leftHand.position.y = -0.25;
    this.leftForearm.add(leftHand);

    // Fingers peeking out of glove
    const leftFingers = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.08), skinMat);
    leftFingers.position.y = -0.31;
    this.leftForearm.add(leftFingers);

    // Right Arm
    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.31, 0.44, 0);
    this.torso.add(this.rightArm);

    const rightShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), tealJacketMat);
    this.rightArm.add(rightShoulder);

    const rightBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.24, 8), tealJacketMat);
    rightBicep.position.y = -0.12;
    this.rightArm.add(rightBicep);

    this.rightForearm = new THREE.Group();
    this.rightForearm.position.y = -0.24;
    this.rightArm.add(this.rightForearm);

    const rightSkin = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.055, 0.18, 8), skinMat);
    rightSkin.position.y = -0.09;
    this.rightForearm.add(rightSkin);

    const rwb1 = new THREE.Mesh(
      new THREE.TorusGeometry(0.062, 0.014, 6, 12),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff })
    );
    rwb1.rotation.x = Math.PI / 2;
    rwb1.position.y = -0.16;
    this.rightForearm.add(rwb1);

    const rwb2 = new THREE.Mesh(
      new THREE.TorusGeometry(0.062, 0.014, 6, 12),
      new THREE.MeshBasicMaterial({ color: 0xff007f })
    );
    rwb2.rotation.x = Math.PI / 2;
    rwb2.position.y = -0.19;
    this.rightForearm.add(rwb2);

    const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.12), gloveMat);
    rightHand.position.y = -0.25;
    this.rightForearm.add(rightHand);

    const rightFingers = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.08), skinMat);
    rightFingers.position.y = -0.31;
    this.rightForearm.add(rightFingers);

    // 5. Legs & Baggy Cargo Pants
    // Left Leg
    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.14, -0.1, 0);
    this.hips.add(this.leftLeg);

    const leftThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.38, 8), cargoPantsMat);
    leftThigh.position.y = -0.19;
    leftThigh.castShadow = true;
    this.leftLeg.add(leftThigh);

    // Large 3D Side Cargo Pocket
    const cargoPocketL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.16), cargoPantsMat);
    cargoPocketL.position.set(-0.12, -0.19, 0);
    this.leftLeg.add(cargoPocketL);

    // Hanging suspender loop
    const suspenderL = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.016, 6, 12, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff })
    );
    suspenderL.position.set(-0.13, -0.22, 0);
    suspenderL.rotation.y = Math.PI / 2;
    this.leftLeg.add(suspenderL);

    this.leftShin = new THREE.Group();
    this.leftShin.position.y = -0.38;
    this.leftLeg.add(this.leftShin);

    const leftCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.085, 0.34, 8), cargoPantsMat);
    leftCalf.position.y = -0.17;
    leftCalf.castShadow = true;
    this.leftShin.add(leftCalf);

    // High-top Skater Sneaker (Lime, Cyan, Orange, White sole)
    const leftShoe = new THREE.Group();
    leftShoe.position.set(0, -0.36, 0.06);

    // White sole
    const soleL = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, 0.32), whiteSoleMat);
    leftShoe.add(soleL);

    // Lime green toe & sides
    const upperL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.28), limeShoeMat);
    upperL.position.y = 0.08;
    leftShoe.add(upperL);

    // Cyan heel counter
    const heelL = new THREE.Mesh(new THREE.BoxGeometry(0.142, 0.16, 0.12), cyanShoeMat);
    heelL.position.set(0, 0.09, -0.09);
    leftShoe.add(heelL);

    // Neon orange tongue & laces
    const tongueL = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.18, 0.1), orangeHoodMat);
    tongueL.position.set(0, 0.11, 0.06);
    leftShoe.add(tongueL);

    this.leftShin.add(leftShoe);

    // Right Leg
    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.14, -0.1, 0);
    this.hips.add(this.rightLeg);

    const rightThigh = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.38, 8), cargoPantsMat);
    rightThigh.position.y = -0.19;
    rightThigh.castShadow = true;
    this.rightLeg.add(rightThigh);

    const cargoPocketR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.16), cargoPantsMat);
    cargoPocketR.position.set(0.12, -0.19, 0);
    this.rightLeg.add(cargoPocketR);

    const suspenderR = new THREE.Mesh(
      new THREE.TorusGeometry(0.08, 0.016, 6, 12, Math.PI),
      new THREE.MeshBasicMaterial({ color: 0x00e5ff })
    );
    suspenderR.position.set(0.13, -0.22, 0);
    suspenderR.rotation.y = -Math.PI / 2;
    this.rightLeg.add(suspenderR);

    this.rightShin = new THREE.Group();
    this.rightShin.position.y = -0.38;
    this.rightLeg.add(this.rightShin);

    const rightCalf = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.085, 0.34, 8), cargoPantsMat);
    rightCalf.position.y = -0.17;
    rightCalf.castShadow = true;
    this.rightShin.add(rightCalf);

    const rightShoe = new THREE.Group();
    rightShoe.position.set(0, -0.36, 0.06);

    const soleR = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, 0.32), whiteSoleMat);
    rightShoe.add(soleR);

    const upperR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.28), limeShoeMat);
    upperR.position.y = 0.08;
    rightShoe.add(upperR);

    const heelR = new THREE.Mesh(new THREE.BoxGeometry(0.142, 0.16, 0.12), cyanShoeMat);
    heelR.position.set(0, 0.09, -0.09);
    rightShoe.add(heelR);

    const tongueR = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.18, 0.1), orangeHoodMat);
    tongueR.position.set(0, 0.11, 0.06);
    rightShoe.add(tongueR);

    this.rightShin.add(rightShoe);

    // 6. Shield Bubble Visual
    const shieldGeo = new THREE.IcosahedronGeometry(1.2, 2);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x33b5ff,
      emissive: 0x0099ff,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.2,
      wireframe: true,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.position.y = 1.0;
    this.shieldMesh.visible = false;
    this.group.add(this.shieldMesh);

    // 7. Magnet Halo
    const magnetGeo = new THREE.TorusGeometry(0.7, 0.04, 8, 24);
    const magnetMat = new THREE.MeshBasicMaterial({
      color: 0xff3b30,
      wireframe: true,
    });
    this.magnetHalo = new THREE.Mesh(magnetGeo, magnetMat);
    this.magnetHalo.rotation.x = Math.PI / 2;
    this.magnetHalo.position.y = 1.0;
    this.magnetHalo.visible = false;
    this.group.add(this.magnetHalo);

    // 8. Dash Particle Trail
    const particleCount = 20;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      pPositions[i] = (Math.random() - 0.5) * 0.8;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0xffaa00,
      size: 0.12,
      transparent: true,
      opacity: 0.7,
    });
    this.dashParticles = new THREE.Points(pGeo, pMat);
    this.dashParticles.position.y = 0.5;
    this.dashParticles.visible = false;
    this.group.add(this.dashParticles);
  }

  public setShieldVisible(visible: boolean) {
    this.shieldMesh.visible = visible;
  }

  public setMagnetVisible(visible: boolean) {
    this.magnetHalo.visible = visible;
  }

  public setBoostVisible(visible: boolean) {
    this.dashParticles.visible = visible;
  }

  public update(
    delta: number,
    state: 'RUN' | 'JUMP' | 'SLIDE' | 'STUMBLE' | 'DEAD',
    speed: number,
    targetLaneX: number
  ) {
    // Bank smoothly towards destination lane on screen
    const currentX = this.group.position.x;
    const laneDelta = targetLaneX - currentX;
    const targetLean = laneDelta * 0.12;
    this.leanAngle = THREE.MathUtils.damp(this.leanAngle, targetLean, 10, delta);
    this.group.rotation.z = this.leanAngle;

    // Power-up visual rotations
    if (this.shieldMesh.visible) {
      this.shieldMesh.rotation.y += delta * 2;
      this.shieldMesh.rotation.x += delta * 1.5;
    }
    if (this.magnetHalo.visible) {
      this.magnetHalo.rotation.z += delta * 4;
    }
    if (this.dashParticles.visible) {
      this.dashParticles.rotation.y += delta * 5;
    }

    if (state === 'DEAD') {
      // Knockdown / collapse on ground
      this.hips.position.y = THREE.MathUtils.damp(this.hips.position.y, 0.22, 10, delta);
      this.hips.rotation.x = THREE.MathUtils.damp(this.hips.rotation.x, -Math.PI / 2.3, 8, delta);
      this.leftArm.rotation.x = 0.6;
      this.rightArm.rotation.x = -0.4;
      return;
    }

    if (state === 'SLIDE') {
      // Duck down low, slide feet forward
      this.hips.position.y = THREE.MathUtils.damp(this.hips.position.y, 0.42, 14, delta);
      this.torso.rotation.x = THREE.MathUtils.damp(this.torso.rotation.x, -0.7, 14, delta);
      this.head.rotation.x = THREE.MathUtils.damp(this.head.rotation.x, 0.5, 14, delta);

      this.rightLeg.rotation.x = THREE.MathUtils.damp(this.rightLeg.rotation.x, -1.2, 14, delta);
      this.rightShin.rotation.x = THREE.MathUtils.damp(this.rightShin.rotation.x, 0.2, 14, delta);
      this.leftLeg.rotation.x = THREE.MathUtils.damp(this.leftLeg.rotation.x, 0.8, 14, delta);
      this.leftShin.rotation.x = THREE.MathUtils.damp(this.leftShin.rotation.x, 1.4, 14, delta);

      this.leftArm.rotation.x = THREE.MathUtils.damp(this.leftArm.rotation.x, 0.6, 14, delta);
      this.rightArm.rotation.x = THREE.MathUtils.damp(this.rightArm.rotation.x, -0.6, 14, delta);
      return;
    }

    if (state === 'JUMP') {
      // Airborne pose
      this.hips.position.y = THREE.MathUtils.damp(this.hips.position.y, 0.96, 8, delta);
      this.torso.rotation.x = THREE.MathUtils.damp(this.torso.rotation.x, 0.25, 10, delta);
      this.head.rotation.x = THREE.MathUtils.damp(this.head.rotation.x, -0.2, 10, delta);

      this.leftLeg.rotation.x = THREE.MathUtils.damp(this.leftLeg.rotation.x, -0.5, 10, delta);
      this.leftShin.rotation.x = THREE.MathUtils.damp(this.leftShin.rotation.x, 0.9, 10, delta);
      this.rightLeg.rotation.x = THREE.MathUtils.damp(this.rightLeg.rotation.x, 0.3, 10, delta);
      this.rightShin.rotation.x = THREE.MathUtils.damp(this.rightShin.rotation.x, 0.7, 10, delta);

      this.leftArm.rotation.x = THREE.MathUtils.damp(this.leftArm.rotation.x, -0.8, 10, delta);
      this.rightArm.rotation.x = THREE.MathUtils.damp(this.rightArm.rotation.x, -0.8, 10, delta);
      return;
    }

    if (state === 'STUMBLE') {
      // Stumble stagger pose
      this.torso.rotation.x = Math.sin(Date.now() * 0.03) * 0.4 + 0.35;
      this.leftArm.rotation.z = -0.7;
      this.rightArm.rotation.z = 0.7;
      return;
    }

    // Default Running Cycle
    const runFreq = Math.max(8, speed * 0.6);
    this.runCycle += delta * runFreq;

    const bob = Math.sin(this.runCycle * 2) * 0.06;
    this.hips.position.y = 0.96 + bob;

    this.torso.rotation.x = 0.22 + Math.sin(this.runCycle) * 0.04;
    this.torso.rotation.y = Math.sin(this.runCycle) * 0.08;
    this.head.rotation.x = -0.15;
    this.head.rotation.y = -Math.sin(this.runCycle) * 0.05;

    // Leg swinging
    const legAngle = Math.sin(this.runCycle) * 0.85;
    this.leftLeg.rotation.x = legAngle;
    this.rightLeg.rotation.x = -legAngle;

    this.leftShin.rotation.x = legAngle > 0 ? legAngle * 0.95 : 0.1;
    this.rightShin.rotation.x = -legAngle > 0 ? -legAngle * 0.95 : 0.1;

    // Arm swinging
    this.leftArm.rotation.x = -legAngle * 0.9;
    this.rightArm.rotation.x = legAngle * 0.9;
    this.leftForearm.rotation.x = -0.6 - Math.abs(legAngle) * 0.3;
    this.rightForearm.rotation.x = -0.6 - Math.abs(legAngle) * 0.3;
  }

  public setNamePlate(name: string) {
    if (!this.namePlateSprite) {
      const plateTex = createNamePlateTexture(name, this.variant);
      const spriteMat = new THREE.SpriteMaterial({
        map: plateTex,
        depthTest: false,
        depthWrite: false,
      });
      this.namePlateSprite = new THREE.Sprite(spriteMat);
      this.namePlateSprite.scale.set(1.9, 0.45, 1);
      this.namePlateSprite.position.set(0, 2.2, 0);
      this.namePlateSprite.renderOrder = 999;
      this.group.add(this.namePlateSprite);
    } else {
      const newTex = createNamePlateTexture(name, this.variant);
      this.namePlateSprite.material.map?.dispose();
      this.namePlateSprite.material.map = newTex;
      this.namePlateSprite.material.needsUpdate = true;
    }
  }
}
