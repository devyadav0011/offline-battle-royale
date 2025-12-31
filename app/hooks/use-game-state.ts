import { useState, useEffect, useCallback, useRef } from "react";
import { GAME_CONFIG } from "~/data/game-config";

export interface Position {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  position: Position;
  health: number;
  isAlive: boolean;
  isPlayer: boolean;
  kills: number;
}

export interface Bullet {
  id: string;
  position: Position;
  velocity: Position;
  ownerId: string;
}

export interface GameState {
  players: Player[];
  bullets: Bullet[];
  safeZoneRadius: number;
  safeZoneCenter: Position;
  gameStatus: "playing" | "won" | "lost";
  survivedTime: number;
  playerKills: number;
}

const createPlayer = (id: string, isPlayer: boolean): Player => {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.random() * (GAME_CONFIG.INITIAL_SAFE_ZONE_RADIUS - 100);

  return {
    id,
    position: {
      x: GAME_CONFIG.ARENA_SIZE / 2 + Math.cos(angle) * distance,
      y: GAME_CONFIG.ARENA_SIZE / 2 + Math.sin(angle) * distance,
    },
    health: GAME_CONFIG.PLAYER_MAX_HEALTH,
    isAlive: true,
    isPlayer,
    kills: 0,
  };
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const players: Player[] = [createPlayer("player", true)];

    for (let i = 1; i < GAME_CONFIG.INITIAL_PLAYERS; i++) {
      players.push(createPlayer(`bot-${i}`, false));
    }

    return {
      players,
      bullets: [],
      safeZoneRadius: GAME_CONFIG.INITIAL_SAFE_ZONE_RADIUS,
      safeZoneCenter: { x: GAME_CONFIG.ARENA_SIZE / 2, y: GAME_CONFIG.ARENA_SIZE / 2 },
      gameStatus: "playing",
      survivedTime: 0,
      playerKills: 0,
    };
  });

  const keysPressed = useRef<Set<string>>(new Set());
  const lastShotTime = useRef<number>(0);
  const gameStartTime = useRef<number>(Date.now());
  const lastZoneShrink = useRef<number>(Date.now());
  const lastZoneDamage = useRef<number>(Date.now());
  const aiLastShot = useRef<Map<string, number>>(new Map());

  const shoot = useCallback((playerId: string, targetPos: Position) => {
    const now = Date.now();

    if (playerId === "player" && now - lastShotTime.current < GAME_CONFIG.PLAYER_SHOOT_COOLDOWN) {
      return;
    }

    if (playerId !== "player") {
      const lastShot = aiLastShot.current.get(playerId) || 0;
      if (now - lastShot < GAME_CONFIG.AI_SHOOT_COOLDOWN) {
        return;
      }
      aiLastShot.current.set(playerId, now);
    } else {
      lastShotTime.current = now;
    }

    setGameState((prev) => {
      const shooter = prev.players.find((p) => p.id === playerId);
      if (!shooter || !shooter.isAlive) return prev;

      const dx = targetPos.x - shooter.position.x;
      const dy = targetPos.y - shooter.position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const velocity = {
        x: (dx / distance) * GAME_CONFIG.BULLET_SPEED,
        y: (dy / distance) * GAME_CONFIG.BULLET_SPEED,
      };

      const newBullet: Bullet = {
        id: `bullet-${Date.now()}-${Math.random()}`,
        position: { ...shooter.position },
        velocity,
        ownerId: playerId,
      };

      return {
        ...prev,
        bullets: [...prev.bullets, newBullet],
      };
    });
  }, []);

  const handleMouseClick = useCallback(
    (e: MouseEvent) => {
      if (gameState.gameStatus !== "playing") return;

      const canvas = document.getElementById("game-canvas");
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = GAME_CONFIG.ARENA_SIZE / rect.width;
      const scaleY = GAME_CONFIG.ARENA_SIZE / rect.height;

      const targetPos = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };

      shoot("player", targetPos);
    },
    [gameState.gameStatus, shoot],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("click", handleMouseClick);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("click", handleMouseClick);
    };
  }, [handleMouseClick]);

  useEffect(() => {
    if (gameState.gameStatus !== "playing") return;

    const gameLoop = setInterval(() => {
      setGameState((prev) => {
        let newState = { ...prev };
        const now = Date.now();

        // Update survived time
        newState.survivedTime = Math.floor((now - gameStartTime.current) / 1000);

        // Move player
        const player = newState.players.find((p) => p.id === "player");
        if (player && player.isAlive) {
          let dx = 0;
          let dy = 0;

          if (keysPressed.current.has("w") || keysPressed.current.has("arrowup")) dy -= 1;
          if (keysPressed.current.has("s") || keysPressed.current.has("arrowdown")) dy += 1;
          if (keysPressed.current.has("a") || keysPressed.current.has("arrowleft")) dx -= 1;
          if (keysPressed.current.has("d") || keysPressed.current.has("arrowright")) dx += 1;

          if (dx !== 0 || dy !== 0) {
            const magnitude = Math.sqrt(dx * dx + dy * dy);
            dx = (dx / magnitude) * GAME_CONFIG.PLAYER_SPEED;
            dy = (dy / magnitude) * GAME_CONFIG.PLAYER_SPEED;

            player.position.x = Math.max(0, Math.min(GAME_CONFIG.ARENA_SIZE, player.position.x + dx));
            player.position.y = Math.max(0, Math.min(GAME_CONFIG.ARENA_SIZE, player.position.y + dy));
          }
        }

        // AI behavior
        newState.players.forEach((bot) => {
          if (bot.isPlayer || !bot.isAlive) return;

          // Move towards safe zone center
          const dx = newState.safeZoneCenter.x - bot.position.x;
          const dy = newState.safeZoneCenter.y - bot.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > newState.safeZoneRadius * 0.7) {
            bot.position.x += (dx / distance) * GAME_CONFIG.PLAYER_SPEED * 0.8;
            bot.position.y += (dy / distance) * GAME_CONFIG.PLAYER_SPEED * 0.8;
          } else {
            // Random movement
            bot.position.x += (Math.random() - 0.5) * GAME_CONFIG.PLAYER_SPEED;
            bot.position.y += (Math.random() - 0.5) * GAME_CONFIG.PLAYER_SPEED;
          }

          bot.position.x = Math.max(0, Math.min(GAME_CONFIG.ARENA_SIZE, bot.position.x));
          bot.position.y = Math.max(0, Math.min(GAME_CONFIG.ARENA_SIZE, bot.position.y));

          // AI shooting
          if (Math.random() < 0.02) {
            const targets = newState.players.filter((p) => p.isAlive && p.id !== bot.id);
            if (targets.length > 0) {
              const target = targets[Math.floor(Math.random() * targets.length)];
              const targetDist = Math.sqrt(
                Math.pow(target.position.x - bot.position.x, 2) + Math.pow(target.position.y - bot.position.y, 2),
              );

              if (targetDist < 200) {
                shoot(bot.id, target.position);
              }
            }
          }
        });

        // Update bullets
        newState.bullets = newState.bullets.filter((bullet) => {
          bullet.position.x += bullet.velocity.x;
          bullet.position.y += bullet.velocity.y;

          // Remove if out of bounds
          if (
            bullet.position.x < 0 ||
            bullet.position.x > GAME_CONFIG.ARENA_SIZE ||
            bullet.position.y < 0 ||
            bullet.position.y > GAME_CONFIG.ARENA_SIZE
          ) {
            return false;
          }

          // Check collisions
          for (const player of newState.players) {
            if (!player.isAlive || player.id === bullet.ownerId) continue;

            const dx = player.position.x - bullet.position.x;
            const dy = player.position.y - bullet.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < GAME_CONFIG.PLAYER_SIZE / 2) {
              player.health -= GAME_CONFIG.BULLET_DAMAGE;

              if (player.health <= 0) {
                player.isAlive = false;
                const shooter = newState.players.find((p) => p.id === bullet.ownerId);
                if (shooter) {
                  shooter.kills++;
                  if (shooter.isPlayer) {
                    newState.playerKills++;
                  }
                }
              }

              return false;
            }
          }

          return true;
        });

        // Shrink safe zone
        if (now - lastZoneShrink.current > GAME_CONFIG.SAFE_ZONE_SHRINK_INTERVAL) {
          if (newState.safeZoneRadius > GAME_CONFIG.MIN_SAFE_ZONE_RADIUS) {
            newState.safeZoneRadius = Math.max(
              GAME_CONFIG.MIN_SAFE_ZONE_RADIUS,
              newState.safeZoneRadius - GAME_CONFIG.SAFE_ZONE_SHRINK_AMOUNT,
            );
            lastZoneShrink.current = now;
          }
        }

        // Zone damage
        if (now - lastZoneDamage.current > GAME_CONFIG.ZONE_DAMAGE_INTERVAL) {
          newState.players.forEach((player) => {
            if (!player.isAlive) return;

            const dx = player.position.x - newState.safeZoneCenter.x;
            const dy = player.position.y - newState.safeZoneCenter.y;
            const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);

            if (distanceFromCenter > newState.safeZoneRadius) {
              player.health -= GAME_CONFIG.ZONE_DAMAGE_PER_TICK;
              if (player.health <= 0) {
                player.isAlive = false;
              }
            }
          });
          lastZoneDamage.current = now;
        }

        // Check game over
        const alivePlayers = newState.players.filter((p) => p.isAlive);
        const playerAlive = alivePlayers.some((p) => p.id === "player");

        if (alivePlayers.length === 1 && playerAlive) {
          newState.gameStatus = "won";
        } else if (!playerAlive) {
          newState.gameStatus = "lost";
        }

        return newState;
      });
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [gameState.gameStatus, shoot]);

  return gameState;
};
