// Shared with the admin UI; always evaluate the saved order status on the server.
export function shipmentStatusProblem(status: string): string | null {
  if (["CONFIRMED", "PREPARING", "READY"].includes(status)) return null;
  if (status === "NEW") return "Confirm and save this order before preparing its Aramex delivery.";
  return "Only confirmed, preparing or ready orders can start an Aramex delivery. Dispatched, completed and cancelled orders cannot start another preparation.";
}
