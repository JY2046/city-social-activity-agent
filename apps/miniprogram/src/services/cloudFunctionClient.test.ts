import { describe, expect, it, vi } from "vitest";

import {
  CloudFunctionError,
  callCloudFunction,
  createWeChatCloudAdapter,
  getDataSourceMode,
  isCloudDataSource,
} from "./cloudFunctionClient";

describe("cloud function client", () => {
  it("returns typed data from a successful cloud function envelope", async () => {
    const adapter = {
      callFunction: vi.fn(async () => ({
        result: {
          ok: true,
          code: "OK",
          message: "ok",
          data: { activityId: "a-sushi" },
        },
      })),
    };

    await expect(callCloudFunction<{ activityId: string }>(adapter, "getActivityDetail", { activityId: "a-sushi" }))
      .resolves.toEqual({ activityId: "a-sushi" });
    expect(adapter.callFunction).toHaveBeenCalledWith({
      name: "getActivityDetail",
      data: { activityId: "a-sushi" },
    });
  });

  it("throws a typed error when the cloud function envelope is not ok", async () => {
    const adapter = {
      callFunction: vi.fn(async () => ({
        result: {
          ok: false,
          code: "ACTIVITY_NOT_FOUND",
          message: "Activity not found",
          data: null,
        },
      })),
    };

    await expect(callCloudFunction(adapter, "getActivityDetail", { activityId: "missing" })).rejects.toMatchObject({
      name: "CloudFunctionError",
      code: "ACTIVITY_NOT_FOUND",
      functionName: "getActivityDetail",
      message: "Activity not found",
    });
  });

  it("throws a typed error when the cloud adapter returns an invalid envelope", async () => {
    const adapter = {
      callFunction: vi.fn(async () => ({
        result: { unexpected: true },
      })),
    };

    await expect(callCloudFunction(adapter, "listActivities", {})).rejects.toBeInstanceOf(CloudFunctionError);
  });

  it("creates a WeChat cloud adapter that delegates to wx.cloud.callFunction", async () => {
    const callFunction = vi.fn(async () => ({
      result: {
        ok: true,
        code: "OK",
        message: "ok",
        data: ["a-sushi"],
      },
    }));
    const adapter = createWeChatCloudAdapter({ cloud: { callFunction } });

    await expect(callCloudFunction<string[]>(adapter, "listActivities", { city: "上海" })).resolves.toEqual([
      "a-sushi",
    ]);
    expect(callFunction).toHaveBeenCalledWith({ name: "listActivities", data: { city: "上海" } });
  });

  it("creates a WeChat cloud adapter from native wx.cloud", async () => {
    const callFunction = vi.fn(async () => ({
      result: {
        ok: true,
        code: "OK",
        message: "ok",
        data: { id: "a-sushi" },
      },
    }));
    const adapter = createWeChatCloudAdapter({ wx: { cloud: { callFunction } } });

    await expect(callCloudFunction<{ id: string }>(adapter, "getActivityDetail", { activityId: "a-sushi" })).resolves
      .toEqual({ id: "a-sushi" });
    expect(callFunction).toHaveBeenCalledWith({ name: "getActivityDetail", data: { activityId: "a-sushi" } });
  });

  it("keeps mock data as the default source until cloud mode is explicitly enabled", () => {
    expect(getDataSourceMode()).toBe("mock");
    expect(getDataSourceMode("cloud")).toBe("cloud");
    expect(getDataSourceMode("something-else")).toBe("mock");
    expect(isCloudDataSource("cloud")).toBe(true);
    expect(isCloudDataSource("mock")).toBe(false);
  });
});
