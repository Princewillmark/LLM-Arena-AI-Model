export type ModelCategory =
  | 'General'
  | 'Coding'
  | 'Reasoning'
  | 'Mathematics'
  | 'Writing'
  | 'Research'
  | 'Business';

export interface ModelCatalogItem {
  modelId: string;
  provider: string;
  displayName: string;
  available: boolean;
  capabilities: string[];
  inputPricing: number; // USD per 1M tokens
  outputPricing: number; // USD per 1M tokens
  contextWindow: number;
  description: string;
  tags: string[];
}

export type ResponseStatus = 'queued' | 'running' | 'streaming' | 'completed' | 'failed' | 'cancelled';

export interface ModelResponse {
  id: string;
  competitionId: string;
  modelId: string;
  provider: string;
  responseText: string;
  responseStatus: ResponseStatus;
  timeToFirstTokenMs: number | null;
  totalDurationMs: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  tokensPerSecond: number | null;
  reportedCost: number | null;
  costSource: 'provider_reported' | 'estimated' | 'unavailable';
  errorMessage?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface Competition {
  id: string;
  ownerUid: string;
  prompt: string;
  systemInstruction?: string;
  selectedModels: string[];
  status: 'pending' | 'running' | 'completed' | 'cancelled';
  category: ModelCategory;
  visibility: 'public' | 'private' | 'unlisted';
  createdAt: string;
  completedAt?: string | null;
  responses: ModelResponse[];
  hasVoted?: boolean;
  userVote?: Vote | null;
}

export type VoteType = 'model_a' | 'model_b' | 'model_c' | 'tie' | 'both_bad';

export interface Vote {
  id: string;
  competitionId: string;
  firebaseUid: string;
  selectedResponseId: string | null;
  voteType: VoteType;
  createdAt: string;
}

export interface ModelStatistic {
  modelId: string;
  provider: string;
  displayName: string;
  totalVotes: number;
  totalWins: number;
  totalCompetitions: number;
  averageTimeToFirstToken: number;
  averageResponseDuration: number;
  totalReportedCost: number;
  eloScore: number;
  winRate: number; // calculated percentage
  updatedAt: string;
}

export interface SavedPrompt {
  id: string;
  firebaseUid: string;
  title: string;
  prompt: string;
  category: ModelCategory;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  firebaseUid: string;
  displayName: string;
  email: string;
  photoUrl?: string;
  accountStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompetitionStreamChunk {
  type: 'init' | 'chunk' | 'stats' | 'error' | 'done';
  competitionId?: string;
  modelIndex?: number;
  modelId?: string;
  maskedName?: string;
  textDelta?: string;
  stats?: Partial<ModelResponse>;
  error?: string;
}
