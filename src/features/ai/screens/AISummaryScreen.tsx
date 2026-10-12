import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Share2, CheckCircle, Copy } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ScreenWrapper } from '@/shared/components/layout/ScreenWrapper';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import { LoadingSkeleton } from '@/shared/components/ui/LoadingSkeleton';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { AppAlert as Alert } from '@/shared/components/feedback/AppAlert';
import { MarkdownRenderer } from '@/shared/components/markdown/MarkdownRenderer';
import { useSummary, useGenerateQuiz } from '../hooks/useSummary';

export default function AISummaryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const materialId = route.params?.materialId;

  const { data: response, isLoading, isError, error, refetch } = useSummary(materialId);
  const generateQuizMutation = useGenerateQuiz();

  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'Summary copied to clipboard');
  };

  const handleShare = async (title: string, content: string) => {
    try {
      await Share.share({
        title,
        message: `${title}\n\n${content}`,
      });
    } catch {
      // Ignore share error
    }
  };

  const handleGenerateQuiz = () => {
    if (!response?.data?.id) return;
    generateQuizMutation.mutate({ summaryId: response.data.id, numberOfQuestions: 5 }, {
      onSuccess: (res) => {
        // Assuming res.data.quizId is returned
        navigation.navigate('Quiz', { quizId: res.data.id });
      },
      onError: (err) => {
        Alert.alert('Error', err.message || 'Failed to generate quiz');
      }
    });
  };

  if (isLoading) {
    return (
      <ScreenWrapper padded={false}>
        <View className="flex-1 p-4 bg-surface dark:bg-slate-900">
          <LoadingSkeleton className="h-10 w-full mb-4" />
          <LoadingSkeleton className="h-40 w-full mb-4 rounded-3xl" />
          <LoadingSkeleton className="h-40 w-full rounded-3xl" />
        </View>
      </ScreenWrapper>
    );
  }

  if (isError || !response?.data) {
    return (
      <ScreenWrapper padded={false}>
        <ErrorState
          title="Failed to load summary"
          message={error?.message || 'Unknown error occurred'}
          onRetry={refetch}
        />
      </ScreenWrapper>
    );
  }

  const summary = response.data;
  const difficulty = summary.difficulty.toLowerCase();

  return (
    <ScreenWrapper padded={false}>
      <View className="flex-1 bg-surface dark:bg-slate-900">
        <View className="flex-row items-center justify-between p-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
            <Text className="text-primary font-bold">Back</Text>
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">AI Summary</Text>
          <TouchableOpacity
            onPress={() => handleShare(summary.title, summary.content)}
            accessibilityRole="button"
            accessibilityLabel="Share summary"
            className="p-2"
          >
            <Share2 size={24} className="text-slate-900 dark:text-slate-50" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4">
          <Animated.View entering={FadeIn}>
            <View className="bg-white dark:bg-slate-800 rounded-3xl p-6 mb-4 shadow-sm">
              <View className="flex-row justify-between items-start mb-4">
                <Text className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex-1 mr-4">
                  {summary.title}
                </Text>
                <TouchableOpacity onPress={() => handleCopy(summary.content)}>
                  <Copy size={20} className="text-slate-500" />
                </TouchableOpacity>
              </View>

              <View className="flex-row items-center mb-6 space-x-2">
                <Badge label={difficulty} variant={difficulty === 'advanced' ? 'error' : difficulty === 'intermediate' ? 'warning' : 'success'} />
                  
                
                <Text className="text-slate-500 text-sm ml-2">{summary.estimatedReadTime} min read</Text>
              </View>

              <View className="mb-6">
                <MarkdownRenderer content={summary.content} />
              </View>

              <Text className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-4">Key Points</Text>
              {summary.keyPoints?.map((point, index) => (
                <View key={index} className="flex-row items-start mb-3">
                  <CheckCircle size={20} className="text-success text-green-600 mr-3 mt-1" />
                  <Text className="text-slate-700 dark:text-slate-300 flex-1 leading-6">{point}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </ScrollView>

        <View className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700">
          <Button
            title="Generate Quiz"
            onPress={handleGenerateQuiz}
            loading={generateQuizMutation.isPending}
            className="w-full bg-primary"
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}