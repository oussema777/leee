export interface SummaryInput {
  sent: number; delivered: number; uniqueOpens: number; uniqueClicks: number;
  unsubscribes: number; bounces: number;
}
export interface Summary extends SummaryInput { openRate: number; clickRate: number; }

export function computeSummary(i: SummaryInput): Summary {
  const d = i.delivered || 0;
  return {
    ...i,
    openRate: d > 0 ? i.uniqueOpens / d : 0,
    clickRate: d > 0 ? i.uniqueClicks / d : 0,
  };
}
