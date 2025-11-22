import React, { useEffect, useRef } from "react";
import styles from "./index.module.css";
import { GameScene } from "../../game/GameScene";
import { EVENT_MAP, SCREEN_SIZE } from "../../constant";
import Phaser from "phaser";
import EventBus from "../../game/eventBus";

interface GameWrapperProps {
  onBack: () => void;
}

const getConfig = (parent: HTMLElement) => {
  const config: Phaser.Types.Core.GameConfig = {
    ...SCREEN_SIZE,
    type: Phaser.AUTO,
    parent,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0, x: 0 },
        debug: false,
      },
    },
    scene: [GameScene],
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: "100%",
      height: "100%",
    },
    render: {
      pixelArt: false,
      antialias: true,
    },
  };

  return config;
};

const GameWrapper: React.FC<GameWrapperProps> = ({ onBack }) => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    gameRef.current = new Phaser.Game(getConfig(containerRef.current));

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        EventBus.emit(EVENT_MAP.SHOW_END_GAME_MODAL);
      }

      return false;
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    EventBus.on(EVENT_MAP.BACK_TO_HOME, onBack);
    return () => {
      EventBus.off(EVENT_MAP.BACK_TO_HOME, onBack);
    };
  }, []);

  return <div className={styles.gameContainer} ref={containerRef} />;
};

export default GameWrapper;
