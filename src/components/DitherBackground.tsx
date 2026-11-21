'use client';

import { useEffect, useRef } from 'react';

interface DitherBackgroundProps {
  waveSpeed?: number;
  waveFrequency?: number;
  waveAmplitude?: number;
  colorNum?: number;
  pixelSize?: number;
  waveColor?: [number, number, number];
  enableMouseInteraction?: boolean;
  mouseRadius?: number;
}

const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

// Faithful React Bits Dither shader: domain-warped fBM Perlin waves + 8x8 Bayer ordered dithering
const FRAGMENT_SHADER = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_waveSpeed;
  uniform float u_waveFrequency;
  uniform float u_waveAmplitude;
  uniform vec3 u_waveColor;
  uniform float u_colorNum;
  uniform float u_pixelSize;
  uniform vec2 u_mouse;
  uniform float u_enableMouse;
  uniform float u_mouseRadius;

  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  vec2 fade(vec2 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

  float cnoise(vec2 P) {
    vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
    vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
    Pi = mod289(Pi);
    vec4 ix = Pi.xzxz;
    vec4 iy = Pi.yyww;
    vec4 fx = Pf.xzxz;
    vec4 fy = Pf.yyww;
    vec4 i = permute(permute(ix) + iy);
    vec4 gx = fract(i * (1.0 / 41.0)) * 2.0 - 1.0;
    vec4 gy = abs(gx) - 0.5;
    vec4 tx = floor(gx + 0.5);
    gx = gx - tx;
    vec2 g00 = vec2(gx.x, gy.x);
    vec2 g10 = vec2(gx.y, gy.y);
    vec2 g01 = vec2(gx.z, gy.z);
    vec2 g11 = vec2(gx.w, gy.w);
    vec4 norm = taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)));
    g00 *= norm.x;
    g01 *= norm.y;
    g10 *= norm.z;
    g11 *= norm.w;
    float n00 = dot(g00, vec2(fx.x, fy.x));
    float n10 = dot(g10, vec2(fx.y, fy.y));
    float n01 = dot(g01, vec2(fx.z, fy.z));
    float n11 = dot(g11, vec2(fx.w, fy.w));
    vec2 fade_xy = fade(Pf.xy);
    vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
    return 2.3 * mix(n_x.x, n_x.y, fade_xy.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amp = 1.0;
    float freq = u_waveFrequency;
    for (int i = 0; i < 4; i++) {
      value += amp * abs(cnoise(p));
      p *= freq;
      amp *= u_waveAmplitude;
    }
    return value;
  }

  float pattern(vec2 p) {
    vec2 p2 = p - u_time * u_waveSpeed;
    return fbm(p + fbm(p2));
  }

  // Exact 8x8 Bayer ordered dithering threshold (WebGL1 compatible lookup)
  float bayer8(vec2 cell) {
    int x = int(mod(cell.x, 8.0));
    int y = int(mod(cell.y, 8.0));
    int index = y * 8 + x;

    if (index == 0) return 0.0 / 64.0;
    if (index == 1) return 48.0 / 64.0;
    if (index == 2) return 12.0 / 64.0;
    if (index == 3) return 60.0 / 64.0;
    if (index == 4) return 3.0 / 64.0;
    if (index == 5) return 51.0 / 64.0;
    if (index == 6) return 15.0 / 64.0;
    if (index == 7) return 63.0 / 64.0;
    if (index == 8) return 32.0 / 64.0;
    if (index == 9) return 16.0 / 64.0;
    if (index == 10) return 44.0 / 64.0;
    if (index == 11) return 28.0 / 64.0;
    if (index == 12) return 35.0 / 64.0;
    if (index == 13) return 19.0 / 64.0;
    if (index == 14) return 47.0 / 64.0;
    if (index == 15) return 31.0 / 64.0;
    if (index == 16) return 8.0 / 64.0;
    if (index == 17) return 56.0 / 64.0;
    if (index == 18) return 4.0 / 64.0;
    if (index == 19) return 52.0 / 64.0;
    if (index == 20) return 11.0 / 64.0;
    if (index == 21) return 59.0 / 64.0;
    if (index == 22) return 7.0 / 64.0;
    if (index == 23) return 55.0 / 64.0;
    if (index == 24) return 40.0 / 64.0;
    if (index == 25) return 24.0 / 64.0;
    if (index == 26) return 36.0 / 64.0;
    if (index == 27) return 20.0 / 64.0;
    if (index == 28) return 43.0 / 64.0;
    if (index == 29) return 27.0 / 64.0;
    if (index == 30) return 39.0 / 64.0;
    if (index == 31) return 23.0 / 64.0;
    if (index == 32) return 2.0 / 64.0;
    if (index == 33) return 50.0 / 64.0;
    if (index == 34) return 14.0 / 64.0;
    if (index == 35) return 62.0 / 64.0;
    if (index == 36) return 1.0 / 64.0;
    if (index == 37) return 49.0 / 64.0;
    if (index == 38) return 13.0 / 64.0;
    if (index == 39) return 61.0 / 64.0;
    if (index == 40) return 34.0 / 64.0;
    if (index == 41) return 18.0 / 64.0;
    if (index == 42) return 46.0 / 64.0;
    if (index == 43) return 30.0 / 64.0;
    if (index == 44) return 33.0 / 64.0;
    if (index == 45) return 17.0 / 64.0;
    if (index == 46) return 45.0 / 64.0;
    if (index == 47) return 29.0 / 64.0;
    if (index == 48) return 10.0 / 64.0;
    if (index == 49) return 58.0 / 64.0;
    if (index == 50) return 6.0 / 64.0;
    if (index == 51) return 54.0 / 64.0;
    if (index == 52) return 9.0 / 64.0;
    if (index == 53) return 57.0 / 64.0;
    if (index == 54) return 5.0 / 64.0;
    if (index == 55) return 53.0 / 64.0;
    if (index == 56) return 42.0 / 64.0;
    if (index == 57) return 26.0 / 64.0;
    if (index == 58) return 38.0 / 64.0;
    if (index == 59) return 22.0 / 64.0;
    if (index == 60) return 41.0 / 64.0;
    if (index == 61) return 25.0 / 64.0;
    if (index == 62) return 37.0 / 64.0;
    return 21.0 / 64.0;
  }

  void main() {
    // Snap fragment coordinate to pixel grid for crisp React Bits dither cells
    vec2 cell = floor(gl_FragCoord.xy / u_pixelSize);
    vec2 snappedCoord = (cell + 0.5) * u_pixelSize;

    vec2 uv = snappedCoord / u_resolution;
    vec2 centered = uv - 0.5;
    centered.x *= u_resolution.x / u_resolution.y;

    float f = pattern(centered * 1.45);

    if (u_enableMouse > 0.5) {
      vec2 mouseUv = (u_mouse / u_resolution) - 0.5;
      mouseUv.x *= u_resolution.x / u_resolution.y;
      float dist = length(centered - mouseUv);
      float effect = 1.0 - smoothstep(0.0, u_mouseRadius, dist);
      f -= 0.45 * effect;
    }

    vec3 baseColor = mix(vec3(0.039), u_waveColor, clamp(f, 0.0, 1.0));

    // Apply ordered Bayer dithering quantization
    float threshold = bayer8(cell) - 0.25;
    float stepSize = 1.0 / max(1.0, u_colorNum - 1.0);
    vec3 dithered = baseColor + threshold * stepSize;
    dithered = clamp(dithered - 0.14, 0.039, 1.0);
    dithered = floor(dithered * (u_colorNum - 1.0) + 0.5) / max(1.0, u_colorNum - 1.0);
    dithered = max(dithered, vec3(0.039));

    gl_FragColor = vec4(dithered, 1.0);
  }
`;

export function DitherBackground({
  waveSpeed = 0.06,
  waveFrequency = 3.0,
  waveAmplitude = 0.3,
  colorNum = 4,
  pixelSize = 2.5,
  waveColor = [0.46, 0.46, 0.46],
  enableMouseInteraction = true,
  mouseRadius = 0.3,
}: DitherBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveR, waveG, waveB] = waveColor;

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
    const uWaveSpeed = gl.getUniformLocation(program, 'u_waveSpeed');
    const uWaveFreq = gl.getUniformLocation(program, 'u_waveFrequency');
    const uWaveAmp = gl.getUniformLocation(program, 'u_waveAmplitude');
    const uWaveColor = gl.getUniformLocation(program, 'u_waveColor');
    const uColorNum = gl.getUniformLocation(program, 'u_colorNum');
    const uPixelSize = gl.getUniformLocation(program, 'u_pixelSize');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');
    const uEnableMouse = gl.getUniformLocation(program, 'u_enableMouse');
    const uMouseRadius = gl.getUniformLocation(program, 'u_mouseRadius');

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: -9999, y: -9999 };

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
      mouse.x = e.clientX * dpr;
      mouse.y = (window.innerHeight - e.clientY) * dpr;
    };

    resize();
    window.addEventListener('resize', resize, { passive: true });
    if (enableMouseInteraction) {
      window.addEventListener('pointermove', onPointerMove, { passive: true });
    }

    const start = performance.now();
    let rafId = 0;

    const render = (now: number) => {
      const elapsed = (now - start) * 0.001;

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, elapsed);
      gl.uniform1f(uWaveSpeed, waveSpeed);
      gl.uniform1f(uWaveFreq, waveFrequency);
      gl.uniform1f(uWaveAmp, waveAmplitude);
      gl.uniform3f(uWaveColor, waveR, waveG, waveB);
      gl.uniform1f(uColorNum, colorNum);
      gl.uniform1f(uPixelSize, pixelSize * dpr);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uEnableMouse, enableMouseInteraction ? 1.0 : 0.0);
      gl.uniform1f(uMouseRadius, mouseRadius);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafId = window.requestAnimationFrame(render);
    };

    rafId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [
    waveSpeed,
    waveFrequency,
    waveAmplitude,
    colorNum,
    pixelSize,
    waveR,
    waveG,
    waveB,
    enableMouseInteraction,
    mouseRadius,
  ]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
