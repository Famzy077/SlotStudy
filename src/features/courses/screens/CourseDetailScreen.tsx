import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  BookOpen,
  CalendarDays,
  FileText,
  Sparkles,
  Plus,
  Check,
  Image as ImageIcon,
} from "lucide-react-native";
import { ScreenWrapper } from "@/shared/components/layout/ScreenWrapper";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { EmptyState } from "@/shared/components/feedback/EmptyState";
import { ErrorState } from "@/shared/components/feedback/ErrorState";
import { AppAlert as Alert } from "@/shared/components/feedback/AppAlert";
import { useMaterials, useProcessMaterial } from "@/features/ai/hooks/useUpload";
import {
  useGenerateQuiz,
  useRecentSummaries,
} from "@/features/ai/hooks/useSummary";
import { useCourse } from "../hooks/useCourses";
import { formatFileSize, formatTimeAgo } from "@/shared/utils/formatters";
import type { MainScreenProps } from "@/navigation/types";

const formatDate = (date: string) => {
  const value = new Date(date);
  return Number.isNaN(value.getTime())
    ? null
    : value.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

const CourseDetailScreen = ({
  navigation,
  route,
}: MainScreenProps<"CourseDetail">) => {
  const courseId = route.params.courseId;
  const {
    data: courseResponse,
    isLoading: courseLoading,
    isError: courseError,
    error: courseErrorDetails,
    refetch: refetchCourse,
  } = useCourse(courseId);
  const {
    data: materialsResponse,
    isLoading: materialsLoading,
    isError: materialsError,
    error: materialsErrorDetails,
    refetch: refetchMaterials,
  } = useMaterials(courseId);
  const {
    data: summariesResponse,
    isLoading: summariesLoading,
    isError: summariesError,
    error: summariesErrorDetails,
    refetch: refetchSummaries,
  } = useRecentSummaries(courseId);
  const generateQuiz = useGenerateQuiz();
  const processMaterial = useProcessMaterial();

  if (courseLoading) {
    return (
      <ScreenWrapper padded={false}>
        <View className="flex-1 items-center justify-center bg-surface dark:bg-slate-900">
          <ActivityIndicator accessibilityLabel="Loading course" size="large" />
        </View>
      </ScreenWrapper>
    );
  }

  const course = courseResponse?.data;
  if (courseError || !course) {
    return (
      <ScreenWrapper padded={false}>
        <ErrorState
          title="Could not load course"
          message={
            courseErrorDetails?.message ??
            "This course could not be found. Please try again."
          }
          onRetry={() => void refetchCourse()}
        />
      </ScreenWrapper>
    );
  }

  const materials = materialsResponse?.data ?? [];
  const summaries = summariesResponse?.data ?? [];
  const hasProgress =
    typeof course.progress === "number" && Number.isFinite(course.progress);
  const progress = hasProgress
    ? Math.max(0, Math.min(100, course.progress))
    : 0;
  const hasTopicProgress =
    typeof course.completedTopics === "number" &&
    Number.isFinite(course.completedTopics) &&
    typeof course.totalTopics === "number" &&
    Number.isFinite(course.totalTopics);
  const createdAt = formatDate(course.createdAt);

  const openUpload = () =>
    navigation.navigate("UploadMaterial", { courseId: course.id });

  const handleGenerateSummary = (materialId: string) => {
    processMaterial.mutate(materialId, {
      onSuccess: () => {
        Alert.alert("Summary Generated", "Your study summary is ready.");
      },
      onError: (error) => {
        Alert.alert(
          "Summary generation failed",
          error.message || "Please try again.",
        );
      },
    });
  };

  const handleGenerateQuiz = (summaryId: string) => {
    generateQuiz.mutate(
      { summaryId, numberOfQuestions: 5 },
      {
        onSuccess: (response) => {
          if (!response.data?.id) {
            Alert.alert(
              "Quiz unavailable",
              "The quiz was generated without an ID. Please try again.",
            );
            return;
          }
          navigation.navigate("Quiz", {
            quizId: response.data.id,
            mode: "practice",
          });
        },
        onError: (error) => {
          Alert.alert(
            "Quiz generation failed",
            error.message || "Please try again.",
          );
        },
      },
    );
  };

  return (
    <ScreenWrapper padded={false}>
      <View className="flex-1 bg-surface dark:bg-slate-900">
        <View className="flex-row items-center border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back to courses"
            onPress={() => navigation.goBack()}
            className="mr-3 rounded-xl px-3 py-2"
          >
            <Text className="font-inter-semibold text-primary">Back</Text>
          </TouchableOpacity>
          <Text
            className="flex-1 text-lg font-inter-semibold text-slate-900 dark:text-slate-50"
            numberOfLines={1}
          >
            Course details
          </Text>
          <Button
            title="Upload"
            size="sm"
            onPress={openUpload}
            accessibilityLabel={`Upload material to ${course.title}`}
          />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          accessibilityLabel={`${course.title} course details`}
        >
          <View className="mb-5 rounded-3xl bg-white p-5 dark:bg-slate-800">
            <Text className="mb-2 text-2xl font-inter-bold text-slate-900 dark:text-slate-50">
              {course.title}
            </Text>
            <View className="mb-4 flex-row flex-wrap items-center">
              <View className="mr-2 rounded-full bg-primary-50 px-3 py-1 dark:bg-primary-900/30">
                <Text className="font-inter-medium text-primary">
                  {course.subject}
                </Text>
              </View>
              {createdAt && (
                <View className="flex-row items-center">
                  <CalendarDays size={14} color="#64748B" />
                  <Text className="ml-1 text-sm text-slate-500">
                    Added {createdAt}
                  </Text>
                </View>
              )}
            </View>
            {!!course.description && (
              <Text className="text-base leading-6 text-slate-600 dark:text-slate-300">
                {course.description}
              </Text>
            )}
          </View>

          {(hasProgress || hasTopicProgress) && (
            <View className="mb-6 rounded-3xl bg-white p-5 dark:bg-slate-800">
              <Text className="mb-4 text-lg font-inter-semibold text-slate-900 dark:text-slate-50">
                Your progress
              </Text>
              {hasProgress && (
                <>
                  <View className="mb-2 flex-row items-center justify-between">
                    <Text className="text-sm text-slate-500">
                      Learning activity
                    </Text>
                    <Text className="font-inter-semibold text-primary">
                      {Math.round(progress)}%
                    </Text>
                  </View>
                  <View
                    accessibilityRole="progressbar"
                    accessibilityLabel="Learning activity"
                    accessibilityValue={{
                      min: 0,
                      max: 100,
                      now: progress,
                    }}
                    className="mb-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"
                  >
                    <View
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${progress}%` }}
                    />
                  </View>
                </>
              )}
              {hasTopicProgress && (
                <Text className="text-sm text-slate-500">
                  {course.completedTopics} of {course.totalTopics} materials
                  processed
                </Text>
              )}
            </View>
          )}

          <View className="mb-6">
            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Text className="text-xl font-inter-semibold text-slate-900 dark:text-slate-50">
                  Course Materials
                </Text>
                {!materialsLoading && !materialsError && (
                  <View className="ml-2.5 rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5">
                    <Text className="text-xs font-inter-semibold text-slate-600 dark:text-slate-300">
                      {materials.length}
                    </Text>
                  </View>
                )}
              </View>
              <Button
                title="Add Material"
                size="sm"
                icon={<Plus size={14} color="#FFFFFF" />}
                onPress={openUpload}
                accessibilityLabel={`Upload material to ${course.title}`}
              />
            </View>

            {materialsLoading ? (
              <ActivityIndicator accessibilityLabel="Loading course materials" />
            ) : materialsError ? (
              <View className="rounded-2xl bg-white p-4 dark:bg-slate-800">
                <Text className="mb-3 text-sm text-slate-500">
                  {materialsErrorDetails?.message ??
                    "Course materials could not be loaded."}
                </Text>
                <Button
                  title="Retry"
                  size="sm"
                  variant="secondary"
                  onPress={() => void refetchMaterials()}
                />
              </View>
            ) : materials.length ? (
              materials.map((material) => {
                const isPdf =
                  material.fileName?.toLowerCase().endsWith(".pdf") ||
                  material.fileType === "application/pdf";
                const isImg =
                  material.fileType?.startsWith("image/") ||
                  /\.(jpg|jpeg|png)$/i.test(material.fileName || "");
                const isCompleted =
                  material.status?.toUpperCase() === "COMPLETED";
                const isProcessing =
                  material.status?.toUpperCase() === "PROCESSING" ||
                  (processMaterial.isPending &&
                    processMaterial.variables === material.id);
                const isFailed = material.status?.toUpperCase() === "FAILED";

                return (
                  <View
                    key={material.id}
                    className="mb-3.5 rounded-2xl bg-white dark:bg-slate-800 p-4 border border-slate-100/80 dark:border-slate-700/50 shadow-sm"
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-row items-start flex-1 mr-2">
                        <View
                          className={`mr-3 h-10 w-10 items-center justify-center rounded-xl ${
                            isPdf
                              ? "bg-red-50 dark:bg-red-900/30"
                              : isImg
                                ? "bg-purple-50 dark:bg-purple-900/30"
                                : "bg-primary-50 dark:bg-primary-900/30"
                          }`}
                        >
                          {isPdf ? (
                            <FileText size={20} color="#DC2626" />
                          ) : isImg ? (
                            <ImageIcon size={20} color="#9333EA" />
                          ) : (
                            <FileText size={20} color="#2563EB" />
                          )}
                        </View>
                        <View className="flex-1">
                          <Text
                            className="font-inter-semibold text-slate-900 dark:text-slate-50 text-sm leading-5"
                            numberOfLines={2}
                          >
                            {material.fileName}
                          </Text>
                          <Text className="mt-0.5 text-xs font-inter-regular text-slate-500">
                            {formatFileSize(material.fileSize)} •{" "}
                            {formatTimeAgo(material.createdAt)}
                          </Text>
                        </View>
                      </View>

                      <View>
                        {isCompleted ? (
                          <Badge
                            label="Summary Ready"
                            variant="success"
                            icon={<Check size={12} color="#16A34A" />}
                          />
                        ) : isProcessing ? (
                          <Badge label="Generating..." variant="primary" />
                        ) : isFailed ? (
                          <Badge label="Failed" variant="error" />
                        ) : (
                          <Badge label="Uploaded" variant="neutral" />
                        )}
                      </View>
                    </View>

                    {/* Action buttons per material */}
                    <View className="mt-3.5 flex-row gap-2 border-t border-slate-100 dark:border-slate-700/60 pt-3">
                      {isCompleted ? (
                        <>
                          <Button
                            title="View Summary"
                            variant="secondary"
                            size="sm"
                            className="flex-1"
                            onPress={() =>
                              navigation.navigate("AISummary", {
                                materialId: material.id,
                              })
                            }
                          />
                          <Button
                            title="AI Study Room"
                            size="sm"
                            variant="outline"
                            icon={<BookOpen size={14} color="#2563EB" />}
                            className="flex-1"
                            onPress={() =>
                              navigation.navigate("StudyRoomSetup", {
                                materialId: material.id,
                                courseId: course.id,
                              })
                            }
                          />
                        </>
                      ) : isProcessing ? (
                        <View className="flex-1 flex-row items-center justify-center py-1">
                          <ActivityIndicator size="small" color="#2563EB" />
                          <Text className="ml-2 text-xs font-inter-medium text-slate-500">
                            Generating AI summary...
                          </Text>
                        </View>
                      ) : (
                        <>
                          <Button
                            title={
                              isFailed
                                ? "Retry Summary"
                                : "Generate Summary"
                            }
                            size="sm"
                            variant={isFailed ? "outline" : "primary"}
                            icon={<Sparkles size={14} color="#FFFFFF" />}
                            className="flex-1"
                            loading={
                              processMaterial.isPending &&
                              processMaterial.variables === material.id
                            }
                            disabled={processMaterial.isPending}
                            onPress={() => handleGenerateSummary(material.id)}
                          />
                          <Button
                            title="AI Study Room"
                            size="sm"
                            variant="outline"
                            icon={<BookOpen size={14} color="#2563EB" />}
                            className="flex-1"
                            onPress={() =>
                              navigation.navigate("StudyRoomSetup", {
                                materialId: material.id,
                                courseId: course.id,
                              })
                            }
                          />
                        </>
                      )}
                    </View>
                  </View>
                );
              })
            ) : (
              <View className="rounded-3xl bg-white dark:bg-slate-800">
                <EmptyState
                  title="No materials uploaded yet"
                  message="Upload lecture notes, slides, or chapters to study with AI."
                  icon={<FileText size={36} color="#64748B" />}
                  actionLabel="Upload material"
                  onAction={openUpload}
                />
              </View>
            )}
          </View>

          <View>
            <View className="mb-3 flex-row items-center">
              <Sparkles size={20} color="#2563EB" />
              <Text className="ml-2 text-xl font-inter-semibold text-slate-900 dark:text-slate-50">
                Summaries and quizzes
              </Text>
            </View>
            {summariesLoading ? (
              <ActivityIndicator accessibilityLabel="Loading course summaries" />
            ) : summariesError ? (
              <View className="rounded-2xl bg-white p-4 dark:bg-slate-800">
                <Text className="mb-3 text-sm text-slate-500">
                  {summariesErrorDetails?.message ??
                    "Available summaries could not be loaded."}
                </Text>
                <Button
                  title="Retry"
                  size="sm"
                  variant="secondary"
                  onPress={() => void refetchSummaries()}
                />
              </View>
            ) : summaries.length ? (
              summaries.map((summary) => (
                <View
                  key={summary.id}
                  className="mb-3 rounded-2xl bg-white p-4 dark:bg-slate-800"
                >
                  <Text className="mb-1 font-inter-semibold text-slate-900 dark:text-slate-50">
                    {summary.title}
                  </Text>
                  <Text className="mb-4 text-sm text-slate-500">
                    {summary.difficulty.toLowerCase()} ·{" "}
                    {summary.estimatedReadTime} min read
                  </Text>
                  <View className="flex-row">
                    <Button
                      title="View summary"
                      variant="secondary"
                      size="sm"
                      className="mr-2 flex-1"
                      accessibilityLabel={`View summary: ${summary.title}`}
                      onPress={() =>
                        navigation.navigate("AISummary", {
                          materialId: summary.materialId,
                        })
                      }
                    />
                    <Button
                      title="Generate quiz"
                      size="sm"
                      className="flex-1"
                      icon={<BookOpen size={15} color="#FFFFFF" />}
                      accessibilityLabel={`Generate quiz from ${summary.title}`}
                      onPress={() => handleGenerateQuiz(summary.id)}
                      loading={
                        generateQuiz.isPending &&
                        generateQuiz.variables?.summaryId === summary.id
                      }
                      disabled={generateQuiz.isPending}
                    />
                  </View>
                </View>
              ))
            ) : (
              <View className="rounded-3xl bg-white dark:bg-slate-800">
                <EmptyState
                  title="No summaries available"
                  message="Summaries will appear here after this course’s material has been processed."
                  icon={<Sparkles size={36} color="#64748B" />}
                />
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default CourseDetailScreen;
