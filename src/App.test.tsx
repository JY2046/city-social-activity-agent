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

  it("shows a temporary signup placeholder from activity detail", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "查看 周五下班日料小局" }));
    await userEvent.click(screen.getByRole("button", { name: "报名并确认规则" }));

    expect(screen.getByRole("heading", { name: "报名确认即将接入" })).toBeInTheDocument();
    expect(screen.getByText("Task 5 会在这里接入完整报名面板。")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
});
