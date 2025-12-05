import { Goal, MoodEntry, UserProfile, Message, ChatSession } from '../types';

// We now prefix keys with the User ID to simulate a database for multiple users
const getKeys = (userId: string) => ({
  PROFILE: `lumi_${userId}_profile`,
  GOALS: `lumi_${userId}_goals`,
  MOODS: `lumi_${userId}_moods`,
  SESSIONS: `lumi_${userId}_sessions`, // List of sessions
  SESSION_MSGS: (sessionId: string) => `lumi_${userId}_msg_${sessionId}` // Specific messages
});

const GLOBAL_KEYS = {
  LAST_USER: 'lumi_last_user_id',
  USERS_LIST: 'lumi_users_directory' // Stores list of {id, email, password} for auth
};

export const StorageService = {
  // --- Global Auth Helpers ---
  getUsersDirectory: (): {id: string, email: string, password?: string, name: string}[] => {
    const data = localStorage.getItem(GLOBAL_KEYS.USERS_LIST);
    return data ? JSON.parse(data) : [];
  },

  registerUser: (profileData: Partial<UserProfile>): UserProfile => {
    // Generate simple ID
    const id = (profileData.name || 'user').toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString().slice(-4);
    
    const newProfile: UserProfile = {
      id,
      name: profileData.name || 'User',
      email: profileData.email || '',
      password: profileData.password,
      age: profileData.age,
      occupation: profileData.occupation,
      bio: profileData.bio,
      onboardingComplete: true
    };
    
    // Update directory
    const dir = StorageService.getUsersDirectory();
    // Check if email exists
    if (dir.some(u => u.email === newProfile.email)) {
      throw new Error("User already exists");
    }

    dir.push({ 
      id, 
      email: newProfile.email!, 
      password: newProfile.password, 
      name: newProfile.name 
    });
    localStorage.setItem(GLOBAL_KEYS.USERS_LIST, JSON.stringify(dir));
    
    // Save profile
    const keys = getKeys(id);
    localStorage.setItem(keys.PROFILE, JSON.stringify(newProfile));
    
    return newProfile;
  },

  loginUser: (email: string, password: string): UserProfile | null => {
    const dir = StorageService.getUsersDirectory();
    const user = dir.find(u => u.email === email && u.password === password);
    
    if (user) {
      return StorageService.getProfile(user.id);
    }
    return null;
  },

  getLastUserId: () => localStorage.getItem(GLOBAL_KEYS.LAST_USER),
  setLastUserId: (id: string) => localStorage.setItem(GLOBAL_KEYS.LAST_USER, id),

  // --- Per User Data ---
  
  getProfile: (userId: string): UserProfile | null => {
    const keys = getKeys(userId);
    const data = localStorage.getItem(keys.PROFILE);
    return data ? JSON.parse(data) : null;
  },

  getGoals: (userId: string): Goal[] => {
    const keys = getKeys(userId);
    const data = localStorage.getItem(keys.GOALS);
    return data ? JSON.parse(data) : [];
  },

  saveGoals: (userId: string, goals: Goal[]) => {
    const keys = getKeys(userId);
    localStorage.setItem(keys.GOALS, JSON.stringify(goals));
  },
  
  getMoods: (userId: string): MoodEntry[] => {
    const keys = getKeys(userId);
    const data = localStorage.getItem(keys.MOODS);
    return data ? JSON.parse(data) : [];
  },

  saveMood: (userId: string, entry: MoodEntry) => {
    const keys = getKeys(userId);
    const current = StorageService.getMoods(userId);
    const updated = [entry, ...current];
    localStorage.setItem(keys.MOODS, JSON.stringify(updated));
  },

  // --- Chat Sessions Management ---

  getSessions: (userId: string): ChatSession[] => {
    const keys = getKeys(userId);
    const data = localStorage.getItem(keys.SESSIONS);
    return data ? JSON.parse(data) : [];
  },

  createSession: (userId: string): ChatSession => {
    const keys = getKeys(userId);
    const sessions = StorageService.getSessions(userId);
    
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Conversation',
      preview: 'Start chatting...',
      updatedAt: Date.now()
    };
    
    const updated = [newSession, ...sessions];
    localStorage.setItem(keys.SESSIONS, JSON.stringify(updated));
    return newSession;
  },

  updateSessionPreview: (userId: string, sessionId: string, lastMessage: string) => {
    const keys = getKeys(userId);
    const sessions = StorageService.getSessions(userId);
    const updated = sessions.map(s => {
      if (s.id === sessionId) {
        return { 
          ...s, 
          preview: lastMessage.slice(0, 50) + (lastMessage.length > 50 ? '...' : ''),
          updatedAt: Date.now()
        };
      }
      return s;
    });
    // Sort by newest
    updated.sort((a, b) => b.updatedAt - a.updatedAt);
    localStorage.setItem(keys.SESSIONS, JSON.stringify(updated));
  },
  
  deleteSession: (userId: string, sessionId: string) => {
    const keys = getKeys(userId);
    
    // 1. Remove from session list
    const sessions = StorageService.getSessions(userId).filter(s => s.id !== sessionId);
    localStorage.setItem(keys.SESSIONS, JSON.stringify(sessions));

    // 2. Remove actual messages
    localStorage.removeItem(keys.SESSION_MSGS(sessionId));
  },

  getMessages: (userId: string, sessionId: string): Message[] => {
    const keys = getKeys(userId);
    const data = localStorage.getItem(keys.SESSION_MSGS(sessionId));
    return data ? JSON.parse(data) : [];
  },

  saveMessages: (userId: string, sessionId: string, messages: Message[]) => {
    const keys = getKeys(userId);
    // Limit to 100 messages per session for performance
    const trimmed = messages.slice(-100); 
    localStorage.setItem(keys.SESSION_MSGS(sessionId), JSON.stringify(trimmed));
  },

  // --- Global Memory ---
  // Retrieves messages from all *other* sessions to act as long-term memory
  getGlobalMemory: (userId: string, currentSessionId: string): string => {
    const sessions = StorageService.getSessions(userId);
    // Exclude current session
    const pastSessions = sessions.filter(s => s.id !== currentSessionId);
    
    let allPastMessages: Message[] = [];
    
    // Gather messages
    pastSessions.forEach(s => {
       const msgs = StorageService.getMessages(userId, s.id);
       allPastMessages = [...allPastMessages, ...msgs];
    });

    // Sort by timestamp descending (newest first)
    allPastMessages.sort((a, b) => b.timestamp - a.timestamp);

    // Take the last 30 messages across all history to serve as context
    // This prevents token overflow while keeping recent relevant history
    const recentGlobal = allPastMessages.slice(0, 30);

    // Sort back to chronological order for the AI to understand the timeline
    recentGlobal.sort((a, b) => a.timestamp - b.timestamp);

    return recentGlobal.map(m => {
      const role = m.sender === 'user' ? 'User' : 'Lumi';
      const content = m.text;
      const meta = m.image ? ' [Generated an Image Attachment]' : '';
      return `[Past Chat] ${role}: ${content}${meta}`;
    }).join('\n');
  }
};