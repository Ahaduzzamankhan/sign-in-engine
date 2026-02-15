class UserStore {
  constructor() {
    this.users = new Map();
    this.nextId = 1;
  }

  async createUser(userData) {
    const id = this.nextId++;
    const user = {
      id,
      ...userData,
      createdAt: userData.createdAt || new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(id, user);
    this.users.set(userData.email, user);
    
    if (userData.username) {
      this.users.set(userData.username, user);
    }
    
    return user;
  }

  async findUserByEmail(email) {
    const user = this.users.get(email);
    return user && user.email === email ? user : null;
  }

  async findUserById(id) {
    return this.users.get(id) || null;
  }

  async findUserByUsername(username) {
    const user = this.users.get(username);
    return user && user.username === username ? user : null;
  }

  async findUserByOAuthId(provider, oauthId) {
    for (const user of this.users.values()) {
      if (user.oauthProvider === provider && user.oauthId === oauthId) {
        return user;
      }
    }
    return null;
  }

  async updateUser(id, updates) {
    const user = await this.findUserById(id);
    if (!user) {
      throw new Error('User not found');
    }
    
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    
    // Update email index if email changed
    if (updates.email && updates.email !== user.email) {
      this.users.delete(user.email);
      this.users.set(updates.email, updatedUser);
    }
    
    // Update username index if username changed
    if (updates.username && updates.username !== user.username) {
      this.users.delete(user.username);
      this.users.set(updates.username, updatedUser);
    }
    
    return updatedUser;
  }

  async deleteUser(id) {
    const user = await this.findUserById(id);
    if (user) {
      this.users.delete(id);
      this.users.delete(user.email);
      if (user.username) {
        this.users.delete(user.username);
      }
    }
    return true;
  }

  async listUsers(filter = {}) {
    let users = Array.from(this.users.values()).filter(u => u.id);
    
    if (filter.role) {
      users = users.filter(u => u.role === filter.role);
    }
    
    if (filter.verified !== undefined) {
      users = users.filter(u => u.verified === filter.verified);
    }
    
    return users;
  }
}

export default UserStore;