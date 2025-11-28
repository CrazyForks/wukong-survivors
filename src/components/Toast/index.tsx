import React from "react";
import { createRoot, type Root } from "react-dom/client";
import styles from "./index.module.css";
import { MessageType } from "../../types";

type Props = {
  message: string;
  type: MessageType;
  duration?: number; // second
  testId: string;
};

export const Toast: React.FC<Omit<Props, "duration">> = React.memo(
  ({ message, type, testId }) => {
    return (
      <div
        className={`${styles["toast"]} ${styles[type]}`}
        data-testid={testId}
      >
        <div className={styles["content"]}>{message}</div>
      </div>
    );
  },
);

Toast.displayName = "Toast";

export function toast(props: Props) {
  const { duration = 3, ...rest } = props;
  let container: HTMLDivElement | null = document.createElement("div");
  container.className = styles["container"];
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  root.render(<Toast {...rest} />);

  function close() {
    if (!container) {
      return;
    }
    root.unmount();
    if (container.parentNode) {
      document.body.removeChild(container);
    }
    container = null;
  }

  const timer = setTimeout(close, duration * 1000);

  // Return enhanced close function that also clears timer
  return () => {
    clearTimeout(timer);
    close();
  };
}

toast.error = function (message: string, testId = "error-toast") {
  return toast({ message, type: "error", testId });
};

toast.info = function (message: string, testId = "info-toast") {
  return toast({ message, type: "info", testId });
};

toast.warning = function (message: string, testId = "warning-toast") {
  return toast({ message, type: "warning", testId });
};

toast.success = function (message: string, testId = "success-toast") {
  return toast({ message, type: "success", testId });
};
