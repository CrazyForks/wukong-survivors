import { LanguageSelect } from "../../components";
import { useTranslation } from "react-i18next";
import {
  useEnableAutoSelect,
  useEnableUnlockAll,
  useSaveStore,
  useMusicEnabled,
  useMusicVolume,
} from "../../store";
import styles from "./index.module.css";

export const Settings = ({ onBack }: { onBack: () => void }) => {
  const [t] = useTranslation();
  const enableAutoSelect = useEnableAutoSelect();
  const enableUnlockAll = useEnableUnlockAll();
  const musicEnabled = useMusicEnabled();
  const musicVolume = useMusicVolume();
  return (
    <div className="center-container">
      <button
        className={`backButton closeButton ${styles.closeButton}`}
        onClick={onBack}
        data-testid="back-to-home-button"
      >
        X
      </button>
      <h1 data-testid="page-title">{t("settings.title")}</h1>
      <div className={styles.list}>
        <label htmlFor="select-language">{t("settings.chooseLanguage")}</label>
        <LanguageSelect />
      </div>
      <div className={styles.list}>
        <label htmlFor="auto-select">{t("settings.autoSelect")}</label>
        <input
          type="checkbox"
          id="auto-select"
          name="auto-select"
          checked={enableAutoSelect}
          onChange={(e) =>
            useSaveStore
              .getState()
              .setAutoSelectEnabled(Boolean(e.target.checked))
          }
        />
      </div>
      <div className={styles.list}>
        <label htmlFor="unlock-all">{t("settings.unlockAll")}</label>
        <input
          type="checkbox"
          id="unlock-all"
          name="unlock-all"
          checked={enableUnlockAll}
          onChange={(e) =>
            useSaveStore
              .getState()
              .setUnlockAllEnabled(Boolean(e.target.checked))
          }
        />
      </div>
      <div className={styles.list}>
        <label htmlFor="enable-music">{t("settings.enableMusic")}</label>
        <input
          type="checkbox"
          id="enable-music"
          name="enable-music"
          checked={musicEnabled}
          onChange={(e) =>
            useSaveStore.getState().setMusicEnabled(Boolean(e.target.checked))
          }
        />
      </div>
      <div className={styles.list}>
        <label htmlFor="music-volume">{`${t("settings.musicVolume")}: ${musicVolume}`}</label>
        <input
          type="range"
          id="music-volume"
          name="music-volume"
          min="0"
          max="1"
          value={musicVolume}
          step="0.01"
          onChange={(e) => {
            const value = Number(e.target.value);
            useSaveStore.getState().setMusicVolume(value);
          }}
        />
      </div>
    </div>
  );
};

export default Settings;
