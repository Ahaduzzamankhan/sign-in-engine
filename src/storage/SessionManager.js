class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
  }

  async createSession(userId, userAgent, ip) {
    const sessionId = this.generateSessionId();
    const session = {
      id: sessionId,
      userId,
      userAgent,
      ip,
      createdAt: new Date(),
      lastActive: new Date(),
      expiresAt: new Date(Date.now() + this.sessionDuration),
      active: true
    };
    
    this.sessions.set(sessionId, session);
    
    // Store session reference by user
    const userSessions = this.sessions.get(`user_${userId}`) || [];
    userSessions.push(sessionId);
    this.sessions.set(`user_${userId}`, userSessions);
    
    return session;
  }

  async getSession(sessionId) {
    const session = this.sessions.get(sessionId);
    
    if (!session || !session.active) {
      return null;
    }
    
    if (Date.now() > session.expiresAt) {
      session.active = false;
      return null;
    }
    
    // Update last active
    session.lastActive = new Date();
    this.sessions.set(sessionId, session);
    
    return session;
  }

  async endSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.active = false;
      session.endedAt = new Date();
      this.sessions.set(sessionId, session);
      
      // Remove from user sessions
      const userSessions = this.sessions.get(`user_${session.userId}`) || [];
      const index = userSessions.indexOf(sessionId);
      if (index > -1) {
        userSessions.splice(index, 1);
        this.sessions.set(`user_${session.userId}`, userSessions);
      }
    }
    return true;
  }

  async endAllUserSessions(userId) {
    const userSessions = this.sessions.get(`user_${userId}`) || [];
    
    for (const sessionId of userSessions) {
      await this.endSession(sessionId);
    }
    
    return true;
  }

  async getUserSessions(userId) {
    const sessionIds = this.sessions.get(`user_${userId}`) || [];
    const sessions = [];
    
    for (const sessionId of sessionIds) {
      const session = this.sessions.get(sessionId);
      if (session && session.active) {
        sessions.push(session);
      }
    }
    
    return sessions;
  }

  cleanupExpiredSessions() {
    const now = Date.now();
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (sessionId.startsWith('user_')) continue;
      
      if (session.expiresAt && now > session.expiresAt) {
        this.endSession(sessionId);
      }
    }
  }

  generateSessionId() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

export default SessionManager;