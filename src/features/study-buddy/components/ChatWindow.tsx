import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import {
  ArrowLeft,
  Send,
  MoreVertical,
  Check,
  CheckCheck,
  AlertTriangle,
  UserX,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/shared/hooks/useTheme';
import { useSocket } from '@/shared/hooks/useSocket';
import { studyBuddyService } from '../services/study-buddy.service';
import type { ChatMessage, StudyBuddyStudent } from '../types/study-buddy.types';
import { StudentProfileModal } from './StudentProfileModal';

interface ChatWindowProps {
  conversationId: string;
  otherUser: StudyBuddyStudent;
  onBack: () => void;
  onUnfriendedOrBlocked?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  conversationId,
  otherUser,
  onBack,
  onUnfriendedOrBlocked,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const {
    sendMessage,
    markConversationRead,
    startTyping,
    stopTyping,
    isUserOnline,
    isUserTyping,
    addMessageListener,
  } = useSocket();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOnline = isUserOnline(otherUser.id);
  const isTyping = isUserTyping(otherUser.id);

  const fetchMessages = useCallback(
    async (cursor?: string) => {
      try {
        if (!cursor) setLoading(true);
        else setLoadingMore(true);

        const data = await studyBuddyService.getMessages(conversationId, cursor, 30);
        if (!cursor) {
          setMessages(data.messages);
        } else {
          setMessages((prev) => [...prev, ...data.messages]);
        }
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor || null);
      } catch (err) {
        console.error('Failed to load messages:', err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [conversationId],
  );

  useEffect(() => {
    fetchMessages();
    markConversationRead(conversationId);

    // Listen to real-time incoming messages in this chat
    const unsubscribe = addMessageListener((msg) => {
      if (msg.conversationId === conversationId) {
        setMessages((prev) => {
          // If we already have an optimistic message with same text from us, deduplicate
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [
            {
              id: msg.id,
              conversationId: msg.conversationId,
              senderId: msg.senderId,
              text: msg.text,
              readAt: msg.readAt,
              createdAt: msg.createdAt,
              isOutgoing: msg.senderId !== otherUser.id,
              status: 'sent',
            },
            ...prev,
          ];
        });
        markConversationRead(conversationId);
      }
    });

    return () => unsubscribe();
  }, [conversationId, otherUser.id, fetchMessages, markConversationRead, addMessageListener]);

  const handleInputChange = (text: string) => {
    setInputText(text);

    startTyping(otherUser.id);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      stopTyping(otherUser.id);
    }, 2000);
  };

  const handleSend = async (retryMessage?: ChatMessage) => {
    const textToSend = retryMessage ? retryMessage.text : inputText.trim();
    if (!textToSend) return;

    if (!retryMessage) {
      setInputText('');
    }
    stopTyping(otherUser.id);

    // 1. Optimistic message
    const tempId = retryMessage ? retryMessage.id : `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      conversationId,
      senderId: 'me',
      text: textToSend,
      createdAt: new Date().toISOString(),
      isOutgoing: true,
      status: 'sending',
    };

    if (!retryMessage) {
      setMessages((prev) => [optimisticMessage, ...prev]);
    } else {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'sending' } : m)),
      );
    }

    try {
      const res = await sendMessage(otherUser.id, textToSend);
      if (res.success && res.data) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  ...m,
                  id: res.data!.id,
                  status: 'sent',
                  createdAt: res.data!.createdAt,
                }
              : m,
          ),
        );
      } else {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m)),
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: 'failed' } : m)),
      );
    }
  };

  const handleBlock = () => {
    setMenuVisible(false);
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${otherUser.name}? They will no longer be able to message you or see you in Study Buddy.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await studyBuddyService.blockUser(otherUser.id);
              onUnfriendedOrBlocked?.();
              onBack();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to block user');
            }
          },
        },
      ],
    );
  };

  const handleUnfriend = () => {
    setMenuVisible(false);
    Alert.alert(
      'Unfriend Coursemate',
      `Are you sure you want to remove ${otherUser.name} as a study buddy?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unfriend',
          style: 'destructive',
          onPress: async () => {
            try {
              await studyBuddyService.unfriend(otherUser.id);
              onUnfriendedOrBlocked?.();
              onBack();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove buddy');
            }
          },
        },
      ],
    );
  };

  const handleSubmitReport = async () => {
    if (!reportReason.trim()) {
      Alert.alert('Error', 'Please describe the reason for your report');
      return;
    }

    try {
      setSubmittingReport(true);
      await studyBuddyService.createReport({
        reportedId: otherUser.id,
        reason: reportReason.trim(),
      });
      setReportModalVisible(false);
      setReportReason('');
      Alert.alert('Report Submitted', 'Thank you. Our moderation team will investigate this report promptly.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };

  const renderMessageBubble = ({ item }: { item: ChatMessage }) => {
    const isMine = item.isOutgoing;
    const isFailed = item.status === 'failed';
    const isSending = item.status === 'sending';
    const timeFormatted = new Date(item.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View className={`mb-3 flex-row ${isMine ? 'justify-end' : 'justify-start'}`}>
        <View
          className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-sm ${
            isMine
              ? isFailed
                ? 'bg-rose-600 rounded-br-none'
                : 'bg-indigo-600 rounded-br-none'
              : 'bg-slate-100 dark:bg-slate-800 rounded-bl-none'
          }`}
        >
          <Text
            className={`text-sm leading-5 font-inter-regular ${
              isMine ? 'text-white' : 'text-slate-900 dark:text-slate-50'
            }`}
          >
            {item.text}
          </Text>

          <View className="mt-1 flex-row items-center justify-end">
            <Text
              className={`text-[10px] ${
                isMine ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {timeFormatted}
            </Text>

            {isMine && (
              <View className="ml-1.5 flex-row items-center">
                {isFailed ? (
                  <TouchableOpacity
                    onPress={() => handleSend(item)}
                    className="flex-row items-center"
                  >
                    <RotateCcw size={12} color="#FFFFFF" />
                    <Text className="ml-1 text-[10px] font-inter-bold text-white">Retry</Text>
                  </TouchableOpacity>
                ) : isSending ? (
                  <ActivityIndicator size={10} color="#E0E7FF" />
                ) : item.readAt ? (
                  <CheckCheck size={14} color="#67E8F9" />
                ) : (
                  <Check size={14} color="#E0E7FF" />
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      className="flex-1 bg-white dark:bg-slate-900"
    >
      {/* Chat Header */}
      <View
        style={{ paddingTop: Math.max(insets.top, 12) }}
        className="flex-row items-center justify-between border-b border-slate-200/80 bg-white px-4 pb-3 dark:border-slate-800 dark:bg-slate-900 shadow-sm"
      >
        <View className="flex-row items-center flex-1 mr-2">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={onBack}
            className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
          >
            <ArrowLeft size={18} color="#475569" />
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`View ${otherUser.name}'s profile`}
            onPress={() => setProfileVisible(true)}
            activeOpacity={0.75}
            className="flex-1 flex-row items-center"
          >
            <View className="relative mr-2.5">
              {otherUser.avatarUrl ? (
                <Image source={{ uri: otherUser.avatarUrl }} className="h-10 w-10 rounded-full" />
              ) : (
                <View className="h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40">
                  <Text className="text-sm font-inter-bold text-indigo-700 dark:text-indigo-300">
                    {otherUser.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              {isOnline && (
                <View className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900" />
              )}
            </View>

            <View className="flex-1">
              <Text numberOfLines={1} className="font-inter-bold text-slate-900 dark:text-slate-50 text-base">
                {otherUser.name}
              </Text>
              <Text className="text-[11px] font-inter-medium text-slate-500">
                {isTyping ? 'Typing...' : isOnline ? 'Online now' : otherUser.school || 'Coursemate'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Header Actions Menu Button */}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Chat options"
          onPress={() => setMenuVisible(true)}
          className="h-9 w-9 items-center justify-center rounded-full"
        >
          <MoreVertical size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Messages List (inverted for auto-scroll to newest at bottom) */}
      <View className="flex-1 px-4 pt-3">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            inverted
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageBubble}
            onEndReached={() => {
              if (hasMore && !loadingMore && nextCursor) {
                fetchMessages(nextCursor);
              }
            }}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loadingMore ? (
                <View className="py-2 items-center">
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : null
            }
          />
        )}
      </View>

      {/* Input Bar */}
      <View
        style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        className="flex-row items-center border-t border-slate-200/80 bg-white px-4 pt-2.5 dark:border-slate-800 dark:bg-slate-900"
      >
        <TextInput
          placeholder="Type a message..."
          placeholderTextColor="#94a3b8"
          value={inputText}
          onChangeText={handleInputChange}
          multiline
          maxLength={2000}
          className="max-h-24 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-inter-regular text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
        />

        <TouchableOpacity
          disabled={!inputText.trim()}
          onPress={() => handleSend()}
          className={`ml-2.5 h-11 w-11 items-center justify-center rounded-full ${
            inputText.trim() ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-800'
          }`}
        >
          <Send size={18} color={inputText.trim() ? '#FFFFFF' : '#94a3b8'} />
        </TouchableOpacity>
      </View>

      {/* Menu Modal (Block, Report, Unfriend) */}
      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
          className="flex-1 justify-end bg-black/40 px-4 pb-8"
        >
          <View className="rounded-3xl bg-white p-4 shadow-xl dark:bg-slate-900">
            <Text className="px-2 pb-3 font-inter-bold text-xs uppercase tracking-wider text-slate-400">
              Study Buddy Actions
            </Text>

            <TouchableOpacity
              onPress={() => {
                setMenuVisible(false);
                setReportModalVisible(true);
              }}
              className="flex-row items-center rounded-2xl p-3 active:bg-slate-100 dark:active:bg-slate-800"
            >
              <ShieldAlert size={20} color="#F59E0B" />
              <Text className="ml-3 font-inter-medium text-slate-800 dark:text-slate-100 text-sm">
                Report User / Message
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleBlock}
              className="flex-row items-center rounded-2xl p-3 active:bg-slate-100 dark:active:bg-slate-800"
            >
              <AlertTriangle size={20} color="#EF4444" />
              <Text className="ml-3 font-inter-medium text-rose-600 text-sm">
                Block {otherUser.name}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleUnfriend}
              className="flex-row items-center rounded-2xl p-3 active:bg-slate-100 dark:active:bg-slate-800"
            >
              <UserX size={20} color="#64748b" />
              <Text className="ml-3 font-inter-medium text-slate-600 dark:text-slate-300 text-sm">
                Unfriend
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setMenuVisible(false)}
              className="mt-2 rounded-2xl border border-slate-200 p-3 items-center dark:border-slate-800"
            >
              <Text className="font-inter-semibold text-slate-700 dark:text-slate-300 text-sm">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Report Modal */}
      <Modal visible={reportModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="rounded-t-3xl bg-white p-6 dark:bg-slate-900">
            <Text className="font-inter-bold text-lg text-slate-900 dark:text-slate-50">
              Report Safety Concern
            </Text>
            <Text className="mt-1 text-xs text-slate-500 leading-4">
              Help us keep SlotStudy safe and academic. Tell us what went wrong:
            </Text>

            <TextInput
              placeholder="Describe the issue (e.g. inappropriate content, spam, harassment)..."
              placeholderTextColor="#94a3b8"
              value={reportReason}
              onChangeText={setReportReason}
              multiline
              numberOfLines={4}
              maxLength={1000}
              className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-inter-regular text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-50"
            />

            <View className="mt-6 flex-row gap-3">
              <TouchableOpacity
                onPress={() => setReportModalVisible(false)}
                className="flex-1 rounded-2xl border border-slate-200 py-3 items-center dark:border-slate-800"
              >
                <Text className="font-inter-semibold text-slate-700 dark:text-slate-300 text-sm">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={submittingReport || !reportReason.trim()}
                onPress={handleSubmitReport}
                className="flex-1 rounded-2xl bg-rose-600 py-3 items-center"
              >
                {submittingReport ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="font-inter-bold text-white text-sm">Submit Report</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      <StudentProfileModal
        student={profileVisible ? otherUser : null}
        isOnline={isOnline}
        onClose={() => setProfileVisible(false)}
      />
    </KeyboardAvoidingView>
  );
};
