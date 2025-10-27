/**
 * Input Sanitization Utility
 * Protects against XSS attacks and malicious input
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content (allows safe HTML tags)
 * Use this for rich text content like announcements, descriptions
 */
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'u', 'a', 'p', 'br',
      'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre', 'hr', 'div', 'span'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
  });
};

/**
 * Sanitize plain text input (strips all HTML)
 * Use this for user names, titles, search terms, etc.
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .trim()
    // Remove all HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script tags and content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove data: protocol (can be used for XSS)
    .replace(/data:text\/html/gi, '');
};

/**
 * Sanitize email address
 */
export const sanitizeEmail = (email: string): string => {
  if (!email) return '';
  
  const sanitized = sanitizeInput(email).toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(sanitized) ? sanitized : '';
};

/**
 * Sanitize URL
 */
export const sanitizeUrl = (url: string): string => {
  if (!url) return '';
  
  const sanitized = sanitizeInput(url);
  
  // Only allow http, https, mailto protocols
  if (!/^(https?:\/\/|mailto:)/.test(sanitized)) {
    return '';
  }
  
  try {
    new URL(sanitized);
    return sanitized;
  } catch {
    return '';
  }
};

/**
 * Sanitize file name
 */
export const sanitizeFileName = (fileName: string): string => {
  if (!fileName) return '';
  
  return fileName
    // Remove path separators
    .replace(/[\/\\]/g, '')
    // Remove dangerous characters
    .replace(/[<>:"|?*\x00-\x1f]/g, '')
    // Remove leading/trailing dots and spaces
    .replace(/^[.\s]+|[.\s]+$/g, '')
    // Limit length
    .substring(0, 255);
};

/**
 * Sanitize phone number (keep only digits, +, -, (, ), spaces)
 */
export const sanitizePhone = (phone: string): string => {
  if (!phone) return '';
  
  return phone.replace(/[^0-9+\-() ]/g, '').trim();
};

/**
 * Sanitize object (sanitize all string values)
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized as T;
};

/**
 * Sanitize search query
 */
export const sanitizeSearchQuery = (query: string): string => {
  if (!query) return '';
  
  return sanitizeInput(query)
    // Remove SQL-like keywords (extra protection)
    .replace(/(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/gi, '')
    // Limit length
    .substring(0, 200);
};

/**
 * Escape HTML entities
 */
export const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, char => map[char] || char);
};

/**
 * Check if string contains potentially dangerous content
 */
export const containsDangerousContent = (input: string): boolean => {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<embed/i,
    /<object/i,
    /data:text\/html/i,
    /vbscript:/i,
    /file:/i,
  ];
  
  return dangerousPatterns.some(pattern => pattern.test(input));
};

/**
 * Safe parse JSON (prevents prototype pollution)
 */
export const safeJsonParse = <T = any>(json: string): T | null => {
  try {
    const parsed = JSON.parse(json);
    
    // Check for prototype pollution attempts
    if (parsed && typeof parsed === 'object') {
      if ('__proto__' in parsed || 'constructor' in parsed || 'prototype' in parsed) {
        console.warn('Potential prototype pollution detected');
        return null;
      }
    }
    
    return parsed as T;
  } catch (error) {
    console.error('JSON parse error:', error);
    return null;
  }
};

// Export all functions as default object as well
export default {
  sanitizeHtml,
  sanitizeInput,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeFileName,
  sanitizePhone,
  sanitizeObject,
  sanitizeSearchQuery,
  escapeHtml,
  containsDangerousContent,
  safeJsonParse,
};

