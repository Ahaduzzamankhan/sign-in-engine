declare module 'signin-engine' {
  export interface SignInConfig {
    secretKey?: string;
    tokenExpiry?: string;
    logLevel?: 'error' | 'warn' | 'info' | 'debug';
  }

  export interface User {
    id: number;
    email: string;
    username?: string;
    role?: string;
    verified?: boolean;
  }

  export interface SignInResult {
    success: boolean;
    token?: string;
    user?: User;
    sessionId?: string;
    error?: string;
  }

  export interface TokenVerificationResult {
    valid: boolean;
    payload?: any;
    error?: string;
  }

  export class SignInEngine {
    constructor(config?: SignInConfig);
    initialize(): Promise<boolean>;
    signIn(provider: string, credentials: { email: string; password: string }): Promise<SignInResult>;
    signOut(token: string): Promise<{ success: boolean }>;
    verifyToken(token: string): Promise<TokenVerificationResult>;
    register(userData: {
      email: string;
      password: string;
      username?: string;
      confirmPassword?: string;
    }): Promise<{ success: boolean; user?: User; error?: string }>;
    registerProvider(name: string, provider: any): void;
  }

  export default SignInEngine;
}