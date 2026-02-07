import { formatBytes } from "./utils.js";

export const Dom = {
  dropzone: document.getElementById("dropzone"),
  fileInput: document.getElementById("fileInput"),
  resultsGrid: document.getElementById("resultsGrid"),
  actionBar: document.getElementById("actionBar"),
  statusText: document.getElementById("statusText"),
  statsText: document.getElementById("statsText"),
  downloadAllBtn: document.getElementById("downloadAllBtn"),
  resetBtn: document.getElementById("resetBtn"),
  quality: document.getElementById("quality"),
  qualityOut: document.getElementById("qualityOut"),
  keepExif: document.getElementById("keepExif"),
  year: document.getElementById("year"),
};

const Icons = {
  gear: `
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.23 7.23 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 1h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.58.23-1.12.54-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 7.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.83 14.52a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.4.31.6.22l2.39-.96c.5.4 1.05.72 1.63.94l.36 2.54c.04.24.25.42.49.42h3.8c.24 0 .45-.18.49-.42l.36-2.54c.58-.23 1.12-.54 1.63-.94l2.39.96c.23.09.49 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5z"/>
    </svg>
  `,
  close: `
    <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.3 5.7a1 1 0 0 0-1.4 0L12 10.6 7.1 5.7A1 1 0 0 0 5.7 7.1l4.9 4.9-4.9 4.9a1 1 0 1 0 1.4 1.4l4.9-4.9 4.9 4.9a1 1 0 0 0 1.4-1.4L13.4 12l4.9-4.9a1 1 0 0 0 0-1.4z"/>
    </svg>
  `,
};

// i18n is intentionally lightweight: we only translate UI text that is created dynamically.
import { t } from "./i18n.js";

let rafId = 0;
const patchQueue = [];

function queueDomPatch(patch) {
  patchQueue.push(patch);
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    rafId = 0;
    while (patchQueue.length) patchQueue.shift()();
  });
}

export function initStaticUI() {
  if (Dom.year) Dom.year.textContent = String(new Date().getFullYear());
}

export function setDropzoneHidden(hidden) {
  queueDomPatch(() => {
    Dom.dropzone?.classList.toggle("is-hidden", Boolean(hidden));
  });
}

export function setDropzoneDragOver(active) {
  queueDomPatch(() => {
    Dom.dropzone?.classList.toggle("is-dragover", Boolean(active));
  });
}

export function showActionBar(show) {
  queueDomPatch(() => {
    if (!Dom.actionBar) return;
    Dom.actionBar.hidden = !show;
    document.body.classList.toggle("has-action-bar", show);
  });
}

export function updateGlobalQualityOutput(value) {
  queueDomPatch(() => {
    if (Dom.qualityOut) Dom.qualityOut.textContent = String(value);
  });
}

export function clearResults() {
  queueDomPatch(() => {
    if (Dom.resultsGrid) Dom.resultsGrid.innerHTML = "";
    if (Dom.resultsGrid) Dom.resultsGrid.style.minHeight = "";
  });
}

export function lockResultsMinHeight() {
  // Stabilize layout once the skeletons are in. This is mainly defensive: user-triggered changes are
  // excluded from CLS scoring, but a locked container keeps the page feeling "solid".
  queueDomPatch(() => {
    if (!Dom.resultsGrid) return;
    const h = Dom.resultsGrid.getBoundingClientRect().height;
    if (h > 0) Dom.resultsGrid.style.minHeight = `${Math.ceil(h)}px`;
  });
}

export function unlockResultsMinHeight() {
  queueDomPatch(() => {
    if (Dom.resultsGrid) Dom.resultsGrid.style.minHeight = "";
  });
}

export function renderSkeletonCards(fileItems, globalSettings) {
  if (!Dom.resultsGrid) return;

  const frag = document.createDocumentFragment();
  for (const item of fileItems) {
    frag.appendChild(createCard(item, globalSettings));
  }

  queueDomPatch(() => {
    Dom.resultsGrid.appendChild(frag);
  });
}

function createCard(item, globalSettings) {
  const card = document.createElement("article");
  card.className = "card card--pending";
  card.dataset.id = item.id;

  card.innerHTML = `
    <div class="card-top">
      <div class="file-name" title="${escapeHtml(item.fileRef?.name || "file")}">${escapeHtml(
        item.fileRef?.name || "file"
      )}</div>
      <button class="icon-btn settings-btn" type="button" aria-label="${escapeAttribute(t("fileSettings"))}">
        ${Icons.gear}
      </button>
    </div>

    <div class="card-media">
      <img class="spinner" src="/assets/spinner.svg" alt="" width="38" height="38" />
    </div>

    <div class="card-meta">
      <span class="badge badge-wait">${escapeHtml(t("pendingBadge"))}</span>
      <span class="size-text">${formatBytes(item.bytesIn || 0)}</span>
    </div>

    <div class="card-actions">
      <button class="btn btn-primary download-btn" type="button" disabled>${escapeHtml(
        t("download")
      )}</button>
    </div>

    <div class="card-settings" hidden>
      <div class="card-settings-title">
        <span>${escapeHtml(t("perFileSettings"))}</span>
        <button class="icon-btn settings-close" type="button" aria-label="${escapeAttribute(
          t("closeSettings")
        )}">
          ${Icons.close}
        </button>
      </div>

      <div class="mini">
        <label class="field">
          <span class="field-label">${escapeHtml(t("jpgQuality"))}</span>
          <span class="field-row">
            <input class="mini-quality" type="range" min="1" max="100" step="1" value="${Math.round(
              (globalSettings?.quality ?? 0.8) * 100
            )}" />
            <output class="mini-quality-out field-output">${
              Math.round((globalSettings?.quality ?? 0.8) * 100)
            }</output>
          </span>
        </label>

        <label class="check">
          <input class="mini-exif" type="checkbox" ${globalSettings?.exif ? "checked" : ""} />
          <span>${escapeHtml(t("keepExif"))}</span>
        </label>

        <div class="field-hint">${escapeHtml(t("overrideHint"))}</div>
      </div>

      <div class="card-actions">
        <button class="btn btn-primary apply-override" type="button">${escapeHtml(
          t("apply")
        )}</button>
        <button class="btn btn-ghost clear-override" type="button">${escapeHtml(t("clear"))}</button>
      </div>
    </div>
  `;

  return card;
}

export function setCardStatus(id, patch) {
  const card = Dom.resultsGrid?.querySelector(`.card[data-id="${cssEscape(id)}"]`);
  if (!card) return;

  queueDomPatch(() => {
    if (patch.status) {
      card.classList.remove("card--pending", "card--processing", "card--done", "card--error");
      card.classList.add(`card--${patch.status}`);
    }

    const badge = card.querySelector(".badge");
    const sizeText = card.querySelector(".size-text");
    const media = card.querySelector(".card-media");
    const downloadBtn = card.querySelector(".download-btn");

    if (badge && patch.status) {
      if (patch.status === "pending") {
        badge.className = "badge badge-wait";
        badge.textContent = t("pendingBadge");
      } else if (patch.status === "processing") {
        badge.className = "badge";
        badge.textContent = t("processingBadge");
      } else if (patch.status === "done") {
        badge.className = "badge badge-ok";
        badge.textContent = t("doneBadge");
      } else if (patch.status === "error") {
        badge.className = "badge badge-bad";
        badge.textContent = t("errorBadge");
      }
    }

    if (sizeText) {
      if (typeof patch.bytesOut === "number" && patch.bytesOut > 0) {
        const inB = typeof patch.bytesIn === "number" ? patch.bytesIn : null;
        const outText = formatBytes(patch.bytesOut);
        if (inB && inB > 0) {
          sizeText.innerHTML = `<strong>${outText}</strong> (${formatBytes(inB)} in)`;
        } else {
          sizeText.innerHTML = `<strong>${outText}</strong>`;
        }
      } else if (typeof patch.bytesIn === "number") {
        sizeText.textContent = formatBytes(patch.bytesIn);
      }
    }

    if (media && patch.previewUrl && patch.status === "done") {
      media.innerHTML = `<img class="preview" decoding="async" alt="${escapeAttribute(
        t("previewAlt")
      )}" src="${escapeAttribute(patch.previewUrl)}" />`;
    }

    if (media && patch.status === "pending") {
      // Reset to skeleton media.
      media.innerHTML = `<img class="spinner" src="/assets/spinner.svg" alt="" width="38" height="38" />`;
    }

    const errNode = card.querySelector(".error-text");
    if (patch.status === "error") {
      if (errNode) {
        errNode.textContent = patch.errorMessage || t("conversionFailed");
      } else {
        const div = document.createElement("div");
        div.className = "error-text";
        div.textContent = patch.errorMessage || t("conversionFailed");
        card.insertBefore(div, card.querySelector(".card-actions"));
      }
    } else if (errNode && patch.status !== "error") {
      errNode.remove();
    }

    if (downloadBtn) downloadBtn.disabled = patch.status !== "done";
  });
}

export function setCardSettingsOpen(id, open) {
  const card = Dom.resultsGrid?.querySelector(`.card[data-id="${cssEscape(id)}"]`);
  if (!card) return;
  const panel = card.querySelector(".card-settings");
  if (!panel) return;
  queueDomPatch(() => {
    panel.hidden = !open;
  });
}

export function setCardSettingsValues(id, settings) {
  const card = Dom.resultsGrid?.querySelector(`.card[data-id="${cssEscape(id)}"]`);
  if (!card) return;
  const q = card.querySelector(".mini-quality");
  const qOut = card.querySelector(".mini-quality-out");
  const exif = card.querySelector(".mini-exif");
  queueDomPatch(() => {
    if (q && typeof settings?.quality === "number") q.value = String(Math.round(settings.quality * 100));
    if (qOut && typeof settings?.quality === "number")
      qOut.textContent = String(Math.round(settings.quality * 100));
    if (exif && typeof settings?.exif === "boolean") exif.checked = settings.exif;
  });
}

export function updateActionBar({ statusText, statsText, downloadAllEnabled }) {
  queueDomPatch(() => {
    if (Dom.statusText && typeof statusText === "string") Dom.statusText.textContent = statusText;
    if (Dom.statsText && typeof statsText === "string") Dom.statsText.textContent = statsText;
    if (Dom.downloadAllBtn && typeof downloadAllEnabled === "boolean")
      Dom.downloadAllBtn.disabled = !downloadAllEnabled;
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(str) {
  // For object URLs; still escape basic characters to avoid broken markup.
  return String(str).replaceAll('"', "%22");
}

function cssEscape(str) {
  // Minimal escape for dataset ids (UUID-ish). Safe for querySelector.
  return String(str).replaceAll('"', '\\"');
}
