class Authenticator {
  constructor(security, sessionManager) {
    this.security = security;
    this.sessionManager = sessionManager;
  }

  async authenticate(req) {
    const token = this.extractToken(req);
    
    if (!token) {
      return { authenticated: false, error: 'No token provided' };
    }

    const verification = await this.security.verifyToken(token);
    
    if (!verification.valid) {
      return { authenticated: false, error: verification.error };
    }

    const session = await this.sessionManager.getSession(verification.payload.sessionId);
    
    if (!session) {
      return { authenticated: false, error: 'Session expired' };
    }

    return {
      authenticated: true,
      user: verification.payload,
      session
    };
  }

  async requireAuth(req, res, next) {
    const authResult = await this.authenticate(req);
    
    if (!authResult.authenticated) {
      return { 
        success: false, 
        error: 'Authentication required',
        status: 401 
      };
    }
    
    req.user = authResult.user;
    req.session = authResult.session;
    
    if (next) next();
    return { success: true, user: authResult.user };
  }

  async requireRole(role) {
    return async (req, res, next) => {
      const authResult = await this.authenticate(req);
      
      if (!authResult.authenticated) {
        return { 
          success: false, 
          error: 'Authentication required',
          status: 401 
        };
      }
      
      if (authResult.user.role !== role) {
        return { 
          success: false, 
          error: 'Insufficient permissions',
          status: 403 
        };
      }
      
      req.user = authResult.user;
      req.session = authResult.session;
      
      if (next) next();
      return { success: true, user: authResult.user };
    };
  }

  extractToken(req) {
    if (req.headers && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        return parts[1];
      }
    }
    
    if (req.query && req.query.token) {
      return req.query.token;
    }
    
    if (req.cookies && req.cookies.token) {
      return req.cookies.token;
    }
    
    return null;
  }
}

export default Authenticator;