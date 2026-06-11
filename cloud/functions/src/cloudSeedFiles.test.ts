import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const seedDir = resolve("cloud/seed");

function readSeedFile(name: string): unknown[] {
  const parsed = JSON.parse(readFileSync(resolve(seedDir, `${name}.json`), "utf8"));

  if (!Array.isArray(parsed)) {
    throw new Error(`Seed file ${name}.json must contain a JSON array`);
  }

  return parsed;
}

function readSeedLinesFile(name: string): unknown[] {
  const lines = readFileSync(resolve(seedDir, `${name}.jsonl`), "utf8").trim().split("\n");

  return lines.map((line) => JSON.parse(line));
}

describe("cloud seed JSON files", () => {
  it("contains importable seed files for the first cloud collections", () => {
    const users = readSeedFile("users");
    const activities = readSeedFile("activities");
    const registrations = readSeedFile("registrations");
    const settlements = readSeedFile("settlements");
    const waitlists = readSeedFile("waitlists");

    expect(users).toEqual(expect.arrayContaining([expect.objectContaining({ _id: "u-current" })]));
    expect(activities).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          _id: "a-sushi",
          city: "上海",
          reviewStatus: "approved",
          coverImagePath: "/assets/images/activity-sushi.jpg",
        }),
      ]),
    );
    expect(registrations.length).toBeGreaterThan(0);
    expect(registrations.every((item) => typeof (item as { _id?: unknown })._id === "string")).toBe(true);
    expect(settlements).toEqual(expect.arrayContaining([expect.objectContaining({ _id: "a-coffee" })]));
    expect(waitlists).toEqual([]);
  });

  it("also writes JSON Lines files for WeChat cloud database imports", () => {
    const activities = readSeedFile("activities");
    const activityLines = readSeedLinesFile("activities");
    const topicCardLines = readSeedLinesFile("topicCards");

    expect(activityLines).toHaveLength(activities.length);
    expect(activityLines[0]).toEqual(activities[0]);
    expect(topicCardLines).toEqual(expect.arrayContaining([expect.objectContaining({ _id: "topic-a-sushi" })]));
  });
});
