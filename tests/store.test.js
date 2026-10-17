import { describe, it, expect, beforeEach } from 'vitest';
import { Store } from '../js/store.js';

const STORAGE_KEY = 'screenshot-framer-store';

/** Build a plain item object shaped like the ones the app stores. */
function makeItem(id, name = 'Screenshot', dataUrl = 'data:image/png;base64,AAAA') {
  return { id, name, dataUrl };
}

describe('Store', () => {
  let store;

  beforeEach(() => {
    sessionStorage.clear();
    store = new Store();
  });

  describe('addItem', () => {
    it('appends the item and makes it active', () => {
      const a = makeItem('a');
      store.addItem(a);
      expect(store.project.items).toEqual([a]);
      expect(store.project.activeItemId).toBe('a');
    });

    it('marks the newest item active when several are added', () => {
      store.addItem(makeItem('a'));
      store.addItem(makeItem('b'));
      store.addItem(makeItem('c'));
      expect(store.project.items.map(i => i.id)).toEqual(['a', 'b', 'c']);
      expect(store.project.activeItemId).toBe('c');
    });
  });

  describe('getActiveItem', () => {
    it('returns null when there are no items', () => {
      expect(store.getActiveItem()).toBeNull();
    });

    it('returns the item matching activeItemId', () => {
      store.addItem(makeItem('a'));
      store.addItem(makeItem('b'));
      store.project.activeItemId = 'a';
      expect(store.getActiveItem().id).toBe('a');
    });
  });

  describe('removeItem', () => {
    it('removes the item from the list', () => {
      store.addItem(makeItem('a'));
      store.addItem(makeItem('b'));
      store.removeItem('a');
      expect(store.project.items.map(i => i.id)).toEqual(['b']);
    });

    it('moves the selection to the first remaining item when the active one is removed', () => {
      store.addItem(makeItem('a'));
      store.addItem(makeItem('b'));
      store.addItem(makeItem('c'));
      store.project.activeItemId = 'b';
      store.removeItem('b');
      expect(store.project.activeItemId).toBe('a');
      expect(store.getActiveItem().id).toBe('a');
    });

    it('keeps the current selection when a non-active item is removed', () => {
      store.addItem(makeItem('a'));
      store.addItem(makeItem('b'));
      store.project.activeItemId = 'b';
      store.removeItem('a');
      expect(store.project.activeItemId).toBe('b');
      expect(store.project.items.map(i => i.id)).toEqual(['b']);
    });

    it('clears the selection when the last item is removed', () => {
      store.addItem(makeItem('a'));
      store.removeItem('a');
      expect(store.project.items).toEqual([]);
      expect(store.project.activeItemId).toBeNull();
      expect(store.getActiveItem()).toBeNull();
    });

    it('is a no-op for an unknown id', () => {
      store.addItem(makeItem('a'));
      store.removeItem('nope');
      expect(store.project.items.map(i => i.id)).toEqual(['a']);
      expect(store.project.activeItemId).toBe('a');
    });

    it('persists the removal to sessionStorage', () => {
      store.addItem(makeItem('a'));
      store.addItem(makeItem('b'));
      store.removeItem('a');
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
      expect(saved.project.items.map(i => i.id)).toEqual(['b']);
      expect(saved.project.activeItemId).toBe('b');
    });

    it('survives a reload through sessionStorage', () => {
      store.addItem(makeItem('a'));
      store.addItem(makeItem('b'));
      store.removeItem('a');
      const reloaded = new Store();
      expect(reloaded.project.items.map(i => i.id)).toEqual(['b']);
      expect(reloaded.getActiveItem().id).toBe('b');
    });
  });
});
