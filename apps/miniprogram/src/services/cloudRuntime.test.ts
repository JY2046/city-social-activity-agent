import { describe, expect, it, vi } from "vitest";

import { initCloudRuntime } from "./cloudRuntime";

describe("cloud runtime", () => {
  it("skips cloud init when no environment id is configured", () => {
    const init = vi.fn();

    expect(initCloudRuntime({ cloud: { init } }, "")).toEqual({
      initialized: false,
      reason: "missing_env_id",
    });
    expect(init).not.toHaveBeenCalled();
  });

  it("initializes WeChat cloud runtime when an environment id is configured", () => {
    const init = vi.fn();

    expect(initCloudRuntime({ cloud: { init } }, "prod-env")).toEqual({
      initialized: true,
      reason: "initialized",
    });
    expect(init).toHaveBeenCalledWith({
      env: "prod-env",
      traceUser: true,
    });
  });

  it("initializes native wx.cloud runtime when available", () => {
    const init = vi.fn();

    expect(initCloudRuntime({ wx: { cloud: { init } } }, "prod-env")).toEqual({
      initialized: true,
      reason: "initialized",
    });
    expect(init).toHaveBeenCalledWith({
      env: "prod-env",
      traceUser: true,
    });
  });

  it("skips cloud init outside the WeChat cloud runtime", () => {
    expect(initCloudRuntime({}, "prod-env")).toEqual({
      initialized: false,
      reason: "cloud_unavailable",
    });
  });
});
