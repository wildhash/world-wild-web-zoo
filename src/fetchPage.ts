/**
 * URL fetching and sanitization module
 */

import { PageContent } from './types';

const MAX_SIZE = 1024 * 1024; // 1 MB
const MAX_TEXT_LENGTH = 2000;

/**
 * Validates that the URL is HTTP/HTTPS only
 */
function validateUrl(url: string): void {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Only HTTP and HTTPS protocols are supported');
    }
  } catch (error) {
    throw new Error(`Invalid URL: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extracts text content from HTML, removing tags and scripts
 */
function extractTextFromHtml(html: string): string {
  let text = html;
  
  // Remove potentially dangerous content blocks
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script[^>]*>/gi, ' ');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style[^>]*>/gi, ' ');
  
  // Remove all HTML tags iteratively
  let previousLength = 0;
  const maxIterations = 10;
  let iterations = 0;
  while (text.length !== previousLength && text.includes('<') && iterations < maxIterations) {
    previousLength = text.length;
    text = text.replace(/<[^>]*>/g, ' ');
    iterations++;
  }
  
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  
  return text;
}

/**
 * Extracts title from HTML
 */
function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return extractTextFromHtml(titleMatch[1]).substring(0, 200);
  }
  return 'Untitled';
}

/**
 * Extracts meta description from HTML
 */
function extractDescription(html: string): string {
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  if (descMatch && descMatch[1]) {
    return extractTextFromHtml(descMatch[1]).substring(0, 300);
  }
  return '';
}

/**
 * Fetches a URL, sanitizes it, and extracts relevant content
 */
export async function fetchPage(url: string): Promise<PageContent> {
  // Validate URL
  validateUrl(url);
  
  try {
    // Fetch with caching and size limits
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'WorldWildWebZoo-Crawler/1.0'
      },
      cf: {
        cacheEverything: true
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Check content length
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_SIZE) {
      throw new Error('Content size exceeds maximum limit');
    }
    
    const html = await response.text();
    
    // Extract components
    const title = extractTitle(html);
    const description = extractDescription(html);
    const fullText = extractTextFromHtml(html);
    const snippet = fullText.substring(0, MAX_TEXT_LENGTH);
    
    return {
      title,
      description,
      snippet: snippet || 'Unable to extract meaningful content from this URL.'
    };
  } catch (error) {
    throw new Error(`Failed to fetch URL: ${error instanceof Error ? error.message : String(error)}`);
  }
}
