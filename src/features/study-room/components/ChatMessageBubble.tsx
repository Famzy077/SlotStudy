import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BookOpen, AlertCircle, Sparkles, Volume2, VolumeX } from 'lucide-react-native';
import { StudyMessage, SourceCitation } from '../types/study-room.types';
import { useTheme } from '@/shared/hooks/useTheme';

interface Props {
  message: StudyMessage;
  onPressSources?: (sources: SourceCitation[]) => void;
  onRetry?: () => void;
  isStreaming?: boolean;
  onSpeak?: () => void;
  isSpeaking?: boolean;
}

export const ChatMessageBubble: React.FC<Props> = ({
  message,
  onPressSources,
  onRetry,
  isStreaming = false,
  onSpeak,
  isSpeaking = false,
}) => {
  const { colors } = useTheme();
  const isUser = message.role === 'USER';
  const isFailed = message.status === 'FAILED';
  const isPending = message.status === 'PENDING' || isStreaming;
  const sources = message.sources ?? [];
  const hasSources = Array.isArray(sources) && sources.length > 0;

  if (isUser) {
    return (
      <View className="mb-4 flex-row justify-end">
        <View className="max-w-[82%] rounded-3xl rounded-br-sm bg-primary px-5 py-3.5 shadow-sm">
          <Text className="text-base font-inter-regular leading-relaxed text-white">
            {message.content}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mb-5 flex-row justify-start">
      <View className="max-w-[92%] rounded-3xl rounded-bl-sm border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800">
        <View className="mb-2 flex-row items-center gap-1.5">
          <Sparkles size={15} color={colors.primary} />
          <Text className="text-xs font-inter-semibold text-primary">
            SlotStudy AI Tutor
          </Text>
        </View>

        <Text className="text-base font-inter-regular leading-relaxed text-slate-800 dark:text-slate-100">
          {message.content}
          {isPending && (
            <Text className="font-inter-bold text-primary"> ▍</Text>
          )}
        </Text>

        {isPending && !message.content && (
          <View className="flex-row items-center gap-2 py-2">
            <ActivityIndicator size="small" color={colors.primary} />
            <Text className="text-xs font-inter-regular text-slate-400">
              Consulting selected materials...
            </Text>
          </View>
        )}

        {isFailed && (
          <View className="mt-3 flex-row items-center justify-between rounded-xl bg-red-50 p-2.5 dark:bg-red-950/40">
            <View className="flex-1 flex-row items-center gap-2">
              <AlertCircle size={16} color="#DC2626" />
              <Text className="flex-1 text-xs font-inter-medium text-red-700 dark:text-red-300">
                Generation incomplete.
              </Text>
            </View>
            {onRetry && (
              <TouchableOpacity
                onPress={onRetry}
                className="rounded-lg bg-red-100 px-2.5 py-1 dark:bg-red-900"
              >
                <Text className="text-xs font-inter-semibold text-red-800 dark:text-red-200">
                  Retry
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View className="mt-3 flex-row flex-wrap items-center gap-2">
          {hasSources && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onPressSources?.(sources)}
              className="flex-row items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1.5 dark:border-blue-800 dark:bg-blue-900/30"
            >
              <BookOpen size={13} color={colors.primary} />
              <Text className="text-xs font-inter-semibold text-primary">
                View {sources.length} supporting {sources.length === 1 ? 'source' : 'sources'}
              </Text>
            </TouchableOpacity>
          )}

          {onSpeak && !isPending && !isFailed && message.content && (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onSpeak}
              accessibilityRole="button"
              accessibilityLabel={isSpeaking ? "Stop audio" : "Read aloud"}
              className={`flex-row items-center gap-1 rounded-full px-2.5 py-1.5 ${
                isSpeaking
                  ? 'bg-amber-100 dark:bg-amber-900/40'
                  : 'bg-slate-100 dark:bg-slate-700/60'
              }`}
            >
              {isSpeaking ? (
                <VolumeX size={13} color="#D97706" />
              ) : (
                <Volume2 size={13} color="#64748B" />
              )}
              <Text
                className={`text-xs font-inter-medium ${
                  isSpeaking ? 'text-amber-700 dark:text-amber-300' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {isSpeaking ? 'Pause' : 'Listen'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};
