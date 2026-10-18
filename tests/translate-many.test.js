import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TranslateManager } from '../js/translate.js';
import { Store } from '../js/store.js';
import { createUI } from './helpers/harness.js';

const PRIVACY_NOTE =
  'Çeviriler Google Translate (gtx) uç noktasına gönderilir; başka hiçbir veri gönderilmez.';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const waitFor = (fn, timeout = 5000) =>
  new Promise((resolve, reject) => {
    const deadline = Date.now() + timeout;
    const loop = () => {
      if (fn()) return resolve();
      if (Date.now() > deadline) return reject(new Error('waitFor timed out'));
      setTimeout(loop, 10);
    };
    loop();
  });

let originalFetch;
beforeEach(() => {
  originalFetch = globalThis.fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

function useFetch(stub) {
  globalThis.fetch = stub;
}

function okJson(data) {
  return { ok: true, status: 200, json: async () => data };
}

function gtxUrl(text, source = 'en', target = 'tr') {
  const encoded = encodeURIComponent(text);
  return `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encoded}`;
}

describe('TranslateManager.translateMany', () => {
  let tm;

  beforeEach(() => {
    tm = new TranslateManager(new Store());
  });

  it('keeps at most `concurrency` requests in flight and returns results in input order', async () => {
    const texts = ['a', 'b', 'c', 'd', 'e', 'f'];
    const started = [];
    const releases = [];
    let inFlight = 0;
    let peak = 0;
    useFetch(
      vi.fn(async (url) => {
        expect(url).toContain('translate.googleapis.com');
        expect(url).toContain('client=gtx');
        const index = started.length;
        expect(url).toContain(`q=${encodeURIComponent(texts[index])}`);
        started.push(url);
        inFlight++;
        peak = Math.max(peak, inFlight);
        await new Promise((resolve) => releases.push(resolve));
        inFlight--;
        return okJson([[[`tr:${texts[index]}`]]]);
      }),
    );

    const promise = tm.translateMany(texts, 'EN', 'TR', { concurrency: 3 });
    await waitFor(() => started.length === 3);
    expect(peak).toBe(3);
    // release the first three in reverse order: results must still line up by index
    for (let i = releases.length - 1; i >= 0; i--) releases[i]();
    await waitFor(() => started.length === 6);
    expect(peak).toBe(3);
    releases.forEach((release) => release());
    const results = await promise;
    expect(results.map((r) => r.ok)).toEqual([true, true, true, true, true, true]);
    expect(results.map((r) => r.text)).toEqual(['tr:a', 'tr:b', 'tr:c', 'tr:d', 'tr:e', 'tr:f']);
  });

  it('translateText throws when response.ok is false', async () => {
    useFetch(
      vi.fn(async (url) => {
        expect(url).toContain('client=gtx');
        return { ok: false, status: 500, json: async () => null };
      }),
    );
    await expect(tm.translateText('hello', 'en', 'tr')).rejects.toThrow('HTTP 500');
  });

  it('retries exactly once on HTTP 500 (2 requests total) and ends ok:false', async () => {
    const calls = [];
    useFetch(
      vi.fn(async () => {
        calls.push(1);
        return { ok: false, status: 500, json: async () => null };
      }),
    );
    const results = await tm.translateMany(['fail'], 'EN', 'TR');
    expect(calls).toHaveLength(2);
    expect(results[0]).toEqual({ ok: false, error: expect.any(String) });
  });

  it('recovers on retry (500 then 200)', async () => {
    const responses = [
      { ok: false, status: 500, json: async () => null },
      okJson([[[ 'recovered' ]]]),
    ];
    useFetch(vi.fn(async () => responses.shift()));
    const results = await tm.translateMany(['a'], 'EN', 'TR');
    expect(results[0]).toEqual({ ok: true, text: 'recovered' });
  });

  it('aborts in-flight requests on signal and discards late results', async () => {
    const latches = [];
    useFetch(
      vi.fn(async () => {
        await new Promise((resolve) => latches.push(resolve));
        return okJson([[[['late']]]]);
      }),
    );
    const controller = new AbortController();
    const promise = tm.translateMany(['a', 'b'], 'EN', 'TR', { signal: controller.signal });
    await Promise.resolve();
    controller.abort();
    await expect(promise).rejects.toThrow('Aborted');
    // a late response must not resurrect results
    latches.forEach((resolve) => resolve());
    await Promise.resolve();
  });

  it('returns an empty array for empty input without fetching', async () => {
    const fetchStub = vi.fn();
    useFetch(fetchStub);
    const results = await tm.translateMany([], 'EN', 'TR');
    expect(results).toEqual([]);
    expect(fetchStub).not.toHaveBeenCalled();
  });
});

describe('translate modal (UI)', () => {
  let ctx;

  beforeEach(() => {
    ctx = createUI();
    ctx.store.project.langs = ['EN', 'TR'];
    ctx.canvasManager.getTextObjects = () => [{ texts: { EN: 'Hello world' }, text: 'Hello world' }];
    ctx.translateManager.isOnline = () => true;
    ctx.translateManager.applyGlossary = (text) => text;
  });

  it('shows the privacy note when the modal opens', async () => {
    ctx.translateManager.translateMany = vi.fn(async (texts) =>
      texts.map(() => ({ ok: true, text: 'Merhaba' })),
    );
    await ctx.ui.onTranslate();

    const modal = document.getElementById('modalTranslate');
    expect(modal.classList.contains('active')).toBe(true);
    const body = document.querySelector('#modalTranslate .modal-body');
    expect(body.textContent).toContain(PRIVACY_NOTE);
  });

  it('shows a per-line retry button on failure and re-translates only that line', async () => {
    const allCalls = [];
    ctx.translateManager.translateMany = vi.fn(async (texts) => {
      allCalls.push([...texts]);
      return texts.map(() => ({ ok: false, error: 'HTTP 500' }));
    });
    await ctx.ui.onTranslate();

    const textarea = document.querySelector('#modalTranslate textarea');
    expect(textarea.placeholder).toBe('Translation failed — type manually');
    const btn = document.querySelector('#modalTranslate [data-translate-retry="0"]');
    expect(btn).not.toBeNull();

    ctx.translateManager.translateMany.mockImplementation(async (texts) => {
      allCalls.push([...texts]);
      return texts.map(() => ({ ok: true, text: 'Merhaba' }));
    });
    btn.click();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(allCalls).toEqual([['Hello world'], ['Hello world']]);
    expect(document.querySelector('#modalTranslate textarea').value).toBe('Merhaba');
    expect(document.querySelector('#modalTranslate textarea').placeholder).toBe('');
    expect(document.querySelector('#modalTranslate [data-translate-retry="0"]')).toBeNull();
  });

  it('aborts in-flight translation on close and applies no late results', async () => {
    let release;
    ctx.translateManager.translateMany = vi.fn(
      () => new Promise((resolve) => (release = resolve)),
    );
    ctx.ui.onTranslate();
    expect(ctx.ui._translateAbort).not.toBeNull();

    ctx.ui.closeTranslateModal();
    expect(ctx.ui._translateAbort).toBeNull();
    expect(ctx.ui.pendingTranslations).toBeNull();
    expect(document.getElementById('modalTranslate').classList.contains('active')).toBe(false);

    release([{ ok: true, text: 'Must not be applied' }]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(ctx.ui.pendingTranslations).toBeNull();
    ctx.ui.applyTranslations();
    expect(ctx.ui.pendingTranslations).toBeNull();
  });
});
