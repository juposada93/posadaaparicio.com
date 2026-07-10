import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SITE_URL = "https://www.posadaaparicio.com";
const LASTMOD = "2026-06-10";
const PORTRAIT = "/assets/images/juan-p-aparicio-portrait.jpg";

function readResearchItems() {
  const source = fs.readFileSync(path.join(ROOT, "data", "research.js"), "utf8");
  const context = { window: {} };
  vm.runInNewContext(source, context, { filename: "data/research.js" });
  return [...context.window.JPA_RESEARCH].sort((a, b) => {
    const rankDiff = (b.sortRank || 0) - (a.sortRank || 0);
    if (rankDiff !== 0) return rankDiff;
    return String(a.title).localeCompare(String(b.title));
  });
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function categoryLabel(category) {
  const labels = {
    published: "Published",
    books: "Books and reports",
    working: "Working papers",
    wip: "Work in progress",
  };
  return labels[category] || category;
}

function pagePath(item) {
  return `/papers/${encodeURIComponent(item.id)}.html`;
}

function absoluteUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//.test(url)) return url;
  return `${SITE_URL}${url}`;
}

function doiValue(doi) {
  if (!doi) return "";
  return doi.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "");
}

function primaryLink(item) {
  if (!item.links || item.links.length === 0) return null;
  return item.links.find((link) => /doi|journal|pnas|economic/i.test(link.label)) || item.links[0];
}

function linkList(links, fallbackItem = null) {
  if (fallbackItem?.privateDraft) {
    return `<span class="paper-link muted">Draft not publicly circulated</span>`;
  }
  if (!links || links.length === 0) {
    if (!fallbackItem) return "";
    const subject = encodeURIComponent(`Draft request: ${fallbackItem.title}`);
    return `<a class="paper-link" href="mailto:jposadaa@uottawa.ca?subject=${subject}">Request draft by email</a>`;
  }
  return links
    .map((link) => `<a class="paper-link" href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`)
    .join("");
}

function authorLine(item) {
  const authors = item.authorsFull && item.authorsFull.length > 0 ? item.authorsFull : [item.authors];
  if (authors.length > 10) {
    return `${authors.slice(0, 6).join(", ")}, and ${authors.length - 6} others (${authors.length} authors)`;
  }
  return authors.join(", ");
}

function tags(values = []) {
  return values.map((value) => `<span class="tag">${escapeHtml(value)}</span>`).join("");
}

// Keep in sync with paperVisual() in assets/scripts/site.js
function staticVisual(item) {
  const label = escapeHtml(item.visual?.label || item.shortTitle || item.title);
  const metric = escapeHtml(item.visual?.metric || item.year);
  const common = `viewBox="0 0 320 190" aria-hidden="true" focusable="false"`;
  const caption = `<text x="22" y="166" class="viz-label">${label}</text><text x="230" y="166" class="viz-metric">${metric}</text>`;

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
    codeAudit: `
            <svg ${common}>
              <rect class="viz-box wide" x="42" y="36" width="236" height="98"/>
              <path class="viz-grid" d="M65 62H138M65 83H119M65 104H151M170 62H246M170 83H228M170 104H250"/>
              <path class="viz-check" d="M76 113L95 129L134 79"/>
              <circle class="viz-dot hot" cx="252" cy="62" r="5"/>
              <circle class="viz-dot cool" cx="253" cy="104" r="5"/>
              ${caption}
            </svg>`,
    commentAudit: `
            <svg ${common}>
              <rect class="viz-box" x="47" y="44" width="82" height="82" rx="4"/>
              <rect class="viz-box wide" x="172" y="38" width="101" height="94" rx="4"/>
              <path class="viz-grid" d="M64 68H111M64 88H104M190 65H253M190 86H240M190 107H257"/>
              <path class="viz-wire" d="M129 78C147 64 157 64 172 76"/>
              <circle class="viz-node hot" cx="147" cy="65" r="11"/>
              <path class="viz-line cool" d="M54 130C88 99 112 99 145 130"/>
              <path class="viz-wave" d="M176 118C202 86 236 87 264 58"/>
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
            </svg>`,
  };

  return visuals[item.visual?.type] || visuals.audit;
}

function paperCard(item, compact = false) {
  const title = escapeHtml(compact ? item.shortTitle : item.title);
  const doiMarkup = item.doi
    ? `<p class="paper-doi">DOI: <a href="${escapeHtml(item.doi)}" target="_blank" rel="noreferrer">${escapeHtml(doiValue(item.doi))}</a></p>`
    : "";
  const badgeMarkup = item.badge ? `<span class="paper-badge">${escapeHtml(item.badge)}</span>` : "";
  const insightMarkup = compact ? "" : `<p class="paper-insight">${escapeHtml(item.insight)}</p>`;
  return `
          <article class="paper-card reveal is-visible" data-category="${escapeHtml(item.category)}">
            <div class="paper-visual" style="--paper-accent: ${escapeHtml(item.visual?.accent || "#24546b")}">
              ${staticVisual(item)}
            </div>
            <div class="paper-body">
              <div class="paper-kicker">
                <span>${escapeHtml(categoryLabel(item.category))}</span>
                <span>${escapeHtml(item.year)}</span>
              </div>
              <h3><a class="paper-title-link" href="${escapeHtml(pagePath(item))}">${title}</a></h3>
              ${badgeMarkup}
              <p class="paper-authors">${escapeHtml(item.authors)}</p>
              <p class="paper-venue">${escapeHtml(item.venue)}</p>
              <p class="paper-status">${escapeHtml(item.status)}</p>
              ${doiMarkup}
              <p>${escapeHtml(item.summary)}</p>
              ${insightMarkup}
              <div class="tag-row">${tags(item.themes)}</div>
              <div class="paper-links">${item.privateDraft ? linkList(item.links, item) : linkList(item.links)}</div>
            </div>
          </article>`;
}

function replaceGeneratedBlock(file, marker, html) {
  const filePath = path.join(ROOT, file);
  const start = `<!-- generated:${marker}:start -->`;
  const end = `<!-- generated:${marker}:end -->`;
  const source = fs.readFileSync(filePath, "utf8");
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end);
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`Missing generated block ${marker} in ${file}`);
  }
  const cleanHtml = html.replace(/[ \t]+$/gm, "");
  const next = `${source.slice(0, startIndex + start.length)}\n${cleanHtml}\n          ${source.slice(endIndex)}`;
  fs.writeFileSync(filePath, next, "utf8");
}

function jsonLdScript(data) {
  const json = JSON.stringify(data, null, 8)
    .split("\n")
    .map((line, index) => (index === 0 ? `      ${line}` : `      ${line}`))
    .join("\n");
  return `<script type="application/ld+json">\n${json}\n    </script>`;
}

function authorObjects(item) {
  const authors = item.authorsFull && item.authorsFull.length > 0 ? item.authorsFull : ["Juan P. Aparicio"];
  return authors.map((name) => {
    if (item.authorsAreOrgs) {
      return { "@type": "Organization", name };
    }
    if (name === "Juan P. Aparicio") {
      return {
        "@type": "Person",
        "@id": `${SITE_URL}/#person`,
        name,
      };
    }
    return { "@type": "Person", name };
  });
}

function researchItemList(items) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Research by Juan P. Aparicio",
    // Restricted drafts appear in the visible research list but are omitted
    // from machine-readable metadata until their author lists are final.
    itemListElement: items.filter((item) => !item.privateDraft).map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}${pagePath(item)}`,
      item: {
        "@type": item.category === "books" ? "Book" : "ScholarlyArticle",
        "@id": `${SITE_URL}${pagePath(item)}#article`,
        name: item.title,
        // Cap the roster in list context; the full author list lives in the
        // paper page's citation_author meta tags, which Scholar reads.
        author: authorObjects(item).slice(0, 10),
        datePublished: item.year,
        isPartOf: item.venue,
        identifier: item.doi || undefined,
      },
    })),
  };
}

function replaceResearchJsonLd(items) {
  const filePath = path.join(ROOT, "research.html");
  const source = fs.readFileSync(filePath, "utf8");
  if (!/<script type="application\/ld\+json">[\s\S]*?<\/script>/.test(source)) {
    throw new Error("Could not find research JSON-LD script");
  }
  const next = source.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    jsonLdScript(researchItemList(items)),
  );
  fs.writeFileSync(filePath, next, "utf8");
}

function citationMeta(item) {
  // Scholar inclusion guidelines: only emit citation_* tags for items with a
  // public full text (DOI or link); skip work in progress entirely.
  if (item.category === "wip" || item.privateDraft) return "";
  if (!item.doi && (!item.links || item.links.length === 0)) return "";
  const authors = item.authorsFull && item.authorsFull.length > 0 ? item.authorsFull : ["Juan P. Aparicio"];
  const pdfLink = (item.links || []).find((link) => /\.pdf(?:$|\?)/i.test(link.url));
  const lines = [
    `<meta name="citation_title" content="${escapeHtml(item.title)}">`,
    ...authors.map((author) => `<meta name="citation_author" content="${escapeHtml(author)}">`),
    `<meta name="citation_publication_date" content="${escapeHtml(item.year)}">`,
    `<meta name="citation_language" content="en">`,
    `<meta name="citation_abstract_html_url" content="${SITE_URL}${pagePath(item)}">`,
  ];
  if (item.category === "published" && item.venueJournal) {
    lines.push(`<meta name="citation_journal_title" content="${escapeHtml(item.venueJournal)}">`);
    if (item.venueVolume) lines.push(`<meta name="citation_volume" content="${escapeHtml(item.venueVolume)}">`);
    if (item.venueIssue) lines.push(`<meta name="citation_issue" content="${escapeHtml(item.venueIssue)}">`);
    if (item.venueFirstPage) lines.push(`<meta name="citation_firstpage" content="${escapeHtml(item.venueFirstPage)}">`);
    if (item.venueLastPage) lines.push(`<meta name="citation_lastpage" content="${escapeHtml(item.venueLastPage)}">`);
  } else if (item.venue && item.venue !== "Working paper") {
    lines.push(`<meta name="citation_technical_report_institution" content="${escapeHtml(item.venue)}">`);
  }
  if (item.doi) lines.push(`<meta name="citation_doi" content="${escapeHtml(doiValue(item.doi))}">`);
  if (pdfLink) lines.push(`<meta name="citation_pdf_url" content="${escapeHtml(absoluteUrl(pdfLink.url))}">`);
  return lines.join("\n    ");
}

function articleJsonLd(item) {
  if (item.privateDraft) return null;
  const link = primaryLink(item);
  return {
    "@context": "https://schema.org",
    "@type": item.category === "books" ? "Book" : "ScholarlyArticle",
    "@id": `${SITE_URL}${pagePath(item)}#article`,
    name: item.title,
    headline: item.title,
    description: item.summary,
    author: authorObjects(item).slice(0, 10),
    datePublished: item.year,
    isPartOf: item.venue,
    about: item.themes,
    keywords: [...(item.themes || []), ...(item.methods || [])],
    identifier: item.doi || undefined,
    url: `${SITE_URL}${pagePath(item)}`,
    sameAs: link?.url,
  };
}

function header(active = "research") {
  return `    <header class="site-header">
      <div class="nav-wrap">
        <a class="brand" href="/" aria-label="Juan P. Aparicio home">
          <span class="brand-mark">JPA</span>
          <span class="brand-text">
            <span class="brand-name">Juan P. Aparicio</span>
            <span class="brand-role">Applied economist &amp; data scientist</span>
          </span>
        </a>
        <nav class="site-nav" aria-label="Primary navigation">
          <a href="/" data-nav="home"${active === "home" ? ' aria-current="page"' : ""}>Home</a>
          <a href="/research.html" data-nav="research"${active === "research" ? ' aria-current="page"' : ""}>Research</a>
          <a href="/teaching.html" data-nav="teaching">Teaching</a>
          <a href="/cv.html" data-nav="cv">CV</a>
          <a href="/contact.html" data-nav="contact">Contact</a>
        </nav>
      </div>
    </header>`;
}

function footer() {
  return `    <footer class="footer">
      <div class="footer-inner">
        <span>Juan P. Aparicio</span>
        <span><a href="mailto:jposadaa@uottawa.ca">jposadaa@uottawa.ca</a> - <a href="https://scholar.google.com/citations?user=ap4duGUAAAAJ&hl=en" target="_blank" rel="me noreferrer">Scholar</a> - <a href="https://orcid.org/0000-0001-5887-2440" target="_blank" rel="me noreferrer">ORCID</a> - <a href="https://github.com/juposada93" target="_blank" rel="me noreferrer">GitHub</a> - <a href="https://www.linkedin.com/in/juan-pablo-posada-aparicio/" target="_blank" rel="me noreferrer">LinkedIn</a></span>
      </div>
    </footer>`;
}

function bibtex(item) {
  if (item.category === "wip" || item.privateDraft) return "";
  const authors = item.authorsFull && item.authorsFull.length > 0 ? item.authorsFull : ["Juan P. Aparicio"];
  const authorField = authors.length > 10 ? `${authors.slice(0, 6).join(" and ")} and others` : authors.join(" and ");
  const key = `aparicio${item.year}${item.id.replace(/-.*$/, "")}`;
  const doi = item.doi ? `,\n  doi = {${doiValue(item.doi)}}` : "";
  const url = !item.doi && item.links?.[0] ? `,\n  url = {${item.links[0].url}}` : "";
  if (item.category === "published") {
    const journal = item.venue.split(",")[0];
    return `@article{${key},\n  title = {${item.title}},\n  author = {${authorField}},\n  journal = {${journal}},\n  year = {${item.year}}${doi}${url}\n}`;
  }
  if (item.category === "books") {
    return `@book{${key},\n  title = {${item.title}},\n  author = {${authorField}},\n  publisher = {${item.venue}},\n  year = {${item.year}}${doi}${url}\n}`;
  }
  if (!item.venue || item.venue === "Working paper") {
    return `@unpublished{${key},\n  title = {${item.title}},\n  author = {${authorField}},\n  note = {Working paper; draft available on request},\n  year = {${item.year}}${doi}${url}\n}`;
  }
  return `@techreport{${key},\n  title = {${item.title}},\n  author = {${authorField}},\n  institution = {${item.venue}},\n  year = {${item.year}}${doi}${url}\n}`;
}

function videoEmbed(item) {
  if (!item.video) return "";
  const match = item.video.match(/(?:v=|youtu\.be\/)([\w-]{6,})/);
  if (!match) return "";
  const id = match[1];
  const title = escapeHtml(`Video presentation: ${item.shortTitle || item.title}`);
  // Click-to-load facade: the ~600KB YouTube player only loads on demand.
  // Without JS the facade is a plain link to the video.
  return `<div class="paper-detail-abstract reveal is-visible">
            <div class="section-label">Video</div>
            <h2>Paper presentation.</h2>
            <div class="video-embed" data-video-id="${id}" data-video-title="${title}">
              <a class="video-facade" href="${escapeHtml(item.video)}" target="_blank" rel="noreferrer">
                <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="${title}" width="480" height="360" loading="lazy" decoding="async">
                <span class="video-play" aria-hidden="true"></span>
                <span class="visually-hidden">Play video</span>
              </a>
            </div>
          </div>`;
}

function ogImage(item) {
  const ogPath = `/assets/images/og/${item.id}.png`;
  if (fs.existsSync(path.join(ROOT, ogPath))) {
    return { url: ogPath, alt: `Paper card: ${item.title}` };
  }
  return { url: PORTRAIT, alt: "Portrait of Juan P. Aparicio" };
}

function paperPage(item) {
  const pageUrl = `${SITE_URL}${pagePath(item)}`;
  const og = ogImage(item);
  const links = linkList(item.links, item);
  const doiRow = item.doi
    ? `<div><dt>DOI</dt><dd><a href="${escapeHtml(item.doi)}" target="_blank" rel="noreferrer">${escapeHtml(doiValue(item.doi))}</a></dd></div>`
    : "";
  const badge = item.badge ? `<span class="paper-badge">${escapeHtml(item.badge)}</span>` : "";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(item.title)} | Juan P. Aparicio</title>
    <meta name="description" content="${escapeHtml(item.summary)}">
    <link rel="canonical" href="${pageUrl}">
    <meta property="og:site_name" content="Juan P. Aparicio">
    <meta property="og:title" content="${escapeHtml(item.title)}">
    <meta property="og:description" content="${escapeHtml(item.summary)}">
    <meta property="og:type" content="article">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:image" content="${SITE_URL}${og.url}">
    <meta property="og:image:alt" content="${escapeHtml(og.alt)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(item.title)}">
    <meta name="twitter:description" content="${escapeHtml(item.summary)}">
    <meta name="twitter:image" content="${SITE_URL}${og.url}">
    ${citationMeta(item)}
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="/assets/styles/site.css">
    ${articleJsonLd(item) ? jsonLdScript(articleJsonLd(item)) : ""}
  </head>
  <body data-page="research">
    <a class="skip-link" href="#main-content">Skip to content</a>
${header("research")}

    <main id="main-content">
      <section class="page-hero">
        <div class="eyebrow">${escapeHtml(categoryLabel(item.category))} | ${escapeHtml(item.year)}</div>
        <h1>${escapeHtml(item.title)}</h1>
        <p>${escapeHtml(item.summary)}</p>
        <div class="hero-actions">
          <a class="button" href="/research.html">Back to research</a>
          ${links}
        </div>
      </section>

      <section class="section paper-detail" aria-labelledby="paper-detail-heading">
        <div class="paper-detail-main">
          <div class="paper-detail-abstract reveal is-visible">
            <div class="section-label">Research brief</div>
            <h2 id="paper-detail-heading">Question and contribution.</h2>
            ${badge}
            ${item.brief ? `<p>${escapeHtml(item.brief)}</p>` : `<p>${escapeHtml(item.insight)}</p>`}
          </div>
          ${item.abstract ? `<div class="paper-detail-abstract reveal is-visible">
            <div class="section-label">Paper</div>
            <h2>Abstract.</h2>
            <p>${escapeHtml(item.abstract)}</p>
          </div>` : ""}
          ${videoEmbed(item)}
          <div class="paper-detail-abstract reveal is-visible">
            <div class="section-label">Methods and themes</div>
            <h2>How the project is framed.</h2>
            <div class="tag-row">${tags(item.methods)}</div>
            <div class="tag-row">${tags(item.themes)}</div>
          </div>
          ${bibtex(item) ? `<div class="paper-detail-abstract reveal is-visible">
            <div class="section-label">Cite</div>
            <h2>BibTeX.</h2>
            <pre class="bibtex"><code>${escapeHtml(bibtex(item))}</code></pre>
          </div>` : ""}
        </div>
        <aside class="paper-detail-side reveal is-visible" aria-label="Paper metadata">
          <h2>Paper details</h2>
          <dl class="paper-detail-meta">
            <div><dt>Status</dt><dd>${escapeHtml(item.status)}</dd></div>
            <div><dt>Authors</dt><dd>${escapeHtml(authorLine(item))}</dd></div>
            ${item.roleNote ? `<div><dt>Role</dt><dd>${escapeHtml(item.roleNote)}</dd></div>` : ""}
            <div><dt>Venue</dt><dd>${escapeHtml(item.venue)}</dd></div>
            <div><dt>Year</dt><dd>${escapeHtml(item.year)}</dd></div>
            ${doiRow}
          </dl>
          <div class="paper-detail-links">${links}</div>
        </aside>
      </section>
    </main>

${footer()}

    <script src="/assets/scripts/site.js" defer></script>
  </body>
</html>
`;
}

function writePaperPages(items) {
  const dir = path.join(ROOT, "papers");
  fs.mkdirSync(dir, { recursive: true });
  for (const item of items) {
    fs.writeFileSync(path.join(dir, `${item.id}.html`), paperPage(item).replace(/[ \t]+$/gm, ""), "utf8");
  }
}

function writeSitemap(items) {
  const urls = [
    "/",
    "/research.html",
    "/teaching.html",
    "/cv.html",
    "/contact.html",
    "/assets/docs/Juan_P_Aparicio_public_CV.pdf",
    "/assets/docs/Juan_P_Aparicio_public_CV.txt",
    "/assets/docs/Juan_Aparicio_Resume.pdf",
    ...items.filter((item) => !item.privateDraft).map(pagePath),
  ];
  const body = urls
    .map((url) => `  <url>\n    <loc>${SITE_URL}${url}</loc>\n    <lastmod>${LASTMOD}</lastmod>\n  </url>`)
    .join("\n");
  fs.writeFileSync(
    path.join(ROOT, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
    "utf8",
  );
}

const items = readResearchItems();
replaceGeneratedBlock("index.html", "featured-research", items.filter((item) => item.featured).slice(0, 4).map((item) => paperCard(item, true)).join("\n"));
replaceGeneratedBlock("research.html", "all-research", items.map((item) => paperCard(item, false)).join("\n"));
replaceResearchJsonLd(items);
writePaperPages(items);
writeSitemap(items);
