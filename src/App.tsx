import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAppStore } from "./store";
import Home from "./pages/Home";
import MapSelect from "./pages/MapSelect";
import Shop from "./pages/Shop";
import Game from "./pages/Game";
import "./App.css";
import { type Screen } from "./types";
import _ from "lodash";

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [gameKey, setGameKey] = useState("");

  useEffect(() => {
    useAppStore.getState().checkUnlocks();
  }, [currentScreen]);

  const handleMapSelected = useCallback(() => {
    setGameKey(_.uniqueId());
    setCurrentScreen("game");
  }, []);

  const handleBackToHome = useCallback(() => {
    setCurrentScreen("home");
  }, []);

  // Screen components mapping for better maintainability
  const screenComponents = useMemo(
    () => ({
      mapSelect: (
        <MapSelect onSelect={handleMapSelected} onBack={handleBackToHome} />
      ),
      shop: <Shop onBack={handleBackToHome} />,
      game: <Game key={gameKey} onBack={handleBackToHome} />,
      home: <Home changeScreen={setCurrentScreen} />,
    }),
    [gameKey, handleMapSelected, handleBackToHome],
  );

  return screenComponents[currentScreen] || screenComponents.home;
};

export default App;
