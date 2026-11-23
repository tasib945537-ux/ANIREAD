import React, { useState, useEffect, useRef } from 'react';
import {
  Hash,
  Send,
  Users,
  Search,
  Settings,
  Smile,
  Reply,
  Trash2,
  Menu,
  X,
  Volume2,
  ChevronDown,
  Sparkles,
  Shield,
  MessageSquare,
  LogOut,
  UserPlus,
  LogIn,
} from 'lucide-react';
import {
  CommunityServer,
  CommunityChannel,
  CommunityMessage,
  CommunityUser,
} from '../../types/community';
import {
  fetchServers,
  fetchServerChannels,
  fetchChannelMessages,
  sendChannelMessage,
  deleteCommunityMessage,
  toggleMessageReaction,
  fetchServerMembers,
  checkCommunityAuth,
  getStoredUser,
} from '../../services/communityApi';
import { CommunityAuthModal } from './CommunityAuthModal';
import { CommunitySettingsModal } from './CommunitySettingsModal';

interface Props {
  initialServerId?: string;
  initialChannelId?: string;
}

export const CommunityHub: React.FC<Props> = ({
  initialServerId,
  initialChannelId,
}) => {
  // Navigation & Data
  const [servers, setServers] = useState<CommunityServer[]>([]);
  const [activeServer, setActiveServer] = useState<CommunityServer | null>(null);
  const [channels, setChannels] = useState<CommunityChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<CommunityChannel | null>(null);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [members, setMembers] = useState<CommunityUser[]>([]);

  // UI state
  const [messageInput, setMessageInput] = useState('');
  const [replyingTo, setReplyingTo] = useState<CommunityMessage | null>(null);
  const [showMembersSidebar, setShowMembersSidebar] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<CommunityUser | null>(getStoredUser());
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check auth session
  useEffect(() => {
    checkCommunityAuth().then((user) => setCurrentUser(user));
  }, []);

  // 1. Initial Load: Servers
  useEffect(() => {
    fetchServers()
      .then((data) => {
        setServers(data);
        if (data.length > 0) {
          const target = (initialServerId && data.find((s) => s.id === initialServerId)) || data[0];
          setActiveServer(target);
        }
      })
      .catch(console.warn);
  }, [initialServerId]);

  // 2. Load Channels when activeServer changes
  useEffect(() => {
    if (!activeServer) return;
    fetchServerChannels(activeServer.id)
      .then((chs) => {
        setChannels(chs);
        if (chs.length > 0) {
          const target = (initialChannelId && chs.find((c) => c.id === initialChannelId)) || chs[0];
          setActiveChannel(target);
        }
      })
      .catch(console.warn);

    // Load members
    fetchServerMembers(activeServer.id)
      .then(setMembers)
      .catch(console.warn);
  }, [activeServer, initialChannelId]);

  // 3. Load Messages when activeChannel changes & poll periodically for new messages
  useEffect(() => {
    if (!activeChannel) return;

    let isMounted = true;
    const loadMsgs = () => {
      fetchChannelMessages(activeChannel.id)
        .then((msgs) => {
          if (isMounted) setMessages(msgs);
        })
        .catch(console.warn);
    };

    loadMsgs();
    const interval = setInterval(loadMsgs, 3000); // 3-second live refresh

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeChannel]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChannel || !messageInput.trim() || isSending) return;

    setIsSending(true);
    try {
      const replyData = replyingTo
        ? {
            id: replyingTo.id,
            authorName: replyingTo.authorName,
            content: replyingTo.content.slice(0, 100),
          }
        : undefined;

      const newMsg = await sendChannelMessage(activeChannel.id, messageInput, replyData);
      setMessages((prev) => [...prev, newMsg]);
      setMessageInput('');
      setReplyingTo(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  // Delete Message
  const handleDeleteMessage = async (msgId: string) => {
    try {
      await deleteCommunityMessage(msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    } catch (err: any) {
      alert(err?.message || 'Failed to delete message');
    }
  };

  // Toggle Reaction
  const handleReaction = async (msgId: string, emoji: string) => {
    try {
      const res = await toggleMessageReaction(msgId, emoji);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, reactions: res.reactions } : m))
      );
    } catch (err: any) {
      console.warn('Reaction error:', err);
    }
  };

  // Filtered Messages
  const displayMessages = searchQuery
    ? messages.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  return (
    <div className="w-full h-[88vh] sm:h-[84vh] bg-[#0b0e17] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex select-none">
      {/* COLUMN 1: DISCORD-STYLE SERVER NAVIGATION PILLS */}
      <div className="w-18 bg-[#070911] border-r border-slate-800/80 flex flex-col items-center py-4 gap-3 shrink-0 z-20">
        {/* AniRead Home Pill */}
        <div
          onClick={() => {
            if (servers.length > 0) setActiveServer(servers[0]);
          }}
          className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-rose-600 flex items-center justify-center text-white font-black text-sm shadow-xl cursor-pointer hover:scale-105 transition-transform"
          title="AniRead Central"
        >
          AR
        </div>

        <div className="w-8 h-[2px] bg-slate-800/80 rounded-full" />

        {/* Server List */}
        <div className="flex-1 w-full flex flex-col items-center gap-2.5 overflow-y-auto scrollbar-none">
          {servers.map((srv) => {
            const isActive = activeServer?.id === srv.id;
            return (
              <div key={srv.id} className="relative group">
                {/* Active Pill Indicator */}
                <div
                  className={`absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 rounded-r-full bg-white transition-all duration-200 ${
                    isActive ? 'h-10' : 'h-0 group-hover:h-5'
                  }`}
                />
                <button
                  onClick={() => {
                    setActiveServer(srv);
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-12 h-12 flex items-center justify-center text-xl transition-all cursor-pointer ${
                    isActive
                      ? 'rounded-2xl bg-indigo-600 text-white shadow-lg'
                      : 'rounded-3xl bg-slate-900/90 text-slate-300 hover:rounded-2xl hover:bg-indigo-950/80 hover:text-white border border-slate-800'
                  }`}
                  title={srv.name}
                >
                  <span>{srv.icon}</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom User / Settings Pill */}
        <div className="flex flex-col items-center gap-2 pt-2 border-t border-slate-800/80">
          <button
            onClick={() => (currentUser ? setShowSettingsModal(true) : setShowAuthModal(true))}
            className="w-11 h-11 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
            title={currentUser ? 'Profile & Settings' : 'Sign In'}
          >
            {currentUser ? (
              <img src={currentUser.avatar} alt="" className="w-9 h-9 rounded-xl object-cover" />
            ) : (
              <LogIn className="w-4 h-4 text-indigo-400" />
            )}
          </button>
        </div>
      </div>

      {/* COLUMN 2: SERVER CHANNELS & VOICE LIST (Responsive Mobile Drawer) */}
      <div
        className={`${
          mobileDrawerOpen ? 'flex' : 'hidden md:flex'
        } w-64 bg-[#0e121d] border-r border-slate-800/80 flex-col shrink-0 z-10 transition-all`}
      >
        {/* Server Header */}
        <div className="h-14 px-4 border-b border-slate-800/80 flex items-center justify-between font-bold text-white text-sm">
          <span className="truncate">{activeServer ? activeServer.name : 'AniRead Server'}</span>
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        </div>

        {/* Channel Category & List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 px-2 block mb-1.5">
              Text Channels
            </span>
            <div className="space-y-0.5">
              {channels.map((ch) => {
                const isSelected = activeChannel?.id === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => {
                      setActiveChannel(ch);
                      setMobileDrawerOpen(false);
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl text-left text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 text-white font-bold border border-indigo-700/50'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Hash className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="truncate">{ch.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Card at Bottom */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {currentUser ? (
              <>
                <div className="relative shrink-0">
                  <img src={currentUser.avatar} alt="" className="w-8 h-8 rounded-xl object-cover" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate">{currentUser.displayName}</span>
                  <span className="text-[10px] text-indigo-400 font-mono block truncate">
                    {currentUser.hunterRank}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs">
                  👤
                </span>
                <span className="text-xs text-slate-400">Guest Hunter</span>
              </div>
            )}
          </div>

          <button
            onClick={() => (currentUser ? setShowSettingsModal(true) : setShowAuthModal(true))}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* COLUMN 3: MAIN CHAT PANEL */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0b0e17]">
        {/* Top Channel Bar */}
        <div className="h-14 px-4 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-[#0b0e17]/80 backdrop-blur-md">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Hash className="w-5 h-5 text-indigo-400 shrink-0" />
            <span className="text-sm font-bold text-white truncate">
              {activeChannel ? activeChannel.name : 'select-channel'}
            </span>
            {activeChannel?.topic && (
              <>
                <span className="text-slate-600 hidden sm:inline">|</span>
                <span className="text-xs text-slate-400 truncate hidden sm:inline">
                  {activeChannel.topic}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Search Input */}
            <div className="relative hidden sm:block">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="pl-8 pr-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 w-36 lg:w-48"
              />
            </div>

            <button
              onClick={() => setShowMembersSidebar(!showMembersSidebar)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer hidden lg:flex ${
                showMembersSidebar ? 'text-indigo-400 bg-indigo-950/60' : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Member List"
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {displayMessages.length === 0 ? (
            <div className="py-20 text-center text-slate-500 space-y-2">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-semibold text-slate-400">No messages in this channel yet.</p>
              <p className="text-xs">Be the first hunter to start the discussion!</p>
            </div>
          ) : (
            displayMessages.map((msg) => {
              const isSelf = currentUser && currentUser.id === msg.authorId;

              return (
                <div key={msg.id} className="group flex items-start gap-3 hover:bg-slate-900/40 p-2 rounded-2xl transition-colors">
                  <img
                    src={msg.authorAvatar}
                    alt=""
                    className="w-10 h-10 rounded-2xl object-cover shrink-0 border border-slate-800 mt-0.5"
                  />

                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Author Meta */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white hover:underline cursor-pointer">
                        {msg.authorName}
                      </span>
                      {msg.authorRank && (
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/40 font-semibold">
                          {msg.authorRank}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Reply reference */}
                    {msg.replyTo && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900/60 px-2 py-1 rounded-lg border-l-2 border-indigo-500">
                        <Reply className="w-3 h-3 text-indigo-400" />
                        <span className="font-semibold text-slate-300">@{msg.replyTo.authorName}:</span>
                        <span className="truncate italic">{msg.replyTo.content}</span>
                      </div>
                    )}

                    {/* Message Body */}
                    <div className="text-xs sm:text-sm text-slate-200 leading-relaxed break-words">
                      {msg.content}
                    </div>

                    {/* Reactions Bar */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {msg.reactions.map((r, rIdx) => {
                        const hasReacted = currentUser && r.users.includes(currentUser.id);
                        return (
                          <button
                            key={rIdx}
                            onClick={() => handleReaction(msg.id, r.emoji)}
                            className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                              hasReacted
                                ? 'bg-indigo-950 border-indigo-600 text-indigo-300'
                                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            <span>{r.emoji}</span>
                            <span className="text-[10px]">{r.count}</span>
                          </button>
                        );
                      })}

                      {/* Quick Reaction Picker */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        {['👍', '🔥', '⚔️', '✨', '👑'].map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg.id, emoji)}
                            className="p-1 hover:bg-slate-800 rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}

                        <button
                          onClick={() => setReplyingTo(msg)}
                          className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs transition-colors cursor-pointer"
                          title="Reply"
                        >
                          <Reply className="w-3.5 h-3.5" />
                        </button>

                        {(isSelf || currentUser?.role === 'admin') && (
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1 hover:bg-rose-950 text-slate-500 hover:text-rose-400 rounded-lg text-xs transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Container */}
        <div className="p-3 sm:p-4 border-t border-slate-800/80 bg-[#0e121d]/60">
          {/* Replying banner */}
          {replyingTo && (
            <div className="mb-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2 truncate">
                <Reply className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  Replying to <strong className="text-white">@{replyingTo.authorName}</strong>
                </span>
                <span className="italic text-slate-500 truncate">{replyingTo.content}</span>
              </div>
              <button onClick={() => setReplyingTo(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={
                  activeChannel
                    ? `Message #${activeChannel.name}...`
                    : 'Select a channel to chat...'
                }
                className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs sm:text-sm text-white placeholder:text-slate-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={!messageInput.trim() || isSending}
              className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white transition-colors cursor-pointer shadow-lg shrink-0"
              title="Send Message (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* COLUMN 4: ONLINE MEMBERS SIDEBAR */}
      {showMembersSidebar && (
        <div className="w-60 bg-[#0e121d] border-l border-slate-800/80 hidden lg:flex flex-col p-4 shrink-0">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-3 block">
            Online Guild Members ({members.length})
          </span>

          <div className="flex-1 overflow-y-auto space-y-2">
            {members.map((mem) => (
              <div
                key={mem.id}
                className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-900/60 transition-colors cursor-pointer group"
              >
                <div className="relative shrink-0">
                  <img src={mem.avatar} alt="" className="w-8 h-8 rounded-xl object-cover" />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 ${
                      mem.status === 'online'
                        ? 'bg-emerald-500'
                        : mem.status === 'idle'
                        ? 'bg-amber-500'
                        : 'bg-slate-500'
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate block">
                      {mem.displayName}
                    </span>
                    {mem.role === 'admin' && <Shield className="w-3 h-3 text-amber-400 shrink-0" />}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block truncate">
                    {mem.customStatus || mem.hunterRank || 'Hunter'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <CommunityAuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={(u) => setCurrentUser(u)}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <CommunitySettingsModal
          currentUser={currentUser}
          onClose={() => setShowSettingsModal(false)}
          onLogout={() => setCurrentUser(null)}
          onUserUpdate={(u) => setCurrentUser(u)}
        />
      )}
    </div>
  );
};
