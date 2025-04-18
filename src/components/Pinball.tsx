import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";
import type {
  Engine,
  Render,
  Runner,
  Body,
  IEventCollision,
  Pair,
} from "matter-js";

/**
 * Cyberpunk Pinball Lottery v10.7.2 — **Syntax‑Safe Dual‑Wing Build** 🛠️
 * ▸ 고질적인 “Expected identifier but found end of file” 문제 해결:
 *    · `collisionStart` 리스너 블록, `startGame` 함수, JSX 반환 완전 닫힘.
 * ▸ 기능은 v10.7 그대로 (출구 복원, 좌·우 Anti‑Grav Wing, 경량 컨페티)
 */

/* ------------ helpers ------------- */
export const parseNames = (raw: string): string[] =>
  raw
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
interface Confetto {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}
const confetti: Confetto[] = [];
const MAX_CONF = 300;
const confBurst = (x: number, y: number, n = 24): void => {
  for (let i = 0; i < n && confetti.length < MAX_CONF; i++) {
    confetti.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 7,
      vy: (Math.random() - 1) * 7,
      life: 45,
      color: `hsl(${Math.random() * 360} 100% 70%)`,
      size: 3,
    });
  }
};
const spark = (x: number, y: number): void => confBurst(x, y, 12);
const MSGS = [
  "우하하!",
  "웁스라라",
  "해피해피",
  "힐링미니갤 만세이",
  "제중원은영원하다Zzz",
];

/* ------------- component ------------- */
export default function Pinball(): JSX.Element {
  const [input, setInput] = useState<string>("");
  const [playing, setPlaying] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bubbleLayerRef = useRef<HTMLDivElement | null>(null);
  const ballsRef = useRef<Body[]>([]);
  const matterRef = useRef<any>();

  /* load Matter */
  useEffect(() => {
    import("matter-js").then((m) => {
      matterRef.current = (m as any).default ?? m;
      setReady(true);
    });
  }, []);

  /* confetti + label loop */
  useEffect(() => {
    if (!playing && !winner) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const W = 480,
      H = 720;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = 'bold 12px "Pretendard", sans-serif';
    let raf: number;
    const draw = (): void => {
      ctx.clearRect(0, 0, W, H);
      confetti.forEach((c) => {
        ctx.fillStyle = c.color;
        ctx.fillRect(c.x, c.y, c.size, c.size);
        c.x += c.vx;
        c.y += c.vy;
        c.vy += 0.1;
        c.vx *= 0.98;
        c.vy *= 0.98;
        c.life--;
      });
      while (confetti.length && confetti[0].life <= 0) confetti.shift();
      ballsRef.current.forEach((b) => {
        const { x, y } = b.position;
        if (y < 0 || y > H) return;
        ctx.fillStyle = "#fff";
        ctx.shadowColor = `hsl(${(Date.now() * 0.2) % 360} 100% 60%)`;
        ctx.shadowBlur = 4;
        ctx.fillText(b.label as string, x, y);
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [playing, winner]);

  /* ------------ startGame ------------ */
  const startGame = useCallback((): void => {
    if (playing || !ready || !sceneRef.current) return;
    const Matter = matterRef.current;
    const names = parseNames(input);
    if (!names.length) {
      alert("유저 이름!");
      return;
    }

    /* reset */
    setPlaying(true);
    setWinner(null);
    sceneRef.current.innerHTML = "";
    confetti.length = 0;

    /* constants */
    const W = 480,
      H = 720,
      wall = 60,
      GAP = 60;
    const engine: Engine = Matter.Engine.create();
    engine.gravity.y = 0.25;
    engine.positionIterations = 12;
    engine.velocityIterations = 12;

    /* renderer */
    const render: Render = Matter.Render.create({
      element: sceneRef.current,
      engine,
      options: { width: W, height: H, background: "#000", wireframes: false },
    });

    /* overlay canvas */
    const canvas = document.createElement("canvas");
    canvas.width = W * devicePixelRatio;
    canvas.height = H * devicePixelRatio;
    Object.assign(canvas.style, {
      position: "absolute",
      top: 0,
      left: 0,
      width: `${W}px`,
      height: `${H}px`,
      mixBlendMode: "screen",
      pointerEvents: "none",
    });
    sceneRef.current.appendChild(canvas);
    canvasRef.current = canvas;
    canvas.getContext("2d")!.scale(devicePixelRatio, devicePixelRatio);

    /* bubble layer */
    const bubbleLayer = document.createElement("div");
    bubbleLayer.className = "absolute inset-0 pointer-events-none";
    sceneRef.current.appendChild(bubbleLayer);
    bubbleLayerRef.current = bubbleLayer;

    /* bodies */
    const walls: Body[] = [
      Matter.Bodies.rectangle(W / 2, -wall / 2, W, wall, {
        isStatic: true,
        label: "wall",
      }),
      Matter.Bodies.rectangle(-wall / 2, H / 2, wall, H, {
        isStatic: true,
        label: "wall",
      }),
      Matter.Bodies.rectangle(W + wall / 2, H / 2, wall, H, {
        isStatic: true,
        label: "wall",
      }),
      Matter.Bodies.rectangle(W / 2 - GAP / 2 - 140, H - 40, 280, 14, {
        isStatic: true,
        angle: Math.PI / 4.2,
        label: "wall",
      }),
      Matter.Bodies.rectangle(W / 2 + GAP / 2 + 140, H - 40, 280, 14, {
        isStatic: true,
        angle: -Math.PI / 4.2,
        label: "wall",
      }),
    ];

    const circles: Body[] = [];
    for (let i = 0; i < 18; i++) {
      let x = 0,
        y = 0,
        r = 6 + Math.random() * 4,
        ok = false;
      for (let t = 0; t < 60 && !ok; t++) {
        x = 60 + Math.random() * (W - 120);
        y = 120 + Math.random() * (H - 320);
        ok = !circles.some(
          (c) => Math.hypot(c.position.x - x, c.position.y - y) < 35,
        );
      }
      circles.push(
        Matter.Bodies.circle(x, y, r, {
          isStatic: true,
          label: "circle",
          restitution: 1.2,
          render: { fillStyle: `hsl(${Math.random() * 360} 100% 60%)` },
        }),
      );
    }

    const accel = Matter.Bodies.rectangle(W / 2, H / 2 - 140, 120, 20, {
      isStatic: true,
      isSensor: true,
      label: "accel",
      render: { strokeStyle: "#00ffa6", lineWidth: 2 },
    });
    const slow = Matter.Bodies.rectangle(W / 2, H / 2 + 140, 120, 20, {
      isStatic: true,
      isSensor: true,
      label: "slow",
      render: { strokeStyle: "#ff006e", lineWidth: 2 },
    });
    const antiL = Matter.Bodies.rectangle(90, H - 25, 140, 30, {
      isStatic: true,
      isSensor: true,
      label: "anti",
      render: { strokeStyle: "#ff9c00", lineWidth: 2 },
    });
    const antiR = Matter.Bodies.rectangle(W - 90, H - 25, 140, 30, {
      isStatic: true,
      isSensor: true,
      label: "anti",
      render: { strokeStyle: "#ff9c00", lineWidth: 2 },
    });

    /* portals */
    const portalPairs: [Body, Body][] = [];
    const addPortal = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      c1: string,
      c2: string,
    ): [Body, Body] => {
      const A = Matter.Bodies.circle(x1, y1, 16, {
        isStatic: true,
        isSensor: true,
        label: "portal",
        render: { strokeStyle: c1, lineWidth: 3 },
      });
      const B = Matter.Bodies.circle(x2, y2, 16, {
        isStatic: true,
        isSensor: true,
        label: "portal",
        render: { strokeStyle: c2, lineWidth: 3 },
      });
      portalPairs.push([A, B]);
      return [A, B];
    };
    const portals = [
      ...addPortal(70, 250, W - 70, 300, "#8f5cff", "#ff5caa"),
      ...addPortal(W / 2 - 140, 350, W / 2 + 140, 200, "#ffd95c", "#5c9bff"),
    ];

    /* balls */
    const balls: Body[] = [];
    names.forEach((n, idx) => {
      const hue = (idx * 60) % 360;
      for (let k = 0; k < 25; k++) {
        const b = Matter.Bodies.circle(W / 2, 40, 7, {
          label: n,
          restitution: 1.2,
          friction: 0.0005,
          render: { fillStyle: `hsl(${hue} 100% 65%)` },
        });
        const ang = Math.random() * Math.PI * 2;
        Matter.Body.setVelocity(b, {
          x: Math.cos(ang) * 4,
          y: Math.sin(ang) * 4,
        });
        balls.push(b);
      }
    });
    ballsRef.current = balls;

    Matter.World.add(engine.world, [
      ...walls,
      ...circles,
      accel,
      slow,
      antiL,
      antiR,
      ...portals,
      ...balls,
    ]);

    /* runner */
    const runner: Runner = Matter.Runner.create({ delta: 1000 / 120 });
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    /* bubble helper */
    const bubble = (b: Body): void => {
      if (Math.random() > 0.1 || !bubbleLayerRef.current) return;
      const div = document.createElement("div");
      div.textContent = `${b.label}: ${MSGS[Math.floor(Math.random() * MSGS.length)]}`;
      Object.assign(div.style, {
        position: "absolute",
        left: `${b.position.x - 30}px`,
        top: `${b.position.y - 28}px`,
        fontSize: "10px",
        color: "#fff",
        background: "rgba(0,0,0,0.65)",
        padding: "1px 4px",
        borderRadius: "4px",
      });
      bubbleLayerRef.current.appendChild(div);
      setTimeout(() => div.remove(), 1400);
    };

    /* collision logic */
    const lastTP = new WeakMap<Body, number>();
    Matter.Events.on(
      engine,
      "collisionStart",
      (evt: IEventCollision<Engine>) => {
        evt.pairs.forEach((p: Pair) => {
          const [A, B] = [p.bodyA, p.bodyB];
          const ball =
            !A.isStatic &&
            A.label &&
            !["circle", "wall", "portal", "accel", "slow", "anti"].includes(
              A.label,
            )
              ? A
              : !B.isStatic &&
                  B.label &&
                  ![
                    "circle",
                    "wall",
                    "portal",
                    "accel",
                    "slow",
                    "anti",
                  ].includes(B.label)
                ? B
                : null;
          if (!ball) return;
          const other = ball === A ? B : A;

          switch (other.label) {
            case "circle":
              Matter.Body.setVelocity(ball, {
                x: ball.velocity.x * 1.5,
                y: ball.velocity.y * 1.5,
              });
              confBurst(ball.position.x, ball.position.y);
              break;
            case "wall":
              Matter.Body.setVelocity(ball, {
                x: ball.velocity.x * 1.2,
                y: ball.velocity.y * 1.2,
              });
              spark(p.collision.supports[0].x, p.collision.supports[0].y);
              break;
            case "accel":
              Matter.Body.setVelocity(ball, {
                x: ball.velocity.x * 1.2,
                y: ball.velocity.y * 1.2,
              });
              break;
            case "slow":
              Matter.Body.setVelocity(ball, {
                x: ball.velocity.x * 0.8,
                y: ball.velocity.y * 0.8,
              });
              break;
            case "anti":
              Matter.Body.setVelocity(ball, { x: ball.velocity.x, y: -20 });
              spark(ball.position.x, ball.position.y);
              break;
            case "portal": {
              const now = performance.now();
              if (now - (lastTP.get(ball) || 0) < 600) return;
              portalPairs.forEach(([P, Q]) => {
                if (other === P) {
                  Matter.Body.setPosition(ball, Q.position);
                  Matter.Body.setVelocity(ball, {
                    x: ball.velocity.x * 0.6,
                    y: ball.velocity.y * 0.6,
                  });
                  lastTP.set(ball, now);
                } else if (other === Q) {
                  Matter.Body.setPosition(ball, P.position);
                  Matter.Body.setVelocity(ball, {
                    x: ball.velocity.x * 0.6,
                    y: ball.velocity.y * 0.6,
                  });
                  lastTP.set(ball, now);
                }
              });
              break;
            }
          }
          bubble(ball);
        });
      },
    );

    /* winner detection */
    Matter.Events.on(engine, "afterUpdate", () => {
      if (winner) return;
      const alive = new Set<string>();
      balls.forEach((b) => {
        if (b.position.y < H) alive.add(b.label as string);
      });
      if (alive.size === 1) {
        const champ = [...alive][0];
        setWinner(champ);
        confBurst(W / 2, H / 2, 60);
        const overlay = document.createElement("div");
        overlay.className =
          "absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none";
        overlay.innerHTML = `<h2 class='text-4xl font-extrabold bg-gradient-to-r from-lime-300 via-cyan-300 to-fuchsia-500 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(0,255,255,0.9)]'>${champ} WINS!</h2><p class='text-lg text-white/80'>🍔 버거 세트 GET!</p>`;
        sceneRef.current!.appendChild(overlay);
      }
    });
  }, [playing, ready, input, winner]);

  /* ------------- JSX ------------- */
  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl lg:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-cyan-300 to-lime-300 animate-[pulse_2s_infinite] drop-shadow-[0_0_25px_rgba(0,255,255,0.85)]">
          디시인사이드 힐링 미니 갤러리 PINBALL ANTI‑GRAV
        </h1>
        <p className="text-sm opacity-80">
          좌·우 윙 반중력에서 부우앙↗ 튀어 오르면 🍔 <b>버거 세트</b> 기회!
        </p>
        <Textarea
          disabled={playing}
          placeholder="유저 이름 (쉼표·줄바꿈)"
          className="h-48 bg-neutral-900/70 border border-fuchsia-600/40 rounded-2xl px-4 py-3 resize-none text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <Button
          disabled={playing || !ready}
          onClick={startGame}
          className="bg-gradient-to-r from-yellow-400 via-pink-600 to-indigo-600 rounded-2xl py-6 text-xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Sparkles className="w-6 h-6 animate-spin-slow" />{" "}
          {playing ? "PLAYING" : "운빨 GO!"}
        </Button>
        {winner && (
          <div className="mt-4 text-center text-emerald-300 animate-bounce">
            🏆 {winner} 버거 세트 GET!
          </div>
        )}
      </div>
      <div
        ref={sceneRef}
        className="relative overflow-hidden rounded-2xl bg-neutral-900 border border-fuchsia-600/40 shadow-[0_0_80px_rgba(255,0,255,0.4)]"
        style={{ width: 480, height: 720 }}
      />
    </div>
  );
}

/* tailwind keyframes spin-slow, pulse (add to config if missing) */
