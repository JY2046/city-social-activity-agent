import { defineConfig, type UserConfigExport } from "@tarojs/cli";

export default defineConfig<"webpack5">(async () => {
  const config: UserConfigExport<"webpack5"> = {
    projectName: "city-social-activity-agent",
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
    defineConstants: {},
    copy: {
      patterns: [],
      options: {},
    },
    framework: "react",
    compiler: "webpack5",
    mini: {},
    h5: {},
  };

  return config;
});
