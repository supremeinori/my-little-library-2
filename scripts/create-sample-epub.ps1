# scripts/create-sample-epub.ps1
# Creates a minimal valid sample EPUB 3 document for testing purposes.

$ErrorActionPreference = "Stop"
$outDir = Join-Path $PSScriptRoot "..\tests\test-data"
$epubDst = Join-Path $outDir "sample.epub"
$tempDir = Join-Path $env:TEMP "sample_epub_build"

if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
New-Item -ItemType Directory -Path "$tempDir\META-INF" -Force | Out-Null
New-Item -ItemType Directory -Path "$tempDir\OEBPS" -Force | Out-Null

# 1. mimetype (must be uncompressed ASCII)
[System.IO.File]::WriteAllText("$tempDir\mimetype", "application/epub+zip", [System.Text.Encoding]::ASCII)

# 2. container.xml
$containerXml = @"
<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
"@
[System.IO.File]::WriteAllText("$tempDir\META-INF\container.xml", $containerXml, [System.Text.Encoding]::UTF8)

# 3. content.opf
$contentOpf = @"
<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="pub-id" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">urn:uuid:12345678-1234-5678-1234-567812345678</dc:identifier>
    <dc:title>Sample Test Book</dc:title>
    <dc:language>en</dc:language>
    <dc:creator>Little Library Team</dc:creator>
    <meta property="dcterms:modified">2026-10-31T00:00:00Z</meta>
  </metadata>
  <manifest>
    <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="toc" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>
  </manifest>
  <spine>
    <itemref idref="chapter1"/>
  </spine>
</package>
"@
[System.IO.File]::WriteAllText("$tempDir\OEBPS\content.opf", $contentOpf, [System.Text.Encoding]::UTF8)

# 4. chapter1.xhtml
$chapterXhtml = @"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Sample Chapter</title>
  <style>body { font-family: sans-serif; padding: 20px; line-height: 1.6; }</style>
</head>
<body>
  <h1>Chapter 1: The Desktop Journey</h1>
  <p>Welcome to My Little Library — Windows Desktop Edition!</p>
  <p>This is a valid offline test ePub book rendered directly via ePub.js inside WebView2.</p>
</body>
</html>
"@
[System.IO.File]::WriteAllText("$tempDir\OEBPS\chapter1.xhtml", $chapterXhtml, [System.Text.Encoding]::UTF8)

# 5. toc.xhtml
$tocXhtml = @"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>Table of Contents</title></head>
<body>
  <nav epub:type="toc">
    <h1>Contents</h1>
    <ol>
      <li><a href="chapter1.xhtml">Chapter 1</a></li>
    </ol>
  </nav>
</body>
</html>
"@
[System.IO.File]::WriteAllText("$tempDir\OEBPS\toc.xhtml", $tocXhtml, [System.Text.Encoding]::UTF8)

# 6. Package into ZIP and rename to .epub
$zipTemp = Join-Path $env:TEMP "sample_epub_temp.zip"
if (Test-Path $zipTemp) { Remove-Item -Force $zipTemp }
if (Test-Path $epubDst) { Remove-Item -Force $epubDst }
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipTemp -CompressionLevel Optimal
Move-Item -Path $zipTemp -Destination $epubDst -Force
Remove-Item -Recurse -Force $tempDir

Write-Host "Generated valid test EPUB: $epubDst" -ForegroundColor Green
