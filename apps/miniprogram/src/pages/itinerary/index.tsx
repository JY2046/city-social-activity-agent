import { Text, View } from "@tarojs/components";
import { useCallback, useMemo, useState } from "react";
import { navigateTo, useDidShow } from "@tarojs/taro";
import type { Registration } from "@city-social/domain";

import { formatActivityDateTime } from "../../services/activityPresentation";
import { buildItineraryDetailUrl } from "../../services/activityRouteService";
import { createItinerarySelectionTransition } from "../../services/itinerarySelectionViewModel";
import { getItineraryListState } from "../../services/itineraryPageViewModels";
import {
  createUserActivityReadAdapter,
  loadMyActivityFeed,
  type UserActivityItem,
} from "../../services/userActivityService";

import "../signup/index.css";
import "./index.css";

function getRegistrationStatusLabel(registration: Registration): string {
  if (registration.status === "waitlisted") {
    return "排队中";
  }

  if (registration.status === "arrived") {
    return "已到场";
  }

  if (registration.status === "noShow") {
    return "无法到场";
  }

  return "已报名";
}

export default function ItineraryPage() {
  const userActivityReadAdapter = useMemo(() => createUserActivityReadAdapter(), []);
  const [myItems, setMyItems] = useState<UserActivityItem[]>([]);
  const [actionMessage, setActionMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const listState = getItineraryListState(isLoading, myItems);

  const refreshMyItems = useCallback(async () => {
    setIsLoading(true);
    const result = await loadMyActivityFeed(userActivityReadAdapter);
    setIsLoading(false);

    if (result.status === "ready") {
      setMyItems(result.items);
      setActionMessage("");
      return;
    }

    if (result.status === "empty") {
      setMyItems([]);
      setActionMessage("");
      return;
    }

    setMyItems([]);
    setActionMessage(result.message);
  }, [userActivityReadAdapter]);

  useDidShow(() => {
    void refreshMyItems();
  });

  function handleSelectItineraryActivity(activityId: string) {
    const transition = createItinerarySelectionTransition(activityId);

    if (transition.shouldClearActionMessage) {
      setActionMessage("");
    }

    void navigateTo({ url: buildItineraryDetailUrl(transition.selectedActivityId) });
  }

  return (
    <View className="flow-page">
      <Text className="flow-eyebrow">我的行程</Text>
      <Text className="flow-title">已报名的小局</Text>

      {listState.mode === "ready" ? (
        myItems.map((item) => (
          <View
            className="flow-card itinerary-list-card"
            key={item.registration.id}
            onClick={() => handleSelectItineraryActivity(item.activity.id)}
          >
            <Text className="card-title">{item.activity.title}</Text>
            <Text className="card-copy">
              {formatActivityDateTime(item.activity.startsAt)} · {item.activity.area}
            </Text>
            <Text className="card-copy">
              {item.activity.venue} · {getRegistrationStatusLabel(item.registration)}
            </Text>
            <Text className="outline-button itinerary-select-action">查看行程</Text>
          </View>
        ))
      ) : (
        <View className="flow-card">
          <Text className="card-title">{listState.title}</Text>
          <Text className="card-copy">{listState.copy}</Text>
        </View>
      )}

      {actionMessage ? <Text className="flow-message">{actionMessage}</Text> : null}
    </View>
  );
}
