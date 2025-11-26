import { describe, it, expect, vi } from "vitest";
import eventBus from "../eventBus";

describe("EventBus", () => {
  it("should be an event emitter", () => {
    expect(eventBus).toBeDefined();
    expect(typeof eventBus.on).toBe("function");
    expect(typeof eventBus.emit).toBe("function");
    expect(typeof eventBus.off).toBe("function");
  });

  it("should emit and receive events", () => {
    const handler = vi.fn();
    const testEvent = "test-event";
    const testData = { value: 123 };

    eventBus.on(testEvent, handler);
    eventBus.emit(testEvent, testData);

    expect(handler).toHaveBeenCalledWith(testData);

    eventBus.off(testEvent, handler);
  });

  it("should handle multiple listeners", () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const testEvent = "multi-event";

    eventBus.on(testEvent, handler1);
    eventBus.on(testEvent, handler2);
    eventBus.emit(testEvent);

    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();

    eventBus.off(testEvent, handler1);
    eventBus.off(testEvent, handler2);
  });

  it("should remove event listeners", () => {
    const handler = vi.fn();
    const testEvent = "remove-event";

    eventBus.on(testEvent, handler);
    eventBus.off(testEvent, handler);
    eventBus.emit(testEvent);

    expect(handler).not.toHaveBeenCalled();
  });

  it("should support once listeners", () => {
    const handler = vi.fn();
    const testEvent = "once-event";

    eventBus.once(testEvent, handler);
    eventBus.emit(testEvent);
    eventBus.emit(testEvent);

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should remove all listeners for an event", () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const testEvent = "remove-all-event";

    eventBus.on(testEvent, handler1);
    eventBus.on(testEvent, handler2);
    eventBus.removeAllListeners(testEvent);
    eventBus.emit(testEvent);

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();
  });
});
