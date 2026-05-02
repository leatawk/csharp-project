/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate phone number
 */
export const validatePhoneNumber = (phone) => {
  const cleaned = ('' + phone).replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
};

/**
 * Validate amount
 */
export const validateAmount = (amount, min = 0, max = Infinity) => {
  const num = parseFloat(amount);
  
  if (isNaN(num)) {
    return { isValid: false, error: 'Invalid amount' };
  }
  
  if (num < min) {
    return { isValid: false, error: `Amount must be at least ${min}` };
  }
  
  if (num > max) {
    return { isValid: false, error: `Amount cannot exceed ${max}` };
  }
  
  return { isValid: true };
};

/**
 * Validate invite code format
 */
export const validateInviteCode = (code) => {
  return /^[A-Z0-9]{8}$/.test(code);
};