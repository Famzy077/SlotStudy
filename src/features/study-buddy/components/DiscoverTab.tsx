import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import {
  Search,
  School,
  BookOpen,
  UserPlus,
  Check,
  Clock,
  X,
  Users,
  AlertTriangle,
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

type StatusFilter = 'all' | 'pending' | 'available';

export const DiscoverTab: React.FC = () => {
  const { colors } = useTheme();
  const { isUserOnline } = useSocket();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<string>('All Schools');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [students, setStudents] = useState<StudyBuddyStudent[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingUserIds, setPendingUserIds] = useState<Set<string>>(new Set());
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const [cancelTarget, setCancelTarget] = useState<StudyBuddyStudent | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const matchesClientFilters = useCallback(
    (user: StudyBuddyStudent) => {
      if (selectedSchool && selectedSchool !== 'All Schools') {
        const userSchool = (user.school || '').toLowerCase();
        const cleanFilter = selectedSchool.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
        const parenMatch = selectedSchool.match(/\(([^)]+)\)/);
        const alias = parenMatch ? parenMatch[1].trim().toLowerCase() : '';
        const matchesSchool =
          (cleanFilter && userSchool.includes(cleanFilter)) ||
          (alias && userSchool.includes(alias)) ||
          (alias === 'noun' && userSchool.includes('national open university')) ||
          (alias === 'unilag' && userSchool.includes('university of lagos')) ||
          (alias === 'ui' && userSchool.includes('university of ibadan')) ||
          (alias === 'unn' && userSchool.includes('university of nigeria'));
        if (!matchesSchool) return false;
      }

      if (debouncedSearch.trim()) {
        const q = debouncedSearch.trim().toLowerCase();
        const inName = user.name.toLowerCase().includes(q);
        const inBio = (user.bio || '').toLowerCase().includes(q);
        const inSchool = (user.school || '').toLowerCase().includes(q);
        const inCourses = (user.courses || []).some((c) => c.toLowerCase().includes(q));
        if (!inName && !inBio && !inSchool && !inCourses) return false;
      }

      return true;
    },
    [selectedSchool, debouncedSearch],
  );

  const fetchStudents = useCallback(
    async (pageNum = 1, isRefresh = false) => {
      try {
        if (pageNum === 1 && !isRefresh) setLoading(true);
        if (pageNum > 1) setLoadingMore(true);

        const schoolParam =
          !selectedSchool || selectedSchool === 'All Schools'
            ? 'all'
            : selectedSchool;

        const [data, requestsData] = await Promise.all([
          studyBuddyService.discover({
            school: schoolParam,
            q: debouncedSearch.trim() || undefined,
            page: pageNum,
            limit: 15,
          }),
          pageNum === 1
            ? studyBuddyService.getRequests().catch(() => ({ incoming: [], outgoing: [] }))
            : Promise.resolve(null),
        ]);

        let sentIds = pendingUserIds;
        let receivedIds = new Set<string>();

        if (requestsData) {
          sentIds = new Set(requestsData.outgoing.map((r) => r.user.id));
          receivedIds = new Set(requestsData.incoming.map((r) => r.user.id));
          setPendingUserIds(sentIds);
        }

        const enrichedDiscoverUsers: StudyBuddyStudent[] = data.users.map((u) => {
          if (sentIds.has(u.id) || u.friendshipStatus === 'PENDING_SENT') {
            return { ...u, friendshipStatus: 'PENDING_SENT' };
          }
          if (receivedIds.has(u.id) || u.friendshipStatus === 'PENDING_RECEIVED') {
            return { ...u, friendshipStatus: 'PENDING_RECEIVED' };
          }
          return u;
        });

        if (pageNum === 1) {
          // Ensure outgoing pending users are also visible in Discover even if backend filtered them
          const existingIds = new Set(enrichedDiscoverUsers.map((u) => u.id));
          const extraOutgoingUsers: StudyBuddyStudent[] = (requestsData?.outgoing || [])
            .map((r) => ({
              ...r.user,
              friendshipStatus: 'PENDING_SENT' as const,
              friendshipId: r.id,
            }))
            .filter((u) => !existingIds.has(u.id) && matchesClientFilters(u));

          setStudents([...extraOutgoingUsers, ...enrichedDiscoverUsers]);
        } else {
          setStudents((prev) => {
            const existingIds = new Set(prev.map((u) => u.id));
            const uniqueNew = enrichedDiscoverUsers.filter((u) => !existingIds.has(u.id));
            return [...prev, ...uniqueNew];
          });
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
    [selectedSchool, debouncedSearch, matchesClientFilters],
  );

  useEffect(() => {
    fetchStudents(1);
  }, [fetchStudents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStudents(1, true);
  };

  const onEndReached = () => {
    if (!loading && !loadingMore && hasMore && statusFilter === 'all') {
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
      setCancelTarget(null);
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

  const pendingCount = useMemo(
    () =>
      students.filter(
        (s) => s.friendshipStatus === 'PENDING_SENT' || pendingUserIds.has(s.id),
      ).length,
    [students, pendingUserIds],
  );

  const displayedStudents = useMemo(() => {
    return students.filter((s) => {
      const isPending =
        s.friendshipStatus === 'PENDING_SENT' || pendingUserIds.has(s.id);
      if (statusFilter === 'pending') return isPending;
      if (statusFilter === 'available') return !isPending;
      return true;
    });
  }, [students, pendingUserIds, statusFilter]);

  const renderStudentCard = ({ item }: { item: StudyBuddyStudent }) => {
    const isOnline = isUserOnline(item.id);
    const isPendingSent =
      item.friendshipStatus === 'PENDING_SENT' || pendingUserIds.has(item.id);
    const isPendingReceived = item.friendshipStatus === 'PENDING_RECEIVED';
    const isSending = sendingIds.has(item.id);

    return (
      <View
        className={`mb-3.5 rounded-2xl border p-4 shadow-sm ${
          isPendingSent
            ? 'border-amber-200/90 bg-white dark:border-amber-800/50 dark:bg-slate-900'
            : 'border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900'
        }`}
      >
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
              <View className="flex-row items-center rounded-xl bg-amber-50 px-2.5 py-1.5 dark:bg-amber-900/30">
                <Clock size={12} color="#D97706" />
                <Text className="ml-1 text-xs font-inter-bold text-amber-700 dark:text-amber-400">
                  Pending
                </Text>
              </View>
              <TouchableOpacity
                disabled={isSending}
                onPress={() => setCancelTarget(item)}
                activeOpacity={0.8}
                className="flex-row items-center rounded-xl border border-rose-200 bg-rose-50/70 px-2.5 py-1.5 dark:border-rose-800/60 dark:bg-rose-950/30"
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#e11d48" />
                ) : (
                  <>
                    <X size={12} color="#e11d48" />
                    <Text className="ml-1 text-xs font-inter-semibold text-rose-600 dark:text-rose-400">
                      Cancel
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : isPendingReceived ? (
            <View className="flex-row items-center rounded-xl bg-emerald-50 px-3 py-2 dark:bg-emerald-900/20">
              <Check size={14} color="#059669" />
              <Text className="ml-1 text-xs font-inter-semibold text-emerald-700 dark:text-emerald-400">
                Sent You Request
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
                  <Text className="ml-1.5 text-xs font-inter-semibold text-white">Add Friend</Text>
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

        {/* Pending Confirmation Footer */}
        {isPendingSent && (
          <View className="mt-3 flex-row items-center justify-between border-t border-amber-100 pt-2.5 dark:border-amber-900/30">
            <View className="flex-row items-center flex-1 mr-2">
              <Clock size={12} color="#D97706" />
              <Text numberOfLines={1} className="ml-1.5 text-[11px] font-inter-medium text-amber-700 dark:text-amber-400">
                Request sent to {item.name.split(' ')[0]} • Waiting for approval
              </Text>
            </View>
            <TouchableOpacity
              disabled={isSending}
              onPress={() => setCancelTarget(item)}
              activeOpacity={0.7}
            >
              <Text className="text-[11px] font-inter-bold text-rose-600 dark:text-rose-400">
                Cancel Request
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1">
      {/* Search Bar */}
      <View className="mb-2.5 flex-row items-center rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
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
      <View className="mb-2.5">
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

      {/* Status Filter Bar: All | Pending Sent | Available */}
      <View className="mb-3.5 flex-row rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        <TouchableOpacity
          onPress={() => setStatusFilter('all')}
          className={`flex-1 flex-row items-center justify-center rounded-lg py-1.5 ${
            statusFilter === 'all' ? 'bg-white shadow-sm dark:bg-slate-900' : ''
          }`}
        >
          <Text
            className={`text-xs font-inter-bold ${
              statusFilter === 'all'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            All ({students.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setStatusFilter('pending')}
          className={`flex-1 flex-row items-center justify-center rounded-lg py-1.5 ${
            statusFilter === 'pending' ? 'bg-white shadow-sm dark:bg-slate-900' : ''
          }`}
        >
          <Clock
            size={12}
            color={statusFilter === 'pending' ? '#D97706' : '#64748b'}
          />
          <Text
            className={`ml-1 text-xs font-inter-bold ${
              statusFilter === 'pending'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Pending ({pendingCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setStatusFilter('available')}
          className={`flex-1 flex-row items-center justify-center rounded-lg py-1.5 ${
            statusFilter === 'available' ? 'bg-white shadow-sm dark:bg-slate-900' : ''
          }`}
        >
          <Text
            className={`text-xs font-inter-bold ${
              statusFilter === 'available'
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Available ({Math.max(0, students.length - pendingCount)})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Students List */}
      {loading ? (
        <View className="flex-1 items-center justify-center py-16">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-3 text-sm text-slate-500">Finding coursemates...</Text>
        </View>
      ) : (
        <FlatList
          data={displayedStudents}
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
                {statusFilter === 'pending'
                  ? 'No Pending Requests Sent'
                  : 'No Study Buddies Found'}
              </Text>
              <Text className="mt-1.5 text-center text-xs text-slate-500 leading-5">
                {statusFilter === 'pending'
                  ? 'Students you send a friend request to will appear here while waiting for their approval.'
                  : 'Try searching with a different school filter or invite your classmates using your referral link!'}
              </Text>
            </View>
          }
        />
      )}

      {/* Cancel Request Confirmation Modal */}
      <Modal
        visible={Boolean(cancelTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!cancelTarget || !sendingIds.has(cancelTarget.id)) {
            setCancelTarget(null);
          }
        }}
      >
        <View className="flex-1 items-center justify-center bg-black/50 px-6">
          <View className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <View className="items-center">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 dark:bg-rose-950/40">
                <AlertTriangle size={28} color="#e11d48" />
              </View>

              <Text className="mt-4 text-center font-inter-bold text-lg text-slate-900 dark:text-slate-50">
                Cancel Friend Request?
              </Text>

              <Text className="mt-2 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
                Are you sure you want to cancel the friend request sent to{' '}
                <Text className="font-inter-bold text-slate-800 dark:text-slate-200">
                  {cancelTarget?.name}
                </Text>
                ? You can always send a new request later.
              </Text>
            </View>

            <View className="mt-6 flex-row gap-3">
              <TouchableOpacity
                disabled={Boolean(cancelTarget && sendingIds.has(cancelTarget.id))}
                onPress={() => setCancelTarget(null)}
                activeOpacity={0.8}
                className="flex-1 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 py-3 dark:border-slate-700 dark:bg-slate-800"
              >
                <Text className="text-xs font-inter-bold text-slate-700 dark:text-slate-200">
                  Keep Request
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={Boolean(cancelTarget && sendingIds.has(cancelTarget.id))}
                onPress={() => cancelTarget && handleCancelFriendRequest(cancelTarget.id)}
                activeOpacity={0.8}
                className="flex-1 flex-row items-center justify-center rounded-xl bg-rose-600 py-3 active:bg-rose-700"
              >
                {cancelTarget && sendingIds.has(cancelTarget.id) ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-xs font-inter-bold text-white">
                    Yes, Cancel
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
