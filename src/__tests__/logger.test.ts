import { describe, it, expect, beforeEach, vi } from "vitest";
import { LogLevel } from "../logger";

describe("Logger", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("should export LogLevel constants", () => {
    expect(LogLevel.SILLY).toBe(0);
    expect(LogLevel.TRACE).toBe(1);
    expect(LogLevel.DEBUG).toBe(2);
    expect(LogLevel.INFO).toBe(3);
    expect(LogLevel.WARN).toBe(4);
    expect(LogLevel.ERROR).toBe(5);
    expect(LogLevel.FATAL).toBe(6);
  });

  it("should have all log levels in correct order", () => {
    expect(LogLevel.SILLY).toBeLessThan(LogLevel.TRACE);
    expect(LogLevel.TRACE).toBeLessThan(LogLevel.DEBUG);
    expect(LogLevel.DEBUG).toBeLessThan(LogLevel.INFO);
    expect(LogLevel.INFO).toBeLessThan(LogLevel.WARN);
    expect(LogLevel.WARN).toBeLessThan(LogLevel.ERROR);
    expect(LogLevel.ERROR).toBeLessThan(LogLevel.FATAL);
  });
});
