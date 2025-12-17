import { createRoot } from "react-dom/client";
import "./i18n";
import App from "./App";
import "./App.css";
import i18n from "./i18n";
import { useSettingStore } from "./store";
import "vite/modulepreload-polyfill";

async function init() {
  const currentLanguage = await i18n.changeLanguage();
  useSettingStore.getState().setLanguage(currentLanguage);
  const root = createRoot(document.getElementById("root")!);
  root.render(<App />);
}

init();
