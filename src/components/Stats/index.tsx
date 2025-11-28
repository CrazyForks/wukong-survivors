import React from "react";
import { useTranslation } from "react-i18next";
import {
  useUnlockedCharacters,
  useTotalGold,
  useTotalKills,
  useBestSurvivalTime,
  useTotalPlayTime,
  useCompletedChapters,
} from "../../store";
import { CHARACTERS_DATA } from "../../constant";
import { MAPS } from "../../constant/map";
import styles from "./index.module.css";
import { formatTime } from "../../util";

const chatterList = Object.keys(CHARACTERS_DATA);

const Stats: React.FC = () => {
  const [t] = useTranslation();
  const unlockedCharacters = useUnlockedCharacters();
  const completedChapters = useCompletedChapters();
  const totalGold = useTotalGold();
  const totalKills = useTotalKills();
  const bestSurvivalTime = useBestSurvivalTime();
  const totalPlayTime = useTotalPlayTime();

  return (
    <div className={styles.statsGrid}>
      <div className={styles.stat}>
        <span className={styles.statLabel}>💰 {t("stats.gold")}:</span>
        <span className={styles.statValue}>{totalGold}</span>
      </div>
      <div className={styles.stat}>
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <span className={styles.statLabel}>⚔️ {t("stats.totalKills")}:</span>
        <span className={styles.statValue}>{totalKills}</span>
      </div>
      <div className={styles.stat}>
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <span className={styles.statLabel}>⏱️ {t("stats.bestSurvival")}:</span>
        <span className={styles.statValue}>{formatTime(bestSurvivalTime)}</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.statLabel}>🕒 {t("stats.totalPlayTime")}:</span>
        <span className={styles.statValue}>{formatTime(totalPlayTime)}</span>
      </div>
      <div className={styles.stat}>
        <span className={styles.statLabel}>
          {t("characters.unlockCharacter")}:
        </span>
        <span className={styles.statValue}>
          {unlockedCharacters.length}/{chatterList.length}
        </span>
      </div>
      <div className={styles.stat}>
        <span className={styles.statLabel}>{t("game.completeChapters")}:</span>
        <span className={styles.statValue}>
          {completedChapters.length}/{MAPS.length}
        </span>
      </div>
    </div>
  );
};

export default React.memo(Stats);
