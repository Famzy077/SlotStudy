import React from 'react';
import { View, Text } from 'react-native';
import { Star } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { formatXP } from '@/shared/utils/formatters';
import { clsx } from 'clsx';

interface XPBadgeProps {
  xp: number;
  level?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function XPBadge({ xp, level, size = 'md', className }: XPBadgeProps) {
  const isSmall = size === 'sm';

  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      className={clsx(
        'flex-row items-center rounded-3xl border border-amber-200/70 bg-amber-50 dark:border-amber-700/40 dark:bg-amber-900/30',
        isSmall ? 'px-3 py-2' : 'p-5',
        className,
      )}
    >
      <View
        className={clsx(
          'items-center justify-center rounded-full bg-amber-100 dark:bg-amber-800',
          isSmall ? 'mr-2 h-7 w-7' : 'mr-3 h-9 w-9',
        )}
      >
        <Star
          size={isSmall ? 14 : 18}
          color="#F59E0B"
          fill="#F59E0B"
        />
      </View>
      <View>
        <Text
          className={clsx(
            'font-inter-bold text-amber-700 dark:text-amber-400',
            isSmall ? 'text-sm' : 'text-base',
          )}
        >
          {formatXP(xp)} XP
        </Text>
        {level !== undefined && (
          <Text className="text-xs font-inter-regular text-amber-600 dark:text-amber-500">
            Level {level}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}
