const MAX_RESPONSE_BYTES = 256 * 1024;

export async function boundedJson(response: Response, signal: AbortSignal): Promise<unknown> {
  if (!response.body) throw Error("EMPTY_RESPONSE");
  const reader = response.body.getReader();
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener("abort", cancel, { once: true });
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    if (signal.aborted) throw Error("ABORTED");
    while (true) {
      const { done, value } = await reader.read();
      if (signal.aborted) throw Error("ABORTED");
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) throw Error("RESPONSE_TOO_LARGE");
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } finally {
    signal.removeEventListener("abort", cancel);
    cancel();
  }
}
