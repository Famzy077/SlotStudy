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
import { Check, X, Clock, School, UserCheck, Inbox } from 'lucide-react-native';
import { useTheme } from '@/shared/hooks/useTheme';
import { useSocket } from '@/shared/hooks/useSocket';
import { studyBuddyService } from '../services/study-buddy.service';
import type { FriendRequestItem } from '../types/study-buddy.types';

export const RequestsTab: React.FC<{ onNavigateToChat?: (conversationId: string) => void }> = ({
  onNavigateToChat,
}) => {
  const { colors } = useTheme();
  const { isUserOnline, addNotificationListener } = useSocket();

  const [segment, setSegment] = useState<'incoming' | 'outgoing'>('incoming');
  const [incoming, setIncoming] = useState<FriendRequestItem[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchRequests = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await studyBuddyService.getRequests();
      setIncoming(data.incoming);
      setOutgoing(data.outgoing);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();

    // Listen for live friend request socket notifications
    const unsubscribe = addNotificationListener((notif) => {
      if (notif.type.includes('friend')) {
        fetchRequests(true);
      }
    });

    return () => unsubscribe();
  }, [fetchRequests, addNotificationListener]);

  const handleAccept = async (requestId: string) => {
    try {
      setActioningId(requestId);
      const res = await studyBuddyService.acceptFriendRequest(requestId);
      setIncoming((prev) => prev.filter((r) => r.id !== requestId));
      if (res.conversationId && onNavigateToChat) {
        onNavigateToChat(res.conversationId);
      }
    } catch (err: any) {
      console.warn('Failed to accept request:', err.message);
    } finally {
      setActioningId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      setActioningId(requestId);
      await studyBuddyService.declineFriendRequest(requestId);
      setIncoming((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err: any) {
      console.warn('Failed to decline request:', err.message);
    } finally {
      setActioningId(null);
    }
  };

  const handleCancelOutgoing = async (requestId: string, targetUserId: string) => {
    try {
      setActioningId(requestId);
      await studyBuddyService.unfriend(targetUserId);
      setOutgoing((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err: any) {
      console.warn('Failed to cancel request:', err.message);
    } finally {
      setActioningId(null);
    }
  };

  const renderIncomingItem = ({ item }: { item: FriendRequestItem }) => {
    const isOnline = isUserOnline(item.user.id);
    const isBusy = actioningId === item.id;

    return (
      <View className="mb-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <View className="flex-row items-center">
          <View className="relative mr-3">
            {item.user.avatarUrl ? (
              <Image source={{ uri: item.user.avatarUrl }} className="h-12 w-12 rounded-full" />
            ) : (
              <View className="h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40">
                <Text className="text-base font-inter-bold text-indigo-700 dark:text-indigo-300">
                  {item.user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {isOnline && (
              <View className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
            )}
          </View>

          <View className="flex-1">
            <Text numberOfLines={1} className="font-inter-bold text-slate-900 dark:text-slate-50 text-base">
              {item.user.name}
            </Text>
            {item.user.school ? (
              <View className="mt-0.5 flex-row items-center">
                <School size={12} color="#64748b" />
                <Text numberOfLines={1} className="ml-1 text-xs text-slate-500">
                  {item.user.school}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {item.user.bio ? (
          <Text numberOfLines={2} className="mt-2 text-xs text-slate-600 dark:text-slate-300">
            {item.user.bio}
          </Text>
        ) : null}

        {/* Accept / Decline Action Buttons */}
        <View className="mt-3.5 flex-row gap-2">
          <TouchableOpacity
            disabled={isBusy}
            onPress={() => handleAccept(item.id)}
            activeOpacity={0.8}
            className="flex-1 flex-row items-center justify-center rounded-xl bg-indigo-600 py-2.5 px-3"
          >
            {isBusy ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Check size={16} color="#FFFFFF" />
                <Text className="ml-1.5 text-xs font-inter-semibold text-white">Accept</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            disabled={isBusy}
            onPress={() => handleDecline(item.id)}
            activeOpacity={0.8}
            className="flex-row items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800"
          >
            <X size={16} color="#64748b" />
            <Text className="ml-1.5 text-xs font-inter-semibold text-slate-600 dark:text-slate-300">
              Decline
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderOutgoingItem = ({ item }: { item: FriendRequestItem }) => {
    const isBusy = actioningId === item.id;

    return (
      <View className="mb-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1 mr-3">
            <View className="mr-3">
              {item.user.avatarUrl ? (
                <Image source={{ uri: item.user.avatarUrl }} className="h-11 w-11 rounded-full" />
              ) : (
                <View className="h-11 w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <Text className="text-sm font-inter-bold text-slate-700 dark:text-slate-300">
                    {item.user.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-1">
              <Text numberOfLines={1} className="font-inter-bold text-slate-900 dark:text-slate-50 text-sm">
                {item.user.name}
              </Text>
              <View className="mt-0.5 flex-row items-center">
                <Clock size={11} color="#f59e0b" />
                <Text className="ml-1 text-[11px] font-inter-medium text-amber-600 dark:text-amber-400">
                  Waiting for response
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            disabled={isBusy}
            onPress={() => handleCancelOutgoing(item.id, item.user.id)}
            activeOpacity={0.8}
            className="rounded-xl border border-slate-200 px-3 py-1.5 dark:border-slate-800"
          >
            {isBusy ? (
              <ActivityIndicator size="small" color="#64748b" />
            ) : (
              <Text className="text-xs font-inter-medium text-slate-600 dark:text-slate-400">
                Cancel
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const listData = segment === 'incoming' ? incoming : outgoing;

  return (
    <View className="flex-1">
      {/* Segment Switcher */}
      <View className="mb-4 flex-row rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
        <TouchableOpacity
          onPress={() => setSegment('incoming')}
          className={`flex-1 flex-row items-center justify-center rounded-xl py-2 ${
            segment === 'incoming' ? 'bg-white shadow-sm dark:bg-slate-900' : ''
          }`}
        >
          <Text
            className={`text-xs font-inter-bold ${
              segment === 'incoming'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Received ({incoming.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSegment('outgoing')}
          className={`flex-1 flex-row items-center justify-center rounded-xl py-2 ${
            segment === 'outgoing' ? 'bg-white shadow-sm dark:bg-slate-900' : ''
          }`}
        >
          <Text
            className={`text-xs font-inter-bold ${
              segment === 'outgoing'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Sent ({outgoing.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View className="flex-1 items-center justify-center py-16">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          renderItem={segment === 'incoming' ? renderIncomingItem : renderOutgoingItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchRequests(true)} />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-16 px-6">
              <View className="h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 dark:bg-slate-800">
                <Inbox size={28} color="#94a3b8" />
              </View>
              <Text className="mt-4 text-center font-inter-bold text-base text-slate-800 dark:text-slate-100">
                {segment === 'incoming' ? 'No Friend Requests' : 'No Pending Requests'}
              </Text>
              <Text className="mt-1.5 text-center text-xs text-slate-500 leading-5">
                {segment === 'incoming'
                  ? 'When coursemates send you a study buddy request, they will show up here.'
                  : 'You have no outgoing requests waiting for response.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};
