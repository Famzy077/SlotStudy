import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BarChart3, ChevronRight, Clock, BookCheck, BrainCircuit } from 'lucide-react-native';
import type { ProgressData } from '@/features/progress/types/progress.types';

interface Props {
  progress?: ProgressData | null;
  isLoading?: boolean;
}

export const HomeProgressSection = ({ progress, isLoading }: Props) => {
  const navigation = useNavigation<any>();

  if (isLoading || !progress) {
    return null;
  }

  const weeklyStudyHours = progress.weeklyStudyHours ?? [];
  const maxHours = Math.max(...weeklyStudyHours.map((d) => d.hours), 1);
  const hasWeeklyQuizPractice = weeklyStudyHours.some((day) => day.hours > 0);
  const subjectPerformance = progress.subjectPerformance ?? [];
  const xpProgression = progress.xpProgression;

  return (
    <View className="px-6 mb-8">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View className="mr-2.5 h-8 w-8 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30">
            <BarChart3 size={18} color="#2563EB" />
          </View>
          <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Learning Progress
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.navigate('QuizHub')}
          className="flex-row items-center"
        >
          <Text className="text-xs font-semibold text-primary mr-0.5">Practise Quiz</Text>
          <ChevronRight size={14} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* 3 Stats Overview Cards */}
      <View className="flex-row gap-2.5 mb-4">
        <View className="flex-1 items-center rounded-2xl border border-slate-200/70 bg-white p-3 dark:border-slate-700/60 dark:bg-slate-800 shadow-sm">
          <View className="mb-1 h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
            <Clock size={15} color="#2563EB" />
          </View>
          <Text className="text-lg font-bold text-slate-900 dark:text-slate-50">
            {(progress.totalStudyTime ?? 0).toFixed(1)}h
          </Text>
          <Text className="text-[10px] text-slate-500 text-center font-medium mt-0.5">
            Quiz Time
          </Text>
        </View>

        <View className="flex-1 items-center rounded-2xl border border-slate-200/70 bg-white p-3 dark:border-slate-700/60 dark:bg-slate-800 shadow-sm">
          <View className="mb-1 h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/30">
            <BookCheck size={15} color="#4F46E5" />
          </View>
          <Text className="text-lg font-bold text-slate-900 dark:text-slate-50">
            {progress.coursesCompleted ?? 0}
          </Text>
          <Text className="text-[10px] text-slate-500 text-center font-medium mt-0.5">
            Completed
          </Text>
        </View>

        <View className="flex-1 items-center rounded-2xl border border-slate-200/70 bg-white p-3 dark:border-slate-700/60 dark:bg-slate-800 shadow-sm">
          <View className="mb-1 h-7 w-7 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/30">
            <BrainCircuit size={15} color="#F59E0B" />
          </View>
          <Text className="text-lg font-bold text-slate-900 dark:text-slate-50">
            {progress.totalQuizzesTaken ?? 0}
          </Text>
          <Text className="text-[10px] text-slate-500 text-center font-medium mt-0.5">
            Quizzes
          </Text>
        </View>
      </View>

      {/* Weekly Quiz Practice Chart Card */}
      <View className="rounded-3xl border border-slate-200/70 bg-white p-5 dark:border-slate-700/60 dark:bg-slate-800 mb-4 shadow-sm">
        <Text className="text-base font-bold text-slate-900 dark:text-slate-50">
          Weekly Quiz Practice
        </Text>
        <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">
          Time spent practising timed quizzes this week
        </Text>

        {hasWeeklyQuizPractice ? (
          <View className="flex-row justify-between items-end h-32 pt-2">
            {weeklyStudyHours.map((day, idx) => {
              const heightPct = Math.max(6, Math.min(100, (day.hours / maxHours) * 100));
              const isToday = idx === new Date().getDay() - 1;
              return (
                <View key={idx} className="items-center flex-1">
                  <View className="w-full flex-row justify-center h-24 items-end pb-1.5">
                    <View
                      className={`w-6 rounded-t-md ${isToday ? 'bg-indigo-600' : 'bg-primary'}`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </View>
                  <Text className={`text-[11px] font-medium ${isToday ? 'font-bold text-primary' : 'text-slate-500'}`}>
                    {day.day}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View className="items-center rounded-2xl bg-slate-50 py-5 px-4 dark:bg-slate-700/40">
            <Text className="text-center text-xs text-slate-600 dark:text-slate-300">
              Take your first practice quiz to see your weekly study trend.
            </Text>
          </View>
        )}
      </View>

      {/* Subject Performance Breakdown */}
      {subjectPerformance.length > 0 && (
        <View className="rounded-3xl border border-slate-200/70 bg-white p-5 dark:border-slate-700/60 dark:bg-slate-800 mb-4 shadow-sm">
          <Text className="text-base font-bold text-slate-900 dark:text-slate-50">
            Subject Performance
          </Text>
          <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-4">
            Average score for each of your enrolled subjects
          </Text>

          {subjectPerformance.map((subj, idx) => {
            const score = Math.round(subj.score);
            return (
              <View key={idx} className="mb-3.5 last:mb-0">
                <View className="flex-row justify-between mb-1.5 items-center">
                  <Text numberOfLines={1} className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex-1 mr-2">
                    {subj.subject}
                  </Text>
                  <Text className="text-xs font-bold text-slate-900 dark:text-slate-50">
                    {score}%
                  </Text>
                </View>
                <View className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(0, Math.min(100, score))}%`,
                      backgroundColor: subj.color || '#2563EB',
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* XP Level Progression Bar */}
      {xpProgression && (
        <View className="rounded-3xl border border-amber-200/70 bg-amber-50/70 p-4 dark:border-amber-700/40 dark:bg-amber-900/20 shadow-sm">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-xs font-bold text-amber-800 dark:text-amber-300">
              Level {xpProgression.level} Mastery
            </Text>
            <Text className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              {xpProgression.current} / {xpProgression.nextLevelXp} XP
            </Text>
          </View>
          <View className="w-full h-2.5 bg-amber-200/60 dark:bg-amber-800/40 rounded-full overflow-hidden">
            <View
              className="h-full bg-amber-500 rounded-full"
              style={{
                width: `${Math.min(100, Math.max(5, (xpProgression.current / Math.max(1, xpProgression.nextLevelXp)) * 100))}%`,
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
};
