import { Image, Text, View } from "@tarojs/components";

import type { ActivityGalleryItem } from "@city-social/domain";

import "./DetailGallery.css";

interface DetailGalleryProps {
  items: ActivityGalleryItem[];
}

export default function DetailGallery({ items }: DetailGalleryProps) {
  return (
    <View className="detail-gallery">
      {items.map((item) => (
        <View className="gallery-item" key={item.imagePath}>
          <Image className="gallery-image" src={item.imagePath} mode="aspectFill" />
          <Text className="gallery-label">{item.sourceLabel}</Text>
        </View>
      ))}
    </View>
  );
}
