import { Participant } from '../../types';

export interface FriendItemProps {
  friend: Participant;
  onPress: () => void;
  onDelete: () => void;
}

export interface NewFriendData {
  name: string;
  email: string;
  phone: string;
  alias_cbu: string;
}

export type TabType = 'list' | 'new';

export interface ManageFriendsScreenState {
  activeTab: TabType;
  searchQuery: string;
  friends: Participant[];
  filteredFriends: Participant[];
  editingFriend: Participant | null;
  newFriend: NewFriendData;
}

// Avatar colors for consistent friend identification
export const AVATAR_COLORS = [
  '#FF6B6B', 
  '#4ECDC4', 
  '#45B7D1', 
  '#96CEB4', 
  '#FECA57', 
  '#FF9FF3', 
  '#54A0FF', 
  '#5F27CD'
];