const DICTS = {
  en: {
    ready: "Ready",
    noHeicDetected: "No HEIC/HEIF files detected.",
    queued: ({ count, skipped }) =>
      skipped ? `Queued ${count} (skipped ${skipped}).` : `Queued ${count}.`,
    runtimeFailed: "Failed to load converter runtime.",
    workerCrashed: "Worker crashed.",
    processingStatus: ({ current, total }) => `Processing ${current}/${total}...`,
    preparingZip: "Preparing ZIP...",
    zipFailed: "ZIP generation failed.",
    doneStatus: ({ success, failed }) => `Done: ${success} converted, ${failed} failed.`,
    totalOutput: ({ size }) => `Total output: ${size}.`,

    pendingBadge: "Pending",
    processingBadge: "Processing",
    doneBadge: "Done",
    errorBadge: "Error",
    conversionFailed: "Conversion failed.",

    download: "Download",
    fileSettings: "File settings",
    closeSettings: "Close settings",
    perFileSettings: "Per-file settings",
    jpgQuality: "JPG quality",
    keepExif: "Keep EXIF (best effort)",
    overrideHint: "Overrides the global sidebar settings for this file.",
    apply: "Apply",
    clear: "Clear",
    previewAlt: "Converted JPG preview",
  },
  de: {
    ready: "Bereit",
    noHeicDetected: "Keine HEIC/HEIF-Dateien erkannt.",
    queued: ({ count, skipped }) =>
      skipped
        ? `In Warteschlange: ${count} (übersprungen: ${skipped}).`
        : `In Warteschlange: ${count}.`,
    runtimeFailed: "Konverter-Runtime konnte nicht geladen werden.",
    workerCrashed: "Worker ist abgestürzt.",
    processingStatus: ({ current, total }) => `Verarbeite ${current}/${total}...`,
    preparingZip: "ZIP wird vorbereitet...",
    zipFailed: "ZIP-Erstellung fehlgeschlagen.",
    doneStatus: ({ success, failed }) =>
      `Fertig: ${success} konvertiert, ${failed} fehlgeschlagen.`,
    totalOutput: ({ size }) => `Gesamtgröße: ${size}.`,

    pendingBadge: "Wartend",
    processingBadge: "In Bearbeitung",
    doneBadge: "Fertig",
    errorBadge: "Fehler",
    conversionFailed: "Konvertierung fehlgeschlagen.",

    download: "Herunterladen",
    fileSettings: "Datei-Einstellungen",
    closeSettings: "Einstellungen schließen",
    perFileSettings: "Datei-Einstellungen",
    jpgQuality: "JPG-Qualität",
    keepExif: "EXIF behalten (wenn möglich)",
    overrideHint: "Überschreibt die globalen Einstellungen für diese Datei.",
    apply: "Übernehmen",
    clear: "Zurücksetzen",
    previewAlt: "Vorschau des konvertierten JPG",
  },
  fr: {
    ready: "Prêt",
    noHeicDetected: "Aucun fichier HEIC/HEIF détecté.",
    queued: ({ count, skipped }) =>
      skipped ? `${count} ajoutés (ignorés: ${skipped}).` : `${count} ajoutés.`,
    runtimeFailed: "Échec du chargement du convertisseur.",
    workerCrashed: "Le worker a planté.",
    processingStatus: ({ current, total }) => `Conversion ${current}/${total}...`,
    preparingZip: "Préparation du ZIP...",
    zipFailed: "Échec de la création du ZIP.",
    doneStatus: ({ success, failed }) =>
      `Terminé : ${success} convertis, ${failed} échecs.`,
    totalOutput: ({ size }) => `Taille totale : ${size}.`,

    pendingBadge: "En attente",
    processingBadge: "Conversion",
    doneBadge: "Terminé",
    errorBadge: "Erreur",
    conversionFailed: "Conversion échouée.",

    download: "Télécharger",
    fileSettings: "Paramètres du fichier",
    closeSettings: "Fermer les paramètres",
    perFileSettings: "Paramètres par fichier",
    jpgQuality: "Qualité JPG",
    keepExif: "Conserver EXIF (si possible)",
    overrideHint: "Remplace les paramètres globaux pour ce fichier.",
    apply: "Appliquer",
    clear: "Effacer",
    previewAlt: "Aperçu du JPG converti",
  },
  nl: {
    ready: "Klaar",
    noHeicDetected: "Geen HEIC/HEIF-bestanden gevonden.",
    queued: ({ count, skipped }) =>
      skipped
        ? `In wachtrij: ${count} (overgeslagen: ${skipped}).`
        : `In wachtrij: ${count}.`,
    runtimeFailed: "Converter-runtime kon niet worden geladen.",
    workerCrashed: "Worker is gecrasht.",
    processingStatus: ({ current, total }) => `Bezig ${current}/${total}...`,
    preparingZip: "ZIP wordt voorbereid...",
    zipFailed: "ZIP maken mislukt.",
    doneStatus: ({ success, failed }) =>
      `Klaar: ${success} geconverteerd, ${failed} mislukt.`,
    totalOutput: ({ size }) => `Totale output: ${size}.`,

    pendingBadge: "In wachtrij",
    processingBadge: "Bezig",
    doneBadge: "Klaar",
    errorBadge: "Fout",
    conversionFailed: "Conversie mislukt.",

    download: "Downloaden",
    fileSettings: "Bestandsinstellingen",
    closeSettings: "Instellingen sluiten",
    perFileSettings: "Per-bestand instellingen",
    jpgQuality: "JPG-kwaliteit",
    keepExif: "EXIF behouden (waar mogelijk)",
    overrideHint: "Overschrijft de globale instellingen voor dit bestand.",
    apply: "Toepassen",
    clear: "Wissen",
    previewAlt: "Voorbeeld van geconverteerde JPG",
  },
  sv: {
    ready: "Redo",
    noHeicDetected: "Inga HEIC/HEIF-filer hittades.",
    queued: ({ count, skipped }) =>
      skipped ? `Köad: ${count} (hoppade över: ${skipped}).` : `Köad: ${count}.`,
    runtimeFailed: "Misslyckades att ladda konverteraren.",
    workerCrashed: "Worker kraschade.",
    processingStatus: ({ current, total }) => `Bearbetar ${current}/${total}...`,
    preparingZip: "Skapar ZIP...",
    zipFailed: "Misslyckades att skapa ZIP.",
    doneStatus: ({ success, failed }) =>
      `Klar: ${success} konverterade, ${failed} misslyckades.`,
    totalOutput: ({ size }) => `Total storlek: ${size}.`,

    pendingBadge: "Väntar",
    processingBadge: "Bearbetar",
    doneBadge: "Klar",
    errorBadge: "Fel",
    conversionFailed: "Konverteringen misslyckades.",

    download: "Ladda ner",
    fileSettings: "Filinställningar",
    closeSettings: "Stäng inställningar",
    perFileSettings: "Inställningar per fil",
    jpgQuality: "JPG-kvalitet",
    keepExif: "Behåll EXIF (om möjligt)",
    overrideHint: "Åsidosätter de globala inställningarna för den här filen.",
    apply: "Använd",
    clear: "Rensa",
    previewAlt: "Förhandsvisning av konverterad JPG",
  },
};

let LOCALE = normalizeLocale(
  document.documentElement?.dataset?.locale || document.documentElement?.lang || "en"
);

export function setLocale(locale) {
  LOCALE = normalizeLocale(locale || "en");
}

export function getLocale() {
  return LOCALE;
}

export function t(key, params) {
  const dict = DICTS[LOCALE] || DICTS.en;
  const val = dict[key] ?? DICTS.en[key];
  if (typeof val === "function") return val(params || {});
  if (typeof val === "string") return interpolate(val, params || {});
  return String(key);
}

function normalizeLocale(locale) {
  const raw = String(locale || "en").trim().toLowerCase();
  if (!raw) return "en";
  const base = raw.split("-")[0];
  if (DICTS[raw]) return raw;
  if (DICTS[base]) return base;
  if (raw.startsWith("en")) return "en";
  return "en";
}

function interpolate(str, params) {
  let out = String(str);
  for (const [k, v] of Object.entries(params || {})) {
    out = out.replaceAll(`{${k}}`, String(v));
  }
  return out;
}
