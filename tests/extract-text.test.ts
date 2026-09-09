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

  // Regression for a real production bug: a heading's `attrs` (e.g.
  // `{level: 1}`) arrives through the Server Action boundary as a React
  // "temporary client reference" object — merely reading a property off it
  // throws "Cannot access X on the server. You cannot dot into a temporary
  // client reference from a server component," which made every autosave
  // containing a heading fail. extractText must never touch `attrs` on
  // anything but an image node. A Proxy that throws on any property read
  // stands in for that un-dot-into-able object.
  it('never reads attrs on a non-image node (heading attrs can be an opaque reference)', () => {
    const poisonedAttrs = new Proxy(
      {},
      {
        get() {
          throw new Error('Cannot access on the server. You cannot dot into a temporary client reference.');
        },
      },
    );
    const doc = {
      type: 'doc',
      content: [{ type: 'heading', attrs: poisonedAttrs, content: [{ type: 'text', text: 'Title' }] }],
    };
    expect(extractText(doc)).toBe('Title');
  });
});
