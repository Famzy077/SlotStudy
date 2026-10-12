import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import Animated, {
  useAnimatedStyle,
  withTiming,
  Easing,
  FadeInDown,
} from "react-native-reanimated";
import {
  Upload,
  Check,
  FileText,
  Image as ImageIcon,
  BookOpen,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  Trash2,
} from "lucide-react-native";
import { ScreenWrapper } from "@/shared/components/layout/ScreenWrapper";
import { Button } from "@/shared/components/ui/Button";
import { Badge } from "@/shared/components/ui/Badge";
import { AppAlert as Alert } from "@/shared/components/feedback/AppAlert";
import { useProcessMaterial, useUploadMaterial } from "../hooks/useUpload";
import { useCourse, useCourses } from "@/features/courses/hooks/useCourses";
import { formatFileSize } from "@/shared/utils/formatters";

export default function UploadMaterialScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const initialCourseId = route.params?.courseId;

  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(
    initialCourseId,
  );
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [materialId, setMaterialId] = useState<string | null>(null);

  const { data: currentCourseResponse } = useCourse(selectedCourseId || "");
  const { data: coursesResponse } = useCourses();
  const currentCourse = currentCourseResponse?.data;
  const availableCourses = coursesResponse?.data || [];

  const uploadMutation = useUploadMaterial();
  const processMutation = useProcessMaterial();

  const isPdf =
    selectedFile?.name?.toLowerCase().endsWith(".pdf") ||
    selectedFile?.mimeType === "application/pdf";
  const isImage =
    selectedFile?.mimeType?.startsWith("image/") ||
    /\.(jpg|jpeg|png)$/i.test(selectedFile?.name || "");

  const handleSelectFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/jpeg", "image/png"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setSelectedFile(file);
      setProgress(0);
      setUploadComplete(false);
      setMaterialId(null);
      processMutation.reset();
    } catch {
      Alert.alert("Error", "Failed to select document. Please try again.");
    }
  };

  const handleStartUpload = () => {
    if (!selectedFile) return;

    uploadMutation.mutate(
      {
        data: {
          courseId: selectedCourseId,
          file: {
            uri: selectedFile.uri,
            name: selectedFile.name,
            type: selectedFile.mimeType || "application/octet-stream",
          },
        },
        onProgress: (pct) => setProgress(pct),
      },
      {
        onSuccess: (res) => {
          if (res.data?.id) {
            setMaterialId(res.data.id);
            setProgress(100);
            setUploadComplete(true);
          } else {
            Alert.alert(
              "Upload Failed",
              "The server did not return an ID for the uploaded material.",
            );
          }
        },
        onError: (error) => {
          Alert.alert("Upload Failed", error.message || "Something went wrong.");
        },
      },
    );
  };

  const resetForNextUpload = () => {
    setSelectedFile(null);
    setProgress(0);
    setUploadComplete(false);
    setMaterialId(null);
    processMutation.reset();
  };

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(`${progress}%`, {
        duration: 250,
        easing: Easing.out(Easing.ease),
      }),
    };
  });

  return (
    <ScreenWrapper padded={false}>
      <View className="flex-1 bg-surface dark:bg-slate-900">
        {/* Header */}
        <View className="flex-row items-center border-b border-slate-100 dark:border-slate-800 px-4 py-3">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => navigation.goBack()}
            className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800"
          >
            <ArrowLeft size={20} color="#64748B" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-lg font-inter-bold text-slate-900 dark:text-slate-50">
              Upload Material
            </Text>
            <Text className="text-xs font-inter-regular text-slate-500">
              Add study material for summaries and AI chat
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Course Association Card */}
          <View className="mb-5 rounded-3xl bg-white p-4 dark:bg-slate-800 border border-slate-100/80 dark:border-slate-700/60 shadow-sm">
            <View className="flex-row items-center mb-2">
              <View className="mr-2 h-7 w-7 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/40">
                <BookOpen size={15} color="#2563EB" />
              </View>
              <Text className="text-xs font-inter-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Course Association
              </Text>
            </View>

            {currentCourse ? (
              <View className="flex-row items-center justify-between rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-3 mt-1">
                <View className="flex-1 mr-2">
                  <Text
                    className="font-inter-semibold text-slate-900 dark:text-slate-50 text-sm"
                    numberOfLines={1}
                  >
                    {currentCourse.title}
                  </Text>
                  <Text className="text-xs font-inter-regular text-slate-500">
                    {currentCourse.subject}
                  </Text>
                </View>
                <Badge label="Linked" variant="success" />
              </View>
            ) : availableCourses.length > 0 ? (
              <View className="mt-1">
                <Text className="text-xs font-inter-regular text-slate-500 mb-2">
                  Select which course this material belongs to (optional):
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  <TouchableOpacity
                    onPress={() => setSelectedCourseId(undefined)}
                    className={`rounded-full px-3 py-1.5 border ${
                      !selectedCourseId
                        ? "bg-primary border-primary"
                        : "bg-slate-100 dark:bg-slate-700/60 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <Text
                      className={`text-xs font-inter-medium ${
                        !selectedCourseId
                          ? "text-white"
                          : "text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      General
                    </Text>
                  </TouchableOpacity>
                  {availableCourses.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setSelectedCourseId(c.id)}
                      className={`rounded-full px-3 py-1.5 border ${
                        selectedCourseId === c.id
                          ? "bg-primary border-primary"
                          : "bg-slate-100 dark:bg-slate-700/60 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <Text
                        className={`text-xs font-inter-medium ${
                          selectedCourseId === c.id
                            ? "text-white"
                            : "text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {c.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <Text className="text-xs font-inter-regular text-slate-400 mt-1">
                Material will be saved to your general library.
              </Text>
            )}
          </View>

          {!uploadComplete ? (
            <Animated.View entering={FadeInDown.duration(200)}>
              {/* File Drop / Select Area */}
              {!selectedFile ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Tap to select a PDF or image file"
                  onPress={handleSelectFile}
                  activeOpacity={0.8}
                  className="items-center justify-center rounded-3xl border-2 border-dashed border-primary/40 bg-white dark:bg-slate-800 p-8 shadow-sm"
                >
                  <View className="mb-4 h-18 w-18 items-center justify-center rounded-full bg-primary/10 dark:bg-primary/20 p-4">
                    <Upload size={36} color="#2563EB" />
                  </View>
                  <Text className="mb-1 text-lg font-inter-bold text-slate-900 dark:text-slate-50 text-center">
                    Select Study Material
                  </Text>
                  <Text className="mb-5 text-xs font-inter-regular text-slate-500 dark:text-slate-400 text-center px-4 leading-5">
                    Tap to browse your device for lecture notes, slides, or chapters
                  </Text>

                  {/* Format Pills */}
                  <View className="flex-row items-center gap-2 mb-4">
                    <View className="rounded-lg bg-red-50 dark:bg-red-900/20 px-2.5 py-1">
                      <Text className="text-[11px] font-inter-semibold text-red-600 dark:text-red-400">
                        PDF
                      </Text>
                    </View>
                    <View className="rounded-lg bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1">
                      <Text className="text-[11px] font-inter-semibold text-blue-600 dark:text-blue-400">
                        PNG
                      </Text>
                    </View>
                    <View className="rounded-lg bg-purple-50 dark:bg-purple-900/20 px-2.5 py-1">
                      <Text className="text-[11px] font-inter-semibold text-purple-600 dark:text-purple-400">
                        JPG
                      </Text>
                    </View>
                  </View>

                  <View className="rounded-xl bg-primary px-5 py-2.5">
                    <Text className="text-sm font-inter-semibold text-white">
                      Browse Files
                    </Text>
                  </View>
                </TouchableOpacity>
              ) : (
                /* Selected File Card */
                <View className="rounded-3xl bg-white dark:bg-slate-800 p-5 border border-slate-100/80 dark:border-slate-700/60 shadow-sm">
                  <View className="flex-row items-start justify-between mb-4">
                    <View className="flex-row items-center flex-1 mr-3">
                      <View
                        className={`h-12 w-12 items-center justify-center rounded-2xl mr-3 ${
                          isPdf
                            ? "bg-red-50 dark:bg-red-900/30"
                            : isImage
                              ? "bg-purple-50 dark:bg-purple-900/30"
                              : "bg-primary-50 dark:bg-primary-900/30"
                        }`}
                      >
                        {isPdf ? (
                          <FileText size={24} color="#DC2626" />
                        ) : isImage ? (
                          <ImageIcon size={24} color="#9333EA" />
                        ) : (
                          <FileText size={24} color="#2563EB" />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text
                          className="font-inter-semibold text-slate-900 dark:text-slate-50 text-sm"
                          numberOfLines={2}
                        >
                          {selectedFile.name}
                        </Text>
                        <Text className="text-xs font-inter-regular text-slate-500 mt-0.5">
                          {formatFileSize(selectedFile.size)} •{" "}
                          {isPdf ? "PDF Document" : isImage ? "Image" : "File"}
                        </Text>
                      </View>
                    </View>

                    {!uploadMutation.isPending && (
                      <TouchableOpacity
                        onPress={() => setSelectedFile(null)}
                        className="p-1 rounded-lg bg-slate-100 dark:bg-slate-700"
                        accessibilityLabel="Remove file"
                      >
                        <Trash2 size={16} color="#94A3B8" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Upload Progress Bar */}
                  {uploadMutation.isPending && (
                    <View className="mb-4 mt-2">
                      <View className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
                        <Animated.View
                          className="h-full rounded-full bg-primary"
                          style={progressStyle}
                        />
                      </View>
                      <View className="mt-2 flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <ActivityIndicator size="small" color="#2563EB" />
                          <Text className="ml-2 text-xs font-inter-regular text-slate-500">
                            Uploading to secure cloud...
                          </Text>
                        </View>
                        <Text className="text-xs font-inter-semibold text-primary">
                          {progress}%
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Actions */}
                  <View className="flex-row gap-3 mt-2">
                    <Button
                      title="Change File"
                      variant="outline"
                      size="sm"
                      disabled={uploadMutation.isPending}
                      onPress={handleSelectFile}
                      className="flex-1"
                    />
                    <Button
                      title={uploadMutation.isPending ? "Uploading..." : "Upload File"}
                      size="sm"
                      loading={uploadMutation.isPending}
                      disabled={uploadMutation.isPending}
                      onPress={handleStartUpload}
                      className="flex-1"
                    />
                  </View>
                </View>
              )}
            </Animated.View>
          ) : (
            /* Upload Complete Success View */
            <Animated.View
              entering={FadeInDown.duration(250)}
              className="items-center rounded-3xl bg-white dark:bg-slate-800 p-6 border border-green-100 dark:border-green-900/40 shadow-sm"
            >
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Check size={32} color="#16A34A" />
              </View>

              <Text className="mb-1 text-2xl font-inter-bold text-slate-900 dark:text-slate-50 text-center">
                Material Uploaded!
              </Text>
              <Text className="mb-5 text-sm font-inter-regular text-slate-500 dark:text-slate-400 text-center px-4 leading-5">
                {selectedFile?.name
                  ? `"${selectedFile.name}" has been safely saved.`
                  : "Your study material has been saved."}
              </Text>

              {/* Action Buttons */}
              <View className="w-full gap-3">
                <Button
                  title="Done"
                  onPress={() => navigation.goBack()}
                  className="w-full bg-primary"
                />

                <Button
                  title={
                    processMutation.isPending
                      ? "Generating Summary..."
                      : "Generate AI Summary"
                  }
                  variant="outline"
                  icon={<Sparkles size={16} color="#2563EB" />}
                  loading={processMutation.isPending}
                  onPress={() => {
                    if (materialId) {
                      processMutation.mutate(materialId, {
                        onSuccess: () => {
                          navigation.navigate("AISummary", { materialId });
                        },
                        onError: (error) => {
                          Alert.alert(
                            "Summary generation failed",
                            error.message || "Please try again later.",
                          );
                        },
                      });
                    }
                  }}
                  className="w-full"
                />

                {materialId && (
                  <Button
                    title="Study in AI Room"
                    variant="ghost"
                    icon={<BookOpen size={16} color="#2563EB" />}
                    onPress={() => {
                      navigation.navigate("StudyRoomSetup", {
                        materialId,
                        courseId: selectedCourseId,
                      });
                    }}
                    className="w-full"
                  />
                )}

                <TouchableOpacity
                  onPress={resetForNextUpload}
                  className="py-2 items-center"
                >
                  <Text className="text-xs font-inter-medium text-slate-500">
                    Upload Another Document
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}
