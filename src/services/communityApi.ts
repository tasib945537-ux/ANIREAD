import {
  CommunityServer,
  CommunityChannel,
  CommunityMessage,
  CommunityUser,
} from '../types/community';

const TOKEN_KEY = 'aniread_community_token';
const USER_KEY = 'aniread_community_user';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): CommunityUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: CommunityUser) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// 1. Fetch Servers
export async function fetchServers(): Promise<CommunityServer[]> {
  const res = await fetch('/api/community/servers', { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to load servers');
  return res.json();
}

// 2. Fetch Server Channels
export async function fetchServerChannels(serverId: string): Promise<CommunityChannel[]> {
  const res = await fetch(`/api/community/servers/${serverId}/channels`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to load channels');
  return res.json();
}

// 3. Fetch Channel Messages
export async function fetchChannelMessages(channelId: string): Promise<CommunityMessage[]> {
  const res = await fetch(`/api/community/channels/${channelId}/messages`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to load messages');
  return res.json();
}

// 4. Send Message
export async function sendChannelMessage(
  channelId: string,
  content: string,
  replyTo?: { id: string; authorName: string; content: string }
): Promise<CommunityMessage> {
  const user = getStoredUser();
  const res = await fetch(`/api/community/channels/${channelId}/messages`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      content,
      replyTo,
      guestName: user ? user.displayName : 'Guest Hunter',
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to send message');
  }
  return res.json();
}

// 5. Delete Message
export async function deleteCommunityMessage(messageId: string): Promise<void> {
  const res = await fetch(`/api/community/messages/${messageId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete message');
  }
}

// 6. Toggle Reaction
export async function toggleMessageReaction(
  messageId: string,
  emoji: string
): Promise<{ success: boolean; reactions: any[] }> {
  const user = getStoredUser();
  const res = await fetch(`/api/community/messages/${messageId}/reactions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      emoji,
      guestId: user ? user.id : 'guest_session',
    }),
  });
  if (!res.ok) throw new Error('Failed to toggle reaction');
  return res.json();
}

// 7. Fetch Server Members
export async function fetchServerMembers(serverId: string): Promise<CommunityUser[]> {
  const res = await fetch(`/api/community/servers/${serverId}/members`, { headers: getHeaders() });
  if (!res.ok) throw new Error('Failed to load members');
  return res.json();
}

// 8. Register
export async function registerCommunity(params: {
  username: string;
  password: string;
  displayName?: string;
  avatar?: string;
  hunterClass?: string;
}): Promise<{ token: string; user: CommunityUser }> {
  const res = await fetch('/api/community/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Registration failed');
  }
  const data = await res.json();
  saveSession(data.token, data.user);
  return data;
}

// 9. Login
export async function loginCommunity(params: {
  username: string;
  password: string;
}): Promise<{ token: string; user: CommunityUser }> {
  const res = await fetch('/api/community/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Login failed');
  }
  const data = await res.json();
  saveSession(data.token, data.user);
  return data;
}

// 10. Verify Current Auth
export async function checkCommunityAuth(): Promise<CommunityUser | null> {
  const token = getStoredToken();
  if (!token) return null;
  try {
    const res = await fetch('/api/community/auth/me', { headers: getHeaders() });
    if (!res.ok) {
      clearSession();
      return null;
    }
    const user = await res.json();
    saveSession(token, user);
    return user;
  } catch {
    return getStoredUser();
  }
}
