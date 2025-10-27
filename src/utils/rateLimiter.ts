/**
 * Client-Side Rate Limiter
 * Prevents excessive API calls and brute force attempts
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs?: number;
}

interface RateLimitEntry {
  attempts: number;
  firstAttemptTime: number;
  blockedUntil?: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();

  /**
   * Check if action is rate limited
   */
  public isRateLimited(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);

    // No previous attempts
    if (!entry) {
      this.limits.set(key, {
        attempts: 1,
        firstAttemptTime: now
      });
      return false;
    }

    // Check if currently blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return true;
    }

    // Reset if window has passed
    if (now - entry.firstAttemptTime > config.windowMs) {
      this.limits.set(key, {
        attempts: 1,
        firstAttemptTime: now
      });
      return false;
    }

    // Increment attempts
    entry.attempts++;

    // Block if max attempts reached
    if (entry.attempts > config.maxAttempts) {
      entry.blockedUntil = now + (config.blockDurationMs || config.windowMs);
      this.limits.set(key, entry);
      return true;
    }

    this.limits.set(key, entry);
    return false;
  }

  /**
   * Get remaining attempts
   */
  public getRemainingAttempts(key: string, config: RateLimitConfig): number {
    const entry = this.limits.get(key);
    if (!entry) return config.maxAttempts;

    const remaining = config.maxAttempts - entry.attempts;
    return Math.max(0, remaining);
  }

  /**
   * Clear rate limit for a key
   */
  public clear(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limits
   */
  public clearAll(): void {
    this.limits.clear();
  }

  /**
   * Get time until unblocked (in milliseconds)
   */
  public getTimeUntilUnblocked(key: string): number {
    const entry = this.limits.get(key);
    if (!entry || !entry.blockedUntil) return 0;

    const timeRemaining = entry.blockedUntil - Date.now();
    return Math.max(0, timeRemaining);
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Pre-configured rate limits
export const RATE_LIMITS = {
  LOGIN: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000 // 30 minutes block
  },
  PASSWORD_RESET: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 2 * 60 * 60 * 1000 // 2 hours block
  },
  API_CALL: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 5 * 60 * 1000 // 5 minutes block
  },
  FILE_UPLOAD: {
    maxAttempts: 10,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 10 * 60 * 1000 // 10 minutes block
  }
};

