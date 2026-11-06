import React, { useState, useEffect, useCallback } from "react";
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
} from "react-native";
import {
  Search,
  School,
  UserPlus,
  X,
  ChevronDown,
  Check,
  Users,
} from "lucide-react-native";
import { useTheme } from "@/shared/hooks/useTheme";
import { studyBuddyService } from "../services/study-buddy.service";
import type { StudyBuddyStudent } from "../types/study-buddy.types";
import { StudentProfileModal } from "./StudentProfileModal";

const POPULAR_SCHOOLS = [
  "All Schools",
  "National Open University (NOUN)",
  "Miva Open University",
  "University of Lagos (UNILAG)",
  "University of Ibadan (UI)",
  "University of Nigeria, Nsukka (UNN)",
  "Ahmadu Bello University (ABU)",
];

export const DiscoverTab: React.FC = () => {
  const { colors } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<string>("All Schools");
  const [schoolPickerVisible, setSchoolPickerVisible] = useState(false);
  const [students, setStudents] = useState<StudyBuddyStudent[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const [profileTarget, setProfileTarget] = useState<StudyBuddyStudent | null>(null);

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
          !selectedSchool || selectedSchool === "All Schools"
            ? "all"
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
          setStudents((prev) => {
            const existingIds = new Set(prev.map((u) => u.id));
            const uniqueNew = data.users.filter((u) => !existingIds.has(u.id));
            return [...prev, ...uniqueNew];
          });
        }

        setHasMore(data.hasMore);
        setPage(data.page);
      } catch (err) {
        console.error("Failed to discover students:", err);
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
      setStudents((prev) =>
        prev.filter((student) => student.id !== targetUserId),
      );
    } catch (err: any) {
      console.warn("Failed to send friend request:", err.message);
    } finally {
      setSendingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    }
  };

  const displayedStudents = students.filter(
    (student) =>
      !student.friendshipStatus || student.friendshipStatus === "NONE",
  );

  const renderStudentCard = ({ item }: { item: StudyBuddyStudent }) => {
    const isSending = sendingIds.has(item.id);

    return (
      <View className="mb-3 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <View className="flex-row items-center">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`View ${item.name}'s profile`}
            onPress={() => setProfileTarget(item)}
            activeOpacity={0.75}
            className="mr-3 flex-1 flex-row items-center"
          >
            <View className="mr-3">
              {item.avatarUrl ? (
                <Image
                  source={{ uri: item.avatarUrl }}
                  className="h-11 w-11 rounded-full"
                />
              ) : (
                <View className="h-11 w-11 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40">
                  <Text className="text-base font-inter-bold text-indigo-700 dark:text-indigo-300">
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View className="mr-3 flex-1">
              <Text
                numberOfLines={1}
                className="font-inter-bold text-slate-900 dark:text-slate-50 text-base"
              >
                {item.name}
              </Text>
              {item.school ? (
                <View className="mt-0.5 flex-row items-center">
                  <School size={12} color="#64748b" />
                  <Text
                    numberOfLines={1}
                    className="ml-1 text-xs text-slate-500 dark:text-slate-400"
                  >
                    {item.school}
                  </Text>
                </View>
              ) : null}
              <Text className="mt-1 text-[11px] font-inter-semibold text-indigo-600 dark:text-indigo-400">
                View profile
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={isSending}
            onPress={() => handleSendFriendRequest(item.id)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Add ${item.name} as a study buddy`}
            className="min-h-10 flex-row items-center justify-center rounded-xl bg-indigo-600 px-3"
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <UserPlus size={14} color="#FFFFFF" />
                <Text className="ml-1.5 text-xs font-inter-semibold text-white">
                  Add
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`School filter: ${selectedSchool}`}
        onPress={() => setSchoolPickerVisible(true)}
        activeOpacity={0.8}
        className="mb-3.5 min-h-11 flex-row items-center rounded-xl border border-slate-200 bg-white px-3.5 dark:border-slate-800 dark:bg-slate-900"
      >
        <School size={16} color="#64748b" />
        <Text
          numberOfLines={1}
          className="ml-2 flex-1 text-sm font-inter-medium text-slate-700 dark:text-slate-200"
        >
          {selectedSchool}
        </Text>
        <ChevronDown size={17} color="#64748b" />
      </TouchableOpacity>

      {/* Students List */}
      {loading ? (
        <View className="flex-1 items-center justify-center py-16">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="mt-3 text-sm text-slate-500">
            Finding coursemates...
          </Text>
        </View>
      ) : (
        <FlatList<StudyBuddyStudent>
          data={displayedStudents}
          keyExtractor={(item) => item.id}
          renderItem={renderStudentCard}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
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
                {searchQuery
                  ? "No matching coursemates"
                  : "No coursemates found"}
              </Text>
              <Text className="mt-1.5 text-center text-xs text-slate-500 leading-5">
                Try another search or school, or invite a classmate to join you.
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={schoolPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSchoolPickerVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <View className="max-h-[75%] rounded-t-3xl bg-white px-5 pb-8 pt-5 dark:bg-slate-900">
            <View className="mb-3 flex-row items-center justify-between">
              <View>
                <Text className="text-lg font-inter-bold text-slate-900 dark:text-slate-50">
                  Choose a school
                </Text>
                <Text className="mt-0.5 text-xs font-inter-regular text-slate-500">
                  Filter coursemates by institution
                </Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close school filter"
                onPress={() => setSchoolPickerVisible(false)}
                className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
              >
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            </View>
            <FlatList<string>
              data={POPULAR_SCHOOLS}
              keyExtractor={(school: string) => school}
              renderItem={({ item: school }: { item: string }) => {
                const selected = selectedSchool === school;
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedSchool(school);
                      setSchoolPickerVisible(false);
                    }}
                    className={`min-h-12 flex-row items-center border-b border-slate-100 py-3 dark:border-slate-800 ${
                      selected ? "bg-indigo-50 dark:bg-indigo-950/30" : ""
                    }`}
                  >
                    <Text
                      className={`flex-1 text-sm ${
                        selected
                          ? "font-inter-semibold text-indigo-700 dark:text-indigo-300"
                          : "font-inter-medium text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {school}
                    </Text>
                    {selected && <Check size={18} color="#4F46E5" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>
      <StudentProfileModal
        student={profileTarget}
        isOnline={profileTarget?.isOnline ?? false}
        onClose={() => setProfileTarget(null)}
      />
    </View>
  );
};
