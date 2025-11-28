export const EVENT_MAP = Object.freeze({
  BACK_TO_HOME: "BACK_TO_HOME",
  SHOW_END_GAME_MODAL: "SHOW_END_GAME_MODAL",
  EXP_COLLECTED: "EXP_COLLECTED",
} as const);

export const GAME_SCENE_KEY = "GameScene";

export const SCREEN_SIZE = {
  width: window.innerWidth,
  height: window.innerHeight,
};

export const START_Z_INDEX = 2;

export const MAX_SELECT_SIZE = 3;

export * from "./characters";
export * from "./enemies";
export * from "./rewards";
export * from "./map";
