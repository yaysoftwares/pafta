import { describe, it, expect, beforeEach } from 'vitest';
import { Store } from '../js/store.js';
import { MemoryAdapter, STORAGE_KEY } from '../js/storage.js';

/** Build a plain item object shaped like the ones the app stores. */
function makeItem(id, name = 'Screenshot', dataUrl = 'data:image/png;base64,AAAA') {
  return { id, name, dataUrl };
}

describe('StorageAdapter', () => {
  let mem;

  beforeEach(() => {
    mem = new MemoryAdapter();
  });

  it('writes items through MemoryAdapter and survives a reload', async () => {
    const a = new Store({ adapter: mem });
    a.addItem(makeItem('x', 'Shot', 'data:image/png;base64,AAAA'));
    await a.whenPersisted();

    const b = new Store({ adapter: mem });
    await b.hydrate();

    expect(b.project.items.map(i => i.id)).toEqual(['x']);
    expect(b.project.items[0].dataUrl).toContain('base64');
    expect(b.getActiveItem().id).toBe('x');
  });

  it('surfaces write errors through onPersistError instead of failing silently', async () => {
    const seen = [];
    const boom = new MemoryAdapter();
    const originalSet = boom.set.bind(boom);
    boom.set = async () => {
      await originalSet();
      throw new Error('quota');
    };

    const store = new Store({ adapter: boom });
    store.onPersistError = (err) => seen.push(err.message);

    store.addItem(makeItem('a'));
    await store.whenPersisted();

    expect(seen).toEqual(['quota']);
    // bellekteki durum değişimi yine de uygulanmış olmalı
    expect(store.project.items.map(i => i.id)).toEqual(['a']);
  });
});
