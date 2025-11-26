import { vi } from "vitest";

type Function = (...args: any[]) => any;

// Mock Phaser module
export default {
  Events: {
    EventEmitter: class EventEmitter {
      private events: Map<string, Function[]> = new Map();

      on(event: string, fn: Function) {
        if (!this.events.has(event)) {
          this.events.set(event, []);
        }
        this.events.get(event)?.push(fn);
      }

      off(event: string, fn: Function) {
        const listeners = this.events.get(event);
        if (listeners) {
          const index = listeners.indexOf(fn);
          if (index > -1) {
            listeners.splice(index, 1);
          }
        }
      }

      emit(event: string, ...args: any[]) {
        const listeners = this.events.get(event);
        if (listeners) {
          listeners.forEach((fn) => fn(...args));
        }
      }

      once(event: string, fn: Function) {
        const onceFn = (...args: any[]) => {
          fn(...args);
          this.off(event, onceFn);
        };
        this.on(event, onceFn);
      }

      removeAllListeners(event?: string) {
        if (event) {
          this.events.delete(event);
        } else {
          this.events.clear();
        }
      }
    },
  },
  Math: {
    Clamp: (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), max),
  },
  Scene: class Scene {
    sound = {
      add: vi.fn(() => ({
        play: vi.fn(),
        stop: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        destroy: vi.fn(),
        once: vi.fn(),
        isPlaying: false,
        isPaused: false,
        setVolume: vi.fn(),
      })),
    };
    load = {
      audio: vi.fn(),
    };
  },
};
