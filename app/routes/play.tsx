import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/play";
import styles from "./play.module.css";
import { useGameState } from "~/hooks/use-game-state";
import { GAME_CONFIG } from "~/data/game-config";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Playing - Bot Royale" }, { name: "description", content: "Battle royale in progress" }];
}

function drawMinecraftPlayer(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) {
  // Shadow
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 20 * scale, 9 * scale, 3 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // === LEGS ===
  // Left leg
  ctx.fillStyle = "#1a3d7c";
  ctx.fillRect(cx - 5 * scale, cy + 6 * scale, 4 * scale, 8 * scale);
  ctx.strokeStyle = "#0f2650";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(cx - 5 * scale, cy + 6 * scale, 4 * scale, 8 * scale);
  // Right leg
  ctx.fillStyle = "#1e4a96";
  ctx.fillRect(cx + 1 * scale, cy + 6 * scale, 4 * scale, 8 * scale);
  ctx.strokeStyle = "#0f2650";
  ctx.strokeRect(cx + 1 * scale, cy + 6 * scale, 4 * scale, 8 * scale);

  // === BODY ===
  ctx.fillStyle = "#2e6bc4";
  ctx.fillRect(cx - 5 * scale, cy - 4 * scale, 10 * scale, 10 * scale);
  ctx.strokeStyle = "#1a4a8c";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(cx - 5 * scale, cy - 4 * scale, 10 * scale, 10 * scale);
  // Shirt detail stripe
  ctx.fillStyle = "#3a7ed8";
  ctx.fillRect(cx - 5 * scale, cy - 1 * scale, 10 * scale, 2 * scale);

  // === ARMS ===
  // Left arm
  ctx.fillStyle = "#c08050";
  ctx.fillRect(cx - 9 * scale, cy - 4 * scale, 4 * scale, 8 * scale);
  ctx.strokeStyle = "#8b5e35";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(cx - 9 * scale, cy - 4 * scale, 4 * scale, 8 * scale);
  // Right arm (sleeve)
  ctx.fillStyle = "#2e6bc4";
  ctx.fillRect(cx + 5 * scale, cy - 4 * scale, 4 * scale, 5 * scale);
  ctx.strokeStyle = "#1a4a8c";
  ctx.strokeRect(cx + 5 * scale, cy - 4 * scale, 4 * scale, 5 * scale);
  // Right arm forearm (skin)
  ctx.fillStyle = "#c08050";
  ctx.fillRect(cx + 5 * scale, cy + 1 * scale, 4 * scale, 3 * scale);
  ctx.strokeStyle = "#8b5e35";
  ctx.strokeRect(cx + 5 * scale, cy + 1 * scale, 4 * scale, 3 * scale);

  // === HEAD ===
  // Head base (skin)
  ctx.fillStyle = "#d4956a";
  ctx.fillRect(cx - 6 * scale, cy - 16 * scale, 12 * scale, 12 * scale);
  ctx.strokeStyle = "#8b6040";
  ctx.lineWidth = 0.8;
  ctx.strokeRect(cx - 6 * scale, cy - 16 * scale, 12 * scale, 12 * scale);

  // Hair top
  ctx.fillStyle = "#3b2206";
  ctx.fillRect(cx - 6 * scale, cy - 16 * scale, 12 * scale, 4 * scale);
  // Hair sides
  ctx.fillRect(cx - 6 * scale, cy - 16 * scale, 2 * scale, 7 * scale);
  ctx.fillRect(cx + 4 * scale, cy - 16 * scale, 2 * scale, 7 * scale);

  // Eyes (white part)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(cx - 5 * scale, cy - 10 * scale, 4 * scale, 3 * scale);
  ctx.fillRect(cx + 1 * scale, cy - 10 * scale, 4 * scale, 3 * scale);
  // Pupils
  ctx.fillStyle = "#4169e1";
  ctx.fillRect(cx - 4 * scale, cy - 10 * scale, 2 * scale, 2 * scale);
  ctx.fillRect(cx + 2 * scale, cy - 10 * scale, 2 * scale, 2 * scale);
  // Eye outline
  ctx.strokeStyle = "#2a2a2a";
  ctx.lineWidth = 0.4;
  ctx.strokeRect(cx - 5 * scale, cy - 10 * scale, 4 * scale, 3 * scale);
  ctx.strokeRect(cx + 1 * scale, cy - 10 * scale, 4 * scale, 3 * scale);

  // Nose
  ctx.fillStyle = "#b07845";
  ctx.fillRect(cx - 1 * scale, cy - 7 * scale, 2 * scale, 1 * scale);

  // Mouth
  ctx.fillStyle = "#7a3e1e";
  ctx.fillRect(cx - 3 * scale, cy - 5 * scale, 2 * scale, 1 * scale);
  ctx.fillRect(cx + 1 * scale, cy - 5 * scale, 2 * scale, 1 * scale);
}

function drawBotPlayer(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  // Shadow
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(cx, cy + r * 0.9, r * 0.8, r * 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Outer glow
  const glow = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r * 1.6);
  glow.addColorStop(0, "rgba(229, 72, 77, 0.3)");
  glow.addColorStop(1, "rgba(229, 72, 77, 0)");
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.6, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  // Body
  const bodyGrad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  bodyGrad.addColorStop(0, "#ff6b6e");
  bodyGrad.addColorStop(0.5, "#e5484d");
  bodyGrad.addColorStop(1, "#9b1f23");
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  // Ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = "#ff9a9c";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Visor
  ctx.fillStyle = "rgba(20, 20, 30, 0.85)";
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.15, r * 0.65, r * 0.28, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye glow
  ctx.fillStyle = "#ff3333";
  ctx.shadowColor = "#ff0000";
  ctx.shadowBlur = 6;
  ctx.fillRect(cx - r * 0.45, cy - r * 0.28, r * 0.28, r * 0.14);
  ctx.fillRect(cx + r * 0.17, cy - r * 0.28, r * 0.28, r * 0.14);
  ctx.shadowBlur = 0;

  // Shine
  ctx.beginPath();
  ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.fill();
}

function drawIndicatorLight(ctx: CanvasRenderingContext2D, x: number, y: number, isPlayer: boolean) {
  const r = 5;
  const color = isPlayer ? "48, 164, 108" : "229, 72, 77";
  const solidColor = isPlayer ? "#30a46c" : "#e5484d";

  const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
  glow.addColorStop(0, `rgba(${color}, 0.9)`);
  glow.addColorStop(0.5, `rgba(${color}, 0.4)`);
  glow.addColorStop(1, `rgba(${color}, 0)`);
  ctx.beginPath();
  ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = solidColor;
  ctx.fill();

  // Shine
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fill();
}

export default function Play() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameState = useGameState();

  useEffect(() => {
    if (gameState.gameStatus !== "playing") {
      const timer = setTimeout(() => {
        navigate("/results", {
          state: {
            won: gameState.gameStatus === "won",
            kills: gameState.playerKills,
            survivedTime: gameState.survivedTime,
            totalPlayers: GAME_CONFIG.INITIAL_PLAYERS,
          },
        });
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [gameState.gameStatus, gameState.playerKills, gameState.survivedTime, navigate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = GAME_CONFIG.ARENA_SIZE;
    canvas.height = GAME_CONFIG.ARENA_SIZE;

    const render = () => {
      const W = canvas.width;
      const H = canvas.height;

      // === BACKGROUND ===
      // Base dark earth tone
      ctx.fillStyle = "#1c1f15";
      ctx.fillRect(0, 0, W, H);

      // Terrain patches
      const terrainColors = ["#222818", "#1e2514", "#252b1a", "#1a1e12"];
      for (let tx = 0; tx < W; tx += 80) {
        for (let ty = 0; ty < H; ty += 80) {
          ctx.fillStyle = terrainColors[((tx / 80 + ty / 80) % terrainColors.length)];
          ctx.fillRect(tx, ty, 80, 80);
        }
      }

      // Grass texture dots
      ctx.save();
      ctx.globalAlpha = 0.12;
      for (let i = 0; i < 400; i++) {
        const gx = (i * 137.5) % W;
        const gy = (i * 97.3) % H;
        ctx.fillStyle = i % 3 === 0 ? "#4a7c3f" : "#3a6030";
        ctx.fillRect(gx, gy, 2, 4);
      }
      ctx.restore();

      // Grid lines (subtle)
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      const gridSize = 80;
      for (let x = 0; x <= W; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y <= H; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // === DANGER ZONE (outside safe zone) ===
      ctx.save();
      ctx.fillStyle = "rgba(229, 72, 77, 0.18)";
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(gameState.safeZoneCenter.x, gameState.safeZoneCenter.y, gameState.safeZoneRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // === SAFE ZONE RING ===
      // Pulsing outer glow
      const pulseAlpha = 0.15 + 0.08 * Math.sin(Date.now() / 500);
      const safeGlow = ctx.createRadialGradient(
        gameState.safeZoneCenter.x, gameState.safeZoneCenter.y, gameState.safeZoneRadius - 20,
        gameState.safeZoneCenter.x, gameState.safeZoneCenter.y, gameState.safeZoneRadius + 20,
      );
      safeGlow.addColorStop(0, `rgba(62, 99, 221, ${pulseAlpha})`);
      safeGlow.addColorStop(0.5, `rgba(62, 99, 221, ${pulseAlpha * 0.6})`);
      safeGlow.addColorStop(1, "rgba(62, 99, 221, 0)");
      ctx.beginPath();
      ctx.arc(gameState.safeZoneCenter.x, gameState.safeZoneCenter.y, gameState.safeZoneRadius + 20, 0, Math.PI * 2);
      ctx.fillStyle = safeGlow;
      ctx.fill();

      // Hard ring
      ctx.beginPath();
      ctx.arc(gameState.safeZoneCenter.x, gameState.safeZoneCenter.y, gameState.safeZoneRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "#6e8fff";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([12, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      // === BULLETS ===
      gameState.bullets.forEach((bullet) => {
        // Glow
        const bGlow = ctx.createRadialGradient(
          bullet.position.x, bullet.position.y, 0,
          bullet.position.x, bullet.position.y, 10,
        );
        bGlow.addColorStop(0, "rgba(255, 240, 0, 0.8)");
        bGlow.addColorStop(1, "rgba(255, 200, 0, 0)");
        ctx.beginPath();
        ctx.arc(bullet.position.x, bullet.position.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = bGlow;
        ctx.fill();
        // Core
        ctx.beginPath();
        ctx.arc(bullet.position.x, bullet.position.y, GAME_CONFIG.BULLET_SIZE / 2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffee00";
        ctx.fill();
        ctx.strokeStyle = "#ff9900";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // === PLAYERS ===
      const playerScale = GAME_CONFIG.PLAYER_SIZE / 32;

      gameState.players.forEach((player) => {
        if (!player.isAlive) return;

        const px = player.position.x;
        const py = player.position.y;
        const halfSize = GAME_CONFIG.PLAYER_SIZE / 2;

        // Indicator light
        drawIndicatorLight(ctx, px, py - halfSize - 22, player.isPlayer);

        // Character
        if (player.isPlayer) {
          drawMinecraftPlayer(ctx, px, py, playerScale);
        } else {
          drawBotPlayer(ctx, px, py, halfSize);
        }

        // Health bar background
        const barW = GAME_CONFIG.PLAYER_SIZE + 8;
        const barH = 4;
        const barX = px - barW / 2;
        const barY = py - halfSize - 12;

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 2);
        ctx.fill();

        // Health bar fill
        const hp = player.health / GAME_CONFIG.PLAYER_MAX_HEALTH;
        const fillColor = hp > 0.5 ? "#30a46c" : hp > 0.25 ? "#f76a15" : "#e5484d";
        ctx.fillStyle = fillColor;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW * hp, barH, 2);
        ctx.fill();
      });

      // === GAME OVER OVERLAY ===
      if (gameState.gameStatus !== "playing") {
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(0, 0, W, H);

        const isWon = gameState.gameStatus === "won";
        const text = isWon ? "VICTORY ROYALE!" : "ELIMINATED";
        const textColor = isWon ? "#30a46c" : "#e5484d";
        const glowColor = isWon ? "rgba(48,164,108,0.6)" : "rgba(229,72,77,0.6)";

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 52px Montserrat, sans-serif";

        // Text glow
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 30;
        ctx.fillStyle = textColor;
        ctx.fillText(text, W / 2, H / 2);
        ctx.shadowBlur = 0;

        ctx.font = "18px Inter, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillText("Returning to results...", W / 2, H / 2 + 50);
      }
    };

    const animationId = requestAnimationFrame(function animate() {
      render();
      requestAnimationFrame(animate);
    });

    return () => cancelAnimationFrame(animationId);
  }, [gameState]);

  const player = gameState.players.find((p) => p.id === "player");
  const alivePlayers = gameState.players.filter((p) => p.isAlive).length;
  const hp = player?.health ?? 0;
  const hpPercent = (hp / GAME_CONFIG.PLAYER_MAX_HEALTH) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.gameWrapper}>
        <canvas ref={canvasRef} className={styles.canvas} id="game-canvas" />

        <div className={styles.uiOverlay}>
          {/* Top HUD */}
          <div className={styles.topHud}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>👥 Alive</span>
              <span className={styles.statValue}>{alivePlayers}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>💀 Kills</span>
              <span className={styles.statValue}>{gameState.playerKills}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>⏱ Time</span>
              <span className={styles.statValue}>{gameState.survivedTime}s</span>
            </div>
          </div>

          {/* Bottom HUD */}
          <div className={styles.bottomHud}>
            <div className={styles.healthPanel}>
              <div className={styles.healthHeader}>
                <span className={styles.healthLabel}>❤ Health</span>
                <span className={styles.healthValue}>{hp}</span>
              </div>
              <div className={styles.healthTrack}>
                <div
                  className={`${styles.healthFill} ${
                    hp <= 25 ? styles.critical : hp <= 50 ? styles.warning : ""
                  }`}
                  style={{ width: `${hpPercent}%` }}
                />
              </div>
            </div>

            <div className={styles.controls}>
              <p className={styles.controlsTitle}>Controls</p>
              <div className={styles.controlsList}>
                <div className={styles.controlItem}>
                  <kbd className={styles.key}>WASD</kbd>
                  <span>Move</span>
                </div>
                <div className={styles.controlItem}>
                  <kbd className={styles.key}>Click</kbd>
                  <span>Shoot</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
