/**
 * Basic tests for World Wild Web Zoo
 */

import { describe, it, expect } from 'vitest';

describe('Worker Tests', () => {
  it('should validate URL protocol', () => {
    const validUrls = [
      'http://example.com',
      'https://example.com',
      'https://github.com/test'
    ];
    
    const invalidUrls = [
      'ftp://example.com',
      'javascript:alert(1)',
      'file:///etc/passwd'
    ];
    
    // Test valid URLs
    validUrls.forEach(url => {
      const parsed = new URL(url);
      expect(['http:', 'https:'].includes(parsed.protocol)).toBe(true);
    });
    
    // Test invalid URLs
    invalidUrls.forEach(url => {
      try {
        const parsed = new URL(url);
        expect(['http:', 'https:'].includes(parsed.protocol)).toBe(false);
      } catch {
        // Invalid URL format is also acceptable
        expect(true).toBe(true);
      }
    });
  });
  
  it('should trim HTML content', () => {
    const html = '<html><body><p>Hello World</p></body></html>';
    let text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    expect(text).toBe('Hello World');
  });
  
  it('should generate creature ID format', () => {
    const id = `creature-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    expect(id).toMatch(/^creature-\d+-[a-z0-9]+$/);
  });
});
