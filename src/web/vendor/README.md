# Third-Party Vendor Libraries

This directory contains offline bundled JavaScript libraries required by My Little Library desktop edition.

## 1. ePub.js
- **Version:** 0.3.93
- **File:** `epub.min.js`
- **Homepage:** https://github.com/futurepress/epub.js/
- **License:** BSD 2-Clause License
- **Purpose:** Renders EPUB publications directly in the browser/WebView2 using standard web technologies.

## 2. JSZip
- **Version:** 3.1.5
- **File:** `jszip.min.js`
- **Homepage:** https://stuk.github.io/jszip/
- **License:** MIT License / Dual licensed GPLv3
- **Purpose:** Client-side decompression for EPUB archives (required by ePub.js for reading EPUB container structures).

## 3. PDF.js
- **Version:** 3.11.174
- **Files:** `pdf.min.js`, `pdf.worker.min.js`
- **Homepage:** https://mozilla.github.io/pdf.js/
- **License:** Apache License 2.0
- **Purpose:** Offline PDF rendering engine to render pages onto HTML5 canvas with high-DPI scaling.

## 4. PageFlip (StPageFlip)
- **Version:** 2.0.7
- **File:** `page-flip.browser.js`
- **Homepage:** https://nodlik.github.io/StPageFlip/
- **License:** MIT License
- **Purpose:** Realistic 3D physical book turn-page animation with paper curl physics, two-page spreads, and spine shadow.

Bundling these libraries locally satisfies NFR-01 and FR-04 by allowing full offline reading without runtime requests to external CDNs.
