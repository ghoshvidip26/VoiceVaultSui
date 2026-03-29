/**
 * Utilities for parsing Move data types from Sui object fields
 */

/**
 * Parse Move string type from Sui object data.
 * Sui typically returns strings directly in parsed content,
 * but may also return raw BCS bytes.
 */
export function parseMoveString(value: any): string {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    // If it's an object with bytes field (BCS encoded)
    if (value.bytes) {
      const bytesValue = value.bytes;
      if (typeof bytesValue === "string") {
        if (bytesValue.startsWith("0x")) {
          try {
            const hexString = bytesValue.slice(2);
            const bytes = new Uint8Array(
              hexString.match(/.{1,2}/g)?.map((byte: string) => parseInt(byte, 16)) || []
            );
            return new TextDecoder("utf-8").decode(bytes);
          } catch {
            return bytesValue;
          }
        }
        return bytesValue;
      }
    }

    return JSON.stringify(value);
  }

  return "";
}
