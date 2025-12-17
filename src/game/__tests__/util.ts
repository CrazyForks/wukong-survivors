export const MOCK_SCENE: any = {
  getPlayerPosition: vi.fn().mockReturnValue({ x: 100, y: 200 }),
  physics: {
    world: {
      setBounds: vi.fn(),
    },
    add: {
      sprite: vi.fn().mockReturnValue({
        setDisplaySize: vi.fn().mockReturnThis(),
        body: { setSize: vi.fn() },
        setVelocity: vi.fn(),
        setTint: vi.fn().mockReturnThis(),
        alpha: 1,
        scale: 1,
        x: 100,
        y: 100,
        destroy: vi.fn(),
      }),
    },
  },
  add: {
    image: vi.fn().mockReturnValue({
      setOrigin: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
    }),
    rectangle: vi.fn().mockReturnValue({
      setScrollFactor: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setStrokeStyle: vi.fn().mockReturnThis(),
      setFillStyle: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
    }),
    text: vi.fn().mockReturnValue({
      setScrollFactor: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setOrigin: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
    }),
    container: vi.fn().mockReturnValue({
      setScrollFactor: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setOrigin: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
    }),
    group: vi.fn().mockReturnValue({
      setScrollFactor: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setOrigin: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
    }),
  },
  cameras: {
    main: {
      setBounds: vi.fn(),
      setZoom: vi.fn(),
      height: 800,
      width: 600,
      startFollow: vi.fn(),
    },
  },
  input: {
    keyboard: {
      createCursorKeys: vi.fn().mockReturnValue({}),
      addKey: vi.fn().mockReturnThis(),
    },
  },
  load: {
    svg: vi.fn(),
    audio: vi.fn(),
  },
  time: {
    delayedCall: vi.fn((_delay, callback) => callback()),
  },
  scale: {
    on: vi.fn(),
  },
  sys: {
    game: {
      device: {
        input: {
          touch: false,
        },
      },
    },
  },
  tweens: {
    add: vi.fn().mockImplementation((config) => {
      if (config.onComplete) {
        config.onComplete();
      }
      return { play: vi.fn() };
    }),
  },
  textures: {
    exists: vi.fn(),
  },
};
