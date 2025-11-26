import Phaser from "phaser";
import { scaleManager } from "./ScaleManager";
import { ENEMIES_DATA } from "../constant/enemies";
import type { EnemyType, EnemyRank } from "../types";
import type { GameScene } from "./GameScene";

interface Position {
  x: number;
  y: number;
}

interface EnemySprite extends Phaser.Physics.Arcade.Sprite {
  enemyRef?: Enemy;
}

// Enemy class
export class Enemy {
  public sprite: EnemySprite;
  public type: EnemyType;
  public maxHealth: number = 0;
  public health: number = 0;
  public speed: number = 0;
  public damage: number = 0;
  public expValue: number = 0;
  public goldValue: number = 0;
  public isDead: boolean;
  private scene: GameScene;

  constructor(scene: GameScene, x: number, y: number, enemyType: EnemyType) {
    this.scene = scene;
    this.type = enemyType;
    this.isDead = false;

    // Get enemy data from constants
    const enemyData = ENEMIES_DATA[enemyType];

    // Set properties from enemy data
    this.maxHealth = enemyData.health;
    this.health = this.maxHealth;
    this.speed = enemyData.speed;
    this.damage = enemyData.damage;
    this.expValue = enemyData.xpValue;
    this.goldValue = enemyData.goldValue;

    // Create enemy sprite with loaded texture using enemy ID
    this.sprite = scene.physics.add.sprite(x, y, enemyType) as EnemySprite;

    // Set display size based on enemy rank with responsive scaling
    const baseSize = this.getEnemySizeByRank(enemyData.rank);
    const displaySize = scaleManager.getSpriteSize(baseSize);
    this.sprite.setDisplaySize(displaySize, displaySize);

    // Set collision body to match sprite size
    this.sprite.body?.setSize(displaySize, displaySize);

    // Store reference
    this.sprite.enemyRef = this;
  }

  private getEnemySizeByRank(rank: EnemyRank): number {
    switch (rank) {
      case "minion":
        return 32;
      case "elite":
        return 40;
      default:
        return 32;
    }
  }

  public update(playerPos: Position): void {
    if (this.isDead) return;

    // Track player
    const dx = playerPos.x - this.sprite.x;
    const dy = playerPos.y - this.sprite.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      this.sprite.setVelocity(
        (dx / distance) * this.speed,
        (dy / distance) * this.speed,
      );
    }
  }

  public takeDamage(damage: number): boolean {
    if (this.isDead) return false;

    this.health -= damage;

    // Damage effect
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (!this.isDead) {
        this.sprite.clearTint();
      }
    });

    if (this.health <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  private die(): void {
    if (this.isDead) return;
    this.isDead = true;

    // Drop experience
    this.scene.spawnExperience(this.sprite.x, this.sprite.y, this.expValue);

    // Destroy enemy
    this.sprite.destroy();
  }

  public destroy(): void {
    if (this.sprite && this.sprite.scene) {
      this.sprite.destroy();
    }
  }
}

// Enemy spawner - Following Vampire Survivors spawn rules
export class EnemySpawner {
  private scene: GameScene;
  private enemies: Enemy[];
  private spawnTimer: number;
  private spawnInterval: number;
  private baseSpawnInterval: number;
  private enemiesPerWave: number;
  private maxEnemiesOnScreen: number;
  private difficultyTimer: number;
  private gameTime: number;
  private availableEnemies: EnemyType[];
  private minSpawnDistance: number;
  private maxSpawnDistance: number;

  constructor(scene: GameScene, availableEnemies: EnemyType[]) {
    this.scene = scene;
    this.enemies = [];
    this.spawnTimer = 0;
    this.baseSpawnInterval = 1500; // Base spawn interval: 1.5 seconds
    this.spawnInterval = this.baseSpawnInterval;
    this.enemiesPerWave = 2; // Start with 2 enemies per wave
    this.maxEnemiesOnScreen = 100; // Max enemies on screen at once
    this.difficultyTimer = 0;
    this.gameTime = 0;
    this.availableEnemies =
      availableEnemies.length > 0 ? availableEnemies : ["wolf_minion"];

    // Spawn distance from player (just outside visible screen)
    this.minSpawnDistance = 500; // Minimum spawn distance
    this.maxSpawnDistance = 700; // Maximum spawn distance
  }

  public update(_time: number, delta: number, playerPos: Position): void {
    this.gameTime += delta;

    // Update all enemies
    this.enemies.forEach((enemy) => {
      if (!enemy.isDead) {
        enemy.update(playerPos);
      }
    });

    // Clean up dead enemies
    this.enemies = this.enemies.filter((enemy) => !enemy.isDead);

    // Only spawn if under the limit
    if (this.enemies.length < this.maxEnemiesOnScreen) {
      this.spawnTimer += delta;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        this.spawnWave(playerPos);
      }
    }

    // Increase difficulty over time (Vampire Survivors style)
    this.difficultyTimer += delta;
    if (this.difficultyTimer >= 30000) {
      // Every 30 seconds
      this.difficultyTimer = 0;
      this.increaseDifficulty();
    }
  }

  private increaseDifficulty(): void {
    // Increase enemies per wave
    this.enemiesPerWave = Math.min(10, this.enemiesPerWave + 1);

    // Decrease spawn interval (faster spawning)
    this.spawnInterval = Math.max(500, this.spawnInterval - 100);

    // Increase max enemies on screen
    this.maxEnemiesOnScreen = Math.min(300, this.maxEnemiesOnScreen + 20);
  }

  private spawnWave(playerPos: Position): void {
    // Calculate actual spawn count based on game time
    const timeBasedMultiplier = 1 + Math.floor(this.gameTime / 60000); // +1 per minute
    const spawnCount = Math.min(
      this.enemiesPerWave * timeBasedMultiplier,
      this.maxEnemiesOnScreen - this.enemies.length,
    );

    for (let i = 0; i < spawnCount; i++) {
      this.spawnEnemy(playerPos);
    }
  }

  private spawnEnemy(playerPos: Position): void {
    // Vampire Survivors spawn rule: Always spawn outside visible screen
    // Random angle around player
    const angle = Math.random() * Math.PI * 2;

    // Random distance between min and max spawn distance
    const distance =
      this.minSpawnDistance +
      Math.random() * (this.maxSpawnDistance - this.minSpawnDistance);

    const x = playerPos.x + Math.cos(angle) * distance;
    const y = playerPos.y + Math.sin(angle) * distance;

    // Select enemy type based on game time (later game = harder enemies)
    const enemyType = this.selectEnemyType();

    const enemy = new Enemy(this.scene, x, y, enemyType);
    this.enemies.push(enemy);
  }

  private selectEnemyType(): EnemyType {
    // As game progresses, increase chance of elite enemies
    const eliteChance = Math.min(0.3, this.gameTime / 300000); // Up to 30% elite chance

    // Filter enemies by rank
    const minions = this.availableEnemies.filter(
      (type) => ENEMIES_DATA[type].rank === "minion",
    );
    const elites = this.availableEnemies.filter(
      (type) => ENEMIES_DATA[type].rank === "elite",
    );

    // Decide whether to spawn elite or minion
    const spawnElite = elites.length > 0 && Math.random() < eliteChance;
    const pool = spawnElite
      ? elites
      : minions.length > 0
        ? minions
        : this.availableEnemies;

    // Random selection from pool
    return pool[Math.floor(Math.random() * pool.length)];
  }

  public getEnemies(): Enemy[] {
    return this.enemies.filter((enemy) => !enemy.isDead);
  }

  public clear(): void {
    this.enemies.forEach((enemy) => enemy.destroy());
    this.enemies = [];
  }
}
