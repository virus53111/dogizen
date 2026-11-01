/* RU/EN for bilingual Murdilimax knowledge-base pages. No network actions. */
(() => {
  "use strict";
  const key = "murdilimax-preview-lang";
  let saved = "";
  try { saved = localStorage.getItem(key) || ""; } catch {}
  const query = new URLSearchParams(location.search).get("lang");
  const initial = (query === "en" || query === "ru") ? query :
      ((saved === "en" || saved === "ru") ? saved : "ru");
  const content = [...document.querySelectorAll("[data-ru][data-en]")];
  const buttons = [...document.querySelectorAll("[data-lang]")];
  function setLanguage(lang) {
    if (lang !== "ru" && lang !== "en") return;
    document.documentElement.lang = lang;
    try { localStorage.setItem(key, lang); } catch {}
    for (const node of content) node.textContent = node.dataset[lang];
    for (const button of buttons) {
      const selected = button.dataset.lang === lang;
      button.setAttribute("aria-pressed", String(selected));
      button.style.background = selected ? "#9c61ec" : "#2a2856";
    }
    document.title = lang === "en"
      ? "Firefox extensions in Murdilimax — installation & safety"
      : "Расширения Firefox в Murdilimax — установка и безопасность";
  }
  for (const button of buttons)
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  setLanguage(initial);
})();
