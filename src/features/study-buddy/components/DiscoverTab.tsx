import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  Search,
  School,
  BookOpen,
  UserPlus,
  Check,
  Clock,
  Sparkles,
  Users,
} from 'lucide-react-native';
import { useTheme } from '@/shared/hooks/useTheme';
import { useSocket } from '@/shared/hooks/useSocket';
import { studyBuddyService } from '../services/study-buddy.service';
import type { StudyBuddyStudent } from '../types/study-buddy.types';

const POPULAR_SCHOOLS = [
  'All Schools',
  'National Open University (NOUN)',
  'Miva Open University',
  'University of Lagos (UNILAG)',
  'University of Ibadan (UI)',
  'University of Nigeria, Nsukka (UNN)',
  'Ahmadu Bello University (ABU)',
];

export const DiscoverTab: React.FC = () => {
  const { colors } = useTheme();
  const { isUserOnline } = useSocket();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<string>('All Schools');
  const [students, setStudents] = useState<StudyBuddyStudent[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingUserIds, setPendingUserIds] = useState<Set<string>>(new Set());
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchStudents = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      try {
        if (pageNum === 1 && !isRefresh) setLoading(true);
        if (pageNum > 1) setLoadingMore(true);

        const schoolParam =
          !selectedSchool || selectedSchool === 'All Schools'
            ? 'all'
            : selectedSchool;

        const data = await studyBuddyService.discover({
          school: schoolParam,
          q: debouncedSearch.trim() || undefined,
          page: pageNum,
          limit: 15,
        });

        if (pageNum === 1) {
          setStudents(data.users);
        } else {
          setStudents((prev) => [...prev, ...data.users]);
        }
        setHasMore(data.hasMore);
        setPage(data.page);
      } catch (err) {
        console.error('Failed to discover students:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [selectedSchool, debouncedSearch],
  );

  useEffect(() => {
    fetchStudents(1);
  }, [fetchStudents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStudents(1, true);
  };

  const onEndReached = () => {
    if (!loading && !loadingMore && hasMore) {
      fetchStudents(page + 1);
    }
  };

  const handleSendFriendRequest = async (targetUserId: string) => {
    try {
      setSendingIds((prev) => new Set(prev).add(targetUserId));
      await studyBuddyService.sendFriendRequest(targetUserId);
      setPendingUserIds((prev) => new Set(prev).add(targetUserId));
      setStudents((prev) =>
        prev.map((s) => (s.id === targetUserId ? { ...s, friendshipStatus: 'PENDING_SENT' } : s)),
      );
    } catch (err: any) {
      console.warn('Failed to send friend request:', err.message);
    } finally {
      setSendingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    }
  };

  const handleCancelFriendRequest = async (targetUserId: string) => {
    try {
      setSendingIds((prev) => new Set(prev).add(targetUserId));
      await studyBuddyService.unfriend(targetUserId);
      setPendingUserIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
      setStudents((prev) =>
        prev.map((s) => (s.id === targetUserId ? { ...s, friendshipStatus: 'NONE', friendshipId: null } : s)),
      );
    } catch (err: any) {
      console.warn('Failed to cancel friend request:', err.message);
    } finally {
      setSendingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    }
  };

  const renderStudentCard = ({ item }: { item: StudyBuddyStudent }) => {
    const isOnline = isUserOnline(item.id);
    const isPendingSent =
      item.friendshipStatus === 'PENDING_SENT' || pendingUserIds.has(item.id);
    const isPendingReceived = item.friendshipStatus === 'PENDING_RECEIVED';
    const isSending = sendingIds.has(item.id);

    return (
      <View className="mb-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-center flex-1 mr-3">
            {/* Avatar with Online Dot */}
            <View className="relative mr-3">
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} className="h-12 w-12 rounded-full" />
              ) : (
                <View className="h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40">
                  <Text className="text-base font-inter-bold text-indigo-700 dark:text-indigo-300">
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              {isOnline && (
                <View className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
              )}
            </View>

            <View className="flex-1">
              <Text numberOfLines={1} className="font-inter-bold text-slate-900 dark:text-slate-50 text-base">
                {item.name}
              </Text>
              {item.school ? (
                <View className="mt-0.5 flex-row items-center">
                  <School size={12} color="#64748b" />
                  <Text numberOfLines={1} className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                    {item.school}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Action Button */}
          {isPendingSent ? (
            <View className="flex-row items-center gap-1.5">
              <View className="flex-row items-center rounded-xl bg-amber-50 px-2.5 py-2 dark:bg-amber-900/20">
                <Clock size={13} color="#D97706" />
                <Text className="ml-1 text-xs font-inter-semibold text-amber-700 dark:text-amber-400">
                  Pending
                </Text>
              </View>
              <TouchableOpacity
                disabled={isSending}
                onPress={() => handleCancelFriendRequest(item.id)}
                activeOpacity={0.8}
                className="rounded-xl border border-slate-200 px-2.5 py-2 dark:border-slate-700"
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#64748b" />
                ) : (
                  <Text className="text-xs font-inter-medium text-slate-500 dark:text-slate-400">
                    Cancel
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : isPendingReceived ? (
            <View className="flex-row items-center rounded-xl bg-emerald-50 px-3 py-2 dark:bg-emerald-900/20">
              <Check size={14} color="#059669" />
              <Text className="ml-1 text-xs font-inter-semibold text-emerald-700 dark:text-emerald-400">
                Sent Request
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              disabled={isSending}
              onPress={() => handleSendFriendRequest(item.id)}
              activeOpacity={0.8}
              className="flex-row items-center rounded-xl bg-indigo-600 px-3 py-2 active:bg-indigo-700"
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <UserPlus size={14} color="#FFFFFF" />
                  <Text className="ml-1.5 text-xs font-inter-semibold text-white">Add</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Bio */}
        {item.bio ? (
          <Text numberOfLines={2} className="mt-2.5 text-xs leading-4 text-slate-600 dark:text-slate-300">
            {item.bio}
          </Text>
        ) : null}

        {/* Courses Chips */}
        {item.courses && item.courses.length > 0 ? (
          <View className="mt-3 flex-row flex-wrap gap-1.5">
            {item.courses.slice(0, 3).map((c, idx) => (
              <View
                key={idx}
                className="flex-row items-center rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800"
              >
                <BookOpen size={11} color="#64748b" />
                <Text numberOfLines={1} className="ml-1 text-[11px] font-inter-medium text-slate-700 dark:text-slate-300">
                  {c}
                </Text>
              </View>
            ))}
            {item.courses.length > 3 && (
              <View className="rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800">
                <Text className="text-[11px] font-inter-medium text-slate-500">
                  +{item.courses.length - 3} more
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View className="flex-1">
      {/* Search Bar */}
      <View className="mb-3 flex-row items-center rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <Search size={18} color="#94a3b8" />
        <TextInput
          placeholder="Search by student name or bio..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="ml-2 flex-1 text-sm font-inter-regular text-slate-900 dark:text-slate-50"
          returnKeyType="search"
        />
      </View>

      {/* School Filter Chips */}
      <View className="mb-4">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={POPULAR_SCHOOLS}
          keyExtractor={(item) => item}
          renderItem={({ item }: { item: string }) => {
            const isSelected = selectedSchool === item || (!selectedSchool && item === 'All Schools');
            return (
              <TouchableOpacity
                onPress={() => setSelectedSchool(item === 'All Schools' ? 'All Schools' : item)}
                className={`mr-2 rounded-xl px-3.5 py-1.5 ${
                  isSelected
                    ? 'bg-indigo-600'
                    : 'border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <Text
                  className={`text-xs font-inter-semibold ${
                    isSelected ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Students List */}
      {loading ? (
        <View className="flex-1 items-center justify-center py-16">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-3 text-sm text-slate-500">Finding coursemates...</Text>
        </View>
      ) : (
        <FlatList
          data={students}
          keyExtractor={(item) => item.id}
          renderItem={renderStudentCard}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-16 px-6">
              <View className="h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 dark:bg-indigo-900/30">
                <Users size={32} color="#4F46E5" />
              </View>
              <Text className="mt-4 text-center font-inter-bold text-base text-slate-800 dark:text-slate-100">
                No Study Buddies Found
              </Text>
              <Text className="mt-1.5 text-center text-xs text-slate-500 leading-5">
                Try searching with a different school filter or invite your classmates using your referral link!
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};
