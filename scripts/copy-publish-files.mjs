import { copyFile, mkdir } from "node:fs/promises";

await mkdir("dist", { recursive: true });
await copyFile("manifest.json", "dist/manifest.json");
await copyFile("icon.svg", "dist/icon.svg");
