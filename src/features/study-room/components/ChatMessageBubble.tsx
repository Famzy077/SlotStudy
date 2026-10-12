import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  BookOpen,
  AlertCircle,
  Sparkles,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Share2,
} from 'lucide-react-native';
import { StudyMessage, SourceCitation } from '../types/study-room.types';
import { useTheme } from '@/shared/hooks/useTheme';
import { MarkdownRenderer } from '@/shared/components/markdown/MarkdownRenderer';

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
  const [isCopied, setIsCopied] = useState(false);
  const [userCopied, setUserCopied] = useState(false);

  const isUser = message.role === 'USER';
  const isFailed = message.status === 'FAILED';
  const isPending = message.status === 'PENDING' || isStreaming;
  const sources = message.sources ?? [];
  const hasSources = Array.isArray(sources) && sources.length > 0;

  const handleCopy = async () => {
    if (!message.content) return;
    try {
      await Clipboard.setStringAsync(message.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Ignore copy error
    }
  };

  const handleShare = async () => {
    if (!message.content) return;
    try {
      await Share.share({
        message: message.content,
        title: 'SlotStudy AI Response',
      });
    } catch {
      // Ignore share error
    }
  };

  if (isUser) {
    return (
      <View className="mb-4 flex-row justify-end">
        <TouchableOpacity
          activeOpacity={0.9}
          onLongPress={async () => {
            if (message.content) {
              await Clipboard.setStringAsync(message.content);
              setUserCopied(true);
              setTimeout(() => setUserCopied(false), 2000);
            }
          }}
          className="max-w-[84%] rounded-3xl rounded-br-sm bg-primary px-5 py-3.5 shadow-sm"
        >
          <Text className="text-base font-inter-regular leading-relaxed text-white">
            {message.content}
          </Text>
          {userCopied && (
            <View className="mt-1 flex-row items-center gap-1 self-end">
              <Check size={11} color="#FFFFFF" />
              <Text className="text-[10px] font-inter-medium text-white/80">Copied</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="mb-5 flex-row justify-start">
      <View className="max-w-[94%] rounded-3xl rounded-bl-sm border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800">
        <View className="mb-2.5 flex-row items-center gap-1.5">
          <Sparkles size={15} color={colors.primary} />
          <Text className="text-xs font-inter-semibold text-primary">
            SlotStudy AI Tutor
          </Text>
        </View>

        {message.content ? (
          <MarkdownRenderer
            content={message.content}
            isStreaming={isPending}
            onCitationPress={() => {
              if (hasSources && onPressSources) {
                onPressSources(sources);
              }
            }}
          />
        ) : null}

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

        {!isPending && !isFailed && Boolean(message.content) && (
          <View className="mt-3.5 flex-row flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
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

            {Boolean(onSpeak) && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onSpeak}
                accessibilityRole="button"
                accessibilityLabel={isSpeaking ? 'Stop audio' : 'Read aloud'}
                className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1.5 ${
                  isSpeaking
                    ? 'border border-amber-300 bg-amber-100 dark:border-amber-700 dark:bg-amber-900/40'
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
                    isSpeaking
                      ? 'font-inter-semibold text-amber-700 dark:text-amber-300'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {isSpeaking ? 'Stop' : 'Listen'}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleCopy}
              accessibilityRole="button"
              accessibilityLabel={isCopied ? 'Copied' : 'Copy to clipboard'}
              className={`flex-row items-center gap-1.5 rounded-full px-2.5 py-1.5 ${
                isCopied
                  ? 'border border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40'
                  : 'bg-slate-100 dark:bg-slate-700/60'
              }`}
            >
              {isCopied ? (
                <Check size={13} color="#10B981" />
              ) : (
                <Copy size={13} color="#64748B" />
              )}
              <Text
                className={`text-xs font-inter-medium ${
                  isCopied
                    ? 'font-inter-semibold text-emerald-700 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {isCopied ? 'Copied' : 'Copy'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="Share response"
              className="flex-row items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1.5 dark:bg-slate-700/60"
            >
              <Share2 size={13} color="#64748B" />
              <Text className="text-xs font-inter-medium text-slate-600 dark:text-slate-300">
                Share
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

