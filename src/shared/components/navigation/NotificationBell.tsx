import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Bell, CheckCheck, X, UserCheck, MessageSquare } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSocket, type SocketNotification } from '@/shared/hooks/useSocket';
import { studyBuddyService } from '@/features/study-buddy/services/study-buddy.service';

export const NotificationBell: React.FC = () => {
  const navigation = useNavigation<any>();
  const { notifications, unreadNotificationCount, clearNotificationBadge } = useSocket();
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [marking, setMarking] = useState(false);

  const handleOpen = () => {
    setDropdownVisible(true);
  };

  const handleMarkAllRead = async () => {
    try {
      setMarking(true);
      await studyBuddyService.markNotificationsRead();
      clearNotificationBadge();
    } catch (err) {
      console.warn('Failed to mark notifications read:', err);
    } finally {
      setMarking(false);
    }
  };

  const renderIcon = (type: string) => {
    if (type.includes('friend')) return <UserCheck size={16} color="#4F46E5" />;
    if (type.includes('message')) return <MessageSquare size={16} color="#06B6D4" />;
    return <Bell size={16} color="#F59E0B" />;
  };

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        onPress={handleOpen}
        activeOpacity={0.8}
        className="relative h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <Bell size={19} color="#475569" />
        {unreadNotificationCount > 0 && (
          <View className="absolute -top-1 -right-1 h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1 border-2 border-white dark:border-slate-900">
            <Text className="text-[10px] font-inter-bold text-white">
              {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Notifications Dropdown Modal */}
      <Modal visible={dropdownVisible} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
          className="flex-1 bg-black/40 pt-16 px-4"
        >
          <View className="rounded-3xl bg-white p-4 shadow-2xl dark:bg-slate-900 max-h-[75%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <View className="flex-row items-center">
                <Text className="font-inter-bold text-base text-slate-900 dark:text-slate-50">
                  Notifications
                </Text>
                {unreadNotificationCount > 0 && (
                  <View className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 dark:bg-indigo-900/40">
                    <Text className="text-[11px] font-inter-bold text-indigo-600 dark:text-indigo-400">
                      {unreadNotificationCount} new
                    </Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center gap-2">
                {unreadNotificationCount > 0 && (
                  <TouchableOpacity
                    disabled={marking}
                    onPress={handleMarkAllRead}
                    className="flex-row items-center rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800"
                  >
                    {marking ? (
                      <ActivityIndicator size="small" color="#4F46E5" />
                    ) : (
                      <>
                        <CheckCheck size={12} color="#4F46E5" />
                        <Text className="ml-1 text-[11px] font-inter-semibold text-indigo-600 dark:text-indigo-400">
                          Mark read
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  onPress={() => setDropdownVisible(false)}
                  className="h-7 w-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
                >
                  <X size={14} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>

            {/* List */}
            {notifications.length === 0 ? (
              <View className="py-10 items-center justify-center">
                <Bell size={28} color="#94a3b8" />
                <Text className="mt-2 text-xs font-inter-medium text-slate-400">
                  No new live notifications
                </Text>
              </View>
            ) : (
              <FlatList
                data={notifications.slice(0, 10)}
                keyExtractor={(item) => item.id}
                renderItem={({ item }: { item: SocketNotification }) => (
                  <View className="py-3 border-b border-slate-100 dark:border-slate-800/60 flex-row items-start">
                    <View className="mr-3 h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                      {renderIcon(item.type)}
                    </View>
                    <View className="flex-1">
                      <Text className="font-inter-semibold text-xs text-slate-900 dark:text-slate-50">
                        {item.title}
                      </Text>
                      <Text numberOfLines={2} className="mt-0.5 text-xs text-slate-500 leading-4">
                        {item.message}
                      </Text>
                    </View>
                  </View>
                )}
              />
            )}

            <TouchableOpacity
              onPress={() => {
                setDropdownVisible(false);
                navigation.navigate('Notifications');
              }}
              className="mt-3 rounded-2xl bg-slate-100 py-2.5 items-center dark:bg-slate-800"
            >
              <Text className="text-xs font-inter-semibold text-slate-700 dark:text-slate-300">
                View All Activity
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};
