import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { arenaEngine } from './server/arena-engine';
import { rateLimiter, validatePromptInput, verifyAppCheck } from './server/middleware';
import { ModelCategory, VoteType } from './src/types/arena';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Analytics event logger (Firebase Analytics format)
const analyticsEvents: Array<{ eventName: string; params: any; timestamp: string }> = [];

// API Routes

// 1. Model Catalog
app.get('/api/models', (req: Request, res: Response) => {
  const models = db.getCatalog();
  res.json({
    models,
    config: {
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
    }
  });
});

// 2. Leaderboard
app.get('/api/arena/leaderboard', (req: Request, res: Response) => {
  const category = req.query.category as ModelCategory | undefined;
  const stats = db.getLeaderboard(category);
  res.json({ stats });
});

// 3. User Competition History
app.get('/api/arena/history', (req: Request, res: Response) => {
  const userUid = (req.headers['x-firebase-uid'] as string) || (req.query.userUid as string) || 'anonymous';
  const history = db.getUserCompetitions(userUid);
  res.json({ history });
});

// 4. Saved Prompts
app.get('/api/prompts', (req: Request, res: Response) => {
  const userUid = (req.headers['x-firebase-uid'] as string) || (req.query.userUid as string) || 'anonymous';
  const prompts = db.getSavedPrompts(userUid);
  res.json({ prompts });
});

app.post('/api/prompts', (req: Request, res: Response) => {
  const userUid = (req.headers['x-firebase-uid'] as string) || req.body.userUid || 'anonymous';
  const { title, prompt, category } = req.body;

  if (!title || !prompt) {
    res.status(400).json({ error: 'Title and prompt are required.' });
    return;
  }

  const saved = db.createSavedPrompt(userUid, title, prompt, category || 'General');
  res.status(201).json({ prompt: saved });
});

app.delete('/api/prompts/:id', (req: Request, res: Response) => {
  const userUid = (req.headers['x-firebase-uid'] as string) || 'anonymous';
  const id = req.params.id;
  const deleted = db.deleteSavedPrompt(id, userUid);
  if (!deleted) {
    res.status(404).json({ error: 'Prompt not found or cannot be deleted.' });
    return;
  }
  res.json({ success: true });
});

// 5. Submit Vote (Blind Voting Unmask & Leaderboard Update)
app.post('/api/arena/vote', rateLimiter, (req: Request, res: Response) => {
  const userUid = (req.headers['x-firebase-uid'] as string) || req.body.userUid || 'anonymous';
  const { competitionId, voteType, selectedResponseId } = req.body;

  if (!competitionId || !voteType) {
    res.status(400).json({ error: 'competitionId and voteType are required.' });
    return;
  }

  const result = db.submitVote(
    competitionId,
    userUid,
    voteType as VoteType,
    selectedResponseId || null
  );

  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  const comp = db.getCompetition(competitionId);
  const revealedModels = comp?.responses.map((r, idx) => ({
    modelIndex: idx,
    responseId: r.id,
    modelId: r.modelId,
    provider: r.provider,
    displayName: db.getModel(r.modelId)?.displayName || r.modelId
  }));

  // Track vote in analytics
  analyticsEvents.push({
    eventName: 'vote_submitted',
    params: { competitionId, voteType, userUid },
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    vote: result.vote,
    revealedModels,
    leaderboard: db.getLeaderboard()
  });
});

// 6. Arena Competition Streaming (SSE)
app.post(
  '/api/arena/compete',
  rateLimiter,
  verifyAppCheck,
  validatePromptInput,
  async (req: Request, res: Response) => {
    const userUid = (req.headers['x-firebase-uid'] as string) || req.body.userUid || 'anonymous';
    const { prompt, systemInstruction, selectedModels, category } = req.body;

    // Create competition record in database
    const competition = db.createCompetition({
      ownerUid: userUid,
      prompt,
      systemInstruction,
      selectedModels,
      category: category as ModelCategory,
      visibility: 'public'
    });

    // Set headers for Server-Sent Events (SSE)
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const sendSSE = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // Masked model labels: Model A, Model B, Model C
    const maskedLabels = ['Model A', 'Model B', 'Model C'];

    // Send init event
    sendSSE('init', {
      competitionId: competition.id,
      selectedCount: selectedModels.length,
      maskedModels: selectedModels.map((_: string, idx: number) => ({
        index: idx,
        maskedName: maskedLabels[idx] || `Model ${idx + 1}`
      }))
    });

    // Track analytics competition_started
    analyticsEvents.push({
      eventName: 'competition_started',
      params: { competitionId: competition.id, modelCount: selectedModels.length, category },
      timestamp: new Date().toISOString()
    });

    // Run all selected models concurrently
    const modelPromises = selectedModels.map((modelId: string, index: number) => {
      return arenaEngine.streamModelResponse({
        competitionId: competition.id,
        modelId,
        maskedName: maskedLabels[index] || `Model ${index + 1}`,
        modelIndex: index,
        prompt,
        systemInstruction,
        onChunk: (modelIndex, textDelta, ttftMs) => {
          sendSSE('chunk', { modelIndex, textDelta, ttftMs });
        },
        onStats: (modelIndex, stats) => {
          sendSSE('stats', { modelIndex, stats });
        },
        onError: (modelIndex, errorMsg) => {
          sendSSE('error', { modelIndex, error: errorMsg });
        },
        onComplete: (modelIndex, finalResponse) => {
          sendSSE('model_complete', { modelIndex, responseId: finalResponse.id });
        }
      });
    });

    // Await all model streaming completions
    await Promise.allSettled(modelPromises);

    // Track analytics competition_completed
    analyticsEvents.push({
      eventName: 'competition_completed',
      params: { competitionId: competition.id },
      timestamp: new Date().toISOString()
    });

    sendSSE('done', {
      competitionId: competition.id,
      completedAt: new Date().toISOString()
    });

    res.end();
  }
);

// 7. Analytics Event Log & Ingestion
app.post('/api/analytics', (req: Request, res: Response) => {
  const { eventName, params } = req.body;
  if (eventName) {
    analyticsEvents.push({
      eventName,
      params: params || {},
      timestamp: new Date().toISOString()
    });
  }
  res.json({ success: true });
});

app.get('/api/analytics', (req: Request, res: Response) => {
  res.json({ events: analyticsEvents.slice(-50) });
});

// Vite or Static Assets Setup
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LLM Arena server listening on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start LLM Arena server:', err);
});
