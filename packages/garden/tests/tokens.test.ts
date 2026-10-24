// The share card reads its colours off styles/tokens.css (lib/cardColours.ts):
// the regexes must keep finding the four tokens in the shape the file writes them.
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { cardColoursFrom } from '../lib/cardColours.ts';

describe('tokens.css', () => {
  it('yields the dark ground, heading and muted colours and the brand yellow', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../styles/tokens.css'), 'utf8');
    const palette = cardColoursFrom(css);
    for (const value of Object.values(palette)) expect(value).toMatch(/^#[0-9a-f]{6}$/i);
    expect(palette).toEqual({ background: '#282828', heading: '#fbf1c7', muted: '#bdae93', accent: '#fad03a' });
    expect(() => cardColoursFrom('--site-bg: #fff;')).toThrow('no light-dark() hex pair for --site-bg');
  });
});
