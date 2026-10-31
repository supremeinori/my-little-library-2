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

Bundling these libraries locally satisfies NFR-01 and FR-04 by allowing full offline reading without runtime requests to external CDNs.
