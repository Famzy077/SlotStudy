import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {
  ChevronLeft,
  Plus,
  BookOpen,
  MessageSquare,
  Trash2,
  Calendar,
  Sparkles,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenWrapper } from '@/shared/components/layout/ScreenWrapper';
import { AppAlert as Alert } from '@/shared/components/feedback/AppAlert';
import { useTheme } from '@/shared/hooks/useTheme';
import {
  useStudySessions,
  useDeleteStudySession,
} from '../hooks/useStudyRoom';
import { StudySession } from '../types/study-room.types';

export default function StudyRoomHistoryScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();

  const { data, isLoading, refetch, isRefetching } = useStudySessions({
    limit: 30,
  });
  const deleteMutation = useDeleteStudySession();

  const sessions = data?.data?.sessions ?? [];

  const handleDeleteSession = (session: StudySession) => {
    Alert.alert(
      'Delete Study Room',
      `Are you sure you want to delete "${session.title || 'this session'}"? Your study materials will not be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(session.id, {
              onError: (err) => {
                Alert.alert(
                  'Delete failed',
                  err instanceof Error ? err.message : 'Please try again.',
                );
              },
            });
          },
        },
      ],
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <ScreenWrapper scroll={false} padded={false}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-slate-100 px-6 pb-4 pt-2 dark:border-slate-800">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={22} color="#64748B" />
        </TouchableOpacity>
        <Text className="text-lg font-inter-bold text-slate-900 dark:text-slate-50">
          Study Room Sessions
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('StudyRoomSetup', {})}
          className="h-10 w-10 items-center justify-center rounded-full bg-primary"
          accessibilityRole="button"
          accessibilityLabel="New session"
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingVertical: 16,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('StudyRoom', { sessionId: item.id })
              }
              className="mb-3.5 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800"
            >
              <View className="mb-2 flex-row items-center justify-between">
                <Text
                  numberOfLines={1}
                  className="flex-1 text-base font-inter-bold text-slate-900 dark:text-slate-50"
                >
                  {item.title || 'Untitled Session'}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDeleteSession(item)}
                  accessibilityRole="button"
                  accessibilityLabel="Delete session"
                  className="h-8 w-8 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-700/60"
                >
                  <Trash2 size={15} color="#EF4444" />
                </TouchableOpacity>
              </View>

              {item.course && (
                <View className="mb-2 self-start rounded-full bg-blue-50 px-2.5 py-0.5 dark:bg-blue-900/30">
                  <Text className="text-xs font-inter-medium text-primary">
                    {item.course.title}
                  </Text>
                </View>
              )}

              <View className="mt-2 flex-row items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-700/60">
                <View className="flex-row items-center gap-3">
                  <View className="flex-row items-center gap-1">
                    <BookOpen size={13} color="#94A3B8" />
                    <Text className="text-xs font-inter-regular text-slate-500">
                      {item.materials?.length ?? 0} materials
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <MessageSquare size={13} color="#94A3B8" />
                    <Text className="text-xs font-inter-regular text-slate-500">
                      {item._count?.messages ?? 0} messages
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center gap-1">
                  <Calendar size={12} color="#94A3B8" />
                  <Text className="text-xs font-inter-regular text-slate-400">
                    {formatDate(item.updatedAt)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-4 py-16">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 dark:bg-blue-900/40">
                <Sparkles size={32} color={colors.primary} />
              </View>
              <Text className="mb-1 text-center text-lg font-inter-bold text-slate-900 dark:text-slate-50">
                No Study Rooms Yet
              </Text>
              <Text className="mb-6 text-center text-xs font-inter-regular leading-relaxed text-slate-500">
                Create a study session with your lecture notes and slide decks to chat with your grounded AI tutor.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('StudyRoomSetup', {})}
                className="rounded-2xl bg-primary px-6 py-3.5"
              >
                <Text className="text-sm font-inter-bold text-white">
                  Start First Session
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </ScreenWrapper>
  );
}
