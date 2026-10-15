import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { CheckCircle, XCircle } from "lucide-react-native";
import { ScreenWrapper } from "@/shared/components/layout/ScreenWrapper";
import { Button } from "@/shared/components/ui/Button";
import { ProgressCard } from "@/shared/components/cards/ProgressCard";
import { XPBadge } from "@/shared/components/cards/XPBadge";
import { LoadingSkeleton } from "@/shared/components/ui/LoadingSkeleton";
import { ErrorState } from "@/shared/components/feedback/ErrorState";
import { useQuizResult } from "../hooks/useQuizResult";
import type { MainScreenProps } from "@/navigation/types";

export default function QuizResultScreen({
  navigation,
  route,
}: MainScreenProps<"QuizResult">) {
  const { quizId } = route.params;
  const [reviewMistakesOnly, setReviewMistakesOnly] = useState(false);

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuizResult(quizId);

  if (isLoading) {
    return (
      <ScreenWrapper padded={false}>
        <View className="flex-1 p-4 bg-surface dark:bg-slate-900 items-center justify-center">
          <LoadingSkeleton className="h-48 w-48 rounded-full mb-8" />
          <LoadingSkeleton className="h-12 w-full mb-4 rounded-3xl" />
          <LoadingSkeleton className="h-12 w-full mb-4 rounded-3xl" />
        </View>
      </ScreenWrapper>
    );
  }

  if (isError || !response?.data) {
    return (
      <ScreenWrapper padded={false}>
        <ErrorState
          title="Failed to load results"
          message={error?.message || "Unknown error occurred"}
          onRetry={refetch}
        />
      </ScreenWrapper>
    );
  }

  const result = response.data;
  const accuracy = Math.round(
    (result.correctAnswers / result.totalQuestions) * 100,
  );
  const reviewQuestions = reviewMistakesOnly
    ? result.questions.filter((question) => !question.isCorrect)
    : result.questions;

  const renderQuestion = ({ item, index }: { item: any; index: number }) => (
    <View className="bg-white dark:bg-slate-800 p-4 rounded-3xl mb-4 border border-slate-100 dark:border-slate-700">
      <View className="flex-row items-start mb-2">
        <Text className="text-slate-900 dark:text-slate-50 font-bold mr-2">
          {index + 1}.
        </Text>
        <Text className="text-slate-900 dark:text-slate-50 flex-1">
          {item.text}
        </Text>
        {item.isCorrect ? (
          <CheckCircle size={20} className="text-success text-green-600 ml-2" />
        ) : (
          <XCircle size={20} className="text-error text-red-600 ml-2" />
        )}
      </View>
      <View className="mt-2 pl-6">
        <Text
          className={`text-sm mb-1 ${item.isCorrect ? "text-green-600" : "text-red-600"}`}
        >
          Your answer: {item.selectedAnswer || "Not answered"}
        </Text>
        {!item.isCorrect && (
          <Text className="text-sm text-green-600 mb-2">
            Correct answer: {item.correctAnswer}
          </Text>
        )}
        <Text className="text-slate-500 text-xs mt-2 italic">
          {item.explanation}
        </Text>
      </View>
    </View>
  );

  return (
    <ScreenWrapper padded={false}>
      <ScrollView className="flex-1 bg-surface dark:bg-slate-900">
        <View className="items-center p-6">
          <Text className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-8">
            Quiz Completed!
          </Text>

          <View className="items-center justify-center mb-8 relative">
            <ProgressCard value={accuracy} title="Accuracy" size="lg" />
            <View className="absolute items-center justify-center">
              <Text className="text-4xl font-bold text-slate-900 dark:text-slate-50">
                {/* {result.score} */}
              </Text>
              <Text className="text-slate-500">Points</Text>
            </View>
          </View>

          <Text className="text-5xl font-extrabold text-primary mb-8">
            {result.grade}
          </Text>

          <View className="flex-row justify-around w-full mb-8 bg-white dark:bg-slate-800 p-4 rounded-3xl">
            <View className="items-center">
              <Text className="text-slate-500 mb-1">XP Earned</Text>
              <XPBadge xp={result.xpEarned} />
            </View>
            <View className="w-[1px] h-full bg-slate-200 dark:bg-slate-700" />
            <View className="items-center">
              <Text className="text-slate-500 mb-1">Time</Text>
              <Text className="text-lg font-bold text-slate-900 dark:text-slate-50">
                {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
              </Text>
            </View>
            <View className="w-[1px] h-full bg-slate-200 dark:bg-slate-700" />
            <View className="items-center">
              <Text className="text-slate-500 mb-1">Accuracy</Text>
              <Text className="text-lg font-bold text-slate-900 dark:text-slate-50">
                {accuracy}%
              </Text>
            </View>
          </View>
        </View>

        <View className="px-4 pb-8">
          <View className="mb-4 flex-row items-center justify-between">
            <View>
              <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">
                {reviewMistakesOnly
                  ? "Mistakes to review"
                  : "Question breakdown"}
              </Text>
              <Text className="mt-1 text-xs text-slate-500">
                {reviewMistakesOnly
                  ? `${reviewQuestions.length} question${reviewQuestions.length === 1 ? "" : "s"} to revisit`
                  : "Review the answers and explanations"}
              </Text>
            </View>
            {result.wrongAnswers > 0 ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: reviewMistakesOnly }}
                onPress={() => setReviewMistakesOnly((current) => !current)}
                className="rounded-xl bg-blue-50 px-3 py-2 dark:bg-slate-800"
              >
                <Text className="text-xs font-semibold text-primary">
                  {reviewMistakesOnly ? "Show all" : "Mistakes only"}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <FlatList
            data={reviewQuestions}
            renderItem={renderQuestion}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>

      <View className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
        <Button
          title="Back to Home"
          onPress={() => navigation.navigate("Tabs", { screen: "Home" })}
          className="w-full bg-primary"
        />
      </View>
    </ScreenWrapper>
  );
}
