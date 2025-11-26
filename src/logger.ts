import { Logger } from "tslog";

export const LogLevel = {
  SILLY: 0,
  TRACE: 1,
  DEBUG: 2,
  INFO: 3,
  WARN: 4,
  ERROR: 5,
  FATAL: 6,
};
const minLevel = import.meta.env.DEV ? LogLevel.SILLY : LogLevel.INFO;

const logger = new Logger({
  type:
    !import.meta.env.DEV && !localStorage.getItem("debug")
      ? "hidden"
      : "pretty",
  minLevel,
});

export default logger;
