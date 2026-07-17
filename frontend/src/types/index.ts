export type TradeDirection = 'long' | 'short';
export type TradeResult = 'win' | 'loss' | 'breakeven';
export type TradeStatus = 'open' | 'closed' | 'planned';
export type EmotionTag =
  | 'confident'
  | 'fearful'
  | 'greedy'
  | 'patient'
  | 'fomo'
  | 'calm'
  | 'revenge'
  | 'disciplined';
export type SessionType = 'asian' | 'london' | 'newyork' | 'overlap';
export type ViewId =
  | 'dashboard'
  | 'journal'
  | 'analytics'
  | 'calendar'
  | 'playbook'
  | 'psychology'
  | 'arena'
  | 'chat'
  | 'reports'
  | 'news'
  | 'settings';

/* Public snapshot a user opts in to share — NO private data, just stats */
export interface PublicSnapshot {
  userId: string;
  displayName: string;
  avatarUrl: string;
  accentColor: string;
  role: string;
  shareEnabled: boolean;
  updatedAt: string;
  /* aggregated stats only — never individual trade details */
  stats: {
    totalTrades: number;
    closedTrades: number;
    winRate: number;
    totalPnl: number;
    profitFactor: number;
    avgRiskReward: number;
    expectancy: number;
    maxDrawdown: number;
    totalPips: number;
    planAdherence: number;
    bestTrade: number;
    consecutiveWins: number;
    avgWin: number;
    avgLoss: number;
  };
  /* timeline — date → cumulative pnl (no price/size details) */
  equityCurve: { date: string; equity: number }[];
  /* monthly breakdown */
  monthly: { month: string; pnl: number; trades: number; winRate: number }[];
  /* weekly breakdown */
  weekly: { week: string; pnl: number; trades: number }[];
  /* top pairs by pnl */
  topPairs: { pair: string; pnl: number; trades: number; winRate: number }[];
  /* strategy breakdown */
  strategies: { name: string; pnl: number; winRate: number; trades: number }[];
  /* emotion wins */
  emotions: { emotion: string; pnl: number; winRate: number }[];
}

export interface Trade {
  id: string;
  ticket?: string;
  pair: string;
  direction: TradeDirection;
  status: TradeStatus;
  result?: TradeResult;
  entryPrice: number;
  exitPrice?: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  riskReward?: number;
  riskAmount: number;
  pnl?: number;
  pips?: number;
  commission?: number;
  swap?: number;
  openTime: string;
  closeTime?: string;
  session: SessionType;
  strategy: string;
  setup: string;
  timeframe: string;
  emotions: EmotionTag[];
  tags: string[];
  notes: string;
  lessons: string;
  screenshotUrl?: string;
  rating: number;
  followedPlan: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  rules: string[];
  timeframes: string[];
  pairs: string[];
  winRate?: number;
  totalTrades?: number;
  color: string;
}

export interface JournalSettings {
  accountBalance: number;
  accountCurrency: string;
  riskPerTrade: number;
  traderName: string;
  broker: string;
  themeAccent: 'cyan' | 'gold' | 'emerald' | 'violet';
  defaultLotSize: number;
  pipValue: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  tags: string[];
  avatarUrl: string;
  avatarColor: string;
  badge: string;
  isCreator: boolean;
  joinedAt: string;
}

/* ═══ CHAT GROUPS ═══ */
export interface ChatGroup {
  id: string;
  name: string;
  description: string;
  icon: string;          // emoji
  color: string;         // hex accent
  memberIds: string[];   // userIds
  createdBy: string;     // userId
  createdAt: string;
  isDefault: boolean;    // "General" group everyone auto-joins
}

export interface ChatMessage {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorColor: string;
  text: string;
  type: 'text' | 'trade' | 'pnl' | 'sticker' | 'gif' | 'picture' | 'system';
  tradeRef?: { pair: string; pnl: number; result: 'win' | 'loss' | 'breakeven' };
  mediaUrl?: string;   // for type==='gif' or 'picture'
  createdAt: string;
}

/* ═══ FOREX NEWS / FORECASTS ═══ */
export interface ForexNewsItem {
  id: string;
  title: string;
  currency: string;       // e.g. "USD", "EUR"
  impact: 'high' | 'medium' | 'low';
  forecast: string;       // e.g. "3.2%"
  previous: string;
  actual?: string;
  date: string;           // ISO
  source: string;
  category: 'economic' | 'central-bank' | 'geopolitical' | 'forecast';
  description: string;
  affectedPairs: string[]; // e.g. ['EURUSD', 'XAUUSD']
}

export interface WeeklyForecast {
  weekOf: string;         // ISO Monday date
  summary: string;
  keyEvents: string[];    // titles
  topPairs: { pair: string; bias: 'bullish' | 'bearish' | 'neutral'; reason: string }[];
  generatedAt: string;
}

export interface AppState {
  trades: Trade[];
  strategies: Strategy[];
  settings: JournalSettings;
}

export interface TradeFilters {
  search: string;
  pair: string;
  direction: 'all' | TradeDirection;
  result: 'all' | TradeResult;
  strategy: string;
  session: 'all' | SessionType;
  dateFrom: string;
  dateTo: string;
}

export interface PerformanceStats {
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  wins: number;
  losses: number;
  breakevens: number;
  winRate: number;
  totalPnl: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  bestTrade: number;
  worstTrade: number;
  avgRiskReward: number;
  expectancy: number;
  maxDrawdown: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  totalPips: number;
  planAdherence: number;
}
