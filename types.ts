
export enum Sender {
  USER = 'user',
  AI = 'model'
}

export interface Message {
  id: string;
  text: string;
  image?: string; // Base64 data URI for generated images
  detectedMood?: string; // e.g. "Stressed", "Happy"
  sender: Sender;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  preview: string;
  updatedAt: number;
}

export interface Goal {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export enum MoodType {
  GREAT = 'great',
  GOOD = 'good',
  OKAY = 'okay',
  BAD = 'bad',
  TERRIBLE = 'terrible'
}

export interface MoodEntry {
  id: string;
  mood: MoodType;
  note?: string;
  timestamp: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string; // Stored simply for this demo
  age?: string;
  occupation?: string;
  bio?: string; // "What do you want to achieve?"
  onboardingComplete: boolean;
  avatar?: string;
}
