export interface LinkItem {
  id: string;
  title: string;
  url: string;
  emoji: string;
  color: string;
}

export interface UserProfile {
  name: string;
  bio: string;
  avatarUrl: string;
}

export interface WindowState {
  isOpen: boolean;
  isMinimized: boolean;
  zIndex: number;
}

export type AppId = 'links' | 'settings' | 'about';

export const COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-red-500',
  'bg-orange-500',
  'bg-yellow-500',
  'bg-green-500',
  'bg-teal-500',
];