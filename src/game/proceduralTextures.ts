import * as THREE from 'three';

/**
 * Procedural Canvas Textures for PBR materials.
 * All textures set SRGBColorSpace, proper wrapping, and anisotropy.
 */

export function createAncientStoneTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Warm sandy base
  ctx.fillStyle = '#6b5c47';
  ctx.fillRect(0, 0, size, size);

  // Stone tiles
  const tileSize = 64;
  for (let y = 0; y < size; y += tileSize) {
    for (let x = 0; x < size; x += tileSize) {
      // Offset alternate rows
      const ox = (y / tileSize) % 2 === 0 ? 0 : tileSize / 2;
      const px = (x + ox) % size;

      const shade = 100 + Math.floor(Math.random() * 30);
      ctx.fillStyle = `rgb(${shade + 20}, ${shade}, ${shade - 20})`;
      ctx.fillRect(px + 2, y + 2, tileSize - 4, tileSize - 4);

      // Edge bevel highlight
      ctx.fillStyle = 'rgba(255, 240, 200, 0.15)';
      ctx.fillRect(px + 2, y + 2, tileSize - 4, 3);
      ctx.fillRect(px + 2, y + 2, 3, tileSize - 4);

      // Edge shadow
      ctx.fillStyle = 'rgba(20, 15, 10, 0.4)';
      ctx.fillRect(px + tileSize - 5, y + 2, 3, tileSize - 4);
      ctx.fillRect(px + 2, y + tileSize - 5, tileSize - 4, 3);

      // Carved runes on some stones
      if ((x + y) % 128 === 0) {
        ctx.strokeStyle = 'rgba(220, 180, 100, 0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(px + tileSize / 2, y + tileSize / 2, 12, 0, Math.PI * 1.5);
        ctx.moveTo(px + tileSize / 2 - 8, y + tileSize / 2);
        ctx.lineTo(px + tileSize / 2 + 8, y + tileSize / 2);
        ctx.stroke();
      }
    }
  }

  // Mortar lines
  ctx.strokeStyle = '#2b2118';
  ctx.lineWidth = 3;
  for (let i = 0; i <= size; i += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
  }

  // Noise & moss patches
  for (let i = 0; i < 400; i++) {
    const rx = Math.random() * size;
    const ry = Math.random() * size;
    const isMoss = Math.random() > 0.6;
    ctx.fillStyle = isMoss ? 'rgba(76, 98, 48, 0.35)' : 'rgba(30, 20, 10, 0.15)';
    ctx.beginPath();
    ctx.arc(rx, ry, 2 + Math.random() * 5, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createJungleMossTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Deep forest earthen green
  ctx.fillStyle = '#223318';
  ctx.fillRect(0, 0, size, size);

  // Woven vines and ancient mossy pavers
  for (let i = 0; i < 80; i++) {
    ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(45, 68, 25, 0.5)' : 'rgba(70, 48, 28, 0.4)';
    ctx.lineWidth = 3 + Math.random() * 6;
    ctx.beginPath();
    let cx = Math.random() * size;
    let cy = Math.random() * size;
    ctx.moveTo(cx, cy);
    for (let s = 0; s < 4; s++) {
      cx += (Math.random() - 0.5) * 80;
      cy += (Math.random() - 0.5) * 80;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  // Glowing bioluminescent spores
  for (let i = 0; i < 150; i++) {
    const sx = Math.random() * size;
    const sy = Math.random() * size;
    const rad = 2 + Math.random() * 4;
    const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, rad * 2);
    grad.addColorStop(0, 'rgba(90, 240, 150, 0.6)');
    grad.addColorStop(1, 'rgba(90, 240, 150, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sx, sy, rad * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createVolcanicBasaltTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Charcoal obsidian rock
  ctx.fillStyle = '#171416';
  ctx.fillRect(0, 0, size, size);

  // Magma fissure cracks
  for (let i = 0; i < 25; i++) {
    let px = Math.random() * size;
    let py = Math.random() * size;

    // Outer glow
    ctx.strokeStyle = 'rgba(255, 65, 10, 0.4)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(px, py);
    const steps = 6;
    const path: [number, number][] = [[px, py]];
    for (let s = 0; s < steps; s++) {
      px += (Math.random() - 0.5) * 70;
      py += Math.random() * 80;
      path.push([px, py]);
      ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Hot yellow-orange core
    ctx.strokeStyle = 'rgba(255, 210, 60, 0.9)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(path[0][0], path[0][1]);
    for (let s = 1; s < path.length; s++) {
      ctx.lineTo(path[s][0], path[s][1]);
    }
    ctx.stroke();
  }

  // Basalt texture specks
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = Math.random() > 0.7 ? 'rgba(60, 50, 55, 0.3)' : 'rgba(10, 8, 10, 0.4)';
    ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createCyberGridTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Midnight chrome titanium
  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(0, 0, size, size);

  // Grid tiles
  const gridSize = 64;
  ctx.strokeStyle = 'rgba(30, 60, 95, 0.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= size; i += gridSize) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // Glowing neon circuit runners
  for (let i = 0; i < 15; i++) {
    const isCyan = i % 2 === 0;
    ctx.strokeStyle = isCyan ? 'rgba(0, 220, 255, 0.85)' : 'rgba(240, 50, 180, 0.85)';
    ctx.lineWidth = 2;
    ctx.shadowColor = isCyan ? '#00e5ff' : '#ff00aa';
    ctx.shadowBlur = 8;

    let cx = Math.floor(Math.random() * 8) * gridSize;
    let cy = Math.floor(Math.random() * 8) * gridSize;
    ctx.beginPath();
    ctx.moveTo(cx, cy);

    for (let s = 0; s < 3; s++) {
      if (Math.random() > 0.5) cx += gridSize;
      else cy += gridSize;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Node dot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createCoinRuneTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Gold radial gradient
  const grad = ctx.createRadialGradient(size / 2, size / 2, 20, size / 2, size / 2, size / 2);
  grad.addColorStop(0, '#ffe875');
  grad.addColorStop(0.7, '#d49b20');
  grad.addColorStop(1, '#8c5e0e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Outer bezel ring
  ctx.strokeStyle = '#fff3a3';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 14, 0, Math.PI * 2);
  ctx.stroke();

  // RUNVERSE ancient winged chevron glyph
  ctx.strokeStyle = '#5a3d08';
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(size / 2 - 50, size / 2 + 35);
  ctx.lineTo(size / 2, size / 2 - 45);
  ctx.lineTo(size / 2 + 50, size / 2 + 35);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(size / 2 - 35, size / 2 + 55);
  ctx.lineTo(size / 2, size / 2);
  ctx.lineTo(size / 2 + 35, size / 2 + 55);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createMonsterChitinTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Dark obsidian scales
  ctx.fillStyle = '#110d14';
  ctx.fillRect(0, 0, size, size);

  // Fiery crimson veins
  for (let i = 0; i < 20; i++) {
    ctx.strokeStyle = 'rgba(255, 30, 20, 0.7)';
    ctx.lineWidth = 2 + Math.random() * 3;
    ctx.beginPath();
    let x = Math.random() * size;
    let y = Math.random() * size;
    ctx.moveTo(x, y);
    for (let j = 0; j < 4; j++) {
      x += (Math.random() - 0.5) * 50;
      y += (Math.random() - 0.5) * 50;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createUrbanRebelBackTexture(variant: 'teal_rebel' | 'crimson_rebel' = 'teal_rebel'): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const isCrimson = variant === 'crimson_rebel';

  // Bomber jacket fabric base
  ctx.fillStyle = isCrimson ? '#c9184a' : '#149694';
  ctx.fillRect(0, 0, size, size);

  // Paint splashes
  const splashColors = isCrimson
    ? ['#ffb703', '#ffd166', '#06d6a0', '#118ab2', '#ff5400']
    : ['#ff007f', '#00e5ff', '#ffee00', '#76ff03', '#ff6d00'];
  for (let i = 0; i < 28; i++) {
    ctx.fillStyle = splashColors[i % splashColors.length];
    const sx = size * 0.2 + Math.random() * size * 0.6;
    const sy = size * 0.3 + Math.random() * size * 0.5;
    const rad = 6 + Math.random() * 22;
    ctx.beginPath();
    ctx.arc(sx, sy, rad, 0, Math.PI * 2);
    ctx.fill();

    // Drips
    ctx.beginPath();
    ctx.moveTo(sx - rad * 0.5, sy);
    ctx.lineTo(sx + rad * 0.5, sy);
    ctx.lineTo(sx, sy + rad * 2.2);
    ctx.fill();
  }

  // Graffiti text: URBAN
  ctx.textAlign = 'center';
  ctx.font = '900 68px "Chakra Petch", sans-serif';
  ctx.lineWidth = 14;
  ctx.strokeStyle = isCrimson ? '#20050e' : '#051b1a';
  ctx.strokeText('URBAN', size / 2, size * 0.44);
  ctx.fillStyle = isCrimson ? '#ffd60a' : '#6eff2e'; // Bright Gold vs Lime
  ctx.fillText('URBAN', size / 2, size * 0.44);

  // Graffiti text: REBEL
  ctx.font = '900 74px "Chakra Petch", sans-serif';
  ctx.lineWidth = 16;
  ctx.strokeStyle = isCrimson ? '#2b0938' : '#1b050d';
  ctx.strokeText('REBEL', size / 2, size * 0.64);
  ctx.fillStyle = isCrimson ? '#9d4edd' : '#ff4d00'; // Electric Purple vs Neon Orange
  ctx.fillText('REBEL', size / 2, size * 0.64);

  // Inner highlight on REBEL
  ctx.fillStyle = isCrimson ? '#e0aaff' : '#ffaa33';
  ctx.fillText('REBEL', size / 2, size * 0.62);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createUrbanRebelShirtTexture(variant: 'teal_rebel' | 'crimson_rebel' = 'teal_rebel'): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const isCrimson = variant === 'crimson_rebel';

  // Dark charcoal graphic tee base
  ctx.fillStyle = isCrimson ? '#181216' : '#111216';
  ctx.fillRect(0, 0, size, size);

  // Rainbow splash burst on chest
  const splashColors = isCrimson
    ? ['#ff0054', '#ff5400', '#ffbd00', '#9e0059', '#7209b7', '#3f37c9']
    : ['#ff1744', '#ff9100', '#ffd600', '#00e676', '#00e5ff', '#d500f9'];
  splashColors.forEach((color, idx) => {
    ctx.fillStyle = color;
    const cx = size * 0.25 + (idx / splashColors.length) * size * 0.5;
    ctx.beginPath();
    ctx.arc(cx, size * 0.52, 18 + (idx % 3) * 8, 0, Math.PI * 2);
    ctx.fill();

    // Drips down
    ctx.fillRect(cx - 6, size * 0.52, 12, 50 + (idx % 4) * 20);
  });

  // Silver/Gold chain necklace & pendant
  ctx.strokeStyle = isCrimson ? '#ffe6a7' : '#e2e8f0';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(size / 2, size * 0.18, size * 0.22, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();

  // Dogtag pendant
  ctx.fillStyle = isCrimson ? '#ffb703' : '#cbd5e1';
  ctx.fillRect(size / 2 - 14, size * 0.38, 28, 42);
  ctx.strokeStyle = isCrimson ? '#6c584c' : '#475569';
  ctx.lineWidth = 3;
  ctx.strokeRect(size / 2 - 14, size * 0.38, 28, 42);

  // Jacket lapel borders on left & right
  ctx.fillStyle = isCrimson ? '#c9184a' : '#149694';
  ctx.fillRect(0, 0, 80, size);
  ctx.fillRect(size - 80, 0, 80, size);

  // Zipper line
  ctx.strokeStyle = isCrimson ? '#ffb703' : '#ff6d00';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(80, 0);
  ctx.lineTo(80, size);
  ctx.moveTo(size - 80, 0);
  ctx.lineTo(size - 80, size);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createUrbanRebelFaceTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Warm anime skin tone
  ctx.fillStyle = '#f3c29f';
  ctx.fillRect(0, 0, size, size);

  // Cheerful anime smirk mouth
  ctx.strokeStyle = '#612a20';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(size / 2 + 10, size * 0.62, 35, 0.1 * Math.PI, 0.75 * Math.PI);
  ctx.stroke();

  // Nose dot
  ctx.fillStyle = '#ba7758';
  ctx.beginPath();
  ctx.arc(size / 2, size * 0.52, 6, 0, Math.PI * 2);
  ctx.fill();

  // Big expressive anime eyes
  const drawEye = (x: number, isRight: boolean) => {
    // Sclera
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(x, size * 0.36, 42, 30, isRight ? 0.05 : -0.05, 0, Math.PI * 2);
    ctx.fill();

    // Iris (Deep warm hazel-brown)
    ctx.fillStyle = '#5c3317';
    ctx.beginPath();
    ctx.arc(x + (isRight ? -4 : 4), size * 0.36, 22, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = '#1a0d05';
    ctx.beginPath();
    ctx.arc(x + (isRight ? -4 : 4), size * 0.36, 12, 0, Math.PI * 2);
    ctx.fill();

    // Eye catch / specular shine
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x + (isRight ? -10 : -2), size * 0.32, 7, 0, Math.PI * 2);
    ctx.arc(x + (isRight ? 2 : 10), size * 0.40, 4, 0, Math.PI * 2);
    ctx.fill();

    // Bold anime upper eyelid & lashes
    ctx.strokeStyle = '#1e1410';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(x, size * 0.34, 44, 1.15 * Math.PI, 1.85 * Math.PI);
    ctx.stroke();

    // Bold anime eyebrow
    ctx.strokeStyle = '#4a2612';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(x - 45, size * 0.22);
    ctx.lineTo(x + 45, size * 0.19);
    ctx.stroke();
  };

  drawEye(size * 0.32, false);
  drawEye(size * 0.68, true);

  // Cheek graffiti paint stripes (dual pink and cyan warpaint stripes on both cheeks)
  // Left cheek
  ctx.fillStyle = '#ff007f'; // Hot pink
  ctx.fillRect(size * 0.12, size * 0.50, 60, 10);
  ctx.fillStyle = '#00e5ff'; // Electric cyan
  ctx.fillRect(size * 0.15, size * 0.54, 55, 10);

  // Right cheek
  ctx.fillStyle = '#ff007f';
  ctx.fillRect(size * 0.72, size * 0.50, 60, 10);
  ctx.fillStyle = '#00e5ff';
  ctx.fillRect(size * 0.70, size * 0.54, 55, 10);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createUrbanRebelHeadbandTexture(variant: 'teal_rebel' | 'crimson_rebel' = 'teal_rebel'): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const isCrimson = variant === 'crimson_rebel';

  // Base color
  ctx.fillStyle = isCrimson ? '#7209b7' : '#149694';
  ctx.fillRect(0, 0, size, size);

  // Diagonal bright stripes
  ctx.strokeStyle = isCrimson ? '#ffd60a' : '#55ff22';
  ctx.lineWidth = 18;
  for (let i = -size; i < size * 2; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + size, size);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates a floating 3D gamer tag billboard sprite for multiplayer rivals.
 */
export function createNamePlateTexture(name: string, variant: 'teal_rebel' | 'crimson_rebel'): THREE.CanvasTexture {
  const width = 380;
  const height = 90;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  const isCrimson = variant === 'crimson_rebel';
  const accentColor = isCrimson ? '#ff0054' : '#00e5ff';
  const glowColor = isCrimson ? 'rgba(255, 0, 84, 0.4)' : 'rgba(0, 229, 255, 0.4)';

  // Shadow / Glow
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 12;

  // Background pill
  ctx.fillStyle = 'rgba(10, 15, 25, 0.88)';
  ctx.beginPath();
  ctx.roundRect(10, 10, width - 20, height - 20, 24);
  ctx.fill();

  // Border
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Icon / Badge
  ctx.shadowBlur = 0;
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.arc(42, height / 2, 14, 0, Math.PI * 2);
  ctx.fill();

  // Lightning or Crown text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isCrimson ? '⚡' : '👑', 42, height / 2);

  // Player Name
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 28px "Chakra Petch", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const trimmed = name.length > 12 ? name.slice(0, 11) + '..' : name;
  ctx.fillText(trimmed, 70, height / 2);

  // Status tag (RIVAL)
  ctx.fillStyle = accentColor;
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('RIVAL', width - 26, height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

