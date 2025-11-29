import React, { useState, useEffect, useCallback } from "react";
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

  if (currentScreen === "mapSelect") {
    return <MapSelect onSelect={handleMapSelected} onBack={handleBackToHome} />;
  }
  if (currentScreen === "shop") {
    return <Shop onBack={handleBackToHome} />;
  }
  if (currentScreen === "game") {
    return <Game key={gameKey} onBack={handleBackToHome} />;
  }

  return <Home changeScreen={setCurrentScreen} />;
};

export default App;
