import React, { useState } from 'react';
import { X, LogOut, Check, Shield, User, Bell } from 'lucide-react';
import { CommunityUser } from '../../types/community';
import { clearSession, saveSession } from '../../services/communityApi';

interface Props {
  currentUser: CommunityUser | null;
  onClose: () => void;
  onLogout: () => void;
  onUserUpdate: (updated: CommunityUser) => void;
}

export const CommunitySettingsModal: React.FC<Props> = ({
  currentUser,
  onClose,
  onLogout,
  onUserUpdate,
}) => {
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [customStatus, setCustomStatus] = useState(currentUser?.customStatus || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    if (!currentUser) return;
    const updated = {
      ...currentUser,
      displayName: displayName.trim() || currentUser.displayName,
      customStatus: customStatus.trim(),
    };
    saveSession(localStorage.getItem('aniread_community_token') || '', updated);
    onUserUpdate(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleLogout = () => {
    clearSession();
    onLogout();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-black text-white">Community Settings & Profile</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {currentUser ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
              <img
                src={currentUser.avatar}
                alt=""
                className="w-12 h-12 rounded-2xl object-cover border border-indigo-500"
              />
              <div>
                <span className="text-sm font-bold text-white block">{currentUser.displayName}</span>
                <span className="text-xs text-indigo-400 font-mono">@{currentUser.username}</span>
                <span className="text-[10px] text-slate-500 block">{currentUser.hunterRank}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Custom Status Bio</label>
              <input
                type="text"
                value={customStatus}
                onChange={(e) => setCustomStatus(e.target.value)}
                placeholder="What are you currently reading or playing?"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>

              <button
                onClick={handleLogout}
                className="py-2.5 px-4 rounded-xl bg-slate-950 hover:bg-rose-950/60 border border-slate-800 text-slate-400 hover:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-3">
            <User className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">
              You are currently browsing as a Guest. Log in to personalize your profile and participate in discussions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
