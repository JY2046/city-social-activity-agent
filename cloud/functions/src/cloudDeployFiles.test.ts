import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const deployRoot = resolve("cloud/functions/deploy");
const miniProgramCloudfunctionRoot = resolve("apps/miniprogram/cloudfunctions");
const functionNames = [
  "listActivities",
  "getActivityDetail",
  "listMyRegistrations",
  "signupActivity",
  "cancelRegistration",
  "joinWaitlist",
  "cancelWaitlist",
  "confirmArrival",
  "confirmSettlement",
  "getJuZhangWorkspace",
  "respondJuZhangAssignment",
  "submitFeedback",
  "getFeedbackCompletionState",
];

function toPackageName(functionName: string) {
  return `kaigexiaoju-${functionName.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

describe("WeChat cloud function deploy folders", () => {
  it("contains self-contained deploy packages for the first cloud functions", () => {
    for (const root of [deployRoot, miniProgramCloudfunctionRoot]) {
      for (const functionName of functionNames) {
        const functionDir = resolve(root, functionName);
      const indexPath = resolve(functionDir, "index.js");
      const runtimePath = resolve(functionDir, "runtime.js");
      const packagePath = resolve(functionDir, "package.json");
      const configPath = resolve(functionDir, "config.json");

      expect(existsSync(indexPath), `${functionName} index.js`).toBe(true);
      expect(existsSync(runtimePath), `${functionName} runtime.js`).toBe(true);
      expect(existsSync(packagePath), `${functionName} package.json`).toBe(true);
      expect(existsSync(configPath), `${functionName} config.json`).toBe(true);

      expect(readFileSync(indexPath, "utf8")).toContain(`createMain("${functionName}")`);
      expect(JSON.parse(readFileSync(packagePath, "utf8"))).toMatchObject({
        name: toPackageName(functionName),
        main: "index.js",
        dependencies: {
          "wx-server-sdk": "latest",
        },
      });
      expect(JSON.parse(readFileSync(configPath, "utf8"))).toMatchObject({
        timeout: expect.any(Number),
      });
      expect(JSON.parse(readFileSync(configPath, "utf8")).timeout).toBeGreaterThanOrEqual(20);
      expect(readFileSync(runtimePath, "utf8")).toContain("Invalid arrival status");
      expect(readFileSync(runtimePath, "utf8")).toContain("isAcceptedJuZhang");
      expect(readFileSync(runtimePath, "utf8")).toContain("hasActiveRegistration");
      expect(readFileSync(runtimePath, "utf8")).toContain("Invalid ju zhang response");
      }
    }
  });
});
