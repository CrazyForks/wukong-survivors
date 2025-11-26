import Phaser from "phaser";
import { Player } from "./player";
import { Enemy } from "./enemy";
import i18n from "../i18n";
import { scaleManager } from "./ScaleManager";
import type { WeaponType } from "../types";
import logger from "../logger";

interface WeaponConfig {
  damage: number;
  coolDown: number;
  type: WeaponType;
  projectiles?: Phaser.Physics.Arcade.Group;
}

export interface ProjectileSprite extends Phaser.Physics.Arcade.Sprite {
  damage?: number;
  weaponRef?: Weapon;
}

interface OrbData {
  sprite: ProjectileSprite;
  offset: number;
}

// Weapon base class
export abstract class Weapon {
  protected scene: Phaser.Scene;
  protected player: Player;
  public level: number;
  public maxLevel: number;
  public damage: number;
  public coolDown: number;
  protected lastFired: number;
  public type: WeaponType;
  static type: WeaponType;
  public orbs: OrbData[] = [];
  public projectiles?: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene, player: Player, config: WeaponConfig) {
    this.scene = scene;
    this.player = player;
    this.level = 1;
    this.maxLevel = 5;
    this.damage = config.damage;
    this.coolDown = config.coolDown;
    this.lastFired = 0;
    Weapon.type = config.type;
    this.type = config.type;
    this.projectiles = config.projectiles;
  }

  public update(time: number, enemies: Enemy[]): void {
    if (time - this.lastFired >= this.coolDown) {
      this.fire(enemies);
      this.lastFired = time;
    }
  }

  protected abstract fire(enemies: Enemy[]): void;

  public upgrade(): void {
    if (this.level < this.maxLevel) {
      this.level++;
      this.applyUpgrade();
    }
  }

  protected abstract applyUpgrade(): void;

  /**
   * Get the closest enemy to the player
   * @param enemies Array of enemies to search
   * @returns The closest enemy or undefined if none found
   */
  protected getClosestEnemy(enemies: Enemy[]): Enemy | undefined {
    if (enemies.length === 0) return undefined;
    let closestEnemy: Enemy | undefined;
    let minDist = Infinity;
    enemies.forEach((enemy) => {
      if (enemy.isDead) return;
      const dist = Phaser.Math.Distance.Between(
        this.player.sprite.x,
        this.player.sprite.y,
        enemy.sprite.x,
        enemy.sprite.y,
      );
      if (dist < minDist) {
        minDist = dist;
        closestEnemy = enemy;
      }
    });
    return closestEnemy;
  }

  /**
   * Get the player's movement angle based on velocity
   * Returns 0 if player is not moving
   * @returns Angle in radians
   */
  protected getPlayerAngle(): number {
    const velocity = this.player.sprite.body?.velocity;
    return velocity && (velocity.x !== 0 || velocity.y !== 0)
      ? Math.atan2(velocity.y, velocity.x)
      : 0;
  }
}

// Magic Missile weapon - auto-attack nearest enemy (renamed to Golden Staff)
export class GoldenStaff extends Weapon {
  private projectileSpeed: number;
  private piercing: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 15,
      coolDown: 1000,
      type: "golden_staff",
      projectiles: scene.physics.add.group(),
    });
    this.projectileSpeed = 300;
    this.piercing = 1;
  }

  protected fire(enemies: Enemy[]): void {
    if (enemies.length === 0) return;
    const playerPos = this.player.getPosition();
    const nearestEnemy = this.getClosestEnemy(enemies);

    if (!nearestEnemy) return;

    // Fire projectile using loaded texture with responsive scaling
    const projectileSize = scaleManager.getSpriteSize(24);
    const projectile = this.projectiles?.create(
      playerPos.x,
      playerPos.y,
      this.type,
    );
    projectile.setCircle(projectileSize / 2);
    projectile.setDisplaySize(projectileSize, projectileSize);

    // Set projectile direction
    const targetEnemy: Enemy = nearestEnemy; // Type assertion
    const dx = targetEnemy.sprite.x - playerPos.x;
    const dy = targetEnemy.sprite.y - playerPos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    projectile.setVelocity(
      (dx / distance) * this.projectileSpeed,
      (dy / distance) * this.projectileSpeed,
    );

    projectile.damage = this.damage;
    projectile.piercing = this.piercing;
    projectile.weaponRef = this;

    // Set lifetime
    this.scene.time.delayedCall(2000, () => {
      if (projectile.active) {
        projectile.destroy();
      }
    });
  }

  protected applyUpgrade(): void {
    this.damage += 5;
    this.coolDown = Math.max(300, this.coolDown - 100);
    if (this.level >= 3) {
      this.piercing = 2;
    }
    if (this.level >= 5) {
      this.piercing = 3;
    }
  }
}

export class FireproofCloak extends Weapon {
  private orbCount: number;
  private radius: number;
  private rotationSpeed: number;
  private angle: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 8,
      coolDown: 100,
      type: "fireproof_cloak",
    });
    this.orbCount = 1;
    this.radius = scaleManager.scaleValue(80);
    this.rotationSpeed = 2;
    this.angle = 0;

    this.createOrbs();
  }

  private createOrbs(): void {
    // Clear old orbs
    this.orbs.forEach((orb) => orb.sprite.destroy());
    this.orbs = [];

    // Create new orbs using loaded texture with responsive scaling
    const orbSize = scaleManager.getSpriteSize(32);
    for (let i = 0; i < this.orbCount; i++) {
      const orb = this.scene.physics.add.sprite(
        0,
        0,
        this.type,
      ) as ProjectileSprite;
      orb.setCircle(orbSize / 2);
      orb.setDisplaySize(orbSize, orbSize);

      orb.damage = this.damage;
      orb.weaponRef = this;

      this.orbs.push({
        sprite: orb,
        offset: ((Math.PI * 2) / this.orbCount) * i,
      });
    }
  }

  public update(time: number, enemies: Enemy[]): void {
    logger.info("update:", time, enemies);
    // Update orb positions
    this.angle += this.rotationSpeed * 0.016; // Assuming 60fps
    const playerPos = this.player.getPosition();

    this.orbs.forEach((orb) => {
      const angle = this.angle + orb.offset;
      orb.sprite.x = playerPos.x + Math.cos(angle) * this.radius;
      orb.sprite.y = playerPos.y + Math.sin(angle) * this.radius;
    });
  }

  protected fire(enemies: Enemy[]): void {
    // Aura doesn't need fire method as it persists continuously
    logger.info("fire:", enemies);
  }

  protected applyUpgrade(): void {
    this.damage += 5;
    if (this.level === 2) {
      this.orbCount = 2;
      this.createOrbs();
    } else if (this.level === 3) {
      this.radius = 100;
    } else if (this.level === 4) {
      this.orbCount = 3;
      this.createOrbs();
    } else if (this.level === 5) {
      this.rotationSpeed = 3;
    }
  }
}

// Ruyi Staff - Ultimate form of Golden Staff with enhanced power
export class RuyiStaff extends Weapon {
  private projectileSpeed: number;
  private piercing: number;
  private projectileCount: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 50,
      coolDown: 800,
      type: "ruyi_staff",
      projectiles: scene.physics.add.group(),
    });
    this.projectileSpeed = 400;
    this.piercing = 3;
    this.projectileCount = 1;
  }

  protected fire(enemies: Enemy[]): void {
    if (enemies.length === 0) return;

    const playerPos = this.player.getPosition();

    // Fire multiple projectiles
    for (let i = 0; i < this.projectileCount; i++) {
      let nearestEnemy: Enemy | null = null;
      let nearestDistance = Infinity;

      enemies.forEach((enemy) => {
        if (enemy.isDead) return;
        const dx = enemy.sprite.x - playerPos.x;
        const dy = enemy.sprite.y - playerPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestEnemy = enemy;
        }
      });

      if (!nearestEnemy) continue;

      const projectileSize = scaleManager.getSpriteSize(32);
      const projectile = this.projectiles?.create(
        playerPos.x,
        playerPos.y,
        this.type,
      );
      projectile.setCircle(projectileSize / 2);
      projectile.setDisplaySize(projectileSize, projectileSize);

      const targetEnemy: Enemy = nearestEnemy;
      const dx = targetEnemy.sprite.x - playerPos.x;
      const dy = targetEnemy.sprite.y - playerPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      projectile.setVelocity(
        (dx / distance) * this.projectileSpeed,
        (dy / distance) * this.projectileSpeed,
      );

      projectile.damage = this.damage;
      projectile.piercing = this.piercing;
      projectile.weaponRef = this;

      this.scene.time.delayedCall(3000, () => {
        if (projectile.active) projectile.destroy();
      });
    }
  }

  protected applyUpgrade(): void {
    this.damage += 10;
    this.coolDown = Math.max(500, this.coolDown - 50);
    if (this.level >= 3) this.projectileCount = 2;
    if (this.level >= 5) this.piercing = 5;
  }
}

// Fire Lance - Fast piercing spear
export class FireLance extends Weapon {
  private projectileSpeed: number;
  private piercing: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 20,
      coolDown: 1200,
      type: "fire_lance",
      projectiles: scene.physics.add.group(),
    });
    this.projectileSpeed = 500;
    this.piercing = 2;
  }

  protected fire(enemies: Enemy[]): void {
    if (enemies.length === 0) return;

    const playerPos = this.player.getPosition();
    const nearestEnemy = this.getClosestEnemy(enemies);

    if (!nearestEnemy) return;

    const projectileSize = scaleManager.getSpriteSize(28);
    const projectile = this.projectiles?.create(
      playerPos.x,
      playerPos.y,
      this.type,
    );
    projectile.setCircle(projectileSize / 2);
    projectile.setDisplaySize(projectileSize, projectileSize);

    const targetEnemy: Enemy = nearestEnemy;
    const angle = Phaser.Math.Angle.Between(
      playerPos.x,
      playerPos.y,
      targetEnemy.sprite.x,
      targetEnemy.sprite.y,
    );

    projectile.setVelocity(
      Math.cos(angle) * this.projectileSpeed,
      Math.sin(angle) * this.projectileSpeed,
    );
    projectile.setRotation(angle);

    projectile.damage = this.damage;
    projectile.piercing = this.piercing;
    projectile.weaponRef = this;

    this.scene.time.delayedCall(2500, () => {
      if (projectile.active) projectile.destroy();
    });
  }

  protected applyUpgrade(): void {
    this.damage += 6;
    this.coolDown = Math.max(600, this.coolDown - 150);
    if (this.level >= 3) this.piercing = 3;
    if (this.level >= 5) this.projectileSpeed += 100;
  }
}

// Wind Tamer - Area damage pearl
export class WindTamer extends Weapon {
  private orbCount: number;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  private radius: number;
  private damageRadius: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 25,
      coolDown: 2000,
      type: "wind_tamer",
    });
    this.orbCount = 1;
    this.radius = scaleManager.scaleValue(60);
    this.damageRadius = 100;
    this.createOrbs();
  }

  private createOrbs(): void {
    this.orbs.forEach((orb) => orb.sprite.destroy());
    this.orbs = [];

    const orbSize = scaleManager.getSpriteSize(28);
    for (let i = 0; i < this.orbCount; i++) {
      const orb = this.scene.physics.add.sprite(
        0,
        0,
        this.type,
      ) as ProjectileSprite;
      orb.setCircle(orbSize / 2);
      orb.setDisplaySize(orbSize, orbSize);
      orb.damage = this.damage;
      orb.weaponRef = this;

      this.orbs.push({
        sprite: orb,
        offset: ((Math.PI * 2) / this.orbCount) * i,
      });
    }
  }

  public update(_time: number, _enemies: Enemy[]): void {
    logger.info(_time, _enemies);
    const playerPos = this.player.getPosition();
    this.orbs.forEach((orb) => {
      orb.sprite.x = playerPos.x;
      orb.sprite.y = playerPos.y;
    });
  }

  protected fire(enemies: Enemy[]): void {
    // Wind effect damages all enemies in radius
    const playerPos = this.player.getPosition();
    enemies.forEach((enemy) => {
      if (enemy.isDead) return;
      const distance = Phaser.Math.Distance.Between(
        playerPos.x,
        playerPos.y,
        enemy.sprite.x,
        enemy.sprite.y,
      );
      if (distance < this.damageRadius) {
        enemy.takeDamage(this.damage);
      }
    });
  }

  protected applyUpgrade(): void {
    this.damage += 8;
    if (this.level >= 2) this.damageRadius = 120;
    if (this.level >= 3) this.coolDown = 1500;
    if (this.level >= 4) this.damageRadius = 150;
    if (this.level >= 5) this.orbCount = 2;
  }
}

// Violet Bell - Sound wave weapon
export class VioletBell extends Weapon {
  private waveCount: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 30,
      coolDown: 1500,
      type: "violet_bell",
    });
    this.waveCount = 3;
  }

  protected fire(enemies: Enemy[]): void {
    const playerPos = this.player.getPosition();
    const angles = [];

    for (let i = 0; i < this.waveCount; i++) {
      angles.push((Math.PI * 2 * i) / this.waveCount);
    }

    angles.forEach(() => {
      const wave = this.scene.add.circle(
        playerPos.x,
        playerPos.y,
        20,
        0x9370db,
        0.3,
      );

      this.scene.tweens.add({
        targets: wave,
        radius: 150,
        alpha: 0,
        duration: 1000,
        ease: "Power2",
        onUpdate: () => {
          enemies.forEach((enemy) => {
            if (enemy.isDead) return;
            const dist = Phaser.Math.Distance.Between(
              wave.x,
              wave.y,
              enemy.sprite.x,
              enemy.sprite.y,
            );
            if (dist <= wave.radius && dist >= wave.radius - 20) {
              enemy.takeDamage(this.damage);
            }
          });
        },
        onComplete: () => wave.destroy(),
      });
    });
  }

  protected applyUpgrade(): void {
    this.damage += 8;
    if (this.level >= 2) this.waveCount = 4;
    if (this.level >= 3) this.coolDown = 1200;
    if (this.level >= 4) this.waveCount = 5;
    if (this.level >= 5) this.coolDown = 1000;
  }
}

// Twin Blades - Fast dual strike
export class TwinBlades extends Weapon {
  private projectileSpeed: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 18,
      coolDown: 800,
      type: "twin_blades",
      projectiles: scene.physics.add.group(),
    });
    this.projectileSpeed = 450;
  }

  protected fire(enemies: Enemy[]): void {
    if (enemies.length === 0) return;

    const playerPos = this.player.getPosition();
    const targets = enemies.filter((e) => !e.isDead).slice(0, 2);

    targets.forEach((target, index) => {
      const projectileSize = scaleManager.getSpriteSize(24);
      const projectile = this.projectiles?.create(
        playerPos.x + (index === 0 ? -10 : 10),
        playerPos.y,
        this.type,
      );
      projectile.setCircle(projectileSize / 2);
      projectile.setDisplaySize(projectileSize, projectileSize);

      const angle = Phaser.Math.Angle.Between(
        playerPos.x,
        playerPos.y,
        target.sprite.x,
        target.sprite.y,
      );

      projectile.setVelocity(
        Math.cos(angle) * this.projectileSpeed,
        Math.sin(angle) * this.projectileSpeed,
      );
      projectile.setRotation(angle);

      projectile.damage = this.damage;
      projectile.piercing = 1;
      projectile.weaponRef = this;

      this.scene.time.delayedCall(1500, () => {
        if (projectile.active) projectile.destroy();
      });
    });
  }

  protected applyUpgrade(): void {
    this.damage += 5;
    this.coolDown = Math.max(400, this.coolDown - 100);
    if (this.level >= 5) this.projectileSpeed += 150;
  }
}

// Mace - Heavy damage weapon
export class Mace extends Weapon {
  private projectileSpeed: number;
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  private stunChance: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 35,
      coolDown: 1800,
      type: "mace",
      projectiles: scene.physics.add.group(),
    });
    this.projectileSpeed = 250;
    this.stunChance = 0.3;
  }

  protected fire(enemies: Enemy[]): void {
    if (enemies.length === 0) return;

    const playerPos = this.player.getPosition();
    const nearestEnemy = this.getClosestEnemy(enemies);

    if (!nearestEnemy) return;

    const projectileSize = scaleManager.getSpriteSize(32);
    const projectile = this.projectiles?.create(
      playerPos.x,
      playerPos.y,
      this.type,
    );
    projectile.setCircle(projectileSize / 2);
    projectile.setDisplaySize(projectileSize, projectileSize);

    const targetEnemy: Enemy = nearestEnemy;
    const angle = Phaser.Math.Angle.Between(
      playerPos.x,
      playerPos.y,
      targetEnemy.sprite.x,
      targetEnemy.sprite.y,
    );

    projectile.setVelocity(
      Math.cos(angle) * this.projectileSpeed,
      Math.sin(angle) * this.projectileSpeed,
    );

    projectile.damage = this.damage;
    projectile.piercing = 1;
    projectile.weaponRef = this;

    this.scene.time.delayedCall(2000, () => {
      if (projectile.active) projectile.destroy();
    });
  }

  protected applyUpgrade(): void {
    this.damage += 10;
    if (this.level >= 2) this.stunChance = 0.4;
    if (this.level >= 3) this.coolDown = 1500;
    if (this.level >= 4) this.stunChance = 0.5;
    if (this.level >= 5) this.damage += 15;
  }
}

// Bull Horns - Charge attack
export class BullHorns extends Weapon {
  private chargeRadius: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 40,
      coolDown: 2500,
      type: "bull_horns",
    });
    this.chargeRadius = 150;
  }

  protected fire(enemies: Enemy[]): void {
    const playerPos = this.player.getPosition();

    // Create charge effect
    const circle = this.scene.add.circle(
      playerPos.x,
      playerPos.y,
      this.chargeRadius,
      0x8b0000,
      0.3,
    );

    enemies.forEach((enemy) => {
      if (enemy.isDead) return;
      const distance = Phaser.Math.Distance.Between(
        playerPos.x,
        playerPos.y,
        enemy.sprite.x,
        enemy.sprite.y,
      );
      if (distance < this.chargeRadius) {
        enemy.takeDamage(this.damage);
        const angle = Phaser.Math.Angle.Between(
          playerPos.x,
          playerPos.y,
          enemy.sprite.x,
          enemy.sprite.y,
        );
        if (enemy.sprite.body && "setVelocity" in enemy.sprite.body) {
          enemy.sprite.body?.setVelocity(
            Math.cos(angle) * 300,
            Math.sin(angle) * 300,
          );
        }
      }
    });

    this.scene.tweens.add({
      targets: circle,
      alpha: 0,
      duration: 500,
      onComplete: () => circle.destroy(),
    });
  }

  protected applyUpgrade(): void {
    this.damage += 12;
    if (this.level >= 2) this.chargeRadius = 180;
    if (this.level >= 3) this.coolDown = 2000;
    if (this.level >= 4) this.chargeRadius = 200;
    if (this.level >= 5) this.damage += 20;
  }
}

// Thunder Drum - Lightning strikes
export class ThunderDrum extends Weapon {
  private strikeCount: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 22,
      coolDown: 1600,
      type: "thunder_drum",
    });
    this.strikeCount = 3;
  }

  protected fire(enemies: Enemy[]): void {
    if (enemies.length === 0) return;

    const targets = enemies
      .filter((e) => !e.isDead)
      .sort(() => Math.random() - 0.5)
      .slice(0, this.strikeCount);

    targets.forEach((target) => {
      // Lightning strike effect
      const lightning = this.scene.add.rectangle(
        target.sprite.x,
        target.sprite.y - 100,
        10,
        100,
        0xffd700,
        0.8,
      );

      this.scene.tweens.add({
        targets: lightning,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          lightning.destroy();
          target.takeDamage(this.damage);
        },
      });
    });
  }

  protected applyUpgrade(): void {
    this.damage += 6;
    if (this.level >= 2) this.strikeCount = 4;
    if (this.level >= 3) this.coolDown = 1300;
    if (this.level >= 4) this.strikeCount = 5;
    if (this.level >= 5) this.damage += 10;
  }
}

// Ice Needle - Slowing projectiles
export class IceNeedle extends Weapon {
  private projectileSpeed: number;
  private projectileCount: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 16,
      coolDown: 900,
      type: "ice_needle",
      projectiles: scene.physics.add.group(),
    });
    this.projectileSpeed = 550;
    this.projectileCount = 3;
  }

  protected fire(enemies: Enemy[]): void {
    if (enemies.length === 0) return;

    const playerPos = this.player.getPosition();
    const angleStep = (Math.PI * 2) / this.projectileCount;

    for (let i = 0; i < this.projectileCount; i++) {
      const angle = angleStep * i;
      const projectileSize = scaleManager.getSpriteSize(20);
      const projectile = this.projectiles?.create(
        playerPos.x,
        playerPos.y,
        this.type,
      );
      projectile.setCircle(projectileSize / 2);
      projectile.setDisplaySize(projectileSize, projectileSize);

      projectile.setVelocity(
        Math.cos(angle) * this.projectileSpeed,
        Math.sin(angle) * this.projectileSpeed,
      );
      projectile.setRotation(angle);

      projectile.damage = this.damage;
      projectile.piercing = 1;
      projectile.weaponRef = this;

      this.scene.time.delayedCall(2000, () => {
        if (projectile.active) projectile.destroy();
      });
    }
  }

  protected applyUpgrade(): void {
    this.damage += 5;
    if (this.level >= 2) this.projectileCount = 4;
    if (this.level >= 3) this.coolDown = 700;
    if (this.level >= 4) this.projectileCount = 5;
    if (this.level >= 5) this.projectileSpeed += 100;
  }
}

// Wind Fire Wheels - Dual spinning wheels
export class WindFireWheels extends Weapon {
  private orbCount: number;
  private radius: number;
  private rotationSpeed: number;
  private angle: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 28,
      coolDown: 100,
      type: "wind_fire_wheels",
    });
    this.orbCount = 2;
    this.radius = scaleManager.scaleValue(70);
    this.rotationSpeed = 4;
    this.angle = 0;
    this.createOrbs();
  }

  private createOrbs(): void {
    this.orbs.forEach((orb) => orb.sprite.destroy());
    this.orbs = [];

    const orbSize = scaleManager.getSpriteSize(32);
    for (let i = 0; i < this.orbCount; i++) {
      const orb = this.scene.physics.add.sprite(
        0,
        0,
        this.type,
      ) as ProjectileSprite;
      orb.setCircle(orbSize / 2);
      orb.setDisplaySize(orbSize, orbSize);
      orb.damage = this.damage;
      orb.weaponRef = this;

      this.orbs.push({
        sprite: orb,
        offset: ((Math.PI * 2) / this.orbCount) * i,
      });
    }
  }

  public update(_time: number, _enemies: Enemy[]): void {
    logger.info(_time, _enemies);
    this.angle += this.rotationSpeed * 0.016;
    const playerPos = this.player.getPosition();

    this.orbs.forEach((orb) => {
      const angle = this.angle + orb.offset;
      orb.sprite.x = playerPos.x + Math.cos(angle) * this.radius;
      orb.sprite.y = playerPos.y + Math.sin(angle) * this.radius;
      orb.sprite.setRotation(angle);
    });
  }

  protected fire(_enemies: Enemy[]): void {
    logger.info(_enemies);
    // Continuous damage from spinning wheels
  }

  protected applyUpgrade(): void {
    this.damage += 7;
    if (this.level >= 2) this.rotationSpeed = 5;
    if (this.level >= 3) this.radius = 90;
    if (this.level >= 4) this.rotationSpeed = 6;
    if (this.level >= 5) this.orbCount = 3;
  }
}

// Jade Purity Bottle - Suction and damage
export class JadePurityBottle extends Weapon {
  private pullRadius: number;
  private pullStrength: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 32,
      coolDown: 2200,
      type: "jade_purity_bottle",
    });
    this.pullRadius = 200;
    this.pullStrength = 150;
  }

  protected fire(enemies: Enemy[]): void {
    const playerPos = this.player.getPosition();

    // Create bottle effect
    const bottle = this.scene.add.circle(
      playerPos.x,
      playerPos.y,
      30,
      0x7fffd4,
      0.6,
    );

    enemies.forEach((enemy) => {
      if (enemy.isDead) return;
      const distance = Phaser.Math.Distance.Between(
        playerPos.x,
        playerPos.y,
        enemy.sprite.x,
        enemy.sprite.y,
      );

      if (distance < this.pullRadius) {
        // Pull enemies towards player
        const angle = Phaser.Math.Angle.Between(
          enemy.sprite.x,
          enemy.sprite.y,
          playerPos.x,
          playerPos.y,
        );
        if (enemy.sprite.body && "setVelocity" in enemy.sprite.body) {
          enemy.sprite.body?.setVelocity(
            Math.cos(angle) * this.pullStrength,
            Math.sin(angle) * this.pullStrength,
          );
        }

        if (distance < 80) {
          enemy.takeDamage(this.damage);
        }
      }
    });

    this.scene.tweens.add({
      targets: bottle,
      radius: 50,
      alpha: 0,
      duration: 1500,
      onComplete: () => bottle.destroy(),
    });
  }

  protected applyUpgrade(): void {
    this.damage += 10;
    if (this.level >= 2) this.pullRadius = 250;
    if (this.level >= 3) this.pullStrength = 200;
    if (this.level >= 4) this.coolDown = 1800;
    if (this.level >= 5) this.damage += 15;
  }
}

// Golden Rope - Binding weapon
export class GoldenRope extends Weapon {
  private bindDuration: number;
  private maxTargets: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 12,
      coolDown: 1400,
      type: "golden_rope",
    });
    this.bindDuration = 2000;
    this.maxTargets = 2;
  }

  protected fire(enemies: Enemy[]): void {
    if (enemies.length === 0) return;

    const playerPos = this.player.getPosition();
    const targets = enemies
      .filter((e) => !e.isDead)
      .sort(
        (a, b) =>
          Phaser.Math.Distance.Between(
            playerPos.x,
            playerPos.y,
            a.sprite.x,
            a.sprite.y,
          ) -
          Phaser.Math.Distance.Between(
            playerPos.x,
            playerPos.y,
            b.sprite.x,
            b.sprite.y,
          ),
      )
      .slice(0, this.maxTargets);

    targets.forEach((target) => {
      // Rope binding effect
      const rope = this.scene.add.line(
        0,
        0,
        playerPos.x,
        playerPos.y,
        target.sprite.x,
        target.sprite.y,
        0xffd700,
        0.8,
      );
      rope.setLineWidth(3);

      // Slow enemy
      let originalSpeed: number;
      if (target.sprite.body && "speed" in target.sprite.body) {
        originalSpeed = target.sprite.body.speed;

        target.sprite.body.speed = originalSpeed * 0.3;
      }

      target.takeDamage(this.damage);

      this.scene.time.delayedCall(this.bindDuration, () => {
        rope.destroy();
        if (
          !target.isDead &&
          target.sprite.body &&
          "speed" in target.sprite.body
        ) {
          target.sprite.body.speed = originalSpeed;
        }
      });
    });
  }

  protected applyUpgrade(): void {
    this.damage += 4;
    if (this.level >= 2) this.maxTargets = 3;
    if (this.level >= 3) this.bindDuration = 3000;
    if (this.level >= 4) this.maxTargets = 4;
    if (this.level >= 5) this.coolDown = 1000;
  }
}

// Plantain Fan - Wind blast
export class PlantainFan extends Weapon {
  private fanAngle: number;
  private fanRange: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 45,
      coolDown: 3000,
      type: "plantain_fan",
    });
    this.fanAngle = Math.PI / 3;
    this.fanRange = 250;
  }

  protected fire(enemies: Enemy[]): void {
    const playerPos = this.player.getPosition();

    // Find direction to nearest enemy
    let targetAngle = 0;

    const nearest = this.getClosestEnemy(enemies);
    if (nearest) {
      targetAngle = Phaser.Math.Angle.Between(
        playerPos.x,
        playerPos.y,
        nearest.sprite.x,
        nearest.sprite.y,
      );
    }

    // Create fan wind effect
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x87ceeb, 0.4);
    graphics.slice(
      playerPos.x,
      playerPos.y,
      this.fanRange,
      targetAngle - this.fanAngle / 2,
      targetAngle + this.fanAngle / 2,
      false,
    );
    graphics.fillPath();

    enemies.forEach((enemy) => {
      if (enemy.isDead) return;

      const distance = Phaser.Math.Distance.Between(
        playerPos.x,
        playerPos.y,
        enemy.sprite.x,
        enemy.sprite.y,
      );
      const angle = Phaser.Math.Angle.Between(
        playerPos.x,
        playerPos.y,
        enemy.sprite.x,
        enemy.sprite.y,
      );

      const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angle - targetAngle));

      if (distance < this.fanRange && angleDiff < this.fanAngle / 2) {
        enemy.takeDamage(this.damage);
        if (enemy.sprite.body && "setVelocity" in enemy.sprite.body) {
          enemy.sprite.body.setVelocity(
            Math.cos(angle) * 400,
            Math.sin(angle) * 400,
          );
        }
      }
    });

    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: 800,
      onComplete: () => graphics.destroy(),
    });
  }

  protected applyUpgrade(): void {
    this.damage += 12;
    if (this.level >= 2) this.fanAngle = Math.PI / 2.5;
    if (this.level >= 3) this.fanRange = 300;
    if (this.level >= 4) this.coolDown = 2500;
    if (this.level >= 5) this.fanAngle = Math.PI / 2;
  }
}

// Three Pointed Blade - 三尖两刃刀（二郎神）
export class ThreePointedBlade extends Weapon {
  private projectileSpeed: number;
  private slashCount: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 42,
      coolDown: 1100,
      type: "three_pointed_blade",
      projectiles: scene.physics.add.group(),
    });
    this.projectileSpeed = 400;
    this.slashCount = 3;
  }

  protected fire(enemies: Enemy[]): void {
    if (enemies.length === 0) return;

    const playerPos = this.player.getPosition();
    const projectileSize = scaleManager.getSpriteSize(32);

    // 三叉斩击，120度扇形
    for (let i = 0; i < this.slashCount; i++) {
      const angleOffset = ((i - 1) * Math.PI) / 6; // -30°, 0°, 30°
      const baseAngle = this.getPlayerAngle();
      const targetAngle = baseAngle + angleOffset;

      const projectile = this.projectiles?.create(
        playerPos.x,
        playerPos.y,
        this.type,
      );
      projectile.setCircle(projectileSize / 2);
      projectile.setDisplaySize(projectileSize, projectileSize);
      projectile.setRotation(targetAngle);

      projectile.setVelocity(
        Math.cos(targetAngle) * this.projectileSpeed,
        Math.sin(targetAngle) * this.projectileSpeed,
      );

      projectile.damage = this.damage;
      projectile.weaponRef = this;

      this.scene.time.delayedCall(1500, () => {
        if (projectile.active) projectile.destroy();
      });
    }
  }

  protected applyUpgrade(): void {
    this.damage += 8;
    this.coolDown = Math.max(600, this.coolDown - 100);
    if (this.level >= 4) this.slashCount = 5;
  }
}

// Nine Ring Staff - 九环锡杖（唐僧/沙僧）
export class NineRingStaff extends Weapon {
  private soundWaveRadius: number;
  private stunDuration: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 30,
      coolDown: 1700,
      type: "nine_ring_staff",
    });
    this.soundWaveRadius = scaleManager.scaleValue(150);
    this.stunDuration = 1000;
  }

  protected fire(enemies: Enemy[]): void {
    const playerPos = this.player.getPosition();

    // 创建音波圆环特效
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(4, 0xffd700, 1);
    graphics.strokeCircle(0, 0, this.soundWaveRadius);
    graphics.setPosition(playerPos.x, playerPos.y);

    // 对范围内敌人造成伤害和短暂眩晕
    enemies.forEach((enemy) => {
      if (enemy.isDead) return;

      const distance = Phaser.Math.Distance.Between(
        playerPos.x,
        playerPos.y,
        enemy.sprite.x,
        enemy.sprite.y,
      );

      if (distance <= this.soundWaveRadius) {
        enemy.takeDamage(this.damage);
        // 眩晕效果：短暂减速
        if (enemy.sprite.body && "setVelocity" in enemy.sprite.body) {
          const originalSpeed = enemy.speed;
          enemy.speed *= 0.3;
          this.scene.time.delayedCall(this.stunDuration, () => {
            enemy.speed = originalSpeed;
          });
        }
      }
    });

    // 音波扩散动画
    this.scene.tweens.add({
      targets: graphics,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 500,
      onComplete: () => graphics.destroy(),
    });
  }

  protected applyUpgrade(): void {
    this.damage += 7;
    this.soundWaveRadius += scaleManager.scaleValue(20);
    if (this.level >= 3) this.stunDuration = 1500;
    if (this.level >= 5) this.coolDown = 1200;
  }
}

// Crescent Blade - 月牙铲（沙僧）
export class CrescentBlade extends Weapon {
  private bladeCount: number;
  private returnSpeed: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 33,
      coolDown: 1500,
      type: "crescent_blade",
      projectiles: scene.physics.add.group(),
    });
    this.bladeCount = 2;
    this.returnSpeed = 350;
  }

  protected fire(enemies: Enemy[]): void {
    logger.info(enemies);
    const playerPos = this.player.getPosition();
    const projectileSize = scaleManager.getSpriteSize(28);
    const baseAngle = this.getPlayerAngle();

    // 发射多个月牙铲，回旋镖效果
    for (let i = 0; i < this.bladeCount; i++) {
      const angleOffset = ((i - 0.5) * Math.PI) / 4;
      const angle = baseAngle + angleOffset;

      const blade = this.projectiles?.create(
        playerPos.x,
        playerPos.y,
        this.type,
      ) as ProjectileSprite;
      blade.setCircle(projectileSize / 2);
      blade.setDisplaySize(projectileSize, projectileSize);

      const speed = this.returnSpeed;
      blade.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      blade.damage = this.damage;
      blade.weaponRef = this;

      // 回旋效果
      this.scene.time.delayedCall(800, () => {
        if (blade.active) {
          const dx = playerPos.x - blade.x;
          const dy = playerPos.y - blade.y;
          const returnAngle = Math.atan2(dy, dx);
          blade.setVelocity(
            Math.cos(returnAngle) * speed,
            Math.sin(returnAngle) * speed,
          );
        }
      });

      this.scene.time.delayedCall(1800, () => {
        if (blade.active) blade.destroy();
      });
    }
  }

  protected applyUpgrade(): void {
    this.damage += 7;
    this.returnSpeed += 30;
    if (this.level >= 3) this.bladeCount = 3;
    if (this.level >= 5) this.bladeCount = 4;
  }
}

// Iron Cudgel - 混铁棍（牛魔王）
export class IronCudgel extends Weapon {
  private smashRadius: number;
  private knockbackForce: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 38,
      coolDown: 2200,
      type: "iron_cudgel",
    });
    this.smashRadius = scaleManager.scaleValue(120);
    this.knockbackForce = 500;
  }

  protected fire(enemies: Enemy[]): void {
    const playerPos = this.player.getPosition();

    // 重击地面，产生巨大冲击波
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x8b4513, 0.6);
    graphics.fillCircle(0, 0, this.smashRadius);
    graphics.setPosition(playerPos.x, playerPos.y);

    enemies.forEach((enemy) => {
      if (enemy.isDead) return;

      const distance = Phaser.Math.Distance.Between(
        playerPos.x,
        playerPos.y,
        enemy.sprite.x,
        enemy.sprite.y,
      );

      if (distance <= this.smashRadius) {
        enemy.takeDamage(this.damage);

        // 强力击退
        if (enemy.sprite.body && "setVelocity" in enemy.sprite.body) {
          const angle = Phaser.Math.Angle.Between(
            playerPos.x,
            playerPos.y,
            enemy.sprite.x,
            enemy.sprite.y,
          );
          enemy.sprite.body.setVelocity(
            Math.cos(angle) * this.knockbackForce,
            Math.sin(angle) * this.knockbackForce,
          );
        }
      }
    });

    this.scene.tweens.add({
      targets: graphics,
      scaleX: 1.8,
      scaleY: 1.8,
      alpha: 0,
      duration: 600,
      onComplete: () => graphics.destroy(),
    });
  }

  protected applyUpgrade(): void {
    this.damage += 9;
    this.smashRadius += scaleManager.scaleValue(15);
    this.knockbackForce += 50;
    if (this.level >= 5) this.coolDown = 1700;
  }
}

// Seven Star Sword - 七星剑（道家）
export class SevenStarSword extends Weapon {
  private swordCount: number;
  private orbitRadius: number;
  private swords: ProjectileSprite[];

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 24,
      coolDown: 100,
      type: "seven_star_sword",
    });
    this.swordCount = 3;
    this.orbitRadius = scaleManager.scaleValue(90);
    this.swords = [];
    this.createSwords();
  }

  private createSwords(): void {
    this.swords.forEach((sword) => sword.destroy());
    this.swords = [];

    const swordSize = scaleManager.getSpriteSize(24);
    for (let i = 0; i < this.swordCount; i++) {
      const sword = this.scene.physics.add.sprite(
        0,
        0,
        this.type,
      ) as ProjectileSprite;
      sword.setCircle(swordSize / 2);
      sword.setDisplaySize(swordSize, swordSize);
      sword.damage = this.damage;
      sword.weaponRef = this;
      this.swords.push(sword);
    }
  }

  public update(time: number, enemies: Enemy[]): void {
    logger.info(enemies);
    const playerPos = this.player.getPosition();
    const angleStep = (Math.PI * 2) / this.swordCount;
    const rotation = (time / 1000) * 3; // 旋转速度

    this.swords.forEach((sword, index) => {
      const angle = rotation + angleStep * index;
      sword.x = playerPos.x + Math.cos(angle) * this.orbitRadius;
      sword.y = playerPos.y + Math.sin(angle) * this.orbitRadius;
      sword.setRotation(angle + Math.PI / 2);
    });
  }

  protected fire(enemies: Enemy[]): void {
    // 持续环绕攻击，不需要特定发射逻辑
    logger.info(enemies);
  }

  protected applyUpgrade(): void {
    this.damage += 5;
    this.orbitRadius += scaleManager.scaleValue(10);
    if (this.level >= 3) {
      this.swordCount = 5;
      this.createSwords();
    }
    if (this.level >= 5) {
      this.swordCount = 7;
      this.createSwords();
    }
  }
}

// Ginseng Fruit - 人参果（特殊恢复型）
export class GinsengFruit extends Weapon {
  private healAmount: number;
  private maxHealthBonus: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 15,
      coolDown: 5000,
      type: "ginseng_fruit",
    });
    this.healAmount = 20;
    this.maxHealthBonus = 0;
  }

  protected fire(enemies: Enemy[]): void {
    // 治疗玩家
    const currentHealth = this.player.health;
    const maxHealth = this.player.maxHealth;
    const newHealth = Math.min(currentHealth + this.healAmount, maxHealth);
    this.player.health = newHealth;

    // 创建治疗特效
    const playerPos = this.player.getPosition();
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x90ee90, 0.8);
    graphics.fillCircle(0, 0, scaleManager.scaleValue(40));
    graphics.setPosition(playerPos.x, playerPos.y);

    this.scene.tweens.add({
      targets: graphics,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 1000,
      onComplete: () => graphics.destroy(),
    });

    // 对附近敌人造成少量伤害（仙气威慑）
    enemies.forEach((enemy) => {
      if (enemy.isDead) return;

      const distance = Phaser.Math.Distance.Between(
        playerPos.x,
        playerPos.y,
        enemy.sprite.x,
        enemy.sprite.y,
      );

      if (distance <= scaleManager.scaleValue(100)) {
        enemy.takeDamage(this.damage);
      }
    });
  }

  protected applyUpgrade(): void {
    this.healAmount += 10;
    this.damage += 5;
    if (this.level >= 2) this.maxHealthBonus = 20;
    if (this.level >= 3) this.coolDown = 4000;
    if (this.level >= 4) this.maxHealthBonus = 40;
    if (this.level >= 5) this.healAmount = 100;

    // 提升最大生命值
    if (this.maxHealthBonus > 0) {
      this.player.maxHealth = this.player.maxHealth + this.maxHealthBonus;
      this.maxHealthBonus = 0; // 只在升级时加一次
    }
  }
}

// Heaven Earth Circle - 乾坤圈（哪吒）
export class HeavenEarthCircle extends Weapon {
  private circleSpeed: number;
  private returnDelay: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 40,
      coolDown: 1800,
      type: "heaven_earth_circle",
      projectiles: scene.physics.add.group(),
    });
    this.circleSpeed = 450;
    this.returnDelay = 1000;
  }

  protected fire(enemies: Enemy[]): void {
    if (enemies.length === 0) return;

    const playerPos = this.player.getPosition();
    const targetAngle = this.getPlayerAngle();
    const projectileSize = scaleManager.getSpriteSize(36);

    const circle = this.projectiles?.create(
      playerPos.x,
      playerPos.y,
      this.type,
    ) as ProjectileSprite;
    circle.setCircle(projectileSize / 2);
    circle.setDisplaySize(projectileSize, projectileSize);

    // 直线飞出
    circle.setVelocity(
      Math.cos(targetAngle) * this.circleSpeed,
      Math.sin(targetAngle) * this.circleSpeed,
    );
    circle.damage = this.damage;
    circle.weaponRef = this;

    // 返回逻辑
    this.scene.time.delayedCall(this.returnDelay, () => {
      if (circle.active) {
        const checkReturn = () => {
          if (!circle.active) return;

          const currentPlayerPos = this.player.getPosition();
          const dx = currentPlayerPos.x - circle.x;
          const dy = currentPlayerPos.y - circle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 30) {
            circle.destroy();
            return;
          }

          const returnAngle = Math.atan2(dy, dx);
          circle.setVelocity(
            Math.cos(returnAngle) * this.circleSpeed * 1.2,
            Math.sin(returnAngle) * this.circleSpeed * 1.2,
          );

          this.scene.time.delayedCall(50, checkReturn);
        };
        checkReturn();
      }
    });

    this.scene.time.delayedCall(3000, () => {
      if (circle.active) circle.destroy();
    });
  }

  protected applyUpgrade(): void {
    this.damage += 8;
    this.circleSpeed += 50;
    if (this.level >= 5) this.returnDelay = 1500;
  }
}

// Red Armillary Sash - 混天绫（哪吒）
export class RedArmillarySash extends Weapon {
  private sashLength: number;
  private whipCount: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 28,
      coolDown: 1400,
      type: "red_armillary_sash",
    });
    this.sashLength = scaleManager.scaleValue(200);
    this.whipCount = 3;
  }

  protected fire(enemies: Enemy[]): void {
    const playerPos = this.player.getPosition();
    const baseAngle = this.getPlayerAngle();

    // 鞭打攻击，扇形挥舞
    for (let i = 0; i < this.whipCount; i++) {
      const angle = baseAngle + ((i - 1) * Math.PI) / 8;
      const endX = playerPos.x + Math.cos(angle) * this.sashLength;
      const endY = playerPos.y + Math.sin(angle) * this.sashLength;

      // 创建鞭打轨迹
      const graphics = this.scene.add.graphics();
      graphics.lineStyle(6, 0xff4444, 0.8);
      graphics.lineBetween(playerPos.x, playerPos.y, endX, endY);

      // 检测范围内敌人
      enemies.forEach((enemy) => {
        if (enemy.isDead) return;

        const distance = Phaser.Math.Distance.Between(
          playerPos.x,
          playerPos.y,
          enemy.sprite.x,
          enemy.sprite.y,
        );

        if (distance <= this.sashLength) {
          const enemyAngle = Phaser.Math.Angle.Between(
            playerPos.x,
            playerPos.y,
            enemy.sprite.x,
            enemy.sprite.y,
          );
          const angleDiff = Math.abs(
            Phaser.Math.Angle.Wrap(enemyAngle - angle),
          );

          if (angleDiff < Math.PI / 12) {
            enemy.takeDamage(this.damage);
            // 束缚效果：减速
            if (enemy.sprite.body && "setVelocity" in enemy.sprite.body) {
              const originalSpeed = enemy.speed;
              enemy.speed *= 0.5;
              this.scene.time.delayedCall(800, () => {
                enemy.speed = originalSpeed;
              });
            }
          }
        }
      });

      this.scene.tweens.add({
        targets: graphics,
        alpha: 0,
        duration: 400,
        delay: i * 100,
        onComplete: () => graphics.destroy(),
      });
    }
  }

  protected applyUpgrade(): void {
    this.damage += 6;
    this.sashLength += scaleManager.scaleValue(25);
    if (this.level >= 3) this.whipCount = 4;
    if (this.level >= 5) this.whipCount = 5;
  }
}

// Purple Gold Gourd - 紫金葫芦（金角银角）
export class PurpleGoldGourd extends Weapon {
  private absorbRadius: number;
  private absorbDuration: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 35,
      coolDown: 3500,
      type: "purple_gold_gourd",
    });
    this.absorbRadius = scaleManager.scaleValue(180);
    this.absorbDuration = 2000;
  }

  protected fire(enemies: Enemy[]): void {
    const playerPos = this.player.getPosition();

    // 创建吸收特效
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(4, 0x9932cc, 1);
    graphics.strokeCircle(0, 0, this.absorbRadius);
    graphics.setPosition(playerPos.x, playerPos.y);

    const absorbedEnemies: Enemy[] = [];

    enemies.forEach((enemy) => {
      if (enemy.isDead) return;

      const distance = Phaser.Math.Distance.Between(
        playerPos.x,
        playerPos.y,
        enemy.sprite.x,
        enemy.sprite.y,
      );

      if (distance <= this.absorbRadius) {
        absorbedEnemies.push(enemy);
        // 吸引效果
        if (enemy.sprite.body && "setVelocity" in enemy.sprite.body) {
          const angle = Phaser.Math.Angle.Between(
            enemy.sprite.x,
            enemy.sprite.y,
            playerPos.x,
            playerPos.y,
          );
          enemy.sprite.body.setVelocity(
            Math.cos(angle) * 200,
            Math.sin(angle) * 200,
          );
        }
      }
    });

    // 延迟爆发伤害
    this.scene.time.delayedCall(this.absorbDuration, () => {
      absorbedEnemies.forEach((enemy) => {
        if (!enemy.isDead) {
          enemy.takeDamage(this.damage);
        }
      });
    });

    this.scene.tweens.add({
      targets: graphics,
      scaleX: 0.5,
      scaleY: 0.5,
      alpha: 0,
      duration: this.absorbDuration,
      onComplete: () => graphics.destroy(),
    });
  }

  protected applyUpgrade(): void {
    this.damage += 10;
    this.absorbRadius += scaleManager.scaleValue(20);
    if (this.level >= 3) this.absorbDuration = 1500;
    if (this.level >= 5) this.coolDown = 2800;
  }
}

// Golden Rope Immortal - 幌金绳（太上老君）
export class GoldenRopeImmortal extends Weapon {
  private ropeChains: number;
  private chainLength: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 26,
      coolDown: 1600,
      type: "golden_rope_immortal",
    });
    this.ropeChains = 3;
    this.chainLength = scaleManager.scaleValue(250);
  }

  protected fire(enemies: Enemy[]): void {
    if (enemies.length === 0) return;

    const playerPos = this.player.getPosition();
    const sortedEnemies = enemies
      .filter((e) => !e.isDead)
      .sort((a, b) => {
        const distA = Phaser.Math.Distance.Between(
          playerPos.x,
          playerPos.y,
          a.sprite.x,
          a.sprite.y,
        );
        const distB = Phaser.Math.Distance.Between(
          playerPos.x,
          playerPos.y,
          b.sprite.x,
          b.sprite.y,
        );
        return distA - distB;
      })
      .slice(0, this.ropeChains);

    sortedEnemies.forEach((enemy) => {
      const distance = Phaser.Math.Distance.Between(
        playerPos.x,
        playerPos.y,
        enemy.sprite.x,
        enemy.sprite.y,
      );

      if (distance <= this.chainLength) {
        // 创建绳索特效
        const graphics = this.scene.add.graphics();
        graphics.lineStyle(3, 0xffd700, 0.9);
        graphics.lineBetween(
          playerPos.x,
          playerPos.y,
          enemy.sprite.x,
          enemy.sprite.y,
        );

        enemy.takeDamage(this.damage);

        // 强力束缚：大幅减速并持续伤害
        if (enemy.sprite.body && "setVelocity" in enemy.sprite.body) {
          const originalSpeed = enemy.speed;
          enemy.speed *= 0.2;

          const bindDuration = 1500;
          const tickDamage = this.damage * 0.2;
          const tickInterval = 300;

          const damageInterval = this.scene.time.addEvent({
            delay: tickInterval,
            repeat: Math.floor(bindDuration / tickInterval),
            callback: () => {
              if (!enemy.isDead) {
                enemy.takeDamage(tickDamage);
              }
            },
          });

          this.scene.time.delayedCall(bindDuration, () => {
            if (!enemy.isDead) {
              enemy.speed = originalSpeed;
            }
            damageInterval.remove();
          });
        }

        this.scene.tweens.add({
          targets: graphics,
          alpha: 0,
          duration: 1500,
          onComplete: () => graphics.destroy(),
        });
      }
    });
  }

  protected applyUpgrade(): void {
    this.damage += 6;
    this.chainLength += scaleManager.scaleValue(30);
    if (this.level >= 3) this.ropeChains = 4;
    if (this.level >= 5) this.ropeChains = 5;
  }
}

// Demon Revealing Mirror - 照妖镜
export class DemonRevealingMirror extends Weapon {
  private revealRadius: number;
  private critBonus: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 18,
      coolDown: 2500,
      type: "demon_revealing_mirror",
    });
    this.revealRadius = scaleManager.scaleValue(200);
    this.critBonus = 1.5; // 暴击倍率
  }

  protected fire(enemies: Enemy[]): void {
    const playerPos = this.player.getPosition();

    // 创建照妖镜光环
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(3, 0xffffff, 1);
    graphics.strokeCircle(0, 0, this.revealRadius);
    graphics.setPosition(playerPos.x, playerPos.y);

    enemies.forEach((enemy) => {
      if (enemy.isDead) return;

      const distance = Phaser.Math.Distance.Between(
        playerPos.x,
        playerPos.y,
        enemy.sprite.x,
        enemy.sprite.y,
      );

      if (distance <= this.revealRadius) {
        // 暴击伤害
        const isCrit = Math.random() < 0.6; // 60%暴击率
        const finalDamage = isCrit ? this.damage * this.critBonus : this.damage;
        enemy.takeDamage(finalDamage);

        // 弱点标记特效
        const marker = this.scene.add.graphics();
        marker.lineStyle(2, 0xff0000, 1);
        marker.strokeCircle(0, 0, 20);
        marker.setPosition(enemy.sprite.x, enemy.sprite.y - 30);

        this.scene.tweens.add({
          targets: marker,
          alpha: 0,
          y: enemy.sprite.y - 50,
          duration: 1000,
          onComplete: () => marker.destroy(),
        });
      }
    });

    this.scene.tweens.add({
      targets: graphics,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 800,
      onComplete: () => graphics.destroy(),
    });
  }

  protected applyUpgrade(): void {
    this.damage += 5;
    this.revealRadius += scaleManager.scaleValue(25);
    if (this.level >= 2) this.critBonus = 1.7;
    if (this.level >= 3) this.critBonus = 2.0;
    if (this.level >= 5) this.critBonus = 2.5;
  }
}

// Sea Calming Needle - 定海神针（金箍棒终极形态）
export class SeaCalmingNeedle extends Weapon {
  private sweepRange: number;
  private sweepAngle: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 55,
      coolDown: 2000,
      type: "sea_calming_needle",
    });
    this.sweepRange = scaleManager.scaleValue(300);
    this.sweepAngle = Math.PI; // 180度
  }

  protected fire(enemies: Enemy[]): void {
    const playerPos = this.player.getPosition();
    const targetAngle = this.getPlayerAngle();

    // 创建巨大横扫特效
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xffd700, 0.5);
    graphics.slice(
      0,
      0,
      this.sweepRange,
      targetAngle - this.sweepAngle / 2,
      targetAngle + this.sweepAngle / 2,
      false,
    );
    graphics.fillPath();
    graphics.setPosition(playerPos.x, playerPos.y);

    enemies.forEach((enemy) => {
      if (enemy.isDead) return;

      const distance = Phaser.Math.Distance.Between(
        playerPos.x,
        playerPos.y,
        enemy.sprite.x,
        enemy.sprite.y,
      );
      const angle = Phaser.Math.Angle.Between(
        playerPos.x,
        playerPos.y,
        enemy.sprite.x,
        enemy.sprite.y,
      );

      const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angle - targetAngle));

      if (distance < this.sweepRange && angleDiff < this.sweepAngle / 2) {
        enemy.takeDamage(this.damage);

        // 巨力击飞
        if (enemy.sprite.body && "setVelocity" in enemy.sprite.body) {
          enemy.sprite.body.setVelocity(
            Math.cos(angle) * 600,
            Math.sin(angle) * 600,
          );
        }
      }
    });

    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 600,
      onComplete: () => graphics.destroy(),
    });
  }

  protected applyUpgrade(): void {
    this.damage += 12;
    this.sweepRange += scaleManager.scaleValue(30);
    if (this.level >= 3) this.sweepAngle = Math.PI * 1.2;
    if (this.level >= 5) this.coolDown = 1500;
  }
}

// Eight Trigrams Furnace - 八卦炉（太上老君）
export class EightTrigramsFurnace extends Weapon {
  private furnaceRadius: number;
  private burnDuration: number;
  private burnDamagePerTick: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 32,
      coolDown: 2800,
      type: "eight_trigrams_furnace",
    });
    this.furnaceRadius = scaleManager.scaleValue(250);
    this.burnDuration = 5000; // 持续5秒灼烧
    this.burnDamagePerTick = 5;
  }

  protected fire(enemies: Enemy[]): void {
    const playerPos = this.player.getPosition();

    // 创建八卦炉特效 - 八个火焰柱
    const furnaceGraphics = this.scene.add.graphics();
    furnaceGraphics.setPosition(playerPos.x, playerPos.y);

    // 绘制八个方位的火焰
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x = Math.cos(angle) * this.furnaceRadius;
      const y = Math.sin(angle) * this.furnaceRadius;

      furnaceGraphics.fillStyle(0xff6600, 0.7);
      furnaceGraphics.fillCircle(x, y, 30);
    }

    // 中心火焰
    furnaceGraphics.fillStyle(0xff0000, 0.5);
    furnaceGraphics.fillCircle(0, 0, this.furnaceRadius);

    enemies.forEach((enemy) => {
      if (enemy.isDead) return;

      const distance = Phaser.Math.Distance.Between(
        playerPos.x,
        playerPos.y,
        enemy.sprite.x,
        enemy.sprite.y,
      );

      if (distance < this.furnaceRadius) {
        enemy.takeDamage(this.damage);

        // 应用持续灼烧效果
        const maxBurnTicks = Math.floor(this.burnDuration / 500);

        this.scene.time.addEvent({
          delay: 500,
          repeat: maxBurnTicks - 1,
          callback: () => {
            if (!enemy.isDead) {
              enemy.takeDamage(this.burnDamagePerTick);
            }
          },
        });
      }
    });

    this.scene.tweens.add({
      targets: furnaceGraphics,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 1500,
      onComplete: () => furnaceGraphics.destroy(),
    });
  }

  protected applyUpgrade(): void {
    this.damage += 7;
    this.burnDamagePerTick += 2;
    if (this.level >= 3) this.furnaceRadius = scaleManager.scaleValue(300);
    if (this.level >= 5) this.burnDuration = 7000;
  }
}

// Dragon Staff - 盘龙杖（观音座下）
export class DragonStaff extends Weapon {
  private tornadoRadius: number;
  private pullStrength: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 36,
      coolDown: 2300,
      type: "dragon_staff",
      projectiles: scene.physics.add.group(),
    });
    this.tornadoRadius = scaleManager.scaleValue(220);
    this.pullStrength = 150;
  }

  protected fire(enemies: Enemy[]): void {
    if (enemies.length === 0) return;

    const closestEnemy = this.getClosestEnemy(enemies);
    if (!closestEnemy) return;

    const targetX = closestEnemy.sprite.x;
    const targetY = closestEnemy.sprite.y;

    // 创建龙卷风
    const tornado = this.scene.add.graphics();
    tornado.setPosition(targetX, targetY);

    // 绘制龙卷风螺旋
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 + this.scene.time.now * 0.01;
      const radius = this.tornadoRadius * (1 - i / 10);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      tornado.fillStyle(0x00ffff, 0.4 - i * 0.05);
      tornado.fillCircle(x, y, 25);
    }

    // 龙卷风效果 - 持续伤害和拉扯
    const tornadoDuration = 3000;
    const damageInterval = 300;
    const damageTicks = tornadoDuration / damageInterval;

    this.scene.time.addEvent({
      delay: damageInterval,
      repeat: damageTicks - 1,
      callback: () => {
        enemies.forEach((enemy) => {
          if (enemy.isDead) return;

          const distance = Phaser.Math.Distance.Between(
            targetX,
            targetY,
            enemy.sprite.x,
            enemy.sprite.y,
          );

          if (distance < this.tornadoRadius) {
            enemy.takeDamage(this.damage / damageTicks);

            // 拉向中心
            const angle = Phaser.Math.Angle.Between(
              enemy.sprite.x,
              enemy.sprite.y,
              targetX,
              targetY,
            );
            if (enemy.sprite.body && "setVelocity" in enemy.sprite.body) {
              enemy.sprite.body.setVelocity(
                Math.cos(angle) * this.pullStrength,
                Math.sin(angle) * this.pullStrength,
              );
            }
          }
        });
      },
    });

    this.scene.tweens.add({
      targets: tornado,
      rotation: Math.PI * 6,
      alpha: 0,
      duration: tornadoDuration,
      onComplete: () => tornado.destroy(),
    });
  }

  protected applyUpgrade(): void {
    this.damage += 8;
    this.tornadoRadius += scaleManager.scaleValue(30);
    if (this.level >= 3) this.pullStrength = 200;
    if (this.level >= 5) this.coolDown = 1800;
  }
}

// Seven Treasure Tree - 七宝妙树（准提道人）
export class SevenTreasureTree extends Weapon {
  private sweepRange: number;
  private purifyRadius: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 38,
      coolDown: 3200,
      type: "seven_treasure_tree",
    });
    this.sweepRange = scaleManager.scaleValue(280);
    this.purifyRadius = scaleManager.scaleValue(350);
  }

  protected fire(enemies: Enemy[]): void {
    const playerPos = this.player.getPosition();
    const targetAngle = this.getPlayerAngle();

    // 创建七宝妙树刷新特效
    const treeGraphics = this.scene.add.graphics();
    treeGraphics.setPosition(playerPos.x, playerPos.y);

    // 绘制七色光芒
    const colors = [
      0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x4b0082, 0x9400d3,
    ];
    colors.forEach((color, index) => {
      const angle = targetAngle + (index - 3) * (Math.PI / 8);
      const endX = Math.cos(angle) * this.sweepRange;
      const endY = Math.sin(angle) * this.sweepRange;

      treeGraphics.lineStyle(8, color, 0.7);
      treeGraphics.lineBetween(0, 0, endX, endY);
    });

    // 中心净化圈
    treeGraphics.lineStyle(3, 0xffffff, 0.8);
    treeGraphics.strokeCircle(0, 0, this.purifyRadius);

    enemies.forEach((enemy) => {
      if (enemy.isDead) return;

      const distance = Phaser.Math.Distance.Between(
        playerPos.x,
        playerPos.y,
        enemy.sprite.x,
        enemy.sprite.y,
      );

      // 范围内的敌人受到伤害
      if (distance < this.purifyRadius) {
        const damageMultiplier = distance < this.sweepRange ? 1.5 : 1.0;
        enemy.takeDamage(this.damage * damageMultiplier);

        // 净化效果 - 移除buff（游戏中可扩展）
        // 这里仅做伤害和击退
        const angle = Phaser.Math.Angle.Between(
          playerPos.x,
          playerPos.y,
          enemy.sprite.x,
          enemy.sprite.y,
        );
        if (enemy.sprite.body && "setVelocity" in enemy.sprite.body) {
          enemy.sprite.body.setVelocity(
            Math.cos(angle) * 300,
            Math.sin(angle) * 300,
          );
        }
      }
    });

    this.scene.tweens.add({
      targets: treeGraphics,
      alpha: 0,
      rotation: Math.PI / 2,
      duration: 1200,
      onComplete: () => treeGraphics.destroy(),
    });
  }

  protected applyUpgrade(): void {
    this.damage += 9;
    this.purifyRadius += scaleManager.scaleValue(40);
    if (this.level >= 3) this.sweepRange = scaleManager.scaleValue(350);
    if (this.level >= 5) this.coolDown = 2500;
  }
}

// Immortal Slaying Blade - 斩仙飞刀（陆压道人）
export class ImmortalSlayingBlade extends Weapon {
  private lockOnDuration: number;
  private bladeSpeed: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 48,
      coolDown: 4000,
      type: "immortal_slaying_blade",
      projectiles: scene.physics.add.group(),
    });
    this.lockOnDuration = 1500; // 锁定1.5秒
    this.bladeSpeed = 400;
  }

  protected fire(enemies: Enemy[]): void {
    if (enemies.length === 0) return;

    // 锁定血量最高的敌人
    const target = enemies.reduce(
      (highest, enemy) => {
        if (enemy.isDead) return highest;
        return !highest || enemy.health > highest.health ? enemy : highest;
      },
      null as Enemy | null,
    );

    if (!target) return;

    const playerPos = this.player.getPosition();

    // 创建"请宝贝转身"锁定特效
    const lockGraphics = this.scene.add.graphics();
    lockGraphics.lineStyle(3, 0xff0000, 1);
    lockGraphics.strokeCircle(target.sprite.x, target.sprite.y, 50);
    lockGraphics.lineStyle(2, 0xffff00, 1);
    lockGraphics.strokeCircle(target.sprite.x, target.sprite.y, 60);

    this.scene.tweens.add({
      targets: lockGraphics,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: this.lockOnDuration,
      onComplete: () => {
        lockGraphics.destroy();

        // 锁定后发射必杀飞刀
        if (target.isDead) return;

        const projectileSize = scaleManager.getSpriteSize(28);
        const blade = this.projectiles?.create(
          playerPos.x,
          playerPos.y,
          this.type,
        ) as ProjectileSprite;

        blade.setCircle(projectileSize / 2);
        blade.setDisplaySize(projectileSize, projectileSize);
        blade.damage = this.damage;
        blade.weaponRef = this;
        blade.setTint(0xff0000);

        // 追踪目标
        const trackBlade = () => {
          if (!blade.active || target.isDead) {
            if (blade.active) blade.destroy();
            return;
          }

          const dx = target.sprite.x - blade.x;
          const dy = target.sprite.y - blade.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 20) {
            // 必杀效果 - 额外伤害
            target.takeDamage(this.damage * 2);
            blade.destroy();
            return;
          }

          const angle = Math.atan2(dy, dx);
          blade.setVelocity(
            Math.cos(angle) * this.bladeSpeed,
            Math.sin(angle) * this.bladeSpeed,
          );
          blade.setRotation(angle);

          this.scene.time.delayedCall(50, trackBlade);
        };

        trackBlade();

        // 超时保护
        this.scene.time.delayedCall(5000, () => {
          if (blade.active) blade.destroy();
        });
      },
    });
  }

  protected applyUpgrade(): void {
    this.damage += 12;
    this.bladeSpeed += 50;
    if (this.level >= 3) this.lockOnDuration = 1000;
    if (this.level >= 5) this.coolDown = 3000;
  }
}

// Diamond Snare - 金刚琢（太上老君）
export class DiamondSnare extends Weapon {
  private snareSpeed: number;
  private armorBreak: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 34,
      coolDown: 1900,
      type: "diamond_snare",
      projectiles: scene.physics.add.group(),
    });
    this.snareSpeed = 500;
    this.armorBreak = 0.5; // 无视50%防御
  }

  protected fire(enemies: Enemy[]): void {
    if (enemies.length === 0) return;

    const closestEnemy = this.getClosestEnemy(enemies);
    if (!closestEnemy) return;

    const playerPos = this.player.getPosition();
    const angle = Phaser.Math.Angle.Between(
      playerPos.x,
      playerPos.y,
      closestEnemy.sprite.x,
      closestEnemy.sprite.y,
    );

    const projectileSize = scaleManager.getSpriteSize(32);
    const snare = this.projectiles?.create(
      playerPos.x,
      playerPos.y,
      this.type,
    ) as ProjectileSprite;

    snare.setCircle(projectileSize / 2);
    snare.setDisplaySize(projectileSize, projectileSize);
    snare.setVelocity(
      Math.cos(angle) * this.snareSpeed,
      Math.sin(angle) * this.snareSpeed,
    );
    snare.damage = this.damage * (1 + this.armorBreak); // 破防加成
    snare.weaponRef = this;
    snare.setTint(0xffd700);

    // 旋转效果
    this.scene.tweens.add({
      targets: snare,
      rotation: Math.PI * 4,
      duration: 2000,
    });

    this.scene.time.delayedCall(2000, () => {
      if (snare.active) snare.destroy();
    });
  }

  protected applyUpgrade(): void {
    this.damage += 7;
    this.snareSpeed += 50;
    if (this.level >= 2) this.armorBreak = 0.6;
    if (this.level >= 3) this.armorBreak = 0.7;
    if (this.level >= 5) this.armorBreak = 1.0; // 5级完全无视防御
  }
}

// Exquisite Pagoda - 玲珑宝塔（托塔天王李靖）
export class ExquisitePagoda extends Weapon {
  private pagodaRadius: number;
  private imprisonDuration: number;
  private damageOverTime: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 40,
      coolDown: 3600,
      type: "exquisite_pagoda",
    });
    this.pagodaRadius = scaleManager.scaleValue(200);
    this.imprisonDuration = 4000;
    this.damageOverTime = 8;
  }

  protected fire(enemies: Enemy[]): void {
    if (enemies.length === 0) return;

    const closestEnemy = this.getClosestEnemy(enemies);
    if (!closestEnemy) return;

    const targetX = closestEnemy.sprite.x;
    const targetY = closestEnemy.sprite.y;

    // 创建宝塔镇压特效
    const pagoda = this.scene.add.graphics();
    pagoda.setPosition(targetX, targetY);

    // 绘制多层宝塔
    for (let layer = 0; layer < 5; layer++) {
      const layerRadius = this.pagodaRadius * (1 - layer * 0.15);
      const layerHeight = -layer * 40;

      pagoda.lineStyle(4, 0xffd700, 0.8);
      pagoda.strokeRect(-layerRadius / 2, layerHeight - 20, layerRadius, 20);
    }

    // 塔底封印阵
    pagoda.lineStyle(3, 0xff6600, 0.7);
    pagoda.strokeCircle(0, 0, this.pagodaRadius);
    pagoda.lineStyle(2, 0xffff00, 0.7);
    pagoda.strokeCircle(0, 0, this.pagodaRadius * 0.7);

    // 镇压效果
    const imprisonedEnemies: Enemy[] = [];
    enemies.forEach((enemy) => {
      if (enemy.isDead) return;

      const distance = Phaser.Math.Distance.Between(
        targetX,
        targetY,
        enemy.sprite.x,
        enemy.sprite.y,
      );

      if (distance < this.pagodaRadius) {
        imprisonedEnemies.push(enemy);
        enemy.takeDamage(this.damage);

        // 禁锢 - 大幅减速
        if (enemy.sprite.body && "setVelocity" in enemy.sprite.body) {
          enemy.sprite.body.setVelocity(0, 0);
        }
      }
    });

    // 持续镇压伤害
    const imprisonTicks = Math.floor(this.imprisonDuration / 500);
    this.scene.time.addEvent({
      delay: 500,
      repeat: imprisonTicks - 1,
      callback: () => {
        imprisonedEnemies.forEach((enemy) => {
          if (!enemy.isDead) {
            enemy.takeDamage(this.damageOverTime);
            // 保持禁锢
            if (enemy.sprite.body && "setVelocity" in enemy.sprite.body) {
              enemy.sprite.body.setVelocity(0, 0);
            }
          }
        });
      },
    });

    this.scene.tweens.add({
      targets: pagoda,
      alpha: 0,
      scaleX: 0.8,
      scaleY: 0.8,
      duration: this.imprisonDuration,
      onComplete: () => pagoda.destroy(),
    });
  }

  protected applyUpgrade(): void {
    this.damage += 9;
    this.damageOverTime += 3;
    if (this.level >= 3) this.pagodaRadius = scaleManager.scaleValue(250);
    if (this.level >= 5) this.imprisonDuration = 5500;
  }
}

// Nine Tooth Rake - 九齿钉耙（猪八戒）
export class NineToothRake extends Weapon {
  private rakeRange: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 35,
      coolDown: 1600,
      type: "nine_tooth_rake",
    });
    this.rakeRange = scaleManager.scaleValue(200);
  }

  protected fire(enemies: Enemy[]): void {
    const playerPos = this.player.getPosition();
    const targetAngle = this.getPlayerAngle();

    // 创建九齿钉耙扫击特效 - 扇形攻击
    const graphics = this.scene.add.graphics();
    graphics.setPosition(playerPos.x, playerPos.y);

    // 绘制钉耙的九个齿
    const teethCount = 5 + Math.floor(this.level / 2); // 5-7个齿
    const spreadAngle = Math.PI / 4; // 45度扇形

    for (let i = 0; i < teethCount; i++) {
      const angle =
        targetAngle + (i - (teethCount - 1) / 2) * (spreadAngle / teethCount);
      const startX = Math.cos(angle) * 30;
      const startY = Math.sin(angle) * 30;
      const endX = Math.cos(angle) * this.rakeRange;
      const endY = Math.sin(angle) * this.rakeRange;

      graphics.lineStyle(6, 0xffa500, 0.8);
      graphics.lineBetween(startX, startY, endX, endY);

      // 齿尖
      graphics.fillStyle(0xff8c00, 1);
      graphics.fillCircle(endX, endY, 8);
    }

    // 扇形覆盖区域
    graphics.fillStyle(0xffa500, 0.3);
    graphics.slice(
      0,
      0,
      this.rakeRange,
      targetAngle - spreadAngle / 2,
      targetAngle + spreadAngle / 2,
      false,
    );
    graphics.fillPath();

    // 对范围内的敌人造成伤害
    enemies.forEach((enemy) => {
      if (enemy.isDead) return;

      const distance = Phaser.Math.Distance.Between(
        playerPos.x,
        playerPos.y,
        enemy.sprite.x,
        enemy.sprite.y,
      );
      const angle = Phaser.Math.Angle.Between(
        playerPos.x,
        playerPos.y,
        enemy.sprite.x,
        enemy.sprite.y,
      );

      const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angle - targetAngle));

      if (distance < this.rakeRange && angleDiff < spreadAngle / 2) {
        enemy.takeDamage(this.damage);

        // 钉耙特效：向后拉扯敌人（耙的效果）
        const pullAngle = Phaser.Math.Angle.Between(
          enemy.sprite.x,
          enemy.sprite.y,
          playerPos.x,
          playerPos.y,
        );
        if (enemy.sprite.body && "setVelocity" in enemy.sprite.body) {
          enemy.sprite.body.setVelocity(
            Math.cos(pullAngle) * 200,
            Math.sin(pullAngle) * 200,
          );
        }
      }
    });

    this.scene.tweens.add({
      targets: graphics,
      alpha: 0,
      rotation: 0.3,
      duration: 400,
      onComplete: () => graphics.destroy(),
    });
  }

  protected applyUpgrade(): void {
    this.damage += 8;
    this.rakeRange += scaleManager.scaleValue(20);
    if (this.level >= 5) this.coolDown = 1200;
  }
}

// Dragon Scale Sword - 龙鳞剑（白龙马）
export class DragonScaleSword extends Weapon {
  private swordSpeed: number;
  private swordCount: number;

  constructor(scene: Phaser.Scene, player: Player) {
    super(scene, player, {
      damage: 26,
      coolDown: 1200,
      type: "dragon_scale_sword",
      projectiles: scene.physics.add.group(),
    });
    this.swordSpeed = 450;
    this.swordCount = 1;
  }

  protected fire(enemies: Enemy[]): void {
    if (enemies.length === 0) return;

    const playerPos = this.player.getPosition();

    // 查找最近的敌人
    const closestEnemy = this.getClosestEnemy(enemies);

    if (!closestEnemy) return;

    const baseAngle = Phaser.Math.Angle.Between(
      playerPos.x,
      playerPos.y,
      closestEnemy.sprite.x,
      closestEnemy.sprite.y,
    );

    // 发射多把龙鳞剑气
    for (let i = 0; i < this.swordCount; i++) {
      const angle = baseAngle + (i - (this.swordCount - 1) / 2) * 0.2;
      const projectileSize = scaleManager.getSpriteSize(32);

      const sword = this.projectiles?.create(
        playerPos.x,
        playerPos.y,
        this.type,
      ) as ProjectileSprite;

      sword.setCircle(projectileSize / 2);
      sword.setDisplaySize(projectileSize, projectileSize);
      sword.setVelocity(
        Math.cos(angle) * this.swordSpeed,
        Math.sin(angle) * this.swordSpeed,
      );
      sword.damage = this.damage;
      sword.weaponRef = this;
      sword.setRotation(angle);
      sword.setTint(0x00ffff); // 青色龙光

      // 龙鳞剑气特效 - 螺旋轨迹
      let spiralAngle = 0;
      const spiralRadius = 15;
      const updateSpiral = () => {
        if (!sword.active) return;

        spiralAngle += 0.3;
        const offsetX = Math.cos(spiralAngle) * spiralRadius;
        const offsetY = Math.sin(spiralAngle) * spiralRadius;

        // 创建剑气轨迹
        const trail = this.scene.add.graphics();
        trail.fillStyle(0x00ffff, 0.5);
        trail.fillCircle(sword.x + offsetX, sword.y + offsetY, 5);

        this.scene.tweens.add({
          targets: trail,
          alpha: 0,
          scaleX: 0.5,
          scaleY: 0.5,
          duration: 300,
          onComplete: () => trail.destroy(),
        });

        this.scene.time.delayedCall(50, updateSpiral);
      };
      updateSpiral();

      // 生命周期
      this.scene.time.delayedCall(2000, () => {
        if (sword.active) sword.destroy();
      });
    }
  }

  protected applyUpgrade(): void {
    this.damage += 6;
    this.swordSpeed += 50;
    if (this.level >= 2) this.swordCount = 2;
    if (this.level >= 4) this.swordCount = 3;
    if (this.level >= 5) {
      this.swordCount = 3;
      this.coolDown = 900;
    }
  }
}

// Weapon types
export type WeaponClass =
  | typeof GoldenStaff
  | typeof RuyiStaff
  | typeof FireLance
  | typeof WindTamer
  | typeof VioletBell
  | typeof FireproofCloak
  | typeof TwinBlades
  | typeof Mace
  | typeof BullHorns
  | typeof ThunderDrum
  | typeof IceNeedle
  | typeof WindFireWheels
  | typeof JadePurityBottle
  | typeof GoldenRope
  | typeof PlantainFan
  | typeof ThreePointedBlade
  | typeof NineRingStaff
  | typeof CrescentBlade
  | typeof IronCudgel
  | typeof SevenStarSword
  | typeof GinsengFruit
  | typeof HeavenEarthCircle
  | typeof RedArmillarySash
  | typeof PurpleGoldGourd
  | typeof GoldenRopeImmortal
  | typeof DemonRevealingMirror
  | typeof SeaCalmingNeedle
  | typeof EightTrigramsFurnace
  | typeof DragonStaff
  | typeof SevenTreasureTree
  | typeof ImmortalSlayingBlade
  | typeof DiamondSnare
  | typeof ExquisitePagoda
  | typeof NineToothRake
  | typeof DragonScaleSword;
export interface UpgradeOption {
  type: "upgrade" | "new";
  weapon?: Weapon;
  weaponClass?: WeaponClass;
  name: string;
  description: string;
}

export const WEAPON_MAP: Record<WeaponType, WeaponClass> = {
  golden_staff: GoldenStaff,
  fireproof_cloak: FireproofCloak,
  ruyi_staff: RuyiStaff,
  fire_lance: FireLance,
  wind_tamer: WindTamer,
  violet_bell: VioletBell,
  twin_blades: TwinBlades,
  mace: Mace,
  bull_horns: BullHorns,
  thunder_drum: ThunderDrum,
  ice_needle: IceNeedle,
  wind_fire_wheels: WindFireWheels,
  jade_purity_bottle: JadePurityBottle,
  golden_rope: GoldenRope,
  plantain_fan: PlantainFan,
  three_pointed_blade: ThreePointedBlade,
  nine_ring_staff: NineRingStaff,
  crescent_blade: CrescentBlade,
  iron_cudgel: IronCudgel,
  seven_star_sword: SevenStarSword,
  ginseng_fruit: GinsengFruit,
  heaven_earth_circle: HeavenEarthCircle,
  red_armillary_sash: RedArmillarySash,
  purple_gold_gourd: PurpleGoldGourd,
  golden_rope_immortal: GoldenRopeImmortal,
  demon_revealing_mirror: DemonRevealingMirror,
  sea_calming_needle: SeaCalmingNeedle,
  eight_trigrams_furnace: EightTrigramsFurnace,
  dragon_staff: DragonStaff,
  seven_treasure_tree: SevenTreasureTree,
  immortal_slaying_blade: ImmortalSlayingBlade,
  diamond_snare: DiamondSnare,
  exquisite_pagoda: ExquisitePagoda,
  nine_tooth_rake: NineToothRake,
  dragon_scale_sword: DragonScaleSword,
};

// Weapon Manager
export class WeaponManager {
  private scene: Phaser.Scene;
  private player: Player;
  public weapons: Weapon[];
  private availableWeapons: WeaponClass[];

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.weapons = [];
    this.availableWeapons = [
      GoldenStaff,
      RuyiStaff,
      FireLance,
      WindTamer,
      VioletBell,
      FireproofCloak,
      TwinBlades,
      Mace,
      BullHorns,
      ThunderDrum,
      IceNeedle,
      WindFireWheels,
      JadePurityBottle,
      GoldenRope,
      PlantainFan,
      ThreePointedBlade,
      NineRingStaff,
      CrescentBlade,
      IronCudgel,
      SevenStarSword,
      GinsengFruit,
      HeavenEarthCircle,
      RedArmillarySash,
      PurpleGoldGourd,
      GoldenRopeImmortal,
      DemonRevealingMirror,
      SeaCalmingNeedle,
      EightTrigramsFurnace,
      DragonStaff,
      SevenTreasureTree,
      ImmortalSlayingBlade,
      DiamondSnare,
      ExquisitePagoda,
      NineToothRake,
      DragonScaleSword,
    ];
  }

  public update(time: number, enemies: Enemy[]): void {
    this.weapons.forEach((weapon) => {
      weapon.update(time, enemies);
    });
  }

  public addWeapon(WeaponClass: WeaponClass): Weapon {
    const weapon = new WeaponClass(this.scene, this.player);
    this.weapons.push(weapon);
    return weapon;
  }

  public hasWeapon(WeaponClass: WeaponClass): boolean {
    return this.weapons.some((weapon) => weapon instanceof WeaponClass);
  }

  public getWeapon(WeaponClass: WeaponClass): Weapon | undefined {
    return this.weapons.find((weapon) => weapon instanceof WeaponClass);
  }

  public getWeaponById(id: WeaponType): WeaponClass {
    return WEAPON_MAP[id] || GoldenStaff;
  }

  public getUpgradeOptions(): UpgradeOption[] {
    const options: UpgradeOption[] = [];

    // Upgrade options for existing weapons
    this.weapons.forEach((weapon) => {
      if (weapon.level < weapon.maxLevel) {
        const name = i18n.t(`weapons.${weapon.type}.name`);
        options.push({
          type: "upgrade",
          weapon: weapon,
          name: i18n.t("weapons.upgradeToLevel", {
            name,
            level: weapon.level + 1,
          }),
          description: i18n.t("weapons.upgrade", { name }),
        });
      }
    });

    // New weapon options
    this.availableWeapons.forEach((weaponInfo) => {
      if (!this.hasWeapon(weaponInfo)) {
        const type = weaponInfo.type;
        options.push({
          type: "new",
          weaponClass: weaponInfo,
          name: i18n.t(`weapons.${type}.name`),
          description: i18n.t(`weapons.${type}.description`),
        });
      }
    });

    // Randomly select 3 options
    const shuffled = options.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }

  public clear(): void {
    this.weapons.forEach((weapon) => {
      weapon.projectiles?.clear(true, true);

      weapon.orbs.forEach((orb: OrbData) => orb.sprite.destroy());
    });
    this.weapons = [];
  }
}

// Weapon Synergy System - 武器协同效果系统
export interface WeaponSynergyBonus {
  id: string;
  name: string;
  description: string;
  weapons: WeaponType[];
  effects: {
    damageBonus?: number;
    attackSpeedBonus?: number;
    rangeBonus?: number;
    critRateBonus?: number;
    critDamageBonus?: number;
    armorBonus?: number;
    allStatsBonus?: number;
    healthRegenBonus?: number;
    controlDurationBonus?: number;
  };
}

export const WEAPON_SYNERGIES: WeaponSynergyBonus[] = [
  {
    id: "fire_combo",
    name: "烈焰之势",
    description: "火尖枪 + 风火轮 = 火焰伤害提升 30%",
    weapons: ["fire_lance", "wind_fire_wheels"],
    effects: {
      damageBonus: 0.3,
    },
  },
  {
    id: "staff_master",
    name: "棍法大师",
    description: "金箍棒 + 如意金箍棒 + 定海神针 = 攻速提升 30%",
    weapons: ["golden_staff", "ruyi_staff", "sea_calming_needle"],
    effects: {
      attackSpeedBonus: 0.3,
    },
  },
  {
    id: "storm_power",
    name: "风暴之力",
    description: "定风珠 + 芭蕉扇 = 范围+50%",
    weapons: ["wind_tamer", "plantain_fan"],
    effects: {
      rangeBonus: 0.5,
    },
  },
  {
    id: "blade_resonance",
    name: "剑刃共鸣",
    description: "三尖两刃刀 + 七星剑 = 暴击率+15%",
    weapons: ["three_pointed_blade", "seven_star_sword"],
    effects: {
      critRateBonus: 0.15,
    },
  },
  {
    id: "buddhist_guardian",
    name: "佛门金刚",
    description: "九环锡杖 + 降魔杵 = 护甲+10",
    weapons: ["nine_ring_staff", "mace"],
    effects: {
      armorBonus: 10,
    },
  },
  {
    id: "heavy_weapons_master",
    name: "重武器大师",
    description: "月牙铲 + 混铁棍 = 击退距离+50%",
    weapons: ["crescent_blade", "iron_cudgel"],
    effects: {
      controlDurationBonus: 0.5,
    },
  },
  {
    id: "immortal_protection",
    name: "仙气护体",
    description: "人参果 + 任意武器 = 生命恢复速度+5/秒",
    weapons: ["ginseng_fruit"],
    effects: {
      healthRegenBonus: 5,
    },
  },
  {
    id: "nezha_trinity",
    name: "哪吒三宝",
    description: "乾坤圈 + 混天绫 + 风火轮 = 全属性+10%",
    weapons: ["heaven_earth_circle", "red_armillary_sash", "wind_fire_wheels"],
    effects: {
      allStatsBonus: 0.1,
    },
  },
  {
    id: "binding_mastery",
    name: "束缚精通",
    description: "金绳索 + 幌金绳 = 控制时间+50%",
    weapons: ["golden_rope", "golden_rope_immortal"],
    effects: {
      controlDurationBonus: 0.5,
    },
  },
  {
    id: "absorption_master",
    name: "吸收大师",
    description: "紫金葫芦 + 玉净瓶 = 伤害+25%",
    weapons: ["purple_gold_gourd", "jade_purity_bottle"],
    effects: {
      damageBonus: 0.25,
    },
  },
  {
    id: "weakness_detection",
    name: "识破弱点",
    description: "照妖镜 + 任意攻击武器 = 暴击伤害+30%",
    weapons: ["demon_revealing_mirror"],
    effects: {
      critDamageBonus: 0.3,
    },
  },
];

export class WeaponSynergyManager {
  private activeSynergies: Set<string> = new Set();
  private synergyBonuses: Map<string, number> = new Map();

  constructor() {
    this.activeSynergies = new Set();
    this.synergyBonuses = new Map();
  }

  /**
   * 检查并激活武器协同效果
   * @param weapons 玩家当前拥有的所有武器
   * @returns 激活的协同效果列表
   */
  public checkSynergies(weapons: Weapon[]): WeaponSynergyBonus[] {
    const weaponTypes = weapons.map((w) => w.type);
    const activeSynergies: WeaponSynergyBonus[] = [];
    this.activeSynergies.clear();

    WEAPON_SYNERGIES.forEach((synergy) => {
      // 检查是否满足协同条件
      const hasAllWeapons = synergy.weapons.every((weaponType) =>
        weaponTypes.includes(weaponType),
      );

      // 对于 "任意武器" 协同（如人参果、照妖镜），只需要该武器存在即可
      const isSingleWeaponSynergy = synergy.weapons.length === 1;
      const hasSingleWeapon =
        isSingleWeaponSynergy && weaponTypes.includes(synergy.weapons[0]);

      if (
        hasAllWeapons ||
        (isSingleWeaponSynergy && hasSingleWeapon && weaponTypes.length > 1)
      ) {
        this.activeSynergies.add(synergy.id);
        activeSynergies.push(synergy);
      }
    });

    return activeSynergies;
  }

  /**
   * 获取总伤害加成
   */
  public getDamageBonus(): number {
    let bonus = 0;
    WEAPON_SYNERGIES.forEach((synergy) => {
      if (this.activeSynergies.has(synergy.id) && synergy.effects.damageBonus) {
        bonus += synergy.effects.damageBonus;
      }
      if (
        this.activeSynergies.has(synergy.id) &&
        synergy.effects.allStatsBonus
      ) {
        bonus += synergy.effects.allStatsBonus;
      }
    });
    return bonus;
  }

  /**
   * 获取攻速加成
   */
  public getAttackSpeedBonus(): number {
    let bonus = 0;
    WEAPON_SYNERGIES.forEach((synergy) => {
      if (
        this.activeSynergies.has(synergy.id) &&
        synergy.effects.attackSpeedBonus
      ) {
        bonus += synergy.effects.attackSpeedBonus;
      }
      if (
        this.activeSynergies.has(synergy.id) &&
        synergy.effects.allStatsBonus
      ) {
        bonus += synergy.effects.allStatsBonus;
      }
    });
    return bonus;
  }

  /**
   * 获取范围加成
   */
  public getRangeBonus(): number {
    let bonus = 0;
    WEAPON_SYNERGIES.forEach((synergy) => {
      if (this.activeSynergies.has(synergy.id) && synergy.effects.rangeBonus) {
        bonus += synergy.effects.rangeBonus;
      }
    });
    return bonus;
  }

  /**
   * 获取暴击率加成
   */
  public getCritRateBonus(): number {
    let bonus = 0;
    WEAPON_SYNERGIES.forEach((synergy) => {
      if (
        this.activeSynergies.has(synergy.id) &&
        synergy.effects.critRateBonus
      ) {
        bonus += synergy.effects.critRateBonus;
      }
    });
    return bonus;
  }

  /**
   * 获取暴击伤害加成
   */
  public getCritDamageBonus(): number {
    let bonus = 0;
    WEAPON_SYNERGIES.forEach((synergy) => {
      if (
        this.activeSynergies.has(synergy.id) &&
        synergy.effects.critDamageBonus
      ) {
        bonus += synergy.effects.critDamageBonus;
      }
    });
    return bonus;
  }

  /**
   * 获取护甲加成
   */
  public getArmorBonus(): number {
    let bonus = 0;
    WEAPON_SYNERGIES.forEach((synergy) => {
      if (this.activeSynergies.has(synergy.id) && synergy.effects.armorBonus) {
        bonus += synergy.effects.armorBonus;
      }
      if (
        this.activeSynergies.has(synergy.id) &&
        synergy.effects.allStatsBonus
      ) {
        bonus += synergy.effects.allStatsBonus * 10; // 全属性10%转换为护甲
      }
    });
    return bonus;
  }

  /**
   * 获取生命恢复加成
   */
  public getHealthRegenBonus(): number {
    let bonus = 0;
    WEAPON_SYNERGIES.forEach((synergy) => {
      if (
        this.activeSynergies.has(synergy.id) &&
        synergy.effects.healthRegenBonus
      ) {
        bonus += synergy.effects.healthRegenBonus;
      }
    });
    return bonus;
  }

  /**
   * 获取控制时长加成
   */
  public getControlDurationBonus(): number {
    let bonus = 0;
    WEAPON_SYNERGIES.forEach((synergy) => {
      if (
        this.activeSynergies.has(synergy.id) &&
        synergy.effects.controlDurationBonus
      ) {
        bonus += synergy.effects.controlDurationBonus;
      }
    });
    return bonus;
  }

  /**
   * 获取所有激活的协同效果
   */
  public getActiveSynergies(): WeaponSynergyBonus[] {
    return WEAPON_SYNERGIES.filter((synergy) =>
      this.activeSynergies.has(synergy.id),
    );
  }

  /**
   * 清空所有协同效果
   */
  public clear(): void {
    this.activeSynergies.clear();
    this.synergyBonuses.clear();
  }
}
