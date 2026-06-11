import { describe, expect, it } from "vitest";

import { getLegalContent } from "./legalContent";

describe("legal content", () => {
  it("returns user agreement copy", () => {
    const content = getLegalContent("user-agreement");

    expect(content.title).toBe("用户协议");
    expect(content.paragraphs.join("")).toContain("活动前绕过平台索取联系方式");
  });

  it("returns privacy policy copy", () => {
    const content = getLegalContent("privacy-policy");

    expect(content.title).toBe("隐私政策");
    expect(content.paragraphs.join("")).toContain("活动后仅双方互选才开放联系");
  });
});
