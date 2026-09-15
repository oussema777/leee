type EditionWithStock = { stockQuantity: number };

export function setEditionStockTotal<T extends EditionWithStock>(editions: T[], requestedTotal: number): T[] {
  if (!editions.length) return editions;

  const targetTotal = Math.min(10_000, Math.max(0, Math.trunc(requestedTotal || 0)));
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
