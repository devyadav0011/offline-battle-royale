import { Link } from "react-router";
import type { Route } from "./+types/home";
import styles from "./home.module.css";
import { Target, Users, Zap, Trophy } from "lucide-react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Bot Royale - Battle Against AI" },
    {
      name: "description",
      content: "Engage in an intense battle royale against AI opponents. Quick-play action in your browser!",
    },
  ];
}

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logo}>
          <Target className={styles.logoIcon} />
        </div>

        <h1 className={styles.title}>Bot Royale</h1>
        <p className={styles.subtitle}>
          Battle against AI opponents in an intense arena showdown. Last player standing wins!
        </p>

        <Link to="/play">
          <button className={styles.startButton}>Start Game</button>
        </Link>

        <div className={styles.features}>
          <div className={styles.feature}>
            <Users className={styles.featureIcon} />
            <h3 className={styles.featureTitle}>20 Players</h3>
            <p className={styles.featureDescription}>Face off against 19 AI opponents in every match</p>
          </div>

          <div className={styles.feature}>
            <Zap className={styles.featureIcon} />
            <h3 className={styles.featureTitle}>Fast-Paced</h3>
            <p className={styles.featureDescription}>Quick matches with shrinking safe zones and intense combat</p>
          </div>

          <div className={styles.feature}>
            <Trophy className={styles.featureIcon} />
            <h3 className={styles.featureTitle}>Victory Royale</h3>
            <p className={styles.featureDescription}>Survive, eliminate opponents, and claim your victory</p>
          </div>
        </div>
      </div>
    </div>
  );
}
