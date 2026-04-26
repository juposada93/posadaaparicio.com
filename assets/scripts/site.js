const researchItems = window.JPA_RESEARCH || [];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function linkList(links) {
  if (!links || links.length === 0) {
    return "";
  }

  return links
    .map((link) => `<a class="paper-link" href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`)
    .join("");
}

function tags(values) {
  return values.map((value) => `<span class="tag">${escapeHtml(value)}</span>`).join("");
}

function paperCard(item, compact = false) {
  return `
    <article class="paper-card reveal" data-category="${escapeHtml(item.category)}">
      <div class="paper-visual" style="--paper-accent: ${escapeHtml(item.visual.accent)}">
        ${paperVisual(item.visual.type, item.visual.label, item.visual.metric)}
      </div>
      <div class="paper-body">
        <div class="paper-kicker">
          <span>${escapeHtml(item.status)}</span>
          <span>${escapeHtml(item.year)}</span>
        </div>
        <h3>${escapeHtml(compact ? item.shortTitle : item.title)}</h3>
        <p class="paper-authors">${escapeHtml(item.authors)}</p>
        <p class="paper-venue">${escapeHtml(item.venue)}</p>
        <p>${escapeHtml(item.summary)}</p>
        ${compact ? "" : `<p class="paper-insight">${escapeHtml(item.insight)}</p>`}
        <div class="tag-row">${tags(item.themes)}</div>
        <div class="paper-links">${linkList(item.links)}</div>
      </div>
    </article>
  `;
}

function paperVisual(type, label, metric) {
  const safeLabel = escapeHtml(label);
  const safeMetric = escapeHtml(metric);
  const common = `viewBox="0 0 320 190" role="img" aria-label="${safeLabel} paper infographic"`;
  const caption = `<text x="22" y="166" class="viz-label">${safeLabel}</text><text x="230" y="166" class="viz-metric">${safeMetric}</text>`;

  const visuals = {
    news: `
      <svg ${common}>
        <path class="viz-grid" d="M24 126H296M24 91H296M24 56H296"/>
        <path class="viz-line hot" d="M24 122 C55 112 68 61 96 72 S135 148 160 101 207 48 232 63 265 98 296 46"/>
        <path class="viz-line cool" d="M24 78 C52 93 80 107 111 96 S158 74 182 101 227 135 255 112 279 91 296 96"/>
        <circle class="viz-dot hot" cx="96" cy="72" r="6"/>
        <circle class="viz-dot cool" cx="232" cy="63" r="6"/>
        <rect class="viz-box" x="34" y="32" width="72" height="24"/>
        ${caption}
      </svg>`,
    network: `
      <svg ${common}>
        <path class="viz-wire" d="M71 71L153 43L240 76L202 125L105 128Z"/>
        <path class="viz-wire" d="M153 43L202 125M71 71L202 125M105 128L240 76"/>
        <circle class="viz-node hot" cx="71" cy="71" r="16"/>
        <circle class="viz-node cool" cx="153" cy="43" r="12"/>
        <circle class="viz-node" cx="240" cy="76" r="18"/>
        <circle class="viz-node cool" cx="202" cy="125" r="14"/>
        <circle class="viz-node" cx="105" cy="128" r="10"/>
        ${caption}
      </svg>`,
    signal: `
      <svg ${common}>
        <path class="viz-grid" d="M35 132H286"/>
        <path class="viz-wave" d="M62 118C96 42 138 42 172 118"/>
        <path class="viz-wave faint" d="M104 118C130 72 152 72 178 118"/>
        <rect class="viz-bar hot" x="206" y="58" width="22" height="74"/>
        <rect class="viz-bar" x="238" y="86" width="22" height="46"/>
        <circle class="viz-dot cool" cx="118" cy="88" r="10"/>
        ${caption}
      </svg>`,
    teams: `
      <svg ${common}>
        <rect class="viz-bar" x="57" y="76" width="38" height="56"/>
        <rect class="viz-bar hot" x="136" y="50" width="38" height="82"/>
        <rect class="viz-bar cool" x="215" y="62" width="38" height="70"/>
        <path class="viz-wire" d="M76 58L155 34L234 46"/>
        <circle class="viz-node" cx="76" cy="58" r="8"/>
        <circle class="viz-node hot" cx="155" cy="34" r="8"/>
        <circle class="viz-node cool" cx="234" cy="46" r="8"/>
        ${caption}
      </svg>`,
    audit: `
      <svg ${common}>
        <rect class="viz-box wide" x="54" y="42" width="212" height="92"/>
        <path class="viz-check" d="M88 82L110 104L151 61"/>
        <path class="viz-grid" d="M174 70H239M174 94H239M174 118H224"/>
        <circle class="viz-dot hot" cx="247" cy="70" r="5"/>
        <circle class="viz-dot cool" cx="232" cy="118" r="5"/>
        ${caption}
      </svg>`,
    phone: `
      <svg ${common}>
        <rect class="viz-device" x="74" y="35" width="70" height="108" rx="12"/>
        <path class="viz-wave" d="M171 60C211 42 245 51 271 84"/>
        <path class="viz-wave faint" d="M171 88C207 76 234 84 252 108"/>
        <circle class="viz-dot hot" cx="222" cy="78" r="7"/>
        <rect class="viz-bar cool" x="93" y="64" width="32" height="8"/>
        <rect class="viz-bar" x="93" y="84" width="22" height="8"/>
        ${caption}
      </svg>`,
    snowball: `
      <svg ${common}>
        <circle class="viz-ring" cx="158" cy="89" r="18"/>
        <circle class="viz-ring faint" cx="158" cy="89" r="42"/>
        <circle class="viz-ring faint" cx="158" cy="89" r="69"/>
        <circle class="viz-dot hot" cx="199" cy="57" r="8"/>
        <circle class="viz-dot cool" cx="91" cy="101" r="7"/>
        <circle class="viz-dot" cx="213" cy="128" r="6"/>
        ${caption}
      </svg>`,
    radio: `
      <svg ${common}>
        <path class="viz-wave" d="M86 128C112 86 112 72 86 31"/>
        <path class="viz-wave faint" d="M128 128C165 82 165 77 128 31"/>
        <path class="viz-wave faint" d="M170 128C218 83 218 76 170 31"/>
        <circle class="viz-node hot" cx="70" cy="79" r="15"/>
        <circle class="viz-dot cool" cx="238" cy="62" r="7"/>
        <circle class="viz-dot" cx="250" cy="116" r="7"/>
        ${caption}
      </svg>`,
    migration: `
      <svg ${common}>
        <path class="viz-grid" d="M43 130H282M43 46V130"/>
        <path class="viz-line hot" d="M47 122 C84 118 99 73 130 76 S178 139 211 105 246 56 280 62"/>
        <path class="viz-route" d="M73 58C120 38 176 55 222 36"/>
        <path class="viz-arrow" d="M213 28L226 35L214 43"/>
        ${caption}
      </svg>`,
    spectrum: `
      <svg ${common}>
        <path class="viz-grid" d="M42 95H278"/>
        <circle class="viz-node hot" cx="72" cy="95" r="13"/>
        <circle class="viz-node" cx="142" cy="95" r="10"/>
        <circle class="viz-node cool" cx="207" cy="95" r="10"/>
        <circle class="viz-node hot" cx="261" cy="95" r="13"/>
        <path class="viz-line cool" d="M72 63C118 36 218 36 261 63"/>
        ${caption}
      </svg>`,
    demand: `
      <svg ${common}>
        <path class="viz-grid" d="M47 130H276M47 44V130"/>
        <path class="viz-line hot" d="M61 55C117 67 172 93 260 124"/>
        <path class="viz-wire" d="M90 121L143 80L204 103L251 59"/>
        <circle class="viz-node cool" cx="143" cy="80" r="9"/>
        <circle class="viz-node" cx="251" cy="59" r="9"/>
        ${caption}
      </svg>`
  };

  return visuals[type] || visuals.audit;
}

function renderResearch() {
  document.querySelectorAll("[data-research-grid]").forEach((grid) => {
    const mode = grid.dataset.researchGrid;
    let items = researchItems;

    if (mode === "featured") {
      items = researchItems.filter((item) => item.featured).slice(0, 4);
    }

    grid.innerHTML = items.map((item) => paperCard(item, mode === "featured")).join("");
  });
}

function setupFilters() {
  const filterWrap = document.querySelector("[data-filters]");
  const grid = document.querySelector("[data-research-grid='all']");
  if (!filterWrap || !grid) return;

  filterWrap.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;

    const filter = button.dataset.filter;
    filterWrap.querySelectorAll("button").forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");

    grid.querySelectorAll(".paper-card").forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.category !== filter;
    });
  });
}

function setActiveNav() {
  const page = document.body.dataset.page || "home";
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === page) {
      link.setAttribute("aria-current", "page");
    }
  });
}

function setupReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  items.forEach((item) => observer.observe(item));
}

document.addEventListener("DOMContentLoaded", () => {
  renderResearch();
  setupFilters();
  setActiveNav();
  setupReveal();
});
