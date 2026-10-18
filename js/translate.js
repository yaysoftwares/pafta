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
  async translateMany(texts, source, target, { concurrency = 3, signal } = {}) {
    const results = new Array(texts.length);
    let next = 0;
    let inFlight = 0;
    let peakInFlight = 0;
    let done = 0;
    let aborted = false;

    const onAbort = () => {
      aborted = true;
    };
    let signalAttached = false;
    if (signal) {
      if (signal.aborted) aborted = true;
      else {
        signal.addEventListener('abort', onAbort, { once: true });
        signalAttached = true;
      }
    }
    const detach = () => {
      if (signalAttached) {
        signalAttached = false;
        signal.removeEventListener('abort', onAbort);
      }
    };

    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const attempt = async (text) => {
      let value;
      try {
        value = await this.translateText(text, source, target, signal);
      } catch (e) {
        if (aborted) throw e;
        await wait(RETRY_DELAY_MS);
        if (aborted) throw new Error('Aborted');
        value = await this.translateText(text, source, target, signal);
      }
      return value;
    };

    const worker = async () => {
      while (next < texts.length && !aborted) {
        const index = next++;
        inFlight++;
        if (inFlight > peakInFlight) peakInFlight = inFlight;
        try {
          results[index] = { ok: true, text: await attempt(texts[index]) };
        } catch (e) {
          if (!aborted) results[index] = { ok: false, error: String(e) };
        } finally {
          inFlight--;
          done++;
        }
      }
    };

    const width = Math.min(Math.max(concurrency, 1), texts.length);
    const workers = Array.from({ length: width }, worker);

    if (aborted && texts.length > 0) {
      detach();
      throw new Error('Aborted');
    }

    const finished = new Promise((resolve) => {
      const check = () => (done >= texts.length ? resolve() : setTimeout(check, 10));
      check();
    });
    const abortedWait = signalAttached
      ? new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('Aborted')), { once: true }))
      : null;

    try {
      await (abortedWait ? Promise.race([finished, abortedWait]) : finished);
    } finally {
      detach();
    }

    if (aborted) throw new Error('Aborted');
    return results;
  }
}
