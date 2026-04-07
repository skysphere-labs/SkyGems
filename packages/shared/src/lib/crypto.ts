const CROCKFORD_BASE32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function getCrypto(): Crypto {
  if (!globalThis.crypto) {
    throw new Error("Web Crypto is required for SkyGems shared helpers.");
  }

  return globalThis.crypto;
}

function encodeTime(time: number, length = 10): string {
  let remaining = time;
  let encoded = "";

  for (let index = 0; index < length; index += 1) {
    encoded = CROCKFORD_BASE32[remaining % 32] + encoded;
    remaining = Math.floor(remaining / 32);
  }

  return encoded;
}

function encodeRandom(length: number): string {
  const randomValues = new Uint8Array(length);
  getCrypto().getRandomValues(randomValues);

  return Array.from(randomValues, (value) => CROCKFORD_BASE32[value % 32]).join("");
}

function toBytes(input: string | ArrayBuffer | Uint8Array): Uint8Array {
  if (typeof input === "string") {
    return new TextEncoder().encode(input);
  }

  if (input instanceof Uint8Array) {
    return input;
  }

  return new Uint8Array(input);
}

export async function sha256Hex(input: string | ArrayBuffer | Uint8Array): Promise<string> {
  const digest = await getCrypto().subtle.digest("SHA-256", Uint8Array.from(toBytes(input)));
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join(
    "",
  );
}

export function generateUlid(now = Date.now()): string {
  return `${encodeTime(now)}${encodeRandom(16)}`;
}
