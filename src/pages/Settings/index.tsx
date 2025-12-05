import { LanguageSelect } from "../../components";
import { useTranslation } from "react-i18next";
import {
  useEnableAutoSelect,
  useEnableUnlockAll,
  useSaveStore,
} from "../../store";
import styles from "./index.module.css";

export const Settings = ({ onBack }: { onBack: () => void }) => {
  const [t] = useTranslation();
  const enableAutoSelect = useEnableAutoSelect();
  const enableUnlockAll = useEnableUnlockAll();
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
        <label htmlFor="select-langauge">{t("settings.chooseLanguage")}</label>
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
            useSaveStore.getState().setAutoSelectEnabled(e.target.checked)
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
            useSaveStore.getState().setUnlockAllnabled(e.target.checked)
          }
        />
      </div>
    </div>
  );
};

export default Settings;
