declare module '*.yaml' {
  const value: unknown;
  export default value;
}

/** The project's root directory, with a trailing slash (astro.config.mjs). */
declare const __PROJECT_ROOT__: string;
