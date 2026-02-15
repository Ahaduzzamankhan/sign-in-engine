export const ErrorCodes = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_EXISTS: 'USER_EXISTS',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RATE_LIMITED: 'RATE_LIMITED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
};

export const UserRoles = {
  USER: 'user',
  ADMIN: 'admin',
  MODERATOR: 'moderator'
};

export const TokenTypes = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  RESET: 'reset',
  VERIFY: 'verify'
};

export const SecurityLevels = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

export const AuthProviders = {
  EMAIL: 'email',
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
  GITHUB: 'github',
  MAGIC_LINK: 'magic_link'
};