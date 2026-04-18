
export interface SleepLog {
  id: string;
  startTime: number; // timestamp
  endTime: number | null; // timestamp
  durationMinutes: number;
  pointsEarned: number;
  qualityRating?: number; // 1-5 stars
}

export interface RedemptionLog {
  id: string;
  rewardId: string;
  rewardName: string;
  cost: number;
  timestamp: number;
  emoji?: string; // Added field to preserve emoji at time of redemption
}

export interface Reward {
  id: string;
  name: string;
  cost: number;
  emoji: string;
  redemptionCount: number;
  // Removed dailyLimit
}

export interface ReportWeights {
  bedtime: number;
  duration: number;
  rating: number;
}

export interface PointRule {
  maxDailyPoints: number; // Max points for sleeping early
  penaltyPoints: number;  // Points deducted for sleeping late (after 00:00)
  reportWeights: ReportWeights; // Custom weights for monthly report
  targetDurationHours: number; // New: User defined ideal sleep duration (default 7.5)
}

// Renamed from AppData to UserProfile to represent a single user's data
export interface UserProfile {
  id: string; // Unique ID for the profile
  username: string; // User identity
  userBalance: number;
  logs: SleepLog[];
  rewards: Reward[];
  redemptionLogs: RedemptionLog[]; // New field for history
  pointRule: PointRule;
  isSleeping: boolean;
  currentSleepStart: number | null;
  notificationsEnabled: boolean; // New field for settings
}

// New container for multi-user support
export interface GlobalState {
  activeProfileId: string;
  profiles: UserProfile[];
}

export enum Tab {
  TRACKER = 'tracker',
  SHOP = 'shop',
  LOG = 'log', // Renamed from ANALYSIS
  SETTINGS = 'settings'
}
