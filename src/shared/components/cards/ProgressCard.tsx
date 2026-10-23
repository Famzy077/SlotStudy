import React from 'react';
import { View, Text } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/shared/hooks/useTheme';
import { formatPercentage } from '@/shared/utils/formatters';
import { clsx } from 'clsx';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProgressCardProps {
  title: string;
  value: number; // 0-100
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: { radius: 28, stroke: 5, textSize: 'text-sm' as const },
  md: { radius: 40, stroke: 6, textSize: 'text-lg' as const },
  lg: { radius: 56, stroke: 8, textSize: 'text-2xl' as const },
};

export function ProgressCard({
  title,
  value,
  subtitle,
  size = 'md',
  className,
}: ProgressCardProps) {
  const { colors } = useTheme();
  const { radius, stroke, textSize } = sizes[size];
  const circumference = 2 * Math.PI * radius;
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withTiming(value / 100, { duration: 1000 });
  }, [value, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const svgSize = (radius + stroke) * 2;

  return (
    <View
      className={clsx(
        'items-center rounded-3xl border border-slate-200/70 bg-white p-5 dark:border-slate-700/60 dark:bg-slate-800',
        className,
      )}
    >
      <View className="relative items-center justify-center">
        <Svg width={svgSize} height={svgSize}>
          <Circle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke={colors.border}
            strokeWidth={stroke}
            fill="none"
          />
          <AnimatedCircle
            cx={svgSize / 2}
            cy={svgSize / 2}
            r={radius}
            stroke={colors.primary}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="round"
            rotation="-90"
            origin={`${svgSize / 2}, ${svgSize / 2}`}
          />
        </Svg>
        <View className="absolute items-center">
          <Text
            className={clsx(
              'font-inter-bold text-slate-900 dark:text-slate-50',
              textSize,
            )}
          >
            {formatPercentage(value)}
          </Text>
        </View>
      </View>
      <Text className="mt-3 text-sm font-inter-semibold text-slate-900 dark:text-slate-50">
        {title}
      </Text>
      {subtitle && (
        <Text className="mt-1 text-xs font-inter-regular text-slate-500">
          {subtitle}
        </Text>
      )}
    </View>
  );
}
