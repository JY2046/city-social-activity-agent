import { defineConfig, type UserConfigExport } from "@tarojs/cli";

function readTemplateIds(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default defineConfig<"webpack5">(async () => {
  const config: UserConfigExport<"webpack5"> = {
    projectName: "kaige-xiaoju",
    date: "2026-06-09",
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      828: 1.81 / 2,
    },
    sourceRoot: "src",
    outputRoot: "dist",
    plugins: [],
    defineConstants: {
      __CITY_SOCIAL_DATA_SOURCE__: JSON.stringify(process.env.CITY_SOCIAL_DATA_SOURCE ?? "mock"),
      __WECHAT_CLOUD_ENV_ID__: JSON.stringify(process.env.WECHAT_CLOUD_ENV_ID ?? ""),
      __WECHAT_SUBSCRIPTION_TEMPLATE_IDS__: JSON.stringify({
        signup: readTemplateIds(process.env.WECHAT_TEMPLATE_SIGNUP_IDS),
        waitlist: readTemplateIds(process.env.WECHAT_TEMPLATE_WAITLIST_IDS),
        juZhang: readTemplateIds(process.env.WECHAT_TEMPLATE_JUZHANG_IDS),
        feedback: readTemplateIds(process.env.WECHAT_TEMPLATE_FEEDBACK_IDS),
      }),
    },
    copy: {
      patterns: [
        {
          from: "src/assets/images",
          to: "dist/assets/images",
        },
      ],
      options: {},
    },
    framework: "react",
    compiler: "webpack5",
    mini: {},
    h5: {},
  };

  return config;
});
