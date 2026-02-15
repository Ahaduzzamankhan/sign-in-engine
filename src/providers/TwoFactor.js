import crypto from 'crypto';

class TwoFactor {
  constructor(security) {
    this.security = security;
  }

  generateSecret() {
    return crypto.randomBytes(20).toString('hex');
  }

  generateQRCode(secret, email) {
    const otpauth = `otpauth://totp/SignInEngine:${email}?secret=${secret}&issuer=SignInEngine`;
    return `https://chart.googleapis.com/chart?chs=200x200&chld=M|0&cht=qr&chl=${encodeURIComponent(otpauth)}`;
  }

  verifyToken(secret, token) {
    const counter = Math.floor(Date.now() / 30000); // 30-second intervals
    const key = Buffer.from(secret, 'hex');
    
    for (let i = -1; i <= 1; i++) {
      const expectedToken = this.generateTOTP(key, counter + i);
      if (token === expectedToken) {
        return true;
      }
    }
    
    return false;
  }

  generateTOTP(key, counter) {
    const buffer = Buffer.alloc(8);
    for (let i = 0; i < 8; i++) {
      buffer[7 - i] = counter & 0xff;
      counter >>= 8;
    }

    const hmac = crypto.createHmac('sha1', key);
    hmac.update(buffer);
    const hmacResult = hmac.digest();

    const offset = hmacResult[hmacResult.length - 1] & 0xf;
    const code = (
      ((hmacResult[offset] & 0x7f) << 24) |
      ((hmacResult[offset + 1] & 0xff) << 16) |
      ((hmacResult[offset + 2] & 0xff) << 8) |
      (hmacResult[offset + 3] & 0xff)
    ) % 1000000;

    return code.toString().padStart(6, '0');
  }

  async setup(email) {
    const secret = this.generateSecret();
    const qrCode = this.generateQRCode(secret, email);
    
    return {
      secret,
      qrCode
    };
  }

  async verifySetup(secret, token) {
    return this.verifyToken(secret, token);
  }
}

export default TwoFactor;