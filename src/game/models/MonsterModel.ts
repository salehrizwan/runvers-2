import * as THREE from 'three';
import { createMonsterChitinTexture } from '../proceduralTextures';

/**
 * "Gorgonoth - The Void Ravager"
 * An imposing original fantasy behemoth chasing the player from behind.
 * Features an articulated horned skull, snapping jaws, spiked spine,
 * dark membranous shadow wings, and reaching clawed arms.
 */
export class MonsterModel {
  public group: THREE.Group;

  private headGroup: THREE.Group;
  private lowerJaw: THREE.Group;
  private leftHorn: THREE.Mesh;
  private rightHorn: THREE.Mesh;
  private eyesMesh: THREE.Mesh;

  private spineGroup: THREE.Group;
  private leftWing: THREE.Group;
  private rightWing: THREE.Group;

  private leftClawArm: THREE.Group;
  private rightClawArm: THREE.Group;
  private leftForeClaw: THREE.Group;
  private rightForeClaw: THREE.Group;

  private runCycle = 0;
  private roarPhase = 0;

  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'Monster_Gorgonoth';

    const chitinTexture = createMonsterChitinTexture();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x18101a,
      map: chitinTexture,
      roughness: 0.55,
      metalness: 0.45,
    });

    const spineMat = new THREE.MeshStandardMaterial({
      color: 0x3d0d18,
      roughness: 0.35,
      metalness: 0.6,
    });

    const eyeGlowMat = new THREE.MeshStandardMaterial({
      color: 0xff002b,
      emissive: 0xff002b,
      emissiveIntensity: 2.5,
      roughness: 0.1,
      metalness: 0.1,
    });

    const boneMat = new THREE.MeshStandardMaterial({
      color: 0xe6e0d8,
      roughness: 0.4,
      metalness: 0.2,
    });

    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x140a12,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.88,
    });

    // 1. Torso & Hunchback Core (Positioned at y = 1.6)
    const torso = new THREE.Group();
    torso.position.y = 1.6;
    this.group.add(torso);

    const chestMesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 1.6), bodyMat);
    chestMesh.position.y = 0.2;
    chestMesh.castShadow = true;
    torso.add(chestMesh);

    // Muscular Hump
    const humpMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 1), bodyMat);
    humpMesh.position.set(0, 0.8, -0.4);
    humpMesh.scale.set(1.1, 0.9, 1.4);
    humpMesh.castShadow = true;
    torso.add(humpMesh);

    // 2. Spine Spikes
    this.spineGroup = new THREE.Group();
    torso.add(this.spineGroup);

    for (let i = 0; i < 6; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.12 - i * 0.015, 0.6 - i * 0.05, 5), spineMat);
      spike.rotation.x = -Math.PI / 4;
      spike.position.set(0, 0.9 - i * 0.12, -0.7 + i * 0.26);
      spike.castShadow = true;
      this.spineGroup.add(spike);
    }

    // 3. Shadow Wings
    this.leftWing = new THREE.Group();
    this.leftWing.position.set(-0.6, 0.9, -0.3);
    torso.add(this.leftWing);

    const leftWingBone = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 1.6, 5), spineMat);
    leftWingBone.rotation.z = Math.PI / 3;
    leftWingBone.position.set(-0.6, 0.5, 0);
    this.leftWing.add(leftWingBone);

    // Wing Membrane (triangular fan)
    const wingGeo = new THREE.BufferGeometry();
    const wingVertices = new Float32Array([
      0, 0, 0,
      -1.4, 1.1, -0.2,
      -1.8, 0.1, -0.1,

      0, 0, 0,
      -1.8, 0.1, -0.1,
      -1.3, -0.8, 0,
    ]);
    wingGeo.setAttribute('position', new THREE.BufferAttribute(wingVertices, 3));
    wingGeo.computeVertexNormals();
    const leftWingMesh = new THREE.Mesh(wingGeo, wingMat);
    this.leftWing.add(leftWingMesh);

    this.rightWing = new THREE.Group();
    this.rightWing.position.set(0.6, 0.9, -0.3);
    torso.add(this.rightWing);

    const rightWingBone = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 1.6, 5), spineMat);
    rightWingBone.rotation.z = -Math.PI / 3;
    rightWingBone.position.set(0.6, 0.5, 0);
    this.rightWing.add(rightWingBone);

    const rWingGeo = new THREE.BufferGeometry();
    const rWingVertices = new Float32Array([
      0, 0, 0,
      1.8, 0.1, -0.1,
      1.4, 1.1, -0.2,

      0, 0, 0,
      1.3, -0.8, 0,
      1.8, 0.1, -0.1,
    ]);
    rWingGeo.setAttribute('position', new THREE.BufferAttribute(rWingVertices, 3));
    rWingGeo.computeVertexNormals();
    const rightWingMesh = new THREE.Mesh(rWingGeo, wingMat);
    this.rightWing.add(rightWingMesh);

    // 4. Monstrous Head
    this.headGroup = new THREE.Group();
    this.headGroup.position.set(0, 0.8, 0.8);
    torso.add(this.headGroup);

    const cranium = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.9), bodyMat);
    cranium.castShadow = true;
    this.headGroup.add(cranium);

    // Dual Curled Horns
    const hornGeo = new THREE.ConeGeometry(0.14, 1.1, 6);
    this.leftHorn = new THREE.Mesh(hornGeo, spineMat);
    this.leftHorn.position.set(-0.42, 0.35, -0.1);
    this.leftHorn.rotation.set(-0.3, 0, -0.6);
    this.leftHorn.castShadow = true;
    this.headGroup.add(this.leftHorn);

    this.rightHorn = new THREE.Mesh(hornGeo, spineMat);
    this.rightHorn.position.set(0.42, 0.35, -0.1);
    this.rightHorn.rotation.set(-0.3, 0, 0.6);
    this.rightHorn.castShadow = true;
    this.headGroup.add(this.rightHorn);

    // Glowing Crimson Eyes (4 eyes)
    const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const leftEye = new THREE.Mesh(eyeGeo, eyeGlowMat);
    leftEye.position.set(-0.25, 0.12, 0.46);
    this.headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeGlowMat);
    rightEye.position.set(0.25, 0.12, 0.46);
    this.headGroup.add(rightEye);

    const leftEyeUpper = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), eyeGlowMat);
    leftEyeUpper.position.set(-0.32, 0.22, 0.42);
    this.headGroup.add(leftEyeUpper);

    const rightEyeUpper = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), eyeGlowMat);
    rightEyeUpper.position.set(0.32, 0.22, 0.42);
    this.headGroup.add(rightEyeUpper);
    this.eyesMesh = leftEye;

    // Upper Teeth
    for (let i = -3; i <= 3; i++) {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.14, 4), boneMat);
      tooth.rotation.x = Math.PI;
      tooth.position.set(i * 0.09, -0.28, 0.44);
      this.headGroup.add(tooth);
    }

    // Articulated Lower Jaw (for snapping/roaring)
    this.lowerJaw = new THREE.Group();
    this.lowerJaw.position.set(0, -0.25, 0.2);
    this.headGroup.add(this.lowerJaw);

    const jawBone = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.2, 0.7), bodyMat);
    jawBone.position.set(0, -0.05, 0.2);
    this.lowerJaw.add(jawBone);

    // Lower Teeth
    for (let i = -3; i <= 3; i++) {
      const tooth = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.16, 4), boneMat);
      tooth.position.set(i * 0.08, 0.1, 0.45);
      this.lowerJaw.add(tooth);
    }

    // 5. Reaching Claw Arms
    // Left Arm
    this.leftClawArm = new THREE.Group();
    this.leftClawArm.position.set(-0.75, 0.4, 0.3);
    torso.add(this.leftClawArm);

    const leftBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.8, 6), bodyMat);
    leftBicep.rotation.x = 0.6;
    leftBicep.position.set(0, -0.2, 0.2);
    this.leftClawArm.add(leftBicep);

    this.leftForeClaw = new THREE.Group();
    this.leftForeClaw.position.set(0, -0.5, 0.5);
    this.leftClawArm.add(this.leftForeClaw);

    const leftForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.9, 6), bodyMat);
    leftForearmMesh.rotation.x = 0.8;
    leftForearmMesh.position.set(0, -0.2, 0.3);
    this.leftForeClaw.add(leftForearmMesh);

    // 3 Talons
    for (let t = -1; t <= 1; t++) {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.35, 4), boneMat);
      claw.rotation.x = 1.3;
      claw.rotation.z = t * 0.3;
      claw.position.set(t * 0.12, -0.55, 0.7);
      this.leftForeClaw.add(claw);
    }

    // Right Arm
    this.rightClawArm = new THREE.Group();
    this.rightClawArm.position.set(0.75, 0.4, 0.3);
    torso.add(this.rightClawArm);

    const rightBicep = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.8, 6), bodyMat);
    rightBicep.rotation.x = 0.6;
    rightBicep.position.set(0, -0.2, 0.2);
    this.rightClawArm.add(rightBicep);

    this.rightForeClaw = new THREE.Group();
    this.rightForeClaw.position.set(0, -0.5, 0.5);
    this.rightClawArm.add(this.rightForeClaw);

    const rightForearmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.12, 0.9, 6), bodyMat);
    rightForearmMesh.rotation.x = 0.8;
    rightForearmMesh.position.set(0, -0.2, 0.3);
    this.rightForeClaw.add(rightForearmMesh);

    for (let t = -1; t <= 1; t++) {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.35, 4), boneMat);
      claw.rotation.x = 1.3;
      claw.rotation.z = t * 0.3;
      claw.position.set(t * 0.12, -0.55, 0.7);
      this.rightForeClaw.add(claw);
    }
  }

  public update(delta: number, speed: number, playerLaneX: number, distanceBehindPlayer: number) {
    this.runCycle += delta * Math.max(6, speed * 0.5);

    // Smoothly track player lane
    this.group.position.x = THREE.MathUtils.damp(this.group.position.x, playerLaneX, 4, delta);

    // Monster stalks closer or retreats smoothly
    const targetZ = this.group.position.z; // controlled by GameEngine

    // Gallop / Pounce bounce
    const bounce = Math.sin(this.runCycle * 2) * 0.15;
    this.group.position.y = bounce;

    // Wing flapping
    const wingFlap = Math.sin(this.runCycle * 1.5) * 0.35;
    this.leftWing.rotation.y = wingFlap;
    this.rightWing.rotation.y = -wingFlap;
    this.leftWing.rotation.z = 0.2 + wingFlap * 0.2;
    this.rightWing.rotation.z = -0.2 - wingFlap * 0.2;

    // Reaching claws snapping forward alternately
    const clawCycle = Math.sin(this.runCycle);
    this.leftClawArm.rotation.x = 0.2 + clawCycle * 0.6;
    this.rightClawArm.rotation.x = 0.2 - clawCycle * 0.6;

    // When monster is very close (distanceBehindPlayer < 4.5m), enter Frenzy Roar mode
    if (distanceBehindPlayer < 4.5) {
      this.roarPhase += delta * 12;
      this.lowerJaw.rotation.x = 0.45 + Math.sin(this.roarPhase) * 0.25;
      this.headGroup.rotation.x = -0.2 + Math.sin(this.roarPhase * 0.5) * 0.15;
      (this.eyesMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 3.5 + Math.sin(this.roarPhase) * 1.5;
    } else {
      // Normal menacing stalk jaw
      this.lowerJaw.rotation.x = 0.15 + Math.sin(this.runCycle) * 0.1;
      this.headGroup.rotation.x = 0.05;
      (this.eyesMesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.0;
    }
  }
}
