// Security class for browser environment
class Security {
  constructor(config) {
    this.secretKey = config.secretKey;
    this.tokenExpiry = config.tokenExpiry;
  }

  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + this.secretKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async verifyPassword(password, hash) {
    const newHash = await this.hashPassword(password);
    return newHash === hash;
  }

  async generateToken(payload) {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const exp = Math.floor(Date.now() / 1000) + (24 * 60 * 60);
    const body = btoa(JSON.stringify({ ...payload, exp }));
    const signature = btoa(this.secretKey + header + body);
    return `${header}.${body}.${signature}`;
  }

  async verifyToken(token) {
    try {
      const [header, body, signature] = token.split('.');
      const expectedSignature = btoa(this.secretKey + header + body);
      
      if (signature !== expectedSignature) {
        return { valid: false, error: 'Invalid signature' };
      }
      
      const payload = JSON.parse(atob(body));
      
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return { valid: false, error: 'Token expired' };
      }
      
      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: 'Invalid token' };
    }
  }

  generateCSRFToken() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

// Validation class
class Validation {
  constructor() {
    this.rules = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      username: /^[a-zA-Z0-9_]{3,20}$/
    };
  }

  validateSignIn(data) {
    const errors = [];
    if (!data.email || !this.rules.email.test(data.email)) {
      errors.push('Invalid email address');
    }
    if (!data.password || data.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    return { valid: errors.length === 0, errors };
  }

  validateRegister(data) {
    const errors = this.validateSignIn(data).errors;
    if (data.username && !this.rules.username.test(data.username)) {
      errors.push('Username must be 3-20 characters (letters, numbers, underscore)');
    }
    if (data.password !== data.confirmPassword) {
      errors.push('Passwords do not match');
    }
    return { valid: errors.length === 0, errors };
  }
}

// Logger class
class Logger {
  constructor(level = 'info') {
    this.levels = { error: 0, warn: 1, info: 2, debug: 3 };
    this.level = this.levels[level] || 2;
  }

  log(level, message, ...args) {
    if (this.levels[level] <= this.level) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, ...args);
    }
  }

  error(message, ...args) { this.log('error', message, ...args); }
  warn(message, ...args) { this.log('warn', message, ...args); }
  info(message, ...args) { this.log('info', message, ...args); }
  debug(message, ...args) { this.log('debug', message, ...args); }
}

// RateLimiter class
class RateLimiter {
  constructor() {
    this.limits = new Map();
    this.defaults = { maxAttempts: 5, windowMs: 15 * 60 * 1000 };
  }

  init() {
    setInterval(() => this.cleanup(), 60 * 1000);
    return Promise.resolve();
  }

  async check(key) {
    const now = Date.now();
    const entry = this.limits.get(key) || { attempts: [] };
    
    entry.attempts = entry.attempts.filter(time => now - time < this.defaults.windowMs);
    
    if (entry.attempts.length >= this.defaults.maxAttempts) {
      return { allowed: false, remaining: 0 };
    }
    
    entry.attempts.push(now);
    this.limits.set(key, entry);
    return { allowed: true, remaining: this.defaults.maxAttempts - entry.attempts.length };
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      entry.attempts = entry.attempts.filter(time => now - time < this.defaults.windowMs);
      if (entry.attempts.length === 0) {
        this.limits.delete(key);
      }
    }
  }
}

// EmailPassword Provider
class EmailPasswordProvider {
  constructor(security, userStore) {
    this.security = security;
    this.userStore = userStore;
  }

  async authenticate(credentials) {
    const user = await this.userStore.findUserByEmail(credentials.email);
    if (!user) throw new Error('User not found');
    
    const validPassword = await this.security.verifyPassword(credentials.password, user.passwordHash);
    if (!validPassword) throw new Error('Invalid password');
    
    return { id: user.id, email: user.email, username: user.username, role: user.role };
  }

  async register(userData) {
    const existingUser = await this.userStore.findUserByEmail(userData.email);
    if (existingUser) throw new Error('User already exists');
    
    const passwordHash = await this.security.hashPassword(userData.password);
    return await this.userStore.createUser({
      ...userData,
      passwordHash,
      createdAt: new Date(),
      verified: false,
      role: 'user'
    });
  }
}

// UserStore class
class UserStore {
  constructor() {
    this.users = new Map();
    this.nextId = 1;
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem('signin_users');
      if (stored) {
        const users = JSON.parse(stored);
        users.forEach(user => {
          this.users.set(user.id, user);
          this.users.set(user.email, user);
          if (user.username) this.users.set(user.username, user);
          this.nextId = Math.max(this.nextId, user.id + 1);
        });
      }
    } catch (e) {
      console.error('Failed to load users from storage', e);
    }
  }

  saveToStorage() {
    const users = Array.from(this.users.values())
      .filter(u => typeof u === 'object' && u.id)
      .map(u => ({ ...u }));
    localStorage.setItem('signin_users', JSON.stringify(users));
  }

  async createUser(userData) {
    const id = this.nextId++;
    const user = { id, ...userData, updatedAt: new Date() };
    this.users.set(id, user);
    this.users.set(userData.email, user);
    if (userData.username) this.users.set(userData.username, user);
    this.saveToStorage();
    return user;
  }

  async findUserByEmail(email) {
    return this.users.get(email) || null;
  }

  async findUserById(id) {
    return this.users.get(id) || null;
  }

  async updateUser(id, updates) {
    const user = await this.findUserById(id);
    if (!user) throw new Error('User not found');
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    this.users.set(user.email, updatedUser);
    if (user.username) this.users.set(user.username, updatedUser);
    this.saveToStorage();
    return updatedUser;
  }
}

// Main SignInEngine class
class SignInEngine {
  constructor(config = {}) {
    this.config = {
      secretKey: config.secretKey || 'signin-engine-default-key',
      tokenExpiry: config.tokenExpiry || '24h',
      logLevel: config.logLevel || 'info'
    };
    
    this.security = new Security(this.config);
    this.validation = new Validation();
    this.logger = new Logger(this.config.logLevel);
    this.rateLimiter = new RateLimiter();
    this.userStore = new UserStore();
    
    this.providers = new Map();
    this.sessions = new Map();
    
    // Register default email provider
    const emailProvider = new EmailPasswordProvider(this.security, this.userStore);
    this.registerProvider('email', emailProvider);
    
    this.logger.info('SignInEngine initialized');
  }

  async initialize() {
    await this.rateLimiter.init();
    this.logger.info('SignInEngine ready');
    return true;
  }

  registerProvider(name, provider) {
    this.providers.set(name, provider);
  }

  async signIn(provider, credentials) {
    try {
      const rateLimit = await this.rateLimiter.check(credentials.email);
      if (!rateLimit.allowed) {
        throw new Error('Too many attempts. Please try again later.');
      }

      const providerInstance = this.providers.get(provider);
      if (!providerInstance) {
        throw new Error(`Provider ${provider} not found`);
      }

      const validated = this.validation.validateSignIn(credentials);
      if (!validated.valid) {
        throw new Error(validated.errors.join(', '));
      }

      const user = await providerInstance.authenticate(credentials);
      const token = await this.security.generateToken({ 
        id: user.id, 
        email: user.email,
        role: user.role 
      });
      
      const sessionId = this.security.generateCSRFToken();
      this.sessions.set(sessionId, {
        userId: user.id,
        token,
        createdAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      });
      
      return { success: true, token, user, sessionId };
    } catch (error) {
      this.logger.error('Sign in failed:', error);
      return { success: false, error: error.message };
    }
  }

  async signOut(token) {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.token === token) {
        this.sessions.delete(sessionId);
        break;
      }
    }
    return { success: true };
  }

  async verifyToken(token) {
    return await this.security.verifyToken(token);
  }

  async register(userData) {
    try {
      const provider = this.providers.get('email');
      const validated = this.validation.validateRegister(userData);
      
      if (!validated.valid) {
        throw new Error(validated.errors.join(', '));
      }

      const user = await provider.register(userData);
      return { success: true, user };
    } catch (error) {
      this.logger.error('Registration failed:', error);
      return { success: false, error: error.message };
    }
  }
}

export default SignInEngine;