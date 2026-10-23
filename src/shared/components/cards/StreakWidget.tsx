import React from 'react';
import { View, Text } from 'react-native';
import { Flame } from 'lucide-react-native';
import Animated, { FadeIn, BounceIn } from 'react-native-reanimated';
import { clsx } from 'clsx';

interface StreakWidgetProps {
  currentStreak: number;
  weeklyData: boolean[]; // last 7 days, true = studied
  showWeekly?: boolean;
  className?: string;
}

export function StreakWidget({ currentStreak, weeklyData, showWeekly = true, className }: StreakWidgetProps) {
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      className={clsx(
        'rounded-3xl border border-slate-200/70 bg-white p-5 dark:border-slate-700/60 dark:bg-slate-800',
        className,
      )}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Animated.View entering={BounceIn.delay(300)}>
            <View className="mr-3 h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 dark:bg-orange-900/30">
              <Flame size={24} color="#F97316" fill="#F97316" />
            </View>
          </Animated.View>
          <View>
            <Text className="text-2xl font-inter-bold text-slate-900 dark:text-slate-50">
              {currentStreak}
            </Text>
            <Text className="text-xs font-inter-regular text-slate-500">
              day streak
            </Text>
          </View>
        </View>
      </View>

      {/* Weekly dots */}
      {showWeekly && (
        <View className="mt-4 flex-row justify-between">
          {weeklyData.map((active, i) => (
            <View key={i} className="items-center">
              <View
                className={clsx(
                  'mb-1.5 h-8 w-8 items-center justify-center rounded-full',
                  active
                    ? 'bg-primary'
                    : 'bg-slate-100 dark:bg-slate-700',
                )}
              >
                {active && <Flame size={14} color="#FFFFFF" fill="#FFFFFF" />}
              </View>
              <Text
                className={clsx(
                  'text-xs font-inter-medium',
                  active
                    ? 'text-primary dark:text-primary-400'
                    : 'text-slate-400 dark:text-slate-500',
                )}
              >
                {dayLabels[i]}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
}
