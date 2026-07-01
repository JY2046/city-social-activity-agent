import type { Activity } from "../domain/types";

interface ActivityVisual {
  imageUrl: string;
  tone: "warm" | "fresh" | "night" | "green";
}

const assetBase = import.meta.env.BASE_URL;

export const activityVisuals: Record<Activity["id"], ActivityVisual> = {
  "a-sushi": {
    imageUrl: `${assetBase}images/activity-sushi.jpg`,
    tone: "warm",
  },
  "a-coffee": {
    imageUrl: `${assetBase}images/activity-coffee.jpg`,
    tone: "fresh",
  },
  "a-bar": {
    imageUrl: `${assetBase}images/activity-bar.jpg`,
    tone: "night",
  },
  "a-walk": {
    imageUrl: `${assetBase}images/activity-walk.jpg`,
    tone: "green",
  },
};

export const defaultActivityVisual: ActivityVisual = {
  imageUrl: `${assetBase}images/activity-sushi.jpg`,
  tone: "warm",
};
