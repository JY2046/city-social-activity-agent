import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("App discovery flow", () => {
  it("renders the mobile app navigation and product cues", () => {
    render(<App />);

    expect(screen.getByLabelText("主要导航")).toBeInTheDocument();
    expect(screen.getByText("活动前不开放")).toBeInTheDocument();
    expect(screen.getByText("活动后互选")).toBeInTheDocument();
    expect(screen.getByText("局长")).toBeInTheDocument();
  });

  it("opens an activity detail page from the feed", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "查看 周五下班日料小局" }));

    expect(screen.getByRole("heading", { name: "周五下班日料小局" })).toBeInTheDocument();
    expect(screen.getByText("活动前不开放私信和联系方式，活动后双方互选才开放联系。")).toBeInTheDocument();
  });

  it("returns to the top when opening a new screen", async () => {
    const scrollSpy = vi.mocked(window.scrollTo);
    render(<App />);
    scrollSpy.mockClear();

    await userEvent.click(screen.getByRole("button", { name: "查看 周五下班日料小局" }));

    await waitFor(() => expect(scrollSpy).toHaveBeenCalledWith({ left: 0, top: 0 }));
  });

  it("opens a non-default activity detail page from the feed", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "查看 周末咖啡聊天局" }));

    expect(screen.getByRole("heading", { name: "周末咖啡聊天局" })).toBeInTheDocument();
    expect(screen.getByText("武康路 · 梧桐边咖啡")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

});

describe("App signup flow", () => {
  it("confirms signup rules and opens itinerary", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "查看 周五下班日料小局" }));
    await userEvent.click(screen.getByRole("button", { name: "报名并确认规则" }));
    await userEvent.click(screen.getByLabelText("我愿意担任局长"));
    await userEvent.click(screen.getByRole("button", { name: "确认报名" }));

    expect(screen.getByRole("heading", { name: "活动行程" })).toBeInTheDocument();
    expect(screen.getByText("已勾选愿意担任局长，系统会在活动前 24 小时内选择。")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("shows the unchecked JuZhang note after signup", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "查看 周五下班日料小局" }));
    await userEvent.click(screen.getByRole("button", { name: "报名并确认规则" }));
    await userEvent.click(screen.getByRole("button", { name: "确认报名" }));

    expect(screen.getByText("你没有勾选局长，仍可正常参加活动。")).toBeInTheDocument();
  });

  it("shows free activity signup fee rules", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "查看 免费城市散步局" }));
    await userEvent.click(screen.getByRole("button", { name: "报名并确认规则" }));

    expect(screen.getByText("本活动费用为 0，不需要 AA 结算。")).toBeInTheDocument();
  });

  it("shows activity-specific signup rules", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "查看 周五下班日料小局" }));
    await userEvent.click(screen.getByRole("button", { name: "报名并确认规则" }));

    expect(screen.getByText("普通参与者 12 小时内退出会影响内部信誉；局长接受后 24 小时内退出会触发替换。")).toBeInTheDocument();
    expect(screen.getByText("活动前不开放私信和联系方式，活动后双方互选才开放联系。")).toBeInTheDocument();
  });

  it("shows the activity formation status on itinerary", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "查看 周末咖啡聊天局" }));
    await userEvent.click(screen.getByRole("button", { name: "报名并确认规则" }));
    await userEvent.click(screen.getByRole("button", { name: "确认报名" }));

    expect(screen.getByText("2/5 人 · 组局中")).toBeInTheDocument();
  });

  it("opens post-activity feedback from itinerary", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "查看 周五下班日料小局" }));
    await userEvent.click(screen.getByRole("button", { name: "报名并确认规则" }));
    await userEvent.click(screen.getByRole("button", { name: "确认报名" }));
    await userEvent.click(screen.getByRole("button", { name: "模拟活动结束" }));

    expect(screen.getByRole("heading", { name: "活动反馈与互选" })).toBeInTheDocument();
    expect(screen.getByText("双方都选择后才开放联系方式。")).toBeInTheDocument();
    expect(screen.getByLabelText("异常反馈")).toBeInTheDocument();
  });
});

describe("Ju Zhang flow", () => {
  it("lets the selected user accept ju zhang tasks and see settlement", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "查看 周五下班日料小局" }));
    await userEvent.click(screen.getByRole("button", { name: "报名并确认规则" }));
    await userEvent.click(screen.getByLabelText("我愿意担任局长"));
    await userEvent.click(screen.getByRole("button", { name: "确认报名" }));
    await userEvent.click(screen.getByRole("button", { name: "查看局长任务" }));
    await userEvent.click(screen.getByRole("button", { name: "接受局长" }));

    expect(screen.getByText("如果只能把上海一个下班后最放松的地方推荐给新朋友，你会选哪里？")).toBeInTheDocument();
    expect(screen.getByText("人均 168 元")).toBeInTheDocument();
  });

  it("returns to itinerary when the selected user declines ju zhang", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "查看 周五下班日料小局" }));
    await userEvent.click(screen.getByRole("button", { name: "报名并确认规则" }));
    await userEvent.click(screen.getByRole("button", { name: "确认报名" }));
    await userEvent.click(screen.getByRole("button", { name: "查看局长任务" }));
    await userEvent.click(screen.getByRole("button", { name: "拒绝，不影响参加" }));

    expect(screen.getByRole("heading", { name: "活动行程" })).toBeInTheDocument();
    expect(screen.getByText("你没有勾选局长，仍可正常参加活动。")).toBeInTheDocument();
  });

  it("opens feedback after ju zhang tasks are completed", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "查看 周五下班日料小局" }));
    await userEvent.click(screen.getByRole("button", { name: "报名并确认规则" }));
    await userEvent.click(screen.getByRole("button", { name: "确认报名" }));
    await userEvent.click(screen.getByRole("button", { name: "查看局长任务" }));
    await userEvent.click(screen.getByRole("button", { name: "接受局长" }));
    await userEvent.click(screen.getByRole("button", { name: "完成局长任务" }));

    expect(screen.getByRole("heading", { name: "活动反馈与互选" })).toBeInTheDocument();
  });

  it("shows no-payment settlement copy for free activities", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "查看 免费城市散步局" }));
    await userEvent.click(screen.getByRole("button", { name: "报名并确认规则" }));
    await userEvent.click(screen.getByRole("button", { name: "确认报名" }));
    await userEvent.click(screen.getByRole("button", { name: "查看局长任务" }));
    await userEvent.click(screen.getByRole("button", { name: "接受局长" }));

    expect(screen.getByText("本活动无费用")).toBeInTheDocument();
    expect(screen.getByText("本活动无需确认支付状态。")).toBeInTheDocument();
  });
});

describe("feedback and mutual contact flow", () => {
  it("returns home after post-activity feedback is completed", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "查看 周五下班日料小局" }));
    await userEvent.click(screen.getByRole("button", { name: "报名并确认规则" }));
    await userEvent.click(screen.getByRole("button", { name: "确认报名" }));
    await userEvent.click(screen.getByRole("button", { name: "模拟活动结束" }));
    await userEvent.click(screen.getByLabelText("愿意和 林夏 互相开放联系"));
    await userEvent.type(screen.getByLabelText("异常反馈"), "体验顺畅，没有异常。");
    await userEvent.click(screen.getByRole("button", { name: "完成反馈" }));

    expect(screen.getByRole("heading", { name: "先活动，后关系" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "查看 周五下班日料小局" })).toBeInTheDocument();
  });
});
