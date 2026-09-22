import { describe, expect, it } from 'vitest';
import { addDonorAllocation, rebalanceDonorAllocations, setEditionStockTotal } from './stock';

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

describe('donor stock allocations', () => {
  const jana = { donorId: 'jana', stockQuantity: 1 };
  const fatima = { donorId: 'fatima', stockQuantity: 1 };

  it('splits two copies between two selected donors', () => {
    const afterJana = addDonorAllocation([], jana, 2);
    expect(afterJana).toEqual([{ donorId: 'jana', stockQuantity: 2 }]);
    expect(addDonorAllocation(afterJana, fatima, 2)).toEqual([
      { donorId: 'jana', stockQuantity: 1 },
      { donorId: 'fatima', stockQuantity: 1 },
    ]);
  });

  it('repairs an undersized existing allocation before adding another donor', () => {
    expect(addDonorAllocation([jana], fatima, 2)).toEqual([
      { donorId: 'jana', stockQuantity: 1 },
      { donorId: 'fatima', stockQuantity: 1 },
    ]);
  });

  it('rebalances the reported four-to-two copy workaround to one copy each', () => {
    expect(rebalanceDonorAllocations([
      { donorId: 'jana', stockQuantity: 3 },
      { donorId: 'fatima', stockQuantity: 1 },
    ], 2)).toEqual([
      { donorId: 'jana', stockQuantity: 1 },
      { donorId: 'fatima', stockQuantity: 1 },
    ]);
  });

  it('does not add more donors than available copies or duplicate a donor', () => {
    expect(addDonorAllocation([jana], fatima, 1)).toEqual([jana]);
    expect(addDonorAllocation([jana], { ...jana, stockQuantity: 99 }, 2)).toEqual([jana]);
  });

  it('keeps at least one copy per selected donor', () => {
    const allocations = [jana, fatima];
    expect(rebalanceDonorAllocations(allocations, 1)).toBe(allocations);
  });
});
