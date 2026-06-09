export default defineAppConfig({
  pages: [
    "pages/discover/index",
    "pages/activity-detail/index",
    "pages/signup/index",
    "pages/itinerary/index",
    "pages/juzhang/index",
    "pages/waitlist/index",
    "pages/feedback/index",
    "pages/profile/index",
  ],
  window: {
    backgroundTextStyle: "light",
    navigationBarBackgroundColor: "#f7f4ec",
    navigationBarTitleText: "先活动，后关系",
    navigationBarTextStyle: "black",
  },
  tabBar: {
    color: "#8d918e",
    selectedColor: "#24452f",
    backgroundColor: "#fbfaf6",
    borderStyle: "white",
    list: [
      {
        pagePath: "pages/discover/index",
        text: "发现",
      },
      {
        pagePath: "pages/itinerary/index",
        text: "行程",
      },
      {
        pagePath: "pages/juzhang/index",
        text: "局长",
      },
      {
        pagePath: "pages/profile/index",
        text: "我的",
      },
    ],
  },
});
