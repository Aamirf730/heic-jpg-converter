import { injectExifIntoJpegBlob, safeErrorMessage } from "./utils.js";

// Lazy-initialize libheif only when the first file is processed.
// This keeps initial load and idle CPU minimal (good for TBT/PageSpeed).
let libheifPromise = null;

async function getLibheif() {
  if (libheifPromise) return libheifPromise;

  libheifPromise = (async () => {
    const mod = await import(
      "https://cdn.jsdelivr.net/npm/libheif-js@1.19.8/libheif-wasm/libheif-bundle.mjs"
    );

    // libheif-bundle.mjs exports a *factory function* (Emscripten MODULARIZE build).
    // You must call it to get the actual runtime instance that contains `HeifDecoder`.
    const factory = mod?.default ?? mod;
    if (typeof factory === "function") {
      const baseUrl =
        "https://cdn.jsdelivr.net/npm/libheif-js@1.19.8/libheif-wasm/";
      return await factory({
        // Keep production console clean; errors are surfaced in the UI.
        print: () => {},
        printErr: () => {},
        // Defensive: if the build ever falls back to fetching `libheif.wasm`, resolve it correctly.
        locateFile: (path) => new URL(path, baseUrl).toString(),
      });
    }
    return factory;
  })();

  return libheifPromise;
}

self.onmessage = async (e) => {
  const msg = e.data;
  if (!msg || msg.type !== "process") return;

  const { id, file, settings } = msg;
  try {
    const q = typeof settings?.quality === "number" ? settings.quality : 0.8;
    const quality = Math.max(0, Math.min(1, q));
    const keepExif = Boolean(settings?.exif);

    const heicBuffer = await file.arrayBuffer();

    // Best-effort EXIF extraction. If this fails, we still convert the pixels.
    const exifPayload = keepExif ? tryExtractHeicExifPayload(heicBuffer) : null;

    const { width, height, rgba } = await decodeHeicToRgba(heicBuffer);

    const canEncodeHere =
      typeof OffscreenCanvas !== "undefined" &&
      typeof OffscreenCanvas.prototype?.convertToBlob === "function" &&
      typeof ImageData !== "undefined";

    if (!canEncodeHere) {
      // Fallback: send RGBA to main thread for encoding.
      // Transfer the ArrayBuffer to avoid copying large pixel data.
      self.postMessage(
        { type: "result", id, ok: true, rgba: rgba.buffer, width, height, exifPayload },
        [rgba.buffer]
      );
      return;
    }

    let jpegBlob = await encodeRgbaToJpegInWorker({ rgba, width, height, quality });

    if (keepExif && exifPayload) {
      jpegBlob = await injectExifIntoJpegBlob(jpegBlob, exifPayload);
    }

    self.postMessage({ type: "result", id, ok: true, blob: jpegBlob });
  } catch (err) {
    self.postMessage({ type: "result", id, ok: false, error: safeErrorMessage(err) });
  }
};

async function decodeHeicToRgba(heicBuffer) {
  const libheif = await getLibheif();
  const api = libheif?.HeifDecoder ? libheif : libheif?.default ?? libheif;
  const Decoder = api?.HeifDecoder;
  if (typeof Decoder !== "function") {
    throw new Error("libheif runtime missing HeifDecoder.");
  }

  const decoder = new Decoder();
  const bytes = new Uint8Array(heicBuffer);

  const images = decoder.decode(bytes);
  if (!images || !images.length) throw new Error("No images found in HEIC.");

  // HEIC can store multiple images (bursts/live). For this tool we convert the primary image only.
  const image = images[0];
  const width = image.get_width();
  const height = image.get_height();
  const rgba = new Uint8ClampedArray(width * height * 4);

  const displayData = await new Promise((resolve, reject) => {
    image.display({ data: rgba, width, height }, (data) => {
      if (!data) reject(new Error("HEIC decode failed."));
      else resolve(data);
    });
  });

  // Some builds return the same object, some return a wrapper. Normalize to our buffer.
  const out = displayData?.data && displayData.data instanceof Uint8ClampedArray ? displayData.data : rgba;

  // Best-effort cleanup to reduce WASM memory growth across many files.
  try {
    for (const img of images) img?.free?.();
  } catch {
    // Ignore.
  }

  try {
    decoder?.free?.();
  } catch {
    // Ignore.
  }

  return { width, height, rgba: out };
}

async function encodeRgbaToJpegInWorker({ rgba, width, height, quality }) {
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d", { willReadFrequently: false });
  if (!ctx) throw new Error("OffscreenCanvas 2D context not available.");

  // ImageData is available in modern workers; required for putImageData.
  const imageData = new ImageData(rgba, width, height);
  ctx.putImageData(imageData, 0, 0);

  return canvas.convertToBlob({ type: "image/jpeg", quality });
}

function tryExtractHeicExifPayload(arrayBuffer) {
  try {
    const itemBytes = extractHeicMetaItemBytes(arrayBuffer, "Exif");
    if (!itemBytes) return null;
    return normalizeHeifExifItemToJpegPayload(itemBytes);
  } catch {
    return null;
  }
}

function normalizeHeifExifItemToJpegPayload(itemBytes) {
  // HEIF stores Exif in an item which may:
  // - include "Exif\0\0" already
  // - include a 4-byte offset to the TIFF header
  // - include just the TIFF header
  const bytes = itemBytes instanceof Uint8Array ? itemBytes : new Uint8Array(itemBytes);
  if (bytes.length < 12) return null;

  const exifId = new Uint8Array([0x45, 0x78, 0x69, 0x66, 0x00, 0x00]); // "Exif\0\0"
  const sigAt = findSubarray(bytes, exifId, 0, Math.min(bytes.length, 128));
  if (sigAt !== -1) {
    return bytes.slice(sigAt);
  }

  // If it starts with TIFF ("II*\0" or "MM\0*"), wrap it.
  if (looksLikeTiff(bytes, 0)) {
    const payload = new Uint8Array(6 + bytes.length);
    payload.set(exifId, 0);
    payload.set(bytes, 6);
    return payload;
  }

  // HEIF Exif item commonly begins with a 4-byte offset to the TIFF header.
  const offset = readU32BE(bytes, 0);
  const tiffStart = 4 + offset;
  if (tiffStart >= 0 && tiffStart + 4 <= bytes.length && looksLikeTiff(bytes, tiffStart)) {
    const tiff = bytes.slice(tiffStart);
    const payload = new Uint8Array(6 + tiff.length);
    payload.set(exifId, 0);
    payload.set(tiff, 6);
    return payload;
  }

  return null;
}

function extractHeicMetaItemBytes(arrayBuffer, wantedItemType) {
  const view = new DataView(arrayBuffer);
  const totalLen = view.byteLength;

  // Locate the first 'meta' box. HEIC files are ISO-BMFF and typically have top-level meta.
  const meta = findBox(view, 0, totalLen, "meta");
  if (!meta) return null;

  const metaContentStart = meta.start + meta.headerSize;
  if (metaContentStart + 4 > meta.end) return null;

  // meta is a FullBox, so skip version/flags (4 bytes).
  let p = metaContentStart + 4;

  let iinf = null;
  let iloc = null;
  let idat = null;

  while (p + 8 <= meta.end) {
    const b = readBox(view, p, meta.end);
    if (!b) break;
    if (b.type === "iinf") iinf = b;
    else if (b.type === "iloc") iloc = b;
    else if (b.type === "idat") idat = b;
    p = b.end;
  }

  if (!iinf || !iloc) return null;

  const wantedItemId = findItemIdByType(view, iinf, wantedItemType);
  if (wantedItemId == null) return null;

  const idatDataStart = idat ? idat.start + idat.headerSize : null;
  return readItemBytesFromIloc(view, iloc, wantedItemId, idatDataStart);
}

function findItemIdByType(view, iinfBox, wantedItemType) {
  const start = iinfBox.start + iinfBox.headerSize;
  const end = iinfBox.end;
  if (start + 6 > end) return null;

  const version = view.getUint8(start);
  let p = start + 4; // version/flags

  let entryCount = 0;
  if (version === 0) {
    entryCount = view.getUint16(p);
    p += 2;
  } else {
    entryCount = view.getUint32(p);
    p += 4;
  }

  // iinf is a container of 'infe' boxes.
  for (let i = 0; i < entryCount && p + 8 <= end; i += 1) {
    const infe = readBox(view, p, end);
    if (!infe) break;
    p = infe.end;
    if (infe.type !== "infe") continue;

    const item = parseInfe(view, infe);
    if (item && item.type === wantedItemType) return item.id;
  }

  return null;
}

function parseInfe(view, infeBox) {
  const start = infeBox.start + infeBox.headerSize;
  const end = infeBox.end;
  if (start + 12 > end) return null;

  const version = view.getUint8(start);
  let p = start + 4; // version/flags

  let itemId = null;
  if (version === 2) {
    itemId = view.getUint16(p);
    p += 2;
  } else if (version === 3) {
    itemId = view.getUint32(p);
    p += 4;
  } else {
    return null;
  }

  // item_protection_index
  p += 2;
  if (p + 4 > end) return null;

  const type = readType(view, p);
  return { id: itemId, type };
}

function readItemBytesFromIloc(view, ilocBox, wantedItemId, idatDataStart) {
  const start = ilocBox.start + ilocBox.headerSize;
  const end = ilocBox.end;
  if (start + 10 > end) return null;

  const version = view.getUint8(start);
  let p = start + 4; // version/flags

  const a = view.getUint8(p++);
  const b = view.getUint8(p++);
  const offsetSize = a >> 4;
  const lengthSize = a & 0x0f;
  const baseOffsetSize = b >> 4;
  const indexSize = b & 0x0f;

  let itemCount = 0;
  if (version < 2) {
    itemCount = view.getUint16(p);
    p += 2;
  } else {
    itemCount = view.getUint32(p);
    p += 4;
  }

  for (let i = 0; i < itemCount && p < end; i += 1) {
    const itemId = version < 2 ? view.getUint16(p) : view.getUint32(p);
    p += version < 2 ? 2 : 4;

    let constructionMethod = 0;
    if (version === 1 || version === 2) {
      const tmp = view.getUint16(p);
      p += 2;
      constructionMethod = tmp & 0x0fff;
    }

    // data_reference_index
    p += 2;

    const baseOffset = readUIntSized(view, p, baseOffsetSize);
    p += baseOffsetSize;

    const extentCount = view.getUint16(p);
    p += 2;

    const extents = [];
    for (let j = 0; j < extentCount; j += 1) {
      if ((version === 1 || version === 2) && indexSize > 0) {
        p += indexSize; // extent_index (unused)
      }
      const extentOffset = readUIntSized(view, p, offsetSize);
      p += offsetSize;
      const extentLength = readUIntSized(view, p, lengthSize);
      p += lengthSize;
      extents.push({ extentOffset, extentLength });
    }

    if (itemId !== wantedItemId) continue;

    const chunks = [];
    let total = 0;

    for (const ex of extents) {
      const base = constructionMethod === 1 && typeof idatDataStart === "number" ? idatDataStart : baseOffset;
      const absOffset = base + ex.extentOffset;
      const absEnd = absOffset + ex.extentLength;
      if (!Number.isFinite(absOffset) || !Number.isFinite(absEnd)) return null;
      if (absOffset < 0 || absEnd > view.byteLength) return null;
      const slice = new Uint8Array(view.buffer, absOffset, ex.extentLength);
      const copy = new Uint8Array(slice); // copy out of the original buffer
      chunks.push(copy);
      total += copy.length;
    }

    const out = new Uint8Array(total);
    let o = 0;
    for (const c of chunks) {
      out.set(c, o);
      o += c.length;
    }
    return out;
  }

  return null;
}

function readUIntSized(view, offset, sizeBytes) {
  if (!sizeBytes) return 0;
  if (sizeBytes === 1) return view.getUint8(offset);
  if (sizeBytes === 2) return view.getUint16(offset);
  if (sizeBytes === 4) return view.getUint32(offset);
  if (sizeBytes === 8) {
    const hi = BigInt(view.getUint32(offset));
    const lo = BigInt(view.getUint32(offset + 4));
    const v = (hi << 32n) | lo;
    const n = Number(v);
    if (!Number.isSafeInteger(n)) throw new Error("Offset exceeds JS safe integer range.");
    return n;
  }

  // Generic slow path for unusual sizes (3,5,6,7). Rare in practice.
  let n = 0;
  for (let i = 0; i < sizeBytes; i += 1) n = (n << 8) | view.getUint8(offset + i);
  return n;
}

function readType(view, offset) {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3)
  );
}

function readBox(view, offset, limit) {
  if (offset + 8 > limit) return null;
  let size = view.getUint32(offset);
  const type = readType(view, offset + 4);
  let headerSize = 8;

  if (size === 1) {
    if (offset + 16 > limit) return null;
    const hi = BigInt(view.getUint32(offset + 8));
    const lo = BigInt(view.getUint32(offset + 12));
    const bigSize = (hi << 32n) | lo;
    size = Number(bigSize);
    headerSize = 16;
  } else if (size === 0) {
    size = limit - offset;
  }

  const end = offset + size;
  if (size < headerSize || end > limit) return null;
  return { type, start: offset, end, headerSize };
}

function findBox(view, start, end, wantedType) {
  let p = start;
  while (p + 8 <= end) {
    const b = readBox(view, p, end);
    if (!b) break;
    if (b.type === wantedType) return b;
    p = b.end;
  }
  return null;
}

function looksLikeTiff(bytes, offset) {
  if (offset + 4 > bytes.length) return false;
  const a = bytes[offset];
  const b = bytes[offset + 1];
  const c = bytes[offset + 2];
  const d = bytes[offset + 3];
  const little = a === 0x49 && b === 0x49 && c === 0x2a && d === 0x00;
  const big = a === 0x4d && b === 0x4d && c === 0x00 && d === 0x2a;
  return little || big;
}

function readU32BE(bytes, offset) {
  return (
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]
  ) >>> 0;
}

function findSubarray(haystack, needle, start, end) {
  const h = haystack;
  const n = needle;
  const max = Math.min(end ?? h.length, h.length) - n.length;
  let from = start ?? 0;
  if (from < 0) from = 0;
  for (let i = from; i <= max; i += 1) {
    let ok = true;
    for (let j = 0; j < n.length; j += 1) {
      if (h[i + j] !== n[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return i;
  }
  return -1;
}
