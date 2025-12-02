
export interface SleepLog {
  id: string;
  startTime: number; // timestamp
  endTime: number | null; // timestamp
  durationMinutes: number;
  pointsEarned: number;
  qualityRating?: number; // 1-5 stars
}

export interface Reward {
  id: string;
  name: string;
  cost: number;
  emoji: string;
  redemptionCount: number;
}

export interface PointRule {
  maxDailyPoints: number; // Max points for sleeping early
  penaltyPoints: number;  // Points deducted for sleeping late (after 00:00)
}

// Renamed from AppData to UserProfile to represent a single user's data
export interface UserProfile {
  id: string; // Unique ID for the profile
  username: string; // User identity
  userBalance: number;
  logs: SleepLog[];
  rewards: Reward[];
  pointRule: PointRule;
  isSleeping: boolean;
  currentSleepStart: number | null;
}

// New container for multi-user support
export interface GlobalState {
  activeProfileId: string;
  profiles: UserProfile[];
}

export enum Tab {
  TRACKER = 'tracker',
  SHOP = 'shop',
  ANALYSIS = 'analysis',
  SETTINGS = 'settings'
}
