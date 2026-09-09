import { describe, it, expect } from 'vitest';
import { normalizeUrl } from '@/lib/editor/normalizeUrl';

describe('normalizeUrl', () => {
  it('adds https:// to a bare domain', () => {
    expect(normalizeUrl('wajidali.netlify.app')).toBe('https://wajidali.netlify.app');
  });

  it('adds https:// to a bare domain with a path', () => {
    expect(normalizeUrl('example.com/docs')).toBe('https://example.com/docs');
  });

  it('leaves an existing http(s) scheme untouched', () => {
    expect(normalizeUrl('https://example.com')).toBe('https://example.com');
    expect(normalizeUrl('http://example.com')).toBe('http://example.com');
  });

  it('leaves other schemes untouched', () => {
    expect(normalizeUrl('mailto:a@b.com')).toBe('mailto:a@b.com');
    expect(normalizeUrl('tel:+15551234567')).toBe('tel:+15551234567');
  });

  it('trims whitespace', () => {
    expect(normalizeUrl('  example.com  ')).toBe('https://example.com');
  });

  it('returns an empty string for empty/blank input', () => {
    expect(normalizeUrl('')).toBe('');
    expect(normalizeUrl('   ')).toBe('');
  });
});
