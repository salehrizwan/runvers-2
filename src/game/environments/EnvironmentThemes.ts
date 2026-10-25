import * as THREE from 'three';
import { EnvironmentId, EnvironmentInfo } from '../../types/game';
import {
  createAncientStoneTexture,
  createJungleMossTexture,
  createVolcanicBasaltTexture,
  createCyberGridTexture,
} from '../proceduralTextures';

export const ENVIRONMENTS: Record<EnvironmentId, EnvironmentInfo> = {
  ruins: {
    id: 'ruins',
    name: 'Ancient Sunken Ruins',
    tagline: 'Temple of the Sun God',
    description: 'Traverse crumbling sandstone causeways, ancient hieroglyphic pillars, and eternal fire braziers.',
    unlocked: true,
    requiredKeys: 0,
    requiredDistance: 0,
    themeColor: '#d97706',
    accentColor: '#fbbf24',
    fogColor: 0x937047,
    fogDensity: 0.014,
    skyColor: 0xd4a373,
    groundColor: 0x5a4632,
    ambientIntensity: 0.8,
    sunColor: 0xffeedd,
    sunIntensity: 1.8,
  },
  jungle: {
    id: 'jungle',
    name: 'Mysterious Jungle',
    tagline: 'The Verdant Canopy',
    description: 'Weave through colossal moss-cloaked roots, glowing bio-spores, and treacherous jungle ravines.',
    unlocked: false,
    requiredKeys: 2,
    requiredDistance: 500,
    themeColor: '#059669',
    accentColor: '#34d399',
    fogColor: 0x193322,
    fogDensity: 0.016,
    skyColor: 0x1f472e,
    groundColor: 0x14281a,
    ambientIntensity: 0.7,
    sunColor: 0xc4ffb0,
    sunIntensity: 1.5,
  },
  underground: {
    id: 'underground',
    name: 'Underground Crypt',
    tagline: 'The Magma Vaults',
    description: 'Plunge beneath the earth into glowing molten chasms, jagged obsidian pillars, and steam vents.',
    unlocked: false,
    requiredKeys: 5,
    requiredDistance: 1200,
    themeColor: '#dc2626',
    accentColor: '#f87171',
    fogColor: 0x2d0c0c,
    fogDensity: 0.018,
    skyColor: 0x1f0808,
    groundColor: 0x180606,
    ambientIntensity: 0.6,
    sunColor: 0xff6622,
    sunIntensity: 1.9,
  },
  cybercity: {
    id: 'cybercity',
    name: 'Futuristic Lost City',
    tagline: 'Neo-Atlantis Core',
    description: 'Sprint across hyper-speed glass highways framed by pulsing neon monoliths and holographic rings.',
    unlocked: false,
    requiredKeys: 8,
    requiredDistance: 2500,
    themeColor: '#2563eb',
    accentColor: '#38bdf8',
    fogColor: 0x091426,
    fogDensity: 0.015,
    skyColor: 0x060f1e,
    groundColor: 0x040810,
    ambientIntensity: 0.75,
    sunColor: 0x00f0ff,
    sunIntensity: 1.6,
  },
};

export class EnvironmentThemeFactory {
  public static getTrackTexture(envId: EnvironmentId): THREE.CanvasTexture {
    switch (envId) {
      case 'ruins':
        return createAncientStoneTexture();
      case 'jungle':
        return createJungleMossTexture();
      case 'underground':
        return createVolcanicBasaltTexture();
      case 'cybercity':
        return createCyberGridTexture();
    }
  }

  public static createSidePillar(envId: EnvironmentId): THREE.Group {
    const pillar = new THREE.Group();

    switch (envId) {
      case 'ruins': {
        const mat = new THREE.MeshStandardMaterial({
          color: 0xa88d6c,
          roughness: 0.75,
          metalness: 0.1,
        });
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.75, 7, 8), mat);
        col.position.y = 3.5;
        col.castShadow = true;
        col.receiveShadow = true;
        pillar.add(col);

        // Capital head
        const cap = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 1.6), mat);
        cap.position.y = 7.1;
        pillar.add(cap);

        // Torch flame brazier on top
        const brazier = new THREE.Mesh(
          new THREE.CylinderGeometry(0.4, 0.25, 0.5, 6),
          new THREE.MeshStandardMaterial({ color: 0x33251c, metalness: 0.8, roughness: 0.3 })
        );
        brazier.position.y = 7.5;
        pillar.add(brazier);

        const flame = new THREE.Mesh(
          new THREE.ConeGeometry(0.2, 0.6, 6),
          new THREE.MeshBasicMaterial({ color: 0xffaa00 })
        );
        flame.position.y = 8.0;
        pillar.add(flame);
        break;
      }

      case 'jungle': {
        const trunkMat = new THREE.MeshStandardMaterial({
          color: 0x3d2a1b,
          roughness: 0.9,
          metalness: 0.05,
        });
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 1.1, 9, 7), trunkMat);
        trunk.position.y = 4.5;
        trunk.castShadow = true;
        pillar.add(trunk);

        // Mushroom shelf
        const shroomMat = new THREE.MeshStandardMaterial({
          color: 0x00ffaa,
          emissive: 0x00d488,
          emissiveIntensity: 0.6,
          roughness: 0.3,
        });
        const shroom = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.1, 0.15, 8), shroomMat);
        shroom.position.set(0.6, 4.0, 0);
        shroom.rotation.z = -0.3;
        pillar.add(shroom);
        break;
      }

      case 'underground': {
        const basaltMat = new THREE.MeshStandardMaterial({
          color: 0x1f1a1d,
          roughness: 0.6,
          metalness: 0.3,
        });
        const stalagmite = new THREE.Mesh(new THREE.ConeGeometry(0.85, 8.5, 5), basaltMat);
        stalagmite.position.y = 4.25;
        stalagmite.castShadow = true;
        pillar.add(stalagmite);

        // Lava vein
        const veinMat = new THREE.MeshBasicMaterial({ color: 0xff3b10 });
        const vein = new THREE.Mesh(new THREE.BoxGeometry(0.12, 5.0, 0.12), veinMat);
        vein.position.set(0.35, 3.5, 0.35);
        pillar.add(vein);
        break;
      }

      case 'cybercity': {
        const cyberMat = new THREE.MeshStandardMaterial({
          color: 0x0a1220,
          roughness: 0.2,
          metalness: 0.85,
        });
        const spire = new THREE.Mesh(new THREE.BoxGeometry(0.9, 10, 0.9), cyberMat);
        spire.position.y = 5.0;
        spire.castShadow = true;
        pillar.add(spire);

        // Glowing neon band
        const neonMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
        const neonBand = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.3, 0.95), neonMat);
        neonBand.position.y = 6.5;
        pillar.add(neonBand);

        const neonBand2 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.3, 0.95), new THREE.MeshBasicMaterial({ color: 0xff0088 }));
        neonBand2.position.y = 3.5;
        pillar.add(neonBand2);
        break;
      }
    }

    return pillar;
  }
}
