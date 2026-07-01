export type LegalContentType = "user-agreement" | "privacy-policy";

export interface LegalContent {
  title: string;
  paragraphs: string[];
}

const legalContentByType: Record<LegalContentType, LegalContent> = {
  "user-agreement": {
    title: "用户协议",
    paragraphs: [
      "开个小局提供同城轻活动发现、报名、候补、行程和活动后反馈互选服务。用户应真实、友善、守时地参与活动。",
      "用户不得发布违法、骚扰、欺诈、营销或侵犯他人权益的内容，不得在活动前绕过平台索取联系方式。",
      "活动前不开放私信和联系方式。活动后双方互选成功后，平台才会开放联系入口。",
      "普通参与者临近活动退出、爽约或恶意扰乱活动，可能影响内部信用状态；局长接受后临近退出会触发替换流程。",
    ],
  },
  "privacy-policy": {
    title: "隐私政策",
    paragraphs: [
      "平台会为登录、报名、行程、局长协助、AA 确认、反馈互选等功能收集必要信息，包括 OpenID、昵称头像、城市选择、报名状态和活动反馈。",
      "城市选择仅用于活动推荐，不展示用户精确实时位置。信用分不对外展示，仅展示等级。",
      "活动前不开放联系方式，活动后仅双方互选才开放联系。用户可选择是否展示参加过的小局场次。",
      "平台不会主动申请通讯录、麦克风、相册等与当前功能无关的敏感权限。后续如新增权限，会在隐私保护指引中说明用途。",
    ],
  },
};

export function getLegalContent(type: string | undefined): LegalContent {
  return legalContentByType[type === "privacy-policy" ? "privacy-policy" : "user-agreement"];
}
