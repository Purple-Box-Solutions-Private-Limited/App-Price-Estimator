"use client";

import { useEffect, useRef } from "react";

/**
 * A ₹ glyph made of a few thousand ink particles. They assemble on load,
 * scatter away from the pointer and spring back. Motion is caused by the
 * visitor (pointer) — once settled the field is still, and the loop sleeps.
 */
const INK = "#17140f";
const ACCENT = "#ff5420";
const COBALT = "#2c4bff";

interface P {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tx: number;
  ty: number;
  s: number;
  c: 0 | 1 | 2;
}

export default function RupeeField({ className = "" }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let parts: P[] = [];
    let raf = 0;
    let running = false;
    let visible = true;
    const ptr = { x: -9999, y: -9999, active: false };

    function build() {
      const rect = wrap.getBoundingClientRect();
      // Track the CSS size ourselves (never compare canvas.width to clientWidth).
      if (Math.round(rect.width) === W && Math.round(rect.height) === H && parts.length) return;
      W = Math.round(rect.width);
      H = Math.round(rect.height);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;

      // Rasterise the glyph off-screen and sample it on a grid.
      const off = document.createElement("canvas");
      off.width = W;
      off.height = H;
      const o = off.getContext("2d")!;
      const size = Math.min(H * 0.92, W * 1.05);
      o.fillStyle = "#000";
      o.textAlign = "center";
      o.textBaseline = "middle";
      o.font = `700 ${size}px "Space Grotesk", "Segoe UI", Arial, sans-serif`;
      o.fillText("₹", W * 0.5, H * 0.53);
      const data = o.getImageData(0, 0, W, H).data;
      const gap = Math.max(4, Math.round(Math.min(W, H) / 85));
      const old = parts;
      parts = [];
      for (let y = 0; y < H; y += gap) {
        for (let x = 0; x < W; x += gap) {
          if (data[(y * W + x) * 4 + 3] > 128) {
            const r = Math.random();
            const prev = old[parts.length];
            parts.push({
              // gentle assemble: start near home, scattered outward from the centre
              x: prev ? prev.x : reduce ? x : x + (x - W / 2) * 0.35 + (Math.random() - 0.5) * 60,
              y: prev ? prev.y : reduce ? y : y + (y - H / 2) * 0.35 + (Math.random() - 0.5) * 60,
              vx: 0,
              vy: 0,
              tx: x,
              ty: y,
              s: gap * (r < 0.08 ? 0.8 : 0.6),
              c: r < 0.07 ? 1 : r < 0.1 ? 2 : 0,
            });
          }
        }
      }
      kick();
    }

    function frame() {
      let worst = 0;
      const R = Math.min(W, H) * 0.2;
      for (const p of parts) {
        let ax = (p.tx - p.x) * 0.06;
        let ay = (p.ty - p.y) * 0.06;
        if (ptr.active) {
          const dx = p.x - ptr.x;
          const dy = p.y - ptr.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < R * R) {
            const d = Math.sqrt(d2) || 1;
            const f = (1 - d / R) * 9;
            ax += (dx / d) * f;
            ay += (dy / d) * f;
          }
        }
        p.vx = (p.vx + ax) * 0.78;
        p.vy = (p.vy + ay) * 0.78;
        p.x += p.vx;
        p.y += p.vy;
        worst = Math.max(worst, Math.abs(p.tx - p.x) + Math.abs(p.ty - p.y) + Math.abs(p.vx) + Math.abs(p.vy));
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (const [c, color] of [
        [0, INK],
        [1, ACCENT],
        [2, COBALT],
      ] as const) {
        ctx.fillStyle = color;
        for (const p of parts) {
          if (p.c !== c) continue;
          // stretch a little along velocity: reads as motion, not as a blur
          const sp = Math.min(6, Math.hypot(p.vx, p.vy));
          ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s + sp * 0.6, p.s);
        }
      }

      if (worst < 0.3 && !ptr.active) {
        running = false; // every particle home: sleep until something moves
        return;
      }
      raf = requestAnimationFrame(frame);
    }

    function kick() {
      if (running || !visible) return;
      running = true;
      raf = requestAnimationFrame(frame);
    }

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      ptr.x = e.clientX - r.left;
      ptr.y = e.clientY - r.top;
      ptr.active = ptr.x >= 0 && ptr.y >= 0 && ptr.x <= W && ptr.y <= H;
      if (ptr.active) kick();
    };
    const onLeave = () => {
      ptr.active = false;
      kick();
    };

    const ro = new ResizeObserver(() => build());
    ro.observe(wrap);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) kick();
    });
    io.observe(wrap);
    window.addEventListener("pointermove", onMove, { passive: true });
    wrap.addEventListener("pointerleave", onLeave);
    // Fonts may arrive after first paint; rebuild targets once they do.
    document.fonts?.ready.then(() => {
      W = 0;
      build();
    });
    build();

    // Manual stepper for automated checks (rAF does not fire in background tabs)
    (window as unknown as { rupeeStep?: () => void }).rupeeStep = () => {
      running = true;
      frame();
      cancelAnimationFrame(raf);
      running = false;
    };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      wrap.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={wrapRef} className={`relative h-full w-full touch-none ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0" aria-label="Rupee symbol made of particles that react to the cursor" role="img" />
    </div>
  );
}
