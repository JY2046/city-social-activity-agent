import type { createCloudHandlers, CloudFunctionEnvelope, CloudRequestContext } from "./cloudHandlers";

export type CloudHandlers = ReturnType<typeof createCloudHandlers>;
export type CloudFunctionName = keyof CloudHandlers;

export function createCloudFunctionDispatcher(handlers: CloudHandlers) {
  return async function dispatch(
    name: string,
    data: unknown,
    context: CloudRequestContext,
  ): Promise<CloudFunctionEnvelope<unknown> | CloudFunctionEnvelope<null>> {
    const handler = handlers[name as CloudFunctionName];

    if (!handler) {
      return {
        ok: false,
        code: "FUNCTION_NOT_FOUND",
        message: "Cloud function not found",
        data: null,
      };
    }

    try {
      return await handler(data as never, context);
    } catch (error) {
      console.error("Cloud function execution failed", error);

      return {
        ok: false,
        code: "INTERNAL_ERROR",
        message: "Cloud function execution failed",
        data: null,
      };
    }
  };
}
