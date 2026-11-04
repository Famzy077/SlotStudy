import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MessageSquare, School, Check, CheckCheck } from 'lucide-react-native';
import { useTheme } from '@/shared/hooks/useTheme';
import { useSocket } from '@/shared/hooks/useSocket';
import { studyBuddyService } from '../services/study-buddy.service';
import type { ConversationItem } from '../types/study-buddy.types';

function formatChatTime(dateString: string | null): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

export const ChatsTab: React.FC<{
  onSelectConversation: (conversation: ConversationItem) => void;
}> = ({ onSelectConversation }) => {
  const { colors } = useTheme();
  const { isUserOnline, isUserTyping, addMessageListener } = useSocket();

  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await studyBuddyService.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();

    // Reorder & update last message when a real-time message arrives
    const unsubscribe = addMessageListener((msg) => {
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === msg.conversationId);
        if (index !== -1) {
          const updated = [...prev];
          const conv = { ...updated[index] };
          conv.lastMessage = msg.text;
          conv.lastMessageAt = msg.createdAt;
          // Increment unread count if message is incoming
          if (msg.senderId === conv.otherUser.id) {
            conv.unreadCount = (conv.unreadCount || 0) + 1;
          }
          updated.splice(index, 1);
          return [conv, ...updated];
        }
        // If not found in list, re-fetch
        fetchConversations(true);
        return prev;
      });
    });

    return () => unsubscribe();
  }, [fetchConversations, addMessageListener]);

  const renderConversationItem = ({ item }: { item: ConversationItem }) => {
    const isOnline = isUserOnline(item.otherUser.id);
    const isTyping = isUserTyping(item.otherUser.id);

    return (
      <TouchableOpacity
        onPress={() => onSelectConversation(item)}
        activeOpacity={0.7}
        className="mb-2.5 flex-row items-center rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Avatar with Online Dot */}
        <View className="relative mr-3">
          {item.otherUser.avatarUrl ? (
            <Image source={{ uri: item.otherUser.avatarUrl }} className="h-12 w-12 rounded-full" />
          ) : (
            <View className="h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40">
              <Text className="text-base font-inter-bold text-indigo-700 dark:text-indigo-300">
                {item.otherUser.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {isOnline && (
            <View className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
          )}
        </View>

        {/* Content */}
        <View className="flex-1 mr-2">
          <View className="flex-row items-center justify-between">
            <Text numberOfLines={1} className="font-inter-bold text-slate-900 dark:text-slate-50 text-sm flex-1 mr-2">
              {item.otherUser.name}
            </Text>
            <Text className="text-[11px] font-inter-medium text-slate-400">
              {formatChatTime(item.lastMessageAt)}
            </Text>
          </View>

          <View className="mt-1 flex-row items-center justify-between">
            {isTyping ? (
              <Text className="text-xs font-inter-semibold text-indigo-600 dark:text-indigo-400">
                Typing...
              </Text>
            ) : (
              <Text
                numberOfLines={1}
                className={`text-xs flex-1 mr-2 ${
                  item.unreadCount > 0
                    ? 'font-inter-semibold text-slate-900 dark:text-slate-100'
                    : 'font-inter-regular text-slate-500'
                }`}
              >
                {item.lastMessage || 'Connected. Say hello! 👋'}
              </Text>
            )}

            {item.unreadCount > 0 ? (
              <View className="h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-600 px-1.5">
                <Text className="text-[10px] font-inter-bold text-white">
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1">
      {loading ? (
        <View className="flex-1 items-center justify-center py-16">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchConversations(true)}
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-16 px-6">
              <View className="h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 dark:bg-indigo-900/30">
                <MessageSquare size={28} color="#4F46E5" />
              </View>
              <Text className="mt-4 text-center font-inter-bold text-base text-slate-800 dark:text-slate-100">
                No Active Chats Yet
              </Text>
              <Text className="mt-1.5 text-center text-xs text-slate-500 leading-5">
                Connect with coursemates in the Discover tab to start exchanging study notes and tips!
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};
