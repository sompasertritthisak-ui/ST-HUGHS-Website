/** Header-only image dimension readers for JPEG, PNG and WebP. Returns null when unsure. */
export function imageDimensions(b: Buffer, mime: string): { width: number; height: number } | null {
  try {
    if (mime === "image/png" && b.length >= 24) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
    if (mime === "image/jpeg") return jpeg(b);
    if (mime === "image/webp") return webp(b);
  } catch {
    return null;
  }
  return null;
}

function jpeg(b: Buffer) {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      i += 2;
      continue;
    }
    const len = b.readUInt16BE(i + 2);
    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    i += 2 + len;
  }
  return null;
}

function webp(b: Buffer) {
  if (b.length < 30) return null;
  const chunk = b.subarray(12, 16).toString("latin1");
  if (chunk === "VP8 ") return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  if (chunk === "VP8L") {
    const bits = b.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8X") return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
  return null;
}
