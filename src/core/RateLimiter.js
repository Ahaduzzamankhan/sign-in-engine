class RateLimiter {
  constructor() {
    this.limits = new Map();
    this.defaults = {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayMs: 0
    };
  }

  init() {
    // Clear old entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
    return Promise.resolve();
  }

  async check(key, options = {}) {
    const config = { ...this.defaults, ...options };
    const now = Date.now();
    const entry = this.limits.get(key) || { attempts: [], timestamp: now };

    // Remove attempts outside the time window
    entry.attempts = entry.attempts.filter(time => 
      now - time < config.windowMs
    );

    if (entry.attempts.length >= config.maxAttempts) {
      return {
        allowed: false,
        remaining: 0,
        reset: entry.attempts[0] + config.windowMs
      };
    }

    entry.attempts.push(now);
    this.limits.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxAttempts - entry.attempts.length,
      reset: entry.attempts[0] + config.windowMs
    };
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now - entry.timestamp > this.defaults.windowMs * 2) {
        this.limits.delete(key);
      }
    }
  }

  reset(key) {
    this.limits.delete(key);
  }
}

export default RateLimiter;