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

function linkList(links, fallback = false) {
  if (!links || links.length === 0) {
    return fallback ? '<span class="paper-link muted">Draft available on request</span>' : "";
  }
  return links
    .map((link) => `<a class="paper-link" href="${escapeHtml(link.url)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`)
    .join("");
}

function tags(values = []) {
  return values.map((value) => `<span class="tag">${escapeHtml(value)}</span>`).join("");
}

function staticVisual(item) {
  const label = escapeHtml(item.visual?.label || item.shortTitle || item.title);
  const metric = escapeHtml(item.visual?.metric || item.year);
  return `
            <svg viewBox="0 0 320 190" aria-hidden="true" focusable="false">
              <path class="viz-grid" d="M36 130H284M36 60H284M36 95H284"/>
              <path class="viz-line hot" d="M50 122C82 94 111 91 141 106S196 124 224 83 256 54 282 68"/>
              <path class="viz-wire" d="M71 70L146 45L228 76L204 124L103 128Z"/>
              <circle class="viz-node hot" cx="146" cy="45" r="10"/>
              <circle class="viz-node cool" cx="224" cy="83" r="8"/>
              <text x="22" y="166" class="viz-label">${label}</text>
              <text x="230" y="166" class="viz-metric">${metric}</text>
            </svg>`;
}

function paperCard(item, compact = false) {
  const title = escapeHtml(compact ? item.shortTitle : item.title);
  const doiMarkup = item.doi ? `<p class="paper-doi">DOI: ${escapeHtml(item.doi)}</p>` : "";
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
              <div class="paper-links">${linkList(item.links)}</div>
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
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${SITE_URL}${pagePath(item)}`,
      item: {
        "@type": item.category === "books" ? "Book" : "ScholarlyArticle",
        "@id": `${SITE_URL}${pagePath(item)}#article`,
        name: item.title,
        author: authorObjects(item),
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
  const authors = item.authorsFull && item.authorsFull.length > 0 ? item.authorsFull : ["Juan P. Aparicio"];
  const pdfLink = (item.links || []).find((link) => /\.pdf(?:$|\?)/i.test(link.url));
  const lines = [
    `<meta name="citation_title" content="${escapeHtml(item.title)}">`,
    ...authors.map((author) => `<meta name="citation_author" content="${escapeHtml(author)}">`),
    `<meta name="citation_publication_date" content="${escapeHtml(item.year)}">`,
    `<meta name="citation_language" content="en">`,
    `<meta name="citation_abstract_html_url" content="${SITE_URL}${pagePath(item)}">`,
  ];
  if (item.venue) lines.push(`<meta name="citation_journal_title" content="${escapeHtml(item.venue)}">`);
  if (item.doi) lines.push(`<meta name="citation_doi" content="${escapeHtml(doiValue(item.doi))}">`);
  if (pdfLink) lines.push(`<meta name="citation_pdf_url" content="${escapeHtml(absoluteUrl(pdfLink.url))}">`);
  return lines.join("\n    ");
}

function articleJsonLd(item) {
  const link = primaryLink(item);
  return {
    "@context": "https://schema.org",
    "@type": item.category === "books" ? "Book" : "ScholarlyArticle",
    "@id": `${SITE_URL}${pagePath(item)}#article`,
    name: item.title,
    headline: item.title,
    description: item.summary,
    author: authorObjects(item),
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
            <span class="brand-role">Applied microeconomics</span>
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
        <span><a href="mailto:juposada93@gmail.com">juposada93@gmail.com</a> - <a href="https://scholar.google.com/citations?user=ap4duGUAAAAJ&hl=en" target="_blank" rel="me noreferrer">Scholar</a> - <a href="https://orcid.org/0000-0001-5887-2440" target="_blank" rel="me noreferrer">ORCID</a> - <a href="https://github.com/juposada93" target="_blank" rel="me noreferrer">GitHub</a> - <a href="https://www.linkedin.com/in/juan-pablo-posada-aparicio/" target="_blank" rel="me noreferrer">LinkedIn</a></span>
      </div>
    </footer>`;
}

function paperPage(item) {
  const pageUrl = `${SITE_URL}${pagePath(item)}`;
  const links = linkList(item.links, true);
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
    <meta property="og:image" content="${SITE_URL}${PORTRAIT}">
    <meta property="og:image:alt" content="Portrait of Juan P. Aparicio">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(item.title)}">
    <meta name="twitter:description" content="${escapeHtml(item.summary)}">
    <meta name="twitter:image" content="${SITE_URL}${PORTRAIT}">
    ${citationMeta(item)}
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="stylesheet" href="/assets/styles/site.css">
    ${jsonLdScript(articleJsonLd(item))}
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
            <p>${escapeHtml(item.insight)}</p>
            <p>${escapeHtml(item.summary)}</p>
          </div>
          <div class="paper-detail-abstract reveal is-visible">
            <div class="section-label">Methods and themes</div>
            <h2>How the project is framed.</h2>
            <div class="tag-row">${tags(item.methods)}</div>
            <div class="tag-row">${tags(item.themes)}</div>
          </div>
        </div>
        <aside class="paper-detail-side reveal is-visible" aria-label="Paper metadata">
          <h2>Paper details</h2>
          <dl class="paper-detail-meta">
            <div><dt>Status</dt><dd>${escapeHtml(item.status)}</dd></div>
            <div><dt>Authors</dt><dd>${escapeHtml(item.authorsFull?.join(", ") || item.authors)}</dd></div>
            <div><dt>Venue</dt><dd>${escapeHtml(item.venue)}</dd></div>
            <div><dt>Year</dt><dd>${escapeHtml(item.year)}</dd></div>
            ${doiRow}
          </dl>
          <div class="paper-detail-links">${links}</div>
        </aside>
      </section>
    </main>

${footer()}

    <script src="/data/research.js"></script>
    <script src="/assets/scripts/site.js"></script>
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
    ...items.map(pagePath),
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
