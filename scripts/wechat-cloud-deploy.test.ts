import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";

import {
  createDeployCommand,
  createDeployPlan,
  getDeployFunctionNames,
  isDirectRun,
  validateDeployPackages,
} from "./wechat-cloud-deploy.mjs";

describe("wechat cloud deploy helper", () => {
  it("lists every generated cloud function in deploy order", () => {
    expect(getDeployFunctionNames()).toEqual([
      "listActivities",
      "getActivityDetail",
      "signupActivity",
      "joinWaitlist",
      "confirmArrival",
      "confirmSettlement",
      "getJuZhangWorkspace",
      "respondJuZhangAssignment",
      "submitFeedback",
      "getFeedbackCompletionState",
    ]);
  });

  it("builds the Developer Tools CLI deploy command", () => {
    expect(
      createDeployCommand({
        cliPath: "/Applications/wechatwebdevtools.app/Contents/MacOS/cli",
        envId: "cloud1-dev",
        projectPath: "/repo/apps/miniprogram",
      }),
    ).toEqual([
      "/Applications/wechatwebdevtools.app/Contents/MacOS/cli",
      "cloud",
      "functions",
      "deploy",
      "--env",
      "cloud1-dev",
      "--project",
      "/repo/apps/miniprogram",
      "--remote-npm-install",
      "--names",
      "listActivities",
      "getActivityDetail",
      "signupActivity",
      "joinWaitlist",
      "confirmArrival",
      "confirmSettlement",
      "getJuZhangWorkspace",
      "respondJuZhangAssignment",
      "submitFeedback",
      "getFeedbackCompletionState",
    ]);
  });

  it("requires an environment id before creating an executable plan", () => {
    expect(() => createDeployPlan({ envId: "" })).toThrow("WECHAT_CLOUD_ENV_ID is required");
  });

  it("recognizes direct execution even when argv uses a relative path", () => {
    expect(isDirectRun("file:///repo/scripts/wechat-cloud-deploy.mjs", "scripts/wechat-cloud-deploy.mjs", "/repo")).toBe(
      true,
    );
  });

  it("fails fast when a deploy package is missing required files", async () => {
    const root = await mkdtemp(join(tmpdir(), "wechat-cloud-deploy-"));
    const functionDir = join(root, "listActivities");
    await mkdir(functionDir);
    await writeFile(join(functionDir, "index.js"), "exports.main = async () => ({});\n");
    await writeFile(join(functionDir, "package.json"), "{\"dependencies\":{\"wx-server-sdk\":\"latest\"}}\n");

    await expect(validateDeployPackages(root, ["listActivities"])).rejects.toThrow(
      "listActivities is missing runtime.js",
    );
  });
});
