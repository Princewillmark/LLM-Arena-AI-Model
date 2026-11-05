import {
  ModelCatalogItem,
  ModelStatistic,
  Competition,
  ModelResponse,
  Vote,
  SavedPrompt,
  UserProfile,
  VoteType,
  ModelCategory
} from '../src/types/arena';
import crypto from 'crypto';

// In-memory relational store with seed data mirroring Firebase SQL Connect Cloud SQL
class DatabaseService {
  private users: Map<string, UserProfile> = new Map();
  private competitions: Map<string, Competition> = new Map();
  private responses: Map<string, ModelResponse> = new Map();
  private votes: Map<string, Vote> = new Map(); // key: `${competitionId}:${firebaseUid}`
  private stats: Map<string, ModelStatistic> = new Map();
  private savedPrompts: Map<string, SavedPrompt> = new Map();
  private catalog: Map<string, ModelCatalogItem> = new Map();

  constructor() {
    this.seedCatalog();
    this.seedStats();
    this.seedPrompts();
  }

  private seedCatalog() {
    const models: ModelCatalogItem[] = [
      {
        modelId: 'gemini-3.1-pro',
        provider: 'Google GenAI',
        displayName: 'Gemini 3.1 Pro',
        available: true,
        capabilities: ['Complex Reasoning', 'Coding & Architecture', 'Long Context', 'Multimodal'],
        inputPricing: 1.25,
        outputPricing: 5.00,
        contextWindow: 1000000,
        description: 'Google’s state-of-the-art flagship reasoning model with 1M context window and profound multimodal analysis.',
        tags: ['Reasoning', 'Flagship', 'Google']
      },
      {
        modelId: 'gemini-3.8-flash',
        provider: 'Google GenAI',
        displayName: 'Gemini 3.8 Flash',
        available: true,
        capabilities: ['Sub-second Latency', 'High Throughput', 'Cost Efficient', 'Coding'],
        inputPricing: 0.075,
        outputPricing: 0.30,
        contextWindow: 1000000,
        description: 'Ultra-fast multimodal workhorse designed for instantaneous response streaming and high-frequency benchmarks.',
        tags: ['Fast', 'Efficient', 'Google']
      },
      {
        modelId: 'openai/gpt-4o',
        provider: 'OpenAI / OpenRouter',
        displayName: 'GPT-4o (Omni)',
        available: true,
        capabilities: ['General Intelligence', 'Creative Writing', 'Instruction Following', 'Vision'],
        inputPricing: 2.50,
        outputPricing: 10.00,
        contextWindow: 128000,
        description: 'Omni-directional intelligence model from OpenAI balancing reasoning, conversational finesse, and speed.',
        tags: ['Omni', 'Popular', 'OpenAI']
      },
      {
        modelId: 'anthropic/claude-3.5-sonnet',
        provider: 'Anthropic / OpenRouter',
        displayName: 'Claude 3.5 Sonnet',
        available: true,
        capabilities: ['Elite Coding', 'Nuanced Writing', 'Mathematical Logic', 'Zero Slop'],
        inputPricing: 3.00,
        outputPricing: 15.00,
        contextWindow: 200000,
        description: 'Anthropic’s highest benchmark coding & writing intelligence engine with exceptional human-like prose.',
        tags: ['Coding', 'SOTA', 'Anthropic']
      },
      {
        modelId: 'deepseek/deepseek-chat',
        provider: 'DeepSeek / OpenRouter',
        displayName: 'DeepSeek V3',
        available: true,
        capabilities: ['Cost Efficient', 'High Speed', 'General Knowledge', 'Code Generation'],
        inputPricing: 0.14,
        outputPricing: 0.28,
        contextWindow: 64000,
        description: '671B parameter Mixture-of-Experts architecture delivering frontier capabilities at ultra-disruptive pricing.',
        tags: ['MoE', 'Open Weights', 'DeepSeek']
      },
      {
        modelId: 'deepseek/deepseek-r1',
        provider: 'DeepSeek / OpenRouter',
        displayName: 'DeepSeek R1',
        available: true,
        capabilities: ['Chain of Thought', 'Mathematical Olympiad', 'Code Proofs', 'Deep Reasoning'],
        inputPricing: 0.55,
        outputPricing: 2.19,
        contextWindow: 64000,
        description: 'Reinforcement-learning tuned reasoning powerhouse that emits extensive internal thinking chains for tough puzzles.',
        tags: ['Reasoning', 'Math', 'DeepSeek']
      },
      {
        modelId: 'meta-llama/llama-3.3-70b-instruct',
        provider: 'Meta / OpenRouter',
        displayName: 'Llama 3.3 70B Instruct',
        available: true,
        capabilities: ['Open Source', 'Instruction Following', 'Concise Output', 'Multilingual'],
        inputPricing: 0.12,
        outputPricing: 0.30,
        contextWindow: 128000,
        description: 'Meta’s leading open-weights frontier model matching 405B capabilities with streamlined 70B efficiency.',
        tags: ['Open Source', 'Meta']
      },
      {
        modelId: 'mistralai/mistral-large-2411',
        provider: 'Mistral AI / OpenRouter',
        displayName: 'Mistral Large 2',
        available: true,
        capabilities: ['Multilingual Reasoning', 'Agentic Workflows', 'Precision Synthesis'],
        inputPricing: 2.00,
        outputPricing: 6.00,
        contextWindow: 128000,
        description: 'Mistral flagship model with top-tier multi-language reasoning, strict instruction fidelity, and code prowess.',
        tags: ['European Frontier', 'Mistral']
      }
    ];

    for (const m of models) {
      this.catalog.set(m.modelId, m);
    }
  }

  private seedStats() {
    const seedStatsData: Array<Omit<ModelStatistic, 'winRate'>> = [
      {
        modelId: 'anthropic/claude-3.5-sonnet',
        provider: 'Anthropic',
        displayName: 'Claude 3.5 Sonnet',
        totalVotes: 1420,
        totalWins: 980,
        totalCompetitions: 1510,
        averageTimeToFirstToken: 480,
        averageResponseDuration: 3200,
        totalReportedCost: 8.45,
        eloScore: 1342,
        updatedAt: new Date().toISOString()
      },
      {
        modelId: 'gemini-3.1-pro',
        provider: 'Google GenAI',
        displayName: 'Gemini 3.1 Pro',
        totalVotes: 1390,
        totalWins: 935,
        totalCompetitions: 1480,
        averageTimeToFirstToken: 420,
        averageResponseDuration: 2950,
        totalReportedCost: 5.12,
        eloScore: 1335,
        updatedAt: new Date().toISOString()
      },
      {
        modelId: 'deepseek/deepseek-r1',
        provider: 'DeepSeek',
        displayName: 'DeepSeek R1',
        totalVotes: 1210,
        totalWins: 795,
        totalCompetitions: 1340,
        averageTimeToFirstToken: 820,
        averageResponseDuration: 6100,
        totalReportedCost: 2.10,
        eloScore: 1318,
        updatedAt: new Date().toISOString()
      },
      {
        modelId: 'openai/gpt-4o',
        provider: 'OpenAI',
        displayName: 'GPT-4o (Omni)',
        totalVotes: 1530,
        totalWins: 940,
        totalCompetitions: 1620,
        averageTimeToFirstToken: 510,
        averageResponseDuration: 3400,
        totalReportedCost: 9.80,
        eloScore: 1305,
        updatedAt: new Date().toISOString()
      },
      {
        modelId: 'gemini-3.8-flash',
        provider: 'Google GenAI',
        displayName: 'Gemini 3.8 Flash',
        totalVotes: 1180,
        totalWins: 650,
        totalCompetitions: 1290,
        averageTimeToFirstToken: 240,
        averageResponseDuration: 1450,
        totalReportedCost: 0.88,
        eloScore: 1264,
        updatedAt: new Date().toISOString()
      },
      {
        modelId: 'deepseek/deepseek-chat',
        provider: 'DeepSeek',
        displayName: 'DeepSeek V3',
        totalVotes: 1040,
        totalWins: 580,
        totalCompetitions: 1150,
        averageTimeToFirstToken: 390,
        averageResponseDuration: 2600,
        totalReportedCost: 0.62,
        eloScore: 1252,
        updatedAt: new Date().toISOString()
      },
      {
        modelId: 'meta-llama/llama-3.3-70b-instruct',
        provider: 'Meta',
        displayName: 'Llama 3.3 70B Instruct',
        totalVotes: 980,
        totalWins: 510,
        totalCompetitions: 1100,
        averageTimeToFirstToken: 380,
        averageResponseDuration: 2750,
        totalReportedCost: 0.58,
        eloScore: 1240,
        updatedAt: new Date().toISOString()
      },
      {
        modelId: 'mistralai/mistral-large-2411',
        provider: 'Mistral AI',
        displayName: 'Mistral Large 2',
        totalVotes: 890,
        totalWins: 430,
        totalCompetitions: 1020,
        averageTimeToFirstToken: 520,
        averageResponseDuration: 3300,
        totalReportedCost: 4.20,
        eloScore: 1222,
        updatedAt: new Date().toISOString()
      }
    ];

    for (const s of seedStatsData) {
      const winRate = s.totalVotes > 0 ? Math.round((s.totalWins / s.totalVotes) * 100) : 0;
      this.stats.set(s.modelId, { ...s, winRate });
    }
  }

  private seedPrompts() {
    const seedPrompts: Array<Omit<SavedPrompt, 'id' | 'createdAt' | 'updatedAt'>> = [
      {
        firebaseUid: 'system_curated',
        title: 'Concurrent Rate Limiter (TypeScript)',
        prompt: 'Design and implement a robust production-ready Token Bucket Rate Limiter in TypeScript with support for asynchronous Redis backplane, sliding window burst mitigation, and zero-dependency unit test mock.',
        category: 'Coding'
      },
      {
        firebaseUid: 'system_curated',
        title: 'The River Crossing with Hungry Wolves',
        prompt: 'Three explorers and three hungry wolves must cross a river using a boat that holds at most two entities. If wolves ever outnumber explorers on either bank, the explorers are eaten. Only one explorer and one wolf know how to row. Detail the exact step-by-step sequence of crossings.',
        category: 'Reasoning'
      },
      {
        firebaseUid: 'system_curated',
        title: 'Formal Proof of Irrationality for sqrt(2)',
        prompt: 'Provide a rigorous, step-by-step mathematical proof by contradiction that the square root of 2 is irrational. Conclude by generalizing the result to any square-free positive integer n.',
        category: 'Mathematics'
      },
      {
        firebaseUid: 'system_curated',
        title: 'Cyberpunk Noir Monologue',
        prompt: 'Write a gripping 3-paragraph monologue spoken by a weary cybernetic memory recovery technician sitting in a neon-drenched ramen stall at 3:14 AM in Neo-Kyoto. Avoid generic clichés.',
        category: 'Writing'
      },
      {
        firebaseUid: 'system_curated',
        title: 'Zero-Knowledge Proofs in Decentralized Identity',
        prompt: 'Explain how Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge (zk-SNARKs) can be utilized to verify age and identity without disclosing date of birth or name. Detail the mathematical principles, prover/verifier interactions, and potential attack vectors.',
        category: 'Research'
      },
      {
        firebaseUid: 'system_curated',
        title: 'Enterprise SaaS Pricing & GTM Strategy',
        prompt: 'Formulate an enterprise go-to-market pricing model for a B2B AI developer tool, contrasting Seat-based, Usage-based (Token consumption), and Hybrid tiered models with concrete CAC/LTV projections.',
        category: 'Business'
      }
    ];

    for (const p of seedPrompts) {
      const id = crypto.randomUUID();
      this.savedPrompts.set(id, {
        ...p,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  // --- Model Catalog ---
  public getCatalog(): ModelCatalogItem[] {
    return Array.from(this.catalog.values());
  }

  public getModel(modelId: string): ModelCatalogItem | undefined {
    return this.catalog.get(modelId);
  }

  // --- Leaderboard & Stats ---
  public getLeaderboard(category?: ModelCategory): ModelStatistic[] {
    const list = Array.from(this.stats.values());
    return list.sort((a, b) => b.eloScore - a.eloScore);
  }

  // --- Users ---
  public upsertUser(firebaseUid: string, data: { displayName?: string; email?: string; photoUrl?: string }): UserProfile {
    const existing = this.users.get(firebaseUid);
    const now = new Date().toISOString();
    if (existing) {
      const updated: UserProfile = {
        ...existing,
        displayName: data.displayName || existing.displayName,
        email: data.email || existing.email,
        photoUrl: data.photoUrl || existing.photoUrl,
        updatedAt: now
      };
      this.users.set(firebaseUid, updated);
      return updated;
    } else {
      const newUser: UserProfile = {
        id: crypto.randomUUID(),
        firebaseUid,
        displayName: data.displayName || 'Arena Competitor',
        email: data.email || `${firebaseUid.slice(0, 8)}@arena.io`,
        photoUrl: data.photoUrl,
        accountStatus: 'active',
        createdAt: now,
        updatedAt: now
      };
      this.users.set(firebaseUid, newUser);
      return newUser;
    }
  }

  public getUser(firebaseUid: string): UserProfile | undefined {
    return this.users.get(firebaseUid);
  }

  // --- Competitions ---
  public createCompetition(data: {
    ownerUid: string;
    prompt: string;
    systemInstruction?: string;
    selectedModels: string[];
    category?: ModelCategory;
    visibility?: 'public' | 'private' | 'unlisted';
  }): Competition {
    const id = crypto.randomUUID();
    const comp: Competition = {
      id,
      ownerUid: data.ownerUid,
      prompt: data.prompt,
      systemInstruction: data.systemInstruction,
      selectedModels: data.selectedModels,
      status: 'running',
      category: data.category || 'General',
      visibility: data.visibility || 'public',
      createdAt: new Date().toISOString(),
      responses: []
    };
    this.competitions.set(id, comp);
    return comp;
  }

  public getCompetition(id: string): Competition | undefined {
    return this.competitions.get(id);
  }

  public getUserCompetitions(ownerUid: string): Competition[] {
    return Array.from(this.competitions.values())
      .filter(c => c.ownerUid === ownerUid)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public saveModelResponse(response: ModelResponse): void {
    this.responses.set(response.id, response);
    const comp = this.competitions.get(response.competitionId);
    if (comp) {
      const idx = comp.responses.findIndex(r => r.id === response.id);
      if (idx >= 0) {
        comp.responses[idx] = response;
      } else {
        comp.responses.push(response);
      }
      // If all models completed
      if (comp.responses.length === comp.selectedModels.length &&
          comp.responses.every(r => r.responseStatus === 'completed' || r.responseStatus === 'failed')) {
        comp.status = 'completed';
        comp.completedAt = new Date().toISOString();
      }
    }
  }

  // --- Votes ---
  public submitVote(competitionId: string, firebaseUid: string, voteType: VoteType, selectedResponseId: string | null): {
    success: boolean;
    vote?: Vote;
    error?: string;
  } {
    const comp = this.competitions.get(competitionId);
    if (!comp) {
      return { success: false, error: 'Competition not found.' };
    }

    const voteKey = `${competitionId}:${firebaseUid}`;
    if (this.votes.has(voteKey)) {
      return { success: false, error: 'You have already submitted a vote for this competition.' };
    }

    const vote: Vote = {
      id: crypto.randomUUID(),
      competitionId,
      firebaseUid,
      selectedResponseId,
      voteType,
      createdAt: new Date().toISOString()
    };

    this.votes.set(voteKey, vote);
    comp.hasVoted = true;
    comp.userVote = vote;

    // Update statistics & Elo for participating models
    this.processVoteStatistics(comp, vote);

    return { success: true, vote };
  }

  private processVoteStatistics(competition: Competition, vote: Vote) {
    const responses = competition.responses;
    if (!responses || responses.length === 0) return;

    // Determine winning response
    let winningModelId: string | null = null;
    if (vote.voteType === 'model_a' && responses[0]) winningModelId = responses[0].modelId;
    if (vote.voteType === 'model_b' && responses[1]) winningModelId = responses[1].modelId;
    if (vote.voteType === 'model_c' && responses[2]) winningModelId = responses[2].modelId;

    for (const r of responses) {
      let stat = this.stats.get(r.modelId);
      if (!stat) {
        const cat = this.catalog.get(r.modelId);
        stat = {
          modelId: r.modelId,
          provider: r.provider,
          displayName: cat ? cat.displayName : r.modelId,
          totalVotes: 0,
          totalWins: 0,
          totalCompetitions: 0,
          averageTimeToFirstToken: r.timeToFirstTokenMs || 400,
          averageResponseDuration: r.totalDurationMs || 3000,
          totalReportedCost: r.reportedCost || 0,
          eloScore: 1200,
          winRate: 0,
          updatedAt: new Date().toISOString()
        };
        this.stats.set(r.modelId, stat);
      }

      stat.totalCompetitions += 1;
      stat.totalVotes += 1;
      if (r.reportedCost) stat.totalReportedCost += r.reportedCost;

      // Running average for TTFT & duration
      if (r.timeToFirstTokenMs) {
        stat.averageTimeToFirstToken = Math.round((stat.averageTimeToFirstToken * 0.9) + (r.timeToFirstTokenMs * 0.1));
      }
      if (r.totalDurationMs) {
        stat.averageResponseDuration = Math.round((stat.averageResponseDuration * 0.9) + (r.totalDurationMs * 0.1));
      }

      if (winningModelId === r.modelId) {
        stat.totalWins += 1;
        stat.eloScore = Math.min(1800, stat.eloScore + 16);
      } else if (winningModelId !== null && vote.voteType !== 'tie') {
        stat.eloScore = Math.max(900, stat.eloScore - 12);
      }

      stat.winRate = stat.totalVotes > 0 ? Math.round((stat.totalWins / stat.totalVotes) * 100) : 0;
      stat.updatedAt = new Date().toISOString();
    }
  }

  // --- Saved Prompts ---
  public getSavedPrompts(firebaseUid: string): SavedPrompt[] {
    return Array.from(this.savedPrompts.values())
      .filter(p => p.firebaseUid === firebaseUid || p.firebaseUid === 'system_curated')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public createSavedPrompt(firebaseUid: string, title: string, prompt: string, category: ModelCategory): SavedPrompt {
    const id = crypto.randomUUID();
    const item: SavedPrompt = {
      id,
      firebaseUid,
      title,
      prompt,
      category,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.savedPrompts.set(id, item);
    return item;
  }

  public deleteSavedPrompt(id: string, firebaseUid: string): boolean {
    const item = this.savedPrompts.get(id);
    if (!item) return false;
    // Disallow deleting curated templates
    if (item.firebaseUid === 'system_curated') return false;
    if (item.firebaseUid !== firebaseUid) return false;
    return this.savedPrompts.delete(id);
  }
}

export const db = new DatabaseService();
