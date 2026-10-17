import { describe, it, expect, beforeEach } from 'vitest';
import { createUI, makeItem } from './helpers/harness.js';

const removeButtons = () =>
  Array.from(document.querySelectorAll('#itemsList [data-item-remove]'));

const itemRows = () => Array.from(document.querySelectorAll('#itemsList .item-row'));

describe('screenshot list — removing items', () => {
  let ctx;

  beforeEach(() => {
    ctx = createUI();
  });

  it('shows an empty state when there are no screenshots', () => {
    expect(document.querySelector('#itemsList .item-empty').textContent).toBe('No screenshots yet');
    expect(removeButtons()).toHaveLength(0);
  });

  it('renders one remove button per screenshot with an accessible label', () => {
    ctx.store.addItem(makeItem('a', 'Home'));
    ctx.store.addItem(makeItem('b', 'Settings'));
    ctx.ui.renderItems();

    const buttons = removeButtons();
    expect(buttons).toHaveLength(2);
    expect(buttons.map(b => b.dataset.itemRemove)).toEqual(['a', 'b']);
    expect(buttons[0].getAttribute('aria-label')).toContain('Home');
    expect(buttons[1].getAttribute('aria-label')).toContain('Settings');
    expect(buttons[0].tagName).toBe('BUTTON');
  });

  it('removes a non-active screenshot without touching the selection', async () => {
    ctx.store.addItem(makeItem('a'));
    ctx.store.addItem(makeItem('b'));
    ctx.store.project.activeItemId = 'b';
    ctx.ui.renderItems();

    // click the remove button of the *first* (non active) row
    removeButtons()[0].click();

    expect(ctx.store.project.items.map(i => i.id)).toEqual(['b']);
    expect(ctx.store.project.activeItemId).toBe('b');
    // the row click handler must not fire for the removed item
    expect(ctx.canvasManager.setCurrentItem).not.toHaveBeenCalled();
  });

  it('removes the active screenshot and loads the next one on the canvas', async () => {
    ctx.store.addItem(makeItem('a', 'Home'));
    ctx.store.addItem(makeItem('b', 'Settings'));
    ctx.store.project.activeItemId = 'a';
    ctx.ui.renderItems();
    ctx.canvasManager.setCurrentItem.mockClear();

    await ctx.ui.removeItem('a');

    expect(ctx.store.project.items.map(i => i.id)).toEqual(['b']);
    expect(ctx.store.project.activeItemId).toBe('b');
    expect(ctx.canvasManager.setCurrentItem).toHaveBeenCalledTimes(1);
    expect(ctx.canvasManager.setCurrentItem.mock.calls[0][0].id).toBe('b');
  });

  it('clears the canvas and disables exports when the last screenshot is removed', async () => {
    ctx.store.addItem(makeItem('a'));
    ctx.ui.update();
    expect(ctx.ui.btnExportAll.disabled).toBe(false);

    await ctx.ui.removeItem('a');

    expect(ctx.store.project.items).toHaveLength(0);
    expect(ctx.canvasManager.setCurrentItem).toHaveBeenCalledWith(null);
    expect(removeButtons()).toHaveLength(0);
    expect(document.querySelector('#itemsList .item-empty')).not.toBeNull();
    expect(ctx.ui.btnExportAll.disabled).toBe(true);
    expect(ctx.ui.btnExportZip.disabled).toBe(true);
    expect(ctx.ui.btnExportSelected.disabled).toBe(true);
    expect(ctx.ui.activeItemName.textContent).toBe('None');
  });

  it('re-numbers the remaining screenshots', async () => {
    ctx.store.addItem(makeItem('a'));
    ctx.store.addItem(makeItem('b'));
    ctx.store.addItem(makeItem('c'));
    ctx.ui.renderItems();

    removeButtons()[1].click(); // drop "b"

    const names = itemRows()
      .map(row => row.querySelector('.layer-name').textContent)
      .filter(Boolean);
    expect(names).toEqual(['1. Screenshot', '2. Screenshot']);
  });

  it('ignores a remove request for an unknown id', async () => {
    ctx.store.addItem(makeItem('a'));
    ctx.ui.update();
    await ctx.ui.removeItem('does-not-exist');
    expect(ctx.store.project.items.map(i => i.id)).toEqual(['a']);
  });

  it('reports what happened in the status bar', async () => {
    ctx.store.addItem(makeItem('a', 'Home'));
    ctx.ui.renderItems();
    await ctx.ui.removeItem('a');
    expect(document.getElementById('statusProject').textContent).toBe('Removed Home — 0 left');
  });
});
