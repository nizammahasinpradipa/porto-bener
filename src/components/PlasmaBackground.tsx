'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

interface PlasmaBackgroundProps {
  /** Monochrome satin tint in normalized RGB */
  color?: [number, number, number];
  /** Animation speed multiplier */
  speed?: number;
  /** Scale of the twisting satin plasma folds */
  scale?: number;
  /** Atmospheric opacity / brightness cap so foreground text stays crisp */
  opacity?: number;
  /** Enable smooth cursor-following twist */
  mouseInteractive?: boolean;
}

const DEFAULT_COLOR: [number, number, number] = [0.76, 0.76, 0.76];

const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Faithful React Bits Plasma shader: twisting volumetric folds of satin monochrome light
// that slowly shift and turn toward the cursor (WebGL1 & WebGL2 compatible).
const FRAGMENT_SHADER = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec3 u_color;
  uniform float u_speed;
  uniform float u_scale;
  uniform float u_opacity;
  uniform vec2 u_mouse;
  uniform float u_mouseInteractive;

  // WebGL1-safe tanh approximation
  vec4 safeTanh(vec4 x) {
    vec4 e = exp(clamp(2.0 * x, -20.0, 20.0));
    return (e - 1.0) / (e + 1.0);
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  void main() {
    vec2 res = u_resolution;
    vec2 center = res * 0.5;
    vec2 frag = (gl_FragCoord.xy - center) / max(u_scale, 0.1) + center;

    // Smooth cursor shift so the satin folds lean & turn toward the pointer
    if (u_mouseInteractive > 0.5) {
      vec2 mouseOffset = (u_mouse - center) * 0.00022;
      frag += mouseOffset * length(frag - center) * 0.5;
    }

    float t = u_time * u_speed;
    float d = 0.0;
    float z = 0.0;
    vec4 O = vec4(0.0);

    vec2 mNorm = (u_mouse / max(res, vec2(1.0))) - 0.5;
    float yaw = u_mouseInteractive > 0.5 ? mNorm.x * 0.45 : 0.0;
    mat2 rotXZ = mat2(cos(yaw), -sin(yaw), sin(yaw), cos(yaw));
    vec3 rayDir = normalize(vec3(frag - 0.5 * res, res.y));

    // Volumetric raymarch through twisting sine/cosine satin light folds
    for (int stepIdx = 0; stepIdx < 40; stepIdx++) {
      vec3 p = z * rayDir;
      p.z -= 4.0;
      p.xz = rotXZ * p.xz;

      vec3 a = p;
      float f = 1.0;
      for (int j = 0; j < 4; j++) {
        a += sin(a.yzx * f + t * 0.65) / f;
        f += 1.0;
      }

      d = 0.015 + 0.11 * abs(length(a.xy) - 1.55 - 0.35 * sin(a.z * 0.8 + t * 0.45));
      z += d;

      float fold = 0.5 + 0.5 * cos(a.z * 1.4 + t * 0.4);
      O += vec4(fold, fold, fold, 1.0) / max(d * 60.0, 0.001);
    }

    vec4 mapped = safeTanh(O * 0.14);
    float lum = dot(mapped.rgb, vec3(0.3333));

    // Sculpt deeper obsidian contrast so only the soft crests of the satin folds glow
    float satin = pow(clamp(lum, 0.0, 1.0), 2.2) * u_opacity;
    vec3 ground = vec3(0.022);
    vec3 finalColor = ground + u_color * satin;

    // Micro-grain to prevent 8-bit dark monochrome banding
    float grain = (hash(gl_FragCoord.xy + fract(u_time) * 100.0) - 0.5) * 0.014;
    finalColor = clamp(finalColor + grain, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export function PlasmaBackground({
  color = DEFAULT_COLOR,
  speed = 0.55,
  scale = 1.15,
  opacity = 0.2,
  mouseInteractive = true,
}: PlasmaBackgroundProps) {
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [colorR, colorG, colorB] = color;

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
    const uColor = gl.getUniformLocation(program, 'u_color');
    const uSpeed = gl.getUniformLocation(program, 'u_speed');
    const uScale = gl.getUniformLocation(program, 'u_scale');
    const uOpacity = gl.getUniformLocation(program, 'u_opacity');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uMouseInteractive = gl.getUniformLocation(program, 'u_mouseInteractive');

    // Render at slightly reduced DPR (capped at 1.0) so raymarched plasma stays silky 60fps
    // on laptops & phones alongside the 3D lanyard
    const dpr = Math.min(window.devicePixelRatio || 1, 1.0);
    const targetMouse = { x: window.innerWidth * 0.5 * dpr, y: window.innerHeight * 0.5 * dpr };
    const smoothMouse = { x: targetMouse.x, y: targetMouse.y };

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
      targetMouse.x = e.clientX * dpr;
      targetMouse.y = (window.innerHeight - e.clientY) * dpr;
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });
    if (!prefersReducedMotion && mouseInteractive) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
    }

    const start = performance.now();
    let rafId: number | null = null;

    const drawFrame = (elapsed: number) => {
      smoothMouse.x += (targetMouse.x - smoothMouse.x) * 0.05;
      smoothMouse.y += (targetMouse.y - smoothMouse.y) * 0.05;

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, elapsed);
      gl.uniform3f(uColor, colorR, colorG, colorB);
      gl.uniform1f(uSpeed, speed);
      gl.uniform1f(uScale, scale);
      gl.uniform1f(uOpacity, opacity);
      gl.uniform2f(uMouse, smoothMouse.x, smoothMouse.y);
      gl.uniform1f(uMouseInteractive, !prefersReducedMotion && mouseInteractive ? 1.0 : 0.0);

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
      drawFrame(2.4);
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
  }, [prefersReducedMotion, colorR, colorG, colorB, speed, scale, opacity, mouseInteractive]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
