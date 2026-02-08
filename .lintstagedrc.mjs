export default {
  "*.{js,jsx,ts,tsx,mjs,cjs,json}": (files) => {
    // Filter out generated files
    const filtered = files.filter(
      (file) =>
        !file.includes("convex/_generated") && !file.includes("convex/betterAuth/_generated"),
    );

    if (filtered.length === 0) return [];

    return ["oxlint", "oxfmt --write"];
  },
};
