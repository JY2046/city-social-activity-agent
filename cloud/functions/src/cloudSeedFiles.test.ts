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
});
