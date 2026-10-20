import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// The toolbar used to stretch the page: its min-content width (792px) was
// wider than a phone, so the single-column grid track grew past the viewport
// and the whole page scrolled sideways. jsdom has no layout engine, so the
// guard asserts the two declarations that keep the toolbar inside its own box.
const css = readFileSync(resolve(process.cwd(), 'css/layout.css'), 'utf8').replace(
  /\/\*[\s\S]*?\*\//g,
  '',
);

function parseRules(source) {
  const rules = [];
  const pattern = /([^{}]+)\{([^{}]*)\}/g;
  let match;
  while ((match = pattern.exec(source)) !== null) {
    rules.push({ selector: match[1].trim(), body: match[2] });
  }
  return rules;
}

function declarationsOf(source, selector) {
  const rule = parseRules(source).find((r) =>
    r.selector.split(',').some((part) => part.trim() === selector),
  );
  if (!rule) return null;
  const out = {};
  for (const part of rule.body.split(';')) {
    const [prop, ...rest] = part.split(':');
    if (!prop || rest.length === 0) continue;
    out[prop.trim()] = rest.join(':').trim();
  }
  return out;
}

describe('topbar responsive layout', () => {
  it('lets the toolbar shrink so the page never scrolls sideways', () => {
    const topbar = declarationsOf(css, '.topbar');
    expect(topbar).not.toBeNull();
    expect(topbar['min-width']).toBe('0');
    expect(topbar['overflow-x']).toBe('auto');
  });

  it('keeps toolbar items at their natural width so labels do not wrap', () => {
    const items = declarationsOf(css, '.topbar > *');
    expect(items).not.toBeNull();
    expect(items['flex']).toBe('0 0 auto');
  });
});
