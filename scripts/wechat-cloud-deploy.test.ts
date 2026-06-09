import { describe, expect, it } from "vitest";

import {
  createDeployCommand,
  createDeployPlan,
  getDeployFunctionNames,
  isDirectRun,
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
});
