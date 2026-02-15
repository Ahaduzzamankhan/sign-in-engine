class EmailPassword {
  constructor(security, storage) {
    this.security = security;
    this.storage = storage;
  }

  async authenticate(credentials) {
    const { email, password } = credentials;
    
    // Find user by email
    const user = await this.storage.findUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify password
    const validPassword = await this.security.verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      throw new Error('Invalid password');
    }

    // Check if account is locked
    if (user.lockedUntil && user.lockedUntil > Date.now()) {
      throw new Error('Account is temporarily locked');
    }

    // Update last login
    await this.storage.updateUser(user.id, {
      lastLogin: new Date(),
      failedAttempts: 0
    });

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    };
  }

  async register(userData) {
    const { email, password, username } = userData;
    
    // Check if user exists
    const existingUser = await this.storage.findUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await this.security.hashPassword(password);

    // Create user
    const user = await this.storage.createUser({
      email,
      passwordHash,
      username,
      createdAt: new Date(),
      verified: false,
      role: 'user'
    });

    return {
      id: user.id,
      email: user.email,
      username: user.username
    };
  }

  async resetPassword(email, newPassword) {
    const user = await this.storage.findUserByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    const passwordHash = await this.security.hashPassword(newPassword);
    await this.storage.updateUser(user.id, {
      passwordHash,
      passwordChangedAt: new Date()
    });

    return true;
  }
}

export default EmailPassword;