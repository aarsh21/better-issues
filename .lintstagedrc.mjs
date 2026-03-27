const GENERATED_PATTERNS = [
  "convex/_generated",
  "convex/betterAuth/_generated",
  "src/routeTree.gen.ts",
];

const ESLINT_EXTENSIONS = /\.(?:[cm]?[jt]sx?|svelte)$/;

const quoteFile = (file) => JSON.stringify(file);

export default {
  "*": (files) => {
    const filtered = files.filter(
      (file) => !GENERATED_PATTERNS.some((pattern) => file.includes(pattern)),
    );

    if (filtered.length === 0) {
      return [];
    }

    const commands = [];
    const eslintFiles = filtered.filter((file) => ESLINT_EXTENSIONS.test(file));

    if (eslintFiles.length > 0) {
      commands.push(`eslint --fix ${eslintFiles.map(quoteFile).join(" ")}`);
    }

    commands.push(
      `prettier --write --ignore-unknown ${filtered.map(quoteFile).join(" ")}`,
    );

    return commands;
  },
};
