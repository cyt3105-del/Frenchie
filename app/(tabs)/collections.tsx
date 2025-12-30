import { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { VocabularyItem, Collection, vocabulary } from "@/data/vocabulary";
import { cn } from "@/lib/utils";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface CollectionInfo {
  id: Collection;
  name: string;
  icon: string;
  color: string;
  count: number;
}

const COLLECTIONS: CollectionInfo[] = [
  { id: "greetings", name: "Greetings", icon: "waving-hand", color: "#3B82F6", count: 0 },
  { id: "daily-routines", name: "Daily Routines", icon: "home", color: "#059669", count: 0 },
  { id: "daily-expressions", name: "Daily Expressions", icon: "chat", color: "#EC4899", count: 0 },
  { id: "food", name: "Food & Dining", icon: "restaurant", color: "#F59E0B", count: 0 },
  { id: "beauty", name: "Beauty & Cosmetics", icon: "face", color: "#DB2777", count: 0 },
  { id: "travel", name: "Travel", icon: "flight", color: "#10B981", count: 0 },
  { id: "nature", name: "Nature", icon: "park", color: "#22C55E", count: 0 },
  { id: "conjunctions", name: "Conjunctions", icon: "link", color: "#8B5CF6", count: 0 },
  { id: "time", name: "Time", icon: "schedule", color: "#06B6D4", count: 0 },
  { id: "shopping", name: "Shopping", icon: "shopping-cart", color: "#F97316", count: 0 },
  { id: "emotions", name: "Emotions", icon: "favorite", color: "#EF4444", count: 0 },
  { id: "family", name: "Family & Friends", icon: "people", color: "#6366F1", count: 0 },
  { id: "work", name: "Work", icon: "work", color: "#14B8A6", count: 0 },
  { id: "health", name: "Health", icon: "local-hospital", color: "#F43F5E", count: 0 },
  { id: "weather", name: "Weather", icon: "wb-sunny", color: "#FBBF24", count: 0 },
  { id: "general", name: "General", icon: "menu-book", color: "#6B7280", count: 0 },
];

export default function CollectionsScreen() {
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculate word counts for each collection
  const collectionsWithCounts = useMemo(() => {
    return COLLECTIONS.map((collection) => ({
      ...collection,
      count: vocabulary.filter((item) => item.collection === collection.id).length,
    }));
  }, []);

  // Get words for selected collection
  const collectionWords = useMemo(() => {
    if (!selectedCollection) return [];
    return vocabulary.filter((item) => item.collection === selectedCollection);
  }, [selectedCollection]);

  const handleSelectCollection = useCallback((collectionId: Collection) => {
    setLoading(true);
    setSelectedCollection(collectionId);
    // Simulate loading
    setTimeout(() => setLoading(false), 100);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedCollection(null);
  }, []);

  const renderCollectionItem = useCallback(
    ({ item }: { item: CollectionInfo }) => {
      if (item.count === 0) return null;
      
      return (
        <Pressable
          onPress={() => handleSelectCollection(item.id)}
          style={({ pressed }) => [
            styles.collectionCard,
            pressed && styles.collectionCardPressed,
          ]}
        >
          <View
            className="bg-surface rounded-2xl p-4 border border-border"
            style={{ borderLeftWidth: 4, borderLeftColor: item.color }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <MaterialIcons name={item.icon as any} size={24} color={item.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-foreground">
                    {item.name}
                  </Text>
                  <Text className="text-sm text-muted mt-0.5">
                    {item.count} word{item.count !== 1 ? "s" : ""}
                  </Text>
                </View>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
            </View>
          </View>
        </Pressable>
      );
    },
    [handleSelectCollection]
  );

  const renderWordItem = useCallback(
    ({ item }: { item: VocabularyItem }) => {
      const genderColor = item.gender === "masculine" 
        ? "#3B82F6" 
        : item.gender === "feminine"
        ? "#EF4444"
        : undefined;

      const levelColors: Record<string, { bg: string; text: string }> = {
        A2: { bg: "bg-blue-500", text: "text-white" },
        B1: { bg: "bg-purple-500", text: "text-white" },
        B2: { bg: "bg-pink-500", text: "text-white" },
      };
      const levelStyle = levelColors[item.level] || levelColors.A2;

      return (
        <View className="bg-surface rounded-2xl p-4 border border-border mb-3">
          <View className="flex-row items-start justify-between mb-2">
            <View className="flex-1 mr-2">
              <View className="flex-row items-center gap-2 mb-1">
                <View className={cn("px-2 py-0.5 rounded-full", levelStyle.bg)}>
                  <Text className={cn("text-[10px] font-semibold", levelStyle.text)}>
                    {item.level}
                  </Text>
                </View>
                <Text className="text-[10px] text-muted uppercase">
                  {item.category}
                </Text>
              </View>
              <Text
                className="text-xl font-bold mb-1"
                style={genderColor ? { color: genderColor } : {}}
              >
                {item.french}
              </Text>
              <Text className="text-base text-primary font-medium mb-2">
                {item.english}
              </Text>
            </View>
          </View>
          <View className="bg-background rounded-xl p-3">
            <Text className="text-sm text-foreground italic mb-1">
              "{item.exampleFr}"
            </Text>
            <Text className="text-xs text-muted">
              "{item.exampleEn}"
            </Text>
          </View>
        </View>
      );
    },
    []
  );

  if (selectedCollection) {
    const collectionInfo = collectionsWithCounts.find((c) => c.id === selectedCollection);
    
    return (
      <ScreenContainer>
        {/* Header */}
        <View className="px-4 pt-2 pb-4 flex-row items-center">
          <Pressable onPress={handleBack} className="mr-3">
            <MaterialIcons name="arrow-back" size={24} color="#0055A4" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-2xl font-bold text-primary">
              {collectionInfo?.name || "Collection"}
            </Text>
            <Text className="text-sm text-muted mt-1">
              {collectionWords.length} word{collectionWords.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0055A4" />
          </View>
        ) : (
          <FlatList
            data={collectionWords}
            renderItem={renderWordItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="px-4 pt-2 pb-4">
        <Text className="text-2xl font-bold text-primary">Collections</Text>
        <Text className="text-sm text-muted mt-1">
          Browse words by topic
        </Text>
      </View>

      <FlatList
        data={collectionsWithCounts.filter((c) => c.count > 0)}
        renderItem={renderCollectionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  separator: {
    height: 12,
  },
  collectionCard: {
    // Base styles handled by className
  },
  collectionCardPressed: {
    opacity: 0.7,
  },
});






