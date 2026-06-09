import { describe, expect, it } from "vitest";

import { createCloudHandlers } from "./cloudHandlers";
import { createCloudFunctionDispatcher } from "./cloudRuntime";
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
});
