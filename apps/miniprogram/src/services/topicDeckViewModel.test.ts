import { describe, expect, it } from "vitest";

import type { TopicCard } from "@city-social/domain";

import { createTopicDeck, rotateTopicDeck } from "./topicDeckViewModel";

describe("topic deck view model", () => {
  const activity = {
    id: "a-sushi",
    title: "周五下班日料小局",
    city: "上海",
    type: "dinner",
  };
  const baseTopic: TopicCard = {
    id: "topic-a-sushi",
    activityId: "a-sushi",
    visibleText: "如果只能把上海一个下班后最放松的地方推荐给新朋友，你会选哪里？",
  };

  it("creates a topic deck with generated alternates and history", () => {
    const deck = createTopicDeck(activity, baseTopic);

    expect(deck.current.visibleText).toContain("上海");
    expect(deck.history).toHaveLength(1);
    expect(deck.options.length).toBeGreaterThan(2);
  });

  it("rotates to the next topic and keeps previous cards in history", () => {
    const deck = createTopicDeck(activity, baseTopic);
    const nextDeck = rotateTopicDeck(deck);

    expect(nextDeck.current.id).not.toBe(deck.current.id);
    expect(nextDeck.history.map((topic) => topic.id)).toEqual([baseTopic.id, nextDeck.current.id]);
  });
});
