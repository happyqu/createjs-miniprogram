const esbuild = require("esbuild");
const { rmSync } = require("node:fs");
const { execFileSync } = require("node:child_process");

const common = {
  bundle: true,
  platform: "neutral",
  target: "es2017",
  minify: true,
  legalComments: "none",
  logLevel: "info",
};

const sharedLitePlugin = {
  name: "shared-createjs-lite",
  setup(build) {
    build.onResolve({ filter: /(?:^|\/)createjs(?:\.js)?$/ }, () => ({
      path: "@happyqu/createjs-miniprogram/lite",
      external: true,
    }));
  },
};

async function bundle(entry, name, options = {}) {
  const base = { ...common, entryPoints: [entry], ...options };
  await esbuild.build({ ...base, format: "esm", outfile: `dist/${name}.mjs` });
  await esbuild.build({
    ...base,
    format: "cjs",
    outfile: `dist/${name}.js`,
    footer: { js: "module.exports=module.exports.default" },
  });
}

async function main() {
  rmSync("dist", { recursive: true, force: true });

  await bundle("src/easeljs/package.js", "index");
  await bundle("src/easeljs/lite.js", "lite");
  await bundle("src/easeljs/addons/lite-animation.js", "lite-animation", {
    plugins: [sharedLitePlugin],
  });
  await bundle("src/easeljs/addons/lite-filters.js", "lite-filters", {
    plugins: [sharedLitePlugin],
  });

  await bundle("src/tweenjs/package.js", "tweenjs", {
    external: ["@happyqu/createjs-miniprogram"],
  });

  execFileSync(process.execPath, ["scripts/copy-types.cjs"], { stdio: "inherit" });
  execFileSync(process.execPath, ["scripts/sync-example.cjs"], { stdio: "inherit" });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
