import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  Users,
  UserCheck,
  MessageSquare,
  Gift,
  Settings2,
} from 'lucide-react-native';
import { ScreenWrapper } from '@/shared/components/layout/ScreenWrapper';
import { NotificationBell } from '@/shared/components/navigation/NotificationBell';
import { DiscoverTab } from '@/features/study-buddy/components/DiscoverTab';
import { RequestsTab } from '@/features/study-buddy/components/RequestsTab';
import { ChatsTab } from '@/features/study-buddy/components/ChatsTab';
import { ChatWindow } from '@/features/study-buddy/components/ChatWindow';
import { InviteModal } from '@/features/study-buddy/components/InviteModal';
import { StudyBuddySettingsModal } from '@/features/study-buddy/components/StudyBuddySettingsModal';
import type { ConversationItem, StudyBuddyStudent } from '@/features/study-buddy/types/study-buddy.types';

type TabKey = 'discover' | 'requests' | 'chats';

export default function StudyBuddyScreen() {
  const [activeTab, setActiveTab] = useState<TabKey>('discover');
  const [activeConversation, setActiveConversation] = useState<{
    id: string;
    otherUser: StudyBuddyStudent;
  } | null>(null);

  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  // If currently inside an active conversation, show ChatWindow in full screen
  if (activeConversation) {
    return (
      <ChatWindow
        conversationId={activeConversation.id}
        otherUser={activeConversation.otherUser}
        onBack={() => setActiveConversation(null)}
        onUnfriendedOrBlocked={() => setActiveConversation(null)}
      />
    );
  }

  return (
    <ScreenWrapper scroll={false} padded={false}>
      {/* Top Header */}
      <View className="px-5 pt-3 pb-2 border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-inter-bold text-slate-900 dark:text-slate-50">
              Study Buddy
            </Text>
            <Text className="text-xs font-inter-medium text-slate-500 mt-0.5">
              Connect & Revise with Coursemates 🇳🇬
            </Text>
          </View>

          {/* Action Icons */}
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Invite a coursemate"
              onPress={() => setInviteModalVisible(true)}
              className="h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <Gift size={19} color="#4F46E5" />
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Study buddy settings"
              onPress={() => setSettingsModalVisible(true)}
              className="h-10 w-10 items-center justify-center rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <Settings2 size={19} color="#475569" />
            </TouchableOpacity>

            <NotificationBell />
          </View>
        </View>

        {/* 3 Navigation Tabs */}
        <View className="mt-4 mb-1 flex-row rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
          <TouchableOpacity
            onPress={() => setActiveTab('discover')}
            className={`flex-1 flex-row items-center justify-center rounded-xl py-2.5 ${
              activeTab === 'discover' ? 'bg-white shadow-sm dark:bg-slate-900' : ''
            }`}
          >
            <Users
              size={15}
              color={activeTab === 'discover' ? '#4F46E5' : '#64748b'}
            />
            <Text
              className={`ml-1.5 text-xs font-inter-bold ${
                activeTab === 'discover'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Discover
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('requests')}
            className={`flex-1 flex-row items-center justify-center rounded-xl py-2.5 ${
              activeTab === 'requests' ? 'bg-white shadow-sm dark:bg-slate-900' : ''
            }`}
          >
            <UserCheck
              size={15}
              color={activeTab === 'requests' ? '#4F46E5' : '#64748b'}
            />
            <Text
              className={`ml-1.5 text-xs font-inter-bold ${
                activeTab === 'requests'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Requests
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('chats')}
            className={`flex-1 flex-row items-center justify-center rounded-xl py-2.5 ${
              activeTab === 'chats' ? 'bg-white shadow-sm dark:bg-slate-900' : ''
            }`}
          >
            <MessageSquare
              size={15}
              color={activeTab === 'chats' ? '#4F46E5' : '#64748b'}
            />
            <Text
              className={`ml-1.5 text-xs font-inter-bold ${
                activeTab === 'chats'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Chats
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Body */}
      <View className="flex-1 px-5 pt-3">
        {activeTab === 'discover' && <DiscoverTab />}
        {activeTab === 'requests' && (
          <RequestsTab
            onNavigateToChat={(convId) => {
              setActiveTab('chats');
            }}
          />
        )}
        {activeTab === 'chats' && (
          <ChatsTab
            onSelectConversation={(conv: ConversationItem) => {
              setActiveConversation({
                id: conv.id,
                otherUser: conv.otherUser,
              });
            }}
          />
        )}
      </View>

      {/* Referral / Invite Modal */}
      <InviteModal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
      />

      {/* Study Buddy Settings Modal */}
      <StudyBuddySettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
      />
    </ScreenWrapper>
  );
}
