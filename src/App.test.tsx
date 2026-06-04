import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App discovery flow", () => {
  it("opens an activity detail page from the feed", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "查看 周五下班日料小局" }));

    expect(screen.getByRole("heading", { name: "周五下班日料小局" })).toBeInTheDocument();
    expect(screen.getByText("活动前不开放私信和联系方式，活动后双方互选才开放联系。")).toBeInTheDocument();
  });
});
