class AuthRoutes {
  constructor(engine) {
    this.engine = engine;
  }

  getRoutes() {
    return {
      '/auth/signin': this.signIn.bind(this),
      '/auth/signup': this.signUp.bind(this),
      '/auth/signout': this.signOut.bind(this),
      '/auth/verify': this.verify.bind(this),
      '/auth/refresh': this.refresh.bind(this),
      '/auth/reset-password': this.resetPassword.bind(this),
      '/auth/forgot-password': this.forgotPassword.bind(this)
    };
  }

  async signIn(req) {
    try {
      const { provider = 'email', ...credentials } = req.body;
      const result = await this.engine.signIn(provider, credentials);
      
      return {
        status: result.success ? 200 : 401,
        body: result
      };
    } catch (error) {
      return {
        status: 500,
        body: { success: false, error: error.message }
      };
    }
  }

  async signUp(req) {
    try {
      const emailProvider = this.engine.providers.get('email');
      if (!emailProvider) {
        throw new Error('Email provider not available');
      }

      const result = await emailProvider.register(req.body);
      
      return {
        status: 201,
        body: { success: true, user: result }
      };
    } catch (error) {
      return {
        status: 400,
        body: { success: false, error: error.message }
      };
    }
  }

  async signOut(req) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const result = await this.engine.signOut(token);
      
      return {
        status: result.success ? 200 : 400,
        body: result
      };
    } catch (error) {
      return {
        status: 500,
        body: { success: false, error: error.message }
      };
    }
  }

  async verify(req) {
    try {
      const token = req.headers.authorization?.split(' ')[1] || req.query.token;
      const result = await this.engine.verifyToken(token);
      
      return {
        status: 200,
        body: result
      };
    } catch (error) {
      return {
        status: 401,
        body: { success: false, error: error.message }
      };
    }
  }

  async refresh(req) {
    try {
      const oldToken = req.body.token;
      const verification = await this.engine.verifyToken(oldToken);
      
      if (!verification.valid) {
        throw new Error('Invalid token');
      }

      const newToken = await this.engine.security.generateToken(verification.payload);
      
      return {
        status: 200,
        body: { success: true, token: newToken }
      };
    } catch (error) {
      return {
        status: 401,
        body: { success: false, error: error.message }
      };
    }
  }

  async resetPassword(req) {
    try {
      const { token, newPassword } = req.body;
      
      // Verify reset token
      const verification = await this.engine.security.verifyToken(token);
      if (!verification.valid) {
        throw new Error('Invalid or expired reset token');
      }

      const emailProvider = this.engine.providers.get('email');
      await emailProvider.resetPassword(verification.payload.email, newPassword);
      
      return {
        status: 200,
        body: { success: true }
      };
    } catch (error) {
      return {
        status: 400,
        body: { success: false, error: error.message }
      };
    }
  }

  async forgotPassword(req) {
    try {
      const { email } = req.body;
      
      // Generate reset token
      const resetToken = await this.engine.security.generateToken({
        email,
        type: 'password_reset',
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
      });

      // In production, send email with reset link
      const resetLink = `${req.headers.origin}/reset-password?token=${resetToken}`;
      
      return {
        status: 200,
        body: { 
          success: true, 
          message: 'Reset instructions sent',
          resetLink // Remove in production
        }
      };
    } catch (error) {
      return {
        status: 400,
        body: { success: false, error: error.message }
      };
    }
  }
}

export default AuthRoutes;