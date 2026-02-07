export function createId() {
  // crypto.randomUUID() is fast, collision-safe, and available in modern browsers.
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();

  // Fallback: time + random. Good enough for UI identifiers.
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  const dp = i === 0 ? 0 : i === 1 ? 0 : 1;
  return `${n.toFixed(dp)} ${units[i]}`;
}

export function sanitizeFileName(name) {
  const fallback = "image";
  if (!name || typeof name !== "string") return fallback;

  // Avoid path traversal and weird Unicode separators.
  const cleaned = name.replace(/[\\/\u0000]/g, "_").trim();
  return cleaned || fallback;
}

export function toJpgName(originalName) {
  const safe = sanitizeFileName(originalName);
  const withoutExt = safe.replace(/\.(heic|heif)$/i, "");
  return `${withoutExt || "image"}.jpg`;
}

export function isHeicLike(file) {
  if (!file) return false;
  const name = typeof file.name === "string" ? file.name : "";
  const type = typeof file.type === "string" ? file.type : "";
  if (/\.(heic|heif)$/i.test(name)) return true;
  if (type === "image/heic" || type === "image/heif") return true;
  // Some browsers report HEIC as generic; extension-based allow-list still catches most cases.
  return false;
}

export function safeErrorMessage(err) {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
}

export async function injectExifIntoJpegBlob(jpegBlob, exifPayload) {
  // Best-effort EXIF retention.
  // Canvas / OffscreenCanvas encoders typically drop metadata, so we re-inject the APP1/Exif segment
  // when we can extract it from HEIC. If anything looks off, we return the original JPEG.
  if (!jpegBlob || !exifPayload || exifPayload.length < 8) return jpegBlob;

  const jpgBytes = new Uint8Array(await jpegBlob.arrayBuffer());
  if (jpgBytes.length < 4 || jpgBytes[0] !== 0xff || jpgBytes[1] !== 0xd8) return jpegBlob;

  const exifId = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00]; // "Exif\0\0"
  const hasExifId =
    exifPayload[0] === exifId[0] &&
    exifPayload[1] === exifId[1] &&
    exifPayload[2] === exifId[2] &&
    exifPayload[3] === exifId[3] &&
    exifPayload[4] === exifId[4] &&
    exifPayload[5] === exifId[5];
  if (!hasExifId) return jpegBlob;

  // If the JPEG already has an Exif APP1 segment, avoid duplicating it.
  // Walk segments until SOS (0xFFDA).
  let p = 2;
  while (p + 4 < jpgBytes.length && jpgBytes[p] === 0xff) {
    const marker = jpgBytes[p + 1];
    if (marker === 0xda /* SOS */ || marker === 0xd9 /* EOI */) break;

    const len = (jpgBytes[p + 2] << 8) | jpgBytes[p + 3];
    if (len < 2) break;

    if (marker === 0xe1 /* APP1 */) {
      const payloadStart = p + 4;
      const payloadEnd = p + 2 + len;
      if (payloadEnd <= jpgBytes.length) {
        const a = jpgBytes[payloadStart];
        const b = jpgBytes[payloadStart + 1];
        const c = jpgBytes[payloadStart + 2];
        const d = jpgBytes[payloadStart + 3];
        const e = jpgBytes[payloadStart + 4];
        const f = jpgBytes[payloadStart + 5];
        const isExif =
          a === exifId[0] &&
          b === exifId[1] &&
          c === exifId[2] &&
          d === exifId[3] &&
          e === exifId[4] &&
          f === exifId[5];
        if (isExif) return jpegBlob;
      }
    }

    p += 2 + len;
  }

  // Prefer inserting after any initial APP0/JFIF segments.
  let insertAt = 2;
  p = 2;
  while (p + 4 < jpgBytes.length && jpgBytes[p] === 0xff) {
    const marker = jpgBytes[p + 1];
    if (marker === 0xda /* SOS */ || marker === 0xd9 /* EOI */) break;
    const len = (jpgBytes[p + 2] << 8) | jpgBytes[p + 3];
    if (len < 2) break;
    if (marker === 0xe0 /* APP0 */) {
      insertAt = p + 2 + len;
      p = insertAt;
      continue;
    }
    break;
  }

  const segmentLen = exifPayload.length + 2; // includes these two bytes
  if (segmentLen > 0xffff) return jpegBlob;

  const app1 = new Uint8Array(4 + exifPayload.length);
  app1[0] = 0xff;
  app1[1] = 0xe1;
  app1[2] = (segmentLen >> 8) & 0xff;
  app1[3] = segmentLen & 0xff;
  app1.set(exifPayload, 4);

  const out = new Uint8Array(jpgBytes.length + app1.length);
  out.set(jpgBytes.subarray(0, insertAt), 0);
  out.set(app1, insertAt);
  out.set(jpgBytes.subarray(insertAt), insertAt + app1.length);
  return new Blob([out], { type: "image/jpeg" });
}

