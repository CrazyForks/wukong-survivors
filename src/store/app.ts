import { create } from "zustand";
import type { CharacterType, MapType, CharacterData, GameMap } from "../types";
import { useSaveStore } from "./save";
import { useShallow } from "zustand/react/shallow";
import { MAPS, CHARACTERS_DATA, DEFAULT_GAME_TIME } from "../constant";

type States = {
  selectedCharacter: CharacterType;
  selectedMap: MapType;
  killCount: number;
  gameTime: number;
};

type Actions = {
  selectCharacter: (characterId: CharacterType) => void;
  selectMap: (mapId: MapType) => void;
  getSelectCharacter: () => CharacterData;
  getSelectMap: () => GameMap;
  setKillCount: (count: number) => void;
  setGameTime: (time: number) => void;
};

type Store = States & Actions;

export const useAppStore = create<Store>((set, get) => {
  return {
    selectedCharacter: "destined_one",
    selectedMap: "chapter1",
    killCount: 0,
    gameTime: DEFAULT_GAME_TIME,
    setKillCount(count) {
      set({ killCount: count });
    },
    setGameTime(time) {
      const gameTime = time < 0 ? 0 : Math.floor(time);

      set({ gameTime });
    },
    selectCharacter: (characterId: CharacterType) => {
      const { unlockedCharacters } = useSaveStore.getState();
      if (unlockedCharacters.includes(characterId)) {
        set({ selectedCharacter: characterId });
      }
    },

    selectMap: (mapId: MapType) => {
      const { unlockedMaps } = useSaveStore.getState();
      if (unlockedMaps.includes(mapId)) {
        set({ selectedMap: mapId });
      }
    },
    getSelectCharacter() {
      const { selectedCharacter } = get();

      return (
        CHARACTERS_DATA[selectedCharacter] || CHARACTERS_DATA["destined_one"]
      );
    },
    getSelectMap() {
      const { selectedMap } = get();

      return MAPS.find((map) => map.id === selectedMap) || MAPS[0];
    },
  };
});

const getSelectedCharacter = (state: Store) => state.selectedCharacter;
const getSelectedMap = (state: Store) => state.selectedMap;
const getKillCount = (state: Store) => state.killCount;
const getGameTime = (state: Store) => state.gameTime;

export const useSelectedCharacter = () =>
  useAppStore(useShallow(getSelectedCharacter));
export const useSelectedMap = () => useAppStore(useShallow(getSelectedMap));
export const useKillCount = () => useAppStore(useShallow(getKillCount));
export const useGameTime = () => useAppStore(useShallow(getGameTime));
