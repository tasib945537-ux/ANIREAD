import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import {
  CommunityUser,
  CommunityReaction,
  CommunityMessage,
  CommunityChannel,
  CommunityServer,
} from '../types/community';

export type {
  CommunityUser,
  CommunityReaction,
  CommunityMessage,
  CommunityChannel,
  CommunityServer,
};

export const communityRouter = Router();

// Password hashing
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
}

// In-Memory Database with Seed Data
const users = new Map<string, CommunityUser>();
const tokens = new Map<string, string>(); // token -> userId
const servers = new Map<string, CommunityServer>();
const channels = new Map<string, CommunityChannel>();
const messages = new Map<string, CommunityMessage[]>(); // channelId -> messages

// Seed Community Users
const seedUsers: CommunityUser[] = [
  {
    id: 'usr_admin',
    username: 'admin',
    displayName: 'Sung Jin-Woo',
    avatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80',
    role: 'member',
    hunterRank: 'Shadow Monarch',
    status: 'online',
    customStatus: 'Arise.',
    createdAt: Date.now() - 10000000,
  },
  {
    id: 'usr_mod1',
    username: 'cha_haein',
    displayName: 'Cha Hae-In',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'member',
    hunterRank: 'S-Rank Hunter',
    status: 'online',
    customStatus: 'The Sword of Light',
    createdAt: Date.now() - 9000000,
  },
  {
    id: 'usr_member1',
    username: 'go_gunhee',
    displayName: 'Chairman Go',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'member',
    hunterRank: 'S-Rank Hunter',
    status: 'idle',
    customStatus: 'Hunter Association HQ',
    createdAt: Date.now() - 8000000,
  },
  {
    id: 'usr_member2',
    username: 'yoo_jinho',
    displayName: 'Yoo Jin-Ho',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    role: 'member',
    hunterRank: 'D-Rank Vice Guildmaster',
    status: 'online',
    customStatus: 'Managing Ahjin Guild Raid schedule',
    createdAt: Date.now() - 7000000,
  },
];

seedUsers.forEach((u) => {
  // Demo profiles are display-only; no shared passwords or predictable sessions.
  users.set(u.id, u);
});

// Seed Community Servers & Channels
const seedServers: CommunityServer[] = [
  {
    id: 'srv-global',
    name: 'AniRead Global Hub',
    icon: '🌐',
    description: 'The central gathering place for all anime fans, manga readers, and dimensional hunters.',
    ownerId: 'usr_admin',
    memberCount: 14820,
    channels: [
      { id: 'c-announcements', serverId: 'srv-global', name: 'announcements', type: 'announcement', topic: 'Official platform news, reader upgrades & anime seasons.' },
      { id: 'c-general', serverId: 'srv-global', name: 'general-chat', type: 'text', topic: 'Casual chat, daily anime thoughts, and community lounge.' },
      { id: 'c-anime-talk', serverId: 'srv-global', name: 'anime-discussions', type: 'text', topic: 'Weekly seasonal anime episodes, episode scores and reviews.' },
      { id: 'c-help', serverId: 'srv-global', name: 'help-and-support', type: 'text', topic: 'Questions regarding the offline reader, translations and game zone.' },
    ],
  },
  {
    id: 'srv-manga',
    name: 'Manga & Scanlations',
    icon: '📖',
    description: 'High-speed chapter releases, translation accuracy feedback, and raw discussion.',
    ownerId: 'usr_mod1',
    memberCount: 9640,
    channels: [
      { id: 'c-new-releases', serverId: 'srv-manga', name: 'new-chapter-alerts', type: 'text', topic: 'Direct links and discussions on latest chapters.' },
      { id: 'c-spoilers', serverId: 'srv-manga', name: 'spoilers-zone', type: 'text', topic: 'Raw scans, leaks, and weekly manga spoilers.' },
      { id: 'c-translation-feedback', serverId: 'srv-manga', name: 'translator-feedback', type: 'text', topic: 'AI OCR translation corrections and multi-language suggestions.' },
    ],
  },
  {
    id: 'srv-dungeon',
    name: 'Shadow Dungeon Guild',
    icon: '⚔️',
    description: 'Dedicated to the offline Dungeon RPG. Gate boss tactics, equipment builds and raid party strategy.',
    ownerId: 'usr_admin',
    memberCount: 6310,
    channels: [
      { id: 'c-gate-tactics', serverId: 'srv-dungeon', name: 'gate-boss-tactics', type: 'text', topic: 'Strategies for defeating Ignis, Igris, and S-Rank Monarch Gate.' },
      { id: 'c-builds', serverId: 'srv-dungeon', name: 'hunter-stat-builds', type: 'text', topic: 'STR vs AGI vs INT attribute distributions and skill trees.' },
      { id: 'c-flex', serverId: 'srv-dungeon', name: 'loot-and-records', type: 'text', topic: 'Post your high scores and rare dagger drops.' },
    ],
  },
];

seedServers.forEach((srv) => {
  servers.set(srv.id, srv);
  srv.channels.forEach((ch) => {
    channels.set(ch.id, ch);
  });
});

// Seed Messages
const seedChannelMessages: Record<string, CommunityMessage[]> = {
  'c-announcements': [
    {
      id: 'msg_1',
      channelId: 'c-announcements',
      authorId: 'usr_admin',
      authorName: 'Sung Jin-Woo',
      authorAvatar: seedUsers[0].avatar,
      authorRole: 'admin',
      authorRank: 'Shadow Monarch',
      content: 'Welcome to **AniRead 2.0**! We have officially deployed the **Offline Dungeon RPG** (Solo Leveling inspired) and this brand-new **Community Chat System**. Enjoy reading, translation in 30+ languages, and hunting monsters!',
      createdAt: Date.now() - 3600000 * 5,
      isPinned: true,
      reactions: [
        { emoji: '🔥', count: 48, users: ['usr_mod1', 'usr_member1'] },
        { emoji: '👑', count: 32, users: ['usr_member2'] },
        { emoji: '✨', count: 27, users: [] },
      ],
    },
  ],
  'c-general': [
    {
      id: 'msg_2',
      channelId: 'c-general',
      authorId: 'usr_member2',
      authorName: 'Yoo Jin-Ho',
      authorAvatar: seedUsers[3].avatar,
      authorRole: 'member',
      authorRank: 'D-Rank Vice Guildmaster',
      content: 'Hey everyone! Has anyone beaten the A-Rank Gate in the new Dungeon RPG yet? The boss has crazy telegraph attacks!',
      createdAt: Date.now() - 1000 * 60 * 42,
      reactions: [{ emoji: '⚔️', count: 5, users: [] }],
    },
    {
      id: 'msg_3',
      channelId: 'c-general',
      authorId: 'usr_mod1',
      authorName: 'Cha Hae-In',
      authorAvatar: seedUsers[1].avatar,
      authorRole: 'moderator',
      authorRank: 'S-Rank Hunter',
      content: 'You need to invest points into Agility and max out **Shadow Strike** to dodge his crimson flame slashes. Once his telegraph circle glows, dash through him!',
      createdAt: Date.now() - 1000 * 60 * 35,
      replyTo: {
        id: 'msg_2',
        authorName: 'Yoo Jin-Ho',
        content: 'Has anyone beaten the A-Rank Gate yet?',
      },
      reactions: [{ emoji: '👍', count: 8, users: [] }],
    },
    {
      id: 'msg_4',
      channelId: 'c-general',
      authorId: 'usr_member1',
      authorName: 'Chairman Go',
      authorAvatar: seedUsers[2].avatar,
      authorRole: 'hunter',
      authorRank: 'S-Rank Hunter',
      content: 'Also, the multi-language manga reader with Bangla and Hindi translation is incredible. Google Lens style bubble alignment looks very clean.',
      createdAt: Date.now() - 1000 * 60 * 15,
      reactions: [{ emoji: '🔥', count: 12, users: [] }],
    },
  ],
  'c-gate-tactics': [
    {
      id: 'msg_5',
      channelId: 'c-gate-tactics',
      authorId: 'usr_admin',
      authorName: 'Sung Jin-Woo',
      authorAvatar: seedUsers[0].avatar,
      authorRole: 'admin',
      authorRank: 'Shadow Monarch',
      content: 'Pro tip: Activate **Monarch\'s Domain** when the wave spawns. It slows all shadow hounds by 45% and ticks damage continuously while you cast Void Slash.',
      createdAt: Date.now() - 1000 * 60 * 50,
      reactions: [{ emoji: '👑', count: 19, users: [] }],
    },
  ],
};

Object.entries(seedChannelMessages).forEach(([cId, mList]) => {
  messages.set(cId, mList);
});

// Helper to authenticate request
function getAuthUser(req: Request): CommunityUser | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const userId = tokens.get(token);
  if (!userId) return null;
  return users.get(userId) || null;
}

// --- REST ENDPOINTS --- //

// 1. Get All Servers
communityRouter.get('/servers', (_req: Request, res: Response) => {
  const list = Array.from(servers.values());
  return res.json(list);
});

// 2. Get Single Server & Channels
communityRouter.get('/servers/:serverId', (req: Request, res: Response) => {
  const srv = servers.get(req.params.serverId);
  if (!srv) return res.status(404).json({ error: 'Server not found' });
  return res.json(srv);
});

// 3. Get Channels for a Server
communityRouter.get('/servers/:serverId/channels', (req: Request, res: Response) => {
  const srv = servers.get(req.params.serverId);
  if (!srv) return res.status(404).json({ error: 'Server not found' });
  return res.json(srv.channels);
});

// 4. Get Messages for Channel (with limit & pagination)
communityRouter.get('/channels/:channelId/messages', (req: Request, res: Response) => {
  const channelId = req.params.channelId;
  const list = messages.get(channelId) || [];
  return res.json(list);
});

// 5. Send Message to Channel
communityRouter.post('/channels/:channelId/messages', (req: Request, res: Response) => {
  const channelId = req.params.channelId;
  const ch = channels.get(channelId);
  if (!ch) return res.status(404).json({ error: 'Channel not found' });

  const { content, replyTo } = req.body;
  if (!content || typeof content !== 'string' || !content.trim()) {
    return res.status(400).json({ error: 'Message content cannot be empty' });
  }

  // Rate limit / size check
  if (content.length > 2000) {
    return res.status(400).json({ error: 'Message exceeds 2,000 character limit' });
  }

  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'Sign in to send community messages.' });
  const authorName = authUser.displayName;
  const authorAvatar = authUser.avatar;
  const authorRole = 'member';
  const authorRank = authUser.hunterRank;
  const authorId = authUser.id;

  const newMessage: CommunityMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    channelId,
    authorId,
    authorName,
    authorAvatar,
    authorRole,
    authorRank,
    content: content.trim(),
    replyTo: replyTo ? { id: replyTo.id, authorName: replyTo.authorName, content: replyTo.content } : undefined,
    reactions: [],
    createdAt: Date.now(),
  };

  const channelMsgs = messages.get(channelId) || [];
  channelMsgs.push(newMessage);
  messages.set(channelId, channelMsgs);

  return res.status(201).json(newMessage);
});

// 6. Delete Message
communityRouter.delete('/messages/:messageId', (req: Request, res: Response) => {
  const messageId = req.params.messageId;
  const authUser = getAuthUser(req);

  for (const [chId, msgList] of messages.entries()) {
    const idx = msgList.findIndex((m) => m.id === messageId);
    if (idx >= 0) {
      const msg = msgList[idx];
      // Check author or admin/mod
      if (authUser && authUser.id === msg.authorId) {
        msgList.splice(idx, 1);
        return res.json({ success: true, messageId });
      } else {
        return res.status(403).json({ error: 'Permission denied to delete this message' });
      }
    }
  }

  return res.status(404).json({ error: 'Message not found' });
});

// 7. Toggle Reaction on Message
communityRouter.post('/messages/:messageId/reactions', (req: Request, res: Response) => {
  const messageId = req.params.messageId;
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ error: 'Emoji is required' });

  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ error: 'Sign in to react to community messages.' });
  const userId = authUser.id;

  for (const [, msgList] of messages.entries()) {
    const target = msgList.find((m) => m.id === messageId);
    if (target) {
      let reaction = target.reactions.find((r) => r.emoji === emoji);
      if (!reaction) {
        reaction = { emoji, count: 1, users: [userId] };
        target.reactions.push(reaction);
      } else {
        const uIdx = reaction.users.indexOf(userId);
        if (uIdx >= 0) {
          // Remove reaction
          reaction.users.splice(uIdx, 1);
          reaction.count = Math.max(0, reaction.count - 1);
          if (reaction.count === 0) {
            target.reactions = target.reactions.filter((r) => r.emoji !== emoji);
          }
        } else {
          // Add reaction
          reaction.users.push(userId);
          reaction.count++;
        }
      }
      return res.json({ success: true, reactions: target.reactions });
    }
  }

  return res.status(404).json({ error: 'Message not found' });
});

// 8. Server Online Members
communityRouter.get('/servers/:serverId/members', (_req: Request, res: Response) => {
  const memberList = Array.from(users.values()).map((u) => ({
    id: u.id,
    displayName: u.displayName,
    username: u.username,
    avatar: u.avatar,
    role: u.role,
    hunterRank: u.hunterRank,
    status: u.status,
    customStatus: u.customStatus,
  }));
  return res.json(memberList);
});

// 9. Community Auth: Register
communityRouter.post('/auth/register', (req: Request, res: Response) => {
  const { username, password, displayName, avatar, hunterClass } = req.body;

  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (password.length < 10 || password.length > 128) {
    return res.status(400).json({ error: 'Password must be between 10 and 128 characters.' });
  }

  const cleanUser = username.trim().toLowerCase();
  if (cleanUser.length < 3 || cleanUser.length > 32 || !/^[a-z0-9_]+$/.test(cleanUser)) {
    return res.status(400).json({ error: 'Username must be at least 3 characters' });
  }

  // Check unique username
  for (const u of users.values()) {
    if (u.username === cleanUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  const userId = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const token = crypto.randomBytes(32).toString('hex');

  const defaultAvatar =
    avatar ||
    'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80';

  const newUser: CommunityUser = {
    id: userId,
    username: cleanUser,
    displayName: displayName?.trim() || username,
    avatar: defaultAvatar,
    role: 'hunter',
    hunterRank: hunterClass || 'E-Rank Hunter',
    status: 'online',
    customStatus: 'Exploring AniRead Guild',
    passwordHash,
    salt,
    createdAt: Date.now(),
  };

  users.set(userId, newUser);
  tokens.set(token, userId);

  return res.status(201).json({
    token,
    user: {
      id: newUser.id,
      username: newUser.username,
      displayName: newUser.displayName,
      avatar: newUser.avatar,
      role: newUser.role,
      hunterRank: newUser.hunterRank,
      status: newUser.status,
      customStatus: newUser.customStatus,
    },
  });
});

// 10. Community Auth: Login
communityRouter.post('/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const cleanUser = username.trim().toLowerCase();
  let foundUser: CommunityUser | null = null;
  for (const u of users.values()) {
    if (u.username === cleanUser) {
      foundUser = u;
      break;
    }
  }

  if (typeof username !== 'string' || typeof password !== 'string' || !foundUser || !foundUser.salt || !foundUser.passwordHash) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const testHash = hashPassword(password, foundUser.salt);
  const matches = crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(foundUser.passwordHash, 'hex'));
  if (!matches) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = `tok_${crypto.randomBytes(24).toString('hex')}`;
  tokens.set(token, foundUser.id);
  foundUser.status = 'online';

  return res.json({
    token,
    user: {
      id: foundUser.id,
      username: foundUser.username,
      displayName: foundUser.displayName,
      avatar: foundUser.avatar,
      role: foundUser.role,
      hunterRank: foundUser.hunterRank,
      status: foundUser.status,
      customStatus: foundUser.customStatus,
    },
  });
});

// 11. Community Auth: Current User Session
communityRouter.get('/auth/me', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  return res.json({
    id: authUser.id,
    username: authUser.username,
    displayName: authUser.displayName,
    avatar: authUser.avatar,
    role: authUser.role,
    hunterRank: authUser.hunterRank,
    status: authUser.status,
    customStatus: authUser.customStatus,
  });
});
