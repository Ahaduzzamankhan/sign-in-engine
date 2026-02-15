class Validation {
  constructor() {
    this.rules = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      username: /^[a-zA-Z0-9_]{3,20}$/
    };
  }

  validateSignIn(data) {
    const errors = [];
    
    if (!data.email || !this.rules.email.test(data.email)) {
      errors.push('Invalid email address');
    }
    
    if (!data.password || data.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateRegister(data) {
    const errors = this.validateSignIn(data).errors;
    
    if (data.username && !this.rules.username.test(data.username)) {
      errors.push('Username must be 3-20 characters (letters, numbers, underscore)');
    }
    
    if (data.password !== data.confirmPassword) {
      errors.push('Passwords do not match');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  validateResetPassword(data) {
    const errors = [];
    
    if (!data.email || !this.rules.email.test(data.email)) {
      errors.push('Invalid email address');
    }
    
    if (data.newPassword && data.newPassword.length < 8) {
      errors.push('New password must be at least 8 characters');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default Validation;