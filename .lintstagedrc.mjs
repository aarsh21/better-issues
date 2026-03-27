import path from "node:path";

const GENERATED_PATTERNS = [
  "convex/_generated",
  "convex/betterAuth/_generated",
  "src/routeTree.gen.ts",
];

const ESLINT_EXTENSIONS = /\.(?:[cm]?[jt]sx?|svelte)$/;
const SVELTE_MIGRATION_ROOT = path.resolve("svelte-migration");

const quoteFile = (file) => JSON.stringify(file);
const isSvelteMigrationFile = (file) =>
  path.resolve(file).startsWith(`${SVELTE_MIGRATION_ROOT}${path.sep}`);
const toSvelteMigrationRelativePath = (file) =>
  JSON.stringify(path.relative(SVELTE_MIGRATION_ROOT, path.resolve(file)));

export default {
  "*": (files) => {
    const filtered = files.filter(
      (file) => !GENERATED_PATTERNS.some((pattern) => file.includes(pattern)),
    );

    if (filtered.length === 0) {
      return [];
    }

    const commands = [];
    const rootFiles = filtered.filter((file) => !isSvelteMigrationFile(file));
    const svelteMigrationFiles = filtered.filter((file) =>
      isSvelteMigrationFile(file),
    );
    const rootEslintFiles = rootFiles.filter((file) =>
      ESLINT_EXTENSIONS.test(file),
    );
    const svelteMigrationEslintFiles = svelteMigrationFiles.filter((file) =>
      ESLINT_EXTENSIONS.test(file),
    );

    if (rootEslintFiles.length > 0) {
      commands.push(`eslint --fix ${rootEslintFiles.map(quoteFile).join(" ")}`);
    }

    if (rootFiles.length > 0) {
      commands.push(
        `prettier --write --ignore-unknown ${rootFiles.map(quoteFile).join(" ")}`,
      );
    }

    if (svelteMigrationEslintFiles.length > 0) {
      commands.push(
        `bun --cwd svelte-migration eslint --fix ${svelteMigrationEslintFiles
          .map(toSvelteMigrationRelativePath)
          .join(" ")}`,
      );
    }

    if (svelteMigrationFiles.length > 0) {
      commands.push(
        `bun --cwd svelte-migration prettier --write --ignore-unknown ${svelteMigrationFiles
          .map(toSvelteMigrationRelativePath)
          .join(" ")}`,
      );
    }

    return commands;
  },
};
