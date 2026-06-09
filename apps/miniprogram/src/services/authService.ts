export interface WeChatLoginResult {
  code?: string;
}

export interface UserSession {
  userId: string;
  token: string;
  profile: {
    nickname: string;
    avatarUrl: string;
    city: string;
  };
}

export interface AuthAdapter {
  login: () => Promise<WeChatLoginResult>;
  exchangeCode: (code: string) => Promise<UserSession>;
}

export async function loginWithWeChat(adapter: AuthAdapter): Promise<UserSession> {
  const loginResult = await adapter.login();

  if (!loginResult.code) {
    throw new Error("WeChat login did not return a code");
  }

  return adapter.exchangeCode(loginResult.code);
}
