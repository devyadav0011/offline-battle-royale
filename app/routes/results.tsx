import { Link, useLocation } from "react-router";
import type { Route } from "./+types/results";
import styles from "./results.module.css";
import { Trophy, Skull, Target, Clock, Users, RotateCcw, Home } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Match Results - Bot Royale" }, { name: "description", content: "View your match results" }];
}

interface LocationState {
  won: boolean;
  kills: number;
  survivedTime: number;
  totalPlayers: number;
}

export default function Results() {
  const location = useLocation();
  const state = (location.state as LocationState) || {
    won: false,
    kills: 0,
    survivedTime: 0,
    totalPlayers: 20,
  };

  const { won, kills, survivedTime, totalPlayers } = state;
  const finalRank = won ? 1 : Math.floor(Math.random() * (totalPlayers - 1)) + 2;

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {won ? (
          <Trophy className={`${styles.outcomeIcon} ${styles.won}`} />
        ) : (
          <Skull className={`${styles.outcomeIcon} ${styles.lost}`} />
        )}

        <h1 className={`${styles.title} ${won ? styles.won : styles.lost}`}>
          {won ? "Victory Royale!" : "Eliminated"}
        </h1>

        <p className={styles.subtitle}>
          {won
            ? "Congratulations! You are the last player standing!"
            : `You finished in ${finalRank}${finalRank === 2 ? "nd" : finalRank === 3 ? "rd" : "th"} place. Better luck next time!`}
        </p>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <Users className={styles.statIcon} />
            <p className={styles.statLabel}>Final Rank</p>
            <p className={styles.statValue}>#{finalRank}</p>
          </div>

          <div className={styles.statCard}>
            <Target className={styles.statIcon} />
            <p className={styles.statLabel}>Eliminations</p>
            <p className={styles.statValue}>{kills}</p>
          </div>

          <div className={styles.statCard}>
            <Clock className={styles.statIcon} />
            <p className={styles.statLabel}>Survived</p>
            <p className={styles.statValue}>{survivedTime}s</p>
          </div>
        </div>

        <div className={styles.actions}>
          <Link to="/play">
            <button className={`${styles.button} ${styles.buttonPrimary}`}>
              <RotateCcw className={styles.buttonIcon} />
              Play Again
            </button>
          </Link>

          <Link to="/">
            <button className={`${styles.button} ${styles.buttonSecondary}`}>
              <Home className={styles.buttonIcon} />
              Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
