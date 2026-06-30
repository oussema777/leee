export interface RecipientCandidate {
  email: string;
  name: string | null;
  tags: string[];
  status: "SUBSCRIBED" | "UNSUBSCRIBED" | "BOUNCED" | "COMPLAINED";
}

export function resolveRecipients(
  contacts: RecipientCandidate[],
  selectedTags: string[],
  suppressed: Set<string>
): RecipientCandidate[] {
  const tagSet = new Set(selectedTags);
  return contacts.filter(
    (c) =>
      c.status === "SUBSCRIBED" &&
      !suppressed.has(c.email) &&
      c.tags.some((t) => tagSet.has(t))
  );
}
