import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/play";
import styles from "./play.module.css";
import { useGameState } from "~/hooks/use-game-state";
import { GAME_CONFIG } from "~/data/game-config";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Playing - Bot Royale" }, { name: "description", content: "Battle royale in progress" }];
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
      }, 1500);

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
      // Clear canvas
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = "rgba(100, 100, 100, 0.2)";
      ctx.lineWidth = 1;
      const gridSize = 50;
      for (let x = 0; x <= GAME_CONFIG.ARENA_SIZE; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, GAME_CONFIG.ARENA_SIZE);
        ctx.stroke();
      }
      for (let y = 0; y <= GAME_CONFIG.ARENA_SIZE; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(GAME_CONFIG.ARENA_SIZE, y);
        ctx.stroke();
      }

      // Draw safe zone
      ctx.beginPath();
      ctx.arc(gameState.safeZoneCenter.x, gameState.safeZoneCenter.y, gameState.safeZoneRadius, 0, Math.PI * 2);
      ctx.strokeStyle = "#3e63dd";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = "rgba(62, 99, 221, 0.05)";
      ctx.fill();

      // Draw danger zone
      ctx.fillStyle = "rgba(229, 72, 77, 0.15)";
      ctx.fillRect(0, 0, GAME_CONFIG.ARENA_SIZE, GAME_CONFIG.ARENA_SIZE);

      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(gameState.safeZoneCenter.x, gameState.safeZoneCenter.y, gameState.safeZoneRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      // Draw bullets
      gameState.bullets.forEach((bullet) => {
        ctx.beginPath();
        ctx.arc(bullet.position.x, bullet.position.y, GAME_CONFIG.BULLET_SIZE / 2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffea00";
        ctx.fill();

        ctx.strokeStyle = "#ffc100";
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw players
      gameState.players.forEach((player) => {
        if (!player.isAlive) return;

        // Draw indicator light above player
        const lightY = player.position.y - GAME_CONFIG.PLAYER_SIZE / 2 - 25;
        const lightRadius = 5;

        // Light glow
        const gradient = ctx.createRadialGradient(
          player.position.x,
          lightY,
          0,
          player.position.x,
          lightY,
          lightRadius * 2,
        );

        if (player.isPlayer) {
          gradient.addColorStop(0, "rgba(48, 164, 108, 0.8)");
          gradient.addColorStop(0.5, "rgba(48, 164, 108, 0.4)");
          gradient.addColorStop(1, "rgba(48, 164, 108, 0)");
        } else {
          gradient.addColorStop(0, "rgba(229, 72, 77, 0.8)");
          gradient.addColorStop(0.5, "rgba(229, 72, 77, 0.4)");
          gradient.addColorStop(1, "rgba(229, 72, 77, 0)");
        }

        ctx.beginPath();
        ctx.arc(player.position.x, lightY, lightRadius * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Light core
        ctx.beginPath();
        ctx.arc(player.position.x, lightY, lightRadius, 0, Math.PI * 2);
        ctx.fillStyle = player.isPlayer ? "#30a46c" : "#e5484d";
        ctx.fill();

        // Light shine
        ctx.beginPath();
        ctx.arc(player.position.x - 1.5, lightY - 1.5, lightRadius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fill();

        // Draw player circle
        ctx.beginPath();
        ctx.arc(player.position.x, player.position.y, GAME_CONFIG.PLAYER_SIZE / 2, 0, Math.PI * 2);

        if (player.isPlayer) {
          ctx.fillStyle = "#30a46c";
          ctx.fill();
          ctx.strokeStyle = "#3dd68c";
          ctx.lineWidth = 3;
          ctx.stroke();
        } else {
          ctx.fillStyle = "#e5484d";
          ctx.fill();
          ctx.strokeStyle = "#ff8a88";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Health bar
        const barWidth = GAME_CONFIG.PLAYER_SIZE;
        const barHeight = 4;
        const barX = player.position.x - barWidth / 2;
        const barY = player.position.y - GAME_CONFIG.PLAYER_SIZE / 2 - 8;

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(barX, barY, barWidth, barHeight);

        const healthPercent = player.health / GAME_CONFIG.PLAYER_MAX_HEALTH;
        ctx.fillStyle = healthPercent > 0.5 ? "#30a46c" : healthPercent > 0.25 ? "#f76a15" : "#e5484d";
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
      });

      // Game over overlay
      if (gameState.gameStatus !== "playing") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, GAME_CONFIG.ARENA_SIZE, GAME_CONFIG.ARENA_SIZE);

        ctx.fillStyle = gameState.gameStatus === "won" ? "#30a46c" : "#e5484d";
        ctx.font = "bold 48px Montserrat, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          gameState.gameStatus === "won" ? "VICTORY ROYALE!" : "ELIMINATED",
          GAME_CONFIG.ARENA_SIZE / 2,
          GAME_CONFIG.ARENA_SIZE / 2,
        );
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

  return (
    <div className={styles.container}>
      <div className={styles.gameWrapper}>
        <canvas ref={canvasRef} className={styles.canvas} id="game-canvas" />

        <div className={styles.uiOverlay}>
          <div className={styles.topBar}>
            <div className={styles.statCard}>
              <p className={styles.statLabel}>Players Alive</p>
              <p className={styles.statValue}>{alivePlayers}</p>
            </div>

            <div className={styles.statCard}>
              <p className={styles.statLabel}>Kills</p>
              <p className={styles.statValue}>{gameState.playerKills}</p>
            </div>

            <div className={styles.statCard}>
              <p className={styles.statLabel}>Time</p>
              <p className={styles.statValue}>{gameState.survivedTime}s</p>
            </div>
          </div>

          <div className={styles.topBar}>
            <div className={styles.healthBar}>
              <div className={styles.healthLabel}>
                <span>Health</span>
                <span>{player?.health || 0}</span>
              </div>
              <div className={styles.healthBarTrack}>
                <div
                  className={`${styles.healthBarFill} ${
                    (player?.health || 0) <= 25 ? styles.low : (player?.health || 0) <= 50 ? styles.medium : ""
                  }`}
                  style={{ width: `${((player?.health || 0) / GAME_CONFIG.PLAYER_MAX_HEALTH) * 100}%` }}
                />
              </div>
            </div>

            <div className={styles.controls}>
              <p className={styles.controlsTitle}>Controls</p>
              <ul className={styles.controlsList}>
                <li className={styles.controlItem}>
                  <span className={styles.controlKey}>WASD</span>
                  <span>Move</span>
                </li>
                <li className={styles.controlItem}>
                  <span className={styles.controlKey}>Click</span>
                  <span>Shoot</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
