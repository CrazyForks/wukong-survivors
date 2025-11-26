import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { AudioManager, SoundEffect, MusicTrack } from "../AudioManager";

// Mock Phaser
let currentMockSound = {
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
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    } as any;

    // Reset mocks
    vi.clearAllMocks();
    currentMockSound = {
      play: vi.fn(),
      stop: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      destroy: vi.fn(),
      once: vi.fn((event: string, callback: () => void) => {
        if (event === "complete") {
          setTimeout(callback, 0);
        }
      }),
      isPlaying: false,
      isPaused: false,
      setVolume: vi.fn(),
    };
    mockScene.sound.add.mockReturnValue(currentMockSound);

    audioManager = new AudioManager(mockScene);
  });

  afterEach(() => {
    audioManager.destroy();
  });

  describe("Settings", () => {
    it("should load default settings when localStorage is empty", () => {
      const settings = audioManager.getSettings();
      expect(settings.sfxVolume).toBe(0.7);
      expect(settings.musicVolume).toBe(0.5);
      expect(settings.sfxEnabled).toBe(true);
      expect(settings.musicEnabled).toBe(true);
    });

    it("should load settings from localStorage", () => {
      const customSettings = {
        sfxVolume: 0.3,
        musicVolume: 0.8,
        sfxEnabled: false,
        musicEnabled: true,
      };
      localStorageMock["audioSettings"] = JSON.stringify(customSettings);

      const newAudioManager = new AudioManager(mockScene);
      const settings = newAudioManager.getSettings();

      expect(settings.sfxVolume).toBe(0.3);
      expect(settings.musicVolume).toBe(0.8);
      expect(settings.sfxEnabled).toBe(false);
      expect(settings.musicEnabled).toBe(true);
    });

    it("should save settings to localStorage", () => {
      audioManager.setSfxVolume(0.5);
      const saved = JSON.parse(localStorageMock["audioSettings"]);
      expect(saved.sfxVolume).toBe(0.5);
    });
  });

  describe("Sound Effects", () => {
    it("should play sound effect when sfx is enabled", () => {
      audioManager.playSfx(SoundEffect.PLAYER_HIT);

      expect(mockScene.sound.add).toHaveBeenCalledWith(
        SoundEffect.PLAYER_HIT,
        expect.objectContaining({ volume: 0.7 }),
      );
      expect(currentMockSound.play).toHaveBeenCalled();
    });

    it("should not play sound effect when sfx is disabled", () => {
      audioManager.toggleSfx(); // Disable
      audioManager.playSfx(SoundEffect.PLAYER_HIT);

      expect(mockScene.sound.add).not.toHaveBeenCalled();
      expect(currentMockSound.play).not.toHaveBeenCalled();
    });

    it("should apply volume multiplier to sound effect", () => {
      audioManager.playSfx(SoundEffect.PLAYER_HIT, 0.5);

      expect(mockScene.sound.add).toHaveBeenCalledWith(
        SoundEffect.PLAYER_HIT,
        expect.objectContaining({ volume: 0.35 }), // 0.7 * 0.5
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
  });

  describe("Music", () => {
    it("should play music when music is enabled", () => {
      audioManager.playMusic(MusicTrack.GAME_THEME);

      expect(mockScene.sound.add).toHaveBeenCalledWith(
        MusicTrack.GAME_THEME,
        expect.objectContaining({
          volume: 0.5,
          loop: true,
        }),
      );
      expect(currentMockSound.play).toHaveBeenCalled();
    });

    it("should not play music when music is disabled", () => {
      audioManager.toggleMusic(); // Disable
      audioManager.playMusic(MusicTrack.GAME_THEME);

      expect(mockScene.sound.add).not.toHaveBeenCalled();
    });

    it("should not restart music if already playing", () => {
      currentMockSound.isPlaying = true;
      audioManager.playMusic(MusicTrack.GAME_THEME);

      // First call
      expect(mockScene.sound.add).toHaveBeenCalledTimes(1);

      // Try to play again
      audioManager.playMusic(MusicTrack.GAME_THEME);

      // Should not call again
      expect(mockScene.sound.add).toHaveBeenCalledTimes(1);
    });

    it("should stop current music before playing new track", () => {
      audioManager.playMusic(MusicTrack.MENU);
      audioManager.playMusic(MusicTrack.GAME_THEME);

      expect(currentMockSound.stop).toHaveBeenCalled();
      expect(currentMockSound.destroy).toHaveBeenCalled();
    });

    it("should stop music", () => {
      audioManager.playMusic(MusicTrack.GAME_THEME);
      audioManager.stopMusic();

      expect(currentMockSound.stop).toHaveBeenCalled();
      expect(currentMockSound.destroy).toHaveBeenCalled();
    });

    it("should pause music", () => {
      currentMockSound.isPlaying = true;
      audioManager.playMusic(MusicTrack.GAME_THEME);
      audioManager.pauseMusic();

      expect(currentMockSound.pause).toHaveBeenCalled();
    });

    it("should resume music", () => {
      currentMockSound.isPaused = true;
      audioManager.playMusic(MusicTrack.GAME_THEME);
      audioManager.resumeMusic();

      expect(currentMockSound.resume).toHaveBeenCalled();
    });

    it("should handle music errors gracefully", () => {
      mockScene.sound.add = vi.fn(() => {
        throw new Error("Music error");
      });

      expect(() => {
        audioManager.playMusic(MusicTrack.GAME_THEME);
      }).not.toThrow();
    });
  });

  describe("Volume Control", () => {
    it("should set sfx volume within valid range", () => {
      audioManager.setSfxVolume(0.8);
      expect(audioManager.getSettings().sfxVolume).toBe(0.8);

      audioManager.setSfxVolume(1.5); // Above max
      expect(audioManager.getSettings().sfxVolume).toBe(1);

      audioManager.setSfxVolume(-0.5); // Below min
      expect(audioManager.getSettings().sfxVolume).toBe(0);
    });

    it("should set music volume and update current music", () => {
      audioManager.playMusic(MusicTrack.GAME_THEME);
      audioManager.setMusicVolume(0.8);

      expect(audioManager.getSettings().musicVolume).toBe(0.8);
      expect(currentMockSound.setVolume).toHaveBeenCalledWith(0.8);
    });

    it("should clamp music volume within valid range", () => {
      audioManager.setMusicVolume(1.5);
      expect(audioManager.getSettings().musicVolume).toBe(1);

      audioManager.setMusicVolume(-0.5);
      expect(audioManager.getSettings().musicVolume).toBe(0);
    });
  });

  describe("Toggle Functions", () => {
    it("should toggle sfx on and off", () => {
      const initialState = audioManager.getSettings().sfxEnabled;

      const newState = audioManager.toggleSfx();
      expect(newState).toBe(!initialState);

      const afterToggle = audioManager.toggleSfx();
      expect(afterToggle).toBe(initialState);
    });

    it("should toggle music on and off", () => {
      // Start with music playing
      audioManager.playMusic(MusicTrack.GAME_THEME);
      const initialState = audioManager.getSettings().musicEnabled;

      const newState = audioManager.toggleMusic();
      expect(newState).toBe(!initialState);

      if (!newState) {
        expect(currentMockSound.stop).toHaveBeenCalled();
      }
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
      expect(mockScene.load.audio).toHaveBeenCalledWith(
        MusicTrack.GAME_THEME,
        expect.any(String),
      );
    });
  });

  describe("Cleanup", () => {
    it("should destroy all resources on cleanup", () => {
      audioManager.playMusic(MusicTrack.GAME_THEME);
      audioManager.destroy();

      expect(currentMockSound.stop).toHaveBeenCalled();
      expect(currentMockSound.destroy).toHaveBeenCalled();
    });
  });
});
