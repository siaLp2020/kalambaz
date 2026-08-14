$ErrorActionPreference = 'Stop'

# Build one looping WebP animation for every four-frame gallery entry.
# The existing animal WebP files are the reference: one image element owns
# the animation, so React never replaces two competing slide elements.

$repoRoot = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $repoRoot 'src/gallery-manifest.json'
$publicRoot = Join-Path $repoRoot 'public'
$outputRoot = Join-Path $publicRoot 'images/gallery-animated'
$workRoot = Join-Path $repoRoot '.gallery-build'
$renderRoot = Join-Path $workRoot 'rendered'
$frameRoot = Join-Path $workRoot 'frames'
$runId = [Guid]::NewGuid().ToString('N')
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$ffmpeg = 'C:\Program Files\KMPlayer 64X\LAVFilters64\ffmpeg.exe'

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path -LiteralPath $chrome)) { throw "Chrome was not found at $chrome" }
if (-not (Test-Path -LiteralPath $ffmpeg)) { throw "FFmpeg was not found at $ffmpeg" }

New-Item -ItemType Directory -Force -Path $outputRoot, $renderRoot, $frameRoot | Out-Null
$manifest = Get-Content -Raw -Encoding utf8 -LiteralPath $manifestPath | ConvertFrom-Json
$entries = @()
foreach ($categoryProperty in $manifest.PSObject.Properties) {
  $category = [string]$categoryProperty.Name
  foreach ($itemProperty in $categoryProperty.Value.PSObject.Properties) {
    $images = @($itemProperty.Value.images)
    if ($images.Count -ne 4) { continue }
    $entries += [pscustomobject]@{
      Category = $category
      Name = [string]$itemProperty.Name
      Images = $images
    }
  }
}

# Rasterize the generated SVG fallback frames in batches. A single Chrome
# screenshot can render 100 local SVGs, which is much faster than launching
# one browser process for every frame.
$svgFrames = @()
foreach ($entry in $entries) {
  for ($index = 0; $index -lt 4; $index++) {
    $relative = [string]$entry.Images[$index]
    if ($relative.ToLowerInvariant().EndsWith('.svg')) {
      $svgFrames += [pscustomobject]@{
        Key = "$($entry.Category)/$($entry.Name)/$index"
        Source = Join-Path $publicRoot $relative.TrimStart('/')
      }
    }
  }
}

$rendered = @{}
$batchSize = 100
$columns = 10
$tileWidth = 320
$tileHeight = 240
$batchNumber = 0
for ($offset = 0; $offset -lt $svgFrames.Count; $offset += $batchSize) {
  $batch = @($svgFrames | Select-Object -Skip $offset -First $batchSize)
  $rows = [Math]::Ceiling($batch.Count / [double]$columns)
  $batchRoot = Join-Path $renderRoot ("batch-$batchNumber")
  New-Item -ItemType Directory -Force -Path $batchRoot | Out-Null
  $htmlPath = Join-Path $batchRoot 'index.html'
  $screenshotPath = Join-Path $batchRoot 'sheet.png'
  $html = New-Object System.Text.StringBuilder
  [void]$html.AppendLine('<!doctype html><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#fff;overflow:hidden}#sheet{display:grid;grid-template-columns:repeat(10,320px);width:' + ($columns * $tileWidth) + 'px}img{display:block;width:320px;height:240px;object-fit:cover}</style><div id="sheet">')
  for ($index = 0; $index -lt $batch.Count; $index++) {
    $fileUri = 'file:///' + ([IO.Path]::GetFullPath($batch[$index].Source).Replace('\', '/'))
    [void]$html.AppendLine('<img src="' + $fileUri + '" alt="">')
  }
  [void]$html.AppendLine('</div>')
  [IO.File]::WriteAllText($htmlPath, $html.ToString(), [Text.UTF8Encoding]::new($false))

  $profile = Join-Path $workRoot ("chrome-$runId-$batchNumber")
  $chromeArgs = @(
    '--headless=new', '--disable-gpu', '--no-sandbox', '--disable-extensions',
    '--hide-scrollbars', '--run-all-compositor-stages-before-draw',
    ('--window-size=' + ($columns * $tileWidth) + ',' + ($rows * $tileHeight)),
    ('--user-data-dir=' + $profile),
    ('--screenshot=' + $screenshotPath),
    ('file:///' + ([IO.Path]::GetFullPath($htmlPath).Replace('\', '/')))
  )
  $previousErrorAction = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  & $chrome @chromeArgs 2>&1 | Out-Null
  $ErrorActionPreference = $previousErrorAction
  if (-not (Test-Path -LiteralPath $screenshotPath)) { throw "Chrome did not render $htmlPath" }

  $sheet = [Drawing.Bitmap]::new($screenshotPath)
  try {
    $actualTileWidth = [int][Math]::Floor($sheet.Width / $columns)
    $actualTileHeight = [int][Math]::Floor($sheet.Height / $rows)
    for ($index = 0; $index -lt $batch.Count; $index++) {
      $x = ($index % $columns) * $actualTileWidth
      $y = [int][Math]::Floor($index / $columns) * $actualTileHeight
      $key = $batch[$index].Key
      $keyParts = $key.Split('/')
      $destDir = Join-Path $renderRoot (Join-Path $keyParts[0] $keyParts[1])
      New-Item -ItemType Directory -Force -Path $destDir | Out-Null
      $dest = Join-Path $destDir ($keyParts[2] + '.png')
      $crop = [Drawing.Bitmap]::new($actualTileWidth, $actualTileHeight)
      $graphics = [Drawing.Graphics]::FromImage($crop)
      try {
        $graphics.DrawImage($sheet, (New-Object Drawing.Rectangle(0, 0, $actualTileWidth, $actualTileHeight)), $x, $y, $actualTileWidth, $actualTileHeight, [Drawing.GraphicsUnit]::Pixel)
        $crop.Save($dest, [Drawing.Imaging.ImageFormat]::Png)
      } finally {
        $graphics.Dispose()
        $crop.Dispose()
      }
      $rendered[$key] = $dest
    }
  } finally {
    $sheet.Dispose()
  }
  $batchNumber++
  Write-Host "Rendered SVG batch $batchNumber/$([Math]::Ceiling($svgFrames.Count / [double]$batchSize))"
}

# Normalize each source frame to a numbered PNG sequence, then encode it as
# a four-frame looping WebP. Keeping the output at 360x270 matches the animal
# assets and avoids the browser's per-frame image decoding path.
foreach ($entry in $entries) {
  $itemFrameDir = Join-Path $frameRoot (Join-Path $entry.Category $entry.Name)
  New-Item -ItemType Directory -Force -Path $itemFrameDir | Out-Null
  for ($index = 0; $index -lt 4; $index++) {
    $relative = [string]$entry.Images[$index]
    $key = "$($entry.Category)/$($entry.Name)/$index"
    $source = if ($relative.ToLowerInvariant().EndsWith('.svg')) { $rendered[$key] } else { Join-Path $publicRoot $relative.TrimStart('/') }
    $dest = Join-Path $itemFrameDir (($index + 1).ToString() + '.png')
    $image = [Drawing.Image]::FromFile($source)
    try {
      $bitmap = [Drawing.Bitmap]::new($image.Width, $image.Height)
      $graphics = [Drawing.Graphics]::FromImage($bitmap)
      try {
        $graphics.DrawImageUnscaled($image, 0, 0)
        $bitmap.Save($dest, [Drawing.Imaging.ImageFormat]::Png)
      } finally {
        $graphics.Dispose()
        $bitmap.Dispose()
      }
    } finally {
      $image.Dispose()
    }
  }
  $outputDir = Join-Path $outputRoot $entry.Category
  New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
  $output = Join-Path $outputDir ($entry.Name + '.webp')
  $inputPattern = Join-Path $itemFrameDir '%d.png'
  $ffmpegArgs = @(
    '-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', '1/1.6', '-i', $inputPattern,
    '-vf', 'scale=360:270:force_original_aspect_ratio=decrease,pad=360:270:(ow-iw)/2:(oh-ih)/2:color=white,format=yuv420p',
    '-c:v', 'libwebp', '-lossless', '0', '-q:v', '78', '-loop', '0', '-preset', 'picture', $output
  )
  & $ffmpeg @ffmpegArgs
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $output)) { throw "FFmpeg failed for $($entry.Category)/$($entry.Name)" }
}

Write-Host "Created $($entries.Count) animated gallery WebP files in $outputRoot"
