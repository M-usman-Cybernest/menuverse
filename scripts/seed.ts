import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());

async function main() {
  const { runSeed } = await import("../src/lib/seed");

  await runSeed();
  console.log("MenuVerse seed complete.");
  process.exit(0);
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
