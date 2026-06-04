import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";

afterEach(() => {
  cleanup();
});

describe("App discovery flow", () => {
  it("opens an activity detail page from the feed", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "查看 周五下班日料小局" }));

    expect(screen.getByRole("heading", { name: "周五下班日料小局" })).toBeInTheDocument();
    expect(screen.getByText("活动前不开放私信和联系方式，活动后双方互选才开放联系。")).toBeInTheDocument();
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

  it("opens itinerary bridge placeholders", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "查看 周五下班日料小局" }));
    await userEvent.click(screen.getByRole("button", { name: "报名并确认规则" }));
    await userEvent.click(screen.getByRole("button", { name: "确认报名" }));
    await userEvent.click(screen.getByRole("button", { name: "查看局长任务" }));

    expect(screen.getByRole("heading", { name: "局长任务即将接入" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "返回行程" }));
    await userEvent.click(screen.getByRole("button", { name: "模拟活动结束" }));

    expect(screen.getByRole("heading", { name: "活动反馈即将接入" })).toBeInTheDocument();
  });
});
