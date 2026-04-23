import { ensureSeedData } from "@/lib/menuverse-data";

export async function runSeed() {
  await ensureSeedData();
}
