"use client";

import { useEffect, useRef } from "react";
import { Renderer, Program, Mesh, Triangle } from "ogl";

export function HomeBackground() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer | null = null;
    let geometry: Triangle | null = null;
    let program: Program | null = null;
    let mesh: Mesh | null = null;
    let animationFrameId: number | null = null;
    let isDisposed = false;

    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let isReducedMotion = mediaQuery.matches;

    // Mouse coordinates in normalized screen space
    const targetMouse = { x: 0.5, y: 0.5 };
    const currentMouse = { x: 0.5, y: 0.5 };

    const handleMouseMove = (e: MouseEvent) => {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        targetMouse.x = (e.clientX - rect.left) / rect.width;
        targetMouse.y = 1.0 - (e.clientY - rect.top) / rect.height;
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    try {
      const initialWidth = container.clientWidth || window.innerWidth || 800;
      const initialHeight = container.clientHeight || 700;

      renderer = new Renderer({
        width: initialWidth,
        height: initialHeight,
        alpha: false,
        antialias: true,
        dpr: Math.min(window.devicePixelRatio || 1, 1.5),
      });

      const gl = renderer.gl;
      if (!gl || gl.isContextLost()) {
        return;
      }

      // Dynamically attach canvas to container
      const canvas = gl.canvas;
      canvas.className = "absolute inset-0 w-full h-full pointer-events-none";
      container.appendChild(canvas);

      const vertexShader = `
        attribute vec2 position;
        attribute vec2 uv;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `;

      const fragmentShader = `
        #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
        #else
        precision mediump float;
        #endif

        varying vec2 vUv;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec2 uMouse;

        void main() {
          vec2 uv = vUv;
          float aspect = uResolution.x / max(uResolution.y, 1.0);
          vec2 p = vec2(uv.x * aspect, uv.y);

          // Calm, smooth civic ambient time rate
          float t = uTime * 0.32;

          // Mouse perturbation
          vec2 m = vec2(uMouse.x * aspect, uMouse.y);
          float distToMouse = length(p - m);
          float mouseRipple = sin(distToMouse * 12.0 - t * 2.0) * exp(-distToMouse * 2.2) * 0.15;

          // Harmonic undulating wave patterns
          float w1 = sin(p.x * 1.6 + t * 0.75 + mouseRipple + sin(p.y * 1.9 + t * 0.5)) * 0.5 + 0.5;
          float w2 = cos(p.y * 2.2 - t * 0.65 + cos(p.x * 1.5 - t * 0.45)) * 0.5 + 0.5;
          float w3 = sin((p.x + p.y) * 1.3 + t * 0.4) * 0.5 + 0.5;

          // Glowing civic focal area behind the right hero card
          vec2 heroGlowPos = vec2(0.70 * aspect, 0.52);
          float distToHero = length(p - heroGlowPos);
          float heroGlow = exp(-distToHero * 1.4);

          // Subtle ambient top-left civic light
          vec2 leftGlowPos = vec2(0.18 * aspect, 0.85);
          float leftGlow = exp(-length(p - leftGlowPos) * 2.0) * 0.45;

          // Flowing wave field composite
          float waveField = w1 * 0.45 + w2 * 0.35 + w3 * 0.20 + mouseRipple * 0.5;

          // Government Civic Color Palette:
          // Clean white base
          vec3 cWhite     = vec3(1.0, 1.0, 1.0);
          // Crisp light-ice sky atmosphere
          vec3 cIceSky    = vec3(0.92, 0.96, 0.995);
          // Luminous vibrant sky blue (#38BDF8)
          vec3 cSkyBlue   = vec3(0.60, 0.82, 0.98);
          // Government royal blue (#155EEF)
          vec3 cGovBlue   = vec3(0.082, 0.369, 0.937);
          // Deep royal navy undertone (#0F1E36)
          vec3 cNavy      = vec3(0.06, 0.18, 0.42);

          // 1. Vertical gradient base: white at bottom, soft ice-blue at top
          vec3 baseColor = mix(cWhite, cIceSky, uv.y * 0.9);

          // 2. Dynamic flowing blue light field
          vec3 waveColor = mix(cSkyBlue, cGovBlue, waveField * 0.75);
          waveColor = mix(waveColor, cNavy, w2 * 0.35);

          // 3. Modulate light intensity by radial glows + gentle ambient flow
          float glowMask = heroGlow * 0.92 + leftGlow * 0.50 + (waveField * 0.18);

          // Smoothly blend the moving government blue light into the clean base
          vec3 finalColor = mix(baseColor, waveColor, clamp(glowMask * 0.55, 0.0, 0.58));

          // Keep lower edge clean white for seamless transition to subsequent sections
          finalColor = mix(finalColor, cWhite, clamp((1.0 - uv.y) * 0.45, 0.0, 1.0));

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `;

      geometry = new Triangle(gl);
      program = new Program(gl, {
        vertex: vertexShader,
        fragment: fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uResolution: { value: [initialWidth, initialHeight] },
          uMouse: { value: [0.5, 0.5] },
        },
        transparent: false,
        depthTest: false,
        depthWrite: false,
      });

      if (!program || !program.uniformLocations) {
        if (canvas.parentElement) canvas.remove();
        return;
      }

      mesh = new Mesh(gl, { geometry, program });
    } catch {
      return;
    }

    const renderScene = () => {
      if (!renderer || !mesh || !program || !program.uniformLocations || isDisposed) return;
      try {
        renderer.render({ scene: mesh, sort: false, frustumCull: false });
      } catch {
        // Safe guard
      }
    };

    const resize = () => {
      if (!renderer || !container || !program || isDisposed) return;
      const width = container.clientWidth || window.innerWidth || 800;
      const height = container.clientHeight || 700;
      renderer.setSize(width, height);
      if (program.uniforms && program.uniforms.uResolution) {
        program.uniforms.uResolution.value = [width, height];
      }
      if (isReducedMotion) {
        if (program.uniforms && program.uniforms.uTime) {
          program.uniforms.uTime.value = 0.5;
        }
        renderScene();
      }
    };

    resize();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => resize());
      resizeObserver.observe(container);
    } else {
      window.addEventListener("resize", resize);
    }

    let isDocumentVisible = !document.hidden;
    const handleVisibility = () => {
      isDocumentVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotion = e.matches;
      if (isReducedMotion && animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        if (program && program.uniforms && program.uniforms.uTime) {
          program.uniforms.uTime.value = 0.5;
        }
        renderScene();
      } else if (!isReducedMotion && !animationFrameId) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };
    mediaQuery.addEventListener("change", handleReducedMotionChange);

    const startTime = performance.now();
    const animate = (now: number) => {
      if (isDisposed) return;

      if (!isReducedMotion && isDocumentVisible && program && program.uniforms) {
        // Smooth lerp mouse towards target
        currentMouse.x += (targetMouse.x - currentMouse.x) * 0.08;
        currentMouse.y += (targetMouse.y - currentMouse.y) * 0.08;

        const elapsed = (now - startTime) * 0.001;
        program.uniforms.uTime.value = elapsed;
        if (program.uniforms.uMouse) {
          program.uniforms.uMouse.value = [currentMouse.x, currentMouse.y];
        }
        renderScene();
      }

      if (!isReducedMotion) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    if (isReducedMotion) {
      if (program && program.uniforms && program.uniforms.uTime) {
        program.uniforms.uTime.value = 0.5;
      }
      renderScene();
    } else {
      animationFrameId = requestAnimationFrame(animate);
    }

    return () => {
      isDisposed = true;
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibility);
      mediaQuery.removeEventListener("change", handleReducedMotionChange);

      if (mesh) {
        try {
          if (geometry) geometry.remove();
          if (program) program.remove();
        } catch {
          // ignore
        }
      }

      if (renderer) {
        try {
          if (renderer.gl && renderer.gl.canvas && renderer.gl.canvas.parentElement) {
            renderer.gl.canvas.remove();
          }
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0"
      aria-hidden="true"
    >
      {/* Fallback CSS gradient in case WebGL is unavailable */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#EDF4FD] via-[#F6F9FD] to-white" />

      {/* Minimal Agusan River Flowing Water Silhouette across lower edge */}
      <svg
        className="absolute bottom-0 left-0 right-0 w-full h-16 sm:h-24 pointer-events-none opacity-[0.06] text-[#155EEF] z-1"
        viewBox="0 0 1440 160"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M0 95 C 320 50, 560 130, 860 80 C 1100 35, 1310 115, 1440 85 L 1440 160 L 0 160 Z"
          fill="currentColor"
        />
        <path
          d="M0 115 C 280 75, 620 145, 940 100 C 1200 65, 1370 120, 1440 105"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeDasharray="6 6"
        />
      </svg>
    </div>
  );
}
