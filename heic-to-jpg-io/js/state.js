import { clamp01, createId, toJpgName } from "./utils.js";

export const AppState = {
  globalSettings: { quality: 0.8, exif: true },
  files: [],
  isProcessing: false,
  stats: { success: 0, failed: 0, totalBytes: 0 },
};

export function setGlobalSettings({ quality, exif }) {
  if (typeof quality === "number") AppState.globalSettings.quality = clamp01(quality);
  if (typeof exif === "boolean") AppState.globalSettings.exif = exif;
}

export function addFiles(fileList) {
  const incoming = Array.from(fileList || []);
  const added = [];
  const usedNames = new Set(AppState.files.map((f) => f.outputName).filter(Boolean));
  for (const file of incoming) {
    const id = createId();
    const outputName = makeUniqueOutputName(toJpgName(file.name), usedNames);
    const item = {
      id,
      fileRef: file,
      status: "pending", // pending|processing|done|error
      settingsOverride: null, // { quality, exif } or null
      resultBlob: null,
      objectUrl: null,
      outputName,
      errorMessage: null,
      bytesIn: typeof file.size === "number" ? file.size : 0,
      bytesOut: 0,
    };
    AppState.files.push(item);
    added.push(item);
  }
  return added;
}

function makeUniqueOutputName(baseName, usedNames) {
  const safeBase = baseName || "image.jpg";
  if (!usedNames.has(safeBase)) {
    usedNames.add(safeBase);
    return safeBase;
  }

  const m = safeBase.match(/^(.*?)(\.jpg)$/i);
  const stem = m ? m[1] : safeBase;
  const ext = m ? m[2] : ".jpg";

  let n = 1;
  while (n < 10_000) {
    const candidate = `${stem} (${n})${ext}`;
    if (!usedNames.has(candidate)) {
      usedNames.add(candidate);
      return candidate;
    }
    n += 1;
  }

  // Extremely defensive fallback.
  const candidate = `${stem} (${Date.now()})${ext}`;
  usedNames.add(candidate);
  return candidate;
}

export function getFileById(id) {
  return AppState.files.find((f) => f.id === id) || null;
}

export function updateFile(id, patch) {
  const file = getFileById(id);
  if (!file) return null;
  Object.assign(file, patch);
  return file;
}

export function getNextPendingFile() {
  return AppState.files.find((f) => f.status === "pending") || null;
}

export function computeStats() {
  let success = 0;
  let failed = 0;
  let totalBytes = 0;
  for (const f of AppState.files) {
    if (f.status === "done") {
      success += 1;
      totalBytes += f.bytesOut || 0;
    } else if (f.status === "error") {
      failed += 1;
    }
  }
  AppState.stats = { success, failed, totalBytes };
  return AppState.stats;
}

export function resetAppState() {
  AppState.globalSettings = { quality: 0.8, exif: true };
  AppState.files = [];
  AppState.isProcessing = false;
  AppState.stats = { success: 0, failed: 0, totalBytes: 0 };
}
