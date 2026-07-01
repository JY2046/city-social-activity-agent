import type { ActivityType, TopicCard } from "@city-social/domain";

export interface TopicDeckActivity {
  id: string;
  title: string;
  type: ActivityType;
  area?: string;
  city?: string;
}

export interface TopicDeck {
  current: TopicCard;
  currentIndex: number;
  options: TopicCard[];
  history: TopicCard[];
}

function getCityLabel(activity: TopicDeckActivity): string {
  return activity.city ?? activity.area ?? "这座城市";
}

function buildGeneratedTopics(activity: TopicDeckActivity): TopicCard[] {
  const cityLabel = getCityLabel(activity);
  const toneByType: Record<ActivityType, string> = {
    dinner: "如果今晚这顿饭只能用一道菜打开话题，你会想点什么？",
    coffee: "如果给新朋友推荐一家周末适合发呆的咖啡馆，你会推荐哪里？",
    bar: "你最近一次觉得刚刚好的微醺时刻，是在什么地方？",
    walk: "如果把一段路推荐给第一次来这座城市的人，你会选哪一段？",
  };

  return [
    {
      id: `topic-${activity.id}-city`,
      activityId: activity.id,
      visibleText: `如果只能把${cityLabel}一个下班后最放松的地方推荐给新朋友，你会选哪里？`,
    },
    {
      id: `topic-${activity.id}-type`,
      activityId: activity.id,
      visibleText: toneByType[activity.type],
    },
    {
      id: `topic-${activity.id}-memory`,
      activityId: activity.id,
      visibleText: `这场「${activity.title}」结束后，你希望带走一个怎样的小瞬间？`,
    },
  ];
}

export function createTopicDeck(activity: TopicDeckActivity, baseTopic?: TopicCard): TopicDeck {
  const cityLabel = getCityLabel(activity);
  const fallbackTopic: TopicCard = {
    id: `topic-${activity.id}-base`,
    activityId: activity.id,
    visibleText: `如果让你给${cityLabel}的新朋友安排一个轻松小局，你会怎么开场？`,
  };
  const current = baseTopic ?? fallbackTopic;
  const generated = buildGeneratedTopics(activity).filter((topic) => topic.visibleText !== current.visibleText);
  const options = [current, ...generated];

  return {
    current,
    currentIndex: 0,
    options,
    history: [current],
  };
}

export function rotateTopicDeck(deck: TopicDeck): TopicDeck {
  const currentIndex = (deck.currentIndex + 1) % deck.options.length;
  const current = deck.options[currentIndex];
  const history = deck.history.some((topic) => topic.id === current.id) ? deck.history : [...deck.history, current];

  return {
    ...deck,
    current,
    currentIndex,
    history,
  };
}

export function selectTopicFromHistory(deck: TopicDeck, topicId: string): TopicDeck {
  const currentIndex = deck.options.findIndex((topic) => topic.id === topicId);

  if (currentIndex < 0) {
    return deck;
  }

  return {
    ...deck,
    current: deck.options[currentIndex],
    currentIndex,
  };
}
