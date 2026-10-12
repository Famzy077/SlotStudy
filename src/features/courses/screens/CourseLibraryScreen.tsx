import React, { useState } from "react";
import { TextInput } from "react-native";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { ScreenWrapper } from "@/shared/components/layout/ScreenWrapper";
import { SearchBar } from "@/shared/components/ui/SearchBar";
import { CourseCard } from "@/shared/components/cards/CourseCard";
import { SkeletonCard as LoadingSkeleton } from "@/shared/components/ui/LoadingSkeleton";
import { EmptyState } from "@/shared/components/feedback/EmptyState";
import { useCourses, useCreateCourse } from "../hooks/useCourses";
import { useDebounce } from "@/shared/hooks/useDebounce"; // Assuming useDebounce exists
import { useNavigation } from "@react-navigation/native";
import { Button } from "@/shared/components/ui/Button";
import { AppAlert as Alert } from "@/shared/components/feedback/AppAlert";
import { Plus, Upload } from "lucide-react-native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "@/navigation/types";

const FILTERS = ["All", "In Progress", "Completed"];

const CourseLibraryScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [activeFilter, setActiveFilter] = useState("All");
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: "",
    subject: "",
    description: "",
  });

  const { data, isLoading, refetch, isRefetching } =
    useCourses(debouncedSearch);
  const createCourse = useCreateCourse();

  const courses = data?.data || [];

  const filteredCourses = courses.filter((course) => {
    if (activeFilter === "All") return true;
    if (activeFilter === "In Progress")
      return course.progress > 0 && course.progress < 100;
    if (activeFilter === "Completed") return course.progress === 100;
    return true;
  });

  const handleCreateCourse = () => {
    const title = courseForm.title.trim();
    const subject = courseForm.subject.trim();
    if (!title || !subject) {
      Alert.alert("Add course details", "Enter a course name and subject.");
      return;
    }

    createCourse.mutate(
      {
        title,
        subject,
        description: courseForm.description.trim() || undefined,
      },
      {
        onSuccess: (response) => {
          const createdCourse = response.data;
          setCourseForm({ title: "", subject: "", description: "" });
          setShowCourseForm(false);
          if (createdCourse?.id) {
            navigation.navigate("CourseDetail", {
              courseId: createdCourse.id,
            });
          }
        },
        onError: (error) => {
          Alert.alert(
            "Could not create course",
            error.message || "Please try again.",
          );
        },
      },
    );
  };

  return (
    <ScreenWrapper className="flex-1 bg-surface dark:bg-slate-900">
      <View className="px-6 pt-4 pb-2">
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            My Courses
          </Text>
          <View className="flex-row">
            <Button
              title="New course"
              size="sm"
              variant="secondary"
              icon={<Plus size={16} color="#2563EB" />}
              onPress={() => setShowCourseForm((visible) => !visible)}
              accessibilityLabel="Create a course"
              className="mr-2"
            />
            <Button
              title="Upload"
              size="sm"
              icon={<Upload size={16} color="#FFFFFF" />}
              onPress={() => navigation.navigate("UploadMaterial", {})}
              accessibilityLabel="Upload course material"
            />
          </View>
        </View>
        {showCourseForm ? (
          <View
            accessibilityLabel="Create course form"
            className="mb-4 rounded-2xl bg-white p-4 dark:bg-slate-800"
          >
            <Text className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-50">
              Add a course
            </Text>
            <TextInput
              accessibilityLabel="Course name"
              value={courseForm.title}
              onChangeText={(title) =>
                setCourseForm((current) => ({ ...current, title }))
              }
              placeholder="Course name (e.g. Biology 101)"
              placeholderTextColor="#94A3B8"
              returnKeyType="next"
              className="mb-3 rounded-xl border border-slate-200 px-4 py-3 text-slate-900 dark:border-slate-700 dark:text-slate-50"
            />
            <TextInput
              accessibilityLabel="Course subject"
              value={courseForm.subject}
              onChangeText={(subject) =>
                setCourseForm((current) => ({ ...current, subject }))
              }
              placeholder="Subject (e.g. Biology)"
              placeholderTextColor="#94A3B8"
              returnKeyType="next"
              className="mb-3 rounded-xl border border-slate-200 px-4 py-3 text-slate-900 dark:border-slate-700 dark:text-slate-50"
            />
            <TextInput
              accessibilityLabel="Course description, optional"
              value={courseForm.description}
              onChangeText={(description) =>
                setCourseForm((current) => ({ ...current, description }))
              }
              placeholder="Description (optional)"
              placeholderTextColor="#94A3B8"
              className="mb-4 rounded-xl border border-slate-200 px-4 py-3 text-slate-900 dark:border-slate-700 dark:text-slate-50"
            />
            <View className="flex-row">
              <Button
                title="Cancel"
                size="sm"
                variant="outline"
                onPress={() => setShowCourseForm(false)}
                className="mr-2 flex-1"
              />
              <Button
                title="Create course"
                size="sm"
                loading={createCourse.isPending}
                onPress={handleCreateCourse}
                className="flex-1"
              />
            </View>
          </View>
        ) : null}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search courses..."
        />

        <View className="flex-row mt-4 gap-2">
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              accessibilityRole="button"
              accessibilityState={{ selected: activeFilter === filter }}
              accessibilityLabel={`Filter courses: ${filter}`}
              onPress={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-full border ${
                activeFilter === filter
                  ? "bg-primary border-primary"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              }`}
            >
              <Text
                className={`font-medium ${
                  activeFilter === filter
                    ? "text-white"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View className="px-6 flex-row flex-wrap justify-between">
          <LoadingSkeleton className="w-[48%] h-48 mb-4 rounded-3xl" />
          <LoadingSkeleton className="w-[48%] h-48 mb-4 rounded-3xl" />
          <LoadingSkeleton className="w-[48%] h-48 mb-4 rounded-3xl" />
          <LoadingSkeleton className="w-[48%] h-48 mb-4 rounded-3xl" />
        </View>
      ) : (
        <FlatList
          data={filteredCourses}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          columnWrapperStyle={{
            justifyContent: "space-between",
            marginBottom: 16,
          }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <EmptyState
              title={courses.length ? "No courses found" : "No courses yet"}
              message={
                courses.length
                  ? "Try a different search or course filter."
                  : "Create a course to keep your materials, summaries, and quizzes together."
              }
              actionLabel={
                courses.length || searchQuery
                  ? undefined
                  : "Create your first course"
              }
              onAction={() => setShowCourseForm(true)}
            />
          }
          renderItem={({ item }) => {
            const openCourseDetail = (courseId: string) =>
              navigation.navigate("CourseDetail", { courseId });
            const openCourseUpload = () =>
              navigation.navigate("UploadMaterial", { courseId: item.id });

            return (
              <View className="w-[48%]">
                <CourseCard
                  id={item.id}
                  title={item.title}
                  subject={item.subject}
                  progress={item.progress}
                  totalTopics={item.totalTopics}
                  completedTopics={item.completedTopics}
                  lastAccessed={item.lastAccessed}
                  onPress={openCourseDetail}
                  onUploadPress={openCourseUpload}
                />
              </View>
            );
          }}
        />
      )}
    </ScreenWrapper>
  );
};

export default CourseLibraryScreen;
