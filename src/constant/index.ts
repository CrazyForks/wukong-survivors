import type {
  GameMap,
  PermanentUpgrade,
  GameSave,
  MapType,
} from "../types/types";

export const DEFAULT_GAME_TIME = 30 * 60; // 30 minutes in seconds

// Map data - Wukong chapters
export const MAPS: GameMap[] = [
  {
    id: "chapter1",
    chapter: 1,
    unlockCondition: {
      type: "default",
      value: 0,
    },
    difficulty: 1,
    availableEnemies: [
      "wolf_minion",
      "ghost_minion",
      "bear_elite",
      "snake_elite",
    ],
    gameTime: DEFAULT_GAME_TIME,
  },
  {
    id: "chapter2",
    chapter: 2,
    unlockCondition: {
      type: "chapter",
      value: 1,
    },
    difficulty: 2,
    availableEnemies: [
      "rat_minion",
      "sand_minion",
      "tiger_elite",
      "wind_elite",
    ],
    gameTime: DEFAULT_GAME_TIME,
  },
  {
    id: "chapter3",
    chapter: 3,
    unlockCondition: {
      type: "chapter",
      value: 2,
    },
    difficulty: 3,
    availableEnemies: [
      "monk_minion",
      "spider_minion",
      "centipede_elite",
      "scorpion_elite",
    ],
    gameTime: DEFAULT_GAME_TIME,
  },
  {
    id: "chapter4",
    chapter: 4,
    unlockCondition: {
      type: "chapter",
      value: 3,
    },
    difficulty: 4,
    availableEnemies: [
      "spider_woman_minion",
      "centipede_minion",
      "violet_spider_elite",
      "poison_centipede_elite",
    ],
    gameTime: DEFAULT_GAME_TIME,
  },
  {
    id: "chapter5",
    chapter: 5,
    unlockCondition: {
      type: "chapter",
      value: 4,
    },
    difficulty: 5,
    availableEnemies: [
      "fire_demon_minion",
      "bull_soldier_minion",
      "fire_general_elite",
      "bull_captain_elite",
    ],
    gameTime: DEFAULT_GAME_TIME,
  },
  {
    id: "chapter6",
    chapter: 6,
    unlockCondition: {
      type: "chapter",
      value: 5,
    },
    difficulty: 6,
    availableEnemies: [
      "celestial_guard_minion",
      "thunder_minion",
      "celestial_general_elite",
      "dragon_guardian_elite",
    ],
    gameTime: DEFAULT_GAME_TIME,
  },
];

// Permanent upgrade configuration
export const PERMANENT_UPGRADES: PermanentUpgrade[] = [
  {
    id: "attack",
    level: 0,
    maxLevel: 10,
    cost: (level) => 50 + level * 50,
    effect: (level) => level * 2,
  },
  {
    id: "health",
    level: 0,
    maxLevel: 10,
    cost: (level) => 40 + level * 40,
    effect: (level) => level * 10,
  },
  {
    id: "armor",
    level: 0,
    maxLevel: 10,
    cost: (level) => 60 + level * 60,
    effect: (level) => level * 1,
  },
  {
    id: "luck",
    level: 0,
    maxLevel: 10,
    cost: (level) => 80 + level * 80,
    effect: (level) => level * 2,
  },
  {
    id: "speed",
    level: 0,
    maxLevel: 5,
    cost: (level) => 100 + level * 100,
    effect: (level) => level * 10,
  },
];

// Default save data
export const DEFAULT_SAVE: GameSave = {
  totalGold: 0,
  totalKills: 0,
  bestSurvivalTime: 0,
  totalPlayTime: 0,
  completedChapters: [],
  ownedWeapons: ["golden_staff"],
  language: "en-US",
  attack: 0,
  health: 0,
  armor: 0,
  luck: 0,
  speed: 0,
};

export const getMapImagePath = (id: MapType): string => {
  return `assets/maps/${id}.svg`;
};

export const EVENT_MAP = {
  BACK_TO_HOME: "BACK_TO_HOME",
  SHOW_END_GAME_MODAL: "SHOW_END_GAME_MODAL",
  EXP_COLLECTED: "EXP_COLLECTED",
};

export const GAME_SCENE_KEY = "GameScene";

export const SCREEN_SIZE = {
  width: window.innerWidth,
  height: window.innerHeight,
};

export const START_Z_INDEX = 2;

export * from "./characters";
export * from "./enemies";
export * from "./rewards";
