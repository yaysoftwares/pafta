const RETRY_DELAY_MS = 400;

export class TranslateManager {
  constructor(store) {
    this.store = store;
  }

  isOnline() {
    return navigator.onLine;
  }

  applyGlossary(text) {
    let result = text;
    for (const term of this.store.glossary.preserve) {
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      result = result.replace(regex, term);
    }
    for (const map of this.store.glossary.translateMap) {
      const regex = new RegExp(map.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      result = result.replace(regex, map.to);
    }
    return result;
  }

  // Single-request core: throws on HTTP errors so callers can decide per-text retry.
  async translateText(text, source, target, signal) {
    if (!this.isOnline()) throw new Error('Not online');
    if (!text) return text;

    const encodedText = encodeURIComponent(text);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&q=${encodedText}`;

    const response = await fetch(url, signal ? { signal } : undefined);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data[0] && data[0][0] && data[0][0][0]) {
      return data[0][0][0];
    }
    throw new Error('Translation failed');
  }

  // Translates several texts with a concurrency cap, at most one retry per text
  // (after RETRY_DELAY_MS), results in input order, each with an ok flag.
  // Rejects with an 'Aborted' error when the given signal fires.
  async translateMany(texts, source, target, { concurrency = 3, signal } = {}) {
    const results = new Array(texts.length);
    if (!texts.length) return results;

    let aborted = Boolean(signal?.aborted);
    const onAbort = () => {
      aborted = true;
    };
    if (signal && !aborted) signal.addEventListener('abort', onAbort, { once: true });

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const attempt = async (text) => {
      try {
        return await this.translateText(text, source, target, signal);
      } catch (err) {
        if (aborted) throw err;
        await wait(RETRY_DELAY_MS);
        if (aborted) throw new Error('Aborted');
        return this.translateText(text, source, target, signal);
      }
    };

    let next = 0;
    const worker = async () => {
      while (!aborted) {
        const index = next++;
        if (index >= texts.length) return;
        try {
          results[index] = { ok: true, text: await attempt(texts[index]) };
        } catch (err) {
          if (!aborted) results[index] = { ok: false, error: String(err) };
        }
      }
    };

    const width = Math.min(Math.max(concurrency, 1), texts.length);
    const all = Promise.all(Array.from({ length: width }, () => worker()));
    const abortedWait = signal
      ? new Promise((_, reject) => {
          if (signal.aborted) reject(new Error('Aborted'));
          else signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true });
        })
      : null;

    try {
      if (abortedWait) await Promise.race([all, abortedWait]);
      else await all;
    } finally {
      if (signal) signal.removeEventListener('abort', onAbort);
    }

    if (aborted) throw new Error('Aborted');
    return results;
  }
}
