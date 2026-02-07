import {
  AppState,
  addFiles,
  computeStats,
  getFileById,
  getNextPendingFile,
  resetAppState,
  setGlobalSettings,
  updateFile,
} from "./state.js";
import {
  Dom,
  clearResults,
  initStaticUI,
  lockResultsMinHeight,
  renderSkeletonCards,
  setCardSettingsOpen,
  setCardSettingsValues,
  setCardStatus,
  setDropzoneDragOver,
  setDropzoneHidden,
  showActionBar,
  unlockResultsMinHeight,
  updateActionBar,
  updateGlobalQualityOutput,
} from "./ui-renderer.js";
import { t } from "./i18n.js";
import { injectExifIntoJpegBlob, isHeicLike, safeErrorMessage } from "./utils.js";

let worker = null;
let runtimePromise = null;

let vendorsPromise = null;
let JSZipCtor = null;
let saveAsFn = null;
let zip = null;

const inflight = new Map(); // fileId -> { resolve, reject }
let activeBatchId = 0;

initStaticUI();

// Ensure the global settings UI reflects defaults.
updateGlobalQualityOutput(Math.round(AppState.globalSettings.quality * 100));

Dom.quality?.addEventListener("input", (e) => {
  const raw = Number(e.target.value);
  updateGlobalQualityOutput(raw);
  setGlobalSettings({ quality: raw / 100 });
});

Dom.keepExif?.addEventListener("change", (e) => {
  setGlobalSettings({ exif: Boolean(e.target.checked) });
});

// Drag & drop.
Dom.dropzone?.addEventListener("dragover", (e) => {
  e.preventDefault();
  setDropzoneDragOver(true);
});
Dom.dropzone?.addEventListener("dragleave", () => setDropzoneDragOver(false));
Dom.dropzone?.addEventListener("drop", (e) => {
  e.preventDefault();
  setDropzoneDragOver(false);
  const dt = e.dataTransfer;
  if (!dt?.files?.length) return;
  handleFiles(dt.files);
});

// Keyboard accessibility for the dropzone (file input is visually hidden).
Dom.dropzone?.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  e.preventDefault();
  Dom.fileInput?.click();
});

Dom.fileInput?.addEventListener("change", (e) => {
  const files = e.target.files;
  if (!files?.length) return;
  handleFiles(files);
  // Allow selecting the same file again after reset.
  e.target.value = "";
});

Dom.resetBtn?.addEventListener("click", () => resetAll());
Dom.downloadAllBtn?.addEventListener("click", () => downloadAllZip());

Dom.resultsGrid?.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const card = btn.closest(".card");
  const id = card?.dataset?.id;
  if (!id) return;

  if (btn.classList.contains("settings-btn")) {
    const file = getFileById(id);
    if (!file) return;
    const effective = file.settingsOverride || AppState.globalSettings;
    setCardSettingsValues(id, effective);
    setCardSettingsOpen(id, true);
    return;
  }

  if (btn.classList.contains("settings-close")) {
    setCardSettingsOpen(id, false);
    return;
  }

  if (btn.classList.contains("download-btn")) {
    const file = getFileById(id);
    if (!file?.resultBlob) return;
    triggerDownload(file.resultBlob, file.outputName);
    return;
  }

  if (btn.classList.contains("apply-override")) {
    applyPerFileOverride(id);
    return;
  }

  if (btn.classList.contains("clear-override")) {
    clearPerFileOverride(id);
    setCardSettingsOpen(id, false);
  }
});

Dom.resultsGrid?.addEventListener("input", (e) => {
  // Live-update per-card quality output (no layout shifts).
  const target = e.target;
  if (!target?.classList?.contains("mini-quality")) return;
  const card = target.closest(".card");
  if (!card) return;
  const out = card.querySelector(".mini-quality-out");
  if (out) out.textContent = String(target.value);
});

window.addEventListener("beforeunload", () => {
  cleanupObjectUrls();
  // Worker/WASM memory can be sizable; terminate aggressively on unload.
  if (worker) worker.terminate();
});

async function handleFiles(fileList) {
  const all = Array.from(fileList || []);
  const heicFiles = all.filter((f) => isHeicLike(f));
  const skipped = all.length - heicFiles.length;

  if (!heicFiles.length) {
    updateActionBar({
      statusText: t("noHeicDetected"),
      statsText: "",
      downloadAllEnabled: false,
    });
    return;
  }

  // Phase 1: render skeletons immediately (CLS-safe).
  const added = addFiles(heicFiles);
  renderSkeletonCards(added, AppState.globalSettings);
  showActionBar(true);
  setDropzoneHidden(true);
  lockResultsMinHeight();

  updateActionBar({
    statusText: t("queued", { count: heicFiles.length, skipped }),
    statsText: "",
    downloadAllEnabled: false,
  });

  // Phase 2: lazy-load heavy dependencies only after user interaction.
  try {
    await ensureRuntime();
  } catch (err) {
    // Still allow reset. Individual downloads won't work without FileSaver.
    updateActionBar({
      statusText: t("runtimeFailed"),
      statsText: safeErrorMessage(err),
      downloadAllEnabled: false,
    });
    return;
  }

  // Phase 3: sequential processing loop.
  void processQueue();
}

async function ensureRuntime() {
  if (runtimePromise) return runtimePromise;

  runtimePromise = (async () => {
    ensureWorker();
    await ensureVendors();
  })();

  return runtimePromise;
}

function ensureWorker() {
  if (worker) return;

  worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
  worker.onmessage = (e) => {
    const msg = e.data;
    if (!msg || msg.type !== "result" || !msg.id) return;

    const p = inflight.get(msg.id);
    if (!p) return;
    inflight.delete(msg.id);

    if (msg.ok) p.resolve(msg);
    else p.reject(new Error(msg.error || "Worker error"));
  };

  worker.onerror = (e) => {
    // Best-effort error surface. No console spam; show it in the action bar.
    updateActionBar({
      statusText: t("workerCrashed"),
      statsText: e?.message || "Unknown worker error.",
      downloadAllEnabled: false,
    });
  };
}

async function ensureVendors() {
  if (vendorsPromise) return vendorsPromise;

  vendorsPromise = (async () => {
    // Lazy-load only after first user interaction. Keep versions pinned for deterministic behavior.
    const [jszipMod, fileSaverMod] = await Promise.all([
      import("https://esm.sh/jszip@3.10.1"),
      import("https://esm.sh/file-saver@2.0.5"),
    ]);

    JSZipCtor = jszipMod?.default || jszipMod?.JSZip || jszipMod;
    saveAsFn = fileSaverMod?.saveAs || fileSaverMod?.default?.saveAs || fileSaverMod?.default;

    if (!JSZipCtor) throw new Error("JSZip failed to load.");
    if (typeof saveAsFn !== "function") throw new Error("FileSaver failed to load.");

    zip = new JSZipCtor();
  })();

  return vendorsPromise;
}

async function processQueue() {
  if (AppState.isProcessing) return;
  if (!worker) return;

  const batchId = ++activeBatchId;
  AppState.isProcessing = true;

  try {
    while (batchId === activeBatchId) {
      const next = getNextPendingFile();
      if (!next) break;

      updateFile(next.id, { status: "processing", errorMessage: null });
      setCardStatus(next.id, { status: "processing", bytesIn: next.bytesIn });

      const processedCount = AppState.files.filter((f) => f.status === "done" || f.status === "error").length;
      updateActionBar({
        statusText: t("processingStatus", {
          current: processedCount + 1,
          total: AppState.files.length,
        }),
        statsText: "",
        downloadAllEnabled: false,
      });

      const effective = next.settingsOverride || AppState.globalSettings;

      try {
        const result = await processInWorker(next.id, next.fileRef, effective);

        let blob = null;
        if (result.blob instanceof Blob) {
          blob = result.blob;
        } else if (result.rgba && result.width && result.height) {
          blob = await encodeRgbaToJpeg({
            rgba: result.rgba,
            width: result.width,
            height: result.height,
            quality: effective.quality,
          });
        }

        if (!blob) throw new Error("No output produced.");

        // Best-effort EXIF retention.
        if (effective.exif && result.exifPayload) {
          blob = await injectExifIntoJpegBlob(blob, result.exifPayload);
        }

        // ObjectURL lifecycle is critical on mobile: revoke before replacing.
        const prevUrl = next.objectUrl;
        if (prevUrl) URL.revokeObjectURL(prevUrl);

        const objectUrl = URL.createObjectURL(blob);
        updateFile(next.id, {
          status: "done",
          resultBlob: blob,
          objectUrl,
          bytesOut: blob.size,
          errorMessage: null,
        });

        // Store in zip (no generation yet; generation happens on user click).
        if (zip) zip.file(next.outputName, blob, { binary: true });

        setCardStatus(next.id, {
          status: "done",
          previewUrl: objectUrl,
          bytesIn: next.bytesIn,
          bytesOut: blob.size,
        });
      } catch (err) {
        updateFile(next.id, { status: "error", errorMessage: safeErrorMessage(err) });
        setCardStatus(next.id, { status: "error", errorMessage: safeErrorMessage(err), bytesIn: next.bytesIn });
      }

      // Yield between files to keep interactions snappy and avoid long tasks.
      await nextFrame();
    }
  } finally {
    AppState.isProcessing = false;
    computeStats();

    const { success, failed, totalBytes } = AppState.stats;
    const doneText =
      success || failed ? t("doneStatus", { success, failed }) : t("ready");
    const sizeText = success ? t("totalOutput", { size: formatZipSizeHint(totalBytes) }) : "";

    updateActionBar({
      statusText: doneText,
      statsText: sizeText,
      downloadAllEnabled: success > 0,
    });

    unlockResultsMinHeight();
  }
}

function processInWorker(id, fileRef, settings) {
  if (!worker) return Promise.reject(new Error("Worker not ready."));
  return new Promise((resolve, reject) => {
    inflight.set(id, { resolve, reject });
    worker.postMessage({
      type: "process",
      id,
      file: fileRef,
      settings: { quality: settings.quality, exif: settings.exif },
    });
  });
}

async function applyPerFileOverride(id) {
  const card = Dom.resultsGrid?.querySelector(`.card[data-id="${id}"]`);
  const file = getFileById(id);
  if (!card || !file) return;

  const q = card.querySelector(".mini-quality");
  const exif = card.querySelector(".mini-exif");
  const qRaw = Number(q?.value || "80");
  const quality = Math.max(0, Math.min(1, qRaw / 100));
  const keepExif = Boolean(exif?.checked);

  updateFile(id, { settingsOverride: { quality, exif: keepExif } });
  setCardSettingsOpen(id, false);

  // If already processed, re-queue this file with the new override.
  if (file.status === "done" || file.status === "error") {
    if (file.objectUrl) URL.revokeObjectURL(file.objectUrl);
    updateFile(id, {
      status: "pending",
      resultBlob: null,
      objectUrl: null,
      bytesOut: 0,
      errorMessage: null,
    });
    if (zip) zip.remove(file.outputName);
    setCardStatus(id, { status: "pending", bytesIn: file.bytesIn });
    lockResultsMinHeight();
    void processQueue();
  }
}

function clearPerFileOverride(id) {
  const file = getFileById(id);
  if (!file) return;
  updateFile(id, { settingsOverride: null });
}

async function downloadAllZip() {
  if (!zip || !saveAsFn) return;

  // If processing is still happening, ignore; the button is normally disabled anyway.
  if (AppState.isProcessing) return;

  const { success } = AppState.stats;
  if (!success) return;

  Dom.downloadAllBtn.disabled = true;
  updateActionBar({
    statusText: t("preparingZip"),
    statsText: "",
    downloadAllEnabled: false,
  });

  try {
    const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
    saveAsFn(blob, "heic-to-jpg.zip");
  } catch (err) {
    updateActionBar({
      statusText: t("zipFailed"),
      statsText: safeErrorMessage(err),
      downloadAllEnabled: true,
    });
    Dom.downloadAllBtn.disabled = false;
    return;
  }

  Dom.downloadAllBtn.disabled = false;
  computeStats();
  updateActionBar({
    statusText: t("doneStatus", { success: AppState.stats.success, failed: AppState.stats.failed }),
    statsText: AppState.stats.success ? t("totalOutput", { size: formatZipSizeHint(AppState.stats.totalBytes) }) : "",
    downloadAllEnabled: AppState.stats.success > 0,
  });
}

function triggerDownload(blob, filename) {
  if (typeof saveAsFn === "function") {
    saveAsFn(blob, filename);
    return;
  }

  // Fallback: anchor download. Some browsers (notably iOS) may ignore this.
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "download.jpg";
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function encodeRgbaToJpeg({ rgba, width, height, quality }) {
  // Fallback path when OffscreenCanvas JPEG encoding isn't available in the worker.
  // Keep this path async to reduce TBT risk.
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: false });
  if (!ctx) throw new Error("Canvas not available.");

  const u8 = rgba instanceof Uint8ClampedArray ? rgba : new Uint8ClampedArray(rgba);
  const imageData = new ImageData(u8, width, height);
  ctx.putImageData(imageData, 0, 0);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("JPEG encoding failed."));
      },
      "image/jpeg",
      quality
    );
  });

  return blob;
}

function cleanupObjectUrls() {
  for (const f of AppState.files) {
    if (f.objectUrl) URL.revokeObjectURL(f.objectUrl);
  }
}

function resetAll() {
  // Cancel any in-flight batch + worker work.
  activeBatchId += 1;
  for (const [id, p] of inflight.entries()) {
    p.reject(new Error("Reset"));
    inflight.delete(id);
  }

  if (worker) {
    worker.terminate();
    worker = null;
    runtimePromise = null;
  }

  cleanupObjectUrls();
  clearResults();
  resetAppState();

  // Reset settings UI to defaults.
  if (Dom.quality) Dom.quality.value = "80";
  if (Dom.keepExif) Dom.keepExif.checked = true;
  updateGlobalQualityOutput(80);

  // Fresh ZIP container, but keep vendor modules cached.
  if (JSZipCtor) zip = new JSZipCtor();

  setDropzoneHidden(false);
  showActionBar(false);
}

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function formatZipSizeHint(totalBytes) {
  // Small helper to avoid pulling UI renderer into state logic.
  const units = ["B", "KB", "MB", "GB"];
  let n = totalBytes || 0;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  const dp = i === 0 ? 0 : i === 1 ? 0 : 1;
  return `${n.toFixed(dp)} ${units[i]}`;
}
