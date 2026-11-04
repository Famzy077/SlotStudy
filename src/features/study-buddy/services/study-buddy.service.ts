import { apiClient } from '@/shared/services/api.client';
import { ENDPOINTS } from '@/shared/constants/endpoints';
import type {
  DiscoverResponse,
  FriendItem,
  FriendRequestsResponse,
  ConversationItem,
  MessagesResponse,
  StudyBuddySettings,
  ReferralInfo,
} from '../types/study-buddy.types';

export const studyBuddyService = {
  // Discovery
  discover: async (params: {
    school?: string;
    course?: string;
    q?: string;
    page?: number;
    limit?: number;
  }): Promise<DiscoverResponse> => {
    const res = await apiClient.get<DiscoverResponse>(ENDPOINTS.STUDY_BUDDY.DISCOVER, {
      params,
    });
    return res.data;
  },

  // Friends & Requests
  getFriends: async (): Promise<FriendItem[]> => {
    const res = await apiClient.get<FriendItem[]>(ENDPOINTS.STUDY_BUDDY.FRIENDS);
    return res.data;
  },

  getRequests: async (): Promise<FriendRequestsResponse> => {
    const res = await apiClient.get<FriendRequestsResponse>(ENDPOINTS.STUDY_BUDDY.REQUESTS);
    return res.data;
  },

  sendFriendRequest: async (userId: string) => {
    const res = await apiClient.post<{ success: boolean; message: string; friendship: any }>(
      ENDPOINTS.STUDY_BUDDY.FRIEND_REQUEST,
      { userId },
    );
    return res.data;
  },

  acceptFriendRequest: async (friendshipId: string) => {
    const res = await apiClient.post<{ success: boolean; message: string; conversationId: string }>(
      ENDPOINTS.STUDY_BUDDY.ACCEPT_FRIEND(friendshipId),
    );
    return res.data;
  },

  declineFriendRequest: async (friendshipId: string) => {
    const res = await apiClient.post<{ success: boolean; message: string }>(
      ENDPOINTS.STUDY_BUDDY.DECLINE_FRIEND(friendshipId),
    );
    return res.data;
  },

  blockUser: async (userId: string) => {
    const res = await apiClient.post<{ success: boolean; message: string }>(
      ENDPOINTS.STUDY_BUDDY.BLOCK_USER(userId),
    );
    return res.data;
  },

  unblockUser: async (userId: string) => {
    const res = await apiClient.post<{ success: boolean; message: string }>(
      ENDPOINTS.STUDY_BUDDY.UNBLOCK_USER(userId),
    );
    return res.data;
  },

  unfriend: async (userId: string) => {
    const res = await apiClient.delete<{ success: boolean; message: string }>(
      ENDPOINTS.STUDY_BUDDY.UNFRIEND(userId),
    );
    return res.data;
  },

  // Conversations & Messages
  getConversations: async (): Promise<ConversationItem[]> => {
    const res = await apiClient.get<ConversationItem[]>(ENDPOINTS.STUDY_BUDDY.CONVERSATIONS);
    return res.data;
  },

  getMessages: async (
    conversationId: string,
    cursor?: string,
    limit = 30,
  ): Promise<MessagesResponse> => {
    const res = await apiClient.get<MessagesResponse>(
      ENDPOINTS.STUDY_BUDDY.CONVERSATION_MESSAGES(conversationId),
      {
        params: { cursor, limit },
      },
    );
    return res.data;
  },

  markConversationRead: async (conversationId: string) => {
    const res = await apiClient.post<{ success: boolean }>(
      ENDPOINTS.STUDY_BUDDY.CONVERSATION_READ(conversationId),
    );
    return res.data;
  },

  // Moderation Report
  createReport: async (data: { reportedId: string; messageId?: string; reason: string }) => {
    const res = await apiClient.post<{ success: boolean; message: string; reportId: string }>(
      ENDPOINTS.STUDY_BUDDY.REPORTS,
      data,
    );
    return res.data;
  },

  // Referral
  getReferralInfo: async (): Promise<ReferralInfo> => {
    const res = await apiClient.get<ReferralInfo>(ENDPOINTS.STUDY_BUDDY.REFERRAL);
    return res.data;
  },

  // Settings
  getSettings: async (): Promise<StudyBuddySettings> => {
    const res = await apiClient.get<StudyBuddySettings>(ENDPOINTS.STUDY_BUDDY.SETTINGS);
    return res.data;
  },

  updateSettings: async (data: {
    visible?: boolean;
    bio?: string;
    courses?: string[];
  }): Promise<StudyBuddySettings> => {
    const res = await apiClient.patch<StudyBuddySettings>(ENDPOINTS.STUDY_BUDDY.SETTINGS, data);
    return res.data;
  },

  // Notifications
  markNotificationsRead: async (ids?: string[]) => {
    const res = await apiClient.post<{ success: boolean }>(
      `${ENDPOINTS.NOTIFICATIONS}/read`,
      { ids },
    );
    return res.data;
  },
};
