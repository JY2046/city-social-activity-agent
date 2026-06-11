import { describe, expect, it } from "vitest";

import { createItinerarySelectionTransition } from "./itinerarySelectionViewModel";

describe("itinerary selection view model", () => {
  it("clears stale detail state when selecting another itinerary activity", () => {
    expect(createItinerarySelectionTransition("a-coffee")).toEqual({
      selectedActivityId: "a-coffee",
      shouldClearDetailState: true,
      shouldClearActionMessage: true,
    });
  });
});
