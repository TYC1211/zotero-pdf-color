const PLUGIN_ID = "pdf-color-per-document@local.invalid";
const CONTROL_ID = "pdf-color-per-document";
const PREF_PREFIX = "extensions.pdfColorPerDocument.mode.";

let active = false;
const viewObservers = new WeakMap();

function preferenceFor(reader) {
  if (!reader.itemID) return null;
  const item = Zotero.Items.get(reader.itemID);
  if (!item?.isPDFAttachment()) return null;
  return PREF_PREFIX + item.libraryID + "." + item.key;
}

function syncPageSurround(view) {
  const doc = view._iframeWindow?.document;
  const container = doc?.getElementById("viewerContainer");
  if (!container) return false;

  // Match Zotero's native background independently of the forced page theme.
  const locked = view._forcedColorScheme === "light" || view._forcedColorScheme === "dark";
  for (const element of [doc.body, container]) {
    if (locked) {
      element.style.colorScheme = "light dark";
      element.style.backgroundColor = "light-dark(#f2f2f2, #272727)";
    } else {
      element.style.removeProperty("color-scheme");
      element.style.removeProperty("background-color");
    }
  }
  return true;
}

function applyPageScheme(internal, scheme) {
  // The reader-level setter also changes the toolbar and sidebar.
  for (const view of [internal._primaryView, internal._secondaryView]) {
    if (!view) continue;
    view.setColorScheme(scheme);
    if (!syncPageSurround(view)) {
      view.initializedPromise?.then(() => syncPageSurround(view)).catch(Zotero.logError);
    }
  }
}

function mountControl(reader, doc, append) {
  const pref = preferenceFor(reader);
  const internal = reader._internalReader;
  if (!pref || typeof internal?._primaryView?.setColorScheme !== "function") return;
  if (doc.getElementById(CONTROL_ID)) return;

  const chinese = Zotero.locale.startsWith("zh");
  const modes = [
    ["", chinese ? "跟随 Zotero" : "Follow Zotero"],
    ["light", chinese ? "固定浅色" : "Always Light"],
    ["dark", chinese ? "固定深色" : "Always Dark"],
  ];

  const control = doc.createElement("select");
  control.id = CONTROL_ID;
  control.title = chinese ? "本篇配色" : "PDF color for this document";
  control.setAttribute("aria-label", control.title);
  control.style.cssText = "font: menu; color-scheme: light dark; max-width: 10em;";
  for (const [value, label] of modes) {
    const option = doc.createElement("option");
    option.value = value;
    option.textContent = label;
    control.append(option);
  }

  function refresh() {
    const saved = Zotero.Prefs.get(pref, true);
    control.value = saved === "light" || saved === "dark" ? saved : "";
    applyPageScheme(internal, control.value || undefined);
  }

  control.addEventListener("keydown", event => event.stopPropagation());
  control.addEventListener("change", () => {
    if (control.value) {
      Zotero.Prefs.set(pref, control.value, true);
    } else {
      Zotero.Prefs.clear(pref, true);
    }
    for (const openReader of Zotero.Reader._readers) {
      if (openReader !== reader && openReader.itemID === reader.itemID) {
        const otherControl = openReader._iframeWindow?.document.getElementById(CONTROL_ID);
        if (otherControl) {
          otherControl.value = control.value;
          applyPageScheme(openReader._internalReader, control.value || undefined);
        }
      }
    }
    refresh();
  });
  append(control);
  refresh();

  // Zotero can create a second PDF view or replace an existing one.
  viewObservers.get(reader)?.disconnect();
  const observer = new reader._iframeWindow.MutationObserver(refresh);
  observer.observe(doc.getElementById("primary-view"), { childList: true });
  observer.observe(doc.getElementById("secondary-view"), { childList: true });
  viewObservers.set(reader, observer);
}

function onRenderToolbar({ reader, doc, append }) {
  mountControl(reader, doc, append);
}

async function startup() {
  active = true;
  await Zotero.initializationPromise;
  if (!active) return;
  Zotero.Reader.registerEventListener("renderToolbar", onRenderToolbar, PLUGIN_ID);
  for (const reader of Zotero.Reader._readers) {
    const doc = reader._iframeWindow?.document;
    const appearance = doc?.getElementById("appearance");
    if (appearance) {
      mountControl(reader, doc, control => appearance.before(control));
    }
  }
}

function shutdown(data, reason) {
  active = false;
  if (reason === APP_SHUTDOWN || !Zotero.Reader) return;
  Zotero.Reader.unregisterEventListener("renderToolbar", onRenderToolbar);
  for (const reader of Zotero.Reader._readers) {
    viewObservers.get(reader)?.disconnect();
    viewObservers.delete(reader);
    const control = reader._iframeWindow?.document.getElementById(CONTROL_ID);
    if (!control) continue;
    control.remove();
    applyPageScheme(reader._internalReader, undefined);
  }
}
