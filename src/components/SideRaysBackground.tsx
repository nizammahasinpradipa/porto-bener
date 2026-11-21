'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

interface SideRaysBackgroundProps {
  /** Primary light origin in UV space [0..1] (defaults to upper-left side) */
  origin?: [number, number];
  /** Light ray tint in normalized RGB (strict monochrome silver-white) */
  rayColor?: [number, number, number];
  /** Shimmer animation speed */
  speed?: number;
  /** Angular spread of the fanning shafts */
  spread?: number;
  /** Overall intensity (kept atmospheric so foreground text keeps high contrast) */
  intensity?: number;
  /** How much the beams lean toward the pointer */
  mouseInfluence?: number;
}

const DEFAULT_ORIGIN: [number, number] = [-0.08, 0.92];
const DEFAULT_RAY_COLOR: [number, number, number] = [0.94, 0.94, 0.94];

const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Volumetric side-fanning shafts of monochrome light that shimmer slowly and lean toward the cursor
const FRAGMENT_SHADER = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_origin;
  uniform vec3 u_rayColor;
  uniform float u_speed;
  uniform float u_spread;
  uniform float u_intensity;
  uniform vec2 u_mouse;
  uniform float u_mouseInfluence;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float rayShafts(vec2 uv, vec2 origin, vec2 aimDir, float t, float spreadScale) {
    vec2 delta = uv - origin;
    float dist = length(delta);
    vec2 dir = delta / max(dist, 0.0001);

    // Alignment with main diagonal fan direction
    float cosAngle = dot(dir, aimDir);
    float cone = pow(max(0.0, cosAngle), 1.35 / max(0.35, spreadScale));

    // Signed angular coordinate for individual volumetric shafts
    float angle = atan(delta.y, delta.x);

    // Layered slowly-shimmering volumetric beams
    float s1 = 0.5 + 0.5 * sin(angle * 17.0 + t * 0.55 + noise(vec2(angle * 3.0, t * 0.12)) * 2.1);
    float s2 = 0.5 + 0.5 * cos(angle * 29.0 - t * 0.38 + noise(vec2(angle * 5.0, t * 0.16)) * 1.6);
    float s3 = 0.5 + 0.5 * sin(angle * 9.0 + t * 0.22);

    float beams = pow(s1, 2.2) * 0.55 + pow(s2, 2.8) * 0.32 + pow(s3, 1.6) * 0.25;

    // Soft atmospheric distance attenuation
    float falloff = exp(-dist * 0.92) * smoothstep(2.25, 0.12, dist);

    // Subtle organic dust shimmer along shaft length
    float mist = 0.84 + 0.16 * noise(vec2(angle * 4.0 + t * 0.08, dist * 2.4 - t * 0.14));

    return cone * (0.28 + beams * 0.92) * falloff * mist;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution;
    float aspect = u_resolution.x / max(u_resolution.y, 1.0);

    vec2 p = vec2(uv.x * aspect, uv.y);
    vec2 origin = vec2(u_origin.x * aspect, u_origin.y);

    // Base diagonal direction fanning from the upper-left side into the page
    vec2 baseAim = normalize(vec2(0.86, -0.48));

    // Gently lean the shafts toward the cursor
    vec2 mouseP = vec2(u_mouse.x * aspect, u_mouse.y);
    vec2 mouseDir = normalize(mouseP - origin + vec2(0.0001));
    vec2 aim = normalize(mix(baseAim, mouseDir, u_mouseInfluence));

    float t = u_time * u_speed;

    // Primary side rays fanning from left/top-left
    float primaryRays = rayShafts(p, origin, aim, t, u_spread);

    // Subtle secondary ambient beam from the opposite lower-right edge for depth on scroll
    vec2 origin2 = vec2(1.08 * aspect, 0.18);
    vec2 aim2 = normalize(mix(vec2(-0.88, 0.42), normalize(mouseP - origin2 + vec2(0.0001)), u_mouseInfluence * 0.5));
    float secondaryRays = rayShafts(p, origin2, aim2, t * 0.8 + 4.2, u_spread * 0.85) * 0.42;

    // Soft source glow near the side origin
    float sourceBloom = exp(-length(p - origin) * 1.9) * 0.22;

    float totalLight = clamp((primaryRays + secondaryRays + sourceBloom) * u_intensity, 0.0, 0.62);

    // Deep #0a0a0a base + crisp monochrome silver-white shafts
    vec3 ground = vec3(0.0392);
    vec3 color = ground + u_rayColor * totalLight;

    // Ultra-fine dithering noise to eliminate 8-bit monochrome gradient banding
    float grain = (hash(gl_FragCoord.xy + fract(u_time) * 100.0) - 0.5) * 0.014;
    color = clamp(color + grain, 0.0, 1.0);

    gl_FragColor = vec4(color, 1.0);
  }
`;

export function SideRaysBackground({
  origin = DEFAULT_ORIGIN,
  rayColor = DEFAULT_RAY_COLOR,
  speed = 0.85,
  spread = 1.05,
  intensity = 0.56,
  mouseInfluence = 0.18,
}: SideRaysBackgroundProps) {
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [originX, originY] = origin;
  const [colorR, colorG, colorB] = rayColor;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    });
    if (!gl) return;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      return;
    }

    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uOrigin = gl.getUniformLocation(program, 'u_origin');
    const uRayColor = gl.getUniformLocation(program, 'u_rayColor');
    const uSpeed = gl.getUniformLocation(program, 'u_speed');
    const uSpread = gl.getUniformLocation(program, 'u_spread');
    const uIntensity = gl.getUniformLocation(program, 'u_intensity');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uMouseInfluence = gl.getUniformLocation(program, 'u_mouseInfluence');

    // Cap DPR at 1.5 for silky 60fps alongside the 3D lanyard
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const targetMouse = { x: 0.58, y: 0.44 };
    const smoothMouse = { x: 0.58, y: 0.44 };

    const resize = () => {
      const w = Math.max(1, Math.floor(window.innerWidth * dpr));
      const h = Math.max(1, Math.floor(window.innerHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const onPointerMove = (e: PointerEvent) => {
      targetMouse.x = e.clientX / Math.max(1, window.innerWidth);
      targetMouse.y = 1 - e.clientY / Math.max(1, window.innerHeight);
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });
    if (!prefersReducedMotion && mouseInfluence > 0) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
    }

    const start = performance.now();
    let rafId: number | null = null;

    const drawFrame = (elapsed: number) => {
      smoothMouse.x += (targetMouse.x - smoothMouse.x) * 0.045;
      smoothMouse.y += (targetMouse.y - smoothMouse.y) * 0.045;

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uOrigin, originX, originY);
      gl.uniform3f(uRayColor, colorR, colorG, colorB);
      gl.uniform1f(uSpeed, speed);
      gl.uniform1f(uSpread, spread);
      gl.uniform1f(uIntensity, intensity);
      gl.uniform2f(uMouse, smoothMouse.x, smoothMouse.y);
      gl.uniform1f(uMouseInfluence, prefersReducedMotion ? 0 : mouseInfluence);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const render = (now: number) => {
      if (document.hidden) {
        rafId = window.requestAnimationFrame(render);
        return;
      }
      drawFrame((now - start) * 0.001);
      rafId = window.requestAnimationFrame(render);
    };

    if (prefersReducedMotion) {
      // Single calm static frame when user prefers reduced motion
      drawFrame(1.2);
    } else {
      rafId = window.requestAnimationFrame(render);
    }

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [
    prefersReducedMotion,
    originX,
    originY,
    colorR,
    colorG,
    colorB,
    speed,
    spread,
    intensity,
    mouseInfluence,
  ]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
