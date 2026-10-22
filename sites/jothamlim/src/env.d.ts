interface ImportMetaEnv {
  /** The site's folder (sites/<site>/), from garden/config.mjs (`vite.define`); unset outside Vite. */
  readonly PROJECT_ROOT?: string;
  /** The garden/ folder, from garden/config.mjs; unset outside Vite. */
  readonly GARDEN_ROOT?: string;
}
