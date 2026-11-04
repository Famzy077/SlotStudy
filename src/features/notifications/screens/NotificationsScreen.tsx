import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Trophy, Flame, BookOpen, Bell, Brain, ArrowLeft } from 'lucide-react-native';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../hooks/useNotifications';
import { LoadingSkeleton } from '@/shared/components/ui/LoadingSkeleton';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { ErrorState } from '@/shared/components/feedback/ErrorState';
import { Notification } from '../types/notification.types';
import { ScreenWrapper } from '@/shared/components/layout/ScreenWrapper';

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const { data, isLoading, isError, refetch } = useNotifications();
  const { mutate: markAsRead } = useMarkAsRead();
  const { mutate: markAllAsRead, isPending: markingAllRead } = useMarkAllAsRead();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getIcon = (type: Notification['type']) => {
    switch(type) {
      case 'achievement': return <Trophy size={24} className="text-yellow-500" />;
      case 'streak': return <Flame size={24} className="text-orange-500" />;
      case 'course': return <BookOpen size={24} className="text-blue-500" />;
      case 'quiz': return <Brain size={24} className="text-purple-500" />;
      case 'system':
      default: return <Bell size={24} className="text-slate-500" />;
    }
  };

  if (isLoading) {
    return (
      <ScreenWrapper>
        <LoadingSkeleton className="flex-1 m-4" />
      </ScreenWrapper>
    );
  }

  if (isError) {
    return (
      <ScreenWrapper>
        <ErrorState message="An error occurred" onRetry={refetch} />
      </ScreenWrapper>
    );
  }

  const notifications = data?.data || [];

  return (
    <View className="flex-1 bg-surface dark:bg-slate-900">
      <View className="flex-row items-center justify-between p-4 pt-12 bg-white dark:bg-slate-900 shadow-sm z-10">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-3">
            <ArrowLeft size={24} className="text-slate-900 dark:text-slate-50" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">Notifications</Text>
        </View>
        <TouchableOpacity onPress={() => markAllAsRead()} disabled={markingAllRead}>
          <Text className="text-primary font-medium text-sm">Mark all read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={<EmptyState title="No notifications" message="You are all caught up!" />}
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity
            onPress={() => !item.isRead && markAsRead(item.id)}
            className={`flex-row p-4 border-b border-slate-100 dark:border-slate-800 ${
              !item.isRead ? 'bg-primary-50 dark:bg-slate-800 border-l-4 border-l-primary' : 'bg-white dark:bg-slate-900'
            }`}
          >
            <View className="mr-4 mt-1">{getIcon(item.type)}</View>
            <View className="flex-1">
              <Text className="text-base font-bold text-slate-900 dark:text-slate-50 mb-1">{item.title}</Text>
              <Text className="text-sm text-slate-600 dark:text-slate-400 mb-2">{item.message}</Text>
              <Text className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
