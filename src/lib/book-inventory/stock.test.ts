import { describe, expect, it } from 'vitest';
import { setEditionStockTotal } from './stock';

describe('setEditionStockTotal', () => {
  it('updates a single edition to match the requested book quantity', () => {
    expect(setEditionStockTotal([{ stockQuantity: 2 }], 7)).toEqual([{ stockQuantity: 7 }]);
  });

  it('adds copies to the last edition when there are multiple editions', () => {
    expect(setEditionStockTotal([{ stockQuantity: 2 }, { stockQuantity: 3 }], 8)).toEqual([
      { stockQuantity: 2 },
      { stockQuantity: 6 },
    ]);
  });

  it('removes copies from later editions first without making stock negative', () => {
    expect(setEditionStockTotal([{ stockQuantity: 4 }, { stockQuantity: 3 }], 2)).toEqual([
      { stockQuantity: 2 },
      { stockQuantity: 0 },
    ]);
  });

  it('clamps the quantity to the inventory limits', () => {
    expect(setEditionStockTotal([{ stockQuantity: 2 }], -1)).toEqual([{ stockQuantity: 0 }]);
    expect(setEditionStockTotal([{ stockQuantity: 2 }], 20_000)).toEqual([{ stockQuantity: 10_000 }]);
  });
});
