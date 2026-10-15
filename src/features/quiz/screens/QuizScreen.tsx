import React, { useEffect, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import Animated, {
  SlideInUp,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { ScreenWrapper } from "@/shared/components/layout/ScreenWrapper";
import { Button } from "@/shared/components/ui/Button";
import { QuizOption } from "@/shared/components/cards/QuizOption";
import { LoadingSkeleton } from "@/shared/components/ui/LoadingSkeleton";
import { ErrorState } from "@/shared/components/feedback/ErrorState";
import { AppAlert as Alert } from "@/shared/components/feedback/AppAlert";
import { useQuizStore } from "../store/quiz.store";
import { useQuizData, useSubmitQuiz } from "../hooks/useQuiz";
import * as Crypto from "expo-crypto";
import type { MainScreenProps } from "@/navigation/types";

export default function QuizScreen({
  navigation,
  route,
}: MainScreenProps<"Quiz">) {
  const { courseId, quizId, mode = "practice" } = route.params || {};
  const isTestMode = mode === "test";

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuizData(courseId, quizId);
  const submitMutation = useSubmitQuiz();
  const submissionKey = useRef<string | null>(null);

  const {
    currentQuestionIndex,
    selectedAnswers,
    isRevealed,
    timerSeconds,
    isTimerRunning,
    selectAnswer,
    revealAnswer,
    nextQuestion,
    resetQuiz,
    setTimer,
    decrementTimer,
    stopTimer,
  } = useQuizStore();

  const quiz = response?.data;

  useEffect(() => {
    if (quiz) {
      resetQuiz();
      setTimer(quiz.timeLimit);
      submissionKey.current = Crypto.randomUUID();
    }
    return () => resetQuiz();
  }, [quiz]);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        decrementTimer();
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      stopTimer();
      handleFinish();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleSelect = (label: string) => {
    if (isRevealed || !quiz) return;
    const currentQ = quiz.questions[currentQuestionIndex];
    selectAnswer(currentQ.id, label);
    if (!isTestMode) revealAnswer();
  };

  const handleNext = () => {
    if (!quiz) return;
    if (currentQuestionIndex < quiz.questions.length - 1) {
      nextQuestion();
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    if (!quiz || submitMutation.isPending) return;
    stopTimer();
    const answers = quiz.questions.map((question) => ({
      questionId: question.id,
      selectedAnswer: selectedAnswers[question.id] ?? "",
    }));
    submissionKey.current ??= Crypto.randomUUID();

    submitMutation.mutate(
      {
        quizId: quiz.id,
        data: {
          quizId: quiz.id,
          idempotencyKey: submissionKey.current,
          answers,
          timeTaken: quiz.timeLimit - timerSeconds,
        },
      },
      {
        onSuccess: () => {
          navigation.replace("QuizResult", { quizId: quiz.id });
        },
        onError: (err) => {
          Alert.alert("Error", err.message || "Failed to submit quiz");
        },
      },
    );
  };

  if (isLoading) {
    return (
      <ScreenWrapper padded={false}>
        <View className="flex-1 p-4 bg-surface dark:bg-slate-900">
          <LoadingSkeleton className="h-6 w-full mb-8" />
          <LoadingSkeleton className="h-40 w-full mb-8 rounded-3xl" />
          <LoadingSkeleton className="h-16 w-full mb-4 rounded-3xl" />
          <LoadingSkeleton className="h-16 w-full mb-4 rounded-3xl" />
        </View>
      </ScreenWrapper>
    );
  }

  if (isError || !quiz) {
    return (
      <ScreenWrapper padded={false}>
        <ErrorState
          title="Failed to load quiz"
          message={error?.message || "Unknown error occurred"}
          onRetry={refetch}
        />
      </ScreenWrapper>
    );
  }

  const currentQ = quiz.questions[currentQuestionIndex];
  const progressPct = ((currentQuestionIndex + 1) / quiz.totalQuestions) * 100;

  return (
    <ScreenWrapper padded={false} edges={["top"]}>
      <View className="flex-1 bg-surface dark:bg-slate-900">
        <View className="p-4 bg-white dark:bg-slate-800 shadow-sm z-10">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-slate-500 font-semibold">
              {currentQuestionIndex + 1} of {quiz.totalQuestions}
            </Text>
            <Text
              accessibilityLabel={`${isTestMode ? "Test" : "Practice"} mode, ${formatDuration(timerSeconds)} remaining`}
              className="text-xl font-bold text-slate-900 dark:text-slate-50"
            >
              {isTestMode ? "Test" : "Practice"} ·{" "}
              {formatDuration(timerSeconds)}
            </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text className="text-red-500 font-bold">Exit</Text>
            </TouchableOpacity>
          </View>
          <View className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <Animated.View
              className="h-full bg-primary"
              style={{ width: `${progressPct}%` }}
            />
          </View>
        </View>

        <ScrollView className="flex-1 px-4 pt-6 pb-24">
          <Text className="text-2xl font-bold text-slate-900 dark:text-slate-50 mb-8 leading-tight">
            {currentQ.text}
          </Text>

          <View className="space-y-4 mb-8">
            {currentQ.options.map((opt) => {
              let state = "default";
              if (isRevealed && !isTestMode) {
                if (opt.label === currentQ.correctAnswer) state = "correct";
                else if (selectedAnswers[currentQ.id] === opt.label)
                  state = "wrong";
              } else if (selectedAnswers[currentQ.id] === opt.label) {
                state = "selected";
              }

              return (
                <QuizOption
                  key={opt.label}
                  label={opt.label}
                  text={opt.text}
                  state={state as any}
                  onPress={() => handleSelect(opt.label)}
                  disabled={isRevealed}
                />
              );
            })}
          </View>

          {isRevealed && !isTestMode && (
            <Animated.View 
              entering={SlideInUp}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 mb-8 border border-slate-100 dark:border-slate-700"
            >
              <Text className="text-lg font-bold text-slate-900 dark:text-slate-50">
                Explanation 
              </Text>
              <Text className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {currentQ.explanation}
              </Text>
            </Animated.View>
          )}
        </ScrollView>

        {(isRevealed || isTestMode) && (
          <View className="absolute bottom-0 w-full p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 pb-8 z-20">
            <Button
              title={
                currentQuestionIndex < quiz.questions.length - 1
                  ? "Next Question"
                  : "Finish Quiz"
              }
              onPress={handleNext}
              className="w-full bg-primary"
              loading={submitMutation.isPending}
            />
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
}
