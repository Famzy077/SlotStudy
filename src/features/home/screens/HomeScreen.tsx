import React from "react";
import {
  ScrollView,
  RefreshControl,
  View,
  TouchableOpacity,
  Text,
} from "react-native";
import { ScreenWrapper } from "@/shared/components/layout/ScreenWrapper";
import GreetingHeader from "../components/GreetingHeader";
import QuickActions from "../components/QuickActions";
import ContinueStudying from "../components/ContinueStudying";
import { StreakWidget } from "@/shared/components/cards/StreakWidget";
import { XPBadge } from "@/shared/components/cards/XPBadge";
import { ProgressCard } from "@/shared/components/cards/ProgressCard";
import { SkeletonCard as LoadingSkeleton } from "@/shared/components/ui/LoadingSkeleton";
import { ErrorState } from "@/shared/components/feedback/ErrorState";
import { useDashboard } from "../hooks/useDashboard";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { GraduationCap, ChevronRight, BookOpen } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

const HomeScreen = () => {
  const { data, isLoading, isError, refetch, isRefetching } = useDashboard();
  const { data: profileResponse } = useProfile();
  const username = useAuthStore((state) => state.user?.username ?? "");
  const navigation = useNavigation<any>();

  if (isLoading) {
    return (
      <ScreenWrapper
        padded={false}
        className="flex-1 bg-surface dark:bg-slate-900"
      >
        <View className="px-6 mt-8 mb-6 flex-row items-center justify-between">
          <View>
            <LoadingSkeleton className="h-6 w-32 mb-2 rounded-lg" />
            <LoadingSkeleton className="h-8 w-48 rounded-lg" />
          </View>
          <LoadingSkeleton className="h-12 w-12 rounded-full" />
        </View>

        <View className="flex-row px-6 mb-6 gap-4">
          <LoadingSkeleton className="flex-1 h-32 rounded-3xl" />
          <LoadingSkeleton className="flex-1 h-32 rounded-3xl" />
        </View>

        <View className="px-6 mb-8">
          <LoadingSkeleton className="w-full h-48 rounded-3xl" />
        </View>

        <View className="px-6 mb-8 flex-row flex-wrap justify-between gap-y-4">
          <LoadingSkeleton className="w-[48%] aspect-square rounded-3xl" />
          <LoadingSkeleton className="w-[48%] aspect-square rounded-3xl" />
          <LoadingSkeleton className="w-[48%] aspect-square rounded-3xl" />
          <LoadingSkeleton className="w-[48%] aspect-square rounded-3xl" />
        </View>
      </ScreenWrapper>
    );
  }

  if (isError || !data?.data) {
    return (
      <ScreenWrapper
        padded={false}
        className="flex-1 bg-surface dark:bg-slate-900 justify-center"
      >
        <ErrorState message="Failed to load dashboard" onRetry={refetch} />
      </ScreenWrapper>
    );
  }

  const dashboard = data.data;
  const missingUniversity = Boolean(
    profileResponse?.data && !profileResponse.data.university,
  );

  return (
    <ScreenWrapper
      padded={false}
      className="flex-1 bg-surface dark:bg-slate-900"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <GreetingHeader
          greeting={dashboard.greeting}
          name={dashboard.user.name}
          avatarUrl={
            profileResponse?.data?.avatarUrl ?? dashboard.user.avatarUrl
          }
          username={username}
        />

        {missingUniversity ? (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => navigation.navigate("AcademicDetails")}
            className="mx-6 mb-6 flex-row items-center rounded-3xl bg-blue-50 p-4 dark:bg-slate-800"
          >
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white dark:bg-slate-700">
              <GraduationCap size={21} color="#2563EB" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-bold text-slate-900 dark:text-slate-50">
                Add your university
              </Text>
              <Text className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Personalize your learning, including distance-learning schools.
              </Text>
            </View>
            <ChevronRight size={20} color="#2563EB" />
          </TouchableOpacity>
        ) : null}

        {dashboard.recentCourses.length === 0 ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Start your first study session by uploading course material"
            onPress={() => navigation.navigate("UploadMaterial", {})}
            className="mx-6 mb-6 rounded-3xl bg-primary p-5"
          >
            <View className="mb-3 h-11 w-11 items-center justify-center rounded-2xl bg-white/20">
              <BookOpen size={22} color="#FFFFFF" />
            </View>
            <Text className="text-lg font-bold text-white">
              Start your first study session
            </Text>
            <Text className="mt-1 text-sm leading-5 text-white/80">
              Upload a PDF or image of your notes. We’ll create a summary you
              can study and practise from.
            </Text>
            <View className="mt-4 flex-row items-center">
              <Text className="mr-1 font-semibold text-white">
                Upload material
              </Text>
              <ChevronRight size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        ) : null}

        <View className="px-6 mb-6 flex-row gap-4">
          <View className="flex-1 justify-center">
            <StreakWidget
              currentStreak={dashboard.streak.current}
              weeklyData={dashboard.streak.weeklyData}
              showWeekly={false}
            />
          </View>
          <View className="flex-1 justify-center">
            <XPBadge xp={dashboard.xp.total} level={dashboard.xp.level} />
          </View>
        </View>

        <View className="px-6 mb-8">
          <ProgressCard
            title="Average quiz score"
            value={dashboard.examReadiness.overall}
            subtitle={
              dashboard.examReadiness.quizCount
                ? `Based on ${dashboard.examReadiness.quizCount} completed ${dashboard.examReadiness.quizCount === 1 ? "quiz" : "quizzes"
                }`
                : "Take a practice quiz to start tracking your learning."
            }
          />
          {dashboard.examReadiness.quizCount ? (
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => navigation.navigate("QuizHub")}
              className="mt-3 rounded-2xl bg-blue-50 p-4 dark:bg-slate-800"
            >
              <Text className="font-semibold text-slate-900 dark:text-slate-50">
                {Object.entries(dashboard.examReadiness.subjects).length
                  ? `Next focus: ${Object.entries(dashboard.examReadiness.subjects).sort(
                    ([, scoreA], [, scoreB]) => scoreA - scoreB,
                  )[0][0]
                  }`
                  : "Keep practising to build a subject-level picture"}
              </Text>
              <Text className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                Your score is an average of quiz results, not a prediction of
                exam readiness. Tap to practise.
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <QuickActions actions={dashboard.quickActions} />

        <ContinueStudying courses={dashboard.recentCourses} />
      </ScrollView>
    </ScreenWrapper>
  );
};

export default HomeScreen;
