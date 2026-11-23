export interface CommunityUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  role: 'admin' | 'moderator' | 'hunter' | 'member';
  hunterRank?: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  customStatus?: string;
  passwordHash?: string;
  salt?: string;
  createdAt: number;
}

export interface CommunityReaction {
  emoji: string;
  count: number;
  users: string[]; // user IDs
}

export interface CommunityMessage {
  id: string;
  channelId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: 'admin' | 'moderator' | 'hunter' | 'member';
  authorRank?: string;
  content: string;
  attachments?: string[];
  replyTo?: {
    id: string;
    authorName: string;
    content: string;
  };
  reactions: CommunityReaction[];
  createdAt: number;
  isPinned?: boolean;
}

export interface CommunityChannel {
  id: string;
  serverId: string;
  name: string;
  type: 'text' | 'announcement';
  topic: string;
  unreadCount?: number;
}

export interface CommunityServer {
  id: string;
  name: string;
  icon: string;
  description: string;
  ownerId: string;
  memberCount: number;
  channels: CommunityChannel[];
}
