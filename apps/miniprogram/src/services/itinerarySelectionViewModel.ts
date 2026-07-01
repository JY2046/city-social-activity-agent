export interface ItinerarySelectionTransition {
  selectedActivityId: string;
  shouldClearDetailState: boolean;
  shouldClearActionMessage: boolean;
}

export function createItinerarySelectionTransition(activityId: string): ItinerarySelectionTransition {
  return {
    selectedActivityId: activityId,
    shouldClearDetailState: true,
    shouldClearActionMessage: true,
  };
}
