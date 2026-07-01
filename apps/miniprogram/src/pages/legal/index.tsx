import { Text, View } from "@tarojs/components";
import { useRouter } from "@tarojs/taro";

import { getLegalContent } from "../../services/legalContent";

import "../signup/index.css";
import "./index.css";

export default function LegalPage() {
  const router = useRouter();
  const content = getLegalContent(typeof router.params.type === "string" ? router.params.type : undefined);

  return (
    <View className="flow-page legal-page">
      <Text className="flow-eyebrow">开个小局</Text>
      <Text className="flow-title">{content.title}</Text>
      <View className="flow-card">
        {content.paragraphs.map((paragraph) => (
          <Text className="legal-copy" key={paragraph}>
            {paragraph}
          </Text>
        ))}
      </View>
    </View>
  );
}
