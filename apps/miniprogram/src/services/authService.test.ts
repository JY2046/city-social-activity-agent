import { describe, expect, it } from "vitest";

import { loginWithWeChat } from "./authService";

describe("auth service", () => {
  it("exchanges a WeChat login code for a server-issued user identity", async () => {
    const session = await loginWithWeChat({
      login: async () => ({ code: "wx-login-code" }),
      exchangeCode: async (code) => ({
        userId: "u-current",
        token: `server-token-for-${code}`,
        profile: {
          nickname: "Lily",
          avatarUrl: "",
          city: "上海",
        },
      }),
    });

    expect(session).toEqual({
      userId: "u-current",
      token: "server-token-for-wx-login-code",
      profile: {
        nickname: "Lily",
        avatarUrl: "",
        city: "上海",
      },
    });
  });

  it("surfaces a useful error when WeChat login does not return a code", async () => {
    await expect(
      loginWithWeChat({
        login: async () => ({}),
        exchangeCode: async () => {
          throw new Error("should not exchange empty code");
        },
      }),
    ).rejects.toThrow("WeChat login did not return a code");
  });
});
