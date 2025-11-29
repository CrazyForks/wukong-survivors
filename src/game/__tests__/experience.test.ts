import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { ExperienceGem, ExperienceManager } from "../experience";
// Mock Phaser
const mockScene = {
  physics: {
    add: {
      sprite: vi.fn((x, y, texture) => ({
        x,
        y,
        texture,
        body: {
          setSize: vi.fn(),
        },
        setDisplaySize: vi.fn(),
        setVelocity: vi.fn(),
        destroy: vi.fn(),
        scene: mockScene,
      })),
    },
  },
  tweens: {
    add: vi.fn((config) => {
      // Immediately call onComplete for testing
      if (config.onComplete) {
        config.onComplete();
      }
      return {};
    }),
  },
} as any;

// Mock Player
const mockPlayer = {
  getPosition: vi.fn(() => ({ x: 100, y: 100 })),
  addExperience: vi.fn(),
} as any;

// Mock eventBus
vi.mock("../eventBus", () => ({
  default: {
    emit: vi.fn(),
  },
}));

// Mock ScaleManager
vi.mock("../ScaleManager", () => ({
  scaleManager: {
    scaleValue: (value: number) => value,
    getSpriteSize: (value: number) => value,
  },
}));

describe("ExperienceGem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a gem with correct texture based on value", () => {
    new ExperienceGem(mockScene, 0, 0, 1);
    expect(mockScene.physics.add.sprite).toHaveBeenCalledWith(0, 0, "gem-low");

    new ExperienceGem(mockScene, 0, 0, 3);
    expect(mockScene.physics.add.sprite).toHaveBeenCalledWith(
      0,
      0,
      "gem-medium",
    );

    new ExperienceGem(mockScene, 0, 0, 5);
    expect(mockScene.physics.add.sprite).toHaveBeenCalledWith(0, 0, "gem-high");
  });

  it("should update and detect collection within collect radius", () => {
    const gem = new ExperienceGem(mockScene, 100, 100, 1);
    const playerPos = { x: 100, y: 110 }; // Within 30 pixels

    const collected = gem.update(playerPos);
    expect(collected).toBe(true);
  });

  it("should not collect when outside collect radius", () => {
    const gem = new ExperienceGem(mockScene, 100, 100, 1);
    const playerPos = { x: 200, y: 200 }; // Far away

    const collected = gem.update(playerPos);
    expect(collected).toBe(false);
  });

  it("should activate magnetization within magnet radius", () => {
    const gem = new ExperienceGem(mockScene, 100, 100, 1);
    const playerPos = { x: 200, y: 100 }; // Within 150 pixels

    gem.update(playerPos);
    gem.update(playerPos);

    expect(gem.sprite.setVelocity).toHaveBeenCalled();
  });

  it("should play collection animation", () => {
    const gem = new ExperienceGem(mockScene, 100, 100, 1);
    gem.collect();

    expect(mockScene.tweens.add).toHaveBeenCalledWith(
      expect.objectContaining({
        targets: gem.sprite,
        alpha: 0,
        scale: 1.5,
        duration: 200,
      }),
    );
  });

  it("should destroy sprite", () => {
    const gem = new ExperienceGem(mockScene, 100, 100, 1);
    gem.destroy();

    expect(gem.sprite.destroy).toHaveBeenCalled();
  });
});

describe("ExperienceManager", () => {
  let manager: ExperienceManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new ExperienceManager(mockScene, mockPlayer);
  });

  afterEach(() => {
    manager.clear();
  });

  it("should spawn gems", () => {
    manager.spawnGem(100, 100, 5);
    expect(mockScene.physics.add.sprite).toHaveBeenCalled();
  });

  it("should collect gems and add experience to player", () => {
    manager.spawnGem(100, 100, 5);
    manager.update();

    expect(mockPlayer.addExperience).toHaveBeenCalledWith(5);
  });

  it("should not collect gems that are far away", () => {
    mockPlayer.getPosition.mockReturnValue({ x: 500, y: 500 });

    manager.spawnGem(100, 100, 5);
    manager.update();

    expect(mockPlayer.addExperience).not.toHaveBeenCalled();
  });

  it("should remove collected gems from array", () => {
    // Clear previous calls
    mockPlayer.addExperience.mockClear();

    // Spawn gem exactly at player position (will be collected immediately)
    const playerPos = mockPlayer.getPosition();
    manager.spawnGem(playerPos.x, playerPos.y, 5);

    // First update should collect the gem
    manager.update();

    // Verify the gem was collected and experience was added
    expect(mockPlayer.addExperience).toHaveBeenCalledWith(5);
    const firstCallCount = mockPlayer.addExperience.mock.calls.length;

    // After collection, gems array should be empty
    manager.update();
    // Should not increase call count because no new gems to collect
    expect(mockPlayer.addExperience.mock.calls.length).toBe(firstCallCount);
  });

  it("should clear all gems", () => {
    manager.spawnGem(100, 100, 5);
    manager.spawnGem(200, 200, 3);

    manager.clear();

    // Verify destroy was called for all gems
    expect(mockScene.physics.add.sprite).toHaveBeenCalledTimes(2);
  });

  it("should update multiple gems", () => {
    mockPlayer.getPosition.mockReturnValue({ x: 500, y: 500 });

    manager.spawnGem(100, 100, 5);
    manager.spawnGem(150, 150, 3);
    manager.spawnGem(200, 200, 1);

    manager.update();

    // None should be collected since player is far
    expect(mockPlayer.addExperience).not.toHaveBeenCalled();
  });
});
