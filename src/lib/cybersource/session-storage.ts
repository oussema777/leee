import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
function key() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw Error("CHECKOUT_STORAGE_KEY_MISSING");
  return createHash("sha256").update("lee-cybersource-test-session-v1\0" + secret).digest();
}
export function encryptSession(value: unknown, attemptId: string) {
  const iv = randomBytes(12), cipher = createCipheriv("aes-256-gcm", key(), iv);
  cipher.setAAD(Buffer.from(attemptId));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map(b => b.toString("base64url")).join(".");
}
export function decryptSession(value: string, attemptId: string): unknown {
  const parts = value.split(".").map(p => Buffer.from(p, "base64url"));
  if (parts.length !== 3 || parts[0].length !== 12 || parts[1].length !== 16 || parts[2].length > 256 * 1024) throw Error("CHECKOUT_STORAGE_INVALID");
  const decipher = createDecipheriv("aes-256-gcm", key(), parts[0]);
  decipher.setAAD(Buffer.from(attemptId)); decipher.setAuthTag(parts[1]);
  return JSON.parse(Buffer.concat([decipher.update(parts[2]), decipher.final()]).toString("utf8"));
}
