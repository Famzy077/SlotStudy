import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { BookOpen, Clock, Upload } from "lucide-react-native";
import Animated, { FadeInRight } from "react-native-reanimated";
import { useTheme } from "@/shared/hooks/useTheme";
import { Badge } from "@/shared/components/ui/Badge";
import { formatTimeAgo } from "@/shared/utils/formatters";
import { clsx } from "clsx";

interface CourseCardProps {
  id: string;
  title: string;
  subject: string;
  progress: number; // 0-100
  lastAccessed?: string;
  totalTopics: number;
  completedTopics: number;
  onPress: (id: string) => void;
  index?: number;
  className?: string;
}

export function CourseCard({
  id,
  title,
  subject,
  progress,
  lastAccessed,
  totalTopics,
  completedTopics,
  onPress,
  index = 0,
  className,
}: CourseCardProps) {
  const { colors } = useTheme();
  const safeProgress = Math.max(0, Math.min(100, Math.round(progress || 0)));

  return (
    <Animated.View entering={FadeInRight.delay(index * 80).springify()}>
      <TouchableOpacity
        onPress={() => onPress(id)}
        activeOpacity={0.7}
        className={clsx(
          "rounded-3xl bg-white p-4 dark:bg-slate-800 border border-slate-100/80 dark:border-slate-700/50 shadow-sm",
          className,
        )}
      >
        <View className="mb-3 flex-row items-center justify-between gap-1">
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary-100 dark:bg-primary-900/60">
            <BookOpen size={18} color={colors.primary} />
          </View>
          <View className="shrink">
            <Badge label={subject} variant="neutral" className="px-2 py-0.5" />
          </View>
        </View>

        <Text
          className="mb-1 text-sm font-inter-semibold text-slate-900 dark:text-slate-50 min-h-[38px] leading-5"
          numberOfLines={2}
        >
          {title}
        </Text>

        <Text className="mb-2.5 text-[11px] font-inter-regular text-slate-500 dark:text-slate-400">
          {totalTopics === 0
            ? "No materials yet"
            : `${totalTopics} material${totalTopics === 1 ? "" : "s"}`}
        </Text>

        {/* Progress bar */}
        <View className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
          <View
            className="h-full rounded-full bg-primary"
            style={{ width: `${safeProgress}%` }}
          />
        </View>

        {/* Footer info: Progress percentage + Last accessed without overlap */}
        <View className="mt-2.5 flex-row items-center justify-between gap-1">
          <Text className="text-xs font-inter-semibold text-primary">
            {safeProgress}%
          </Text>
          {lastAccessed ? (
            <View className="flex-row items-center shrink gap-1">
              <Clock size={10} color="#94A3B8" />
              <Text
                className="text-[10px] font-inter-regular text-slate-400 shrink"
                numberOfLines={1}
              >
                {formatTimeAgo(lastAccessed)}
              </Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}
