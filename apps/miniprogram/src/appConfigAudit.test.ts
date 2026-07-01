import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const imageAssetDir = resolve("apps/miniprogram/src/assets/images");
const maxImageAudioAssetBytes = 200 * 1024;

describe("mini program code package audit settings", () => {
  it("enables required component lazy loading", () => {
    const appConfigSource = readFileSync(resolve("apps/miniprogram/src/app.config.ts"), "utf8");

    expect(appConfigSource).toContain('lazyCodeLoading: "requiredComponents"');
  });

  it("keeps local image resources below the 200K audit threshold", () => {
    const imageFiles = readdirSync(imageAssetDir).filter((fileName) => /\.(jpe?g|png|gif|webp)$/i.test(fileName));
    const totalBytes = imageFiles.reduce((sum, fileName) => sum + statSync(resolve(imageAssetDir, fileName)).size, 0);

    expect(totalBytes).toBeLessThanOrEqual(maxImageAudioAssetBytes);
    for (const fileName of imageFiles) {
      expect(statSync(resolve(imageAssetDir, fileName)).size).toBeLessThanOrEqual(maxImageAudioAssetBytes);
    }
  });
});
