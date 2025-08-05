/**
 * Security utilities for input validation and sanitization
 */

// Input validation patterns
export const VALIDATION_PATTERNS = {
  // Latitude: -90 to 90
  LATITUDE: /^-?([1-8]?[0-9](\.[0-9]+)?|90(\.0+)?)$/,
  // Longitude: -180 to 180
  LONGITUDE: /^-?((1[0-7][0-9]|[1-9]?[0-9])(\.[0-9]+)?|180(\.0+)?)$/,
  // Years: 1 to 100
  YEARS: /^([1-9]|[1-9][0-9]|100)$/,
  // Search query: alphanumeric, spaces, commas, dots, hyphens
  SEARCH_QUERY: /^[a-zA-Z0-9\s,.-]+$/,
  // Tree type ID: lowercase letters, numbers, hyphens
  TREE_TYPE_ID: /^[a-z0-9-]+$/,
};

// Input validation functions
export const validateLatitude = (lat: number): boolean => {
  return typeof lat === 'number' && lat >= -90 && lat <= 90 && !isNaN(lat);
};

export const validateLongitude = (lng: number): boolean => {
  return typeof lng === 'number' && lng >= -180 && lng <= 180 && !isNaN(lng);
};

export const validateYears = (years: number): boolean => {
  return typeof years === 'number' && years >= 1 && years <= 100 && Number.isInteger(years);
};

export const validateSearchQuery = (query: string): boolean => {
  if (typeof query !== 'string') return false;
  if (query.length > 100) return false; // Limit query length
  return VALIDATION_PATTERNS.SEARCH_QUERY.test(query.trim());
};

export const validateTreeTypeId = (id: string): boolean => {
  if (typeof id !== 'string') return false;
  return VALIDATION_PATTERNS.TREE_TYPE_ID.test(id);
};

// Input sanitization functions
export const sanitizeSearchQuery = (query: string): string => {
  if (typeof query !== 'string') return '';
  
  // Remove potentially dangerous characters
  let sanitized = query
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:/gi, '') // Remove data: protocol
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .trim();
  
  // Limit length
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }
  
  return sanitized;
};

export const sanitizeDisplayName = (name: string): string => {
  if (typeof name !== 'string') return '';
  
  // Remove HTML tags and potentially dangerous content
  let sanitized = name
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .trim();
  
  // Limit length
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200);
  }
  
  return sanitized;
};

// Rate limiting for API calls
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, [now]);
      return true;
    }
    
    const requests = this.requests.get(key)!;
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= this.maxRequests) {
      return false;
    }
    
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    return true;
  }

  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    for (const [key, requests] of this.requests.entries()) {
      const recentRequests = requests.filter(time => time > windowStart);
      if (recentRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, recentRequests);
      }
    }
  }
}

// Create a global rate limiter instance
export const apiRateLimiter = new RateLimiter(10, 60000); // 10 requests per minute

// Clean up rate limiter periodically
setInterval(() => {
  apiRateLimiter.cleanup();
}, 60000); // Clean up every minute

// URL validation
export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

// Safe JSON parsing
export const safeJsonParse = <T>(json: string, fallback: T): T => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};

// XSS prevention for user input
export const escapeHtml = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

// CSRF token generation (for future use)
export const generateCSRFToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}; 