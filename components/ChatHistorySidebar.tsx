import React from 'react';
import { ChatSession } from '../types';
import { MessageSquare, Plus, Trash2, LogOut } from 'lucide-react';

interface ChatHistorySidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onLogout,
  isOpen,
  onClose
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-30
        w-64 bg-slate-900 text-slate-100 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        md:h-full md:rounded-l-2xl
      `}>
        
        {/* Header / New Chat */}
        <div className="p-4 border-b border-slate-700">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-3 rounded-xl transition-colors font-medium shadow-lg shadow-violet-900/20"
          >
            <Plus className="w-5 h-5" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2 mt-2">
            History
          </div>
          
          {sessions.length === 0 && (
            <div className="text-slate-500 text-sm px-2 text-center py-4">
              No previous chats.
            </div>
          )}

          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => {
                onSelectSession(session.id);
                if (window.innerWidth < 768) onClose();
              }}
              className={`w-full group flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                currentSessionId === session.id 
                  ? 'bg-slate-800 text-white' 
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <div className="truncate text-sm">
                  <div className="font-medium truncate">{session.title}</div>
                  <div className="text-xs opacity-60 truncate">{session.preview}</div>
                </div>
              </div>
              
              <div 
                onClick={(e) => onDeleteSession(session.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-500/20 hover:text-rose-400 rounded transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors w-full p-2 rounded-lg hover:bg-slate-800"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Log out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default ChatHistorySidebar;