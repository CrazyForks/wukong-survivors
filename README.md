# Wukong Survivors

[English](./README.md) | [中文](./README_ZH.md)

## 🎮 Wukong Survivors

A roguelike survivor game inspired by _Black Myth: Wukong_ and _Vampire Survivors_, built with Phaser.js, React, and Vite. Battle through legendary chapters from the Journey to the West, unlock powerful characters, and survive against endless waves of enemies.

### ✨ Features

- 🐵 **24 Playable Characters** - Unlock iconic characters from Journey to the West, including the Destined One, Black Bear Guai, Bull King, Erlang Shen, and more
- 🗺️ **6 Unique Chapters** - Explore diverse maps from Black Wind Mountain to Mount Sumeru
- ⚔️ **15 Legendary Weapons** - Collect and upgrade powerful weapons like the Golden Staff, Fire-Tipped Spear, and Plantain Fan
- 🎯 **Roguelike Progression** - Each run offers different upgrades and elixirs to create unique builds
- 💪 **Permanent Upgrades** - Spend gold to permanently enhance attack, health, armor, luck, and speed
- 🌍 **Multi-language Support** - Available in 10 languages: English, 中文, 日本語, 한국어, Français, Deutsch, Español, Português, Русский, 繁體中文

### 🚀 Quick Start

#### Prerequisites

- Node.js 16+ and npm/yarn/pnpm

#### Installation

```bash
# Clone the repository
git clone https://github.com/nusr/survivor-game.git
cd survivor-game

# Install dependencies
npm install

# Start development server
npm start
```

The game will open at `http://localhost:5173`

#### Build for Production

```bash
npm run build
```

Built files will be in the `dist/` directory.

#### Running Tests

```bash
# Run tests in watch mode
npm run test:watch

# Run tests once
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### 🎯 How to Play

1. **Character Selection** - Choose your character at the home screen. Each character has unique stats and starting weapons
2. **Map Selection** - Select a chapter/map to begin your journey
3. **Survive** - Move with WASD or Arrow keys, automatically attack nearby enemies
4. **Level Up** - Gain experience from defeated enemies, level up to choose new weapons or upgrades
5. **Collect Rewards** - Every 10 kills, select from powerful elixirs or new weapons
6. **Permanent Progress** - Use collected gold in the Shop to purchase permanent upgrades

### 🏗️ Tech Stack

- **Game Engine**: [Phaser.js 3.90](https://phaser.io/) - HTML5 game framework
- **Frontend Framework**: [React 19](https://react.dev/) - UI components
- **Build Tool**: [Vite 7](https://vitejs.dev/) - Fast development and builds
- **State Management**: [Zustand 5](https://github.com/pmndrs/zustand) - Lightweight state management
- **Language**: TypeScript - Type-safe development
- **i18n**: [react-i18next](https://react.i18next.com/) - Internationalization

### 🎨 Game Systems

#### Character System

- 24 unlockable characters across 6 chapters
- Each character has unique base stats: health, speed, damage, armor, luck
- Characters unlock by completing specific chapters

#### Weapon System

- 15 different weapons with unique mechanics
- Weapons can be upgraded up to level 5
- Each upgrade improves damage, projectile count, or special effects

#### Elixir System

- 10 types of elixirs with different effects
- Health restoration, stat boosts, and special abilities
- Resurrection Pill grants a one-time revival

#### Progression System

- Temporary progression: Level up during runs to gain power
- Permanent progression: Spend gold on lasting upgrades between runs
- Unlock new characters and weapons by completing chapters

### 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### 🙏 Acknowledgments

- Inspired by _Black Myth: Wukong_, _Vampire Survivors_
