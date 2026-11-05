import { Request, Response, NextFunction } from 'express';

// In-memory sliding window rate limiter
interface RateLimitRecord {
  timestamps: number[];
}

const rateLimits = new Map<string, RateLimitRecord>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20; // 20 requests per minute
const MAX_PROMPT_LENGTH = 4000; // max characters per prompt

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  // Identify user by Firebase Auth header or IP
  const identifier = (req.headers['x-firebase-uid'] as string) || req.ip || 'anonymous';
  const now = Date.now();

  let record = rateLimits.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    rateLimits.set(identifier, record);
  }

  // Filter out timestamps older than window
  record.timestamps = record.timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

  if (record.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    res.status(429).json({
      error: 'Rate limit exceeded. Please wait a moment before sending more requests to the Arena.'
    });
    return;
  }

  record.timestamps.push(now);
  next();
}

// Prompt length validation middleware
export function validatePromptInput(req: Request, res: Response, next: NextFunction) {
  const { prompt, selectedModels } = req.body;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    res.status(400).json({ error: 'Prompt is required and cannot be empty.' });
    return;
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    res.status(400).json({
      error: `Prompt exceeds maximum allowed length of ${MAX_PROMPT_LENGTH} characters.`
    });
    return;
  }

  if (!Array.isArray(selectedModels) || selectedModels.length < 1 || selectedModels.length > 3) {
    res.status(400).json({
      error: 'Please select between 1 and 3 models to compete in the Arena.'
    });
    return;
  }

  next();
}

// App Check and Token Attestation verification helper
export function verifyAppCheck(req: Request, res: Response, next: NextFunction) {
  const appCheckToken = req.headers['x-firebase-appcheck'] as string | undefined;

  // In production, Firebase Admin App Check verifies this token.
  // In development, if configured, verify token presence or allow fallback.
  if (process.env.NODE_ENV === 'production' && process.env.ENFORCE_APP_CHECK === 'true') {
    if (!appCheckToken) {
      res.status(401).json({ error: 'Missing required Firebase App Check token.' });
      return;
    }
  }

  next();
}
