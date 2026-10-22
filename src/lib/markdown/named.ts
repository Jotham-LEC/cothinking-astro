// A plugin's transform that names itself when it fails: `[rehype-callouts]
// src/content/essays/x.md: …`, so a build error says which plugin and which
// file instead of only what went wrong.
export function named<T>(plugin: string, transform: (tree: T) => void) {
  return (tree: T, file?: { path?: string }) => {
    try {
      transform(tree);
    } catch (error) {
      const where = file?.path ? ` ${file.path}` : '';
      throw new Error(`[${plugin}]${where}: ${error instanceof Error ? error.message : String(error)}`, {
        cause: error,
      });
    }
  };
}
