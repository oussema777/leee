type EditionWithStock = { stockQuantity: number };
type DonorAllocationWithStock = { donorId: string; stockQuantity: number };

const clampStock = (quantity: number) => Math.min(10_000, Math.max(0, Math.trunc(quantity || 0)));

export function setEditionStockTotal<T extends EditionWithStock>(editions: T[], requestedTotal: number): T[] {
  if (!editions.length) return editions;

  const targetTotal = clampStock(requestedTotal);
  const currentTotal = editions.reduce((total, edition) => total + edition.stockQuantity, 0);
  const nextEditions = editions.map((edition) => ({ ...edition }));

  if (targetTotal >= currentTotal) {
    nextEditions[nextEditions.length - 1].stockQuantity += targetTotal - currentTotal;
    return nextEditions;
  }

  let copiesToRemove = currentTotal - targetTotal;
  for (let index = nextEditions.length - 1; index >= 0 && copiesToRemove > 0; index -= 1) {
    const removed = Math.min(nextEditions[index].stockQuantity, copiesToRemove);
    nextEditions[index].stockQuantity -= removed;
    copiesToRemove -= removed;
  }

  return nextEditions;
}

/** Keep selected donors while making their allocations match the available stock. */
export function rebalanceDonorAllocations<T extends DonorAllocationWithStock>(allocations: T[], requestedTotal: number): T[] {
  if (!allocations.length) return allocations;

  const targetTotal = clampStock(requestedTotal);
  if (targetTotal < allocations.length) return allocations;

  const nextAllocations = allocations.map((allocation) => ({
    ...allocation,
    stockQuantity: Math.max(1, Math.trunc(allocation.stockQuantity || 1)),
  }));
  const currentTotal = nextAllocations.reduce((total, allocation) => total + allocation.stockQuantity, 0);

  if (currentTotal < targetTotal) {
    nextAllocations[0].stockQuantity += targetTotal - currentTotal;
    return nextAllocations;
  }

  let copiesToRemove = currentTotal - targetTotal;
  for (let index = 0; index < nextAllocations.length && copiesToRemove > 0; index += 1) {
    const removable = Math.max(0, nextAllocations[index].stockQuantity - 1);
    const removed = Math.min(removable, copiesToRemove);
    nextAllocations[index].stockQuantity -= removed;
    copiesToRemove -= removed;
  }

  return nextAllocations;
}

/** Add a donor by assigning one copy and rebalancing the existing allocations. */
export function addDonorAllocation<T extends DonorAllocationWithStock>(allocations: T[], allocation: T, requestedTotal: number): T[] {
  const targetTotal = clampStock(requestedTotal);
  if (allocations.some((current) => current.donorId === allocation.donorId) || allocations.length >= targetTotal) return allocations;
  if (!allocations.length) return [{ ...allocation, stockQuantity: targetTotal }];

  const nextAllocations = rebalanceDonorAllocations(allocations, targetTotal);
  const sourceIndex = nextAllocations.findIndex((current) => current.stockQuantity > 1);
  if (sourceIndex < 0) return allocations;

  nextAllocations[sourceIndex].stockQuantity -= 1;
  return [...nextAllocations, { ...allocation, stockQuantity: 1 }];
}
