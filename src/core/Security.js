import crypto from 'crypto';

class Security {
  constructor(config) {
    this.secretKey = config.secretKey;
    this.tokenExpiry = config.tokenExpiry;
    this.algorithm = 'aes-256-gcm';
    this.key = crypto.scryptSync(this.secretKey, 'salt', 32);
  }

  async hashPassword(password) {
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, this.secretKey, 64, (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey.toString('hex'));
      });
    });
  }

  async verifyPassword(password, hash) {
    const newHash = await this.hashPassword(password);
    return crypto.timingSafeEqual(
      Buffer.from(newHash, 'hex'),
      Buffer.from(hash, 'hex')
    );
  }

  async generateToken(payload) {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };
    
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
    const encodedPayload = Buffer.from(JSON.stringify({
      ...payload,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    })).toString('base64');
    
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64');
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  async verifyToken(token) {
    try {
      const [encodedHeader, encodedPayload, signature] = token.split('.');
      
      const expectedSignature = crypto
        .createHmac('sha256', this.secretKey)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('base64');
      
      if (signature !== expectedSignature) {
        return { valid: false, error: 'Invalid signature' };
      }
      
      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64').toString());
      
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return { valid: false, error: 'Token expired' };
      }
      
      return { valid: true, payload };
    } catch (error) {
      return { valid: false, error: 'Invalid token' };
    }
  }

  encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    return {
      iv: iv.toString('hex'),
      encrypted: encrypted,
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encryptedData) {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(encryptedData.iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  generateCSRFToken() {
    return crypto.randomBytes(32).toString('hex');
  }
}

export default Security;