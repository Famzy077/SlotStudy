import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  FileUp,
  Sparkles,
  FileText,
  ChevronRight,
  RefreshCw,
  BookOpen,
  Trash2,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { ScreenWrapper } from "@/shared/components/layout/ScreenWrapper";
import { EmptyState } from "@/shared/components/feedback/EmptyState";
import { ErrorState } from "@/shared/components/feedback/ErrorState";
import { AppAlert as Alert } from "@/shared/components/feedback/AppAlert";
import { useTheme } from "@/shared/hooks/useTheme";
import { useRecentSummaries } from "@/features/ai/hooks/useSummary";
import {
  useMaterials,
  useDeleteMaterial,
  useProcessMaterial,
} from "@/features/ai/hooks/useUpload";
import { SkeletonCard } from "@/shared/components/ui/LoadingSkeleton";
import type { MainScreenProps } from "@/navigation/types";

export default function AIHubScreen() {
  const navigation = useNavigation<MainScreenProps<"Tabs">["navigation"]>();
  const { colors } = useTheme();
  const {
    data: summariesResponse,
    isLoading,
    isError: summariesError,
    error: summariesErrorDetails,
    refetch: refetchSummaries,
  } = useRecentSummaries();
  const {
    data: materialsResponse,
    isLoading: materialsLoading,
    isError: materialsError,
    refetch: refetchMaterials,
  } = useMaterials();
  const processMaterial = useProcessMaterial();
  const deleteMaterial = useDeleteMaterial();

  const summaries = summariesResponse?.data ?? [];
  const materials = materialsResponse?.data ?? [];
  const unfinishedMaterials = materials.filter(
    (material) => material.status.toUpperCase() !== "COMPLETED",
  );

  const retryProcessing = (materialId: string) => {
    processMaterial.mutate(materialId, {
      onError: (error) => {
        Alert.alert(
          "Could not process material",
          error.message || "Please try again.",
        );
      },
    });
  };

  const confirmDeleteSummary = (materialId: string, title: string) => {
    Alert.alert(
      "Delete summary?",
      `Delete "${title}" and its uploaded material? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteMaterial.mutate(materialId, {
              onSuccess: (response) => {
                Alert.alert(
                  response.data.storageCleanupWarning
                    ? "Summary deleted with a warning"
                    : "Summary deleted",
                  response.data.storageCleanupWarning ||
                    `"${title}" and its uploaded material were deleted.`,
                );
              },
              onError: (error) => {
                Alert.alert(
                  "Delete failed",
                  error instanceof Error ? error.message : "Please try again.",
                );
              },
            });
          },
        },
      ],
    );
  };

  return (
    <ScreenWrapper scroll>
      <View className="mb-6 mt-4">
        <Text className="text-3xl font-inter-bold text-slate-900 dark:text-slate-50">
          AI Assistant
        </Text>
        <Text className="text-base font-inter-regular text-slate-500">
          Upload course materials to create AI-powered study summaries
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => navigation.navigate("UploadMaterial", {})}
        activeOpacity={0.85}
        className="mb-5 overflow-hidden rounded-3xl shadow-sm"
      >
        <LinearGradient
          colors={["#2563EB", "#1D4ED8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 24 }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                <FileUp size={24} color="#FFFFFF" />
              </View>
              <Text className="mb-1 text-xl font-inter-bold text-white">
                Upload New Material
              </Text>
              <Text className="text-sm font-inter-medium text-white/85">
                PDF, JPG, PNG images • Instant AI summary
              </Text>
            </View>
            <Sparkles size={48} color="#FFFFFF" opacity={0.22} />
          </View>
        </LinearGradient>
      </TouchableOpacity>

      <View className="mb-8 overflow-hidden rounded-3xl shadow-sm">
        <LinearGradient
          colors={["#4F46E5", "#7C3AED"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 24 }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <View className="mb-3 flex-row items-center gap-2.5">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                  <BookOpen size={24} color="#FFFFFF" />
                </View>
                <View className="rounded-full bg-white/20 px-2.5 py-1">
                  <Text className="text-[10px] font-inter-bold tracking-wider text-white">
                    🇳🇬 PIDGIN & ENGLISH
                  </Text>
                </View>
              </View>
              <Text className="mb-1 text-xl font-inter-bold text-white">
                AI Study Room
              </Text>
              <Text className="text-sm font-inter-medium text-white/85">
                Chat in English or Pidgin with your AI study buddy grounded in your handouts
              </Text>
            </View>
            <Sparkles size={48} color="#FFFFFF" opacity={0.22} />
          </View>

          <View className="mt-4 flex-row gap-3">
            <TouchableOpacity
              onPress={() => navigation.navigate("StudyRoomSetup", {})}
              activeOpacity={0.85}
              className="flex-1 items-center justify-center rounded-2xl bg-white py-3"
            >
              <Text className="text-xs font-inter-bold text-indigo-700">
                + Start New Session
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("StudyRoomHistory")}
              activeOpacity={0.85}
              className="flex-1 items-center justify-center rounded-2xl border border-white/30 bg-white/15 py-3"
            >
              <Text className="text-xs font-inter-bold text-white">
                Past Study Chats
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-xl font-inter-semibold text-slate-900 dark:text-slate-50">
          Material processing
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Refresh material status"
          onPress={() => refetchMaterials()}
          className="h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 bg-white dark:border-slate-700/60 dark:bg-slate-800"
        >
          <RefreshCw size={17} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {materialsLoading ? (
        <View className="mb-6">
          <SkeletonCard lines={2} />
        </View>
      ) : materialsError ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => refetchMaterials()}
          className="mb-6 rounded-2xl bg-red-50 p-4 dark:bg-red-900/20"
        >
          <Text className="font-inter-medium text-red-700 dark:text-red-300">
            Could not load material statuses. Tap to retry.
          </Text>
        </TouchableOpacity>
      ) : unfinishedMaterials.length > 0 ? (
        <View className="mb-6">
          {unfinishedMaterials.map((material) => {
            const status = material.status.toUpperCase();
            const processing = status === "PROCESSING";
            const uploaded = status === "UPLOADED";

            return (
              <View
                key={material.id}
                className="mb-3 flex-row items-center rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-800"
              >
                <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30">
                  {processing ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <FileText size={21} color="#DC2626" />
                  )}
                </View>
                <View className="mr-2 flex-1">
                  <Text
                    numberOfLines={1}
                    className="font-inter-semibold text-slate-900 dark:text-slate-50"
                  >
                    {material.fileName}
                  </Text>
                  <Text
                    className={`mt-1 text-xs ${
                      processing || uploaded
                        ? "text-primary"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {processing
                      ? "Generating your summary…"
                      : uploaded
                        ? "Ready for summary"
                        : "Processing failed. Your upload is saved."}
                  </Text>
                </View>
                {!processing && (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={
                      uploaded
                        ? `Generate summary for ${material.fileName}`
                        : `Retry processing ${material.fileName}`
                    }
                    disabled={processMaterial.isPending}
                    onPress={() => retryProcessing(material.id)}
                    className="rounded-xl bg-primary px-3 py-2"
                  >
                    <Text className="text-xs font-inter-semibold text-white">
                      {processMaterial.isPending &&
                      processMaterial.variables === material.id
                        ? "Generating…"
                        : uploaded
                          ? "Generate Summary"
                          : "Retry"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      ) : (
        <Text className="mb-6 text-sm font-inter-regular text-slate-500">
          Your uploaded materials will appear here while they are being
          processed.
        </Text>
      )}

      <View className="mb-4 flex-row items-center justify-between">
        <Text className="text-xl font-inter-semibold text-slate-900 dark:text-slate-50">
          Recent Summaries
        </Text>
      </View>

      {isLoading ? (
        <View>
          <SkeletonCard lines={2} className="mb-4" />
          <SkeletonCard lines={2} className="mb-4" />
        </View>
      ) : summariesError ? (
        <ErrorState
          title="Could not load summaries"
          message={
            summariesErrorDetails?.message ||
            "Please try again to load your study summaries."
          }
          onRetry={() => void refetchSummaries()}
        />
      ) : summaries.length > 0 ? (
        summaries.map((summary) => {
          const deleting =
            deleteMaterial.isPending &&
            deleteMaterial.variables === summary.materialId;

          return (
            <View
              key={summary.id}
              className="mb-3.5 flex-row items-center rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-700/60 dark:bg-slate-800"
            >
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("AISummary", {
                    materialId: summary.materialId,
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`Open summary ${summary.title}`}
                className="mr-2 flex-1 flex-row items-center"
              >
                <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/30">
                  <FileText size={24} color="#4F46E5" />
                </View>
                <View className="mr-2 flex-1">
                  <Text
                    numberOfLines={1}
                    className="text-base font-inter-semibold text-slate-900 dark:text-slate-50"
                  >
                    {summary.title}
                  </Text>
                  <Text className="mt-0.5 text-sm font-inter-regular text-slate-500">
                    {summary.difficulty.toLowerCase()} •{" "}
                    {summary.estimatedReadTime} min read
                  </Text>
                </View>
                <ChevronRight size={20} color={colors.textTertiary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  confirmDeleteSummary(summary.materialId, summary.title)
                }
                disabled={deleting}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${summary.title} and its uploaded material`}
                accessibilityState={{ disabled: deleting }}
                className="h-11 w-11 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20"
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <Trash2 size={18} color="#DC2626" />
                )}
              </TouchableOpacity>
            </View>
          );
        })
      ) : (
        <EmptyState
          title="No summaries yet"
          message="Upload a document to generate your first AI summary."
          icon={<Sparkles size={36} color={colors.textSecondary} />}
          actionLabel="Upload Material"
          onAction={() => navigation.navigate("UploadMaterial", {})}
        />
      )}
    </ScreenWrapper>
  );
}
