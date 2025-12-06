import React, { useState, useEffect, useCallback } from "react";
import { useAppStore } from "./store";
import CharacterSelect from "./pages/CharacterSelect";
import MapSelect from "./pages/MapSelect";
import Shop from "./pages/Shop";
import Game from "./pages/Game";
import "./App.css";
import { type Screen } from "./types";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import Stats from "./pages/Stats";
import Wiki from "./pages/Wiki";

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>("game");
  useEffect(() => {
    useAppStore.getState().checkUnlocks();
  }, [currentScreen]);

  const onGoToGame = useCallback(() => {
    setCurrentScreen("game");
  }, []);

  const onGoToHome = useCallback(() => {
    setCurrentScreen("home");
  }, []);

  const onGoToMap = useCallback(() => {
    setCurrentScreen("mapSelect");
  }, []);

  const onGoToCharacter = useCallback(() => {
    setCurrentScreen("characterSelect");
  }, []);

  const screenComponents = {
    mapSelect: <MapSelect onConfirm={onGoToGame} onBack={onGoToCharacter} />,
    shop: <Shop onBack={onGoToHome} />,
    game: <Game onBack={onGoToHome} />,
    characterSelect: (
      <CharacterSelect onConfirm={onGoToMap} onBack={onGoToHome} />
    ),
    settings: <Settings onBack={onGoToHome} />,
    stats: <Stats onBack={onGoToHome} />,
    wiki: <Wiki onBack={onGoToHome} />,
    home: <Home changeScreen={setCurrentScreen} />,
  };

  return screenComponents[currentScreen] || screenComponents.home;
};

export default App;
