import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { ScreenContainer } from "@/components/screen-container";
import { VocabularyItem } from "@/data/vocabulary.js";
import {
  loadProgress,
  getForgotList,
  ProgressData,
} from "@/stores/vocabulary-store";
import { cn } from "@/lib/utils";

interface ForgotItem {
  item: VocabularyItem;
  forgotCount: number;
}

const levelColors: Record<string, { bg: string; text: string }> = {
  A2: { bg: "bg-blue-500", text: "text-white" },
  B1: { bg: "bg-purple-500", text: "text-white" },
  B2: { bg: "bg-pink-500", text: "text-white" },
};

export default function ReviewScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [forgotList, setForgotList] = useState<ForgotItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const progress = await loadProgress();
    const list = getForgotList(progress);
    setForgotList(list);
    setLoading(false);
    setRefreshing(false);
  }, []);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const renderItem = useCallback(
    ({ item: { item, forgotCount } }: { item: ForgotItem }) => {
      const isExpanded = expandedId === item.id;
      const levelStyle = levelColors[item.level] || levelColors.A2;
      
      // Gender color for nouns: blue for masculine, red for feminine
      const genderColor = item.gender === "masculine" 
        ? "#3B82F6" // blue-500
        : item.gender === "feminine"
        ? "#EF4444" // red-500
        : undefined;
      
      // Text style for French word with gender color
      const frenchWordStyle = genderColor 
        ? { color: genderColor } 
        : {};

      return (
        <Pressable
          onPress={() => toggleExpand(item.id)}
          style={({ pressed }) => [
            styles.itemContainer,
            pressed && styles.itemPressed,
          ]}
        >
          <View className="bg-surface rounded-2xl p-4 border border-border">
            {/* Main row */}
            <View className="flex-row justify-between items-start">
              <View className="flex-1 mr-3">
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
                  className="text-lg font-semibold"
                  style={[
                    { fontSize: 18, fontWeight: "600" },
                    frenchWordStyle,
                  ]}
                >
                  {item.french}
                </Text>
                <Text className="text-sm text-muted mt-0.5">{item.english}</Text>
              </View>
              <View className="bg-warning/20 px-3 py-1.5 rounded-full">
                <Text className="text-sm font-bold text-warning">
                  {forgotCount}x
                </Text>
              </View>
            </View>

            {/* Expanded content */}
            {isExpanded && (
              <View className="mt-4 pt-4 border-t border-border">
                <View className="bg-background rounded-xl p-3">
                  <Text className="text-sm text-foreground italic mb-1 leading-5">
                    "{item.exampleFr}"
                  </Text>
                  <Text className="text-xs text-muted leading-4">
                    "{item.exampleEn}"
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Pressable>
      );
    },
    [expandedId, toggleExpand]
  );

  const keyExtractor = useCallback((item: ForgotItem) => item.item.id, []);

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#0055A4" />
        <Text className="text-muted mt-4">Loading review list...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="px-4 pt-2 pb-4">
        <Text className="text-2xl font-bold text-primary">Words to Review</Text>
        <Text className="text-sm text-muted mt-1">
          {forgotList.length === 0
            ? "No words to review yet"
            : `${forgotList.length} word${forgotList.length !== 1 ? "s" : ""} to practice`}
        </Text>
      </View>

      {forgotList.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-4">🎉</Text>
          <Text className="text-xl font-semibold text-foreground text-center mb-2">
            Great job!
          </Text>
          <Text className="text-sm text-muted text-center leading-5">
            You haven't forgotten any words yet.{"\n"}Keep learning in the Learn
            tab!
          </Text>
        </View>
      ) : (
        <FlatList
          data={forgotList}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0055A4"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
  itemContainer: {
    // Base styles handled by className
  },
  itemPressed: {
    opacity: 0.7,
  },
});
