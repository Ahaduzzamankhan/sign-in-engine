class MagicLink {
  constructor(security, storage) {
    this.security = security;
    this.storage = storage;
    this.tokens = new Map();
  }

  async generateLink(email, redirectUrl = '/') {
    const token = this.security.generateCSRFToken();
    const expires = Date.now() + (15 * 60 * 1000); // 15 minutes
    
    this.tokens.set(token, {
      email,
      redirectUrl,
      expires,
      used: false
    });

    // In production, send this link via email
    const magicLink = `${redirectUrl}?token=${token}`;
    
    return {
      token,
      link: magicLink,
      expires: new Date(expires)
    };
  }

  async authenticate(token) {
    const tokenData = this.tokens.get(token);
    
    if (!tokenData) {
      throw new Error('Invalid or expired magic link');
    }

    if (tokenData.used) {
      throw new Error('Magic link already used');
    }

    if (Date.now() > tokenData.expires) {
      this.tokens.delete(token);
      throw new Error('Magic link expired');
    }

    // Mark as used
    tokenData.used = true;
    this.tokens.set(token, tokenData);

    // Find or create user
    let user = await this.storage.findUserByEmail(tokenData.email);
    
    if (!user) {
      user = await this.storage.createUser({
        email: tokenData.email,
        createdAt: new Date(),
        verified: true
      });
    }

    return {
      id: user.id,
      email: user.email,
      verified: true
    };
  }

  cleanup() {
    const now = Date.now();
    for (const [token, data] of this.tokens.entries()) {
      if (now > data.expires) {
        this.tokens.delete(token);
      }
    }
  }
}

export default MagicLink;