'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, extend, useFrame, useThree, ThreeEvent } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useSpringJoint,
  useSphericalJoint,
  RapierRigidBody,
} from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import * as THREE from 'three';

extend({ MeshLineGeometry, MeshLineMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    meshLineGeometry: Record<string, unknown>;
    meshLineMaterial: Record<string, unknown>;
  }
}

interface Lanyard3DProps {
  eventSource?: React.RefObject<HTMLElement | null>;
  active?: boolean;
}

const FRONT_PHOTO_SRC = '/lanyard-front.jpg';

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const imgRatio = img.naturalWidth / Math.max(1, img.naturalHeight);
  const boxRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;

  if (imgRatio > boxRatio) {
    sw = img.naturalHeight * boxRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / boxRatio;
    // Slight upper-center crop so face, hood, and pose stay centered cleanly
    sy = Math.min(img.naturalHeight - sh, Math.max(0, (img.naturalHeight - sh) * 0.22));
  }

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 24);
  ctx.clip();

  // High-contrast monochrome darkroom grading to match MyPorto's black monochrome system
  ctx.filter = 'grayscale(100%) contrast(1.1) brightness(0.98)';
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.filter = 'none';

  // Subtle edge vignette for gallery print depth
  const vignette = ctx.createRadialGradient(
    x + w / 2,
    y + h / 2,
    Math.min(w, h) * 0.3,
    x + w / 2,
    y + h / 2,
    Math.max(w, h) * 0.72
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.fillStyle = vignette;
  ctx.fillRect(x, y, w, h);

  ctx.restore();

  // Crisp inner hairline border
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 24);
  ctx.stroke();
}

function drawBadgeCanvas(
  canvas: HTMLCanvasElement,
  side: 'front' | 'back',
  photoImg: HTMLImageElement | null = null
) {
  const width = canvas.width;
  const height = canvas.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Deep matte near-black card surface
  ctx.fillStyle = side === 'front' ? '#0d0d0d' : '#111111';
  ctx.fillRect(0, 0, width, height);

  // Subtle monochrome specular gradient across card
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, 'rgba(255,255,255,0.08)');
  grad.addColorStop(0.45, 'rgba(255,255,255,0.01)');
  grad.addColorStop(1, 'rgba(255,255,255,0.05)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Crisp inner hairline frame
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 3;
  ctx.strokeRect(46, 46, width - 92, height - 92);

  // Top lanyard punch slot
  ctx.fillStyle = '#050505';
  ctx.strokeStyle = 'rgba(255,255,255,0.26)';
  ctx.lineWidth = 3;
  const slotW = 190;
  const slotH = 34;
  const slotX = (width - slotW) / 2;
  const slotY = 92;
  ctx.beginPath();
  ctx.roundRect(slotX, slotY, slotW, slotH, 17);
  ctx.fill();
  ctx.stroke();

  if (side === 'front') {
    ctx.fillStyle = 'rgba(255,255,255,0.52)';
    ctx.font = '500 28px "Instrument Sans", system-ui, sans-serif';
    ctx.fillText('ID · 01', 96, 208);
    ctx.textAlign = 'right';
    ctx.fillText('2026', width - 96, 208);
    ctx.textAlign = 'left';

    if (photoImg && photoImg.complete && photoImg.naturalWidth > 0) {
      // Portrait Photo Front Layout
      drawCoverImage(ctx, photoImg, 96, 248, width - 192, 860);

      ctx.fillStyle = '#f5f5f5';
      ctx.font = '400 124px "Instrument Serif", Georgia, serif';
      ctx.fillText('MyPorto', 92, 1244);

      ctx.fillStyle = 'rgba(255,255,255,0.68)';
      ctx.font = '500 32px "Instrument Sans", system-ui, sans-serif';
      ctx.fillText('DIPPA  ·  UI/UX · DESIGN · FRONTEND', 96, 1306);

      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(96, 1358, width - 192, 2);

      ctx.fillStyle = 'rgba(255,255,255,0.36)';
      ctx.font = '400 24px "Instrument Sans", system-ui, sans-serif';
      ctx.fillText('DRAG TO SWING  ·  CLICK TO FLIP', 96, 1442);

      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(width - 138, 1432, 38, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#f5f5f5';
      ctx.font = '400 42px "Instrument Serif", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('M', width - 138, 1434);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(96, 540, width - 192, 2);

      ctx.fillStyle = '#f5f5f5';
      ctx.font = '400 176px "Instrument Serif", Georgia, serif';
      ctx.fillText('MyPorto', 92, 742);

      ctx.fillStyle = 'rgba(255,255,255,0.68)';
      ctx.font = '500 36px "Instrument Sans", system-ui, sans-serif';
      ctx.fillText('DIPPA  ·  INDEPENDENT PORTFOLIO', 96, 822);

      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(96, 896, width - 192, 2);

      ctx.fillStyle = 'rgba(255,255,255,0.44)';
      ctx.font = '500 26px "Instrument Sans", system-ui, sans-serif';
      ctx.fillText('DISCIPLINES', 96, 1296);

      ctx.fillStyle = '#f5f5f5';
      ctx.font = '500 38px "Instrument Sans", system-ui, sans-serif';
      ctx.fillText('UI/UX · Design · Frontend', 96, 1356);

      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(width - 144, 1330, 44, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#f5f5f5';
      ctx.font = '400 48px "Instrument Serif", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('M', width - 144, 1332);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';

      ctx.fillStyle = 'rgba(255,255,255,0.34)';
      ctx.font = '400 24px "Instrument Sans", system-ui, sans-serif';
      ctx.fillText('DRAG TO SWING  ·  CLICK TO FLIP', 96, 1480);
    }
  } else {
    ctx.fillStyle = 'rgba(255,255,255,0.52)';
    ctx.font = '500 28px "Instrument Sans", system-ui, sans-serif';
    ctx.fillText('MyPorto · ARCHIVE PASS', 96, 224);

    const rows = [
      ['OWNER', 'Dippa'],
      ['PRACTICE', 'UI/UX, Posters & Web'],
      ['PALETTE', 'Monochrome #0A0A0A'],
      ['AVAILABILITY', 'Select collaborations'],
    ];

    let y = 400;
    for (const [k, v] of rows) {
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(96, y, width - 192, 2);

      ctx.fillStyle = 'rgba(255,255,255,0.44)';
      ctx.font = '500 24px "Instrument Sans", system-ui, sans-serif';
      ctx.fillText(k, 96, y + 54);

      ctx.fillStyle = '#f5f5f5';
      ctx.font = '500 40px "Instrument Sans", system-ui, sans-serif';
      ctx.fillText(v, 96, y + 112);

      y += 168;
    }

    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(96, y, width - 192, 2);

    const bars = [
      6, 3, 10, 4, 6, 3, 3, 12, 4, 8, 3, 6, 10, 3, 4, 8, 3, 6, 12, 4, 3, 8, 6, 3, 10, 4, 6, 3,
      8, 4, 12, 3, 6, 4, 8, 3, 6, 10, 4, 6,
    ];
    let bx = 96;
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    bars.forEach((bw, idx) => {
      if (idx % 2 === 0) {
        ctx.fillRect(bx, 1270, bw * 2.4, 120);
      }
      bx += bw * 3.1;
    });

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '400 24px "Instrument Sans", system-ui, sans-serif';
    ctx.fillText('MYP-2026-MONO-01', 96, 1452);
  }
}

function useBadgeCanvasTexture(side: 'front' | 'back') {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1600;
    canvasRef.current = canvas;
    drawBadgeCanvas(canvas, side, null);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 16;
    tex.needsUpdate = true;
    return tex;
  }, [side]);

  useEffect(() => {
    let cancelled = false;
    let loadedImg: HTMLImageElement | null = null;

    const redraw = () => {
      if (cancelled || !canvasRef.current) return;
      drawBadgeCanvas(canvasRef.current, side, loadedImg);
      texture.needsUpdate = true;
    };

    if (side === 'front') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        loadedImg = img;
        redraw();
      };
      img.onerror = () => {
        loadedImg = null;
        redraw();
      };
      img.src = FRONT_PHOTO_SRC;
    }

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => redraw());
    }

    return () => {
      cancelled = true;
      texture.dispose();
    };
  }, [side, texture]);

  return texture;
}

function createStrapTexture(): THREE.CanvasTexture {
  const width = 512;
  const height = 128;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#181818';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let x = 0; x < width; x += 6) {
      ctx.fillRect(x, 0, 2, height);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(0, 8, width, 2);
    ctx.fillRect(0, height - 10, width, 2);

    ctx.fillStyle = 'rgba(255,255,255,0.58)';
    ctx.font = '500 34px "Instrument Sans", system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('MyPorto   ·   MyPorto', 36, height / 2 + 2);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
}

const DESKTOP_ANCHOR_Y = 4.43;
const MOBILE_ANCHOR_Y = 6.22;
const SPRING_REST_LEN = 0.2;
const SPRING_STIFFNESS = 68;
const SPRING_DAMPING = 9.5;

type MotionPermissionFn = () => Promise<'granted' | 'denied'>;
type DeviceMotionEventWithPermission = typeof DeviceMotionEvent & {
  requestPermission?: MotionPermissionFn;
};
type DeviceOrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: MotionPermissionFn;
};

interface GyroState {
  tiltX: number;
  tiltZ: number;
  shakeX: number;
  shakeY: number;
  shakeZ: number;
}

function Band({
  active,
  isNonPC,
  onDragStateChange,
  onUserInteract,
  blurFilterRef,
  gyroRef,
  maxSpeed = 52,
  minSpeed = 12,
}: {
  active: boolean;
  isNonPC: boolean;
  onDragStateChange: (dragging: boolean) => void;
  onUserInteract: () => void;
  blurFilterRef: React.RefObject<SVGFEGaussianBlurElement | null>;
  gyroRef: React.RefObject<GyroState>;
  maxSpeed?: number;
  minSpeed?: number;
}) {
  const band = useRef<THREE.Mesh>(null);
  const bandMat = useRef<{ lineWidth?: number } | null>(null);
  const fixed = useRef<RapierRigidBody>(null);
  const j1 = useRef<RapierRigidBody>(null);
  const j2 = useRef<RapierRigidBody>(null);
  const j3 = useRef<RapierRigidBody>(null);
  const card = useRef<RapierRigidBody>(null);
  const badgeVisualRef = useRef<THREE.Group>(null);

  const { size, viewport, gl, camera } = useThree();

  // On desktop (lg >= 1024px) anchor cleanly in the left half of the full-viewport canvas;
  // on mobile/tablet pull the camera back slightly so the badge stays compact in the upper
  // 43% of the screen well above the hero text, with generous horizontal swing room.
  const isDesktop = size.width >= 1024;
  const anchorX = isDesktop ? -Math.min(viewport.width * 0.225, 2.35) : 0;
  const baseAnchorY = isDesktop ? DESKTOP_ANCHOR_Y : MOBILE_ANCHOR_Y;

  useEffect(() => {
    const targetZ = isDesktop ? 14 : 17.5;
    if (Math.abs(camera.position.z - targetZ) > 0.01) {
      camera.position.set(0, 0, targetZ);
      camera.updateProjectionMatrix();
    }
  }, [isDesktop, camera]);

  // Capture initial spawn anchor once so mount positions stay aligned on frame 0
  const initialAnchorX = useRef(anchorX);
  const initialAnchorY = useRef(baseAnchorY);
  const smoothScrollY = useRef(typeof window !== 'undefined' ? window.scrollY : 0);

  const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const hitPoint = useMemo(() => new THREE.Vector3(), []);
  const targetPos = useMemo(() => new THREE.Vector3(), []);
  const anchorPos = useMemo(() => new THREE.Vector3(anchorX, baseAnchorY, 0), [anchorX, baseAnchorY]);
  const tmpVec = useMemo(() => new THREE.Vector3(), []);
  const ang = useMemo(() => new THREE.Vector3(), []);
  const rot = useMemo(() => new THREE.Vector3(), []);
  const dragRaycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointerNdc = useRef(new THREE.Vector2());

  const [dragOffset, setDragOffset] = useState<THREE.Vector3 | false>(false);
  const [hovered, setHovered] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const activePointerId = useRef<number | null>(null);
  const pointerDownScreen = useRef<{ x: number; y: number } | null>(null);
  const prevTargetPos = useRef<THREE.Vector3 | null>(null);
  const smoothVelocity = useRef(new THREE.Vector3());
  const pendingThrow = useRef<THREE.Vector3 | null>(null);
  const hasDroppedIn = useRef(false);
  const flipAngle = useRef(0);

  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ])
  );

  const frontTex = useBadgeCanvasTexture('front');
  const backTex = useBadgeCanvasTexture('back');
  const strapTex = useMemo(() => createStrapTexture(), []);

  const cardGeo = useMemo(() => {
    const w = 1.66;
    const h = 2.54;
    const r = 0.12;
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2 + r, -h / 2);
    shape.lineTo(w / 2 - r, -h / 2);
    shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
    shape.lineTo(w / 2, h / 2 - r);
    shape.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
    shape.lineTo(-w / 2 + r, h / 2);
    shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
    shape.lineTo(-w / 2, -h / 2 + r);
    shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.055,
      bevelEnabled: true,
      bevelThickness: 0.016,
      bevelSize: 0.016,
      bevelSegments: 4,
    });
    geo.center();
    return geo;
  }, []);

  useEffect(() => {
    return () => {
      strapTex.dispose();
      cardGeo.dispose();
    };
  }, [strapTex, cardGeo]);

  // Elastic spring chain so the lanyard stretches far and snaps back dynamically
  useSpringJoint(fixed as React.RefObject<RapierRigidBody>, j1 as React.RefObject<RapierRigidBody>, [
    [0, 0, 0],
    [0, 0, 0],
    SPRING_REST_LEN,
    SPRING_STIFFNESS,
    SPRING_DAMPING,
  ]);
  useSpringJoint(j1 as React.RefObject<RapierRigidBody>, j2 as React.RefObject<RapierRigidBody>, [
    [0, 0, 0],
    [0, 0, 0],
    SPRING_REST_LEN,
    SPRING_STIFFNESS,
    SPRING_DAMPING,
  ]);
  useSpringJoint(j2 as React.RefObject<RapierRigidBody>, j3 as React.RefObject<RapierRigidBody>, [
    [0, 0, 0],
    [0, 0, 0],
    SPRING_REST_LEN,
    SPRING_STIFFNESS,
    SPRING_DAMPING,
  ]);
  useSphericalJoint(j3 as React.RefObject<RapierRigidBody>, card as React.RefObject<RapierRigidBody>, [
    [0, 0, 0],
    [0, 1.5, 0],
  ]);

  // Keep fixed anchor aligned horizontally when resizing between mobile and desktop
  useEffect(() => {
    if (fixed.current) {
      const worldPerPx = viewport.height / Math.max(1, size.height);
      const liveY = baseAnchorY + smoothScrollY.current * worldPerPx;
      anchorPos.set(anchorX, liveY, 0);
      fixed.current.setTranslation({ x: anchorX, y: liveY, z: 0 }, true);
      [j1, j2, j3, card].forEach((ref) => ref.current?.wakeUp());
    }
  }, [anchorX, baseAnchorY, viewport.height, size.height, anchorPos]);

  useEffect(() => {
    onDragStateChange(Boolean(dragOffset));
    if (dragOffset) {
      document.body.style.cursor = 'grabbing';
    } else if (hovered) {
      document.body.style.cursor = 'grab';
    } else {
      document.body.style.cursor = 'auto';
    }
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered, dragOffset, onDragStateChange]);

  // Global window pointermove + pointerup tracking while dragging so you can swing anywhere
  // across the full screen without ever losing tracking or clipping at edges.
  useEffect(() => {
    if (!dragOffset) return;

    const updatePointerFromClient = (clientX: number, clientY: number) => {
      const rect = gl.domElement.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      pointerNdc.current.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.current.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (activePointerId.current !== null && e.pointerId !== activePointerId.current) {
        return;
      }
      updatePointerFromClient(e.clientX, e.clientY);
    };

    const releaseDrag = (e: PointerEvent) => {
      if (activePointerId.current !== null && e.pointerId !== activePointerId.current) {
        return;
      }
      activePointerId.current = null;

      const down = pointerDownScreen.current;
      pointerDownScreen.current = null;

      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 8) {
        // Short click: flip badge + gentle physical impulse
        setFlipped((f) => !f);
        pendingThrow.current = new THREE.Vector3(0.4, 0.9, 0.35);
      } else {
        // Apply live throw velocity on release
        const throwVel = smoothVelocity.current.clone();
        const maxThrow = 20;
        if (throwVel.length() > maxThrow) {
          throwVel.setLength(maxThrow);
        }
        pendingThrow.current = throwVel;
      }

      prevTargetPos.current = null;
      setDragOffset(false);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup', releaseDrag);
    window.addEventListener('pointercancel', releaseDrag);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', releaseDrag);
      window.removeEventListener('pointercancel', releaseDrag);
    };
  }, [dragOffset, gl.domElement]);

  const lerpedJ1 = useRef(new THREE.Vector3());
  const lerpedJ2 = useRef(new THREE.Vector3());
  const lerpedInit = useRef(false);
  const prevCardPos = useRef<THREE.Vector3 | null>(null);
  const blurSmoothed = useRef({ x: 0, y: 0 });
  const isCanvasBlurred = useRef(false);
  const scrollJoltRef = useRef({ x: 0, y: 0, torqueY: 0, torqueZ: 0 });

  // Shake & sway the lanyard physically in response to every page scroll
  useEffect(() => {
    if (!active) return;
    let lastScrollY = window.scrollY;
    let swaySign = 1;

    const onScroll = () => {
      const currentY = window.scrollY;
      const dy = currentY - lastScrollY;
      lastScrollY = currentY;
      if (Math.abs(dy) < 1) return;

      const clampedDy = THREE.MathUtils.clamp(dy, -140, 140);
      const dir = Math.sign(clampedDy);
      swaySign = -swaySign;

      // Inertia kick: scrolling down jerks badge slightly upward/sideways; scrolling up jerks opposite
      scrollJoltRef.current.y = THREE.MathUtils.clamp(
        scrollJoltRef.current.y + clampedDy * 0.032,
        -4.5,
        4.5
      );
      scrollJoltRef.current.x = THREE.MathUtils.clamp(
        scrollJoltRef.current.x + dir * Math.min(2.2, Math.abs(clampedDy) * 0.028) * (0.7 + 0.3 * swaySign),
        -5.0,
        5.0
      );
      scrollJoltRef.current.torqueY = THREE.MathUtils.clamp(
        scrollJoltRef.current.torqueY + dir * Math.abs(clampedDy) * 0.008 * swaySign,
        -1.2,
        1.2
      );
      scrollJoltRef.current.torqueZ = THREE.MathUtils.clamp(
        scrollJoltRef.current.torqueZ - dir * Math.abs(clampedDy) * 0.006,
        -0.9,
        0.9
      );
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [active]);

  useEffect(() => {
    return () => {
      gl.domElement.style.filter = '';
    };
  }, [gl.domElement]);

  useFrame((_, delta) => {
    const dt = Math.max(0.004, Math.min(delta, 0.04));

    if (!active) return;

    // Move the top anchor smoothly in lockstep with page scroll so the lanyard scrolls
    // naturally with the Hero section while remaining completely unclipped across the whole viewport.
    if (fixed.current) {
      const targetScroll = typeof window !== 'undefined' ? window.scrollY : 0;
      const scrollDiff = targetScroll - smoothScrollY.current;
      smoothScrollY.current += scrollDiff * Math.min(1, dt * 18);
      const worldPerPx = viewport.height / Math.max(1, size.height);
      const liveAnchorY = baseAnchorY + smoothScrollY.current * worldPerPx;
      anchorPos.set(anchorX, liveAnchorY, 0);
      fixed.current.setTranslation({ x: anchorX, y: liveAnchorY, z: 0 }, true);
    }

    // Initial drop-from-top entrance impulse with slight sway & 3D twist once loader lifts
    if (!hasDroppedIn.current && card.current) {
      hasDroppedIn.current = true;
      [j1, j2, j3, card].forEach((ref) => ref.current?.wakeUp());
      card.current.setLinvel({ x: -0.9, y: -1.8, z: 0.25 }, true);
      card.current.setAngvel({ x: 0.25, y: 1.8, z: -0.45 }, true);
    }

    if (dragOffset && card.current) {
      dragRaycaster.setFromCamera(pointerNdc.current, camera);
      if (dragRaycaster.ray.intersectPlane(dragPlane, hitPoint)) {
        targetPos.copy(hitPoint).sub(dragOffset);

        // Generous elastic stretch reach so you can pull the lanyard far across the whole screen
        tmpVec.copy(targetPos).sub(anchorPos);
        const maxReach = 9.5;
        if (tmpVec.length() > maxReach) {
          tmpVec.setLength(maxReach);
          targetPos.copy(anchorPos).add(tmpVec);
        }

        if (prevTargetPos.current) {
          tmpVec.copy(targetPos).sub(prevTargetPos.current).divideScalar(dt);
          smoothVelocity.current.lerp(tmpVec, 0.38);
        } else {
          smoothVelocity.current.set(0, 0, 0);
        }
        prevTargetPos.current = targetPos.clone();

        [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
        card.current.setNextKinematicTranslation({
          x: targetPos.x,
          y: targetPos.y,
          z: targetPos.z,
        });
      }
    } else if (pendingThrow.current && card.current) {
      const v = pendingThrow.current;
      pendingThrow.current = null;
      [card, j1, j2, j3].forEach((ref) => ref.current?.wakeUp());
      card.current.setLinvel({ x: v.x, y: v.y, z: v.z * 0.35 }, true);
      card.current.setAngvel(
        {
          x: THREE.MathUtils.clamp(-v.y * 0.25, -5, 5),
          y: THREE.MathUtils.clamp(v.x * 0.78, -8, 8),
          z: THREE.MathUtils.clamp(-v.x * 0.3, -4.5, 4.5),
        },
        true
      );
    }

    if (fixed.current && j1.current && j2.current && j3.current && card.current) {
      const t1 = j1.current.translation();
      const t2 = j2.current.translation();
      const t3 = j3.current.translation();
      const tf = fixed.current.translation();

      if (!lerpedInit.current) {
        lerpedJ1.current.set(t1.x, t1.y, t1.z);
        lerpedJ2.current.set(t2.x, t2.y, t2.z);
        lerpedInit.current = true;
      }

      const d1 = Math.max(0.1, Math.min(1, lerpedJ1.current.distanceTo(tmpVec.set(t1.x, t1.y, t1.z))));
      lerpedJ1.current.lerp(tmpVec, dt * (minSpeed + d1 * (maxSpeed - minSpeed)));

      const d2 = Math.max(0.1, Math.min(1, lerpedJ2.current.distanceTo(tmpVec.set(t2.x, t2.y, t2.z))));
      lerpedJ2.current.lerp(tmpVec, dt * (minSpeed + d2 * (maxSpeed - minSpeed)));

      curve.points[0].set(t3.x, t3.y, t3.z);
      curve.points[1].copy(lerpedJ2.current);
      curve.points[2].copy(lerpedJ1.current);
      curve.points[3].set(tf.x, tf.y, tf.z);

      if (band.current) {
        const geom = band.current.geometry as unknown as { setPoints: (pts: THREE.Vector3[]) => void };
        geom.setPoints(curve.getPoints(32));

        // Subtly thin the strap as it stretches far for realistic elastic feedback
        if (bandMat.current) {
          const stretchDist = curve.points[0].distanceTo(curve.points[3]);
          const stretchFactor = THREE.MathUtils.clamp((stretchDist - 2.75) / 5.2, 0, 1);
          bandMat.current.lineWidth = THREE.MathUtils.lerp(0.95, 0.56, stretchFactor);
        }
      }

      // Apply scroll-driven shake impulses on every scroll (works on both PC and mobile)
      if (!dragOffset) {
        const sj = scrollJoltRef.current;
        if (Math.abs(sj.x) > 0.01 || Math.abs(sj.y) > 0.01) {
          [j1, j2, j3, card].forEach((ref) => ref.current?.wakeUp());
          card.current.applyImpulse({ x: sj.x, y: sj.y, z: sj.x * 0.12 }, true);
          card.current.applyTorqueImpulse(
            { x: -sj.y * 0.05, y: sj.torqueY, z: sj.torqueZ },
            true
          );
          sj.x = 0;
          sj.y = 0;
          sj.torqueY = 0;
          sj.torqueZ = 0;
        }
      }

      // Apply live gyroscope tilt & reduced-sensitivity shake impulses on non-PC devices
      if (isNonPC && !dragOffset && gyroRef.current) {
        const g = gyroRef.current;

        // Smooth tilt sway from device orientation
        if (Math.abs(g.tiltX) > 0.06 || Math.abs(g.tiltZ) > 0.06) {
          card.current.applyImpulse(
            {
              x: g.tiltX * 13 * dt,
              y: 0,
              z: g.tiltZ * 7 * dt,
            },
            true
          );
        }

        // Controlled shake impulses from accelerometer jolts
        if (
          Math.abs(g.shakeX) > 0.01 ||
          Math.abs(g.shakeY) > 0.01 ||
          Math.abs(g.shakeZ) > 0.01
        ) {
          [j1, j2, j3, card].forEach((ref) => ref.current?.wakeUp());
          card.current.applyImpulse(
            {
              x: g.shakeX,
              y: g.shakeY,
              z: g.shakeZ * 0.35,
            },
            true
          );
          card.current.applyTorqueImpulse(
            {
              x: -g.shakeY * 0.04,
              y: g.shakeX * 0.09,
              z: -g.shakeX * 0.05,
            },
            true
          );
          g.shakeX = 0;
          g.shakeY = 0;
          g.shakeZ = 0;
        }
      }

      // Edge & corner bounce strictly on non-PC devices (phone / tablet)
      if (isNonPC && !dragOffset) {
        const pos = card.current.translation();
        const vel = card.current.linvel();
        const curAng = card.current.angvel();

        const halfW = viewport.width / 2;
        const halfH = viewport.height / 2;
        const padX = 0.86;
        const padY = 1.28;

        const minX = -halfW + padX;
        const maxX = halfW - padX;
        const minY = -halfH + padY;

        let hitX = false;
        let hitY = false;
        let nextX = pos.x;
        let nextY = pos.y;
        let nextVx = vel.x;
        let nextVy = vel.y;
        let spinY = curAng.y;
        let spinZ = curAng.z;

        if (maxX > minX) {
          if (pos.x < minX) {
            nextX = minX;
            if (vel.x < 0) {
              nextVx = Math.abs(vel.x) * 0.74 + 0.85;
              spinY += Math.min(3.5, Math.abs(vel.x) * 0.4);
              spinZ -= Math.min(2.2, Math.abs(vel.x) * 0.22);
            }
            hitX = true;
          } else if (pos.x > maxX) {
            nextX = maxX;
            if (vel.x > 0) {
              nextVx = -Math.abs(vel.x) * 0.74 - 0.85;
              spinY -= Math.min(3.5, Math.abs(vel.x) * 0.4);
              spinZ += Math.min(2.2, Math.abs(vel.x) * 0.22);
            }
            hitX = true;
          }
        }

        if (pos.y < minY) {
          nextY = minY;
          if (vel.y < 0) {
            nextVy = Math.abs(vel.y) * 0.7 + 1.1;
          }
          hitY = true;
        }

        if (hitX || hitY) {
          // Extra lively diagonal rebound when hitting a corner (both side + bottom)
          if (hitX && hitY) {
            nextVx *= 1.18;
            nextVy = Math.max(nextVy * 1.18, 2.2);
          }
          card.current.setTranslation({ x: nextX, y: nextY, z: pos.z }, true);
          card.current.setLinvel({ x: nextVx, y: nextVy, z: vel.z }, true);
          card.current.setAngvel({ x: curAng.x, y: spinY, z: spinZ }, true);
        }
      }

      // Gentle restoring torque + micro-jitter settle dampener so the badge hangs 100% calm at rest
      if (!dragOffset) {
        ang.copy(card.current.angvel());
        rot.copy(card.current.rotation());
        const lin = card.current.linvel();
        const linSpeed = Math.hypot(lin.x, lin.y, lin.z);
        const angSpeed = Math.hypot(ang.x, ang.y, ang.z);

        const nextAngX = ang.x;
        const nextAngY = ang.y - rot.y * 0.12 * (dt * 60);
        const nextAngZ = ang.z;

        if (linSpeed < 0.16 && angSpeed < 0.18) {
          // Smoothly bleed away tiny numerical vibrations once swinging has subsided
          card.current.setLinvel(
            { x: lin.x * 0.88, y: lin.y * 0.88, z: lin.z * 0.88 },
            false
          );
          card.current.setAngvel(
            { x: nextAngX * 0.86, y: nextAngY * 0.86, z: nextAngZ * 0.86 },
            false
          );
          [j1, j2, j3].forEach((ref) => {
            if (!ref.current) return;
            const jv = ref.current.linvel();
            if (Math.hypot(jv.x, jv.y, jv.z) < 0.2) {
              ref.current.setLinvel(
                { x: jv.x * 0.85, y: jv.y * 0.85, z: jv.z * 0.85 },
                false
              );
            }
          });
        } else {
          card.current.setAngvel({ x: nextAngX, y: nextAngY, z: nextAngZ }, false);
        }
      }
    }

    // Smooth click-to-flip rotation
    if (badgeVisualRef.current) {
      const target = flipped ? Math.PI : 0;
      flipAngle.current = THREE.MathUtils.lerp(flipAngle.current, target, Math.min(1, dt * 10));
      badgeVisualRef.current.rotation.y = flipAngle.current;
    }

    // Directional velocity motion blur on the 3D lanyard canvas when falling, dragged, or thrown fast
    if (card.current && blurFilterRef.current) {
      const cur = card.current.translation();
      let vx = 0;
      let vy = 0;
      if (prevCardPos.current) {
        vx = Math.abs(cur.x - prevCardPos.current.x) / dt;
        vy = Math.abs(cur.y - prevCardPos.current.y) / dt;
        prevCardPos.current.set(cur.x, cur.y, cur.z);
      } else {
        prevCardPos.current = new THREE.Vector3(cur.x, cur.y, cur.z);
      }

      const targetBlurX = Math.min(1.6, Math.max(0, (vx - 2.8) * 0.15));
      const targetBlurY = Math.min(1.6, Math.max(0, (vy - 2.8) * 0.15));
      blurSmoothed.current.x = THREE.MathUtils.lerp(blurSmoothed.current.x, targetBlurX, 0.28);
      blurSmoothed.current.y = THREE.MathUtils.lerp(blurSmoothed.current.y, targetBlurY, 0.28);

      if (blurSmoothed.current.x > 0.08 || blurSmoothed.current.y > 0.08) {
        if (!isCanvasBlurred.current) {
          gl.domElement.style.filter = 'url(#dipporto-lanyard-motion-blur)';
          isCanvasBlurred.current = true;
        }
        blurFilterRef.current.setAttribute(
          'stdDeviation',
          `${blurSmoothed.current.x.toFixed(2)} ${blurSmoothed.current.y.toFixed(2)}`
        );
      } else if (isCanvasBlurred.current) {
        blurFilterRef.current.setAttribute('stdDeviation', '0 0');
        gl.domElement.style.filter = '';
        isCanvasBlurred.current = false;
      }
    }
  });

  curve.curveType = 'chordal';

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onUserInteract();
    activePointerId.current = e.pointerId;
    pointerDownScreen.current = { x: e.clientX, y: e.clientY };

    const rect = gl.domElement.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      pointerNdc.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    }

    smoothVelocity.current.set(0, 0, 0);
    prevTargetPos.current = null;

    if (card.current) {
      const cardPos = card.current.translation();
      const grabPoint = new THREE.Vector3();
      if (e.ray.intersectPlane(dragPlane, grabPoint)) {
        setDragOffset(grabPoint.sub(new THREE.Vector3(cardPos.x, cardPos.y, cardPos.z)));
      } else {
        setDragOffset(
          new THREE.Vector3().copy(e.point).sub(new THREE.Vector3(cardPos.x, cardPos.y, cardPos.z))
        );
      }
    }
  };

  const ropeSegmentProps = {
    canSleep: false,
    colliders: false as const,
    angularDamping: 2.0,
    linearDamping: 1.8,
  };

  return (
    <>
      {/* Spawn above the top edge with zero initial joint stress so it falls cleanly into frame */}
      <group position={[initialAnchorX.current, initialAnchorY.current, 0]}>
        <RigidBody ref={fixed} {...ropeSegmentProps} type="fixed" />
        <RigidBody position={[0.28, 0.52, 0]} ref={j1} {...ropeSegmentProps} type="dynamic">
          <BallCollider args={[0.1]} mass={0.45} />
        </RigidBody>
        <RigidBody position={[0.56, 1.04, 0]} ref={j2} {...ropeSegmentProps} type="dynamic">
          <BallCollider args={[0.1]} mass={0.45} />
        </RigidBody>
        <RigidBody position={[0.84, 1.56, 0]} ref={j3} {...ropeSegmentProps} type="dynamic">
          <BallCollider args={[0.1]} mass={0.45} />
        </RigidBody>

        <RigidBody
          position={[0.84, 0.06, 0]}
          ref={card}
          canSleep={false}
          colliders={false}
          angularDamping={1.25}
          linearDamping={0.75}
          type={dragOffset ? 'kinematicPosition' : 'dynamic'}
        >
          <CuboidCollider args={[0.88, 1.32, 0.08]} mass={1.2} />
          <group
            ref={badgeVisualRef}
            onPointerOver={(e) => {
              e.stopPropagation();
              setHovered(true);
            }}
            onPointerOut={() => setHovered(false)}
            onPointerDown={handlePointerDown}
          >
            {/* Extruded matte monochrome chassis */}
            <mesh geometry={cardGeo} castShadow receiveShadow frustumCulled={false}>
              <meshPhysicalMaterial
                color="#141414"
                metalness={0.28}
                roughness={0.32}
                clearcoat={0.9}
                clearcoatRoughness={0.18}
              />
            </mesh>

            {/* Front printed face */}
            <mesh position={[0, 0, 0.045]} frustumCulled={false}>
              <planeGeometry args={[1.58, 2.46]} />
              <meshPhysicalMaterial
                map={frontTex}
                roughness={0.34}
                metalness={0.06}
                clearcoat={0.78}
                clearcoatRoughness={0.18}
              />
            </mesh>

            {/* Back printed face */}
            <mesh position={[0, 0, -0.045]} rotation={[0, Math.PI, 0]} frustumCulled={false}>
              <planeGeometry args={[1.58, 2.46]} />
              <meshPhysicalMaterial
                map={backTex}
                roughness={0.34}
                metalness={0.06}
                clearcoat={0.78}
                clearcoatRoughness={0.18}
              />
            </mesh>

            {/* Brushed metal lanyard clip assembly */}
            <mesh position={[0, 1.35, 0]} frustumCulled={false}>
              <boxGeometry args={[0.38, 0.22, 0.14]} />
              <meshStandardMaterial color="#b8b8b8" metalness={0.92} roughness={0.22} />
            </mesh>
            <mesh position={[0, 1.51, 0]} rotation={[0, 0, Math.PI / 2]} frustumCulled={false}>
              <torusGeometry args={[0.11, 0.025, 12, 24]} />
              <meshStandardMaterial color="#d4d4d4" metalness={0.95} roughness={0.18} />
            </mesh>
          </group>
        </RigidBody>
      </group>

      {/* Monochrome woven strap */}
      <mesh ref={band} frustumCulled={false}>
        <meshLineGeometry />
        <meshLineMaterial
          ref={bandMat}
          color="#ffffff"
          depthTest={false}
          resolution={[size.width, size.height]}
          useMap
          map={strapTex}
          repeat={[-3.5, 1]}
          lineWidth={0.95}
        />
      </mesh>
    </>
  );
}

export default function Lanyard3D({ eventSource, active = true }: Lanyard3DProps) {
  const [webglFailed, setWebglFailed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isNonPC, setIsNonPC] = useState(false);
  const [gyroReady, setGyroReady] = useState(false);
  const permissionRequestedRef = useRef(false);
  const blurFilterRef = useRef<SVGFEGaussianBlurElement>(null);
  const gyroRef = useRef<GyroState>({
    tiltX: 0,
    tiltZ: 0,
    shakeX: 0,
    shakeY: 0,
    shakeZ: 0,
  });

  const requestGyroPermission = async () => {
    if (gyroReady || permissionRequestedRef.current) return;
    permissionRequestedRef.current = true;
    try {
      const motionCtor = window.DeviceMotionEvent as DeviceMotionEventWithPermission | undefined;
      const orientCtor = window.DeviceOrientationEvent as
        | DeviceOrientationEventWithPermission
        | undefined;

      let granted = false;
      if (typeof motionCtor?.requestPermission === 'function') {
        const res = await motionCtor.requestPermission();
        if (res === 'granted') granted = true;
      }
      if (typeof orientCtor?.requestPermission === 'function') {
        const res = await orientCtor.requestPermission();
        if (res === 'granted') granted = true;
      }
      if (granted) {
        setGyroReady(true);
      } else {
        permissionRequestedRef.current = false;
      }
    } catch {
      permissionRequestedRef.current = false;
    }
  };

  // Detect non-PC devices (phones/tablets) and auto-enable gyro & shake with no UI button
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const mobileUA = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent);
    const nonPC = coarse || mobileUA;
    setIsNonPC(nonPC);

    if (!nonPC) return;

    const motionCtor = window.DeviceMotionEvent as DeviceMotionEventWithPermission | undefined;
    const orientCtor = window.DeviceOrientationEvent as
      | DeviceOrientationEventWithPermission
      | undefined;

    const requiresGesture =
      typeof motionCtor?.requestPermission === 'function' ||
      typeof orientCtor?.requestPermission === 'function';

    if (!requiresGesture) {
      if ('DeviceMotionEvent' in window || 'DeviceOrientationEvent' in window) {
        setGyroReady(true);
      }
      return;
    }

    // On iOS Safari, unlock motion sensors silently on the first touch anywhere on the page
    const unlockOnFirstTouch = () => {
      requestGyroPermission();
    };
    window.addEventListener('touchstart', unlockOnFirstTouch, { passive: true, once: true });
    window.addEventListener('pointerdown', unlockOnFirstTouch, { passive: true, once: true });
    return () => {
      window.removeEventListener('touchstart', unlockOnFirstTouch);
      window.removeEventListener('pointerdown', unlockOnFirstTouch);
    };
  }, []);

  // Subscribe to deviceorientation (tilt) & devicemotion (reduced-sensitivity shake) on non-PC
  useEffect(() => {
    if (!isNonPC || !gyroReady || !active) return;

    let lastGravityX = 0;
    let lastGravityY = 0;
    let lastGravityZ = 0;
    let hasGravityBaseline = false;

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null && e.beta === null) return;
      const gamma = THREE.MathUtils.clamp((e.gamma ?? 0) / 55, -1, 1);
      const betaOffset = THREE.MathUtils.clamp(((e.beta ?? 45) - 45) / 55, -0.8, 0.8);
      gyroRef.current.tiltX = gamma;
      gyroRef.current.tiltZ = betaOffset;
    };

    const onMotion = (e: DeviceMotionEvent) => {
      let ax = 0;
      let ay = 0;
      let az = 0;

      if (
        e.acceleration &&
        (e.acceleration.x !== null || e.acceleration.y !== null || e.acceleration.z !== null)
      ) {
        ax = e.acceleration.x ?? 0;
        ay = e.acceleration.y ?? 0;
        az = e.acceleration.z ?? 0;
      } else if (e.accelerationIncludingGravity) {
        const gx = e.accelerationIncludingGravity.x ?? 0;
        const gy = e.accelerationIncludingGravity.y ?? 0;
        const gz = e.accelerationIncludingGravity.z ?? 0;
        if (!hasGravityBaseline) {
          lastGravityX = gx;
          lastGravityY = gy;
          lastGravityZ = gz;
          hasGravityBaseline = true;
        } else {
          lastGravityX = lastGravityX * 0.82 + gx * 0.18;
          lastGravityY = lastGravityY * 0.82 + gy * 0.18;
          lastGravityZ = lastGravityZ * 0.82 + gz * 0.18;
          ax = gx - lastGravityX;
          ay = gy - lastGravityY;
          az = gz - lastGravityZ;
        }
      }

      // Higher deadzone & calmer multipliers so everyday hand movement won't jitter the badge
      const mag = Math.hypot(ax, ay, az);
      if (mag > 4.4) {
        gyroRef.current.shakeX = THREE.MathUtils.clamp(
          gyroRef.current.shakeX - ax * 0.22,
          -6.5,
          6.5
        );
        gyroRef.current.shakeY = THREE.MathUtils.clamp(
          gyroRef.current.shakeY + ay * 0.18,
          -5.5,
          5.5
        );
        gyroRef.current.shakeZ = THREE.MathUtils.clamp(
          gyroRef.current.shakeZ + az * 0.14,
          -4.5,
          4.5
        );
      }
    };

    window.addEventListener('deviceorientation', onOrientation, { passive: true });
    window.addEventListener('devicemotion', onMotion, { passive: true });
    return () => {
      window.removeEventListener('deviceorientation', onOrientation);
      window.removeEventListener('devicemotion', onMotion);
    };
  }, [isNonPC, gyroReady, active]);

  if (webglFailed) {
    return null;
  }

  return (
    <div
      className={`relative w-full h-full touch-none select-none ${
        isDragging ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      role="region"
      aria-label="Interactive 3D MyPorto lanyard badge. Drag and throw to swing, shake your device, or click to flip."
    >
      <svg aria-hidden="true" className="pointer-events-none fixed h-0 w-0 overflow-hidden">
        <defs>
          <filter
            id="dipporto-lanyard-motion-blur"
            x="-10%"
            y="-10%"
            width="120%"
            height="120%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur ref={blurFilterRef} in="SourceGraphic" stdDeviation="0 0" />
          </filter>
        </defs>
      </svg>

      <Canvas
        camera={{
          position: [0, 0, typeof window !== 'undefined' && window.innerWidth < 1024 ? 17.5 : 14],
          fov: 24,
        }}
        dpr={[1, 2]}
        eventSource={eventSource as React.RefObject<HTMLElement> | undefined}
        eventPrefix="client"
        style={{ pointerEvents: isDragging ? 'auto' : 'none' }}
        gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color(0x000000), 0);
        }}
        onError={() => setWebglFailed(true)}
      >
        <ambientLight intensity={1.85} />
        <Suspense fallback={null}>
          <Physics paused={!active} interpolate gravity={[0, -32, 0]} timeStep={1 / 120}>
            <Band
              active={active}
              isNonPC={isNonPC}
              onDragStateChange={setIsDragging}
              onUserInteract={requestGyroPermission}
              blurFilterRef={blurFilterRef}
              gyroRef={gyroRef}
            />
          </Physics>
        </Suspense>
        <Environment blur={0.75}>
          <Lightformer
            intensity={2.4}
            color="#ffffff"
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.15, 1]}
          />
          <Lightformer
            intensity={3.0}
            color="#ffffff"
            position={[-2, 1, 4]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.15, 1]}
          />
          <Lightformer
            intensity={2.8}
            color="#e5e5e5"
            position={[2, 2, 3]}
            rotation={[0, 0, -Math.PI / 3]}
            scale={[100, 0.15, 1]}
          />
          <Lightformer
            intensity={7}
            color="#ffffff"
            position={[-9, 2, 12]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 10, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  );
}
