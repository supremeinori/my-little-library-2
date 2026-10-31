Add-Type -AssemblyName System.Drawing

$bmp = New-Object System.Drawing.Bitmap 256, 256
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

# Background circle
$brushBg = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 30, 41, 59))
$g.FillEllipse($brushBg, 12, 12, 232, 232)

# Book base
$brushBook = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 99, 102, 241))
$g.FillRectangle($brushBook, 55, 65, 146, 126)

# Pages
$brushPages = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 248, 250, 252))
$g.FillRectangle($brushPages, 65, 75, 126, 106)

# Spine & lines
$penLine = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 148, 163, 184)), 4
$g.DrawLine($penLine, 128, 75, 128, 181)
$g.DrawLine($penLine, 75, 100, 118, 100)
$g.DrawLine($penLine, 75, 120, 118, 120)
$g.DrawLine($penLine, 75, 140, 118, 140)
$g.DrawLine($penLine, 138, 100, 181, 100)
$g.DrawLine($penLine, 138, 120, 181, 120)
$g.DrawLine($penLine, 138, 140, 181, 140)

# Bookmark ribbon
$brushRibbon = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 245, 158, 11))
$points = @(
    (New-Object System.Drawing.Point 120, 65),
    (New-Object System.Drawing.Point 136, 65),
    (New-Object System.Drawing.Point 136, 115),
    (New-Object System.Drawing.Point 128, 105),
    (New-Object System.Drawing.Point 120, 115)
)
$g.FillPolygon($brushRibbon, $points)
$g.Flush()

# Save icon
$hIcon = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = New-Object System.IO.FileStream (Join-Path $PSScriptRoot "..\resources\app.ico"), ([System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()
$bmp.Dispose()
Write-Host "Generated resources/app.ico successfully!" -ForegroundColor Green
