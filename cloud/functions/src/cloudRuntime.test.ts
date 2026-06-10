import { describe, expect, it } from "vitest";

import { createCloudHandlers } from "./cloudHandlers";
import { createCloudFunctionDispatcher, type CloudHandlers } from "./cloudRuntime";
import { createInMemoryCloudStore } from "./cloudStore";

describe("cloud function runtime dispatcher", () => {
  it("dispatches named cloud functions through the shared handlers", async () => {
    const dispatch = createCloudFunctionDispatcher(createCloudHandlers(createInMemoryCloudStore()));

    await expect(dispatch("listActivities", { city: "上海" }, { userId: "u-current" })).resolves.toMatchObject({
      ok: true,
      data: expect.arrayContaining([expect.objectContaining({ id: "a-sushi" })]),
    });
  });

  it("returns a failure envelope for unsupported function names", async () => {
    const dispatch = createCloudFunctionDispatcher(createCloudHandlers(createInMemoryCloudStore()));

    await expect(dispatch("unsupportedFunction", {}, { userId: "u-current" })).resolves.toEqual({
      ok: false,
      code: "FUNCTION_NOT_FOUND",
      message: "Cloud function not found",
      data: null,
    });
  });

  it("keeps the envelope contract when a handler throws", async () => {
    const handlers = {
      ...createCloudHandlers(createInMemoryCloudStore()),
      listActivities: async () => {
        throw new Error("database unavailable");
      },
    } satisfies CloudHandlers;
    const dispatch = createCloudFunctionDispatcher(handlers);

    await expect(dispatch("listActivities", {}, { userId: "u-current" })).resolves.toEqual({
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Cloud function execution failed",
      data: null,
    });
  });
});
