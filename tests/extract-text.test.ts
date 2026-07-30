import { describe, it, expect } from 'vitest';
import { extractText } from '@/lib/editor/extractText';

describe('extractText', () => {
  it('joins text nodes across a nested doc', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'heading', content: [{ type: 'text', text: 'Title' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Hello' }, { type: 'text', text: 'world' }] },
      ],
    };
    expect(extractText(doc)).toBe('Title Hello world');
  });

  it('includes image alt text', () => {
    const doc = {
      type: 'doc',
      content: [{ type: 'image', attrs: { src: '/api/images/1', alt: 'a diagram' } }],
    };
    expect(extractText(doc)).toBe('a diagram');
  });

  it('returns an empty string for a doc with no text', () => {
    expect(extractText({ type: 'doc', content: [{ type: 'paragraph' }] })).toBe('');
  });

  it('does not throw on malformed/unknown input', () => {
    expect(extractText(null)).toBe('');
    expect(extractText(undefined)).toBe('');
    expect(extractText('just a string')).toBe('');
    expect(extractText({ content: 'not an array' })).toBe('');
  });
});
