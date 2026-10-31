import os

style_path = r"C:\MyProjects\littlelibrary\src\web\assets\css\style.css"
with open(style_path, "r", encoding="utf-8") as f:
    original = f.read()

# Locate Reader Subsystem start
reader_idx = original.find("/* ── Reader Subsystem ── */")
if reader_idx == -1:
    reader_idx = original.find("/*  Reader Subsystem  */")
if reader_idx == -1:
    reader_idx = original.find(".reader-panel {")

reader_css = original[reader_idx:]

# Trim out the old mobile-header and sidebar media queries at the tail of reader_css if present
tail_media_idx = reader_css.find("@media (max-width: 768px)")
if tail_media_idx != -1:
    reader_css_clean = reader_css[:tail_media_idx]
else:
    reader_css_clean = reader_css

# Ensure Reader Subsystem has top z-index (2500) and proper constraints
reader_css_clean = reader_css_clean.replace("z-index: 600;", "z-index: 2500;")

new_css = f'''/* ─────────────────────────────────────────────────────────────
   My Little Library — Black & White Editorial Stylesheet
   Pure monochrome, typography-led, manga ink signature design system.
   ───────────────────────────────────────────────────────────── */

/* ── Typography: Bundled Offline Open Sans ── */
@font-face {{
  font-family: 'Open Sans';
  font-style: normal;
  font-weight: 300 800;
  font-display: swap;
  src: url('../fonts/opensans-latin.woff2') format('woff2');
}}

@font-face {{
  font-family: 'Open Sans';
  font-style: italic;
  font-weight: 300 800;
  font-display: swap;
  src: url('../fonts/opensans-latin-italic.woff2') format('woff2');
}}

/* ── Reset & Baseline ── */
*, *::before, *::after {{
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}}

:root {{
  --bg:               #fcfcfc;
  --surface:          #ffffff;
  --surface-subtle:   #f6f6f6;
  --surface-muted:    #efefef;
  --border:           #dcdcdc;
  --border-dark:      #111111;
  --text:             #111111;
  --text-secondary:   #4b4b4b;
  --text-muted:       #767676;
  --text-inverse:     #ffffff;

  /* Manga Ink Hatching & Shadow Tokens */
  --hatch-stroke:        rgba(0, 0, 0, 0.20);
  --hatch-stroke-dense:  rgba(0, 0, 0, 0.55);
  --manga-shadow-color:  #111111;
  --dock-bg:             #ffffff;
  --dock-border:         #111111;

  --header-h:         60px;
  --radius-sm:        2px;
  --radius:           4px;
  --radius-pill:      9999px;

  --font-serif:       'Open Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-sans:        'Open Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono:        ui-monospace, "SF Mono", "Cascadia Code", "Consolas", monospace;
}}

[data-theme="dark"] {{
  --bg:               #0e0e11;
  --surface:          #16161a;
  --surface-subtle:   #1f1f24;
  --surface-muted:    #292930;
  --border:           #33333d;
  --border-dark:      #ffffff;
  --text:             #f2f2f5;
  --text-secondary:   #a5a5b2;
  --text-muted:       #70707e;
  --text-inverse:     #0e0e11;

  /* Manga Ink Hatching & Shadow Tokens (Inverted Dark Mode) */
  --hatch-stroke:        rgba(255, 255, 255, 0.22);
  --hatch-stroke-dense:  rgba(255, 255, 255, 0.60);
  --manga-shadow-color:  #ffffff;
  --dock-bg:             #16161a;
  --dock-border:         #ffffff;
}}

@media (prefers-color-scheme: dark) {{
  :root:not([data-theme="light"]) {{
    --bg:               #0e0e11;
    --surface:          #16161a;
    --surface-subtle:   #1f1f24;
    --surface-muted:    #292930;
    --border:           #33333d;
    --border-dark:      #ffffff;
    --text:             #f2f2f5;
    --text-secondary:   #a5a5b2;
    --text-muted:       #70707e;
    --text-inverse:     #0e0e11;

    --hatch-stroke:        rgba(255, 255, 255, 0.22);
    --hatch-stroke-dense:  rgba(255, 255, 255, 0.60);
    --manga-shadow-color:  #ffffff;
    --dock-bg:             #16161a;
    --dock-border:         #ffffff;
  }}
}}

html {{
  font-size: 15px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}}

body {{
  font-family: var(--font-sans);
  background-color: var(--bg);
  color: var(--text);
  line-height: 1.5;
  min-height: 100vh;
}}

a {{
  color: var(--text);
  text-decoration: underline;
  text-underline-offset: 3px;
}}

button {{
  cursor: pointer;
  font-family: inherit;
}}

input, select, textarea {{
  font-family: inherit;
}}

.hidden {{
  display: none !important;
}}

/* ── Manga Cross-Hatch & Screen-Tone Pattern ── */
.ink-hatch {{
  background-image: 
    repeating-linear-gradient(45deg, var(--hatch-stroke) 0, var(--hatch-stroke) 1px, transparent 1px, transparent 6px),
    repeating-linear-gradient(-45deg, var(--hatch-stroke) 0, var(--hatch-stroke) 1px, transparent 1px, transparent 6px);
}}

.ink-hatch-dense {{
  background-image: 
    repeating-linear-gradient(45deg, var(--hatch-stroke-dense) 0, var(--hatch-stroke-dense) 1.5px, transparent 1.5px, transparent 4px),
    repeating-linear-gradient(-45deg, var(--hatch-stroke-dense) 0, var(--hatch-stroke-dense) 1.5px, transparent 1.5px, transparent 4px);
}}

/* Crisp Graphic Manga Shadows */
.manga-shadow {{
  box-shadow: 4px 4px 0px var(--manga-shadow-color);
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}}

.manga-shadow:hover {{
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0px var(--manga-shadow-color);
}}

/* ── Top Application Header with Dynamic Logo ── */
.app-header {{
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 36px;
  background: var(--surface);
  border-bottom: 2px solid var(--border-dark);
}}

.header-brand {{
  display: flex;
  align-items: center;
  gap: 14px;
}}

.brand-logo-img {{
  width: 36px;
  height: 36px;
  object-fit: contain;
  filter: grayscale(1);
}}

[data-theme="dark"] .brand-logo-img {{
  filter: grayscale(1) invert(1) brightness(1.2);
}}

.brand-titles {{
  display: flex;
  flex-direction: column;
}}

.brand-name {{
  font-family: var(--font-sans);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text);
  line-height: 1.2;
}}

.brand-tag {{
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-top: 1px;
}}

.header-actions {{
  display: flex;
  align-items: center;
  gap: 12px;
}}

.header-add-btn {{
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  background: var(--border-dark);
  color: var(--text-inverse);
  border: 1.5px solid var(--border-dark);
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;
  cursor: pointer;
  box-shadow: 3px 3px 0px var(--manga-shadow-color);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}}

.header-add-btn:hover {{
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0px var(--manga-shadow-color);
}}

.header-add-btn:active {{
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0px var(--manga-shadow-color);
}}

/* ── Floating Bottom Pill Dock Navigation (100% Solid & Clean) ── */
.bottom-dock-wrap {{
  position: fixed;
  bottom: 24px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
  z-index: 500;
  transition: opacity 0.2s ease, visibility 0.2s ease;
}}

/* Strictly hide floating dock when reading to prevent overlap with flipbook controls */
body.reader-open .bottom-dock-wrap,
body:has(#readerPanel:not(.hidden)) .bottom-dock-wrap {{
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
}}

.bottom-dock {{
  pointer-events: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--dock-bg);
  border: 2px solid var(--dock-border);
  border-radius: var(--radius-pill);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.16), 0 3px 8px rgba(0, 0, 0, 0.08);
  isolation: isolate;
}}

.dock-tab {{
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: var(--radius-pill);
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  transition: all 0.16s ease;
  white-space: nowrap;
}}

.dock-tab:hover {{
  color: var(--text);
  background: var(--surface-muted);
}}

.dock-tab.is-active {{
  color: var(--text-inverse);
  background: var(--border-dark);
  border-color: var(--border-dark);
  font-weight: 700;
}}

.dock-divider {{
  width: 1px;
  height: 22px;
  background: var(--border);
  margin: 0 4px;
}}

.dock-action-btn {{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1.5px solid var(--border-dark);
  background: var(--border-dark);
  color: var(--text-inverse);
  transition: transform 0.15s ease;
}}

.dock-action-btn:hover {{
  transform: scale(1.08);
}}

.dock-theme-btn {{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--surface-subtle);
  color: var(--text);
  transition: background 0.15s ease, transform 0.15s ease;
}}

.dock-theme-btn:hover {{
  background: var(--surface-muted);
  transform: scale(1.06);
}}

.dock-theme-icon--sun {{
  display: none;
}}
.dock-theme-icon--moon {{
  display: block;
}}

[data-theme="dark"] .dock-theme-icon--sun {{
  display: block;
}}
[data-theme="dark"] .dock-theme-icon--moon {{
  display: none;
}}

/* ── Main View Container (No Sidebar) ── */
.main {{
  margin: 0 auto;
  min-height: calc(100vh - var(--header-h));
  padding: 36px 40px 140px; /* 140px bottom padding guarantees dock clearance */
  max-width: 1340px;
}}

.view-header {{
  margin-bottom: 36px;
  border-bottom: 1.5px solid var(--border);
  padding-bottom: 24px;
}}

.view-header--row {{
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
}}

.view-title {{
  font-family: var(--font-sans);
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text);
  line-height: 1.15;
}}

.view-subtitle {{
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 6px;
}}

/* ── Typography & Section Headers ── */
.section-title-wrap {{
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  border-bottom: 2px solid var(--border-dark);
  padding-bottom: 10px;
  margin-bottom: 24px;
}}

.section-heading {{
  font-family: var(--font-sans);
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.01em;
}}

.section-note {{
  font-size: 12px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  text-transform: uppercase;
}}

/* ── Dashboard: Reading Desk (Active Focus) ── */
.dashboard-active-desk {{
  margin-bottom: 40px;
}}

.active-books-grid {{
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}}

.desk-card {{
  border: 1.5px solid var(--border-dark);
  background: var(--surface);
  padding: 22px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  border-radius: var(--radius);
  box-shadow: 4px 4px 0px var(--manga-shadow-color);
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}}

.desk-card:hover {{
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0px var(--manga-shadow-color);
}}

.desk-card-body {{
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}}

.desk-card-title {{
  font-family: var(--font-sans);
  font-size: 17px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.3;
  overflow-wrap: break-word;
  word-break: break-word;
}}

.desk-card-author {{
  font-size: 13px;
  color: var(--text-secondary);
  overflow-wrap: break-word;
  word-break: break-word;
}}

.desk-card-footer {{
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border);
  padding-top: 14px;
}}

/* ── Dashboard: Stats Ledger Strip (Clean & Crisp) ── */
.stats-ledger {{
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  border: 2px solid var(--border-dark);
  background: var(--surface);
  border-radius: var(--radius);
  margin-bottom: 40px;
  box-shadow: 4px 4px 0px var(--manga-shadow-color);
  overflow: hidden;
}}

.ledger-item {{
  padding: 22px 24px;
  border-right: 1.5px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--surface);
}}

.ledger-item:last-child {{
  border-right: none;
}}

.ledger-label {{
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  font-weight: 600;
}}

.ledger-number {{
  font-family: var(--font-mono);
  font-size: 32px;
  font-weight: 700;
  color: var(--text);
  line-height: 1;
}}

/* ── Dashboard: Two-Column Section ── */
.dashboard-columns {{
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
}}

.dashboard-column {{
  display: flex;
  flex-direction: column;
}}

/* ── Category Breakdown ── */
.category-breakdown {{
  display: flex;
  flex-direction: column;
  gap: 16px;
}}

.category-row {{
  display: flex;
  flex-direction: column;
  gap: 6px;
}}

.cat-header {{
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}}

.cat-name {{
  color: var(--text);
  font-weight: 600;
}}

.cat-count {{
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 12px;
}}

.cat-track {{
  height: 9px;
  background: var(--surface-muted);
  border: 1px solid var(--border-dark);
  border-radius: var(--radius-sm);
  overflow: hidden;
}}

.cat-fill {{
  height: 100%;
  background-color: var(--border-dark);
  background-image: 
    repeating-linear-gradient(45deg, var(--hatch-stroke-dense) 0, var(--hatch-stroke-dense) 1.5px, transparent 1.5px, transparent 4px),
    repeating-linear-gradient(-45deg, var(--hatch-stroke-dense) 0, var(--hatch-stroke-dense) 1.5px, transparent 1.5px, transparent 4px);
  transition: width 0.3s ease;
}}

/* ── Recent Ledger ── */
.recent-ledger {{
  display: flex;
  flex-direction: column;
  gap: 12px;
}}

.recent-row {{
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}}

.recent-row:hover {{
  border-color: var(--border-dark);
  box-shadow: 2px 2px 0px var(--manga-shadow-color);
}}

.recent-titles {{
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  min-width: 0;
}}

.recent-title {{
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}}

.recent-author {{
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}}

.recent-badge-wrap {{
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}}

/* ── Catalog Filters Toolbar ── */
.filters-bar {{
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
  flex-wrap: wrap;
}}

.search-wrap {{
  position: relative;
  flex: 1;
  min-width: 260px;
}}

.search-icon {{
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}}

.search-input {{
  width: 100%;
  padding: 10px 14px 10px 40px;
  background: var(--surface);
  border: 1.5px solid var(--border-dark);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text);
  outline: none;
  transition: border-color 0.15s ease;
}}

.search-input:focus {{
  border-color: var(--border-dark);
  box-shadow: 0 0 0 2px var(--hatch-stroke);
}}

.filters-select-wrap {{
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}}

.filter-select {{
  padding: 9px 32px 9px 12px;
  background: var(--surface);
  border: 1.5px solid var(--border-dark);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text);
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  cursor: pointer;
}}

/* ── Book Grid & 3D Objects ── */
.book-grid {{
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 32px;
}}

.book-card {{
  border: 1.5px solid var(--border-dark);
  background: var(--surface);
  display: flex;
  flex-direction: column;
  border-radius: var(--radius);
  box-shadow: 4px 4px 0px var(--manga-shadow-color);
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;
  min-width: 0;
  position: relative;
  isolation: isolate;
}}

.book-card:hover {{
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0px var(--manga-shadow-color);
}}

/* Physical 3D Book Presentation */
.book-object-wrap {{
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 16px;
  background: var(--surface-subtle);
  border-bottom: 1.5px solid var(--border-dark);
  cursor: pointer;
  perspective: 900px;
}}

.book-3d {{
  position: relative;
  width: 154px;
  height: 220px;
  background: var(--surface);
  color: var(--text);
  border-radius: 2px 5px 5px 2px;
  border: 1px solid var(--border-dark);
  box-shadow: 
    -1px 1px 0px rgba(0, 0, 0, 0.4),
    2px 2px 0px var(--border),
    4px 4px 0px var(--border-dark),
    5px 7px 15px rgba(0, 0, 0, 0.16);
  transform: rotateY(-5deg) rotateX(2deg);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}}

.book-object-wrap:hover .book-3d {{
  transform: rotateY(-1deg) rotateX(0deg) translateY(-4px);
  box-shadow: 
    -1px 2px 0px rgba(0, 0, 0, 0.3),
    3px 4px 0px var(--border),
    5px 6px 0px var(--border-dark),
    8px 12px 24px rgba(0, 0, 0, 0.25);
}}

/* Spine crease overlay with hatching depth */
.book-spine-crease {{
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 16px;
  background: 
    linear-gradient(to right, rgba(0, 0, 0, 0.35) 0%, rgba(255, 255, 255, 0.15) 25%, rgba(0, 0, 0, 0.3) 50%, transparent 100%),
    repeating-linear-gradient(90deg, var(--hatch-stroke) 0, var(--hatch-stroke) 1px, transparent 1px, transparent 3px);
  z-index: 5;
  pointer-events: none;
}}

/* Realistic page edges on right */
.book-pages-side {{
  position: absolute;
  top: 4px;
  right: 0;
  bottom: 4px;
  width: 5px;
  background: repeating-linear-gradient(
    to bottom,
    var(--surface) 0,
    var(--surface) 2px,
    var(--border-dark) 2px,
    var(--border-dark) 3px
  );
  border-left: 1px solid var(--border-dark);
  z-index: 4;
}}

/* Cover Image Thumbnail */
.book-cover-img {{
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}}

/* Procedural Book Cover Canvas (When no image cover is provided) */
.book-cover-canvas {{
  width: 100%;
  height: 100%;
  padding: 14px 12px 14px 22px;
  background: var(--surface);
  border: 1px solid var(--border-dark);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-sizing: border-box;
  position: relative;
}}

.book-cover-canvas::after {{
  content: '';
  position: absolute;
  inset: 0;
  background-image: 
    repeating-linear-gradient(45deg, var(--hatch-stroke) 0, var(--hatch-stroke) 1px, transparent 1px, transparent 7px);
  opacity: 0.35;
  pointer-events: none;
}}

.book-cover-inlay {{
  border: 1.5px solid var(--border-dark);
  height: 100%;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  text-align: center;
  position: relative;
  z-index: 2;
  background: var(--surface);
}}

.book-cover-top {{
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-mono);
  font-size: 8px;
  letter-spacing: 0.1em;
  color: var(--text-muted);
  text-transform: uppercase;
}}

.book-cover-title-wrap {{
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 2px;
}}

.book-cover-title {{
  font-family: var(--font-sans);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.25;
  color: var(--text);
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  overflow-wrap: anywhere;
  word-break: break-word;
}}

.book-cover-author {{
  font-size: 10px;
  font-style: italic;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}}

.book-press-mark {{
  font-family: var(--font-mono);
  font-size: 7px;
  letter-spacing: 0.15em;
  color: var(--text-muted);
  text-transform: uppercase;
}}

/* ── Book Card Metadata & Details ── */
.book-details {{
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  gap: 16px;
}}

.book-meta-row {{
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}}

.book-file-size {{
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  margin-left: auto;
}}

.book-title-row {{
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  overflow: hidden;
}}

.book-title {{
  font-family: var(--font-sans);
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.3;
  overflow-wrap: break-word;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}}

.book-author {{
  font-size: 13px;
  color: var(--text-secondary);
  overflow-wrap: break-word;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}}

.book-notes {{
  font-size: 12px;
  color: var(--text-muted);
  background: var(--surface-subtle);
  border-left: 2px solid var(--border-dark);
  padding: 6px 10px;
  margin-top: 8px;
  font-style: italic;
  overflow-wrap: break-word;
  word-break: break-word;
  max-height: 80px;
  overflow-y: auto;
}}

.book-card-actions {{
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid var(--border);
  padding-top: 14px;
}}

.book-read-btn {{
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  background: var(--border-dark);
  color: var(--text-inverse);
  border: 1.5px solid var(--border-dark);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease;
}}

.book-read-btn:hover {{
  transform: translate(-1px, -1px);
}}

.book-card-tools {{
  display: flex;
  gap: 6px;
}}

.icon-btn {{
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}}

.icon-btn:hover {{
  color: var(--text);
  border-color: var(--border-dark);
}}

.icon-btn--danger:hover {{
  color: #ff3333;
  border-color: #ff3333;
}}

/* ── Badges & Tags ── */
.badge {{
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid var(--border-dark);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  line-height: 1;
}}

.badge-status-new {{
  background: var(--surface-muted);
}}

.badge-status-reading {{
  background: var(--border-dark);
  color: var(--text-inverse);
}}

.badge-status-finished {{
  background: var(--surface);
}}

.badge-status-want {{
  background: var(--surface-subtle);
}}

.badge-file {{
  font-family: var(--font-mono);
  font-size: 10px;
  background: var(--surface-subtle);
  border-color: var(--border);
}}

.badge-category {{
  font-size: 10px;
  background: var(--surface-subtle);
  border-color: var(--border);
}}

/* ── Buttons ── */
.btn {{
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 600;
  border-radius: var(--radius-sm);
  border: 1.5px solid var(--border-dark);
  transition: all 0.15s ease;
  cursor: pointer;
}}

.btn-primary {{
  background: var(--border-dark);
  color: var(--text-inverse);
  box-shadow: 3px 3px 0px var(--manga-shadow-color);
}}

.btn-primary:hover {{
  transform: translate(-1px, -1px);
  box-shadow: 4px 4px 0px var(--manga-shadow-color);
}}

.btn-primary:active {{
  transform: translate(2px, 2px);
  box-shadow: 1px 1px 0px var(--manga-shadow-color);
}}

.btn-secondary {{
  background: var(--surface);
  color: var(--text);
  border-color: var(--border);
}}

.btn-secondary:hover {{
  border-color: var(--border-dark);
}}

.btn-danger {{
  background: #ff3333;
  color: #ffffff;
  border-color: #ff3333;
}}

.btn-sm {{
  padding: 5px 12px;
  font-size: 12px;
}}

/* ── Modal Dialogs with Clean Manga Shadows ── */
.modal-backdrop {{
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(4px);
}}

.modal {{
  background: var(--surface);
  border: 2px solid var(--border-dark);
  border-radius: var(--radius);
  width: 100%;
  max-width: 540px;
  padding: 32px;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 8px 8px 0px var(--manga-shadow-color);
}}

.modal--sm {{
  max-width: 420px;
}}

.modal-header {{
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  border-bottom: 1.5px solid var(--border-dark);
  padding-bottom: 14px;
}}

.modal-title {{
  font-family: var(--font-sans);
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}}

.modal-close {{
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}}

.modal-close:hover {{
  color: var(--text);
}}

.modal-actions {{
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 28px;
  border-top: 1px solid var(--border);
  padding-top: 20px;
}}

/* ── Form Controls ── */
.form-group {{
  margin-bottom: 18px;
}}

.form-label {{
  display: block;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--text);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}}

.required {{
  color: #ff3333;
}}

.optional {{
  font-weight: 400;
  color: var(--text-muted);
  text-transform: none;
}}

.form-input {{
  width: 100%;
  padding: 10px 12px;
  background: var(--surface);
  border: 1.5px solid var(--border-dark);
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text);
  outline: none;
}}

.form-input:focus {{
  border-color: var(--border-dark);
  box-shadow: 0 0 0 2px var(--hatch-stroke);
}}

.form-textarea {{
  resize: vertical;
}}

.form-row {{
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}}

.form-error {{
  display: block;
  font-size: 11px;
  color: #ff3333;
  margin-top: 4px;
}}

/* File Drop Area */
.file-drop-area {{
  border: 2px dashed var(--border-dark);
  border-radius: var(--radius);
  padding: 24px;
  text-align: center;
  background: var(--surface-subtle);
  cursor: pointer;
  transition: all 0.15s ease;
}}

.file-drop-area:hover {{
  border-color: var(--border-dark);
  background: var(--surface-muted);
}}

.file-drop-lead {{
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}}

.file-browse-link {{
  text-decoration: underline;
  cursor: pointer;
}}

.file-drop-sub {{
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
}}

.file-selected {{
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--surface);
  border: 1px solid var(--border-dark);
  border-radius: var(--radius-sm);
}}

.file-sel-info {{
  display: flex;
  flex-direction: column;
  text-align: left;
}}

.file-sel-name {{
  font-size: 13px;
  font-weight: 600;
}}

.file-sel-size {{
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-mono);
}}

.file-sel-remove {{
  background: none;
  border: none;
  font-size: 12px;
  color: #ff3333;
  cursor: pointer;
  text-decoration: underline;
}}

/* Cover Input Preview */
.cover-input-wrap {{
  display: flex;
  align-items: center;
  gap: 16px;
}}

.cover-preview-box {{
  width: 60px;
  height: 80px;
  border: 1px solid var(--border-dark);
  border-radius: 2px;
  background: var(--surface-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  font-size: 8px;
  text-align: center;
  color: var(--text-muted);
  padding: 4px;
}}

.cover-preview-thumb {{
  width: 100%;
  height: 100%;
  object-fit: cover;
}}

.cover-actions-row {{
  display: flex;
  gap: 8px;
}}

/* Empty State */
.empty-state {{
  text-align: center;
  padding: 64px 20px;
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  background: var(--surface-subtle);
}}

.empty-mark {{
  font-size: 40px;
  color: var(--text-muted);
  margin-bottom: 12px;
}}

.empty-title {{
  font-family: var(--font-sans);
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 6px;
}}

.empty-sub {{
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 20px;
}}

/* Delete Dialog */
.delete-msg {{
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.4;
}}

/* ── Refined Reader Subsystem ── */
{reader_css_clean}

/* ── Responsive Reflow ── */
@media (max-width: 900px) {{
  .dashboard-columns {{
    grid-template-columns: 1fr;
    gap: 32px;
  }}
  .stats-ledger {{
    grid-template-columns: 1fr 1fr;
  }}
  .app-header {{
    padding: 12px 20px;
  }}
  .main {{
    padding: 24px 20px 140px;
  }}
}}

@media (max-width: 600px) {{
  .stats-ledger {{
    grid-template-columns: 1fr;
  }}
  .header-brand .brand-tag {{
    display: none;
  }}
  .bottom-dock {{
    padding: 5px 8px;
  }}
  .dock-tab {{
    padding: 6px 12px;
    font-size: 12px;
  }}
}}
'''

with open(style_path, "w", encoding="utf-8") as f:
    f.write(new_css)

print("style.css updated successfully with reader dock concealment and overflow protections.")
