"use client";
import { useEffect, useRef } from "react";

/* ── WebGL Radar / Pulse Shader ─────────────────────────────────
   Renders a radar sweep + concentric pulsing ring pattern.
   Falls back gracefully if WebGL is unavailable.               */
function ShaderCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
      powerPreference: "low-power",
    }) as WebGLRenderingContext | null;
    if (!gl) return;

    const resize = () => {
      canvas.width  = Math.max(canvas.offsetWidth,  1);
      canvas.height = Math.max(canvas.offsetHeight, 1);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();

    const vsrc = `
      attribute vec2 a_pos;
      void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
    `;
    const fsrc = `
      precision mediump float;
      uniform vec2  u_res;
      uniform float u_t;

      void main() {
        vec2  uv  = gl_FragCoord.xy / u_res;
        uv.y = 1.0 - uv.y;
        vec2  d   = uv - 0.5;
        float r   = length(d);
        float ang = atan(d.y, d.x);

        /* Radar sweep trail */
        float sweep = mod(ang + u_t * 0.38, 6.28318) / 6.28318;
        float trail = pow(max(0.0, 1.0 - sweep), 5.5);
        trail *= 1.0 - smoothstep(0.0, 0.48, r);

        /* Concentric pulsing rings */
        float rings = 0.0;
        for (int i = 0; i < 5; i++) {
          float ri   = 0.06 + float(i) * 0.085;
          float wave = 0.006 * sin(u_t * 1.6 + float(i) * 1.3);
          float rd   = abs(r - ri + wave);
          rings += 0.0015 / (rd + 0.0013);
        }
        rings *= 1.0 - smoothstep(0.0, 0.50, r);

        /* Core bloom */
        float bloom = exp(-r * 14.0) * (0.45 + 0.55 * sin(u_t * 2.0));

        /* Color blend: cyan → violet → emerald */
        vec3 cyan   = vec3(0.133, 0.827, 0.933);
        vec3 violet = vec3(0.486, 0.361, 0.969);
        vec3 green  = vec3(0.204, 0.827, 0.600);
        vec3 col    = mix(cyan, violet, clamp(r * 3.0, 0.0, 1.0));
        col = mix(col, green, clamp(r * 2.0 - 0.7, 0.0, 0.35));

        float alpha = trail * 0.10 + rings * 0.52 + bloom * 0.06;
        alpha = clamp(alpha, 0.0, 0.50);

        gl_FragColor = vec4(col, alpha);
      }
    `;

    const mkShader = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, mkShader(gl.VERTEX_SHADER,   vsrc));
    gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, fsrc));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1, -1,  1, -1,  -1,  1,  1, 1]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uT   = gl.getUniformLocation(prog, "u_t");

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let raf = 0;
    const t0 = performance.now();
    const render = () => {
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uT, (performance.now() - t0) / 1000);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(render);
    };
    render();

    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    />
  );
}

/* ── Canvas 2D Neural Network ───────────────────────────────────
   ~36 floating nodes connected by proximity lines.              */
function NeuralCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = Math.max(canvas.offsetWidth,  1);
      canvas.height = Math.max(canvas.offsetHeight, 1);
    };
    resize();

    type RGB = [number, number, number];
    const PALETTE: RGB[] = [
      [34,  211, 238],
      [129, 140, 248],
      [52,  211, 153],
      [192, 132, 252],
    ];

    const N = 36;
    const pts = Array.from({ length: N }, () => ({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      vx:    (Math.random() - 0.5) * 0.20,
      vy:    (Math.random() - 0.5) * 0.20,
      r:     Math.random() * 1.2 + 0.6,
      c:     PALETTE[Math.floor(Math.random() * 4)] as RGB,
      phase: Math.random() * Math.PI * 2,
    }));

    const DIST = 140;
    let raf = 0, t = 0;

    const draw = () => {
      t += 0.009;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      for (const p of pts) {
        p.x += p.vx;  if (p.x < 0 || p.x > W) p.vx *= -1;
        p.y += p.vy;  if (p.y < 0 || p.y > H) p.vy *= -1;
      }

      /* Connection lines */
      ctx.lineWidth = 0.55;
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          const d2 = dx * dx + dy * dy;
          if (d2 < DIST * DIST) {
            const a = (1 - Math.sqrt(d2) / DIST) * 0.20;
            ctx.strokeStyle = `rgba(34,211,238,${a.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }

      /* Nodes */
      for (const p of pts) {
        const g = 0.5 + 0.5 * Math.sin(t * 1.6 + p.phase);
        const [r, gr, b] = p.c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${gr},${b},${(0.38 + g * 0.52).toFixed(2)})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      resize();
      for (const p of pts) {
        p.x = Math.min(p.x, canvas.width);
        p.y = Math.min(p.y, canvas.height);
      }
    };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.65 }}
    />
  );
}

/* ── 3D CSS Orbital Rings ───────────────────────────────────────
   Three concentric rings tipped 70° into perspective space.    */
function OrbitalRings() {
  const rings = [
    { size: 220, color: "34,211,238",  dur: "24s", opacity: 0.13 },
    { size: 370, color: "129,140,248", dur: "34s", opacity: 0.09 },
    { size: 540, color: "52,211,153",  dur: "46s", opacity: 0.055 },
  ];

  return (
    <div style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      display: "flex", alignItems: "center", justifyContent: "center",
      perspective: "1100px",
    }}>
      <div style={{ position: "relative", transformStyle: "preserve-3d", transform: "rotateX(70deg)" }}>
        {rings.map((ring, i) => (
          <div key={i} style={{
            position:     "absolute",
            width:        ring.size,
            height:       ring.size,
            marginLeft:   -ring.size / 2,
            marginTop:    -ring.size / 2,
            borderRadius: "50%",
            border:       `1px solid rgba(${ring.color},${ring.opacity + 0.04})`,
            boxShadow:    `0 0 22px rgba(${ring.color},${ring.opacity}), inset 0 0 22px rgba(${ring.color},${ring.opacity * 0.4})`,
            animation:    `tmSpin ${ring.dur} linear infinite`,
          }} />
        ))}
        <div style={{
          position: "absolute", width: 80, height: 80,
          marginLeft: -40, marginTop: -40, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(34,211,238,0.32) 0%, transparent 70%)",
          filter: "blur(6px)",
          animation: "tmGlowPulse 4s ease-in-out infinite",
        }} />
      </div>
    </div>
  );
}

export function AICoreBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Dark base */}
      <div className="absolute inset-0" style={{ background: "#020308" }} />

      {/* WebGL: radar sweep + ring shader */}
      <ShaderCanvas />

      {/* Canvas 2D: neural network particles */}
      <NeuralCanvas />

      {/* CSS 3D orbital rings */}
      <OrbitalRings />

      {/* Ambient color gradients */}
      <div
        className="absolute inset-0 ai-core-bg-gradient"
        style={{
          background: `
            radial-gradient(ellipse 55% 50% at 50% 42%, rgba(34,211,238,0.048) 0%, transparent 62%),
            radial-gradient(ellipse 38% 38% at 80% 72%,  rgba(129,140,248,0.042) 0%, transparent 58%),
            radial-gradient(ellipse 32% 38% at 14% 68%,  rgba(52,211,153,0.03)  0%, transparent 55%)
          `,
        }}
      />

      {/* Dot grid — fades toward edges */}
      <div
        className="absolute inset-0 ai-core-dot-grid"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.022) 1px, transparent 1px)",
          backgroundSize: "38px 38px",
          maskImage: "radial-gradient(ellipse 88% 88% at 50% 50%, black 35%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 88% 88% at 50% 50%, black 35%, transparent 100%)",
        }}
      />

      {/* Faint crosshair grid */}
      <div
        className="absolute inset-0 opacity-[0.006]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34,211,238,1) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,1) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Corner brackets */}
      {([
        { cls: "absolute top-5 left-5",   d: "M0 14 L0 0 L14 0" },
        { cls: "absolute top-5 right-5",  d: "M18 14 L18 0 L4 0" },
        { cls: "absolute bottom-5 left-5",  d: "M0 4 L0 18 L14 18" },
        { cls: "absolute bottom-5 right-5", d: "M18 4 L18 18 L4 18" },
      ]).map((b, i) => (
        <svg key={i} className={b.cls} style={{ opacity: 0.09 }} width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d={b.d} stroke="#22d3ee" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ))}
    </div>
  );
}
