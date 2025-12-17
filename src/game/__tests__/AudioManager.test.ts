import { describe, it, expect, beforeEach, vi } from "vitest";
import { AudioManager, SoundEffect } from "../AudioManager";
import { useSettingStore } from "../../store";

// Mock Phaser
const currentMockSound = {
  play: vi.fn(),
  stop: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  destroy: vi.fn(),
  once: vi.fn((event: string, callback: () => void) => {
    if (event === "complete") {
      // Call immediately for testing
      setTimeout(callback, 0);
    }
  }),
  isPlaying: false,
  isPaused: false,
  setVolume: vi.fn(),
};

const mockScene = {
  sound: {
    add: vi.fn(() => currentMockSound),
  },
  load: {
    audio: vi.fn(),
  },
} as any;

describe("AudioManager", () => {
  let audioManager: AudioManager;

  beforeEach(() => {
    useSettingStore.getState().resetAll();

    vi.clearAllMocks();
    mockScene.sound.add.mockReturnValue(currentMockSound);

    useSettingStore.getState().setMusicEnabled(true);
    useSettingStore.getState().setMusicVolume(0.5);

    audioManager = new AudioManager(mockScene);
  });

  describe("Sound Effects", () => {
    it("should play sound effect when sfx is enabled", () => {
      audioManager.playSfx(SoundEffect.PLAYER_HIT);

      expect(mockScene.sound.add).toHaveBeenCalledWith(
        SoundEffect.PLAYER_HIT,
        expect.objectContaining({ volume: 0.5 }),
      );
      expect(currentMockSound.play).toHaveBeenCalled();
    });

    it("should apply volume multiplier to sound effect", () => {
      audioManager.playSfx(SoundEffect.PLAYER_HIT);

      expect(mockScene.sound.add).toHaveBeenCalledWith(
        SoundEffect.PLAYER_HIT,
        expect.objectContaining({ volume: 0.5 }),
      );
    });

    it("should handle sound effect errors gracefully", () => {
      mockScene.sound.add = vi.fn(() => {
        throw new Error("Sound error");
      });

      expect(() => {
        audioManager.playSfx(SoundEffect.PLAYER_HIT);
      }).not.toThrow();
    });

    it("should not play sound effect when music is disabled", () => {
      useSettingStore.getState().setMusicEnabled(false);

      audioManager.playSfx(SoundEffect.PLAYER_HIT);

      expect(mockScene.sound.add).not.toHaveBeenCalled();
    });

    it("should not play sound effect when volume is 0", () => {
      useSettingStore.getState().setMusicVolume(0);

      audioManager.playSfx(SoundEffect.PLAYER_HIT);

      expect(mockScene.sound.add).not.toHaveBeenCalled();
    });

    it("should not play sound effect when already playing", () => {
      // First play to set isPlayerSoundEnabled to true
      audioManager.playSfx(SoundEffect.PLAYER_HIT);
      // Reset mock for second call
      vi.clearAllMocks();

      // Second play should be blocked
      audioManager.playSfx(SoundEffect.PLAYER_HIT);

      expect(mockScene.sound.add).not.toHaveBeenCalled();
    });

    it("should handle sound object error event", () => {
      // Create a new mock sound object specifically for this test
      const errorSoundMock = {
        play: vi.fn(),
        stop: vi.fn(),
        pause: vi.fn(),
        resume: vi.fn(),
        destroy: vi.fn(),
        once: vi.fn((event: string, callback: (error: Error) => void) => {
          if (event === "error") {
            // Immediately call the callback with an error
            callback(new Error("Test sound error"));
          }
        }),
        isPlaying: false,
        isPaused: false,
        setVolume: vi.fn(),
      };

      // Override the sound.add method to return our error-specific mock
      mockScene.sound.add.mockReturnValue(errorSoundMock);

      audioManager.playSfx(SoundEffect.PLAYER_HIT);

      // Verify the error event handler was set up
      expect(errorSoundMock.once).toHaveBeenCalledWith(
        "error",
        expect.any(Function),
      );
      // The error event should trigger stopMusic, which calls stop and destroy
      expect(errorSoundMock.stop).toHaveBeenCalled();
      expect(errorSoundMock.destroy).toHaveBeenCalled();
    });
  });

  describe("stopMusic", () => {
    it("should stop and destroy music when music exists", () => {
      // Manually set the music property on the audioManager
      (audioManager as any).music = currentMockSound;

      audioManager.stopMusic();

      expect(currentMockSound.stop).toHaveBeenCalled();
      expect(currentMockSound.destroy).toHaveBeenCalled();
    });

    it("should not throw error when music is null", () => {
      // Call stopMusic without ever playing music
      expect(() => {
        audioManager.stopMusic();
      }).not.toThrow();
    });
  });

  describe("Preload Audio", () => {
    it("should preload all audio assets", () => {
      AudioManager.preloadAudio(mockScene);

      // Check that audio files are loaded
      expect(mockScene.load.audio).toHaveBeenCalledWith(
        SoundEffect.PLAYER_HIT,
        expect.any(String),
      );
    });
  });
});
