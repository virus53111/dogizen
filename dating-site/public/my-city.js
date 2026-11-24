/* One explicitly saved search per browser. No account or location permission required. */
const myCity = (() => {
  const key = "mm.saved-city.v1";
  const labels = {
    ru: ["Мой город", "Сохранить поиск на этом устройстве", "Открыть сохранённый поиск", "Забыть поиск", "Новое после сохранения", "Не удалось сохранить изменения на устройстве.", "Выберите город для сохранения."],
    lv: ["Mana pilsēta", "Saglabāt meklējumu šajā ierīcē", "Atvērt saglabāto meklējumu", "Dzēst meklējumu", "Jauns kopš saglabāšanas", "Neizdevās saglabāt izmaiņas ierīcē.", "Izvēlieties pilsētu, lai saglabātu meklējumu."],
    en: ["My city", "Save search on this device", "Open saved search", "Forget search", "New since saving", "Unable to save changes on this device.", "Choose a city to save your search."],
    de: ["Meine Stadt", "Suche auf diesem Gerät speichern", "Gespeicherte Suche öffnen", "Suche löschen", "Neu seit dem Speichern", "Änderungen konnten auf diesem Gerät nicht gespeichert werden.", "Wähle eine Stadt, um die Suche zu speichern."]
  };
  const copy = () => labels[state.lang] || labels.ru;
  const fields = ["country","city","district","category","q","radius","min_age","max_age","sort","language","photo","online","mode"];
  let saved;

  function read(raw) {
    try {
      const value = JSON.parse(raw);
      if (value && Number.isFinite(value.since) && value.since > 0 &&
          fields.every(k => typeof value.filters?.[k] === "string" && value.filters[k].length <= 200) &&
          value.filters.city && /^[A-Z]{2,3}$/.test(value.filters.country)) return value;
    } catch { /* Ignore a damaged or obsolete record. */ }
    return null;
  }

  function filters() {
    const extra = window.mmExtra;
    return {
      country: state.country, city: state.city, district: state.district,
      category: state.category, q: state.q.slice(0,100), radius: $("#radiusFilter").value,
      min_age: extra.min_age || "", max_age: extra.max_age || "", sort: extra.sort || "newest",
      language: extra.language || "", photo: extra.photo || "", online: extra.online || "", mode: state.mode
    };
  }

  function matches() {
    if (!saved) return false;
    const current = filters();
    return fields.every(k => current[k] === saved.filters[k]);
  }

  function update() {
    const words = copy();
    $("#myCityStatus").textContent = saved ? words[0] + " · " + cityLabel(saved.filters.city) : (state.city ? words[0] : words[6]);
    $("#saveCity").textContent = words[1];
    $("#saveCity").disabled = !state.city || matches();
    $("#openCity").textContent = words[2];
    $("#openCity").hidden = !saved || matches();
    $("#forgetCity").textContent = words[3];
    $("#forgetCity").hidden = !saved;
  }

  function restore() {
    if (!saved) return;
    const f = saved.filters;
    // Keep a saved city searchable even when its last published listing disappears.
    if (!publicCities.has(f.country)) publicCities.set(f.country,new Map());
    const cities = publicCities.get(f.country);
    if (!cities.has(f.city)) cities.set(f.city,0);
    for (const k of ["country","city","district","category","q","mode"]) state[k] = f[k];
    if (f.radius && !countsReady && f.country === "LV") radiusCities.add(f.city);
    fillCountry();
    fillCategories();
    $("#radiusFilter").value = $("#radiusFilter").disabled ? "" : f.radius;
    syncRadius();
    $("#keyword").value = f.q;
    for (const k of ["min_age","max_age","sort","language","photo","online"]) window.mmExtra[k] = f[k];
    window.mmExtra.page = 1;
    $("#minAge").value = f.min_age || "18";
    $("#maxAge").value = f.max_age || "85";
    $("#sortFilter").value = f.sort;
    $("#spokenLanguageFilter").value = f.language;
    $("#photoOnly").checked = f.photo === "1";
    $("#onlineOnly").checked = f.online === "1";
    loadListings();
  }

  function init() {
    try { saved = read(localStorage.getItem(key)); } catch { saved = null; }
    $("#saveCity").onclick = () => {
      if (!state.city) return;
      const next = {filters: filters(), since: Date.now()};
      try { localStorage.setItem(key, JSON.stringify(next)); }
      catch { toast(copy()[5]); return; }
      saved = next;
      render();
    };
    $("#openCity").onclick = restore;
    $("#forgetCity").onclick = () => {
      try { localStorage.removeItem(key); } catch { toast(copy()[5]); return; }
      saved = null;
      render();
    };
    window.addEventListener("storage", event => {
      if (event.key === key || event.key === null) {
        saved = read(event.newValue);
        render();
      }
    });
    return !!saved;
  }

  function badgeDate() { return matches() ? saved.since : Infinity; }
  return {init, restore, update, badgeDate, badgeText: () => copy()[4]};
})();
