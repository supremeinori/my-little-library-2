Add-Type -AssemblyName System.Drawing

$srcPath = "src\web\assets\img\logo.png"
$dstPath = "resources\app.ico"

$src = [System.Drawing.Image]::FromFile((Resolve-Path $srcPath))
$sizes = @(16, 24, 32, 48, 64, 128, 256)

$pngStreams = @()

foreach ($sz in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $sz, $sz, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    # Maintain aspect ratio
    $ratio = [Math]::Min($sz / $src.Width, $sz / $src.Height)
    $w = [int]($src.Width * $ratio)
    $h = [int]($src.Height * $ratio)
    $x = [int](($sz - $w) / 2)
    $y = [int](($sz - $h) / 2)

    $g.DrawImage($src, $x, $y, $w, $h)
    $g.Dispose()

    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $pngStreams += ,@($sz, $ms.ToArray())
    $ms.Dispose()
}
$src.Dispose()

# Build ICO binary
$fs = [System.IO.File]::Create((Resolve-Path -Path "resources").Path + "\app.ico")
$bw = New-Object System.IO.BinaryWriter($fs)

# ICONDIR header (6 bytes)
$bw.Write([uint16]0) # Reserved
$bw.Write([uint16]1) # Resource type (1 for icon)
$bw.Write([uint16]$sizes.Count) # Number of images

# Offset calculation: header is 6 bytes + (16 bytes * count)
$offset = 6 + (16 * $sizes.Count)

foreach ($entry in $pngStreams) {
    $sz = $entry[0]
    $data = $entry[1]
    $bWidth = if ($sz -ge 256) { [byte]0 } else { [byte]$sz }
    $bHeight = if ($sz -ge 256) { [byte]0 } else { [byte]$sz }

    $bw.Write([byte]$bWidth) # Width
    $bw.Write([byte]$bHeight) # Height
    $bw.Write([byte]0) # Color count
    $bw.Write([byte]0) # Reserved
    $bw.Write([uint16]1) # Color planes
    $bw.Write([uint16]32) # Bits per pixel
    $bw.Write([uint32]$data.Length) # Size of image data
    $bw.Write([uint32]$offset) # Offset to image data

    $offset += $data.Length
}

foreach ($entry in $pngStreams) {
    $data = $entry[1]
    $bw.Write($data)
}

$bw.Flush()
$bw.Close()
$fs.Close()
Write-Host "Generated $dstPath with $($sizes.Count) sizes successfully."
