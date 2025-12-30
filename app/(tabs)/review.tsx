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
import { VocabularyItem } from "@/data/vocabulary";
import {
  loadProgress,
  getForgotList,
  getFamiliarList,
  restoreFromFamiliar,
  ProgressData,
} from "@/stores/vocabulary-store";
import { cn } from "@/lib/utils";

interface ForgotItem {
  item: VocabularyItem;
  forgotCount: number;
}

type TabType = 'forgot' | 'familiar';

const levelColors: Record<string, { bg: string; text: string }> = {
  A2: { bg: "bg-blue-500", text: "text-white" },
  B1: { bg: "bg-purple-500", text: "text-white" },
  B2: { bg: "bg-pink-500", text: "text-white" },
};

export default function ReviewScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('forgot');
  const [forgotList, setForgotList] = useState<ForgotItem[]>([]);
  const [familiarList, setFamiliarList] = useState<VocabularyItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const progress = await loadProgress();
    const forgotItems = getForgotList(progress);
    const familiarItems = getFamiliarList(progress);
    setForgotList(forgotItems);
    setFamiliarList(familiarItems);
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

  const handleRestoreFromFamiliar = useCallback(async (item: VocabularyItem) => {
    // Load current progress and restore the word
    const progress = await loadProgress();
    const newProgress = await restoreFromFamiliar(item.id, progress);

    // Update the lists
    const forgotItems = getForgotList(newProgress);
    const familiarItems = getFamiliarList(newProgress);
    setForgotList(forgotItems);
    setFamiliarList(familiarItems);
  }, []);

  const renderFamiliarItem = useCallback(
    ({ item }: { item: VocabularyItem }) => {
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
        <View className="bg-surface rounded-2xl p-4 border border-border mb-3">
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
            <View className="bg-purple-100 px-3 py-1.5 rounded-full">
              <Text className="text-sm font-bold text-purple-600">
                ⭐ Familiar
              </Text>
            </View>
          </View>

          {/* Expanded content */}
          {isExpanded && (
            <View className="mt-4 pt-4 border-t border-border">
              <View className="bg-background rounded-xl p-3 mb-3">
                <Text className="text-sm text-foreground italic mb-1 leading-5">
                  "{item.exampleFr}"
                </Text>
                <Text className="text-xs text-muted leading-4">
                  "{item.exampleEn}"
                </Text>
              </View>
              <Pressable
                onPress={() => handleRestoreFromFamiliar(item)}
                style={({ pressed }) => [
                  styles.restoreButton,
                  pressed && styles.restoreButtonPressed,
                ]}
              >
                <Text style={styles.restoreButtonText}>Restore to Learning</Text>
              </Pressable>
            </View>
          )}

          {/* Expand button */}
          <Pressable
            onPress={() => toggleExpand(item.id)}
            style={({ pressed }) => [
              styles.expandButton,
              pressed && styles.expandButtonPressed,
            ]}
          >
            <Text style={styles.expandButtonText}>
              {isExpanded ? 'Hide Details' : 'Show Details & Restore'}
            </Text>
          </Pressable>
        </View>
      );
    },
    [expandedId, toggleExpand, handleRestoreFromFamiliar]
  );

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
        <Text className="text-2xl font-bold text-primary">Review Words</Text>
        <Text className="text-sm text-muted mt-1">
          Review words that need practice
        </Text>
      </View>

      {/* Tabs */}
      <View className="flex-row px-4 mb-4">
        <Pressable
          onPress={() => setActiveTab('forgot')}
          style={({ pressed }) => [
            styles.tab,
            activeTab === 'forgot' && styles.activeTab,
            pressed && styles.tabPressed,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'forgot' && styles.activeTabText,
            ]}
          >
            Forgot ({forgotList.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('familiar')}
          style={({ pressed }) => [
            styles.tab,
            activeTab === 'familiar' && styles.activeTab,
            pressed && styles.tabPressed,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'familiar' && styles.activeTabText,
            ]}
          >
            Familiar ({familiarList.length})
          </Text>
        </Pressable>
      </View>

      {activeTab === 'forgot' ? (
        forgotList.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-6xl mb-4">🎉</Text>
            <Text className="text-xl font-semibold text-foreground text-center mb-2">
              Great job!
            </Text>
            <Text className="text-sm text-muted text-center leading-5">
              You haven't forgotten any words yet.{"\n"}Keep learning in the Learn tab!
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
        )
      ) : (
        familiarList.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-6xl mb-4">⭐</Text>
            <Text className="text-xl font-semibold text-foreground text-center mb-2">
              All words mastered!
            </Text>
            <Text className="text-sm text-muted text-center leading-5">
              Words you marked as very familiar.{"\n"}They'll stay here until you restore them.
            </Text>
          </View>
        ) : (
          <FlatList
            data={familiarList}
            renderItem={renderFamiliarItem}
            keyExtractor={(item) => item.id}
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
        )
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
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#0055A4',
  },
  tabPressed: {
    opacity: 0.7,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeTabText: {
    color: 'white',
  },
  expandButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
  },
  expandButtonPressed: {
    opacity: 0.7,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  restoreButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#0055A4',
    borderRadius: 8,
    alignItems: 'center',
  },
  restoreButtonPressed: {
    opacity: 0.8,
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});
