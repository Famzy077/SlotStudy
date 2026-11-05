export type FriendshipActionState = 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'ACCEPTED' | 'BLOCKED';

export interface StudyBuddyStudent {
  id: string;
  name: string;
  avatarUrl: string | null;
  school: string | null;
  program: string | null;
  yearOfStudy: number | null;
  courses: string[];
  bio: string | null;
  isOnline?: boolean;
  friendshipStatus?: FriendshipActionState;
  friendshipId?: string | null;
}

export interface DiscoverResponse {
  users: StudyBuddyStudent[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  activeSchoolFilter: string;
}

export interface FriendItem {
  friendshipId: string;
  user: StudyBuddyStudent;
  since: string;
}

export interface FriendRequestItem {
  id: string;
  createdAt: string;
  user: StudyBuddyStudent;
}

export interface FriendRequestsResponse {
  incoming: FriendRequestItem[];
  outgoing: FriendRequestItem[];
}

export interface ConversationItem {
  id: string;
  pairKey: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  otherUser: StudyBuddyStudent;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  readAt?: string | null;
  createdAt: string;
  isOutgoing?: boolean;
  status?: 'sending' | 'sent' | 'failed';
}

export interface MessagesResponse {
  messages: ChatMessage[];
  hasMore: boolean;
  nextCursor?: string | null;
}

export interface StudyBuddySettings {
  visible: boolean;
  bio: string | null;
  courses: string[];
  school: string | null;
}

export interface ReferralInfo {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
}
