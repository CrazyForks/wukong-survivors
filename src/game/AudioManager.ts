import Phaser from "phaser";

// Audio types following Vampire Survivors style
export enum SoundEffect {
  // Player actions
  PLAYER_HIT = "player_hit",
  PLAYER_DEATH = "player_death",
  PLAYER_LEVEL_UP = "player_level_up",

  // Combat
  WEAPON_HIT = "weapon_hit",
  ENEMY_HIT = "enemy_hit",
  ENEMY_DEATH = "enemy_death",
  CRITICAL_HIT = "critical_hit",

  // Items
  EXP_PICKUP = "exp_pickup",
  GOLD_PICKUP = "gold_pickup",
  POWERUP = "powerup",

  // UI
  UI_CLICK = "ui_click",
  UI_HOVER = "ui_hover",
  UI_SELECT = "ui_select",
  REWARD_APPEAR = "reward_appear",

  // Special
  WAVE_START = "wave_start",
  VICTORY = "victory",
  WARNING = "warning",
}

export enum MusicTrack {
  MENU = "menu",
  GAME_THEME = "game_theme",
  BOSS_THEME = "boss_theme",
  VICTORY_THEME = "victory_theme",
}

interface AudioSettings {
  sfxVolume: number;
  musicVolume: number;
  sfxEnabled: boolean;
  musicEnabled: boolean;
}

/**
 * Audio Manager - Handles all game audio (music and sound effects)
 * Following Vampire Survivors audio patterns
 */
export class AudioManager {
  private scene: Phaser.Scene;
  private sounds: Map<string, Phaser.Sound.BaseSound>;
  private music: Phaser.Sound.BaseSound | null;
  private settings: AudioSettings;
  private currentMusicKey: string | null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.sounds = new Map();
    this.music = null;
    this.currentMusicKey = null;

    // Load settings from localStorage
    this.settings = this.loadSettings();
  }

  /**
   * Load audio settings from localStorage
   */
  private loadSettings(): AudioSettings {
    const stored = localStorage.getItem("audioSettings");
    if (stored) {
      return JSON.parse(stored);
    }

    return {
      sfxVolume: 0.7,
      musicVolume: 0.5,
      sfxEnabled: true,
      musicEnabled: true,
    };
  }

  /**
   * Save audio settings to localStorage
   */
  private saveSettings(): void {
    localStorage.setItem("audioSettings", JSON.stringify(this.settings));
  }

  /**
   * Preload all audio assets
   */
  public static preloadAudio(scene: Phaser.Scene): void {
    // Sound effects
    scene.load.audio(SoundEffect.PLAYER_HIT, "assets/audio/sfx/player_hit.mp3");
    scene.load.audio(
      SoundEffect.PLAYER_DEATH,
      "assets/audio/sfx/player_death.mp3",
    );
    scene.load.audio(
      SoundEffect.PLAYER_LEVEL_UP,
      "assets/audio/sfx/level_up.mp3",
    );

    scene.load.audio(SoundEffect.WEAPON_HIT, "assets/audio/sfx/weapon_hit.mp3");
    scene.load.audio(SoundEffect.ENEMY_HIT, "assets/audio/sfx/enemy_hit.mp3");
    scene.load.audio(
      SoundEffect.ENEMY_DEATH,
      "assets/audio/sfx/enemy_death.mp3",
    );
    scene.load.audio(
      SoundEffect.CRITICAL_HIT,
      "assets/audio/sfx/critical_hit.mp3",
    );

    scene.load.audio(SoundEffect.EXP_PICKUP, "assets/audio/sfx/exp_pickup.mp3");
    scene.load.audio(
      SoundEffect.GOLD_PICKUP,
      "assets/audio/sfx/gold_pickup.mp3",
    );
    scene.load.audio(SoundEffect.POWERUP, "assets/audio/sfx/powerup.mp3");

    scene.load.audio(SoundEffect.UI_CLICK, "assets/audio/sfx/ui_click.mp3");
    scene.load.audio(SoundEffect.UI_HOVER, "assets/audio/sfx/ui_hover.mp3");
    scene.load.audio(SoundEffect.UI_SELECT, "assets/audio/sfx/ui_select.mp3");
    scene.load.audio(
      SoundEffect.REWARD_APPEAR,
      "assets/audio/sfx/reward_appear.mp3",
    );

    scene.load.audio(SoundEffect.WAVE_START, "assets/audio/sfx/wave_start.mp3");
    scene.load.audio(SoundEffect.VICTORY, "assets/audio/sfx/victory.mp3");
    scene.load.audio(SoundEffect.WARNING, "assets/audio/sfx/warning.mp3");

    // Music tracks
    scene.load.audio(MusicTrack.MENU, "assets/audio/music/menu.mp3");
    scene.load.audio(
      MusicTrack.GAME_THEME,
      "assets/audio/music/game_theme.mp3",
    );
    scene.load.audio(
      MusicTrack.BOSS_THEME,
      "assets/audio/music/boss_theme.mp3",
    );
    scene.load.audio(
      MusicTrack.VICTORY_THEME,
      "assets/audio/music/victory.mp3",
    );
  }

  /**
   * Play a sound effect
   */
  public playSfx(effect: SoundEffect, volume: number = 1.0): void {
    if (!this.settings.sfxEnabled) return;

    try {
      const sound = this.scene.sound.add(effect, {
        volume: this.settings.sfxVolume * volume,
      });
      sound.play();

      // Clean up after playing
      sound.once("complete", () => {
        sound.destroy();
      });
    } catch (error) {
      console.warn(`Failed to play sound effect: ${effect}`, error);
    }
  }

  /**
   * Play music track
   */
  public playMusic(track: MusicTrack, loop: boolean = true): void {
    if (!this.settings.musicEnabled) return;

    // Don't restart if already playing
    if (this.currentMusicKey === track && this.music?.isPlaying) {
      return;
    }

    // Stop current music
    this.stopMusic();

    try {
      this.music = this.scene.sound.add(track, {
        volume: this.settings.musicVolume,
        loop: loop,
      });
      this.music.play();
      this.currentMusicKey = track;
    } catch (error) {
      console.warn(`Failed to play music: ${track}`, error);
    }
  }

  /**
   * Stop current music
   */
  public stopMusic(): void {
    if (this.music) {
      this.music.stop();
      this.music.destroy();
      this.music = null;
      this.currentMusicKey = null;
    }
  }

  /**
   * Pause current music
   */
  public pauseMusic(): void {
    if (this.music && this.music.isPlaying) {
      this.music.pause();
    }
  }

  /**
   * Resume paused music
   */
  public resumeMusic(): void {
    if (this.music && this.music.isPaused) {
      this.music.resume();
    }
  }

  /**
   * Set SFX volume
   */
  public setSfxVolume(volume: number): void {
    this.settings.sfxVolume = Phaser.Math.Clamp(volume, 0, 1);
    this.saveSettings();
  }

  /**
   * Set music volume
   */
  public setMusicVolume(volume: number): void {
    this.settings.musicVolume = Phaser.Math.Clamp(volume, 0, 1);
    if (this.music && "setVolume" in this.music) {
      (
        this.music as Phaser.Sound.HTML5AudioSound | Phaser.Sound.WebAudioSound
      ).setVolume(this.settings.musicVolume);
    }
    this.saveSettings();
  }

  /**
   * Toggle SFX on/off
   */
  public toggleSfx(): boolean {
    this.settings.sfxEnabled = !this.settings.sfxEnabled;
    this.saveSettings();
    return this.settings.sfxEnabled;
  }

  /**
   * Toggle music on/off
   */
  public toggleMusic(): boolean {
    this.settings.musicEnabled = !this.settings.musicEnabled;

    if (!this.settings.musicEnabled) {
      this.stopMusic();
    } else if (this.currentMusicKey) {
      this.playMusic(this.currentMusicKey as MusicTrack);
    }

    this.saveSettings();
    return this.settings.musicEnabled;
  }

  /**
   * Get current settings
   */
  public getSettings(): AudioSettings {
    return { ...this.settings };
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    this.stopMusic();
    this.sounds.clear();
  }
}
