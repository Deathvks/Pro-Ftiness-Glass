/* frontend/src/components/LiquidGlassNavShader.jsx */
import React, { useEffect, useRef } from 'react';

const VERT = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
precision highp int;

uniform vec2  uRes;
uniform float uTime;
uniform float uDpr;
uniform vec4  uLens;        // xy: lens center (device px), z: radius, w: press scale
uniform vec4  uMotion;      // xy: dir, z: stretch, w: wobble
uniform float uRefract;
uniform vec3  uAccent;
uniform int   uRippleCount;
uniform vec4  uRipples[8];

out vec4 outColor;

vec2 rippleOffset(vec2 frag) {
  vec2 off = vec2(0.0);
  for (int i = 0; i < 8; i++) {
    if (i >= uRippleCount) break;
    vec4 rp = uRipples[i];
    vec2 d = frag - rp.xy;
    float dist = max(length(d), 1.0);
    float front = rp.z * 400.0 * uDpr;
    float x = (dist - front) / (60.0 * uDpr);
    float wave = sin(x * 6.2831) * exp(-x * x * 3.0);
    float atten = exp(-rp.z * 2.5) * exp(-dist / (400.0 * uDpr));
    off += (d / dist) * wave * atten * rp.w * 10.0 * uDpr;
  }
  return off;
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 roff = rippleOffset(frag);
  vec2 uv = clamp((frag + roff) / uRes, 0.0, 1.0);

  // Translucent base for the navbar capsule
  vec3 baseCol = mix(vec3(0.08, 0.12, 0.20), vec3(0.04, 0.07, 0.12), uv.y);
  float topRim = smoothstep(1.5 * uDpr, 0.0, uRes.y - frag.y) * 0.45;
  float botRim = smoothstep(1.5 * uDpr, 0.0, frag.y) * 0.25;
  vec3 col = baseCol + topRim - botRim;

  // Lens coordinate space
  vec2 lensC = uLens.xy;
  float R = uLens.z * uLens.w;

  vec2 q = (frag + roff) - lensC;
  vec2 dir = uMotion.xy;
  float stretch = uMotion.z;
  if (stretch > 0.001) {
    vec2 tangent = vec2(dir.y, -dir.x);
    float a = dot(q, dir) / (1.0 + stretch);
    float b = dot(q, tangent) * (1.0 + stretch * 0.5);
    q = dir * a + tangent * b;
  }

  // Organic wobble
  float ang = atan(q.y, q.x);
  float wob = uMotion.w * (0.025 * sin(ang * 3.0 + uTime * 2.5) + 0.015 * sin(ang * 5.0 - uTime * 3.0));
  float r = length(q);
  float Rw = R * (1.0 + wob);
  float d = r - Rw;
  float aa = 1.5 * uDpr;
  float inside = smoothstep(aa, -aa, d);

  // Soft drop shadow under the lens
  vec2 shq = frag - (lensC - vec2(0.0, R * 0.25));
  float shadow = smoothstep(R * 1.3, R * 0.5, length(shq)) * 0.25 * (1.0 - inside);
  col *= (1.0 - shadow);

  if (inside > 0.0) {
    float r01 = clamp(r / Rw, 0.0, 1.0);
    float h = sqrt(max(1.0 - r01 * r01, 0.0));
    vec3 N = normalize(vec3(q / Rw, h * 1.25));

    float bend = 1.0 - h;
    float ca = 0.16 * uRefract;

    // Specular lighting from top-left key light
    vec3 L = normalize(vec3(-0.35, 0.65, 0.8));
    vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
    float ndh = max(dot(N, H), 0.0);
    float spec = pow(ndh, 75.0) * 0.95 + pow(ndh, 14.0) * 0.25;
    float fres = pow(1.0 - max(N.z, 0.0), 2.2);

    // Inner glass refraction + chromatic edge
    vec3 glass = baseCol;
    glass.r += bend * ca * 0.6;
    glass.b += bend * ca * 0.4;
    glass = mix(glass, uAccent, 0.28 * (1.0 - r01 * 0.5));
    glass += spec + fres * 0.22;
    glass += smoothstep(aa * 2.2, 0.0, abs(d)) * 0.35; // Bright rim line

    col = mix(col, glass, inside);
  }

  // Alpha gradient on borders for smooth capsule blend
  outColor = vec4(col, 0.82);
}`;

function compileProgram(gl) {
  const make = (type, src) => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('NavShader error:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  };
  const vs = make(gl.VERTEX_SHADER, VERT);
  const fs = make(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  if (!prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    gl.deleteProgram(prog);
    return null;
  }
  return prog;
}

export default function LiquidGlassNavShader({ activeX = 0, isJumping = false }) {
  const canvasRef = useRef(null);
  const targetXRef = useRef(activeX);
  const currentXRef = useRef(activeX);
  const ripplesRef = useRef([]);

  useEffect(() => {
    targetXRef.current = activeX;
    // Add ripple on tab change
    if (activeX > 0) {
      ripplesRef.current.push({
        x: activeX,
        y: 32,
        t0: performance.now() / 1000,
        amp: 0.8
      });
      if (ripplesRef.current.length > 8) ripplesRef.current.shift();
    }
  }, [activeX]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance'
    });
    if (!gl) return;

    const program = compileProgram(gl);
    if (!program) return;
    gl.useProgram(program);

    const uRes = gl.getUniformLocation(program, 'uRes');
    const uTime = gl.getUniformLocation(program, 'uTime');
    const uDpr = gl.getUniformLocation(program, 'uDpr');
    const uLens = gl.getUniformLocation(program, 'uLens');
    const uMotion = gl.getUniformLocation(program, 'uMotion');
    const uRefract = gl.getUniformLocation(program, 'uRefract');
    const uAccent = gl.getUniformLocation(program, 'uAccent');
    const uRippleCount = gl.getUniformLocation(program, 'uRippleCount');
    const uRipples = gl.getUniformLocation(program, 'uRipples[0]');

    gl.uniform1f(uRefract, 0.65);
    gl.uniform3f(uAccent, 0.13, 0.77, 0.37); // Default green accent

    let dpr = 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();

    window.addEventListener('resize', resize);

    let raf = 0;
    let prev = performance.now() / 1000;
    const t0 = prev;
    let vx = 0;
    let stretch = 0;
    let wobble = 0;
    const rippleData = new Float32Array(8 * 4);

    const frame = () => {
      const now = performance.now() / 1000;
      const dt = Math.min(Math.max(now - prev, 0.001), 0.05);
      prev = now;

      // Spring follow target X
      const targetX = targetXRef.current * dpr;
      const dx = targetX - currentXRef.current;
      vx += dx * 160 * dt;
      vx *= Math.exp(-15 * dt);
      currentXRef.current += vx * dt;

      const speed = Math.abs(vx);
      const targetStretch = Math.min(speed / 2800, 0.35);
      stretch += (targetStretch - stretch) * (1 - Math.exp(-14 * dt));
      wobble = Math.min(speed / 1200, 0.9);

      // Ripples
      const ripples = ripplesRef.current;
      for (let i = ripples.length - 1; i >= 0; i--) {
        if (now - ripples[i].t0 > 2.5) ripples.splice(i, 1);
      }
      ripples.forEach((rp, i) => {
        rippleData[i * 4] = rp.x * dpr;
        rippleData[i * 4 + 1] = (canvas.height / 2);
        rippleData[i * 4 + 2] = now - rp.t0;
        rippleData[i * 4 + 3] = rp.amp;
      });

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, now - t0);
      gl.uniform1f(uDpr, dpr);
      gl.uniform4f(uLens, currentXRef.current, canvas.height / 2, 28.0 * dpr, 1.0);
      gl.uniform4f(uMotion, vx >= 0 ? 1.0 : -1.0, 0.0, stretch, wobble);
      gl.uniform1i(uRippleCount, ripples.length);
      gl.uniform4fv(uRipples, rippleData);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full rounded-full pointer-events-none z-[1]"
      style={{
        borderRadius: '9999px',
        overflow: 'hidden'
      }}
      aria-hidden="true"
    />
  );
}
